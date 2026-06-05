"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { appendRowToSheet } from "@/lib/google-sheets";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function submitRegistration(eventId: string, eventSlug: string, formData: FormData) {
  const supabase = await createClient();

  // 1. Get Event Data for sheet ID and creator details
  const { data: event } = await supabase
    .from("events")
    .select("*, creators(notification_email, name)")
    .eq("id", eventId)
    .single();

  if (!event) throw new Error("Event not found");

  // 2. Extract Core Fields
  const full_name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const herbalife_id = formData.get("herbalife_id") as string || null;
  const sponsor_name = formData.get("sponsor") as string || null;
  const utr_id = formData.get("utr_id") as string;
  
  // 3. Handle File Uploads (Screenshot)
  const screenshot = formData.get("payment_screenshot") as File;
  let payment_screenshot_url = null;
  
  if (screenshot && screenshot.size > 0) {
    const ext = screenshot.name.split('.').pop();
    const fileName = `${event.id}/${Date.now()}-payment.${ext}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("payment-screenshots")
      .upload(fileName, screenshot);
      
    if (uploadError) {
      console.error("Screenshot upload failed", uploadError);
      throw new Error("Failed to upload screenshot");
    }
    
    payment_screenshot_url = uploadData.path; // Keep path because it's a private bucket
  }

  // 4. Extract Custom Fields
  const custom_fields: Record<string, any> = {};
  const formConfig: any[] = event.form_config || [];
  
  for (const field of formConfig) {
    if (["name", "phone", "email", "herbalife_id", "sponsor"].includes(field.id)) continue;
    
    if (field.type === "file") {
      const file = formData.get(field.id) as File;
      if (file && file.size > 0) {
        // Upload custom file to a public bucket or private (using payment-screenshots for simplicity or create a new one)
        // Since we don't have a custom-files bucket, we'll put it in payment-screenshots for security
        const ext = file.name.split('.').pop();
        const fileName = `${event.id}/${Date.now()}-${field.id}.${ext}`;
        const { data } = await supabase.storage.from("payment-screenshots").upload(fileName, file);
        if (data) custom_fields[field.id] = data.path;
      }
    } else if (field.type === "checkbox") {
      custom_fields[field.id] = formData.get(field.id) === "on";
    } else {
      custom_fields[field.id] = formData.get(field.id) as string;
    }
  }

  // 5. Insert Registration
  const { error: insertError } = await supabase
    .from("registrations")
    .insert({
      event_id: eventId,
      full_name,
      phone,
      email,
      herbalife_id,
      sponsor_name,
      utr_id,
      payment_screenshot_url,
      custom_fields,
      status: 'pending'
    });

  if (insertError) {
    console.error("Failed to insert registration", insertError);
    redirect(`/e/${eventSlug}?error=submission_failed`);
  }

  // 6. Append to Google Sheet
  if (event.google_sheet_id) {
    const registeredAt = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    
    // Generate a 7-day signed URL for the spreadsheet so the creator can click and view it
    let publicScreenshotUrl = "No Image";
    if (payment_screenshot_url) {
      const { data: signedData } = await supabase.storage
        .from("payment-screenshots")
        .createSignedUrl(payment_screenshot_url, 60 * 60 * 24 * 7); // 7 days
      
      const url = signedData?.signedUrl || payment_screenshot_url;
      // Use HYPERLINK and IMAGE formula so Google Sheets displays it as a thumbnail and makes it clickable
      publicScreenshotUrl = `=HYPERLINK("${url}", IMAGE("${url}"))`; 
    }

    const sheetRow = [
      full_name,
      phone,
      email,
      herbalife_id || "",
      sponsor_name || "",
      utr_id,
      "Pending",
      registeredAt,
      "", // Approved At is empty for now
      publicScreenshotUrl
    ];
    await appendRowToSheet(event.google_sheet_id, sheetRow);
  }

  // 7. Send "Registration Received" Email to Attendee
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: email,
      subject: `Registration Received - ${event.name}`,
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
            .status-box { background-color: rgba(221, 254, 85, 0.1); border: 1px solid rgba(221, 254, 85, 0.2); border-radius: 12px; padding: 20px; text-align: center; margin: 30px 0; }
            .status-text { color: #ddfe55; font-weight: 600; font-size: 18px; margin: 0; letter-spacing: 1px; text-transform: uppercase; }
            .footer { padding: 30px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05); }
            .footer p { margin: 0; color: #71717a; font-size: 14px; }
            .brand { color: #ddfe55; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Registration Received!</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${full_name}</strong>,</p>
              <p>We've successfully received your registration and payment details for <strong>${event.name}</strong>.</p>
              
              <div class="status-box">
                <p class="status-text">Pending Approval</p>
              </div>
              
              <p>Your registration is currently under review by the event organizer. Once your payment is verified and approved, you will receive another email containing your official digital ticket and QR code.</p>
            </div>
            <div class="footer">
              <p>Powered by <span class="brand">Freo</span></p>
            </div>
          </div>
        </body>
        </html>
      `
    });
  } catch (emailError) {
    console.error("Failed to send attendee email", emailError);
  }

  // 8. Redirect to success
  redirect(`/e/${eventSlug}?success=true`);
}
