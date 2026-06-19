import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncSheetHeaders } from "@/lib/google-sheets";
import { google } from "googleapis";

/**
 * POST /api/cron/rebuild-sheet
 * 
 * Rebuilds a Google Sheet for a given event, re-syncing headers
 * and re-writing all registration data with correct column mapping.
 * 
 * Body: { eventId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { eventId } = body;

    if (!eventId) {
      return NextResponse.json({ error: "eventId required" }, { status: 400 });
    }

    // Fetch event
    const { data: event } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .eq("creator_id", user.id)
      .single();

    if (!event || !event.google_sheet_id) {
      return NextResponse.json({ error: "Event not found or no sheet connected" }, { status: 404 });
    }

    const formConfig = event.form_config || [];
    const formType = event.form_type || "event";

    // Get creator tokens
    const { data: creator } = await supabase
      .from("creators")
      .select("google_access_token, google_refresh_token")
      .eq("id", user.id)
      .single();

    if (!creator?.google_access_token) {
      return NextResponse.json({ error: "Google account not connected. Please reconnect in Settings." }, { status: 400 });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({
      access_token: creator.google_access_token,
      refresh_token: creator.google_refresh_token,
    });

    // Auto-refresh tokens and save back to DB
    oauth2Client.on("tokens", async (tokens) => {
      if (tokens.access_token) {
        const sb = await createClient();
        await sb.from("creators").update({
          google_access_token: tokens.access_token,
          google_refresh_token: tokens.refresh_token || creator.google_refresh_token,
          google_token_updated_at: new Date().toISOString(),
        }).eq("id", user.id);
      }
    });

    const sheets = google.sheets({ version: "v4", auth: oauth2Client });

    // 1. Build correct headers
    const headers: string[] = ["Name", "Phone", "Email"];
    if (formType !== "survey") headers.push("UTR ID");
    headers.push("Status", "Registered At", "Approved At");
    if (formType !== "survey") headers.push("Payment Screenshot URL");

    if (formConfig && Array.isArray(formConfig)) {
      for (const field of formConfig) {
        if (["name", "phone", "email"].includes(field.id)) continue;
        if (["section_divider", "page_break", "hyperlink"].includes(field.type)) continue;
        headers.push(field.label || field.id);
      }
    }

    // 2. Fetch all registrations
    const { data: registrations } = await supabase
      .from("registrations")
      .select("*")
      .eq("event_id", eventId)
      .order("registered_at", { ascending: true });

    if (!registrations || registrations.length === 0) {
      return NextResponse.json({ message: "No registrations to sync", headers });
    }

    // 3. Build all rows
    const allRows: any[][] = [];
    for (const reg of registrations) {
      const customFields =
        typeof reg.custom_fields === "string"
          ? JSON.parse(reg.custom_fields)
          : reg.custom_fields || {};

      const rowData: Record<string, any> = {
        Name: reg.full_name,
        Phone: reg.phone,
        Email: reg.email,
        Status: reg.status === "approved" && formType === "survey" ? "Replied" : reg.status,
        "Registered At": new Date(reg.registered_at).toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        }),
        "Approved At": reg.approved_at
          ? new Date(reg.approved_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
          : "",
      };

      if (formType !== "survey") {
        rowData["UTR ID"] = reg.utr_id || "";
        rowData["Payment Screenshot URL"] = reg.payment_screenshot_url || "";
      }

      // Map custom fields
      for (const field of formConfig) {
        if (["name", "phone", "email"].includes(field.id)) continue;
        if (["section_divider", "page_break", "hyperlink"].includes(field.type)) continue;

        const label = field.label || field.id;
        let val = customFields[field.id];

        if (val === undefined || val === null) {
          rowData[label] = "";
        } else if ((field.type === "file" || field.type === "file_upload") && val) {
          const fileUrl = `https://freo-events.vercel.app/api/storage/proxy?path=${encodeURIComponent(val)}`;
          rowData[label] = `=HYPERLINK("${fileUrl}", "View File")`;
        } else if (typeof val === "boolean") {
          rowData[label] = val ? "Yes" : "No";
        } else if (typeof val === "object") {
          rowData[label] = JSON.stringify(val);
        } else {
          rowData[label] = String(val);
        }
      }

      const row = headers.map((h: string) => {
        const v = rowData[h];
        return v !== undefined && v !== null ? v : "";
      });
      allRows.push(row);
    }

    // 4. Clear the entire sheet
    await sheets.spreadsheets.values.clear({
      spreadsheetId: event.google_sheet_id,
      range: "Registrations!A:Z",
    });

    // 5. Write headers + all rows
    await sheets.spreadsheets.values.update({
      spreadsheetId: event.google_sheet_id,
      range: "Registrations!A1",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [headers, ...allRows] },
    });

    return NextResponse.json({
      message: `Sheet rebuilt successfully. ${allRows.length} rows written.`,
      headers,
      rowCount: allRows.length,
    });
  } catch (error: any) {
    console.error("Rebuild sheet error:", error);
    return NextResponse.json({
      error: "Failed to rebuild sheet",
      details: error.message || String(error),
    }, { status: 500 });
  }
}
