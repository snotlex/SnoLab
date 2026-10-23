import type { LaboratoryTestDefinition } from "../types/laboratoryDomain";
import {
  calculateFreshConcreteSlump,
  calculateFreshConcreteTemperature,
  validateFreshConcreteSlumpInput,
  validateFreshConcreteTemperatureInput,
  type FreshConcreteSlumpInput,
  type FreshConcreteTemperatureInput
} from "./freshConcreteTestEngine";
import {
  calculateHardenedConcreteCompressive,
  calculateHardenedConcreteSplitTensile,
  validateHardenedConcreteCompressiveInput,
  validateHardenedConcreteSplitTensileInput,
  type HardenedConcreteCompressiveInput,
  type HardenedConcreteSplitTensileInput
} from "./hardenedConcreteTestEngine";

const draftStandard = (code: string) => ({
  organization: "Other" as const,
  code,
  version: "configured by laboratory",
  status: "Draft" as const,
  source: "Project or laboratory standard profile required before official acceptance."
});

export const FC_TEMPERATURE_DEFINITION: LaboratoryTestDefinition<FreshConcreteTemperatureInput> = {
  id: "FC_TEMPERATURE",
  domainId: "fresh_concrete",
  names: { ar: "درجة حرارة الخرسانة الطازجة", fr: "Température du béton frais", en: "Fresh concrete temperature" },
  category: "fresh_properties",
  applicableMaterialTypes: ["fresh_concrete", "concrete_batch"],
  description: "Records a batch-linked fresh concrete temperature measurement; acceptance is profile-driven.",
  standard: draftStandard("FRESH_TEMPERATURE_METHOD"),
  inputs: [
    { key: "measuredTemperatureC", label: "Measured fresh concrete temperature", unit: "°C", required: true, numeric: true, dimension: "temperature" },
    { key: "ambientTemperatureC", label: "Ambient temperature", unit: "°C", required: false, numeric: true, dimension: "temperature" },
    { key: "batchId", label: "Batch identity", required: true }
  ],
  resultUnit: "°C",
  revision: 1,
  active: true,
  validateEngineering: data => validateFreshConcreteTemperatureInput(data),
  calculate: data => {
    const result = calculateFreshConcreteTemperature(data);
    return { result: result.temperatureC, unit: "°C", trace: result.trace, details: result };
  }
};

export const FC_SLUMP_DEFINITION: LaboratoryTestDefinition<FreshConcreteSlumpInput> = {
  id: "FC_SLUMP",
  domainId: "fresh_concrete",
  names: { ar: "اختبار الهبوط", fr: "Affaissement", en: "Slump test" },
  category: "workability",
  applicableMaterialTypes: ["fresh_concrete", "concrete_batch"],
  description: "Records slump and optional target deviation; acceptance is not inferred without an active project profile.",
  standard: draftStandard("SLUMP_METHOD"),
  inputs: [
    { key: "slumpMm", label: "Measured slump", unit: "mm", required: true, numeric: true, min: 0, dimension: "length" },
    { key: "targetSlumpMm", label: "Target slump", unit: "mm", required: false, numeric: true, min: 0, dimension: "length" },
    { key: "toleranceMm", label: "Project tolerance", unit: "mm", required: false, numeric: true, min: 0, dimension: "length" },
    { key: "batchId", label: "Batch identity", required: true }
  ],
  resultUnit: "mm",
  revision: 1,
  active: true,
  validateEngineering: data => validateFreshConcreteSlumpInput(data),
  calculate: data => {
    const result = calculateFreshConcreteSlump(data);
    return { result: result.slumpMm, unit: "mm", trace: result.trace, details: result };
  }
};

export const HC_COMPRESSIVE_STRENGTH_DEFINITION: LaboratoryTestDefinition<HardenedConcreteCompressiveInput> = {
  id: "HC_COMPRESSIVE_STRENGTH",
  domainId: "hardened_concrete",
  names: { ar: "مقاومة الضغط للخرسانة المتصلدة", fr: "Résistance à la compression du béton durci", en: "Hardened concrete compressive strength" },
  category: "hardened_mechanical",
  applicableMaterialTypes: ["hardened_concrete", "concrete"],
  description: "Calculates compressive strength from failure load and loaded area; age, specimen identity, and project acceptance remain explicit.",
  standard: draftStandard("EN 12390-3"),
  inputs: [
    { key: "failureLoadKN", label: "Failure load", unit: "kN", required: true, numeric: true, min: 0, dimension: "force" },
    { key: "loadedAreaMm2", label: "Loaded area", unit: "mm²", required: true, numeric: true, min: 0, dimension: "area" },
    { key: "ageDays", label: "Specimen age", unit: "days", required: true, numeric: true, min: 0, dimension: "time" },
    { key: "specimenId", label: "Specimen identity", required: true },
    { key: "batchId", label: "Batch identity", required: true },
    { key: "targetStrengthMpa", label: "Project target strength", unit: "MPa", required: false, numeric: true, min: 0, dimension: "stress" }
  ],
  resultUnit: "MPa",
  revision: 1,
  active: true,
  validateEngineering: data => validateHardenedConcreteCompressiveInput(data),
  calculate: data => {
    const result = calculateHardenedConcreteCompressive(data);
    return { result: result.strengthMpa, unit: "MPa", trace: result.trace, details: result };
  }
};

export const HC_SPLIT_TENSILE_DEFINITION: LaboratoryTestDefinition<HardenedConcreteSplitTensileInput> = {
  id: "HC_SPLIT_TENSILE",
  domainId: "hardened_concrete",
  names: { ar: "مقاومة الشد بالانشطار للخرسانة المتصلدة", fr: "Résistance à la traction par fendage", en: "Hardened concrete splitting tensile strength" },
  category: "hardened_mechanical",
  applicableMaterialTypes: ["hardened_concrete", "concrete"],
  description: "Calculates splitting tensile strength from failure load and cylinder dimensions; project acceptance remains explicit.",
  standard: draftStandard("EN 12390-6"),
  inputs: [
    { key: "failureLoadKN", label: "Failure load", unit: "kN", required: true, numeric: true, min: 0, dimension: "force" },
    { key: "cylinderDiameterMm", label: "Cylinder diameter", unit: "mm", required: true, numeric: true, min: 0, dimension: "length" },
    { key: "cylinderLengthMm", label: "Cylinder length", unit: "mm", required: true, numeric: true, min: 0, dimension: "length" },
    { key: "ageDays", label: "Specimen age", unit: "days", required: true, numeric: true, min: 0, dimension: "time" },
    { key: "specimenId", label: "Specimen identity", required: true },
    { key: "batchId", label: "Batch identity", required: true },
    { key: "targetStrengthMpa", label: "Project target strength", unit: "MPa", required: false, numeric: true, min: 0, dimension: "stress" }
  ],
  resultUnit: "MPa",
  revision: 1,
  active: true,
  validateEngineering: data => validateHardenedConcreteSplitTensileInput(data),
  calculate: data => {
    const result = calculateHardenedConcreteSplitTensile(data);
    return { result: result.strengthMpa, unit: "MPa", trace: result.trace, details: result };
  }
};

export const CONCRETE_DOMAIN_TEST_DEFINITIONS = [
  FC_SLUMP_DEFINITION,
  FC_TEMPERATURE_DEFINITION,
  HC_COMPRESSIVE_STRENGTH_DEFINITION,
  HC_SPLIT_TENSILE_DEFINITION
] as const;
