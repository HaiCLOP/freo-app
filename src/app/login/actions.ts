"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { rateLimit } from "@/lib/rate-limit";

export async function login(formData: FormData) {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") || "unknown";
  
  if (ip !== "unknown") {
    const { allowed } = rateLimit(`login_${ip}`, 5, 60_000); // 5 attempts per minute
    if (!allowed) {
      return redirect("/login?error=Too many login attempts. Please try again later.");
    }
  }

  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return redirect("/login?error=Invalid login credentials");
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
