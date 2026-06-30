import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { google } from 'googleapis';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const { data: events } = await supabase
    .from('events')
    .select('id, name, slug, form_type, form_config, google_sheet_id, creators(google_access_token, google_refresh_token)')
    .not('google_sheet_id', 'is', null)
    .order('created_at', { ascending: true });

  if (!events) return;

  for (const event of events) {
    console.log(`\n=== Rebuilding: ${event.slug} ===`);
    
    const creators = event.creators as any;
    const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
    oauth2Client.setCredentials({
      access_token: creators.google_access_token,
      refresh_token: creators.google_refresh_token,
    });
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

    const formConfig = (event.form_config as any[]) || [];
    const formType = event.form_type || 'event';

    // Build correct headers
    const headers: string[] = ["Name", "Phone", "Email"];
    if (formType !== 'survey') headers.push("UTR ID");
    headers.push("Status", "Registered At", "Approved At");
    if (formType !== 'survey') headers.push("Payment Screenshot URL");

    for (const field of formConfig) {
      if (["name", "phone", "email"].includes(field.id)) continue;
      if (["section_divider", "page_break", "hyperlink"].includes(field.type)) continue;
      headers.push(field.label || field.id);
    }

    console.log(`  Headers: ${headers.length} columns`);

    // Fetch registrations
    const { data: registrations } = await supabase
      .from('registrations')
      .select('*')
      .eq('event_id', event.id)
      .order('registered_at', { ascending: true });

    if (!registrations || registrations.length === 0) {
      console.log("  No registrations.");
      continue;
    }

    // Build rows
    const allRows: any[][] = [];
    for (const reg of registrations) {
      const customFields = typeof reg.custom_fields === 'string'
        ? JSON.parse(reg.custom_fields)
        : reg.custom_fields || {};

      const rowData: Record<string, any> = {
        Name: reg.full_name,
        Phone: reg.phone,
        Email: reg.email,
        Status: reg.status === 'approved' && formType === 'survey' ? 'Replied' : reg.status,
        "Registered At": new Date(reg.registered_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        "Approved At": reg.approved_at
          ? new Date(reg.approved_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
          : '',
      };

      if (formType !== 'survey') {
        rowData["UTR ID"] = reg.utr_id || '';
        rowData["Payment Screenshot URL"] = reg.payment_screenshot_url || '';
      }

      // Map custom fields by field.id -> field.label
      for (const field of formConfig) {
        if (["name", "phone", "email"].includes(field.id)) continue;
        if (["section_divider", "page_break", "hyperlink"].includes(field.type)) continue;

        const label = field.label || field.id;
        let val = customFields[field.id];

        if (val === undefined || val === null) {
          rowData[label] = '';
        } else if ((field.type === 'file' || field.type === 'file_upload') && val) {
          const fileUrl = `https://freo-events.vercel.app/api/storage/proxy?path=${encodeURIComponent(String(val))}`;
          rowData[label] = `=HYPERLINK("${fileUrl}", "View File")`;
        } else if (typeof val === 'boolean') {
          rowData[label] = val ? 'Yes' : 'No';
        } else if (typeof val === 'object') {
          rowData[label] = JSON.stringify(val);
        } else {
          rowData[label] = String(val);
        }
      }

      const row = headers.map(h => {
        const v = rowData[h];
        return v !== undefined && v !== null ? v : '';
      });
      allRows.push(row);
    }

    console.log(`  Built ${allRows.length} rows`);

    // Clear sheet and rewrite
    try {
      await sheets.spreadsheets.values.clear({
        spreadsheetId: event.google_sheet_id!,
        range: "Registrations!A:Z",
      });

      await sheets.spreadsheets.values.update({
        spreadsheetId: event.google_sheet_id!,
        range: "Registrations!A1",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [headers, ...allRows] },
      });

      console.log(`  ✅ Sheet rebuilt with ${allRows.length} rows!`);
    } catch (e: any) {
      console.error(`  ❌ Failed: ${e.message}`);
    }
  }
}

run().catch(console.error);
