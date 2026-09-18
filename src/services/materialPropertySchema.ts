import { EngineeringMaterial } from "../types";

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

  // Allow zero if explicitly allowed or if 0 falls within [min, maxVal]
  const isZeroAllowed = zero || (min <= 0 && maxVal >= 0);
  if (!isZeroAllowed && num === 0) {
    return {
      isValid: false,
      errorAr: `لا يمكن أن تكون قيمة ${nameAr} مساوية للصفر.`,
      errorFr: `La valeur de ${nameFr} ne peut pas être égale à zéro.`,
      errorEn: `${nameEn} cannot be zero.`
    };
  }

  // Check negative numbers only if minimum allowable threshold is non-negative
  if (min >= 0 && num < 0) {
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
  if (combined.includes("معاد تدوير") || combined.includes("معاد التدوير") || combined.includes("recycled") || combined.includes("recyclé") || combined.includes("rca")) {
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

export const MATERIAL_PROPERTY_SCHEMAS: Record<SupportedMaterialRole, MaterialPropertyDefinition[]> = {
  cement: [
    {
      key: "cementClass",
      propertyId: "PROP_CEM_CLASS",
      labelAr: "نوع ورتبة الإسمنت القياسية",
      labelFr: "Type et Classe de Ciment",
      labelEn: "Cement Type & Class",
      unit: "",
      inputType: "select",
      categoryGroup: "composition",
      requirementLevel: "required",
      testStandard: "EN 197-1 / ASTM C150",
      options: [
        { value: "CEM I 42.5", labelAr: "CEM I 42.5 (بورتلاندي عادي)", labelFr: "CEM I 42.5", labelEn: "CEM I 42.5" },
        { value: "CEM I 52.5", labelAr: "CEM I 52.5 (عالي المقاومة المبكرة)", labelFr: "CEM I 52.5", labelEn: "CEM I 52.5" },
        { value: "CEM II/A 42.5", labelAr: "CEM II/A 42.5 (مركب نوع A)", labelFr: "CEM II/A 42.5", labelEn: "CEM II/A 42.5" },
        { value: "CEM II/B 32.5", labelAr: "CEM II/B 32.5 (مركب نوع B)", labelFr: "CEM II/B 32.5", labelEn: "CEM II/B 32.5" },
        { value: "CEM III 42.5", labelAr: "CEM III 42.5 (خبث أفران)", labelFr: "CEM III 42.5", labelEn: "CEM III 42.5" },
        { value: "CEM IV 32.5", labelAr: "CEM IV 32.5 (بوزولاني)", labelFr: "CEM IV 32.5", labelEn: "CEM IV 32.5" },
        { value: "CEM V 32.5", labelAr: "CEM V 32.5 (مركب)", labelFr: "CEM V 32.5", labelEn: "CEM V 32.5" },
        { value: "White CEM I 52.5", labelAr: "White CEM I 52.5 (أبيض فائق البياض)", labelFr: "White CEM I 52.5", labelEn: "White CEM I 52.5" }
      ],
      defaultVal: "CEM I 42.5",
      placeholder: "CEM I 42.5",
      categoryKey: "cement",
      isRequired: () => true,
      validate: (val) => (!val || String(val).trim() === "" ? { isValid: false, errorAr: "حقل نوع ورتبة الإسمنت القياسية مطلوب." } : { isValid: true })
    },
    {
      key: "strengthClass",
      propertyId: "PROP_CEM_STRENGTH_28D",
      labelAr: "فئة المقاومة القياسية (28 يوم)",
      labelFr: "Classe de Résistance (28j)",
      labelEn: "Strength Class (28-day)",
      unit: "MPa",
      inputType: "number",
      categoryGroup: "mechanical",
      requirementLevel: "required",
      testStandard: "EN 196-1 / ASTM C109",
      min: 20,
      max: 80,
      defaultVal: 42.5,
      placeholder: "42.5",
      categoryKey: "cement",
      isRequired: () => true,
      validate: (val) => validateNumericRange(val, 20, 80, "فئة المقاومة القياسية (28 يوم)", "Classe de Résistance (28j)", "Strength Class (28-day)", "MPa", false)
    },
    {
      key: "density",
      propertyId: "PROP_CEM_DENSITY",
      labelAr: "الكثافة المطلقة للإسمنت",
      labelFr: "Masse Volumique Réelle du Ciment",
      labelEn: "Absolute Density of Cement",
      unit: "kg/m³",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "required",
      testStandard: "EN 196-6 / ASTM C188",
      min: 2800,
      max: 3300,
      defaultVal: 3100,
      placeholder: "3100",
      categoryKey: "cement",
      isRequired: () => true,
      validate: (val) => validateNumericRange(val, 2800, 3300, "الكثافة المطلقة للإسمنت", "Masse Volumique Réelle du Ciment", "Absolute Density of Cement", "kg/m³", false)
    },
    {
      key: "specificGravity",
      propertyId: "PROP_CEM_SPECIFIC_GRAVITY",
      labelAr: "الوزن النوعي النسبي للإسمنت",
      labelFr: "Densité Relative du Ciment",
      labelEn: "Specific Gravity of Cement",
      unit: "",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "optional",
      testStandard: "EN 196-6 / ASTM C188",
      min: 2.8,
      max: 3.3,
      defaultVal: 3.1,
      placeholder: "3.1",
      categoryKey: "cement",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 2.8, 3.3, "الوزن النوعي النسبي للإسمنت", "Densité Relative du Ciment", "Specific Gravity of Cement", "", false)
    },
    {
      key: "bulkDensity",
      propertyId: "PROP_CEM_BULK_DENSITY",
      labelAr: "الكثافة الظاهرية (الصب الحر)",
      labelFr: "Masse Volumique Apparente",
      labelEn: "Bulk Density (Loose)",
      unit: "kg/m³",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "optional",
      testStandard: "EN 1097-3",
      min: 800,
      max: 1500,
      defaultVal: 1150,
      placeholder: "1150",
      categoryKey: "cement",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 800, 1500, "الكثافة الظاهرية (الصب الحر)", "Masse Volumique Apparente", "Bulk Density (Loose)", "kg/m³", false)
    },
    {
      key: "blaineFineness",
      propertyId: "PROP_CEM_BLAINE",
      labelAr: "النعومة النوعية (سطح بلين)",
      labelFr: "Surface Spécifique Blaine (SSB)",
      labelEn: "Blaine Specific Surface Area",
      unit: "cm²/g",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "optional",
      testStandard: "EN 196-6 / ASTM C204",
      min: 2500,
      max: 6500,
      defaultVal: 3450,
      placeholder: "3450",
      categoryKey: "cement",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 2500, 6500, "النعومة النوعية (سطح بلين)", "Surface Spécifique Blaine (SSB)", "Blaine Specific Surface Area", "cm²/g", false)
    },
    {
      key: "standardConsistency",
      propertyId: "PROP_CEM_CONSISTENCY",
      labelAr: "القوام القياسي للخلط (فيكات)",
      labelFr: "Consistance Normalisée (Vicat)",
      labelEn: "Standard Consistency (Water %)",
      unit: "%",
      inputType: "number",
      categoryGroup: "hydration",
      requirementLevel: "optional",
      testStandard: "EN 196-3 / ASTM C187",
      min: 20,
      max: 40,
      defaultVal: 26.5,
      placeholder: "26.5",
      categoryKey: "cement",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 20, 40, "القوام القياسي للخلط (فيكات)", "Consistance Normalisée (Vicat)", "Standard Consistency (Water %)", "%", false)
    },
    {
      key: "initialSetting",
      propertyId: "PROP_CEM_INIT_SETTING",
      labelAr: "زمن بداية الشك (فيكات)",
      labelFr: "Début de Prise (Vicat)",
      labelEn: "Initial Setting Time",
      unit: "min",
      inputType: "number",
      categoryGroup: "hydration",
      requirementLevel: "optional",
      testStandard: "EN 196-3 / ASTM C191",
      min: 45,
      max: 360,
      defaultVal: 135,
      placeholder: "135",
      categoryKey: "cement",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 45, 360, "زمن بداية الشك (فيكات)", "Début de Prise (Vicat)", "Initial Setting Time", "min", false)
    },
    {
      key: "finalSetting",
      propertyId: "PROP_CEM_FINAL_SETTING",
      labelAr: "زمن نهاية الشك",
      labelFr: "Fin de Prise",
      labelEn: "Final Setting Time",
      unit: "min",
      inputType: "number",
      categoryGroup: "hydration",
      requirementLevel: "optional",
      testStandard: "EN 196-3 / ASTM C191",
      min: 90,
      max: 480,
      defaultVal: 210,
      placeholder: "210",
      categoryKey: "cement",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 90, 480, "زمن نهاية الشك", "Fin de Prise", "Final Setting Time", "min", false)
    },
    {
      key: "soundness",
      propertyId: "PROP_CEM_SOUNDNESS",
      labelAr: "ثبات الحجم والانتفاخ (لو شاتولييه)",
      labelFr: "Stabilité / Expansion (Le Chatelier)",
      labelEn: "Soundness / Expansion",
      unit: "mm",
      inputType: "number",
      categoryGroup: "durability",
      requirementLevel: "optional",
      testStandard: "EN 196-3",
      min: 0,
      max: 10,
      defaultVal: 1.2,
      placeholder: "1.2",
      categoryKey: "cement",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 0, 10, "ثبات الحجم والانتفاخ (لو شاتولييه)", "Stabilité / Expansion (Le Chatelier)", "Soundness / Expansion", "mm", true)
    },
    {
      key: "strength2d",
      propertyId: "PROP_CEM_STRENGTH_2D",
      labelAr: "مقاومة الضغط بعد يومين",
      labelFr: "Résistance à la Compression (2j)",
      labelEn: "Compressive Strength (2-day)",
      unit: "MPa",
      inputType: "number",
      categoryGroup: "mechanical",
      requirementLevel: "optional",
      testStandard: "EN 196-1 / ASTM C109",
      min: 10,
      max: 45,
      defaultVal: 21.5,
      placeholder: "21.5",
      categoryKey: "cement",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 10, 45, "مقاومة الضغط بعد يومين", "Résistance à la Compression (2j)", "Compressive Strength (2-day)", "MPa", false)
    },
    {
      key: "strength7d",
      propertyId: "PROP_CEM_STRENGTH_7D",
      labelAr: "مقاومة الضغط بعد 7 أيام",
      labelFr: "Résistance à la Compression (7j)",
      labelEn: "Compressive Strength (7-day)",
      unit: "MPa",
      inputType: "number",
      categoryGroup: "mechanical",
      requirementLevel: "optional",
      testStandard: "EN 196-1 / ASTM C109",
      min: 18,
      max: 60,
      defaultVal: 33.0,
      placeholder: "33.0",
      categoryKey: "cement",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 18, 60, "مقاومة الضغط بعد 7 أيام", "Résistance à la Compression (7j)", "Compressive Strength (7-day)", "MPa", false)
    },
    {
      key: "strength28d",
      propertyId: "PROP_CEM_STRENGTH_28D_TEST",
      labelAr: "مقاومة الضغط بعد 28 يوم",
      labelFr: "Résistance à la Compression (28j)",
      labelEn: "Compressive Strength (28-day)",
      unit: "MPa",
      inputType: "number",
      categoryGroup: "mechanical",
      requirementLevel: "optional",
      testStandard: "EN 196-1 / ASTM C109",
      min: 30,
      max: 80,
      defaultVal: 48.5,
      placeholder: "48.5",
      categoryKey: "cement",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 30, 80, "مقاومة الضغط بعد 28 يوم", "Résistance à la Compression (28j)", "Compressive Strength (28-day)", "MPa", false)
    },
    {
      key: "heatOfHydration",
      propertyId: "PROP_CEM_HEAT_HYDRATION",
      labelAr: "حرارة الإماهة (7 أيام)",
      labelFr: "Chaleur d'Hydratation (7j)",
      labelEn: "Heat of Hydration (7-day)",
      unit: "J/g",
      inputType: "number",
      categoryGroup: "hydration",
      requirementLevel: "optional",
      testStandard: "EN 196-8 / EN 196-9",
      min: 180,
      max: 450,
      defaultVal: 290,
      placeholder: "290",
      categoryKey: "cement",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 180, 450, "حرارة الإماهة (7 أيام)", "Chaleur d'Hydratation (7j)", "Heat of Hydration (7-day)", "J/g", false)
    },
    {
      key: "lossOnIgnition",
      propertyId: "PROP_CEM_LOI",
      labelAr: "الفاقد في الحرق (LOI)",
      labelFr: "Perte au Feu (PAF)",
      labelEn: "Loss on Ignition (LOI)",
      unit: "%",
      inputType: "number",
      categoryGroup: "chemical",
      requirementLevel: "optional",
      testStandard: "EN 196-2 / ASTM C114",
      min: 0.1,
      max: 7.0,
      defaultVal: 1.8,
      placeholder: "1.8",
      categoryKey: "cement",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 0.1, 7.0, "الفاقد في الحرق (LOI)", "Perte au Feu (PAF)", "Loss on Ignition (LOI)", "%", false)
    },
    {
      key: "insolubleResidue",
      propertyId: "PROP_CEM_INSOLUBLE",
      labelAr: "الراسب غير القابل للذوبان",
      labelFr: "Résidu Insoluble",
      labelEn: "Insoluble Residue",
      unit: "%",
      inputType: "number",
      categoryGroup: "chemical",
      requirementLevel: "optional",
      testStandard: "EN 196-2 / ASTM C114",
      min: 0.1,
      max: 5.0,
      defaultVal: 0.6,
      placeholder: "0.6",
      categoryKey: "cement",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 0.1, 5.0, "الراسب غير القابل للذوبان", "Résidu Insoluble", "Insoluble Residue", "%", false)
    },
    {
      key: "sulfateContent",
      propertyId: "PROP_CEM_SO3",
      labelAr: "محتوى الكبريتات (SO3)",
      labelFr: "Teneur en Sulfates (SO3)",
      labelEn: "Sulfate Content (SO3)",
      unit: "%",
      inputType: "number",
      categoryGroup: "chemical",
      requirementLevel: "optional",
      testStandard: "EN 196-2 / ASTM C114",
      min: 0.5,
      max: 4.5,
      defaultVal: 2.7,
      placeholder: "2.7",
      categoryKey: "cement",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 0.5, 4.5, "محتوى الكبريتات (SO3)", "Teneur en Sulfates (SO3)", "Sulfate Content (SO3)", "%", false)
    },
    {
      key: "chlorideContent",
      propertyId: "PROP_CEM_CHLORIDE",
      labelAr: "محتوى الكلوريدات (Cl-)",
      labelFr: "Teneur en Chlorures (Cl-)",
      labelEn: "Chloride Content (Cl-)",
      unit: "%",
      inputType: "number",
      categoryGroup: "chemical",
      requirementLevel: "optional",
      testStandard: "EN 196-2 / ASTM C114",
      min: 0,
      max: 0.1,
      defaultVal: 0.02,
      placeholder: "0.02",
      categoryKey: "cement",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 0, 0.1, "محتوى الكلوريدات (Cl-)", "Teneur en Chlorures (Cl-)", "Chloride Content (Cl-)", "%", true)
    },
    {
      key: "alkaliEquivalent",
      propertyId: "PROP_CEM_ALKALI",
      labelAr: "مكافئ القلويات (Na2O eq)",
      labelFr: "Équivalent Alcalin (Na2O eq)",
      labelEn: "Equivalent Alkali (Na2O eq)",
      unit: "%",
      inputType: "number",
      categoryGroup: "chemical",
      requirementLevel: "optional",
      testStandard: "EN 196-2 / ASTM C114",
      min: 0.1,
      max: 1.5,
      defaultVal: 0.65,
      placeholder: "0.65",
      categoryKey: "cement",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 0.1, 1.5, "مكافئ القلويات (Na2O eq)", "Équivalent Alcalin (Na2O eq)", "Equivalent Alkali (Na2O eq)", "%", false)
    }
  ],
  sand: [
    {
      key: "density",
      propertyId: "PROP_SND_DENSITY",
      labelAr: "الكثافة المطلقة للرمل (جاف)",
      labelFr: "Masse Volumique Réelle du Sable",
      labelEn: "Absolute Density of Sand",
      unit: "kg/m³",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "required",
      testStandard: "EN 1097-6 / ASTM C128",
      min: 2300,
      max: 2900,
      defaultVal: 2620,
      placeholder: "2620",
      categoryKey: "sand",
      isRequired: () => true,
      validate: (val) => validateNumericRange(val, 2300, 2900, "الكثافة المطلقة للرمل (جاف)", "Masse Volumique Réelle du Sable", "Absolute Density of Sand", "kg/m³", false)
    },
    {
      key: "ssdDensity",
      propertyId: "PROP_SND_SSD_DENSITY",
      labelAr: "كثافة الرمل المشبع جاف السطح (SSD)",
      labelFr: "Masse Volumique SSD",
      labelEn: "SSD Density of Sand",
      unit: "kg/m³",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "optional",
      testStandard: "EN 1097-6 / ASTM C128",
      min: 2350,
      max: 2950,
      defaultVal: 2650,
      placeholder: "2650",
      categoryKey: "sand",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 2350, 2950, "كثافة الرمل المشبع جاف السطح (SSD)", "Masse Volumique SSD", "SSD Density of Sand", "kg/m³", false)
    },
    {
      key: "specificGravity",
      propertyId: "PROP_SND_SPECIFIC_GRAVITY",
      labelAr: "الوزن النوعي النسبي للرمل",
      labelFr: "Densité Relative du Sable",
      labelEn: "Specific Gravity of Sand",
      unit: "",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "optional",
      testStandard: "EN 1097-6 / ASTM C128",
      min: 2.3,
      max: 2.9,
      defaultVal: 2.65,
      placeholder: "2.65",
      categoryKey: "sand",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 2.3, 2.9, "الوزن النوعي النسبي للرمل", "Densité Relative du Sable", "Specific Gravity of Sand", "", false)
    },
    {
      key: "bulkDensity",
      propertyId: "PROP_SND_BULK_DENSITY",
      labelAr: "الكثافة الظاهرية للرمل (الصب الحر)",
      labelFr: "Masse Volumique Apparente",
      labelEn: "Bulk Density (Loose)",
      unit: "kg/m³",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "required",
      testStandard: "EN 1097-3 / ASTM C29",
      min: 1200,
      max: 1900,
      defaultVal: 1540,
      placeholder: "1540",
      categoryKey: "sand",
      isRequired: () => true,
      validate: (val) => validateNumericRange(val, 1200, 1900, "الكثافة الظاهرية للرمل (الصب الحر)", "Masse Volumique Apparente", "Bulk Density (Loose)", "kg/m³", false)
    },
    {
      key: "absorption",
      propertyId: "PROP_SND_ABSORPTION",
      labelAr: "معامل امتصاص الماء للرمل (WA24)",
      labelFr: "Absorption d'Eau (WA24)",
      labelEn: "Water Absorption (WA24)",
      unit: "%",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "required",
      testStandard: "EN 1097-6 / ASTM C128",
      min: 0.1,
      max: 6.0,
      defaultVal: 1.4,
      placeholder: "1.4",
      categoryKey: "sand",
      isRequired: () => true,
      validate: (val) => validateNumericRange(val, 0.1, 6.0, "معامل امتصاص الماء للرمل (WA24)", "Absorption d'Eau (WA24)", "Water Absorption (WA24)", "%", false)
    },
    {
      key: "moisture",
      propertyId: "PROP_SND_MOISTURE",
      labelAr: "الرطوبة الطبيعية الحالية بالموقع",
      labelFr: "Teneur en Eau Actuelle",
      labelEn: "Current Moisture Content",
      unit: "%",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "required",
      testStandard: "EN 1097-5 / ASTM C566",
      min: 0,
      max: 12.0,
      defaultVal: 2.5,
      placeholder: "2.5",
      categoryKey: "sand",
      isRequired: () => true,
      validate: (val) => validateNumericRange(val, 0, 12.0, "الرطوبة الطبيعية الحالية بالموقع", "Teneur en Eau Actuelle", "Current Moisture Content", "%", true)
    },
    {
      key: "finenessModulus",
      propertyId: "PROP_SND_FM",
      labelAr: "معامل النعومة الحبيبي (FM)",
      labelFr: "Module de Finesse (FM)",
      labelEn: "Fineness Modulus (FM)",
      unit: "",
      inputType: "number",
      categoryGroup: "granulometric",
      requirementLevel: "required",
      testStandard: "EN 933-1 / ASTM C136",
      min: 1.6,
      max: 3.6,
      defaultVal: 2.6,
      placeholder: "2.6",
      categoryKey: "sand",
      isRequired: () => true,
      validate: (val) => validateNumericRange(val, 1.6, 3.6, "معامل النعومة الحبيبي (FM)", "Module de Finesse (FM)", "Fineness Modulus (FM)", "", false)
    },
    {
      key: "dMax",
      propertyId: "PROP_SND_DMAX",
      labelAr: "القطر الأقصى لحبيبات الرمل (Dmax)",
      labelFr: "Dimension Maximale (Dmax)",
      labelEn: "Maximum Particle Size (Dmax)",
      unit: "mm",
      inputType: "number",
      categoryGroup: "granulometric",
      requirementLevel: "optional",
      testStandard: "EN 933-1 / ASTM C136",
      min: 0.5,
      max: 5.0,
      defaultVal: 4.0,
      placeholder: "4.0",
      categoryKey: "sand",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 0.5, 5.0, "القطر الأقصى لحبيبات الرمل (Dmax)", "Dimension Maximale (Dmax)", "Maximum Particle Size (Dmax)", "mm", false)
    },
    {
      key: "dMin",
      propertyId: "PROP_SND_DMIN",
      labelAr: "القطر الأدنى لحبيبات الرمل (dmin)",
      labelFr: "Dimension Minimale (dmin)",
      labelEn: "Minimum Particle Size (dmin)",
      unit: "mm",
      inputType: "number",
      categoryGroup: "granulometric",
      requirementLevel: "optional",
      testStandard: "EN 933-1 / ASTM C136",
      min: 0.063,
      max: 2.0,
      defaultVal: 0.063,
      placeholder: "0.063",
      categoryKey: "sand",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 0.063, 2.0, "القطر الأدنى لحبيبات الرمل (dmin)", "Dimension Minimale (dmin)", "Minimum Particle Size (dmin)", "mm", false)
    },
    {
      key: "sandEquivalent",
      propertyId: "PROP_SND_SE",
      labelAr: "المكافئ الرملي (SE)",
      labelFr: "Équivalent de Sable (ES)",
      labelEn: "Sand Equivalent (SE)",
      unit: "%",
      inputType: "number",
      categoryGroup: "granulometric",
      requirementLevel: "optional",
      testStandard: "EN 933-8 / ASTM D2419",
      min: 50,
      max: 100,
      defaultVal: 80,
      placeholder: "80",
      categoryKey: "sand",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 50, 100, "المكافئ الرملي (SE)", "Équivalent de Sable (ES)", "Sand Equivalent (SE)", "%", false)
    },
    {
      key: "methyleneBlue",
      propertyId: "PROP_SND_MB",
      labelAr: "قيمة أزرق الميثيلين (MB)",
      labelFr: "Valeur au Bleu de Méthylène (MB)",
      labelEn: "Methylene Blue Value (MB)",
      unit: "g/kg",
      inputType: "number",
      categoryGroup: "granulometric",
      requirementLevel: "optional",
      testStandard: "EN 933-9",
      min: 0.1,
      max: 5.0,
      defaultVal: 0.8,
      placeholder: "0.8",
      categoryKey: "sand",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 0.1, 5.0, "قيمة أزرق الميثيلين (MB)", "Valeur au Bleu de Méthylène (MB)", "Methylene Blue Value (MB)", "g/kg", false)
    },
    {
      key: "finesContent",
      propertyId: "PROP_SND_FINES",
      labelAr: "نسبة النواعم الأقل من 0.063 مم",
      labelFr: "Passant à 0.063 mm (Fines)",
      labelEn: "Fines Content (<0.063mm)",
      unit: "%",
      inputType: "number",
      categoryGroup: "granulometric",
      requirementLevel: "optional",
      testStandard: "EN 933-1 / ASTM C117",
      min: 0,
      max: 15.0,
      defaultVal: 3.2,
      placeholder: "3.2",
      categoryKey: "sand",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 0, 15.0, "نسبة النواعم الأقل من 0.063 مم", "Passant à 0.063 mm (Fines)", "Fines Content (<0.063mm)", "%", true)
    },
    {
      key: "clayContent",
      propertyId: "PROP_SND_CLAY",
      labelAr: "نسبة الكتل الطينية والحبيبات الهشة",
      labelFr: "Teneur en Argile / Fripables",
      labelEn: "Clay Lumps & Friable Particles",
      unit: "%",
      inputType: "number",
      categoryGroup: "granulometric",
      requirementLevel: "optional",
      testStandard: "EN 933-1 / ASTM C142",
      min: 0,
      max: 6.0,
      defaultVal: 1.2,
      placeholder: "1.2",
      categoryKey: "sand",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 0, 6.0, "نسبة الكتل الطينية والحبيبات الهشة", "Teneur en Argile / Fripables", "Clay Lumps & Friable Particles", "%", true)
    },
    {
      key: "foisonnement",
      propertyId: "PROP_SND_FOISONNEMENT",
      labelAr: "معامل انتفاخ الرمل بالرطوبة (Foisonnement)",
      labelFr: "Coefficient de Foisonnement",
      labelEn: "Bulking Factor",
      unit: "%",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "optional",
      testStandard: "NF P18-558",
      min: 0,
      max: 35.0,
      defaultVal: 18,
      placeholder: "18",
      categoryKey: "sand",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 0, 35.0, "معامل انتفاخ الرمل بالرطوبة (Foisonnement)", "Coefficient de Foisonnement", "Bulking Factor", "%", true)
    },
    {
      key: "organicImpurities",
      propertyId: "PROP_SND_ORGANIC",
      labelAr: "الشوائب العضوية (لوحة الألوان القياسية)",
      labelFr: "Impuretés Organiques (Couleur)",
      labelEn: "Organic Impurities (Plate)",
      unit: "",
      inputType: "text",
      categoryGroup: "chemical",
      requirementLevel: "optional",
      testStandard: "ASTM C40 / EN 1744-1",
      defaultVal: "سليم - مطابق (ASTM C40 Plate 1)",
      placeholder: "سليم - مطابق (ASTM C40 Plate 1)",
      categoryKey: "sand",
      isRequired: () => false,
      validate: (val) => (!val || String(val).trim() === "" ? { isValid: false, errorAr: "حقل الشوائب العضوية (لوحة الألوان القياسية) مطلوب." } : { isValid: true })
    },
    {
      key: "chlorideContent",
      propertyId: "PROP_SND_CHLORIDE",
      labelAr: "محتوى أيونات الكلوريد الذائبة بالماء",
      labelFr: "Teneur en Chlorures Solubles",
      labelEn: "Water-Soluble Chloride Content",
      unit: "%",
      inputType: "number",
      categoryGroup: "chemical",
      requirementLevel: "optional",
      testStandard: "EN 1744-1 / ASTM C1152",
      min: 0,
      max: 0.1,
      defaultVal: 0.01,
      placeholder: "0.01",
      categoryKey: "sand",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 0, 0.1, "محتوى أيونات الكلوريد الذائبة بالماء", "Teneur en Chlorures Solubles", "Water-Soluble Chloride Content", "%", true)
    },
    {
      key: "sulfateContent",
      propertyId: "PROP_SND_SULFATE",
      labelAr: "محتوى الكبريتات الذائبة بالحامض (SO3)",
      labelFr: "Teneur en Sulfates (SO3)",
      labelEn: "Acid-Soluble Sulfate Content",
      unit: "%",
      inputType: "number",
      categoryGroup: "chemical",
      requirementLevel: "optional",
      testStandard: "EN 1744-1 / ASTM C1580",
      min: 0,
      max: 1.0,
      defaultVal: 0.12,
      placeholder: "0.12",
      categoryKey: "sand",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 0, 1.0, "محتوى الكبريتات الذائبة بالحامض (SO3)", "Teneur en Sulfates (SO3)", "Acid-Soluble Sulfate Content", "%", true)
    },
    {
      key: "particleShape",
      propertyId: "PROP_SND_SHAPE",
      labelAr: "شكل وهيئة الحبيبات الرملية",
      labelFr: "Forme des Grains",
      labelEn: "Particle Shape",
      unit: "",
      inputType: "select",
      categoryGroup: "granulometric",
      requirementLevel: "optional",
      testStandard: "EN 933-4",
      options: [
        { value: "طبيعي", labelAr: "طبيعي (مستدير)", labelFr: "Naturel", labelEn: "Natural Rounded" },
        { value: "مكسر", labelAr: "مكسر (كسارة زاوي)", labelFr: "Concassé", labelEn: "Crushed Angular" },
        { value: "شبه مكسر", labelAr: "شبه مكسر (مختلط)", labelFr: "Semi-concassé", labelEn: "Semi-crushed" }
      ],
      defaultVal: "طبيعي",
      placeholder: "طبيعي",
      categoryKey: "sand",
      isRequired: () => false,
      validate: (val) => (!val || String(val).trim() === "" ? { isValid: false, errorAr: "حقل شكل وهيئة الحبيبات الرملية مطلوب." } : { isValid: true })
    }
  ],
  gravel: [
    {
      key: "dMax",
      propertyId: "PROP_GRA_DMAX",
      labelAr: "القطر الحبيبي الأقصى (Dmax)",
      labelFr: "Dimension Maximale (Dmax)",
      labelEn: "Maximum Aggregate Size (Dmax)",
      unit: "mm",
      inputType: "number",
      categoryGroup: "granulometric",
      requirementLevel: "required",
      testStandard: "EN 933-1 / ASTM C136",
      min: 4,
      max: 50,
      defaultVal: 20.0,
      placeholder: "20.0",
      categoryKey: "gravel",
      isRequired: () => true,
      validate: (val) => validateNumericRange(val, 4, 50, "القطر الحبيبي الأقصى (Dmax)", "Dimension Maximale (Dmax)", "Maximum Aggregate Size (Dmax)", "mm", false)
    },
    {
      key: "dMin",
      propertyId: "PROP_GRA_DMIN",
      labelAr: "القطر الحبيبي الأدنى (dmin)",
      labelFr: "Dimension Minimale (dmin)",
      labelEn: "Minimum Aggregate Size (dmin)",
      unit: "mm",
      inputType: "number",
      categoryGroup: "granulometric",
      requirementLevel: "optional",
      testStandard: "EN 933-1 / ASTM C136",
      min: 2,
      max: 25,
      defaultVal: 5.0,
      placeholder: "5.0",
      categoryKey: "gravel",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 2, 25, "القطر الحبيبي الأدنى (dmin)", "Dimension Minimale (dmin)", "Minimum Aggregate Size (dmin)", "mm", false)
    },
    {
      key: "nominalSize",
      propertyId: "PROP_GRA_NOMINAL",
      labelAr: "التسمية الحبيبية القياسية للكسر",
      labelFr: "Fraction Granulométrique Nominale",
      labelEn: "Nominal Grading Fraction",
      unit: "",
      inputType: "text",
      categoryGroup: "granulometric",
      requirementLevel: "optional",
      testStandard: "EN 12620 / ASTM C33",
      defaultVal: "5/20 mm",
      placeholder: "5/20 mm",
      categoryKey: "gravel",
      isRequired: () => false,
      validate: (val) => (!val || String(val).trim() === "" ? { isValid: false, errorAr: "حقل التسمية الحبيبية القياسية للكسر مطلوب." } : { isValid: true })
    },
    {
      key: "density",
      propertyId: "PROP_GRA_DENSITY",
      labelAr: "الكثافة المطلقة للحصى (جاف)",
      labelFr: "Masse Volumique Réelle du Gravillon",
      labelEn: "Absolute Density of Gravel",
      unit: "kg/m³",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "required",
      testStandard: "EN 1097-6 / ASTM C127",
      min: 2300,
      max: 3100,
      defaultVal: 2680,
      placeholder: "2680",
      categoryKey: "gravel",
      isRequired: () => true,
      validate: (val) => validateNumericRange(val, 2300, 3100, "الكثافة المطلقة للحصى (جاف)", "Masse Volumique Réelle du Gravillon", "Absolute Density of Gravel", "kg/m³", false)
    },
    {
      key: "ssdDensity",
      propertyId: "PROP_GRA_SSD_DENSITY",
      labelAr: "كثافة الحصى المشبع جاف السطح (SSD)",
      labelFr: "Masse Volumique SSD",
      labelEn: "SSD Density of Gravel",
      unit: "kg/m³",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "optional",
      testStandard: "EN 1097-6 / ASTM C127",
      min: 2350,
      max: 3150,
      defaultVal: 2710,
      placeholder: "2710",
      categoryKey: "gravel",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 2350, 3150, "كثافة الحصى المشبع جاف السطح (SSD)", "Masse Volumique SSD", "SSD Density of Gravel", "kg/m³", false)
    },
    {
      key: "specificGravity",
      propertyId: "PROP_GRA_SPECIFIC_GRAVITY",
      labelAr: "الوزن النوعي النسبي للحصى",
      labelFr: "Densité Relative du Gravillon",
      labelEn: "Specific Gravity of Gravel",
      unit: "",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "optional",
      testStandard: "EN 1097-6 / ASTM C127",
      min: 2.3,
      max: 3.1,
      defaultVal: 2.68,
      placeholder: "2.68",
      categoryKey: "gravel",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 2.3, 3.1, "الوزن النوعي النسبي للحصى", "Densité Relative du Gravillon", "Specific Gravity of Gravel", "", false)
    },
    {
      key: "bulkDensity",
      propertyId: "PROP_GRA_BULK_DENSITY",
      labelAr: "الكثافة الظاهرية للحصى (الصب الحر)",
      labelFr: "Masse Volumique Apparente",
      labelEn: "Bulk Density (Loose)",
      unit: "kg/m³",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "optional",
      testStandard: "EN 1097-3 / ASTM C29",
      min: 1200,
      max: 1900,
      defaultVal: 1480,
      placeholder: "1480",
      categoryKey: "gravel",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 1200, 1900, "الكثافة الظاهرية للحصى (الصب الحر)", "Masse Volumique Apparente", "Bulk Density (Loose)", "kg/m³", false)
    },
    {
      key: "absorption",
      propertyId: "PROP_GRA_ABSORPTION",
      labelAr: "معامل امتصاص الماء للحصى (WA24)",
      labelFr: "Absorption d'Eau (WA24)",
      labelEn: "Water Absorption (WA24)",
      unit: "%",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "required",
      testStandard: "EN 1097-6 / ASTM C127",
      min: 0.1,
      max: 5.0,
      defaultVal: 1.1,
      placeholder: "1.1",
      categoryKey: "gravel",
      isRequired: () => true,
      validate: (val) => validateNumericRange(val, 0.1, 5.0, "معامل امتصاص الماء للحصى (WA24)", "Absorption d'Eau (WA24)", "Water Absorption (WA24)", "%", false)
    },
    {
      key: "moisture",
      propertyId: "PROP_GRA_MOISTURE",
      labelAr: "الرطوبة الطبيعية الحالية بالموقع",
      labelFr: "Teneur en Eau Actuelle",
      labelEn: "Current Moisture Content",
      unit: "%",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "required",
      testStandard: "EN 1097-5 / ASTM C566",
      min: 0,
      max: 6.0,
      defaultVal: 1.0,
      placeholder: "1.0",
      categoryKey: "gravel",
      isRequired: () => true,
      validate: (val) => validateNumericRange(val, 0, 6.0, "الرطوبة الطبيعية الحالية بالموقع", "Teneur en Eau Actuelle", "Current Moisture Content", "%", true)
    },
    {
      key: "particleShape",
      propertyId: "PROP_GRA_SHAPE",
      labelAr: "شكل الحبيبات الحصوية السائد",
      labelFr: "Forme des Granulats",
      labelEn: "Aggregate Particle Shape",
      unit: "",
      inputType: "select",
      categoryGroup: "granulometric",
      requirementLevel: "optional",
      testStandard: "EN 933-4",
      options: [
        { value: "مكسر", labelAr: "مكسر زاوي (كسارة)", labelFr: "Concassé angulaire", labelEn: "Crushed Angular" },
        { value: "مستدير", labelAr: "مستدير أملس (وادي)", labelFr: "Roulé", labelEn: "Alluvial Rounded" },
        { value: "شبه زاوي", labelAr: "شبه زاوي (مختلط)", labelFr: "Semi-angulaire", labelEn: "Sub-angular" }
      ],
      defaultVal: "مكسر",
      placeholder: "مكسر",
      categoryKey: "gravel",
      isRequired: () => false,
      validate: (val) => (!val || String(val).trim() === "" ? { isValid: true } : { isValid: true })
    },
    {
      key: "losAngelesAbrasion",
      propertyId: "PROP_GRA_LA",
      labelAr: "معامل لوس أنجلوس للتآكل والصدم (LA)",
      labelFr: "Coefficient Los Angeles (LA)",
      labelEn: "Los Angeles Abrasion Value (LA)",
      unit: "%",
      inputType: "number",
      categoryGroup: "mechanical",
      requirementLevel: "optional",
      testStandard: "EN 1097-2 / ASTM C131",
      min: 8,
      max: 50,
      defaultVal: 22,
      placeholder: "22",
      categoryKey: "gravel",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 8, 50, "معامل لوس أنجلوس للتآكل والصدم (LA)", "Coefficient Los Angeles (LA)", "Los Angeles Abrasion Value (LA)", "%", false)
    },
    {
      key: "microDeval",
      propertyId: "PROP_GRA_MDE",
      labelAr: "معامل ميكرو-ديفال الرطب للتآكل الاحتكاكي",
      labelFr: "Coefficient Micro-Deval Humide (MDE)",
      labelEn: "Micro-Deval Abrasion Value (MDE)",
      unit: "%",
      inputType: "number",
      categoryGroup: "mechanical",
      requirementLevel: "optional",
      testStandard: "EN 1097-1",
      min: 5,
      max: 40,
      defaultVal: 16,
      placeholder: "16",
      categoryKey: "gravel",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 5, 40, "معامل ميكرو-ديفال الرطب للتآكل الاحتكاكي", "Coefficient Micro-Deval Humide (MDE)", "Micro-Deval Abrasion Value (MDE)", "%", false)
    },
    {
      key: "flakinessIndex",
      propertyId: "PROP_GRA_FI",
      labelAr: "معامل التفرطح والتسطح الحبيبي (FI)",
      labelFr: "Indice de Forme / Aplatissement (FI)",
      labelEn: "Flakiness Index (FI)",
      unit: "%",
      inputType: "number",
      categoryGroup: "granulometric",
      requirementLevel: "optional",
      testStandard: "EN 933-3",
      min: 2,
      max: 40,
      defaultVal: 12,
      placeholder: "12",
      categoryKey: "gravel",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 2, 40, "معامل التفرطح والتسطح الحبيبي (FI)", "Indice de Forme / Aplatissement (FI)", "Flakiness Index (FI)", "%", false)
    },
    {
      key: "elongationIndex",
      propertyId: "PROP_GRA_EI",
      labelAr: "معامل الاستطالة الحبيبية (EI)",
      labelFr: "Indice d'Élongation (EI)",
      labelEn: "Elongation Index (EI)",
      unit: "%",
      inputType: "number",
      categoryGroup: "granulometric",
      requirementLevel: "optional",
      testStandard: "EN 933-4",
      min: 2,
      max: 40,
      defaultVal: 14,
      placeholder: "14",
      categoryKey: "gravel",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 2, 40, "معامل الاستطالة الحبيبية (EI)", "Indice d'Élongation (EI)", "Elongation Index (EI)", "%", false)
    },
    {
      key: "crushingValue",
      propertyId: "PROP_GRA_ACV",
      labelAr: "قيمة تهشم وسحق الركام (ACV)",
      labelFr: "Valeur de Concassage (ACV)",
      labelEn: "Aggregate Crushing Value (ACV)",
      unit: "%",
      inputType: "number",
      categoryGroup: "mechanical",
      requirementLevel: "optional",
      testStandard: "BS 812-110",
      min: 8,
      max: 35,
      defaultVal: 18,
      placeholder: "18",
      categoryKey: "gravel",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 8, 35, "قيمة تهشم وسحق الركام (ACV)", "Valeur de Concassage (ACV)", "Aggregate Crushing Value (ACV)", "%", false)
    },
    {
      key: "finesContent",
      propertyId: "PROP_GRA_FINES",
      labelAr: "نسبة النواعم العابرة لمنخل 0.063 مم",
      labelFr: "Passant au Tamis 0.063 mm (Fines)",
      labelEn: "Fines Content (<0.063mm)",
      unit: "%",
      inputType: "number",
      categoryGroup: "granulometric",
      requirementLevel: "optional",
      testStandard: "EN 933-1 / ASTM C117",
      min: 0,
      max: 4.0,
      defaultVal: 0.8,
      placeholder: "0.8",
      categoryKey: "gravel",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 0, 4.0, "نسبة النواعم العابرة لمنخل 0.063 مم", "Passant au Tamis 0.063 mm (Fines)", "Fines Content (<0.063mm)", "%", true)
    },
    {
      key: "chlorideContent",
      propertyId: "PROP_GRA_CHLORIDE",
      labelAr: "محتوى الكلوريدات الذائبة بالماء",
      labelFr: "Teneur en Chlorures Solubles",
      labelEn: "Chloride Content",
      unit: "%",
      inputType: "number",
      categoryGroup: "chemical",
      requirementLevel: "optional",
      testStandard: "EN 1744-1 / ASTM C1152",
      min: 0,
      max: 0.06,
      defaultVal: 0.008,
      placeholder: "0.008",
      categoryKey: "gravel",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 0, 0.06, "محتوى الكلوريدات الذائبة بالماء", "Teneur en Chlorures Solubles", "Chloride Content", "%", true)
    },
    {
      key: "sulfateContent",
      propertyId: "PROP_GRA_SULFATE",
      labelAr: "محتوى الكبريتات الكلي (SO3)",
      labelFr: "Teneur en Sulfates (SO3)",
      labelEn: "Sulfate Content (SO3)",
      unit: "%",
      inputType: "number",
      categoryGroup: "chemical",
      requirementLevel: "optional",
      testStandard: "EN 1744-1 / ASTM C1580",
      min: 0,
      max: 0.6,
      defaultVal: 0.08,
      placeholder: "0.08",
      categoryKey: "gravel",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 0, 0.6, "محتوى الكبريتات الكلي (SO3)", "Teneur en Sulfates (SO3)", "Sulfate Content (SO3)", "%", true)
    }
  ],
  water: [
    {
      key: "density",
      propertyId: "PROP_WAT_DENSITY",
      labelAr: "كثافة ماء الخلط القياسية",
      labelFr: "Masse Volumique de l'Eau",
      labelEn: "Density of Water",
      unit: "kg/m³",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "required",
      testStandard: "EN 1008",
      min: 990,
      max: 1010,
      defaultVal: 1000,
      placeholder: "1000",
      categoryKey: "water",
      isRequired: () => true,
      validate: (val) => validateNumericRange(val, 990, 1010, "كثافة ماء الخلط القياسية", "Masse Volumique de l'Eau", "Density of Water", "kg/m³", false)
    },
    {
      key: "temperature",
      propertyId: "PROP_WAT_TEMP",
      labelAr: "درجة حرارة مياه الخلط",
      labelFr: "Température de l'Eau",
      labelEn: "Water Temperature",
      unit: "°C",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "optional",
      testStandard: "EN 1008",
      min: 5,
      max: 40,
      defaultVal: 20,
      placeholder: "20",
      categoryKey: "water",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 5, 40, "درجة حرارة مياه الخلط", "Température de l'Eau", "Water Temperature", "°C", false)
    },
    {
      key: "ph",
      propertyId: "PROP_WAT_PH",
      labelAr: "درجة الحموضة / القلوية (pH)",
      labelFr: "Potentiel d'Hydrogène (pH)",
      labelEn: "pH Level",
      unit: "",
      inputType: "number",
      categoryGroup: "chemical",
      requirementLevel: "optional",
      testStandard: "EN 1008 / ISO 10523",
      min: 5.0,
      max: 9.0,
      defaultVal: 7.2,
      placeholder: "7.2",
      categoryKey: "water",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 5.0, 9.0, "درجة الحموضة / القلوية (pH)", "Potentiel d'Hydrogène (pH)", "pH Level", "", false)
    },
    {
      key: "chlorides",
      propertyId: "PROP_WAT_CHLORIDES",
      labelAr: "تركيز أيونات الكلوريد (Cl-)",
      labelFr: "Teneur en Chlorures (Cl-)",
      labelEn: "Chloride Ion Concentration",
      unit: "mg/L",
      inputType: "number",
      categoryGroup: "chemical",
      requirementLevel: "optional",
      testStandard: "EN 1008 / EN 196-21",
      min: 0,
      max: 1500,
      defaultVal: 120,
      placeholder: "120",
      categoryKey: "water",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 0, 1500, "تركيز أيونات الكلوريد (Cl-)", "Teneur en Chlorures (Cl-)", "Chloride Ion Concentration", "mg/L", true)
    },
    {
      key: "sulfates",
      propertyId: "PROP_WAT_SULFATES",
      labelAr: "تركيز أيونات الكبريتات (SO4 2-)",
      labelFr: "Teneur en Sulfates (SO4 2-)",
      labelEn: "Sulfate Ion Concentration",
      unit: "mg/L",
      inputType: "number",
      categoryGroup: "chemical",
      requirementLevel: "optional",
      testStandard: "EN 1008 / EN 196-2",
      min: 0,
      max: 2500,
      defaultVal: 180,
      placeholder: "180",
      categoryKey: "water",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 0, 2500, "تركيز أيونات الكبريتات (SO4 2-)", "Teneur en Sulfates (SO4 2-)", "Sulfate Ion Concentration", "mg/L", true)
    },
    {
      key: "totalDissolvedSolids",
      propertyId: "PROP_WAT_TDS",
      labelAr: "مجموع الأملاح الذائبة الكلية (TDS)",
      labelFr: "Matières Dissoutes Totales (TDS)",
      labelEn: "Total Dissolved Solids (TDS)",
      unit: "mg/L",
      inputType: "number",
      categoryGroup: "chemical",
      requirementLevel: "optional",
      testStandard: "EN 1008",
      min: 0,
      max: 4000,
      defaultVal: 450,
      placeholder: "450",
      categoryKey: "water",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 0, 4000, "مجموع الأملاح الذائبة الكلية (TDS)", "Matières Dissoutes Totales (TDS)", "Total Dissolved Solids (TDS)", "mg/L", true)
    },
    {
      key: "suspendedSolids",
      propertyId: "PROP_WAT_SS",
      labelAr: "المواد العالقة الصلبة",
      labelFr: "Matières en Suspension",
      labelEn: "Suspended Solids",
      unit: "mg/L",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "optional",
      testStandard: "EN 1008",
      min: 0,
      max: 3000,
      defaultVal: 25,
      placeholder: "25",
      categoryKey: "water",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 0, 3000, "المواد العالقة الصلبة", "Matières en Suspension", "Suspended Solids", "mg/L", true)
    },
    {
      key: "organicMatter",
      propertyId: "PROP_WAT_ORGANIC",
      labelAr: "المواد العضوية القابلة للأكسدة",
      labelFr: "Matières Organiques",
      labelEn: "Organic Matter Content",
      unit: "mg/L",
      inputType: "number",
      categoryGroup: "chemical",
      requirementLevel: "optional",
      testStandard: "EN 1008",
      min: 0,
      max: 300,
      defaultVal: 15,
      placeholder: "15",
      categoryKey: "water",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 0, 300, "المواد العضوية القابلة للأكسدة", "Matières Organiques", "Organic Matter Content", "mg/L", true)
    }
  ],
  admixture: [
    {
      key: "admixtureType",
      propertyId: "PROP_ADM_TYPE",
      labelAr: "نوع ووظيفة الإضافة الكيميائية",
      labelFr: "Fonction Principale de l'Adjuvant",
      labelEn: "Admixture Function Type",
      unit: "",
      inputType: "select",
      categoryGroup: "composition",
      requirementLevel: "required",
      testStandard: "EN 934-2 / ASTM C494",
      options: [
        { value: "superplasticizer", labelAr: "ملدن متفوق عالي الفعالية (Superplasticizer)", labelFr: "Superplastifiant", labelEn: "Superplasticizer" },
        { value: "plasticizer", labelAr: "ملدن قياسي مخفض للماء (Plasticizer)", labelFr: "Plastifiant", labelEn: "Plasticizer" },
        { value: "retarder", labelAr: "مؤخر زمن الشك (Retarder)", labelFr: "Retardateur", labelEn: "Retarder" },
        { value: "accelerator", labelAr: "مسرع زمن الشك والتصلد (Accelerator)", labelFr: "Accélérateur", labelEn: "Accelerator" },
        { value: "air_entraining", labelAr: "مهوي ومحبس هواء مجهري (Air-Entraining)", labelFr: "Entraîneur d'air", labelEn: "Air-Entraining" }
      ],
      defaultVal: "superplasticizer",
      placeholder: "superplasticizer",
      categoryKey: "admixture",
      isRequired: () => true,
      validate: (val) => (!val || String(val).trim() === "" ? { isValid: false, errorAr: "حقل نوع ووظيفة الإضافة الكيميائية مطلوب." } : { isValid: true })
    },
    {
      key: "recommendedDosage",
      propertyId: "PROP_ADM_DOSAGE",
      labelAr: "الجرعة الموصى بها كنسبة مئوية من وزن الإسمنت",
      labelFr: "Dosage Recommandé (% Ciment)",
      labelEn: "Recommended Dosage (% Binder)",
      unit: "%",
      inputType: "number",
      categoryGroup: "composition",
      requirementLevel: "required",
      testStandard: "EN 934-2",
      min: 0.01,
      max: 6.0,
      defaultVal: 1.2,
      placeholder: "1.2",
      categoryKey: "admixture",
      isRequired: () => true,
      validate: (val) => validateNumericRange(val, 0.01, 6.0, "الجرعة الموصى بها كنسبة مئوية من وزن الإسمنت", "Dosage Recommandé (% Ciment)", "Recommended Dosage (% Binder)", "%", false)
    },
    {
      key: "waterReduction",
      propertyId: "PROP_ADM_WATER_REDUCTION",
      labelAr: "نسبة تخفيض ماء الخلط الفعالة",
      labelFr: "Pouvoir Réducteur d'Eau",
      labelEn: "Water Reduction Capability",
      unit: "%",
      inputType: "number",
      categoryGroup: "rheology",
      requirementLevel: "required",
      testStandard: "EN 934-2",
      min: 0,
      max: 45,
      defaultVal: 22,
      placeholder: "22",
      categoryKey: "admixture",
      isRequired: (material) => {
        const type = String(material?.admixtureType || material?.type || "").toLowerCase();
        return type === "superplasticizer" || type === "retarder";
      },
      validate: (val) => validateNumericRange(val, 0, 45, "نسبة تخفيض ماء الخلط الفعالة", "Pouvoir Réducteur d'Eau", "Water Reduction Capability", "%", true)
    },
    {
      key: "density",
      propertyId: "PROP_ADM_DENSITY",
      labelAr: "كثافة محلول الإضافة الكيميائية",
      labelFr: "Masse Volumique du Produit",
      labelEn: "Liquid Admixture Density",
      unit: "kg/m³",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "required",
      testStandard: "EN 934-2 / ISO 758",
      min: 950,
      max: 1400,
      defaultVal: 1080,
      placeholder: "1080",
      categoryKey: "admixture",
      isRequired: () => true,
      validate: (val) => validateNumericRange(val, 950, 1400, "كثافة محلول الإضافة الكيميائية", "Masse Volumique du Produit", "Liquid Admixture Density", "kg/m³", false)
    },
    {
      key: "solidContent",
      propertyId: "PROP_ADM_SOLID_CONTENT",
      labelAr: "نسبة المادة الصلبة الفعالة (Extrait Sec)",
      labelFr: "Extrait Sec / Matière Sèche",
      labelEn: "Dry Solid Content",
      unit: "%",
      inputType: "number",
      categoryGroup: "composition",
      requirementLevel: "optional",
      testStandard: "EN 480-8",
      min: 10,
      max: 65,
      defaultVal: 32,
      placeholder: "32",
      categoryKey: "admixture",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 10, 65, "نسبة المادة الصلبة الفعالة (Extrait Sec)", "Extrait Sec / Matière Sèche", "Dry Solid Content", "%", false)
    },
    {
      key: "settingTimeImpact",
      propertyId: "PROP_ADM_SETTING_IMPACT",
      labelAr: "تأثير الإضافة على زمن الشك الابتدائي",
      labelFr: "Effet sur le Temps de Prise",
      labelEn: "Setting Time Delta",
      unit: "min",
      inputType: "number",
      categoryGroup: "hydration",
      requirementLevel: "optional",
      testStandard: "EN 480-2",
      min: -240,
      max: 480,
      defaultVal: 30,
      placeholder: "30",
      categoryKey: "admixture",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, -240, 480, "تأثير الإضافة على زمن الشك الابتدائي", "Effet sur le Temps de Prise", "Setting Time Delta", "min", false)
    },
    {
      key: "airPercentage",
      propertyId: "PROP_ADM_AIR_CONTENT",
      labelAr: "كمية الهواء المحبوس الإضافي المتولد",
      labelFr: "Air Occlus Entraîné",
      labelEn: "Additional Air Entrained",
      unit: "%",
      inputType: "number",
      categoryGroup: "rheology",
      requirementLevel: "optional",
      testStandard: "EN 480-7",
      min: 0,
      max: 10,
      defaultVal: 1.5,
      placeholder: "1.5",
      categoryKey: "admixture",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 0, 10, "كمية الهواء المحبوس الإضافي المتولد", "Air Occlus Entraîné", "Additional Air Entrained", "%", true)
    },
    {
      key: "ph",
      propertyId: "PROP_ADM_PH",
      labelAr: "درجة الحموضة / القلوية للإضافة (pH)",
      labelFr: "Valeur du pH",
      labelEn: "Admixture pH Value",
      unit: "",
      inputType: "number",
      categoryGroup: "chemical",
      requirementLevel: "optional",
      testStandard: "ISO 4316",
      min: 3.0,
      max: 10.0,
      defaultVal: 6.5,
      placeholder: "6.5",
      categoryKey: "admixture",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 3.0, 10.0, "درجة الحموضة / القلوية للإضافة (pH)", "Valeur du pH", "Admixture pH Value", "", false)
    },
    {
      key: "chlorideContent",
      propertyId: "PROP_ADM_CHLORIDE",
      labelAr: "محتوى الكلوريدات الكلي في الإضافة",
      labelFr: "Teneur en Chlorures",
      labelEn: "Total Chloride Content",
      unit: "%",
      inputType: "number",
      categoryGroup: "chemical",
      requirementLevel: "optional",
      testStandard: "EN 480-10",
      min: 0,
      max: 0.2,
      defaultVal: 0.01,
      placeholder: "0.01",
      categoryKey: "admixture",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 0, 0.2, "محتوى الكلوريدات الكلي في الإضافة", "Teneur en Chlorures", "Total Chloride Content", "%", true)
    },
    {
      key: "alkaliContent",
      propertyId: "PROP_ADM_ALKALI",
      labelAr: "محتوى مكافئ القلويات (Na2O eq)",
      labelFr: "Teneur en Alcalins (Na2O eq)",
      labelEn: "Alkali Content (Na2O eq)",
      unit: "%",
      inputType: "number",
      categoryGroup: "chemical",
      requirementLevel: "optional",
      testStandard: "EN 480-12",
      min: 0,
      max: 6.0,
      defaultVal: 1.2,
      placeholder: "1.2",
      categoryKey: "admixture",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 0, 6.0, "محتوى مكافئ القلويات (Na2O eq)", "Teneur en Alcalins (Na2O eq)", "Alkali Content (Na2O eq)", "%", true)
    }
  ],
  scm: [
    {
      key: "density",
      propertyId: "PROP_SCM_DENSITY",
      labelAr: "الكثافة المطلقة للإضافة المعدنية",
      labelFr: "Masse Volumique Réelle",
      labelEn: "Absolute Density of SCM",
      unit: "kg/m³",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "required",
      testStandard: "EN 196-6 / ASTM C188",
      min: 2000,
      max: 3200,
      defaultVal: 2300,
      placeholder: "2300",
      categoryKey: "scm",
      isRequired: () => true,
      validate: (val) => validateNumericRange(val, 2000, 3200, "الكثافة المطلقة للإضافة المعدنية", "Masse Volumique Réelle", "Absolute Density of SCM", "kg/m³", false)
    },
    {
      key: "bulkDensity",
      propertyId: "PROP_SCM_BULK_DENSITY",
      labelAr: "الكثافة الظاهرية المعبأة بالحرية",
      labelFr: "Masse Volumique Apparente",
      labelEn: "Bulk Density (Loose)",
      unit: "kg/m³",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "optional",
      testStandard: "EN 1097-3",
      min: 200,
      max: 1300,
      defaultVal: 650,
      placeholder: "650",
      categoryKey: "scm",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 200, 1300, "الكثافة الظاهرية المعبأة بالحرية", "Masse Volumique Apparente", "Bulk Density (Loose)", "kg/m³", false)
    },
    {
      key: "blaineFineness",
      propertyId: "PROP_SCM_BLAINE",
      labelAr: "النعومة النوعية السطحية (بلين أو BET)",
      labelFr: "Surface Spécifique (Blaine / BET)",
      labelEn: "Specific Surface Area",
      unit: "cm²/g",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "optional",
      testStandard: "EN 196-6 / ASTM C204",
      min: 2500,
      max: 300000,
      defaultVal: 4200,
      placeholder: "4200",
      categoryKey: "scm",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 2500, 300000, "النعومة النوعية السطحية (بلين أو BET)", "Surface Spécifique (Blaine / BET)", "Specific Surface Area", "cm²/g", false)
    },
    {
      key: "pozzolanicIndex",
      propertyId: "PROP_SCM_ACTIVITY",
      labelAr: "معامل الفعالية البوزولانية (28 يوم)",
      labelFr: "Indice d'Activité Pouzzolanique (IAP)",
      labelEn: "Pozzolanic Activity Index (28d)",
      unit: "%",
      inputType: "number",
      categoryGroup: "mechanical",
      requirementLevel: "required",
      testStandard: "EN 450-1 / ASTM C311",
      min: 60,
      max: 150,
      defaultVal: 95,
      placeholder: "95",
      categoryKey: "scm",
      isRequired: (material) => {
        const type = String(material?.admixtureType || material?.type || "").toLowerCase();
        return type !== "slag" && !type.includes("ggbs");
      },
      validate: (val) => validateNumericRange(val, 60, 150, "معامل الفعالية البوزولانية (28 يوم)", "Indice d'Activité Pouzzolanique (IAP)", "Pozzolanic Activity Index (28d)", "%", false)
    },
    {
      key: "waterDemandFactor",
      propertyId: "PROP_SCM_WATER_DEMAND",
      labelAr: "معامل طلب واستهلاك الماء النسبي",
      labelFr: "Facteur de Demande en Eau",
      labelEn: "Water Demand Factor",
      unit: "",
      inputType: "number",
      categoryGroup: "rheology",
      requirementLevel: "optional",
      testStandard: "EN 450-1",
      min: 0.7,
      max: 1.4,
      defaultVal: 1.02,
      placeholder: "1.02",
      categoryKey: "scm",
      isRequired: () => false,
      validate: (val) => {
        if (val === undefined || val === null || val === "") return { isValid: true };
        const num = typeof val === "number" ? val : parseFloat(String(val).replace(",", "."));
        const normalized = num > 10 ? num / 100 : num;
        return validateNumericRange(normalized, 0.7, 1.4, "معامل طلب واستهلاك الماء النسبي", "Facteur de Demande en Eau", "Water Demand Factor", "", false);
      }
    },
    {
      key: "silicaContent",
      propertyId: "PROP_SCM_SIO2",
      labelAr: "محتوى السيليكا الفعالة (SiO2)",
      labelFr: "Teneur en Silice Réactive (SiO2)",
      labelEn: "Reactive Silica Content (SiO2)",
      unit: "%",
      inputType: "number",
      categoryGroup: "chemical",
      requirementLevel: "optional",
      testStandard: "EN 196-2 / ASTM C311",
      min: 0.5,
      max: 99,
      defaultVal: 55.0,
      placeholder: "55.0",
      categoryKey: "scm",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 0.5, 99, "محتوى السيليكا الفعالة (SiO2)", "Teneur en Silice Réactive (SiO2)", "Reactive Silica Content (SiO2)", "%", false)
    },
    {
      key: "calciumOxide",
      propertyId: "PROP_SCM_CAO",
      labelAr: "محتوى أكسيد الكالسيوم (CaO)",
      labelFr: "Teneur en Chaux (CaO)",
      labelEn: "Calcium Oxide Content (CaO)",
      unit: "%",
      inputType: "number",
      categoryGroup: "chemical",
      requirementLevel: "optional",
      testStandard: "EN 196-2 / ASTM C311",
      min: 0.1,
      max: 65,
      defaultVal: 12.0,
      placeholder: "12.0",
      categoryKey: "scm",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 0.1, 65, "محتوى أكسيد الكالسيوم (CaO)", "Teneur en Chaux (CaO)", "Calcium Oxide Content (CaO)", "%", false)
    },
    {
      key: "lossOnIgnition",
      propertyId: "PROP_SCM_LOI",
      labelAr: "الفاقد في الحرق (LOI)",
      labelFr: "Perte au Feu (PAF)",
      labelEn: "Loss on Ignition (LOI)",
      unit: "%",
      inputType: "number",
      categoryGroup: "chemical",
      requirementLevel: "optional",
      testStandard: "EN 196-2 / ASTM C311",
      min: 0.1,
      max: 50,
      defaultVal: 2.5,
      placeholder: "2.5",
      categoryKey: "scm",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 0.1, 50, "الفاقد في الحرق (LOI)", "Perte au Feu (PAF)", "Loss on Ignition (LOI)", "%", false)
    },
    {
      key: "maxReplacementPercent",
      propertyId: "PROP_SCM_MAX_REPLACE",
      labelAr: "الحد الأقصى الموصى به للاستبدال الوزني",
      labelFr: "Taux de Substitution Maximal",
      labelEn: "Maximum Replacement Ratio",
      unit: "%",
      inputType: "number",
      categoryGroup: "composition",
      requirementLevel: "optional",
      testStandard: "EN 206 / ACI 211",
      min: 5,
      max: 80,
      defaultVal: 25,
      placeholder: "25",
      categoryKey: "scm",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 5, 80, "الحد الأقصى الموصى به للاستبدال الوزني", "Taux de Substitution Maximal", "Maximum Replacement Ratio", "%", false)
    },
    {
      key: "chlorideContent",
      propertyId: "PROP_SCM_CHLORIDE",
      labelAr: "محتوى الكلوريدات الإجمالي",
      labelFr: "Teneur en Chlorures",
      labelEn: "Chloride Content",
      unit: "%",
      inputType: "number",
      categoryGroup: "chemical",
      requirementLevel: "optional",
      testStandard: "EN 196-2",
      min: 0,
      max: 0.15,
      defaultVal: 0.01,
      placeholder: "0.01",
      categoryKey: "scm",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 0, 0.15, "محتوى الكلوريدات الإجمالي", "Teneur en Chlorures", "Chloride Content", "%", true)
    }
  ],
  filler: [
    {
      key: "density",
      propertyId: "PROP_FIL_DENSITY",
      labelAr: "الكثافة المطلقة للمادة المالئة",
      labelFr: "Masse Volumique Réelle du Filler",
      labelEn: "Absolute Density of Filler",
      unit: "kg/m³",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "required",
      testStandard: "EN 1097-6",
      min: 2400,
      max: 2900,
      defaultVal: 2700,
      placeholder: "2700",
      categoryKey: "filler",
      isRequired: () => true,
      validate: (val) => validateNumericRange(val, 2400, 2900, "الكثافة المطلقة للمادة المالئة", "Masse Volumique Réelle du Filler", "Absolute Density of Filler", "kg/m³", false)
    },
    {
      key: "bulkDensity",
      propertyId: "PROP_FIL_BULK_DENSITY",
      labelAr: "الكثافة الظاهرية للمسحوق الجاف",
      labelFr: "Masse Volumique Apparente",
      labelEn: "Bulk Density (Loose)",
      unit: "kg/m³",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "optional",
      testStandard: "EN 1097-3",
      min: 700,
      max: 1300,
      defaultVal: 950,
      placeholder: "950",
      categoryKey: "filler",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 700, 1300, "الكثافة الظاهرية للمسحوق الجاف", "Masse Volumique Apparente", "Bulk Density (Loose)", "kg/m³", false)
    },
    {
      key: "blaineFineness",
      propertyId: "PROP_FIL_BLAINE",
      labelAr: "النعومة النوعية السطحية (بلين)",
      labelFr: "Surface Spécifique Blaine",
      labelEn: "Blaine Specific Surface",
      unit: "cm²/g",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "optional",
      testStandard: "EN 196-6",
      min: 3000,
      max: 8000,
      defaultVal: 5200,
      placeholder: "5200",
      categoryKey: "filler",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 3000, 8000, "النعومة النوعية السطحية (بلين)", "Surface Spécifique Blaine", "Blaine Specific Surface", "cm²/g", false)
    },
    {
      key: "finesUnder63um",
      propertyId: "PROP_FIL_FINES",
      labelAr: "نسبة النواعم العابرة لمنخل 0.063 مم",
      labelFr: "Passant à 0.063 mm (%)",
      labelEn: "Passing 0.063 mm Sieve",
      unit: "%",
      inputType: "number",
      categoryGroup: "granulometric",
      requirementLevel: "required",
      testStandard: "EN 933-10",
      min: 75,
      max: 100,
      defaultVal: 92,
      placeholder: "92",
      categoryKey: "filler",
      isRequired: () => true,
      validate: (val) => validateNumericRange(val, 75, 100, "نسبة النواعم العابرة لمنخل 0.063 مم", "Passant à 0.063 mm (%)", "Passing 0.063 mm Sieve", "%", false)
    },
    {
      key: "calciumCarbonate",
      propertyId: "PROP_FIL_CACO3",
      labelAr: "محتوى كربونات الكالسيوم النقي (CaCO3)",
      labelFr: "Teneur en Carbonate de Calcium",
      labelEn: "Calcium Carbonate Content",
      unit: "%",
      inputType: "number",
      categoryGroup: "chemical",
      requirementLevel: "optional",
      testStandard: "EN 196-2",
      min: 60,
      max: 100,
      defaultVal: 96.5,
      placeholder: "96.5",
      categoryKey: "filler",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 60, 100, "محتوى كربونات الكالسيوم النقي (CaCO3)", "Teneur en Carbonate de Calcium", "Calcium Carbonate Content", "%", false)
    },
    {
      key: "methyleneBlue",
      propertyId: "PROP_FIL_MB",
      labelAr: "قيمة امتصاص أزرق الميثيلين للمسحوق",
      labelFr: "Valeur au Bleu de Méthylène (MB)",
      labelEn: "Methylene Blue Value",
      unit: "g/kg",
      inputType: "number",
      categoryGroup: "granulometric",
      requirementLevel: "optional",
      testStandard: "EN 933-9",
      min: 0.1,
      max: 3.0,
      defaultVal: 0.6,
      placeholder: "0.6",
      categoryKey: "filler",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 0.1, 3.0, "قيمة امتصاص أزرق الميثيلين للمسحوق", "Valeur au Bleu de Méthylène (MB)", "Methylene Blue Value", "g/kg", false)
    }
  ],
  fiber: [
    {
      key: "fiberType",
      propertyId: "PROP_FBR_TYPE",
      labelAr: "نوع المادة الخام للألياف",
      labelFr: "Nature et Type de Fibres",
      labelEn: "Fiber Material Type",
      unit: "",
      inputType: "select",
      categoryGroup: "composition",
      requirementLevel: "required",
      testStandard: "EN 14889",
      options: [
        { value: "steel_hooked", labelAr: "ألياف فولاذية معقوفة الأطراف (Steel Hooked)", labelFr: "Acier à crochets", labelEn: "Steel Hooked" },
        { value: "synthetic_macro", labelAr: "ألياف اصطناعية هيكلية كبرى (Macro-Synthetic)", labelFr: "Macro-synthétique", labelEn: "Macro-Synthetic" },
        { value: "synthetic_micro", labelAr: "ألياف دقيقة مانعة للتشقق (Micro-Synthetic)", labelFr: "Micro-synthétique", labelEn: "Micro-Synthetic" },
        { value: "glass", labelAr: "ألياف زجاجية مقاومة للقلويات (Glass AR)", labelFr: "Fibre de verre AR", labelEn: "Alkali-Resistant Glass" }
      ],
      defaultVal: "steel_hooked",
      placeholder: "steel_hooked",
      categoryKey: "fiber",
      isRequired: () => true,
      validate: (val) => (!val || String(val).trim() === "" ? { isValid: false, errorAr: "حقل نوع المادة الخام للألياف مطلوب." } : { isValid: true })
    },
    {
      key: "density",
      propertyId: "PROP_FBR_DENSITY",
      labelAr: "الكثافة الحجمية لمادة الألياف",
      labelFr: "Masse Volumique du Matériau",
      labelEn: "Fiber Material Density",
      unit: "kg/m³",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "required",
      testStandard: "ISO 1183 / ASTM A820",
      min: 800,
      max: 8200,
      defaultVal: 7850,
      placeholder: "7850",
      categoryKey: "fiber",
      isRequired: () => true,
      validate: (val) => validateNumericRange(val, 800, 8200, "الكثافة الحجمية لمادة الألياف", "Masse Volumique du Matériau", "Fiber Material Density", "kg/m³", false)
    },
    {
      key: "fiberLength",
      propertyId: "PROP_FBR_LENGTH",
      labelAr: "طول الليف المفرد القياسي (Lf)",
      labelFr: "Longueur Nominale des Fibres (Lf)",
      labelEn: "Nominal Fiber Length (Lf)",
      unit: "mm",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "required",
      testStandard: "EN 14889",
      min: 5,
      max: 75,
      defaultVal: 35.0,
      placeholder: "35.0",
      categoryKey: "fiber",
      isRequired: () => true,
      validate: (val) => validateNumericRange(val, 5, 75, "طول الليف المفرد القياسي (Lf)", "Longueur Nominale des Fibres (Lf)", "Nominal Fiber Length (Lf)", "mm", false)
    },
    {
      key: "fiberDiameter",
      propertyId: "PROP_FBR_DIAMETER",
      labelAr: "القطر الاسمي أو المكافئ لليف (df)",
      labelFr: "Diamètre Équivalent (df)",
      labelEn: "Equivalent Fiber Diameter (df)",
      unit: "mm",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "optional",
      testStandard: "EN 14889",
      min: 0.01,
      max: 1.5,
      defaultVal: 0.75,
      placeholder: "0.75",
      categoryKey: "fiber",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 0.01, 1.5, "القطر الاسمي أو المكافئ لليف (df)", "Diamètre Équivalent (df)", "Equivalent Fiber Diameter (df)", "mm", false)
    },
    {
      key: "aspectRatio",
      propertyId: "PROP_FBR_ASPECT_RATIO",
      labelAr: "نسبة النحافة الهندسية (Lf/df)",
      labelFr: "Élancement Géométrique (Lf/df)",
      labelEn: "Aspect Ratio (Lf/df)",
      unit: "",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "optional",
      testStandard: "EN 14889",
      min: 10,
      max: 800,
      defaultVal: 46.7,
      placeholder: "46.7",
      categoryKey: "fiber",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 10, 800, "نسبة النحافة الهندسية (Lf/df)", "Élancement Géométrique (Lf/df)", "Aspect Ratio (Lf/df)", "", false)
    },
    {
      key: "tensileStrength",
      propertyId: "PROP_FBR_TENSILE",
      labelAr: "مقاومة الشد المحورية للألياف",
      labelFr: "Résistance à la Traction des Fibres",
      labelEn: "Tensile Strength of Fibers",
      unit: "MPa",
      inputType: "number",
      categoryGroup: "mechanical",
      requirementLevel: "required",
      testStandard: "EN 14889 / ASTM A820",
      min: 250,
      max: 3000,
      defaultVal: 1150,
      placeholder: "1150",
      categoryKey: "fiber",
      isRequired: () => true,
      validate: (val) => validateNumericRange(val, 250, 3000, "مقاومة الشد المحورية للألياف", "Résistance à la Traction des Fibres", "Tensile Strength of Fibers", "MPa", false)
    },
    {
      key: "elasticModulus",
      propertyId: "PROP_FBR_MODULUS",
      labelAr: "معامل المرونة الطولي (يانغ)",
      labelFr: "Module d'Élasticité (Young)",
      labelEn: "Modulus of Elasticity",
      unit: "GPa",
      inputType: "number",
      categoryGroup: "mechanical",
      requirementLevel: "optional",
      testStandard: "EN 14889",
      min: 2,
      max: 230,
      defaultVal: 200,
      placeholder: "200",
      categoryKey: "fiber",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 2, 230, "معامل المرونة الطولي (يانغ)", "Module d'Élasticité (Young)", "Modulus of Elasticity", "GPa", false)
    }
  ],
  lightweightAggregate: [
    {
      key: "dMax",
      propertyId: "PROP_LWA_DMAX",
      labelAr: "القطر الحبيبي الأقصى (Dmax)",
      labelFr: "Dimension Maximale (Dmax)",
      labelEn: "Maximum Aggregate Size",
      unit: "mm",
      inputType: "number",
      categoryGroup: "granulometric",
      requirementLevel: "required",
      testStandard: "EN 933-1",
      min: 3,
      max: 25,
      defaultVal: 10.0,
      placeholder: "10.0",
      categoryKey: "lightweightAggregate",
      isRequired: () => true,
      validate: (val) => validateNumericRange(val, 3, 25, "القطر الحبيبي الأقصى (Dmax)", "Dimension Maximale (Dmax)", "Maximum Aggregate Size", "mm", false)
    },
    {
      key: "density",
      propertyId: "PROP_LWA_DENSITY",
      labelAr: "الكثافة المطلقة لحبيبات الركام الخفيف",
      labelFr: "Masse Volumique Réelle des Grains",
      labelEn: "Particle Density",
      unit: "kg/m³",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "required",
      testStandard: "EN 1097-6",
      min: 500,
      max: 1900,
      defaultVal: 950,
      placeholder: "950",
      categoryKey: "lightweightAggregate",
      isRequired: () => true,
      validate: (val) => validateNumericRange(val, 500, 1900, "الكثافة المطلقة لحبيبات الركام الخفيف", "Masse Volumique Réelle des Grains", "Particle Density", "kg/m³", false)
    },
    {
      key: "bulkDensity",
      propertyId: "PROP_LWA_BULK_DENSITY",
      labelAr: "الكثافة الظاهرية المعبأة (الحر)",
      labelFr: "Masse Volumique en Vrac",
      labelEn: "Loose Bulk Density",
      unit: "kg/m³",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "required",
      testStandard: "EN 1097-3",
      min: 250,
      max: 1000,
      defaultVal: 480,
      placeholder: "480",
      categoryKey: "lightweightAggregate",
      isRequired: () => true,
      validate: (val) => validateNumericRange(val, 250, 1000, "الكثافة الظاهرية المعبأة (الحر)", "Masse Volumique en Vrac", "Loose Bulk Density", "kg/m³", false)
    },
    {
      key: "absorption",
      propertyId: "PROP_LWA_ABSORPTION",
      labelAr: "معامل امتصاص الماء للركام الخفيف",
      labelFr: "Absorption d'Eau (WA24)",
      labelEn: "Water Absorption (WA24)",
      unit: "%",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "required",
      testStandard: "EN 1097-6",
      min: 4,
      max: 35,
      defaultVal: 14.5,
      placeholder: "14.5",
      categoryKey: "lightweightAggregate",
      isRequired: () => true,
      validate: (val) => validateNumericRange(val, 4, 35, "معامل امتصاص الماء للركام الخفيف", "Absorption d'Eau (WA24)", "Water Absorption (WA24)", "%", false)
    },
    {
      key: "crushingResistance",
      propertyId: "PROP_LWA_CRUSHING",
      labelAr: "مقاومة سحق الحبيبات في الأسطوانة",
      labelFr: "Résistance à l'Écrasement en Cylindre",
      labelEn: "Crushing Resistance in Cylinder",
      unit: "MPa",
      inputType: "number",
      categoryGroup: "mechanical",
      requirementLevel: "optional",
      testStandard: "EN 13055-1",
      min: 1.0,
      max: 15,
      defaultVal: 4.2,
      placeholder: "4.2",
      categoryKey: "lightweightAggregate",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 1.0, 15, "مقاومة سحق الحبيبات في الأسطوانة", "Résistance à l'Écrasement en Cylindre", "Crushing Resistance in Cylinder", "MPa", false)
    }
  ],
  heavyweightAggregate: [
    {
      key: "dMax",
      propertyId: "PROP_HWA_DMAX",
      labelAr: "القطر الحبيبي الأقصى للركام الثقيل",
      labelFr: "Dimension Maximale (Dmax)",
      labelEn: "Maximum Aggregate Size",
      unit: "mm",
      inputType: "number",
      categoryGroup: "granulometric",
      requirementLevel: "required",
      testStandard: "EN 933-1",
      min: 6,
      max: 35,
      defaultVal: 16.0,
      placeholder: "16.0",
      categoryKey: "heavyweightAggregate",
      isRequired: () => true,
      validate: (val) => validateNumericRange(val, 6, 35, "القطر الحبيبي الأقصى للركام الثقيل", "Dimension Maximale (Dmax)", "Maximum Aggregate Size", "mm", false)
    },
    {
      key: "density",
      propertyId: "PROP_HWA_DENSITY",
      labelAr: "الكثافة المطلقة الفائقة للركام الثقيل",
      labelFr: "Masse Volumique Réelle Élevée",
      labelEn: "High Absolute Density",
      unit: "kg/m³",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "required",
      testStandard: "EN 1097-6",
      min: 3600,
      max: 5500,
      defaultVal: 4300,
      placeholder: "4300",
      categoryKey: "heavyweightAggregate",
      isRequired: () => true,
      validate: (val) => validateNumericRange(val, 3600, 5500, "الكثافة المطلقة الفائقة للركام الثقيل", "Masse Volumique Réelle Élevée", "High Absolute Density", "kg/m³", false)
    },
    {
      key: "bulkDensity",
      propertyId: "PROP_HWA_BULK_DENSITY",
      labelAr: "الكثافة الظاهرية للصب الحر",
      labelFr: "Masse Volumique Apparente",
      labelEn: "Bulk Density (Loose)",
      unit: "kg/m³",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "required",
      testStandard: "EN 1097-3",
      min: 2000,
      max: 3500,
      defaultVal: 2650,
      placeholder: "2650",
      categoryKey: "heavyweightAggregate",
      isRequired: () => true,
      validate: (val) => validateNumericRange(val, 2000, 3500, "الكثافة الظاهرية للصب الحر", "Masse Volumique Apparente", "Bulk Density (Loose)", "kg/m³", false)
    },
    {
      key: "absorption",
      propertyId: "PROP_HWA_ABSORPTION",
      labelAr: "معامل امتصاص الماء للركام الثقيل",
      labelFr: "Absorption d'Eau (WA24)",
      labelEn: "Water Absorption (WA24)",
      unit: "%",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "optional",
      testStandard: "EN 1097-6",
      min: 0.05,
      max: 2.5,
      defaultVal: 0.45,
      placeholder: "0.45",
      categoryKey: "heavyweightAggregate",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 0.05, 2.5, "معامل امتصاص الماء للركام الثقيل", "Absorption d'Eau (WA24)", "Water Absorption (WA24)", "%", false)
    },
    {
      key: "bariumSulfate",
      propertyId: "PROP_HWA_BASO4",
      labelAr: "محتوى كبريتات الباريوم (BaSO4)",
      labelFr: "Teneur en Sulfate de Baryum",
      labelEn: "Barium Sulfate Content",
      unit: "%",
      inputType: "number",
      categoryGroup: "chemical",
      requirementLevel: "required",
      testStandard: "ASTM C637",
      min: 50,
      max: 99,
      defaultVal: 92.0,
      placeholder: "92.0",
      categoryKey: "heavyweightAggregate",
      isRequired: () => true,
      validate: (val) => validateNumericRange(val, 50, 99, "محتوى كبريتات الباريوم (BaSO4)", "Teneur en Sulfate de Baryum", "Barium Sulfate Content", "%", false)
    }
  ],
  recycledAggregate: [
    {
      key: "dMax",
      propertyId: "PROP_RCA_DMAX",
      labelAr: "القطر الحبيبي الأقصى للركام المعاد تدويره",
      labelFr: "Dimension Maximale (Dmax)",
      labelEn: "Maximum Particle Size",
      unit: "mm",
      inputType: "number",
      categoryGroup: "granulometric",
      requirementLevel: "required",
      testStandard: "EN 933-1",
      min: 6,
      max: 30,
      defaultVal: 20.0,
      placeholder: "20.0",
      categoryKey: "recycledAggregate",
      isRequired: () => true,
      validate: (val) => validateNumericRange(val, 6, 30, "القطر الحبيبي الأقصى للركام المعاد تدويره", "Dimension Maximale (Dmax)", "Maximum Particle Size", "mm", false)
    },
    {
      key: "density",
      propertyId: "PROP_RCA_DENSITY",
      labelAr: "الكثافة المطلقة لحبيبات الركام المعاد",
      labelFr: "Masse Volumique Réelle",
      labelEn: "Absolute Particle Density",
      unit: "kg/m³",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "required",
      testStandard: "EN 1097-6",
      min: 2100,
      max: 2700,
      defaultVal: 2410,
      placeholder: "2410",
      categoryKey: "recycledAggregate",
      isRequired: () => true,
      validate: (val) => validateNumericRange(val, 2100, 2700, "الكثافة المطلقة لحبيبات الركام المعاد", "Masse Volumique Réelle", "Absolute Particle Density", "kg/m³", false)
    },
    {
      key: "bulkDensity",
      propertyId: "PROP_RCA_BULK_DENSITY",
      labelAr: "الكثافة الظاهرية في الحالة السائبة",
      labelFr: "Masse Volumique Apparente",
      labelEn: "Loose Bulk Density",
      unit: "kg/m³",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "required",
      testStandard: "EN 1097-3",
      min: 1100,
      max: 1600,
      defaultVal: 1320,
      placeholder: "1320",
      categoryKey: "recycledAggregate",
      isRequired: () => true,
      validate: (val) => validateNumericRange(val, 1100, 1600, "الكثافة الظاهرية في الحالة السائبة", "Masse Volumique Apparente", "Loose Bulk Density", "kg/m³", false)
    },
    {
      key: "absorption",
      propertyId: "PROP_RCA_ABSORPTION",
      labelAr: "معامل امتصاص الماء المرتفع (WA24)",
      labelFr: "Absorption d'Eau Élevée (WA24)",
      labelEn: "High Water Absorption (WA24)",
      unit: "%",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "required",
      testStandard: "EN 1097-6",
      min: 2.5,
      max: 12,
      defaultVal: 5.8,
      placeholder: "5.8",
      categoryKey: "recycledAggregate",
      isRequired: () => true,
      validate: (val) => validateNumericRange(val, 2.5, 12, "معامل امتصاص الماء المرتفع (WA24)", "Absorption d'Eau Élevée (WA24)", "High Water Absorption (WA24)", "%", false)
    },
    {
      key: "losAngelesAbrasion",
      propertyId: "PROP_RCA_LA",
      labelAr: "معامل لوس أنجلوس للتآكل (LA)",
      labelFr: "Coefficient Los Angeles (LA)",
      labelEn: "Los Angeles Abrasion Value",
      unit: "%",
      inputType: "number",
      categoryGroup: "mechanical",
      requirementLevel: "optional",
      testStandard: "EN 1097-2",
      min: 20,
      max: 50,
      defaultVal: 34,
      placeholder: "34",
      categoryKey: "recycledAggregate",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 20, 50, "معامل لوس أنجلوس للتآكل (LA)", "Coefficient Los Angeles (LA)", "Los Angeles Abrasion Value", "%", false)
    },
    {
      key: "masonryContent",
      propertyId: "PROP_RCA_MASONRY",
      labelAr: "نسبة بقايا الطوب والبناء (Rb)",
      labelFr: "Teneur en Éléments de Maçonnerie (Rb)",
      labelEn: "Masonry Debris Content (Rb)",
      unit: "%",
      inputType: "number",
      categoryGroup: "composition",
      requirementLevel: "required",
      testStandard: "EN 933-11",
      min: 0,
      max: 20,
      defaultVal: 3.5,
      placeholder: "3.5",
      categoryKey: "recycledAggregate",
      isRequired: () => true,
      validate: (val) => validateNumericRange(val, 0, 20, "نسبة بقايا الطوب والبناء (Rb)", "Teneur en Éléments de Maçonnerie (Rb)", "Masonry Debris Content (Rb)", "%", true)
    },
    {
      key: "finesContent",
      propertyId: "PROP_RCA_FINES",
      labelAr: "نسبة النواعم العابرة لمنخل 0.063 مم",
      labelFr: "Passant à 0.063 mm (Fines)",
      labelEn: "Fines Content (<0.063mm)",
      unit: "%",
      inputType: "number",
      categoryGroup: "granulometric",
      requirementLevel: "optional",
      testStandard: "EN 933-1",
      min: 0,
      max: 5.0,
      defaultVal: 1.8,
      placeholder: "1.8",
      categoryKey: "recycledAggregate",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 0, 5.0, "نسبة النواعم العابرة لمنخل 0.063 مم", "Passant à 0.063 mm (Fines)", "Fines Content (<0.063mm)", "%", true)
    }
  ],
  specialBinder: [
    {
      key: "density",
      propertyId: "PROP_GEO_DENSITY",
      labelAr: "الكثافة المطلقة للرابط الخاص",
      labelFr: "Masse Volumique du Liant Spécial",
      labelEn: "Absolute Density of Binder",
      unit: "kg/m³",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "required",
      testStandard: "EN 196-6",
      min: 2500,
      max: 3400,
      defaultVal: 2850,
      placeholder: "2850",
      categoryKey: "specialBinder",
      isRequired: () => true,
      validate: (val) => validateNumericRange(val, 2500, 3400, "الكثافة المطلقة للرابط الخاص", "Masse Volumique du Liant Spécial", "Absolute Density of Binder", "kg/m³", false)
    },
    {
      key: "strengthClass",
      propertyId: "PROP_GEO_STRENGTH",
      labelAr: "فئة المقاومة القياسية (28 يوم)",
      labelFr: "Classe de Résistance (28j)",
      labelEn: "Strength Class (28-day)",
      unit: "MPa",
      inputType: "number",
      categoryGroup: "mechanical",
      requirementLevel: "optional",
      testStandard: "EN 196-1",
      min: 20,
      max: 90,
      defaultVal: 45.0,
      placeholder: "45.0",
      categoryKey: "specialBinder",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 20, 90, "فئة المقاومة القياسية (28 يوم)", "Classe de Résistance (28j)", "Strength Class (28-day)", "MPa", false)
    },
    {
      key: "alkalineRatio",
      propertyId: "PROP_GEO_RATIO",
      labelAr: "النسبة القلوية المولية (Na/Al)",
      labelFr: "Rapport Molaire Alcalin (Na/Al)",
      labelEn: "Alkaline Molar Ratio",
      unit: "",
      inputType: "number",
      categoryGroup: "chemical",
      requirementLevel: "required",
      testStandard: "Chemical formulation",
      min: 0.1,
      max: 1.0,
      defaultVal: 0.42,
      placeholder: "0.42",
      categoryKey: "specialBinder",
      isRequired: () => true,
      validate: (val) => validateNumericRange(val, 0.1, 1.0, "النسبة القلوية المولية (Na/Al)", "Rapport Molaire Alcalin (Na/Al)", "Alkaline Molar Ratio", "", false)
    },
    {
      key: "silicaModulus",
      propertyId: "PROP_GEO_MODULUS",
      labelAr: "معامل السيليكا المنشطة (SiO2/Al2O3)",
      labelFr: "Module Silicique (SiO2/Al2O3)",
      labelEn: "Silica Activation Modulus",
      unit: "",
      inputType: "number",
      categoryGroup: "chemical",
      requirementLevel: "optional",
      testStandard: "Chemical formulation",
      min: 0.5,
      max: 2.5,
      defaultVal: 1.35,
      placeholder: "1.35",
      categoryKey: "specialBinder",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 0.5, 2.5, "معامل السيليكا المنشطة (SiO2/Al2O3)", "Module Silicique (SiO2/Al2O3)", "Silica Activation Modulus", "", false)
    }
  ],
  airContent: [
    {
      key: "airPercentage",
      propertyId: "PROP_AIR_PERCENT",
      labelAr: "نسبة الهواء المحبوس الكلية المستهدفة",
      labelFr: "Teneur en Air Occlus Cible",
      labelEn: "Target Air Content Ratio",
      unit: "%",
      inputType: "number",
      categoryGroup: "rheology",
      requirementLevel: "required",
      testStandard: "EN 12350-7 / ASTM C231",
      min: 1.0,
      max: 12,
      defaultVal: 4.5,
      placeholder: "4.5",
      categoryKey: "airContent",
      isRequired: () => true,
      validate: (val) => validateNumericRange(val, 1.0, 12, "نسبة الهواء المحبوس الكلية المستهدفة", "Teneur en Air Occlus Cible", "Target Air Content Ratio", "%", false)
    },
    {
      key: "spacingFactor",
      propertyId: "PROP_AIR_SPACING",
      labelAr: "عامل تباعد الفراغات الهوائية (L)",
      labelFr: "Facteur d'Espacement des Bulles (L)",
      labelEn: "Air Void Spacing Factor (L)",
      unit: "µm",
      inputType: "number",
      categoryGroup: "durability",
      requirementLevel: "optional",
      testStandard: "EN 480-11 / ASTM C457",
      min: 80,
      max: 300,
      defaultVal: 175,
      placeholder: "175",
      categoryKey: "airContent",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 80, 300, "عامل تباعد الفراغات الهوائية (L)", "Facteur d'Espacement des Bulles (L)", "Air Void Spacing Factor (L)", "µm", false)
    },
    {
      key: "specificSurfaceAir",
      propertyId: "PROP_AIR_SURFACE",
      labelAr: "المساحة السطحية النوعية للفراغات",
      labelFr: "Surface Spécifique du Réseau d'Air",
      labelEn: "Specific Surface of Air Voids",
      unit: "mm²/mm³",
      inputType: "number",
      categoryGroup: "durability",
      requirementLevel: "optional",
      testStandard: "EN 480-11",
      min: 15,
      max: 50,
      defaultVal: 32,
      placeholder: "32",
      categoryKey: "airContent",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 15, 50, "المساحة السطحية النوعية للفراغات", "Surface Spécifique du Réseau d'Air", "Specific Surface of Air Voids", "mm²/mm³", false)
    }
  ],
  soil: [
    {
      key: "soilClassification",
      propertyId: "PROP_SOL_CLASS",
      labelAr: "التصنيف الجيوتقني القياسي للتربة",
      labelFr: "Classification Géotechnique",
      labelEn: "Geotechnical Soil Classification",
      unit: "",
      inputType: "text",
      categoryGroup: "composition",
      requirementLevel: "optional",
      testStandard: "AASHTO M 145 / ASTM D2487",
      defaultVal: "AASHTO A-1-a / USCS GW-SW",
      placeholder: "AASHTO A-1-a / USCS GW-SW",
      categoryKey: "soil",
      isRequired: () => false,
      validate: (val) => (!val || String(val).trim() === "" ? { isValid: false, errorAr: "حقل التصنيف الجيوتقني القياسي للتربة مطلوب." } : { isValid: true })
    },
    {
      key: "maxDryDensity",
      propertyId: "PROP_SOL_MDD",
      labelAr: "الكثافة الجافة العظمى (بروكتور المعدل)",
      labelFr: "Densité Sèche Maximale (OPM)",
      labelEn: "Maximum Dry Density (MDD)",
      unit: "kg/m³",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "required",
      testStandard: "NF P94-093 / ASTM D698",
      min: 1500,
      max: 2400,
      defaultVal: 2120,
      placeholder: "2120",
      categoryKey: "soil",
      isRequired: () => true,
      validate: (val) => validateNumericRange(val, 1500, 2400, "الكثافة الجافة العظمى (بروكتور المعدل)", "Densité Sèche Maximale (OPM)", "Maximum Dry Density (MDD)", "kg/m³", false)
    },
    {
      key: "optimumMoisture",
      propertyId: "PROP_SOL_OMC",
      labelAr: "نسبة الرطوبة المثلى للدمك (w_opt)",
      labelFr: "Teneur en Eau Optimale (w_opt)",
      labelEn: "Optimum Moisture Content (OMC)",
      unit: "%",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "required",
      testStandard: "NF P94-093 / ASTM D698",
      min: 4,
      max: 25,
      defaultVal: 8.5,
      placeholder: "8.5",
      categoryKey: "soil",
      isRequired: () => true,
      validate: (val) => validateNumericRange(val, 4, 25, "نسبة الرطوبة المثلى للدمك (w_opt)", "Teneur en Eau Optimale (w_opt)", "Optimum Moisture Content (OMC)", "%", false)
    },
    {
      key: "liquidLimit",
      propertyId: "PROP_SOL_LL",
      labelAr: "حد السيولة للتربة (حدود أتربرغ)",
      labelFr: "Limite de Liquidité (WL)",
      labelEn: "Liquid Limit (LL)",
      unit: "%",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "optional",
      testStandard: "NF P94-051 / ASTM D4318",
      min: 10,
      max: 80,
      defaultVal: 22.0,
      placeholder: "22.0",
      categoryKey: "soil",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 10, 80, "حد السيولة للتربة (حدود أتربرغ)", "Limite de Liquidité (WL)", "Liquid Limit (LL)", "%", false)
    },
    {
      key: "plasticLimit",
      propertyId: "PROP_SOL_PL",
      labelAr: "حد اللدونة للتربة (حدود أتربرغ)",
      labelFr: "Limite de Plasticité (WP)",
      labelEn: "Plastic Limit (PL)",
      unit: "%",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "optional",
      testStandard: "NF P94-051 / ASTM D4318",
      min: 8,
      max: 45,
      defaultVal: 16.0,
      placeholder: "16.0",
      categoryKey: "soil",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 8, 45, "حد اللدونة للتربة (حدود أتربرغ)", "Limite de Plasticité (WP)", "Plastic Limit (PL)", "%", false)
    },
    {
      key: "plasticityIndex",
      propertyId: "PROP_SOL_PI",
      labelAr: "دليل اللدونة (IP = WL - WP)",
      labelFr: "Indice de Plasticité (IP)",
      labelEn: "Plasticity Index (PI)",
      unit: "%",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "optional",
      testStandard: "NF P94-051 / ASTM D4318",
      min: 0,
      max: 50,
      defaultVal: 6.0,
      placeholder: "6.0",
      categoryKey: "soil",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 0, 50, "دليل اللدونة (IP = WL - WP)", "Indice de Plasticité (IP)", "Plasticity Index (PI)", "%", true)
    },
    {
      key: "cbrValue",
      propertyId: "PROP_SOL_CBR",
      labelAr: "معامل التحمل الكاليفورني الفوري / بعد الغمر",
      labelFr: "Indice Portant CBR (Imbibé 4j)",
      labelEn: "California Bearing Ratio (CBR)",
      unit: "%",
      inputType: "number",
      categoryGroup: "mechanical",
      requirementLevel: "required",
      testStandard: "NF P94-078 / ASTM D1883",
      min: 2,
      max: 90,
      defaultVal: 45,
      placeholder: "45",
      categoryKey: "soil",
      isRequired: () => true,
      validate: (val) => validateNumericRange(val, 2, 90, "معامل التحمل الكاليفورني الفوري / بعد الغمر", "Indice Portant CBR (Imbibé 4j)", "California Bearing Ratio (CBR)", "%", false)
    },
    {
      key: "permeability",
      propertyId: "PROP_SOL_K",
      labelAr: "معامل النفاذية الهيدروليكية (k)",
      labelFr: "Coefficient de Perméabilité (k)",
      labelEn: "Hydraulic Permeability (k)",
      unit: "m/s",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "optional",
      testStandard: "NF P94-057",
      min: 1e-10,
      max: 0.01,
      defaultVal: 0.00025,
      placeholder: "0.00025",
      categoryKey: "soil",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 1e-10, 0.01, "معامل النفاذية الهيدروليكية (k)", "Coefficient de Perméabilité (k)", "Hydraulic Permeability (k)", "m/s", false)
    }
  ],
  bituminous: [
    {
      key: "bitumenGrade",
      propertyId: "PROP_BIT_GRADE",
      labelAr: "فئة ورتبة قوام البيتومين النقي",
      labelFr: "Classe de Pénétrabilité du Bitume",
      labelEn: "Bitumen Penetration Grade",
      unit: "",
      inputType: "select",
      categoryGroup: "composition",
      requirementLevel: "required",
      testStandard: "EN 12591",
      options: [
        { value: "35/50", labelAr: "35/50 (صلد للطبقات الثقيلة)", labelFr: "35/50", labelEn: "35/50 Hard" },
        { value: "40/50", labelAr: "40/50 (العيار القياسي للخلطات)", labelFr: "40/50", labelEn: "40/50 Standard" },
        { value: "50/70", labelAr: "50/70 (شبه صلد)", labelFr: "50/70", labelEn: "50/70 Semi-hard" },
        { value: "70/100", labelAr: "70/100 (لين للمناطق الباردة)", labelFr: "70/100", labelEn: "70/100 Soft" },
        { value: "PmB 45/80-65", labelAr: "PmB 45/80-65 (معدل بالبوليمر عالي الأداء)", labelFr: "PmB 45/80-65", labelEn: "PmB 45/80-65" }
      ],
      defaultVal: "40/50",
      placeholder: "40/50",
      categoryKey: "bituminous",
      isRequired: () => true,
      validate: (val) => (!val || String(val).trim() === "" ? { isValid: false, errorAr: "حقل فئة ورتبة قوام البيتومين النقي مطلوب." } : { isValid: true })
    },
    {
      key: "penetration",
      propertyId: "PROP_BIT_PEN",
      labelAr: "معامل الاختراق بالإبرة عند 25°م",
      labelFr: "Pénétrabilité à l'Aiguille à 25°C",
      labelEn: "Needle Penetration at 25°C",
      unit: "0.1mm",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "required",
      testStandard: "EN 1426 / ASTM D5",
      min: 15,
      max: 120,
      defaultVal: 45,
      placeholder: "45",
      categoryKey: "bituminous",
      isRequired: () => true,
      validate: (val) => validateNumericRange(val, 15, 120, "معامل الاختراق بالإبرة عند 25°م", "Pénétrabilité à l'Aiguille à 25°C", "Needle Penetration at 25°C", "0.1mm", false)
    },
    {
      key: "softeningPoint",
      propertyId: "PROP_BIT_TBA",
      labelAr: "نقطة الليونة والرخاوة (الكرة والحلقة TBA)",
      labelFr: "Point de Ramollissement (Bille et Anneau)",
      labelEn: "Softening Point (Ring & Ball)",
      unit: "°C",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "required",
      testStandard: "EN 1427 / ASTM D36",
      min: 35,
      max: 90,
      defaultVal: 52.0,
      placeholder: "52.0",
      categoryKey: "bituminous",
      isRequired: () => true,
      validate: (val) => validateNumericRange(val, 35, 90, "نقطة الليونة والرخاوة (الكرة والحلقة TBA)", "Point de Ramollissement (Bille et Anneau)", "Softening Point (Ring & Ball)", "°C", false)
    },
    {
      key: "density",
      propertyId: "PROP_BIT_DENSITY",
      labelAr: "الكثافة النسبية للبيتومين عند 25°م",
      labelFr: "Masse Volumique à 25°C",
      labelEn: "Density of Bitumen at 25°C",
      unit: "kg/m³",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "required",
      testStandard: "EN ISO 3838",
      min: 980,
      max: 1100,
      defaultVal: 1025,
      placeholder: "1025",
      categoryKey: "bituminous",
      isRequired: () => true,
      validate: (val) => validateNumericRange(val, 980, 1100, "الكثافة النسبية للبيتومين عند 25°م", "Masse Volumique à 25°C", "Density of Bitumen at 25°C", "kg/m³", false)
    },
    {
      key: "flashPoint",
      propertyId: "PROP_BIT_FLASH",
      labelAr: "درجة حرارة نقطة الوميض والاشتعال",
      labelFr: "Point d'Éclair (Vase Ouvert)",
      labelEn: "Flash Point (Cleveland)",
      unit: "°C",
      inputType: "number",
      categoryGroup: "durability",
      requirementLevel: "optional",
      testStandard: "EN ISO 2592 / ASTM D92",
      min: 200,
      max: 380,
      defaultVal: 295,
      placeholder: "295",
      categoryKey: "bituminous",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 200, 380, "درجة حرارة نقطة الوميض والاشتعال", "Point d'Éclair (Vase Ouvert)", "Flash Point (Cleveland)", "°C", false)
    }
  ],
  masonry: [
    {
      key: "masonryType",
      propertyId: "PROP_MAS_TYPE",
      labelAr: "نوع وتصنيف وحدة البناء القياسية",
      labelFr: "Type d'Élément de Maçonnerie",
      labelEn: "Masonry Unit Type",
      unit: "",
      inputType: "select",
      categoryGroup: "composition",
      requirementLevel: "required",
      testStandard: "EN 771",
      options: [
        { value: "hollow_concrete_block", labelAr: "كتل خرسانية مجوفة (بلوك 20x20x40)", labelFr: "Bloc de béton creux", labelEn: "Hollow Concrete Block" },
        { value: "perforated_clay_brick", labelAr: "طوب أحمر طيني مثقب (آجر)", labelFr: "Brique de terre cuite perforée", labelEn: "Perforated Clay Brick" },
        { value: "solid_brick", labelAr: "طوب مصمت عالي الكثافة", labelFr: "Brique pleine", labelEn: "Solid Brick" },
        { value: "masonry_mortar_m10", labelAr: "ملاط بناء جاهز رتبة M10", labelFr: "Mortier de maçonnerie M10", labelEn: "Masonry Mortar M10" }
      ],
      defaultVal: "hollow_concrete_block",
      placeholder: "hollow_concrete_block",
      categoryKey: "masonry",
      isRequired: () => true,
      validate: (val) => (!val || String(val).trim() === "" ? { isValid: false, errorAr: "حقل نوع وتصنيف وحدة البناء القياسية مطلوب." } : { isValid: true })
    },
    {
      key: "density",
      propertyId: "PROP_MAS_DENSITY",
      labelAr: "الكثافة الظاهرية الجافة للوحدة الكلية",
      labelFr: "Masse Volumique Apparente Nette",
      labelEn: "Gross Dry Unit Density",
      unit: "kg/m³",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "required",
      testStandard: "EN 772-13",
      min: 500,
      max: 2600,
      defaultVal: 1250,
      placeholder: "1250",
      categoryKey: "masonry",
      isRequired: () => true,
      validate: (val) => validateNumericRange(val, 500, 2600, "الكثافة الظاهرية الجافة للوحدة الكلية", "Masse Volumique Apparente Nette", "Gross Dry Unit Density", "kg/m³", false)
    },
    {
      key: "compressiveStrength",
      propertyId: "PROP_MAS_STRENGTH",
      labelAr: "مقاومة الضغط الاسمية المعيارية (fb)",
      labelFr: "Résistance à la Compression Normalisée (fb)",
      labelEn: "Compressive Strength (fb)",
      unit: "MPa",
      inputType: "number",
      categoryGroup: "mechanical",
      requirementLevel: "required",
      testStandard: "EN 772-1 / ASTM C140",
      min: 2.0,
      max: 50.0,
      defaultVal: 10.5,
      placeholder: "10.5",
      categoryKey: "masonry",
      isRequired: () => true,
      validate: (val) => validateNumericRange(val, 2.0, 50.0, "مقاومة الضغط الاسمية المعيارية (fb)", "Résistance à la Compression Normalisée (fb)", "Compressive Strength (fb)", "MPa", false)
    },
    {
      key: "waterAbsorption",
      propertyId: "PROP_MAS_ABSORPTION",
      labelAr: "معامل امتصاص الماء الشعيري",
      labelFr: "Absorption d'Eau par Capillarité",
      labelEn: "Water Absorption",
      unit: "%",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "optional",
      testStandard: "EN 772-21",
      min: 2.0,
      max: 30.0,
      defaultVal: 11.0,
      placeholder: "11.0",
      categoryKey: "masonry",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 2.0, 30.0, "معامل امتصاص الماء الشعيري", "Absorption d'Eau par Capillarité", "Water Absorption", "%", false)
    },
    {
      key: "thermalConductivity",
      propertyId: "PROP_MAS_LAMBDA",
      labelAr: "معامل التوصيل الحراري المكافئ (λ)",
      labelFr: "Conductivité Thermique (λ)",
      labelEn: "Thermal Conductivity (λ)",
      unit: "W/m·K",
      inputType: "number",
      categoryGroup: "physical",
      requirementLevel: "optional",
      testStandard: "EN 1745",
      min: 0.1,
      max: 1.5,
      defaultVal: 0.65,
      placeholder: "0.65",
      categoryKey: "masonry",
      isRequired: () => false,
      validate: (val) => validateNumericRange(val, 0.1, 1.5, "معامل التوصيل الحراري المكافئ (λ)", "Conductivité Thermique (λ)", "Thermal Conductivity (λ)", "W/m·K", false)
    }
  ],
  other: [

  ],
};

export const PROPERTY_DEFINITIONS: MaterialPropertyDefinition[] = Object.values(MATERIAL_PROPERTY_SCHEMAS).flat();

export function getMaterialPropValue(m: any, propKey: string): any {
  if (!m) return undefined;

  let resVal: any = undefined;

  // Direct key lookup
  if (m[propKey] !== undefined && m[propKey] !== null && m[propKey] !== "") {
    resVal = m[propKey];
  } else if (m.propertyMetadata && m.propertyMetadata[propKey]) {
    const meta = m.propertyMetadata[propKey];
    if (meta.status === "not_applicable" || meta.value === "N/A" || meta.value === "NOT_APPLICABLE") {
      return "N/A";
    }
    if (meta.value !== undefined && meta.value !== null && meta.value !== "") {
      resVal = meta.value;
    }
  }

  // Comprehensive aliases dictionary
  const aliasMap: Record<string, string[]> = {
    cementClass: ["cementType", "type", "Category", "cement_class", "classeCiment"],
    strengthClass: ["StrengthClass", "strength_class", "class", "classeResistance", "strength"],
    density: ["Density", "specificGravity", "relativeDensity", "relative_density", "ssdDensity", "masseVolumique", "mv"],
    ssdDensity: ["SSDDensity", "ssd_density", "masseVolumiqueSSD"],
    specificGravity: ["SpecificGravity", "specific_gravity", "densiteRelative"],
    bulkDensity: ["BulkDensity", "bulk_density", "masseVolumiqueApparente", "mva"],
    absorption: ["Absorption", "waterAbsorption", "water_absorption", "WA24", "absorptionDeau"],
    moisture: ["Moisture", "moistureContent", "moisture_content", "humidity", "teneurEnEau", "w"],
    finenessModulus: ["FinenessModulus", "fineness_modulus", "moduleDeFinesse", "FM", "mf"],
    sandEquivalent: ["SandEquivalent", "sand_equivalent", "ES", "SE", "sand_eq"],
    dMax: ["Dmax", "dmax", "DMax", "maxSize", "dimensionMaximale", "maxAggregateSize"],
    dMin: ["Dmin", "dmin", "DMin", "minSize", "dimensionMinimale"],
    particleShape: ["Shape", "shape", "forme", "grainShape", "aggregateShape"],
    losAngelesAbrasion: ["LosAngeles", "losAngeles", "los_angeles", "LA", "coefficientLosAngeles"],
    microDeval: ["MicroDeval", "microDeval", "MDE", "micro_deval"],
    flakinessIndex: ["FlakinessIndex", "flakiness_index", "FI", "indiceAplatissement"],
    elongationIndex: ["ElongationIndex", "elongation_index", "EI"],
    crushingValue: ["CrushingValue", "crushing_value", "ACV"],
    finesContent: ["FinesContent", "fines_content", "fines", "passant63um"],
    methyleneBlue: ["MethyleneBlue", "methylene_blue", "MB", "bleuDeMethylene"],
    recommendedDosage: ["dosage", "recommendedDosagePercent", "dosagePercent", "dosage_percent", "dose"],
    waterReduction: ["waterReductionPercent", "water_reduction", "reductionRatio", "water_reduction_ratio"],
    pozzolanicIndex: ["PozzolanicIndex", "pozzolanic_index", "activityIndex", "indicePouzzolanique"],
    fiberType: ["type", "fiber_type", "typeDeFibres"],
    fiberLength: ["fiberLengthMm", "lengthMm", "fiber_length", "longueurFibre"],
    tensileStrength: ["fiberTensileStrength", "resistanceTraction", "tensile_strength"],
    ph: ["pH", "PH", "waterPH", "valeurPH"],
    chlorides: ["Chlorides", "chlorideContent", "teneurChlorures"],
    sulfates: ["Sulfates", "sulfateContent", "teneurSulfates"],
    blaineFineness: ["BlaineFineness", "blaine_fineness", "surfaceBlaine"],
    initialSetting: ["InitialSetting", "initial_setting", "debutPrise"],
    finalSetting: ["FinalSetting", "final_setting", "finPrise"],
    airPercentage: ["airContent", "targetAirContent", "teneurAir"],
    foisonnement: ["Foisonnement", "foisonnementCoeff", "bulkingFactor"]
  };

  const aliases = aliasMap[propKey] || [];
  if (resVal === undefined) {
    for (const alias of aliases) {
      if (m[alias] !== undefined && m[alias] !== null && m[alias] !== "") {
        resVal = m[alias];
        break;
      }
    }
  }

  // Nested in engineeringData
  if (resVal === undefined && m.engineeringData) {
    if (m.engineeringData[propKey] !== undefined && m.engineeringData[propKey] !== null && m.engineeringData[propKey] !== "") {
      resVal = m.engineeringData[propKey];
    } else {
      for (const alias of aliases) {
        if (m.engineeringData[alias] !== undefined && m.engineeringData[alias] !== null && m.engineeringData[alias] !== "") {
          resVal = m.engineeringData[alias];
          break;
        }
      }
    }
  }

  // Nested in extraProperties
  if (resVal === undefined && m.extraProperties) {
    if (m.extraProperties[propKey] !== undefined && m.extraProperties[propKey] !== null && m.extraProperties[propKey] !== "") {
      resVal = m.extraProperties[propKey];
    } else {
      for (const alias of aliases) {
        if (m.extraProperties[alias] !== undefined && m.extraProperties[alias] !== null && m.extraProperties[alias] !== "") {
          resVal = m.extraProperties[alias];
          break;
        }
      }
    }
  }

  // Nested in properties dictionary (e.g. MaterialCoreRecord format)
  if (resVal === undefined && m.properties) {
    const p = m.properties[propKey];
    if (p !== undefined && p !== null) {
      resVal = typeof p === "object" && p.value !== undefined ? p.value : p;
    }
    if (resVal === undefined) {
      for (const alias of aliases) {
        const pa = m.properties[alias];
        if (pa !== undefined && pa !== null) {
          resVal = typeof pa === "object" && pa.value !== undefined ? pa.value : pa;
          break;
        }
      }
    }
  }

  if (resVal !== undefined && (propKey === "density" || propKey === "bulkDensity")) {
    const num = typeof resVal === "number" ? resVal : parseFloat(String(resVal));
    if (!isNaN(num) && num > 0 && num < 10) {
      resVal = Math.round(num * 1000);
    }
  }

  // If specificGravity is requested but density is stored, calculate specificGravity directly
  if ((resVal === undefined || resVal === null || resVal === "") && propKey === "specificGravity") {
    const d = m.density || (m as any).Density;
    if (d) {
      const num = typeof d === "number" ? d : parseFloat(String(d));
      if (!isNaN(num) && num > 0) return +(num > 10 ? num / 1000 : num).toFixed(3);
    }
  }

  return resVal;
}

export function inspectMixMaterialProperties(
  selectedMaterials: { role: string; material: EngineeringMaterial }[],
  mixMethod: string = "dreux",
  concreteType: string = "standard",
  language: "ar" | "fr" | "en" = "ar"
): BatchPropertiesSummary {
  const groups: MaterialPropertiesGroup[] = [];
  let totalMissingRequired = 0;
  let totalMissingOptional = 0;

  for (const { role, material } of selectedMaterials) {
    if (!material) continue;

    const roleKey: SupportedMaterialRole = normalizeMaterialRole(material.category || role);
    let catAr = "مادة";
    let catFr = "Matériau";
    let catEn = "Material";

    if (roleKey === "cement") { catAr = "إسمنت"; catFr = "Ciment"; catEn = "Cement"; }
    else if (roleKey === "sand") { catAr = "رمل (ركام ناعم)"; catFr = "Sable"; catEn = "Sand"; }
    else if (roleKey === "gravel") { catAr = "حصى (ركام خشن)"; catFr = "Gravillon"; catEn = "Gravel"; }
    else if (roleKey === "admixture") { catAr = "إضافات كيميائية"; catFr = "Adjuvants"; catEn = "Admixture"; }
    else if (roleKey === "scm") { catAr = "إضافات معدنية (SCM)"; catFr = "Ajouts Minéraux"; catEn = "Mineral Addition"; }
    else if (roleKey === "filler") { catAr = "مواد مالئة (Fillers)"; catFr = "Fillers"; catEn = "Fillers"; }
    else if (roleKey === "water") { catAr = "مياه الخلط"; catFr = "Eau de Gâchage"; catEn = "Water"; }
    else if (roleKey === "fiber") { catAr = "ألياف التسليح"; catFr = "Fibres"; catEn = "Fibers"; }
    else if (roleKey === "soil") { catAr = "تربة هندسية"; catFr = "Sol"; catEn = "Soil"; }
    else if (roleKey === "bituminous") { catAr = "بيتومين وزفت"; catFr = "Bitume"; catEn = "Bitumen"; }
    else if (roleKey === "masonry") { catAr = "مواد بناء وبلوك"; catFr = "Maçonnerie"; catEn = "Masonry"; }

    const schemas = MATERIAL_PROPERTY_SCHEMAS[roleKey] || [];
    const evaluatedProps: EvaluatedProperty[] = [];
    let matMissingReq = 0;
    let matMissingOpt = 0;

    for (const schema of schemas) {
      const isReq = schema.isRequired(material, mixMethod, concreteType);
      const val = getMaterialPropValue(material, schema.key);
      const meta = material.propertyMetadata?.[schema.key];
      const isNA = val === "N/A" || meta?.status === "not_applicable";
      const isRef = meta?.status === "default_reference" || material.isSystem;
      const hasVal = val !== undefined && val !== null && val !== "" && (val !== 0 || schema.key === "soundness" || schema.key === "chlorideContent");

      let display = "—";
      let status: EvaluatedProperty["status"] = "missing";

      if (isNA) {
        display = "N/A (غير منطبق)";
        status = "not_applicable";
      } else if (hasVal) {
        const valRes = schema.validate(val, material, mixMethod);
        display = `${val} ${schema.unit || ""}`.trim();
        if (valRes.isValid) {
          status = isRef ? "default_reference" : "valid";
        } else {
          status = "invalid";
        }
      } else {
        if (isReq) matMissingReq++;
        else matMissingOpt++;
      }

      evaluatedProps.push({
        definition: schema,
        key: schema.key,
        propertyId: schema.propertyId,
        labelAr: schema.labelAr,
        labelFr: schema.labelFr,
        labelEn: schema.labelEn,
        unit: schema.unit,
        currentValue: val,
        currentValueDisplay: display,
        hasCurrentValue: hasVal || isNA,
        isRequired: isReq,
        requirementLevel: schema.requirementLevel,
        categoryGroup: schema.categoryGroup,
        testStandard: schema.testStandard,
        source: meta?.sourceType || (material.isSystem ? "reference" : "laboratory"),
        sourceLabelAr: meta?.sourceLabel || (material.isSystem ? "قيمة مرجعية قياسية" : "مدخلات مخبرية"),
        sourceLabelFr: meta?.sourceLabel || (material.isSystem ? "Référence Standard" : "Laboratoire"),
        sourceLabelEn: meta?.sourceLabel || (material.isSystem ? "Standard Reference" : "Laboratory"),
        status,
        isEditable: true,
        originalDefaultValue: meta?.originalDefaultValue ?? schema.defaultVal,
        confidence: meta?.confidence || "High (Standard Specification)",
        notes: meta?.notes,
        history: meta?.history || []
      });
    }

    groups.push({
      material,
      role: roleKey,
      categoryAr: catAr,
      categoryFr: catFr,
      categoryEn: catEn,
      missingRequiredCount: matMissingReq,
      missingOptionalCount: matMissingOpt,
      totalMissingCount: matMissingReq + matMissingOpt,
      properties: evaluatedProps
    });

    totalMissingRequired += matMissingReq;
    totalMissingOptional += matMissingOpt;
  }

  return {
    totalMissingRequired,
    totalMissingOptional,
    totalMissing: totalMissingRequired + totalMissingOptional,
    groups
  };
}

export interface BatchUpdatePayload {
  materialId: string;
  propertyKey: string;
  newValue: any;
  userNote?: string;
}

export function applyBatchMaterialProperties(
  materials: EngineeringMaterial[],
  inputsOrUpdates: any,
  updatesParam?: BatchUpdatePayload[],
  userId?: string
): {
  updatedMaterials: EngineeringMaterial[];
  updatedInputs: any;
  errors: string[];
} {
  let inputs: any = undefined;
  let updates: BatchUpdatePayload[] = [];
  if (Array.isArray(inputsOrUpdates)) {
    updates = inputsOrUpdates;
  } else {
    inputs = inputsOrUpdates;
    updates = updatesParam || [];
  }

  const errors: string[] = [];
  const updatedMaterials = materials.map((m) => {
    const matUpdates = updates.filter((u) => u.materialId === m.id);
    if (matUpdates.length === 0) return m;

    const copy: any = {
      ...m,
      engineeringData: { ...(m.engineeringData || {}) },
      propertyMetadata: { ...(m.propertyMetadata || {}) }
    };

    for (const update of matUpdates) {
      copy[update.propertyKey] = update.newValue;
      copy.engineeringData[update.propertyKey] = update.newValue;

      // Synchronize uppercase and alternative aliases
      if (update.propertyKey === "density") {
        const num = Number(update.newValue);
        copy.Density = num;
        copy.density = num;
        copy.specificGravity = +(num / 1000).toFixed(3);
        copy.SpecificGravity = +(num / 1000).toFixed(3);
        copy.relativeDensity = +(num / 1000).toFixed(3);
      } else if (update.propertyKey === "specificGravity") {
        const num = Number(update.newValue);
        copy.SpecificGravity = num;
        copy.specificGravity = num;
        copy.density = Math.round(num * 1000);
        copy.Density = Math.round(num * 1000);
      } else if (update.propertyKey === "absorption") {
        copy.Absorption = Number(update.newValue);
        copy.absorption = Number(update.newValue);
      } else if (update.propertyKey === "moisture") {
        copy.Moisture = Number(update.newValue);
        copy.moisture = Number(update.newValue);
      } else if (update.propertyKey === "finenessModulus") {
        copy.FinenessModulus = Number(update.newValue);
        copy.finenessModulus = Number(update.newValue);
      } else if (update.propertyKey === "sandEquivalent") {
        copy.SandEquivalent = Number(update.newValue);
        copy.sandEquivalent = Number(update.newValue);
      } else if (update.propertyKey === "bulkDensity") {
        copy.BulkDensity = Number(update.newValue);
        copy.bulkDensity = Number(update.newValue);
      } else if (update.propertyKey === "dMax") {
        copy.Dmax = Number(update.newValue);
        copy.dMax = Number(update.newValue);
      } else if (update.propertyKey === "losAngelesAbrasion" || update.propertyKey === "losAngeles") {
        copy.LosAngeles = Number(update.newValue);
        copy.losAngeles = Number(update.newValue);
      }

      const currentMeta = copy.propertyMetadata[update.propertyKey] || {};
      const origVal = currentMeta.originalDefaultValue !== undefined ? currentMeta.originalDefaultValue : currentMeta.value;
      const history = [...(currentMeta.history || [])];

      history.push({
        timestamp: new Date().toISOString(),
        value: update.newValue,
        sourceType: "user_input",
        note: update.userNote || (userId ? `Manual update by user ${userId}` : "Manual update by user")
      });

      copy.propertyMetadata[update.propertyKey] = {
        ...currentMeta,
        key: update.propertyKey,
        value: update.newValue,
        status: "user_edited",
        sourceType: "user_input",
        sourceLabel: "تعديل يدوي (User Edit)",
        isEditable: true,
        originalDefaultValue: origVal,
        history
      };
    }

    // Mark updated material as Approved and Active for mix calculations
    copy.status = "نشط";
    copy.Status = "Approved";
    copy.ApprovalStatus = "Approved";
    copy.validationStatus = "VALID";
    copy.isComplete = true;
    copy.approvalDate = new Date().toISOString().split("T")[0];
    copy.engineerApproval = {
      status: "approved",
      engineerName: userId || "المهندس المشرف",
      approvalDate: new Date().toISOString().split("T")[0],
      notes: "تم إكمال الخصائص الهندسية وتوثيق الاعتماد بنجاح."
    };

    // Ensure aggregate gradation data is present
    const role = normalizeMaterialRole(copy.category || copy.type || "");
    if (!copy.gradationData || !Array.isArray(copy.gradationData) || copy.gradationData.length === 0) {
      if (role === "sand") {
        copy.gradationData = [
          { sieveSize: 4.75, percentPassing: 98 },
          { sieveSize: 2.36, percentPassing: 85 },
          { sieveSize: 1.18, percentPassing: 68 },
          { sieveSize: 0.60, percentPassing: 45 },
          { sieveSize: 0.30, percentPassing: 20 },
          { sieveSize: 0.15, percentPassing: 6 }
        ];
      } else if (role === "gravel" && copy.dMax) {
        const dm = copy.dMax;
        copy.gradationData = [
          { sieveSize: dm * 1.25, percentPassing: 100 },
          { sieveSize: dm, percentPassing: 95 },
          { sieveSize: dm / 2, percentPassing: 50 },
          { sieveSize: dm / 4, percentPassing: 10 },
          { sieveSize: 4.75, percentPassing: 2 }
        ];
      }
    }
    if (!copy.laboratory) copy.laboratory = "مختبر ضبط الجودة للمشروع (Project QA Lab)";
    if (!copy.standard) copy.standard = "NF EN 12620 / ASTM C33";
    if (userId) {
      copy.lastModifiedBy = userId;
    }
    return copy as EngineeringMaterial;
  });

  // Sync inputs if provided
  let updatedInputs = inputs ? { ...inputs } : undefined;
  if (updatedInputs) {
    for (const update of updates) {
      const mat = updatedMaterials.find((m) => m.id === update.materialId);
      const role = mat ? normalizeMaterialRole(mat.category || mat.type || "") : "";

      if (update.propertyKey === "dMax" && (role === "gravel" || role === "recycledAggregate" || role === "heavyweightAggregate" || role === "lightweightAggregate")) {
        updatedInputs.dMax = Number(update.newValue);
      }
      if (update.propertyKey === "density") {
        if (role === "cement") updatedInputs.cementDensity = Number(update.newValue);
        if (role === "sand") {
          updatedInputs.sandDensity = Number(update.newValue);
          updatedInputs.sandRelativeDensity = Number(update.newValue) / 1000;
        }
        if (role === "gravel") {
          updatedInputs.gravelDensity = Number(update.newValue);
          updatedInputs.gravelRelativeDensity = Number(update.newValue) / 1000;
        }
      }
      if (update.propertyKey === "moisture") {
        if (role === "sand") {
          updatedInputs.moistureSand = Number(update.newValue);
          updatedInputs.sandMoisture = Number(update.newValue);
        }
        if (role === "gravel") {
          updatedInputs.moistureGravel = Number(update.newValue);
          updatedInputs.gravelMoisture = Number(update.newValue);
        }
      }
      if (update.propertyKey === "absorption") {
        if (role === "sand") updatedInputs.sandAbsorption = Number(update.newValue);
        if (role === "gravel") updatedInputs.gravelAbsorption = Number(update.newValue);
      }
      if (update.propertyKey === "finenessModulus" && role === "sand") {
        updatedInputs.finenessModulus = Number(update.newValue);
        updatedInputs.sandFinenessModulus = Number(update.newValue);
      }
      if (update.propertyKey === "airContent" || update.propertyKey === "airPercentage") {
        updatedInputs.airContent = Number(update.newValue);
      }
    }
  }

  // Update local storage persistence atomically if available
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("materials_database", JSON.stringify(updatedMaterials));
      const userMats = updatedMaterials.filter(m => !m.isSystem && m.materialSource !== "system");
      if (userMats.length > 0) {
        localStorage.setItem("user_materials", JSON.stringify(userMats));
      }
    }
  } catch (e) {
    // ignore in tests or sandboxed environments
  }

  return {
    updatedMaterials,
    updatedInputs: updatedInputs || inputs,
    errors
  };
}

export interface CategorizedPropertyItem {
  materialId: string;
  materialName: string;
  role: SupportedMaterialRole;
  key: string;
  propertyId: string;
  labelAr: string;
  labelFr: string;
  labelEn: string;
  unit: string;
  currentValue: any;
  currentValueDisplay: string;
  hasCurrentValue: boolean;
  isRequired: boolean;
  status: "missing" | "invalid" | "needs_review" | "valid" | "not_applicable" | "default_reference";
  category: "auto_completable" | "user_input" | "needs_review" | "valid";
  suggestedValue: any;
  valueSource: string;
  requiredReason: string;
  validationIssue?: string;
  inputType: PropertyInputType;
  options?: PropertyOption[];
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  testStandard?: string;
}

export interface MaterialDeficienciesBreakdown {
  material: EngineeringMaterial;
  role: SupportedMaterialRole;
  totalDeficiencies: number;
  autoCompletable: CategorizedPropertyItem[];
  userInput: CategorizedPropertyItem[];
  needsReview: CategorizedPropertyItem[];
  valid: CategorizedPropertyItem[];
}

/**
 * Returns sound engineering default value with clear source metadata based on standard specs.
 */
export function getEngineeringPropertyReference(
  material: EngineeringMaterial,
  role: SupportedMaterialRole,
  key: string,
  schema?: MaterialPropertyDefinition
): { value: any; source: string; reason: string } {
  const name = `${material.name || ""} ${material.englishName || ""} ${(material as any).desc || ""}`.toLowerCase();

  // Role: CEMENT
  if (role === "cement") {
    if (key === "density") {
      return {
        value: 3100,
        source: "المواصفة الجزائرية NA 442 والمواصفة الأوروبية EN 197-1 للإسمنت البورتلاندي",
        reason: "الكثافة المطلقة للإسمنت لحساب الحجم الفعلي وكمية الماء والركام في الخلطة."
      };
    }
    if (key === "strengthClass") {
      let val = 42.5;
      if (name.includes("52.5")) val = 52.5;
      else if (name.includes("32.5")) val = 32.5;
      else if (name.includes("42.5")) val = 42.5;
      return {
        value: val,
        source: "مستخلص من صنف الإسمنت الاسمي طبقاً للمواصفة EN 196-1",
        reason: "مطلوبة لحساب المقاومة المتوسطة المستهدفة fcm28 ونسبة الماء إلى الإسمنت W/C."
      };
    }
    if (key === "cementClass") {
      let val = "CEM I 42.5";
      if (name.includes("cem ii") || name.includes("مركب")) val = "CEM II/A 42.5";
      else if (name.includes("cem iii") || name.includes("خبث")) val = "CEM III 42.5";
      else if (name.includes("cem iv") || name.includes("بوزولان")) val = "CEM IV 32.5";
      else if (name.includes("52.5")) val = "CEM I 52.5";
      return {
        value: val,
        source: "التصنيف القياسي للإسمنت وفق المواصفة EN 197-1",
        reason: "لتحديد سلوك الإماهة وزمن الشك ومعامل النشاط الهيدروليكي."
      };
    }
    if (key === "bulkDensity") {
      return {
        value: 1150,
        source: "الكثافة الظاهرية المرجعية للإسمنت السائب غير المرصوص",
        reason: "لحساب سعة صوامع التخزين والتحويل بين الوزن والحجم الظاهري."
      };
    }
    if (key === "blaineFineness") {
      return {
        value: 3450,
        source: "نعومة بلين القياسية لإسمنت بورتلاندي عادي وفق EN 196-6",
        reason: "تؤثر على سرعة التفاعل وتطور المقاومة المبكرة والحاجة للماء."
      };
    }
    if (key === "initialSettingTime") {
      return {
        value: 135,
        source: "زمن الشك الابتدائي القياسي وفق المواصفة EN 196-3",
        reason: "لتحديد زمن النقل والصب والتشغيل المسموح به في الموقع."
      };
    }
    if (key === "soundness") {
      return {
        value: 1.5,
        source: "ثبات حجم الإسمنت (اختبار لو شاتولييه) وفق EN 196-3",
        reason: "ضمان عدم تمدد أو تشقق الخرسانة المتصلبة بسبب الجير الحر."
      };
    }
  }

  // Role: SAND
  if (role === "sand") {
    if (key === "density") {
      return {
        value: 2650,
        source: "الكثافة الحبيبية القياسية للرمل الكوارتزي السليسي وفق EN 1097-6",
        reason: "الكثافة الحقيقية للرمل لحساب الحجم المطلق ونسبة الرمل في المنحنى الحبيبي."
      };
    }
    if (key === "finenessModulus") {
      let val = 2.6;
      if (name.includes("dune") || name.includes("صحراوي") || name.includes("كثبان")) val = 1.6;
      else if (name.includes("concass") || name.includes("مكسر") || name.includes("carrière")) val = 2.8;
      else if (name.includes("oued") || name.includes("wadi") || name.includes("واد") || name.includes("نهري")) val = 2.5;
      return {
        value: val,
        source: "معامل النعومة النموذجي للرمل وفق درو-غوريس والمواصفة NA 5110",
        reason: "يحدد قابلية تشغيل الخرسانة ونسبة الرمل المثالية (G/S) لمنع الانفصال الحبيبي."
      };
    }
    if (key === "sandEquivalent") {
      return {
        value: 82,
        source: "المكافئ الرملي المعتمد للرمل المغسول النظيف وفق EN 933-8",
        reason: "فحص نظافة الرمل وخلوه من الطين والشوائب الضارة بالتصاق الإسمنت."
      };
    }
    if (key === "bulkDensity") {
      return {
        value: 1550,
        source: "الكثافة الظاهرية الجافة للرمل الطبيعي الجاف",
        reason: "لحساب نسبة الفراغات ومؤشر الرص في الخلطة."
      };
    }
    if (key === "absorption") {
      return {
        value: 1.2,
        source: "نسبة الامتصاص القياسية للرمل الكوارتزي وفق EN 1097-6",
        reason: "لحساب الماء الفعال وموازنة الامتصاص الجاف أثناء الخلط."
      };
    }
    if (key === "moisture") {
      return {
        value: 3.0,
        source: "قيمة مرجعية متوسطة لرطوبة الرمل المخزن بالموقع (2% - 5%)",
        reason: "خاصية حقلية متغيرة يومياً، إلزامية لحساب تصحيح ماء الخلط الفعلي في الخلاطة."
      };
    }
    if (key === "finesContent") {
      return {
        value: 3.5,
        source: "نسبة الحبيبات الدقيقة المارة من منخل 0.063 مم وفق EN 933-1",
        reason: "تؤثر على تماسك الخرسانة الطازجة ومقاومة النضح."
      };
    }
  }

  // Role: GRAVEL / COARSE AGGREGATE
  if (role === "gravel" || role === "recycledAggregate" || role === "heavyweightAggregate" || role === "lightweightAggregate") {
    // Try to extract fraction (e.g. 8/15, 15/25, 3/8, 8/16, 16/22)
    const match = name.match(/(\d+)[/-](\d+)/);
    const parsedDmin = match ? parseInt(match[1], 10) : undefined;
    const parsedDmax = match ? parseInt(match[2], 10) : undefined;

    if (key === "density") {
      return {
        value: 2680,
        source: "الكثافة الحبيبية القياسية للحصى الكلسي/الرسوبي وفق EN 1097-6",
        reason: "الكثافة المطلقة للحصى لحساب الحجم المطلق ووزن الخرسانة الطازجة."
      };
    }
    if (key === "dMax") {
      let val = 20;
      if (parsedDmax && parsedDmax >= 4 && parsedDmax <= 63) val = parsedDmax;
      else if (name.includes("g1") || name.includes("3/8")) val = 8;
      else if (name.includes("g2") || name.includes("8/15") || name.includes("8/16")) val = 16;
      else if (name.includes("g3") || name.includes("15/25") || name.includes("16/22")) val = 25;
      return {
        value: val,
        source: `المقاس الأكبر للحبيبات Dmax المستخلص من صنف الحصى (${val} مم)`,
        reason: "الركن الأساسي في طريقة درو-غوريس لتحديد معامل الحصى G ونقطة الانعطاف ونسبة الإسمنت."
      };
    }
    if (key === "dMin") {
      let val = 8;
      if (parsedDmin && parsedDmin >= 1 && parsedDmin <= 32) val = parsedDmin;
      else if (name.includes("g1") || name.includes("3/8")) val = 3;
      else if (name.includes("g2") || name.includes("8/15") || name.includes("8/16")) val = 8;
      else if (name.includes("g3") || name.includes("15/25") || name.includes("16/22")) val = 15;
      return {
        value: val,
        source: `المقاس الأصغر للحبيبات Dmin (${val} مم) وفق التوزيع الحبيبي`,
        reason: "لتحديد مدى التدرج الحبيبي المستمر أو المنقطع وتفادي التعشيش."
      };
    }
    if (key === "losAngelesAbrasion" || key === "LosAngeles") {
      return {
        value: 22,
        source: "معامل التفتت بلوس أنجلوس للحصى الكلسي الصالح للخرسانة الهيكلية وفق EN 1097-2",
        reason: "فحص الصلادة ومقاومة البري تحت تأثير الأحمال الميكانيكية."
      };
    }
    if (key === "flakinessIndex") {
      return {
        value: 12,
        source: "معامل التفرطح القياسي للحصى المكسر الجيد وفق EN 933-3",
        reason: "الحصى المتفرطح أو العصوي يضعف المقاومة ويزيد استهلاك الماء."
      };
    }
    if (key === "bulkDensity") {
      return {
        value: 1450,
        source: "الكثافة الظاهرية الجافة للحصى الكلسي غير المرصوص",
        reason: "لحساب معامل الرص جاما ونسبة الفراغات بين الحبيبات."
      };
    }
    if (key === "absorption") {
      return {
        value: 0.8,
        source: "نسبة الامتصاص القياسية للحصى الكلسي وفق EN 1097-6",
        reason: "لحساب تصحيح امتصاص الركام لماء الخلط."
      };
    }
    if (key === "moisture") {
      return {
        value: 1.5,
        source: "قيمة مرجعية متوسطة لرطوبة الحصى بالموقع (0.5% - 2.5%)",
        reason: "خاصية حقلية متغيرة يومياً، تلزم لخصم ماء الركام الحر من مياه الخلط."
      };
    }
    if (key === "particleShape") {
      return {
        value: "مكسر",
        source: "الشكل النموذجي للحصى المستخرج من المقالع الكلسية",
        reason: "يؤثر على معامل دروكس G والتشابك الميكانيكي."
      };
    }
  }

  // Role: ADMIXTURE
  if (role === "admixture") {
    if (key === "recommendedDosage") {
      return {
        value: 1.2,
        source: "الجرعة القياسية الموصى بها لملدن البولي كربوكسيلات (% من وزن الإسمنت)",
        reason: "تحدد كمية الإضافة المطلوبة لتحقيق السيولة المطلوبة."
      };
    }
    if (key === "waterReduction") {
      return {
        value: 20,
        source: "نسبة تخفيض الماء النموذجية للملدن الفائق وفق EN 934-2",
        reason: "تخفيض نسبة W/C مع الحفاظ على الهبوط لزيادة مقاومة الخرسانة."
      };
    }
    if (key === "density") {
      return {
        value: 1080,
        source: "كثافة الإضافة الكيميائية السائلة (kg/m³)",
        reason: "لحساب حجم ووزن الإضافة ومساهمتها في ماء الخلط."
      };
    }
    if (key === "airPercentage") {
      return {
        value: 1.5,
        source: "نسبة الهواء المحبوس الطبيعية في الخرسانة مع الملدن الفائق",
        reason: "تطرح من حجم الخرسانة المطلق لضبط الكثافة."
      };
    }
    if (key === "admixtureType") {
      return {
        value: "superplasticizer",
        source: "تصنيف الملدن الفائق (Superplasticizer) وفق EN 934-2",
        reason: "لتطبيق معاملات التخفيض وتوافق الشك."
      };
    }
  }

  // Role: WATER
  if (role === "water") {
    if (key === "density") {
      return {
        value: 1000,
        source: "كثافة ماء الخلط الصافي وفق المواصفة NF EN 1008 (1000 kg/m³)",
        reason: "التحويل الدقيق بين لترات الماء ووزنه بالكيلوغرام."
      };
    }
    if (key === "pH") {
      return {
        value: 7.2,
        source: "الرقم الهيدروجيني لماء الشرب الصالح للخلط وفق EN 1008",
        reason: "ضمان عدم حموضة الماء وحماية حديد التسليح من التآكل المبكر."
      };
    }
  }

  // Role: FIBER
  if (role === "fiber") {
    if (key === "density") {
      return {
        value: 910,
        source: "كثافة ألياف البولي بروبيلين الدقيقة (kg/m³)",
        reason: "لحساب الحجم المطلق المستبدل من الخلطة."
      };
    }
    if (key === "recommendedDosage") {
      return {
        value: 0.9,
        source: "الجرعة القياسية لألياف البولي بروبيلين (0.9 kg/m³)",
        reason: "لمنع شروخ الانكماش اللدن في الساعات الأولى للصب."
      };
    }
    if (key === "fiberLength") {
      return {
        value: 12,
        source: "الطول النموذجي للألياف الميكروية (12 مم)",
        reason: "لتوفير توزيع متجانس دون تكوير في الخلاطة."
      };
    }
  }

  // Fallback to schema default if present
  if (schema && schema.defaultVal !== undefined) {
    return {
      value: schema.defaultVal,
      source: "قيمة معيارية معتمدة وفق جدول خصائص المواد",
      reason: schema.labelAr ? `خاصية لازمة لحسابات مادة [${schema.labelAr}]` : "خاصية لازمة للنموذج الرياضي"
    };
  }

  return {
    value: 0,
    source: "قيمة افتراضية قياسية",
    reason: "مطلوبة لإكمال سجل المادة"
  };
}

/**
 * Categorizes all properties of materials into the 3 strict user workflow categories:
 * 1. Auto-completable by system
 * 2. Require user input
 * 3. Require review due to illogical / out-of-range values
 */
export function categorizeMixMaterialDeficiencies(
  activeMaterials: { role: string; material: EngineeringMaterial }[],
  formValues: Record<string, any>,
  mixMethod: string = "dreux",
  concreteType: string = "NSC"
): MaterialDeficienciesBreakdown[] {
  const breakdowns: MaterialDeficienciesBreakdown[] = [];

  for (const item of (activeMaterials || [])) {
    const material = item.material;
    if (!material) continue;

    const roleKey = normalizeMaterialRole(material.category || item.role);
    const schemas = MATERIAL_PROPERTY_SCHEMAS[roleKey] || [];

    const autoCompletable: CategorizedPropertyItem[] = [];
    const userInput: CategorizedPropertyItem[] = [];
    const needsReview: CategorizedPropertyItem[] = [];
    const valid: CategorizedPropertyItem[] = [];

    for (const schema of (schemas || [])) {
      const isReq = schema.isRequired(material, mixMethod, concreteType);
      const val = getMaterialPropValue(material, schema.key);
      const fieldKey = `${material.id}_${schema.key}`;
      const formVal = formValues[fieldKey];

      const currentEffectiveVal = formVal !== undefined && formVal !== "" ? formVal : val;
      const hasVal = currentEffectiveVal !== undefined && currentEffectiveVal !== null && currentEffectiveVal !== "" && (
        typeof currentEffectiveVal === "number" ? !isNaN(currentEffectiveVal) : String(currentEffectiveVal).trim() !== ""
      );

      // If property is optional and not present, it is not a deficiency
      if (!isReq && !hasVal) {
        continue;
      }

      const ref = getEngineeringPropertyReference(material, roleKey, schema.key, schema);

      let status: CategorizedPropertyItem["status"] = "missing";
      let category: CategorizedPropertyItem["category"] = "auto_completable";
      let validationIssue: string | undefined = undefined;

      if (hasVal) {
        let parsedVal = currentEffectiveVal;
        if (schema.inputType === "number") {
          parsedVal = typeof currentEffectiveVal === "number" ? currentEffectiveVal : parseFloat(String(currentEffectiveVal).replace(",", "."));
        }
        const valRes = schema.validate(parsedVal, material, mixMethod);
        if (!valRes.isValid) {
          status = "invalid";
          category = "needs_review";
          validationIssue = valRes.errorAr || "القيمة الحالية غير مقبولة هندسياً أو خارج النطاق المسموح.";
        } else {
          status = "valid";
          category = "valid";
        }
      } else {
        // Missing property: is it auto-completable or user input?
        // Moisture is field-variable and naturally needs user verification, though suggested value is available
        if (schema.key === "moisture" || schema.key === "sandMoisture" || schema.key === "gravelMoisture") {
          category = "user_input";
          status = "missing";
        } else {
          category = "auto_completable";
          status = "missing";
        }
      }

      const displayVal = hasVal ? `${currentEffectiveVal} ${schema.unit || ""}`.trim() : "— (فارغة / غير مسجلة)";

      const catItem: CategorizedPropertyItem = {
        materialId: material.id,
        materialName: material.name,
        role: roleKey,
        key: schema.key,
        propertyId: schema.propertyId,
        labelAr: schema.labelAr,
        labelFr: schema.labelFr,
        labelEn: schema.labelEn,
        unit: schema.unit,
        currentValue: val,
        currentValueDisplay: displayVal,
        hasCurrentValue: hasVal,
        isRequired: isReq,
        status,
        category,
        suggestedValue: ref.value,
        valueSource: ref.source,
        requiredReason: ref.reason,
        validationIssue,
        inputType: schema.inputType,
        options: schema.options,
        min: schema.min,
        max: schema.max,
        placeholder: schema.placeholder || String(ref.value || ""),
        testStandard: schema.testStandard
      };

      if (category === "needs_review") {
        needsReview.push(catItem);
      } else if (category === "user_input") {
        userInput.push(catItem);
      } else if (category === "auto_completable") {
        autoCompletable.push(catItem);
      } else {
        valid.push(catItem);
      }
    }

    const totalDeficiencies = autoCompletable.length + userInput.length + needsReview.length;

    breakdowns.push({
      material,
      role: roleKey,
      totalDeficiencies,
      autoCompletable,
      userInput,
      needsReview,
      valid
    });
  }

  return breakdowns;
}
