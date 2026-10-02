/**
 * Shared utility for rounding values and ensuring consistent output properties.
 */
export function roundToPrecision(val: number, decimalPlaces = 0): number {
  if (!Number.isFinite(val)) return val;
  const factor = Math.pow(10, decimalPlaces);
  return Math.round(val * factor) / factor;
}

export function formatResultLanguage(
  messages: Record<string, string>,
  language: "ar" | "fr" | "en"
): string {
  return messages[language] || messages["ar"] || "";
}

function collectNonFiniteFields(value: unknown, path = "", seen = new Set<object>()): string[] {
  if (typeof value === "number") return Number.isFinite(value) ? [] : [path || "result"];
  if (!value || typeof value !== "object") return [];
  if (seen.has(value)) return [];
  seen.add(value);
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectNonFiniteFields(item, `${path}[${index}]`, seen));
  }
  return Object.entries(value).flatMap(([key, item]) =>
    collectNonFiniteFields(item, path ? `${path}.${key}` : key, seen)
  );
}

function stableSerialize(value: unknown, seen = new Set<object>()): string {
  if (value === null) return "null";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : String(value);
  if (typeof value !== "object") return JSON.stringify(value);
  if (seen.has(value as object)) return "[Circular]";
  seen.add(value as object);
  if (Array.isArray(value)) return `[${value.map(item => stableSerialize(item, seen)).join(",")}]`;
  return `{${Object.keys(value as Record<string, unknown>).sort().map(key => `${JSON.stringify(key)}:${stableSerialize((value as Record<string, unknown>)[key], seen)}`).join(",")}}`;
}

export function createInputHash(input: unknown): string {
  const serialized = stableSerialize(input);
  let hash = 2166136261;
  for (let index = 0; index < serialized.length; index += 1) {
    hash ^= serialized.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

/**
 * Keeps the legacy report/UI contract stable for specialized engines.
 * Specialized engines expose their own quantity names, while older reports
 * still read the aliases below. Blocked results retain the raw calculation
 * under `rawResult` and expose finite display aliases so rendering cannot
 * crash React on `toFixed`.
 */
export function normalizeMixDesignResult(result: any, input: any): any {
  const nonFiniteFields = collectNonFiniteFields(result);
  if (nonFiniteFields.length > 0) {
    const message = `Calculation blocked because non-finite values were produced: ${nonFiniteFields.join(", ")}.`;
    const displayNumber = (value: unknown): number => Number.isFinite(value) ? Number(value) : 0;
    const raw = result && typeof result === "object" ? result : {};
    return {
      ...raw,
      rawResult: raw,
      inputSnapshot: input,
      inputHash: createInputHash(input),
      materialSnapshot: raw.materialSnapshot || input?.materialSnapshots || {},
      calculationTrace: raw.calculationTrace || raw.trace || [],
      units: raw.units || { mass: "kg/m³", volume: "L/m³", ratio: "-", density: "kg/m³" },
      assumptions: Array.isArray(raw.assumptions) ? raw.assumptions : [],
      usedDefaults: Array.isArray(raw.usedDefaults) ? raw.usedDefaults : [],
      releaseEligibility: "blocked",
      fcm28: displayNumber(raw.fcm28),
      stdDev: displayNumber(raw.stdDev),
      wcRatio: displayNumber(raw.wcRatio),
      wcRatioAdjusted: displayNumber(raw.wcRatioAdjusted),
      cementWeight: displayNumber(raw.cementWeight),
      waterContentActual: displayNumber(raw.waterContentActual),
      waterWeightWet: displayNumber(raw.waterWeightWet),
      sandWeightDry: displayNumber(raw.sandWeightDry),
      sandWeightWet: displayNumber(raw.sandWeightWet),
      gravelWeightDry: displayNumber(raw.gravelWeightDry),
      gravelWeightWet: displayNumber(raw.gravelWeightWet),
      sandPercent: displayNumber(raw.sandPercent),
      gravelPercent: displayNumber(raw.gravelPercent),
      totalFreshDensity: displayNumber(raw.totalFreshDensity),
      admixtureWeights: Array.isArray(raw.admixtureWeights) ? raw.admixtureWeights : [],
      status: "blocked",
      calculationStatus: "blocked",
      engineStatus: "blocked",
      valid: false,
      isValid: false,
      nonFiniteFields,
      errors: [
        ...(Array.isArray(result?.errors) ? result.errors : []),
        message,
      ],
      validation: {
        ...(result?.validation && typeof result.validation === "object" ? result.validation : {}),
        isValid: false,
        errors: [
          ...(Array.isArray(result?.validation?.errors) ? result.validation.errors : []),
          { code: "NON_FINITE_RESULT", severity: "error", field: nonFiniteFields[0], message },
        ],
      },
    };
  }
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
  const calculationTrace = Array.isArray(safe.calculationTrace) ? safe.calculationTrace : Array.isArray(safe.trace) ? safe.trace : [];
  const usedDefaults = Array.isArray(safe.usedDefaults) ? safe.usedDefaults : [];
  const releaseEligibility = safe.releaseEligibility || (
    safe.calculationStatus === "blocked" || safe.engineStatus === "blocked" || safe.status === "blocked" || safe.isValid === false
      ? "blocked"
      : safe.trialMixRequired === false ? "eligible" : "trial_mix_required"
  );
  return {
    ...safe,
    methodId,
    methodName,
    method: safe.method || { id: methodId, name: methodName, version: "unknown" },
    inputSnapshot: safe.inputSnapshot || input,
    inputHash: safe.inputHash || createInputHash(safe.inputSnapshot || input),
    materialSnapshot: safe.materialSnapshot || input?.materialSnapshots || {},
    calculationTrace,
    units: safe.units || { mass: "kg/m³", volume: "L/m³", ratio: "-", density: "kg/m³" },
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
    usedDefaults,
    releaseEligibility,
    validation: safe.validation || { isValid: safe.isValid !== false, errors: [], warnings: [] },
    nonFiniteFields: [],
    valid: safe.valid !== undefined ? safe.valid : safe.isValid !== false,
    isValid: safe.isValid !== undefined ? safe.isValid : safe.valid !== false,
    calculationStatus: safe.calculationStatus || (safe.status === "not-supported" ? "blocked" : "needs_trial_mix"),
    engineStatus: safe.engineStatus || (safe.status === "not-supported" ? "blocked" : "needs_trial_mix")
  };
}
