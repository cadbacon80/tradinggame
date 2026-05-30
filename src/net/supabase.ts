import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const URL = import.meta.env.VITE_SUPABASE_URL;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const ONLINE_ENABLED = Boolean(URL && ANON);

let _client: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (!ONLINE_ENABLED) {
    throw new Error('Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  if (!_client) {
    _client = createClient(URL!, ANON!, {
      realtime: { params: { eventsPerSecond: 20 } },
    });
  }
  return _client;
}
