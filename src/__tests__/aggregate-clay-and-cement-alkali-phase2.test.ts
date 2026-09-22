import { describe, expect, it } from "vitest";
import { calculateAggregateClayLumps } from "../services/aggregateClayLumps";
import { calculateCementAlkaliEquivalent } from "../services/cementAlkaliEquivalent";
import { executeDefinedLaboratoryTest } from "../services/laboratoryTestEngine";
import { AGGREGATE_CLAY_LUMPS_DEFINITION, CEMENT_ALKALI_EQUIVALENT_DEFINITION } from "../services/laboratoryTestDefinitions";
import { createAggregateClayLumpsMaterialUpdateProposals, createCementAlkaliEquivalentMaterialUpdateProposals } from "../services/laboratoryMaterialUpdateProposals";
import type { EngineeringMaterial } from "../types";

describe("Phase 2 aggregate clay and cement alkali", () => {
  it("calculates clay lumps and rejects impossible mass", () => {
    expect(calculateAggregateClayLumps({ drySampleMassG: 2500, clayLumpsMassG: 37.5 })?.clayLumpsPercent).toBe(1.5);
    expect(calculateAggregateClayLumps({ drySampleMassG: 100, clayLumpsMassG: 101 })).toBeUndefined();
  });
  it("calculates equivalent alkali", () => {
    expect(calculateCementAlkaliEquivalent({ sodiumOxidePercent: 0.25, potassiumOxidePercent: 0.55 })?.alkaliEquivalentPercent).toBe(0.612);
    expect(calculateCementAlkaliEquivalent({ sodiumOxidePercent: -0.1, potassiumOxidePercent: 0.5 })).toBeUndefined();
  });
  it("runs governed tests and creates pending proposals", () => {
    const material = { id: "MAT-4", clayLumpsContent: 1, alkaliEquivalent: 0.6 } as unknown as EngineeringMaterial;
    const common = { materialId: material.id, sampleId: "S-4", operator: "lab", standard: { organization: "EN" as const, code: "configured", status: "Active" as const } };
    const agg = executeDefinedLaboratoryTest(AGGREGATE_CLAY_LUMPS_DEFINITION, { ...common, runId: "RUN-CLAY", rawData: { drySampleMassG: 2500, clayLumpsMassG: 37.5 } });
    const cem = executeDefinedLaboratoryTest(CEMENT_ALKALI_EQUIVALENT_DEFINITION, { ...common, runId: "RUN-ALKALI", rawData: { sodiumOxidePercent: 0.25, potassiumOxidePercent: 0.55 } });
    expect(agg.status).toBe("Calculated"); expect(cem.status).toBe("Calculated");
    expect(createAggregateClayLumpsMaterialUpdateProposals({ material, testRunId: agg.id, result: { clayLumpsPercent: 1.5, validation: agg.validation } })[0]).toMatchObject({ propertyKey: "clayLumpsContent", status: "Pending" });
    expect(createCementAlkaliEquivalentMaterialUpdateProposals({ material, testRunId: cem.id, result: { alkaliEquivalentPercent: 0.612, validation: cem.validation } })[0]).toMatchObject({ propertyKey: "alkaliEquivalent", status: "Pending" });
  });
});
