import { MixDesignInput, MixDesignResult, MaterialQuantity, CalculationTraceStep } from "../../core/types";
import { calculateDreuxGorisseCore } from "../../../engine/dreuxGorisseCore";
import { validateDreuxGorisseInputs } from "./dreuxGorisseValidation";
import { checkDreuxGorisseApplicability } from "./dreuxGorisseApplicability";

/**
 * Executes the Dreux-Gorisse concrete mix design calculation, bridging
 * the result into the standard multi-method MixDesignResult format.
 */
export function calculateDreuxGorisse(
  input: MixDesignInput,
  language: "ar" | "fr" | "en" = "ar"
): MixDesignResult {
  // Normalize selectedMethod to 'dreux' for internal compatibility
  const coercedInput = {
    ...input,
    selectedMethod: "dreux" as const
  };

  // Run the trusted core legacy engine
  const coreResult = calculateDreuxGorisseCore(coercedInput as any, language);

  // Map admixtures
  const admixtures: MaterialQuantity[] = (coreResult.admixtureWeights || []).map((adm: any, index: number) => ({
    id: adm.id || `adm_${index}`,
    name: adm.name || "Admixture",
    type: "admixture",
    weight: adm.weight || 0
  }));

  // Map supplementary materials
  const scmTotal = (coreResult.flyAshKg || 0) + (coreResult.slagKg || 0) + (coreResult.silicaFumeKg || 0);

  // Map trace steps
  const trace: CalculationTraceStep[] = (coreResult.detailedSteps || []).map((step: string, index: number) => ({
    stepId: `step_${index}`,
    label: step,
    inputs: {},
    output: ""
  }));

  // Construct validation result representation
  const validationRes = validateDreuxGorisseInputs(coercedInput, language);

  const totalAdmix = coreResult.admixtureWeights?.reduce((s: number, a: any) => s + a.weight, 0) || 0;

  const applicabilityRes = checkDreuxGorisseApplicability(coercedInput);
  let statusStr = "success";
  if (applicabilityRes.level === "not_applicable" || !coreResult.isValid) {
    statusStr = "not-supported";
  } else if (applicabilityRes.level === "limited") {
    statusStr = "limited";
  }

  // Construct the new nested structured format
  const structuredResult: any = {
    // Preserve ALL legacy fields so that NO existing frontend/test code breaks
    ...coreResult,

    // Flat legacy fields
    methodId: "dreux-gorisse",
    methodName: "Dreux-Gorisse",
    cementKg: Math.round(coreResult.cementWeight * 10) / 10,
    waterKg: Math.round(coreResult.waterContentActual * 10) / 10,
    fineAggregateKg: Math.round(coreResult.sandWeightDry * 10) / 10,
    coarseAggregateKg: Math.round(coreResult.gravelWeightDry * 10) / 10,
    admixtureKg: Math.round(totalAdmix * 10) / 10,
    airContentPercent: coercedInput.airContent || 0.0,
    wcRatio: parseFloat(coreResult.wcRatioAdjusted?.toFixed(3) || (coreResult.waterContentActual / (coreResult.cementWeight || 1)).toFixed(3)),
    freshDensityKgM3: Math.round((coreResult.totalFreshDensity || 2400) * 10) / 10,

    // Metadata & status compatible with old /src/mix-design-methods tests
    status: statusStr,
    category: "complete-design",
    implementationStatus: "complete",
    isStandaloneCompleteMethod: true,

    // Add new multi-method architecture fields
    method: {
      id: "dreux-gorisse",
      name: "طريقة درو-غوريس (Dreux-Gorisse)",
      version: "1.0.0"
    },

    inputSnapshot: input,

    quantities: {
      cement: coreResult.cementWeight,
      supplementaryCementitiousMaterials: scmTotal,
      totalBinder: coreResult.totalBinder || coreResult.cementWeight,
      effectiveWater: coreResult.effectiveWater || coreResult.waterContentActual,
      addedWater: coreResult.batchWaterToAdd || coreResult.waterContentActual,
      fineAggregates: coreResult.sandWeightDry,
      coarseAggregates: coreResult.gravelWeightDry,
      admixtures,
      fibers: coercedInput.fiberDosageKgM3 ? [
        {
          id: coercedInput.selectedFiberId || "fiber_0",
          name: coercedInput.selectedFiberName || "Fiber",
          type: "fiber",
          weight: coercedInput.fiberDosageKgM3
        }
      ] : [],

      // Older /src/mix-design-methods tests compatibility
      cementKgPerM3: Math.round(coreResult.cementWeight),
      waterLPerM3: Math.round(coreResult.waterContentActual),
      sandKgPerM3: Math.round(coreResult.sandWeightDry),
      coarseAggregateKgPerM3: Math.round(coreResult.gravelWeightDry),
      admixtureKgOrLPerM3: Math.round(totalAdmix)
    },

    ratios: {
      waterCementRatio: coreResult.waterCementRatio || coreResult.wcRatio,
      waterBinderRatio: coreResult.waterBinderRatio || coreResult.wcRatio,
      sandAggregateRatio: coreResult.sandPercent !== undefined ? parseFloat((coreResult.sandPercent / 100).toFixed(3)) : undefined
    },

    physicalProperties: {
      theoreticalFreshDensity: coreResult.totalFreshDensity || 2400,
      absoluteVolume: coreResult.absoluteVolumeTotal || 1000,
      volumeClosureError: coreResult.volumeClosureError || 0
    },

    validation: validationRes,
    warnings: [
      ...(coreResult.warnings || []),
      ...(validationRes.warnings.map(w => w.message))
    ],
    errors: [
      ...(coreResult.errors || []),
      ...(validationRes.errors.map(e => e.message))
    ],
    isValid: coreResult.isValid && validationRes.isValid,
    assumptions: [
      `Target fcm28 is ${coreResult.fcm28.toFixed(2)} MPa`,
      `Standard deviation σ is ${coreResult.stdDev.toFixed(2)} MPa`,
      `Georges Dreux Parameter G is ${coreResult.dreuxAggregateFactor.toFixed(2)}`,
      `Compaction Index γ is ${coreResult.compactorGamma.toFixed(3)}`
    ],
    trace,
    calculatedAt: new Date().toISOString()
  };

  return structuredResult;
}
