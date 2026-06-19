import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { google } from 'googleapis';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function getAuth(creator: any) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({
    access_token: creator.google_access_token,
    refresh_token: creator.google_refresh_token,
  });

  // Force a token refresh
  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    oauth2Client.setCredentials(credentials);
    
    // Save new tokens back to DB
    if (credentials.access_token) {
      await supabase.from('creators').update({
        google_access_token: credentials.access_token,
        google_refresh_token: credentials.refresh_token || creator.google_refresh_token,
      }).eq('id', creator.id);
      console.log("  -> Refreshed and saved new access token");
    }
  } catch (e: any) {
    console.log("  -> Token refresh failed, trying with existing token:", e.message);
  }

  return oauth2Client;
}

async function run() {
  const { data: events } = await supabase
    .from('events')
    .select('*, creators(*)')
    .not('google_sheet_id', 'is', null);

  if (!events || events.length === 0) return;

  for (const event of events) {
    if (event.google_sheet_id !== '13cH6zgpn1kko3LZKaVRxYGYQciUowS9NGTLkEItEgGA') continue;

    console.log(`\n=== Fixing Sheet for: ${event.name} ===`);
    console.log(`Form type: ${event.form_type}`);

    const auth = await getAuth(event.creators);
    const sheets = google.sheets({ version: 'v4', auth });

    // 1. Build correct headers for a survey (no UTR ID, no Payment Screenshot URL)
    const formConfig = event.form_config || [];
    const newHeaders: string[] = ["Name", "Phone", "Email", "Status", "Registered At", "Approved At"];

    for (const field of formConfig) {
      if (["name", "phone", "email"].includes(field.id)) continue;
      if (["section_divider", "page_break", "hyperlink"].includes(field.type)) continue;
      newHeaders.push(field.label || field.id);
    }

    console.log(`New headers (${newHeaders.length}):`, newHeaders.map((h, i) => `${i}: ${h.substring(0, 40)}`));

    // 2. Fetch all registrations from DB
    const { data: registrations } = await supabase
      .from('registrations')
      .select('*')
      .eq('event_id', event.id)
      .order('registered_at', { ascending: true });

    if (!registrations || registrations.length === 0) {
      console.log("No registrations to sync.");
      continue;
    }

    console.log(`Found ${registrations.length} registrations in DB.`);

    // 3. Build all rows
    const allRows: any[][] = [];
    for (const reg of registrations) {
      const customFields =
        typeof reg.custom_fields === 'string'
          ? JSON.parse(reg.custom_fields)
          : reg.custom_fields || {};

      const rowData: Record<string, any> = {
        Name: reg.full_name,
        Phone: reg.phone,
        Email: reg.email,
        Status: reg.status === 'approved' ? 'Replied' : reg.status,
        "Registered At": new Date(reg.registered_at).toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
        }),
        "Approved At": reg.approved_at
          ? new Date(reg.approved_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
          : '',
      };

      // Map custom fields by matching field.id -> field.label
      for (const field of formConfig) {
        if (["name", "phone", "email"].includes(field.id)) continue;
        if (["section_divider", "page_break", "hyperlink"].includes(field.type)) continue;

        const label = field.label || field.id;
        let val = customFields[field.id];

        if (val === undefined || val === null) {
          rowData[label] = '';
        } else if ((field.type === 'file' || field.type === 'file_upload') && val) {
          const fileUrl = `https://freo-events.vercel.app/api/storage/proxy?path=${encodeURIComponent(val)}`;
          rowData[label] = `=HYPERLINK("${fileUrl}", "View File")`;
        } else if (field.type === 'checkbox_grid' && typeof val === 'object') {
          rowData[label] = Object.entries(val)
            .map(([row, cols]) => `${row}: ${(cols as string[]).join(', ')}`)
            .join(' | ');
        } else if (typeof val === 'boolean') {
          rowData[label] = val ? 'Yes' : 'No';
        } else if (typeof val === 'object') {
          rowData[label] = JSON.stringify(val);
        } else {
          rowData[label] = String(val);
        }
      }

      // Map to array in header order
      const row = newHeaders.map((h) => {
        const v = rowData[h];
        return v !== undefined && v !== null ? v : '';
      });

      allRows.push(row);
      console.log(`  Built row for: ${reg.full_name} (${reg.email})`);
    }

    // 4. Clear the entire sheet first
    console.log("Clearing sheet...");
    await sheets.spreadsheets.values.clear({
      spreadsheetId: event.google_sheet_id,
      range: "Registrations!A:Z",
    });

    // 5. Write new headers + all rows
    const allValues = [newHeaders, ...allRows];
    console.log(`Writing ${allValues.length} rows (1 header + ${allRows.length} data)...`);
    await sheets.spreadsheets.values.update({
      spreadsheetId: event.google_sheet_id,
      range: "Registrations!A1",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: allValues },
    });

    console.log("✅ Sheet fully rebuilt!");
  }
}

run().catch(console.error);
