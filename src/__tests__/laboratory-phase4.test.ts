import { describe, expect, it } from "vitest";
import { executeDefinedLaboratoryTest } from "../services/laboratoryTestEngine";
import { ADMIXTURE_SOLID_CONTENT_DEFINITION, ADMIXTURE_WATER_REDUCTION_DEFINITION, FIBER_DIMENSIONS_DEFINITION, FIBER_TENSILE_STRENGTH_DEFINITION, PHASE4_ADVANCED_TEST_DEFINITIONS, WATER_CHLORIDES_DEFINITION } from "../services/phase4AdvancedTestDefinitions";

describe("Phase 4 advanced laboratory definitions", () => {
  it("registers water, admixture and fiber definitions", () => {
    expect(PHASE4_ADVANCED_TEST_DEFINITIONS).toHaveLength(8);
    expect(new Set(PHASE4_ADVANCED_TEST_DEFINITIONS.map(definition => definition.category))).toEqual(new Set(["water", "admixtures", "fibers"]));
  });

  it("calculates water chloride concentration with a trace", () => {
    const run = executeDefinedLaboratoryTest(WATER_CHLORIDES_DEFINITION, { runId: "W-1", materialId: "WATER-1", sampleId: "S-1", operator: "tech", rawData: { analyteMassMg: 120, sampleVolumeL: 2 } });
    expect(run.status).toBe("Warning");
    expect(run.result).toMatchObject({ value: 60, unit: "mg/L" });
    expect(run.calculationTrace[0].formula).toContain("sample volume");
  });

  it("rejects an impossible admixture solid-content sample", () => {
    const run = executeDefinedLaboratoryTest(ADMIXTURE_SOLID_CONTENT_DEFINITION, { runId: "A-1", materialId: "ADM-1", sampleId: "S-1", operator: "tech", rawData: { sampleMassG: 100, dryMassG: 110 } });
    expect(run.status).toBe("Invalid");
    expect(run.validation.issues.map(issue => issue.code)).toContain("DRY_MASS_EXCEEDS_SAMPLE");
  });

  it("keeps negative water reduction as a review warning", () => {
    const run = executeDefinedLaboratoryTest(ADMIXTURE_WATER_REDUCTION_DEFINITION, { runId: "A-2", materialId: "ADM-1", sampleId: "S-1", operator: "tech", rawData: { referenceWaterKg: 180, admixtureWaterKg: 190 } });
    expect(run.status).toBe("Warning");
    expect(run.validation.issues.map(issue => issue.code)).toContain("WATER_REDUCTION_NEGATIVE");
  });

  it("calculates fiber aspect ratio and tensile strength", () => {
    const dimensions = executeDefinedLaboratoryTest(FIBER_DIMENSIONS_DEFINITION, { runId: "F-1", materialId: "F-1", sampleId: "S-1", operator: "tech", rawData: { lengthMm: 60, diameterMm: 0.75 } });
    const tensile = executeDefinedLaboratoryTest(FIBER_TENSILE_STRENGTH_DEFINITION, { runId: "F-2", materialId: "F-1", sampleId: "S-1", operator: "tech", rawData: { failureLoadN: 900, crossSectionAreaMm2: 0.5 } });
    expect(dimensions.result?.value).toBe(80);
    expect(tensile.result).toMatchObject({ value: 1800, unit: "MPa" });
  });
});
