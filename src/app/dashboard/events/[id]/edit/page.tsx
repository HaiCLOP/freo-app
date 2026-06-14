import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/submit-button";
import { updateEventDetails } from "./actions";

export default async function EditEventPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", params.id)
    .eq("creator_id", user.id)
    .single();

  if (!event) {
    redirect("/dashboard/events");
  }

  // Format date for datetime-local input
  const eventDateObj = new Date(event.date);
  const localDateStr = new Date(eventDateObj.getTime() - (eventDateObj.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 md:px-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/events">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5 text-gray-900" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Edit Event</h1>
          <p className="text-gray-500 mt-1 font-medium">Update details for {event.name}</p>
        </div>
      </div>

      <form action={updateEventDetails.bind(null, event.id)}>
        <Card className="rounded-3xl border-gray-100 shadow-sm overflow-hidden mb-8">
          <CardContent className="p-8 space-y-8">
            <div className="space-y-4">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">Event Name</Label>
              <Input id="name" name="name" defaultValue={event.name} required className="rounded-xl bg-gray-50/50" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Label htmlFor="date" className="text-sm font-medium text-gray-700">Date & Time</Label>
                <Input id="date" name="date" type="datetime-local" defaultValue={localDateStr} required className="rounded-xl bg-gray-50/50" />
              </div>
              <div className="space-y-4">
                <Label htmlFor="venue" className="text-sm font-medium text-gray-700">Venue</Label>
                <Input id="venue" name="venue" defaultValue={event.venue} required className="rounded-xl bg-gray-50/50" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Label htmlFor="price" className="text-sm font-medium text-gray-700">Ticket Price (INR)</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input id="price" name="price" type="number" min="0" step="1" defaultValue={event.price} required className="pl-9 rounded-xl bg-gray-50/50" />
                </div>
              </div>
              <div className="space-y-4">
                <Label htmlFor="max_capacity" className="text-sm font-medium text-gray-700">Maximum Capacity</Label>
                <Input id="max_capacity" name="max_capacity" type="number" min="1" defaultValue={event.max_capacity} required className="rounded-xl bg-gray-50/50" />
              </div>
            </div>

            <div className="space-y-4">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
              <Textarea id="description" name="description" defaultValue={event.description} required className="rounded-xl bg-gray-50/50 min-h-[120px]" />
            </div>

            <div className="space-y-4">
              <Label htmlFor="organizer_name" className="text-sm font-medium text-gray-700">
                Custom Organizer Name <span className="text-gray-400 font-normal">(Optional)</span>
              </Label>
              <Input 
                id="organizer_name" 
                name="organizer_name" 
                defaultValue={event.organizer_name || ""} 
                placeholder="Overrides the default creator name"
                className="rounded-xl bg-gray-50/50" 
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href="/dashboard/events">
            <Button variant="outline" className="rounded-xl h-12 px-8 font-medium">Cancel</Button>
          </Link>
          <SubmitButton pendingText="Saving Changes..." className="h-12 px-8 rounded-xl bg-gray-900 hover:bg-gray-800 text-[#DDFE55] font-semibold">
            Save Changes
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
