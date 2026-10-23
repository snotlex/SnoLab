import type { LaboratoryTestDefinition, LaboratoryTestRun } from "../types/laboratoryDomain";
import { GEOTECHNICAL_TEST_DEFINITIONS } from "./geotechnicalLaboratoryTestDefinitions";
import { executeDefinedLaboratoryTest } from "./laboratoryTestEngine";

const GEOTECHNICAL_DEFINITIONS = new Map<string, LaboratoryTestDefinition<Record<string, unknown>>>(
  GEOTECHNICAL_TEST_DEFINITIONS
    .map(definition => [definition.id, definition as unknown as LaboratoryTestDefinition<Record<string, unknown>>])
);

export interface GeotechnicalRunParameters {
  runId: string;
  materialId: string;
  sampleId: string;
  operator: string;
  rawData: Record<string, unknown>;
  projectId?: string;
  now?: string;
  official?: boolean;
}

/** Executes only registered geotechnical definitions through the common validation/trace/verification lifecycle. */
export function executeGeotechnicalLaboratoryTest(
  testDefinitionId: string,
  params: GeotechnicalRunParameters
): LaboratoryTestRun<Record<string, unknown>> {
  const definition = GEOTECHNICAL_DEFINITIONS.get(testDefinitionId);
  if (!definition) throw new Error(`GEOTECHNICAL_TEST_NOT_REGISTERED:${testDefinitionId}`);
  const run = executeDefinedLaboratoryTest(definition, params);
  return { ...run, domainId: "geotechnical" };
}

export function getGeotechnicalTestDefinition(testDefinitionId: string): LaboratoryTestDefinition<Record<string, unknown>> | undefined {
  return GEOTECHNICAL_DEFINITIONS.get(testDefinitionId);
}

export function listGeotechnicalTestDefinitions(): LaboratoryTestDefinition<Record<string, unknown>>[] {
  return [...GEOTECHNICAL_DEFINITIONS.values()];
}
