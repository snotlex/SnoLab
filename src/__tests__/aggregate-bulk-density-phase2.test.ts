import { describe, expect, it } from "vitest";
import { calculateAggregateBulkDensity } from "../services/aggregateBulkDensity";
import { executeDefinedLaboratoryTest } from "../services/laboratoryTestEngine";
import { AGGREGATE_BULK_DENSITY_DEFINITION } from "../services/laboratoryTestDefinitions";
import { createBulkDensityMaterialUpdateProposals } from "../services/laboratoryMaterialUpdateProposals";
import type { EngineeringMaterial } from "../types";

const validInput = {
  containerVolumeLiters: 10,
  containerEmptyWeightKg: 3.25,
  looseFilledWeightKg: 18.25,
  compactedWeightKg: 19.85
};

describe("Phase 2 aggregate bulk density", () => {
  it("calculates loose density, compacted density and compaction index", () => {
    const result = calculateAggregateBulkDensity(validInput);
    expect(result?.validation.valid).toBe(true);
    expect(result?.looseAggregateMassKg).toBe(15);
    expect(result?.compactedAggregateMassKg).toBe(16.6);
    expect(result?.looseDensityKgM3).toBe(1500);
    expect(result?.compactedDensityKgM3).toBe(1660);
    expect(result?.looseDensityTPerM3).toBe(1.5);
    expect(result?.compactionIndex).toBe(1.1067);
    expect(result?.trace).toHaveLength(5);
  });

  it("rejects invalid volume and net masses", () => {
    expect(calculateAggregateBulkDensity({ ...validInput, containerVolumeLiters: 0 })).toBeUndefined();
    expect(calculateAggregateBulkDensity({ ...validInput, looseFilledWeightKg: 3 })).toBeUndefined();
    expect(calculateAggregateBulkDensity({ ...validInput, compactedWeightKg: 3 })).toBeUndefined();
  });

  it("warns when compaction is lower than loose filling without fabricating a result", () => {
    const result = calculateAggregateBulkDensity({ ...validInput, compactedWeightKg: 17 });
    expect(result?.validation.valid).toBe(true);
    expect(result?.compactionIndex).toBeLessThan(1);
    expect(result?.validation.issues.map(item => item.code)).toContain("COMPACTION_LOWER_THAN_LOOSE");
  });

  it("runs through the shared engine and creates pending proposals", () => {
    const run = executeDefinedLaboratoryTest(AGGREGATE_BULK_DENSITY_DEFINITION, {
      runId: "RUN-BULK-PHASE2",
      materialId: "MAT-GRAVEL-1",
      sampleId: "SMP-GRAVEL-1",
      operator: "lab-tech",
      rawData: validInput,
      standard: { organization: "EN", code: "EN 1097-3", version: "2026", status: "Active" },
      now: "2026-09-19T00:00:00.000Z"
    });
    expect(run.status).toBe("Calculated");
    expect(run.result?.value).toBe(1500);
    const result = calculateAggregateBulkDensity(validInput);
    if (!result) throw new Error("Expected valid result");
    const proposals = createBulkDensityMaterialUpdateProposals({
      material: { id: "MAT-GRAVEL-1", name: "Gravel", category: "حصى", bulkDensity: 1450 } as EngineeringMaterial,
      testRunId: run.id,
      result,
      proposedAt: "2026-09-19T00:00:00.000Z"
    });
    expect(proposals.map(item => item.propertyKey)).toEqual(["bulkDensity", "compactedBulkDensity", "compactionIndex"]);
    expect(proposals.every(item => item.status === "Pending")).toBe(true);
  });
});
