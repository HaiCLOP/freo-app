"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { rateLimit } from "@/lib/rate-limit";

export async function register(formData: FormData) {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") || "unknown";
  
  if (ip !== "unknown") {
    const { allowed } = await rateLimit(`register_${ip}`, 5, 60_000); // 5 attempts per minute
    if (!allowed) {
      return redirect("/register?error=Too many registration attempts. Please try again later.");
    }
  }

  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  
  const origin = headersList.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/api/auth/callback`,
    },
  });

  if (error) {
    return redirect(`/register?error=${encodeURIComponent(error.message)}`);
  }

  return redirect("/register?message=Check your email to verify your account.");
}
