/**
 * Shared utility for SI/metric and standard engineering unit conversions.
 */
export function kgToLiters(kg: number, densityKgPerM3: number): number {
  if (densityKgPerM3 <= 0) return 0;
  return (kg / densityKgPerM3) * 1000;
}

export function litersToKg(liters: number, densityKgPerM3: number): number {
  return (liters / 1000) * densityKgPerM3;
}

export function kgPerM3ToLbPerYd3(kgPerM3: number): number {
  return kgPerM3 * 1.68555;
}

export function lbPerYd3ToKgPerM3(lbPerYd3: number): number {
  return lbPerYd3 / 1.68555;
}
