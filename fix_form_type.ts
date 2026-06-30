import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { google } from 'googleapis';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  // 1. Revert form_type back to survey
  const { error: revertError } = await supabase
    .from('events')
    .update({ form_type: 'survey' })
    .eq('slug', 'official-citizenship-registration-portal-058adbbb');
  
  if (revertError) console.error("Revert failed:", revertError);
  else console.log("✅ Reverted 058adbbb back to 'survey'");

  // 2. Check both events and their sheets
  const { data: events } = await supabase
    .from('events')
    .select('id, name, slug, form_type, google_sheet_id, form_config, creators(google_access_token, google_refresh_token)')
    .order('created_at', { ascending: true });

  if (!events) return;

  for (const event of events) {
    console.log(`\n=== ${event.slug} ===`);
    console.log(`  Type: ${event.form_type} | Sheet: ${event.google_sheet_id || 'none'}`);
    
    // Get registrations count
    const { data: regs, count } = await supabase
      .from('registrations')
      .select('id, full_name, email, status', { count: 'exact' })
      .eq('event_id', event.id);
    
    console.log(`  Registrations: ${count || regs?.length || 0}`);
    if (regs) {
      for (const r of regs) {
        console.log(`    - ${r.full_name} (${r.email}) [${r.status}]`);
      }
    }

    // Check sheet contents
    if (event.google_sheet_id && event.creators) {
      try {
        const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
        oauth2Client.setCredentials({
          access_token: (event.creators as any).google_access_token,
          refresh_token: (event.creators as any).google_refresh_token,
        });
        const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
        const res = await sheets.spreadsheets.values.get({
          spreadsheetId: event.google_sheet_id,
          range: "Registrations!A1:C10",
        });
        const rows = res.data.values || [];
        console.log(`  Sheet rows: ${rows.length} (including header)`);
        for (const row of rows) {
          console.log(`    [${row.slice(0, 3).join(', ')}]`);
        }
      } catch (e: any) {
        console.log(`  Sheet error: ${e.message}`);
      }
    }
  }
}

run().catch(console.error);
