import { MixDesignInput, MixDesignResult } from "./types";
import { calculateDreuxGorisseCore } from "./dreuxGorisseCore";
import { validateProductionMaterialSet } from "./productionMaterialGate";
import { MixDesignInput as UIMixInput } from "../types";

/**
 * Compatibility entry point for callers that still use the legacy engine name.
 * It deliberately avoids inventing material properties or recalculating volume
 * independently from the core engine.
 */
export function calculateDreuxGorisseEngine(input: MixDesignInput): MixDesignResult {
  const uiInput: UIMixInput = {
    ...input,
    aggregateType: input.aggregateType as any,
    aggregateQuality: input.aggregateQuality as any,
    selectedMethod: "dreux",
    materialsDatabase: (input as any).materialsDatabase || []
  } as UIMixInput;

  const gate = validateProductionMaterialSet(uiInput, uiInput.materialsDatabase || []);
  if (gate.status === "blocked") {
    return {
      methodName: "Dreux-Gorisse",
      cementKg: 0,
      waterKg: 0,
      fineAggregateKg: 0,
      coarseAggregateKg: 0,
      admixtureKg: 0,
      airContentPercent: uiInput.airContent || 0,
      wcRatio: 0,
      freshDensityKgM3: 0,
      absoluteVolumeCheck: {
        isValid: false,
        totalAbsVolumeL: 0,
        cementVolL: 0,
        waterVolL: 0,
        sandVolL: 0,
        gravelVolL: 0,
        airVolL: 0,
        admixtureVolL: 0,
        deviationPercent: 100
      },
      warnings: gate.warnings,
      errors: [gate.warnings[0] || "Material governance validation failed."],
      assumptions: ["Calculation blocked before engineering computation because selected material data is incomplete, incompatible, unapproved, or inactive."],
      compliance: { standardName: "EN 206", isCompliant: false, checks: [] },
      recommendations: gate.recommendations,
      materialSuitability: gate,
      isValid: false,
      valid: false
    } as any;
  }

  const coreResult = calculateDreuxGorisseCore(uiInput);
  const totalAdmix = (coreResult.admixtureWeights || []).reduce((sum, item) => sum + item.weight, 0);

  return {
    methodName: "Dreux-Gorisse",
    cementKg: Math.round(coreResult.cementWeight * 10) / 10,
    waterKg: Math.round(coreResult.waterContentActual * 10) / 10,
    fineAggregateKg: Math.round(coreResult.sandWeightDry * 10) / 10,
    coarseAggregateKg: Math.round(coreResult.gravelWeightDry * 10) / 10,
    admixtureKg: Math.round(totalAdmix * 10) / 10,
    airContentPercent: uiInput.airContent || 0,
    wcRatio: Number(coreResult.waterCementRatio.toFixed(3)),
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
    materialSuitability: coreResult.materialSuitability
  } as any;
}
