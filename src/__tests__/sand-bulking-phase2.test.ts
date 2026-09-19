import { describe, expect, it } from "vitest";
import { calculateSandBulking } from "../services/sandBulking";
import { executeDefinedLaboratoryTest } from "../services/laboratoryTestEngine";
import { SAND_BULKING_DEFINITION } from "../services/laboratoryTestDefinitions";
import { createSandBulkingMaterialUpdateProposals } from "../services/laboratoryMaterialUpdateProposals";
import type { EngineeringMaterial } from "../types";

const validInput = {
  dryVolumeCm3: 1000,
  moistureSteps: [
    { moisturePercent: 0, volumeCm3: 1000 },
    { moisturePercent: 2, volumeCm3: 1140 },
    { moisturePercent: 4, volumeCm3: 1260 },
    { moisturePercent: 6, volumeCm3: 1280 },
    { moisturePercent: 8, volumeCm3: 1220 },
    { moisturePercent: 10, volumeCm3: 1110 },
    { moisturePercent: 15, volumeCm3: 1010 }
  ]
};

describe("Phase 2 sand bulking", () => {
  it("calculates the curve peak, peak moisture and coefficient", () => {
    const result = calculateSandBulking(validInput);
    expect(result?.validation.valid).toBe(true);
    expect(result?.maxExpansionPercent).toBe(28);
    expect(result?.peakMoisturePercent).toBe(6);
    expect(result?.sandBulkingCoefficient).toBe(1.28);
    expect(result?.curve).toHaveLength(7);
    expect(result?.trace).toHaveLength(7);
  });

  it("rejects missing, invalid or non-increasing moisture steps", () => {
    expect(calculateSandBulking({ dryVolumeCm3: 1000, moistureSteps: [] })).toBeUndefined();
    expect(calculateSandBulking({ ...validInput, moistureSteps: [{ moisturePercent: 2, volumeCm3: 1100 }, { moisturePercent: 1, volumeCm3: 1050 }] })).toBeUndefined();
    expect(calculateSandBulking({ ...validInput, moistureSteps: [{ moisturePercent: 0, volumeCm3: 1000 }, { moisturePercent: 0, volumeCm3: 1050 }] })).toBeUndefined();
  });

  it("keeps an out-of-typical curve as a valid measured result with a warning", () => {
    const result = calculateSandBulking({ dryVolumeCm3: 1000, moistureSteps: [{ moisturePercent: 0, volumeCm3: 1000 }, { moisturePercent: 2, volumeCm3: 1050 }] });
    expect(result?.validation.valid).toBe(true);
    expect(result?.validation.issues.map(item => item.code)).toContain("BULKING_OUTSIDE_TYPICAL_RANGE");
  });

  it("runs through the shared engine and creates a pending coefficient proposal", () => {
    const run = executeDefinedLaboratoryTest(SAND_BULKING_DEFINITION, {
      runId: "RUN-BULKING-PHASE2",
      materialId: "MAT-SAND-1",
      sampleId: "SMP-SAND-1",
      operator: "lab-tech",
      rawData: validInput,
      standard: { organization: "Other", code: "BS 812", version: "2026", status: "Active" },
      now: "2026-09-19T00:00:00.000Z"
    });
    expect(run.status).toBe("Calculated");
    expect(run.result?.value).toBe(28);
    const result = calculateSandBulking(validInput);
    if (!result) throw new Error("Expected valid result");
    const proposals = createSandBulkingMaterialUpdateProposals({
      material: { id: "MAT-SAND-1", name: "Sand", category: "رمال", sandBulkingCoeff: 1.2 } as unknown as EngineeringMaterial,
      testRunId: run.id,
      result,
      proposedAt: "2026-09-19T00:00:00.000Z"
    });
    expect(proposals).toHaveLength(1);
    expect(proposals[0]).toMatchObject({ propertyKey: "sandBulkingCoeff", oldValue: 1.2, newValue: 1.28, status: "Pending" });
  });
});
