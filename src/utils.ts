/**
 * WARNING: LEGACY MIX DESIGN CALCULATIONS
 * 
 * This file contains the legacy calculation engine (e.g., calculateDreuxGorisse).
 * It is designated as legacy and will be systematically phased out.
 * In Phase 2, the absolute volume corrections and density safety systems will be
 * fully integrated inside the new clean engine in src/engine/*.
 */

import { 
  AggregateType, 
  AggregateQuality, 
  MixDesignInput, 
  MixDesignResult,
  SievePoint,
  Admixture
} from "./types";

/**
 * Standard list of admixtures for easy quick addition
 */
export const STANDARD_ADMIXTURES_LIST = [
  {
    id: "super-1",
    name: {
      ar: "ملدن فائق المدى (جيل ثالث - بوليمير بولي كاربوكسيلات)",
      en: "High-Range Superplasticizer (3rd Gen Polycarboxylate)",
      fr: "Superplastifiant haut réducteur d'eau (3ème Génération Polycarboxylate)"
    },
    type: "superplasticizer" as const,
    dosage: 1.2,
    waterReduction: 20,
    effect: {
      ar: "تخفيض ممتاز للماء بنسبة تصل إلى 20٪ لزيادة القوة مع سيولة عالية ومنع الهبوط الباكر.",
      en: "Excellent water reduction up to 20% to increase strength with high fluidity and prevent slump loss.",
      fr: "Excellente réduction d'eau jusqu'à 20% pour augmenter la résistance avec une grande fluidité et éviter la perte d'affaissement."
    }
  },
  {
    id: "super-2",
    name: {
      ar: "ملدن ومخفض ماء ممتاز (قاعدة نافثالين)",
      en: "High-Range Water Reducer (Naphthalene-based)",
      fr: "Réducteur d'eau à base de naphtalène"
    },
    type: "superplasticizer" as const,
    dosage: 1.0,
    waterReduction: 12,
    effect: {
      ar: "تخفيض ماء الخلط بنسبة 12% لإنتاج خرسانة عادية إلى متوسطة القوة مع تحسين التشغيل.",
      en: "12% water reduction for normal to medium strength concrete with improved workability.",
      fr: "Réduction d'eau de gâchée de 12% pour un béton de résistance normale à moyenne avec une maniabilité améliorée."
    }
  },
  {
    id: "retard-1",
    name: {
      ar: "مؤخر لزمن الشك وتماسك الإسمنت",
      en: "Set Retarder",
      fr: "Retardateur de prise"
    },
    type: "retarder" as const,
    dosage: 0.3,
    waterReduction: 2,
    effect: {
      ar: "يؤخر زمن تصلد الخرسانة للصب في الأجواء الحارة ممتدة المفعول أو النقل لمسافات طويلة.",
      en: "Delays concrete setting time for hot weather concreting or long-distance transit.",
      fr: "Retarde le temps de prise du béton pour le bétonnage par temps chaud ou le transport longue distance."
    }
  },
  {
    id: "accel-1",
    name: {
      ar: "مسرع لزمن تصلد وتصلب الخرسانة",
      en: "Set Accelerator",
      fr: "Accélérateur de prise"
    },
    type: "accelerator" as const,
    dosage: 1.5,
    waterReduction: 0,
    effect: {
      ar: "يعجل زمن الشك وزيادة القوة المبكرة (خاص بصب الشتاء البارد أو فك الفرم السريع).",
      en: "Accelerating setting time and early strength development (winter concreting or rapid formwork removal).",
      fr: "Accélère le temps de prise et le développement de la résistance initiale (bétonnage en hiver ou décoffrage rapide)."
    }
  },
  {
    id: "air-1",
    name: {
      ar: "مادة مدخلة للهواء (مادة مهواة)",
      en: "Air Entraining Agent",
      fr: "Agent entraîneur d'air"
    },
    type: "air_entraining" as const,
    dosage: 0.1,
    waterReduction: 5,
    effect: {
      ar: "تولد فقاعات هواء مجهرية لزيادة مقاومة الصقيع والذوبان المحمي وتحسين تشغيل الخلطات الفقيرة.",
      en: "Generates microscopic air bubbles to increase freeze-thaw durability and improve poor mix cohesion.",
      fr: "Génère des bulles d'air microscopiques pour augmenter la durabilité face au gel-dégel et améliorer la cohésion des mélanges pauvres."
    }
  },
  {
    id: "silica-1",
    name: {
      ar: "غبار السيليكا النشط (بوزولاني ناعم للغاية)",
      en: "Silica Fume (Highly Active Pozzolan)",
      fr: "Fumée de silice active"
    },
    type: "silica_fume" as const,
    dosage: 8.0,
    waterReduction: -4, // Actually, silica fume absorbs water (+4% water demand), but is highly active mineral
    effect: {
      ar: "إضافة معدنية تزيد من تماسك الخرسانة وتقاوم الأملاح والكيماويات والحد من النفاذية بصورة ثورية.",
      en: "Ultra-fine pozzolanic mineral addition that dramatically decreases permeability and enhances salt/chemical resistance.",
      fr: "Addition minérale ultra-fine qui réduit considérablement la perméabilité et améliore la résistance aux sels/produits chimiques."
    }
  }
];

export const getLocalizedValue = (val: string | { ar: string; en: string; fr: string } | undefined, lang: string): string => {
  if (!val) return "";
  if (typeof val === "string") return val;
  return val[lang as "ar" | "fr" | "en"] || val.en || val.ar || "";
};

export const CEMENT_TYPES = [
  { id: "CEM_I", name: "CEM I (إسمنت بورتلاندي عادي خالي من الإضافات)", k: 3.1 },
  { id: "CEM_II", name: "CEM II (إسمنت بورتلاندي مركب مع بوزولانا/خبث)", k: 3.05 },
  { id: "CEM_III", name: "CEM III (إسمنت الأفران العالية المقاوم للكبريتات)", k: 3.0 },
  { id: "SRC", name: "SRC (إسمنت مقاوم للكبريتات والمياه الجوفية البحرية)", k: 3.15 }
];

/**
 * Algerian raw materials database presets (قاعدة بيانات مواد جزائرية مع الكثافات المستخدمة)
 */
export const ALGERIAN_MATERIALS_PRESETS = [
  {
    id: "cem_i_giga",
    name: "إسمنت بورتلاندي عياري CEM I 42.5 (جيجا / عين الكبيرة)",
    type: "cement",
    density: 3120,
    price: 20, // 20 DA/kg (1000 DA per 50kg bag)
    source: "مجمع GICA - عين الكبيرة"
  },
  {
    id: "cem_ii_zahana",
    name: "إسمنت بورتلاندي مركب CEM II/A-L 42.5 (زهانة / معسكر)",
    type: "cement",
    density: 3050,
    price: 17, // 17 DA/kg (850 DA per 50kg bag)
    source: "مجمع GICA - زهانة"
  },
  {
    id: "cem_ii_meftah",
    name: "إسمنت مركب بوزولاني CEM II/B-P 32.5 (مفتاح / البليدة)",
    type: "cement",
    density: 3000,
    price: 15, // 15 DA/kg (750 DA per 50kg bag)
    source: "مجمع GICA - مفتاح"
  },
  {
    id: "sand_oued_djedi",
    name: "رمل وادي طبيعي ناصع (وادي جدي / بسكرة)",
    type: "sand",
    density: 2630,
    price: 2.5, // 2500 DA per Ton (2.5 DA/kg)
    source: "بسكرة - وادي جدي"
  },
  {
    id: "sand_concasse_sba",
    name: "رمل كلسي مكسر 0/4 مم (سيدي بلعباس)",
    type: "sand",
    density: 2670,
    price: 2.2, // 2200 DA per Ton (2.2 DA/kg)
    source: "مقالع سيدي بلعباس"
  },
  {
    id: "gravel_8_16_mascara",
    name: "حصى مكسر صغير 8/16 مم (معسكر / الكروسة)",
    type: "gravel",
    density: 2700,
    price: 2.8, // 2800 DA per Ton (2.8 DA/kg)
    source: "مقالع معسكر"
  },
  {
    id: "gravel_16_25_didouche",
    name: "حصى مكسر خشن 16/25 مم (ديدوش مراد / قسنطينة)",
    type: "gravel",
    density: 2720,
    price: 2.8, // 2800 DA per Ton (2.8 DA/kg)
    source: "ديدوش مراد - قسنطينة"
  }
];

/**
 * Calculates recommended engineering parameters based on targets and concrete type
 */
export function getRecommendedCoefficients(
  concreteType: string,
  selectedMethod: string,
  fck28: number,
  aggregateType: string
) {
  // 1. W/C Ratio
  let computedWC = 0.50;
  if (fck28 <= 15) {
    computedWC = 0.65;
  } else if (fck28 <= 25) {
    computedWC = 0.50;
  } else if (fck28 <= 35) {
    computedWC = 0.42;
  } else if (fck28 <= 45) {
    computedWC = 0.35;
  } else if (fck28 <= 55) {
    computedWC = 0.32;
  } else {
    computedWC = 0.28;
  }

  // Adjust by concrete type
  if (concreteType === "UHPC" || concreteType === "BFUP") {
    computedWC = 0.18;
  } else if (concreteType === "HSC") {
    computedWC = Math.min(computedWC, 0.32);
  } else if (concreteType === "HPC") {
    computedWC = Math.min(computedWC, 0.34);
  } else if (concreteType === "SCC") {
    computedWC = Math.min(computedWC, 0.40);
  } else if (concreteType === "LWC") {
    computedWC = 0.45;
  } else if (concreteType === "PERVIOUS") {
    computedWC = 0.30;
  } else if (concreteType === "RCC") {
    computedWC = 0.40;
  }

  // 2. Packing Factor (G)
  let computedG = 0.82;
  if (concreteType === "SCC") {
    computedG = 0.84;
  } else if (concreteType === "UHPC" || concreteType === "BFUP") {
    computedG = 0.88;
  } else if (concreteType === "LWC") {
    computedG = 0.78;
  } else if (concreteType === "RCC") {
    computedG = 0.85;
  }

  // 3. Internal Coefficient G (Georges Dreux parameter)
  const isRounded = aggregateType === "roule" || aggregateType === "ROULE";
  let computedDreuxG = isRounded ? 0.55 : 0.45;
  if (concreteType === "UHPC" || concreteType === "BFUP") computedDreuxG = 0.65;

  // 4. Internal Curve Modifier
  let computedCurveMod = 1.0;
  if (concreteType === "SCC") computedCurveMod = 0.85;
  else if (concreteType === "UHPC" || concreteType === "BFUP") computedCurveMod = 0.75;
  else if (concreteType === "PERVIOUS") computedCurveMod = 1.35;

  // 5. Internal Sand Ratio
  let computedSandRatio = 0.35;
  if (concreteType === "SCC") {
    computedSandRatio = 0.45;
  } else if (concreteType === "UHPC" || concreteType === "BFUP") {
    computedSandRatio = 0.48;
  } else if (concreteType === "PERVIOUS") {
    computedSandRatio = 0.10;
  } else if (concreteType === "LWC") {
    computedSandRatio = 0.40;
  }

  // 6. Internal Aggregate Unit Weight
  let computedDryRodded = 1600;
  if (concreteType === "HWC") {
    computedDryRodded = 2100;
  } else if (concreteType === "LWC") {
    computedDryRodded = 1100;
  }

  return {
    internalWcOverride: computedWC,
    packingFactor: computedG,
    internalCoeffG: computedDreuxG,
    internalCurveCoeff: computedCurveMod,
    internalSandRatio: computedSandRatio,
    internalUnitWeight: computedDryRodded
  };
}

import { mixDesignEngine } from "./mix-design/core/MixDesignEngine";

/**
 * Main core calculations wrapper calling unified dreuxGorisseCore
 */
export function calculateDreuxGorisse(input: MixDesignInput): MixDesignResult {
  return mixDesignEngine.calculate({
    methodId: "dreux-gorisse",
    input,
    context: { language: "ar" }
  }) as any;
}
