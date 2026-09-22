import { describe, expect, it } from "vitest";
import { calculateAggregateCrushingValue } from "../services/aggregateCrushingValue";
import { calculateCementChemicalComposition } from "../services/cementChemicalComposition";
import { executeDefinedLaboratoryTest } from "../services/laboratoryTestEngine";
import { AGGREGATE_CRUSHING_VALUE_DEFINITION, CEMENT_CHEMICAL_COMPOSITION_DEFINITION } from "../services/laboratoryTestDefinitions";
import { createAggregateCrushingValueMaterialUpdateProposals, createCementChemicalCompositionMaterialUpdateProposals } from "../services/laboratoryMaterialUpdateProposals";
import type { EngineeringMaterial } from "../types";

describe("Phase 2 aggregate crushing and cement chemistry", () => {
  it("calculates aggregate crushing value and rejects impossible mass", () => {
    expect(calculateAggregateCrushingValue({ initialMassG: 5000, crushedPassingMassG: 1250 })?.crushingValuePercent).toBe(25);
    expect(calculateAggregateCrushingValue({ initialMassG: 100, crushedPassingMassG: 101 })).toBeUndefined();
  });

  it("calculates cement chemical percentages", () => {
    const result = calculateCementChemicalComposition({ sampleMassG: 100, sulfateMassG: 2.8, chlorideMassG: 0.02, insolubleResidueMassG: 0.7, lossOnIgnitionMassG: 1.4 });
    expect(result).toMatchObject({ sulfatePercent: 2.8, chloridePercent: 0.02, insolubleResiduePercent: 0.7, lossOnIgnitionPercent: 1.4 });
    expect(result?.trace).toHaveLength(4);
    expect(calculateCementChemicalComposition({ sampleMassG: 100, sulfateMassG: 101, chlorideMassG: 0, insolubleResidueMassG: 0, lossOnIgnitionMassG: 0 })).toBeUndefined();
  });

  it("executes both tests through the governed engine and creates pending proposals", () => {
    const material = { id: "MAT-AGG-CEM", aggregateCrushingValue: 20, sulfateContent: 2, chlorideContent: 0.01, insolubleResidue: 0.5, lossOnIgnition: 1 } as unknown as EngineeringMaterial;
    const common = { materialId: material.id, sampleId: "S-1", operator: "lab", standard: { organization: "EN" as const, code: "configured", status: "Active" as const } };
    const agg = executeDefinedLaboratoryTest(AGGREGATE_CRUSHING_VALUE_DEFINITION, { ...common, runId: "RUN-AGG-CRUSH", rawData: { initialMassG: 5000, crushedPassingMassG: 1250 } });
    const cem = executeDefinedLaboratoryTest(CEMENT_CHEMICAL_COMPOSITION_DEFINITION, { ...common, runId: "RUN-CEM-CHEM", rawData: { sampleMassG: 100, sulfateMassG: 2.8, chlorideMassG: 0.02, insolubleResidueMassG: 0.7, lossOnIgnitionMassG: 1.4 } });
    expect(agg.status).toBe("Calculated");
    expect(cem.status).toBe("Calculated");
    expect(createAggregateCrushingValueMaterialUpdateProposals({ material, testRunId: agg.id, result: { crushingValuePercent: 25, validation: agg.validation } })[0]).toMatchObject({ propertyKey: "aggregateCrushingValue", status: "Pending" });
    expect(createCementChemicalCompositionMaterialUpdateProposals({ material, testRunId: cem.id, result: { sulfatePercent: 2.8, chloridePercent: 0.02, insolubleResiduePercent: 0.7, lossOnIgnitionPercent: 1.4, validation: cem.validation } })).toHaveLength(4);
  });
});
