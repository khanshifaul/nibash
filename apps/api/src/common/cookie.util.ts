// src/common/cookie.util.ts — auth cookie helpers.
import { Response } from "express";

export const AUTH_COOKIE = "nibash_token";
export const REFRESH_COOKIE = "nibash_refresh";
const DAY_MS = 24 * 60 * 60 * 1000;

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
  rememberMe = false,
): void {
  const isProd = process.env.NODE_ENV === "production";
  // Cross-origin deployments (e.g. Vercel web + Render API) require SameSite=None; Secure.
  // For same-site/subdomain setups, consider tightening to "lax" and setting a shared domain.
  const sameSite: "lax" | "none" = isProd ? "none" : "lax";
  const secure = isProd;
  res.cookie(AUTH_COOKIE, accessToken, {
    httpOnly: true,
    sameSite,
    secure,
    path: "/",
    maxAge: 15 * 60 * 1000,
  });
  res.cookie(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    sameSite,
    secure,
    path: "/",
    maxAge: (rememberMe ? 30 : 7) * DAY_MS,
  });
}

export function clearAuthCookies(res: Response): void {
  const opts = { path: "/" };
  res.clearCookie(AUTH_COOKIE, opts);
  res.clearCookie(REFRESH_COOKIE, opts);
}
