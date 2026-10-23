import type { LaboratoryTestDefinition } from "../types/laboratoryDomain";
import {
  calculateProctor,
  validateProctorInput,
  calculateSoilSieve,
  validateSoilSieveInput,
  type ProctorInput,
  type SoilSieveInput
} from "./geotechnicalTestEngine";

const draftStandard = (code: string) => ({
  organization: "Other" as const,
  code,
  version: "configured by laboratory",
  status: "Draft" as const,
  source: "Project or laboratory standard profile required before official acceptance."
});

export const GT_SIEVE_SOIL_DEFINITION: LaboratoryTestDefinition<SoilSieveInput> = {
  id: "GT_SIEVE_SOIL",
  domainId: "geotechnical",
  names: {
    ar: "التحليل المنخلي للتربة",
    fr: "Analyse granulométrique des sols",
    en: "Soil sieve analysis"
  },
  category: "identification",
  applicableMaterialTypes: ["soil", "fill", "subgrade", "aggregate"],
  description: "Computes retained and passing percentages with an explicit mass-balance diagnostic; it does not assign a soil class automatically.",
  standard: draftStandard("SOIL_SIEVE_METHOD"),
  inputs: [
    { key: "totalSampleMassG", label: "Total soil sample mass", unit: "g", required: true, numeric: true, min: 0.000001, dimension: "mass" },
    { key: "rows", label: "Sieve retained-mass rows", required: true },
    { key: "washLossMassG", label: "Wash loss mass", unit: "g", required: false, numeric: true, min: 0, dimension: "mass" }
  ],
  resultUnit: "% passing",
  revision: 1,
  active: true,
  validateEngineering: data => validateSoilSieveInput(data),
  calculate: data => {
    const result = calculateSoilSieve(data);
    return {
      result: result.finesPercent ?? "not_measured",
      unit: "% passing at 0.063 mm",
      trace: result.trace,
      details: result
    };
  }
};

export const GT_PROCTOR_DEFINITION: LaboratoryTestDefinition<ProctorInput> = {
  id: "GT_PROCTOR",
  domainId: "geotechnical",
  names: {
    ar: "اختبار بروكتور",
    fr: "Essai Proctor",
    en: "Proctor compaction test"
  },
  category: "compaction",
  applicableMaterialTypes: ["soil", "fill", "subgrade", "subbase"],
  description: "Computes dry-density points and identifies the measured peak; it does not decide layer compliance without a project profile.",
  standard: draftStandard("PROCTOR_METHOD"),
  inputs: [
    { key: "points", label: "Moisture-density points", required: true },
    { key: "moldVolumeCm3", label: "Mold volume", unit: "cm³", required: true, numeric: true, min: 0.000001, dimension: "volume" }
  ],
  resultUnit: "g/cm³",
  revision: 1,
  active: true,
  validateEngineering: data => validateProctorInput(data),
  calculate: data => {
    const result = calculateProctor(data);
    return {
      result: result.maximumDryDensityGPerCm3,
      unit: "g/cm³",
      trace: result.trace,
      details: result
    };
  }
};

export const GEOTECHNICAL_TEST_DEFINITIONS = [
  GT_SIEVE_SOIL_DEFINITION,
  GT_PROCTOR_DEFINITION
] as const;
