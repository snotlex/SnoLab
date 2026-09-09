import { EngineeringMaterial } from "../../types";
import { SupportedMaterialRole, normalizeMaterialRole } from "../materialPropertySchema";

export type CompletenessStatus = "READY" | "INCOMPLETE" | "NEEDS_REVIEW" | "INVALID";

export type PropertyMissingReason = "MISSING" | "EMPTY" | "INVALID" | "NEEDS_REVIEW" | "VALID";

export type PropertyPriority = "DREUX_REQUIRED" | "CATEGORY_REQUIRED" | "OPTIONAL";

export interface PropertyInspectionItem {
  key: string;
  propertyId: string;
  nameAr: string;
  nameEn: string;
  nameFr: string;
  unit: string;
  expectedType: "number" | "string" | "boolean";
  priority: PropertyPriority;
  isRequiredForCalculation: boolean;
  isRequiredForCategory: boolean;
  status: PropertyMissingReason;
  currentValue: any;
  currentValueDisplay: string;
  detectedValue?: any;
  confidence?: "HIGH" | "MEDIUM" | "LOW";
  requiresConfirmation?: boolean;
  validationError?: string;
  min?: number;
  max?: number;
  warningMin?: number;
  warningMax?: number;
  explanationAr: string;
  explanationEn: string;
  canAutoComplete?: boolean;
  sourceAr?: string;
  sourceEn?: string;
  reasonAr?: string;
  reasonEn?: string;
  suggestedValue?: number | string;
}

export interface MaterialCompletenessAudit {
  materialId: string;
  materialName: string;
  englishName?: string;
  category: string;
  role: SupportedMaterialRole;
  isSystem: boolean;
  provenance: string;
  overallStatus: CompletenessStatus;
  requiresAttention: boolean;
  isEligibleForDreuxGorisse: boolean;
  completenessScore: number; // 0 - 100%
  totalPropertiesCount: number;
  completedCount: number;
  missingDreuxCount: number;
  missingCategoryCount: number;
  missingOptionalCount: number;
  needsReviewCount: number;
  invalidCount: number;
  properties: PropertyInspectionItem[];
  dreuxProperties: PropertyInspectionItem[];
  categoryProperties: PropertyInspectionItem[];
  optionalProperties: PropertyInspectionItem[];
  unresolvedProperties: PropertyInspectionItem[];
  calculationBlockers: string[];
}

export interface LibraryCompletenessReport {
  totalInspected: number;
  readyCount: number;
  incompleteCount: number;
  needsReviewCount: number;
  invalidCount: number;
  requiresAttentionCount: number;
  materials: MaterialCompletenessAudit[];
  materialsRequiringAttention: MaterialCompletenessAudit[];
}

export interface RolePropertySpec {
  key: string;
  propertyId: string;
  nameAr: string;
  nameEn: string;
  nameFr: string;
  unit: string;
  priority: PropertyPriority;
  explanationAr: string;
  explanationEn: string;
  min?: number;
  max?: number;
  warningMin?: number;
  warningMax?: number;
  allowZero?: boolean;
}

export const ROLE_PROPERTY_SPECS: Record<string, RolePropertySpec[]> = {
  cement: [
    {
      key: "density", propertyId: "PROP-SPECIFIC-GRAVITY", nameAr: "الكثافة الحقيقية للإسمنت", nameEn: "Specific Gravity / Density", nameFr: "Masse volumique absolue",
      unit: "kg/m³", priority: "DREUX_REQUIRED", explanationAr: "لازمة لحساب الحجم المطلق للإسمنت في معادلة الحجم 1000 لتر", explanationEn: "Needed for absolute volume calculation",
      min: 1500, max: 4500, warningMin: 2900, warningMax: 3250
    },
    {
      key: "strength28d", propertyId: "PROP-CEM-STRENGTH-28D", nameAr: "مقاومة الإسمنت المعيارية في 28 يوماً (fc28)", nameEn: "Standard 28d Cement Strength", nameFr: "Résistance normale à 28j",
      unit: "MPa", priority: "DREUX_REQUIRED", explanationAr: "مطلوبة لتطبيق معادلة بولومي وحساب نسبة الماء إلى الإسمنت W/C بدقة", explanationEn: "Required for Bolomey equation to calculate W/C ratio",
      min: 20, max: 80, warningMin: 32.5, warningMax: 62.5
    },
    {
      key: "bulkDensity", propertyId: "PROP-BULK-DENSITY", nameAr: "الكثافة الظاهرية السائبة للإسمنت", nameEn: "Bulk Density", nameFr: "Masse volumique apparente",
      unit: "kg/m³", priority: "OPTIONAL", explanationAr: "تفيد في حساب تخزين الصوامع ومعايرة الوزن إلى الحجم", explanationEn: "Used for silo storage and volume batching",
      min: 800, max: 2000, warningMin: 900, warningMax: 1500
    },
    {
      key: "blaineFineness", propertyId: "PROP-CEM-BLAINE", nameAr: "المساحة النوعية لبلين (النعومة)", nameEn: "Blaine Fineness", nameFr: "Surface spécifique Blaine",
      unit: "cm²/g", priority: "OPTIONAL", explanationAr: "مؤشر لسرعة إماهة الإسمنت واكتساب المقاومة المبكرة", explanationEn: "Indicates hydration rate and early strength gain",
      min: 1500, max: 7000, warningMin: 2800, warningMax: 5000
    },
    {
      key: "initialSettingTime", propertyId: "PROP-CEM-INITIAL-SETTING", nameAr: "زمن الشك الابتدائي", nameEn: "Initial Setting Time", nameFr: "Temps de début de prise",
      unit: "دقيقة", priority: "OPTIONAL", explanationAr: "يحدد وقت قابلية تشغيل الخرسانة ونقلها", explanationEn: "Determines workability window",
      min: 30, max: 400, warningMin: 45, warningMax: 240
    }
  ],
  sand: [
    {
      key: "density", propertyId: "PROP-SPECIFIC-GRAVITY", nameAr: "الكثافة الحقيقية للرمل", nameEn: "Specific Gravity / Particle Density", nameFr: "Masse volumique réelle du sable",
      unit: "kg/m³", priority: "DREUX_REQUIRED", explanationAr: "ضرورية لحساب الحجم المطلق للرمل وتحديد وزنه في المتر المكعب", explanationEn: "Crucial for calculating absolute sand volume and batch mass",
      min: 1200, max: 4500, warningMin: 2400, warningMax: 2900
    },
    {
      key: "finenessModulus", propertyId: "PROP-FM", nameAr: "معامل النعومة (FM)", nameEn: "Fineness Modulus", nameFr: "Module de finesse",
      unit: "-", priority: "DREUX_REQUIRED", explanationAr: "يحدد موضع نقطة الانعطاف ونسبة الرمل إلى الحصى (S/G) على منحنى درو-غوريس", explanationEn: "Determines the inflection point and S/G ratio on Dreux curve",
      min: 1.0, max: 4.5, warningMin: 2.0, warningMax: 3.4
    },
    {
      key: "absorption", propertyId: "PROP-ABSORPTION", nameAr: "نسبة الامتصاص المائي للرمل", nameEn: "Water Absorption", nameFr: "Absorption d'eau",
      unit: "%", priority: "DREUX_REQUIRED", explanationAr: "مطلوبة لحساب الماء الفعال وتصحيح ماء الخلطة الخرسانية", explanationEn: "Required for effective water calculation and batch correction",
      min: 0, max: 25, warningMin: 0.1, warningMax: 4.0, allowZero: true
    },
    {
      key: "moisture", propertyId: "PROP-MOISTURE", nameAr: "نسبة الرطوبة الطبيعية للرمل", nameEn: "Moisture Content", nameFr: "Teneur en eau",
      unit: "%", priority: "CATEGORY_REQUIRED", explanationAr: "لازمة لتصحيح كمية ماء الخلط ووزن الرمل الرطب في الموقع", explanationEn: "Required to correct batch water and wet sand weight",
      min: 0, max: 25, warningMin: 0, warningMax: 10.0, allowZero: true
    },
    {
      key: "SandEquivalent", propertyId: "PROP-SAND-EQUIVALENT", nameAr: "المكافئ الرملي (SE)", nameEn: "Sand Equivalent", nameFr: "Équivalent de sable",
      unit: "%", priority: "CATEGORY_REQUIRED", explanationAr: "يقيس نظافة الرمل وخلوه من الشوائب الطينية الدقيقة الضارة", explanationEn: "Measures sand cleanliness and absence of harmful fines",
      min: 0, max: 100, warningMin: 60, warningMax: 95, allowZero: true
    },
    {
      key: "bulkDensity", propertyId: "PROP-BULK-DENSITY", nameAr: "الكثافة الظاهرية السائبة للرمل", nameEn: "Bulk Density", nameFr: "Masse volumique apparente",
      unit: "kg/m³", priority: "OPTIONAL", explanationAr: "تفيد في تقدير نسبة الفراغات بين الحبيبات", explanationEn: "Used to estimate intergranular void ratio",
      min: 1000, max: 2200, warningMin: 1400, warningMax: 1800
    },
    {
      key: "finesContent", propertyId: "PROP-FINES-CONTENT", nameAr: "نسبة المار من منخل 0.063/0.08 مم", nameEn: "Fines Content (<0.08mm)", nameFr: "Teneur en fines",
      unit: "%", priority: "OPTIONAL", explanationAr: "تؤثر على قوام الخرسانة واستهلاك ماء الخلط", explanationEn: "Influences concrete rheology and water demand",
      min: 0, max: 20, warningMin: 0.5, warningMax: 8.0, allowZero: true
    }
  ],
  gravel: [
    {
      key: "density", propertyId: "PROP-SPECIFIC-GRAVITY", nameAr: "الكثافة الحقيقية للحصى", nameEn: "Specific Gravity / Particle Density", nameFr: "Masse volumique réelle du gravillon",
      unit: "kg/m³", priority: "DREUX_REQUIRED", explanationAr: "ضرورية لحساب الحجم المطلق للركام الخشن في الخلطة", explanationEn: "Essential for calculating coarse aggregate volume in mix",
      min: 1200, max: 4500, warningMin: 2400, warningMax: 3000
    },
    {
      key: "dMax", propertyId: "PROP-DMAX", nameAr: "المقاس الأقصى للركام (Dmax)", nameEn: "Maximum Aggregate Size", nameFr: "Diamètre maximal des granulats",
      unit: "مم", priority: "DREUX_REQUIRED", explanationAr: "المعامل الرئيسي لحساب نقطة الانعطاف ومعامل درو K ومعامل الصقل", explanationEn: "Key parameter for Dreux inflection point, K coefficient and form factor",
      min: 2, max: 125, warningMin: 8, warningMax: 40
    },
    {
      key: "dMin", propertyId: "PROP-DMIN", nameAr: "المقاس الأدنى للركام (d)", nameEn: "Minimum Aggregate Size (d)", nameFr: "Diamètre minimal des granulats",
      unit: "مم", priority: "CATEGORY_REQUIRED", explanationAr: "يحدد الحد الأدنى للفئة الحبيبية للحصى (d/D)", explanationEn: "Specifies lower aggregate class fraction (d/D)",
      min: 1, max: 63, warningMin: 2, warningMax: 25
    },
    {
      key: "absorption", propertyId: "PROP-ABSORPTION", nameAr: "نسبة الامتصاص المائي للحصى", nameEn: "Water Absorption", nameFr: "Absorption d'eau",
      unit: "%", priority: "DREUX_REQUIRED", explanationAr: "لازمة لحساب الماء الفعال ومسامية الركام الخشن", explanationEn: "Needed for effective water and aggregate porosity",
      min: 0, max: 20, warningMin: 0.1, warningMax: 3.5, allowZero: true
    },
    {
      key: "LosAngeles", propertyId: "PROP-LOS-ANGELES", nameAr: "معامل لوس أنجلوس للتآكل (LA)", nameEn: "Los Angeles Abrasion", nameFr: "Coefficient Los Angeles",
      unit: "%", priority: "CATEGORY_REQUIRED", explanationAr: "يقيس المقاومة الميكانيكية للركام ضد التفتت والصدم", explanationEn: "Measures aggregate mechanical resistance to fragmentation",
      min: 5, max: 60, warningMin: 12, warningMax: 35
    },
    {
      key: "flakinessIndex", propertyId: "PROP-FLAKINESS-INDEX", nameAr: "معامل التسطح (Flakiness Index)", nameEn: "Flakiness Index", nameFr: "Coefficient d'aplatissement",
      unit: "%", priority: "CATEGORY_REQUIRED", explanationAr: "يحدد شكل الحبيبات؛ الركام المسطح يقلل من قابلية التشغيل والمقاومة", explanationEn: "Checks particle shape; flaky grains degrade workability",
      min: 0, max: 60, warningMin: 5, warningMax: 25, allowZero: true
    },
    {
      key: "bulkDensity", propertyId: "PROP-BULK-DENSITY", nameAr: "الكثافة الظاهرية السائبة للحصى", nameEn: "Bulk Density", nameFr: "Masse volumique apparente",
      unit: "kg/m³", priority: "OPTIONAL", explanationAr: "تفيد في حساب الفراغات وملاءمة التدرج الحبيبي", explanationEn: "Used for void ratio and packing density analysis",
      min: 1000, max: 2200, warningMin: 1250, warningMax: 1750
    },
    {
      key: "moisture", propertyId: "PROP-MOISTURE", nameAr: "محتوى الرطوبة للحصى", nameEn: "Moisture Content", nameFr: "Teneur en eau",
      unit: "%", priority: "OPTIONAL", explanationAr: "لتصحيح أوزان الركام الرطب في الخلاطة", explanationEn: "Corrects coarse aggregate batch weights in mixer",
      min: 0, max: 15, warningMin: 0, warningMax: 5.0, allowZero: true
    }
  ],
  admixture: [
    {
      key: "recommendedDosage", propertyId: "PROP-ADMIX-DOSAGE", nameAr: "الجرعة الموصى بها بالنسبة للإسمنت", nameEn: "Recommended Dosage (% cement)", nameFr: "Dosage recommandé (% ciment)",
      unit: "%", priority: "DREUX_REQUIRED", explanationAr: "مطلوبة لتحديد كمية الإضافة الواجب إضافتها لكل متر مكعب خرسانة", explanationEn: "Required to determine admixture quantity per m³ of concrete",
      min: 0.05, max: 10, warningMin: 0.2, warningMax: 3.5
    },
    {
      key: "waterReduction", propertyId: "PROP-ADMIX-WATER-REDUCTION", nameAr: "نسبة تخفيض ماء الخلط", nameEn: "Water Reduction Ratio", nameFr: "Réduction d'eau",
      unit: "%", priority: "DREUX_REQUIRED", explanationAr: "تستخدم لحساب الماء الفعال الجديد بعد إضافة الملدن", explanationEn: "Used to compute reduced effective water with plasticizer",
      min: 0, max: 50, warningMin: 5, warningMax: 35, allowZero: true
    },
    {
      key: "density", propertyId: "PROP-SPECIFIC-GRAVITY", nameAr: "الكثافة النوعية للإضافة السائلة", nameEn: "Specific Gravity / Density", nameFr: "Masse volumique de l'adjuvant",
      unit: "kg/m³", priority: "CATEGORY_REQUIRED", explanationAr: "لازمة للتحويل بين الحجم باللتر والوزن بالكيلوغرام", explanationEn: "Needed to convert volume in liters to mass in kg",
      min: 950, max: 1500, warningMin: 1020, warningMax: 1280
    },
    {
      key: "solidContent", propertyId: "PROP-ADMIX-SOLID-CONTENT", nameAr: "نسبة المواد الجافة (Dry Extract)", nameEn: "Dry Extract / Solid Content", nameFr: "Extrait sec",
      unit: "%", priority: "OPTIONAL", explanationAr: "تفيد في حساب الجزء المائي المحسوب ضمن ماء الخلطة", explanationEn: "Helps calculate water portion counted in total mix water",
      min: 5, max: 80, warningMin: 20, warningMax: 50
    }
  ],
  scm: [
    {
      key: "density", propertyId: "PROP-SPECIFIC-GRAVITY", nameAr: "الكثافة الحقيقية للإضافة المعدنية", nameEn: "Specific Gravity / Particle Density", nameFr: "Masse volumique absolue",
      unit: "kg/m³", priority: "DREUX_REQUIRED", explanationAr: "لازمة لحساب الحجم المطلق للإضافة في الخخلطة الخرسانية", explanationEn: "Needed to calculate absolute SCM volume in mix",
      min: 1500, max: 4000, warningMin: 2100, warningMax: 3100
    },
    {
      key: "pozzolanicIndex", propertyId: "PROP-SCM-ACTIVITY-INDEX", nameAr: "معامل الفعالية البوزولانية (Index k)", nameEn: "Pozzolanic Activity Index", nameFr: "Indice d'activité pouzzolanique",
      unit: "%", priority: "CATEGORY_REQUIRED", explanationAr: "يحدد مساهمة الإضافة في اكتساب المقاومة ومعامل التكافؤ k", explanationEn: "Determines strength contribution and k-value efficiency",
      min: 40, max: 150, warningMin: 65, warningMax: 110
    },
    {
      key: "finenessBlaine", propertyId: "PROP-SCM-FINENESS", nameAr: "النعومة والمساحة النوعية بلين", nameEn: "Specific Surface Area", nameFr: "Finesse / Surface spécifique",
      unit: "m²/kg", priority: "OPTIONAL", explanationAr: "تؤثر على سرعة التفاعل البوزولاني واستهلاك الماء", explanationEn: "Affects pozzolanic reaction rate and water demand",
      min: 200, max: 2500, warningMin: 350, warningMax: 900
    },
    {
      key: "waterDemandFactor", propertyId: "PROP-WATER-DEMAND-FACTOR", nameAr: "عامل طلب الماء للإضافة", nameEn: "Water Demand Factor", nameFr: "Facteur de demande d'eau",
      unit: "-", priority: "OPTIONAL", explanationAr: "نسبة الماء المطلوب مقارنة بالإسمنت البورتلاندي النقي", explanationEn: "Water requirement ratio relative to pure cement",
      min: 0.7, max: 1.5, warningMin: 0.9, warningMax: 1.15
    }
  ],
  water: [
    {
      key: "density", propertyId: "PROP-SPECIFIC-GRAVITY", nameAr: "كثافة ماء الخلط", nameEn: "Water Density", nameFr: "Masse volumique de l'eau",
      unit: "kg/m³", priority: "DREUX_REQUIRED", explanationAr: "تُعتمد 1000 kg/m³ لحساب الحجم والوزن", explanationEn: "Standard 1000 kg/m³ for volume and mass conversion",
      min: 980, max: 1050, warningMin: 995, warningMax: 1005
    },
    {
      key: "pH", propertyId: "PROP-WATER-PH", nameAr: "الرقم الهيدروجيني (pH)", nameEn: "pH Value", nameFr: "Potentiel hydrogène pH",
      unit: "-", priority: "CATEGORY_REQUIRED", explanationAr: "فحص نقاوة ماء الخلط وضمان عدم حموضته وتأثيره على حديد التسليح", explanationEn: "Checks water purity and ensures non-acidity against rebar corrosion",
      min: 5.0, max: 9.5, warningMin: 6.5, warningMax: 8.5
    },
    {
      key: "chlorides", propertyId: "PROP-WATER-CHLORIDES", nameAr: "محتوى الكلوريدات", nameEn: "Chloride Content", nameFr: "Teneur en chlorures",
      unit: "mg/L", priority: "OPTIONAL", explanationAr: "لمنع خطر تآكل حديد التسليح في الخرسانة المسلحة", explanationEn: "Prevents rebar corrosion risk in reinforced concrete",
      min: 0, max: 3000, warningMin: 0, warningMax: 500, allowZero: true
    },
    {
      key: "sulfates", propertyId: "PROP-WATER-SULFATES", nameAr: "محتوى الكبريتات", nameEn: "Sulfate Content", nameFr: "Teneur en sulfates",
      unit: "mg/L", priority: "OPTIONAL", explanationAr: "لمنع تشكل الإترينجايت الثانوي وتآكل الخرسانة", explanationEn: "Prevents secondary ettringite formation and sulfate attack",
      min: 0, max: 3000, warningMin: 0, warningMax: 400, allowZero: true
    }
  ],
  fiber: [
    {
      key: "density", propertyId: "PROP-SPECIFIC-GRAVITY", nameAr: "كثافة مادة الألياف", nameEn: "Fiber Material Density", nameFr: "Masse volumique des fibres",
      unit: "kg/m³", priority: "DREUX_REQUIRED", explanationAr: "لحساب حجم الألياف المستبدل من حجم الخلطة", explanationEn: "Calculates fiber displacement volume in mix",
      min: 800, max: 8500, warningMin: 910, warningMax: 7850
    },
    {
      key: "recommendedDosage", propertyId: "PROP-FIBER-DOSAGE", nameAr: "الجرعة الموصى بها للخرسانة", nameEn: "Recommended Dosage", nameFr: "Dosage recommandé",
      unit: "kg/m³", priority: "CATEGORY_REQUIRED", explanationAr: "وزن الألياف لكل متر مكعب من الخرسانة", explanationEn: "Fiber weight per m³ of concrete",
      min: 0.5, max: 60, warningMin: 0.9, warningMax: 25
    },
    {
      key: "fiberLength", propertyId: "PROP-FIBER-LENGTH", nameAr: "طول الألياف", nameEn: "Fiber Length", nameFr: "Longueur des fibres",
      unit: "مم", priority: "OPTIONAL", explanationAr: "يؤثر على تشابك الشروخ وتماسك الخرسانة", explanationEn: "Affects crack bridging and cohesion",
      min: 6, max: 70, warningMin: 12, warningMax: 50
    },
    {
      key: "aspectRatio", propertyId: "PROP-FIBER-ASPECT-RATIO", nameAr: "عامل النحافة / نسبة الأبعاد (L/d)", nameEn: "Aspect Ratio", nameFr: "Élancement",
      unit: "-", priority: "OPTIONAL", explanationAr: "نسبة طول الليف إلى قطره المكافئ", explanationEn: "Ratio of fiber length to equivalent diameter",
      min: 15, max: 150, warningMin: 35, warningMax: 85
    },
    {
      key: "tensileStrength", propertyId: "PROP-TENSILE-STRENGTH", nameAr: "مقاومة الشد للألياف", nameEn: "Tensile Strength", nameFr: "Résistance à la traction",
      unit: "MPa", priority: "OPTIONAL", explanationAr: "مقاومة الألياف للشد والتمزق", explanationEn: "Tensile breaking strength of fibers",
      min: 150, max: 3500, warningMin: 350, warningMax: 1400
    }
  ],
  other: [
    {
      key: "density", propertyId: "PROP-SPECIFIC-GRAVITY", nameAr: "الكثافة الحقيقية للمادة", nameEn: "Specific Gravity / Density", nameFr: "Masse volumique réelle",
      unit: "kg/m³", priority: "DREUX_REQUIRED", explanationAr: "الكثافة الأساسية لحساب الحجم المطلق للمادة", explanationEn: "Base density for absolute volume calculation",
      min: 500, max: 6000, warningMin: 1200, warningMax: 3500
    }
  ]
};

ROLE_PROPERTY_SPECS.filler = ROLE_PROPERTY_SPECS.scm;

export class CompletenessChecker {
  /**
   * Checks if a property key exists on the material (regardless of whether value is empty).
   */
  public static hasPropertyKey(mat: EngineeringMaterial, key: string): boolean {
    if (!mat) return false;
    if (key in mat) return true;
    if (mat.engineeringData && key in mat.engineeringData) return true;
    if (mat.extraProperties && key in mat.extraProperties) return true;
    if (mat.propertyMetadata && key in mat.propertyMetadata) return true;
    return false;
  }

  /**
   * Retrieves all available valid properties for a given material role and calculation method.
   */
  public static getAvailablePropertiesForRole(role: SupportedMaterialRole, calculationMethod: string = "dreux"): RolePropertySpec[] {
    const specs = ROLE_PROPERTY_SPECS[role] || ROLE_PROPERTY_SPECS.other;
    return [...specs];
  }

  /**
   * Checks if a property is logically and physically compatible with a given material role.
   */
  public static isPropertyCompatibleWithRole(propertyKey: string, role: SupportedMaterialRole): boolean {
    const specs = CompletenessChecker.getAvailablePropertiesForRole(role);
    return specs.some(s => s.key === propertyKey);
  }

  /**
   * Generates a sound, realistic engineering default value for a property based on material role,
   * fraction name, standard specifications (Dreux-Gorisse, EN 197-1, EN 12620, NA 442), and detected OCR values.
   */
  public static getLogicalDefaultValue(
    material: EngineeringMaterial,
    propertyKey: string,
    detectedValue?: any
  ): number | string {
    // 1. If an OCR / detected value exists and is valid, prefer it
    if (detectedValue !== undefined && detectedValue !== null && detectedValue !== "") {
      const parsed = typeof detectedValue === "number" ? detectedValue : parseFloat(String(detectedValue).replace(",", "."));
      if (!isNaN(parsed)) return parsed;
    }

    const role = normalizeMaterialRole(material.category || material.type || "");
    const name = `${material.name || ""} ${material.englishName || ""} ${(material as any).desc || ""}`.toLowerCase();

    // 2. Role-specific engineering logic
    if (role === "cement") {
      if (propertyKey === "density") return 3100;
      if (propertyKey === "strength28d") {
        if (name.includes("52.5")) return 52.5;
        if (name.includes("32.5")) return 32.5;
        if (name.includes("42.5")) return 48.5;
        return 42.5;
      }
      if (propertyKey === "bulkDensity") return 1150;
      if (propertyKey === "blaineFineness") return 3450;
      if (propertyKey === "initialSettingTime") return 135;
    }

    if (role === "sand") {
      if (propertyKey === "density") return 2650;
      if (propertyKey === "finenessModulus") {
        if (name.includes("dune") || name.includes("صحراوي") || name.includes("كثبان")) return 1.6;
        if (name.includes("concass") || name.includes("مكسر") || name.includes("carrière")) return 2.8;
        if (name.includes("oued") || name.includes("wadi") || name.includes("واد") || name.includes("نهري")) return 2.5;
        return 2.6; // standard Dreux sand
      }
      if (propertyKey === "absorption") return 1.2;
      if (propertyKey === "moisture") return 3.0;
      if (propertyKey === "SandEquivalent") return 82;
      if (propertyKey === "bulkDensity") return 1550;
      if (propertyKey === "finesContent") return 3.5;
    }

    if (role === "gravel") {
      if (propertyKey === "density") return 2680;
      
      // Try to parse aggregate fraction (e.g. 8/15, 15/25, 3/8, 8/16, 16/22)
      const fractionMatch = name.match(/(\d+)[/-](\d+)/);
      const parsedDmin = fractionMatch ? parseInt(fractionMatch[1], 10) : undefined;
      const parsedDmax = fractionMatch ? parseInt(fractionMatch[2], 10) : undefined;

      if (propertyKey === "dMax") {
        if (parsedDmax && parsedDmax >= 4 && parsedDmax <= 63) return parsedDmax;
        if (name.includes("g1") || name.includes("3/8")) return 8;
        if (name.includes("g2") || name.includes("8/15") || name.includes("8/16")) return 16;
        if (name.includes("g3") || name.includes("15/25") || name.includes("16/22")) return 25;
        return 20; // standard maximum size
      }
      if (propertyKey === "dMin") {
        if (parsedDmin && parsedDmin >= 1 && parsedDmin <= 32) return parsedDmin;
        if (name.includes("g1") || name.includes("3/8")) return 3;
        if (name.includes("g2") || name.includes("8/15") || name.includes("8/16")) return 8;
        if (name.includes("g3") || name.includes("15/25") || name.includes("16/22")) return 15;
        return 8;
      }
      if (propertyKey === "absorption") return 0.8;
      if (propertyKey === "LosAngeles") return 22;
      if (propertyKey === "flakinessIndex") return 12;
      if (propertyKey === "bulkDensity") return 1450;
      if (propertyKey === "moisture") return 1.5;
    }

    if (role === "admixture") {
      if (propertyKey === "recommendedDosage") return 1.2;
      if (propertyKey === "waterReduction") return 20;
      if (propertyKey === "density") return 1080;
      if (propertyKey === "solidContent") return 30;
    }

    if (role === "scm" || role === "filler") {
      if (propertyKey === "density") return 2800;
      if (propertyKey === "pozzolanicIndex") return 85;
      if (propertyKey === "finenessBlaine") return 450;
      if (propertyKey === "waterDemandFactor") return 1.0;
    }

    if (role === "water") {
      if (propertyKey === "density") return 1000;
      if (propertyKey === "pH") return 7.2;
      if (propertyKey === "chlorides") return 120;
      if (propertyKey === "sulfates") return 80;
    }

    if (role === "fiber") {
      const isSteel = name.includes("steel") || name.includes("فولاذ") || name.includes("حديد");
      if (propertyKey === "density") return isSteel ? 7850 : 910;
      if (propertyKey === "recommendedDosage") return isSteel ? 25 : 0.9;
      if (propertyKey === "fiberLength") return isSteel ? 35 : 18;
      if (propertyKey === "aspectRatio") return isSteel ? 55 : 65;
      if (propertyKey === "tensileStrength") return isSteel ? 1100 : 400;
    }

    // 3. Fallback to middle of warning range or standard spec range
    const specs = ROLE_PROPERTY_SPECS[role] || ROLE_PROPERTY_SPECS.other;
    const foundSpec = specs.find(s => s.key === propertyKey);
    if (foundSpec) {
      if (foundSpec.warningMin !== undefined && foundSpec.warningMax !== undefined) {
        const mid = (foundSpec.warningMin + foundSpec.warningMax) / 2;
        return mid >= 10 ? Math.round(mid) : +mid.toFixed(1);
      }
      if (foundSpec.min !== undefined && foundSpec.max !== undefined) {
        const mid = (foundSpec.min + foundSpec.max) / 2;
        return mid >= 10 ? Math.round(mid) : +mid.toFixed(1);
      }
    }

    return 0;
  }

  /**
   * Returns metadata regarding whether a property can be safely auto-completed by the system,
   * its authoritative engineering standard source, user reason if manual, and sound suggested value.
   */
  public static getPropertySourceInfo(
    material: EngineeringMaterial,
    propertyKey: string,
    roleOverride?: SupportedMaterialRole
  ): {
    canAutoComplete: boolean;
    sourceAr: string;
    sourceEn: string;
    reasonAr: string;
    reasonEn: string;
    suggestedValue: number | string;
  } {
    const role = roleOverride || normalizeMaterialRole(material.category || material.type || "");
    const suggestedValue = CompletenessChecker.getLogicalDefaultValue(material, propertyKey);

    // Explicit manual input properties (inherently site-specific or batch-specific)
    if (propertyKey === "moisture") {
      return {
        canAutoComplete: false,
        sourceAr: "قيمة استرشادية للرطوبة السطحية (تحتاج تأكيد حقلي)",
        sourceEn: "Indicative reference moisture (requires site verification)",
        reasonAr: "الرطوبة السطحية للركام متغيرة يومياً بتغير الطقس وظروف التخزين الميداني، ويجب قياسها في الموقع لتصحيح ماء الخلط الفعلي بدقة.",
        reasonEn: "Surface moisture fluctuates daily with weather and storage conditions; on-site measurement is required for batch water correction.",
        suggestedValue
      };
    }

    // Role-specific reliable auto-completion sources
    if (role === "cement") {
      if (propertyKey === "density") {
        return {
          canAutoComplete: true,
          sourceAr: "المواصفة القياسية الأوروبية EN 197-1 (كثافة الإسمنت البورتلاندي 3100 kg/m³)",
          sourceEn: "European Standard EN 197-1 (Portland Cement Density 3100 kg/m³)",
          reasonAr: "خاصية فيزيائية قياسية موحدة للإسمنت البورتلاندي لحساب الحجم المطلق.",
          reasonEn: "Standard physical specification for Portland cement used in absolute volume equations.",
          suggestedValue
        };
      }
      if (propertyKey === "strength28d") {
        return {
          canAutoComplete: true,
          sourceAr: "رتبة مقاومة الإسمنت المعيارية في 28 يوماً (مستخلصة من صنف الإسمنت)",
          sourceEn: "Standard 28-day cement strength class (derived from cement grade)",
          reasonAr: "رتبة معيارية مطلوبة لتطبيق معادلة بولومي وحساب نسبة الماء إلى الإسمنت W/C.",
          reasonEn: "Standard cement strength grade required for Bolomey water-cement ratio calculation.",
          suggestedValue
        };
      }
      if (propertyKey === "bulkDensity") {
        return {
          canAutoComplete: true,
          sourceAr: "الكثافة الظاهرية السائبة النموذجية للإسمنت (1150 kg/m³)",
          sourceEn: "Typical loose bulk density for Portland cement (1150 kg/m³)",
          reasonAr: "قيمة معيارية تستخدم لتقدير أحجام الصوامع وتعيين نسب التخزين.",
          reasonEn: "Standard parameter for silo volume estimation and bulk storage.",
          suggestedValue
        };
      }
      if (propertyKey === "blaineFineness") {
        return {
          canAutoComplete: true,
          sourceAr: "نعومة بلين القياسية للإسمنت البورتلاندي (3450 cm²/g)",
          sourceEn: "Standard Blaine specific surface area (3450 cm²/g)",
          reasonAr: "مؤشر لسرعة إماهة حبيبات الإسمنت واكتساب المقاومة الميكانيكية المبكرة.",
          reasonEn: "Measure of hydration kinetics and early structural compressive strength gain.",
          suggestedValue
        };
      }
      if (propertyKey === "initialSettingTime") {
        return {
          canAutoComplete: true,
          sourceAr: "زمن الشك الابتدائي القياسي حسب المواصفة (135 دقيقة)",
          sourceEn: "Standard initial setting time per EN 197-1 (135 min)",
          reasonAr: "يحدد نافذة تشغيل الخرسانة وصبتها قبل بدء التصلب.",
          reasonEn: "Determines workability retention window before onset of stiffening.",
          suggestedValue
        };
      }
    }

    if (role === "sand") {
      if (propertyKey === "density") {
        return {
          canAutoComplete: true,
          sourceAr: "الكثافة الحقيقية القياسية لرمل الخرسانة السيليسي/الكلسي (2650 kg/m³)",
          sourceEn: "Standard particle density for concrete sand (2650 kg/m³)",
          reasonAr: "ضرورية لحساب الحجم المطلق للرمل في المتر المكعب من الخرسانة.",
          reasonEn: "Essential for accurate absolute volume summation per cubic meter.",
          suggestedValue
        };
      }
      if (propertyKey === "finenessModulus") {
        return {
          canAutoComplete: true,
          sourceAr: "معامل النعومة المرجعي المثالي لطريقة درو-غوريس (2.6)",
          sourceEn: "Reference fineness modulus for Dreux-Gorisse method (2.6)",
          reasonAr: "يحدد موضع نقطة الانعطاف ونسبة الرمل إلى الحصى (S/G) على المنحنى النموذجي.",
          reasonEn: "Locates the inflection point and sand-to-gravel ratio on the Dreux grading curve.",
          suggestedValue
        };
      }
      if (propertyKey === "SandEquivalent") {
        return {
          canAutoComplete: true,
          sourceAr: "المكافئ الرملي المرجعي لخرسانة إنشائية نظيفة (82%)",
          sourceEn: "Reference sand equivalent for structural concrete (82%)",
          reasonAr: "يقيس نظافة الرمل وخلوه من الغضار والشحوم الطينية الضارة بالمقاومة.",
          reasonEn: "Indicates sand cleanliness and freedom from deleterious clay fines.",
          suggestedValue
        };
      }
      if (propertyKey === "absorption") {
        return {
          canAutoComplete: true,
          sourceAr: "نسبة الامتصاص المائي القياسية للرمل الطبيعي (1.2%)",
          sourceEn: "Standard water absorption for natural siliceous sand (1.2%)",
          reasonAr: "مطلوبة لحساب الماء الفعال وتصحيح ماء الخلطة الخرسانية.",
          reasonEn: "Required for effective water calculation and batch water adjustments.",
          suggestedValue
        };
      }
      if (propertyKey === "bulkDensity") {
        return {
          canAutoComplete: true,
          sourceAr: "الكثافة الظاهرية المرجعية لرمل البناء (1550 kg/m³)",
          sourceEn: "Standard bulk density for construction sand (1550 kg/m³)",
          reasonAr: "تفيد في تقدير نسبة الفراغات بين الحبيبات.",
          reasonEn: "Useful for void ratio and particle packing calculations.",
          suggestedValue
        };
      }
      if (propertyKey === "finesContent") {
        return {
          canAutoComplete: true,
          sourceAr: "نسبة المواد الناعمة المرجعية المارة من منخل 0.08 مم (3.5%)",
          sourceEn: "Reference fines content passing 0.08mm sieve (3.5%)",
          reasonAr: "تؤثر على تماسك الخلطة وقوام الخرسانة واستهلاك ماء الخلط.",
          reasonEn: "Influences paste cohesiveness and plastic viscosity.",
          suggestedValue
        };
      }
    }

    if (role === "gravel") {
      if (propertyKey === "density") {
        return {
          canAutoComplete: true,
          sourceAr: "الكثافة الحقيقية المرجعية للركام الخشن الكلسي/الغرانيتي (2680 kg/m³)",
          sourceEn: "Standard particle density for coarse aggregate (2680 kg/m³)",
          reasonAr: "ضرورية لحساب الحجم المطلق للركام الخشن ووزنه في الخلطة.",
          reasonEn: "Crucial for calculating coarse aggregate volume fraction in mix.",
          suggestedValue
        };
      }
      if (propertyKey === "dMax") {
        return {
          canAutoComplete: true,
          sourceAr: "المقاس الأقصى للركام Dmax (مستخلص من الكسر الحبيبي للمادة)",
          sourceEn: "Maximum aggregate size Dmax (derived from grading fraction)",
          reasonAr: "المعامل المحوري لتحديد نقطة الانعطاف ومعامل درو K ومعامل الصقل.",
          reasonEn: "Key parameter governing Dreux inflection point and coefficient K.",
          suggestedValue
        };
      }
      if (propertyKey === "dMin") {
        return {
          canAutoComplete: true,
          sourceAr: "المقاس الأدنى للركام d (مستخلص من الكسر الحبيبي للمادة)",
          sourceEn: "Minimum aggregate size d (derived from grading fraction)",
          reasonAr: "يحدد الحد الأدنى للفئة الحبيبية للحصى وانسجام التدرج.",
          reasonEn: "Specifies aggregate lower fraction boundary for grading harmony.",
          suggestedValue
        };
      }
      if (propertyKey === "absorption") {
        return {
          canAutoComplete: true,
          sourceAr: "نسبة الامتصاص المرجعية للركام الخشن السليم (0.8%)",
          sourceEn: "Reference water absorption for sound coarse aggregate (0.8%)",
          reasonAr: "لازمة لحساب الماء الممتص والماء الفعال المؤثر في الإماهة.",
          reasonEn: "Necessary for effective water determination in mix hydration.",
          suggestedValue
        };
      }
      if (propertyKey === "LosAngeles") {
        return {
          canAutoComplete: true,
          sourceAr: "معامل لوس أنجلوس للتآكل المرجعي للحصى الإنشائي (22%)",
          sourceEn: "Reference Los Angeles abrasion resistance (22%)",
          reasonAr: "يقيس المقاومة الميكانيكية للركام ضد التفتت والتآكل والصدم.",
          reasonEn: "Assesses aggregate mechanical toughness against impact and abrasion.",
          suggestedValue
        };
      }
      if (propertyKey === "flakinessIndex") {
        return {
          canAutoComplete: true,
          sourceAr: "معامل التفرطح المرجعي للركام المكسر المنتظم (12%)",
          sourceEn: "Reference flakiness index for cubic crushed aggregate (12%)",
          reasonAr: "يحدد جودة شكل الحبيبات وتأثيرها على قابلية التشغيل وقوة التماسك.",
          reasonEn: "Evaluates aggregate particle shape and workability impact.",
          suggestedValue
        };
      }
      if (propertyKey === "bulkDensity") {
        return {
          canAutoComplete: true,
          sourceAr: "الكثافة الظاهرية السائبة المرجعية للحصى (1450 kg/m³)",
          sourceEn: "Reference bulk density for coarse gravel (1450 kg/m³)",
          reasonAr: "تفيد في حساب الفراغات البينية وتعبئة الركام في القوالب.",
          reasonEn: "Used in intergranular void estimation and aggregate packing.",
          suggestedValue
        };
      }
    }

    if (role === "water") {
      return {
        canAutoComplete: true,
        sourceAr: "المواصفة القياسية لمياه خلط الخرسانة (الكثافة 1000 kg/m³، pH 7.2)",
        sourceEn: "Standard specifications for concrete mixing water",
        reasonAr: "ثوابت فيزيائية وكيميائية معتمدة لمياه الشرب والخلط النظيفة.",
        reasonEn: "Physical and chemical standard constants for potable mixing water.",
        suggestedValue
      };
    }

    if (role === "admixture") {
      return {
        canAutoComplete: true,
        sourceAr: "النشرة الفنية TDS النموذجية للمضافات الكيميائية الخرسانية",
        sourceEn: "Standard Technical Data Sheet (TDS) parameters for concrete admixtures",
        reasonAr: "قيم معيارية للملدنات الفائقة المعتمدة لتقليل ماء الخلط وزيادة المقاومة.",
        reasonEn: "Standard values for superplasticizers optimizing water reduction.",
        suggestedValue
      };
    }

    // Default fallback
    return {
      canAutoComplete: true,
      sourceAr: "قواعد البيانات والمعايير الهندسية المعتمدة في SnoLab",
      sourceEn: "Approved engineering rules and standards in SnoLab",
      reasonAr: "خاصية هندسية مطلوبة لحسابات الخلطة الخرسانية وفق المواصفات.",
      reasonEn: "Engineering parameter required for concrete mix calculation.",
      suggestedValue
    };
  }
  /**
   * Evaluates if a given value is physically meaningful (0 is valid!).
   */
  public static hasMeaningfulValue(val: any): boolean {
    if (val === 0) return true; // 0 is a strictly valid engineering number!
    if (val === false) return true;
    if (val === null || val === undefined) return false;
    if (typeof val === "string") {
      const trimmed = val.trim();
      return trimmed !== "" && trimmed !== "—" && trimmed !== "-" && trimmed.toUpperCase() !== "NULL";
    }
    if (typeof val === "number") {
      return !isNaN(val) && isFinite(val);
    }
    return true;
  }

  /**
   * Resolves the current raw value of a property from an EngineeringMaterial.
   */
  public static getMaterialValue(mat: EngineeringMaterial, key: string): any {
    if (!mat) return undefined;
    
    // 1. Direct property check (preserving empty strings so they register as EMPTY)
    if (key in mat) {
      const directVal = (mat as any)[key];
      if (directVal !== undefined && directVal !== null) {
        return directVal;
      }
    }
    if (mat.engineeringData && key in mat.engineeringData) {
      const val = mat.engineeringData[key];
      if (val !== undefined && val !== null) {
        return val;
      }
    }
    if (mat.extraProperties && key in mat.extraProperties) {
      const val = mat.extraProperties[key];
      if (val !== undefined && val !== null) {
        return val;
      }
    }

    // Key aliases
    if (key === "density" && CompletenessChecker.hasMeaningfulValue((mat as any).specificGravity)) {
      // Density from specific gravity: if sg is around 2.65, density is 2650
      const sg = (mat as any).specificGravity;
      if (typeof sg === "number" && sg > 0 && sg < 10) return sg * 1000;
    }
    if (key === "specificGravity" && CompletenessChecker.hasMeaningfulValue((mat as any).density)) {
      const d = (mat as any).density;
      if (typeof d === "number" && d > 100) return +(d / 1000).toFixed(3);
    }
    if (key === "strength28d") {
      if (CompletenessChecker.hasMeaningfulValue((mat as any).standardStrength)) {
        return (mat as any).standardStrength;
      }
      if (typeof (mat as any).standardClass === "string") {
        const match = (mat as any).standardClass.match(/\d+(\.\d+)?/);
        if (match) return parseFloat(match[0]);
      }
    }
    if (key === "recommendedDosage") {
      const d = (mat as any).recommendedDosage ?? (mat as any).dosagePercent ?? (mat as any).dosage;
      if (CompletenessChecker.hasMeaningfulValue(d)) return d;
    }
    if (key === "waterReduction") {
      const wr = (mat as any).waterReduction ?? (mat as any).waterReductionRatio ?? (mat as any).waterReductionPercent;
      if (CompletenessChecker.hasMeaningfulValue(wr)) return wr;
    }

    return undefined;
  }

  /**
   * Validates a numerical property against absolute physical bounds.
   */
  public static validateNumericProperty(
    val: any,
    min?: number,
    max?: number,
    warningMin?: number,
    warningMax?: number,
    allowZero: boolean = false
  ): { isValid: boolean; status: PropertyMissingReason; messageAr?: string; messageEn?: string } {
    if (!CompletenessChecker.hasMeaningfulValue(val)) {
      return {
        isValid: false,
        status: val === "" || val === " " ? "EMPTY" : "MISSING",
        messageAr: "القيمة مفقودة",
        messageEn: "Value is missing"
      };
    }

    const num = typeof val === "number" ? val : parseFloat(String(val).replace(",", "."));
    if (isNaN(num) || !isFinite(num)) {
      return {
        isValid: false,
        status: "INVALID",
        messageAr: "القيمة المدخلة ليست رقماً صالحاً",
        messageEn: "Value is not a valid number"
      };
    }

    if (!allowZero && num === 0) {
      return {
        isValid: false,
        status: "INVALID",
        messageAr: "لا يمكن أن تكون القيمة مساوية للصفر هندسياً",
        messageEn: "Value cannot be zero"
      };
    }

    if (min !== undefined && num < min) {
      const isNeg = num < 0;
      return {
        isValid: false,
        status: "INVALID",
        messageAr: isNeg 
          ? `القيمة (${num}) سالبة وغير مقبولة، وأقل من الحد الأدنى المقبول فيزيائياً (${min})` 
          : `القيمة (${num}) أقل من الحد الأدنى المقبول فيزيائياً (${min})`,
        messageEn: isNeg
          ? `Value (${num}) is negative and below physical minimum (${min})`
          : `Value (${num}) is below physical minimum (${min})`
      };
    }

    if (max !== undefined && num > max) {
      return {
        isValid: false,
        status: "INVALID",
        messageAr: `القيمة (${num}) تتجاوز الحد الأقصى المقبول فيزيائياً (${max})`,
        messageEn: `Value (${num}) exceeds physical maximum (${max})`
      };
    }

    if (warningMin !== undefined && num < warningMin) {
      return {
        isValid: true,
        status: "NEEDS_REVIEW",
        messageAr: `قيمة غير معتادة (${num}): النطاق الهندسي الشائع يبدأ من (${warningMin})`,
        messageEn: `Unusual value (${num}): Typical range starts at (${warningMin})`
      };
    }

    if (warningMax !== undefined && num > warningMax) {
      return {
        isValid: true,
        status: "NEEDS_REVIEW",
        messageAr: `قيمة غير معتادة (${num}): النطاق الهندسي الشائع ينتهي عند (${warningMax})`,
        messageEn: `Unusual value (${num}): Typical range ends at (${warningMax})`
      };
    }

    return {
      isValid: true,
      status: "VALID"
    };
  }

  /**
   * Inspects a single material comprehensively.
   */
  public static inspectMaterial(
    material: EngineeringMaterial,
    calculationMethod: string = "dreux"
  ): MaterialCompletenessAudit {
    const role = normalizeMaterialRole(material.category || material.type || "");
    const isSystem = 
      material.isSystem === true || 
      material.source === "system" || 
      (material as any).sourceType === "system_demo" ||
      material.materialSource === "system";

    const calculationBlockers: string[] = [];
    const properties: PropertyInspectionItem[] = [];

    // Helper to add property inspection
    const inspectProp = (
      key: string,
      propertyId: string,
      nameAr: string,
      nameEn: string,
      nameFr: string,
      unit: string,
      priority: PropertyPriority,
      explanationAr: string,
      explanationEn: string,
      min?: number,
      max?: number,
      warningMin?: number,
      warningMax?: number,
      allowZero: boolean = false
    ) => {
      const rawVal = CompletenessChecker.getMaterialValue(material, key);
      const isReqDreux = priority === "DREUX_REQUIRED";
      const isReqCat = priority === "CATEGORY_REQUIRED" || isReqDreux;

      // Check metadata for low confidence or OCR notes
      const meta: any = material.propertyMetadata?.[key];
      const hasConfidenceIssue = meta && (meta.confidence === "Low" || meta.confidence === "Medium");
      const hasOCRNote = meta && (meta.sourceType === "imported" || meta.notes?.toLowerCase()?.includes("ocr") || meta.sourceLabel?.includes("OCR"));

      let status: PropertyMissingReason = "VALID";
      let valError: string | undefined;

      if (!CompletenessChecker.hasMeaningfulValue(rawVal)) {
        const hasKey = CompletenessChecker.hasPropertyKey(material, key) || (typeof rawVal === "string" && rawVal.trim() === "");
        status = hasKey ? "EMPTY" : "MISSING";
        if (isReqDreux) {
          calculationBlockers.push(`${nameAr} (${unit}) مطلوبة لحسابات طريقة درو-غوريس`);
        }
      } else {
        const valRes = CompletenessChecker.validateNumericProperty(
          rawVal,
          min,
          max,
          warningMin,
          warningMax,
          allowZero
        );
        if (!valRes.isValid) {
          status = "INVALID";
          valError = valRes.messageAr;
          if (isReqDreux) {
            calculationBlockers.push(`${nameAr}: ${valRes.messageAr}`);
          }
        } else if (valRes.status === "NEEDS_REVIEW" || hasConfidenceIssue || hasOCRNote) {
          status = "NEEDS_REVIEW";
          valError = valRes.messageAr || "قيمة مستخلصة تحتاج إلى مراجعة وتأكيد من المهندس";
        }
      }

      const sourceInfo = CompletenessChecker.getPropertySourceInfo(material, key, role);
      const suggestedValue = (status === "INVALID" || status === "NEEDS_REVIEW")
        ? (meta?.detectedValue ?? sourceInfo.suggestedValue)
        : sourceInfo.suggestedValue;

      properties.push({
        key,
        propertyId,
        nameAr,
        nameEn,
        nameFr,
        unit,
        expectedType: "number",
        priority,
        isRequiredForCalculation: isReqDreux,
        isRequiredForCategory: isReqCat,
        status,
        currentValue: rawVal,
        currentValueDisplay: CompletenessChecker.hasMeaningfulValue(rawVal) ? `${rawVal} ${unit}`.trim() : "—",
        detectedValue: meta?.detectedValue,
        confidence: meta?.confidence as any,
        requiresConfirmation: status === "NEEDS_REVIEW",
        validationError: valError,
        min,
        max,
        warningMin,
        warningMax,
        explanationAr,
        explanationEn,
        canAutoComplete: sourceInfo.canAutoComplete,
        sourceAr: sourceInfo.sourceAr,
        sourceEn: sourceInfo.sourceEn,
        reasonAr: sourceInfo.reasonAr,
        reasonEn: sourceInfo.reasonEn,
        suggestedValue
      });
    };

    // ==========================================
    // 1. SPECIFIC PROFILES BY ROLE
    // ==========================================
    const specs = CompletenessChecker.getAvailablePropertiesForRole(role, calculationMethod);
    for (const spec of specs) {
      inspectProp(
        spec.key,
        spec.propertyId,
        spec.nameAr,
        spec.nameEn,
        spec.nameFr,
        spec.unit,
        spec.priority,
        spec.explanationAr,
        spec.explanationEn,
        spec.min,
        spec.max,
        spec.warningMin,
        spec.warningMax,
        spec.allowZero
      );
    }

    // Partition properties
    const dreuxProperties = properties.filter(p => p.priority === "DREUX_REQUIRED");
    const categoryProperties = properties.filter(p => p.priority === "CATEGORY_REQUIRED");
    const optionalProperties = properties.filter(p => p.priority === "OPTIONAL");

    const missingDreuxCount = dreuxProperties.filter(p => p.status === "MISSING" || p.status === "EMPTY").length;
    const missingCategoryCount = categoryProperties.filter(p => p.status === "MISSING" || p.status === "EMPTY").length;
    const missingOptionalCount = optionalProperties.filter(p => p.status === "MISSING" || p.status === "EMPTY").length;

    const invalidCount = properties.filter(p => p.status === "INVALID").length;
    const needsReviewCount = properties.filter(p => p.status === "NEEDS_REVIEW").length;
    const completedCount = properties.filter(p => p.status === "VALID").length;

    const totalPropertiesCount = properties.length;
    const completenessScore = totalPropertiesCount > 0 
      ? Math.round((completedCount / totalPropertiesCount) * 100) 
      : 100;

    const isEligibleForDreuxGorisse = missingDreuxCount === 0 && invalidCount === 0;

    let overallStatus: CompletenessStatus = "READY";
    if (invalidCount > 0) {
      overallStatus = "INVALID";
    } else if (missingDreuxCount > 0 || missingCategoryCount > 0) {
      overallStatus = "INCOMPLETE";
    } else if (needsReviewCount > 0) {
      overallStatus = "NEEDS_REVIEW";
    }

    const unresolvedProperties = properties.filter(p => p.status !== "VALID");

    return {
      materialId: material.id,
      materialName: material.name || material.ArabicName || "مادة غير معنونة",
      englishName: material.englishName || material.EnglishName,
      category: material.category || material.type || "عام",
      role,
      isSystem,
      provenance: material.provenance || (isSystem ? "النظام" : "المستخدم"),
      overallStatus,
      requiresAttention: overallStatus !== "READY",
      isEligibleForDreuxGorisse,
      completenessScore,
      totalPropertiesCount,
      completedCount,
      missingDreuxCount,
      missingCategoryCount,
      missingOptionalCount,
      needsReviewCount,
      invalidCount,
      properties,
      dreuxProperties,
      categoryProperties,
      optionalProperties,
      unresolvedProperties,
      calculationBlockers
    };
  }

  /**
   * Inspects an entire list of materials (e.g. post-import or the user's whole library).
   */
  public static inspectLibrary(
    materials: EngineeringMaterial[],
    calculationMethod: string = "dreux"
  ): LibraryCompletenessReport {
    const inspected = materials.map(m => CompletenessChecker.inspectMaterial(m, calculationMethod));

    const readyCount = inspected.filter(m => m.overallStatus === "READY").length;
    const incompleteCount = inspected.filter(m => m.overallStatus === "INCOMPLETE").length;
    const needsReviewCount = inspected.filter(m => m.overallStatus === "NEEDS_REVIEW").length;
    const invalidCount = inspected.filter(m => m.overallStatus === "INVALID").length;

    const materialsRequiringAttention = inspected.filter(m => m.overallStatus !== "READY");

    return {
      totalInspected: materials.length,
      readyCount,
      incompleteCount,
      needsReviewCount,
      invalidCount,
      requiresAttentionCount: materialsRequiringAttention.length,
      materials: inspected,
      materialsRequiringAttention
    };
  }
}
