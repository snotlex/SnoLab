import { describe, expect, it } from "vitest";
import { calculateAggregateSpecificGravity } from "../services/aggregateSpecificGravity";
import { executeDefinedLaboratoryTest } from "../services/laboratoryTestEngine";
import { AGGREGATE_SPECIFIC_GRAVITY_DEFINITION } from "../services/laboratoryTestDefinitions";
import { createSpecificGravityMaterialUpdateProposals } from "../services/laboratoryMaterialUpdateProposals";
import type { EngineeringMaterial } from "../types";

const validInput = {
  ovenDryMassG: 495.2,
  ssdMassG: 504.8,
  pycnometerSampleWaterMassG: 1782.4,
  pycnometerWaterMassG: 1471.2
};

describe("Phase 2 aggregate specific gravity and absorption", () => {
  it("calculates absolute density, SSD density and absorption with trace", () => {
    const result = calculateAggregateSpecificGravity(validInput);
    expect(result?.validation.valid).toBe(true);
    expect(result?.displacedVolumeCm3).toBe(184);
    expect(result?.ssdVolumeCm3).toBe(193.6);
    expect(result?.absoluteDensityGPerCm3).toBe(2.6913);
    expect(result?.absoluteDensityKgM3).toBe(2691.3);
    expect(result?.ssdDensityGPerCm3).toBe(2.6074);
    expect(result?.waterAbsorptionPercent).toBe(1.939);
    expect(result?.trace).toHaveLength(4);
  });

  it("rejects SSD mass below oven-dry mass", () => {
    const result = calculateAggregateSpecificGravity({ ...validInput, ssdMassG: 490 });
    expect(result).toBeUndefined();
  });

  it("rejects a non-positive displaced volume", () => {
    const result = calculateAggregateSpecificGravity({ ...validInput, pycnometerSampleWaterMassG: 2200 });
    expect(result).toBeUndefined();
  });

  it("runs through the shared engine and creates pending material proposals", () => {
    const run = executeDefinedLaboratoryTest(AGGREGATE_SPECIFIC_GRAVITY_DEFINITION, {
      runId: "RUN-SG-PHASE2",
      materialId: "MAT-GRAVEL-1",
      sampleId: "SMP-GRAVEL-1",
      operator: "lab-tech",
      rawData: validInput,
      standard: { organization: "EN", code: "EN 1097-6", version: "2026", status: "Active" },
      now: "2026-09-19T00:00:00.000Z"
    });
    expect(run.status).toBe("Calculated");
    expect(run.result?.value).toBe(2.6913);
    expect(run.calculationTrace).toHaveLength(4);

    const result = calculateAggregateSpecificGravity(validInput);
    if (!result) throw new Error("Expected valid result");
    const proposals = createSpecificGravityMaterialUpdateProposals({
      material: { id: "MAT-GRAVEL-1", name: "Gravel", category: "حصى", density: 2600 } as EngineeringMaterial,
      testRunId: run.id,
      result,
      proposedAt: "2026-09-19T00:00:00.000Z"
    });
    expect(proposals.map(item => item.propertyKey)).toEqual(["specificGravity", "density", "ssdDensity", "absorption"]);
    expect(proposals.every(item => item.status === "Pending")).toBe(true);
  });
});
