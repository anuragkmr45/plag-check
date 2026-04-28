import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const rootDir = process.cwd();

function readRepoFile(path: string): string {
  return readFileSync(join(rootDir, path), "utf8");
}

describe("demo UI reliability affordances", () => {
  it("keeps the desktop sidebar sticky and scroll-safe", () => {
    const shell = readRepoFile("src/components/dashboard/dashboard-shell.tsx");

    expect(shell).toContain("sticky top-0");
    expect(shell).toContain("h-screen");
    expect(shell).toContain("overflow-y-auto");
  });

  it("uses institution wording in scan creation forms", () => {
    const quickTextForm = readRepoFile(
      "src/components/scanning/quick-text-scan-form.tsx"
    );
    const uploadForm = readRepoFile(
      "src/components/submissions/submission-create-upload-form.tsx"
    );

    for (const form of [quickTextForm, uploadForm]) {
      expect(form).toContain("Institution / Tenant");
      expect(form).toContain("institution workspace");
      expect(form).toContain("tenant admins and");
    }
  });
});
