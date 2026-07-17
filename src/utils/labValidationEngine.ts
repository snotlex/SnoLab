import { MixDesignInput, MixDesignResult, LabValidationInputs } from "../types";

export interface ComparisonMetric {
  key: string;
  nameAr: string;
  nameEn: string;
  theoretical: number;
  measured: number;
  differencePercent: number; // e.g. +8 or -5
  deviation: number;         // measured - theoretical
  accuracyPercent: number;   // 0 - 100
  status: "Excellent" | "Very Good" | "Acceptable" | "Needs Investigation" | "Failed";
  compliance: "PASS" | "FAIL" | "WARNING";
  complianceAr: string;
}

export interface ValidationReport {
  score: number | null; // null represents N/A when waiting for data
  ratingAr: string;
  ratingEn: string;
  rating: "Excellent" | "Very Good" | "Acceptable" | "Needs Investigation" | "Failed" | "N/A";
  status: "PASSED" | "WARNING" | "FAILED" | "WAITING" | "PARTIAL";
  statusAr: string;
  metrics: ComparisonMetric[];
  engineeringComments: string[];
  completenessStatus: "Waiting For Laboratory Data" | "Partial Validation" | "Fully Validated";
  completenessStatusAr: string;
  numTestsFilled: number;
}

/**
 * Helper to compute average, standard deviation and coefficient of variation for a series of specimens.
 */
export function calculateSpecimenStats(specimens: number[] | undefined): {
  average: number;
  stdDev: number;
  cov: number;
} {
  const arr = (specimens || []).filter(v => typeof v === "number" && v > 0);
  if (arr.length === 0) return { average: 0, stdDev: 0, cov: 0 };
  
  const sum = arr.reduce((a, b) => a + b, 0);
  const avg = sum / arr.length;
  
  if (arr.length < 2) {
    return { average: Math.round(avg * 10) / 10, stdDev: 0, cov: 0 };
  }
  
  const sqDiffSum = arr.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0);
  const variance = sqDiffSum / (arr.length - 1); // Sample standard deviation
  const std = Math.sqrt(variance);
  const cov = avg > 0 ? (std / avg) * 100 : 0;
  
  return {
    average: Math.round(avg * 10) / 10,
    stdDev: Math.round(std * 100) / 100,
    cov: Math.round(cov * 10) / 10
  };
}

/**
 * Perform technical concrete laboratory and field performance validation.
 * Compares laboratory tests against design-time theoretical values with standard industry tolerances.
 */
export function validateLabResults(
  input: MixDesignInput,
  result: MixDesignResult,
  labInputs: LabValidationInputs,
  language: "ar" | "fr" | "en" = "ar"
): ValidationReport {
  const metrics: ComparisonMetric[] = [];
  const comments: string[] = [];

  // Helper to safely calculate difference and accuracy
  const evaluateField = (
    key: string,
    nameAr: string,
    nameEn: string,
    theoretical: number,
    measured: number,
    allowHigherNoPenalty: boolean = false,
    customTolerance: number = 0,
    type: "strength" | "density" | "slump" | "air" | "absorption" | "rcpt" | "upv" | "schmidt" | "carbonation" | "sorptivity" | "sulfate" = "strength"
  ): ComparisonMetric | null => {
    if (measured === undefined || measured === null || measured === 0) return null;

    const dev = measured - theoretical;
    let diffPct = theoretical > 0 ? (dev / theoretical) * 100 : 0;
    
    let errorPct = Math.abs(diffPct);
    if (allowHigherNoPenalty && dev > 0) {
      // Overstrength is beneficial structurally, no accuracy penalty up to 30% higher, small penalty above that to warn about cement efficiency
      errorPct = dev > theoretical * 0.30 ? (dev - theoretical * 0.30) / theoretical * 30 : 0;
    }

    // Apply custom tolerance if set
    if (customTolerance > 0 && Math.abs(dev) <= customTolerance) {
      errorPct = 0;
    }

    const accuracy = Math.max(0, Math.min(100, Math.round(100 - errorPct)));
    
    let status: "Excellent" | "Very Good" | "Acceptable" | "Needs Investigation" | "Failed";
    if (accuracy >= 92) status = "Excellent";
    else if (accuracy >= 82) status = "Very Good";
    else if (accuracy >= 70) status = "Acceptable";
    else if (accuracy >= 45) status = "Needs Investigation";
    else status = "Failed";

    // Standard structural compliance (PASS / FAIL / WARNING)
    let compliance: "PASS" | "FAIL" | "WARNING" = "PASS";
    let complianceAr = "مطابق للكود (PASS)";

    if (type === "strength") {
      if (measured < theoretical) {
        compliance = "FAIL";
        complianceAr = "غير مطابق لمقاومة الكسر المطلوب (FAIL)";
      } else if (measured > theoretical * 1.35) {
        compliance = "WARNING";
        complianceAr = "إفراط غير مبرر مقاومة شديدة (WARNING)";
      }
    } else if (type === "slump") {
      // Slump tolerances are usually +/- 20 mm
      if (Math.abs(dev) > 25) {
        compliance = "FAIL";
        complianceAr = "خارج هبوط التشغيل لليد الموقعي (FAIL)";
      } else if (Math.abs(dev) > 15) {
        compliance = "WARNING";
        complianceAr = "انحراف هبوط مقبول مشروط (WARNING)";
      }
    } else if (type === "density") {
      // ±50 kg/m³
      if (Math.abs(dev) > 75) {
        compliance = "FAIL";
        complianceAr = "خارج كثافة الصب الرطب المعيارية (FAIL)";
      } else if (Math.abs(dev) > 40) {
        compliance = "WARNING";
        complianceAr = "تذبذب ركام خفيف الكثافة (WARNING)";
      }
    } else if (type === "air") {
      if (Math.abs(dev) > 1.5) {
        compliance = "FAIL";
        complianceAr = "انحراف نسبة الهواء المحبوز مقلق (FAIL)";
      }
    } else if (type === "absorption") {
      if (measured > 4.5) {
        compliance = "FAIL";
        complianceAr = "امتصاص مائي مرتفع مسامي (FAIL)";
      } else if (measured > 4.0) {
        compliance = "WARNING";
        complianceAr = "قريب من حد الامتصاص الأقصى للكود (WARNING)";
      }
    } else if (type === "rcpt") {
      if (measured > 2000) {
        compliance = "FAIL";
        complianceAr = "نفاذية كلوريد مرتفعة رديئة (FAIL)";
      } else if (measured > 1500) {
        compliance = "WARNING";
        complianceAr = "نفاذية كلوريد متوسطة منبه لدرع الحديد (WARNING)";
      }
    } else if (type === "upv") {
      if (measured < 3500) {
        compliance = "FAIL";
        complianceAr = "سرعة UPV منخفضة فجوات وعيوب صب (FAIL)";
      } else if (measured < 3900) {
        compliance = "WARNING";
        complianceAr = "سرعة هيدروليكية متوسطة التجانس (WARNING)";
      }
    } else if (type === "schmidt") {
      if (measured < 28) {
        compliance = "FAIL";
        complianceAr = "صلادة سطحية ضعيفة ارتداد ضعيف (FAIL)";
      }
    } else if (type === "carbonation") {
      if (measured > 6.5) {
        compliance = "FAIL";
        complianceAr = "عمق كربنة مرتفع قلق للتسليح (FAIL)";
      }
    } else if (type === "sorptivity") {
      if (measured > 0.18) {
        compliance = "FAIL";
        complianceAr = "امتصاص شعري مرتفع رديء المسام (FAIL)";
      }
    }

    if (language === "fr") {
      if (compliance === "PASS") complianceAr = "Conforme aux exigences (PASS)";
      else if (type === "strength") {
        if (measured < theoretical) complianceAr = "Non conforme à la résistance requise (FAIL)";
        else if (measured > theoretical * 1.35) complianceAr = "Surrésistance excessive non justifiée (WARNING)";
      } else if (type === "slump") {
        if (Math.abs(dev) > 25) complianceAr = "Hors tolérance d'affaissement (FAIL)";
        else if (Math.abs(dev) > 15) complianceAr = "Écart d'affaissement tolérable sous réserve (WARNING)";
      } else if (type === "density") {
        if (Math.abs(dev) > 75) complianceAr = "Hors densité fraîche standard (FAIL)";
        else if (Math.abs(dev) > 40) complianceAr = "Fluctuation légère de densité (WARNING)";
      } else if (type === "air") {
        if (Math.abs(dev) > 1.5) complianceAr = "Écart de teneur en air critique (FAIL)";
      } else if (type === "absorption") {
        if (measured > 4.5) complianceAr = "Absorption d'eau trop élevée (FAIL)";
        else if (measured > 4.0) complianceAr = "Proche de la limite d'absorption (WARNING)";
      } else if (type === "rcpt") {
        if (measured > 2000) complianceAr = "Perméabilité aux chlorures élevée (FAIL)";
        else if (measured > 1500) complianceAr = "Perméabilité chlorures modérée (WARNING)";
      } else if (type === "upv") {
        if (measured < 3500) complianceAr = "Vitesse UPV trop basse, défauts de coulage (FAIL)";
        else if (measured < 3900) complianceAr = "Vitesse UPV moyenne (WARNING)";
      } else if (type === "schmidt") {
        if (measured < 28) complianceAr = "Dureté de surface faible (FAIL)";
      } else if (type === "carbonation") {
        if (measured > 6.5) complianceAr = "Profondeur de carbonatation préoccupante (FAIL)";
      } else if (type === "sorptivity") {
        if (measured > 0.18) complianceAr = "Sorptivité capillaire trop élevée (FAIL)";
      }
    } else if (language === "en") {
      if (compliance === "PASS") complianceAr = "Code Compliant (PASS)";
      else if (type === "strength") {
        if (measured < theoretical) complianceAr = "Below targeted design strength (FAIL)";
        else if (measured > theoretical * 1.35) complianceAr = "Excessive unjustified overstrength (WARNING)";
      } else if (type === "slump") {
        if (Math.abs(dev) > 25) complianceAr = "Outside fresh slump tolerance limit (FAIL)";
        else if (Math.abs(dev) > 15) complianceAr = "Conditional acceptable slump deviation (WARNING)";
      } else if (type === "density") {
        if (Math.abs(dev) > 75) complianceAr = "Outside standard wet density limits (FAIL)";
        else if (Math.abs(dev) > 40) complianceAr = "Minor aggregate density fluctuations (WARNING)";
      } else if (type === "air") {
        if (Math.abs(dev) > 1.5) complianceAr = "Air content deviation concerning (FAIL)";
      } else if (type === "absorption") {
        if (measured > 4.5) complianceAr = "High porous water absorption (FAIL)";
        else if (measured > 4.0) complianceAr = "Near standard absorption limit (WARNING)";
      } else if (type === "rcpt") {
        if (measured > 2000) complianceAr = "High poor chloride permeability (FAIL)";
        else if (measured > 1500) complianceAr = "Moderate chloride entry risk (WARNING)";
      } else if (type === "upv") {
        if (measured < 3500) complianceAr = "Low UPV speed, possible voids detected (FAIL)";
        else if (measured < 3900) complianceAr = "Average UPV speed homogeneity (WARNING)";
      } else if (type === "schmidt") {
        if (measured < 28) complianceAr = "Weak rebound surface hardness (FAIL)";
      } else if (type === "carbonation") {
        if (measured > 6.5) complianceAr = "Concerning high carbonation depth (FAIL)";
      } else if (type === "sorptivity") {
        if (measured > 0.18) complianceAr = "Poor high moisture capillary intake (FAIL)";
      }
    }

    return {
      key,
      nameAr,
      nameEn,
      theoretical: Math.round(theoretical * 100) / 100,
      measured: Math.round(measured * 100) / 100,
      differencePercent: Math.round(diffPct * 10) / 10,
      deviation: Math.round(dev * 10) / 10,
      accuracyPercent: accuracy,
      status,
      compliance,
      complianceAr
    };
  };

  // 1. Compile averages from specimens if user inputted specimen records
  const s1 = calculateSpecimenStats(labInputs.specimens1d).average || labInputs.strength1d;
  const s3 = calculateSpecimenStats(labInputs.specimens3d).average || labInputs.strength3d;
  const s7 = calculateSpecimenStats(labInputs.specimens7d).average || labInputs.strength7d;
  const s14 = calculateSpecimenStats(labInputs.specimens14d).average || labInputs.strength14d || 0;
  const s28 = calculateSpecimenStats(labInputs.specimens28d).average || labInputs.strength28d;
  const s56 = calculateSpecimenStats(labInputs.specimens56d).average || labInputs.strength56d;
  const s90 = calculateSpecimenStats(labInputs.specimens90d).average || labInputs.strength90d;

  // Let's count how many tests are filled (entered value > 0)
  const testsToCount = [
    labInputs.slump,
    labInputs.slumpFlow,
    labInputs.freshDensity,
    labInputs.airContent,
    labInputs.concreteTemp,
    labInputs.unitWeight,
    labInputs.settingTimeInitial,
    labInputs.settingTimeFinal,
    s1, s3, s7, s14, s28, s56, s90,
    labInputs.waterAbsorption,
    labInputs.sorptivity,
    labInputs.rcptCoulombs,
    labInputs.freezeThawRating,
    labInputs.carbonationDepth,
    labInputs.schmidtHammer,
    labInputs.upvSpeed,
    labInputs.coreTestResult
  ];
  const numTestsFilled = testsToCount.filter(v => typeof v === "number" && v > 0).length;

  // SECTION 1: IF NO DATA AT ALL
  if (numTestsFilled === 0) {
    return {
      score: null,
      rating: "N/A",
      ratingAr: language === "fr" ? "En attente de données" : language === "en" ? "Waiting for Data" : "بانتظار البيانات",
      ratingEn: "Waiting for Data",
      status: "WAITING",
      statusAr: language === "fr" ? "En attente des données de laboratoire (Waiting for Data)" : language === "en" ? "Waiting for Lab Data (Waiting for Data)" : "بانتظار البيانات المخبرية (Waiting for Data)",
      metrics: [],
      completenessStatus: "Waiting For Laboratory Data",
      completenessStatusAr: language === "fr" ? "En attente d'enregistrement des données de laboratoire" : language === "en" ? "Waiting for laboratory data registration" : "بانتظار تسجيل البيانات المخبرية في الورشة",
      numTestsFilled: 0,
      engineeringComments: language === "fr" ? [
        "ℹ️ Aucun résultat d'essai en laboratoire n'est enregistré pour cette formulation.",
        "Veuillez commencer à remplir les données d'affaissement ou de résistance à la compression à 7 et 28 jours pour activer le rapport de conformité interactif."
      ] : language === "en" ? [
        "ℹ️ No active laboratory test results recorded for this mix yet.",
        "Please enter actual slump or specimens' 7-day and 28-day compression strength results to start the interactive standard compliance engine."
      ] : [
        "ℹ️ لا توجد نتائج فحوصات معملية مسجلة لهذه العينة حتى الآن.",
        "الرجاء البدء في إدخال بيانات الهبوط الموقعي أو نتائج كسر عينات 7 أيام و28 يوماً لبدء تفعيل محرك التحقق والمطابقة التفاعلي للكود الدولي ومقارنتها بتصميم خلطة SNO AI."
      ]
    };
  }

  // Define Vital Tests for Full Competancy
  // For full validation, we require at least: slump, fresh density, and 28-day strength
  const hasSlump = labInputs.slump > 0;
  const hasDensity = labInputs.freshDensity > 0 || (labInputs.unitWeight && labInputs.unitWeight > 0);
  const hasStrength28d = s28 > 0;
  const hasDurability = (labInputs.waterAbsorption && labInputs.waterAbsorption > 0) || (labInputs.rcptCoulombs && labInputs.rcptCoulombs > 0);
  
  const isFullyValidated = hasSlump && hasDensity && hasStrength28d && hasDurability;
  const completenessStatus = isFullyValidated ? "Fully Validated" : "Partial Validation";
  const completenessStatusAr = isFullyValidated 
    ? (language === "fr" ? "Validation complète de conformité (Fully Validated)" : language === "en" ? "Full Standard Validation (Fully Validated)" : "مكتملة المطابقة والتحقق بالكامل (Fully Validated)") 
    : (language === "fr" ? "Validation partielle - Non-conformité aux normes (Partial Validation)" : language === "en" ? "Partial standard validation (Partial Validation)" : "مطابقة مخبرية جزئية - تفتقر لبعض متطلبات الكود (Partial Validation)");

  // Evaluate fields and gather into metrics
  // FRESH STATE
  const theoreticalSlump = input.slump * 10; // database cm to mm
  const slumpMetric = evaluateField("slump", "هبوط مخروط أبرامز", "Abrams Slump Test", theoreticalSlump, labInputs.slump, false, 15, "slump");
  if (slumpMetric) metrics.push(slumpMetric);

  const flowMetric = evaluateField("slumpFlow", "تدفق هبوط الخرسانة", "Slump Flow Test", input.slump >= 18 ? 550 : 0, labInputs.slumpFlow, false, 50, "slump");
  if (flowMetric && labInputs.slumpFlow > 0) metrics.push(flowMetric);

  const theoreticalDensity = result.totalFreshDensity || 2400;
  const densityMetric = evaluateField("freshDensity", "الكثافة الرطبة للخلطة", "Fresh Wet Density", theoreticalDensity, labInputs.freshDensity, false, 50, "density");
  if (densityMetric) metrics.push(densityMetric);

  const unitWeightMetric = evaluateField("unitWeight", "الوزن الحجمي للخرسانة", "Fresh Unit Weight", theoreticalDensity, labInputs.unitWeight || 0, false, 50, "density");
  if (unitWeightMetric && (labInputs.unitWeight || 0) > 0) metrics.push(unitWeightMetric);

  const theoreticalAir = input.airContent || 1.5;
  const airMetric = evaluateField("airContent", "نسبة الهواء المحبوز الفعلي", "Fresh Air Content", theoreticalAir, labInputs.airContent, false, 1, "air");
  if (airMetric) metrics.push(airMetric);

  const concreteTempMetric = evaluateField("concreteTemp", "درجة حرارة الصب بالموقع", "Concrete Temperature", 23, labInputs.concreteTemp, false, 5, "density");
  if (concreteTempMetric && labInputs.concreteTemp > 0) metrics.push(concreteTempMetric);

  // HARDENED STRENGTH
  const targetFcm28 = result.fcm28 || (input.fck28 + 8.5);
  const targetFcm1 = targetFcm28 * 0.30;
  const targetFcm3 = targetFcm28 * 0.45;
  const targetFcm7 = targetFcm28 * 0.70;
  const targetFcm14 = targetFcm28 * 0.85;
  const targetFcm56 = targetFcm28 * 1.10;
  const targetFcm90 = targetFcm28 * 1.15;

  const m1 = evaluateField("strength1d", "مقاومة الضغط عمر يوم واحد", "1-Day Compressive Strength", targetFcm1, s1, true, 0, "strength");
  if (m1 && s1 > 0) metrics.push(m1);

  const m3 = evaluateField("strength3d", "مقاومة الضغط عمر 3 أيام", "3-Day Compressive Strength", targetFcm3, s3, true, 0, "strength");
  if (m3 && s3 > 0) metrics.push(m3);

  const m7 = evaluateField("strength7d", "مقاومة الضغط عمر 7 أيام", "7-Day Compressive Strength", targetFcm7, s7, true, 0, "strength");
  if (m7 && s7 > 0) metrics.push(m7);

  const m14 = evaluateField("strength14d", "مقاومة الضغط عمر 14 يوماً", "14-Day Compressive Strength", targetFcm14, s14, true, 0, "strength");
  if (m14 && s14 > 0) metrics.push(m14);

  const m28 = evaluateField("strength28d", "مقاومة الضغط الفعالة 28 يوماً (fcm)", "28-Day Compressive Strength", targetFcm28, s28, true, 0, "strength");
  if (m28 && s28 > 0) metrics.push(m28);

  const m56 = evaluateField("strength56d", "مقاومة الضغط بعمر 56 يوماً", "56-Day Compressive Strength", targetFcm56, s56, true, 0, "strength");
  if (m56 && s56 > 0) metrics.push(m56);

  const m90 = evaluateField("strength90d", "مقاومة الضغط بعمر 90 يوماً", "90-Day Compressive Strength", targetFcm90, s90, true, 0, "strength");
  if (m90 && s90 > 0) metrics.push(m90);

  // DURABILITY
  const absorpMetric = evaluateField("waterAbsorption", "امتصاص الماء للكتلة الخرسانية", "Water Absorption", 4.0, labInputs.waterAbsorption || 0, false, 0, "absorption");
  if (absorpMetric && (labInputs.waterAbsorption || 0) > 0) metrics.push(absorpMetric);

  const sorpMetric = evaluateField("sorptivity", "معامل الامتصاصية الشعرية", "Sorptivity Index", 0.15, labInputs.sorptivity || 0, false, 0, "sorptivity");
  if (sorpMetric && (labInputs.sorptivity || 0) > 0) metrics.push(sorpMetric);

  const rcptMetric = evaluateField("rcptCoulombs", "فحص نفاذية شحنات الكلوريد RCPT", "Chloride Permeability RCPT", 1500, labInputs.rcptCoulombs || 0, false, 0, "rcpt");
  if (rcptMetric && (labInputs.rcptCoulombs || 0) > 0) metrics.push(rcptMetric);

  const freezeMetric = evaluateField("freezeThawRating", "عامل تجمد وذوبان الخرسانة", "Freeze-Thaw Resistance", 90, labInputs.freezeThawRating || 0, true, 0, "strength");
  if (freezeMetric && (labInputs.freezeThawRating || 0) > 0) metrics.push(freezeMetric);

  const carbMetric = evaluateField("carbonationDepth", "عمق الكربنة وتغلغل ثاني أكسيد الكربون", "Carbonation Depth", 5.0, labInputs.carbonationDepth || 0, false, 0, "carbonation");
  if (carbMetric && (labInputs.carbonationDepth || 0) > 0) metrics.push(carbMetric);

  // NDT FIELD TESTS
  const schmidtMetric = evaluateField("schmidtHammer", "مطرقة شميت الارتدادية موقعياً", "Schmidt Hammer Rebound", 35, labInputs.schmidtHammer || 0, true, 0, "schmidt");
  if (schmidtMetric && (labInputs.schmidtHammer || 0) > 0) metrics.push(schmidtMetric);

  const upvMetric = evaluateField("upvSpeed", "سرعة الموجات فوق الصوتية UPV موقعاً", "Ultrasonic Pulse Velocity", 4000, labInputs.upvSpeed || 0, true, 0, "upv");
  if (upvMetric && (labInputs.upvSpeed || 0) > 0) metrics.push(upvMetric);

  const coreMetric = evaluateField("coreTestResult", "فحص الالباب المستخرجة موقعياً", "Core Test Strength", input.fck28 * 0.85, labInputs.coreTestResult || 0, true, 0, "strength");
  if (coreMetric && (labInputs.coreTestResult || 0) > 0) metrics.push(coreMetric);

  // CALCULATE WEIGHTED ACCURACY SCORE FROM ACTIVE METRICS
  let weightedSum = 0;
  let weightsAllocated = 0;

  metrics.forEach(m => {
    let w = 10;
    if (m.key === "strength28d") w = 45;
    else if (m.key === "strength7d") w = 15;
    else if (m.key === "slump") w = 15;
    else if (m.key === "freshDensity") w = 10;
    else if (m.key === "waterAbsorption") w = 15;
    else if (m.key === "rcptCoulombs") w = 15;
    
    weightedSum += m.accuracyPercent * w;
    weightsAllocated += w;
  });

  const finalScore = weightsAllocated > 0 ? Math.round(weightedSum / weightsAllocated) : 100;

  // Compile final grade and response
  let rating: "Excellent" | "Very Good" | "Acceptable" | "Needs Investigation" | "Failed" = "Acceptable";
  let ratingAr = "مقبول";
  let ratingEn = "Acceptable";
  let status: "PASSED" | "WARNING" | "FAILED" = "PASSED";
  let statusAr = "مطابقة ومعتمدة وصالحة للاستخدام (PASSED)";

  if (finalScore >= 95) {
    rating = "Excellent";
    ratingEn = "Excellent";
    status = "PASSED";
    if (language === "fr") {
      ratingAr = "Excellent (Excellent)";
      statusAr = "Validation Excellente Confirmée (PASSED)";
    } else if (language === "en") {
      ratingAr = "Excellent (Excellent)";
      statusAr = "Excellent Standard Compliance (PASSED)";
    } else {
      ratingAr = "ممتاز ومطابق للمواصفات بحرفية عالية (Excellent)";
      statusAr = "مطابقة ممتازة وفائقة الجودة (PASSED)";
    }
  } else if (finalScore >= 85) {
    rating = "Very Good";
    ratingEn = "Very Good";
    status = "PASSED";
    if (language === "fr") {
      ratingAr = "Très Bon (Very Good)";
      statusAr = "Conforme aux Normes Techniques (PASSED)";
    } else if (language === "en") {
      ratingAr = "Very Good (Very Good)";
      statusAr = "Highly Code Compliant (PASSED)";
    } else {
      ratingAr = "جيد جداً ومطابق للمواصفات الفنية (Very Good)";
      statusAr = "مطابقة تامة وموثقة معملياً (PASSED)";
    }
  } else if (finalScore >= 70) {
    rating = "Acceptable";
    ratingEn = "Acceptable";
    status = "WARNING";
    if (language === "fr") {
      ratingAr = "Acceptable (Acceptable)";
      statusAr = "Approbation conditionnelle avec suivi (WARNING)";
    } else if (language === "en") {
      ratingAr = "Acceptable (Acceptable)";
      statusAr = "Conditional approval with observation (WARNING)";
    } else {
      ratingAr = "مقبول وضمن الحدود الهندسية للكود العربي والمحلي (Acceptable)";
      statusAr = "موافقة مشروطة مع الملاحظة والمتابعة (WARNING)";
    }
  } else if (finalScore >= 45) {
    rating = "Needs Investigation";
    ratingEn = "Needs Investigation";
    status = "WARNING";
    if (language === "fr") {
      ratingAr = "Nécessite une investigation (Investigation)";
      statusAr = "Avertissement: Qualité vacillante (WARNING)";
    } else if (language === "en") {
      ratingAr = "Needs Investigation (Investigation)";
      statusAr = "Warning: Fluctuating quality (WARNING)";
    } else {
      ratingAr = "تحت المراجعة والتقصي الفني ويتجزأ فيه الخلل (Investigation)";
      statusAr = "تحذير: جودة متذبذبة تحتاج لمشرف فني (WARNING)";
    }
  } else {
    rating = "Failed";
    ratingEn = "Failed";
    status = "FAILED";
    if (language === "fr") {
      ratingAr = "Rejeté - Non conforme (Failed)";
      statusAr = "Échec mécanique, formule rejetée (FAILED)";
    } else if (language === "en") {
      ratingAr = "Failed - Non compliant (Failed)";
      statusAr = "Mechanical failure, mix rejected (FAILED)";
    } else {
      ratingAr = "مرفوضة وغير مطابقة لشروط الأمان الميكانيكي (Failed)";
      statusAr = "فشلت الخلطة هندسياً ومرفوض صبها كلياً (FAILED)";
    }
  }

  // --- AUTOMATIC ENGINEERING INTERPRETATION AND RULE-BASED ENGINE (SECTION 3) ---
  
  // 1. 28d strength evaluation
  if (s28 > 0) {
    const devPct = ((s28 - targetFcm28) / targetFcm28) * 100;
    if (s28 >= targetFcm28) {
      if (language === "fr") {
        comments.push(`✔ La résistance finale à 28 jours a atteint (${s28} MPa), dépassant en toute sécurité la résistance moyenne fcm de (+${devPct.toFixed(1)}%). Cela confirme une sécurité structurelle totale.`);
      } else if (language === "en") {
        comments.push(`✔ The final compressive strength at 28 days reached (${s28} MPa), safely exceeding the target average strength fcm by (+${devPct.toFixed(1)}%). This confirms complete structural safety.`);
      } else {
        comments.push(`✔ المقاومة النهائية المقاسة بعمر 28 يوماً بلغت (${s28} MPa) متجاوزة المقاومة المتوسطة المستهدفة fcm بصورة آمنة بنسبة (+${devPct.toFixed(1)}%). هذا يؤكد الأمان الهيكلي التام للمنشأ.`);
      }
    } else if (s28 >= input.fck28) {
      if (language === "fr") {
        comments.push(`⚠️ La résistance à 28 jours a atteint (${s28} MPa), légèrement supérieure à fc28 de calcul (${input.fck28} MPa) mais inférieure à la cible fcm (${targetFcm28.toFixed(1)} MPa) de (${devPct.toFixed(1)}%). La marge de sécurité est très étroite.`);
      } else if (language === "en") {
        comments.push(`⚠️ Compressive strength at 28 days reached (${s28} MPa), slightly above the specified design fck (${input.fck28} MPa) but lower than target fcm (${targetFcm28.toFixed(1)} MPa) by (${devPct.toFixed(1)}%). The statistical safety margin is very narrow.`);
      } else {
        comments.push(`⚠️ المقاومة المقاسة بعمر 28 يوماً بلغت (${s28} MPa) وهي تفوق رتبة التصميم المميزة المطلوبة fck (${input.fck28} MPa) بمقدار ضئيل لكنها تقل عن المقاومة المستهدفة المخبرية fcm (${targetFcm28.toFixed(1)} MPa) بنسبة (${devPct.toFixed(1)}%). هامش الأمان الإحصائي ضيق جداً.`);
      }
    } else {
      if (language === "fr") {
        comments.push(`❌ Rupture mécanique critique : La résistance à 28 jours de (${s28} MPa) est inférieure à fc28 exigée (${input.fck28} MPa) de (${Math.abs(devPct).toFixed(1)}%). Ce béton est rejeté selon la norme EN206. Essai de carottage immédiat recommandé.`);
      } else if (language === "en") {
        comments.push(`❌ Critical mechanical failure: Compressive strength at 28 days is (${s28} MPa), which is lower than specified design fck (${input.fck28} MPa) by (${Math.abs(devPct).toFixed(1)}%). This concrete is structurally rejected according to EN206 standards. Immediate Core Test is highly recommended.`);
      } else {
        comments.push(`❌ فشل ميكانيكي حرج: مقاومة الضغط لـ 28 يوم بلغت (${s28} MPa) وهو ما يقل عن رتبة التصميم المميزة المطلوبة fck (${input.fck28} MPa) بنسبة خسارة واضحة (${Math.abs(devPct).toFixed(1)}%). هذه الخرسانة مرفوضة إنشائياً كلياً طبقاً للمواصفة EN206 والمقاييس المحلية لخطورة الانهيار، وينصح بإجراء فحص القلب الخرساني Core Test فوراُ.`);
      }
    }
  }

  // 2. EN 206 General Compliance Rule
  if (isFullyValidated) {
    const allPass = metrics.every(m => m.compliance !== "FAIL");
    if (allPass) {
      if (language === "fr") {
        comments.push("✔ La formule est entièrement conforme aux exigences de la norme européenne EN 206.");
      } else if (language === "en") {
        comments.push("✔ The mix complies with all requirements of the European standard EN 206.");
      } else {
        comments.push("✔ الخلطة مطابقة لجميع متطلبات الكود الأوروبي والمحلي EN 206 والمقاييس العربية المعتمدة للسلامة الدورية.");
      }
    } else {
      if (language === "fr") {
        comments.push("⚠️ La formule présente des écarts ou non-conformités empêchant une validation complète selon la norme EN 206.");
      } else if (language === "en") {
        comments.push("⚠️ The mix fails full EN 206 compliance due to significant deviations or failures in certain technical quality tests.");
      } else {
        comments.push("⚠️ الخلطة تفتقر لمطابقة تامة لبنود EN 206 نتيجة لوجود فشل أو انحرافات حادة في بعض فحوصات الجودة الفنية.");
      }
    }
  }

  // 3. Absorption limits
  if (labInputs.waterAbsorption > 0) {
    if (labInputs.waterAbsorption > 4.2) {
      if (language === "fr") {
        comments.push(`❌ L'absorption d'eau de (${labInputs.waterAbsorption}%) est élevée, dépassant les limites de la norme. Cela affecte la durabilité.`);
      } else if (language === "en") {
        comments.push(`❌ Measured water absorption of (${labInputs.waterAbsorption}%) is high, exceeding standard limits. This may harm long-term durability.`);
      } else {
        comments.push(`❌ الامتصاص الفعلي سجل (${labInputs.waterAbsorption}%) وهو مرتفع ويتعدى الحد الأقصى للمقاييس السليمة، مما قد يؤثر سلبياً على متانة الخرسانة طويلة المدى ويجعلها عرضة للرطوبة وتغلغل الأملاح والأمطار المحيطة.`);
      }
    } else {
      if (language === "fr") {
        comments.push(`✔ L'absorption d'eau est de (${labInputs.waterAbsorption}%), ce qui est conforme et indique une porosité saine.`);
      } else if (language === "en") {
        comments.push(`✔ Water absorption is within acceptable range at (${labInputs.waterAbsorption}%), indicating good compaction.`);
      } else {
        comments.push(`✔ سجل امتصاص الماء قيمة سليمة ومقبولة هندسياً بلغت (${labInputs.waterAbsorption}%) مما يعكس كثافة رص الخرسانة وجودة الهيكل الفراغي للركام.`);
      }
    }
  }

  // 4. Chloride penetration (RCPT)
  if (labInputs.rcptCoulombs && labInputs.rcptCoulombs > 0) {
    if (labInputs.rcptCoulombs < 1000) {
      if (language === "fr") {
        comments.push(`✔ La perméabilité aux chlorures RCPT (${labInputs.rcptCoulombs} C) est très faible, assurant une excellente protection contre la corrosion.`);
      } else if (language === "en") {
        comments.push(`✔ Chloride permeability RCPT value is very low (${labInputs.rcptCoulombs} Coulombs), showing excellent steel corrosion resistance.`);
      } else {
        comments.push(`✔ نتائج فحص نفاذية الكلوريدات RCPT بلغت (${labInputs.rcptCoulombs} Coulombs) وهي قيمة منخفضة للغاية تدل على مقاومة ممتازة لصدأ حديد التسليح وديمومة استثنائية في الأوساط البحرية.`);
      }
    } else if (labInputs.rcptCoulombs <= 2000) {
      if (language === "fr") {
        comments.push(`✔ La perméabilité RCPT est faible (${labInputs.rcptCoulombs} C), conforme aux exigences d'exposition modérée.`);
      } else if (language === "en") {
        comments.push(`✔ RCPT results are safe and indicate low chloride permeability (${labInputs.rcptCoulombs} Coulombs).`);
      } else {
        comments.push(`✔ نتائج RCPT ممتازة وتدل على نفاذية منخفضة للكلوريدات (${labInputs.rcptCoulombs} Coulombs) وضمن المسموح به للمنشآت متوسطة التعرض.`);
      }
    } else {
      if (language === "fr") {
        comments.push(`⚠️ La perméabilité RCPT de (${labInputs.rcptCoulombs} C) est élevée, ce qui présente un risque de corrosion des armatures.`);
      } else if (language === "en") {
        comments.push(`⚠️ Chloride RCPT value is relatively high (${labInputs.rcptCoulombs} Coulombs), indicating moderate to high chloride entry risk.`);
      } else {
        comments.push(`⚠️ فحص الكلوريدات RCPT مرتفع نسبياً والبالغ (${labInputs.rcptCoulombs} Coulombs)، مما يشير لنفاذية كلوريدات عالية ترفع من معدل تآكل قضبان التسليح في البيئة الرطبة.`);
      }
    }
  }

  // 5. Ultrasonic pulse velocity (UPV)
  if (labInputs.upvSpeed && labInputs.upvSpeed > 0) {
    if (labInputs.upvSpeed >= 4000) {
      if (language === "fr") {
        comments.push(`✔ Vitesse UPV de (${labInputs.upvSpeed} m/s), démontrant une excellente uniformité structurelle.`);
      } else if (language === "en") {
        comments.push(`✔ Ultrasonic pulse velocity UPV reached (${labInputs.upvSpeed} m/s), proving excellent concrete uniformity.`);
      } else {
        comments.push(`✔ نتائج سرعة الموجات فوق الصوتية UPV بلغت (${labInputs.upvSpeed} m/s) مما يبرهن على خرسانة عالية التجانس (Excellent Uniformity) خالية تماماً من المسامات والتعشيش الكامن.`);
      }
    } else if (labInputs.upvSpeed >= 3500) {
      if (language === "fr") {
        comments.push(`✔ Vitesse UPV de (${labInputs.upvSpeed} m/s), indiquant une homogénéité acceptable.`);
      } else if (language === "en") {
        comments.push(`✔ Ultrasonic pulse velocity UPV is (${labInputs.upvSpeed} m/s), indicating acceptable concrete homogeneity.`);
      } else {
        comments.push(`✔ سرعة الموجات فوق الصوتية UPV بلغت (${labInputs.upvSpeed} m/s)، وهي تدل على تجانس مقبول للخرسانة الموقعية وجودة صب مرضية.`);
      }
    } else {
      if (language === "fr") {
        comments.push(`⚠️ Vitesse UPV faible (${labInputs.upvSpeed} m/s), ce qui suggère de possibles vides internes ou de la porosité.`);
      } else if (language === "en") {
        comments.push(`⚠️ Ultrasonic pulse velocity UPV is low (${labInputs.upvSpeed} m/s), signaling potential micro-cracks or excessive porosity.`);
      } else {
        comments.push(`⚠️ سرعة الموجات UPV منخفضة (${labInputs.upvSpeed} m/s)، هذا يدل على وجود شروخ شعرية، أو عيوب صب داخلية، أو مسامية مفرطة تسبب تشتت الترددات الصوتية.`);
      }
    }
  }

  // 6. Schmidt Hammer rebound value
  if (labInputs.schmidtHammer && labInputs.schmidtHammer > 0) {
    if (labInputs.schmidtHammer >= 35) {
      if (language === "fr") {
        comments.push(`✔ L'essai au scléromètre (Schmidt) indique un rebond de (${labInputs.schmidtHammer}), garantissant une bonne dureté de surface.`);
      } else if (language === "en") {
        comments.push(`✔ Schmidt hammer rebound recorded an excellent average of (${labInputs.schmidtHammer}), proving safe surface hardness.`);
      } else {
        comments.push(`✔ اختبار صلادة السطح بمطرقة شميت سجل متوسط ارتداد ممتاز قدره (${labInputs.schmidtHammer}) مما يدعم قوة القشرة السطحية ومقاومة التآكل الفيزيائي.`);
      }
    } else if (labInputs.schmidtHammer < 28) {
      if (language === "fr") {
        comments.push(`⚠️ La valeur au scléromètre de (${labInputs.schmidtHammer}) est faible, suggérant une cure insuffisante de la surface.`);
      } else if (language === "en") {
        comments.push(`⚠️ Rebound hardness of (${labInputs.schmidtHammer}) is low, suggesting possible premature drying or insufficient curing.`);
      } else {
        comments.push(`⚠️ صلابة السطح بمطرقة شميت منخفضة (${labInputs.schmidtHammer})، يخشى من حدوث جفاف مبكر للخرسانة أو عدم إنضاجها بالرش بالماء الكافي مما خلف معجون إيدي متبخر سريعاً.`);
      }
    }
  }

  // 7. Sorptivity
  if (labInputs.sorptivity && labInputs.sorptivity > 0) {
    if (labInputs.sorptivity <= 0.12) {
      if (language === "fr") {
        comments.push(`✔ Sorptivité capillaire à l'humidité faible (${labInputs.sorptivity} mm/min⁰.⁵), confirmant un bon scellement.`);
      } else if (language === "en") {
        comments.push(`✔ Moisture capillary sorptivity is low and safe (${labInputs.sorptivity} mm/min⁰.⁵), confirming strong hydraulic sealing.`);
      } else {
        comments.push(`✔ معامل الامتصاصية الشعرية للرطوبة منخفض وجيد (${labInputs.sorptivity} mm/min⁰.⁵)، مما يؤكد الإقفال الهايدروليكي للشرايين المسامية للخرسانة.`);
      }
    } else {
      if (language === "fr") {
        comments.push(`⚠️ La sorptivité capillaire dépasse les limites, ce qui indique des pores interconnectés.`);
      } else if (language === "en") {
        comments.push(`⚠️ Moisture capillary sorptivity exceeds standard limits, suggesting interconnected capillary pore channels.`);
      } else {
        comments.push(`⚠️ معامل الامتصاصية الشعرية يتجاوز الحدود المستهدفة للمتانة الفعالة مما يدل على وجود قنوات شعرية متكاملة للرطوبة.`);
      }
    }
  }

  // 8. Carbonation
  if (labInputs.carbonationDepth && labInputs.carbonationDepth > 0) {
    if (labInputs.carbonationDepth <= 3.0) {
      if (language === "fr") {
        comments.push(`✔ Profondeur de carbonatation de (${labInputs.carbonationDepth} mm), conservant une alcalinité protectrice.`);
      } else if (language === "en") {
        comments.push(`✔ Air carbonation depth is highly restricted and safe (${labInputs.carbonationDepth} mm), preserving high alkalinity.`);
      } else {
        comments.push(`✔ عمق كربنة الهواء مقيد وضمن حيز آمن للغاية (${labInputs.carbonationDepth} mm) وتأثير قلوي طبيعي لحماية الغلاف الخارجي للحديد.`);
      }
    } else {
      if (language === "fr") {
        comments.push(`⚠️ Profondeur de carbonatation importante (${labInputs.carbonationDepth} mm), risque de carbonatation réduisant l'alcalinité.`);
      } else if (language === "en") {
        comments.push(`⚠️ Measured carbonation depth is high (${labInputs.carbonationDepth} mm), which likely reduces concrete alkalinity.`);
      } else {
        comments.push(`⚠️ عمق كربنة الخرسانة سجل نسبة مرتفعة (${labInputs.carbonationDepth} mm)، يرجح تفاعل ثاني أكسيد الكربون مع هيدروكسيد الكالسيوم مما يفقد البنية القلوية الحامية للحديد.`);
      }
    }
  }

  // 9. Curing and strength development
  if (s7 > 0 && s28 > 0 && s28 < s7 * 1.08) {
    if (language === "fr") {
      comments.push("⚠️ Évolution de résistance inquiétante : Le taux de gain entre 7 et 28 jours est anormalement bas, cure insuffisante possible.");
    } else if (language === "en") {
      comments.push("⚠️ Worrisome curing index: Compressive strength development rate between 7 and 28 days is extremely low, likely due to premature drying.");
    } else {
      comments.push(
        "⚠️ مؤشر معالجة للمكعبات مقلق: معدل نمو المقاومة بين عينات 7 أيام وعمر 28 يوماً منخفض جداً، يرجح جفاف عينات الاختبار مبكراً بالتخزين خارج حوض المعالجة المثالي بالماء."
      );
    }
  }

  // 10. Specimen standard deviation
  const s28Stats = calculateSpecimenStats(labInputs.specimens28d);
  if (s28Stats.cov > 10) {
    if (language === "fr") {
      comments.push(`📊 Le coefficient de variation à 28 jours est élevé (${s28Stats.cov}%), dépassant le seuil de 10%, suggérant une hétérogénéité des éprouvettes.`);
    } else if (language === "en") {
      comments.push(`📊 The coefficient of variation for 28-day breaks is high at (${s28Stats.cov}%), exceeding standard threshold (10%). This points to sub-optimal sample preparation.`);
    } else {
      comments.push(
        `📊 معامل الاختلاف لكسر عينات عمر 28 يوماً مرتفع ويساوي (${s28Stats.cov}%) وهو ما يتجاوز الحد القياسي للمطابقة المخبرية (10%)، مما يدل على رداءة ضبط جودة تحضير العينات أو عدم تماثل حمولة المكبس المخبري.`
      );
    }
  }

  if (comments.length === 0) {
    if (language === "fr") {
      comments.push("✔ La formule est excellente, conforme et s'inscrit pleinement dans les tolérances.");
    } else if (language === "en") {
      comments.push("✔ The concrete mix is excellent, compliant, and within safe statistical tolerances.");
    } else {
      comments.push("✔ الخلطة ممتازة ومطابقة وضمن الحدود الإحصائية الآمنة.");
    }
  }

  return {
    score: finalScore,
    rating,
    ratingAr,
    ratingEn,
    status,
    statusAr,
    metrics,
    engineeringComments: comments,
    completenessStatus,
    completenessStatusAr,
    numTestsFilled
  };
}
