import { createClient } from '@supabase/supabase-js';

const url = process.env.REACT_APP_SUPABASE_URL;
const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

if (!isSupabaseConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    'Supabase not configured. Create a .env file with REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY. See README.md.'
  );
}

// Use a syntactically valid placeholder so createClient() does not throw
// at module load when env vars are missing. The app will render a
// "configure Supabase" screen instead of crashing.
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
