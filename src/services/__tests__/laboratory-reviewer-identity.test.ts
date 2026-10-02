import { describe, expect, it } from "vitest";
import { approveLaboratoryTestRun, executeDefinedLaboratoryTest } from "../laboratoryTestEngine";
import { FRESH_CONCRETE_SLUMP_DEFINITION } from "../concreteTestDefinitions";
import type { LaboratoryIdentity } from "../../types/laboratoryDomain";

const creator: LaboratoryIdentity = {
  userId: "creator-1",
  displayName: "Test Creator",
  role: "technician",
  organizationId: "lab-1",
  authenticatedAt: "2026-10-01T08:00:00.000Z",
};
const reviewer: LaboratoryIdentity = {
  userId: "reviewer-1",
  displayName: "Authorized Reviewer",
  role: "quality-manager",
  organizationId: "lab-1",
  authenticatedAt: "2026-10-01T09:00:00.000Z",
  trustLevel: "institutional",
};

function calculatedRun() {
  return {
    ...executeDefinedLaboratoryTest(FRESH_CONCRETE_SLUMP_DEFINITION, {
      runId: "IDENTITY-1", materialId: "CONCRETE-1", sampleId: "SAMPLE-1", operator: "tech",
      rawData: { coneHeightMm: 300, measuredHeightMm: 220 },
    }),
    createdByIdentity: creator,
  };
}

describe("laboratory reviewer identity and separation of duties", () => {
  it("rejects a free-text reviewer in the official path", () => {
    expect(() => approveLaboratoryTestRun(calculatedRun(), "reviewer", "Approved", "checked", undefined, { official: true }))
      .toThrow("structured reviewer identity");
  });

  it("prevents the creator from approving the same result", () => {
    expect(() => approveLaboratoryTestRun(calculatedRun(), { ...creator, role: "quality-manager" }, "Approved", "checked", undefined, { official: true }))
      .toThrow("creator cannot approve");
  });

  it("stores the structured reviewer identity for a distinct official reviewer", () => {
    const approved = approveLaboratoryTestRun(calculatedRun(), reviewer, "Approved", "verified", undefined, { official: true });

    expect(approved.status).toBe("Approved");
    expect(approved.reviewerIdentity).toEqual(reviewer);
    expect(approved.approval?.approvedByIdentity).toEqual(reviewer);
    expect(approved.approval?.approvedBy).toBe("Authorized Reviewer");
  });

  it("keeps legacy string approval available only for compatibility mode", () => {
    const approved = approveLaboratoryTestRun(calculatedRun(), "legacy-reviewer", "Approved", "compatibility");

    expect(approved.status).toBe("Approved");
    expect(approved.reviewer).toBe("legacy-reviewer");
    expect(approved.reviewerIdentity).toBeUndefined();
  });
});
