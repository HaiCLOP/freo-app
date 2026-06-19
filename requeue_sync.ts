import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function syncFailed() {
  const { data: allItems, error: fetchError } = await supabase
    .from('sheet_queue')
    .select('*');

  if (fetchError) {
    console.error('Fetch error:', fetchError);
    return;
  }

  console.log(`Total items in queue: ${allItems.length}`);
  const pending = allItems.filter(i => i.status === 'pending');
  const failed = allItems.filter(i => i.status === 'failed');
  const done = allItems.filter(i => i.status === 'done');
  console.log(`Pending: ${pending.length}, Failed: ${failed.length}, Done: ${done.length}`);
}

syncFailed();
