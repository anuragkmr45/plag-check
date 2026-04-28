import { afterEach, describe, expect, it, vi } from "vitest";
import type { EnvInput } from "../src/lib/env";

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

type SentCommand = {
  constructor: {
    name: string;
  };
  input: Record<string, unknown>;
};

async function loadStorageModule() {
  vi.resetModules();

  for (const [key, value] of Object.entries(validEnv)) {
    vi.stubEnv(key, value);
  }

  return import("../src/lib/storage/object-storage");
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("object storage", () => {
  it("builds tenant-scoped object keys and sanitizes filenames", async () => {
    const { buildTenantReportStorageKey, buildTenantStorageKey } =
      await loadStorageModule();
    const tenantId = "00000000-0000-4000-8000-000000000001";
    const submissionId = "00000000-0000-4000-8000-000000000002";

    expect(
      buildTenantStorageKey(tenantId, submissionId, "../../Draft Final!.pdf")
    ).toBe(
      "tenants/00000000-0000-4000-8000-000000000001/submissions/00000000-0000-4000-8000-000000000002/Draft-Final-.pdf"
    );
    expect(() =>
      buildTenantStorageKey("not-a-uuid", submissionId, "paper.pdf")
    ).toThrow();
    expect(
      buildTenantReportStorageKey(tenantId, submissionId, "../Report v1.pdf")
    ).toBe(
      "tenants/00000000-0000-4000-8000-000000000001/submissions/00000000-0000-4000-8000-000000000002/reports/Report-v1.pdf"
    );
  });

  it("sends put, get, and delete commands without exposing credentials", async () => {
    const { deleteObject, getObject, putObject } = await loadStorageModule();
    const sentCommands: SentCommand[] = [];
    const fakeClient = {
      send: vi.fn(async (command: unknown) => {
        sentCommands.push(command as SentCommand);
        return {};
      })
    } as unknown as NonNullable<Parameters<typeof putObject>[1]>;

    await putObject(
      {
        body: "contents",
        contentType: "text/plain",
        key: "tenants/t/submissions/s/file.txt",
        metadata: {
          checksum: "abc"
        }
      },
      fakeClient
    );
    await getObject("tenants/t/submissions/s/file.txt", fakeClient);
    await deleteObject("tenants/t/submissions/s/file.txt", fakeClient);

    expect(sentCommands.map((command) => command.constructor.name)).toEqual([
      "PutObjectCommand",
      "GetObjectCommand",
      "DeleteObjectCommand"
    ]);
    expect(sentCommands[0]?.input).toMatchObject({
      Body: "contents",
      Bucket: "plagcheck-documents",
      ContentType: "text/plain",
      Key: "tenants/t/submissions/s/file.txt",
      Metadata: {
        checksum: "abc"
      }
    });
    expect(JSON.stringify(sentCommands)).not.toContain("local-minio-secret-key");
  });
});
