import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { appendRowToSheet } from "@/lib/google-sheets";

/**
 * Cron endpoint to process queued Google Sheets writes.
 * 
 * Runs every 5 minutes via Vercel Cron. Processes up to 50 pending
 * rows per invocation to stay within Google Sheets API rate limits.
 * 
 * Now resolves the creator's OAuth tokens for each sheet write.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch candidate pending items
  const { data: candidates, error: fetchError } = await supabase
    .from("sheet_queue")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(50);

  if (fetchError) {
    console.error("Failed to fetch sheet queue:", fetchError);
    return NextResponse.json({ error: "DB fetch failed" }, { status: 500 });
  }

  if (!candidates || candidates.length === 0) {
    return NextResponse.json({ message: "No pending items", processed: 0 });
  }

  let successCount = 0;
  let failCount = 0;

  for (const item of candidates) {
    // 1. Atomically claim the row to prevent duplicate processing (Race Condition Mitigation)
    const { data: claimed, error: claimError } = await supabase
      .from("sheet_queue")
      .update({ status: "processing" })
      .eq("id", item.id)
      .eq("status", "pending") // Only update if still pending
      .select()
      .maybeSingle();

    if (!claimed || claimError) {
      continue; // Item was processed by a concurrent run
    }

    try {
      // Resolve creator_id from the event that owns this sheet
      const creatorId = claimed.creator_id || await resolveCreatorId(supabase, claimed.sheet_id);

      await appendRowToSheet(creatorId, claimed.sheet_id, claimed.row_data);
      
      await supabase
        .from("sheet_queue")
        .update({ status: "done", processed_at: new Date().toISOString() })
        .eq("id", claimed.id);
        
      successCount++;
    } catch (error) {
      console.error(`Failed to process queue item ${claimed.id}:`, error);
      await supabase
        .from("sheet_queue")
        .update({
          status: "failed",
          error_message: error instanceof Error ? error.message : "Unknown error",
          processed_at: new Date().toISOString(),
        })
        .eq("id", claimed.id);
      failCount++;
    }
  }

  return NextResponse.json({
    processed: successCount + failCount,
    success: successCount,
    failed: failCount,
  });
}

/**
 * Resolve which creator owns a given Google Sheet.
 */
async function resolveCreatorId(supabase: any, sheetId: string): Promise<string> {
  const { data: event } = await supabase
    .from("events")
    .select("creator_id")
    .eq("google_sheet_id", sheetId)
    .single();

  if (!event) throw new Error(`No event found for sheet ${sheetId}`);
  return event.creator_id;
}
