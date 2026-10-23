import type { LaboratoryStandardReference, LaboratoryTestDefinition, LaboratoryTestRun } from "../types/laboratoryDomain";
import type { RegisteredEquipment } from "./laboratoryRegistry";
import { executeDefinedLaboratoryTest } from "./laboratoryTestEngine";
import {
  CONCRETE_DOMAIN_TEST_DEFINITIONS,
  FC_SLUMP_DEFINITION,
  FC_TEMPERATURE_DEFINITION,
  HC_COMPRESSIVE_STRENGTH_DEFINITION,
  HC_SPLIT_TENSILE_DEFINITION
} from "./concreteLaboratoryTestDefinitions";

export type ConcreteLaboratoryTestId = typeof CONCRETE_DOMAIN_TEST_DEFINITIONS[number]["id"];

export interface ConcreteLaboratoryExecutionParams {
  runId: string;
  materialId: string;
  sampleId: string;
  operator: string;
  rawData: Record<string, unknown>;
  projectId?: string;
  standard?: LaboratoryStandardReference;
  equipmentIds?: string[];
  equipmentRegistry?: RegisteredEquipment[];
  now?: string;
  official?: boolean;
}

export function getConcreteLaboratoryTestDefinition(testId: string) {
  return CONCRETE_DOMAIN_TEST_DEFINITIONS.find(definition => definition.id === testId);
}

function executeDefinition<TData extends Record<string, unknown>>(
  definition: LaboratoryTestDefinition<TData>,
  params: ConcreteLaboratoryExecutionParams
): LaboratoryTestRun<Record<string, unknown>> {
  const run = executeDefinedLaboratoryTest(definition, { ...params, rawData: params.rawData as TData });
  return { ...run, domainId: definition.domainId } as LaboratoryTestRun<Record<string, unknown>>;
}

/**
 * Executes only the four existing concrete test IDs through the domain run contract.
 * The legacy material-test adapter stays outside this module for backward compatibility.
 */
export function executeConcreteLaboratoryTest(
  testId: string,
  params: ConcreteLaboratoryExecutionParams
): LaboratoryTestRun<Record<string, unknown>> | undefined {
  switch (testId) {
    case "FC_SLUMP": return executeDefinition(FC_SLUMP_DEFINITION, params);
    case "FC_TEMPERATURE": return executeDefinition(FC_TEMPERATURE_DEFINITION, params);
    case "HC_COMPRESSIVE_STRENGTH": return executeDefinition(HC_COMPRESSIVE_STRENGTH_DEFINITION, params);
    case "HC_SPLIT_TENSILE": return executeDefinition(HC_SPLIT_TENSILE_DEFINITION, params);
    default: return undefined;
  }
}
