import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseConfig } from '@/lib/supabase/config';

export async function proxy(request: NextRequest) {
  const requestHeaders=new Headers(request.headers);
  requestHeaders.set('x-kiir-language',request.nextUrl.pathname==='/ur'||request.nextUrl.pathname.startsWith('/ur/')?'ur':'en');
  const isAdmin=request.nextUrl.pathname==='/admin'||request.nextUrl.pathname.startsWith('/admin/');
  let response = NextResponse.next({ request:{headers:requestHeaders} });
  if(!isAdmin)return response;
  const config = getSupabaseConfig();
  if (config) {
    const client = createServerClient(config.url, config.key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(values, headers) {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request:{headers:requestHeaders} });
          values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          Object.entries(headers ?? {}).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    });
    await client.auth.getClaims();
  }
  // Staff responses must never be shared by CDN caches, including login/errors.
  response.headers.set('Cache-Control', 'private, no-store, max-age=0');
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|photos/|logo/).*)'] };
