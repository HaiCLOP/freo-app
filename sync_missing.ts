import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { google } from 'googleapis';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  console.log("Fetching events with google_sheet_id...");
  const { data: events } = await supabase.from('events').select('*, creators(google_access_token, google_refresh_token)').not('google_sheet_id', 'is', null);
  
  if (!events || events.length === 0) {
    console.log("No events with connected sheets found.");
    return;
  }
  
  for (const event of events) {
    console.log(`Checking Event: ${event.name} (Sheet: ${event.google_sheet_id})`);
    try {
      const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
      oauth2Client.setCredentials({ 
        access_token: event.creators.google_access_token,
        refresh_token: event.creators.google_refresh_token 
      });
      
      const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
      const res = await sheets.spreadsheets.get({ spreadsheetId: event.google_sheet_id });
      console.log(`  -> SUCCESS! Title: ${res.data.properties?.title}`);
      
      // Let's get all registrations for this event
      const { data: registrations } = await supabase.from('registrations').select('*').eq('event_id', event.id).order('registered_at', { ascending: true });
      if (!registrations || registrations.length === 0) {
        console.log(`  -> No registrations found in DB.`);
        continue;
      }
      
      // Get the headers from the sheet
      const headerRes = await sheets.spreadsheets.values.get({
        spreadsheetId: event.google_sheet_id,
        range: "Registrations!1:1",
      });
      const headers = headerRes.data.values?.[0] || [];
      console.log(`  -> Sheet headers: ${headers.join(', ')}`);
      
      // Read all existing rows to see who is already there
      const existingRes = await sheets.spreadsheets.values.get({
        spreadsheetId: event.google_sheet_id,
        range: "Registrations!A:Z",
      });
      const existingRows = existingRes.data.values || [];
      // Let's assume Email is unique, or UTR ID
      const emailColIndex = headers.findIndex((h: string) => h.toLowerCase() === 'email');
      let existingEmails = new Set<string>();
      if (emailColIndex >= 0) {
        for (let i = 1; i < existingRows.length; i++) {
          if (existingRows[i][emailColIndex]) {
            existingEmails.add(existingRows[i][emailColIndex].toString().trim().toLowerCase());
          }
        }
      }
      
      console.log(`  -> Found ${existingEmails.size} unique emails in sheet. DB has ${registrations.length} registrations.`);
      
      let syncedCount = 0;
      for (const reg of registrations) {
        const email = reg.email.toLowerCase().trim();
        if (!existingEmails.has(email)) {
          // It's missing! Let's build the row and append
          const customFields = typeof reg.custom_fields === 'string' ? JSON.parse(reg.custom_fields) : (reg.custom_fields || {});
          const rowData: Record<string, any> = {
            "Timestamp": new Date(reg.registered_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            "Full Name": reg.full_name,
            "Email": reg.email,
            "Phone": reg.phone,
            "Status": reg.status,
            ...customFields
          };
          if (event.form_type !== 'survey') {
            rowData["UTR ID"] = reg.utr_id || "";
            rowData["Payment Screenshot"] = reg.payment_screenshot_url ? `=HYPERLINK("${reg.payment_screenshot_url}", "View Payment")` : "";
          }
          
          let finalArray = headers.map((h: string) => {
            const val = rowData[h];
            return val !== undefined && val !== null ? val : "";
          });
          
          if (headers.length === 0) finalArray = Object.values(rowData);
          
          await sheets.spreadsheets.values.append({
            spreadsheetId: event.google_sheet_id,
            range: "Registrations!A:Z",
            valueInputOption: "USER_ENTERED",
            requestBody: { values: [finalArray] },
          });
          console.log(`  -> Synced missing registration: ${email}`);
          syncedCount++;
        }
      }
      console.log(`  -> Synced ${syncedCount} missing registrations.`);
      
    } catch (err: any) {
      console.error(`  -> ERROR testing sheet access: ${err.message}`);
    }
  }
}

run().catch(console.error);
