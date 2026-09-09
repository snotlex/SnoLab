import json, sys

header = """import { EngineeringMaterial } from "../types";

export type PropertyInputType = "number" | "select" | "text" | "boolean";

export type PropertyCategoryGroup = 
  | "physical" 
  | "granulometric" 
  | "mechanical" 
  | "durability" 
  | "chemical" 
  | "hydration" 
  | "composition"
  | "rheology";

export type RequirementLevel = "required" | "optional" | "conditional";

export interface PropertyOption {
  value: string;
  labelAr: string;
  labelFr: string;
  labelEn: string;
}

export interface ValidationResult {
  isValid: boolean;
  errorAr?: string;
  errorFr?: string;
  errorEn?: string;
}

export type SupportedMaterialRole = 
  | "cement" 
  | "sand" 
  | "gravel" 
  | "admixture" 
  | "scm" 
  | "filler" 
  | "water" 
  | "fiber" 
  | "soil"
  | "bituminous"
  | "masonry"
  | "lightweightAggregate" 
  | "heavyweightAggregate" 
  | "specialBinder" 
  | "recycledAggregate" 
  | "airContent"
  | "other";

export interface MaterialPropertyDefinition {
  key: string;
  propertyId: string;
  labelAr: string;
  labelFr: string;
  labelEn: string;
  unit: string;
  inputType: PropertyInputType;
  categoryGroup: PropertyCategoryGroup;
  requirementLevel: RequirementLevel;
  testStandard?: string;
  associatedLabTestId?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: PropertyOption[];
  defaultVal?: any;
  placeholder?: string;
  categoryKey: SupportedMaterialRole;
  notesAr?: string;
  notesFr?: string;
  notesEn?: string;
  isRequired: (material: EngineeringMaterial, mixMethod?: string, concreteType?: string) => boolean;
  validate: (val: any, material?: EngineeringMaterial, mixMethod?: string) => ValidationResult;
  mapToInputKeys?: string[];
}

export interface EvaluatedProperty {
  definition: MaterialPropertyDefinition;
  key: string;
  propertyId?: string;
  labelAr: string;
  labelFr: string;
  labelEn: string;
  unit: string;
  currentValue: any;
  currentValueDisplay: string;
  hasCurrentValue: boolean;
  isRequired: boolean;
  requirementLevel: RequirementLevel;
  categoryGroup: PropertyCategoryGroup;
  testStandard?: string;
  associatedLabTestId?: string;
  source: string;
  sourceLabelAr: string;
  sourceLabelFr: string;
  sourceLabelEn: string;
  status: "valid" | "missing" | "invalid" | "modified" | "needs_review" | "default_reference" | "not_applicable";
  validationErrorAr?: string;
  validationErrorFr?: string;
  validationErrorEn?: string;
  isEditable?: boolean;
  originalDefaultValue?: any;
  confidence?: string;
  notes?: string;
  reason?: string;
  referenceUrl?: string;
  history?: any[];
}

export interface MaterialPropertiesGroup {
  material: EngineeringMaterial;
  role: SupportedMaterialRole;
  categoryAr: string;
  categoryFr: string;
  categoryEn: string;
  missingRequiredCount: number;
  missingOptionalCount: number;
  totalMissingCount: number;
  properties: EvaluatedProperty[];
}

export interface BatchPropertiesSummary {
  totalMissingRequired: number;
  totalMissingOptional: number;
  totalMissing: number;
  groups: MaterialPropertiesGroup[];
}

export interface NumericValidationConfig {
  min: number;
  max: number;
  nameAr: string;
  nameFr: string;
  nameEn: string;
  unit?: string;
  allowZero?: boolean;
}

export function validateNumericRange(
  val: any, 
  minOrConfig: number | NumericValidationConfig, 
  max?: number, 
  propNameAr?: string, 
  propNameFr?: string, 
  propNameEn?: string, 
  unit: string = "",
  allowZero: boolean = false
): ValidationResult {
  let min: number, maxVal: number, nameAr: string, nameFr: string, nameEn: string, u: string, zero: boolean;
  if (typeof minOrConfig === "object") {
    min = minOrConfig.min;
    maxVal = minOrConfig.max;
    nameAr = minOrConfig.nameAr;
    nameFr = minOrConfig.nameFr;
    nameEn = minOrConfig.nameEn;
    u = minOrConfig.unit || "";
    zero = !!minOrConfig.allowZero;
  } else {
    min = minOrConfig;
    maxVal = max!;
    nameAr = propNameAr || "";
    nameFr = propNameFr || "";
    nameEn = propNameEn || "";
    u = unit;
    zero = allowZero;
  }

  // Not applicable or text standard check
  if (val === "N/A" || val === "NOT_APPLICABLE" || val === "غير منطبق" || (typeof val === "string" && val.trim().toUpperCase() === "N/A")) {
    return { isValid: true };
  }

  if (val === undefined || val === null || val === "") {
    return {
      isValid: false,
      errorAr: `حقل ${nameAr} مطلوب ولم يتم إدخاله.`,
      errorFr: `Le champ ${nameFr} est obligatoire et non renseigné.`,
      errorEn: `${nameEn} is required and currently empty.`
    };
  }

  const num = typeof val === "number" ? val : parseFloat(String(val).replace(",", "."));
  if (isNaN(num) || !isFinite(num)) {
    return {
      isValid: false,
      errorAr: `القيمة المدخلة في ${nameAr} غير صالحة عددياً (NaN / غير رقمية).`,
      errorFr: `La valeur pour ${nameFr} est invalide (non numérique).`,
      errorEn: `Invalid numeric value for ${nameEn}.`
    };
  }

  if (!zero && num === 0) {
    return {
      isValid: false,
      errorAr: `لا يمكن أن تكون قيمة ${nameAr} مساوية للصفر.`,
      errorFr: `La valeur de ${nameFr} ne peut pas être égale à zéro.`,
      errorEn: `${nameEn} cannot be zero.`
    };
  }

  if (num < 0) {
    return {
      isValid: false,
      errorAr: `لا يمكن أن تكون قيمة ${nameAr} سالبة (${num}${u ? " " + u : ""}).`,
      errorFr: `La valeur de ${nameFr} ne peut pas être négative (${num}${u ? " " + u : ""}).`,
      errorEn: `${nameEn} cannot be negative (${num}${u ? " " + u : ""}).`
    };
  }

  if (num < min || num > maxVal) {
    return {
      isValid: false,
      errorAr: `قيمة ${nameAr} (${num}${u ? " " + u : ""}) خارج النطاق الهندسي المقبول [${min} - ${maxVal}${u ? " " + u : ""}].`,
      errorFr: `La valeur de ${nameFr} (${num}${u ? " " + u : ""}) est hors limites plausibles [${min} - ${maxVal}${u ? " " + u : ""}].`,
      errorEn: `${nameEn} value (${num}${u ? " " + u : ""}) is outside plausible range [${min} - ${maxVal}${u ? " " + u : ""}].`
    };
  }

  return { isValid: true };
}

export function normalizeMaterialRole(materialOrCategory: any): SupportedMaterialRole {
  if (!materialOrCategory) return "sand";
  
  let cat = "";
  let type = "";
  if (typeof materialOrCategory === "string") {
    cat = materialOrCategory.toLowerCase();
  } else {
    cat = String(materialOrCategory.category || materialOrCategory.Category || "").toLowerCase();
    type = String(materialOrCategory.type || materialOrCategory.Type || materialOrCategory.materialType || "").toLowerCase();
  }

  const combined = `${cat} ${type}`.toLowerCase();
  
  if (combined.includes("إسمنت") || combined.includes("cement") || combined.includes("ciment") || combined.includes("أسمنت")) {
    return "cement";
  }
  if (combined.includes("ركام خفيف") || combined.includes("lightweight") || combined.includes("léger") || combined.includes("خفاف") || combined.includes("طين ممتد")) {
    return "lightweightAggregate";
  }
  if (combined.includes("ركام ثقيل") || combined.includes("heavyweight") || combined.includes("lourd") || combined.includes("باريت") || combined.includes("ماغنتيت") || combined.includes("مغنتيت")) {
    return "heavyweightAggregate";
  }
  if (combined.includes("معاد تدوير") || combined.includes("recycled") || combined.includes("recyclé") || combined.includes("rca")) {
    return "recycledAggregate";
  }
  if (combined.includes("ماء") || combined.includes("مياه") || combined.includes("water") || combined.includes("eau")) {
    return "water";
  }
  if (combined.includes("رمل") || combined.includes("رمال") || combined.includes("sand") || combined.includes("sable")) {
    return "sand";
  }
  if (combined.includes("حصى") || combined.includes("حصمة") || combined.includes("gravel") || combined.includes("gravier") || combined.includes("ركام خشن") || combined.includes("coarse")) {
    return "gravel";
  }
  if (combined.includes("كيميائية") || combined.includes("admixture") || combined.includes("adjuvant") || combined.includes("ملدن")) {
    return "admixture";
  }
  if (combined.includes("معدنية") || combined.includes("scm") || combined.includes("pouzzolane") || combined.includes("بوزولان") || combined.includes("خبث") || combined.includes("غبار السيليكا") || combined.includes("رماد")) {
    return "scm";
  }
  if (combined.includes("مالئة") || combined.includes("filler") || combined.includes("fillers") || combined.includes("كربونات")) {
    return "filler";
  }
  if (combined.includes("ألياف") || combined.includes("fiber") || combined.includes("fibre")) {
    return "fiber";
  }
  if (combined.includes("محتوى الهواء") || combined.includes("air") || combined.includes("entrained") || combined.includes("هواء")) {
    return "airContent";
  }
  if (combined.includes("تربة") || combined.includes("soil") || combined.includes("geotechnic") || combined.includes("sol")) {
    return "soil";
  }
  if (combined.includes("زفت") || combined.includes("بيتومين") || combined.includes("اسفلت") || combined.includes("asphalt") || combined.includes("bitumen") || combined.includes("bitumin")) {
    return "bituminous";
  }
  if (combined.includes("بناء") || combined.includes("طوب") || combined.includes("بلوك") || combined.includes("masonry") || combined.includes("brique") || combined.includes("bloc")) {
    return "masonry";
  }
  if (combined.includes("مجلد") || combined.includes("روابط") || combined.includes("رابط") || combined.includes("binder") || combined.includes("liant") || combined.includes("جيوبوليمر") || combined.includes("geopolymer") || combined.includes("specialbinder")) {
    return "specialBinder";
  }

  return "sand";
}
"""

print("Header prepared, length:", len(header))
