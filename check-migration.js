require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrate() {
  // Check what columns exist on events
  const { data: events } = await supabase.from('events').select('*').limit(1);
  const existingCols = events && events[0] ? Object.keys(events[0]) : [];
  console.log('Existing events columns:', existingCols.join(', '));

  // Check creators table
  const { data: creators } = await supabase.from('creators').select('*').limit(1);
  const creatorCols = creators && creators[0] ? Object.keys(creators[0]) : [];
  console.log('Existing creators columns:', creatorCols.join(', '));

  // Test insert with only existing columns
  const missingCols = [];
  if (!existingCols.includes('phase_registration')) missingCols.push('phase_registration');
  if (!existingCols.includes('daily_reg_limit')) missingCols.push('daily_reg_limit');
  
  const missingCreatorCols = [];
  if (!creatorCols.includes('google_access_token')) missingCreatorCols.push('google_access_token');
  if (!creatorCols.includes('google_refresh_token')) missingCreatorCols.push('google_refresh_token');
  if (!creatorCols.includes('google_drive_folder_id')) missingCreatorCols.push('google_drive_folder_id');
  if (!creatorCols.includes('google_token_updated_at')) missingCreatorCols.push('google_token_updated_at');

  console.log('\nMissing events columns:', missingCols.length ? missingCols.join(', ') : 'None');
  console.log('Missing creators columns:', missingCreatorCols.length ? missingCreatorCols.join(', ') : 'None');

  console.log('\n--- Run these SQL statements in Supabase SQL Editor ---\n');

  if (missingCols.length > 0) {
    console.log('-- Events table migration');
    console.log('ALTER TABLE events ADD COLUMN IF NOT EXISTS phase_registration BOOLEAN DEFAULT false;');
    console.log('ALTER TABLE events ADD COLUMN IF NOT EXISTS daily_reg_limit INTEGER DEFAULT 100;');
    console.log('');
  }

  if (missingCreatorCols.length > 0) {
    console.log('-- Creators table migration (Google OAuth)');
    console.log('ALTER TABLE creators ADD COLUMN IF NOT EXISTS google_access_token TEXT;');
    console.log('ALTER TABLE creators ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;');
    console.log('ALTER TABLE creators ADD COLUMN IF NOT EXISTS google_token_updated_at TIMESTAMPTZ;');
    console.log('ALTER TABLE creators ADD COLUMN IF NOT EXISTS google_drive_folder_id TEXT;');
    console.log('');
  }

  // Also check sheet_queue table
  const { error: sqError } = await supabase.from('sheet_queue').select('*').limit(1);
  if (sqError && sqError.code === 'PGRST116' || sqError?.message?.includes('does not exist')) {
    console.log('-- Sheet queue table (needed for async Google Sheets sync)');
    console.log(`CREATE TABLE IF NOT EXISTS sheet_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id TEXT NOT NULL,
  creator_id UUID,
  row_data JSONB NOT NULL,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);`);
  } else if (!sqError) {
    console.log('sheet_queue table: OK');
  }
}

migrate().catch(console.error);
