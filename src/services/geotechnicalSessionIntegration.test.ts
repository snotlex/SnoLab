import { describe, expect, it } from "vitest";
import { executeGeotechnicalLaboratoryTest } from "./geotechnicalLaboratoryEngine";
import { buildLaboratorySessionReport } from "./laboratorySessionReport";
import { addSessionSample, addSessionTest, addTestReplicate, createLaboratorySession, recordGeotechnicalTestRun } from "./laboratorySessionService";
import type { LaboratorySession } from "../types/laboratorySessionTypes";

function createGeotechnicalReadySession(testType: "GT_SIEVE_SOIL" | "GT_PROCTOR", rawInputs: Record<string, unknown>): LaboratorySession {
  let session = createLaboratorySession({ domainId: "geotechnical", requestNumber: `REQ-${testType}`, projectId: "P-GT-1" });
  session = addSessionSample(session, { domainId: "geotechnical", sampleNumber: "SOIL-001", sampleCode: "SOIL-001-A", materialId: "SOIL-MAT-1", materialName: "Fill soil", materialCategory: "soil" });
  session = addSessionTest(session, {
    domainId: "geotechnical",
    testType,
    testTitleAr: testType === "GT_SIEVE_SOIL" ? "التحليل المنخلي للتربة" : "اختبار بروكتور",
    testTitleFr: testType,
    testTitleEn: testType,
    standard: testType === "GT_SIEVE_SOIL" ? "SOIL_SIEVE_METHOD · Draft" : "PROCTOR_METHOD · Draft",
    materialId: "SOIL-MAT-1",
    sampleId: session.samples[0].id,
    operator: "tech-1",
    status: "DRAFT",
    requiredReplicates: 1
  });
  session = addTestReplicate(session, session.tests[0].id, { sampleId: session.samples[0].id, status: "IN_PROGRESS", rawInputs });
  return session;
}

describe("geotechnical session integration", () => {
  it("persists the complete Sieve run, input, trace and details in session and JSON report", () => {
    const input = { totalSampleMassG: 1000, rows: [{ sieveMm: 2, retainedMassG: 200 }, { sieveMm: 0.063, retainedMassG: 700 }, { sieveMm: 0, retainedMassG: 100 }] };
    let session = createGeotechnicalReadySession("GT_SIEVE_SOIL", input);
    const test = session.tests[0];
    const replicate = test.replicates[0];
    const run = executeGeotechnicalLaboratoryTest("GT_SIEVE_SOIL", { runId: "GT-SESSION-RUN-1", projectId: "P-GT-1", materialId: test.materialId, sampleId: test.sampleId, operator: "tech-1", rawData: input, now: "2026-10-23T12:00:00.000Z" });
    session = recordGeotechnicalTestRun(session, test.id, replicate.id, run, "tech-1");

    expect(session.domainId).toBe("geotechnical");
    expect(session.tests[0].status).toBe("WARNING");
    expect(session.tests[0].domainRun).toMatchObject({ id: "GT-SESSION-RUN-1", domainId: "geotechnical", verificationStatus: "NEEDS_REVIEW", standard: { status: "Draft" } });
    expect(session.tests[0].domainRun?.calculationTrace.length).toBeGreaterThan(0);
    expect((session.tests[0].domainRun?.calculationDetails as { rows: unknown[] }).rows).toHaveLength(3);
    expect(session.tests[0].replicates[0].rawInputs).toEqual(input);
    expect(session.tests[0].replicates[0].domainRun?.result?.value).toBe(10);
    expect(session.tests[0].replicates[0].status).toBe("VALID");
    expect(session.tests[0].resultSummary?.mean).toBe(10);
    expect(session.tests[0].domainRun?.approval).toBeUndefined();

    const reloaded = JSON.parse(JSON.stringify(session)) as LaboratorySession;
    expect(reloaded.tests[0].domainRun?.calculationDetails).toEqual(session.tests[0].domainRun?.calculationDetails);
    const report = buildLaboratorySessionReport(reloaded, { language: "ar" });
    expect(report.tests[0].domainRun?.calculationTrace).toEqual(run.calculationTrace);
    expect(report.tests[0].domainRun?.calculationDetails).toEqual(run.calculationDetails);
    expect(report.metadata.integrityHash).toBeTruthy();
  });

  it("retains invalid Proctor evidence as BLOCKED, not as a sample failure or pass", () => {
    const input = { moldVolumeCm3: 0, points: [{ waterContentPercent: 8, wetSampleMassG: 1800 }] };
    let session = createGeotechnicalReadySession("GT_PROCTOR", input);
    const test = session.tests[0];
    const run = executeGeotechnicalLaboratoryTest("GT_PROCTOR", { runId: "GT-SESSION-RUN-2", projectId: "P-GT-1", materialId: test.materialId, sampleId: test.sampleId, operator: "tech-1", rawData: input });
    session = recordGeotechnicalTestRun(session, test.id, test.replicates[0].id, run, "tech-1");
    expect(session.tests[0].status).toBe("BLOCKED");
    expect(session.tests[0].replicates[0].status).toBe("INVALID");
    expect(session.tests[0].domainRun?.validation.valid).toBe(false);
    expect(session.tests[0].resultSummary?.validCount).toBe(0);
    expect(session.review).toBeUndefined();
  });

  it("rejects saving a geotechnical run to a session from another domain", () => {
    const input = { totalSampleMassG: 1000, rows: [{ sieveMm: 2, retainedMassG: 200 }, { sieveMm: 1, retainedMassG: 800 }] };
    const session = createLaboratorySession({ domainId: "civil_materials", requestNumber: "REQ-CIVIL" });
    const run = executeGeotechnicalLaboratoryTest("GT_SIEVE_SOIL", { runId: "GT-SESSION-RUN-3", materialId: "M-1", sampleId: "S-1", operator: "tech-1", rawData: input });
    expect(() => recordGeotechnicalTestRun(session, "test-unknown", "rep-unknown", run)).toThrow("GEOTECHNICAL_SESSION_DOMAIN_MISMATCH");
  });
});
