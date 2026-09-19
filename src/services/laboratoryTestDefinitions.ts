import type { LaboratoryTestDefinition } from "../types/laboratoryDomain";
import { calculateSieveAnalysis, type SieveAnalysisInput } from "./aggregateSieveAnalysis";
import { calculateAggregateSpecificGravity, validateAggregateSpecificGravity, type SpecificGravityInput } from "./aggregateSpecificGravity";
import { calculateAggregateBulkDensity, validateAggregateBulkDensity, type BulkDensityInput } from "./aggregateBulkDensity";

export const SIEVE_ANALYSIS_DEFINITION: LaboratoryTestDefinition<SieveAnalysisInput> = {
  id: "AGG_SIEVE_PHASE2",
  names: {
    ar: "التحليل الحبيبي بالغربلة",
    fr: "Analyse granulométrique par tamisage",
    en: "Aggregate Sieve Analysis"
  },
  category: "aggregates",
  applicableMaterialTypes: ["sand", "gravel", "aggregate", "recycled_aggregate", "lightweight_aggregate", "heavyweight_aggregate"],
  description: "Determines retained and passing percentages, mass balance, fineness modulus and characteristic sizes from measured sieve masses.",
  standard: {
    organization: "EN",
    code: "EN 933-1",
    version: "configured by laboratory",
    status: "Draft",
    source: "Laboratory configuration required before acceptance classification"
  },
  inputs: [
    { key: "totalSampleMassG", label: "Total sample mass", unit: "g", required: true, numeric: true, min: 0.000001, dimension: "mass" },
    { key: "sieves", label: "Sieve retained-mass rows", required: true },
    { key: "finesSieveMm", label: "Fines sieve aperture", unit: "mm", required: true, numeric: true, min: 0.000001, dimension: "length" },
    { key: "massBalanceToleranceG", label: "Mass-balance tolerance", unit: "g", required: true, numeric: true, min: 0, dimension: "mass" }
  ],
  resultUnit: "%",
  revision: 1,
  active: true,
  calculate: data => {
    const result = calculateSieveAnalysis(data);
    return {
      result: result.validation.valid ? (result.finenessModulus ?? "incomplete") : "invalid",
      unit: "%",
      trace: result.trace
    };
  }
};

export function runSieveAnalysisPhase2(input: SieveAnalysisInput) {
  return calculateSieveAnalysis(input);
}

export const AGGREGATE_SPECIFIC_GRAVITY_DEFINITION: LaboratoryTestDefinition<SpecificGravityInput> = {
  id: "AGG_SPECIFIC_GRAVITY_PHASE2",
  names: {
    ar: "الكثافة النوعية والامتصاص المائي للركام",
    fr: "Masse volumique et absorption des granulats",
    en: "Aggregate Specific Gravity and Water Absorption"
  },
  category: "aggregates",
  applicableMaterialTypes: ["sand", "gravel", "aggregate", "recycled_aggregate", "lightweight_aggregate", "heavyweight_aggregate"],
  description: "Determines absolute density, SSD density and water absorption from oven-dry, SSD and pycnometer masses.",
  standard: {
    organization: "EN",
    code: "EN 1097-6",
    version: "configured by laboratory",
    status: "Draft",
    source: "Laboratory configuration required before acceptance classification"
  },
  inputs: [
    { key: "ovenDryMassG", label: "Oven-dry mass M4", unit: "g", required: true, numeric: true, min: 0.000001, dimension: "mass" },
    { key: "ssdMassG", label: "SSD mass M1", unit: "g", required: true, numeric: true, min: 0.000001, dimension: "mass" },
    { key: "pycnometerSampleWaterMassG", label: "Pycnometer + sample + water mass M2", unit: "g", required: true, numeric: true, min: 0.000001, dimension: "mass" },
    { key: "pycnometerWaterMassG", label: "Pycnometer + water mass M3", unit: "g", required: true, numeric: true, min: 0.000001, dimension: "mass" }
  ],
  resultUnit: "g/cm³",
  revision: 1,
  active: true,
  validateEngineering: data => validateAggregateSpecificGravity(data).issues,
  calculate: data => {
    const result = calculateAggregateSpecificGravity(data);
    if (!result) throw new Error("Specific-gravity inputs are physically invalid.");
    return { result: result.absoluteDensityGPerCm3, unit: "g/cm³", trace: result.trace };
  }
};

export function runAggregateSpecificGravityPhase2(input: SpecificGravityInput) {
  const result = calculateAggregateSpecificGravity(input);
  if (!result) throw new Error("Specific-gravity inputs are physically invalid.");
  return result;
}

export const AGGREGATE_BULK_DENSITY_DEFINITION: LaboratoryTestDefinition<BulkDensityInput> = {
  id: "AGG_BULK_DENSITY_PHASE2",
  names: {
    ar: "الكثافة الظاهرية السائبة والمدموكة للركام",
    fr: "Masse volumique apparente en vrac et tassée",
    en: "Aggregate Loose and Compacted Bulk Density"
  },
  category: "aggregates",
  applicableMaterialTypes: ["sand", "gravel", "aggregate", "recycled_aggregate", "lightweight_aggregate", "heavyweight_aggregate"],
  description: "Determines loose and compacted bulk density from a calibrated container and net aggregate masses.",
  standard: {
    organization: "EN",
    code: "EN 1097-3",
    version: "configured by laboratory",
    status: "Draft",
    source: "Laboratory configuration required before acceptance classification"
  },
  inputs: [
    { key: "containerVolumeLiters", label: "Container volume", unit: "L", required: true, numeric: true, min: 0.000001, dimension: "volume" },
    { key: "containerEmptyWeightKg", label: "Empty container mass", unit: "kg", required: true, numeric: true, min: 0, dimension: "mass" },
    { key: "looseFilledWeightKg", label: "Loose filled mass", unit: "kg", required: true, numeric: true, min: 0, dimension: "mass" },
    { key: "compactedWeightKg", label: "Compacted mass", unit: "kg", required: true, numeric: true, min: 0, dimension: "mass" }
  ],
  resultUnit: "kg/m³",
  revision: 1,
  active: true,
  validateEngineering: data => validateAggregateBulkDensity(data).issues,
  calculate: data => {
    const result = calculateAggregateBulkDensity(data);
    if (!result) throw new Error("Bulk-density inputs are physically invalid.");
    return { result: result.looseDensityKgM3, unit: "kg/m³", trace: result.trace };
  }
};

export function runAggregateBulkDensityPhase2(input: BulkDensityInput) {
  const result = calculateAggregateBulkDensity(input);
  if (!result) throw new Error("Bulk-density inputs are physically invalid.");
  return result;
}
