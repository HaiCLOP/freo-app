"use server";

import { createClient } from "@/lib/supabase/server";
import { enforceMunRateLimit } from "../rate-limit";
import { PaperStatus } from "../types";
import { sendEmail } from "@/lib/email";

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

  const { data: uploadData, error: uploadError } = await supabase
    .storage
    .from("mun_papers")
    .upload(fileName, file);

  if (uploadError) {
    throw new Error(`Failed to upload paper: ${uploadError.message}`);
  }

  // We store the path in file_url. The UI will request signed URLs to view it.
  const fileUrl = fileName;

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

  if (error) {
    await supabase.storage.from("mun_papers").remove([fileName]);
    throw new Error("Failed to save position paper record: " + error.message);
  }
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
    .select(`
      *,
      registration:mun_registrations(delegate_email, delegate_name, conference_id),
      committee:mun_committees(name, conference_id:mun_conferences(name))
    `)
    .single();

  if (error) throw new Error("Failed to review position paper: " + error.message);

  // Send email if revision requested
  if (status === "REVISION_REQUESTED" && data?.registration) {
    // Need to assert types since we used joined select
    const reg = data.registration as any;
    const comm = data.committee as any;
    const confName = comm?.conference_id?.name || "Conference";
    
    await sendEmail({
      to: reg.delegate_email,
      subject: `Position Paper Revision Required — ${confName}`,
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Revision Required</h2>
          <p>Hi <strong>${reg.delegate_name}</strong>,</p>
          <p>The Executive Board has reviewed your position paper for <strong>${comm?.name}</strong> and requested revisions.</p>
          ${comments ? `<div style="background: #f9fafb; padding: 16px; border-left: 4px solid #F59E0B; margin: 16px 0;"><strong>EB Feedback:</strong><br/>${comments}</div>` : ""}
          <p>Please log in to your portal, make the necessary changes, and upload the revised version (v${data.version + 1}).</p>
        </div>
      `,
      from: `Freo MUN <noreply@freo.haicloplabs.in>`,
    });
  }

  return data;
}
