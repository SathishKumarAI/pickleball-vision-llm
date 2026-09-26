import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { LOCAL_PREVIEW, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";

/** Refresh the Supabase session cookie on every request (keeps SSR auth valid). */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Local preview has no Supabase project, so there is no session to refresh.
  // Without this guard every request throws before reaching a page.
  if (LOCAL_PREVIEW) return response;

  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
