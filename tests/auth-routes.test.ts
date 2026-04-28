import { beforeEach, describe, expect, it, vi } from "vitest";
import { SESSION_COOKIE_NAME } from "../src/lib/auth/session";
import type {
  AuthenticatedUser,
  CreatedSession,
  ValidatedSession
} from "../src/server/services/auth.service";

vi.mock("../src/server/services/auth.service", () => ({
  destroySession: vi.fn(),
  getCurrentUserFromRequest: vi.fn(),
  loginWithPassword: vi.fn()
}));

const authService = await import("../src/server/services/auth.service");
const loginRoute = await import("../src/app/api/auth/login/route");
const logoutRoute = await import("../src/app/api/auth/logout/route");
const meRoute = await import("../src/app/api/auth/me/route");

const user = {
  email: "student@example.edu",
  id: "00000000-0000-4000-8000-000000000001",
  isActive: true,
  role: "USER",
  tenantId: "00000000-0000-4000-8000-000000000002"
} satisfies AuthenticatedUser;

const session = {
  createdAt: new Date("2030-01-01T00:00:00.000Z"),
  expiresAt: new Date("2030-01-08T00:00:00.000Z"),
  id: "00000000-0000-4000-8000-000000000003",
  userId: user.id
};

const sessionCookie = {
  name: SESSION_COOKIE_NAME,
  options: {
    expires: session.expiresAt,
    httpOnly: true,
    maxAge: 604_800,
    path: "/",
    sameSite: "lax",
    secure: false
  },
  value: "raw-session-token"
} satisfies CreatedSession["cookie"];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("auth API routes", () => {
  it("logs in with normalized email, sets the session cookie, and omits secrets", async () => {
    vi.mocked(authService.loginWithPassword).mockResolvedValue({
      cookie: sessionCookie,
      session,
      token: "raw-session-token",
      user
    });

    const response = await loginRoute.POST(
      new Request("http://localhost:3000/api/auth/login", {
        body: JSON.stringify({
          email: "Student@Example.edu",
          password: "correct-password"
        }),
        headers: {
          "content-type": "application/json",
          "user-agent": "vitest",
          "x-forwarded-for": "203.0.113.10, 10.0.0.1"
        },
        method: "POST"
      })
    );
    const body = await response.json();

    expect(authService.loginWithPassword).toHaveBeenCalledWith(
      "student@example.edu",
      "correct-password",
      {
        audit: {
          ip: "203.0.113.10",
          userAgent: "vitest"
        }
      }
    );
    expect(response.status).toBe(200);
    expect(body).toEqual({ user });
    expect(JSON.stringify(body)).not.toContain("password");
    expect(response.headers.get("set-cookie")).toContain(
      `${SESSION_COOKIE_NAME}=raw-session-token`
    );
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")?.toLowerCase()).toContain(
      "samesite=lax"
    );
  });

  it("returns the same generic error for malformed and wrong credentials", async () => {
    vi.mocked(authService.loginWithPassword).mockResolvedValue(null);

    const malformedResponse = await loginRoute.POST(
      new Request("http://localhost:3000/api/auth/login", {
        body: JSON.stringify({ email: "not-an-email", password: "" }),
        method: "POST"
      })
    );
    const wrongPasswordResponse = await loginRoute.POST(
      new Request("http://localhost:3000/api/auth/login", {
        body: JSON.stringify({
          email: "student@example.edu",
          password: "wrong-password"
        }),
        method: "POST"
      })
    );

    expect(malformedResponse.status).toBe(401);
    expect(wrongPasswordResponse.status).toBe(401);
    await expect(malformedResponse.json()).resolves.toEqual({
      error: "Invalid email or password"
    });
    await expect(wrongPasswordResponse.json()).resolves.toEqual({
      error: "Invalid email or password"
    });
  });

  it("returns the current user without password data", async () => {
    vi.mocked(authService.getCurrentUserFromRequest).mockResolvedValue({
      session,
      user
    } satisfies ValidatedSession);

    const response = await meRoute.GET(
      new Request("http://localhost:3000/api/auth/me", {
        headers: {
          cookie: `${SESSION_COOKIE_NAME}=raw-session-token`
        }
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ user });
    expect(JSON.stringify(body)).not.toContain("password");
  });

  it("logs out by deleting the session through the auth service and clearing the cookie", async () => {
    vi.mocked(authService.destroySession).mockResolvedValue({
      cookie: {
        ...sessionCookie,
        options: {
          ...sessionCookie.options,
          expires: new Date(0),
          maxAge: 0
        },
        value: ""
      }
    });

    const response = await logoutRoute.POST(
      new Request("http://localhost:3000/api/auth/logout", {
        headers: {
          cookie: `${SESSION_COOKIE_NAME}=raw-session-token`,
          "user-agent": "vitest",
          "x-real-ip": "203.0.113.20"
        },
        method: "POST"
      })
    );

    expect(authService.destroySession).toHaveBeenCalledWith(
      "raw-session-token",
      {
        audit: {
          ip: "203.0.113.20",
          userAgent: "vitest"
        }
      }
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(response.headers.get("set-cookie")).toContain(
      `${SESSION_COOKIE_NAME}=`
    );
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});
