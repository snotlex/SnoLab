import { MixDesignInput, MixDesignResult, SievePoint } from "../types";
import { validateMixInputs } from "./validateInputs";
import { calculateCosting } from "./costing";
import { validateMixDesign } from "./validation/mixValidation";
import { DREUX_KNOWLEDGE_BASE } from "./dreuxKnowledgeBase";
import { validateProductionMaterialSet } from "./productionMaterialGate";

/**
 * Single-source Dreux-Gorisse calculation core.
 * Production callers must provide approved, active material records.
 */
export function calculateDreuxGorisseCore(input: MixDesignInput, language: "ar" | "fr" | "en" = "ar"): MixDesignResult & any {
  const steps: string[] = [];
  const localWarnings: string[] = [];
  const isTestBypass = Boolean(input.bypassSuitabilityGate) && typeof process !== "undefined" && process.env.NODE_ENV === "test";

  const productionGate = isTestBypass
    ? null
    : validateProductionMaterialSet(input, input.materialsDatabase || []);

  if (productionGate?.status === "blocked") {
    const primaryMessage = productionGate.warnings[0] || "Selected materials are not ready for engineering calculation.";
    return {
      valid: false, isValid: false, errors: [primaryMessage], warnings: productionGate.warnings || [],
      fcm28: 0, stdDev: 0, wcRatio: 0, wcRatioAdjusted: 0, dreuxAggregateFactor: 0, compactorGamma: 0,
      cementWeight: 0, waterContentNeeded: 0, waterContentActual: 0, sandPercent: 0, gravelPercent: 0,
      sandWeightDry: 0, gravelWeightDry: 0, admixtureWeights: [], sandWeightWet: 0, gravelWeightWet: 0,
      waterWeightWet: 0, totalFreshDensity: 0, waterBeforeCorrection: 0, waterAfterDmax: 0,
      waterFromAdmixtures: 0, totalAggregateVolume: 0, pivotPoint: { x: 0, y: 0 }, gradingCurve: [],
      detailedSteps: [primaryMessage], strengthEvolution: [], standardsCompliance: [], designWater: 0,
      effectiveWater: 0, aggregateFreeWater: 0, batchWaterToAdd: 0, waterCementRatio: 0, waterBinderRatio: 0,
      calculationMode: input.internalWcOverride ? "manualWBR" : "strengthBased", costBreakdown: [], totalCost: 0,
      cementitiousMaterials: { cement: 0, flyAsh: 0, slag: 0, silicaFume: 0 }, totalBinder: 0,
      materialSuitability: productionGate
    } as any;
  }

  const valRes = validateMixInputs(input, language);
  if (!valRes.valid) {
    return {
      valid: false, isValid: false, errors: valRes.errors, warnings: valRes.warnings, fcm28: 0, stdDev: 0,
      wcRatio: 0, wcRatioAdjusted: 0, dreuxAggregateFactor: 0, compactorGamma: 0, cementWeight: 0,
      waterContentNeeded: 0, waterContentActual: 0, sandPercent: 0, gravelPercent: 0, sandWeightDry: 0,
      gravelWeightDry: 0, admixtureWeights: [], sandWeightWet: 0, gravelWeightWet: 0, waterWeightWet: 0,
      totalFreshDensity: 0, waterBeforeCorrection: 0, waterAfterDmax: 0, waterFromAdmixtures: 0,
      totalAggregateVolume: 0, pivotPoint: { x: 0, y: 0 }, gradingCurve: [], detailedSteps: [], strengthEvolution: [],
      standardsCompliance: [], designWater: 0, effectiveWater: 0, aggregateFreeWater: 0, batchWaterToAdd: 0,
      waterCementRatio: 0, waterBinderRatio: 0, calculationMode: input.internalWcOverride ? "manualWBR" : "strengthBased",
      costBreakdown: [], totalCost: 0, cementitiousMaterials: { cement: 0, flyAsh: 0, slag: 0, silicaFume: 0 }, totalBinder: 0,
      materialSuitability: productionGate || undefined
    } as any;
  }

  const fck28 = input.fck28;
  const controlClass = input.controlClass;
  const cementClassStrength = input.cementClassStrength;
  const dMax = input.dMax;
  const slump = input.slump;
  const aggregateType = input.aggregateType;
  const aggregateQuality = input.aggregateQuality;
  const hasPumping = Boolean(input.hasPumping);
  const sandRelativeDensity = input.sandRelativeDensity;
  let gravelRelativeDensity = input.gravelRelativeDensity;
  const cementDensity = input.cementDensity;
  let airContent = input.airContent;
  const moistureSand = input.moistureSand;
  let moistureGravel = input.moistureGravel;

  if (input.selectedLightweightAggregateId) {
    if (input.lightweightAggregateDensity !== undefined) gravelRelativeDensity = input.lightweightAggregateDensity;
    if (input.lightweightAggregateMoisture !== undefined) moistureGravel = input.lightweightAggregateMoisture;
  } else if (input.selectedHeavyweightAggregateId) {
    if (input.heavyweightAggregateDensity !== undefined) gravelRelativeDensity = input.heavyweightAggregateDensity;
    if (input.heavyweightAggregateMoisture !== undefined) moistureGravel = input.heavyweightAggregateMoisture;
  }
  if (input.selectedAirPercentage !== undefined && input.selectedAirPercentage > 0) airContent = input.selectedAirPercentage;

  const dosageSuper = input.dosageSuper ?? 0;
  const dosageAir = input.dosageAir ?? 0;
  const dosageRetarder = input.dosageRetarder ?? 0;
  const dosageAccelerator = input.dosageAccelerator ?? 0;
  const dosageSilicaFume = input.dosageSilicaFume ?? 0;
  const dosageFlyAsh = input.dosageFlyAsh ?? 0;
  const dosageSlag = input.dosageSlag ?? 0;

  // 1. Target mean strength
  const stdDevTable = DREUX_KNOWLEDGE_BASE.lookupTables.standardDeviation.data;
  const stdDev = controlClass === "high" ? stdDevTable.high : controlClass === "low" ? stdDevTable.low : stdDevTable.normal;
  const fcm28 = fck28 + 1.64 * stdDev;
  steps.push(`الخطوة 1: fcm28 = ${fck28} + 1.64 × ${stdDev} = ${fcm28.toFixed(2)} MPa.`);

  // 2. Dreux aggregate coefficient G
  const isRounded = String(aggregateType).toLowerCase() === "roule" || String(aggregateType).toLowerCase() === "roulé";
  const gCategory = isRounded ? DREUX_KNOWLEDGE_BASE.lookupTables.dreuxAggregateFactorG.data.rounded : DREUX_KNOWLEDGE_BASE.lookupTables.dreuxAggregateFactorG.data.crushed;
  const qKey = String(aggregateQuality).toLowerCase() === "excellent" ? "excellent" : String(aggregateQuality).toLowerCase() === "poor" ? "poor" : "standard";
  const dreuxAggregateFactor = dMax <= gCategory.small.limit ? gCategory.small[qKey] : dMax <= gCategory.medium.limit ? gCategory.medium[qKey] : gCategory.large[qKey];
  steps.push(`الخطوة 2: G = ${Number(dreuxAggregateFactor).toFixed(2)}.`);

  // 3. Theoretical W/C
  const fce = cementClassStrength * 1.1;
  const cwRatio = (fcm28 / (dreuxAggregateFactor * fce)) + 0.5;
  const wcRatio = 1 / cwRatio;
  steps.push(`الخطوة 3: W/C = ${wcRatio.toFixed(3)}.`);

  // 4. Base water from configured knowledge-base tables only
  const baseWaterEntry = DREUX_KNOWLEDGE_BASE.lookupTables.baseWaterDemand.data.find((entry: any) => dMax <= entry.dMaxLimit);
  const slumpEntry = DREUX_KNOWLEDGE_BASE.lookupTables.slumpCorrectionFactor.data.find((entry: any) => slump <= entry.slumpLimit);
  if (!baseWaterEntry || !slumpEntry) {
    throw new Error(`Missing Dreux knowledge-base correction for Dmax=${dMax} mm and slump=${slump} cm.`);
  }
  const baseWater = baseWaterEntry.water;
  const waterContentNeeded = baseWater * slumpEntry.factor;

  let directSuperReduction = 0;
  if (dosageSuper > 0) {
    if (input.selectedAdmixtureWaterReduction === undefined && !isTestBypass) throw new Error("Selected superplasticizer waterReduction is required for production calculation.");
    directSuperReduction = input.selectedAdmixtureWaterReduction ?? 0;
  }
  const totalWaterReductionPercent = Math.max(0, Math.min(35, directSuperReduction + dosageAir * 4 + dosageFlyAsh * 0.3 - (dosageSilicaFume > 0 && dosageSuper === 0 ? dosageSilicaFume * 1.5 : 0)));
  const designWater = waterContentNeeded * (1 - totalWaterReductionPercent / 100);
  const effectiveWater = designWater;

  // 5. Binder content
  const calculationMode = input.internalWcOverride ? "manualWBR" : "strengthBased";
  const wcRatioAdjusted = input.internalWcOverride ?? wcRatio;
  let cementWeight = effectiveWater / wcRatioAdjusted;
  let weightSilicaFume = 0, weightFlyAsh = 0, weightSlag = 0, activeCementWeight = 0;

  if (String(input.concreteType).toUpperCase() === "GPC") {
    cementWeight = 0;
    activeCementWeight = 0;
    const totalBinderWeight = effectiveWater / wcRatioAdjusted;
    const sumDosage = dosageFlyAsh + dosageSlag;
    if (sumDosage <= 0 && !isTestBypass) throw new Error("GPC production calculation requires explicit Fly Ash/Slag proportions.");
    const safeSum = sumDosage || 1;
    weightFlyAsh = totalBinderWeight * (dosageFlyAsh / safeSum);
    weightSlag = totalBinderWeight * (dosageSlag / safeSum);
    weightSilicaFume = totalBinderWeight * (dosageSilicaFume / 100);
  } else {
    const maxCementWeight = ["HSC", "HPC", "UHPC", "BFUP"].includes(String(input.concreteType || "").toUpperCase()) ? 1000 : 550;
    if (cementWeight > maxCementWeight) throw new Error(`Theoretical cement demand exceeds configured limit of ${maxCementWeight} kg/m³.`);
    weightSilicaFume = cementWeight * dosageSilicaFume / 100;
    weightFlyAsh = cementWeight * dosageFlyAsh / 100;
    weightSlag = cementWeight * dosageSlag / 100;
    activeCementWeight = cementWeight - (weightFlyAsh * 0.8) - (weightSlag * 0.5);
  }

  const specialBinderReplacementPercent = input.specialBinderReplacementPercent ?? 0;
  const specialBinderDensity = input.specialBinderDensity ?? 0;
  let weightSpecialBinder = 0;
  let specialBinderVolume = 0;
  if (specialBinderReplacementPercent > 0) {
    if (specialBinderDensity <= 0 && !isTestBypass) throw new Error("Special binder density is required for production calculation.");
    weightSpecialBinder = activeCementWeight * specialBinderReplacementPercent / 100;
    activeCementWeight -= weightSpecialBinder;
    specialBinderVolume = specialBinderDensity > 0 ? weightSpecialBinder / (specialBinderDensity / 1000) : 0;
  }

  const currentTotalBinder = activeCementWeight + weightFlyAsh + weightSlag + weightSilicaFume + weightSpecialBinder;
  const minBinder = DREUX_KNOWLEDGE_BASE.validationLimits.minBinderContentKgM3;
  if (currentTotalBinder < minBinder) {
    activeCementWeight += minBinder - currentTotalBinder;
    localWarnings.push(`محتوى المواد الرابطة رُفع إلى الحد الأدنى المهيأ ${minBinder} كجم/م³.`);
  }

  const cementitiousBinder = activeCementWeight + weightSpecialBinder;
  const totalBinder = activeCementWeight + weightFlyAsh + weightSlag + weightSilicaFume + weightSpecialBinder;
  const waterCementRatio = effectiveWater / (cementitiousBinder || 1);
  const waterBinderRatio = effectiveWater / (totalBinder || 1);

  // 6. Packing coefficient from knowledge-base tables only
  const gammaEntry = DREUX_KNOWLEDGE_BASE.lookupTables.compactnessGamma0.data.find((entry: any) => dMax <= entry.dMaxLimit);
  const slumpCompEntry = DREUX_KNOWLEDGE_BASE.lookupTables.slumpCompacityAdjustment.data.find((entry: any) => slump <= entry.slumpLimit);
  if (!gammaEntry || !slumpCompEntry) throw new Error(`Missing compaction correction for Dmax=${dMax} mm / slump=${slump} cm.`);
  const shapeComp = isRounded ? DREUX_KNOWLEDGE_BASE.lookupTables.shapeCompacityAdjustment.data.rounded : DREUX_KNOWLEDGE_BASE.lookupTables.shapeCompacityAdjustment.data.crushed;
  const compactorDefault = gammaEntry.gamma + slumpCompEntry.adjustment + shapeComp;
  const compactorGamma = input.packingFactor !== undefined && input.packingFactor > 0 ? input.packingFactor : compactorDefault;
  const packingDelta = compactorGamma - compactorDefault;

  // 7. Absolute volumes
  const cDensityL = cementDensity > 10 ? cementDensity / 1000 : cementDensity;
  const sDensityL = sandRelativeDensity > 10 ? sandRelativeDensity / 1000 : sandRelativeDensity;
  const gDensityL = gravelRelativeDensity > 10 ? gravelRelativeDensity / 1000 : gravelRelativeDensity;
  const cementVolume = activeCementWeight / cDensityL;

  const hasScm = dosageSilicaFume + dosageFlyAsh + dosageSlag > 0;
  const scmDensityL = hasScm ? (input.selectedScmDensity && input.selectedScmDensity > 0 ? input.selectedScmDensity / 1000 : isTestBypass ? DREUX_KNOWLEDGE_BASE.lookupTables.scmDefaultDensities.data.flyAsh / 1000 : 0) : 1;
  if (hasScm && scmDensityL <= 0) throw new Error("Selected SCM density is required for production calculation.");
  const silicaVolume = weightSilicaFume / (dosageSilicaFume > 0 ? scmDensityL : 1);
  const flyAshVolume = weightFlyAsh / (dosageFlyAsh > 0 ? scmDensityL : 1);
  const slagVolume = weightSlag / (dosageSlag > 0 ? scmDensityL : 1);
  const airVolume = airContent * 10;

  const admixtureWeights: any[] = [];
  if (dosageSuper > 0) admixtureWeights.push({ admixtureId: input.selectedAdmixtureId || "super", name: input.selectedAdmixtureName || "Superplasticizer", weight: activeCementWeight * dosageSuper / 100 });
  if (dosageAir > 0) admixtureWeights.push({ admixtureId: input.selectedAirContentMaterialId || "air", name: input.selectedAirContentMaterialName || "Air Entrainer", weight: activeCementWeight * dosageAir / 100 });
  if (dosageRetarder > 0) admixtureWeights.push({ admixtureId: "retarder", name: "Retarder", weight: activeCementWeight * dosageRetarder / 100 });
  if (dosageAccelerator > 0) admixtureWeights.push({ admixtureId: "accelerator", name: "Accelerator", weight: activeCementWeight * dosageAccelerator / 100 });
  const admixTotal = admixtureWeights.reduce((sum, item) => sum + item.weight, 0);
  const admixDensity = admixTotal > 0 ? (input.selectedAdmixtureDensity && input.selectedAdmixtureDensity > 0 ? input.selectedAdmixtureDensity / 1000 : isTestBypass ? 1.15 : 0) : 1;
  if (admixTotal > 0 && admixDensity <= 0) throw new Error("Selected admixture density is required for production calculation.");
  const admixVolume = admixTotal / admixDensity;

  const fiberDensity = input.fiberDensity ?? (isTestBypass ? 7850 : 0);
  if (input.fiberDosageKgM3 && input.fiberDosageKgM3 > 0 && fiberDensity <= 0) throw new Error("Selected fiber density is required for production calculation.");
  const fiberVolume = input.fiberDosageKgM3 ? input.fiberDosageKgM3 / (fiberDensity / 1000) : 0;

  const aggregateAbsoluteVolume = 1000 - cementVolume - silicaVolume - flyAshVolume - slagVolume - effectiveWater - airVolume - admixVolume - fiberVolume - specialBinderVolume;
  const isVolumeFailed = aggregateAbsoluteVolume < 100;

  // 8. Grading / sand split
  const pivotX = dMax <= 12.5 ? 5 : dMax / 2;
  const k0List = isRounded ? DREUX_KNOWLEDGE_BASE.lookupTables.baseGranularConstantK0.data.rounded : DREUX_KNOWLEDGE_BASE.lookupTables.baseGranularConstantK0.data.crushed;
  const k0Entry = k0List.find((entry: any) => dMax <= entry.dMaxLimit);
  if (!k0Entry) throw new Error(`Missing K0 value for Dmax=${dMax} mm.`);
  const K = k0Entry.k + (cementWeight - 350) / 10 + (hasPumping ? 5 : 0);
  let pivotY = 50 - Math.sqrt(dMax) + K - (packingDelta * 40);
  pivotY = Math.max(20, Math.min(70, pivotY));
  const sandPercent = input.isGranularOptimizedApproved && input.approvedSandPercent !== undefined ? input.approvedSandPercent : pivotY;
  const gravelPercent = input.isGranularOptimizedApproved && input.approvedGravelPercent !== undefined ? input.approvedGravelPercent : 100 - sandPercent;
  if (sandPercent < 0 || gravelPercent < 0 || Math.abs(sandPercent + gravelPercent - 100) > 0.001) throw new Error("Aggregate percentages must sum to 100%.");
  const safeAggAbsVolume = Math.max(150, aggregateAbsoluteVolume);
  const sandWeightDry = safeAggAbsVolume * sandPercent / 100 * sDensityL;
  const gravelWeightDry = safeAggAbsVolume * gravelPercent / 100 * gDensityL;

  // 9. Moisture and field water correction
  const sandAbs = input.sandAbsorption ?? (isTestBypass ? 1.5 : 0);
  const gravelAbs = input.gravelAbsorption ?? (isTestBypass ? 0.8 : 0);
  if (!isTestBypass && (input.sandAbsorption === undefined || input.gravelAbsorption === undefined)) throw new Error("Aggregate absorption values are required for production calculation.");
  const sandWeightWet = sandWeightDry * (1 + moistureSand / 100);
  const gravelWeightWet = gravelWeightDry * (1 + moistureGravel / 100);
  const sandTotalMoistureWater = sandWeightDry * moistureSand / 100;
  const gravelTotalMoistureWater = gravelWeightDry * moistureGravel / 100;
  const totalAggregateMoistureWater = sandTotalMoistureWater + gravelTotalMoistureWater;
  const sandAbsorptionWater = sandWeightDry * sandAbs / 100;
  const gravelAbsorptionWater = gravelWeightDry * gravelAbs / 100;
  const totalAbsorptionWater = sandAbsorptionWater + gravelAbsorptionWater;
  const sandFreeSurfaceWater = sandWeightDry * Math.max(0, moistureSand - sandAbs) / 100;
  const gravelFreeSurfaceWater = gravelWeightDry * Math.max(0, moistureGravel - gravelAbs) / 100;
  const totalFreeSurfaceWater = sandFreeSurfaceWater + gravelFreeSurfaceWater;
  const sandAbsorptionDeficit = moistureSand < sandAbs ? sandWeightDry * (sandAbs - moistureSand) / 100 : 0;
  const gravelAbsorptionDeficit = moistureGravel < gravelAbs ? gravelWeightDry * (gravelAbs - moistureGravel) / 100 : 0;
  const totalAbsorptionDeficit = sandAbsorptionDeficit + gravelAbsorptionDeficit;
  const waterToAdd = Math.max(0, effectiveWater - totalFreeSurfaceWater + totalAbsorptionDeficit);
  const batchWaterToAdd = waterToAdd;
  const aggregateFreeWater = totalFreeSurfaceWater - totalAbsorptionDeficit;

  if (moistureSand === 0 && moistureGravel === 0) localWarnings.push("تنبيه: لم يتم إدخال رطوبة الركام. النتائج مبنية على الأوزان الجافة.");

  const totalFreshDensity = activeCementWeight + weightSilicaFume + weightFlyAsh + weightSlag + sandWeightDry + gravelWeightDry + effectiveWater + admixTotal + (input.fiberDosageKgM3 || 0) + weightSpecialBinder;
  const strengthEvolution = [
    { age: 3, strength: Math.round(fck28 * (3 / (4 + 0.85 * 3)) * 10) / 10 },
    { age: 7, strength: Math.round(fck28 * (7 / (4.2 + 0.83 * 7)) * 10) / 10 },
    { age: 14, strength: Math.round(fck28 * (14 / (4.5 + 0.81 * 14)) * 10) / 10 },
    { age: 28, strength: Math.round(fck28 * 10) / 10 },
    { age: 90, strength: Math.round(fck28 * 1.15 * 10) / 10 }
  ];

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
      passing = ((Math.log10(size) - Math.log10(0.08)) / (Math.log10(pivotX) - Math.log10(0.08))) * pivotY;
    } else {
      passing = pivotY + ((Math.log10(size) - Math.log10(pivotX)) / (Math.log10(dMax) - Math.log10(pivotX))) * (100 - pivotY);
    }
    return { size, targetPassing: Math.max(0, Math.min(100, Math.round(passing * 10) / 10)) };
  });

  const prices = {
    priceCement: input.priceCement ?? 0, priceSand: input.priceSand ?? 0, priceGravel: input.priceGravel ?? 0,
    priceSuper: input.priceSuper ?? 0, priceAir: input.priceAir ?? 0, priceRetarder: input.priceRetarder ?? 0,
    priceAccelerator: input.priceAccelerator ?? 0, priceSilicaFume: input.priceSilicaFume ?? 0, priceFlyAsh: input.priceFlyAsh ?? 0,
    priceSlag: input.priceSlag ?? 0, priceLabor: input.priceLabor ?? 0, priceWater: input.priceWater ?? 0,
    priceFiber: input.priceFiber ?? 0, priceSpecialBinder: input.priceSpecialBinder ?? 0
  };
  const costing = calculateCosting({
    cementKg: activeCementWeight, flyAshKg: weightFlyAsh, slagKg: weightSlag, silicaFumeKg: weightSilicaFume,
    sandDryKg: sandWeightDry, gravelDryKg: gravelWeightDry, sandWetKg: sandWeightWet, gravelWetKg: gravelWeightWet,
    costBasis: input.costBasis || "wet", batchWaterLiters: batchWaterToAdd, admixtureWeights,
    fiberKg: input.fiberDosageKgM3 || 0, specialBinderKg: weightSpecialBinder, prices
  });

  const temporaryMapResult = {
    cementKg: activeCementWeight, waterKg: effectiveWater, fineAggregateKg: sandWeightDry, coarseAggregateKg: gravelWeightDry,
    admixtureKg: admixTotal, wcRatio: waterCementRatio, totalFreshDensity, waterWeightWet: batchWaterToAdd,
    standardsCompliance: [], flyAshKg: weightFlyAsh, slagKg: weightSlag, silicaFumeKg: weightSilicaFume, totalBinder,
    activeCementWeight, cementWeight
  };
  const valChecks = validateMixDesign(input, temporaryMapResult);
  const absoluteVolumeTotal = typeof valChecks.checks.volumeClosure?.value === "number" ? valChecks.checks.volumeClosure.value : 1000;
  const volumeClosureError = (absoluteVolumeTotal - 1000) / 10;
  const isCementExceeded = (effectiveWater / (wcRatioAdjusted || 1)) > (["HSC", "HPC", "UHPC", "BFUP"].includes(String(input.concreteType || "").toUpperCase()) ? 1000 : 550);

  const warnings = [...localWarnings, ...(valRes.warnings || []), ...valChecks.warnings.map((w: any) => w.messageAr || w.message || String(w))];
  const errors = [...valRes.errors, ...valChecks.errors.map((e: any) => e.messageAr || e.message || String(e))];
  const finalValid = valChecks.valid && valRes.valid && !isVolumeFailed && !isCementExceeded;
  const methodApplicability = { applicable: finalValid, level: finalValid ? "applicable" : "limited", reasons: [], recommendations: [] };

  return {
    valid: finalValid, isValid: finalValid, errors, warnings, recommendations: [], theoreticalCementDemand: effectiveWater / (wcRatioAdjusted || 1),
    actualCementUsed: activeCementWeight, cementLimitExceeded: isCementExceeded, waterDemand: effectiveWater,
    absoluteVolumeTotal, volumeClosureError, calculationNotes: [], validationSummary: finalValid ? "Valid" : "Validation required",
    materialSuitability: productionGate || ({ status: "approved", missingMaterials: [], invalidMaterials: [], incompatibleMaterials: [], warnings: [], recommendations: [] } as any),
    fcm28, stdDev, wcRatio, wcRatioAdjusted: waterBinderRatio, dreuxAggregateFactor, compactorGamma,
    cementWeight: activeCementWeight, waterContentNeeded, waterContentActual: effectiveWater, sandPercent, gravelPercent,
    sandWeightDry, gravelWeightDry, admixtureWeights, sandWeightWet, gravelWeightWet, waterWeightWet: batchWaterToAdd,
    totalFreshDensity, waterBeforeCorrection: baseWater, waterAfterDmax: waterContentNeeded,
    waterFromAdmixtures: waterContentNeeded * totalWaterReductionPercent / 100, totalAggregateVolume: aggregateAbsoluteVolume,
    pivotPoint: { x: pivotX, y: pivotY }, gradingCurve, mixQuantitySummary: [{ methodId: "dreux-gorisse", methodName: "Dreux-Gorisse", cement: Math.round(activeCementWeight), water: Math.round(effectiveWater), sand: Math.round(sandWeightDry), gravel: Math.round(gravelWeightDry), wcRatio: Number(waterCementRatio.toFixed(3)), cost: Math.round(costing.totalCost) }],
    detailedSteps: steps, strengthEvolution, standardsCompliance: [], sandTotalMoistureWater, gravelTotalMoistureWater,
    totalAggregateMoistureWater, sandAbsorptionWater, gravelAbsorptionWater, totalAbsorptionWater, sandFreeSurfaceWater,
    gravelFreeSurfaceWater, totalFreeSurfaceWater, waterToAdd, sandAbsorptionDeficit, gravelAbsorptionDeficit, totalAbsorptionDeficit,
    sandMoistureWater: sandTotalMoistureWater, gravelMoistureWater: gravelTotalMoistureWater, designWater, effectiveWater,
    aggregateFreeWater, batchWaterToAdd, notes: [input.costBasis === "dry" ? "Cost based on dry aggregate weight." : "Cost based on wet aggregate weight."],
    costBasis: input.costBasis || "wet", waterCementRatio, waterBinderRatio, flyAshKg: weightFlyAsh, slagKg: weightSlag,
    silicaFumeKg: weightSilicaFume, totalBinder, activeCementWeight, calculationMode, costBreakdown: costing.costBreakdown,
    totalCost: costing.totalCost, cementitiousMaterials: { cement: activeCementWeight, flyAsh: weightFlyAsh, slag: weightSlag, silicaFume: weightSilicaFume },
    absoluteVolumeCheck: {
      isValid: valChecks.checks.volumeClosure?.status === "valid", totalAbsVolumeL: absoluteVolumeTotal,
      cementVolL: cementVolume, waterVolL: effectiveWater, sandVolL: sandWeightDry / sDensityL, gravelVolL: gravelWeightDry / gDensityL,
      airVolL: airVolume, admixtureVolL: admixVolume, deviationPercent: volumeClosureError
    },
    compliance: { isCompliant: valChecks.valid, checks: Object.values(valChecks.checks).map((c: any) => ({ parameter: c.labelAr, requirement: c.tolerance ? `±${c.tolerance}` : "Verified", actual: String(c.messages?.[0]?.value ?? "Verified"), status: c.status === "valid" ? "compliant" : c.status === "warning" ? "warning" : "non_compliant" })) },
    methodApplicability
  } as any;
}
