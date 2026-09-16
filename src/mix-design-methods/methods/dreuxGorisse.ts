import { MixDesignResult } from "../types";
import { mixDesignEngine } from "../../mix-design/core/MixDesignEngine";

export function normalizeInputs(inputs: any) {
  return {
    ...inputs,
    selectedMethod: "dreux"
  };
}

export function validateInputs(inputs: any) {
  const result = mixDesignEngine.calculate({
    methodId: "dreux-gorisse",
    input: inputs,
    context: { language: "ar" }
  });
  
  const errors = (result.errors || []).map((msg: string) => ({
    field: "generic",
    severity: "error" as const,
    messageAr: msg,
    messageFr: msg,
    messageEn: msg
  }));
  
  const warnings = (result.warnings || []).map((msg: string) => ({
    field: "generic",
    severity: "warning" as const,
    messageAr: msg,
    messageFr: msg,
    messageEn: msg
  }));

  return {
    isValid: result.isValid,
    errors,
    warnings
  };
}

function getMethodStatus(refResult: any): "success" | "warning" | "incomplete" | "not-supported" {
  if (refResult.status === "not-supported") return "not-supported";
  if (refResult.status === "limited") return "warning";
  if (!refResult.isValid) return "incomplete";
  return "success";
}

export function calculate(inputs: any): MixDesignResult {
  const refResult = mixDesignEngine.calculate({
    methodId: "dreux-gorisse",
    input: inputs,
    context: { language: "ar" }
  }) as any;
  const status = getMethodStatus(refResult);
  
  return {
    methodId: "dreux-gorisse",
    status,
    category: "complete-design",
    implementationStatus: "complete",
    isStandaloneCompleteMethod: true,
    quantities: {
      cementKgPerM3: Math.round(refResult.cementWeight || refResult.cementKg || 0),
      waterLPerM3: Math.round(refResult.waterContentActual || refResult.waterKg || 0),
      sandKgPerM3: Math.round(refResult.sandWeightDry || refResult.fineAggregateKg || 0),
      coarseAggregateKgPerM3: Math.round(refResult.gravelWeightDry || refResult.coarseAggregateKg || 0),
      admixtureKgOrLPerM3: Math.round(refResult.admixtureWeights?.reduce((sum, item) => sum + item.weight, 0) || refResult.admixtureKg || 0)
    },
    ratios: {
      waterCementRatio: refResult.wcRatio !== undefined && refResult.wcRatio > 0 
        ? refResult.wcRatio 
        : (refResult.cementWeight > 0 ? parseFloat((refResult.waterContentActual / refResult.cementWeight).toFixed(2)) : 0),
      sandAggregateRatio: refResult.sandPercent !== undefined ? parseFloat((refResult.sandPercent / 100).toFixed(2)) : undefined
    },
    grading: {
      sieveSizes: refResult.gradingCurve?.map(p => p.size) || [],
      targetPassing: refResult.gradingCurve?.map(p => p.targetPassing) || [],
      actualPassing: refResult.gradingCurve?.map(p => p.targetPassing) || []
    },
    strength: {
      targetStrength: refResult.fcm28 || refResult.strength?.targetStrength,
      predictedStrength: refResult.fcm28 || refResult.strength?.predictedStrength,
      characteristicStrength: inputs.fck28
    },
    warnings: refResult.warnings || [],
    errors: refResult.errors || [],
    assumptions: getAssumptions(inputs),
    calculationSteps: refResult.detailedSteps || refResult.calculationSteps || [],
    limitations: [
      "Requires high quality sieve curves of all raw aggregates.",
      "High sensitivity to moisture levels on site."
    ],

    // Unify all fields to prevent information loss between layers:
    isValid: refResult.isValid,
    valid: refResult.valid,
    recommendations: refResult.recommendations,
    methodApplicability: refResult.methodApplicability,
    theoreticalCementDemand: refResult.theoreticalCementDemand,
    actualCementUsed: refResult.actualCementUsed,
    cementLimitExceeded: refResult.cementLimitExceeded,
    waterDemand: refResult.waterDemand,
    waterCementRatio: refResult.waterCementRatio,
    absoluteVolumeTotal: refResult.absoluteVolumeTotal,
    volumeClosureError: refResult.volumeClosureError,
    calculationNotes: refResult.calculationNotes,
    validationSummary: refResult.validationSummary,
    absoluteVolumeCheck: refResult.absoluteVolumeCheck,
    compliance: refResult.compliance,
    standardsCompliance: refResult.standardsCompliance || refResult.compliance,
    materialSuitability: refResult.materialSuitability
  };
}

export function getAssumptions(inputs: any): string[] {
  const assumptions: string[] = [];
  if (inputs.fck28 !== undefined) {
    assumptions.push(`Target Characteristic Compressive Strength fck = ${inputs.fck28} MPa.`);
  }
  if (inputs.cementClassStrength !== undefined) {
    assumptions.push(`Cement nominal rating class = ${inputs.cementClassStrength} MPa.`);
  }
  if (inputs.dMax !== undefined) {
    assumptions.push(`D_max = ${inputs.dMax} mm.`);
  }
  return assumptions;
}

export function getWarnings(inputs: any): string[] {
  const warnings: string[] = [];
  if (inputs.slump > 20) {
    warnings.push("High slump value (>20 cm) might result in paste bleeding or segregation.");
  }
  return warnings;
}

export function buildReportSection(result: MixDesignResult) {
  return {
    title: "Dreux-Gorisse Design Methodology Report Component",
    content: "Calculated with Georges Dreux optimum grain arrangement formula."
  };
}
