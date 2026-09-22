import { describe, expect, it } from "vitest";
import { calculateAggregateElongationIndex } from "../services/aggregateElongationIndex";
import { calculateCementFalseSet } from "../services/cementFalseSet";
import { executeDefinedLaboratoryTest } from "../services/laboratoryTestEngine";
import { AGGREGATE_ELONGATION_INDEX_DEFINITION, CEMENT_FALSE_SET_DEFINITION } from "../services/laboratoryTestDefinitions";
import { createAggregateElongationIndexMaterialUpdateProposals, createCementFalseSetMaterialUpdateProposals } from "../services/laboratoryMaterialUpdateProposals";
import type { EngineeringMaterial } from "../types";

describe("Phase 2 aggregate elongation and cement false set", () => {
  it("calculates elongation index and rejects impossible mass", () => {
    expect(calculateAggregateElongationIndex({ totalMassG: 2000, elongatedMassG: 360 })?.elongationIndexPercent).toBe(18);
    expect(calculateAggregateElongationIndex({ totalMassG: 100, elongatedMassG: 101 })).toBeUndefined();
  });
  it("calculates false-set recovery", () => {
    expect(calculateCementFalseSet({ initialPenetrationMm: 20, remixedPenetrationMm: 18 })?.recoveryPercent).toBe(90);
    expect(calculateCementFalseSet({ initialPenetrationMm: 0, remixedPenetrationMm: 18 })).toBeUndefined();
  });
  it("runs governed tests and creates pending proposals", () => {
    const material = { id: "MAT-3", elongationIndex: 12, falseSetRecovery: 95 } as unknown as EngineeringMaterial;
    const common = { materialId: material.id, sampleId: "S-3", operator: "lab", standard: { organization: "EN" as const, code: "configured", status: "Active" as const } };
    const agg = executeDefinedLaboratoryTest(AGGREGATE_ELONGATION_INDEX_DEFINITION, { ...common, runId: "RUN-ELONG", rawData: { totalMassG: 2000, elongatedMassG: 360 } });
    const cem = executeDefinedLaboratoryTest(CEMENT_FALSE_SET_DEFINITION, { ...common, runId: "RUN-FALSE-SET", rawData: { initialPenetrationMm: 20, remixedPenetrationMm: 18 } });
    expect(agg.status).toBe("Calculated"); expect(cem.status).toBe("Calculated");
    expect(createAggregateElongationIndexMaterialUpdateProposals({ material, testRunId: agg.id, result: { elongationIndexPercent: 18, validation: agg.validation } })[0]).toMatchObject({ propertyKey: "elongationIndex", status: "Pending" });
    expect(createCementFalseSetMaterialUpdateProposals({ material, testRunId: cem.id, result: { recoveryPercent: 90, validation: cem.validation } })[0]).toMatchObject({ propertyKey: "falseSetRecovery", status: "Pending" });
  });
});
