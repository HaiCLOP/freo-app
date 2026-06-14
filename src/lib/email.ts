import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

export async function sendEmail(options: any) {
  const supabase = await createClient();

  // 1. Fetch current usage counts for today
  const today = new Date().toISOString().split('T')[0];
  const { data: usageData } = await supabase
    .from("resend_key_usage")
    .select("key_index, usage_count")
    .eq("usage_date", today);

  // Default to 0 usage for keys 1 through 4
  const usage = {
    1: 0,
    2: 0,
    3: 0,
    4: 0
  };

  if (usageData) {
    usageData.forEach(row => {
      usage[row.key_index as keyof typeof usage] = row.usage_count;
    });
  }

  // 2. Find the first key index that hasn't reached the 100 limit
  let selectedKeyIndex = 1;
  if (usage[1] >= 100) selectedKeyIndex = 2;
  if (selectedKeyIndex === 2 && usage[2] >= 100) selectedKeyIndex = 3;
  if (selectedKeyIndex === 3 && usage[3] >= 100) selectedKeyIndex = 4;

  // 3. Get the API key from environment variables
  const apiKey = process.env[`RESEND_API_KEY_${selectedKeyIndex}`] || process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("No Resend API key available.");
  }

  const resend = new Resend(apiKey);

  // Dynamically set the FROM email to match the active API key's verified domain
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
    // If it's a rate limit error, we could ideally try the next key here,
    // but the DB count tracking should prevent us from hitting it.
  } else {
    // 5. Increment usage count in the database securely via RPC
    await supabase.rpc('increment_resend_usage', {
      p_key_index: selectedKeyIndex,
      p_usage_date: today
    });
  }

  return response;
}
