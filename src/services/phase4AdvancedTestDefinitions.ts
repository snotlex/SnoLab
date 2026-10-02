import type { LaboratoryTestDefinition } from "../types/laboratoryDomain";

type WaterConcentrationInput = { analyteMassMg: number; sampleVolumeL: number };
type AdmixtureSolidInput = { sampleMassG: number; dryMassG: number };
type AdmixtureDensityInput = { sampleMassG: number; sampleVolumeMl: number };
type WaterReductionInput = { referenceWaterKg: number; admixtureWaterKg: number };
type FiberDimensionInput = { lengthMm: number; diameterMm: number };
type FiberTensileInput = { failureLoadN: number; crossSectionAreaMm2: number };
type Definition<T extends Record<string, unknown>> = LaboratoryTestDefinition<T>;

const standard = (code: string) => ({
  organization: "EN" as const,
  code,
  version: "configured by laboratory",
  status: "Draft" as const,
  source: "Acceptance requires a configured standard revision and project criteria"
});

const positive = (key: string, label: string, unit: string, dimension: string) => ({ key, label, unit, required: true, numeric: true, min: 0.000001, dimension });

function concentrationDefinition(id: string, names: { ar: string; fr: string; en: string }, code: string): Definition<WaterConcentrationInput> {
  return {
    id,
    names,
    category: "water",
    applicableMaterialTypes: ["mixing_water", "water"],
    description: "Calculates aqueous analyte concentration from measured mass and sample volume.",
    standard: standard(code),
    inputs: [positive("analyteMassMg", "Analyte mass", "mg", "mass"), positive("sampleVolumeL", "Sample volume", "L", "volume")],
    resultUnit: "mg/L",
    revision: 1,
    active: true,
    calculate: data => {
      const result = data.analyteMassMg / data.sampleVolumeL;
      return { result, unit: "mg/L", trace: [{ stepNumber: 1, label: "Concentration", formula: "analyte mass / sample volume", substitution: `${data.analyteMassMg} / ${data.sampleVolumeL}`, result, unit: "mg/L", inputs: data }] };
    }
  };
}

export const WATER_CHLORIDES_DEFINITION = concentrationDefinition(
  "WATER_CHLORIDES_PHASE4",
  { ar: "كلوريدات ماء الخلط", fr: "Chlorures de l'eau de gâchage", en: "Mixing Water Chlorides" },
  "EN 1008"
);

export const WATER_SULFATES_DEFINITION = concentrationDefinition(
  "WATER_SULFATES_PHASE4",
  { ar: "كبريتات ماء الخلط", fr: "Sulfates de l'eau de gâchage", en: "Mixing Water Sulfates" },
  "EN 1008"
);

export const WATER_TOTAL_DISSOLVED_SOLIDS_DEFINITION = concentrationDefinition(
  "WATER_TDS_PHASE4",
  { ar: "الأملاح الكلية الذائبة في ماء الخلط", fr: "Solides dissous totaux", en: "Total Dissolved Solids in Mixing Water" },
  "EN 1008"
);

export const ADMIXTURE_SOLID_CONTENT_DEFINITION: Definition<AdmixtureSolidInput> = {
  id: "ADM_SOLID_CONTENT_PHASE4",
  names: { ar: "المحتوى الصلب للإضافة الكيميائية", fr: "Extrait sec de l'adjuvant", en: "Admixture Solid Content" },
  category: "admixtures",
  applicableMaterialTypes: ["chemical_admixture", "admixture"],
  description: "Calculates dry solid content from sample and oven-dry masses.",
  standard: standard("EN 480-8"),
  inputs: [positive("sampleMassG", "Admixture sample mass", "g", "mass"), { ...positive("dryMassG", "Dry residue mass", "g", "mass"), min: 0 }],
  resultUnit: "%",
  revision: 1,
  active: true,
  validateEngineering: data => data.dryMassG > data.sampleMassG ? [{ level: "physical", severity: "error", code: "DRY_MASS_EXCEEDS_SAMPLE", field: "dryMassG", message: "Dry residue cannot exceed original sample mass." }] : [],
  calculate: data => {
    const result = data.dryMassG / data.sampleMassG * 100;
    return { result, unit: "%", trace: [{ stepNumber: 1, label: "Solid content", formula: "dry mass / sample mass × 100", substitution: `${data.dryMassG} / ${data.sampleMassG} × 100`, result, unit: "%", inputs: data }] };
  }
};

export const ADMIXTURE_DENSITY_DEFINITION: Definition<AdmixtureDensityInput> = {
  id: "ADM_DENSITY_PHASE4",
  names: { ar: "كثافة الإضافة الكيميائية", fr: "Masse volumique de l'adjuvant", en: "Admixture Density" },
  category: "admixtures",
  applicableMaterialTypes: ["chemical_admixture", "admixture"],
  description: "Calculates liquid admixture density from mass and calibrated volume.",
  standard: standard("EN 480-7"),
  inputs: [positive("sampleMassG", "Admixture sample mass", "g", "mass"), positive("sampleVolumeMl", "Sample volume", "mL", "volume")],
  resultUnit: "g/mL",
  revision: 1,
  active: true,
  calculate: data => {
    const result = data.sampleMassG / data.sampleVolumeMl;
    return { result, unit: "g/mL", trace: [{ stepNumber: 1, label: "Admixture density", formula: "mass / volume", substitution: `${data.sampleMassG} / ${data.sampleVolumeMl}`, result, unit: "g/mL", inputs: data }] };
  }
};

export const ADMIXTURE_WATER_REDUCTION_DEFINITION: Definition<WaterReductionInput> = {
  id: "ADM_WATER_REDUCTION_PHASE4",
  names: { ar: "كفاءة تخفيض ماء الإضافة", fr: "Réduction d'eau par l'adjuvant", en: "Admixture Water Reduction" },
  category: "admixtures",
  applicableMaterialTypes: ["chemical_admixture", "admixture"],
  description: "Calculates water reduction relative to a reference mixture; dosage and test age remain project inputs outside this screening result.",
  standard: standard("EN 12350-2 / EN 934-2"),
  inputs: [positive("referenceWaterKg", "Reference mixture water", "kg", "mass"), { ...positive("admixtureWaterKg", "Admixture mixture water", "kg", "mass"), min: 0 }],
  resultUnit: "%",
  revision: 1,
  active: true,
  validateEngineering: data => data.admixtureWaterKg > data.referenceWaterKg ? [{ level: "physical", severity: "warning", code: "WATER_REDUCTION_NEGATIVE", field: "admixtureWaterKg", message: "The measured mixture uses more water than the reference and requires review." }] : [],
  calculate: data => {
    const result = (data.referenceWaterKg - data.admixtureWaterKg) / data.referenceWaterKg * 100;
    return { result, unit: "%", trace: [{ stepNumber: 1, label: "Water reduction", formula: "(reference water − admixture water) / reference water × 100", substitution: `(${data.referenceWaterKg} − ${data.admixtureWaterKg}) / ${data.referenceWaterKg} × 100`, result, unit: "%", inputs: data }] };
  }
};

export const FIBER_DIMENSIONS_DEFINITION: Definition<FiberDimensionInput> = {
  id: "FIBER_DIMENSIONS_PHASE4",
  names: { ar: "أبعاد ونسبة نحافة الألياف", fr: "Dimensions et élancement des fibres", en: "Fiber Dimensions and Aspect Ratio" },
  category: "fibers",
  applicableMaterialTypes: ["fiber", "steel_fiber", "synthetic_fiber"],
  description: "Calculates fiber aspect ratio from measured length and equivalent diameter.",
  standard: standard("EN 14889-1"),
  inputs: [positive("lengthMm", "Fiber length", "mm", "length"), positive("diameterMm", "Equivalent fiber diameter", "mm", "length")],
  resultUnit: "-",
  revision: 1,
  active: true,
  calculate: data => {
    const result = data.lengthMm / data.diameterMm;
    return { result, unit: "-", trace: [{ stepNumber: 1, label: "Aspect ratio", formula: "length / diameter", substitution: `${data.lengthMm} / ${data.diameterMm}`, result, unit: "-", inputs: data }] };
  }
};

export const FIBER_TENSILE_STRENGTH_DEFINITION: Definition<FiberTensileInput> = {
  id: "FIBER_TENSILE_PHASE4",
  names: { ar: "مقاومة شد الألياف", fr: "Résistance à la traction des fibres", en: "Fiber Tensile Strength" },
  category: "fibers",
  applicableMaterialTypes: ["fiber", "steel_fiber", "synthetic_fiber"],
  description: "Calculates tensile stress from failure load and measured cross-sectional area.",
  standard: standard("EN 14889-1"),
  inputs: [positive("failureLoadN", "Failure load", "N", "force"), positive("crossSectionAreaMm2", "Cross-section area", "mm²", "area")],
  resultUnit: "MPa",
  revision: 1,
  active: true,
  calculate: data => {
    const result = data.failureLoadN / data.crossSectionAreaMm2;
    return { result, unit: "MPa", trace: [{ stepNumber: 1, label: "Fiber tensile strength", formula: "failure load / cross-sectional area", substitution: `${data.failureLoadN} / ${data.crossSectionAreaMm2}`, result, unit: "MPa", inputs: data }] };
  }
};

export const PHASE4_ADVANCED_TEST_DEFINITIONS = [
  WATER_CHLORIDES_DEFINITION,
  WATER_SULFATES_DEFINITION,
  WATER_TOTAL_DISSOLVED_SOLIDS_DEFINITION,
  ADMIXTURE_SOLID_CONTENT_DEFINITION,
  ADMIXTURE_DENSITY_DEFINITION,
  ADMIXTURE_WATER_REDUCTION_DEFINITION,
  FIBER_DIMENSIONS_DEFINITION,
  FIBER_TENSILE_STRENGTH_DEFINITION
] as const;
