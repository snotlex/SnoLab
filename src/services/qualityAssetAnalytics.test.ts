import { describe, expect, it } from "vitest";
import { buildCalibrationAlerts, buildSampleTraceRows, summarizeQualityAssets } from "./qualityAssetAnalytics";

const now = new Date("2026-10-01T00:00:00.000Z");

describe("quality asset analytics", () => {
  it("turns due dates into operational calibration states", () => {
    const alerts = buildCalibrationAlerts([
      { id: "D-1", name: "Press", deviceType: "press", calibrationStatus: "valid", calibrationDueAt: "2026-09-01" },
      { id: "D-2", name: "Scale", deviceType: "scale", calibrationStatus: "valid", calibrationDueAt: "2026-10-15" },
      { id: "D-3", name: "Oven", deviceType: "oven", calibrationStatus: "valid", calibrationDueAt: "2027-01-01" }
    ], now);
    expect(alerts.map(alert => alert.state)).toEqual(["expired", "due", "valid"]);
  });

  it("measures sample traceability only when receipt, custody and a test exist", () => {
    const rows = buildSampleTraceRows([
      { id: "S-1", sampleNumber: "A-1", receivedAt: "2026-10-01", status: "received", chainOfCustody: ["received"] },
      { id: "S-2", sampleNumber: "A-2", receivedAt: "2026-10-01", status: "received" },
      { id: "S-3", sampleNumber: "A-3", receivedAt: "", status: "received" }
    ], [{ id: "T-1", sampleId: "S-1" } as any, { id: "T-2", sampleId: "S-2" } as any]);
    expect(rows.map(row => row.traceabilityState)).toEqual(["complete", "partial", "missing"]);
  });

  it("returns a release-oriented laboratory summary", () => {
    const summary = summarizeQualityAssets(
      [{ id: "S-1", sampleNumber: "A-1", status: "accepted", receivedAt: "2026-10-01", chainOfCustody: ["received"] }],
      [{ id: "T-1", sampleId: "S-1", approvalStatus: "approved" } as any],
      [{ id: "D-1", name: "Press", deviceType: "press", calibrationStatus: "valid", calibrationDueAt: "2027-01-01" }],
      [{ id: "C-1", deviceId: "D-1", certificateNumber: "C-1", calibratedAt: "2026-01-01", dueAt: "2027-01-01", result: "pass" }],
      now
    );
    expect(summary).toMatchObject({ samples: 1, approvedTests: 1, validDevices: 1, calibrationPassRate: 100, traceabilityRate: 100 });
  });
});
