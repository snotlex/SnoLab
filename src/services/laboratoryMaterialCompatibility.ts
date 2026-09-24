import type { EngineeringMaterial } from "../types";

export type MaterialCategory =
  | "CEMENT"
  | "FINE_AGGREGATE"
  | "COARSE_AGGREGATE"
  | "MINERAL_ADDITION"
  | "CHEMICAL_ADMIXTURE"
  | "MIXING_WATER"
  | "FIBER"
  | "CONCRETE"
  | "OTHER";

export type MaterialSubtype =
  | "SAND"
  | "CRUSHED_SAND"
  | "GRAVEL"
  | "CRUSHED_GRAVEL"
  | "CEMENT"
  | "FLY_ASH"
  | "SLAG"
  | "SILICA_FUME"
  | "SUPERPLASTICIZER"
  | "PLASTICIZER"
  | "RETARDER"
  | "ACCELERATOR"
  | "AIR_ENTRAINING"
  | "VMA"
  | "WATER"
  | "OTHER";

export interface MaterialClassification { category: MaterialCategory; subtype: MaterialSubtype; }
export interface TestCompatibilityDefinition {
  testId: string;
  testName: string;
  allowedMaterialCategories: MaterialCategory[];
  allowedMaterialSubtypes?: MaterialSubtype[];
  requiredMaterialProperties: string[];
  sampleType: string;
  outputType: string;
  graphType?: string;
}
export interface CompatibilityResult {
  compatible: boolean;
  testId: string;
  materialId: string;
  classification?: MaterialClassification;
  missingProperties: string[];
  reason: string;
}

const CATEGORY_ALIASES: Readonly<Record<string, MaterialCategory>> = {
  CEMENT: "CEMENT", cement: "CEMENT", إسمنت: "CEMENT", "مادة رابطة": "CEMENT",
  AGGREGATES: "FINE_AGGREGATE", aggregates: "FINE_AGGREGATE", SAND: "FINE_AGGREGATE", sand: "FINE_AGGREGATE", رمال: "FINE_AGGREGATE", "الركام الناعم": "FINE_AGGREGATE",
  GRAVEL: "COARSE_AGGREGATE", gravel: "COARSE_AGGREGATE", حصى: "COARSE_AGGREGATE", "الركام الخشن": "COARSE_AGGREGATE", "ركام": "COARSE_AGGREGATE", "ركام خفيف": "COARSE_AGGREGATE", "ركام ثقيل": "COARSE_AGGREGATE", "ركام معاد التدوير": "COARSE_AGGREGATE",
  ADMIXTURES: "CHEMICAL_ADMIXTURE", admixture: "CHEMICAL_ADMIXTURE", "إضافات كيميائية": "CHEMICAL_ADMIXTURE",
  MINERAL_ADDITIONS: "MINERAL_ADDITION", "إضافات معدنية": "MINERAL_ADDITION",
  WATER: "MIXING_WATER", water: "MIXING_WATER", ماء: "MIXING_WATER", "الماء": "MIXING_WATER",
  FIBERS: "FIBER", fiber: "FIBER", ألياف: "FIBER",
  CONCRETE: "CONCRETE", concrete: "CONCRETE", خرسانة: "CONCRETE"
};
const SUBTYPE_ALIASES: Readonly<Record<string, MaterialSubtype>> = {
  sand: "SAND", رمل: "SAND", رمال: "SAND", crushed_sand: "CRUSHED_SAND", "رمل مكسر": "CRUSHED_SAND",
  gravel: "GRAVEL", حصى: "GRAVEL", crushed_gravel: "CRUSHED_GRAVEL", "حصى مكسر": "CRUSHED_GRAVEL",
  cement: "CEMENT", إسمنت: "CEMENT", fly_ash: "FLY_ASH", slag: "SLAG", silica_fume: "SILICA_FUME",
  superplasticizer: "SUPERPLASTICIZER", plasticizer: "PLASTICIZER", retarder: "RETARDER", accelerator: "ACCELERATOR", air_entraining: "AIR_ENTRAINING", vma: "VMA",
  water: "WATER", ماء: "WATER"
};

function normalize(value: unknown): string { return String(value ?? "").trim(); }

export function classifyEngineeringMaterial(material: Pick<EngineeringMaterial, "category" | "type" | "materialType">): MaterialClassification | undefined {
  const category = CATEGORY_ALIASES[normalize(material.category)] || CATEGORY_ALIASES[normalize(material.materialType)];
  if (!category) return undefined;
  const subtype = SUBTYPE_ALIASES[normalize(material.type)] || SUBTYPE_ALIASES[normalize(material.materialType)] || (category === "CEMENT" ? "CEMENT" : category === "MIXING_WATER" ? "WATER" : "OTHER");
  return { category, subtype };
}

const AGGREGATE: MaterialCategory[] = ["FINE_AGGREGATE", "COARSE_AGGREGATE"];
const FINE: MaterialCategory[] = ["FINE_AGGREGATE"];
const COARSE: MaterialCategory[] = ["COARSE_AGGREGATE"];

export const TEST_COMPATIBILITY_REGISTRY: Readonly<Record<string, TestCompatibilityDefinition>> = {
  AGG_SIEVE: { testId: "AGG_SIEVE", testName: "Aggregate sieve analysis", allowedMaterialCategories: AGGREGATE, requiredMaterialProperties: [], sampleType: "aggregate sample", outputType: "gradation", graphType: "granulometricCurve" },
  AGG_BULK_DENSITY: { testId: "AGG_BULK_DENSITY", testName: "Aggregate bulk density", allowedMaterialCategories: AGGREGATE, requiredMaterialProperties: [], sampleType: "aggregate sample", outputType: "density" },
  AGG_SPECIFIC_GRAVITY: { testId: "AGG_SPECIFIC_GRAVITY", testName: "Aggregate absorption and specific gravity", allowedMaterialCategories: AGGREGATE, requiredMaterialProperties: [], sampleType: "aggregate sample", outputType: "density and absorption" },
  AGG_MOISTURE_CONTENT: { testId: "AGG_MOISTURE_CONTENT", testName: "Aggregate moisture", allowedMaterialCategories: AGGREGATE, requiredMaterialProperties: [], sampleType: "aggregate sample", outputType: "moisture" },
  AGG_SAND_EQUIVALENT: { testId: "AGG_SAND_EQUIVALENT", testName: "Sand equivalent", allowedMaterialCategories: FINE, allowedMaterialSubtypes: ["SAND", "CRUSHED_SAND", "OTHER"], requiredMaterialProperties: [], sampleType: "fine aggregate fraction", outputType: "sand equivalent" },
  AGG_BULKING_SAND: { testId: "AGG_BULKING_SAND", testName: "Sand bulking", allowedMaterialCategories: FINE, allowedMaterialSubtypes: ["SAND", "CRUSHED_SAND", "OTHER"], requiredMaterialProperties: [], sampleType: "fine aggregate fraction", outputType: "bulking curve", graphType: "bulkingCurve" },
  AGG_LOS_ANGELES: { testId: "AGG_LOS_ANGELES", testName: "Los Angeles abrasion", allowedMaterialCategories: COARSE, allowedMaterialSubtypes: ["GRAVEL", "CRUSHED_GRAVEL", "OTHER"], requiredMaterialProperties: [], sampleType: "coarse aggregate fraction", outputType: "abrasion loss" },
  AGG_MICRO_DEVAL: { testId: "AGG_MICRO_DEVAL", testName: "Micro-Deval", allowedMaterialCategories: COARSE, allowedMaterialSubtypes: ["GRAVEL", "CRUSHED_GRAVEL", "OTHER"], requiredMaterialProperties: [], sampleType: "coarse aggregate fraction", outputType: "wear loss" },
  AGG_SHAPE_FLAKINESS: { testId: "AGG_SHAPE_FLAKINESS", testName: "Flakiness index", allowedMaterialCategories: COARSE, requiredMaterialProperties: [], sampleType: "coarse aggregate fraction", outputType: "shape index" },
  AGG_METHYLENE_BLUE: { testId: "AGG_METHYLENE_BLUE", testName: "Methylene blue value", allowedMaterialCategories: FINE, allowedMaterialSubtypes: ["SAND", "CRUSHED_SAND", "OTHER"], requiredMaterialProperties: [], sampleType: "fine fraction", outputType: "clay activity" },
  CEM_SPECIFIC_GRAVITY: { testId: "CEM_SPECIFIC_GRAVITY", testName: "Cement specific gravity", allowedMaterialCategories: ["CEMENT"], requiredMaterialProperties: [], sampleType: "cement sample", outputType: "density" },
  CEM_FINENESS_BLAINE: { testId: "CEM_FINENESS_BLAINE", testName: "Blaine fineness", allowedMaterialCategories: ["CEMENT"], requiredMaterialProperties: [], sampleType: "cement sample", outputType: "specific surface" },
  CEM_NORMAL_CONSISTENCY: { testId: "CEM_NORMAL_CONSISTENCY", testName: "Cement standard consistency", allowedMaterialCategories: ["CEMENT"], requiredMaterialProperties: [], sampleType: "cement paste", outputType: "consistency" },
  CEM_SETTING_TIME: { testId: "CEM_SETTING_TIME", testName: "Cement setting time", allowedMaterialCategories: ["CEMENT"], requiredMaterialProperties: [], sampleType: "cement paste", outputType: "setting times" },
  CEM_SOUNDNESS: { testId: "CEM_SOUNDNESS", testName: "Cement soundness", allowedMaterialCategories: ["CEMENT"], requiredMaterialProperties: [], sampleType: "cement paste", outputType: "expansion" },
  CEM_COMPRESSIVE_STRENGTH: { testId: "CEM_COMPRESSIVE_STRENGTH", testName: "Cement mortar compressive strength", allowedMaterialCategories: ["CEMENT"], requiredMaterialProperties: [], sampleType: "standardized cement mortar", outputType: "strength", graphType: "strengthVsAge" },
  WATER_PH: { testId: "WATER_PH", testName: "Mixing water pH", allowedMaterialCategories: ["MIXING_WATER"], requiredMaterialProperties: [], sampleType: "mixing water", outputType: "pH" },
  WATER_CHLORIDES: { testId: "WATER_CHLORIDES", testName: "Mixing water chlorides", allowedMaterialCategories: ["MIXING_WATER"], requiredMaterialProperties: [], sampleType: "mixing water", outputType: "chlorides" },
  WATER_SULFATES: { testId: "WATER_SULFATES", testName: "Mixing water sulfates", allowedMaterialCategories: ["MIXING_WATER"], requiredMaterialProperties: [], sampleType: "mixing water", outputType: "sulfates" },
  WATER_TDS_IMPURITIES: { testId: "WATER_TDS_IMPURITIES", testName: "Mixing water dissolved solids", allowedMaterialCategories: ["MIXING_WATER"], requiredMaterialProperties: [], sampleType: "mixing water", outputType: "dissolved solids" },
  ADM_DENSITY: { testId: "ADM_DENSITY", testName: "Chemical admixture density", allowedMaterialCategories: ["CHEMICAL_ADMIXTURE"], requiredMaterialProperties: [], sampleType: "chemical admixture", outputType: "density" },
  ADM_SOLID_CONTENT: { testId: "ADM_SOLID_CONTENT", testName: "Admixture solid content", allowedMaterialCategories: ["CHEMICAL_ADMIXTURE"], requiredMaterialProperties: [], sampleType: "chemical admixture", outputType: "solid content" },
  ADM_WATER_REDUCTION: { testId: "ADM_WATER_REDUCTION", testName: "Admixture water reduction", allowedMaterialCategories: ["CHEMICAL_ADMIXTURE"], requiredMaterialProperties: [], sampleType: "admixture performance reference mix", outputType: "water reduction" },
  SCM_SPECIFIC_GRAVITY: { testId: "SCM_SPECIFIC_GRAVITY", testName: "Mineral addition specific gravity", allowedMaterialCategories: ["MINERAL_ADDITION"], requiredMaterialProperties: [], sampleType: "mineral addition", outputType: "density" },
  SCM_ACTIVITY_INDEX: { testId: "SCM_ACTIVITY_INDEX", testName: "Mineral addition activity index", allowedMaterialCategories: ["MINERAL_ADDITION"], requiredMaterialProperties: [], sampleType: "mineral addition mortar", outputType: "activity index" },
  SCM_LOSS_ON_IGNITION: { testId: "SCM_LOSS_ON_IGNITION", testName: "Mineral addition loss on ignition", allowedMaterialCategories: ["MINERAL_ADDITION"], requiredMaterialProperties: [], sampleType: "mineral addition", outputType: "loss on ignition" },
  FIBER_GEOMETRY: { testId: "FIBER_GEOMETRY", testName: "Fiber geometry", allowedMaterialCategories: ["FIBER"], requiredMaterialProperties: [], sampleType: "fiber sample", outputType: "geometry" },
  FIBER_DOSAGE_OPTIMIZATION: { testId: "FIBER_DOSAGE_OPTIMIZATION", testName: "Fiber dosage optimization", allowedMaterialCategories: ["FIBER"], requiredMaterialProperties: [], sampleType: "fiber-reinforced mix", outputType: "dosage" }
};

export function validateTestMaterialCompatibility(testId: string, material: EngineeringMaterial): CompatibilityResult {
  const definition = TEST_COMPATIBILITY_REGISTRY[testId];
  const classification = classifyEngineeringMaterial(material);
  if (!definition) return { compatible: false, testId, materialId: material.id, missingProperties: [], reason: `Test ${testId} is not registered in the compatibility registry.` };
  if (!classification) return { compatible: false, testId, materialId: material.id, missingProperties: [], reason: "Material category is not registered; calculation is blocked until it is classified." };
  const categoryAllowed = definition.allowedMaterialCategories.includes(classification.category);
  const subtypeAllowed = !definition.allowedMaterialSubtypes || definition.allowedMaterialSubtypes.includes(classification.subtype);
  const missingProperties = definition.requiredMaterialProperties.filter(key => material[key as keyof EngineeringMaterial] === undefined);
  const compatible = categoryAllowed && subtypeAllowed && missingProperties.length === 0;
  let reason = compatible ? "Material is compatible with this test." : `Material category ${classification.category} is not compatible with ${definition.testName}.`;
  if (missingProperties.length) reason += ` Required material properties missing: ${missingProperties.join(", ")}.`;
  return { compatible, testId, materialId: material.id, classification, missingProperties, reason };
}

export function getCompatibleMaterials(testId: string, materials: EngineeringMaterial[]): EngineeringMaterial[] {
  return materials.filter(material => validateTestMaterialCompatibility(testId, material).compatible);
}

export function compatibilityMessage(result: CompatibilityResult, language: "ar" | "fr" | "en" = "en"): string {
  if (result.compatible) return "";
  if (language === "fr") return `TEST BLOQUÉ : ${result.reason} Cette expérience nécessite un matériau compatible.`;
  if (language === "ar") return `تم حظر الاختبار: ${result.reason}`;
  return `TEST BLOCKED: ${result.reason}`;
}
