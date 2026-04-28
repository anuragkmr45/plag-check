import { Buffer } from "node:buffer";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { EnvInput } from "../src/lib/env";
import type { RbacUser } from "../src/lib/rbac/guards";

const validEnv = {
  DATABASE_URL: "postgresql://plagcheck:local-password@localhost:5432/plagcheck",
  APP_URL: "http://localhost:3000",
  SESSION_SECRET: "local-session-secret-at-least-32-characters",
  MINIO_ENDPOINT: "http://localhost:9000",
  MINIO_REGION: "us-east-1",
  MINIO_BUCKET: "plagcheck-documents",
  MINIO_ACCESS_KEY: "local-minio-access-key",
  MINIO_SECRET_KEY: "local-minio-secret-key"
} satisfies EnvInput;

const tenantId = "00000000-0000-4000-8000-000000000001";
const otherTenantId = "00000000-0000-4000-8000-000000000002";
const ownerId = "00000000-0000-4000-8000-000000000011";

async function loadUploadModule() {
  vi.resetModules();

  for (const [key, value] of Object.entries(validEnv)) {
    vi.stubEnv(key, value);
  }

  return import("../src/server/services/submission-upload.service");
}

function user(overrides: Partial<RbacUser> = {}): RbacUser {
  return {
    id: ownerId,
    isActive: true,
    role: "USER",
    tenantId,
    ...overrides
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("submission upload validation", () => {
  it("accepts only supported upload MIME types", async () => {
    const { normalizeUploadMimeType } = await loadUploadModule();

    expect(normalizeUploadMimeType("application/pdf")).toBe("application/pdf");
    expect(normalizeUploadMimeType("text/plain; charset=utf-8")).toBe(
      "text/plain"
    );
    expect(normalizeUploadMimeType("image/png")).toBeNull();
    expect(normalizeUploadMimeType("")).toBeNull();
  });

  it("resolves tenant upload size settings with a 25 MB default", async () => {
    const { DEFAULT_MAX_UPLOAD_SIZE_BYTES, resolveMaxUploadSizeBytes } =
      await loadUploadModule();

    expect(resolveMaxUploadSizeBytes({})).toBe(DEFAULT_MAX_UPLOAD_SIZE_BYTES);
    expect(resolveMaxUploadSizeBytes({ maxFileSizeMb: 2 })).toBe(2 * 1024 * 1024);
    expect(resolveMaxUploadSizeBytes({ maxFileSizeBytes: 512 })).toBe(512);
    expect(resolveMaxUploadSizeBytes({ limits: { maxFileSizeMb: 3 } })).toBe(
      3 * 1024 * 1024
    );
    expect(resolveMaxUploadSizeBytes({ maxFileSizeMb: "2" })).toBe(
      DEFAULT_MAX_UPLOAD_SIZE_BYTES
    );
  });

  it("rejects unsupported types and oversized files", async () => {
    const { UploadValidationError, validateSubmissionUploadInput } =
      await loadUploadModule();

    expect(() =>
      validateSubmissionUploadInput(
        {
          data: Buffer.from("MZ"),
          mimeType: "application/x-msdownload",
          originalFilename: "paper.exe",
          sizeBytes: 2
        },
        10
      )
    ).toThrow(UploadValidationError);

    expect(() =>
      validateSubmissionUploadInput(
        {
          data: Buffer.from("hello world"),
          mimeType: "text/plain",
          originalFilename: "paper.txt",
          sizeBytes: 11
        },
        10
      )
    ).toThrow(UploadValidationError);
  });

  it("rejects mismatched extensions, unsafe names, and mismatched signatures", async () => {
    const { UploadValidationError, validateSubmissionUploadInput } =
      await loadUploadModule();

    expect(() =>
      validateSubmissionUploadInput(
        {
          data: Buffer.from("%PDF-1.7\n"),
          mimeType: "application/pdf",
          originalFilename: "paper.txt",
          sizeBytes: 9
        },
        20
      )
    ).toThrow(UploadValidationError);

    expect(() =>
      validateSubmissionUploadInput(
        {
          data: Buffer.from("hello"),
          mimeType: "text/plain",
          originalFilename: "../paper.txt",
          sizeBytes: 5
        },
        20
      )
    ).toThrow(UploadValidationError);

    expect(() =>
      validateSubmissionUploadInput(
        {
          data: Buffer.from("not a pdf"),
          mimeType: "application/pdf",
          originalFilename: "paper.pdf",
          sizeBytes: 9
        },
        20
      )
    ).toThrow(UploadValidationError);
  });

  it("accepts basic signatures for supported document types", async () => {
    const { validateSubmissionUploadInput } = await loadUploadModule();

    expect(
      validateSubmissionUploadInput(
        {
          data: Buffer.from("%PDF-1.7\n"),
          mimeType: "application/pdf",
          originalFilename: "paper.pdf",
          sizeBytes: 9
        },
        20
      )
    ).toBe("application/pdf");

    expect(
      validateSubmissionUploadInput(
        {
          data: Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00]),
          mimeType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          originalFilename: "paper.docx",
          sizeBytes: 5
        },
        20
      )
    ).toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
  });
});

describe("submission upload access", () => {
  it("allows owners and tenant admins before scanning starts", async () => {
    const { canUploadToSubmission } = await loadUploadModule();
    const submission = {
      createdByUserId: ownerId,
      id: "00000000-0000-4000-8000-000000000101",
      status: "DRAFT" as const,
      tenantId
    };

    expect(canUploadToSubmission(user(), submission)).toBe(true);
    expect(
      canUploadToSubmission(user({ id: "admin", role: "INSTITUTION_ADMIN" }), submission)
    ).toBe(true);
    expect(
      canUploadToSubmission(user({ role: "SUPER_ADMIN", tenantId: null }), submission)
    ).toBe(true);
  });

  it("rejects reviewers, other users, other tenants, and started scans", async () => {
    const { canUploadToSubmission } = await loadUploadModule();
    const submission = {
      createdByUserId: ownerId,
      id: "00000000-0000-4000-8000-000000000101",
      status: "DRAFT" as const,
      tenantId
    };

    expect(canUploadToSubmission(user({ role: "REVIEWER" }), submission)).toBe(
      false
    );
    expect(canUploadToSubmission(user({ id: "other-user" }), submission)).toBe(
      false
    );
    expect(canUploadToSubmission(user({ tenantId: otherTenantId }), submission)).toBe(
      false
    );
    expect(
      canUploadToSubmission(user(), {
        ...submission,
        status: "SCANNING" as const
      })
    ).toBe(false);
  });
});
