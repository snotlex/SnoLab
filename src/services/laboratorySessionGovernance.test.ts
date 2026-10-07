import { describe, expect, it } from "vitest";
import { addSessionSample, addSessionTest, createLaboratorySession } from "./laboratorySessionService";
import { evaluateLaboratorySessionGovernance } from "./laboratorySessionGovernance";

function sessionWithTest() {
  let session = createLaboratorySession({ id: "GOV-1", requestNumber: "LAB-GOV-1" });
  session = addSessionSample(session, {
    sampleNumber: "S-1",
    sampleCode: "S-1-A",
    materialId: "MAT-1",
    materialName: "Aggregate",
    materialCategory: "aggregate",
    receivedAt: "2026-10-07T10:00:00.000Z",
    custodyEvents: [{ id: "C-1", action: "RECEIVED", actor: "tech", timestamp: "2026-10-07T10:00:00.000Z" }],
  });
  return addSessionTest(session, {
    testType: "AGG_SIEVE",
    testTitleAr: "التحليل المنخلي",
    testTitleFr: "Analyse granulométrique",
    testTitleEn: "Sieve analysis",
    standard: "EN 933-1:2012",
    materialId: "MAT-1",
    sampleId: session.samples[0].id,
    status: "PASS",
    requiredReplicates: 1,
  });
}

describe("laboratory session governance", () => {
  it("keeps the compatibility session diagnostic-only when official evidence is missing", () => {
    const result = evaluateLaboratorySessionGovernance(sessionWithTest());
    expect(result.official).toBe(false);
    expect(result.releaseEligibility).toBe("diagnostic_only");
    expect(result.blockingReasons).toEqual(expect.arrayContaining([
      "EQUIPMENT_CALIBRATION_SNAPSHOT_REQUIRED",
      "RAW_DATA_INCOMPLETE",
      "TRACE_REQUIRED",
      "REVIEWER_IDENTITY_REQUIRED",
      "SEPARATION_OF_DUTIES_REQUIRED",
    ]));
  });

  it("does not turn a legacy diagnostic session into an official result", () => {
    const session = { ...sessionWithTest(), legacyDiagnosticOnly: true };
    const result = evaluateLaboratorySessionGovernance(session);
    expect(result.official).toBe(false);
    expect(result.releaseEligibility).toBe("diagnostic_only");
  });
});
