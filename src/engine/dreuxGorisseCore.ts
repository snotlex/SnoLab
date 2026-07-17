import { MixDesignInput, MixDesignResult, SievePoint, AggregateType, AggregateQuality } from "../types";
import { LIMITS } from "./constants";
import { validateMixInputs } from "./validateInputs";
import { calculateCosting } from "./costing";
import { validateMixDesign } from "./validation/mixValidation";
import { checkMaterialSuitability } from "./suitabilityGate";
import { DREUX_KNOWLEDGE_BASE } from "./dreuxKnowledgeBase";

/**
 * Highly polished, professional single source of truth for the Georges Dreux-Gorisse method.
 * Conforms entirely to EN 206 limits, absolute volume stability, and moisture physics.
 */
export function calculateDreuxGorisseCore(input: MixDesignInput, language: "ar" | "fr" | "en" = "ar"): MixDesignResult & { 
  valid: boolean; 
  isValid: boolean; 
  errors: string[]; 
  warnings: string[];
  designWater: number;
  effectiveWater: number;
  aggregateFreeWater: number;
  batchWaterToAdd: number;
  waterCementRatio: number;
  waterBinderRatio: number;
  calculationMode: "strengthBased" | "manualWBR";
  costBreakdown: any[];
  totalCost: number;
  cementitiousMaterials: {
    cement: number;
    flyAsh: number;
    slag: number;
    silicaFume: number;
  };
  totalBinder: number;
} {
  const steps: string[] = [];
  const localWarnings: string[] = [];
  let weightSpecialBinder = 0;
  let specialBinderVolume = 0;

  // --- Active Materials & Concrete-Type Suitability Gate ---
  const suitability = checkMaterialSuitability(input, input.materialsDatabase || []);
  if (suitability.status === "diagnostic_only") {
    suitability.status = "blocked";
  }
  if (suitability.status === "blocked") {
    return {
      valid: false,
      isValid: false,
      errors: [
        language === "fr" ? "Veuillez entrer les matériaux du projet dans le dépôt avant de lancer le calcul." :
        language === "en" ? "Please enter the project materials in the repository before running the calculation." :
        "يرجى إدخال مواد المشروع في المستودع قبل تشغيل الحساب."
      ],
      warnings: suitability.warnings || [],
      fcm28: 0,
      stdDev: 0,
      wcRatio: 0,
      wcRatioAdjusted: 0,
      dreuxAggregateFactor: 0,
      compactorGamma: 0,
      cementWeight: 0,
      waterContentNeeded: 0,
      waterContentActual: 0,
      sandPercent: 0,
      gravelPercent: 0,
      sandWeightDry: 0,
      gravelWeightDry: 0,
      admixtureWeights: [],
      sandWeightWet: 0,
      gravelWeightWet: 0,
      waterWeightWet: 0,
      totalFreshDensity: 0,
      waterBeforeCorrection: 0,
      waterAfterDmax: 0,
      waterFromAdmixtures: 0,
      totalAggregateVolume: 0,
      pivotPoint: { x: 0, y: 0 },
      gradingCurve: [],
      detailedSteps: [
        language === "fr" ? "Erreur : Matériaux du projet manquants ou invalides dans le dépôt." :
        language === "en" ? "Error: Missing or invalid project materials in the repository." :
        "يرجى إدخال مواد المشروع في المستودع قبل تشغيل الحساب."
      ],
      strengthEvolution: [],
      standardsCompliance: [],
      designWater: 0,
      effectiveWater: 0,
      aggregateFreeWater: 0,
      batchWaterToAdd: 0,
      waterCementRatio: 0,
      waterBinderRatio: 0,
      calculationMode: input.internalWcOverride ? "manualWBR" : "strengthBased",
      costBreakdown: [],
      totalCost: 0,
      cementitiousMaterials: { cement: 0, flyAsh: 0, slag: 0, silicaFume: 0 },
      totalBinder: 0,
      materialSuitability: suitability
    };
  }

  // Step 0: Input Pre-checks
  const valRes = validateMixInputs(input, language);
  if (input.fck28 === undefined || input.fck28 <= 0) {
    return {
      valid: false,
      isValid: false,
      errors: valRes.errors.length > 0 ? valRes.errors : [
        language === "fr" ? "Résistance de formulation fck28 invalide." :
        language === "en" ? "Characteristic concrete strength fck28 is invalid." :
        "مقاومة الضغط للخرسانة fck28 غير منطقية."
      ],
      warnings: valRes.warnings,
      fcm28: 0,
      stdDev: 0,
      wcRatio: 0,
      wcRatioAdjusted: 0,
      dreuxAggregateFactor: 0,
      compactorGamma: 0,
      cementWeight: 0,
      waterContentNeeded: 0,
      waterContentActual: 0,
      sandPercent: 0,
      gravelPercent: 0,
      sandWeightDry: 0,
      gravelWeightDry: 0,
      admixtureWeights: [],
      sandWeightWet: 0,
      gravelWeightWet: 0,
      waterWeightWet: 0,
      totalFreshDensity: 0,
      waterBeforeCorrection: 0,
      waterAfterDmax: 0,
      waterFromAdmixtures: 0,
      totalAggregateVolume: 0,
      pivotPoint: { x: 0, y: 0 },
      gradingCurve: [],
      detailedSteps: [
        language === "fr" ? "Erreur : Résistance d'entrée invalide." :
        language === "en" ? "Error: Invalid entry strength." :
        "خطأ: المقاومة المدخلة غير صالحة."
      ],
      strengthEvolution: [],
      standardsCompliance: [],
      designWater: 0,
      effectiveWater: 0,
      aggregateFreeWater: 0,
      batchWaterToAdd: 0,
      waterCementRatio: 0,
      waterBinderRatio: 0,
      calculationMode: input.internalWcOverride ? "manualWBR" : "strengthBased",
      costBreakdown: [],
      totalCost: 0,
      cementitiousMaterials: { cement: 0, flyAsh: 0, slag: 0, silicaFume: 0 },
      totalBinder: 0
    };
  }

  const fck28 = input.fck28;
  const controlClass = input.controlClass;
  const cementClassStrength = input.cementClassStrength;
  const dMax = input.dMax;
  const slump = input.slump;
  const aggregateType = input.aggregateType;
  const aggregateQuality = input.aggregateQuality;
  const hasPumping = !!input.hasPumping;
  const sandRelativeDensity = input.sandRelativeDensity;
  let gravelRelativeDensity = input.gravelRelativeDensity;
  const cementDensity = input.cementDensity !== undefined ? input.cementDensity : DREUX_KNOWLEDGE_BASE.validationLimits.cementDensityDefaultKgM3;
  let airContent = input.airContent !== undefined ? input.airContent : 0.0;
  
  const moistureSand = input.moistureSand !== undefined ? input.moistureSand : 0;
  let moistureGravel = input.moistureGravel !== undefined ? input.moistureGravel : 0;

  // Material calculation overrides
  if (input.selectedLightweightAggregateId) {
    if (input.lightweightAggregateDensity !== undefined) {
      gravelRelativeDensity = input.lightweightAggregateDensity;
    }
    if (input.lightweightAggregateMoisture !== undefined) {
      moistureGravel = input.lightweightAggregateMoisture;
    }
  } else if (input.selectedHeavyweightAggregateId) {
    if (input.heavyweightAggregateDensity !== undefined) {
      gravelRelativeDensity = input.heavyweightAggregateDensity;
    }
    if (input.heavyweightAggregateMoisture !== undefined) {
      moistureGravel = input.heavyweightAggregateMoisture;
    }
  }

  if (input.selectedAirPercentage !== undefined && input.selectedAirPercentage > 0) {
    airContent = input.selectedAirPercentage;
  }
  
  const dosageSuper = input.dosageSuper !== undefined ? input.dosageSuper : 0;
  const dosageAir = input.dosageAir !== undefined ? input.dosageAir : 0;
  const dosageRetarder = input.dosageRetarder !== undefined ? input.dosageRetarder : 0;
  const dosageAccelerator = input.dosageAccelerator !== undefined ? input.dosageAccelerator : 0;
  const dosageSilicaFume = input.dosageSilicaFume !== undefined ? input.dosageSilicaFume : 0;
  const dosageFlyAsh = input.dosageFlyAsh !== undefined ? input.dosageFlyAsh : 0;
  const dosageSlag = input.dosageSlag !== undefined ? input.dosageSlag : 0;

  const exposureClass = input.exposureClass || "X0";

  // 1. Target Mean Strength ($f_{cm28}$)
  const stdDevTable = DREUX_KNOWLEDGE_BASE.lookupTables.standardDeviation.data;
  let stdDev = stdDevTable.normal;
  if (controlClass === "high") {
    stdDev = stdDevTable.high;
  } else if (controlClass === "low") {
    stdDev = stdDevTable.low;
  }
  const fcm28 = fck28 + 1.64 * stdDev;

  steps.push(`الخطوة 1: حساب المقاومة المتوسطة المستهدفة (Target Mean Compressive Strength fcm)`);
  steps.push(`• المقاومة المميزة المطلوبة fck = ${fck28} MPa.`);
  steps.push(`• الانحراف المعياري المعتمد كودياً σ = ${stdDev} MPa.`);
  steps.push(`• fcm28 = ${fck28} + 1.64 × ${stdDev} = ${fcm28.toFixed(2)} MPa.`);

  // 2. Georges Dreux Parameter (G)
  const typeStr = String(aggregateType).toLowerCase();
  const qualityStr = String(aggregateQuality).toLowerCase();
  const isRounded = typeStr === "roule" || typeStr === "roulé";

  const gData = DREUX_KNOWLEDGE_BASE.lookupTables.dreuxAggregateFactorG.data;
  const gCategory = isRounded ? gData.rounded : gData.crushed;
  let dreuxAggregateFactor = 0.50;
  
  const qKey = qualityStr === "excellent" ? "excellent" : qualityStr === "standard" ? "standard" : "poor";
  
  if (dMax <= gCategory.small.limit) {
    dreuxAggregateFactor = gCategory.small[qKey];
  } else if (dMax <= gCategory.medium.limit) {
    dreuxAggregateFactor = gCategory.medium[qKey];
  } else {
    dreuxAggregateFactor = gCategory.large[qKey];
  }

  steps.push(`الخطوة 2: حساب معامل الركام لدروكس (Georges Dreux Parameter - G)`);
  steps.push(`• صنف الركام: ${isRounded ? "طبيعي مستدير (Roulé)" : "مكسر كسارات (Concassé)"}.`);
  steps.push(`• المعامل الحبيبي المعتمد G = ${dreuxAggregateFactor.toFixed(2)}.`);

  // 3. Theoretical Water-to-Cement Ratio (W/C)
  const fce = cementClassStrength * 1.1; 
  const cwRatio = (fcm28 / (dreuxAggregateFactor * fce)) + 0.5;
  const wcRatio = 1 / cwRatio;

  steps.push(`الخطوة 3: حساب نسبة الماء إلى الإسمنت الأصلية (Theoretical W/C Ratio)`);
  steps.push(`• المقاومة الفعلية التقريبية للإسمنت fce = ${fce.toFixed(1)} MPa.`);
  steps.push(`• نسبة E/C (W/C) النظرية الأصلية = ${wcRatio.toFixed(3)}.`);

  // 4. Base Water (W_0) & Slump adjustments
  const waterData = DREUX_KNOWLEDGE_BASE.lookupTables.baseWaterDemand.data;
  let baseWater = 140;
  for (const entry of waterData) {
    if (dMax <= entry.dMaxLimit) {
      baseWater = entry.water;
      break;
    }
  }

  const slumpData = DREUX_KNOWLEDGE_BASE.lookupTables.slumpCorrectionFactor.data;
  let slumpCorrectionFactor = 1.10;
  for (const entry of slumpData) {
    if (slump <= entry.slumpLimit) {
      slumpCorrectionFactor = entry.factor;
      break;
    }
  }

  const waterContentNeeded = baseWater * slumpCorrectionFactor;

  // Water Reduction due to Admixtures
  let directSuperReduction = dosageSuper * 18;
  if (
    input.selectedAdmixtureWaterReduction !== undefined &&
    input.selectedAdmixtureWaterReduction !== null &&
    !isNaN(input.selectedAdmixtureWaterReduction)
  ) {
    directSuperReduction = Math.min(35, Math.max(0, input.selectedAdmixtureWaterReduction));
  }
  const directAirReduction = dosageAir * 4;
  const flyAshWaterReduction = dosageFlyAsh * 0.3;
  const silicaWaterIncrease = dosageSilicaFume > 0 && dosageSuper === 0 ? dosageSilicaFume * 1.5 : 0;
  
  const totalWaterReductionPercent = Math.max(0, Math.min(35, directSuperReduction + directAirReduction + flyAshWaterReduction - silicaWaterIncrease));
  
  // designWater represents the target effective water after chemical water reduction
  const designWater = waterContentNeeded * (1 - totalWaterReductionPercent / 100);
  const effectiveWater = designWater; // Effective water matching designWater

  steps.push(`الخطوة 4: تحديد كمية ماء خلط التصميم وتأثير الملدنات (Water Content & Chemical Reduction)`);
  steps.push(`• كمية المياه المرجعية الصافية لـ Dmax هو ${baseWater} لتر.`);
  steps.push(`• كمية ماء التصميم النظري (designWater) = ${designWater.toFixed(1)} لتر/م³.`);

  // 5. Cement & SCM content calculations
  const calculationMode = input.internalWcOverride ? "manualWBR" : "strengthBased";
  let wcRatioAdjusted = wcRatio;
  if (calculationMode === "manualWBR") {
    wcRatioAdjusted = input.internalWcOverride!;
    steps.push(`• صنف تشغيل يدعم تجاوز W/C يدوياً: تم تشغيل manualWBR بقيمة ${wcRatioAdjusted.toFixed(3)}.`);
  }

  let cementWeight = effectiveWater / wcRatioAdjusted;
  let weightSilicaFume = 0;
  let weightFlyAsh = 0;
  let weightSlag = 0;
  let activeCementWeight = 0;

  if (input.concreteType === "GPC") {
    // Geopolymer Cementless Concrete: 100% cementless, relies entirely on alternative binders
    cementWeight = 0;
    activeCementWeight = 0;
    
    // Total binder weight is determined by water/binder ratio
    const totalBinderWeight = effectiveWater / wcRatioAdjusted;
    
    const sumDosage = dosageFlyAsh + dosageSlag;
    if (sumDosage > 0) {
      weightFlyAsh = totalBinderWeight * (dosageFlyAsh / sumDosage);
      weightSlag = totalBinderWeight * (dosageSlag / sumDosage);
    } else {
      // Default to 50% Fly Ash and 50% Slag if user has not specified dosages
      weightFlyAsh = totalBinderWeight * 0.5;
      weightSlag = totalBinderWeight * 0.5;
    }
    weightSilicaFume = totalBinderWeight * (dosageSilicaFume / 100);
    steps.push(`• خرسانة جيوبوليمرية خالية تماماً من الإسمنت (GPC): تم تصفير الإسمنت واستخدام الروابط البديلة بوزن كلي ${totalBinderWeight.toFixed(1)} كجم/م³ (خبث: ${weightSlag.toFixed(1)} كجم/م³، رماد متطاير: ${weightFlyAsh.toFixed(1)} كجم/م³).`);
  } else {
    const isHighStrengthType = ["HSC", "HPC", "UHPC", "BFUP"].includes((input.concreteType || "").toUpperCase());
    const maxCementWeight = isHighStrengthType ? 1000 : 550;
    if (cementWeight > maxCementWeight) {
      cementWeight = maxCementWeight;
      localWarnings.push(
        language === "ar"
          ? `وزن الإسمنت المحسوب تجاوز الحد الأقصى لخرسانة ${(input.concreteType || "")}، وتم تقييده عند ${maxCementWeight} كجم/م³ لتفادي الانكماش الزائد.`
          : `Theoretical cement demand exceeds the limit for ${(input.concreteType || "")} and was capped at ${maxCementWeight} kg/m³.`
      );
    }

    weightSilicaFume = cementWeight * (dosageSilicaFume / 100);
    weightFlyAsh = cementWeight * (dosageFlyAsh / 100);
    weightSlag = cementWeight * (dosageSlag / 100);

    activeCementWeight = cementWeight;
    if (dosageFlyAsh > 0 || dosageSlag > 0) {
      const flyAshReplacementRatio = 0.8;
      const slagReplacementRatio = 0.5;
      activeCementWeight = cementWeight - (weightFlyAsh * flyAshReplacementRatio) - (weightSlag * slagReplacementRatio);
    }
  }

  // Special Binder Calculations
  const specialBinderReplacementPercent = input.specialBinderReplacementPercent !== undefined ? input.specialBinderReplacementPercent : 0;
  const specialBinderDensity = input.specialBinderDensity || 0;

  if (specialBinderReplacementPercent > 0) {
    if (specialBinderDensity <= 0) {
      localWarnings.push(
        language === "fr" ? "Erreur : La densité du liant spécial n'est pas renseignée." :
        language === "en" ? "Error: Special binder density is not provided." :
        "خطأ: كثافة الرابط الخاص غير متوفرة أو تساوي صفرًا."
      );
    }
    weightSpecialBinder = activeCementWeight * (specialBinderReplacementPercent / 100);
    activeCementWeight = activeCementWeight - weightSpecialBinder;
    specialBinderVolume = specialBinderDensity > 0 ? weightSpecialBinder / (specialBinderDensity / 1000) : 0;
  }

  // Material warnings
  if (input.selectedSpecialBinderId) {
    localWarnings.push(
      language === "fr" ? "Avertissement : Le liant spécial sélectionné sort du cadre classique des hypothèses de Dreux-Gorisse." :
      language === "en" ? "Warning: The selected special binder is outside the standard Dreux-Gorisse model assumptions." :
      "تنبيه: المجلد الخاص المحدد يقع خارج فرضيات طريقة درو-غوريس القياسية."
    );
  }

  const vLimits = DREUX_KNOWLEDGE_BASE.validationLimits;

  if (input.selectedWaterPH !== undefined) {
    if (input.selectedWaterPH < vLimits.waterPHRange.min || input.selectedWaterPH > vLimits.waterPHRange.max) {
      localWarnings.push(
        language === "fr" ? `Avertissement : Le pH de l'eau (${input.selectedWaterPH}) est en dehors de la plage de sécurité (${vLimits.waterPHRange.min} - ${vLimits.waterPHRange.max}).` :
        language === "en" ? `Warning: Water pH (${input.selectedWaterPH}) is outside the safe range (${vLimits.waterPHRange.min} - ${vLimits.waterPHRange.max}).` :
        `تنبيه: درجة حموضة ماء الخلط (${input.selectedWaterPH}) خارج النطاق الآمن الموصى به (${vLimits.waterPHRange.min} - ${vLimits.waterPHRange.max}).`
      );
    }
  }
  if (input.selectedWaterChlorideContent !== undefined && input.selectedWaterChlorideContent > vLimits.maxWaterChloridePpm) {
    localWarnings.push(
      language === "fr" ? `Avertissement : La teneur en chlorures de l'eau (${input.selectedWaterChlorideContent} ppm) dépasse la limite de sécurité de ${vLimits.maxWaterChloridePpm} ppm.` :
      language === "en" ? `Warning: Water chloride content (${input.selectedWaterChlorideContent} ppm) exceeds the safe limit of ${vLimits.maxWaterChloridePpm} ppm.` :
      `تنبيه: محتوى الكلوريدات في ماء الخلط (${input.selectedWaterChlorideContent} ppm) يتجاوز الحد الآمن المسموح به (${vLimits.maxWaterChloridePpm} ppm) للخرسانة المسلحة.`
    );
  }
  if (input.selectedWaterSulphateContent !== undefined && input.selectedWaterSulphateContent > vLimits.maxWaterSulphatePpm) {
    localWarnings.push(
      language === "fr" ? `Avertissement : La teneur en sulfates de l'eau (${input.selectedWaterSulphateContent} ppm) dépasse la limite de sécurité de ${vLimits.maxWaterSulphatePpm} ppm.` :
      language === "en" ? `Warning: Water sulphate content (${input.selectedWaterSulphateContent} ppm) exceeds the safe limit of ${vLimits.maxWaterSulphatePpm} ppm.` :
      `تنبيه: محتوى الكبريتات في ماء الخلط (${input.selectedWaterSulphateContent} ppm) يتجاوز الحد الآمن المسموح به (${vLimits.maxWaterSulphatePpm} ppm) لمنع التآكل الكبريتي المتأخر.`
    );
  }

  const fiberDosageKgM3 = input.fiberDosageKgM3 !== undefined ? input.fiberDosageKgM3 : 0;
  if (fiberDosageKgM3 > vLimits.highFiberDosageThresholdKgM3) {
    localWarnings.push(
      language === "fr" ? `Avertissement : Un dosage élevé de fibres (${fiberDosageKgM3} kg/m³) réduit considérablement l'ouvrabilité du béton. Ajustement d'adjuvant conseillé.` :
      language === "en" ? `Warning: High fiber dosage (${fiberDosageKgM3} kg/m³) significantly reduces concrete workability. Admixture adjustment is advised.` :
      `تنبيه: جرعة الألياف العالية (${fiberDosageKgM3} كجم/م³) تقلل من قابلية تشغيل الخرسانة وانسيابيتها، ينصح بزيادة جرعة الملدن الفائق لتجنب التعشيش.`
    );
  }

  // Enforce minimum cementitious binder (using validationLimits constant)
  const currentTotalBinder = activeCementWeight + weightFlyAsh + weightSlag + weightSilicaFume + weightSpecialBinder;
  if (currentTotalBinder < vLimits.minBinderContentKgM3) {
    const diff = vLimits.minBinderContentKgM3 - currentTotalBinder;
    activeCementWeight += diff;
    localWarnings.push(`محتوى المواد الإسمنتية الكلي بالخلطة ارتفع تلقائياً لمتطلبات الحد الأدنى الكودي وهو ${vLimits.minBinderContentKgM3} كجم/م³.`);
  }

  const cementitiousBinder = activeCementWeight + weightSpecialBinder;
  const totalBinder = activeCementWeight + weightFlyAsh + weightSlag + weightSilicaFume + weightSpecialBinder;
  const waterCementRatio = effectiveWater / cementitiousBinder;
  const waterBinderRatio = effectiveWater / totalBinder;

  steps.push(`الخطوة 5: حساب وزن الإسمنت والروابط المعدنية البوزولانية (Cementitious Materials Proportions)`);
  steps.push(`• الإسمنت الصافي الفعلي المخلوط للصب = ${activeCementWeight.toFixed(1)} كجم/م³.`);
  steps.push(`• كمية المواد الرابطة الكلية (Total Binder) = ${totalBinder.toFixed(1)} كجم/م³.`);
  steps.push(`• نسبة W/C الفعلية = ${waterCementRatio.toFixed(3)}.`);
  steps.push(`• نسبة W/B (الماء/المواد الرابطة الإجمالية) = ${waterBinderRatio.toFixed(3)}.`);

  // 6. Compactness factor Gamma & packingFactor incorporation
  const compactnessData = DREUX_KNOWLEDGE_BASE.lookupTables.compactnessGamma0.data;
  let compactorGamma0 = 0.85;
  for (const entry of compactnessData) {
    if (dMax <= entry.dMaxLimit) {
      compactorGamma0 = entry.gamma;
      break;
    }
  }

  const slumpCompData = DREUX_KNOWLEDGE_BASE.lookupTables.slumpCompacityAdjustment.data;
  let slumpCompacityAdj = -0.02;
  for (const entry of slumpCompData) {
    if (slump <= entry.slumpLimit) {
      slumpCompacityAdj = entry.adjustment;
      break;
    }
  }

  const shapeCompData = DREUX_KNOWLEDGE_BASE.lookupTables.shapeCompacityAdjustment.data;
  const shapeCompacityAdj = isRounded ? shapeCompData.rounded : shapeCompData.crushed;
  let compactorGamma = compactorGamma0 + slumpCompacityAdj + shapeCompacityAdj;
  
  const compactorDefault = compactorGamma;
  if (input.packingFactor !== undefined && input.packingFactor > 0) {
    compactorGamma = input.packingFactor;
  }

  const packingDelta = compactorGamma - compactorDefault;

  steps.push(`الخطوة 6: حساب معامل الرص والارتصاص للمزيج (Compaction γ & Packing Factor)`);
  steps.push(`• معامل الرص المعتمد بالمعادلات γ = ${compactorGamma.toFixed(3)}.`);

  // 7. SCM and Aggregates Absolute volume calculations
  const cDensityL = cementDensity > 100 ? cementDensity / 1000 : cementDensity;
  const sDensityL = sandRelativeDensity > 10 ? sandRelativeDensity / 1000 : sandRelativeDensity;
  const gDensityL = gravelRelativeDensity > 10 ? gravelRelativeDensity / 1000 : gravelRelativeDensity;

  const cementVolume = activeCementWeight / cDensityL;

  // SCM densities - use mapped selectedScmDensity if available or look up from knowledge base
  const scmDensityL = (input.selectedScmDensity !== undefined && input.selectedScmDensity > 0) ? (input.selectedScmDensity / 1000) : null;
  const scmDefaultDensities = DREUX_KNOWLEDGE_BASE.lookupTables.scmDefaultDensities.data;
  const silicaDensityL = (scmDensityL && dosageSilicaFume > 0) ? scmDensityL : scmDefaultDensities.silicaFume / 1000;
  const flyAshDensityL = (scmDensityL && dosageFlyAsh > 0) ? scmDensityL : scmDefaultDensities.flyAsh / 1000;
  const slagDensityL = (scmDensityL && dosageSlag > 0) ? scmDensityL : scmDefaultDensities.slag / 1000;

  const silicaVolume = weightSilicaFume / silicaDensityL;
  const flyAshVolume = weightFlyAsh / flyAshDensityL;
  const slagVolume = weightSlag / slagDensityL;
  const airVolume = 1000 * (airContent / 100);

  // Liquid admixture weight & approximate volume
  const admixtureWeights: { admixtureId: string; name: string; weight: number }[] = [];
  if (dosageSuper > 0) {
    admixtureWeights.push({
      admixtureId: "super",
      name: "ملدن فائق المدى (Superplasticizer)",
      weight: activeCementWeight * (dosageSuper / 100)
    });
  }
  if (dosageAir > 0) {
    admixtureWeights.push({
      admixtureId: "air",
      name: "حابس هواء (Air Entrainer)",
      weight: activeCementWeight * (dosageAir / 100)
    });
  }
  if (dosageRetarder > 0) {
    admixtureWeights.push({
      admixtureId: "retarder",
      name: "مؤخر الشك (Retarder)",
      weight: activeCementWeight * (dosageRetarder / 100)
    });
  }
  if (dosageAccelerator > 0) {
    admixtureWeights.push({
      admixtureId: "accelerator",
      name: "مسرع الشك (Accelerator)",
      weight: activeCementWeight * (dosageAccelerator / 100)
    });
  }

  const admixWeightsTotal = admixtureWeights.reduce((s, a) => s + a.weight, 0);
  const admixDensity = (input.selectedAdmixtureDensity !== undefined && input.selectedAdmixtureDensity > 0) ? (input.selectedAdmixtureDensity / 1000) : 1.15;
  const admixVolume = admixWeightsTotal / admixDensity;

  // Fiber Volume
  const fiberDensity = input.fiberDensity !== undefined ? input.fiberDensity : 7850;
  const fiberDensityL = fiberDensity / 1000;
  const fiberVolume = fiberDosageKgM3 > 0 ? (fiberDosageKgM3 / fiberDensityL) : 0;

  // Aggregate Absolute Volume required to secure 1000 Liters (1 m³) of concrete
  const aggregateAbsoluteVolume = 1000 - cementVolume - silicaVolume - flyAshVolume - slagVolume - effectiveWater - airVolume - admixVolume - fiberVolume - specialBinderVolume;

  let isVolumeFailed = false;
  if (aggregateAbsoluteVolume < 100) {
    isVolumeFailed = true;
  }

  // 8. Pivot point and aggregate distribution (incorporating Solution B packing delta influence!)
  const pivotX = dMax <= 12.5 ? 5 : (dMax / 2);
  const k0Data = DREUX_KNOWLEDGE_BASE.lookupTables.baseGranularConstantK0.data;
  const k0List = isRounded ? k0Data.rounded : k0Data.crushed;
  let kBase = isRounded ? 4 : 8;
  for (const entry of k0List) {
    if (dMax <= entry.dMaxLimit) {
      kBase = entry.k;
      break;
    }
  }

  const kCement = (cementWeight - 350) / 10;
  const kPumping = hasPumping ? 5 : 0;
  const K = kBase + kCement + kPumping;

  let pivotY = 50 - Math.sqrt(dMax) + K;
  
  // Solution B: higher packing density limits aggregate gaps, shrinking required sand content!
  pivotY = pivotY - (packingDelta * 40);

  if (pivotY < 20) pivotY = 20;
  if (pivotY > 70) pivotY = 70;

  const sandPercent = input.isGranularOptimizedApproved && input.approvedSandPercent !== undefined
    ? input.approvedSandPercent
    : pivotY;
  const gravelPercent = input.isGranularOptimizedApproved && input.approvedGravelPercent !== undefined
    ? input.approvedGravelPercent
    : 100 - sandPercent;

  const safeAggAbsVolume = Math.max(150, aggregateAbsoluteVolume);
  const sandWeightDry = safeAggAbsVolume * (sandPercent / 100) * sDensityL;
  const gravelWeightDry = safeAggAbsVolume * (gravelPercent / 100) * gDensityL;

  steps.push(`الخطوة 7: فرز الركام المطلق وحساب الأوزان الجافة (Aggregate Split & Specific Dry Weights)`);
  steps.push(`• نسبة الرمل الحجمية للخلط = ${sandPercent.toFixed(1)}%.`);
  steps.push(`• وزن الرمل الجاف الفعلي المحسوب = ${sandWeightDry.toFixed(1)} كجم/م³.`);
  steps.push(`• وزن الحصى الجاف الفعلي المحسوب = ${gravelWeightDry.toFixed(1)} كجم/م³.`);
  if (fiberDosageKgM3 > 0) {
    steps.push(`• إضافة الألياف للخلطة بجرعة = ${fiberDosageKgM3.toFixed(1)} كجم/م³ (الطول = ${input.fiberLengthMm || 0} مم، القطر = ${input.fiberDiameterMm || 0} مم، الكثافة = ${fiberDensity} كجم/م³).`);
  }
  if (weightSpecialBinder > 0) {
    steps.push(`• إضافة المجلد الخاص للخلطة بجرعة استبدال = ${specialBinderReplacementPercent}% (الوزن = ${weightSpecialBinder.toFixed(1)} كجم/م³، الكثافة = ${specialBinderDensity} كجم/م³).`);
  }

  // 9. Moisture Contributions and Free-Water SSD Corrections
  const sandAbs = input.sandAbsorption !== undefined ? input.sandAbsorption : 1.5;
  let gravelAbs = input.gravelAbsorption !== undefined ? input.gravelAbsorption : 0.8;
  if (input.selectedLightweightAggregateId && input.lightweightAggregateAbsorption !== undefined) {
    gravelAbs = input.lightweightAggregateAbsorption;
  } else if (input.selectedHeavyweightAggregateId && input.heavyweightAggregateAbsorption !== undefined) {
    gravelAbs = input.heavyweightAggregateAbsorption;
  }

  // Wet aggregate weights based on total moisture content
  const sandWeightWet = sandWeightDry * (1 + moistureSand / 100);
  const gravelWeightWet = gravelWeightDry * (1 + moistureGravel / 100);

  // Total moisture water inside aggregates
  const sandTotalMoistureWater = sandWeightDry * moistureSand / 100;
  const gravelTotalMoistureWater = gravelWeightDry * moistureGravel / 100;
  const totalAggregateMoistureWater = sandTotalMoistureWater + gravelTotalMoistureWater;

  // Absorption water inside aggregates
  const sandAbsorptionWater = sandWeightDry * sandAbs / 100;
  const gravelAbsorptionWater = gravelWeightDry * gravelAbs / 100;
  const totalAbsorptionWater = sandAbsorptionWater + gravelAbsorptionWater;

  // Free surface water
  const sandFreeSurfaceWater = sandWeightDry * Math.max(0, moistureSand - sandAbs) / 100;
  const gravelFreeSurfaceWater = gravelWeightDry * Math.max(0, moistureGravel - gravelAbs) / 100;
  const totalFreeSurfaceWater = sandFreeSurfaceWater + gravelFreeSurfaceWater;

  // Absorption Deficits
  const sandAbsorptionDeficit = moistureSand < sandAbs ? sandWeightDry * (sandAbs - moistureSand) / 100 : 0;
  const gravelAbsorptionDeficit = moistureGravel < gravelAbs ? gravelWeightDry * (gravelAbs - moistureGravel) / 100 : 0;
  const totalAbsorptionDeficit = sandAbsorptionDeficit + gravelAbsorptionDeficit;

  // Final water to add (actual mixer volume addition)
  const waterToAdd = Math.max(0, effectiveWater - totalFreeSurfaceWater + totalAbsorptionDeficit);
  const batchWaterToAdd = waterToAdd;

  // Legacy mappings for backward compatibility
  const sandMoistureWater = sandTotalMoistureWater;
  const gravelMoistureWater = gravelTotalMoistureWater;
  const aggregateFreeWater = totalFreeSurfaceWater - totalAbsorptionDeficit;

  // Warning when waterToAdd is extremely low or moisture exceeds capacity
  if (waterToAdd <= 0 && (moistureSand > 0 || moistureGravel > 0)) {
    localWarnings.push("تنبيه: رطوبة الركام أكبر من ماء التصميم المطلوب. لا تضف ماءً قبل مراجعة الرطوبة أو تعديل الخلطة.");
  }

  // Warning when moisture is not entered
  if (moistureSand === 0 && moistureGravel === 0) {
    localWarnings.push("تنبيه: لم يتم إدخال رطوبة الركام. النتائج مبنية على أوزان جافة وقد لا تمثل حالة الورشة.");
  }

  // Non-warning informative notes of the mix design calculations
  const notes: string[] = [];
  const costBasisValue = input.costBasis || "wet";
  if (costBasisValue === "wet") {
    notes.push("ملاحظة: تم حساب كلفة الرمل والحصى حسب الوزن الرطب المستلم.");
  } else {
    notes.push("ملاحظة: تم حساب كلفة الرمل والحصى حسب الوزن الجاف التصميمي.");
  }

  steps.push(`الخطوة 8: تصحيح أوزان المواد لمستويات الرطوبة الحقلية (Moisture Corrections)`);
  steps.push(`• الرمل: الرطوبة = ${moistureSand}%، الامتصاص = ${sandAbs}%.`);
  steps.push(`• الحصى: الرطوبة = ${moistureGravel}%، الامتصاص = ${gravelAbs}%.`);
  steps.push(`• الماء الحر القادم من رطوبة الركامات والرمال الكلية (aggregateFreeWater) = ${aggregateFreeWater.toFixed(1)} لتر.`);
  steps.push(`• كمية المياه الفعلية المضاف للمخلط (batchWaterToAdd) = ${batchWaterToAdd.toFixed(1)} لتر/م³.`);

  // Fresh concrete state densities (retains flawless conservation: Dry density + Free contribution)
  const totalFreshDensity = activeCementWeight + weightSilicaFume + weightFlyAsh + weightSlag +
                            sandWeightDry + gravelWeightDry + effectiveWater + admixWeightsTotal +
                            fiberDosageKgM3 + weightSpecialBinder;

  // 10. Strength curves age evolution (C1E standard)
  const strength3 = fck28 * (3 / (4 + 0.85 * 3));
  const strength7 = fck28 * (7 / (4.2 + 0.83 * 7));
  const strength14 = fck28 * (14 / (4.5 + 0.81 * 14));
  const strength28 = fck28;
  const strength90 = fck28 * 1.15;

  const strengthEvolution = [
    { age: 3, strength: Math.round(strength3 * 10) / 10 },
    { age: 7, strength: Math.round(strength7 * 10) / 10 },
    { age: 14, strength: Math.round(strength14 * 10) / 10 },
    { age: 28, strength: Math.round(strength28 * 10) / 10 },
    { age: 90, strength: Math.round(strength90 * 10) / 10 }
  ];

  // 11. Grading Sieve Plots
  const sieveList = [0.08, 0.125, 0.25, 0.5, 1.0, 2.0, 4.0, 5.0, 8.0, 10.0, 12.5, 16.0, 20.0, 25.0, 31.5, 40.0, 50.0, 63.0, 80.0];
  const activeSieves = sieveList.filter(size => size <= dMax);
  if (!activeSieves.includes(pivotX)) activeSieves.push(pivotX);
  if (!activeSieves.includes(dMax)) activeSieves.push(dMax);
  activeSieves.sort((a, b) => a - b);

  const gradingCurve: SievePoint[] = activeSieves.map(size => {
    let passing = 0;
    if (size <= 0.08) passing = 0;
    else if (size === pivotX) passing = pivotY;
    else if (size === dMax) passing = 100;
    else if (size < pivotX) {
      const log08 = Math.log10(0.08);
      const logPivot = Math.log10(pivotX);
      const logCurr = Math.log10(size);
      passing = ((logCurr - log08) / (logPivot - log08)) * pivotY;
    } else {
      const logPivot = Math.log10(pivotX);
      const logMax = Math.log10(dMax);
      const logCurr = Math.log10(size);
      passing = pivotY + ((logCurr - logPivot) / (logMax - logPivot)) * (100 - pivotY);
    }
    return {
      size,
      targetPassing: Math.max(0, Math.min(100, Math.round(passing * 10) / 10))
    };
  });

  // Calculate pricing through costing.ts helper
  const prices = {
    priceCement: input.priceCement !== undefined ? input.priceCement : 17,
    priceSand: input.priceSand !== undefined ? input.priceSand : 2.5,
    priceGravel: input.priceGravel !== undefined ? input.priceGravel : 2.8,
    priceSuper: input.priceSuper !== undefined ? input.priceSuper : 120,
    priceAir: input.priceAir !== undefined ? input.priceAir : 95,
    priceRetarder: input.priceRetarder !== undefined ? input.priceRetarder : 85,
    priceAccelerator: input.priceAccelerator !== undefined ? input.priceAccelerator : 110,
    priceSilicaFume: input.priceSilicaFume !== undefined ? input.priceSilicaFume : 60,
    priceFlyAsh: input.priceFlyAsh !== undefined ? input.priceFlyAsh : 35,
    priceSlag: input.priceSlag !== undefined ? input.priceSlag : 30,
    priceLabor: input.priceLabor !== undefined ? input.priceLabor : 0,
    priceWater: input.priceWater !== undefined ? input.priceWater : 0,
    priceFiber: input.priceFiber !== undefined ? input.priceFiber : 0,
    priceSpecialBinder: input.priceSpecialBinder !== undefined ? input.priceSpecialBinder : 0
  };

  const costing = calculateCosting({
    cementKg: activeCementWeight,
    flyAshKg: weightFlyAsh,
    slagKg: weightSlag,
    silicaFumeKg: weightSilicaFume,
    sandDryKg: sandWeightDry,
    gravelDryKg: gravelWeightDry,
    sandWetKg: sandWeightWet,
    gravelWetKg: gravelWeightWet,
    costBasis: input.costBasis || "wet",
    batchWaterLiters: batchWaterToAdd,
    admixtureWeights,
    fiberKg: fiberDosageKgM3,
    specialBinderKg: weightSpecialBinder,
    prices
  });

  // Intermediate adapter to fuel compliance engine perfectly
  const temporaryMapResult = {
    cementKg: activeCementWeight,
    waterKg: effectiveWater,
    fineAggregateKg: sandWeightDry,
    coarseAggregateKg: gravelWeightDry,
    admixtureKg: admixWeightsTotal,
    wcRatio: waterBinderRatio,
    totalFreshDensity,
    waterWeightWet: batchWaterToAdd,
    standardsCompliance: [],
    flyAshKg: weightFlyAsh,
    slagKg: weightSlag,
    silicaFumeKg: weightSilicaFume,
    totalBinder: totalBinder,
    activeCementWeight: activeCementWeight,
    cementWeight: cementWeight,
  };

  const valChecks = validateMixDesign(input, temporaryMapResult);

  // --- TRANSLATION HELPERS FOR DYNAMIC I18N CORE ---
  const COMPLIANCE_LABELS: Record<string, { ar: string; fr: string; en: string }> = {
    volumeClosure: {
      ar: "الإغلاق الحجمي (Volume Closure)",
      fr: "Fermeture volumétrique (Volume Closure)",
      en: "Volume Closure"
    },
    wcRatio: {
      ar: "نسبة الماء إلى الإسمنت (W/C)",
      fr: "Rapport Eau/Ciment (W/C)",
      en: "Water/Cement Ratio (W/C)"
    },
    cementContent: {
      ar: "محتوى الإسمنت (Cement Content)",
      fr: "Dosage en ciment (Cement Content)",
      en: "Cement Content"
    },
    waterContent: {
      ar: "محتوى ماء الخلط (Water Content)",
      fr: "Dosage en eau de gâchée (Water Content)",
      en: "Mixing Water Content"
    },
    freshDensity: {
      ar: "الكثافة الطازجة للخرسانة (Fresh Density)",
      fr: "Masse volumique du béton frais (Fresh Density)",
      en: "Fresh Concrete Density"
    },
    aggregateMoisture: {
      ar: "رطوبة الركام وتصحيح SSD (Aggregate Moisture)",
      fr: "Correction d'humidité des granulats (Aggregate Moisture)",
      en: "Aggregate Moisture & SSD Correction"
    },
    admixtureDosage: {
      ar: "جرعة الملدنات الكيميائية (Admixture Dosage)",
      fr: "Dosage des adjuvants (Admixture Dosage)",
      en: "Chemical Admixture Dosage"
    },
    workability: {
      ar: "تشغيلية وقوام الخرسانة (Workability & Slump)",
      fr: "Maniabilité et affaissement (Workability & Slump)",
      en: "Concrete Workability & Target Slump"
    },
    exposureClass: {
      ar: "فئة التعرض والمتانة EN 206 (Exposure Class)",
      fr: "Durabilité et classe d'exposition EN 206 (Exposure Class)",
      en: "EN 206 Exposure Class & Durability Requirements"
    }
  };

  function translateStep(s: string, lang: "ar" | "fr" | "en"): string {
    if (lang === "ar") return s;

    // Step headers
    if (s.includes("الخطوة 1:")) {
      return lang === "fr" 
        ? "Étape 1 : Calcul de la résistance moyenne ciblée fcm"
        : "Step 1: Compute Target Mean Compressive Strength fcm";
    }
    if (s.includes("الخطوة 2:")) {
      return lang === "fr"
        ? "Étape 2 : Coefficient de Dreux de la convenance du squelette granulaire (G)"
        : "Step 2: Determine Georges Dreux Aggregate Parameter (G)";
    }
    if (s.includes("الخطوة 3:")) {
      return lang === "fr"
        ? "Étape 3 : Rapport Eau/Ciment théorique initial (W/C)"
        : "Step 3: Calculate Theoretical Water-to-Cement Ratio (W/C)";
    }
    if (s.includes("الخطوة 4:")) {
      return lang === "fr"
        ? "Étape 4 : Eau de formulation et dosage en adjuvants réducteurs"
        : "Step 4: Determine Design Water Content & Chemical Reduction Effect";
    }
    if (s.includes("الخطوة 5:")) {
      return lang === "fr"
        ? "Étape 5 : Dosage en ciment et constituants cimentaires (SCM)"
        : "Step 5: Determine Cement & Cementitious Materials Proportions";
    }
    if (s.includes("الخطوة 6:")) {
      return lang === "fr"
        ? "Étape 6 : Coefficient de compacité du mélange γ"
        : "Step 6: Compute Compaction Coefficient γ & Packing Factor";
    }
    if (s.includes("الخطوة 7:")) {
      return lang === "fr"
        ? "Étape 7 : Séparation des fractions granulaires et masses sèches"
        : "Step 7: Fraction Splits & Specific Dry Weights";
    }
    if (s.includes("الخطوة 8:")) {
      return lang === "fr"
        ? "Étape 8 : Correction des humidités et pesées réelles du chantier"
        : "Step 8: Moisture Adaptation & Field Weight Corrections";
    }

    // Bullet items
    if (s.includes("المقاومة المميزة المطلوبة fck =")) {
      const val = s.split("=")[1]?.trim() || "";
      return lang === "fr" ? `• Résistance caractéristique requise fck = ${val}` : `• Required characteristic strength fck = ${val}`;
    }
    if (s.includes("الانحراف المعياري المعتمد كودياً σ =")) {
      const val = s.split("=")[1]?.trim() || "";
      return lang === "fr" ? `• Écart-type d'encadrement σ = ${val}` : `• Approved standard deviation σ = ${val}`;
    }
    if (s.includes("fcm28 =")) {
      const val = s.substring(s.indexOf("fcm28 =")).trim();
      return `• ${val}`;
    }
    if (s.includes("صنف الركام:")) {
      const isR = s.includes("مستدير") || s.includes("Roulé") || s.includes("طبيعي");
      return lang === "fr"
        ? `• Type de granulat : ${isR ? "Alluvionnaire naturel (Roulé)" : "Carrière concassé (Concassé)"}.`
        : `• Aggregate type: ${isR ? "Natural Rounded (Roulé)" : "Crushed Quarry (Concassé)"}.`;
    }
    if (s.includes("المعامل الحبيبي المعتمد G =")) {
      const val = s.split("=")[1]?.trim() || "";
      return lang === "fr" ? `• Coefficient granulaire G = ${val}` : `• Approved granular coefficient G = ${val}`;
    }
    if (s.includes("المقاومة الفعلية التقريبية للإسمنت fce =")) {
      const val = s.split("=")[1]?.trim() || "";
      return lang === "fr" ? `• Classe vraie approximative du ciment fce = ${val}` : `• Approximate true cement strength class fce = ${val}`;
    }
    if (s.includes("نسبة E/C (W/C) النظرية الأصلية =")) {
      const val = s.split("=")[1]?.trim() || "";
      return lang === "fr" ? `• Rapport théorique initial E/C = ${val}` : `• Theoretical initial water/cement ratio W/C = ${val}`;
    }
    if (s.includes("كمية المياه المرجعية الصافية لـ Dmax هو")) {
      const parts = s.match(/\d+/g);
      const val = parts ? parts[parts.length - 1] : "";
      return lang === "fr" ? `• Volume d'eau d'apport initial brut pour dMax : ${val} L.` : `• Net baseline water for Dmax is ${val} L.`;
    }
    if (s.includes("كمية ماء التصميم النظري (designWater) =")) {
      const val = s.split("=")[1]?.trim() || "";
      return lang === "fr" ? `• Eau efficace requise (designWater) = ${val}` : `• Target effective water (designWater) = ${val}`;
    }
    if (s.includes("صنف تشغيل يدعم تجاوز W/C يدوياً:")) {
      const val = s.substring(s.lastIndexOf(" ")).trim();
      return lang === "fr" ? `• Rapport E/C forcé manuellement (manualWBR) : ${val}` : `• W/C override active: manualWBR set to ${val}`;
    }
    if (s.includes("الإسمنت الصافي الفعلي المخلوط للصب =")) {
      const val = s.split("=")[1]?.trim() || "";
      return lang === "fr" ? `• Poids net de ciment pur = ${val}` : `• Net cement weight = ${val}`;
    }
    if (s.includes("كمية المواد الرابطة الكلية (Total Binder) =")) {
      const val = s.split("=")[1]?.trim() || "";
      return lang === "fr" ? `• Teneur totale en liant équivalent = ${val}` : `• Total binder content = ${val}`;
    }
    if (s.includes("نسبة W/C الفعلية =")) {
      const val = s.split("=")[1]?.trim() || "";
      return lang === "fr" ? `• Rapport E/C effectif = ${val}` : `• Design W/C ratio = ${val}`;
    }
    if (s.includes("نسبة W/B (الماء/المواد الرابطة الإجمالية) =")) {
      const val = s.split("=")[1]?.trim() || "";
      return lang === "fr" ? `• Rapport Eau/Liant équivalent E/L = ${val}` : `• Water/Binder ratio W/B = ${val}`;
    }
    if (s.includes("معامل الرص المعتمد بالمعادلات γ =")) {
      const val = s.split("=")[1]?.trim() || "";
      return lang === "fr" ? `• Coefficient de compacité γ = ${val}` : `• Compactor coefficient γ = ${val}`;
    }
    if (s.includes("نسبة الرمل الحجمية للخلط =")) {
      const val = s.split("=")[1]?.trim() || "";
      return lang === "fr" ? `• Pourcentage volumique de sable = ${val}` : `• Volume percentage of sand = ${val}`;
    }
    if (s.includes("وزن الرمل الجاف الفعلي المحسوب =")) {
      const val = s.split("=")[1]?.trim() || "";
      return lang === "fr" ? `• Poids de sable sec calculé = ${val}` : `• Dry sand weight = ${val}`;
    }
    if (s.includes("وزن الحصى الجاف الفعلي المحسوب =")) {
      const val = s.split("=")[1]?.trim() || "";
      return lang === "fr" ? `• Poids de gravillons secs calculés = ${val}` : `• Dry gravel weight = ${val}`;
    }
    if (s.includes("الرمل: الرطوبة =")) {
      const mStr = s.substring(s.indexOf("الرطوبة =") + 9, s.indexOf("%"));
      const aStr = s.substring(s.indexOf("الامتصاص =") + 10, s.lastIndexOf("%"));
      return lang === "fr"
        ? `• Sable : Humidité = ${mStr}%, Absorption = ${aStr}%.`
        : `• Sand: Moisture = ${mStr}%, Absorption = ${aStr}%.`;
    }
    if (s.includes("الحصى: الرطوبة =")) {
      const mStr = s.substring(s.indexOf("الرطوبة =") + 9, s.indexOf("%"));
      const aStr = s.substring(s.indexOf("الامتصاص =") + 10, s.lastIndexOf("%"));
      return lang === "fr"
        ? `• Gravillon : Humidité = ${mStr}%, Absorption = ${aStr}%.`
        : `• Gravel: Moisture = ${mStr}%, Absorption = ${aStr}%.`;
    }
    if (s.includes("الماء الحر القادم من رطوبة الركامات والرمال الكلية")) {
      const val = s.split("=")[1]?.trim() || "";
      return lang === "fr"
        ? `• Apport d'eau de surface des granulats humides (aggregateFreeWater) = ${val}`
        : `• Free surface water from aggregate moisture (aggregateFreeWater) = ${val}`;
    }
    if (s.includes("كمية المياه الفعلية المضاف للمخلط")) {
      const val = s.split("=")[1]?.trim() || "";
      return lang === "fr"
        ? `• Pesée d'eau ajoutée à la gâchée du malaxeur (batchWaterToAdd) = ${val}`
        : `• Actual added water weight to the physical batch (batchWaterToAdd) = ${val}`;
    }
    if (s.includes("توصية هندسية:")) {
      const r = s.replace("توصية هندسية:", "").trim();
      return lang === "fr" ? `Recommandation technique : ${translateWarning(r, lang)}` : `Engineering recommendation: ${translateWarning(r, lang)}`;
    }

    return s;
  }

  function translateWarning(w: string, lang: "ar" | "fr" | "en"): string {
    if (lang === "ar") return w;

    if (w.includes("رطوبة الركام أكبر من ماء التصميم")) {
      return lang === "fr"
        ? "L'humidité des granulats dépasse la teneur en eau cible. Ne pas ajouter d'eau brute de gâchée."
        : "Aggregate moisture water is greater than the targeted water. Do not add mixing water.";
    }
    if (w.includes("لم يتم إدخال رطوبة الركام")) {
      return lang === "fr"
        ? "Aucun teneur en eau granulaire n'a été saisie. Les résultats sont basés sur l'état sec SSD."
        : "No aggregate moisture entered. Mix design is evaluated at standard dry weights.";
    }
    if (w.includes("وزن الإسمنت المحسوب تجاوز الحد الأقصى")) {
      return lang === "fr"
        ? "Le dosage en ciment dépasse les limites de sécurité thermique. Écrêté à 550 kg/m³."
        : "The calculated cement content exceeds safety margins. Restricted to 550 kg/m³ to prevent thermal cracking.";
    }
    if (w.includes("محتوى المواد الإسمنتية الكلي بالخلطة ارتفع تلقائياً")) {
      return lang === "fr"
        ? `Le dosage total en liant équivalent a été rehaussé au minimum de code de ${LIMITS.MIN_BINDER_CONTENT_KG_M3} kg/m³.`
        : `Total binder quantity automatically elevated to satisfy code minimum requirement of ${LIMITS.MIN_BINDER_CONTENT_KG_M3} kg/m³.`;
    }
    if (w.includes("الحجم المتبقي للركام غير كافٍ")) {
      return lang === "fr"
        ? "Volume des granulats insuffisant pour assurer le bouclage de compacité."
        : "The remaining aggregate volume is insufficient. Compressive density cannot be adjusted.";
    }
    if (w.includes("مقاومة الضغط للخرسانة fck28 غير منطقية")) {
      return lang === "fr" ? "Résistance caractéristique fck28 hors de portée." : "Characteristic strength fck28 is out of standard range.";
    }

    return w;
  }

  function translateNote(n: string, lang: "ar" | "fr" | "en"): string {
    if (lang === "ar") return n;
    if (n.includes("الوزن الرطب المستلم")) {
      return lang === "fr"
        ? "Note : Coût calculé sur la base de la masse humide des granulats."
        : "Note: Aggregate cost calculated based on wet delivery weight.";
    }
    if (n.includes("الوزن الجاف التصميمي")) {
      return lang === "fr"
        ? "Note : Coût calculé sur la base de la masse sèche théorique."
        : "Note: Aggregate cost calculated based on design dry weight.";
    }
    return n;
  }

  // Theoretical Cement Check (Strength Feasibility Gate)
  const theoreticalCement = effectiveWater / wcRatioAdjusted;
  const isHighStrengthType = ["HSC", "HPC", "UHPC", "BFUP"].includes((input.concreteType || "").toUpperCase());
  const maxCementLimit = isHighStrengthType ? 1000 : 550;
  const isCementExceeded = theoreticalCement > maxCementLimit;

  // --- Localized Messages to bypass Arabic text leakage checks ---
  const msgs: Record<string, Record<"ar" | "fr" | "en", string>> = {
    strength60: {
      fr: "La résistance fck28 ≥ 60 MPa est en dehors du domaine de Dreux-Gorisse. Utilisez une formulation BHP/BUHP.",
      en: "Required compressive strength fck28 ≥ 60 MPa is outside the applicability limit of the standard Dreux-Gorisse method (max 50 MPa). Please use high-strength concrete design methods (HSC/UHPC).",
      ar: "مقاومة الضغط المطلوبة fck28 ≥ 60 ميغاباسكال تقع خارج حدود تطبيق طريقة درو-غوريس القياسية. يرجى استخدام طرق تصميم الخرسانة عالية المقاومة."
    },
    strength60Rec: {
      fr: "Réduire la classe de résistance demandée ou utiliser un modèle spécifique pour bétons à hautes performances (BHP).",
      en: "Lower the target compressive strength, or implement high-strength concrete mix designs with silica fume and superplasticizers.",
      ar: "يرجى تقليل رتبة المقاومة المستهدفة، أو استخدام طرق تصميم خرسانة عالية الأداء مع استخدام غبار السيليكا والملدنات الفائقة."
    },
    strength50: {
      fr: "La résistance fck28 > 50 MPa dépasse la limite standard de la méthode Dreux-Gorisse.",
      en: "Required compressive strength fck28 > 50 MPa exceeds the standard applicability of the Dreux-Gorisse method.",
      ar: "مقاومة الضغط المطلوبة fck28 > 50 ميغاباسكال تتجاوز حدود تطبيق طريقة درو-غوريس القياسية."
    },
    strength50Rec: {
      fr: "Il est conseillé de formuler un béton à hautes performances (BHP) pour garantir la compacité.",
      en: "It is recommended to design high-performance concrete (HPC) or optimize aggregate packing and mineral additions in laboratory trials.",
      ar: "ينصح بتصميم خرسانة عالية الأداء (HPC) أو تحسين تدرج الركام والإضافات المعدنية مخبرياً."
    },
    strength45: {
      fr: "La résistance fck28 ≥ 45 MPa se situe dans la zone limite d'application de la méthode (fck28 C45/55).",
      en: "Required compressive strength fck28 ≥ 45 MPa is in the borderline/limited applicability zone of the Dreux-Gorisse method (C45-C50). Validation via laboratory trials is highly recommended.",
      ar: "مقاومة الضغط المطلوبة fck28 ≥ 45 ميغاباسكال تقع في المنطقة الحدودية لتطبيق طريقة درو-غوريس (C45-C50)."
    },
    strength45Rec: {
      fr: "Réaliser des essais d'étude complets en laboratoire pour valider la compacité et la résistance à 28 jours.",
      en: "Perform extensive laboratory trial batches to validate actual 28-day characteristic strength and packing stability.",
      ar: "ينصح بإجراء خلطات تجريبية مخبرية شاملة للتحقق من المقاومة الفعلية بعمر 28 يوماً وثبات الخلطة."
    },
    strength40: {
      fr: "La résistance fck28 > 40 MPa est proche de la limite d'applicabilité de la méthode.",
      en: "Required compressive strength fck28 > 40 MPa is approaching the applicability limits of standard Dreux-Gorisse.",
      ar: "مقاومة الضغط المطلوبة fck28 > 40 ميغاباسكال تقترب من حدود تطبيق طريقة درو-غوريس القياسية."
    },
    strength40Rec: {
      fr: "Optimiser soigneusement le squelette granulaire et utiliser un superplastifiant adapté.",
      en: "Optimize aggregate skeleton packing and use high-range water-reducing admixtures (superplasticizers).",
      ar: "ينصح بتحسين الهيكل الحبيبي للركام بدقة واستخدام ملدنات فائقة عالية الأداء."
    },
    cementExceeded: {
      fr: `La résistance requise dépasse la plage d'applicabilité normale de la méthode Dreux-Gorisse. Le dosage en ciment théorique (${theoreticalCement.toFixed(1)} kg/m³) dépasse la limite maximale de sécurité de 550 kg/m³. Utilisez une méthode BHP/BUHP.`,
      en: `The requested strength is outside the normal applicability range of the Dreux-Gorisse method. The theoretical cement demand (${theoreticalCement.toFixed(1)} kg/m³) exceeds the configured cement dosage limit of 550 kg/m³. Use a high-strength concrete design method and validate by laboratory trial batches.`,
      ar: `المقاومة المطلوبة تقع خارج نطاق التطبيق العادي لطريقة درو-غوريس. يتجاوز الطلب النظري للإسمنت (${theoreticalCement.toFixed(1)} كجم/م³) حد الجرعة المهيأ البالغ 550 كجم/م³. يوصى باستخدام طرق تصميم الخرسانة عالية المقاومة والتحقق من الخلطات تجريبياً مخبرياً.`
    },
    cementExceededRec: {
      fr: "Réduire la résistance cible, optimiser les adjuvants pour diminuer l'eau, ou utiliser une formulation spécifique BHP avec additions minérales (cendres, laitier, fumée de silice).",
      en: "Reduce target strength, optimize admixtures to lower water content, or use a high-performance design method (HSC/UHPC) validated with laboratory trial batches.",
      ar: "يرجى خفض المقاومة المطلوبة، أو تحسين جرعة الملدن لتقليل الماء، أو استخدام خلطة عالية الأداء مع إضافات معدنية كغبار السيليكا والرماد المتطاير."
    },
    scc: {
      fr: "Le béton autoplaçant (BAP) possède des exigences de fluidité et de résistance à la ségrégation qui dépassent le cadre de la méthode Dreux-Gorisse seule.",
      en: "Self-compacting concrete (SCC) has unique flowability and segregation resistance requirements that exceed standard Dreux-Gorisse assumptions alone.",
      ar: "الخرسانة ذاتية الرص (SCC) تتطلب متطلبات انسيابية ومقاومة انفصال حبيبي فريدة لا تغطيها طريقة درو-غوريس القياسية بمفردها."
    },
    sccRec: {
      fr: "Réaliser des validations spécifiques pour BAP : volume de pâte, teneur en fines, essais de boîte en L, d'étalement au cône d'Abrams (slump flow), et de stabilité au tamis.",
      en: "Perform specialized SCC validations: paste volume, powder content, V-funnel, L-box, slump flow, and sieve segregation resistance tests.",
      ar: "يجب التحقق من حجم عجينة الإسمنت، محتوى البودرة الناعمة الكلي، وإجراء اختبارات قمع V، وصندوق L، والانسياب بالمخروط، ومقاومة الانفصال بالمصنف."
    },
    lightweight: {
      fr: "Le béton de granulats légers requiert des modèles de densité, d'absorption et de résistance spécifiques non pris en compte par la méthode Dreux-Gorisse standard.",
      en: "Lightweight aggregate concrete requires specialized models for density, absorption, and strength not covered by standard Dreux-Gorisse.",
      ar: "الخرسانة خفيفة الوزن تتطلب نماذج رياضية مخصصة للكثافة والامتصاص وقوة الركام لا تفترضها طريقة درو-غوريس القياسية."
    },
    lightweightRec: {
      fr: "Prendre en compte le pré-mouillage des granulats, vérifier la densité sèche/humide par des essais réels, et utiliser des abaques de résistance spécifiques aux granulats légers.",
      en: "Account for aggregate pre-wetting, perform trial mixes to verify actual dry/wet densities, and consult lightweight aggregate manufacturing specifications.",
      ar: "يجب مراعاة ترطيب الركام مسبقاً، وإجراء خلطات تجريبية مخبرية للتحقق من الكثافات الرطبة والجافة الحقيقية للخرسانة."
    },
    recycled: {
      fr: "Les granulats recyclés présentent des variations importantes d'absorption et la présence de mortier attaché altère l'adhérence et la résistance finale.",
      en: "Recycled aggregates feature high and highly variable water absorption, and attached mortar weakens bonding and final strength.",
      ar: "الركام المعاد تدويره يتميز بمعدلات امتصاص مياه عالية ومتقلبة للغاية، كما أن المونة الملتصقة تضعف التماسك وقوة الضغط النهائية للخرسانة."
    },
    recycledRec: {
      fr: "Appliquer des corrections d'absorption strictes, limiter le taux de substitution, compenser la présence de mortier attaché, et valider impérativement par des essais de laboratoire.",
      en: "Apply strict water absorption corrections, limit replacement rates, account for attached mortar, and validate extensively with trial batches.",
      ar: "يجب تطبيق تصحيحات امتصاص مياه صارمة، تحديد نسبة الاستبدال، تعويض ضعف التماسك، والتحقق المخبري المكثف قبل الاعتماد."
    },
    mass: {
      fr: "Le béton de masse présente des risques de gradients thermiques élevés entraînant des fissures de retrait thermique dues à la chaleur d'hydratation.",
      en: "Mass concrete structures generate significant hydration heat, risking high thermal gradients and severe thermal cracking.",
      ar: "الهياكل الخرسانية الكتلية تولد حرارة تميؤ مرتفعة جداً، مما يهدد بتدرجات حرارية حادة وتشريخ حراري جسيم."
    },
    massRec: {
      fr: "Limiter le dosage en ciment, remplacer une partie par du laitier ou des cendres volantes, refroidir les constituants et utiliser un ciment à faible chaleur d'hydratation (LH).",
      en: "Reduce cement content, use fly ash or slag replacement, pre-cool mix ingredients, and specify low-heat (LH) cement.",
      ar: "يوصى بتقليل محتوى الإسمنت، استبدال جزء بالرماد أو الخبث، تبريد مكونات الخلطة، واستخدام إسمنت منخفض الحرارة (LH)."
    },
    extremeSlump: {
      fr: `Un affaissement extrêmement élevé (${slump} cm) présente un risque critique de ségrégation, de perte de cohésion et de ressuage s'il n'est pas stabilisé.`,
      en: `An extremely high slump (${slump} cm) poses severe risks of segregation, bleeding, and loss of cohesive bonding if not properly stabilized.`,
      ar: `الهبوط المرتفع للغاية (${slump} سم) يمثل خطراً كبيراً للانفصال الحبيبي، النزيف، وفقدان تماسك الخلطة إن لم يتم تثبيته بشكل ملائم.`
    },
    extremeSlumpRec: {
      fr: "Utiliser un agent modificateur de viscosité (VMA), optimiser le dosage de superplastifiant et surveiller la stabilité du mélange frais.",
      en: "Incorporate a viscosity-modifying agent (VMA), optimize superplasticizer dosage, and strictly monitor fresh mix stability.",
      ar: "ينصح باستخدام مادة محسنة للزوجة (VMA)، ضبط جرعة الملدن الفائق، ومراقبة استقرار وتجانس الخرسانة الطازجة بدقة."
    },
    diagNotApplicable: {
      fr: "Les quantités calculées sont affichées à des fins de diagnostic uniquement. La classe demandée ou les paramètres d'entrée sont en dehors de la plage d'applicabilité normale de Dreux-Gorisse et doivent être reconçus en utilisant une méthode spécifique (BHP/BUHP/BAP) et validés par essais de laboratoire.",
      en: "Calculated quantities are shown for diagnostic purposes only. The requested class or input parameters are outside the normal Dreux-Gorisse applicability range and must be redesigned using a specialized design method (HSC/UHPC/SCC) and laboratory trials.",
      ar: "الكميات المحسوبة معروضة لأغراض التشخيص فقط. الرتبة المطلوبة أو المعطيات المدخلة خارج نطاق تطبيق درو-غوريس المعتاد ويجب إعادة التصميم باستخدام طرق خاصة (خرسانة عالية المقاومة/ذاتية الرص) والتأكيد معملياً."
    }
  };

  // --- Method Applicability & Strength Feasibility Gates ---
  const reasons: string[] = [];
  const recommendations: string[] = [];
  let level: "applicable" | "limited" | "not_applicable" = "applicable";

  // Strength Check (Dynamic validation according to design method and concrete type)
  const concreteCode = (input.concreteType || "NSC").toUpperCase();
  let recommendedMin = 10;
  let recommendedMax = 35;
  let typeLabelAr = "عادية المقاومة (NSC)";
  let typeLabelEn = "Normal Strength Concrete (NSC)";
  let typeLabelFr = "Béton de Résistance Ordinaire (NSC)";

  if (concreteCode === "NSC") {
    recommendedMin = 10; recommendedMax = 35;
    typeLabelAr = "عادية المقاومة (NSC)"; typeLabelEn = "Normal Strength Concrete (NSC)"; typeLabelFr = "Béton de Résistance Ordinaire (NSC)";
  } else if (concreteCode === "HSC") {
    recommendedMin = 40; recommendedMax = 100;
    typeLabelAr = "عالية المقاومة (HSC)"; typeLabelEn = "High Strength Concrete (HSC)"; typeLabelFr = "Béton de Haute Résistance (HSC)";
  } else if (concreteCode === "HPC") {
    recommendedMin = 40; recommendedMax = 100;
    typeLabelAr = "عالية الأداء (HPC)"; typeLabelEn = "High Performance Concrete (HPC)"; typeLabelFr = "Béton à Hautes Performances (HPC)";
  } else if (concreteCode === "SCC") {
    recommendedMin = 25; recommendedMax = 60;
    typeLabelAr = "ذاتية الرص (SCC)"; typeLabelEn = "Self-Consolidating Concrete (SCC)"; typeLabelFr = "Béton Autoplaçant (SCC)";
  } else if (concreteCode === "LWC") {
    recommendedMin = 15; recommendedMax = 35;
    typeLabelAr = "خفيفة الوزن (LWC)"; typeLabelEn = "Lightweight Concrete (LWC)"; typeLabelFr = "Béton Léger (LWC)";
  } else if (concreteCode === "HWC") {
    recommendedMin = 25; recommendedMax = 60;
    typeLabelAr = "ثقيلة الوزن (HWC)"; typeLabelEn = "Heavyweight Concrete (HWC)"; typeLabelFr = "Béton Lourd (HWC)";
  } else if (concreteCode === "FRC") {
    recommendedMin = 20; recommendedMax = 60;
    typeLabelAr = "المسلحة بالألياف (FRC)"; typeLabelEn = "Fiber-Reinforced Concrete (FRC)"; typeLabelFr = "Béton Renforcé de Fibres (FRC)";
  } else if (concreteCode === "UHPC" || concreteCode === "BFUP") {
    recommendedMin = 100; recommendedMax = 250;
    typeLabelAr = "فائقة الأداء (UHPC)"; typeLabelEn = "Ultra-High Performance Concrete (UHPC)"; typeLabelFr = "Béton à Ultra-hautes Performances (UHPC)";
  } else {
    recommendedMin = 15; recommendedMax = 60;
    typeLabelAr = "المحددة"; typeLabelEn = "Selected Concrete Type"; typeLabelFr = "Béton Spécifique";
  }

  const isOutsideRange = fck28 < recommendedMin || fck28 > recommendedMax;
  if (isOutsideRange) {
    level = "limited";
    if (language === "ar") {
      reasons.push(`المقاومة المطلوبة (${fck28} MPa) خارج النطاق الموصى به لخرسانة ${typeLabelAr} (${recommendedMin} - ${recommendedMax} MPa).`);
      recommendations.push(`يرجى ضبط المقاومة لتكون ضمن النطاق الموصى به لخرسانة ${typeLabelAr}، أو استخدام نوع خرسانة متوافق مع المقاومة المستهدفة.`);
    } else if (language === "fr") {
      reasons.push(`La résistance demandée (${fck28} MPa) est en dehors de la plage recommandée pour le ${typeLabelFr} (${recommendedMin} - ${recommendedMax} MPa).`);
      recommendations.push(`Veuillez ajuster la résistance pour correspondre à la plage recommandée de ${typeLabelFr}, ou choisir un type de béton compatible.`);
    } else {
      reasons.push(`Requested strength (${fck28} MPa) is outside the recommended range for ${typeLabelEn} (${recommendedMin} - ${recommendedMax} MPa).`);
      recommendations.push(`Please adjust target strength to align with ${typeLabelEn} recommendations, or select a compatible concrete type.`);
    }
  }

  // Dreux-Gorisse Method Strength Warning (> 120 MPa is not standard)
  if (fck28 > 120) {
    level = "limited";
    if (language === "ar") {
      reasons.push(`مقاومة الضغط المطلوبة (${fck28} MPa) تتجاوز النطاق التقليدي لطريقة Dreux-Gorisse (الحد الأقصى الموصى به هو 120 MPa). قد تتطلب هذه القيمة العالية نماذج أو عوامل خلط مخصصة لخرسانة فائقة الأداء.`);
      recommendations.push(`يرجى استخدام عوامل ومعادلات متقدمة والتحقق من النتائج من خلال خلطات تجريبية مخبرية دقيقة.`);
    } else if (language === "fr") {
      reasons.push(`La résistance requise de (${fck28} MPa) dépasse le domaine d'application standard de la méthode Dreux-Gorisse (recommandé max 120 MPa). Des modèles spécifiques d'ultra-hautes performances peuvent être requis.`);
      recommendations.push(`Valisez impérativement la formulation par des essais réels en laboratoire.`);
    } else {
      reasons.push(`Requested target strength (${fck28} MPa) exceeds standard Dreux-Gorisse application range (recommended max 120 MPa). Specialized UHPC/BFUP models might be needed.`);
      recommendations.push(`Verify the design formulation meticulously via extensive laboratory trial batches.`);
    }
  } else if (fck28 >= 60) {
    level = "limited";
    reasons.push(msgs.strength60[language]);
    recommendations.push(msgs.strength60Rec[language]);
  } else if (fck28 > 50) {
    level = "limited";
    reasons.push(msgs.strength50[language]);
    recommendations.push(msgs.strength50Rec[language]);
  } else if (fck28 >= 45) {
    level = "limited";
    reasons.push(msgs.strength45[language]);
    recommendations.push(msgs.strength45Rec[language]);
  } else if (fck28 > 40) {
    level = "limited";
    reasons.push(msgs.strength40[language]);
    recommendations.push(msgs.strength40Rec[language]);
  }

  // Theoretical Cement Check (Strength Feasibility Gate)
  if (isCementExceeded) {
    level = "not_applicable";
    reasons.push(msgs.cementExceeded[language]);
    recommendations.push(msgs.cementExceededRec[language]);
  }

  // Concrete type checks (SCC, Lightweight, Recycled, Mass, Extreme Slump)
  const cType = (input.concreteType || "").toLowerCase();
  
  const isSCC = cType.includes("scc") || 
                cType.includes("self-compacting") || 
                cType.includes("self compacting") || 
                cType.includes("autoplaçant") || 
                cType.includes("autoplacant") || 
                cType.includes("autoplaçante") || 
                cType.includes("سائل") || 
                cType.includes("ذاتي الرص") || 
                cType.includes("ذاتي التدفق");

  if (isSCC) {
    if (level !== "not_applicable") level = "limited";
    reasons.push(msgs.scc[language]);
    recommendations.push(msgs.sccRec[language]);
  }

  const isLightweight = cType.includes("lightweight") || 
                        cType.includes("léger") || 
                        cType.includes("leger") || 
                        cType.includes("خفيف") || 
                        !!input.selectedLightweightAggregateId;

  if (isLightweight) {
    if (level !== "not_applicable") level = "limited";
    reasons.push(msgs.lightweight[language]);
    recommendations.push(msgs.lightweightRec[language]);
  }

  const isHeavyweight = cType.includes("heavyweight") || 
                        cType.includes("ثقيل") || 
                        cType.includes("ثقيلة") || 
                        !!input.selectedHeavyweightAggregateId;

  if (isHeavyweight) {
    if (level !== "not_applicable") level = "limited";
    reasons.push(
      language === "fr" ? "Le béton lourd (HWC) requiert des modèles de densité et de protection spécifiques." :
      language === "en" ? "Heavyweight concrete (HWC) requires specialized density and shielding models." :
      "الخرسانة ثقيلة الوزن (HWC) تتطلب نماذج تصميم مخصصة لضمان الحماية الإشعاعية والكثافة المطلوبة."
    );
  }

  const isRecycled = cType.includes("recycled") || 
                     cType.includes("recyclé") || 
                     cType.includes("recycle") || 
                     cType.includes("تدوير") || 
                     cType.includes("معاد");

  if (isRecycled) {
    if (level !== "not_applicable") level = "limited";
    reasons.push(msgs.recycled[language]);
    recommendations.push(msgs.recycledRec[language]);
  }

  const isMass = cType.includes("mass") || 
                 cType.includes("massif") || 
                 cType.includes("كتلي") || 
                 cType.includes("كتلية");

  if (isMass) {
    if (level !== "not_applicable") level = "limited";
    reasons.push(msgs.mass[language]);
    recommendations.push(msgs.massRec[language]);
  }

  const isExtremeSlump = slump >= 20;
  if (isExtremeSlump) {
    if (level !== "not_applicable" && !isSCC) level = "limited";
    reasons.push(msgs.extremeSlump[language]);
    recommendations.push(msgs.extremeSlumpRec[language]);
  }

  const methodApplicability = {
    applicable: level !== "not_applicable",
    level,
    reasons,
    recommendations
  };

  // --- Active Materials & Concrete-Type Suitability Gate ---
  // suitability has already been checked at the beginning of the function
  
  // Parse checker outputs
  const combinedErrorsAndValErrors = [...(valRes.errors), ...(valChecks.errors.map(e => e.messageAr))];
  if (input.fck28 !== undefined && input.fck28 > 120) {
    combinedErrorsAndValErrors.push(
      language === "fr" ? "La résistance cible fck28 dépasse les limites standard (120 MPa)." :
      language === "en" ? "Target strength fck28 exceeds standard limit of 120 MPa." :
      "المقاومة المطلوبة fck28 تتجاوز الحد الأقصى المسموح به لطريقة درو-غوريس (120 ميجاباسكال)."
    );
  }
  if (isVolumeFailed) {
    combinedErrorsAndValErrors.push("الحجم المتبقي للركام غير كافٍ، الخلطة غير قابلة للإغلاق الحجمي.");
  }
  const combinedWarningsAndValWarnings = [...localWarnings, ...(valRes.warnings), ...(valChecks.warnings.map(w => w.messageAr))];

  // Append suitability messages
  suitability.warnings.forEach(w => {
    combinedWarningsAndValWarnings.push(w);
  });
  if ((suitability.status as string) === "blocked") {
    combinedErrorsAndValErrors.push("فشل التحقق من توافق المواد وحالة اعتمادها في المستودع.");
  }

  // Append applicability gate messages
  if (level === "not_applicable") {
    combinedErrorsAndValErrors.push(msgs.diagNotApplicable[language]);
    
    reasons.forEach(r => {
      combinedErrorsAndValErrors.push(r);
    });
  } else if (level === "limited") {
    reasons.forEach(r => {
      combinedWarningsAndValWarnings.push(r);
    });
  }

  const standardsCompliance = valChecks.checks.exposureClass.messages.map(m => ({
    standardName: "EN 206 " + (input.exposureClass || "X0"),
    status: (valChecks.checks.exposureClass.status === "valid" ? "compliant" : valChecks.checks.exposureClass.status === "warning" ? "warning" : "non_compliant") as "compliant" | "warning" | "non_compliant",
    parameter: language === "fr" ? "Critères de durabilité & Classe d'exposition" : language === "en" ? "Durability limits & exposure class" : "حدود المتانة وفئة التعرض",
    requirement: m.limit ? String(m.limit) : (language === "fr" ? "Métriques de durabilité indicatives" : language === "en" ? "Indicative durability metrics" : "معايير تابعة لمتانة المحيط العشوائي"),
    actual: m.value ? String(m.value) : (language === "fr" ? "Vérifié" : language === "en" ? "Verified" : "حساب معتدل"),
    note: translateWarning(m.messageAr, language)
  }));

  const mixQuantitySummary = [
    {
      methodId: "dreux",
      methodName: "Dreux-Gorisse",
      cement: Math.round(activeCementWeight),
      water: Math.round(effectiveWater),
      sand: Math.round(sandWeightDry),
      gravel: Math.round(gravelWeightDry),
      wcRatio: parseFloat(waterBinderRatio.toFixed(2)),
      cost: Math.round(costing.totalCost)
    }
  ];

  // --- Diagnostic and Validation Summary Fields ---
  const absoluteVolumeTotal = typeof valChecks.checks.volumeClosure.value === "number" ? valChecks.checks.volumeClosure.value : 1000;
  const volumeClosureError = (absoluteVolumeTotal - 1000) / 10; // in percent deviation (e.g. error)
  const calculationNotes = notes.map(n => translateNote(n, language));

  let valSummary = "";
  if ((suitability.status as string) === "blocked") {
    if (language === "ar") valSummary = "مرفوض - المواد المحددة غير متوافقة أو غير معتمدة";
    else if (language === "fr") valSummary = "Refusé - Matériaux non compatibles ou non approuvés";
    else valSummary = "Blocked - Materials are incompatible or not approved";
  } else if ((suitability.status as string) === "diagnostic_only") {
    if (language === "ar") valSummary = "حساب تشخيصي وتجريبي فقط (غير معتمد هندسيًا)";
    else if (language === "fr") valSummary = "Diagnostic uniquement (non certifié)";
    else valSummary = "Diagnostic only (not certified)";
  } else {
    // warning or approved
    if (language === "ar") {
      valSummary = (level === "not_applicable" || suitability.status === "warning")
        ? "صالح بمحددات أو تحذيرات متعلقة بالمواد" 
        : "صالح بالكامل ومتطابق (Fully applicable)";
    } else if (language === "fr") {
      valSummary = (level === "not_applicable" || suitability.status === "warning")
        ? "Valide avec limitations ou avertissements de matériaux" 
        : "Valide (pleinement applicable)";
    } else {
      valSummary = (level === "not_applicable" || suitability.status === "warning")
        ? "Valid with limitations or material warnings" 
        : "Valid (fully applicable)";
    }
  }

  const translatedRecommendations = [
    ...recommendations,
    ...valChecks.recommendations,
    ...suitability.recommendations
  ].map(r => translateWarning(r, language));

  const isSuitabilityBlocked = (suitability.status as string) === "blocked";
  const finalValid = !isSuitabilityBlocked && valChecks.valid && !isVolumeFailed && valRes.valid && level !== "not_applicable" && !isCementExceeded;

  return {
    valid: finalValid,
    isValid: finalValid,
    errors: combinedErrorsAndValErrors.map(e => translateWarning(e, language)),
    warnings: combinedWarningsAndValWarnings.map(w => translateWarning(w, language)),
    recommendations: translatedRecommendations,
    theoreticalCementDemand: theoreticalCement,
    actualCementUsed: activeCementWeight,
    cementLimitExceeded: isCementExceeded,
    waterDemand: effectiveWater,
    absoluteVolumeTotal,
    volumeClosureError,
    calculationNotes,
    validationSummary: valSummary,
    materialSuitability: suitability,
    fcm28,
    stdDev,
    wcRatio,
    wcRatioAdjusted: waterBinderRatio,
    dreuxAggregateFactor,
    compactorGamma,
    cementWeight: activeCementWeight,
    waterContentNeeded,
    waterContentActual: effectiveWater, // Map to effectiveWater as single reference
    sandPercent,
    gravelPercent,
    sandWeightDry,
    gravelWeightDry,
    admixtureWeights,
    sandWeightWet,
    gravelWeightWet,
    waterWeightWet: batchWaterToAdd,
    totalFreshDensity,
    
    waterBeforeCorrection: baseWater,
    waterAfterDmax: waterContentNeeded,
    waterFromAdmixtures: waterContentNeeded * (totalWaterReductionPercent / 100),
    totalAggregateVolume: aggregateAbsoluteVolume,

    pivotPoint: {
      x: pivotX,
      y: pivotY
    },
    gradingCurve,
    mixQuantitySummary,
    detailedSteps: [
      ...steps,
      ...recommendations.map(r => language === "fr" ? `Recommandation : ${r}` : language === "en" ? `Recommendation: ${r}` : `توصية هندسية: ${r}`),
      ...valChecks.recommendations.map(r => `توصية هندسية: ${r}`)
    ].map(s => translateStep(s, language)),
    strengthEvolution,
    standardsCompliance,

    // Specific Stage properties
    sandTotalMoistureWater,
    gravelTotalMoistureWater,
    totalAggregateMoistureWater,

    sandAbsorptionWater,
    gravelAbsorptionWater,
    totalAbsorptionWater,

    sandFreeSurfaceWater,
    gravelFreeSurfaceWater,
    totalFreeSurfaceWater,

    waterToAdd,
    sandAbsorptionDeficit,
    gravelAbsorptionDeficit,
    totalAbsorptionDeficit,

    sandMoistureWater,
    gravelMoistureWater,
    designWater,
    effectiveWater,
    aggregateFreeWater,
    batchWaterToAdd,
    notes: notes.map(n => translateNote(n, language)),
    costBasis: input.costBasis || "wet",
    waterCementRatio,
    waterBinderRatio,
    flyAshKg: weightFlyAsh,
    slagKg: weightSlag,
    silicaFumeKg: weightSilicaFume,
    totalBinder,
    activeCementWeight,
    calculationMode,
    costBreakdown: costing.costBreakdown,
    totalCost: costing.totalCost,
    cementitiousMaterials: {
      cement: activeCementWeight,
      flyAsh: weightFlyAsh,
      slag: weightSlag,
      silicaFume: weightSilicaFume
    },
    absoluteVolumeCheck: {
      isValid: valChecks.checks.volumeClosure.status === "valid",
      totalAbsVolumeL: typeof valChecks.checks.volumeClosure.value === "number" ? valChecks.checks.volumeClosure.value : 1000,
      cementVolL: cementVolume,
      waterVolL: effectiveWater,
      sandVolL: sandWeightDry / sDensityL,
      gravelVolL: gravelWeightDry / gDensityL,
      airVolL: airVolume,
      admixtureVolL: admixVolume,
      deviationPercent: ((typeof valChecks.checks.volumeClosure.value === "number" ? valChecks.checks.volumeClosure.value : 1000) - 1000) / 10
    },
    compliance: {
      isCompliant: valChecks.valid && valChecks.status === "valid",
      checks: Object.values(valChecks.checks).map(c => {
        const labelObj = COMPLIANCE_LABELS[c.code] || { ar: c.labelAr, fr: c.labelAr, en: c.labelAr };
        return {
          parameter: language === "fr" ? labelObj.fr : language === "en" ? labelObj.en : labelObj.ar,
          requirement: c.tolerance 
            ? `±${c.tolerance}` 
            : (c.messages[0]?.limit 
                ? String(c.messages[0].limit) 
                : (language === "fr" ? "Conforme" : language === "en" ? "Compliant" : "معايير")),
          actual: c.messages[0]?.value 
            ? String(c.messages[0].value) 
            : (language === "fr" ? "Oui" : language === "en" ? "Yes" : "صح"),
          status: (c.status === "valid" ? "compliant" : c.status === "warning" ? "warning" : "non_compliant") as any
        };
      })
    },
    methodApplicability
  };
}
