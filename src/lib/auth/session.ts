import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { env, isProductionRuntime } from "../env";

export const SESSION_COOKIE_NAME = "plagcheck_session";
export const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7;
export const SESSION_DURATION_SECONDS = SESSION_DURATION_MS / 1000;

export type SessionCookieOptions = {
  expires: Date;
  httpOnly: true;
  maxAge: number;
  path: "/";
  sameSite: "lax";
  secure: boolean;
};

export type SessionCookie = {
  name: typeof SESSION_COOKIE_NAME;
  options: SessionCookieOptions;
  value: string;
};

export function createSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(sessionToken: string): string {
  return createHmac("sha256", env.SESSION_SECRET)
    .update(sessionToken)
    .digest("hex");
}

export function areSessionTokenHashesEqual(
  firstHash: string,
  secondHash: string
): boolean {
  const first = Buffer.from(firstHash, "hex");
  const second = Buffer.from(secondHash, "hex");

  return first.length === second.length && timingSafeEqual(first, second);
}

export function getSessionExpiresAt(now = new Date()): Date {
  return new Date(now.getTime() + SESSION_DURATION_MS);
}

export function createSessionCookie(
  sessionToken: string,
  expiresAt = getSessionExpiresAt()
): SessionCookie {
  return {
    name: SESSION_COOKIE_NAME,
    options: {
      expires: expiresAt,
      httpOnly: true,
      maxAge: SESSION_DURATION_SECONDS,
      path: "/",
      sameSite: "lax",
      secure: isProductionRuntime()
    },
    value: sessionToken
  };
}

export function createExpiredSessionCookie(): SessionCookie {
  return {
    name: SESSION_COOKIE_NAME,
    options: {
      expires: new Date(0),
      httpOnly: true,
      maxAge: 0,
      path: "/",
      sameSite: "lax",
      secure: isProductionRuntime()
    },
    value: ""
  };
}

export function getSessionTokenFromCookieHeader(
  cookieHeader: string | null
): string | null {
  if (!cookieHeader) {
    return null;
  }

  for (const cookie of cookieHeader.split(";")) {
    const [name, ...valueParts] = cookie.trim().split("=");
    if (name === SESSION_COOKIE_NAME) {
      const value = valueParts.join("=");
      return value.length > 0 ? decodeURIComponent(value) : null;
    }
  }

  return null;
}
