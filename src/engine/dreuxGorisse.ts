import { MixDesignInput, MixDesignResult } from "./types";
import { calculateAbsoluteVolume } from "./absoluteVolume";
import { calculateDreuxGorisseCore } from "./dreuxGorisseCore";
import { MixDesignInput as UIMixInput } from "../types";

/**
 * Adaptor function to route calculateDreuxGorisseEngine calls to dreuxGorisseCore.
 * Ensures consistent output and 100% engine parity.
 */
export function calculateDreuxGorisseEngine(input: MixDesignInput): MixDesignResult {
  // Translate engine input format to UI input model safely
  const uiInput: UIMixInput = {
    ...input,
    aggregateType: input.aggregateType as any,
    aggregateQuality: input.aggregateQuality as any,
    cementDensity: input.cementDensity !== undefined ? input.cementDensity : 3105,
    airContent: input.airContent !== undefined ? input.airContent : 0.0,
    moistureSand: input.moistureSand !== undefined ? input.moistureSand : 0,
    moistureGravel: input.moistureGravel !== undefined ? input.moistureGravel : 0,
    sandAbsorption: input.sandAbsorption !== undefined ? input.sandAbsorption : 1.5,
    gravelAbsorption: input.gravelAbsorption !== undefined ? input.gravelAbsorption : 0.8,
    admixtures: input.admixtures || [],
    dosageSuper: input.dosageSuper !== undefined ? input.dosageSuper : 0,
    dosageAir: input.dosageAir !== undefined ? input.dosageAir : 0,
    dosageRetarder: input.dosageRetarder !== undefined ? input.dosageRetarder : 0,
    dosageAccelerator: input.dosageAccelerator !== undefined ? input.dosageAccelerator : 0,
    dosageSilicaFume: input.dosageSilicaFume !== undefined ? input.dosageSilicaFume : 0,
    dosageFlyAsh: input.dosageFlyAsh !== undefined ? input.dosageFlyAsh : 0,
    dosageSlag: input.dosageSlag !== undefined ? input.dosageSlag : 0,
    selectedMethod: "dreux",
    exposureClass: input.exposureClass || "X0",
    durabilityLevel: input.durabilityLevel || "normal",
    carbonationLevel: input.carbonationLevel || "none",
    chloridesLevel: input.chloridesLevel || "none",
    sulfatesLevel: input.sulfatesLevel || "none",
    priceCement: input.priceCement !== undefined ? input.priceCement : 17,
    priceSand: input.priceSand !== undefined ? input.priceSand : 2.5,
    priceGravel: input.priceGravel !== undefined ? input.priceGravel : 2.8,
    priceSuper: input.priceSuper !== undefined ? input.priceSuper : 120,
    priceAir: input.priceAir !== undefined ? input.priceAir : 95,
    priceRetarder: input.priceRetarder !== undefined ? input.priceRetarder : 85,
    priceAccelerator: input.priceAccelerator !== undefined ? input.priceAccelerator : 110,
    priceSilicaFume: input.priceSilicaFume !== undefined ? input.priceSilicaFume : 60,
    priceFlyAsh: input.priceFlyAsh !== undefined ? input.priceFlyAsh : 35,
    priceSlag: input.priceSlag !== undefined ? input.priceSlag : 30,
    priceLabor: input.priceLabor !== undefined ? input.priceLabor : 0,
    priceWater: input.priceWater !== undefined ? input.priceWater : 0,
    sandType: input.sandType || "washed_sand",
    gravelType: input.gravelType || "crushed_gravel",
    autoDensities: input.autoDensities !== undefined ? input.autoDensities : false
  };

  const coreResult = calculateDreuxGorisseCore(uiInput);

  // Re-verify the absolute volume using the dry weights
  const abVolume = calculateAbsoluteVolume({
    cementKg: coreResult.cementWeight,
    waterKg: coreResult.waterContentActual,
    fineAggregateKg: coreResult.sandWeightDry,
    coarseAggregateKg: coreResult.gravelWeightDry,
    admixtureKg: coreResult.admixtureWeights.reduce((s, a) => s + a.weight, 0),
    airContentPercent: input.airContent || 0.0,
    cementDensityKgM3: input.cementDensity || 3105,
    sandRelativeDensity: input.sandRelativeDensity || 2.65,
    gravelRelativeDensity: input.gravelRelativeDensity || 2.68
  });

  const totalAdmix = coreResult.admixtureWeights.reduce((s, a) => s + a.weight, 0);

  return {
    methodName: "Dreux-Gorisse",
    cementKg: Math.round(coreResult.cementWeight * 10) / 10,
    waterKg: Math.round(coreResult.waterContentActual * 10) / 10,
    fineAggregateKg: Math.round(coreResult.sandWeightDry * 10) / 10,
    coarseAggregateKg: Math.round(coreResult.gravelWeightDry * 10) / 10,
    admixtureKg: Math.round(totalAdmix * 10) / 10,
    airContentPercent: input.airContent || 0.0,
    wcRatio: parseFloat(coreResult.wcRatioAdjusted.toFixed(3)),
    freshDensityKgM3: Math.round(coreResult.totalFreshDensity * 10) / 10,
    absoluteVolumeCheck: coreResult.absoluteVolumeCheck,
    warnings: coreResult.warnings,
    errors: coreResult.errors,
    assumptions: [
      `Target fcm28 is ${coreResult.fcm28.toFixed(2)} MPa`,
      `Standard deviation σ is ${coreResult.stdDev.toFixed(2)} MPa`,
      `Georges Dreux Parameter G is ${coreResult.dreuxAggregateFactor.toFixed(2)}`,
      `Compaction Index γ is ${coreResult.compactorGamma.toFixed(3)}`
    ],
    compliance: {
      standardName: "EN 206",
      ...coreResult.compliance
    },
    standardsCompliance: coreResult.standardsCompliance,

    // Core properties preserved to prevent information loss
    isValid: coreResult.isValid,
    valid: coreResult.valid,
    recommendations: coreResult.recommendations,
    methodApplicability: coreResult.methodApplicability,
    theoreticalCementDemand: coreResult.theoreticalCementDemand,
    actualCementUsed: coreResult.actualCementUsed,
    cementLimitExceeded: coreResult.cementLimitExceeded,
    waterDemand: coreResult.waterDemand,
    waterCementRatio: coreResult.waterCementRatio,
    absoluteVolumeTotal: coreResult.absoluteVolumeTotal,
    volumeClosureError: coreResult.volumeClosureError,
    calculationNotes: coreResult.calculationNotes,
    validationSummary: coreResult.validationSummary,
  };
}
