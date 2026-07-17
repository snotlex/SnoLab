/**
 * centralized Dreux-Gorisse Engineering Knowledge Base
 * Defines all equations, lookup tables, concrete categories, validation rules,
 * recommendations, assumptions, and unit definitions for the Georges Dreux-Gorisse method.
 */

export interface EngineeringEquation {
  id: string;
  nameAr: string;
  nameEn: string;
  formula: string;
  latex: string;
  description: string;
}

export interface LookupTable {
  id: string;
  nameAr: string;
  nameEn: string;
  description: string;
  data: any;
}

export interface ConcreteCategoryConfig {
  code: string;
  nameAr: string;
  nameEn: string;
  nameFr: string;
  descriptionAr: string;
  descriptionEn: string;
  compatibleMaterials: string[];
  requiredMaterials: string[];
  forbiddenMaterials: string[];
  requiredProperties: string[];
  recommendedSlumpMin: number; // cm
  recommendedSlumpMax: number; // cm
  recommendedDmaxMin: number;  // mm
  recommendedDmaxMax: number;  // mm
  maxWcRatio: number;
  minCementContent: number;     // kg/m3
  maxCementContent: number;     // kg/m3
  exposureConditions: string[];
  durabilityRequirements: string;
  specialNotesAr: string;
  specialNotesEn: string;
  validationRules: Array<{
    id: string;
    paramName: string;
    arabicName: string;
    requirement: string;
    evaluate: (inputs: any, results: any) => {
      status: "compliant" | "warning" | "non_compliant";
      actual: string;
      note: string;
      recommendation?: string;
    };
  }>;
}

export interface DreuxKnowledgeBase {
  equations: Record<string, EngineeringEquation>;
  lookupTables: {
    standardDeviation: LookupTable;
    dreuxAggregateFactorG: LookupTable;
    baseWaterDemand: LookupTable;
    slumpCorrectionFactor: LookupTable;
    compactnessGamma0: LookupTable;
    slumpCompacityAdjustment: LookupTable;
    shapeCompacityAdjustment: LookupTable;
    baseGranularConstantK0: LookupTable;
    scmDefaultDensities: LookupTable;
  };
  validationLimits: {
    absoluteVolumeToleranceL: number;
    maxSuperplasticizerDosagePercent: number;
    minBinderContentKgM3: number;
    cementDensityDefaultKgM3: number;
    waterPHRange: { min: number; max: number };
    maxWaterChloridePpm: number;
    maxWaterSulphatePpm: number;
    highFiberDosageThresholdKgM3: number;
  };
  unitDefinitions: Record<string, { symbol: string; nameAr: string; nameEn: string }>;
  engineeringAssumptions: string[];
  concreteCategories: Record<string, ConcreteCategoryConfig>;
}

export const DREUX_KNOWLEDGE_BASE: DreuxKnowledgeBase = {
  equations: {
    targetStrength: {
      id: "target_strength",
      nameAr: "حساب المقاومة المتوسطة المستهدفة",
      nameEn: "Target Mean Strength Equation",
      formula: "fcm28 = fck28 + 1.64 * sigma",
      latex: "f_{cm28} = f_{ck28} + 1.64 \\times \\sigma",
      description: "حساب المقاومة المتوسطة المستهدفة بعمر 28 يوماً بناءً على المقاومة المميزة المطلوبة والانحراف المعياري لرقابة الموقع."
    },
    cementStrengthApproximation: {
      id: "cement_strength_approx",
      nameAr: "مقاومة الإسمنت الفعلية التقريبية",
      nameEn: "Cement Strength Approximation",
      formula: "fce = cementClassStrength * 1.1",
      latex: "f_{ce} = 1.1 \\times f_{cem}",
      description: "تقدير المقاومة الحقيقية للإسمنت بعمر 28 يوماً بناءً على رتبته الاسمية لتعويض كفاءة التصلد الفعلية."
    },
    waterCementRatio: {
      id: "water_cement_ratio",
      nameAr: "علاقة بولومي لنسبة الماء إلى الإسمنت",
      nameEn: "Bolomey W/C Relationship",
      formula: "C/W = (fcm28 / (G * fce)) + 0.5",
      latex: "\\frac{C}{W} = \\frac{f_{cm28}}{G \\times f_{ce}} + 0.5",
      description: "معادلة بولومي/دروكس لحساب النسبة الحجمية والوزنية بين الماء والإسمنت لضمان تحقيق المقاومة المستهدفة."
    },
    pivotPointY: {
      id: "pivot_point_y",
      nameAr: "إحداثي نقطة الانعطاف العمودية للمنحنى الحبيبي",
      nameEn: "Pivot Point Y Coordinate Equation",
      formula: "Y = 50 - sqrt(Dmax) + K - (packingDelta * 40)",
      latex: "Y = 50 - \\sqrt{D_{max}} + K - 40 \\times \\Delta\\gamma",
      description: "تحديد نسبة المار المطلوبة عند منخل الفرز الأوسط (نقطة الانعطاف) مع تعديلها تبعاً للرص والدمك ومعامل K."
    },
    moistureAdjustment: {
      id: "moisture_adjustment",
      nameAr: "تصحيح أوزان الركام للرطوبة الحقلية",
      nameEn: "Moisture Adaptation Equation",
      formula: "W_wet = W_dry * (1 + moisturePercent / 100)",
      latex: "W_{wet} = W_{dry} \\times (1 + \\frac{w}{100})",
      description: "حساب الوزن الرطب للركام لضمان وزن المادة الصلبة المطلوبة بالخلطة."
    },
    freeWaterCorrection: {
      id: "free_water_correction",
      nameAr: "تصحيح ماء الخلط الفعلي بالخلاطة",
      nameEn: "Field Batch Water Equation",
      formula: "W_batch = W_effective - Total_Free_Surface_Water + Total_Absorption_Deficit",
      latex: "W_{batch} = W_{eff} - \\sum W_{dry}\\frac{w - Abs}{100}",
      description: "حساب كمية الماء الصافي الإضافي الواجب ضخه بالخلاطة بعد إدخال رطوبة وامتصاص الركامات الإجمالية لضمان دقة W/C."
    }
  },

  lookupTables: {
    standardDeviation: {
      id: "std_dev_table",
      nameAr: "الانحراف المعياري حسب جودة الرقابة",
      nameEn: "Standard Deviation by Quality Control",
      description: "تحديد قيمة الانحراف المعياري للخرسانة (ميغاباسكال) بناءً على مستوى الرقابة الفنية بالمشروع.",
      data: {
        high: 4.0,
        normal: 6.0,
        low: 8.0
      }
    },
    dreuxAggregateFactorG: {
      id: "dreux_g_factor",
      nameAr: "معامل دروكس الحبيبي للركام (G)",
      nameEn: "Georges Dreux Parameter G Table",
      description: "تحديد المعامل G بناءً على نوع الركام (طبيعي مستدير أو مكسر)، القطر الأقصى Dmax، وصنف جودة الركام.",
      data: {
        rounded: {
          small: { limit: 12.5, excellent: 0.45, standard: 0.40, poor: 0.35 },
          medium: { limit: 25.0, excellent: 0.55, standard: 0.50, poor: 0.40 },
          large: { limit: 999.0, excellent: 0.60, standard: 0.55, poor: 0.45 }
        },
        crushed: {
          small: { limit: 12.5, excellent: 0.40, standard: 0.35, poor: 0.30 },
          medium: { limit: 25.0, excellent: 0.50, standard: 0.45, poor: 0.35 },
          large: { limit: 999.0, excellent: 0.55, standard: 0.50, poor: 0.40 }
        }
      }
    },
    baseWaterDemand: {
      id: "base_water_demand",
      nameAr: "محتوى المياه الأساسي حسب القطر الأقصى لركام (W0)",
      nameEn: "Base Water Demand by Dmax Table",
      description: "كمية مياه التصميم الأساسية (لتر/م³) اللازمة لترطيب طن خرساني بقطر أقصى محدد.",
      data: [
        { dMaxLimit: 5, water: 300 },
        { dMaxLimit: 8, water: 265 },
        { dMaxLimit: 12.5, water: 230 },
        { dMaxLimit: 16, water: 215 },
        { dMaxLimit: 20, water: 200 },
        { dMaxLimit: 25, water: 190 },
        { dMaxLimit: 31.5, water: 185 },
        { dMaxLimit: 40, water: 175 },
        { dMaxLimit: 50, water: 165 },
        { dMaxLimit: 63, water: 155 },
        { dMaxLimit: 80, water: 145 },
        { dMaxLimit: 999, water: 140 }
      ]
    },
    slumpCorrectionFactor: {
      id: "slump_correction_factor",
      nameAr: "معامل تصحيح المياه حسب الهبوط المستهدف",
      nameEn: "Slump Water Correction Table",
      description: "معامل ضرب تصحيحي لكمية المياه يعتمد على قوام الخرسانة المستهدف وهبوطها بالسنتيمتر.",
      data: [
        { slumpLimit: 2, factor: 0.95 },
        { slumpLimit: 5, factor: 0.97 },
        { slumpLimit: 9, factor: 1.0 },
        { slumpLimit: 15, factor: 1.05 },
        { slumpLimit: 999, factor: 1.10 }
      ]
    },
    compactnessGamma0: {
      id: "compactness_gamma0",
      nameAr: "معامل الارتصاص المرجعي (Gamma 0)",
      nameEn: "Reference Compactness Factor (Gamma 0) Table",
      description: "معامل الارتصاص الحجمي النموذجي بناءً على القطر الأقصى للركام Dmax.",
      data: [
        { dMaxLimit: 5, gamma: 0.745 },
        { dMaxLimit: 8, gamma: 0.765 },
        { dMaxLimit: 12.5, gamma: 0.780 },
        { dMaxLimit: 16, gamma: 0.790 },
        { dMaxLimit: 20, gamma: 0.800 },
        { dMaxLimit: 25, gamma: 0.810 },
        { dMaxLimit: 31.5, gamma: 0.820 },
        { dMaxLimit: 40, gamma: 0.830 },
        { dMaxLimit: 50, gamma: 0.835 },
        { dMaxLimit: 63, gamma: 0.840 },
        { dMaxLimit: 999, gamma: 0.850 }
      ]
    },
    slumpCompacityAdjustment: {
      id: "slump_compacity_adj",
      nameAr: "تعديل معامل الارتصاص حسب الهبوط",
      nameEn: "Slump Compactness Adjustment Table",
      description: "قيمة التصحيح الجبري لمعامل الارتصاص تبعاً لسيولة وقوام المزيج الخرساني.",
      data: [
        { slumpLimit: 2, adjustment: 0.02 },
        { slumpLimit: 5, adjustment: 0.01 },
        { slumpLimit: 9, adjustment: 0.0 },
        { slumpLimit: 15, adjustment: -0.01 },
        { slumpLimit: 999, adjustment: -0.02 }
      ]
    },
    shapeCompacityAdjustment: {
      id: "shape_compacity_adj",
      nameAr: "تعديل معامل الارتصاص حسب شكل الحبيبات",
      nameEn: "Shape Compactness Adjustment Table",
      description: "تعديل معامل الارتصاص بناءً على شكل الركام لمنع الاحتكاك الداخلي للحبيبات المكسرة.",
      data: {
        rounded: 0.0,
        crushed: -0.01
      }
    },
    baseGranularConstantK0: {
      id: "base_k0_constant",
      nameAr: "معامل التماسك الحبيبي الأساسي (K0)",
      nameEn: "Base Granular Constant (K0) Table",
      description: "قيمة ثابتة أساسية تحدد موضع منخفض الانعطاف تبعاً لقطر الركام الكلي وشكله لمنع الفراغات.",
      data: {
        rounded: [
          { dMaxLimit: 8, k: -4 },
          { dMaxLimit: 12.5, k: -3 },
          { dMaxLimit: 16, k: -2 },
          { dMaxLimit: 20, k: -1 },
          { dMaxLimit: 31.5, k: 0 },
          { dMaxLimit: 40, k: 1 },
          { dMaxLimit: 50, k: 2 },
          { dMaxLimit: 63, k: 3 },
          { dMaxLimit: 999, k: 4 }
        ],
        crushed: [
          { dMaxLimit: 8, k: 0 },
          { dMaxLimit: 12.5, k: 1 },
          { dMaxLimit: 16, k: 2 },
          { dMaxLimit: 20, k: 3 },
          { dMaxLimit: 31.5, k: 4 },
          { dMaxLimit: 40, k: 5 },
          { dMaxLimit: 50, k: 6 },
          { dMaxLimit: 63, k: 7 },
          { dMaxLimit: 999, k: 8 }
        ]
      }
    },
    scmDefaultDensities: {
      id: "scm_default_densities",
      nameAr: "الكثافات الافتراضية للمكونات الإسمنتية البديلة",
      nameEn: "SCM Default Densities Table",
      description: "الوزن النوعي والكثافات القياسية لغبار السيليكا والرماد والخبث (كجم/م³).",
      data: {
        silicaFume: 2200,
        flyAsh: 2200,
        slag: 2900
      }
    }
  },

  validationLimits: {
    absoluteVolumeToleranceL: 10,
    maxSuperplasticizerDosagePercent: 5.0,
    minBinderContentKgM3: 250,
    cementDensityDefaultKgM3: 3105,
    waterPHRange: { min: 6.0, max: 8.5 },
    maxWaterChloridePpm: 500,
    maxWaterSulphatePpm: 2000,
    highFiberDosageThresholdKgM3: 30
  },

  unitDefinitions: {
    strength: { symbol: "MPa", nameAr: "ميغاباسكال", nameEn: "Megapascals" },
    density: { symbol: "kg/m³", nameAr: "كيلوغرام لكل متر مكعب", nameEn: "Kilograms per cubic meter" },
    weight: { symbol: "kg", nameAr: "كيلوغرام", nameEn: "Kilograms" },
    volume: { symbol: "L", nameAr: "لتر", nameEn: "Liters" },
    sieveSize: { symbol: "mm", nameAr: "ميليمتر", nameEn: "Millimeters" },
    dosage: { symbol: "%", nameAr: "نسبة مئوية", nameEn: "Percentage" },
    slump: { symbol: "cm", nameAr: "سنتيمتر", nameEn: "Centimeters" }
  },

  engineeringAssumptions: [
    "يتم حساب الكثافات والأحجام بناءً على مبدأ استقرار الحجم المطلق التام لإنتاج متر مكعب واحد من الخرسانة المتراصة (1000 لتر).",
    "تعتمد فعالية الملدنات المائية على نسبة خفض الماء المدخلة بالمستودع أو القيمة الافتراضية للمعادلات التجريبية لدروكس.",
    "يفترض ترطيب الركامات الطبيعية بالكامل لتبلغ مستوى مشبع وجاف السطح (SSD) قبل الصب لضمان تماسك نسبة W/C.",
    "يعتمد توزيع تدرج الحبيبات على كسر الفراغات الأقصى باستخدام منحنيين متمايزين يلتقيان عند النقطة المحورية Pivot Point."
  ],

  concreteCategories: {
    NSC: {
      code: "NSC",
      nameAr: "الخرسانة عادية المقاومة (NSC)",
      nameEn: "Normal Strength Concrete",
      nameFr: "Béton de Résistance Ordinaire",
      descriptionAr: "الخرسانة التقليدية المستخدمة في العناصر الإنشائية العادية التي لا تتعرض لإجهادات ميكانيكية أو بيئية حرجة.",
      descriptionEn: "Standard conventional concrete used for common structural elements without critical mechanical exposure.",
      compatibleMaterials: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية"],
      requiredMaterials: ["إسمنت", "رمال", "حصى", "ماء"],
      forbiddenMaterials: ["ألياف", "إضافات معدنية", "ركام خفيف", "ركام ثقيل", "مجلدات خاصة"],
      requiredProperties: ["density", "absorption", "moisture"],
      recommendedSlumpMin: 5,
      recommendedSlumpMax: 9,
      recommendedDmaxMin: 12.5,
      recommendedDmaxMax: 25.0,
      maxWcRatio: 0.60,
      minCementContent: 280,
      maxCementContent: 380,
      exposureConditions: ["X0", "XC1"],
      durabilityRequirements: "الحد الأدنى لمحتوى الإسمنت 280 كجم/م³ والحد الأقصى لنسبة الماء للإسمنت 0.60.",
      specialNotesAr: "تجنب محاولة زيادة ماء الخلط بالورشة لمنع حدوث نضح مائي أو تفكك حبيبي يضعف البنية المجهرية للمزيج.",
      specialNotesEn: "Avoid adding redundant water on-site to preserve the concrete structural design and avoid micro-fissure patterns.",
      validationRules: [
        {
          id: "nsc_strength_limit",
          paramName: "strength",
          arabicName: "المقاومة المستهدفة fc28",
          requirement: "fc28 <= 35 MPa",
          evaluate: (inputs, results) => {
            const fck = inputs.fck28 || 25;
            const ok = fck <= 35;
            return {
              status: ok ? "compliant" : "warning",
              actual: `${fck} MPa`,
              note: ok ? "المقاومة مثالية للخرسانة العادية دون الحاجة لمحسنات خاصة." : "المقاومة مرتفعة نسبياً للخرسانة العادية، نوصي بترقية تصنيف الخرسانة إلى HSC.",
              recommendation: ok ? undefined : "يرجى تعديل خيار 'نوع الخرسانة' إلى خرسانة عالية المقاومة (HSC) لتلقي توجيهات تدعيم أفضل."
            };
          }
        },
        {
          id: "nsc_cement_limit",
          paramName: "cement",
          arabicName: "محتوى الإسمنت الكلي",
          requirement: "280 - 380 kg/m³",
          evaluate: (inputs, results) => {
            const cement = results.cementWeight || results.cementKg || 350;
            const ok = cement >= 280 && cement <= 380;
            return {
              status: ok ? "compliant" : "warning",
              actual: `${Math.round(cement)} kg/m³`,
              note: ok ? "محتوى الإسمنت متطابق هندسياً للخرسانة الهيكلية العادية." : "كمية الإسمنت خارج النطاق الاقتصادي العادي للمباني العادية.",
              recommendation: ok ? undefined : "اضبط نسب الخلطة أو اختر فئة خرسانة مطابقة للرتب المطلوبة."
            };
          }
        }
      ]
    },
    RC: {
      code: "RC",
      nameAr: "الخرسانة المسلحة التقليدية (RC)",
      nameEn: "Reinforced Concrete",
      nameFr: "Béton Armé Courant",
      descriptionAr: "خرسانة هيكلية مصممة خصيصاً لصب العناصر المحتوية على قضبان حديد التسليح لحمايتها من التآكل وتأمين نقل إجهادات الشد.",
      descriptionEn: "Structural concrete designed specifically for elements containing reinforcement steel bars to prevent oxidation.",
      compatibleMaterials: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية", "إضافات معدنية"],
      requiredMaterials: ["إسمنت", "رمال", "حصى", "ماء"],
      forbiddenMaterials: ["ركام خفيف", "ركام ثقيل", "مجلدات خاصة"],
      requiredProperties: ["density", "absorption", "moisture"],
      recommendedSlumpMin: 7,
      recommendedSlumpMax: 12,
      recommendedDmaxMin: 16,
      recommendedDmaxMax: 25,
      maxWcRatio: 0.55,
      minCementContent: 300,
      maxCementContent: 400,
      exposureConditions: ["XC1", "XC2", "XC3"],
      durabilityRequirements: "الحد الأدنى لمحتوى الإسمنت 300 كجم/م³ والحد الأقصى لنسبة الماء 0.55 لتجنب تشرب الرطوبة لحديد التسليح.",
      specialNotesAr: "يجب اختيار القطر الأقصى للركام Dmax ليكون متوافقاً مع أصغر مسافة حرة بين قضبان التسليح لمنع التعشيش الحبيبي.",
      specialNotesEn: "Aggregate Dmax must be smaller than the minimum clearance distance between steel bars to prevent voids.",
      validationRules: [
        {
          id: "rc_wc_limit",
          paramName: "wcRatio",
          arabicName: "نسبة الماء إلى الإسمنت W/C",
          requirement: "W/C <= 0.55",
          evaluate: (inputs, results) => {
            const wc = results.wcRatioAdjusted || results.wcRatio || 0.5;
            const ok = wc <= 0.55;
            return {
              status: ok ? "compliant" : "non_compliant",
              actual: `${wc.toFixed(3)}`,
              note: ok ? "نسبة ممتازة لحماية حديد التسليح من الرطوبة." : "خطير جداً! زيادة نسبة الماء تسهل تسرب الرطوبة لحديد التسليح مما يسبب الصدأ والتآكل.",
              recommendation: ok ? undefined : "يرجى تقليل نسبة المياه المستهدفة أو زيادة جرعة الملدن الفائق."
            };
          }
        }
      ]
    },
    HSC: {
      code: "HSC",
      nameAr: "الخرسانة عالية المقاومة (HSC)",
      nameEn: "High Strength Concrete",
      nameFr: "Béton Haute Résistance (BHR)",
      descriptionAr: "خرسانة تمتاز بمقاومة ضغط فائقة تتعدى 40 أو 50 ميغاباسكال لتخفيض أبعاد العناصر الإنشائية للأبراج الشاهقة والجسور الكبرى.",
      descriptionEn: "High strength concrete with target strength exceeding 40 MPa to reduce column cross-sections in high-rises.",
      compatibleMaterials: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية", "إضافات معدنية"],
      requiredMaterials: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية", "إضافات معدنية"],
      forbiddenMaterials: ["ألياف", "ركام خفيف", "ركام ثقيل", "مجلدات خاصة"],
      requiredProperties: ["density", "absorption", "moisture", "strengthClass"],
      recommendedSlumpMin: 12,
      recommendedSlumpMax: 20,
      recommendedDmaxMin: 10,
      recommendedDmaxMax: 16,
      maxWcRatio: 0.35,
      minCementContent: 400,
      maxCementContent: 550,
      exposureConditions: ["XC4", "XD1", "XF1"],
      durabilityRequirements: "تتطلب W/C منخفضاً جداً (<= 0.35) ومحتوى إسمنت مرتفعاً مع ملدن فائق وإضافات سيليكا نشطة نانوية.",
      specialNotesAr: "يجب استخدام ركام بازلتي صلب مكسر حاد الزوايا ومغسول بالكامل لضمان الالتصاق الأقصى للسطح الحبيبي البيني.",
      specialNotesEn: "Highly clean, high-density crushed basalt aggregates must be used to ensure maximal interfacial transition zone strength.",
      validationRules: [
        {
          id: "hsc_strength",
          paramName: "strength",
          arabicName: "المقاومة المستهدفة fc28",
          requirement: "fc28 >= 40 MPa",
          evaluate: (inputs, results) => {
            const fck = inputs.fck28 || 25;
            const ok = fck >= 40;
            return {
              status: ok ? "compliant" : "non_compliant",
              actual: `${fck} MPa`,
              note: ok ? "سليمة، المقاومة تناسب متطلبات الخرسانة المرتفعة التحمل." : "غير كافية، الخرسانة عالية المقاومة هندسياً تتطلب مقاومة ضغط حقيقية لا تقل عن 40 ميغاباسكال.",
              recommendation: ok ? undefined : "يرجى تعديل قيمة المقاومة المستهدفة لتكون أكبر من 40 ميغاباسكال."
            };
          }
        },
        {
          id: "hsc_wc",
          paramName: "wc",
          arabicName: "نسبة الماء إلى الإسمنت W/C",
          requirement: "W/C <= 0.35",
          evaluate: (inputs, results) => {
            const wc = results.wcRatioAdjusted || results.wcRatio || 0.50;
            const ok = wc <= 0.35;
            return {
              status: ok ? "compliant" : "non_compliant",
              actual: `${wc.toFixed(3)}`,
              note: ok ? "ممتازة، النسبة مخفضة لرفع تماسك العجينة وتقوية منطقة الاتصال الفاصلة (ITZ)." : "مرفوض هندسياً، الخرسانة عالية المقاومة تتطلب W/C منخفض جداً لتفادي المسامية الكبيرة.",
              recommendation: ok ? undefined : "يرجى تقليل نسبة الماء المستهدفة أو زيادة جرعة الملدن الفائق."
            };
          }
        }
      ]
    },
    HPC: {
      code: "HPC",
      nameAr: "الخرسانة عالية الأداء (HPC / BHP)",
      nameEn: "High Performance Concrete",
      nameFr: "Béton à Hautes Performances (BHP)",
      descriptionAr: "خرسانة مصممة خصيصاً لتوفير متانة فائقة ومقاومة نفاذية ممتازة في البيئات البحرية القاسية والكبريتية.",
      descriptionEn: "Specialized concrete engineered for extreme durability and chemical resistance in marine or acidic settings.",
      compatibleMaterials: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية", "إضافات معدنية"],
      requiredMaterials: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية", "إضافات معدنية"],
      forbiddenMaterials: ["ألياف", "ركام خفيف", "ركام ثقيل", "مجلدات خاصة"],
      requiredProperties: ["density", "absorption", "moisture", "strengthClass"],
      recommendedSlumpMin: 15,
      recommendedSlumpMax: 22,
      recommendedDmaxMin: 12.5,
      recommendedDmaxMax: 20,
      maxWcRatio: 0.38,
      minCementContent: 400,
      maxCementContent: 500,
      exposureConditions: ["XS1", "XS2", "XA1", "XA2"],
      durabilityRequirements: "تقييد صارم للمسامية المتصلة عن طريق استخدام مواد بوزولانية خاملة ونشطة كغبار السيليكا أو الرماد المتطاير.",
      specialNotesAr: "يساعد تمديد زمن الخلط على التفتيت التام لغبار السيليكا المجهري وتأمين انتشار كيميائي مستقر للملدن بالخلطة.",
      specialNotesEn: "Extended mixing duration is critical to guarantee full dispersion of ultra-fine silica and optimal superplasticizer efficiency.",
      validationRules: [
        {
          id: "hpc_wc",
          paramName: "wc",
          arabicName: "نسبة الماء إلى الإسمنت W/C",
          requirement: "W/C <= 0.38",
          evaluate: (inputs, results) => {
            const wc = results.wcRatioAdjusted || results.wcRatio || 0.50;
            const ok = wc <= 0.38;
            return {
              status: ok ? "compliant" : "non_compliant",
              actual: `${wc.toFixed(3)}`,
              note: ok ? "مثالية لخفض المسامية المتصلة بالبيتون وتحقيق أعلى درجات المتانة والكتامة." : "نسبة الماء مرتفعة وتسهل نفاذ الكبريتات والكلوريدات الساحلية. يجب أن لا تزيد عن 0.38 للـ HPC.",
              recommendation: ok ? undefined : "يرجى تقليل المياه لتقليص مسام الخرسانة موقعياً."
            };
          }
        }
      ]
    },
    SCC: {
      code: "SCC",
      nameAr: "الخرسانة ذاتية الرص (SCC / BAP)",
      nameEn: "Self-Consolidating Concrete",
      nameFr: "Béton Autoplaçant (BAP)",
      descriptionAr: "خرسانة عالية السيولة والانسيابية تتدفق تحت تأثير وزنها الذاتي وتملأ القوالب الضيقة المزدحمة بالحديد دون الحاجة للهز الميكانيكي.",
      descriptionEn: "Highly flowable self-compacting concrete moving under self-weight to fill complex dense-reinforced formworks.",
      compatibleMaterials: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية", "إضافات معدنية"],
      requiredMaterials: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية"],
      forbiddenMaterials: ["ألياف", "ركام خفيف", "ركام ثقيل", "مجلدات خاصة"],
      requiredProperties: ["density", "absorption", "moisture"],
      recommendedSlumpMin: 20,
      recommendedSlumpMax: 25,
      recommendedDmaxMin: 8,
      recommendedDmaxMax: 16,
      maxWcRatio: 0.45,
      minCementContent: 350,
      maxCementContent: 450,
      exposureConditions: ["XC3", "XC4", "XD2"],
      durabilityRequirements: "تتطلب كمية عالية من الدقائق والبودرة الناعمة (فيلر جيري أو غباري) لضمان عدم حدوث نضح مائي أو تفكك حبيبي.",
      specialNotesAr: "يتم فحص السيولة بواسطة تدفق الهبوط المخروطي (Slump Flow Test) حيث يجب أن تبلغ القيمة المقروءة 600-750 مم.",
      specialNotesEn: "Slump flow spread rather than standard height collapse is the fundamental rheological metric to verify SCC stability.",
      validationRules: [
        {
          id: "scc_slump",
          paramName: "slump",
          arabicName: "هبوط مخروط أبرامز المستهدف",
          requirement: "Slump >= 20 cm",
          evaluate: (inputs, results) => {
            const slump = inputs.slump || 8;
            const ok = slump >= 20;
            return {
              status: ok ? "compliant" : "non_compliant",
              actual: `${slump} cm`,
              note: ok ? "السيولة ممتازة لمطابقة شروط التدفق الذاتي للخرسانة ذاتية الرص." : "القيمة منخفضة جداً للخرسانة ذاتية الرص. البيتون سيتطلب هزا ميكانيكيا ولن ينساب بحرية.",
              recommendation: ok ? undefined : "يرجى تعديل الهبوط المطلوب ليكون 20 سم على الأقل أو ترقية جرعة الملدن."
            };
          }
        },
        {
          id: "scc_dmax",
          paramName: "dMax",
          arabicName: "القطر الأقصى للركام Dmax",
          requirement: "Dmax <= 16 mm",
          evaluate: (inputs, results) => {
            const dMax = inputs.dMax || 20;
            const ok = dMax <= 16;
            return {
              status: ok ? "compliant" : "warning",
              actual: `${dMax} mm`,
              note: ok ? "مثالي، لمنع الانسداد الحبيبي والتحشر خلف حديد التسليح." : "يفضل خفض القطر الأقصى إلى 16مم أو أقل لوقاية القوالب الضيقة من العرقلة الإنشائية الحبيبية.",
              recommendation: ok ? undefined : "اختر ركام بقطر أقصى أصغر لتفادي التحشر."
            };
          }
        }
      ]
    },
    PUMPED: {
      code: "PUMPED",
      nameAr: "الخرسانة القابلة للضخ (Pumped Concrete)",
      nameEn: "Pumped Concrete",
      nameFr: "Béton Pompable",
      descriptionAr: "خرسانة ذات لزوجة وتماسك داخلي ممتاز مصممة خصيصاً ليتم ضخها عبر خطوط الأنابيب الطويلة والرأسية دون حدوث سد للأنابيب.",
      descriptionEn: "Cohesive and flowable concrete mixture engineered to be pumped through vertical pipelines without blockages.",
      compatibleMaterials: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية", "إضافات معدنية"],
      requiredMaterials: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية"],
      forbiddenMaterials: ["ركام خفيف", "ركام ثقيل"],
      requiredProperties: ["density", "absorption", "moisture"],
      recommendedSlumpMin: 12,
      recommendedSlumpMax: 18,
      recommendedDmaxMin: 12.5,
      recommendedDmaxMax: 25,
      maxWcRatio: 0.50,
      minCementContent: 320,
      maxCementContent: 450,
      exposureConditions: ["XC1", "XC2", "XC3"],
      durabilityRequirements: "تتطلب معامل تماسك حبيبي أعلى (K) لتقليل خطر الانفصال الحبيبي تحت ضغوط الضخ الهيدروليكية داخل الأنابيب.",
      specialNotesAr: "يتم زيادة نسبة الرمل وتكثيف الملدنات لإنتاج مزيج لزج يسهل حركته عبر جدران الأنابيب دون حدوث احتكاك زائد.",
      specialNotesEn: "Enhanced sand content and lubricating chemical admixtures are vital to reduce friction against steel pipe walls.",
      validationRules: [
        {
          id: "pumped_slump_limit",
          paramName: "slump",
          arabicName: "قوام الهبوط للضخ",
          requirement: "12 - 18 cm",
          evaluate: (inputs, results) => {
            const slump = inputs.slump || 8;
            const ok = slump >= 12 && slump <= 18;
            return {
              status: ok ? "compliant" : "warning",
              actual: `${slump} cm`,
              note: ok ? "سيولة مناسبة جداً للضخ الهيدروليكي الآمن." : "خطر حدوث انسداد! الهبوط المنخفض يرفع احتكاك الأنابيب، والهبوط المرتفع جداً قد يسبب انفصال البحص.",
              recommendation: "اضبط الهبوط ليكون في النطاق الموصى به (12 إلى 18 سم)."
            };
          }
        }
      ]
    },
    MASS: {
      code: "MASS",
      nameAr: "الخرسانة الكتلية الضخمة (Mass Concrete)",
      nameEn: "Mass Concrete",
      nameFr: "Béton de Masse",
      descriptionAr: "خرسانة تصب في كتل ميكانيكية ضخمة كالسدود والقواعد الكبرى، تمتاز بانبعاث حراري بالغة الانخفاض لتقليل شروخ الإجهاد الحراري.",
      descriptionEn: "Large volume concrete elements like gravity dams designed with low hydration heat output to avoid thermal cracking.",
      compatibleMaterials: ["إسمنت", "رمال", "حصى", "ماء", "إضافات معدنية", "إضافات كيميائية"],
      requiredMaterials: ["إسمنت", "رمال", "حصى", "ماء"],
      forbiddenMaterials: ["ألياف", "مجلدات خاصة", "ركام خفيف"],
      requiredProperties: ["density", "absorption", "moisture"],
      recommendedSlumpMin: 3,
      recommendedSlumpMax: 8,
      recommendedDmaxMin: 25,
      recommendedDmaxMax: 40,
      maxWcRatio: 0.55,
      minCementContent: 220,
      maxCementContent: 300,
      exposureConditions: ["X0", "XC1"],
      durabilityRequirements: "تخفيض نسبة الإسمنت البورتلاندي النقي واستبداله بالرماد المتطاير أو الخبث لخفض حرارة الإماهة الإجمالية.",
      specialNotesAr: "يجب الحفاظ على زمن معالجة طويل ورش المياه الباردة أو استخدام الثلج المجروش كبديل لماء خلط التصميم لضبط حرارة الصب.",
      specialNotesEn: "Using chilled water or crushed ice as replacement for mix water is recommended to control temperature peak.",
      validationRules: [
        {
          id: "mass_cement_max",
          paramName: "cement",
          arabicName: "محتوى الإسمنت الأقصى",
          requirement: "Cement <= 300 kg/m³",
          evaluate: (inputs, results) => {
            const cement = results.cementWeight || results.cementKg || 350;
            const ok = cement <= 300;
            return {
              status: ok ? "compliant" : "warning",
              actual: `${Math.round(cement)} kg/m³`,
              note: ok ? "محتوى منخفض ومناسب للحد من الإجهادات الحرارية والشقوق." : "انتبه! محتوى الإسمنت مرتفع وقد يسبب تصدعات حرارية بالغة الخطورة بقلب الكتلة المصبوبة.",
              recommendation: "يرجى تقليل محتوى الإسمنت واستخدام إضافات معدنية بديلة (SCM) لتعويض الوزن الهيكلي."
            };
          }
        }
      ]
    },
    MARINE: {
      code: "MARINE",
      nameAr: "الخرسانة البحرية (Marine Concrete)",
      nameEn: "Marine Concrete",
      nameFr: "Béton Maritime",
      descriptionAr: "خرسانة ذات مقاومة فائقة لنفاذ أملاح الكبريتات والكلوريدات بالبيئة البحرية لحماية منشآت الشواطئ والموانئ والمجاري المائية.",
      descriptionEn: "Highly impermeable concrete engineered to withstand aggressive sulphate and chloride attacks in maritime environments.",
      compatibleMaterials: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية", "إضافات معدنية"],
      requiredMaterials: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية", "إضافات معدنية"],
      forbiddenMaterials: ["ركام خفيف"],
      requiredProperties: ["density", "absorption", "moisture", "strengthClass"],
      recommendedSlumpMin: 10,
      recommendedSlumpMax: 18,
      recommendedDmaxMin: 16,
      recommendedDmaxMax: 31.5,
      maxWcRatio: 0.40,
      minCementContent: 360,
      maxCementContent: 450,
      exposureConditions: ["XS1", "XS2", "XS3", "XA2"],
      durabilityRequirements: "الحد الأقصى لنسبة الماء W/C = 0.40 لعرقلة نفاذ الكلوريدات النشطة المدمرة للحديد الإنشائي.",
      specialNotesAr: "يجب اختيار إسمنت مقاوم للكبريتات (مثل CEM I - SR5) مع جرعة غبار سيليكا لا تقل عن 5.0% لتعظيم كثافة الخلطة.",
      specialNotesEn: "Sulphate-resisting ciment type (SR5) paired with silica fume is optimal to enhance marine durability metrics.",
      validationRules: [
        {
          id: "marine_wc_limit",
          paramName: "wcRatio",
          arabicName: "نسبة W/C للخرسانة البحرية",
          requirement: "W/C <= 0.40",
          evaluate: (inputs, results) => {
            const wc = results.wcRatioAdjusted || results.wcRatio || 0.5;
            const ok = wc <= 0.40;
            return {
              status: ok ? "compliant" : "non_compliant",
              actual: `${wc.toFixed(3)}`,
              note: ok ? "ممتازة، تمنع انتشار الأملاح الكيميائية بكفاءة عالية." : "فشل حاد! النسبة المرتفعة تسرع تآكل وصدأ القضبان الفولاذية بقلب المياه المالحة.",
              recommendation: "قم بخفض نسبة الماء وزيادة جرعة الملدن لضمان السيولة دون مسامية."
            };
          }
        }
      ]
    },
    PRECAST: {
      code: "PRECAST",
      nameAr: "خرسانة العناصر مسبقة الصنع (Precast Concrete)",
      nameEn: "Precast Concrete",
      nameFr: "Béton de Préfabrication",
      descriptionAr: "خرسانة ذات تصلد مبكر سريع وقابلية فائقة للدمك مصممة لإنتاج الأنابيب والجدران مسبقة الصنع بالمصانع لإعادة استخدام القوالب بسرعة.",
      descriptionEn: "High early strength concrete formulated for rapid setting and quick mold stripping cycles in industrial factories.",
      compatibleMaterials: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية", "إضافات معدنية"],
      requiredMaterials: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية"],
      forbiddenMaterials: ["مجلدات خاصة"],
      requiredProperties: ["density", "absorption", "moisture", "strengthClass"],
      recommendedSlumpMin: 5,
      recommendedSlumpMax: 12,
      recommendedDmaxMin: 10,
      recommendedDmaxMax: 20,
      maxWcRatio: 0.45,
      minCementContent: 350,
      maxCementContent: 450,
      exposureConditions: ["XC1", "XC2"],
      durabilityRequirements: "تتطلب مقاومة ضغط مبكرة عالية بعمر يوم واحد لتسهيل نزع القوالب الإنشائية بالمصنع.",
      specialNotesAr: "يستخدم معها مسرع الشك الكيميائي، وغالباً ما تخضع للمعالجة البخارية الحرارية لتسريع تفاعلات الإماهة المبكرة.",
      specialNotesEn: "Chemical accelerators and steam-curing systems are typically integrated to boost early strength within hours.",
      validationRules: [
        {
          id: "precast_early_strength",
          paramName: "cementClassStrength",
          arabicName: "رتبة مقاومة الإسمنت",
          requirement: ">= 42.5 MPa",
          evaluate: (inputs, results) => {
            const strength = inputs.cementClassStrength || 32.5;
            const ok = strength >= 42.5;
            return {
              status: ok ? "compliant" : "warning",
              actual: `${strength} MPa`,
              note: ok ? "رتبة الإسمنت مناسبة جداً لتعزيز القوة المبكرة." : "رتبة الإسمنت منخفضة لإنتاج خرسانة مسبقة الصنع سريعة نزع القوالب، يفضل استخدام إسمنت CEM I 52.5N.",
              recommendation: "استبدل نوع الإسمنت برتبة 42.5 أو 52.5 لزيادة الكفاءة الزمنية."
            };
          }
        }
      ]
    },
    PRESTRESSED: {
      code: "PRESTRESSED",
      nameAr: "الخرسانة مسبقة الإجهاد (Prestressed Concrete)",
      nameEn: "Prestressed Concrete",
      nameFr: "Béton Précontraint",
      descriptionAr: "خرسانة إنشائية ممتازة ذات زحف وانكماش منخفضين جداً ومقاومة ضغط فائقة، مصممة لتحمل قوى شد الأوتار الفولاذية دون تهشم.",
      descriptionEn: "High-grade structural concrete with minimal shrinkage and creep properties to secure prestressed steel cables anchorage.",
      compatibleMaterials: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية", "إضافات معدنية"],
      requiredMaterials: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية", "إضافات معدنية"],
      forbiddenMaterials: ["ركام خفيف", "مجلدات خاصة"],
      requiredProperties: ["density", "absorption", "moisture", "strengthClass"],
      recommendedSlumpMin: 12,
      recommendedSlumpMax: 18,
      recommendedDmaxMin: 12.5,
      recommendedDmaxMax: 20,
      maxWcRatio: 0.35,
      minCementContent: 380,
      maxCementContent: 500,
      exposureConditions: ["XC3", "XC4", "XD1"],
      durabilityRequirements: "تتطلب مقاومة مميزة فك الـ 28 يوماً لا تقل عن 45 ميغاباسكال لضمان ثبات المراسي الإنشائية.",
      specialNotesAr: "يمنع كلياً استخدام إضافات تحتوي على الكلوريدات لتفادي تآكل أوتار الفولاذ عالية الشد المهددة بالانهيار المفاجئ.",
      specialNotesEn: "Total restriction on chloride-bearing accelerators to avoid high-tensile steel tendon corrosion and sudden failures.",
      validationRules: [
        {
          id: "prestressed_strength_min",
          paramName: "strength",
          arabicName: "المقاومة المستهدفة fc28",
          requirement: "fc28 >= 45 MPa",
          evaluate: (inputs, results) => {
            const fck = inputs.fck28 || 25;
            const ok = fck >= 45;
            return {
              status: ok ? "compliant" : "non_compliant",
              actual: `${fck} MPa`,
              note: ok ? "المقاومة كافية وتدعم استيعاب قوى الإجهاد المسبق للأوتار." : "مرفوضة! مقاومة الخرسانة مسبقة الإجهاد يجب أن لا تقل عن 45 ميغاباسكال لمنع التشوه الفوري خلف الروابط.",
              recommendation: "ارفع قيمة المقاومة المطلوبة fc28 لتطابق شروط التصميم المسبق الإجهاد."
            };
          }
        }
      ]
    },
    LWC: {
      code: "LWC",
      nameAr: "الخرسانة خفيفة الوزن (LWC)",
      nameEn: "Lightweight Concrete",
      nameFr: "Béton Léger",
      descriptionAr: "خرسانة ذات كثافة جافة منخفضة يتم إنتاجها باستخدام ركام خفيف الوزن (مثل الطين المتمدد أو الخفاف) لتقليل الأحمال الميتة وتوفير عزل حراري وصوتي مميز.",
      descriptionEn: "Low-density concrete utilising expanded clay or pumice aggregates to reduce structural dead loads and provide thermal insulation.",
      compatibleMaterials: ["إسمنت", "رمال", "ركام خفيف", "ماء", "إضافات كيميائية"],
      requiredMaterials: ["إسمنت", "رمال", "ركام خفيف", "ماء"],
      forbiddenMaterials: ["حصى", "ركام ثقيل", "ألياف", "مجلدات خاصة", "إضافات معدنية"],
      requiredProperties: ["density", "absorption", "moisture"],
      recommendedSlumpMin: 5,
      recommendedSlumpMax: 10,
      recommendedDmaxMin: 10,
      recommendedDmaxMax: 16,
      maxWcRatio: 0.50,
      minCementContent: 300,
      maxCementContent: 450,
      exposureConditions: ["X0", "XC1"],
      durabilityRequirements: "المحافظة على قشرة خارجية صلبة للركام الهش لضمان عدم تكسر الخلايا الهوائية العازلة.",
      specialNotesAr: "يجب ترطيب الركام الخفيف بالكامل مسبقاً لمنع امتصاصه المباشر لماء الخلط الصافي المخصص للتفاعل الهيدروليكي.",
      specialNotesEn: "Lightweight aggregates should be pre-saturated to prevent drawing mixing water from the chemical reaction.",
      validationRules: [
        {
          id: "lwc_aggregate_compat",
          paramName: "gravel",
          arabicName: "فئة الركام الخشن المستخدم",
          requirement: "ركام خفيف الوزن",
          evaluate: (inputs, results) => {
            const hasLwc = !!inputs.selectedLightweightAggregateId;
            return {
              status: hasLwc ? "compliant" : "non_compliant",
              actual: hasLwc ? "ركام خفيف فعال" : "حصى عادي",
              note: hasLwc ? "تطابق تام للفئة الإنشائية خفيفة الوزن." : "خطأ هندسي! الخرسانة خفيفة الوزن تتطلب ركاماً خفيفاً حركياً كبديل للحصى الطبيعي الصخري.",
              recommendation: "يرجى اختيار مادة من نوع الركام الخفيف في مستودع المواد وتفعيله."
            };
          }
        }
      ]
    },
    HWC: {
      code: "HWC",
      nameAr: "الخرسانة ثقيلة الوزن (HWC)",
      nameEn: "Heavyweight Concrete",
      nameFr: "Béton Lourd",
      descriptionAr: "خرسانة مصممة بكثافة تتجاوز 2900 كجم/م³ باستخدام ركامات معدنية عالية الكثافة (مثل الباريت أو الهيماتيت) تستخدم بشكل أساسي للوقاية من الإشعاعات.",
      descriptionEn: "High density concrete exceeding 2900 kg/m3 crafted with barite or hematite to shield against nuclear radiation.",
      compatibleMaterials: ["إسمنت", "رمال", "ركام ثقيل", "ماء", "إضافات كيميائية"],
      requiredMaterials: ["إسمنت", "رمال", "ركام ثقيل", "ماء"],
      forbiddenMaterials: ["حصى", "ركام خفيف", "ألياف", "مجلدات خاصة", "إضافات معدنية"],
      requiredProperties: ["density", "absorption", "moisture"],
      recommendedSlumpMin: 5,
      recommendedSlumpMax: 10,
      recommendedDmaxMin: 12.5,
      recommendedDmaxMax: 25,
      maxWcRatio: 0.45,
      minCementContent: 350,
      maxCementContent: 450,
      exposureConditions: ["X0"],
      durabilityRequirements: "أكبر قدر من التراص الجاف لضمان عدم حدوث فراغات هيدروليكية تسمح بعبور الإشعاعات النووية.",
      specialNotesAr: "يجب تجنب ملء الخلاطة بأكثر من 50-60% من طاقتها الاستيعابية العادية لتجنب الأعطال الميكانيكية للوزن الكبير للركام المعدني.",
      specialNotesEn: "Limit batch volume in mixers to 50-60% of rating due to high mechanical loads from heavy mineral aggregates.",
      validationRules: [
        {
          id: "hwc_aggregate_compat",
          paramName: "gravel",
          arabicName: "فئة الركام الخشن المستخدم",
          requirement: "ركام ثقيل الوزن (باريت/هيماتيت)",
          evaluate: (inputs, results) => {
            const hasHwc = !!inputs.selectedHeavyweightAggregateId;
            return {
              status: hasHwc ? "compliant" : "non_compliant",
              actual: hasHwc ? "ركام ثقيل فعال" : "حصى عادي",
              note: hasHwc ? "تطابق تام للفئة الوقائية ثقيلة الوزن." : "خطأ هندسي! الخرسانة ثقيلة الوزن للوقاية من الإشعاعات تتطلب ركاماً معدنياً ثقيلاً ذا كثافة عالية.",
              recommendation: "يرجى تفعيل واختيار ركام ثقيل الوزن من المستودع لتغذية الحاسبة."
            };
          }
        }
      ]
    },
    RCC: {
      code: "RCC",
      nameAr: "الخرسانة المدحولة (RCC)",
      nameEn: "Roller-Compacted Concrete",
      nameFr: "Béton Compacté au Rouleau",
      descriptionAr: "خلطة جافة خالية من الهبوط تفرش بآلات رصف الطرق وتدمك بمداحل ميكانيكية ثقيلة لصب الكتل الخرسانية الضخمة بمحتوى إسمنت اقتصادي وحرارة منخفضة.",
      descriptionEn: "Zero-slump concrete mixture paved and consolidated with vibratory roller compactors for heavy-duty pavements and dams.",
      compatibleMaterials: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية", "إضافات معدنية"],
      requiredMaterials: ["إسمنت", "رمال", "حصى", "ماء"],
      forbiddenMaterials: ["ألياف", "ركام خفيف", "ركام ثقيل", "مجلدات خاصة"],
      requiredProperties: ["density", "absorption", "moisture"],
      recommendedSlumpMin: 0,
      recommendedSlumpMax: 3,
      recommendedDmaxMin: 20,
      recommendedDmaxMax: 40,
      maxWcRatio: 0.50,
      minCementContent: 150,
      maxCementContent: 280,
      exposureConditions: ["X0", "XC1"],
      durabilityRequirements: "توفير متانة تماسك حبيبي ميكانيكي هائلة عن طريق دمج واهتزاز الحبيبات المتراصة بالكامل بفعل ثقل المداحل.",
      specialNotesAr: "يجب أن تكون الخلطة ذات قوام ترابي رطب يشبه الرمل المبلل، وتفرش وتدك فوراً قبل بدء شك الإسمنت لضمان عدم حدوث زحف.",
      specialNotesEn: "Dry consistency resembles damp earth and must be paved and rolled immediately prior to early hydration set.",
      validationRules: [
        {
          id: "rcc_high_slump",
          paramName: "slump",
          arabicName: "الهبوط المستهدف للخرسانة المدحولة",
          requirement: "Slump <= 3 cm",
          evaluate: (inputs, results) => {
            const slump = inputs.slump || 0;
            const ok = slump <= 3;
            return {
              status: ok ? "compliant" : "non_compliant",
              actual: `${slump} cm`,
              note: ok ? "قوام جاف ممتاز وجاهز للحدل والدمك بالمداحل الاهتزازية." : "الهبوط مرتفع جداً للخرسانة المدحولة (RCC). ستنزلق وتنهار الخلطة تحت وزن مداحل الرص.",
              recommendation: "اخفض الهبوط المستهدف ليكون أقل من 3 سم (قوام ترابي رطب)."
            };
          }
        }
      ]
    },
    SHOTCRETE: {
      code: "SHOTCRETE",
      nameAr: "الخرسانة المقذوفة (Shotcrete)",
      nameEn: "Sprayed Concrete",
      nameFr: "Béton Projeté",
      descriptionAr: "خرسانة يتم دفعها وضخها بضغط هواء مرتفع عبر خراطيم بسرعة لتستقر فوق الأسطح بشكل مباشر وتتماسك ذاتياً بفعل طاقة الاصطدام.",
      descriptionEn: "Concrete sprayed at high velocity onto a surface, consolidating itself through impact energy and instant setting agents.",
      compatibleMaterials: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية", "ألياف", "إضافات معدنية"],
      requiredMaterials: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية"],
      forbiddenMaterials: ["ركام خفيف", "ركام ثقيل", "مجلدات خاصة"],
      requiredProperties: ["density", "absorption", "moisture"],
      recommendedSlumpMin: 8,
      recommendedSlumpMax: 15,
      recommendedDmaxMin: 8,
      recommendedDmaxMax: 16,
      maxWcRatio: 0.45,
      minCementContent: 360,
      maxCementContent: 450,
      exposureConditions: ["XC1", "XC2", "XD1"],
      durabilityRequirements: "تحقيق تماسك فوري وتصلد معجل بالأسطح الرأسية أو السقوف دون تساقط أو ارتداد حبيبي للبحص الخشن.",
      specialNotesAr: "يتم حقن مادة مسرع الشك السريع (Accelerator) مباشرة عند فوهة القذف الهوائي بنسبة 3.0% إلى 6.0% من وزن المادة الرابطة.",
      specialNotesEn: "Accelerators are blended in real-time at the nozzle tip to provide instantaneous set on rock slopes or tunnel linings.",
      validationRules: [
        {
          id: "shotcrete_high_dmax",
          paramName: "dMax",
          arabicName: "القطر الأقصى لركام خرسانة الرش",
          requirement: "Dmax <= 16 mm",
          evaluate: (inputs, results) => {
            const dMax = inputs.dMax || 20;
            const ok = dMax <= 16;
            return {
              status: ok ? "compliant" : "warning",
              actual: `${dMax} mm`,
              note: ok ? "القطر ملائم تماماً للأنابيب وفوهة القذف الهوائي." : "القطر الأقصى كبير نسبياً لخرسانة الرش، قد يسبب ارتداداً كبيراً للحبيبات وانسداد الخراطيم.",
              recommendation: "يفضل خفض Dmax إلى 12 مم أو 16 مم كحد أقصى لتفادي الارتداد وجروح الأنابيب."
            };
          }
        },
        {
          id: "shotcrete_accelerator",
          paramName: "dosageAccelerator",
          arabicName: "جرعة مسرع الشك",
          requirement: "dosageAccelerator > 0",
          evaluate: (inputs, results) => {
            const acc = inputs.dosageAccelerator || 0;
            const ok = acc > 0;
            return {
              status: ok ? "compliant" : "non_compliant",
              actual: `${acc.toFixed(1)}%`,
              note: ok ? "تفعيل مناسب ومثالي للتثبيت الفوري للطبقات الصاعدة." : "خرسانة الرش (Shotcrete) تتطلب إضافة مسرع شك فوري موقعياً لمنع تساقط الخرسانة السائلة من السقوف والمنحدرات.",
              recommendation: "أضف مسرع شك بجرعة مناسبة (مثال 3% إلى 6%) بقسم الإضافات الكيميائية."
            };
          }
        }
      ]
    },
    GPC: {
      code: "GPC",
      nameAr: "الخرسانة الجيوبوليمرية الخضراء (GPC)",
      nameEn: "Geopolymer Concrete",
      nameFr: "Béton Géopolymère",
      descriptionAr: "خرسانة مبتكرة صديقة للبيئة تلغي استعمال الإسمنت التقليدي تماماً وتستبدله بمواد رابطة نشطة مفعلة بالقلويات السائلة.",
      descriptionEn: "Eco-friendly cement-free geopolymer concrete utilizing slag/fly ash activated by alkaline solutions.",
      compatibleMaterials: ["رمال", "حصى", "ماء", "إضافات معدنية", "مجلدات خاصة"],
      requiredMaterials: ["رمال", "حصى", "ماء", "إضافات معدنية", "مجلدات خاصة"],
      forbiddenMaterials: ["إسمنت", "ألياف", "ركام خفيف", "ركام ثقيل"],
      requiredProperties: ["density", "absorption", "moisture"],
      recommendedSlumpMin: 10,
      recommendedSlumpMax: 18,
      recommendedDmaxMin: 12.5,
      recommendedDmaxMax: 20,
      maxWcRatio: 0.45,
      minCementContent: 0,
      maxCementContent: 0,
      exposureConditions: ["XA3", "XS3"],
      durabilityRequirements: "توفير بلمرة مشتركة لسيليكات وألومينات الكالسيوم لتوليد رابطة هيكلية مقاومة لشد الأحماض والحرارة الكبرى.",
      specialNotesAr: "تتطلب معالجة حرارية تبلغ 60-80 درجة مئوية لمدة 24 ساعة بعد الصب لتسريع تكثف البوليمر المشترك بالمصفوفة.",
      specialNotesEn: "Thermal curing at 60-80°C is required during initial 24 hours to catalyze the geopolymerization process.",
      validationRules: [
        {
          id: "gpc_cement_free",
          paramName: "selectedSpecialBinderId",
          arabicName: "المجلد المخصص وجرعة تفعيل قلوي",
          requirement: "وجود مجلد وسائل قلوي مفعل",
          evaluate: (inputs, results) => {
            const hasActivator = !!inputs.selectedSpecialBinderId;
            return {
              status: hasActivator ? "compliant" : "non_compliant",
              actual: hasActivator ? "مجلد جيوبوليمر مفعل" : "غير متوفر",
              note: hasActivator ? "تطابق تام لتنشيط التكاثف المعدني." : "غير متوافقة! الخرسانة الجيوبوليمرية تفتقر لسائل التنشيط القلوي والمجلد المخصص كمادة بديلة للإسمنت.",
              recommendation: "اختر سائل تفعيل قلوي أو مجلد جيوبوليمر مخصص من قسم الروابط والمجلدات الخاصة."
            };
          }
        }
      ]
    },
    SHC: {
      code: "SHC",
      nameAr: "الخرسانة ذاتية المعالجة (SHC)",
      nameEn: "Self-Healing Concrete",
      nameFr: "Béton Autocicatrisant",
      descriptionAr: "خرسانة ذكية مضاف إليها كبسولات بكتيرية مغذية تتفاعل تلقائياً مع تسرب الرطوبة لإغلاق وترسيب الكلس بالشقوق مجهرياً.",
      descriptionEn: "Intelligent concrete containing bacterial capsules that precipitate calcium carbonate to seal micro-cracks automatically.",
      compatibleMaterials: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية", "مجلدات خاصة"],
      requiredMaterials: ["إسمنت", "رمال", "حصى", "ماء", "مجلدات خاصة"],
      forbiddenMaterials: ["ألياف", "ركام خفيف", "ركام ثقيل"],
      requiredProperties: ["density", "absorption", "moisture"],
      recommendedSlumpMin: 5,
      recommendedSlumpMax: 15,
      recommendedDmaxMin: 12.5,
      recommendedDmaxMax: 25,
      maxWcRatio: 0.50,
      minCementContent: 320,
      maxCementContent: 450,
      exposureConditions: ["XA1", "XC4"],
      durabilityRequirements: "بقاء البكتيريا حية ونشطة داخل المصفوفة لترسيب كربونات الكالسيوم عند حدوث أي صدع خارجي.",
      specialNotesAr: "يمنع استعمال المضافات الكيميائية ذات التأثير السام أو درجات الحموضة العالية التي تقتل البكتيريا أو تفسد حركتها الحيوية.",
      specialNotesEn: "pH stability and non-toxic chemical mixtures are essential to ensure the bacterial cells remain viable.",
      validationRules: [
        {
          id: "shc_agent_presence",
          paramName: "selectedSpecialBinderId",
          arabicName: "عامل المعالجة البكتيري",
          requirement: "اختيار كبسولات بكتيرية ذكية",
          evaluate: (inputs, results) => {
            const agentSelected = !!inputs.selectedSpecialBinderId;
            return {
              status: agentSelected ? "compliant" : "non_compliant",
              actual: agentSelected ? "عامل حيوي فعال" : "غير متوفر",
              note: agentSelected ? "موافق، العامل الحيوي جاهز للاندماج بالشبكة الهيدروليكية." : "خرسانة المعالجة الذاتية تتطلب اختيار عامل كبسولات ذكية أو بكتيريا Bacillus.",
              recommendation: "اختر عامل معالجة ذاتية أو كبسولات بكتيرية بلورية من قائمة الروابط الخاصة."
            };
          }
        }
      ]
    },
    RAC: {
      code: "RAC",
      nameAr: "خرسانة الركام المعاد تدويره (RAC)",
      nameEn: "Recycled Aggregate Concrete",
      nameFr: "Béton à Granulats Recyclés",
      descriptionAr: "خرسانة بيئية تعتمد على تدوير ركام البناء والهدم المكسر والمغسول كبديل للركام الطبيعي لدعم كفاءة الاقتصاد الدائري.",
      descriptionEn: "Circular-economy concrete substituting natural gravel with recycled concrete aggregates from demolished structures.",
      compatibleMaterials: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية"],
      requiredMaterials: ["إسمنت", "رمال", "حصى", "ماء"],
      forbiddenMaterials: ["ركام خفيف", "ركام ثقيل", "مجلدات خاصة", "ألياف", "إضافات معدنية"],
      requiredProperties: ["density", "absorption", "moisture"],
      recommendedSlumpMin: 5,
      recommendedSlumpMax: 10,
      recommendedDmaxMin: 12.5,
      recommendedDmaxMax: 20,
      maxWcRatio: 0.50,
      minCementContent: 330,
      maxCementContent: 420,
      exposureConditions: ["X0", "XC1"],
      durabilityRequirements: "توفير تصحيح كامل لمستويات امتصاص الماء العالية للركام المعاد تدويره بسبب بقايا العجينة الإسمنتية القديمة.",
      specialNotesAr: "يجب ضبط رطوبة الحصى يدوياً لتكون أعلى (مثال 2.5%) لتعويض الامتصاص القوي بالخلاطة وتجنب جفاف المزيج.",
      specialNotesEn: "Recycled aggregates can absorb 2-3 times more water due to attached old mortar. Pre-saturation is highly recommended.",
      validationRules: [
        {
          id: "rac_absorption_check",
          paramName: "moistureGravel",
          arabicName: "رطوبة الركام المعاد تدويره",
          requirement: "moistureGravel >= 2.0%",
          evaluate: (inputs, results) => {
            const moisture = inputs.moistureGravel || 0;
            const ok = moisture >= 2.0;
            return {
              status: ok ? "compliant" : "warning",
              actual: `رطوبة الحصى: ${moisture}%`,
              note: ok ? "ممتازة، تعوض الامتصاص الداخلي العالي للركام القديم." : "انتبه! الركام القديم يمتص مياه الخلط بشدة، رطوبة الركام منخفضة وقد تسبب سحباً سريعاً لماء التفاعل وتصلب الخلطة قبل الأوان.",
              recommendation: "يرجى تعديل وضبط رطوبة الحصى المستهدفة يدوياً لتكون أعلى (مثال 2.5%) لحساب تصحيح المياه الفعلي."
            };
          }
        }
      ]
    },
    PERVIOUS: {
      code: "PERVIOUS",
      nameAr: "الخرسانة النفاذة للمياه (Pervious)",
      nameEn: "Pervious Concrete",
      nameFr: "Béton Drainant",
      descriptionAr: "خرسانة مسامية يخلو هيكلها الحبيبي تماماً من الرمل الناعم، لتشكل شبكة فراغات متصلة تصرف مياه الأمطار مباشرة للأرض.",
      descriptionEn: "Highly porous sand-free concrete designed to drain rainwater directly into the ground, preventing surface runoff.",
      compatibleMaterials: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية"],
      requiredMaterials: ["إسمنت", "رمال", "حصى", "ماء"],
      forbiddenMaterials: ["ركام خفيف", "ركام ثقيل", "مجلدات خاصة", "ألياف", "إضافات معدنية"],
      requiredProperties: ["density", "absorption", "moisture"],
      recommendedSlumpMin: 0,
      recommendedSlumpMax: 3,
      recommendedDmaxMin: 12.5,
      recommendedDmaxMax: 25,
      maxWcRatio: 0.40,
      minCementContent: 250,
      maxCementContent: 350,
      exposureConditions: ["X0", "XF1"],
      durabilityRequirements: "الحفاظ على تماسك الفراغات المفتوحة ومنع سيلان العجينة الإسمنتية لتراكمها بالقاع وسد المسامات الصارفة.",
      specialNotesAr: "يجب أن تكون نسبة الرمل أقل من 15% كحد أقصى، وقوام الهبوط شديد الجفاف (0-3 سم) لتغليف الحبيبات الخشنة فقط.",
      specialNotesEn: "Sand percentage must be restricted to under 15% and slump to under 3 cm to prevent blocking the porous voids.",
      validationRules: [
        {
          id: "pervious_sand_limit",
          paramName: "sandPercent",
          arabicName: "نسبة مساهمة الرمل",
          requirement: "Sand Percent <= 15%",
          evaluate: (inputs, results) => {
            const sandPct = results.sandPercent || 40;
            const ok = sandPct <= 15;
            return {
              status: ok ? "compliant" : "non_compliant",
              actual: `${sandPct.toFixed(1)}%`,
              note: ok ? "نسبة ممتازة تسمح بنفاذ مياه الصرف." : "فشل! نسبة الرمل مرتفعة وتملأ الفراغات الحبيبية، مما يلغي نفاذية الصرف ويحولها لخرسانة مصمتة.",
              recommendation: "يرجى تقليل نسبة الرمل يدوياً بشدة بشاشات التعديل الحبيبي."
            };
          }
        },
        {
          id: "pervious_slump_limit",
          paramName: "slump",
          arabicName: "قوام الهبوط المطلوب",
          requirement: "Slump <= 3 cm",
          evaluate: (inputs, results) => {
            const slump = inputs.slump || 8;
            const ok = slump <= 3;
            return {
              status: ok ? "compliant" : "warning",
              actual: `${slump} cm`,
              note: ok ? "العجينة تغلف حبات الحصى فقط دون سيلانها وسد مسار الصرف السفلي." : "هبوط مرتفع! سيلان العجينة الإسمنتية لأسفل سيتسبب في تشكيل طبقة كتيمة تسد مسامات الصرف بقاع البلاطة.",
              recommendation: "يرجى خفض الهبوط المستهدف (Slump) ليكون من 0 إلى 2 سم كحد أقصى."
            };
          }
        }
      ]
    },
    UHPC: {
      code: "UHPC",
      nameAr: "الخرسانة فائقة الأداء (UHPC)",
      nameEn: "Ultra-High Performance Concrete",
      nameFr: "Béton Fibré Ultra-Hautes Performances (BFUP)",
      descriptionAr: "خرسانة إنشائية متقدمة للغاية تتجاوز مقاومتها 120 ميغاباسكال بجرعات عالية من غبار السيليكا المجهري وتدرج فراغي شبه منعدم تماماً.",
      descriptionEn: "Advanced cementitious material with compressive strength exceeding 120 MPa, rich in silica fume and fibers with optimized microstructural packing.",
      compatibleMaterials: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية", "ألياف", "إضافات معدنية"],
      requiredMaterials: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية", "ألياف", "إضافات معدنية"],
      forbiddenMaterials: ["ركام خفيف", "ركام ثقيل", "مجلدات خاصة"],
      requiredProperties: ["density", "absorption", "moisture", "strengthClass"],
      recommendedSlumpMin: 18,
      recommendedSlumpMax: 24,
      recommendedDmaxMin: 6,
      recommendedDmaxMax: 10,
      maxWcRatio: 0.20,
      minCementContent: 600,
      maxCementContent: 1000,
      exposureConditions: ["XS3", "XA3", "XD3"],
      durabilityRequirements: "تعبئة الفراغات المجهرية الفائقة التناهي بالصغر لعرقلة نفاذ الغازات والسوائل بالكامل للحديد الإنشائي.",
      specialNotesAr: "تتطلب طاقة خلط ميكانيكي عالية جداً وزمن خلط ممتد لتفكيك حبيبات البودرة بالغة النعومة وتنشيط الملدن بالكامل.",
      specialNotesEn: "Exceptional mechanical shear and extended mixing time are crucial to break powder agglomerations and release mixing water.",
      validationRules: [
        {
          id: "uhpc_fiber_check",
          paramName: "selectedFiberId",
          arabicName: "الألياف الفولاذية الإنشائية",
          requirement: "وجود ألياف فولاذية نشطة",
          evaluate: (inputs, results) => {
            const hasFibers = !!inputs.selectedFiberId;
            return {
              status: hasFibers ? "compliant" : "non_compliant",
              actual: hasFibers ? "ألياف فولاذية نشطة" : "غير متوفر",
              note: hasFibers ? "تطابق ممتاز لتحقيق المطيلية والتحمل المتطور." : "الخرسانة فائقة المقاومة (UHPC) تتطلب ألياف فولاذية إنشائية لمقاومة التمزيق والهندسة الهيكلية السليمة.",
              recommendation: "يرجى تفعيل واختيار ألياف فولاذية نشطة بنسبة حركية تفوق 25 كجم/م³."
            };
          }
        },
        {
          id: "uhpc_silica_check",
          paramName: "dosageSilicaFume",
          arabicName: "جرعة غبار السيليكا المجهري",
          requirement: "Silica Fume >= 15.0%",
          evaluate: (inputs, results) => {
            const silica = inputs.dosageSilicaFume || 0;
            const ok = silica >= 15.0;
            return {
              status: ok ? "compliant" : "warning",
              actual: `${silica.toFixed(1)}%`,
              note: ok ? "جرعة سيليكا ممتازة لتعبئة الفراغات النانوية الحبيبية." : "جرعة غبار السيليكا منخفضة لخرسانة UHPC (يجب أن تكون >= 15%) لتأمين الكثافة المطلوبة.",
              recommendation: "ارفع جرعة غبار السيليكا لتصل النسبة المئوية الموصى بها."
            };
          }
        }
      ]
    },
    BFUP: {
      code: "BFUP",
      nameAr: "الخرسانة الليفية فائقة الأداء (BFUP)",
      nameEn: "Ultra-High Performance Fibre-Reinforced Concrete",
      nameFr: "Béton Fibré Ultra-Performant (BFUP)",
      descriptionAr: "قمة تكنولوجيا هندسة المواد الخرسانية المركبة، تمتاز بمرونة مطيلية فائقة لمقاومة الشد والضغط وتحمل الصدمات الفائقة.",
      descriptionEn: "Top tier of concrete material engineering, offering extreme ductility, tensile capacity, and fracture toughness.",
      compatibleMaterials: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية", "ألياف", "إضافات معدنية"],
      requiredMaterials: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية", "ألياف", "إضافات معدنية"],
      forbiddenMaterials: ["ركام خفيف", "ركام ثقيل", "مجلدات خاصة"],
      requiredProperties: ["density", "absorption", "moisture", "strengthClass"],
      recommendedSlumpMin: 18,
      recommendedSlumpMax: 24,
      recommendedDmaxMin: 6,
      recommendedDmaxMax: 10,
      maxWcRatio: 0.18,
      minCementContent: 700,
      maxCementContent: 1000,
      exposureConditions: ["XS3", "XA3", "XD3"],
      durabilityRequirements: "توفير مصفوفة خرسانية معدنية فائقة التراص بمقاومة شد تفوق 15 ميغاباسكال لتعليق الجسور والتدريعات.",
      specialNotesAr: "يتم صبها في عناصر بالغة النحافة وذات شبكات تسليح ليفية ثلاثية الأبعاد متشابكة بجميع الاتجاهات دون انفصال.",
      specialNotesEn: "Fibre-to-matrix interfacial bonds provide tremendous tensile capacity and render active stirrups unnecessary.",
      validationRules: [
        {
          id: "bfup_fiber_check",
          paramName: "selectedFiberId",
          arabicName: "الألياف الميكرو-فولاذية الخاصة",
          requirement: "وجود ألياف فولاذية نشطة",
          evaluate: (inputs, results) => {
            const hasFibers = !!inputs.selectedFiberId;
            return {
              status: hasFibers ? "compliant" : "non_compliant",
              actual: hasFibers ? "ألياف ميكرو-فولاذية فعالة" : "غير متوفر",
              note: hasFibers ? "تمنح الخلطة المرونة والمطيلية العالية المقاومة للتشققات الشديدة." : "الخرسانة الليفية فائقة الأداء (BFUP) تتطلب ألياف فولاذية إنشائية لضبط الشد والانعطاف الهيكلي.",
              recommendation: "يرجى تحديد وتفعيل ألياف فولاذية نشطة ومطابقة من المستودع."
            };
          }
        }
      ]
    }
  }
};

/**
 * Automatically evaluates the complete set of validation rules for a selected category.
 */
export function evaluateConcreteCategoryRules(
  categoryCode: string,
  inputs: any,
  results: any
): Array<{
  paramName: string;
  arabicName: string;
  status: "compliant" | "warning" | "non_compliant";
  requirement: string;
  actual: string;
  note: string;
  recommendation?: string;
}> {
  const category = DREUX_KNOWLEDGE_BASE.concreteCategories[categoryCode] || DREUX_KNOWLEDGE_BASE.concreteCategories.NSC;
  const evaluations: any[] = [];

  // Evaluate explicit rules
  for (const rule of category.validationRules) {
    try {
      const evaluation = rule.evaluate(inputs, results);
      evaluations.push({
        paramName: rule.paramName,
        arabicName: rule.arabicName,
        status: evaluation.status,
        requirement: rule.requirement,
        actual: evaluation.actual,
        note: evaluation.note,
        recommendation: evaluation.recommendation
      });
    } catch (e) {
      console.error(`Error evaluating rule ${rule.id} for category ${categoryCode}:`, e);
    }
  }

  return evaluations;
}
