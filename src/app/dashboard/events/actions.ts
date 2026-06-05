"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import slugify from "slugify";
import { revalidatePath } from "next/cache";
import { initializeGoogleSheet } from "@/lib/google-sheets";

export async function createEvent(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const dateStr = formData.get("date") as string;
  const venue = formData.get("venue") as string;
  const price = parseFloat(formData.get("price") as string);
  const max_capacity = parseInt(formData.get("max_capacity") as string, 10);
  const upi_id = formData.get("upi_id") as string;
  
  const bannerFile = formData.get("banner") as File;
  const upiQrFile = formData.get("upi_qr") as File;

  // 1. Generate Slug
  const baseSlug = slugify(name, { lower: true, strict: true });
  const uniqueId = Math.random().toString(36).substring(2, 6);
  const slug = `${baseSlug}-${uniqueId}`;

  // 2. Upload Images
  let banner_url = "";
  if (bannerFile && bannerFile.size > 0) {
    const bannerExt = bannerFile.name.split('.').pop();
    const bannerName = `${slug}-banner.${bannerExt}`;
    const { data: bannerData, error: bannerError } = await supabase.storage
      .from("event-banners")
      .upload(bannerName, bannerFile);
    
    if (bannerError) throw new Error("Failed to upload banner: " + bannerError.message);
    
    const { data: pubData } = supabase.storage.from("event-banners").getPublicUrl(bannerData.path);
    banner_url = pubData.publicUrl;
  }

  let upi_qr_url = "";
  if (upiQrFile && upiQrFile.size > 0) {
    const qrExt = upiQrFile.name.split('.').pop();
    const qrName = `${slug}-qr.${qrExt}`;
    const { data: qrData, error: qrError } = await supabase.storage
      .from("upi-qr-codes")
      .upload(qrName, upiQrFile);
    
    if (qrError) throw new Error("Failed to upload UPI QR: " + qrError.message);
    
    const { data: pubData } = supabase.storage.from("upi-qr-codes").getPublicUrl(qrData.path);
    upi_qr_url = pubData.publicUrl;
  }

  // Extract Google Sheet ID from URL
  const googleSheetUrl = formData.get("google_sheet_url") as string;
  let google_sheet_id = null;
  
  if (googleSheetUrl) {
    // Matches https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit...
    const match = googleSheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      google_sheet_id = match[1];
      // Format the sheet with headers
      await initializeGoogleSheet(google_sheet_id);
    }
  }

  // 4. Insert Event
  const { data: event, error: insertError } = await supabase
    .from("events")
    .insert({
      creator_id: user.id,
      name,
      slug,
      description,
      banner_url,
      date: new Date(dateStr).toISOString(),
      venue,
      price,
      max_capacity,
      upi_qr_url,
      upi_id,
      google_sheet_id,
      is_active: true
    })
    .select("id")
    .single();

  if (insertError || !event) {
    console.error("Failed to insert event", insertError);
    redirect(`/dashboard/events/new?error=db_error`);
  }

  redirect(`/dashboard/events/${event.id}/form-builder`);
}

export async function deleteEvent(eventId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Optional: You could also delete the associated Google Sheet here if you saved the ID, 
  // and delete the images from storage if you want to clean up.
  // For now, we rely on Supabase cascading deletes for registrations.

  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", eventId)
    .eq("creator_id", user.id);

  if (error) {
    console.error("Failed to delete event:", error);
    return { error: "Failed to delete event." };
  }

  revalidatePath("/dashboard/events");
}
