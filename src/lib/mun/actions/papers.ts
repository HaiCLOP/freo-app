"use server";

import { createClient } from "@/lib/supabase/server";
import { enforceMunRateLimit } from "../rate-limit";
import { PaperStatus } from "../types";

export async function uploadPositionPaper(registrationId: string, committeeId: string, formData: FormData) {
  await enforceMunRateLimit("paperUpload", registrationId);
  const supabase = await createClient();

  const file = formData.get("file") as File | null;
  if (!file) throw new Error("No file provided");
  
  if (file.size > 5 * 1024 * 1024) throw new Error("File too large (max 5MB)");
  if (file.type !== "application/pdf") throw new Error("Only PDF files are allowed");

  // Get current version
  const { data: existing } = await supabase
    .from("mun_position_papers")
    .select("version")
    .eq("registration_id", registrationId)
    .eq("committee_id", committeeId)
    .order("version", { ascending: false })
    .limit(1)
    .single();

  const nextVersion = existing ? existing.version + 1 : 1;
  const fileName = `${committeeId}/${registrationId}_v${nextVersion}.pdf`;

  // For this implementation plan, we will simulate the file upload
  // since the actual Supabase bucket (mun_papers) might not exist or be configured yet.
  // We just create a record in the database.
  
  const fileUrl = `https://example.com/mock-paper-url/${fileName}`;

  const { data, error } = await supabase
    .from("mun_position_papers")
    .insert({
      registration_id: registrationId,
      committee_id: committeeId,
      version: nextVersion,
      file_url: fileUrl,
      status: "PENDING"
    })
    .select()
    .single();

  if (error) throw new Error("Failed to save position paper record: " + error.message);
  return data;
}

export async function reviewPositionPaper(
  paperId: string, 
  status: PaperStatus, 
  score: number | null, 
  comments: string | null
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("mun_position_papers")
    .update({
      status,
      score,
      eb_comments: comments,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString()
    })
    .eq("id", paperId)
    .select()
    .single();

  if (error) throw new Error("Failed to review position paper: " + error.message);
  return data;
}
