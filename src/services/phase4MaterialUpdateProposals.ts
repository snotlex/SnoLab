import type { EngineeringMaterial } from "../types";
import type { LaboratoryTestRun, MaterialUpdateProposal } from "../types/laboratoryDomain";

const PROPERTY_BY_DEFINITION: Record<string, { propertyKey: string; unit: string }> = {
  WATER_CHLORIDES_PHASE4: { propertyKey: "chloridesMgL", unit: "mg/L" },
  WATER_SULFATES_PHASE4: { propertyKey: "sulfatesMgL", unit: "mg/L" },
  WATER_TDS_PHASE4: { propertyKey: "tdsMgL", unit: "mg/L" },
  ADM_SOLID_CONTENT_PHASE4: { propertyKey: "dryExtract", unit: "%" },
  ADM_DENSITY_PHASE4: { propertyKey: "density", unit: "g/mL" },
  ADM_WATER_REDUCTION_PHASE4: { propertyKey: "waterReductionRate", unit: "%" },
  FIBER_DIMENSIONS_PHASE4: { propertyKey: "aspectRatio", unit: "-" },
  FIBER_TENSILE_PHASE4: { propertyKey: "tensileStrength", unit: "MPa" }
};

function pendingProposal(material: EngineeringMaterial, run: LaboratoryTestRun, propertyKey: string, value: number, unit: string, proposedAt: string): MaterialUpdateProposal {
  const oldValue = (material as unknown as Record<string, unknown>)[propertyKey];
  return {
    id: `MUP-${run.id}-${propertyKey}`,
    materialId: material.id,
    testRunId: run.id,
    propertyKey,
    oldValue: typeof oldValue === "number" || typeof oldValue === "string" ? oldValue : undefined,
    newValue: value,
    unit,
    status: "Pending",
    proposedAt
  };
}

export function createPhase4MaterialUpdateProposals<TData extends Record<string, unknown>>(params: {
  material: EngineeringMaterial;
  run: LaboratoryTestRun<TData>;
  proposedAt?: string;
}): MaterialUpdateProposal[] {
  const mapping = PROPERTY_BY_DEFINITION[params.run.testDefinitionId];
  const value = params.run.result?.value;
  if (!mapping || !params.run.validation.valid || typeof value !== "number" || !Number.isFinite(value)) return [];
  return [pendingProposal(params.material, params.run, mapping.propertyKey, value, mapping.unit, params.proposedAt || new Date().toISOString())];
}

export function isPhase4Definition(testDefinitionId: string): boolean {
  return testDefinitionId in PROPERTY_BY_DEFINITION;
}
