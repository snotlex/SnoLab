import { describe, expect, it } from "vitest";
import { canTransitionLaboratoryStatus, transitionLaboratoryStatus } from "../laboratoryLifecycle";
import type { LaboratoryTestRun } from "../../types/laboratoryDomain";

const baseRun: LaboratoryTestRun = {
  id: "LIFE-1", materialId: "MAT-1", sampleId: "SAMPLE-1", testDefinitionId: "TEST-1", testDefinitionRevision: 1,
  operator: "operator", rawData: { value: 1 }, calculationTrace: [{ stepNumber: 1, label: "x", formula: "x", substitution: "1", result: 1, inputs: { value: 1 } }],
  validation: { valid: true, issues: [] }, status: "Calculated", createdAt: "2026-10-01T00:00:00.000Z", updatedAt: "2026-10-01T00:00:00.000Z",
};
const reviewer = { userId: "reviewer", displayName: "Reviewer", role: "manager", organizationId: "lab", authenticatedAt: "2026-10-01T00:00:00.000Z" };

describe("laboratory lifecycle state machine", () => {
  it("requires verified calculation before entering Verified", () => {
    expect(canTransitionLaboratoryStatus("Calculated", "Verified", { verificationStatus: "NEEDS_REVIEW" })).toBe(false);
    expect(canTransitionLaboratoryStatus("Calculated", "Verified", { verificationStatus: "VERIFIED" })).toBe(true);
  });

  it("requires standards, equipment, trace, raw data and independent reviewer for approval", () => {
    expect(canTransitionLaboratoryStatus("Verified", "Approved", { standardReady: true, equipmentReady: true, rawDataComplete: true, tracePresent: true, verificationStatus: "VERIFIED" })).toBe(false);
    expect(canTransitionLaboratoryStatus("Verified", "Approved", { standardReady: true, equipmentReady: true, rawDataComplete: true, tracePresent: true, verificationStatus: "VERIFIED", reviewerIdentity: reviewer, creatorIdentity: { ...reviewer } })).toBe(false);
    expect(canTransitionLaboratoryStatus("Verified", "Approved", { standardReady: true, equipmentReady: true, rawDataComplete: true, tracePresent: true, verificationStatus: "VERIFIED", reviewerIdentity: reviewer, creatorIdentity: { ...reviewer, userId: "creator" } })).toBe(true);
  });

  it("rejects invalid transitions and records valid transitions", () => {
    expect(() => transitionLaboratoryStatus(baseRun, "Approved", { standardReady: true, equipmentReady: true, rawDataComplete: true, tracePresent: true, verificationStatus: "VERIFIED", reviewerIdentity: reviewer })).toThrow("Calculated -> Approved");
    const verified = transitionLaboratoryStatus(baseRun, "Verified", { verificationStatus: "VERIFIED" });
    expect(verified.status).toBe("Verified");
  });
});
