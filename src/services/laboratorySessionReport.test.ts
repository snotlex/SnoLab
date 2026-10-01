import { describe, expect, it } from "vitest";
import { addSessionSample, addSessionTest, addTestReplicate, createLaboratorySession } from "./laboratorySessionService";
import { buildLaboratorySessionReport, laboratorySessionReportToCsv, laboratorySessionReportToHtml } from "./laboratorySessionReport";

const sample = { sampleNumber: "S-001", sampleCode: "S-001-A", materialId: "MAT-1", materialName: "Washed sand", materialCategory: "sand" };

describe("official laboratory session reports", () => {
  it("preserves request, samples, tests, replicates, status and integrity hash", () => {
    let session = createLaboratorySession({ id: "LAB-REPORT-1", requestNumber: "LAB-2026-010", projectId: "P-1", projectName: "Bridge project" });
    session = addSessionSample(session, sample);
    session = addSessionTest(session, { testType: "AGG_SIEVE", testTitleAr: "الغربلة", testTitleFr: "Tamisage", testTitleEn: "Sieve analysis", standard: "EN 933-1", materialId: "MAT-1", sampleId: session.samples[0].id, status: "PASS", result: { finenessModulus: 2.6 }, resultSummary: { individualValues: [2.6], validCount: 1, excludedCount: 0, mean: 2.6 } });
    session = addTestReplicate(session, session.tests[0].id, { sampleId: session.samples[0].id, status: "VALID", rawInputs: { totalWeight: 100 }, numericResult: 2.6 });
    const report = buildLaboratorySessionReport({ ...session, status: "APPROVED" }, { language: "ar", generatedBy: "reviewer" });
    expect(report.metadata.requestNumber).toBe("LAB-2026-010");
    expect(report.metadata.projectName).toBe("Bridge project");
    expect(report.metadata.language).toBe("ar");
    expect(report.metadata.integrityHash).toMatch(/^fnv1a-/);
    expect(report.samples[0].sampleCode).toBe("S-001-A");
    expect(report.tests[0].resultSummary?.mean).toBe(2.6);
    expect(report.auditHistory.length).toBeGreaterThanOrEqual(4);
  });

  it("exports safe HTML and stable CSV rows without dropping failed findings", () => {
    let session = createLaboratorySession({ requestNumber: "LAB-HTML-1" });
    session = addSessionSample(session, sample);
    session = addSessionTest(session, { testType: "T-FAIL", testTitleAr: "<اختبار>", testTitleFr: "Essai", testTitleEn: "Failure", standard: "Internal", materialId: "MAT-1", sampleId: session.samples[0].id, status: "FAIL", result: { note: "<unsafe>" } });
    const report = buildLaboratorySessionReport(session, { language: "en" });
    const html = laboratorySessionReportToHtml(report);
    const csv = laboratorySessionReportToCsv(report);
    expect(html).toContain("LAB-HTML-1");
    expect(html).toContain("&lt;unsafe&gt;");
    expect(html).not.toContain("<unsafe>");
    expect(csv.split("\n")).toHaveLength(3);
    expect(report.findings.some(finding => finding.includes("failed"))).toBe(true);
  });
});
