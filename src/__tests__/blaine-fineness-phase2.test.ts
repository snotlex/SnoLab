import { describe, expect, it } from "vitest";
import { calculateBlaineFineness } from "../services/blaineFineness";
import { executeDefinedLaboratoryTest } from "../services/laboratoryTestEngine";
import { BLAINE_FINENESS_DEFINITION } from "../services/laboratoryTestDefinitions";
import { createBlaineMaterialUpdateProposals } from "../services/laboratoryMaterialUpdateProposals";
import type { EngineeringMaterial } from "../types";

const validInput = {
  airFlowTimeSeconds: 30,
  apparatusConstantK: 3500,
  bedPorosityE: 0.5,
  cementDensityGPerCm3: 3.1,
  airViscosityMicroPaS: 18,
  airTemperatureC: 23
};

describe("Phase 2 Blaine fineness", () => {
  it("calculates specific surface from the calibrated flow equation", () => {
    const result = calculateBlaineFineness(validInput);
    expect(result?.validation.valid).toBe(true);
    expect(result?.blaineFinenessCm2PerG).toBe(3259.24);
    expect(result?.blaineFinenessM2PerKg).toBe(325.92);
    expect(result?.trace).toHaveLength(3);
  });

  it("rejects invalid calibration, porosity, time or viscosity", () => {
    expect(calculateBlaineFineness({ ...validInput, apparatusConstantK: 0 })).toBeUndefined();
    expect(calculateBlaineFineness({ ...validInput, bedPorosityE: 1 })).toBeUndefined();
    expect(calculateBlaineFineness({ ...validInput, airFlowTimeSeconds: 0 })).toBeUndefined();
    expect(calculateBlaineFineness({ ...validInput, airViscosityMicroPaS: 0 })).toBeUndefined();
  });

  it("retains a valid result with a temperature warning outside the reference band", () => {
    const result = calculateBlaineFineness({ ...validInput, airTemperatureC: 35 });
    expect(result?.validation.valid).toBe(true);
    expect(result?.validation.issues.map(item => item.code)).toContain("TEMPERATURE_OUTSIDE_REFERENCE");
  });

  it("runs through the shared engine and creates a pending fineness proposal", () => {
    const run = executeDefinedLaboratoryTest(BLAINE_FINENESS_DEFINITION, {
      runId: "RUN-BLAINE-PHASE2",
      materialId: "MAT-CEMENT-1",
      sampleId: "SMP-CEMENT-1",
      operator: "lab-tech",
      rawData: validInput,
      standard: { organization: "EN", code: "EN 196-6", version: "2026", status: "Active" },
      now: "2026-09-19T00:00:00.000Z"
    });
    expect(run.status).toBe("Calculated");
    expect(run.result?.value).toBe(3259.24);
    const result = calculateBlaineFineness(validInput);
    if (!result) throw new Error("Expected valid result");
    const proposals = createBlaineMaterialUpdateProposals({
      material: { id: "MAT-CEMENT-1", name: "Cement", category: "إسمنت", blaineFineness: 3100 } as unknown as EngineeringMaterial,
      testRunId: run.id,
      result,
      proposedAt: "2026-09-19T00:00:00.000Z"
    });
    expect(proposals).toHaveLength(1);
    expect(proposals[0]).toMatchObject({ propertyKey: "blaineFineness", oldValue: 3100, newValue: 3259.24, status: "Pending" });
  });
});
