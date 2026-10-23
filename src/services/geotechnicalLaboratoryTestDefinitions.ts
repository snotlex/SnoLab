import type { LaboratoryTestDefinition } from "../types/laboratoryDomain";
import {
  calculateProctor,
  validateProctorInput,
  calculateSoilSieve,
  validateSoilSieveInput,
  calculateAtterberg,
  validateAtterbergInput,
  calculateCbr,
  validateCbrInput,
  type ProctorInput,
  type SoilSieveInput,
  type AtterbergInput,
  type CbrInput
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

export const GT_ATTERBERG_DEFINITION: LaboratoryTestDefinition<AtterbergInput> = {
  id: "GT_ATTERBERG",
  domainId: "geotechnical",
  names: { ar: "حدود أتربرغ", fr: "Limites d’Atterberg", en: "Atterberg limits" },
  category: "identification",
  applicableMaterialTypes: ["soil", "fill", "subgrade"],
  description: "Diagnostic multipoint liquid limit at 25 blows, mean plastic limit, and plasticity index; it does not classify soil or establish standard compliance.",
  standard: draftStandard("ATTERBERG_MULTIPOINT_METHOD"),
  inputs: [
    { key: "liquidLimitStatus", label: "Liquid limit determination status", required: true },
    { key: "liquidLimitPoints", label: "Multipoint flow-curve readings", required: true },
    { key: "plasticLimitStatus", label: "Plastic limit determination status", required: true },
    { key: "plasticLimitWaterContentsPercent", label: "Plastic-limit determinations", required: true },
    { key: "samplePassing425Micron", label: "Specimen passing 0.425 mm sieve", required: true }
  ],
  resultUnit: "% PI or NP",
  revision: 1,
  active: true,
  validateEngineering: data => validateAtterbergInput(data),
  calculate: data => {
    const result = calculateAtterberg(data);
    return {
      result: result.plasticityStatus === "NP" ? "NP" : result.plasticityIndex as number,
      unit: result.plasticityStatus === "NP" ? "NP" : "%",
      trace: result.trace,
      details: result
    };
  }
};

export const GT_CBR_DEFINITION: LaboratoryTestDefinition<CbrInput> = {
  id: "GT_CBR",
  domainId: "geotechnical",
  names: { ar: "نسبة التحمل CBR", fr: "Indice CBR", en: "California Bearing Ratio (CBR)" },
  category: "strength",
  applicableMaterialTypes: ["soil", "fill", "subgrade", "subbase"],
  description: "Diagnostic CBR ratios at measured penetrations of 2.54 and 5.08 mm with specimen condition, molding water, dry density, piston area, soak duration and swell recorded. No single design value is selected.",
  standard: draftStandard("AASHTO_T193_CBR_REFERENCE_BASIS"),
  inputs: [
    { key: "referenceMethod", label: "Reference method", required: true },
    { key: "condition", label: "Specimen condition", required: true },
    { key: "penetrationPoints", label: "Penetration/load readings", required: true },
    { key: "pistonAreaMm2", label: "Piston area", unit: "mm²", required: true, numeric: true, min: 0.000001, dimension: "area" },
    { key: "soakDurationHours", label: "Soak duration", unit: "h", required: false, numeric: true, min: 0, dimension: "time" },
    { key: "swellPercent", label: "Measured swell", unit: "%", required: false, numeric: true, min: 0 },
    { key: "moldingWaterContentPercent", label: "Molding water content", unit: "%", required: true, numeric: true, min: 0 },
    { key: "dryDensityGPerCm3", label: "Dry density", unit: "g/cm³", required: true, numeric: true, min: 0.000001, dimension: "density" }
  ],
  resultUnit: "% at 2.54 mm / % at 5.08 mm",
  revision: 1,
  active: true,
  validateEngineering: data => validateCbrInput(data),
  calculate: data => {
    const result = calculateCbr(data);
    return {
      result: `2.54 mm: ${result.cbrAt254Percent}% · 5.08 mm: ${result.cbrAt508Percent}%`,
      unit: "% CBR (separate penetrations)",
      trace: result.trace,
      details: result
    };
  }
};

export const GEOTECHNICAL_TEST_DEFINITIONS = [
  GT_SIEVE_SOIL_DEFINITION,
  GT_PROCTOR_DEFINITION,
  GT_ATTERBERG_DEFINITION,
  GT_CBR_DEFINITION
] as const;
