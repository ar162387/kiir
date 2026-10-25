import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseConfig } from './config';

export async function createStaffClient() {
  const config = getSupabaseConfig();
  if (!config) throw new Error('Supabase authentication is not configured.');
  const store = await cookies();
  return createServerClient(config.url, config.key, {
    cookieOptions: { sameSite: 'lax', secure: process.env.NODE_ENV === 'production' },
    cookies: {
      getAll: () => store.getAll(),
      setAll(values) {
        try {
          values.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Server Components are read-only; proxy refreshes their cookies.
        }
      },
    },
  });
}
