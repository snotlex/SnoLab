import { describe, expect, it } from "vitest";
import { buildReportEnvelope, canIssueReport, flattenReportRows } from "./reportContract";

const input: any = {
  fck28: 25,
  controlClass: "normal",
  cementType: "CEM I 42.5 N",
  cementClassStrength: 42.5,
  dMax: 15,
  slump: 7,
  aggregateType: "concasse",
  aggregateQuality: "standard",
  hasPumping: false,
  sandRelativeDensity: 2.62,
  gravelRelativeDensity: 2.66,
  cementDensity: 3100,
  airContent: 1.5,
  moistureSand: 1.2,
  moistureGravel: 0.9,
  selectedMethod: "dreux",
};
const result: any = {
  methodId: "dreux-gorisse",
  cementWeight: 333.76,
  waterContentActual: 154.8,
  sandWeightDry: 859.4,
  gravelWeightDry: 1041.05,
};

describe("report contract", () => {
  it("creates a versioned RTL envelope with an integrity identifier", () => {
    const report = buildReportEnvelope({ input, result, language: "ar", project: { name: "مشروع اختبار" } });
    expect(report.metadata.direction).toBe("rtl");
    expect(report.metadata.templateId).toBe("snolab-engineering-v2");
    expect(report.metadata.integrityHash).toMatch(/^fnv1a-/);
    expect(report.metadata.formats).toContain("json");
  });

  it("blocks issuance until approval and critical findings are cleared", () => {
    const report = buildReportEnvelope({
      input,
      result,
      language: "en",
      findings: [{ code: "volume_closure", severity: "critical", message: "Volume does not close" }],
    });
    const decision = canIssueReport(report);
    expect(decision.allowed).toBe(false);
    expect(decision.reasons).toEqual(expect.arrayContaining(["critical_findings", "approval_required"]));
  });

  it("flattens nested values without exposing implementation-specific formatting", () => {
    const report = buildReportEnvelope({ input, result, language: "fr" });
    const rows = flattenReportRows(report);
    expect(rows.some((row) => row.field === "fck28" && row.value === 25)).toBe(true);
    expect(rows.some((row) => row.section === "result" && row.field === "cementWeight" && row.value === 333.76)).toBe(true);
  });
});
