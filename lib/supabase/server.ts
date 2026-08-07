import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Public read-only data client for Server Components. No cookie/session
// handling here on purpose — the public site never authenticates a visitor,
// it only reads is_published = true rows via the anon key + RLS policies
// defined in supabase/migrations/0001_public_site.sql. An admin app would
// use @supabase/ssr with a cookie-bound client instead.

let cached: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null; // triggers the local-seed fallback in lib/queries.ts

  if (!cached) {
    cached = createClient(url, anonKey, {
      auth: { persistSession: false },
    });
  }
  return cached;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
