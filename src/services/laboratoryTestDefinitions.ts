import type { LaboratoryTestDefinition } from "../types/laboratoryDomain";
import { calculateSieveAnalysis, type SieveAnalysisInput } from "./aggregateSieveAnalysis";
import { calculateAggregateSpecificGravity, validateAggregateSpecificGravity, type SpecificGravityInput } from "./aggregateSpecificGravity";
import { calculateAggregateBulkDensity, validateAggregateBulkDensity, type BulkDensityInput } from "./aggregateBulkDensity";
import { calculateAggregateMoisture, validateAggregateMoisture, type AggregateMoistureInput } from "./aggregateMoisture";
import { calculateSandEquivalent, validateSandEquivalent, type SandEquivalentInput } from "./sandEquivalent";
import { calculateSandBulking, validateSandBulking, type SandBulkingInput } from "./sandBulking";
import { calculateLosAngelesAbrasion, validateLosAngeles, type LosAngelesInput } from "./losAngelesAbrasion";
import { calculateMicroDeval, validateMicroDeval, type MicroDevalInput } from "./microDeval";
import { calculateFlakinessIndex, validateFlakiness, type FlakinessInput } from "./flakinessIndex";
import { calculateMethyleneBlue, validateMethyleneBlue, type MethyleneBlueInput } from "./methyleneBlue";
import { calculateCementSpecificGravity, validateCementSpecificGravity, type CementSpecificGravityInput } from "./cementSpecificGravity";
import { calculateBlaineFineness, validateBlaine, type BlaineInput } from "./blaineFineness";
import { calculateCementSettingTime, validateCementSettingTime, type CementSettingTimeInput } from "./cementSettingTime";
import { calculateCementSoundness, validateCementSoundness, type CementSoundnessInput } from "./cementSoundness";
import { calculateCementMortarStrength, validateCementMortarStrength, type CementMortarStrengthInput } from "./cementMortarStrength";

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

export const AGGREGATE_MOISTURE_DEFINITION: LaboratoryTestDefinition<AggregateMoistureInput> = {
  id: "AGG_MOISTURE_CONTENT_PHASE2",
  names: {
    ar: "رطوبة الركام وتصحيح ماء الخلط",
    fr: "Teneur en eau des granulats et correction de l'eau",
    en: "Aggregate Moisture and Mixing Water Correction"
  },
  category: "aggregates",
  applicableMaterialTypes: ["sand", "gravel", "aggregate", "recycled_aggregate", "lightweight_aggregate", "heavyweight_aggregate"],
  description: "Determines aggregate moisture on a dry-mass basis and separates moisture water from absorption demand for batching correction.",
  standard: {
    organization: "EN",
    code: "EN 1097-5",
    version: "configured by laboratory",
    status: "Draft",
    source: "Laboratory configuration required before acceptance classification"
  },
  inputs: [
    { key: "wetMassG", label: "Wet sample mass", unit: "g", required: true, numeric: true, min: 0, dimension: "mass" },
    { key: "dryMassG", label: "Oven-dry sample mass", unit: "g", required: true, numeric: true, min: 0, dimension: "mass" },
    { key: "tareMassG", label: "Tare mass", unit: "g", required: true, numeric: true, min: 0, dimension: "mass" },
    { key: "absorptionPercent", label: "Absorption for water correction", unit: "%", required: false, numeric: true, min: 0, dimension: "ratio" },
    { key: "designAggregateDryMassKg", label: "Design dry aggregate mass", unit: "kg", required: false, numeric: true, min: 0, dimension: "mass" },
    { key: "designWaterKg", label: "Design mixing water", unit: "kg", required: false, numeric: true, min: 0, dimension: "mass" }
  ],
  resultUnit: "%",
  revision: 1,
  active: true,
  validateEngineering: data => validateAggregateMoisture(data).issues,
  calculate: data => {
    const result = calculateAggregateMoisture(data);
    if (!result) throw new Error("Moisture inputs are physically invalid.");
    return { result: result.moisturePercent, unit: "%", trace: result.trace };
  }
};

export function runAggregateMoisturePhase2(input: AggregateMoistureInput) {
  const result = calculateAggregateMoisture(input);
  if (!result) throw new Error("Moisture inputs are physically invalid.");
  return result;
}

export const SAND_EQUIVALENT_DEFINITION: LaboratoryTestDefinition<SandEquivalentInput> = {
  id: "AGG_SAND_EQUIVALENT_PHASE2",
  names: {
    ar: "المكافئ الرملي",
    fr: "Équivalent de sable",
    en: "Sand Equivalent"
  },
  category: "aggregates",
  applicableMaterialTypes: ["sand", "fine_aggregate", "aggregate"],
  description: "Measures the relative proportion of sand to clay-like fines using piston or visual reading.",
  standard: {
    organization: "EN",
    code: "EN 933-8",
    version: "configured by laboratory",
    status: "Draft",
    source: "Laboratory configuration required before acceptance classification"
  },
  inputs: [
    { key: "totalHeightMm", label: "Total suspension height", unit: "mm", required: true, numeric: true, min: 0.000001, dimension: "length" },
    { key: "sandHeightMm", label: "Sand layer height", unit: "mm", required: true, numeric: true, min: 0, dimension: "length" },
    { key: "method", label: "Reading method", unit: "", required: true, numeric: false, dimension: "categorical" }
  ],
  resultUnit: "%",
  revision: 1,
  active: true,
  validateEngineering: data => validateSandEquivalent(data).issues,
  calculate: data => {
    const result = calculateSandEquivalent(data);
    if (!result) throw new Error("Sand-equivalent inputs are physically invalid.");
    return { result: result.sandEquivalentPercent, unit: "%", trace: result.trace };
  }
};

export function runSandEquivalentPhase2(input: SandEquivalentInput) {
  const result = calculateSandEquivalent(input);
  if (!result) throw new Error("Sand-equivalent inputs are physically invalid.");
  return result;
}

export const SAND_BULKING_DEFINITION: LaboratoryTestDefinition<SandBulkingInput> = {
  id: "AGG_BULKING_SAND_PHASE2",
  names: {
    ar: "انتفاخ الرمل بالرطوبة",
    fr: "Foisonnement du sable",
    en: "Sand Bulking Curve"
  },
  category: "aggregates",
  applicableMaterialTypes: ["sand", "fine_aggregate"],
  description: "Determines volumetric expansion of sand at increasing moisture levels and identifies peak bulking.",
  standard: {
    organization: "Other",
    code: "BS 812",
    version: "configured by laboratory",
    status: "Draft",
    source: "Laboratory configuration required before acceptance classification"
  },
  inputs: [
    { key: "dryVolumeCm3", label: "Dry reference volume", unit: "cm³", required: true, numeric: true, min: 0.000001, dimension: "volume" },
    { key: "moistureSteps", label: "Moisture-volume series", unit: "", required: true, numeric: false, dimension: "series" }
  ],
  resultUnit: "%",
  revision: 1,
  active: true,
  validateEngineering: data => validateSandBulking(data).issues,
  calculate: data => {
    const result = calculateSandBulking(data);
    if (!result) throw new Error("Sand-bulking inputs are physically invalid.");
    return { result: result.maxExpansionPercent, unit: "%", trace: result.trace };
  }
};

export function runSandBulkingPhase2(input: SandBulkingInput) {
  const result = calculateSandBulking(input);
  if (!result) throw new Error("Sand-bulking inputs are physically invalid.");
  return result;
}

export const LOS_ANGELES_DEFINITION: LaboratoryTestDefinition<LosAngelesInput> = {
  id: "AGG_LOS_ANGELES_PHASE2",
  names: {
    ar: "مقاومة التفتت بطريقة لوس أنجلوس",
    fr: "Résistance à la fragmentation Los Angeles",
    en: "Los Angeles Abrasion Resistance"
  },
  category: "aggregates",
  applicableMaterialTypes: ["gravel", "coarse_aggregate", "aggregate", "recycled_aggregate"],
  description: "Determines Los Angeles mass loss from initial and retained masses, with optional fines mass-balance verification.",
  standard: {
    organization: "EN",
    code: "EN 1097-2",
    version: "configured by laboratory",
    status: "Draft",
    source: "Laboratory configuration required before acceptance classification"
  },
  inputs: [
    { key: "initialMassG", label: "Initial test mass", unit: "g", required: true, numeric: true, min: 0.000001, dimension: "mass" },
    { key: "retainedMassOn1_6mmG", label: "Mass retained on 1.6 mm sieve", unit: "g", required: true, numeric: true, min: 0, dimension: "mass" },
    { key: "finesMassG", label: "Fines mass passing 1.6 mm", unit: "g", required: false, numeric: true, min: 0, dimension: "mass" },
    { key: "massBalanceToleranceG", label: "Mass-balance tolerance", unit: "g", required: false, numeric: true, min: 0, dimension: "mass" }
  ],
  resultUnit: "%",
  revision: 1,
  active: true,
  validateEngineering: data => validateLosAngeles(data).issues,
  calculate: data => {
    const result = calculateLosAngelesAbrasion(data);
    if (!result) throw new Error("Los Angeles inputs are physically invalid.");
    return { result: result.losAngelesAbrasionPercent, unit: "%", trace: result.trace };
  }
};

export function runLosAngelesPhase2(input: LosAngelesInput) {
  const result = calculateLosAngelesAbrasion(input);
  if (!result) throw new Error("Los Angeles inputs are physically invalid.");
  return result;
}

export const MICRO_DEVAL_DEFINITION: LaboratoryTestDefinition<MicroDevalInput> = {
  id: "AGG_MICRO_DEVAL_PHASE2",
  names: {
    ar: "مقاومة التآكل الرطب Micro-Deval",
    fr: "Résistance à l'usure en présence d'eau Micro-Deval",
    en: "Micro-Deval Wet Wear Resistance"
  },
  category: "aggregates",
  applicableMaterialTypes: ["gravel", "coarse_aggregate", "aggregate", "recycled_aggregate"],
  description: "Determines wet abrasion loss and records water condition and grading fraction.",
  standard: {
    organization: "EN",
    code: "EN 1097-1",
    version: "configured by laboratory",
    status: "Draft",
    source: "Laboratory configuration required before acceptance classification"
  },
  inputs: [
    { key: "initialMassG", label: "Initial test mass", unit: "g", required: true, numeric: true, min: 0.000001, dimension: "mass" },
    { key: "retainedMassOn1_6mmG", label: "Mass retained after wet rotation", unit: "g", required: true, numeric: true, min: 0, dimension: "mass" },
    { key: "waterVolumeMl", label: "Test water volume", unit: "ml", required: true, numeric: true, min: 0.000001, dimension: "volume" },
    { key: "gradingFraction", label: "Grading fraction", unit: "", required: false, numeric: false, dimension: "categorical" },
    { key: "abrasiveChargeG", label: "Abrasive charge", unit: "g", required: false, numeric: true, min: 0, dimension: "mass" }
  ],
  resultUnit: "%",
  revision: 1,
  active: true,
  validateEngineering: data => validateMicroDeval(data).issues,
  calculate: data => {
    const result = calculateMicroDeval(data);
    if (!result) throw new Error("Micro-Deval inputs are physically invalid.");
    return { result: result.microDevalPercent, unit: "%", trace: result.trace };
  }
};

export function runMicroDevalPhase2(input: MicroDevalInput) {
  const result = calculateMicroDeval(input);
  if (!result) throw new Error("Micro-Deval inputs are physically invalid.");
  return result;
}

export const FLAKINESS_DEFINITION: LaboratoryTestDefinition<FlakinessInput> = {
  id: "AGG_SHAPE_FLAKINESS_PHASE2",
  names: {
    ar: "مؤشر التسطح وشكل الحبيبات",
    fr: "Coefficient d'aplatissement",
    en: "Flakiness Index"
  },
  category: "aggregates",
  applicableMaterialTypes: ["gravel", "coarse_aggregate", "aggregate"],
  description: "Determines the percentage of aggregate mass passing standard bar sieves, with optional fraction reconciliation.",
  standard: {
    organization: "EN",
    code: "EN 933-3",
    version: "configured by laboratory",
    status: "Draft",
    source: "Laboratory configuration required before acceptance classification"
  },
  inputs: [
    { key: "totalSampleMassG", label: "Total sample mass", unit: "g", required: true, numeric: true, min: 0.000001, dimension: "mass" },
    { key: "passingBarSievesMassG", label: "Mass passing bar sieves", unit: "g", required: true, numeric: true, min: 0, dimension: "mass" },
    { key: "fractions", label: "Size-fraction records", unit: "", required: false, numeric: false, dimension: "series" },
    { key: "massBalanceToleranceG", label: "Mass-balance tolerance", unit: "g", required: false, numeric: true, min: 0, dimension: "mass" }
  ],
  resultUnit: "%",
  revision: 1,
  active: true,
  validateEngineering: data => validateFlakiness(data).issues,
  calculate: data => {
    const result = calculateFlakinessIndex(data);
    if (!result) throw new Error("Flakiness inputs are physically invalid.");
    return { result: result.flakinessIndexPercent, unit: "%", trace: result.trace };
  }
};

export function runFlakinessPhase2(input: FlakinessInput) {
  const result = calculateFlakinessIndex(input);
  if (!result) throw new Error("Flakiness inputs are physically invalid.");
  return result;
}

export const METHYLENE_BLUE_DEFINITION: LaboratoryTestDefinition<MethyleneBlueInput> = {
  id: "AGG_METHYLENE_BLUE_PHASE2",
  names: {
    ar: "قيمة أزرق الميثيلين للغضار",
    fr: "Valeur au bleu de méthylène",
    en: "Methylene Blue Value"
  },
  category: "aggregates",
  applicableMaterialTypes: ["sand", "fine_aggregate", "aggregate"],
  description: "Determines dye demand of the 0/2 mm fraction and records the titration endpoint condition.",
  standard: {
    organization: "EN",
    code: "EN 933-9",
    version: "configured by laboratory",
    status: "Draft",
    source: "Laboratory configuration required before acceptance classification"
  },
  inputs: [
    { key: "fraction0_2MassG", label: "0/2 mm fraction mass", unit: "g", required: true, numeric: true, min: 0.000001, dimension: "mass" },
    { key: "dyeSolutionInjectedMl", label: "Injected dye solution volume", unit: "ml", required: true, numeric: true, min: 0, dimension: "volume" },
    { key: "dyeConcentrationGPerL", label: "Dye concentration", unit: "g/L", required: true, numeric: true, min: 0.000001, dimension: "mass_concentration" },
    { key: "endpointConfirmed", label: "Titration endpoint confirmed", unit: "", required: false, numeric: false, dimension: "boolean" }
  ],
  resultUnit: "g/kg",
  revision: 1,
  active: true,
  validateEngineering: data => validateMethyleneBlue(data).issues,
  calculate: data => {
    const result = calculateMethyleneBlue(data);
    if (!result) throw new Error("Methylene Blue inputs are physically invalid.");
    return { result: result.methyleneBlueValueGPerKg, unit: "g/kg", trace: result.trace };
  }
};

export function runMethyleneBluePhase2(input: MethyleneBlueInput) {
  const result = calculateMethyleneBlue(input);
  if (!result) throw new Error("Methylene Blue inputs are physically invalid.");
  return result;
}

export const CEMENT_SPECIFIC_GRAVITY_DEFINITION: LaboratoryTestDefinition<CementSpecificGravityInput> = {
  id: "CEM_SPECIFIC_GRAVITY_PHASE2",
  names: {
    ar: "الكثافة المطلقة للإسمنت بطريقة لوشاتيليه",
    fr: "Masse volumique absolue du ciment",
    en: "Cement Specific Gravity"
  },
  category: "cement",
  applicableMaterialTypes: ["cement", "binder", "supplementary_cementitious_material"],
  description: "Determines cement density from mass and Le Chatelier flask displacement.",
  standard: {
    organization: "EN",
    code: "EN 196-6",
    version: "configured by laboratory",
    status: "Draft",
    source: "Laboratory configuration required before acceptance classification"
  },
  inputs: [
    { key: "cementMassG", label: "Cement mass", unit: "g", required: true, numeric: true, min: 0.000001, dimension: "mass" },
    { key: "initialVolumeMl", label: "Initial flask reading", unit: "ml", required: true, numeric: true, min: 0, dimension: "volume" },
    { key: "finalVolumeMl", label: "Final flask reading", unit: "ml", required: true, numeric: true, min: 0, dimension: "volume" }
  ],
  resultUnit: "g/cm³",
  revision: 1,
  active: true,
  validateEngineering: data => validateCementSpecificGravity(data).issues,
  calculate: data => {
    const result = calculateCementSpecificGravity(data);
    if (!result) throw new Error("Cement density inputs are physically invalid.");
    return { result: result.densityGPerCm3, unit: "g/cm³", trace: result.trace };
  }
};

export function runCementSpecificGravityPhase2(input: CementSpecificGravityInput) {
  const result = calculateCementSpecificGravity(input);
  if (!result) throw new Error("Cement density inputs are physically invalid.");
  return result;
}

export const BLAINE_FINENESS_DEFINITION: LaboratoryTestDefinition<BlaineInput> = {
  id: "CEM_FINENESS_BLAINE_PHASE2",
  names: {
    ar: "نعومة الإسمنت بطريقة بلين",
    fr: "Finesse Blaine du ciment",
    en: "Blaine Cement Fineness"
  },
  category: "cement",
  applicableMaterialTypes: ["cement", "binder", "supplementary_cementitious_material"],
  description: "Determines cement specific surface from calibrated apparatus constant, bed porosity, flow time and air viscosity.",
  standard: {
    organization: "EN",
    code: "EN 196-6",
    version: "configured by laboratory",
    status: "Draft",
    source: "Laboratory configuration required before acceptance classification"
  },
  inputs: [
    { key: "airFlowTimeSeconds", label: "Air-flow time", unit: "s", required: true, numeric: true, min: 0.000001, dimension: "time" },
    { key: "apparatusConstantK", label: "Calibrated apparatus constant K", unit: "", required: true, numeric: true, min: 0.000001, dimension: "calibration" },
    { key: "bedPorosityE", label: "Bed porosity", unit: "", required: true, numeric: true, min: 0.000001, max: 0.999999, dimension: "ratio" },
    { key: "cementDensityGPerCm3", label: "Cement density", unit: "g/cm³", required: true, numeric: true, min: 0.000001, dimension: "density" },
    { key: "airViscosityMicroPaS", label: "Air viscosity", unit: "µPa·s", required: true, numeric: true, min: 0.000001, dimension: "viscosity" },
    { key: "airTemperatureC", label: "Air temperature", unit: "°C", required: false, numeric: true, min: 0, max: 60, dimension: "temperature" }
  ],
  resultUnit: "cm²/g",
  revision: 1,
  active: true,
  validateEngineering: data => validateBlaine(data).issues,
  calculate: data => {
    const result = calculateBlaineFineness(data);
    if (!result) throw new Error("Blaine inputs are physically invalid.");
    return { result: result.blaineFinenessCm2PerG, unit: "cm²/g", trace: result.trace };
  }
};

export function runBlaineFinenessPhase2(input: BlaineInput) {
  const result = calculateBlaineFineness(input);
  if (!result) throw new Error("Blaine inputs are physically invalid.");
  return result;
}

export const CEMENT_SETTING_TIME_DEFINITION: LaboratoryTestDefinition<CementSettingTimeInput> = {
  id: "CEM_SETTING_TIME_PHASE2",
  names: {
    ar: "زمن الشك الابتدائي والنهائي للإسمنت",
    fr: "Temps de début et fin de prise Vicat",
    en: "Initial and Final Setting Time"
  },
  category: "cement",
  applicableMaterialTypes: ["cement", "binder"],
  description: "Identifies first and final setting from an ordered series of Vicat penetration readings.",
  standard: {
    organization: "EN",
    code: "EN 196-3",
    version: "configured by laboratory",
    status: "Draft",
    source: "Laboratory configuration required before acceptance classification"
  },
  inputs: [
    { key: "waterPercent", label: "Water percentage", unit: "%", required: true, numeric: true, min: 0.000001, max: 99.999999, dimension: "ratio" },
    { key: "roomTempC", label: "Room temperature", unit: "°C", required: true, numeric: true, min: 5, max: 40, dimension: "temperature" },
    { key: "humidityPercent", label: "Relative humidity", unit: "%", required: true, numeric: true, min: 0, max: 100, dimension: "ratio" },
    { key: "timeReadings", label: "Vicat penetration readings", unit: "", required: true, numeric: false, dimension: "series" },
    { key: "initialSetThresholdMm", label: "Initial-set threshold", unit: "mm", required: false, numeric: true, min: 0.000001, dimension: "length" },
    { key: "finalSetThresholdMm", label: "Final-set threshold", unit: "mm", required: false, numeric: true, min: 0, dimension: "length" }
  ],
  resultUnit: "min",
  revision: 1,
  active: true,
  validateEngineering: data => validateCementSettingTime(data).issues,
  calculate: data => {
    const result = calculateCementSettingTime(data);
    if (!result) throw new Error("Cement setting-time inputs are physically invalid.");
    return { result: result.initialSettingMinutes, unit: "min", trace: result.trace };
  }
};

export function runCementSettingTimePhase2(input: CementSettingTimeInput) {
  const result = calculateCementSettingTime(input);
  if (!result) throw new Error("Cement setting-time inputs are physically invalid.");
  return result;
}

export const CEMENT_SOUNDNESS_DEFINITION: LaboratoryTestDefinition<CementSoundnessInput> = {
  id: "CEM_SOUNDNESS_PHASE2",
  names: {
    ar: "ثبات الإسمنت وتمدد لوشاتيليه",
    fr: "Stabilité du ciment par expansion Le Chatelier",
    en: "Cement Soundness and Expansion"
  },
  category: "cement",
  applicableMaterialTypes: ["cement", "binder"],
  description: "Determines Le Chatelier expansion from pointer distances before and after boiling.",
  standard: {
    organization: "EN",
    code: "EN 196-3",
    version: "configured by laboratory",
    status: "Draft",
    source: "Laboratory configuration required before acceptance classification"
  },
  inputs: [
    { key: "pointerDistanceBeforeBoilingMm", label: "Pointer distance before boiling", unit: "mm", required: true, numeric: true, min: 0.000001, dimension: "length" },
    { key: "pointerDistanceAfterBoilingMm", label: "Pointer distance after boiling", unit: "mm", required: true, numeric: true, min: 0, dimension: "length" }
  ],
  resultUnit: "mm",
  revision: 1,
  active: true,
  validateEngineering: data => validateCementSoundness(data).issues,
  calculate: data => {
    const result = calculateCementSoundness(data);
    if (!result) throw new Error("Cement soundness inputs are physically invalid.");
    return { result: result.expansionMm, unit: "mm", trace: result.trace };
  }
};

export function runCementSoundnessPhase2(input: CementSoundnessInput) {
  const result = calculateCementSoundness(input);
  if (!result) throw new Error("Cement soundness inputs are physically invalid.");
  return result;
}

export const CEMENT_MORTAR_STRENGTH_DEFINITION: LaboratoryTestDefinition<CementMortarStrengthInput> = {
  id: "CEM_COMPRESSIVE_STRENGTH_PHASE2",
  names: {
    ar: "مقاومة المونة الإسمنتية للضغط",
    fr: "Résistance à la compression du mortier normalisé",
    en: "Cement Mortar Compressive Strength"
  },
  category: "cement",
  applicableMaterialTypes: ["cement", "binder"],
  description: "Converts standardized 40 × 40 mm mortar prism failure forces to mean compressive strengths at 2, 7 and 28 days.",
  standard: {
    organization: "EN",
    code: "EN 196-1",
    version: "configured by laboratory",
    status: "Draft",
    source: "Laboratory configuration required before strength-class acceptance"
  },
  inputs: [
    { key: "strength2dPrismsKn", label: "Two-day prism forces", unit: "kN", required: true, numeric: false, dimension: "force_series" },
    { key: "strength7dPrismsKn", label: "Seven-day prism forces", unit: "kN", required: true, numeric: false, dimension: "force_series" },
    { key: "strength28dPrismsKn", label: "Twenty-eight-day prism forces", unit: "kN", required: true, numeric: false, dimension: "force_series" },
    { key: "prismWidthMm", label: "Prism compression width", unit: "mm", required: false, numeric: true, min: 0.000001, dimension: "length" },
    { key: "prismDepthMm", label: "Prism compression depth", unit: "mm", required: false, numeric: true, min: 0.000001, dimension: "length" }
  ],
  resultUnit: "MPa",
  revision: 1,
  active: true,
  validateEngineering: data => validateCementMortarStrength(data).issues,
  calculate: data => {
    const result = calculateCementMortarStrength(data);
    if (!result) throw new Error("Cement mortar strength inputs are physically invalid.");
    return { result: result.strength28dMPa, unit: "MPa", trace: result.trace };
  }
};

export function runCementMortarStrengthPhase2(input: CementMortarStrengthInput) {
  const result = calculateCementMortarStrength(input);
  if (!result) throw new Error("Cement mortar strength inputs are physically invalid.");
  return result;
}
