import type { LaboratoryTestDefinition } from "../types/laboratoryDomain";
import { calculateSieveAnalysis, type SieveAnalysisInput } from "./aggregateSieveAnalysis";

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
