import { describe, expect, it } from "vitest";
import { createLaboratorySession, addSessionSample, addSessionTest, addTestReplicate, approveLaboratorySession, buildLaboratorySessionSyncPlan, canApproveLaboratorySession, findLaboratorySessionSyncConflicts, legacyRecordToLaboratorySession, recordSampleCustodyEvent, runReadyLaboratoryTests, summarizeLaboratorySession, summarizeReplicates, validateLaboratorySession } from "../services/laboratorySessionService";
import type { MaterialTestRecord } from "../types/laboratoryTypes";

describe("Laboratory multi-test session service", () => {
  const baseSample = {
    sampleNumber: "AGG-001",
    sampleCode: "AGG-001-A",
    materialId: "MAT-SAND",
    materialName: "Washed sand",
    materialCategory: "رمال"
  };

  it("creates one session with independent tests and samples", () => {
    let session = createLaboratorySession({ id: "LAB-1", requestNumber: "LAB-2026-001", projectId: "P-1" });
    session = addSessionSample(session, baseSample);
    session = addSessionSample(session, { ...baseSample, sampleNumber: "AGG-002", sampleCode: "AGG-002-A" });
    session = addSessionTest(session, {
      testType: "AGG_SIEVE", testTitleAr: "غربلة", testTitleFr: "Tamisage", testTitleEn: "Sieve", standard: "EN 933-1",
      materialId: "MAT-SAND", sampleId: session.samples[0].id, status: "DRAFT", operator: "tech"
    });
    session = addSessionTest(session, {
      testType: "AGG_MOISTURE_CONTENT", testTitleAr: "رطوبة", testTitleFr: "Humidité", testTitleEn: "Moisture", standard: "EN 1097-5",
      materialId: "MAT-SAND", sampleId: session.samples[1].id, status: "DRAFT", operator: "tech"
    });
    expect(session.tests).toHaveLength(2);
    expect(session.samples).toHaveLength(2);
    expect(validateLaboratorySession(session).valid).toBe(true);
  });

  it("rejects duplicate sample and replicate identifiers", () => {
    let session = addSessionSample(createLaboratorySession(), baseSample);
    expect(() => addSessionSample(session, baseSample)).toThrow(/Duplicate sample/);
    session = addSessionTest(session, {
      testType: "AGG_BULK_DENSITY", testTitleAr: "كثافة", testTitleFr: "Masse", testTitleEn: "Density", standard: "EN 1097-3",
      materialId: "MAT-SAND", sampleId: session.samples[0].id, status: "DRAFT"
    });
    const testId = session.tests[0].id;
    session = addTestReplicate(session, testId, { sampleId: session.samples[0].id, specimenCode: "REP-A", status: "EMPTY", rawInputs: {} });
    expect(() => addTestReplicate(session, testId, { sampleId: session.samples[0].id, specimenCode: "REP-A", status: "EMPTY", rawInputs: {} })).toThrow(/Duplicate replicate/);
  });

  it("calculates mean and variance from valid replicates only", () => {
    let session = addSessionSample(createLaboratorySession(), baseSample);
    session = addSessionTest(session, {
      testType: "AGG_SPECIFIC_GRAVITY", testTitleAr: "كثافة حقيقية", testTitleFr: "Densité", testTitleEn: "Specific gravity", standard: "EN 1097-6",
      materialId: "MAT-SAND", sampleId: session.samples[0].id, status: "READY"
    });
    const testId = session.tests[0].id;
    for (const value of [2.61, 2.64, 2.79]) session = addTestReplicate(session, testId, { sampleId: session.samples[0].id, status: "VALID", rawInputs: {}, numericResult: value });
    const summary = summarizeReplicates(session.tests[0]);
    expect(summary.validCount).toBe(3);
    expect(summary.mean).toBeCloseTo(2.68, 5);
    expect(summary.highVariance).toBe(true);
    expect(canApproveLaboratorySession(session).allowed).toBe(false);
  });

  it("runs ready tests independently and preserves a failure beside a pass", async () => {
    let session = addSessionSample(createLaboratorySession(), baseSample);
    session = addSessionTest(session, { testType: "PASS_TEST", testTitleAr: "نجاح", testTitleFr: "Succès", testTitleEn: "Pass", standard: "Internal", materialId: "MAT-SAND", sampleId: session.samples[0].id, status: "DRAFT" });
    session = addSessionTest(session, { testType: "FAIL_TEST", testTitleAr: "فشل", testTitleFr: "Échec", testTitleEn: "Fail", standard: "Internal", materialId: "MAT-SAND", sampleId: session.samples[0].id, status: "DRAFT" });
    for (const test of session.tests) session = addTestReplicate(session, test.id, { sampleId: session.samples[0].id, status: "EMPTY", rawInputs: {} });
    session = { ...session, tests: session.tests.map(test => ({ ...test, status: "READY" as const })) };
    const result = await runReadyLaboratoryTests(session, (item) => ({ testId: item.id, status: item.testType === "PASS_TEST" ? "PASS" : "FAIL", record: { score: item.testType === "PASS_TEST" ? 95 : 20 } as MaterialTestRecord }));
    expect(result.results).toHaveLength(2);
    expect(result.session.tests.find(test => test.testType === "PASS_TEST")?.status).toBe("PASS");
    expect(result.session.tests.find(test => test.testType === "FAIL_TEST")?.status).toBe("FAIL");
    expect(summarizeLaboratorySession(result.session).passedTests).toBe(1);
  });

  it("wraps a legacy record without changing its identity or values", () => {
    const legacy = {
      id: "TEST-OLD-1", testType: "AGG_SIEVE", testTitleAr: "غربلة", testTitleFr: "Tamisage", testTitleEn: "Sieve", category: "aggregates",
      materialId: "MAT-SAND", materialName: "Sand", materialCategory: "رمال", sampleId: "S-1", operator: "tech", laboratoryName: "Lab", date: "2026-09-01", standard: "EN",
      inputs: { totalWeight: 100 }, results: { finenessModulus: 2.6 }, status: "PASS", score: 95, interpretation: "ok", complianceDetails: [], createdAt: "2026-09-01T00:00:00.000Z", updatedAt: "2026-09-01T01:00:00.000Z"
    } as MaterialTestRecord;
    const session = legacyRecordToLaboratorySession(legacy);
    expect(session.legacyRecordId).toBe(legacy.id);
    expect(session.tests[0].sourceRecordId).toBe(legacy.id);
    expect(session.tests[0].result).toEqual(legacy.results);
    expect(session.samples[0].sampleNumber).toBe(legacy.sampleId);
    expect(session.legacyDiagnosticOnly).toBe(true);
    expect(() => approveLaboratorySession(session, "reviewer")).toThrow("Legacy diagnostic sessions");
  });

  it("does not report COMPLETED when result evidence is missing", () => {
    let session = addSessionSample(createLaboratorySession({ requestNumber: "LAB-INCOMPLETE-1" }), baseSample);
    session = addSessionTest(session, { testType: "T-INCOMPLETE", testTitleAr: "ناقص", testTitleFr: "Incomplet", testTitleEn: "Incomplete", standard: "Internal", materialId: "MAT-SAND", sampleId: session.samples[0].id, status: "PASS" });
    expect(summarizeLaboratorySession(session).status).toBe("PARTIALLY_COMPLETED");
    expect(summarizeLaboratorySession(session).status).not.toBe("COMPLETED");
  });

  it("records append-only custody events with actor, location, condition and attachments", () => {
    let session = addSessionSample(createLaboratorySession({ requestNumber: "LAB-CUSTODY-1" }), baseSample, "collector");
    const sampleId = session.samples[0].id;
    session = recordSampleCustodyEvent(session, sampleId, {
      action: "HANDED_OVER", actor: "collector", timestamp: "2026-10-01T08:00:00.000Z",
      location: "Site A", condition: "Sealed and intact", attachmentIds: ["photo-1"], notes: "Transferred to courier"
    });
    session = recordSampleCustodyEvent(session, sampleId, {
      action: "RECEIVED", actor: "lab-tech", timestamp: "2026-10-01T10:00:00.000Z", location: "Lab A", condition: "Sealed"
    });
    expect(session.samples[0].custodyEvents).toHaveLength(2);
    expect(session.samples[0].custodyEvents?.[0]).toMatchObject({ action: "HANDED_OVER", location: "Site A", attachmentIds: ["photo-1"] });
    expect(session.auditLog.filter(entry => entry.action === "CUSTODY_EVENT_RECORDED")).toHaveLength(2);
  });

  it("requires completed valid tests before approval and exposes a traceable sync plan", () => {
    let session = addSessionSample(createLaboratorySession({ requestNumber: "LAB-APPROVAL-1" }), baseSample);
    session = addSessionTest(session, { testType: "T-1", testTitleAr: "اختبار", testTitleFr: "Essai", testTitleEn: "Test", standard: "Internal", materialId: "MAT-SAND", sampleId: session.samples[0].id, status: "PASS", sourceProperties: ["density"], result: { density: 2.65 } });
    session = addSessionTest(session, { testType: "T-2", testTitleAr: "اختبار ثان", testTitleFr: "Essai 2", testTitleEn: "Test 2", standard: "Internal", materialId: "MAT-SAND", sampleId: session.samples[0].id, status: "WARNING", sourceProperties: ["density"], result: { density: 2.7 } });
    const plan = buildLaboratorySessionSyncPlan(session);
    expect(plan).toHaveLength(2);
    expect(findLaboratorySessionSyncConflicts(plan)).toHaveLength(1);
    expect(canApproveLaboratorySession(session).allowed).toBe(true);
    expect(approveLaboratorySession(session, "reviewer", "Reviewed manually").status).toBe("APPROVED");
  });
});
