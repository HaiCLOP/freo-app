import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { google } from 'googleapis';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const { data: events } = await supabase.from('events').select('*, creators(google_access_token, google_refresh_token)').not('google_sheet_id', 'is', null);
  
  if (!events || events.length === 0) return;
  
  for (const event of events) {
    if (event.google_sheet_id !== '13cH6zgpn1kko3LZKaVRxYGYQciUowS9NGTLkEItEgGA') continue;
    
    console.log(`Checking Sheet for Event: ${event.name}`);
    const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
    oauth2Client.setCredentials({ 
      access_token: event.creators.google_access_token,
      refresh_token: event.creators.google_refresh_token 
    });
    
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
    const existingRes = await sheets.spreadsheets.values.get({
      spreadsheetId: event.google_sheet_id,
      range: "Registrations!A1:Z10",
    });
    const existingRows = existingRes.data.values || [];
    console.log(JSON.stringify(existingRows, null, 2));
  }
}

run().catch(console.error);
