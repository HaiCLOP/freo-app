"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { updateRowStatusInSheet } from "@/lib/google-sheets";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function approveRegistration(registrationId: string, eventId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // Verify ownership
  const { data: event } = await supabase
    .from("events")
    .select("creator_id, name, google_sheet_id")
    .eq("id", eventId)
    .single();

  if (event?.creator_id !== user.id) throw new Error("Unauthorized");

  const now = new Date().toISOString();
  // Generate a unique ticket code
  const ticketCode = `TKT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

  // Update status and ticket_code
  const { data: reg, error } = await supabase
    .from("registrations")
    .update({ 
      status: "approved", 
      approved_at: now,
      ticket_code: ticketCode
    })
    .eq("id", registrationId)
    .select("*")
    .single();

  if (error || !reg) {
    console.error("Failed to approve:", error);
    return;
  }

  // Update Google Sheet if enabled
  if (event.google_sheet_id) {
    const formattedApprovedAt = new Date(now).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    await updateRowStatusInSheet(
      event.google_sheet_id,
      reg.utr_id || "",
      "Approved",
      formattedApprovedAt,
      reg.email,
      reg.full_name
    );
  }

  // Generate QR Code data holding user info for the scanner phone app
  const qrData = JSON.stringify({
    ticketCode: ticketCode,
    name: reg.full_name,
    email: reg.email,
    phone: reg.phone,
    herbalifeId: reg.herbalife_id || "",
    sponsorName: reg.sponsor_name || "",
    eventName: event.name
  });
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}&color=6C63FF`;

  // Send Approval Email with Digital Ticket
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: reg.email,
      subject: `Ticket Approved! 🎟️ - ${event.name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #6C63FF; margin: 0;">Ticket Approved!</h1>
            <p style="color: #666;">You're all set for ${event.name}</p>
          </div>
          
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; text-align: center;">
            <p style="margin: 0 0 16px 0; font-size: 16px; color: #333;"><strong>${reg.full_name}</strong></p>
            <img src="${qrUrl}" alt="Your Digital Ticket QR Code" style="width: 250px; height: 250px; border-radius: 8px; margin-bottom: 16px;" />
            <p style="margin: 0; color: #64748b; font-size: 14px;">Please present this QR code at the check-in desk.</p>
          </div>
        </div>
      `
    });
  } catch (emailErr) {
    console.error("Failed to send approval email:", emailErr);
  }

  revalidatePath(`/dashboard/events/${eventId}/registrations`);
}

export async function rejectRegistration(registrationId: string, eventId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // Verify ownership
  const { data: event } = await supabase
    .from("events")
    .select("creator_id, name, google_sheet_id")
    .eq("id", eventId)
    .single();

  if (event?.creator_id !== user.id) throw new Error("Unauthorized");

  // Update status
  const { data: reg, error } = await supabase
    .from("registrations")
    .update({ status: "rejected" })
    .eq("id", registrationId)
    .select("*")
    .single();

  if (error || !reg) {
    console.error("Failed to reject:", error);
    return;
  }

  // Update Google Sheet if enabled
  if (event.google_sheet_id) {
    await updateRowStatusInSheet(
      event.google_sheet_id,
      reg.utr_id || "",
      "Rejected",
      "",
      reg.email,
      reg.full_name
    );
  }

  // Send Rejection Email
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: reg.email,
      subject: `Registration Update - ${event.name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #ef4444;">Registration Update</h2>
          <p>Hi ${reg.full_name},</p>
          <p>Unfortunately, your registration for <strong>${event.name}</strong> could not be approved at this time.</p>
          <p>This is usually because the payment screenshot could not be verified or the UTR ID did not match our records.</p>
          <p>Please contact the event organizer if you believe this is a mistake.</p>
        </div>
      `
    });
  } catch (emailErr) {
    console.error("Failed to send rejection email:", emailErr);
  }

  revalidatePath(`/dashboard/events/${eventId}/registrations`);
}
