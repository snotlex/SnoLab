import { describe, expect, it } from "vitest";
import { calculateCementSoundness } from "../services/cementSoundness";
import { executeDefinedLaboratoryTest } from "../services/laboratoryTestEngine";
import { CEMENT_SOUNDNESS_DEFINITION } from "../services/laboratoryTestDefinitions";
import { createCementSoundnessMaterialUpdateProposals } from "../services/laboratoryMaterialUpdateProposals";
import type { EngineeringMaterial } from "../types";

const validInput = {
  pointerDistanceBeforeBoilingMm: 12.5,
  pointerDistanceAfterBoilingMm: 14
};

describe("Phase 2 cement soundness", () => {
  it("calculates Le Chatelier expansion and classifies sound cement", () => {
    const result = calculateCementSoundness(validInput);
    expect(result?.validation.valid).toBe(true);
    expect(result?.expansionMm).toBe(1.5);
    expect(result?.classification).toBe("Sound");
    expect(result?.trace).toHaveLength(1);
  });

  it("rejects invalid readings and impossible negative expansion", () => {
    expect(calculateCementSoundness({ ...validInput, pointerDistanceBeforeBoilingMm: 0 })).toBeUndefined();
    expect(calculateCementSoundness({ ...validInput, pointerDistanceAfterBoilingMm: 12 })).toBeUndefined();
  });

  it("classifies expansion above 10 mm as fail", () => {
    const result = calculateCementSoundness({ pointerDistanceBeforeBoilingMm: 10, pointerDistanceAfterBoilingMm: 21 });
    expect(result?.validation.valid).toBe(true);
    expect(result?.expansionMm).toBe(11);
    expect(result?.classification).toBe("Fail");
  });

  it("runs through the shared engine and creates a pending soundness proposal", () => {
    const run = executeDefinedLaboratoryTest(CEMENT_SOUNDNESS_DEFINITION, {
      runId: "RUN-SOUNDNESS-PHASE2",
      materialId: "MAT-CEMENT-1",
      sampleId: "SMP-CEMENT-1",
      operator: "lab-tech",
      rawData: validInput,
      standard: { organization: "EN", code: "EN 196-3", version: "2026", status: "Active" },
      now: "2026-09-19T00:00:00.000Z"
    });
    expect(run.status).toBe("Calculated");
    expect(run.result?.value).toBe(1.5);
    const result = calculateCementSoundness(validInput);
    if (!result) throw new Error("Expected valid result");
    const proposals = createCementSoundnessMaterialUpdateProposals({
      material: { id: "MAT-CEMENT-1", name: "Cement", category: "إسمنت", soundness: 2 } as unknown as EngineeringMaterial,
      testRunId: run.id,
      result,
      proposedAt: "2026-09-19T00:00:00.000Z"
    });
    expect(proposals).toHaveLength(1);
    expect(proposals[0]).toMatchObject({ propertyKey: "soundness", oldValue: 2, newValue: 1.5, status: "Pending" });
  });
});
