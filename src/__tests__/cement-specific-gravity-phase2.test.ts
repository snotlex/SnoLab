import { describe, expect, it } from "vitest";
import { calculateCementSpecificGravity } from "../services/cementSpecificGravity";
import { executeDefinedLaboratoryTest } from "../services/laboratoryTestEngine";
import { CEMENT_SPECIFIC_GRAVITY_DEFINITION } from "../services/laboratoryTestDefinitions";
import { createCementSpecificGravityMaterialUpdateProposals } from "../services/laboratoryMaterialUpdateProposals";
import type { EngineeringMaterial } from "../types";

const validInput = {
  cementMassG: 62,
  initialVolumeMl: 0.8,
  finalVolumeMl: 20.8
};

describe("Phase 2 cement specific gravity", () => {
  it("calculates displaced volume, density and specific gravity", () => {
    const result = calculateCementSpecificGravity(validInput);
    expect(result?.validation.valid).toBe(true);
    expect(result?.displacedVolumeMl).toBe(20);
    expect(result?.densityGPerCm3).toBe(3.1);
    expect(result?.densityKgPerM3).toBe(3100);
    expect(result?.specificGravity).toBe(3.1);
    expect(result?.trace).toHaveLength(3);
  });

  it("rejects non-positive displacement or invalid mass", () => {
    expect(calculateCementSpecificGravity({ ...validInput, finalVolumeMl: 0.8 })).toBeUndefined();
    expect(calculateCementSpecificGravity({ ...validInput, cementMassG: 0 })).toBeUndefined();
  });

  it("retains an out-of-typical density with an engineering warning", () => {
    const result = calculateCementSpecificGravity({ ...validInput, cementMassG: 80 });
    expect(result?.validation.valid).toBe(true);
    expect(result?.validation.issues.map(item => item.code)).toContain("DENSITY_OUTSIDE_TYPICAL_RANGE");
  });

  it("runs through the shared engine and creates density proposals", () => {
    const run = executeDefinedLaboratoryTest(CEMENT_SPECIFIC_GRAVITY_DEFINITION, {
      runId: "RUN-CEMENT-DENSITY-PHASE2",
      materialId: "MAT-CEMENT-1",
      sampleId: "SMP-CEMENT-1",
      operator: "lab-tech",
      rawData: validInput,
      standard: { organization: "EN", code: "EN 196-6", version: "2026", status: "Active" },
      now: "2026-09-19T00:00:00.000Z"
    });
    expect(run.status).toBe("Calculated");
    expect(run.result?.value).toBe(3.1);
    const result = calculateCementSpecificGravity(validInput);
    if (!result) throw new Error("Expected valid result");
    const proposals = createCementSpecificGravityMaterialUpdateProposals({
      material: { id: "MAT-CEMENT-1", name: "Cement", category: "إسمنت", density: 3000, specificGravity: 3 } as unknown as EngineeringMaterial,
      testRunId: run.id,
      result,
      proposedAt: "2026-09-19T00:00:00.000Z"
    });
    expect(proposals).toHaveLength(2);
    expect(proposals).toEqual(expect.arrayContaining([
      expect.objectContaining({ propertyKey: "density", oldValue: 3000, newValue: 3100, status: "Pending" }),
      expect.objectContaining({ propertyKey: "specificGravity", oldValue: 3, newValue: 3.1, status: "Pending" })
    ]));
  });
});
