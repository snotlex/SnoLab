import { describe, expect, it } from "vitest";
import { calculateLosAngelesAbrasion } from "../services/losAngelesAbrasion";
import { executeDefinedLaboratoryTest } from "../services/laboratoryTestEngine";
import { LOS_ANGELES_DEFINITION } from "../services/laboratoryTestDefinitions";
import { createLosAngelesMaterialUpdateProposals } from "../services/laboratoryMaterialUpdateProposals";
import type { EngineeringMaterial } from "../types";

const validInput = {
  initialMassG: 5000,
  retainedMassOn1_6mmG: 4000,
  finesMassG: 1000,
  massBalanceToleranceG: 1
};

describe("Phase 2 Los Angeles abrasion", () => {
  it("calculates mass loss and classifies a good aggregate", () => {
    const result = calculateLosAngelesAbrasion(validInput);
    expect(result?.validation.valid).toBe(true);
    expect(result?.lostMassG).toBe(1000);
    expect(result?.losAngelesAbrasionPercent).toBe(20);
    expect(result?.classification).toBe("Exceptional");
    expect(result?.unaccountedMassG).toBe(0);
    expect(result?.trace).toHaveLength(3);
  });

  it("rejects retained mass above initial mass", () => {
    expect(calculateLosAngelesAbrasion({ ...validInput, retainedMassOn1_6mmG: 5001 })).toBeUndefined();
    expect(calculateLosAngelesAbrasion({ ...validInput, initialMassG: 0 })).toBeUndefined();
  });

  it("flags unexplained mass loss without fabricating a pass or fail", () => {
    const result = calculateLosAngelesAbrasion({ ...validInput, finesMassG: 950, massBalanceToleranceG: 1 });
    expect(result?.validation.valid).toBe(true);
    expect(result?.unaccountedMassG).toBe(50);
    expect(result?.validation.issues.map(item => item.code)).toContain("UNACCOUNTED_MASS");
  });

  it("runs through the shared engine and creates a pending abrasion proposal", () => {
    const run = executeDefinedLaboratoryTest(LOS_ANGELES_DEFINITION, {
      runId: "RUN-LA-PHASE2",
      materialId: "MAT-GRAVEL-1",
      sampleId: "SMP-GRAVEL-1",
      operator: "lab-tech",
      rawData: validInput,
      standard: { organization: "EN", code: "EN 1097-2", version: "2026", status: "Active" },
      now: "2026-09-19T00:00:00.000Z"
    });
    expect(run.status).toBe("Calculated");
    expect(run.result?.value).toBe(20);
    const result = calculateLosAngelesAbrasion(validInput);
    if (!result) throw new Error("Expected valid result");
    const proposals = createLosAngelesMaterialUpdateProposals({
      material: { id: "MAT-GRAVEL-1", name: "Gravel", category: "حصى", losAngelesAbrasion: 25 } as unknown as EngineeringMaterial,
      testRunId: run.id,
      result,
      proposedAt: "2026-09-19T00:00:00.000Z"
    });
    expect(proposals).toHaveLength(1);
    expect(proposals[0]).toMatchObject({ propertyKey: "losAngelesAbrasion", oldValue: 25, newValue: 20, status: "Pending" });
  });
});
