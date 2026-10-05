import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Auth gate for /admin/* (Next 16 proxy convention).
 * UX boundary only — every Server Action re-checks session + is_admin.
 * Scoped strictly to /admin so public traffic never touches Supabase here.
 */
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    // Fail closed.
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { pathname } = request.nextUrl;
  const onLoginPage = pathname === "/admin/login";

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !onLoginPage) {
    const login = new URL("/admin/login", request.url);
    const next = `${pathname}${request.nextUrl.search}`;
    if (next && next !== "/admin") {
      login.searchParams.set("next", next);
    }
    return NextResponse.redirect(login);
  }

  if (user && onLoginPage) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
