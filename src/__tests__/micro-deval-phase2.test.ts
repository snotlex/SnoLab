import { describe, expect, it } from "vitest";
import { calculateMicroDeval } from "../services/microDeval";
import { executeDefinedLaboratoryTest } from "../services/laboratoryTestEngine";
import { MICRO_DEVAL_DEFINITION } from "../services/laboratoryTestDefinitions";
import { createMicroDevalMaterialUpdateProposals } from "../services/laboratoryMaterialUpdateProposals";
import type { EngineeringMaterial } from "../types";

const validInput = {
  initialMassG: 500,
  retainedMassOn1_6mmG: 400,
  waterVolumeMl: 1000,
  gradingFraction: "10/14",
  abrasiveChargeG: 5000
};

describe("Phase 2 Micro-Deval", () => {
  it("calculates wet abrasion loss and records water condition", () => {
    const result = calculateMicroDeval(validInput);
    expect(result?.validation.valid).toBe(true);
    expect(result?.lostMassG).toBe(100);
    expect(result?.microDevalPercent).toBe(20);
    expect(result?.gradingFraction).toBe("10/14");
    expect(result?.trace).toHaveLength(3);
  });

  it("rejects missing or invalid wet-test conditions", () => {
    expect(calculateMicroDeval({ ...validInput, waterVolumeMl: 0 })).toBeUndefined();
    expect(calculateMicroDeval({ ...validInput, retainedMassOn1_6mmG: 501 })).toBeUndefined();
    expect(calculateMicroDeval({ ...validInput, abrasiveChargeG: 0 })).toBeUndefined();
  });

  it("warns when the water-to-sample condition is unusually low", () => {
    const result = calculateMicroDeval({ ...validInput, waterVolumeMl: 400 });
    expect(result?.validation.valid).toBe(true);
    expect(result?.validation.issues.map(item => item.code)).toContain("LOW_WATER_TO_SAMPLE_RATIO");
  });

  it("runs through the shared engine and creates a pending MDE proposal", () => {
    const run = executeDefinedLaboratoryTest(MICRO_DEVAL_DEFINITION, {
      runId: "RUN-MDE-PHASE2",
      materialId: "MAT-GRAVEL-1",
      sampleId: "SMP-GRAVEL-1",
      operator: "lab-tech",
      rawData: validInput,
      standard: { organization: "EN", code: "EN 1097-1", version: "2026", status: "Active" },
      now: "2026-09-19T00:00:00.000Z"
    });
    expect(run.status).toBe("Calculated");
    expect(run.result?.value).toBe(20);
    const result = calculateMicroDeval(validInput);
    if (!result) throw new Error("Expected valid result");
    const proposals = createMicroDevalMaterialUpdateProposals({
      material: { id: "MAT-GRAVEL-1", name: "Gravel", category: "حصى", microDeval: 24 } as unknown as EngineeringMaterial,
      testRunId: run.id,
      result,
      proposedAt: "2026-09-19T00:00:00.000Z"
    });
    expect(proposals).toHaveLength(1);
    expect(proposals[0]).toMatchObject({ propertyKey: "microDeval", oldValue: 24, newValue: 20, status: "Pending" });
  });
});
