import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ValidatedSession } from "../src/server/services/auth.service";
import type { ScanJob } from "../src/lib/jobs/scan-queue";

vi.mock("../src/server/services/auth.service", () => ({
  getCurrentUserFromRequest: vi.fn()
}));

vi.mock("../src/server/services/scanning.service", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../src/server/services/scanning.service")>();

  return {
    ...actual,
    startSubmissionScan: vi.fn()
  };
});

const authService = await import("../src/server/services/auth.service");
const scanningService = await import("../src/server/services/scanning.service");
const scanRoute = await import("../src/app/api/submissions/[id]/scan/route");

const user = {
  email: "student@example.edu",
  id: "00000000-0000-4000-8000-000000000011",
  isActive: true,
  role: "USER",
  tenantId: "00000000-0000-4000-8000-000000000001"
} satisfies ValidatedSession["user"];

const session = {
  session: {
    createdAt: new Date("2026-04-28T00:00:00.000Z"),
    expiresAt: new Date("2026-05-05T00:00:00.000Z"),
    id: "00000000-0000-4000-8000-000000000021",
    userId: user.id
  },
  user
} satisfies ValidatedSession;

const scanJob = {
  attempts: 0,
  createdAt: new Date("2026-04-28T00:01:00.000Z"),
  errorMessage: null,
  finishedAt: null,
  id: "00000000-0000-4000-8000-000000000031",
  provider: "mock",
  startedAt: null,
  status: "QUEUED",
  submissionId: "00000000-0000-4000-8000-000000000041",
  tenantId: user.tenantId
} satisfies ScanJob;

const scanRouteContext = {
  params: Promise.resolve({
    id: scanJob.submissionId
  })
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("scan service helpers", () => {
  it("allows scan start only from READY_FOR_SCAN submissions", () => {
    expect(
      scanningService.isSubmissionReadyForScan({ status: "READY_FOR_SCAN" })
    ).toBe(true);
    expect(scanningService.isSubmissionReadyForScan({ status: "UPLOADED" })).toBe(
      false
    );
    expect(
      scanningService.isSubmissionReadyForScan({ status: "SCAN_QUEUED" })
    ).toBe(false);
  });

  it("treats only queued and running scan jobs as active duplicates", () => {
    expect(scanningService.isActiveScanJobStatus("QUEUED")).toBe(true);
    expect(scanningService.isActiveScanJobStatus("RUNNING")).toBe(true);
    expect(scanningService.isActiveScanJobStatus("SUCCEEDED")).toBe(false);
    expect(scanningService.isActiveScanJobStatus("FAILED")).toBe(false);
  });

  it("builds provider input from the latest preprocessing payload", () => {
    expect(
      scanningService.buildScanProviderInput(scanJob, {
        id: "00000000-0000-4000-8000-000000000051",
        originalWordCount: 12,
        sanitizedText: "Academic integrity text",
        sanitizedWordCount: 3
      })
    ).toEqual({
      originalWordCount: 12,
      scannedWordCount: 3,
      submissionId: scanJob.submissionId,
      tenantId: scanJob.tenantId,
      text: "Academic integrity text"
    });
  });
});

describe("scan API route", () => {
  it("requires an authenticated user", async () => {
    vi.mocked(authService.getCurrentUserFromRequest).mockResolvedValue(null);

    const response = await scanRoute.POST(
      new Request("http://localhost:3000/api/submissions/id/scan", {
        method: "POST"
      }),
      scanRouteContext
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("starts a scan and omits internal job fields from the response", async () => {
    vi.mocked(authService.getCurrentUserFromRequest).mockResolvedValue(session);
    vi.mocked(scanningService.startSubmissionScan).mockResolvedValue({
      scanJob,
      submission: {
        id: scanJob.submissionId,
        status: "SCAN_QUEUED"
      }
    });

    const response = await scanRoute.POST(
      new Request(
        `http://localhost:3000/api/submissions/${scanJob.submissionId}/scan`,
        {
          method: "POST"
        }
      ),
      scanRouteContext
    );

    expect(scanningService.startSubmissionScan).toHaveBeenCalledWith(
      user,
      scanJob.submissionId
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      scanJob: {
        attempts: 0,
        id: scanJob.id,
        provider: "mock",
        status: "QUEUED"
      },
      submission: {
        id: scanJob.submissionId,
        status: "SCAN_QUEUED"
      }
    });
  });

  it("returns conflict responses for ineligible or duplicate scans", async () => {
    vi.mocked(authService.getCurrentUserFromRequest).mockResolvedValue(session);
    vi.mocked(scanningService.startSubmissionScan).mockRejectedValue(
      new scanningService.ActiveScanJobExistsError()
    );

    const response = await scanRoute.POST(
      new Request(
        `http://localhost:3000/api/submissions/${scanJob.submissionId}/scan`,
        {
          method: "POST"
        }
      ),
      scanRouteContext
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "An active scan is already queued or running"
    });
  });
});
