"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { uploadFile, getFileUrl } from "@/lib/storage";
import { sendEmail } from "@/lib/email";
import { z } from "zod";
import { headers } from "next/headers";
import { rateLimit } from "@/lib/rate-limit";

const registrationSchema = z.object({
  name: z.string().min(2, "Name is too short").max(100, "Name is too long"),
  phone: z.string().min(10, "Phone is too short").max(20, "Phone is too long").regex(/^[0-9+\-\s()]+$/, "Invalid phone format"),
  email: z.string().email("Invalid email format").max(255, "Email is too long"),
  utr_id: z.string().min(4, "UTR is too short").max(50, "UTR is too long"),
});

// We now use the centralized Upstash Redis rate limiter imported above.

export async function submitRegistration(eventId: string, eventSlug: string, formData: FormData) {
  // Rate Limiting Check
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") || "unknown";
  
  if (ip !== "unknown") {
    const { allowed } = await rateLimit(`submit_${ip}`, 5, 60_000); // 5 attempts per minute
    if (!allowed) {
      console.warn(`Rate limit exceeded for IP: ${ip}`);
      redirect(`/e/${eventSlug}?error=rate_limited`);
    }
  }

  const supabase = await createClient();

  // 1. Get Event Data for sheet ID and creator details
  const { data: event } = await supabase
    .from("events")
    .select("*, creators(notification_email, name)")
    .eq("id", eventId)
    .eq("is_active", true)
    .single();

  if (!event) throw new Error("Event not found");

  // 1b. Enforce capacity + phase-wise daily limit (server-side guard)
  const { count: totalRegs } = await supabase
    .from("registrations")
    .select("*", { count: 'exact', head: true })
    .eq("event_id", eventId)
    .neq("status", "rejected");

  if ((totalRegs || 0) >= event.max_capacity) {
    if (!event.form_settings?.waitlistEnabled) {
      redirect(`/e/${eventSlug}?error=sold_out`);
    }
  }

  if (event.phase_registration) {
    // Calculate today's start and end boundaries in IST (Asia/Kolkata)
    const nowStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const istNow = new Date(nowStr);
    
    // Create Date objects representing 00:00:00 and 23:59:59 in IST
    const todayStart = new Date(istNow.getFullYear(), istNow.getMonth(), istNow.getDate(), 0, 0, 0);
    const todayEnd = new Date(istNow.getFullYear(), istNow.getMonth(), istNow.getDate(), 23, 59, 59, 999);

    const { count: todayRegs } = await supabase
      .from("registrations")
      .select("*", { count: 'exact', head: true })
      .eq("event_id", eventId)
      .neq("status", "rejected")
      .neq("status", "waitlisted") // Do not count waitlisted towards daily limit
      .gte("registered_at", todayStart.toISOString())
      .lte("registered_at", todayEnd.toISOString());

    if ((todayRegs || 0) >= (event.daily_reg_limit || 100)) {
      redirect(`/e/${eventSlug}?error=daily_limit`);
    }
  }

  // 2. Extract Core Fields
  const rawData = {
    name: formData.get("name") as string,
    phone: formData.get("phone") as string,
    email: formData.get("email") as string,
    utr_id: formData.get("utr_id") as string,
  };

  const validationResult = registrationSchema.safeParse(rawData);
  if (!validationResult.success) {
    console.error("Validation failed:", validationResult.error.flatten());
    redirect(`/e/${eventSlug}?error=invalid_data`);
  }

  const { name: full_name, phone, email, utr_id } = validationResult.data;
  
  // 3. Handle File Uploads → Google Drive or Supabase Storage (auto-detected)
  const screenshot = formData.get("payment_screenshot") as File;
  let payment_screenshot_url = null;
  
  if (screenshot && screenshot.size > 0) {
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedImageTypes.includes(screenshot.type)) {
      redirect(`/e/${eventSlug}?error=invalid_file_type`);
    }

    const mimeToExt: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif'
    };

    const ext = mimeToExt[screenshot.type] || 'bin';
    try {
      payment_screenshot_url = await uploadFile(
        event.creator_id, eventSlug, "payment-screenshots",
        `${Date.now()}-payment.${ext}`, screenshot, false
      );
    } catch (uploadError: any) {
      console.error("Screenshot upload failed", uploadError);
      throw new Error(uploadError?.message || "Failed to upload screenshot");
    }
  }

  // 4. Extract Custom Fields
  const custom_fields: Record<string, any> = {};
  const formConfig: any[] = event.form_config || [];
  
  for (const field of formConfig) {
    if (["name", "phone", "email"].includes(field.id)) continue;
    
    if (field.type === "file" || field.type === "file_upload") {
      const file = formData.get(field.id) as File;
      if (file && file.size > 0) {
        // Enforce strict MIME types for custom file uploads
        const allowedTypes: Record<string, string> = {
          'image/jpeg': 'jpg',
          'image/png': 'png',
          'image/webp': 'webp',
          'application/pdf': 'pdf'
        };

        if (!allowedTypes[file.type]) {
          redirect(`/e/${eventSlug}?error=invalid_file_type`);
        }

        // Force extension based on MIME type to prevent extension spoofing
        const ext = allowedTypes[file.type];
        
        try {
          const uploadedRef = await uploadFile(
            event.creator_id, eventSlug, "custom-files",
            `${Date.now()}-${field.id}.${ext}`, file, false
          );
          custom_fields[field.id] = uploadedRef;
        } catch (uploadError: any) {
          console.error(`Failed to upload custom field file: ${field.id}`, uploadError);
          throw new Error(uploadError?.message || `Failed to upload file for ${field.label || field.id}`);
        }
      }
    } else if (field.type === "checkbox_grid") {
      const rows = field.gridRows?.split(',') || [];
      const gridResult: Record<string, string[]> = {};
      
      for (const r of rows) {
        const rowKey = r.trim();
        if (!rowKey) continue;
        const values = formData.getAll(`${field.id}_${rowKey}`) as string[];
        if (values && values.length > 0) {
          gridResult[rowKey] = values;
        }
      }
      custom_fields[field.id] = gridResult;
    } else if (field.type === "checkbox") {
      custom_fields[field.id] = formData.get(field.id) === "on";
    } else {
      custom_fields[field.id] = formData.get(field.id) as string;
    }
  }

  // 5. Insert Registration using Atomic RPC
  const { error: insertError, data: insertData } = await supabase.rpc('register_for_event', {
    p_event_id: eventId,
    p_full_name: full_name,
    p_phone: phone,
    p_email: email,
    p_utr_id: utr_id,
    p_payment_screenshot_url: payment_screenshot_url,
    p_custom_fields: custom_fields,
    p_waitlist_enabled: event.form_settings?.waitlistEnabled || false
  });

  if (insertError) {
    console.error("Failed to insert registration", insertError);
    if (insertError.message?.includes('Event sold out')) {
      redirect(`/e/${eventSlug}?error=sold_out`);
    }
    redirect(`/e/${eventSlug}?error=submission_failed`);
  }

  // Check if waitlisted
  const isWaitlisted = insertData?.status === 'waitlisted';

  // 6. Write to Google Sheet directly (with queue fallback)
  if (event.google_sheet_id) {
    const registeredAt = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    
    // Generate a signed URL for the spreadsheet thumbnail
    let publicScreenshotUrl = "No Image";
    if (payment_screenshot_url) {
      try {
        let url = await getFileUrl(event.creator_id, payment_screenshot_url);
        if (url) {
          // Convert Google Drive view links to raw export links for IMAGE formula
          if (url.includes("drive.google.com")) {
            const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
            if (match && match[1]) {
              url = `https://drive.google.com/uc?export=view&id=${match[1]}`;
            }
          }
          publicScreenshotUrl = `=HYPERLINK("${url}", "View Screenshot")`;
        } else {
          publicScreenshotUrl = "Image upload pending";
        }
      } catch {
        publicScreenshotUrl = "Image upload pending";
      }
    }

    const sheetRow = [
      full_name,
      phone,
      email,
      utr_id,
      isWaitlisted ? "Waitlisted" : "Pending",
      registeredAt,
      "", // Approved At is empty for now
      publicScreenshotUrl
    ];

    // Try direct write first
    try {
      const { appendRowToSheet } = await import("@/lib/google-sheets");
      await appendRowToSheet(event.creator_id, event.google_sheet_id, sheetRow);
    } catch (sheetError) {
      console.error("Direct sheet write failed, queuing:", sheetError);
      // Fallback: queue for cron processing
      await supabase.from("sheet_queue").insert({
        sheet_id: event.google_sheet_id,
        creator_id: event.creator_id,
        row_data: sheetRow,
        status: "pending",
      });
    }
  }

  // 7. Send "Registration Received" Email to Attendee
  try {
    // Sanitize user inputs to prevent HTML injection in emails
    const escapeHTML = (str: string) => str.replace(/[&<>'"]/g, 
      tag => ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          "'": '&#39;',
          '"': '&quot;'
        }[tag] || tag)
    );

    await sendEmail({
      from: process.env.RESEND_FROM_EMAIL!,
      to: email,
      subject: `Registration Received - ${escapeHTML(event.name)}`,
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
              <p>Hi <strong>${escapeHTML(full_name)}</strong>,</p>
              <p>We've successfully received your registration and payment details for <strong>${escapeHTML(event.name)}</strong>.</p>
              
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
