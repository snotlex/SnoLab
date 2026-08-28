import { MixDesignInput, MixDesignResult, MaterialQuantity, CalculationTraceStep } from "../../core/types";
import { calculateDreuxGorisseCore } from "../../../engine/dreuxGorisseCore";
import { validateDreuxGorisseInputs } from "./dreuxGorisseValidation";
import { checkDreuxGorisseApplicability } from "./dreuxGorisseApplicability";
import { validateProductionMaterialSet } from "../../../engine/productionMaterialGate";

function blockedResult(input: MixDesignInput, gate: ReturnType<typeof validateProductionMaterialSet>): MixDesignResult {
  const message = gate.warnings[0] || "Selected materials are not ready for engineering calculation.";
  return {
    methodName: "Dreux-Gorisse",
    cementKg: 0,
    waterKg: 0,
    fineAggregateKg: 0,
    coarseAggregateKg: 0,
    admixtureKg: 0,
    airContentPercent: input.airContent || 0,
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
    errors: [message],
    assumptions: ["Calculation blocked before engineering computation because material governance requirements were not satisfied."],
    compliance: {
      standardName: "EN 206",
      isCompliant: false,
      checks: []
    },
    recommendations: gate.recommendations,
    materialSuitability: gate,
    isValid: false,
    valid: false,
    status: "not-supported",
    category: "complete-design",
    implementationStatus: "complete",
    isStandaloneCompleteMethod: true,
    inputSnapshot: input,
    method: { id: "dreux-gorisse", name: "Dreux-Gorisse", version: "1.0.0" },
    calculatedAt: new Date().toISOString()
  } as any;
}

/**
 * Executes the Dreux-Gorisse concrete mix design calculation after the
 * production material governance gate and method validation have passed.
 */
export function calculateDreuxGorisse(
  input: MixDesignInput,
  language: "ar" | "fr" | "en" = "ar"
): MixDesignResult {
  const coercedInput = {
    ...input,
    selectedMethod: "dreux" as const
  };

  const gate = validateProductionMaterialSet(coercedInput, coercedInput.materialsDatabase || []);
  if (!gate || gate.status === "blocked") {
    return blockedResult(coercedInput, gate);
  }

  const coreResult = calculateDreuxGorisseCore(coercedInput as any, language);

  const admixtures: MaterialQuantity[] = (coreResult.admixtureWeights || []).map((adm: any, index: number) => ({
    id: adm.admixtureId || adm.id || `adm_${index}`,
    name: adm.name || "Admixture",
    type: "admixture",
    weight: Number.isFinite(adm.weight) ? adm.weight : 0
  }));

  const scmTotal = (coreResult.flyAshKg || 0) + (coreResult.slagKg || 0) + (coreResult.silicaFumeKg || 0);
  const trace: CalculationTraceStep[] = (coreResult.detailedSteps || []).map((step: string, index: number) => ({
    stepId: `step_${index}`,
    label: step,
    inputs: {},
    output: ""
  }));
  const validationRes = validateDreuxGorisseInputs(coercedInput, language);
  const totalAdmix = (coreResult.admixtureWeights || []).reduce((s: number, a: any) => s + (Number.isFinite(a.weight) ? a.weight : 0), 0);
  const applicabilityRes = checkDreuxGorisseApplicability(coercedInput);

  let statusStr = "success";
  if (applicabilityRes.level === "not_applicable" || !coreResult.isValid) statusStr = "not-supported";
  else if (applicabilityRes.level === "limited") statusStr = "limited";

  return {
    ...coreResult,
    methodId: "dreux-gorisse",
    methodName: "Dreux-Gorisse",
    cementKg: Math.round(coreResult.cementWeight * 10) / 10,
    waterKg: Math.round(coreResult.waterContentActual * 10) / 10,
    fineAggregateKg: Math.round(coreResult.sandWeightDry * 10) / 10,
    coarseAggregateKg: Math.round(coreResult.gravelWeightDry * 10) / 10,
    admixtureKg: Math.round(totalAdmix * 10) / 10,
    airContentPercent: coercedInput.airContent || 0,
    wcRatio: Number(coreResult.waterCementRatio.toFixed(3)),
    freshDensityKgM3: Math.round(coreResult.totalFreshDensity * 10) / 10,
    status: statusStr,
    category: "complete-design",
    implementationStatus: "complete",
    isStandaloneCompleteMethod: true,
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
      effectiveWater: coreResult.effectiveWater,
      addedWater: coreResult.batchWaterToAdd,
      fineAggregates: coreResult.sandWeightDry,
      coarseAggregates: coreResult.gravelWeightDry,
      admixtures,
      fibers: coercedInput.fiberDosageKgM3 ? [{
        id: coercedInput.selectedFiberId || "fiber_0",
        name: coercedInput.selectedFiberName || "Fiber",
        type: "fiber",
        weight: coercedInput.fiberDosageKgM3
      }] : [],
      cementKgPerM3: Math.round(coreResult.cementWeight),
      waterLPerM3: Math.round(coreResult.waterContentActual),
      sandKgPerM3: Math.round(coreResult.sandWeightDry),
      coarseAggregateKgPerM3: Math.round(coreResult.gravelWeightDry),
      admixtureKgOrLPerM3: Math.round(totalAdmix)
    },
    ratios: {
      waterCementRatio: coreResult.waterCementRatio,
      waterBinderRatio: coreResult.waterBinderRatio,
      sandAggregateRatio: coreResult.sandPercent !== undefined ? Number((coreResult.sandPercent / 100).toFixed(3)) : undefined
    },
    physicalProperties: {
      theoreticalFreshDensity: coreResult.totalFreshDensity,
      absoluteVolume: coreResult.absoluteVolumeTotal || coreResult.absoluteVolumeCheck?.totalAbsVolumeL || 0,
      volumeClosureError: coreResult.volumeClosureError || 0
    },
    validation: validationRes,
    warnings: [
      ...(coreResult.warnings || []),
      ...(validationRes.warnings || []).map(w => w.message)
    ],
    errors: [
      ...(coreResult.errors || []),
      ...(validationRes.errors || []).map(e => e.message)
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
  } as any;
}
