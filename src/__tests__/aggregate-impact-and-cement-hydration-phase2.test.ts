import { describe, expect, it } from "vitest";
import { calculateAggregateImpactValue } from "../services/aggregateImpactValue";
import { calculateCementHydrationHeat } from "../services/cementHydrationHeat";
import { executeDefinedLaboratoryTest } from "../services/laboratoryTestEngine";
import { AGGREGATE_IMPACT_VALUE_DEFINITION, CEMENT_HYDRATION_HEAT_DEFINITION } from "../services/laboratoryTestDefinitions";
import { createAggregateImpactValueMaterialUpdateProposals, createCementHydrationHeatMaterialUpdateProposals } from "../services/laboratoryMaterialUpdateProposals";
import type { EngineeringMaterial } from "../types";

describe("Phase 2 aggregate impact and cement hydration heat", () => {
  it("calculates impact value and rejects passing mass above sample", () => {
    expect(calculateAggregateImpactValue({ initialMassG: 5000, passingMassG: 1100 })?.impactValuePercent).toBe(22);
    expect(calculateAggregateImpactValue({ initialMassG: 100, passingMassG: 101 })).toBeUndefined();
  });
  it("calculates heat of hydration per gram", () => {
    expect(calculateCementHydrationHeat({ cementMassG: 10, initialHeatJ: 12, finalHeatJ: 2412 })?.heatOfHydrationJPerG).toBe(240);
    expect(calculateCementHydrationHeat({ cementMassG: 10, initialHeatJ: 20, finalHeatJ: 19 })).toBeUndefined();
  });
  it("runs governed tests and creates pending proposals", () => {
    const material = { id: "MAT-2", aggregateImpactValue: 18, heatOfHydration: 220 } as unknown as EngineeringMaterial;
    const common = { materialId: material.id, sampleId: "S-2", operator: "lab", standard: { organization: "EN" as const, code: "configured", status: "Active" as const } };
    const agg = executeDefinedLaboratoryTest(AGGREGATE_IMPACT_VALUE_DEFINITION, { ...common, runId: "RUN-IMPACT", rawData: { initialMassG: 5000, passingMassG: 1100 } });
    const cem = executeDefinedLaboratoryTest(CEMENT_HYDRATION_HEAT_DEFINITION, { ...common, runId: "RUN-HEAT", rawData: { cementMassG: 10, initialHeatJ: 12, finalHeatJ: 2412 } });
    expect(agg.status).toBe("Calculated"); expect(cem.status).toBe("Calculated");
    expect(createAggregateImpactValueMaterialUpdateProposals({ material, testRunId: agg.id, result: { impactValuePercent: 22, validation: agg.validation } })[0]).toMatchObject({ propertyKey: "aggregateImpactValue", status: "Pending" });
    expect(createCementHydrationHeatMaterialUpdateProposals({ material, testRunId: cem.id, result: { heatOfHydrationJPerG: 240, validation: cem.validation } })[0]).toMatchObject({ propertyKey: "heatOfHydration", status: "Pending" });
  });
});
