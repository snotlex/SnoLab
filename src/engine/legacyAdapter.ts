import { MixDesignInput as LegacyInput, MixDesignResult as LegacyResult } from "../types";
import { MixDesignInput as EngineInput, MixDesignResult as EngineResult } from "./types";

/** Backward-compatible field mapper. No engineering defaults or calculations. */
export function adaptLegacyInput(legacyInput: LegacyInput): EngineInput {
  return {
    ...legacyInput,
    materialsDatabase: legacyInput.materialsDatabase,
    selectedMethod: legacyInput.selectedMethod,
  } as unknown as EngineInput;
}

/** Backward-compatible result mapper sourced entirely from the unified engine result. */
export function adaptEngineResultToLegacy(engineResult: EngineResult, legacyInput: LegacyInput): LegacyResult {
  return {
    ...engineResult,
    methodName: engineResult.methodName || "Dreux-Gorisse",
    cementWeight: engineResult.cementKg,
    waterContentNeeded: engineResult.waterKg,
    waterContentActual: engineResult.waterKg,
    sandWeightDry: engineResult.fineAggregateKg,
    gravelWeightDry: engineResult.coarseAggregateKg,
    admixtureWeights: engineResult.admixtureKg > 0
      ? [{ admixtureId: legacyInput.selectedAdmixtureId || "admixture", name: legacyInput.selectedAdmixtureName || "Admixture", weight: engineResult.admixtureKg }]
      : [],
    sandWeightWet: engineResult.fineAggregateKg * (1 + (legacyInput.moistureSand || 0) / 100),
    gravelWeightWet: engineResult.coarseAggregateKg * (1 + (legacyInput.moistureGravel || 0) / 100),
    waterWeightWet: engineResult.waterKg,
    totalFreshDensity: engineResult.freshDensityKgM3,
    warnings: engineResult.warnings || [],
    errors: engineResult.errors || [],
    assumptions: engineResult.assumptions || [],
    detailedSteps: engineResult.assumptions || [],
    limitations: [],
    materialSuitability: engineResult.materialSuitability,
    isValid: engineResult.isValid,
    valid: engineResult.valid,
    methodApplicability: engineResult.methodApplicability,
    totalBinder: engineResult.totalBinder,
    activeCementWeight: engineResult.activeCementWeight,
    flyAshKg: engineResult.flyAshKg,
    slagKg: engineResult.slagKg,
    silicaFumeKg: engineResult.silicaFumeKg,
    compliance: engineResult.compliance,
    standardsCompliance: engineResult.standardsCompliance,
  } as unknown as LegacyResult;
}
