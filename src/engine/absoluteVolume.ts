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

  // Normalize densities safely
  const cNorm = normalizeDensity(params.cementDensityKgM3, "الإسمنت");
  const sNorm = normalizeDensity(params.sandRelativeDensity, "الرمل");
  const gNorm = normalizeDensity(params.gravelRelativeDensity, "الحصى");

  const cDensKgL = cNorm.isValid ? cNorm.densityKgL : 3.1;
  const sDensKgL = sNorm.isValid ? sNorm.densityKgL : 2.65;
  const gDensKgL = gNorm.isValid ? gNorm.densityKgL : 2.68;

  // SCM densities (defaults: Fly ash 2.25, Slag 2.90, Silica Fume 2.20)
  const faNorm = normalizeDensity(params.flyAshDensityKgM3 || 2250, "الرماد المتطاير");
  const slagNorm = normalizeDensity(params.slagDensityKgM3 || 2900, "خبث الأفران");
  const sfNorm = normalizeDensity(params.silicaFumeDensityKgM3 || 2200, "غبار السيليكا");
  const sbNorm = normalizeDensity(params.specialBinderDensityKgM3 || 2800, "الرابط الخاص");

  const faDensKgL = faNorm.isValid ? faNorm.densityKgL : 2.25;
  const slagDensKgL = slagNorm.isValid ? slagNorm.densityKgL : 2.90;
  const sfDensKgL = sfNorm.isValid ? sfNorm.densityKgL : 2.20;
  const sbDensKgL = sbNorm.isValid ? sbNorm.densityKgL : 2.80;

  // Admixture and fiber densities
  const admixNorm = normalizeDensity(params.admixtureDensityKgM3 || 1150, "الإضافات الكيميائية");
  const admixDensKgL = admixNorm.isValid ? admixNorm.densityKgL : 1.15;

  const fiberNorm = normalizeDensity(params.fiberDensityKgM3 || 7850, "الألياف");
  const fiberDensKgL = fiberNorm.isValid ? fiberNorm.densityKgL : 7.85;

  // Component Volumes (Liters = kg / (kg/L))
  const cementVolL = (params.cementKg || 0) / cDensKgL;
  const flyAshVolL = (params.flyAshKg || 0) / faDensKgL;
  const slagVolL = (params.slagKg || 0) / slagDensKgL;
  const silicaFumeVolL = (params.silicaFumeKg || 0) / sfDensKgL;
  const specialBinderVolL = (params.specialBinderKg || 0) / sbDensKgL;
  const totalBinderVolL = cementVolL + flyAshVolL + slagVolL + silicaFumeVolL + specialBinderVolL;

  const waterVolL = params.waterKg || 0; // 1 kg water = 1 L at standard temperature
  const sandVolL = (params.fineAggregateKg || 0) / sDensKgL;
  const gravelVolL = (params.coarseAggregateKg || 0) / gDensKgL;
  const totalAggregateVolL = sandVolL + gravelVolL;

  const airVolL = (params.airContentPercent || 0) * 10; // 1% of 1000L = 10L
  const admixtureVolL = (params.admixtureKg || 0) / admixDensKgL;
  const fiberVolL = (params.fiberKg || 0) / fiberDensKgL;

  const totalAbsVolumeL = totalBinderVolL + waterVolL + totalAggregateVolL + airVolL + admixtureVolL + fiberVolL;
  const deviationL = totalAbsVolumeL - 1000;
  const deviationPercent = (deviationL / 1000) * 100;

  const isValid = Math.abs(deviationL) <= toleranceL;

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
    components
  };
}
