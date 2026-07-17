export interface AbsoluteVolumeResult {
  isValid: boolean;
  totalAbsVolumeL: number;
  cementVolL: number;
  waterVolL: number;
  sandVolL: number;
  gravelVolL: number;
  airVolL: number;
  admixtureVolL: number;
  deviationPercent: number;
}

export function calculateAbsoluteVolume(params: {
  cementKg: number;
  waterKg: number;
  fineAggregateKg: number;
  coarseAggregateKg: number;
  admixtureKg?: number;
  airContentPercent: number;
  cementDensityKgM3: number;
  sandRelativeDensity: number;  // unitless relative to water
  gravelRelativeDensity: number; // unitless relative to water
}): AbsoluteVolumeResult {
  // Absolute volume in Liters (per 1 m3 which is 1000 Liters)
  const cementVolL = (params.cementKg / params.cementDensityKgM3) * 1000;
  const waterVolL = params.waterKg; // 1 kg of water = 1 Liter
  const sandVolL = params.fineAggregateKg / params.sandRelativeDensity;
  const gravelVolL = params.coarseAggregateKg / params.gravelRelativeDensity;
  const airVolL = params.airContentPercent * 10; // e.g. 1% = 10 Liters/m3
  
  // Admixture density is assumed around 1.15 g/cm3 or 1150 kg/m3
  const admixtureVolL = ((params.admixtureKg || 0) / 1.15);

  const totalAbsVolumeL = cementVolL + waterVolL + sandVolL + gravelVolL + airVolL + admixtureVolL;
  const expectedVolumeL = 1000; // 1 m³
  const deviationL = totalAbsVolumeL - expectedVolumeL;
  const deviationPercent = (deviationL / expectedVolumeL) * 100;

  // Engineering limit: Acceptable absolute volume is within +/- 1% deviation (990L to 1010L)
  const isValid = Math.abs(deviationPercent) <= 1.0;

  return {
    isValid,
    totalAbsVolumeL,
    cementVolL,
    waterVolL,
    sandVolL,
    gravelVolL,
    airVolL,
    admixtureVolL,
    deviationPercent
  };
}
