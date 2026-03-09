import { NextRequest, NextResponse } from "next/server";

const LOCALES = ["de", "fr", "en"] as const;

const PUBLIC_PREFIXES = ["/api", "/_next", "/img", "/data", "/content", "/css"];
const STATIC_EXT = /\.(png|jpe?g|gif|svg|ico|webp|woff2?|ttf|otf|eot|js|css|map|json)$/i;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets and known public paths
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (STATIC_EXT.test(pathname)) return NextResponse.next();

  // "/" → "/de"
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/de", request.url));
  }

  // Check if first segment is a valid locale
  const firstSegment = pathname.split("/")[1];
  if (LOCALES.includes(firstSegment as (typeof LOCALES)[number])) {
    // Pass lang to server components via header
    const response = NextResponse.next();
    response.headers.set("x-lang", firstSegment);
    return response;
  }

  // Prepend /de to all other paths
  return NextResponse.redirect(new URL(`/de${pathname}`, request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
