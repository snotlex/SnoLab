/**
 * SnoLab Material-Laboratory Synchronization & Audit Trail Engine
 * 
 * Single Source of Truth for laboratory testing, material characterization,
 * review/validation workflows, and automatic Mix Design property derivation.
 */

import { EngineeringMaterial, MixDesignInput } from "../types";
import { 
  MaterialTestRecord, 
  MaterialPropertySource, 
  MaterialPropertyHistoryEntry,
  TestApprovalStatus,
  GranulometricCurveData,
  SieveStepResult
} from "../types/laboratoryTypes";

// ============================================================================
// PROPERTY ARABIC / FRENCH LABELS MAPPING
// ============================================================================
export const PROPERTY_LABELS: Record<string, { ar: string; fr: string; en: string; unit: string; testType: string }> = {
  absorption: { ar: "امتصاص الماء (WA24)", fr: "Absorption d'eau", en: "Water Absorption", unit: "%", testType: "AGG_WATER_ABSORPTION" },
  moisture: { ar: "محتوى الرطوبة (w)", fr: "Teneur en eau / Humidité", en: "Moisture Content", unit: "%", testType: "AGG_MOISTURE" },
  density: { ar: "الكثافة الحقيقية / المطلقة", fr: "Masse volumique réelle", en: "Specific Gravity / Density", unit: "kg/m³", testType: "AGG_SPECIFIC_GRAVITY" },
  ssdDensity: { ar: "كثافة مشبع جاف السطح (SSD)", fr: "Masse volumique SSD", en: "SSD Density", unit: "kg/m³", testType: "AGG_SPECIFIC_GRAVITY" },
  specificGravity: { ar: "الوزن النوعي النسبي", fr: "Densité relative", en: "Specific Gravity", unit: "", testType: "AGG_SPECIFIC_GRAVITY" },
  bulkDensity: { ar: "الكثافة الظاهرية (الحجمية)", fr: "Masse volumique apparente", en: "Bulk Density", unit: "kg/m³", testType: "AGG_BULK_DENSITY" },
  finenessModulus: { ar: "معامل النعومة (FM)", fr: "Module de finesse", en: "Fineness Modulus", unit: "", testType: "AGG_SIEVE" },
  dMax: { ar: "القطر الأقصى للحبيبات (Dmax)", fr: "Dimension maximale Dmax", en: "Maximum Aggregate Size", unit: "mm", testType: "AGG_SIEVE" },
  sandEquivalent: { ar: "المكافئ الرملي (SE)", fr: "Équivalent de sable", en: "Sand Equivalent", unit: "%", testType: "AGG_SAND_EQUIVALENT" },
  foisonnement: { ar: "معامل الانتفاخ (Foisonnement)", fr: "Coefficient de foisonnement", en: "Sand Bulking Factor", unit: "%", testType: "AGG_FOISONNEMENT" },
  losAngelesAbrasion: { ar: "معامل لوس أنجلوس (LA)", fr: "Coefficient Los Angeles", en: "Los Angeles Abrasion", unit: "%", testType: "AGG_LOS_ANGELES" },
  microDeval: { ar: "معامل ميكرو ديفال (MDE)", fr: "Coefficient Micro-Deval", en: "Micro-Deval Abrasion", unit: "%", testType: "AGG_MICRO_DEVAL" },
  clayContent: { ar: "نسبة الطين والشوائب الناعمة", fr: "Teneur en fines / argile", en: "Clay & Fines Content", unit: "%", testType: "AGG_METHYLENE_BLUE" },
  methyleneBlue: { ar: "قيمة أزرق الميثيلين (MB)", fr: "Valeur au bleu de méthylène", en: "Methylene Blue Value", unit: "g/kg", testType: "AGG_METHYLENE_BLUE" },
  flakinessIndex: { ar: "معامل التسطح (Flakiness)", fr: "Coefficient d'aplatissement", en: "Flakiness Index", unit: "%", testType: "AGG_FLAKINESS" },
  initialSetting: { ar: "زمن الشك الابتدائي", fr: "Début de prise", en: "Initial Setting Time", unit: "min", testType: "CEM_SETTING_TIME" },
  finalSetting: { ar: "زمن الشك النهائي", fr: "Fin de prise", en: "Final Setting Time", unit: "min", testType: "CEM_SETTING_TIME" },
  blaineFineness: { ar: "نعومة بلين (Blaine)", fr: "Surface spécifique Blaine", en: "Blaine Fineness", unit: "cm²/g", testType: "CEM_BLAINE" },
  strength2d: { ar: "مقاومة الانضغاط لعمر يومين", fr: "Résistance à 2 jours", en: "2-Day Compressive Strength", unit: "MPa", testType: "CEM_STRENGTH" },
  strength28d: { ar: "مقاومة الانضغاط لعمر 28 يوم", fr: "Résistance à 28 jours", en: "28-Day Compressive Strength", unit: "MPa", testType: "CEM_STRENGTH" },
  heatOfHydration: { ar: "حرارة الإماهة", fr: "Chaleur d'hydratation", en: "Heat of Hydration", unit: "J/g", testType: "CEM_HYDRATION_HEAT" },
  solidContent: { ar: "المحتوى الصلب الجاف (Extrait Sec)", fr: "Extrait sec", en: "Dry Solid Content", unit: "%", testType: "ADM_SOLID_CONTENT" },
  waterReduction: { ar: "نسبة تخفيض الماء الفعالة", fr: "Capacité de réduction d'eau", en: "Water Reduction Ratio", unit: "%", testType: "ADM_WATER_REDUCTION" },
  recommendedDosage: { ar: "الجرعة الموصى بها مخبرياً", fr: "Dosage recommandé", en: "Recommended Dosage", unit: "%", testType: "ADM_WATER_REDUCTION" },
  chlorideContent: { ar: "محتوى الكلوريدات", fr: "Teneur en ions chlorures", en: "Chloride Content", unit: "%", testType: "ADM_CHLORIDE" },
  pozzolanicIndex: { ar: "مؤشر النشاط البوزولاني", fr: "Indice d'activité pouzzolanique", en: "Pozzolanic Activity Index", unit: "%", testType: "SCM_POZZOLANIC_INDEX" },
  waterDemandFactor: { ar: "معامل الطلب على الماء", fr: "Facteur de demande en eau", en: "Water Demand Factor", unit: "%", testType: "SCM_WATER_DEMAND" },
  fiberLength: { ar: "طول الألياف", fr: "Longueur des fibres", en: "Fiber Length", unit: "mm", testType: "FIBER_DIMENSIONS" },
  aspectRatio: { ar: "النسبة الباعية (L/D)", fr: "Élancement", en: "Aspect Ratio", unit: "", testType: "FIBER_DIMENSIONS" },
  tensileStrength: { ar: "مقاومة الشد للألياف", fr: "Résistance à la traction", en: "Fiber Tensile Strength", unit: "MPa", testType: "FIBER_TENSILE" },
  pH: { ar: "الرقم الهيدروجيني (pH)", fr: "Potentiel hydrogène (pH)", en: "pH Value", unit: "", testType: "WATER_PH" },
  chlorides: { ar: "نسبة الكلوريدات في الماء", fr: "Chlorures dans l'eau", en: "Water Chlorides", unit: "mg/L", testType: "WATER_CHLORIDES" },
  sulfates: { ar: "نسبة الكبريتات في الماء", fr: "Sulfates dans l'eau", en: "Water Sulfates", unit: "mg/L", testType: "WATER_SULFATES" },
  gradationData: { ar: "المنحنى الحبيبي والتحليل بالغربلة", fr: "Courbe granulométrique", en: "Gradation Sieve Data", unit: "", testType: "AGG_SIEVE" },
  sieveAnalysisDetail: { ar: "جدول الغربلة والمنحنى الحبيبي التفصيلي", fr: "Détails d'analyse granulométrique", en: "Sieve Analysis Detail", unit: "", testType: "AGG_SIEVE" }
};

// ============================================================================
// MATERIAL & TEST SOURCE CLASSIFICATION AND PROVENANCE HELPERS
// ============================================================================

export function isDemoTestRecord(test: MaterialTestRecord): boolean {
  if (!test) return false;
  if (test.isDemo === true) return true;
  if (test.sourceType === "system_demo") return true;
  const idStr = String(test.id || "").toLowerCase();
  if (
    idStr.startsWith("test-agg-2026-00") || 
    idStr.startsWith("test-cem-2026-00") || 
    idStr.startsWith("test-adm-2026-00") || 
    idStr.includes("demo") || 
    idStr.includes("sample") ||
    idStr.includes("seeded")
  ) {
    return true;
  }
  return false;
}

export function isDemoMaterial(material: EngineeringMaterial): boolean {
  if (!material) return false;
  if (material.isDemo === true) return true;
  if (material.sourceType === "system_demo") return true;
  const idStr = String(material.id || "").toLowerCase();
  if (
    idStr.startsWith("preset-") || 
    idStr.startsWith("exp-") || 
    idStr.startsWith("alg-preset-") || 
    idStr.includes("demo") || 
    idStr.includes("sample") ||
    idStr.includes("seeded")
  ) {
    return true;
  }
  const source = String(material.source || "").toLowerCase();
  if (source === "system" || source === "demo" || source === "preset") {
    return true;
  }
  const createdBy = String(material.createdBy || "").toLowerCase();
  if (
    createdBy.includes("system") || 
    createdBy.includes("seeded") || 
    createdBy.includes("المنصة") || 
    createdBy.includes("snolab central")
  ) {
    return true;
  }
  return false;
}

export interface SourceDisplayInfo {
  type: "system_demo" | "user_created" | "imported" | "lab_result";
  labelAr: string;
  labelEn: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  isDemo: boolean;
  iconName: "flask" | "user" | "download" | "award";
}

export function getTestSourceInfo(test: MaterialTestRecord): SourceDisplayInfo {
  const isDemo = isDemoTestRecord(test);
  if (isDemo || test.sourceType === "system_demo") {
    return {
      type: "system_demo",
      labelAr: "عينة نظام / تجريبية (Demo Data)",
      labelEn: "System / Demo Data",
      badgeBg: "bg-amber-500/10 dark:bg-amber-500/20",
      badgeText: "text-amber-700 dark:text-amber-300",
      badgeBorder: "border-amber-300 dark:border-amber-500/30",
      isDemo: true,
      iconName: "flask"
    };
  }

  if (test.sourceType === "imported") {
    return {
      type: "imported",
      labelAr: "مستورد من تقرير خارجي",
      labelEn: "Imported Test",
      badgeBg: "bg-purple-500/10 dark:bg-purple-500/20",
      badgeText: "text-purple-700 dark:text-purple-300",
      badgeBorder: "border-purple-300 dark:border-purple-500/30",
      isDemo: false,
      iconName: "download"
    };
  }

  return {
    type: "user_created",
    labelAr: "فحص مخبري للمستخدم (User Test)",
    labelEn: "User Created Test",
    badgeBg: "bg-blue-500/10 dark:bg-blue-500/20",
    badgeText: "text-blue-700 dark:text-blue-300",
    badgeBorder: "border-blue-300 dark:border-blue-500/30",
    isDemo: false,
    iconName: "user"
  };
}

export function getMaterialSourceInfo(material: EngineeringMaterial): SourceDisplayInfo {
  const isDemo = isDemoMaterial(material);
  if (isDemo || material.sourceType === "system_demo") {
    return {
      type: "system_demo",
      labelAr: "مادة تجريبية / نظامية (Demo Data)",
      labelEn: "System / Demo Material",
      badgeBg: "bg-amber-500/10 dark:bg-amber-500/20",
      badgeText: "text-amber-700 dark:text-amber-300",
      badgeBorder: "border-amber-300 dark:border-amber-500/30",
      isDemo: true,
      iconName: "flask"
    };
  }

  if (material.sourceType === "imported" || material.source === "import" || material.extraProperties) {
    return {
      type: "imported",
      labelAr: "مادة مستوردة (Imported)",
      labelEn: "Imported Material",
      badgeBg: "bg-purple-500/10 dark:bg-purple-500/20",
      badgeText: "text-purple-700 dark:text-purple-300",
      badgeBorder: "border-purple-300 dark:border-purple-500/30",
      isDemo: false,
      iconName: "download"
    };
  }

  if (material.laboratoryTests && material.laboratoryTests.length > 0) {
    return {
      type: "lab_result",
      labelAr: "نتائج مخبرية معتمدة (Lab Verified)",
      labelEn: "Laboratory Result",
      badgeBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
      badgeText: "text-emerald-700 dark:text-emerald-300",
      badgeBorder: "border-emerald-300 dark:border-emerald-500/30",
      isDemo: false,
      iconName: "award"
    };
  }

  return {
    type: "user_created",
    labelAr: "مادة المستخدم (User Created)",
    labelEn: "User Created Material",
    badgeBg: "bg-blue-500/10 dark:bg-blue-500/20",
    badgeText: "text-blue-700 dark:text-blue-300",
    badgeBorder: "border-blue-300 dark:border-blue-500/30",
    isDemo: false,
    iconName: "user"
  };
}

// ============================================================================
// EXTRACT RAW & CALCULATED PROPERTIES FROM TEST RECORD
// ============================================================================
export function extractPropertiesFromTest(test: MaterialTestRecord): Record<string, any> {
  const props: Record<string, any> = {};
  const { testType, results = {}, inputs = {}, syncedProperties = {} } = test;

  // 1. If test already has explicit syncedProperties, start with those
  Object.assign(props, syncedProperties);

  // 2. Extract based on testType and results
  switch (testType) {
    case "AGG_SIEVE": {
      if (results.finenessModulus !== undefined) props.finenessModulus = Number(results.finenessModulus);
      if (results.dMax !== undefined) props.dMax = Number(results.dMax);
      
      // Build gradationData array
      if (results.passingPercentages && typeof results.passingPercentages === "object") {
        props.gradationData = Object.entries(results.passingPercentages).map(([sieveStr, passing]) => ({
          sieve: parseFloat(sieveStr),
          passing: Number(passing)
        })).sort((a, b) => b.sieve - a.sieve);
      } else if (inputs.sieves && Array.isArray(inputs.sieves)) {
        const totalWeight = Number(inputs.totalWeight || 1000);
        let cumulativeRetained = 0;
        const gradArray: { sieve: number; passing: number; retained?: number; cumRetained?: number }[] = [];
        const sieveSteps: SieveStepResult[] = [];

        inputs.sieves.forEach((s: any) => {
          const sieveSize = Number(s.sieve);
          const retained = Number(s.retained || 0);
          cumulativeRetained += retained;
          const percentRetained = (retained / totalWeight) * 100;
          const cumPercentRetained = (cumulativeRetained / totalWeight) * 100;
          const percentPassing = Math.max(0, 100 - cumPercentRetained);

          if (sieveSize > 0) {
            gradArray.push({
              sieve: sieveSize,
              passing: Math.round(percentPassing * 10) / 10,
              retained: Math.round(percentRetained * 10) / 10,
              cumRetained: Math.round(cumPercentRetained * 10) / 10
            });
            sieveSteps.push({
              sieve: sieveSize,
              retainedWeight: retained,
              percentRetained: Math.round(percentRetained * 10) / 10,
              cumulativePercentRetained: Math.round(cumPercentRetained * 10) / 10,
              percentPassing: Math.round(percentPassing * 10) / 10
            });
          }
        });

        props.gradationData = gradArray.sort((a, b) => b.sieve - a.sieve);
        props.sieveAnalysisDetail = {
          sieves: sieveSteps,
          finenessModulus: results.finenessModulus,
          dMax: results.dMax,
          finesContent: results.finesContent || 0
        };
      }

      if (test.granulometricCurve) {
        props.sieveAnalysisDetail = test.granulometricCurve;
      }
      break;
    }

    case "AGG_SPECIFIC_GRAVITY":
    case "AGG_ABSORPTION":
    case "AGG_WATER_ABSORPTION": {
      if (results.specificGravity !== undefined) {
        props.specificGravity = Number(results.specificGravity);
        props.density = Math.round(Number(results.specificGravity) * 1000);
      }
      if (results.density !== undefined) {
        const d = Number(results.density);
        props.density = d > 100 ? d : Math.round(d * 1000);
        props.specificGravity = d > 100 ? Math.round((d / 1000) * 100) / 100 : d;
      }
      if (results.ssdDensity !== undefined) {
        const ssd = Number(results.ssdDensity);
        props.ssdDensity = ssd > 100 ? ssd : Math.round(ssd * 1000);
      }
      if (results.absorption !== undefined) {
        props.absorption = Math.round(Number(results.absorption) * 100) / 100;
      }
      break;
    }

    case "AGG_MOISTURE":
    case "MOISTURE_CONTENT": {
      if (results.moisture !== undefined) {
        props.moisture = Math.round(Number(results.moisture) * 100) / 100;
      } else if (results.moistureContent !== undefined) {
        props.moisture = Math.round(Number(results.moistureContent) * 100) / 100;
      }
      break;
    }

    case "AGG_SAND_EQUIVALENT": {
      if (results.sandEquivalent !== undefined) props.sandEquivalent = Number(results.sandEquivalent);
      else if (results.sePiston !== undefined) props.sandEquivalent = Number(results.sePiston);
      else if (results.seVisual !== undefined) props.sandEquivalent = Number(results.seVisual);
      break;
    }

    case "AGG_FOISONNEMENT":
    case "AGG_BULKING": {
      if (results.foisonnement !== undefined) props.foisonnement = Number(results.foisonnement);
      else if (results.bulkingFactor !== undefined) props.foisonnement = Number(results.bulkingFactor);
      break;
    }

    case "AGG_LOS_ANGELES": {
      if (results.losAngelesAbrasion !== undefined) props.losAngelesAbrasion = Number(results.losAngelesAbrasion);
      else if (results.laCoefficient !== undefined) props.losAngelesAbrasion = Number(results.laCoefficient);
      break;
    }

    case "AGG_MICRO_DEVAL": {
      if (results.microDeval !== undefined) props.microDeval = Number(results.microDeval);
      else if (results.mdeCoefficient !== undefined) props.microDeval = Number(results.mdeCoefficient);
      break;
    }

    case "AGG_METHYLENE_BLUE": {
      if (results.methyleneBlue !== undefined) props.methyleneBlue = Number(results.methyleneBlue);
      if (results.clayContent !== undefined) props.clayContent = Number(results.clayContent);
      break;
    }

    case "AGG_FLAKINESS": {
      if (results.flakinessIndex !== undefined) props.flakinessIndex = Number(results.flakinessIndex);
      break;
    }

    case "AGG_BULK_DENSITY": {
      if (results.bulkDensity !== undefined) {
        const b = Number(results.bulkDensity);
        props.bulkDensity = b > 100 ? b : Math.round(b * 1000);
      }
      break;
    }

    case "CEM_SETTING_TIME": {
      if (results.initialSetting !== undefined) props.initialSetting = Number(results.initialSetting);
      if (results.finalSetting !== undefined) props.finalSetting = Number(results.finalSetting);
      break;
    }

    case "CEM_BLAINE": {
      if (results.blaineFineness !== undefined) props.blaineFineness = Number(results.blaineFineness);
      break;
    }

    case "CEM_STRENGTH": {
      if (results.strength2d !== undefined) props.strength2d = Number(results.strength2d);
      if (results.strength28d !== undefined) {
        props.strength28d = Number(results.strength28d);
        props.strengthClass = Number(results.strength28d) >= 52.5 ? "52.5" : Number(results.strength28d) >= 42.5 ? "42.5" : "32.5";
      }
      break;
    }

    case "CEM_HYDRATION_HEAT": {
      if (results.heatOfHydration !== undefined) props.heatOfHydration = Number(results.heatOfHydration);
      break;
    }

    case "ADM_SOLID_CONTENT":
    case "ADM_DENSITY":
    case "ADM_WATER_REDUCTION": {
      if (results.solidContent !== undefined) props.solidContent = Number(results.solidContent);
      if (results.waterReduction !== undefined) props.waterReduction = Number(results.waterReduction);
      if (results.recommendedDosage !== undefined) props.recommendedDosage = Number(results.recommendedDosage);
      if (results.density !== undefined) {
        const d = Number(results.density);
        props.density = d > 50 ? d : Math.round(d * 1000);
      }
      if (results.pH !== undefined) props.pH = Number(results.pH);
      if (results.chlorideContent !== undefined) props.chlorideContent = Number(results.chlorideContent);
      break;
    }

    case "SCM_POZZOLANIC_INDEX":
    case "SCM_WATER_DEMAND": {
      if (results.pozzolanicIndex !== undefined) props.pozzolanicIndex = Number(results.pozzolanicIndex);
      if (results.waterDemandFactor !== undefined) props.waterDemandFactor = Number(results.waterDemandFactor);
      if (results.blaineFineness !== undefined) props.blaineFineness = Number(results.blaineFineness);
      if (results.density !== undefined) {
        const d = Number(results.density);
        props.density = d > 100 ? d : Math.round(d * 1000);
      }
      break;
    }

    case "FIBER_DIMENSIONS":
    case "FIBER_TENSILE": {
      if (results.fiberLength !== undefined) props.fiberLength = Number(results.fiberLength);
      if (results.aspectRatio !== undefined) props.aspectRatio = Number(results.aspectRatio);
      if (results.tensileStrength !== undefined) props.tensileStrength = Number(results.tensileStrength);
      if (results.fiberType !== undefined) props.fiberType = String(results.fiberType);
      break;
    }

    case "WATER_PH":
    case "WATER_CHLORIDES":
    case "WATER_SULFATES": {
      if (results.pH !== undefined) props.pH = Number(results.pH);
      if (results.chlorides !== undefined) props.chlorides = Number(results.chlorides);
      if (results.sulfates !== undefined) props.sulfates = Number(results.sulfates);
      break;
    }
  }

  return props;
}

// ============================================================================
// APPLY TEST RECORD TO MATERIAL (SINGLE-SOURCE-OF-TRUTH ENGINE)
// ============================================================================
export interface ApplyTestResult {
  updatedMaterial: EngineeringMaterial;
  appliedProperties: string[];
  isAppliedToActiveProps: boolean;
}

/**
 * Applies a test record to an engineering material.
 * 
 * RULES ENFORCED:
 * - Only tests with approvalStatus === "Validated" will overwrite the active calculation properties on the material.
 * - Previous values are automatically archived to propertyHistory.
 * - Rich provenance metadata is saved to propertySources.
 * - Test ID is registered into material.laboratoryTests.
 */
export function applyTestToMaterial(
  material: EngineeringMaterial,
  test: MaterialTestRecord,
  explicitApprovalStatus?: TestApprovalStatus
): ApplyTestResult {
  const approvalStatus: TestApprovalStatus = explicitApprovalStatus || test.approvalStatus || "Validated";
  const isValidated = approvalStatus === "Validated";

  const extractedProps = extractPropertiesFromTest(test);
  const updatedMaterial: EngineeringMaterial = { ...material };
  
  // Initialize sources and history structures if missing
  const currentSources: Record<string, MaterialPropertySource> = { ...(updatedMaterial.propertySources || {}) };
  const currentHistory: Record<string, MaterialPropertyHistoryEntry[]> = { ...(updatedMaterial.propertyHistory || {}) };
  const currentLabTests: string[] = Array.from(new Set([...(updatedMaterial.laboratoryTests || []), test.id]));

  const appliedProperties: string[] = [];
  const nowIso = new Date().toISOString();

  Object.entries(extractedProps).forEach(([propKey, newVal]) => {
    if (newVal === undefined || newVal === null) return;

    appliedProperties.push(propKey);
    const labelInfo = PROPERTY_LABELS[propKey] || {
      ar: propKey,
      fr: propKey,
      en: propKey,
      unit: "",
      testType: test.testType
    };

    const currentVal = (updatedMaterial as any)[propKey];

    // If validated, archive old value to history if it changed or doesn't have history
    if (isValidated && currentVal !== undefined && currentVal !== null) {
      if (!currentHistory[propKey]) currentHistory[propKey] = [];
      
      const historyEntry: MaterialPropertyHistoryEntry = {
        id: `HIST-${propKey}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        propertyName: propKey,
        propertyLabelAr: labelInfo.ar,
        oldValue: currentVal,
        newValue: newVal,
        unit: labelInfo.unit,
        testId: test.id,
        testType: test.testType,
        testTitle: test.testTitleAr || test.testTitleFr || test.testType,
        sampleId: test.sampleId,
        testDate: test.date,
        operator: test.operator,
        projectName: test.projectName,
        standard: test.standard,
        approvalStatus: approvalStatus,
        isDemo: test.isDemo || isDemoTestRecord(test),
        timestamp: nowIso
      };

      currentHistory[propKey] = [historyEntry, ...currentHistory[propKey]].slice(0, 20); // Keep last 20 revisions
    }

    const isDemoRecord = test.isDemo || isDemoTestRecord(test);

    // Save/update property source metadata
    currentSources[propKey] = {
      propertyName: propKey,
      propertyLabelAr: labelInfo.ar,
      propertyLabelFr: labelInfo.fr,
      propertyLabelEn: labelInfo.en,
      value: newVal,
      unit: labelInfo.unit,
      testId: test.id,
      testType: test.testType,
      testTitle: test.testTitleAr || test.testTitleFr || test.testType,
      sampleId: test.sampleId,
      testDate: test.date,
      operator: test.operator,
      projectName: test.projectName,
      standard: test.standard,
      approvalStatus: approvalStatus,
      isValidated: isValidated,
      isDemo: isDemoRecord,
      sourceType: test.sourceType || (isDemoRecord ? "system_demo" : "user_created"),
      sourceLabel: test.sourceLabel || (isDemoRecord ? "Demo Data" : "User Test"),
      score: test.score,
      notes: test.notes,
      timestamp: nowIso
    };

    // ONLY OVERWRITE ACTIVE PROPERTY IF VALIDATED!
    if (isValidated) {
      (updatedMaterial as any)[propKey] = newVal;
    }
  });

  updatedMaterial.propertySources = currentSources;
  updatedMaterial.propertyHistory = currentHistory;
  updatedMaterial.laboratoryTests = currentLabTests;
  updatedMaterial.updatedAt = Date.now();
  updatedMaterial.updatedDate = nowIso;

  return {
    updatedMaterial,
    appliedProperties,
    isAppliedToActiveProps: isValidated
  };
}

// ============================================================================
// RECOMPUTE MATERIAL FROM MULTIPLE TESTS (LATEST VALIDATED RULE)
// ============================================================================
/**
 * Scans all tests linked to a material, resolves the latest Validated result for each property,
 * rebuilds the full audit trail, and returns a fully consolidated material entity.
 */
export function recomputeMaterialPropertiesFromTests(
  material: EngineeringMaterial,
  allTests: MaterialTestRecord[]
): EngineeringMaterial {
  // Find all tests belonging to this material
  const materialTests = allTests.filter(t => 
    t.materialId === material.id || 
    (t.materialName && t.materialName.toLowerCase() === material.name.toLowerCase()) ||
    (material.laboratoryTests && material.laboratoryTests.includes(t.id))
  );

  if (materialTests.length === 0) return material;

  // Sort tests by date ascending to replay history chronologically
  const sortedTests = [...materialTests].sort((a, b) => {
    const timeA = new Date(a.date || a.createdAt).getTime();
    const timeB = new Date(b.date || b.createdAt).getTime();
    return timeA - timeB;
  });

  let workingMaterial: EngineeringMaterial = { 
    ...material, 
    propertySources: { ...(material.propertySources || {}) },
    propertyHistory: { ...(material.propertyHistory || {}) },
    laboratoryTests: Array.from(new Set([...(material.laboratoryTests || []), ...materialTests.map(t => t.id)]))
  };

  sortedTests.forEach(test => {
    const res = applyTestToMaterial(workingMaterial, test);
    workingMaterial = res.updatedMaterial;
  });

  return workingMaterial;
}

// ============================================================================
// PROPERTY PROVENANCE INSPECTOR
// ============================================================================
export interface PropertyProvenance {
  value: any;
  isFromValidatedTest: boolean;
  sourceType: "validated_test" | "pending_test" | "draft_test" | "rejected_test" | "manual_entry" | "preset_seeded";
  source?: MaterialPropertySource;
  history: MaterialPropertyHistoryEntry[];
  badgeTextAr: string;
  badgeColor: "emerald" | "amber" | "rose" | "blue" | "slate";
}

/**
 * Returns complete provenance information for any given property on a material.
 */
export function getMaterialPropertyProvenance(
  material: EngineeringMaterial,
  propKey: string
): PropertyProvenance {
  const val = (material as any)[propKey];
  const source = material.propertySources ? material.propertySources[propKey] : undefined;
  const history = (material.propertyHistory && material.propertyHistory[propKey]) || [];

  if (source && source.isValidated) {
    const isDemo = source.isDemo || source.sourceType === "system_demo" || String(source.testId).startsWith("TEST-AGG-2026-00") || String(source.testId).startsWith("TEST-CEM-2026-00") || String(source.testId).startsWith("TEST-ADM-2026-00");
    return {
      value: val,
      isFromValidatedTest: !isDemo,
      sourceType: "validated_test",
      source,
      history,
      badgeTextAr: isDemo ? `عينة تجريبية (Demo) #${source.testId}` : `فحص مخبري معتمد #${source.testId}`,
      badgeColor: isDemo ? "amber" : "emerald"
    };
  }

  if (source && source.approvalStatus === "Pending Review") {
    return {
      value: val,
      isFromValidatedTest: false,
      sourceType: "pending_test",
      source,
      history,
      badgeTextAr: `فحص قيد المراجعة #${source.testId}`,
      badgeColor: "amber"
    };
  }

  if (source && source.approvalStatus === "Draft") {
    return {
      value: val,
      isFromValidatedTest: false,
      sourceType: "draft_test",
      source,
      history,
      badgeTextAr: `مسودة فحص #${source.testId}`,
      badgeColor: "blue"
    };
  }

  if (source && source.approvalStatus === "Rejected") {
    return {
      value: val,
      isFromValidatedTest: false,
      sourceType: "rejected_test",
      source,
      history,
      badgeTextAr: `فحص مرفوض #${source.testId}`,
      badgeColor: "rose"
    };
  }

  // Not from a test
  return {
    value: val,
    isFromValidatedTest: false,
    sourceType: material.source === "user" ? "manual_entry" : "preset_seeded",
    source: undefined,
    history,
    badgeTextAr: val !== undefined && val !== null ? "إدخال يدوي / مواصفة" : "غير متوفر",
    badgeColor: "slate"
  };
}

// ============================================================================
// MIX DESIGN REQUIRED PROPERTIES VALIDATION GATE
// ============================================================================
export interface MissingMaterialProperty {
  material: EngineeringMaterial;
  materialRole: "sand" | "gravel" | "cement" | "water" | "admixture" | "scm" | "fiber";
  property: string;
  labelAr: string;
  labelFr: string;
  testType: string;
  requiredFor: string;
  isMissing: boolean;
  isUnvalidated: boolean;
}

export interface MixPropertyCheckResult {
  isValid: boolean;
  missingProperties: MissingMaterialProperty[];
  unvalidatedProperties: MissingMaterialProperty[];
  warnings: string[];
}

/**
 * Validates that all selected materials in Mix Design possess the required engineering properties
 * according to the selected formulation method (Dreux-Gorisse, ACI 211, Baron-Ollivier, etc.).
 */
export function checkMixRequiredProperties(
  method: string,
  resolvedMaterials: {
    sand?: EngineeringMaterial | null;
    gravel?: EngineeringMaterial | null;
    cement?: EngineeringMaterial | null;
    water?: EngineeringMaterial | null;
    admixture?: EngineeringMaterial | null;
    scm?: EngineeringMaterial | null;
    fiber?: EngineeringMaterial | null;
  }
): MixPropertyCheckResult {
  const missing: MissingMaterialProperty[] = [];
  const unvalidated: MissingMaterialProperty[] = [];
  const warnings: string[] = [];

  const checkProp = (
    mat: EngineeringMaterial | null | undefined,
    role: MissingMaterialProperty["materialRole"],
    propKey: string,
    requiredFor: string,
    allowZero: boolean = false
  ) => {
    if (!mat) return;
    const val = (mat as any)[propKey];
    const label = PROPERTY_LABELS[propKey] || { ar: propKey, fr: propKey, en: propKey, testType: "LAB_TEST" };
    const source = mat.propertySources ? mat.propertySources[propKey] : undefined;

    const isMissing = val === undefined || val === null || (!allowZero && val === 0) || (Array.isArray(val) && val.length === 0);
    const isUnvalidated = !isMissing && source && !source.isValidated;

    if (isMissing) {
      missing.push({
        material: mat,
        materialRole: role,
        property: propKey,
        labelAr: label.ar,
        labelFr: label.fr,
        testType: label.testType,
        requiredFor,
        isMissing: true,
        isUnvalidated: false
      });
    } else if (isUnvalidated) {
      unvalidated.push({
        material: mat,
        materialRole: role,
        property: propKey,
        labelAr: label.ar,
        labelFr: label.fr,
        testType: label.testType,
        requiredFor,
        isMissing: false,
        isUnvalidated: true
      });
    }
  };

  const { sand, gravel, cement, water } = resolvedMaterials;

  // Common Essential Properties for all methods
  if (sand) {
    checkProp(sand, "sand", "density", "حساب الحجم المطلق للرمل", false);
    checkProp(sand, "sand", "absorption", "تصحيح ماء الامتصاص للرمل", true);
    checkProp(sand, "sand", "moisture", "تصحيح ماء الرطوبة الحرة للرمل", true);
    
    if (method === "aci" || method === "aci211") {
      checkProp(sand, "sand", "finenessModulus", "معامل النعومة لتحديد نسبة الركام الخشن في طريقة ACI", false);
    }
  }

  if (gravel) {
    checkProp(gravel, "gravel", "density", "حساب الحجم المطلق للحصى", false);
    checkProp(gravel, "gravel", "dMax", "القطر الأقصى لتحديد نقطة الانعطاف ومحتوى الماء", false);
    checkProp(gravel, "gravel", "absorption", "تصحيح ماء الامتصاص للحصى", true);
    checkProp(gravel, "gravel", "moisture", "تصحيح ماء الرطوبة الحرة للحصى", true);
  }

  if (cement) {
    checkProp(cement, "cement", "density", "حساب الحجم المطلق للإسمنت", false);
  }

  const isValid = missing.length === 0;

  return {
    isValid,
    missingProperties: missing,
    unvalidatedProperties: unvalidated,
    warnings
  };
}
