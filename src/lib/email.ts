import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

export async function sendEmail(options: any) {
  try {
    const supabase = await createClient();
    const today = new Date().toISOString().split('T')[0];

    // 1. Atomically increment and test keys to find an available slot (max 100 per key)
    let selectedKeyIndex = -1;
    for (let i = 1; i <= 4; i++) {
      const { data: count, error } = await supabase.rpc('increment_resend_usage', {
        p_key_index: i,
        p_usage_date: today
      });

      if (!error && typeof count === 'number' && count <= 100) {
        selectedKeyIndex = i;
        break; // Successfully claimed a slot on this key
      }
    }

    if (selectedKeyIndex === -1) {
      console.error("All Resend API keys have exceeded their daily limits.");
      return { success: false, error: "Email quota exceeded" };
    }

    // 2. Get the API key from environment variables
    const apiKey = process.env[`RESEND_API_KEY_${selectedKeyIndex}`] || process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.error("No Resend API key available.");
      return { success: false, error: "Configuration error" };
    }

    const resend = new Resend(apiKey);

    // 3. Dynamically set the FROM email to match the active API key's verified domain
    const fromEmail = process.env[`RESEND_FROM_EMAIL_${selectedKeyIndex}`] || process.env.RESEND_FROM_EMAIL;
    if (fromEmail) {
      options.from = options.from && options.from.includes('<') 
        ? `${options.from.split('<')[0]}<${fromEmail}>` // Preserve display name if present
        : fromEmail;
    }

    // 4. Send the email
    const response = await resend.emails.send(options);

    if (response.error) {
      console.error("Resend Error:", response.error);
      return { success: false, error: response.error.message };
    }
    
    return { success: true, id: response.data?.id };
  } catch (err: any) {
    console.error("Unhandled Exception in sendEmail:", err);
    return { success: false, error: err.message || "Unknown email error" };
  }
}
