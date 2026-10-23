import { CONCRETE_DOMAIN_TEST_DEFINITIONS } from "./concreteLaboratoryTestDefinitions";
import { GEOTECHNICAL_TEST_DEFINITIONS } from "./geotechnicalLaboratoryTestDefinitions";

export {
  GT_SIEVE_SOIL_DEFINITION,
  GT_PROCTOR_DEFINITION,
  GEOTECHNICAL_TEST_DEFINITIONS
} from "./geotechnicalLaboratoryTestDefinitions";
export {
  CONCRETE_DOMAIN_TEST_DEFINITIONS,
  FC_SLUMP_DEFINITION,
  FC_TEMPERATURE_DEFINITION,
  HC_COMPRESSIVE_STRENGTH_DEFINITION,
  HC_SPLIT_TENSILE_DEFINITION
} from "./concreteLaboratoryTestDefinitions";

/** Compatibility aggregate for consumers that still enumerate definitions across domains. */
export const DOMAIN_LABORATORY_TEST_DEFINITIONS = [
  ...GEOTECHNICAL_TEST_DEFINITIONS,
  ...CONCRETE_DOMAIN_TEST_DEFINITIONS
] as const;
