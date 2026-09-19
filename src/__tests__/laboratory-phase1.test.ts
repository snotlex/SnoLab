import { describe, expect, it } from "vitest";
import { executeDefinedLaboratoryTest, approveLaboratoryTestRun } from "../services/laboratoryTestEngine";
import { convertLaboratoryUnit, UnitConversionError } from "../services/laboratoryUnitEngine";
import type { LaboratoryTestDefinition } from "../types/laboratoryDomain";

type DensityInput = { massG: number; volumeCm3: number };

const densityDefinition: LaboratoryTestDefinition<DensityInput> = {
  id: "DENSITY-DEMO",
  names: { ar: "الكثافة", fr: "Masse volumique", en: "Density" },
  category: "aggregates",
  applicableMaterialTypes: ["aggregate"],
  description: "Test definition used for Phase 1 engine tests.",
  standard: { organization: "Internal", code: "LAB-DENSITY", version: "1", status: "Active" },
  inputs: [
    { key: "massG", label: "Mass", unit: "g", required: true, numeric: true, min: 0 },
    { key: "volumeCm3", label: "Volume", unit: "cm3", required: true, numeric: true, min: 0 }
  ],
  resultUnit: "g/cm3",
  revision: 1,
  active: true,
  validateEngineering: data => data.volumeCm3 === 0
    ? [{ level: "physical", severity: "error", code: "ZERO_VOLUME", field: "volumeCm3", message: "Volume must be greater than zero." }]
    : [],
  calculate: data => ({
    result: data.massG / data.volumeCm3,
    unit: "g/cm3",
    trace: [{
      stepNumber: 1,
      label: "Density",
      formula: "mass / volume",
      substitution: `${data.massG} / ${data.volumeCm3}`,
      result: data.massG / data.volumeCm3,
      unit: "g/cm3",
      inputs: data
    }]
  })
};

describe("Laboratory Phase 1 shared infrastructure", () => {
  it("keeps missing raw data as Incomplete and does not calculate", () => {
    const run = executeDefinedLaboratoryTest(densityDefinition, {
      runId: "RUN-INCOMPLETE",
      materialId: "MAT-1",
      sampleId: "SMP-1",
      operator: "tech",
      rawData: { massG: 500 } as DensityInput,
      now: "2026-09-19T00:00:00.000Z"
    });
    expect(run.status).toBe("Incomplete");
    expect(run.result).toBeUndefined();
    expect(run.calculationTrace).toHaveLength(0);
  });

  it("rejects physically impossible inputs before calculation", () => {
    const run = executeDefinedLaboratoryTest(densityDefinition, {
      runId: "RUN-ZERO",
      materialId: "MAT-1",
      sampleId: "SMP-1",
      operator: "tech",
      rawData: { massG: 500, volumeCm3: 0 },
      now: "2026-09-19T00:00:00.000Z"
    });
    expect(run.status).toBe("Invalid");
    expect(run.validation.issues.map(item => item.code)).toContain("ZERO_VOLUME");
  });

  it("stores a transparent calculation trace and requires explicit approval", () => {
    const run = executeDefinedLaboratoryTest(densityDefinition, {
      runId: "RUN-VALID",
      materialId: "MAT-1",
      sampleId: "SMP-1",
      operator: "tech",
      rawData: { massG: 500, volumeCm3: 160 },
      now: "2026-09-19T00:00:00.000Z"
    });
    expect(run.status).toBe("Calculated");
    expect(run.result?.value).toBe(3.125);
    expect(run.calculationTrace[0]).toMatchObject({ formula: "mass / volume", substitution: "500 / 160" });
    expect(approveLaboratoryTestRun(run, "reviewer", "Approved", "verified against worksheet").status).toBe("Approved");
  });

  it("converts compatible units and rejects dimensional mixing", () => {
    expect(convertLaboratoryUnit(500, "g", "kg")).toBe(0.5);
    expect(convertLaboratoryUnit(3.125, "g/cm3", "kg/m3")).toBe(3125);
    expect(() => convertLaboratoryUnit(1, "kg", "cm3")).toThrow(UnitConversionError);
  });
});
