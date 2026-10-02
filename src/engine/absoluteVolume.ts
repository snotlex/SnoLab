/**
 * Concrete Absolute Volume Closure Engine
 * 
 * Fundamental law of mix design:
 * V_total = V_cement + V_SCM + V_water + V_admixtures + V_fibers + V_aggregates + V_air = 1000 L/m³ ± tolerance
 * 
 * For each constituent i:
 * V_i (L/m³) = mass_i (kg/m³) / density_i (kg/L)
 * Or: V_i (L/m³) = mass_i (kg/m³) * 1000 / density_i (kg/m³)
 */

import { normalizeDensity } from "./densityNormalization";

export interface AbsoluteVolumeComponentDetail {
  name: string;
  massKg: number;
  densityKgM3: number;
  densityKgL: number;
  volumeL: number;
}

export interface AbsoluteVolumeResult {
  isValid: boolean;
  calculationStatus: "valid" | "blocked";
  totalAbsVolumeL: number;
  deviationL: number;
  deviationPercent: number;
  toleranceL: number;

  // Individual component volumes in Liters per 1 m³
  cementVolL: number;
  flyAshVolL: number;
  slagVolL: number;
  silicaFumeVolL: number;
  specialBinderVolL: number;
  totalBinderVolL: number;
  waterVolL: number;
  sandVolL: number;
  gravelVolL: number;
  totalAggregateVolL: number;
  airVolL: number;
  admixtureVolL: number;
  fiberVolL: number;

  components: AbsoluteVolumeComponentDetail[];
  usedDefaults: string[];
  densitySources: Record<string, "input" | "default" | "missing" | "invalid">;
  validationErrors: string[];
}

export interface AbsoluteVolumeParams {
  cementKg: number;
  waterKg: number;
  fineAggregateKg: number;
  coarseAggregateKg: number;
  airContentPercent: number;

  // Densities (can be in kg/m³ or relative specific gravity)
  cementDensityKgM3: number;
  sandRelativeDensity: number;
  gravelRelativeDensity: number;

  // SCMs
  flyAshKg?: number;
  flyAshDensityKgM3?: number;
  slagKg?: number;
  slagDensityKgM3?: number;
  silicaFumeKg?: number;
  silicaFumeDensityKgM3?: number;
  specialBinderKg?: number;
  specialBinderDensityKgM3?: number;

  // Admixtures & Fibers
  admixtureKg?: number;
  admixtureDensityKgM3?: number;
  fiberKg?: number;
  fiberDensityKgM3?: number;

  // Explicit tolerance in Liters (default ±5.0 L = ±0.5%)
  toleranceL?: number;
}

export function calculateAbsoluteVolume(params: AbsoluteVolumeParams): AbsoluteVolumeResult {
  const toleranceL = params.toleranceL ?? 5.0;
  const usedDefaults: string[] = [];
  const densitySources: Record<string, "input" | "default" | "missing" | "invalid"> = {};
  const validationErrors: string[] = [];

  // Normalize densities safely
  const cNorm = normalizeDensity(params.cementDensityKgM3, "الإسمنت");
  const sNorm = normalizeDensity(params.sandRelativeDensity, "الرمل");
  const gNorm = normalizeDensity(params.gravelRelativeDensity, "الحصى");

  const primaryDensities = [
    ["cement", cNorm],
    ["sand", sNorm],
    ["gravel", gNorm],
  ] as const;
  for (const [key, normalized] of primaryDensities) {
    densitySources[key] = normalized.isValid
      ? "input"
      : params[`${key === "cement" ? "cementDensityKgM3" : key === "sand" ? "sandRelativeDensity" : "gravelRelativeDensity"}` as keyof AbsoluteVolumeParams] === undefined
        ? "missing"
        : "invalid";
    if (!normalized.isValid) validationErrors.push(normalized.error || `${key} density is invalid.`);
  }

  const cDensKgL = cNorm.isValid ? cNorm.densityKgL : 0;
  const sDensKgL = sNorm.isValid ? sNorm.densityKgL : 0;
  const gDensKgL = gNorm.isValid ? gNorm.densityKgL : 0;

  const optionalDensity = (
    key: string,
    value: number | undefined,
    mass: number,
    fallback: number,
    materialName: string,
  ): number => {
    if (value !== undefined) {
      const normalized = normalizeDensity(value, materialName);
      densitySources[key] = normalized.isValid ? "input" : "invalid";
      if (!normalized.isValid) validationErrors.push(normalized.error || `${key} density is invalid.`);
      return normalized.isValid ? normalized.densityKgL : 0;
    }
    if (mass <= 0) {
      densitySources[key] = "missing";
      return 0;
    }
    const normalized = normalizeDensity(fallback, materialName);
    densitySources[key] = "default";
    usedDefaults.push(key);
    validationErrors.push(`${materialName} density is missing; diagnostic default ${fallback} kg/m³ was used.`);
    return normalized.isValid ? normalized.densityKgL : 0;
  };

  const faDensKgL = optionalDensity("flyAsh", params.flyAshDensityKgM3, params.flyAshKg || 0, 2250, "الرماد المتطاير");
  const slagDensKgL = optionalDensity("slag", params.slagDensityKgM3, params.slagKg || 0, 2900, "خبث الأفران");
  const sfDensKgL = optionalDensity("silicaFume", params.silicaFumeDensityKgM3, params.silicaFumeKg || 0, 2200, "غبار السيليكا");
  const sbDensKgL = optionalDensity("specialBinder", params.specialBinderDensityKgM3, params.specialBinderKg || 0, 2800, "الرابط الخاص");

  // Admixture and fiber densities
  const admixDensKgL = optionalDensity("admixture", params.admixtureDensityKgM3, params.admixtureKg || 0, 1150, "الإضافات الكيميائية");
  const fiberDensKgL = optionalDensity("fiber", params.fiberDensityKgM3, params.fiberKg || 0, 7850, "الألياف");

  // Component Volumes (Liters = kg / (kg/L))
  const volumeFromDensity = (mass: number | undefined, densityKgL: number): number => mass && densityKgL > 0 ? mass / densityKgL : 0;
  const cementVolL = volumeFromDensity(params.cementKg, cDensKgL);
  const flyAshVolL = volumeFromDensity(params.flyAshKg, faDensKgL);
  const slagVolL = volumeFromDensity(params.slagKg, slagDensKgL);
  const silicaFumeVolL = volumeFromDensity(params.silicaFumeKg, sfDensKgL);
  const specialBinderVolL = volumeFromDensity(params.specialBinderKg, sbDensKgL);
  const totalBinderVolL = cementVolL + flyAshVolL + slagVolL + silicaFumeVolL + specialBinderVolL;

  const waterVolL = params.waterKg || 0; // 1 kg water = 1 L at standard temperature
  const sandVolL = volumeFromDensity(params.fineAggregateKg, sDensKgL);
  const gravelVolL = volumeFromDensity(params.coarseAggregateKg, gDensKgL);
  const totalAggregateVolL = sandVolL + gravelVolL;

  const airVolL = (params.airContentPercent || 0) * 10; // 1% of 1000L = 10L
  const admixtureVolL = volumeFromDensity(params.admixtureKg, admixDensKgL);
  const fiberVolL = volumeFromDensity(params.fiberKg, fiberDensKgL);

  const totalAbsVolumeL = totalBinderVolL + waterVolL + totalAggregateVolL + airVolL + admixtureVolL + fiberVolL;
  const deviationL = totalAbsVolumeL - 1000;
  const deviationPercent = (deviationL / 1000) * 100;

  const isValid = validationErrors.length === 0 && Math.abs(deviationL) <= toleranceL;

  const components: AbsoluteVolumeComponentDetail[] = [
    { name: "الإسمنت (Cement)", massKg: params.cementKg, densityKgM3: cDensKgL * 1000, densityKgL: cDensKgL, volumeL: cementVolL },
    { name: "الرماد المتطاير (Fly Ash)", massKg: params.flyAshKg || 0, densityKgM3: faDensKgL * 1000, densityKgL: faDensKgL, volumeL: flyAshVolL },
    { name: "خبث الأفران (Slag)", massKg: params.slagKg || 0, densityKgM3: slagDensKgL * 1000, densityKgL: slagDensKgL, volumeL: slagVolL },
    { name: "غبار السيليكا (Silica Fume)", massKg: params.silicaFumeKg || 0, densityKgM3: sfDensKgL * 1000, densityKgL: sfDensKgL, volumeL: silicaFumeVolL },
    { name: "الرابط الخاص (Special Binder)", massKg: params.specialBinderKg || 0, densityKgM3: sbDensKgL * 1000, densityKgL: sbDensKgL, volumeL: specialBinderVolL },
    { name: "الماء الفعال (Effective Water)", massKg: params.waterKg, densityKgM3: 1000, densityKgL: 1.0, volumeL: waterVolL },
    { name: "الرمل (Sand)", massKg: params.fineAggregateKg, densityKgM3: sDensKgL * 1000, densityKgL: sDensKgL, volumeL: sandVolL },
    { name: "الحصى (Gravel)", massKg: params.coarseAggregateKg, densityKgM3: gDensKgL * 1000, densityKgL: gDensKgL, volumeL: gravelVolL },
    { name: "الهواء (Air)", massKg: 0, densityKgM3: 0, densityKgL: 0, volumeL: airVolL },
    { name: "الإضافات الكيميائية (Admixtures)", massKg: params.admixtureKg || 0, densityKgM3: admixDensKgL * 1000, densityKgL: admixDensKgL, volumeL: admixtureVolL },
    { name: "الألياف (Fibers)", massKg: params.fiberKg || 0, densityKgM3: fiberDensKgL * 1000, densityKgL: fiberDensKgL, volumeL: fiberVolL }
  ];

  return {
    isValid,
    totalAbsVolumeL,
    deviationL,
    deviationPercent,
    toleranceL,
    cementVolL,
    flyAshVolL,
    slagVolL,
    silicaFumeVolL,
    specialBinderVolL,
    totalBinderVolL,
    waterVolL,
    sandVolL,
    gravelVolL,
    totalAggregateVolL,
    airVolL,
    admixtureVolL,
    fiberVolL,
    components,
    calculationStatus: isValid ? "valid" : "blocked",
    usedDefaults,
    densitySources,
    validationErrors,
  };
}
