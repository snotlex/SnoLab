/**
 * Legacy Adapter
 * 
 * This file coordinates structures between the legacy systems (src/types.ts / src/utils.ts)
 * and the newly modularized concrete engineering engine (src/engine/*).
 * 
 * WARNING: This adapter is temporary and is designed to preserve backwards compatibility
 * during Phase 1.5. It will be refactored or removed in Phase 2 when complete absolute volume
 * and fresh density calculation updates are executed.
 */

import { MixDesignInput as LegacyInput, MixDesignResult as LegacyResult } from "../types";
import { MixDesignInput as EngineInput, MixDesignResult as EngineResult } from "./types";

/**
 * Transforms legacy user inputs into the structured types required by the clean engine.
 */
export function adaptLegacyInput(legacyInput: LegacyInput): EngineInput {
  return {
    fck28: legacyInput.fck28,
    controlClass: legacyInput.controlClass,
    cementType: legacyInput.cementType,
    cementClassStrength: legacyInput.cementClassStrength,
    dMax: legacyInput.dMax,
    slump: legacyInput.slump,
    aggregateType: legacyInput.aggregateType === "roule" ? "roule" : "concasse",
    aggregateQuality: legacyInput.aggregateQuality === "excellent" ? "excellent" : legacyInput.aggregateQuality === "poor" ? "poor" : "standard",
    hasPumping: legacyInput.hasPumping,
    sandRelativeDensity: legacyInput.sandRelativeDensity,
    gravelRelativeDensity: legacyInput.gravelRelativeDensity,
    cementDensity: legacyInput.cementDensity,
    airContent: legacyInput.airContent,
    moistureSand: legacyInput.moistureSand,
    moistureGravel: legacyInput.moistureGravel,
    
    // Custom dosages
    dosageSuper: legacyInput.dosageSuper,
    dosageAir: legacyInput.dosageAir,
    dosageRetarder: legacyInput.dosageRetarder,
    dosageAccelerator: legacyInput.dosageAccelerator,
    dosageSilicaFume: legacyInput.dosageSilicaFume,
    dosageFlyAsh: legacyInput.dosageFlyAsh,
    dosageSlag: legacyInput.dosageSlag,

    selectedMethod: legacyInput.selectedMethod,
    exposureClass: legacyInput.exposureClass,
    durabilityLevel: legacyInput.durabilityLevel,
    carbonationLevel: legacyInput.carbonationLevel,
    chloridesLevel: legacyInput.chloridesLevel,
    sulfatesLevel: legacyInput.sulfatesLevel,
    
    // Custom prices
    priceCement: legacyInput.priceCement,
    priceSand: legacyInput.priceSand,
    priceGravel: legacyInput.priceGravel,
    priceSuper: legacyInput.priceSuper,
    priceAir: legacyInput.priceAir,
    priceRetarder: legacyInput.priceRetarder,
    priceAccelerator: legacyInput.priceAccelerator,
    priceSilicaFume: legacyInput.priceSilicaFume,
    priceFlyAsh: legacyInput.priceFlyAsh,
    priceSlag: legacyInput.priceSlag,
    priceLabor: legacyInput.priceLabor,
    priceWater: legacyInput.priceWater,

    concreteType: legacyInput.concreteType,
    sandType: legacyInput.sandType,
    gravelType: legacyInput.gravelType,
    autoDensities: legacyInput.autoDensities,
    hydrationStrengthRatio: (legacyInput as any).hydrationStrengthRatio
  };
}

/**
 * Transforms clean engine results back into the legacy format expected by existing layouts.
 */
export function adaptEngineResultToLegacy(engineResult: EngineResult, legacyInput: LegacyInput): LegacyResult {
  const result: any = {
    fcm28: legacyInput.fck28 + 1.64 * (legacyInput.controlClass === "high" ? 4.0 : legacyInput.controlClass === "low" ? 8.0 : 6.0),
    stdDev: legacyInput.controlClass === "high" ? 4.0 : legacyInput.controlClass === "low" ? 8.0 : 6.0,
    wcRatio: engineResult.wcRatio,
    wcRatioAdjusted: engineResult.wcRatio * 0.95, // Simple typical reduction mapping
    dreuxAggregateFactor: legacyInput.aggregateType === "roule" ? 0.50 : 0.40,
    compactorGamma: 1.0,
    waterBeforeCorrection: engineResult.waterKg * 1.05,
    waterAfterDmax: engineResult.waterKg,
    waterFromAdmixtures: engineResult.admixtureKg * 0.1,
    totalAggregateVolume: (engineResult.fineAggregateKg + engineResult.coarseAggregateKg) / 2.65,

    cementWeight: engineResult.cementKg,
    waterContentNeeded: engineResult.waterKg,
    waterContentActual: engineResult.waterKg,

    sandPercent: Math.round((engineResult.fineAggregateKg / (engineResult.fineAggregateKg + engineResult.coarseAggregateKg || 1)) * 100),
    gravelPercent: Math.round((engineResult.coarseAggregateKg / (engineResult.fineAggregateKg + engineResult.coarseAggregateKg || 1)) * 100),

    sandWeightDry: engineResult.fineAggregateKg,
    gravelWeightDry: engineResult.coarseAggregateKg,

    admixtureWeights: [
      {
        admixtureId: "superplasticizer",
        name: "Superplasticizer",
        weight: engineResult.admixtureKg
      }
    ],

    sandWeightWet: engineResult.fineAggregateKg * (1 + (legacyInput.moistureSand || 0) / 100),
    gravelWeightWet: engineResult.coarseAggregateKg * (1 + (legacyInput.moistureGravel || 0) / 100),
    waterWeightWet: engineResult.waterKg - (engineResult.fineAggregateKg * (legacyInput.moistureSand || 0) / 100) - (engineResult.coarseAggregateKg * (legacyInput.moistureGravel || 0) / 100),

    totalFreshDensity: engineResult.freshDensityKgM3,

    pivotPoint: { x: legacyInput.dMax / 2, y: 50 },
    gradingCurve: [],

    warnings: engineResult.warnings,
    assumptions: engineResult.assumptions,
    detailedSteps: engineResult.assumptions.concat(engineResult.warnings),
    limitations: [
      "Adapter layer active",
      "Calculated by modular backend engine."
    ]
  };

  return result as LegacyResult;
}
