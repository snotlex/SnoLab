import { describe, expect, it } from "vitest";
import { calculateCementNormalConsistency } from "../services/cementNormalConsistency";
import { executeDefinedLaboratoryTest } from "../services/laboratoryTestEngine";
import { CEMENT_NORMAL_CONSISTENCY_DEFINITION } from "../services/laboratoryTestDefinitions";
import { createCementNormalConsistencyMaterialUpdateProposals } from "../services/laboratoryMaterialUpdateProposals";
import type { EngineeringMaterial } from "../types";

const validInput = {
  cementMassG: 500,
  waterVolumeMl: 138,
  plungerPenetrationMm: 6
};

describe("Phase 2 cement normal consistency", () => {
  it("calculates water percentage and identifies the standard Vicat target", () => {
    const result = calculateCementNormalConsistency(validInput);
    expect(result?.validation.valid).toBe(true);
    expect(result?.waterPercent).toBe(27.6);
    expect(result?.classification).toBe("Standard");
    expect(result?.trace).toHaveLength(2);
  });

  it("rejects invalid mass, water or negative penetration", () => {
    expect(calculateCementNormalConsistency({ ...validInput, cementMassG: 0 })).toBeUndefined();
    expect(calculateCementNormalConsistency({ ...validInput, waterVolumeMl: 0 })).toBeUndefined();
    expect(calculateCementNormalConsistency({ ...validInput, plungerPenetrationMm: -1 })).toBeUndefined();
  });

  it("retains a valid result with a warning outside the 6 ± 1 mm target", () => {
    const result = calculateCementNormalConsistency({ ...validInput, plungerPenetrationMm: 8 });
    expect(result?.validation.valid).toBe(true);
    expect(result?.classification).toBe("Outside target");
    expect(result?.validation.issues.map(item => item.code)).toContain("PENETRATION_OUTSIDE_TARGET");
  });

  it("runs through the shared engine and creates a pending water-percentage proposal", () => {
    const run = executeDefinedLaboratoryTest(CEMENT_NORMAL_CONSISTENCY_DEFINITION, {
      runId: "RUN-NORMAL-CONSISTENCY-PHASE2",
      materialId: "MAT-CEMENT-1",
      sampleId: "SMP-CEMENT-1",
      operator: "lab-tech",
      rawData: validInput,
      standard: { organization: "EN", code: "EN 196-3", version: "2026", status: "Active" },
      now: "2026-09-19T00:00:00.000Z"
    });
    expect(run.status).toBe("Calculated");
    expect(run.result?.value).toBe(27.6);
    const result = calculateCementNormalConsistency(validInput);
    if (!result) throw new Error("Expected valid result");
    const proposals = createCementNormalConsistencyMaterialUpdateProposals({
      material: { id: "MAT-CEMENT-1", name: "Cement", category: "إسمنت", normalConsistencyWaterPercent: 26 } as unknown as EngineeringMaterial,
      testRunId: run.id,
      result,
      proposedAt: "2026-09-19T00:00:00.000Z"
    });
    expect(proposals).toHaveLength(1);
    expect(proposals[0]).toMatchObject({ propertyKey: "normalConsistencyWaterPercent", oldValue: 26, newValue: 27.6, status: "Pending" });
  });
});
