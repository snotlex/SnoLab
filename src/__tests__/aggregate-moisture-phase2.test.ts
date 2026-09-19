import { describe, expect, it } from "vitest";
import { calculateAggregateMoisture } from "../services/aggregateMoisture";
import { executeDefinedLaboratoryTest } from "../services/laboratoryTestEngine";
import { AGGREGATE_MOISTURE_DEFINITION } from "../services/laboratoryTestDefinitions";
import { createMoistureMaterialUpdateProposals } from "../services/laboratoryMaterialUpdateProposals";
import type { EngineeringMaterial } from "../types";

const validInput = {
  wetMassG: 1052.4,
  dryMassG: 1008,
  tareMassG: 120,
  absorptionPercent: 1.5,
  designAggregateDryMassKg: 1000,
  designWaterKg: 180
};

describe("Phase 2 aggregate moisture and water correction", () => {
  it("calculates dry-basis moisture and separates free water from absorption demand", () => {
    const result = calculateAggregateMoisture(validInput);
    expect(result?.validation.valid).toBe(true);
    expect(result?.netWetMassG).toBeCloseTo(932.4, 5);
    expect(result?.netDryMassG).toBe(888);
    expect(result?.waterMassG).toBeCloseTo(44.4, 5);
    expect(result?.moisturePercent).toBe(5);
    expect(result?.waterContributionPerTonKg).toBe(50);
    expect(result?.absorptionDemandPerTonKg).toBe(15);
    expect(result?.netFreeWaterContributionPerTonKg).toBe(35);
    expect(result?.correctedWaterToAddKg).toBe(145);
    expect(result?.wetAggregateBatchMassKg).toBe(1050);
    expect(result?.trace.length).toBe(6);
  });

  it("rejects a dry sample mass that is not greater than tare", () => {
    expect(calculateAggregateMoisture({ ...validInput, dryMassG: 120 })).toBeUndefined();
    expect(calculateAggregateMoisture({ ...validInput, wetMassG: 1000, dryMassG: 1008 })).toBeUndefined();
  });

  it("requires design aggregate mass before correcting design water", () => {
    const result = calculateAggregateMoisture({ ...validInput, designAggregateDryMassKg: undefined });
    expect(result).toBeUndefined();
  });

  it("runs through the shared engine and creates a pending moisture proposal", () => {
    const run = executeDefinedLaboratoryTest(AGGREGATE_MOISTURE_DEFINITION, {
      runId: "RUN-MOISTURE-PHASE2",
      materialId: "MAT-SAND-1",
      sampleId: "SMP-SAND-1",
      operator: "lab-tech",
      rawData: validInput,
      standard: { organization: "EN", code: "EN 1097-5", version: "2026", status: "Active" },
      now: "2026-09-19T00:00:00.000Z"
    });
    expect(run.status).toBe("Calculated");
    expect(run.result?.value).toBe(5);
    const result = calculateAggregateMoisture(validInput);
    if (!result) throw new Error("Expected valid result");
    const proposals = createMoistureMaterialUpdateProposals({
      material: { id: "MAT-SAND-1", name: "Sand", category: "رمال", moisture: 3 } as EngineeringMaterial,
      testRunId: run.id,
      result,
      proposedAt: "2026-09-19T00:00:00.000Z"
    });
    expect(proposals).toHaveLength(1);
    expect(proposals[0]).toMatchObject({ propertyKey: "moisture", oldValue: 3, newValue: 5, status: "Pending" });
  });
});
