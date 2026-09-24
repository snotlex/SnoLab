import { MixDesignInput, MixDesignResult, Admixture, SievePoint } from "../types";
import { calculateDreuxGorisseCore } from "./dreuxGorisseCore";
import { DreuxInputResolver, DreuxGranulometryPoint } from "../services/dreuxInputResolver";
import { applyMoistureCorrection } from "./moistureCorrection";
import { validateMixDesign } from "./validation/mixValidation";
import { calculateCosting } from "./costing";

type Language = "ar" | "fr" | "en";

interface CorrectedResult extends MixDesignResult {
  engineeringAudit?: {
    engineVersion: string;
    inputResolution: {
      fullyResolved: boolean;
      resolvedCount: number;
      missingRequiredCount: number;
      invalidCount: number;
    };
    manualWcOverrideUsed: boolean;
    granularOptimization: {
      source: "approved" | "material-grading" | "pivot-fallback";
      sandPercent: number;
      gravelPercent: number;
      rmse?: number;
      sampleCount?: number;
    };
  };
  actualGradingCurve?: Array<{ size: number; passing: number; targetPassing: number }>;
  theoreticalCementDemand?: number;
  actualCementUsed?: number;
  cementLimitExceeded?: boolean;
  waterCementRatio?: number;
  waterBinderRatio?: number;
}

/**
 * Engineering correction layer around the existing Dreux-Gorisse core.
 *
 * The legacy core remains the mathematical base. This layer guarantees that:
 * - material-library values are resolved before calculation;
 * - manual W/C override is opt-in only;
 * - W/C fields consistently mean water/cement;
 * - approved/material grading can determine the sand/coarse split;
 * - moisture correction is re-applied after a grading-driven split;
 * - a cement cap is never silently presented as the design demand.
 */
export function calculateDreuxGorisseCorrected(
  rawInput: MixDesignInput,
  language: Language = "ar"
): CorrectedResult {
  const input: any = { ...rawInput };
  const materials = Array.isArray(input.materialsDatabase) ? input.materialsDatabase : [];

  // Resolve the selected material library first. Project inputs remain a fallback,
  // but a populated approved library is the primary source of truth.
  const resolved = materials.length
    ? DreuxInputResolver.resolve(rawInput, materials, language)
    : undefined;

  const resolvedInput: any = { ...input };

  if (resolved) {
    resolvedInput.cementClassStrength = resolved.cement.strengthClass || input.cementClassStrength;
    resolvedInput.cementDensity = resolved.cement.density || input.cementDensity;

    resolvedInput.sandRelativeDensity =
      resolved.fineAggregate.specificGravity || input.sandRelativeDensity;
    resolvedInput.sandAbsorption =
      resolved.fineAggregate.absorption ?? input.sandAbsorption;
    resolvedInput.moistureSand =
      resolved.fineAggregate.moisture ?? input.moistureSand;
    resolvedInput.finenessModulus =
      resolved.fineAggregate.finenessModulus || input.finenessModulus;

    resolvedInput.gravelRelativeDensity =
      resolved.coarseAggregate.specificGravity || input.gravelRelativeDensity;
    resolvedInput.gravelAbsorption =
      resolved.coarseAggregate.absorption ?? input.gravelAbsorption;
    resolvedInput.moistureGravel =
      resolved.coarseAggregate.moisture ?? input.moistureGravel;
    resolvedInput.dMax = resolved.dMax || input.dMax;
    resolvedInput.aggregateType = resolved.aggregateType || input.aggregateType;
    resolvedInput.aggregateQuality = resolved.aggregateQuality || input.aggregateQuality;
    resolvedInput.airContent =
      resolved.airContent ?? input.airContent;

    if (resolved.admixture) {
      resolvedInput.selectedAdmixtureWaterReduction =
        input.selectedAdmixtureWaterReduction ??
        resolved.admixture.waterReduction;
      resolvedInput.selectedAdmixtureDensity =
        input.selectedAdmixtureDensity ??
        resolved.admixture.density;
      if (!input.dosageSuper && resolved.admixture.dosagePercent > 0) {
        resolvedInput.dosageSuper = resolved.admixture.dosagePercent;
      }
    }

    if (resolved.scm) {
      resolvedInput.selectedScmDensity =
        input.selectedScmDensity ?? resolved.scm.density;
      resolvedInput.selectedScmWaterDemandFactor =
        input.selectedScmWaterDemandFactor ?? resolved.scm.waterDemandFactor;
      resolvedInput.selectedScmPozzolanicIndex =
        input.selectedScmPozzolanicIndex ?? resolved.scm.pozzolanicIndex;
    }
  }

  // The old field internalWcOverride is also used by recommendation helpers.
  // It must never become an implicit mathematical override.
  const manualOverrideEnabled =
    input.useManualWcOverride === true &&
    typeof input.internalWcOverride === "number" &&
    isFinite(input.internalWcOverride) &&
    input.internalWcOverride > 0;

  if (!manualOverrideEnabled) {
    delete resolvedInput.internalWcOverride;
  }

  // Honour all explicitly entered admixture rows when the newer structured array
  // is populated. The legacy flat fields remain compatible with existing projects.
  applyAdmixtureRows(resolvedInput);

  const baseResult = calculateDreuxGorisseCore(resolvedInput, language) as CorrectedResult;

  // Normalize the meaning of these fields. In the result contract W/C must mean
  // effective water divided by actual cementitious cement, while W/B is separate.
  const correctedWc = safeRatio(
    Number(baseResult.effectiveWater ?? baseResult.waterContentActual ?? 0),
    Number(baseResult.cementWeight ?? 0)
  );
  const correctedWb = safeRatio(
    Number(baseResult.effectiveWater ?? baseResult.waterContentActual ?? 0),
    Number(baseResult.totalBinder ?? baseResult.cementWeight ?? 0)
  );

  baseResult.wcRatioAdjusted = correctedWc;
  baseResult.waterCementRatio = correctedWc;
  baseResult.waterBinderRatio = correctedWb;
  baseResult.wcRatio = Number.isFinite(Number(baseResult.wcRatio))
    ? Number(baseResult.wcRatio)
    : correctedWc;

  // The engine historically capped cement to 550 kg/m³. Keep the diagnostic
  // result mathematically honest: expose the theoretical demand rather than
  // silently presenting the capped quantity as the design demand.
  const theoreticalCement = Number(baseResult.theoreticalCementDemand);
  if (
    !isCementless(resolvedInput) &&
    baseResult.cementLimitExceeded === true &&
    Number.isFinite(theoreticalCement) &&
    theoreticalCement > 0
  ) {
    baseResult.cementWeight = theoreticalCement;
    baseResult.actualCementUsed = theoreticalCement;
    baseResult.isValid = false;
    baseResult.valid = false;
    baseResult.engineStatus = "blocked";
    baseResult.errors = [
      ...(baseResult.errors || []),
      localized(
        language,
        "الطلب النظري على الإسمنت تجاوز الحد المطبق لطريقة درو-غوريس؛ لم يعد الناتج مقبولاً كخلطة نهائية.",
        "The theoretical cement demand exceeds the configured Dreux-Gorisse limit; the result is diagnostic only and is not accepted as a final mix.",
        "La demande théorique en ciment dépasse la limite configurée de Dreux-Gorisse ; le résultat reste diagnostic et n'est pas accepté comme formulation finale."
      )
    ];
  }

  // Use approved/material grading data to solve the fine/coarse split.
  const grading = resolveGrading(
    resolvedInput,
    resolved,
    baseResult
  );

  if (grading) {
    recomputeAggregateMasses(baseResult, resolvedInput, grading.sandPercent, grading.gravelPercent);
  }

  // Re-run moisture correction after any grading-driven aggregate mass change.
  refreshMoistureAndBatchData(baseResult, resolvedInput);

  // Final W/C values must be recalculated after all binder/material corrections.
  baseResult.waterCementRatio = safeRatio(
    Number(baseResult.effectiveWater ?? baseResult.waterContentActual ?? 0),
    Number(baseResult.cementWeight ?? 0)
  );
  baseResult.wcRatioAdjusted = baseResult.waterCementRatio;
  baseResult.waterBinderRatio = safeRatio(
    Number(baseResult.effectiveWater ?? baseResult.waterContentActual ?? 0),
    Number(baseResult.totalBinder ?? baseResult.cementWeight ?? 0)
  );

  // Revalidate against the final quantities, not the pre-optimization quantities.
  const validationResult = validateMixDesign(resolvedInput, {
    ...baseResult,
    cementKg: baseResult.cementWeight,
    waterKg: baseResult.waterContentActual,
    fineAggregateKg: baseResult.sandWeightDry,
    coarseAggregateKg: baseResult.gravelWeightDry,
    admixtureKg: (baseResult.admixtureWeights || []).reduce((s, a) => s + a.weight, 0),
    wcRatio: baseResult.waterCementRatio,
    totalFreshDensity: baseResult.totalFreshDensity,
    flyAshKg: baseResult.flyAshKg || 0,
    slagKg: baseResult.slagKg || 0,
    silicaFumeKg: baseResult.silicaFumeKg || 0,
    totalBinder: baseResult.totalBinder,
    fiberKg: (baseResult as any).fiberKg || 0,
    specialBinderKg: (baseResult as any).specialBinderKg || 0,
  });

  baseResult.errors = [
    ...new Set([
      ...(baseResult.errors || []),
      ...validationResult.errors.map(e => e.message)
    ])
  ];
  baseResult.warnings = [
    ...new Set([
      ...(baseResult.warnings || []),
      ...validationResult.warnings.map(w => w.message)
    ])
  ];

  if (!validationResult.isValid || baseResult.cementLimitExceeded) {
    baseResult.isValid = false;
    baseResult.valid = false;
    baseResult.engineStatus = "blocked";
  }

  const actualCurve = grading?.actualGradingCurve;

  baseResult.engineeringAudit = {
    engineVersion: "dreux-gorisse-corrected-2026.09",
    inputResolution: {
      fullyResolved: resolved?.trace.isFullyResolved ?? false,
      resolvedCount: resolved?.trace.resolvedInputsCount ?? 0,
      missingRequiredCount: resolved?.trace.missingRequiredCount ?? 0,
      invalidCount: resolved?.trace.invalidInputsCount ?? 0,
    },
    manualWcOverrideUsed: manualOverrideEnabled,
    granularOptimization: {
      source: grading?.source ?? "pivot-fallback",
      sandPercent: Number(baseResult.sandPercent || 0),
      gravelPercent: Number(baseResult.gravelPercent || 0),
      rmse: grading?.rmse,
      sampleCount: grading?.sampleCount,
    },
  };

  if (actualCurve) {
    baseResult.actualGradingCurve = actualCurve;
  }

  return baseResult;
}

function applyAdmixtureRows(input: any): void {
  const rows = Array.isArray(input.admixtures) ? (input.admixtures as Admixture[]) : [];
  if (!rows.length) return;

  let superDosage = 0;
  let airDosage = 0;
  let retarderDosage = 0;
  let acceleratorDosage = 0;
  let weightedReductionNumerator = 0;
  let weightedReductionDenominator = 0;

  for (const row of rows) {
    const type = String(row?.type || "").toLowerCase();
    const dosage = Number((row as any)?.dosage ?? (row as any)?.dosagePercent ?? 0);
    if (!Number.isFinite(dosage) || dosage <= 0) continue;

    if (type === "superplasticizer") {
      superDosage += dosage;
      const wr = Number((row as any)?.waterReduction ?? 0);
      if (Number.isFinite(wr) && wr > 0) {
        weightedReductionNumerator += dosage * wr;
        weightedReductionDenominator += dosage;
      }
    } else if (type === "air_entraining") {
      airDosage += dosage;
    } else if (type === "retarder") {
      retarderDosage += dosage;
    } else if (type === "accelerator") {
      acceleratorDosage += dosage;
    }
  }

  if (superDosage > 0) input.dosageSuper = superDosage;
  if (airDosage > 0) input.dosageAir = airDosage;
  if (retarderDosage > 0) input.dosageRetarder = retarderDosage;
  if (acceleratorDosage > 0) input.dosageAccelerator = acceleratorDosage;

  if (
    input.selectedAdmixtureWaterReduction === undefined &&
    weightedReductionDenominator > 0
  ) {
    input.selectedAdmixtureWaterReduction =
      weightedReductionNumerator / weightedReductionDenominator;
  }
}

function resolveGrading(
  input: any,
  resolved: ReturnType<typeof DreuxInputResolver.resolve> | undefined,
  result: CorrectedResult
): {
  source: "approved" | "material-grading";
  sandPercent: number;
  gravelPercent: number;
  rmse: number;
  sampleCount: number;
  actualGradingCurve: Array<{ size: number; passing: number; targetPassing: number }>;
} | undefined {
  const approvedSand = Number(input.approvedSandPercent);
  const approvedGravel = Number(input.approvedGravelPercent);

  if (
    input.isGranularOptimizedApproved === true &&
    Number.isFinite(approvedSand) &&
    Number.isFinite(approvedGravel) &&
    approvedSand >= 0 &&
    approvedGravel >= 0 &&
    Math.abs(approvedSand + approvedGravel - 100) <= 0.5
  ) {
    return buildActualCurve(
      input,
      result,
      approvedSand,
      approvedGravel,
      resolved
    );
  }

  const sandCurve = normalizePoints(resolved?.fineAggregate.gradationData);
  const gravelCurve = normalizePoints(resolved?.coarseAggregate.gradationData);
  if (sandCurve.length < 3 || gravelCurve.length < 3) return undefined;

  const targetPoints = result.gradingCurve || [];
  const sizes = uniqueSorted([
    ...sandCurve.map(p => p.sieveSize),
    ...gravelCurve.map(p => p.sieveSize),
    ...targetPoints.map(p => p.size)
  ]).filter(s => s > 0 && s <= Number(input.dMax));

  if (sizes.length < 3) return undefined;

  let bestP = Number(result.sandPercent || 35);
  let bestRmse = Number.POSITIVE_INFINITY;

  for (let p = 0; p <= 100; p += 0.5) {
    const errors: number[] = [];
    for (const size of sizes) {
      const sandPassing = interpolatePassing(sandCurve, size);
      const gravelPassing = interpolatePassing(gravelCurve, size);
      const targetPassing = interpolateTarget(targetPoints, size);
      const blendPassing = (p / 100) * sandPassing + (1 - p / 100) * gravelPassing;
      errors.push(blendPassing - targetPassing);
    }

    const rmse = Math.sqrt(
      errors.reduce((sum, value) => sum + value * value, 0) / errors.length
    );

    if (rmse < bestRmse) {
      bestRmse = rmse;
      bestP = p;
    }
  }

  return buildActualCurve(
    input,
    result,
    bestP,
    100 - bestP,
    resolved,
    bestRmse,
    sizes.length
  );
}

function buildActualCurve(
  input: any,
  result: CorrectedResult,
  sandPercent: number,
  gravelPercent: number,
  resolved?: ReturnType<typeof DreuxInputResolver.resolve>,
  rmse = 0,
  sampleCount = 0
) {
  const sandCurve = normalizePoints(resolved?.fineAggregate.gradationData);
  const gravelCurve = normalizePoints(resolved?.coarseAggregate.gradationData);
  const targetPoints = result.gradingCurve || [];
  const sizes = uniqueSorted([
    ...sandCurve.map(p => p.sieveSize),
    ...gravelCurve.map(p => p.sieveSize),
    ...targetPoints.map(p => p.size)
  ]).filter(s => s > 0 && s <= Number(input.dMax));

  const hasMaterialGradation =
    sandCurve.length >= 3 && gravelCurve.length >= 3;

  const actualGradingCurve = hasMaterialGradation
    ? sizes.map(size => ({
        size,
        passing:
          (sandPercent / 100) * interpolatePassing(sandCurve, size) +
          (gravelPercent / 100) * interpolatePassing(gravelCurve, size),
        targetPassing: interpolateTarget(targetPoints, size),
      }))
    : [];

  return {
    source:
      input.isGranularOptimizedApproved === true ? "approved" as const : "material-grading" as const,
    sandPercent,
    gravelPercent,
    rmse,
    sampleCount,
    actualGradingCurve,
  };
}

function recomputeAggregateMasses(
  result: CorrectedResult,
  input: any,
  sandPercent: number,
  gravelPercent: number
): void {
  const aggregateVolumeL = Number(result.totalAggregateVolume || 0);
  if (!(aggregateVolumeL > 0)) return;

  const sandSG = normalizeSpecificGravity(input.sandRelativeDensity);
  const gravelSG = normalizeSpecificGravity(input.gravelRelativeDensity);
  if (!(sandSG > 0) || !(gravelSG > 0)) return;

  result.sandPercent = sandPercent;
  result.gravelPercent = gravelPercent;
  result.sandWeightDry = aggregateVolumeL * (sandPercent / 100) * sandSG;
  result.gravelWeightDry = aggregateVolumeL * (gravelPercent / 100) * gravelSG;
}

function refreshMoistureAndBatchData(result: CorrectedResult, input: any): void {
  const effectiveWater = Number(result.effectiveWater ?? result.waterContentActual ?? 0);
  const sandDry = Number(result.sandWeightDry || 0);
  const gravelDry = Number(result.gravelWeightDry || 0);
  if (!(effectiveWater >= 0) || !(sandDry >= 0) || !(gravelDry >= 0)) return;

  const sandAbs = Number(input.sandAbsorption ?? 0);
  const gravelAbs = Number(input.gravelAbsorption ?? 0);
  const sandMoisture = Number(input.moistureSand ?? 0);
  const gravelMoisture = Number(input.moistureGravel ?? 0);

  const correction = applyMoistureCorrection({
    sandDryKg: sandDry,
    gravelDryKg: gravelDry,
    sandMoisturePercent: sandMoisture,
    gravelMoisturePercent: gravelMoisture,
    sandAbsorptionPercent: sandAbs,
    gravelAbsorptionPercent: gravelAbs,
    effectiveWaterKg: effectiveWater,
  });

  result.sandWeightWet = correction.sandWetKg;
  result.gravelWeightWet = correction.gravelWetKg;
  result.waterToAdd = correction.waterToAddKg;
  result.batchWaterToAdd = correction.waterToAddKg;
  result.waterWeightWet = correction.waterToAddKg;
  result.aggregateFreeWater = correction.totalFreeSurfaceWaterKg - correction.totalAbsorptionDeficitKg;
  result.totalAggregateMoistureWater =
    correction.fineAggregate.moistureWaterKg + correction.coarseAggregate.moistureWaterKg;
  result.sandTotalMoistureWater = correction.fineAggregate.moistureWaterKg;
  result.gravelTotalMoistureWater = correction.coarseAggregate.moistureWaterKg;
  result.totalFreeSurfaceWater = correction.totalFreeSurfaceWaterKg;
  result.sandFreeSurfaceWater = correction.fineAggregate.freeSurfaceWaterKg;
  result.gravelFreeSurfaceWater = correction.coarseAggregate.freeSurfaceWaterKg;
  result.totalAbsorptionDeficit = correction.totalAbsorptionDeficitKg;
  result.sandAbsorptionDeficit = correction.fineAggregate.absorptionDeficitKg;
  result.gravelAbsorptionDeficit = correction.coarseAggregate.absorptionDeficitKg;
  result.totalAbsorptionWater =
    sandDry * sandAbs / 100 + gravelDry * gravelAbs / 100;
  result.sandAbsorptionWater = sandDry * sandAbs / 100;
  result.gravelAbsorptionWater = gravelDry * gravelAbs / 100;
  result.sandMoistureWater = correction.fineAggregate.moistureWaterKg;
  result.gravelMoistureWater = correction.coarseAggregate.moistureWaterKg;

  const cement = Number(result.cementWeight || 0);
  const admix = (result.admixtureWeights || []).reduce((s, a) => s + a.weight, 0);
  const fiber = Number((result as any).fiberKg || input.fiberDosageKgM3 || 0);
  const specialBinder = Number((result as any).specialBinderKg || 0);
  result.totalFreshDensity =
    cement +
    Number(result.flyAshKg || 0) +
    Number(result.slagKg || 0) +
    Number(result.silicaFumeKg || 0) +
    sandDry +
    gravelDry +
    effectiveWater +
    admix +
    fiber +
    specialBinder;

  result.effectiveWater = effectiveWater;
  result.waterContentActual = effectiveWater;
  result.totalBinder = Number(result.totalBinder ?? scm);
  result.totalAggregateVolume = Number(result.totalAggregateVolume || 0);

  // Recompute the cost because the wet aggregate masses changed.
  const prices = {
    priceCement: Number(input.priceCement ?? 17),
    priceSand: Number(input.priceSand ?? 2.5),
    priceGravel: Number(input.priceGravel ?? 2.8),
    priceSuper: Number(input.priceSuper ?? 120),
    priceAir: Number(input.priceAir ?? 95),
    priceRetarder: Number(input.priceRetarder ?? 85),
    priceAccelerator: Number(input.priceAccelerator ?? 110),
    priceSilicaFume: Number(input.priceSilicaFume ?? 60),
    priceFlyAsh: Number(input.priceFlyAsh ?? 35),
    priceSlag: Number(input.priceSlag ?? 30),
    priceLabor: Number(input.priceLabor ?? 0),
    priceWater: Number(input.priceWater ?? 0),
    priceFiber: Number(input.priceFiber ?? 0),
    priceSpecialBinder: Number(input.priceSpecialBinder ?? 0),
  };

  const costing = calculateCosting({
    cementKg: cement,
    flyAshKg: Number(result.flyAshKg || 0),
    slagKg: Number(result.slagKg || 0),
    silicaFumeKg: Number(result.silicaFumeKg || 0),
    sandDryKg: sandDry,
    gravelDryKg: gravelDry,
    sandWetKg: result.sandWeightWet,
    gravelWetKg: result.gravelWeightWet,
    costBasis: input.costBasis || "wet",
    batchWaterLiters: correction.waterToAddKg,
    admixtureWeights: result.admixtureWeights || [],
    fiberKg: fiber,
    specialBinderKg: specialBinder,
    prices,
  });

  result.costBreakdown = costing.costBreakdown;
  result.totalCost = costing.totalCost;

  if (result.mixQuantitySummary?.length) {
    result.mixQuantitySummary[0] = {
      ...result.mixQuantitySummary[0],
      sand: Math.round(sandDry),
      gravel: Math.round(gravelDry),
      wcRatio: Number(result.waterCementRatio?.toFixed(2) || 0),
      cost: Math.round(costing.totalCost),
    };
  }
}

function interpolatePassing(points: DreuxGranulometryPoint[], size: number): number {
  if (!points.length) return 0;
  if (size <= points[0].sieveSize) return points[0].percentPassing;
  if (size >= points[points.length - 1].sieveSize) return points[points.length - 1].percentPassing;

  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    if (size <= b.sieveSize) {
      const la = Math.log10(Math.max(a.sieveSize, 0.001));
      const lb = Math.log10(Math.max(b.sieveSize, 0.001));
      const lx = Math.log10(Math.max(size, 0.001));
      const t = lb === la ? 0 : (lx - la) / (lb - la);
      return a.percentPassing + (b.percentPassing - a.percentPassing) * t;
    }
  }

  return points[points.length - 1].percentPassing;
}

function interpolateTarget(points: SievePoint[], size: number): number {
  if (!points.length) return 100;
  const normalized = points.map(p => ({ sieveSize: p.size, percentPassing: p.targetPassing }));
  return interpolatePassing(normalized, size);
}

function normalizePoints(points: DreuxGranulometryPoint[] | undefined): DreuxGranulometryPoint[] {
  return (points || [])
    .filter(p => Number.isFinite(p.sieveSize) && p.sieveSize > 0 && Number.isFinite(p.percentPassing))
    .sort((a, b) => a.sieveSize - b.sieveSize);
}

function uniqueSorted(values: number[]): number[] {
  return Array.from(new Set(values.map(v => Number(v.toFixed(6))))).sort((a, b) => a - b);
}

function normalizeSpecificGravity(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return value > 10 ? value / 1000 : value;
}

function safeRatio(a: number, b: number): number {
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= 0) return 0;
  return a / b;
}

function isCementless(input: any): boolean {
  const code = String(input?.concreteType || "").toUpperCase();
  return code === "GPC" || code.includes("GEOPOLYMER") || code.includes("GEO-POLYMER");
}

function localized(
  language: Language,
  ar: string,
  en: string,
  fr: string
): string {
  return language === "ar" ? ar : language === "fr" ? fr : en;
}
