"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import slugify from "slugify";
import { revalidatePath } from "next/cache";
import { autoCreateSheet } from "@/lib/google-sheets";
import { uploadFile } from "@/lib/storage";
import { z } from "zod";
import crypto from "crypto";

const createEventSchema = z.object({
  name: z.string().min(3).max(150),
  description: z.string().max(5000),
  dateStr: z.string().optional(),
  venue: z.string().max(255).optional(),
  price: z.number().min(0).max(1000000).optional(),
  max_capacity: z.number().min(1).max(100000).optional(),
  upi_id: z.string().max(100).regex(/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/, "Invalid UPI format").optional().or(z.literal('')),
  phase_registration: z.boolean(),
  form_type: z.enum(['event', 'survey']).default('event'),
  payment_type: z.enum(['paid', 'free']).default('paid'),
});

export async function createEvent(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const formType = (formData.get("form_type") as string) || "event";
  const paymentType = (formData.get("payment_type") as string) || "paid";

  const isSurvey = formType === 'survey';
  const isFree = paymentType === 'free' || isSurvey;

  const rawData = {
    name: formData.get("name") as string,
    description: formData.get("description") as string,
    dateStr: isSurvey ? new Date().toISOString() : (formData.get("date") as string),
    venue: isSurvey ? "Online Survey" : (formData.get("venue") as string),
    price: isFree ? 0 : parseFloat(formData.get("price") as string),
    max_capacity: isSurvey ? 100000 : parseInt(formData.get("max_capacity") as string, 10),
    upi_id: isFree ? "" : (formData.get("upi_id") as string),
    phase_registration: isSurvey ? false : formData.get("phase_registration") === "on",
    form_type: formType,
    payment_type: paymentType,
  };

  const validation = createEventSchema.safeParse(rawData);
  if (!validation.success) {
    console.error("Invalid event data:", validation.error.flatten());
    redirect(`/dashboard/events/new?error=invalid_data`);
  }

  const { name, description, dateStr, venue, price, max_capacity, upi_id, phase_registration, form_type } = validation.data;
  const daily_reg_limit = phase_registration ? 100 : max_capacity;
  
  const bannerFile = formData.get("banner") as File;
  const upiQrFile = formData.get("upi_qr") as File;

  // Validate File Types (Security: Prevent malicious file uploads)
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (bannerFile && bannerFile.size > 0 && !allowedImageTypes.includes(bannerFile.type)) {
    throw new Error("Invalid banner file type. Only images are allowed.");
  }
  if (upiQrFile && upiQrFile.size > 0 && !allowedImageTypes.includes(upiQrFile.type)) {
    throw new Error("Invalid UPI QR file type. Only images are allowed.");
  }

  // 1. Generate Slug securely
  const baseSlug = slugify(name, { lower: true, strict: true });
  const uniqueId = crypto.randomBytes(4).toString("hex");
  const slug = `${baseSlug}-${uniqueId}`;

  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif'
  };

  // 2. Upload Images → Google Drive or Supabase Storage (auto-detected)
  let banner_url = "";
  if (bannerFile && bannerFile.size > 0) {
    const bannerExt = mimeToExt[bannerFile.type] || 'bin';
    try {
      banner_url = await uploadFile(user.id, slug, "banner", `banner.${bannerExt}`, bannerFile, true);
    } catch (error) {
      console.error("Banner upload error:", error);
      throw new Error("Failed to upload banner. Please try again.");
    }
  }

  let upi_qr_url = "";
  if (upiQrFile && upiQrFile.size > 0) {
    const qrExt = mimeToExt[upiQrFile.type] || 'bin';
    try {
      upi_qr_url = await uploadFile(user.id, slug, "upi-qr", `upi-qr.${qrExt}`, upiQrFile, true);
    } catch (error) {
      console.error("UPI QR upload error:", error);
      throw new Error("Failed to upload UPI QR. Please try again.");
    }
  }

  // 3. Auto-create Google Sheet in creator's account
  let google_sheet_id = null;
  try {
    // Check if creator has Google connected
    const { data: creator } = await supabase
      .from("creators")
      .select("google_access_token, google_drive_folder_id")
      .eq("id", user.id)
      .single();

    if (creator?.google_access_token) {
      google_sheet_id = await autoCreateSheet(
        user.id,
        name,
        form_type as 'event' | 'survey',
        creator.google_drive_folder_id || undefined
      );
    }
  } catch (error) {
    console.error("Failed to auto-create Google Sheet:", error);
    // Non-critical — event still works without a sheet
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
      date: new Date(dateStr!).toISOString(),
      venue,
      price,
      max_capacity,
      upi_qr_url,
      upi_id,
      google_sheet_id,
      is_active: true,
      phase_registration,
      daily_reg_limit,
      form_type,
    })
    .select("id")
    .single();

  if (insertError || !event) {
    console.error("Failed to insert event:", insertError?.message, insertError?.code, insertError?.details);
    redirect(`/dashboard/events/new?error=failed_to_create_event`);
  }

  redirect(`/dashboard/events/${event.id}/form-builder`);
}

export async function deleteEvent(eventId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Delete the event atomically. 
  // Postgres ON DELETE CASCADE will handle all associated registrations securely.
  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", eventId)
    .eq("creator_id", user.id);

  if (error) {
    console.error("Failed to delete event:", error.message, error.code);
    return { error: "Failed to delete event. Please try again later." };
  }

  revalidatePath("/dashboard/events");
}
