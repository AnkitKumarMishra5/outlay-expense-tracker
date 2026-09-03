import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, sessionSecret, verifyToken } from "@/lib/session";

const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/register",
  "/privacy",
  "/terms",
  "/sitemap.xml",
  "/llms.txt",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/session",
  "/api/auth/logout",
]);
const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export async function proxy(req: NextRequest) {
  const { pathname, origin } = req.nextUrl;
  const secret = sessionSecret();

  const missing = [
    !secret && "APP_ENCRYPTION_KEY",
    !process.env.DATABASE_URL && "DATABASE_URL",
    !process.env.SIGNUP_INVITE_CODE && "SIGNUP_INVITE_CODE",
  ].filter(Boolean);

  if (!secret || missing.length) {
    return new NextResponse(
      `Not configured. Outlay refuses to serve without: ${missing.join(", ")}`,
      { status: 503, headers: { "Content-Type": "text/plain" } }
    );
  }

  if (MUTATING.has(req.method)) {
    const site = req.headers.get("sec-fetch-site");
    const requestOrigin = req.headers.get("origin");
    const sameOrigin = site ? site === "same-origin" : !requestOrigin || requestOrigin === origin;
    if (!sameOrigin) {
      return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
    }
  }

  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();

  const claims = await verifyToken(secret, req.cookies.get(SESSION_COOKIE)?.value);
  if (!claims) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico|icon.svg|opengraph-image|manifest.webmanifest|robots.txt|sitemap.xml|llms.txt|.*\\.(?:jpg|png|svg|webp)$).*)"],
};
