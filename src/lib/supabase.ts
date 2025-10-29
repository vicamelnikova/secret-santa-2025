import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface Participant {
  id: string;
  slack_user_id: string | null;
  name: string;
  address: string;
  wishlist: string | null;
  status: string;
  secret_santa_id: string | null;
  gift_recipient_id: string | null;
  registered_at: string;
}
