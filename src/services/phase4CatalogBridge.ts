import type { LaboratoryTestDefinition, LaboratoryTestRun } from "../types/laboratoryDomain";
import { executeDefinedLaboratoryTest } from "./laboratoryTestEngine";
import { ADMIXTURE_DENSITY_DEFINITION, ADMIXTURE_SOLID_CONTENT_DEFINITION, ADMIXTURE_WATER_REDUCTION_DEFINITION, FIBER_DIMENSIONS_DEFINITION, FIBER_TENSILE_STRENGTH_DEFINITION, WATER_CHLORIDES_DEFINITION, WATER_SULFATES_DEFINITION, WATER_TOTAL_DISSOLVED_SOLIDS_DEFINITION } from "./phase4AdvancedTestDefinitions";

export interface Phase4CatalogBridgeEntry {
  legacyId: string;
  catalogId: string;
  definition: LaboratoryTestDefinition<Record<string, unknown>>;
  normalizeInputs: (inputs: Record<string, unknown>) => Record<string, unknown>;
}

const finite = (value: unknown, fallback = 0): number => typeof value === "number" && Number.isFinite(value) ? value : fallback;
const concentration = (key: string) => (inputs: Record<string, unknown>) => ({ analyteMassMg: finite(inputs[key]), sampleVolumeL: 1 });

export const PHASE4_CATALOG_BRIDGE: readonly Phase4CatalogBridgeEntry[] = [
  { legacyId: "WATER_CHLORIDES", catalogId: "WATER_CHLORIDES", definition: WATER_CHLORIDES_DEFINITION, normalizeInputs: concentration("chloridesMgPerL") },
  { legacyId: "WATER_SULFATES", catalogId: "WATER_SULFATES", definition: WATER_SULFATES_DEFINITION, normalizeInputs: concentration("sulfatesMgPerL") },
  { legacyId: "WATER_TDS_IMPURITIES", catalogId: "WATER_TDS_IMPURITIES", definition: WATER_TOTAL_DISSOLVED_SOLIDS_DEFINITION, normalizeInputs: concentration("totalDissolvedSolidsMgPerL") },
  { legacyId: "ADM_DENSITY", catalogId: "ADM_DENSITY", definition: ADMIXTURE_DENSITY_DEFINITION, normalizeInputs: inputs => ({ sampleMassG: finite(inputs.admixtureMassG), sampleVolumeMl: finite(inputs.admixtureVolumeMl) }) },
  { legacyId: "ADM_SOLID_CONTENT", catalogId: "ADM_SOLID_CONTENT", definition: ADMIXTURE_SOLID_CONTENT_DEFINITION, normalizeInputs: inputs => ({ sampleMassG: finite(inputs.dishPlusWetAdmixtureMassG) - finite(inputs.emptyDishMassG), dryMassG: finite(inputs.dishPlusDryResidueMassG) - finite(inputs.emptyDishMassG) }) },
  { legacyId: "ADM_WATER_REDUCTION", catalogId: "ADM_WATER_REDUCTION", definition: ADMIXTURE_WATER_REDUCTION_DEFINITION, normalizeInputs: inputs => ({ referenceWaterKg: finite(inputs.controlMixWaterL), admixtureWaterKg: finite(inputs.admixedMixWaterL) }) },
  { legacyId: "FIBER_GEOMETRY", catalogId: "FIBER_GEOMETRY", definition: FIBER_DIMENSIONS_DEFINITION, normalizeInputs: inputs => ({ lengthMm: finite(inputs.lengthMm), diameterMm: finite(inputs.diameterMm) }) },
  { legacyId: "FIBER_TENSILE_STRENGTH", catalogId: "FIBER_GEOMETRY", definition: FIBER_TENSILE_STRENGTH_DEFINITION, normalizeInputs: inputs => ({ failureLoadN: finite(inputs.failureLoadN), crossSectionAreaMm2: finite(inputs.crossSectionAreaMm2) }) }
];

export function getPhase4BridgeEntry(legacyId: string): Phase4CatalogBridgeEntry | undefined {
  return PHASE4_CATALOG_BRIDGE.find(entry => entry.legacyId === legacyId);
}

export function executePhase4CatalogTest(params: {
  legacyId: string;
  inputs: Record<string, unknown>;
  runId: string;
  materialId: string;
  sampleId: string;
  operator: string;
  now?: string;
}): LaboratoryTestRun<Record<string, unknown>> {
  const entry = getPhase4BridgeEntry(params.legacyId);
  if (!entry) throw new Error(`No unified Phase 4 definition is registered for ${params.legacyId}.`);
  return executeDefinedLaboratoryTest(entry.definition, {
    runId: params.runId,
    materialId: params.materialId,
    sampleId: params.sampleId,
    operator: params.operator,
    rawData: entry.normalizeInputs(params.inputs),
    now: params.now
  });
}
