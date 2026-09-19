import { describe, expect, it } from "vitest";
import { calculateFlakinessIndex } from "../services/flakinessIndex";
import { executeDefinedLaboratoryTest } from "../services/laboratoryTestEngine";
import { FLAKINESS_DEFINITION } from "../services/laboratoryTestDefinitions";
import { createFlakinessMaterialUpdateProposals } from "../services/laboratoryMaterialUpdateProposals";
import type { EngineeringMaterial } from "../types";

const validInput = {
  totalSampleMassG: 2500,
  passingBarSievesMassG: 345,
  fractions: [
    { sizeRange: "20/14", totalMassG: 1200, passingMassG: 150 },
    { sizeRange: "14/10", totalMassG: 800, passingMassG: 115 },
    { sizeRange: "10/6.3", totalMassG: 500, passingMassG: 80 }
  ],
  massBalanceToleranceG: 1
};

describe("Phase 2 flakiness index", () => {
  it("calculates flakiness from total and passing masses and reconciles fractions", () => {
    const result = calculateFlakinessIndex(validInput);
    expect(result?.validation.valid).toBe(true);
    expect(result?.flakinessIndexPercent).toBe(13.8);
    expect(result?.classification).toBe("Excellent");
    expect(result?.trace).toHaveLength(2);
  });

  it("rejects invalid masses and fraction mismatches", () => {
    expect(calculateFlakinessIndex({ ...validInput, passingBarSievesMassG: 2501 })).toBeUndefined();
    expect(calculateFlakinessIndex({ ...validInput, fractions: [{ sizeRange: "20/14", totalMassG: 1000, passingMassG: 200 }] })).toBeUndefined();
    expect(calculateFlakinessIndex({ ...validInput, fractions: [{ sizeRange: "20/14", totalMassG: 2500, passingMassG: 300 }] })).toBeUndefined();
  });

  it("retains a high flakiness result with an engineering warning", () => {
    const result = calculateFlakinessIndex({ totalSampleMassG: 1000, passingBarSievesMassG: 350 });
    expect(result?.validation.valid).toBe(true);
    expect(result?.classification).toBe("Fail");
    expect(result?.validation.issues.map(item => item.code)).toContain("HIGH_FLAKINESS_INDEX");
  });

  it("runs through the shared engine and creates a pending shape proposal", () => {
    const run = executeDefinedLaboratoryTest(FLAKINESS_DEFINITION, {
      runId: "RUN-FLAKINESS-PHASE2",
      materialId: "MAT-GRAVEL-1",
      sampleId: "SMP-GRAVEL-1",
      operator: "lab-tech",
      rawData: validInput,
      standard: { organization: "EN", code: "EN 933-3", version: "2026", status: "Active" },
      now: "2026-09-19T00:00:00.000Z"
    });
    expect(run.status).toBe("Calculated");
    expect(run.result?.value).toBe(13.8);
    const result = calculateFlakinessIndex(validInput);
    if (!result) throw new Error("Expected valid result");
    const proposals = createFlakinessMaterialUpdateProposals({
      material: { id: "MAT-GRAVEL-1", name: "Gravel", category: "حصى", flakinessIndex: 22 } as unknown as EngineeringMaterial,
      testRunId: run.id,
      result,
      proposedAt: "2026-09-19T00:00:00.000Z"
    });
    expect(proposals).toHaveLength(1);
    expect(proposals[0]).toMatchObject({ propertyKey: "flakinessIndex", oldValue: 22, newValue: 13.8, status: "Pending" });
  });
});
