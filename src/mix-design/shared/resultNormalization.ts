/**
 * Shared utility for rounding values and ensuring consistent output properties.
 */
export function roundToPrecision(val: number, decimalPlaces = 0): number {
  if (val === undefined || val === null || isNaN(val)) return 0;
  const factor = Math.pow(10, decimalPlaces);
  return Math.round(val * factor) / factor;
}

export function formatResultLanguage(
  messages: Record<string, string>,
  language: "ar" | "fr" | "en"
): string {
  return messages[language] || messages["ar"] || "";
}

/**
 * Keeps the legacy report/UI contract stable for specialized engines.
 * Specialized engines expose their own quantity names, while older reports
 * still read the aliases below. Missing values become finite values so a
 * blocked/diagnostic result can render instead of crashing React on `toFixed`.
 */
export function normalizeMixDesignResult(result: any, input: any): any {
  const numberOr = (value: unknown, fallback = 0): number => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };
  const firstNumber = (...values: unknown[]): number => {
    for (const value of values) {
      const n = Number(value);
      if (Number.isFinite(n)) return n;
    }
    return 0;
  };
  const safe = result && typeof result === "object" ? result : {};
  const cementWeight = firstNumber(safe.cementWeight, safe.cementKg, safe.quantities?.cement);
  const waterContentActual = firstNumber(safe.waterContentActual, safe.waterKg, safe.quantities?.effectiveWater, safe.quantities?.addedWater);
  const sandWeightDry = firstNumber(safe.sandWeightDry, safe.fineAggregateKg, safe.quantities?.fineAggregates);
  const gravelWeightDry = firstNumber(safe.gravelWeightDry, safe.coarseAggregateKg, safe.quantities?.coarseAggregates);
  const wcRatio = firstNumber(safe.wcRatio, safe.waterCementRatio, safe.ratios?.waterCementRatio, safe.ratios?.waterBinderRatio);
  const totalAggregate = sandWeightDry + gravelWeightDry;
  const sandPercent = firstNumber(safe.sandPercent, totalAggregate > 0 ? (sandWeightDry / totalAggregate) * 100 : 0);
  const gravelPercent = firstNumber(safe.gravelPercent, totalAggregate > 0 ? (gravelWeightDry / totalAggregate) * 100 : 0);
  const fck = numberOr(input?.fck28, 0);
  const defaultMargin = input?.controlClass === "high" ? 6 : input?.controlClass === "low" ? 12 : 8;
  const fcm28 = firstNumber(safe.fcm28, fck > 0 ? fck + defaultMargin : 0);
  const stdDev = firstNumber(safe.stdDev, fcm28 > fck ? (fcm28 - fck) / 1.64 : 0);
  const moistureSand = numberOr(input?.moistureSand, 0);
  const moistureGravel = numberOr(input?.moistureGravel, 0);
  const sandWeightWet = firstNumber(safe.sandWeightWet, sandWeightDry * (1 + moistureSand / 100));
  const gravelWeightWet = firstNumber(safe.gravelWeightWet, gravelWeightDry * (1 + moistureGravel / 100));
  const admixtureWeights = Array.isArray(safe.admixtureWeights) ? safe.admixtureWeights : [];
  const totalFreshDensity = firstNumber(safe.totalFreshDensity, safe.freshDensity, safe.freshDensityKgM3, cementWeight + waterContentActual + sandWeightDry + gravelWeightDry + admixtureWeights.reduce((sum: number, item: any) => sum + numberOr(item?.weight), 0));
  const complianceChecks = Array.isArray(safe.standardsCompliance) ? safe.standardsCompliance : Array.isArray(safe.compliance?.checks) ? safe.compliance.checks : [];
  const methodId = safe.methodId || safe.method?.id || input?.methodId || "unknown";
  const methodName = safe.methodName || safe.method?.name || methodId;
  const volumeTotal = firstNumber(safe.absoluteVolumeTotal, safe.physicalProperties?.absoluteVolume);
  const volumeError = firstNumber(safe.volumeClosureError, safe.physicalProperties?.volumeClosureError);
  return {
    ...safe,
    methodId,
    methodName,
    method: safe.method || { id: methodId, name: methodName, version: "unknown" },
    inputSnapshot: safe.inputSnapshot || input,
    cementWeight,
    cementWeightDry: firstNumber(safe.cementWeightDry, cementWeight),
    waterContentActual,
    waterContentNeeded: firstNumber(safe.waterContentNeeded, waterContentActual),
    waterToAdd: firstNumber(safe.waterToAdd, safe.batchWaterToAdd, waterContentActual),
    waterWeightWet: firstNumber(safe.waterWeightWet, safe.waterToAdd, waterContentActual),
    sandWeightDry,
    gravelWeightDry,
    sandWeightWet,
    gravelWeightWet,
    admixtureWeights,
    wcRatio,
    waterCementRatio: firstNumber(safe.waterCementRatio, wcRatio),
    wcRatioAdjusted: firstNumber(safe.wcRatioAdjusted, wcRatio),
    waterBinderRatio: firstNumber(safe.waterBinderRatio, safe.ratios?.waterBinderRatio, wcRatio),
    fcm28,
    stdDev,
    sandPercent,
    gravelPercent,
    compactorGamma: firstNumber(safe.compactorGamma),
    pivotPoint: safe.pivotPoint || { x: 0, y: sandPercent },
    totalFreshDensity,
    freshDensity: firstNumber(safe.freshDensity, totalFreshDensity),
    totalAggregateVolume: firstNumber(safe.totalAggregateVolume, totalAggregate),
    absoluteVolumeTotal: volumeTotal,
    volumeClosureError: volumeError,
    absoluteVolumeCheck: safe.absoluteVolumeCheck && typeof safe.absoluteVolumeCheck === "object" ? safe.absoluteVolumeCheck : { isValid: volumeError <= 2, totalAbsVolumeL: volumeTotal, deviationPercent: volumeError / 10 },
    standardsCompliance: complianceChecks,
    compliance: safe.compliance || { standardName: "Specialized concrete engineering framework", isCompliant: false, checks: complianceChecks },
    warnings: Array.isArray(safe.warnings) ? safe.warnings : [],
    errors: Array.isArray(safe.errors) ? safe.errors : [],
    assumptions: Array.isArray(safe.assumptions) ? safe.assumptions : [],
    validation: safe.validation || { isValid: safe.isValid !== false, errors: [], warnings: [] },
    valid: safe.valid !== undefined ? safe.valid : safe.isValid !== false,
    isValid: safe.isValid !== undefined ? safe.isValid : safe.valid !== false,
    calculationStatus: safe.calculationStatus || (safe.status === "not-supported" ? "blocked" : "needs_trial_mix"),
    engineStatus: safe.engineStatus || (safe.status === "not-supported" ? "blocked" : "needs_trial_mix")
  };
}
