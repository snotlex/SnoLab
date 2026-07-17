/**
 * Helper to compute fresh concrete density dynamically based on dry materials weights, moisture levels and air content.
 */
export function estimateFreshConcreteDensity(params: {
  cementKg: number;
  fineAggregateDryKg: number;
  coarseAggregateDryKg: number;
  waterKg: number;
  admixtureKg?: number;
  airContentPercent: number;
}): number {
  const baseWeight = params.cementKg + params.fineAggregateDryKg + params.coarseAggregateDryKg + params.waterKg + (params.admixtureKg || 0);
  
  // Air content reduces the bulk density slightly:
  // Volume of air = airContentPercent * 10 Liters/m3 = airContentPercent / 100 m3
  // Bulk density is adjusted for the air pocket volumes:
  const airReductionFactor = 1 - (params.airContentPercent / 100);
  return baseWeight * airReductionFactor;
}
