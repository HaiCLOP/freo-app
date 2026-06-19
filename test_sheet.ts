import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const { data: events } = await supabase.from('events').select('id, slug, form_config').order('created_at');
  if (!events) return;
  for (const e of events) {
    console.log(`\n=== ${e.slug} ===`);
    const config = e.form_config || [];
    for (const f of config) {
      console.log(`  id: "${f.id}" | type: ${f.type} | label: "${f.label}"`);
    }
  }
}
run().catch(console.error);
