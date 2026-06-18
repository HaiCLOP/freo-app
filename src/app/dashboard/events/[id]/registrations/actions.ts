"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/email";
import { updateRowStatusInSheet } from "@/lib/google-sheets";
import crypto from "crypto";

export async function updateEventDetails(eventId: string, formData: FormData) {
  const name = formData.get("name") as string;
  const organizer_name = formData.get("organizer_name") as string;
  const venue = formData.get("venue") as string;
  const price = formData.get("price") as string;
  const max_capacity = formData.get("max_capacity") as string;
  const dateStr = formData.get("date") as string;
  const description = formData.get("description") as string;
  
  if (!name || name.trim().length < 2) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const updateData: any = { 
    name: name.trim(),
    organizer_name: organizer_name ? organizer_name.trim() : null
  };

  if (venue) updateData.venue = venue.trim();
  if (price) updateData.price = parseFloat(price);
  if (max_capacity) updateData.max_capacity = parseInt(max_capacity, 10);
  if (dateStr) updateData.date = new Date(dateStr).toISOString();
  if (description) updateData.description = description.trim();

  await supabase
    .from("events")
    .update(updateData)
    .eq("id", eventId)
    .eq("creator_id", user.id);

  revalidatePath(`/dashboard/events/${eventId}/registrations`);
  revalidatePath(`/dashboard`);
}

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
  // Generate a cryptographically secure ticket code
  const ticketCode = `TKT-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;

  // Update status and ticket_code
  const { data: reg, error } = await supabase
    .from("registrations")
    .update({ 
      status: "approved", 
      approved_at: now,
      ticket_code: ticketCode
    })
    .eq("id", registrationId)
    .eq("event_id", eventId)
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
      user.id,
      event.google_sheet_id,
      reg.utr_id || "",
      "Approved",
      formattedApprovedAt,
      reg.email,
      reg.full_name
    );
  }

  // The QR code now ONLY contains the cryptographically secure ticket code.
  // PII is no longer embedded in the QR image nor sent to the third-party generator.
  const qrData = ticketCode;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}&color=DDFE55&bgcolor=1d1d1f`;

  // Sanitize user inputs to prevent HTML injection in emails
  const escapeHTML = (str: string) => str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );

  // Send Approval Email with Digital Ticket
  try {
    await sendEmail({
      from: process.env.RESEND_FROM_EMAIL!,
      to: reg.email,
      subject: `Ticket Approved! - ${escapeHTML(event.name)}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { margin: 0; padding: 0; background-color: #121212; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
            .container { max-width: 600px; margin: 40px auto; background-color: #1d1d1f; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
            .header { background-color: #ddfe55; padding: 40px 20px; text-align: center; }
            .header h1 { margin: 0; color: #1d1d1f; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
            .content { padding: 40px; color: #ffffff; text-align: center; }
            .content p { font-size: 16px; line-height: 1.6; color: #a1a1aa; margin-bottom: 24px; }
            .content strong { color: #ffffff; font-size: 18px; }
            .qr-box { background-color: #2a2b2f; border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; padding: 30px; margin: 30px 0; display: inline-block; }
            .qr-image { width: 250px; height: 250px; border-radius: 12px; margin-bottom: 16px; border: 4px solid #1d1d1f; }
            .footer { padding: 30px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05); }
            .footer p { margin: 0; color: #71717a; font-size: 14px; }
            .brand { color: #ddfe55; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Ticket Approved!</h1>
            </div>
            <div class="content">
              <p>You're all set for <strong>${escapeHTML(event.name)}</strong></p>
              
              <div class="qr-box">
                <p style="margin-top: 0;"><strong>${escapeHTML(reg.full_name)}</strong></p>
                <img src="${qrUrl}" alt="Your Digital Ticket QR Code" class="qr-image" />
                <p style="margin-bottom: 0; font-size: 14px; color: #ddfe55;">Present this QR code at the check-in desk</p>
              </div>
            </div>
            <div class="footer">
              <p>Powered by <span class="brand">Freo</span></p>
            </div>
          </div>
        </body>
        </html>
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
    .eq("event_id", eventId)
    .select("*")
    .single();

  if (error || !reg) {
    console.error("Failed to reject:", error);
    return;
  }

  // Update Google Sheet if enabled
  if (event.google_sheet_id) {
    await updateRowStatusInSheet(
      user.id,
      event.google_sheet_id,
      reg.utr_id || "",
      "Rejected",
      "",
      reg.email,
      reg.full_name
    );
  }

  // Sanitize user inputs to prevent HTML injection in emails
  const escapeHTML = (str: string) => str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );

  // Send Rejection Email
  try {
    await sendEmail({
      from: process.env.RESEND_FROM_EMAIL!,
      to: reg.email,
      subject: `Registration Update - ${escapeHTML(event.name)}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { margin: 0; padding: 0; background-color: #121212; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
            .container { max-width: 600px; margin: 40px auto; background-color: #1d1d1f; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
            .header { background-color: #ff3b30; padding: 40px 20px; text-align: center; }
            .header h1 { margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
            .content { padding: 40px; color: #ffffff; }
            .content p { font-size: 16px; line-height: 1.6; color: #a1a1aa; margin-bottom: 24px; }
            .content strong { color: #ffffff; }
            .status-box { background-color: rgba(255, 59, 48, 0.1); border: 1px solid rgba(255, 59, 48, 0.2); border-radius: 12px; padding: 20px; text-align: center; margin: 30px 0; }
            .status-text { color: #ff3b30; font-weight: 600; font-size: 18px; margin: 0; letter-spacing: 1px; text-transform: uppercase; }
            .footer { padding: 30px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05); }
            .footer p { margin: 0; color: #71717a; font-size: 14px; }
            .brand { color: #ddfe55; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Registration Update</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${escapeHTML(reg.full_name)}</strong>,</p>
              <p>Unfortunately, your registration for <strong>${escapeHTML(event.name)}</strong> could not be approved at this time.</p>
              
              <div class="status-box">
                <p class="status-text">Registration Rejected</p>
              </div>
              
              <p>This is usually because the payment screenshot could not be verified or the UTR ID did not match our records. Please contact the event organizer if you believe this is a mistake and wish to re-register.</p>
            </div>
            <div class="footer">
              <p>Powered by <span class="brand">Freo</span></p>
            </div>
          </div>
        </body>
        </html>
      `
    });
  } catch (emailErr) {
    console.error("Failed to send rejection email:", emailErr);
  }

  revalidatePath(`/dashboard/events/${eventId}/registrations`);
}

export async function replyToSurveyRegistration(registrationId: string, eventId: string, formData: FormData) {
  const customMessage = formData.get("custom_message") as string;
  if (!customMessage || customMessage.trim().length === 0) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // Verify ownership
  const { data: event } = await supabase
    .from("events")
    .select("creator_id, name, google_sheet_id, form_type")
    .eq("id", eventId)
    .single();

  if (event?.creator_id !== user.id) throw new Error("Unauthorized");

  const now = new Date().toISOString();

  // Update status
  const { data: reg, error } = await supabase
    .from("registrations")
    .update({ 
      status: "approved", // Mark as approved internally to maintain stats
      approved_at: now
    })
    .eq("id", registrationId)
    .eq("event_id", eventId)
    .select("*")
    .single();

  if (error || !reg) {
    console.error("Failed to reply:", error);
    return;
  }

  // Update Google Sheet if enabled
  if (event.google_sheet_id) {
    const formattedApprovedAt = new Date(now).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    await updateRowStatusInSheet(
      user.id,
      event.google_sheet_id,
      reg.utr_id || "",
      "Replied",
      formattedApprovedAt,
      reg.email,
      reg.full_name
    );
  }

  // Sanitize user inputs to prevent HTML injection in emails
  const escapeHTML = (str: string) => str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
  
  // Format the custom message keeping line breaks
  const formattedMessage = escapeHTML(customMessage).replace(/\n/g, '<br>');

  // Send Reply Email
  try {
    await sendEmail({
      from: process.env.RESEND_FROM_EMAIL!,
      to: reg.email,
      subject: `Response Received - ${escapeHTML(event.name)}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { margin: 0; padding: 0; background-color: #121212; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
            .container { max-width: 600px; margin: 40px auto; background-color: #1d1d1f; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
            .header { background-color: #ddfe55; padding: 40px 20px; text-align: center; }
            .header h1 { margin: 0; color: #1d1d1f; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
            .content { padding: 40px; color: #ffffff; }
            .content p { font-size: 16px; line-height: 1.6; color: #a1a1aa; margin-bottom: 24px; }
            .content strong { color: #ffffff; }
            .message-box { background-color: #2a2b2f; border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 24px; margin: 30px 0; color: #e4e4e7; line-height: 1.6; }
            .footer { padding: 30px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05); }
            .footer p { margin: 0; color: #71717a; font-size: 14px; }
            .brand { color: #ddfe55; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
               <h1>Response from ${escapeHTML(event.name)}</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${escapeHTML(reg.full_name)}</strong>,</p>
              <p>The organizer has reviewed your submission and sent you the following message:</p>
              
              <div class="message-box">
                ${formattedMessage}
              </div>
            </div>
            <div class="footer">
              <p>Powered by <span class="brand">Freo</span></p>
            </div>
          </div>
        </body>
        </html>
      `
    });
  } catch (emailErr) {
    console.error("Failed to send survey reply email:", emailErr);
  }

  revalidatePath(`/dashboard/events/${eventId}/registrations`);
}
