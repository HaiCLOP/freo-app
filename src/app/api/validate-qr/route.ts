import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Using a service role key if needed to bypass RLS, or just anon key if policies allow
// Since this is a public API for the mobile app (which might use a simple API key or auth token),
// we should ideally authenticate the request. For now, we'll assume the mobile app sends the ticket code.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ticketCode } = body;

    if (!ticketCode) {
      return NextResponse.json({ success: false, message: "Ticket code is required." }, { status: 400 });
    }

    // Find the registration by ticket code
    const { data: registration, error } = await supabase
      .from("registrations")
      .select("*, events(name, date)")
      .eq("ticket_code", ticketCode)
      .single();

    if (error || !registration) {
      return NextResponse.json({ success: false, message: "Invalid ticket code." }, { status: 404 });
    }

    if (registration.status !== "approved") {
      return NextResponse.json({ 
        success: false, 
        message: `Registration is not approved (Current status: ${registration.status}).` 
      }, { status: 400 });
    }

    if (registration.checked_in_at) {
      return NextResponse.json({ 
        success: false, 
        message: "Attendee has already checked in.",
        checked_in_at: registration.checked_in_at
      }, { status: 400 });
    }

    // Mark as checked in
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("registrations")
      .update({ checked_in_at: now })
      .eq("id", registration.id);

    if (updateError) {
      console.error("Error updating check-in status:", updateError);
      return NextResponse.json({ success: false, message: "Failed to update check-in status." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Check-in successful!",
      attendee: {
        name: registration.full_name,
        email: registration.email,
        phone: registration.phone,
        event: registration.events?.name,
      }
    });

  } catch (err: any) {
    console.error("QR Validation API Error:", err);
    return NextResponse.json({ success: false, message: "Internal server error." }, { status: 500 });
  }
}
