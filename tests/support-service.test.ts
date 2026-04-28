import { afterEach, describe, expect, it, vi } from "vitest";
import type { EnvInput } from "../src/lib/env";
import type { RbacUser } from "../src/lib/rbac/guards";
import type { SupportTicketSummary } from "../src/features/support/support.service";

const validEnv = {
  APP_URL: "http://localhost:3000",
  DATABASE_URL: "postgresql://plagcheck:local-password@localhost:5432/plagcheck",
  MINIO_ACCESS_KEY: "local-minio-access-key",
  MINIO_BUCKET: "plagcheck-documents",
  MINIO_ENDPOINT: "http://localhost:9000",
  MINIO_REGION: "us-east-1",
  MINIO_SECRET_KEY: "local-minio-secret-key",
  SESSION_SECRET: "local-session-secret-at-least-32-characters"
} satisfies EnvInput;

const tenantId = "00000000-0000-4000-8000-000000000001";
const otherTenantId = "00000000-0000-4000-8000-000000000002";
const ownerId = "00000000-0000-4000-8000-000000000011";
const otherUserId = "00000000-0000-4000-8000-000000000012";

async function loadSupportService() {
  vi.resetModules();

  for (const [key, value] of Object.entries(validEnv)) {
    vi.stubEnv(key, value);
  }

  return import("../src/features/support/support.service");
}

function actor(overrides: Partial<RbacUser> = {}): RbacUser {
  return {
    id: ownerId,
    isActive: true,
    role: "USER",
    tenantId,
    ...overrides
  };
}

function ticket(
  overrides: Partial<SupportTicketSummary> = {}
): SupportTicketSummary {
  return {
    createdAt: new Date("2026-04-28T00:00:00.000Z"),
    createdByEmail: "owner@example.edu",
    createdByUserId: ownerId,
    description: "Printer access is not working.",
    id: "00000000-0000-4000-8000-000000000021",
    status: "OPEN",
    tenantId,
    tenantName: "Tenant A",
    title: "Support subject",
    updatedAt: new Date("2026-04-28T00:00:00.000Z"),
    ...overrides
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("support ticket rules", () => {
  it("defines the approved MVP support statuses", async () => {
    const { SUPPORT_TICKET_STATUSES } = await loadSupportService();

    expect(SUPPORT_TICKET_STATUSES).toEqual([
      "OPEN",
      "IN_PROGRESS",
      "RESOLVED",
      "CLOSED"
    ]);
  });

  it("parses create ticket form input without accepting empty content", async () => {
    const { parseCreateSupportTicketFormData } = await loadSupportService();
    const formData = new FormData();

    formData.set("title", "  Help needed  ");
    formData.set("description", "  Cannot upload a file.  ");

    expect(parseCreateSupportTicketFormData(formData)).toEqual({
      description: "Cannot upload a file.",
      title: "Help needed"
    });

    formData.set("description", "");
    expect(() => parseCreateSupportTicketFormData(formData)).toThrow();
  });

  it("allows tenant users to create tickets and blocks tenantless users", async () => {
    const { canCreateSupportTicket } = await loadSupportService();

    expect(canCreateSupportTicket(actor())).toBe(true);
    expect(
      canCreateSupportTicket(
        actor({
          role: "SUPER_ADMIN",
          tenantId: null
        })
      )
    ).toBe(false);
  });

  it("scopes ticket visibility by role and tenant", async () => {
    const { canViewSupportTicket } = await loadSupportService();
    const ownedTicket = ticket();

    expect(canViewSupportTicket(actor(), ownedTicket)).toBe(true);
    expect(
      canViewSupportTicket(
        actor({
          id: otherUserId
        }),
        ownedTicket
      )
    ).toBe(false);
    expect(
      canViewSupportTicket(
        actor({
          id: otherUserId,
          role: "INSTITUTION_ADMIN"
        }),
        ownedTicket
      )
    ).toBe(true);
    expect(
      canViewSupportTicket(
        actor({
          role: "INSTITUTION_ADMIN",
          tenantId: otherTenantId
        }),
        ownedTicket
      )
    ).toBe(false);
    expect(
      canViewSupportTicket(
        actor({
          role: "SUPER_ADMIN",
          tenantId: null
        }),
        ticket({
          tenantId: otherTenantId
        })
      )
    ).toBe(true);
  });

  it("limits status updates to institution admins and super admins", async () => {
    const { canUpdateSupportTicketStatus } = await loadSupportService();
    const ownedTicket = ticket();

    expect(canUpdateSupportTicketStatus(actor(), ownedTicket)).toBe(false);
    expect(
      canUpdateSupportTicketStatus(
        actor({
          role: "REVIEWER"
        }),
        ownedTicket
      )
    ).toBe(false);
    expect(
      canUpdateSupportTicketStatus(
        actor({
          role: "INSTITUTION_ADMIN"
        }),
        ownedTicket
      )
    ).toBe(true);
    expect(
      canUpdateSupportTicketStatus(
        actor({
          role: "SUPER_ADMIN",
          tenantId: null
        }),
        ownedTicket
      )
    ).toBe(true);
  });

  it("allows status lifecycle movement only when the status changes", async () => {
    const { isAllowedSupportTicketStatusTransition } =
      await loadSupportService();

    expect(isAllowedSupportTicketStatusTransition("OPEN", "IN_PROGRESS")).toBe(
      true
    );
    expect(isAllowedSupportTicketStatusTransition("IN_PROGRESS", "RESOLVED")).toBe(
      true
    );
    expect(isAllowedSupportTicketStatusTransition("RESOLVED", "CLOSED")).toBe(
      true
    );
    expect(isAllowedSupportTicketStatusTransition("OPEN", "OPEN")).toBe(false);
  });
});
