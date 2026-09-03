import { NextResponse } from "next/server";
import { EXPIRY_COOKIE, SESSION_COOKIE } from "./session";

export function attachSession(res: NextResponse, token: string, expiresAt: number, secure: boolean) {
  const maxAge = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure,
    path: "/",
    maxAge,
  });
  res.cookies.set(EXPIRY_COOKIE, String(expiresAt), {
    httpOnly: false,
    sameSite: "strict",
    secure,
    path: "/",
    maxAge,
  });
  return res;
}

export function clearSession(res: NextResponse) {
  res.cookies.delete(SESSION_COOKIE);
  res.cookies.delete(EXPIRY_COOKIE);
  return res;
}
