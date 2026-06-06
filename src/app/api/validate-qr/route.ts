import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { 
      success: false, 
      message: "This endpoint is deprecated. Please update your scanner app to the latest version which uses direct Supabase authentication." 
    }, 
    { status: 410 }
  );
}
