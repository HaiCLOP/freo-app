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
      
      // Let's get all registrations for this event
      const { data: registrations } = await supabase.from('registrations').select('*').eq('event_id', event.id).order('registered_at', { ascending: true });
      if (!registrations || registrations.length === 0) {
        continue;
      }
      
      // Get the headers from the sheet
      const headerRes = await sheets.spreadsheets.values.get({
        spreadsheetId: event.google_sheet_id,
        range: "Registrations!1:1",
      });
      const headers = headerRes.data.values?.[0] || [];
      
      // Read all existing rows
      const existingRes = await sheets.spreadsheets.values.get({
        spreadsheetId: event.google_sheet_id,
        range: "Registrations!A:Z",
      });
      const existingRows = existingRes.data.values || [];
      const emailColIndex = headers.findIndex((h: string) => h.toLowerCase() === 'email');
      const nameColIndex = headers.findIndex((h: string) => h.toLowerCase() === 'name');
      
      const formConfig = event.form_config || [];
      
      for (const reg of registrations) {
        const email = reg.email.toLowerCase().trim();
        
        // Find if this email is already in the sheet
        let existingRowIndex = -1;
        if (emailColIndex >= 0) {
          for (let i = 1; i < existingRows.length; i++) {
            if (existingRows[i][emailColIndex] && existingRows[i][emailColIndex].toString().trim().toLowerCase() === email) {
              existingRowIndex = i;
              break;
            }
          }
        }
        
        // If it exists, but Name is missing, it was a bad sync. Let's update it!
        // If it doesn't exist, we append it.
        const isMissingName = existingRowIndex !== -1 && nameColIndex >= 0 && !existingRows[existingRowIndex][nameColIndex];
        
        if (existingRowIndex === -1 || isMissingName) {
          const customFields = typeof reg.custom_fields === 'string' ? JSON.parse(reg.custom_fields) : (reg.custom_fields || {});
          
          // Map custom fields to their labels!
          const mappedCustomFields: Record<string, any> = {};
          for (const field of formConfig) {
            if (customFields[field.id] !== undefined) {
              let val = customFields[field.id];
              // Recreate the logic from actions.ts
              if (field.type === 'file' || field.type === 'file_upload') {
                val = `=HYPERLINK("https://freo-events.vercel.app/api/storage/proxy?path=${val}", "View File")`;
              } else if (field.type === 'checkbox_grid') {
                val = Object.entries(val).map(([row, cols]) => `${row}: ${(cols as string[]).join(', ')}`).join(' | ');
              } else if (field.type === 'checkbox') {
                val = val ? "Yes" : "No";
              }
              mappedCustomFields[field.label || field.id] = val;
            }
          }
          
          const rowData: Record<string, any> = {
            "Registered At": new Date(reg.registered_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            "Name": reg.full_name,
            "Email": reg.email,
            "Phone": reg.phone,
            "Status": reg.status,
            ...mappedCustomFields
          };
          if (event.form_type !== 'survey') {
            rowData["UTR ID"] = reg.utr_id || "";
            rowData["Payment Screenshot URL"] = reg.payment_screenshot_url ? `=HYPERLINK("${reg.payment_screenshot_url.replace(/"/g, '')}", "View Payment")` : "";
          }
          
          let finalArray = headers.map((h: string) => {
            const val = rowData[h];
            return val !== undefined && val !== null ? val : "";
          });
          
          if (existingRowIndex === -1) {
            await sheets.spreadsheets.values.append({
              spreadsheetId: event.google_sheet_id,
              range: "Registrations!A:Z",
              valueInputOption: "USER_ENTERED",
              requestBody: { values: [finalArray] },
            });
            console.log(`  -> APPENDED missing registration: ${email}`);
          } else if (isMissingName) {
            const rowNum = existingRowIndex + 1;
            await sheets.spreadsheets.values.update({
              spreadsheetId: event.google_sheet_id,
              range: `Registrations!A${rowNum}`,
              valueInputOption: "USER_ENTERED",
              requestBody: { values: [finalArray] },
            });
            console.log(`  -> UPDATED incomplete registration: ${email}`);
          }
        }
      }
      
    } catch (err: any) {
      console.error(`  -> ERROR processing event ${event.name}: ${err.message}`);
    }
  }
}

run().catch(console.error);
