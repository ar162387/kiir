/** Public credentials only. Legacy server-side aliases support existing installs. */
export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_PROJECT_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    || process.env.SUPABASE_PUBLISHABLE_KEY
    || process.env.SUPBASE_PUBLISHABLE_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!key.startsWith('sb_publishable_') && !key.startsWith('eyJ')) {
    throw new Error('A Supabase publishable key is required. Never use the secret key here.');
  }
  return { url, key };
}
