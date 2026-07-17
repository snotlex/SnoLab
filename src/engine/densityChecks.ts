export interface DensityCheckResult {
  isHealthy: boolean;
  freshDensityKgM3: number;
  warnings: string[];
}

export function checkFreshDensity(params: {
  cementKg: number;
  waterKg: number;
  fineAggregateKg: number;
  coarseAggregateKg: number;
  admixtureKg?: number;
}): DensityCheckResult {
  const freshDensityKgM3 = 
    params.cementKg + 
    params.waterKg + 
    params.fineAggregateKg + 
    params.coarseAggregateKg + 
    (params.admixtureKg || 0);

  const warnings: string[] = [];
  let isHealthy = true;

  // Normal fresh density range for standard concrete is 2200 to 2500 kg/m3
  if (freshDensityKgM3 < 2100) {
    warnings.push(`Low fresh density detected (${Math.round(freshDensityKgM3)} kg/m³). This is typical for Lightweight Concrete (LWC) but atypical for Normal Concrete.`);
    isHealthy = false;
  } else if (freshDensityKgM3 > 2600) {
    warnings.push(`High fresh density detected (${Math.round(freshDensityKgM3)} kg/m³). This is typical for Heavyweight Concrete (HWC) but atypical for Normal Concrete.`);
    isHealthy = false;
  }

  return {
    isHealthy,
    freshDensityKgM3,
    warnings
  };
}
