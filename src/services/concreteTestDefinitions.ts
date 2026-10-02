import type { LaboratoryTestDefinition, ValidationIssue } from "../types/laboratoryDomain";

type FreshSlumpInput = { coneHeightMm: number; measuredHeightMm: number };
type FreshDensityInput = { containerVolumeL: number; emptyMassKg: number; filledMassKg: number };
type FreshAirInput = { airContentPercent: number };
type HardenedStrengthInput = { failureLoadKN: number; loadedAreaMm2: number };
type MortarFlowInput = { referenceDiameterMm: number; measuredDiameterMm: number };

type Definition<T extends Record<string, unknown>> = LaboratoryTestDefinition<T>;

const standard = (code: string, organization: "EN" | "ASTM" = "EN") => ({
  organization,
  code,
  version: "configured by laboratory",
  status: "Draft" as const,
  source: "Acceptance requires a configured standard revision and project criteria"
});

const positive = (field: string, label: string, unit: string, dimension: string) => ({
  key: field, label, unit, required: true, numeric: true, min: 0.000001, dimension
});

export const FRESH_CONCRETE_SLUMP_DEFINITION: Definition<FreshSlumpInput> = {
  id: "FRESH_SLUMP_PHASE2",
  names: { ar: "اختبار هبوط الخرسانة الطازجة", fr: "Affaissement du béton frais", en: "Fresh Concrete Slump" },
  category: "fresh-concrete",
  applicableMaterialTypes: ["fresh_concrete", "concrete"],
  description: "Calculates slump from cone height and measured concrete height; acceptance remains project-specific.",
  standard: standard("EN 12350-2"),
  inputs: [positive("coneHeightMm", "Cone height", "mm", "length"), positive("measuredHeightMm", "Measured concrete height", "mm", "length")],
  resultUnit: "mm",
  revision: 1,
  active: true,
  validateEngineering: data => data.measuredHeightMm > data.coneHeightMm
    ? [{ level: "physical", severity: "error", code: "SLUMP_HEIGHT_EXCEEDS_CONE", field: "measuredHeightMm", message: "Measured concrete height cannot exceed cone height." }]
    : [],
  calculate: data => {
    const result = data.coneHeightMm - data.measuredHeightMm;
    return { result, unit: "mm", trace: [{ stepNumber: 1, label: "Slump", formula: "cone height − measured height", substitution: `${data.coneHeightMm} − ${data.measuredHeightMm}`, result, unit: "mm", inputs: data }] };
  }
};

export const FRESH_CONCRETE_DENSITY_DEFINITION: Definition<FreshDensityInput> = {
  id: "FRESH_DENSITY_PHASE2",
  names: { ar: "الكثافة الحجمية للخرسانة الطازجة", fr: "Masse volumique du béton frais", en: "Fresh Concrete Density" },
  category: "fresh-concrete",
  applicableMaterialTypes: ["fresh_concrete", "concrete"],
  description: "Calculates fresh concrete density from calibrated container mass and volume.",
  standard: standard("EN 12350-6"),
  inputs: [positive("containerVolumeL", "Container volume", "L", "volume"), positive("emptyMassKg", "Empty container mass", "kg", "mass"), { ...positive("filledMassKg", "Filled container mass", "kg", "mass"), min: 0 }],
  resultUnit: "kg/m³",
  revision: 1,
  active: true,
  validateEngineering: data => data.filledMassKg < data.emptyMassKg
    ? [{ level: "physical", severity: "error", code: "FILLED_MASS_BELOW_TARE", field: "filledMassKg", message: "Filled mass cannot be below empty container mass." }]
    : [],
  calculate: data => {
    const netMassKg = data.filledMassKg - data.emptyMassKg;
    const result = netMassKg / (data.containerVolumeL / 1000);
    return { result, unit: "kg/m³", trace: [{ stepNumber: 1, label: "Net mass", formula: "filled mass − empty mass", substitution: `${data.filledMassKg} − ${data.emptyMassKg}`, result: netMassKg, unit: "kg", inputs: data }, { stepNumber: 2, label: "Fresh density", formula: "net mass / volume", substitution: `${netMassKg} / ${data.containerVolumeL / 1000}`, result, unit: "kg/m³", inputs: data }] };
  }
};

export const FRESH_CONCRETE_AIR_CONTENT_DEFINITION: Definition<FreshAirInput> = {
  id: "FRESH_AIR_CONTENT_PHASE2",
  names: { ar: "محتوى الهواء في الخرسانة الطازجة", fr: "Teneur en air du béton frais", en: "Fresh Concrete Air Content" },
  category: "fresh-concrete",
  applicableMaterialTypes: ["fresh_concrete", "concrete"],
  description: "Records a calibrated air-content reading without imposing a universal project acceptance limit.",
  standard: standard("EN 12350-7"),
  inputs: [{ key: "airContentPercent", label: "Air content", unit: "%", required: true, numeric: true, min: 0, max: 100, dimension: "ratio" }],
  resultUnit: "%",
  revision: 1,
  active: true,
  calculate: data => ({ result: data.airContentPercent, unit: "%", trace: [{ stepNumber: 1, label: "Recorded air content", formula: "measured reading", substitution: `${data.airContentPercent}%`, result: data.airContentPercent, unit: "%", inputs: data }] })
};

export const HARDENED_COMPRESSIVE_STRENGTH_DEFINITION: Definition<HardenedStrengthInput> = {
  id: "HARDENED_COMPRESSIVE_STRENGTH_PHASE2",
  names: { ar: "مقاومة الضغط للخرسانة المتصلدة", fr: "Résistance à la compression du béton durci", en: "Hardened Concrete Compressive Strength" },
  category: "hardened-concrete",
  applicableMaterialTypes: ["hardened_concrete", "concrete"],
  description: "Calculates compressive stress from failure load and loaded area; age and project criteria remain explicit inputs to review.",
  standard: standard("EN 12390-3"),
  inputs: [positive("failureLoadKN", "Failure load", "kN", "force"), positive("loadedAreaMm2", "Loaded area", "mm²", "area")],
  resultUnit: "MPa",
  revision: 1,
  active: true,
  calculate: data => {
    const result = data.failureLoadKN * 1000 / data.loadedAreaMm2;
    return { result, unit: "MPa", trace: [{ stepNumber: 1, label: "Compressive strength", formula: "load / area", substitution: `${data.failureLoadKN} × 1000 / ${data.loadedAreaMm2}`, result, unit: "MPa", inputs: data }] };
  }
};

export const MORTAR_FLOW_DEFINITION: Definition<MortarFlowInput> = {
  id: "MORTAR_FLOW_PHASE2",
  names: { ar: "انتشار المونة", fr: "Étalement du mortier", en: "Mortar Flow" },
  category: "mortar",
  applicableMaterialTypes: ["mortar", "grout"],
  description: "Calculates spread relative to the reference diameter for laboratory review.",
  standard: standard("EN 1015-3"),
  inputs: [positive("referenceDiameterMm", "Reference diameter", "mm", "length"), positive("measuredDiameterMm", "Measured diameter", "mm", "length")],
  resultUnit: "%",
  revision: 1,
  active: true,
  validateEngineering: data => data.measuredDiameterMm < data.referenceDiameterMm
    ? [{ level: "physical", severity: "warning", code: "MORTAR_FLOW_BELOW_REFERENCE", field: "measuredDiameterMm", message: "Measured spread is below the reference diameter and requires review." }]
    : [],
  calculate: data => {
    const result = ((data.measuredDiameterMm - data.referenceDiameterMm) / data.referenceDiameterMm) * 100;
    return { result, unit: "%", trace: [{ stepNumber: 1, label: "Mortar flow", formula: "(measured − reference) / reference × 100", substitution: `(${data.measuredDiameterMm} − ${data.referenceDiameterMm}) / ${data.referenceDiameterMm} × 100`, result, unit: "%", inputs: data }] };
  }
};

export const MORTAR_COMPRESSIVE_STRENGTH_DEFINITION: Definition<HardenedStrengthInput> = {
  ...HARDENED_COMPRESSIVE_STRENGTH_DEFINITION,
  id: "MORTAR_COMPRESSIVE_STRENGTH_PHASE2",
  names: { ar: "مقاومة ضغط المونة", fr: "Résistance à la compression du mortier", en: "Mortar Compressive Strength" },
  category: "mortar",
  applicableMaterialTypes: ["mortar", "grout"],
  description: "Calculates mortar compressive stress from failure load and loaded area.",
  standard: standard("EN 1015-11")
};

export const PHASE2_CONCRETE_TEST_DEFINITIONS = [
  FRESH_CONCRETE_SLUMP_DEFINITION,
  FRESH_CONCRETE_DENSITY_DEFINITION,
  FRESH_CONCRETE_AIR_CONTENT_DEFINITION,
  HARDENED_COMPRESSIVE_STRENGTH_DEFINITION,
  MORTAR_FLOW_DEFINITION,
  MORTAR_COMPRESSIVE_STRENGTH_DEFINITION
] as const;

export type Phase2ConcreteTestDefinition = typeof PHASE2_CONCRETE_TEST_DEFINITIONS[number];
