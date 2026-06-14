"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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

  revalidatePath(`/dashboard/events`);
  revalidatePath(`/dashboard/events/${eventId}/registrations`);
  revalidatePath(`/e`);

  redirect(`/dashboard/events`);
}
