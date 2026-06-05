import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
supabase.from('events').select('id, name, google_sheet_id, creator_id').order('created_at', { ascending: false }).limit(1).then(console.log);

supabase.from('creators').select('id, email, notification_email, notification_email_verified').order('created_at', { ascending: false }).limit(1).then(console.log);
