import { describe, expect, it } from "vitest";
import {
  buildScanTimeline,
  formatProbabilityAsPercent,
  formatScoreAsPercent,
  getScanStatusLabel,
  shouldShowScanAction
} from "../src/components/submissions/scan-status-panel";
import { shouldPollSubmissionStatus } from "../src/components/submissions/submission-status-auto-refresh";

describe("scan status panel helpers", () => {
  it("shows the scan action only for preprocessed ready submissions", () => {
    expect(shouldShowScanAction("READY_FOR_SCAN", true)).toBe(true);
    expect(shouldShowScanAction("READY_FOR_SCAN", false)).toBe(false);
    expect(shouldShowScanAction("SCAN_QUEUED", true)).toBe(false);
    expect(shouldShowScanAction("SCANNING", true)).toBe(false);
    expect(shouldShowScanAction("SCAN_COMPLETE", true)).toBe(false);
  });

  it("marks queued and running lifecycle states without enabling duplicates", () => {
    expect(buildScanTimeline("SCAN_QUEUED")).toEqual([
      expect.objectContaining({ state: "complete", status: "READY_FOR_SCAN" }),
      expect.objectContaining({ state: "current", status: "SCAN_QUEUED" }),
      expect.objectContaining({ state: "pending", status: "SCANNING" }),
      expect.objectContaining({ state: "pending", status: "SCAN_COMPLETE" })
    ]);
    expect(buildScanTimeline("SCANNING")).toEqual([
      expect.objectContaining({ state: "complete", status: "READY_FOR_SCAN" }),
      expect.objectContaining({ state: "complete", status: "SCAN_QUEUED" }),
      expect.objectContaining({ state: "current", status: "SCANNING" }),
      expect.objectContaining({ state: "pending", status: "SCAN_COMPLETE" })
    ]);
  });

  it("marks completed and failed scans clearly", () => {
    expect(buildScanTimeline("SCAN_COMPLETE").every((step) => step.state === "complete")).toBe(true);
    expect(buildScanTimeline("FAILED")).toEqual([
      expect.objectContaining({ state: "pending", status: "READY_FOR_SCAN" }),
      expect.objectContaining({ state: "pending", status: "SCAN_QUEUED" }),
      expect.objectContaining({ state: "failed", status: "SCANNING" }),
      expect.objectContaining({ state: "pending", status: "SCAN_COMPLETE" })
    ]);
  });

  it("formats scan status labels and summary percentages", () => {
    expect(getScanStatusLabel("READY_FOR_SCAN")).toBe("Ready to scan");
    expect(getScanStatusLabel("SCAN_QUEUED")).toBe("Scan queued");
    expect(getScanStatusLabel("SCANNING")).toBe("Scan running");
    expect(getScanStatusLabel("SCAN_COMPLETE")).toBe("Scan complete");
    expect(formatScoreAsPercent(42.4)).toBe("42%");
    expect(formatProbabilityAsPercent(0.876)).toBe("88%");
  });

  it("polls only while scan status can change in the background", () => {
    expect(shouldPollSubmissionStatus("SCAN_QUEUED")).toBe(true);
    expect(shouldPollSubmissionStatus("SCANNING")).toBe(true);
    expect(shouldPollSubmissionStatus("READY_FOR_SCAN")).toBe(false);
    expect(shouldPollSubmissionStatus("SCAN_COMPLETE")).toBe(false);
    expect(shouldPollSubmissionStatus("FAILED")).toBe(false);
  });
});
