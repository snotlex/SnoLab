import type { CalculationTraceStep, ValidationIssue, ValidationReport } from "../types/laboratoryDomain";

export interface CementNormalConsistencyInput extends Record<string, unknown> {
  cementMassG: number;
  waterVolumeMl: number;
  plungerPenetrationMm: number;
}

export interface CementNormalConsistencyOutput {
  waterPercent: number;
  plungerPenetrationMm: number;
  classification: "Standard" | "Outside target";
  trace: CalculationTraceStep[];
  validation: ValidationReport;
}

function error(code: string, message: string, field?: string): ValidationIssue {
  return { level: "data", severity: "error", code, message, field };
}
function warning(code: string, message: string): ValidationIssue {
  return { level: "engineering", severity: "warning", code, message };
}

export function calculateCementNormalConsistency(input: CementNormalConsistencyInput): CementNormalConsistencyOutput | undefined {
  const issues: ValidationIssue[] = [];
  if (!Number.isFinite(input.cementMassG) || input.cementMassG <= 0) issues.push(error("INVALID_CEMENT_MASS", "Cement mass must be greater than zero.", "cementMassG"));
  if (!Number.isFinite(input.waterVolumeMl) || input.waterVolumeMl <= 0) issues.push(error("INVALID_WATER_VOLUME", "Water volume must be greater than zero.", "waterVolumeMl"));
  if (!Number.isFinite(input.plungerPenetrationMm) || input.plungerPenetrationMm < 0) issues.push(error("INVALID_PLUNGER_PENETRATION", "Plunger penetration must be zero or greater.", "plungerPenetrationMm"));
  if (issues.length) return undefined;
  const waterPercent = Number(((input.waterVolumeMl / input.cementMassG) * 100).toFixed(2));
  const isStandard = input.plungerPenetrationMm >= 5 && input.plungerPenetrationMm <= 7;
  if (!isStandard) issues.push(warning("PENETRATION_OUTSIDE_TARGET", "Vicat plunger penetration is outside the 6 ± 1 mm normal-consistency target."));
  if (waterPercent < 24 || waterPercent > 32) issues.push(warning("WATER_PERCENT_OUTSIDE_SCREEN", "Water percentage is outside the 24–32% screening range; review the paste preparation and readings."));
  const trace: CalculationTraceStep[] = [
    { stepNumber: 1, label: "Normal-consistency water percentage", formula: "water volume / cement mass × 100", substitution: `${input.waterVolumeMl} / ${input.cementMassG} × 100`, result: waterPercent, unit: "%", inputs: { cementMassG: input.cementMassG, waterVolumeMl: input.waterVolumeMl } },
    { stepNumber: 2, label: "Vicat penetration", formula: "observed plunger penetration", substitution: `${input.plungerPenetrationMm}`, result: input.plungerPenetrationMm, unit: "mm", inputs: { plungerPenetrationMm: input.plungerPenetrationMm, target: "6 ± 1 mm" } }
  ];
  return { waterPercent, plungerPenetrationMm: input.plungerPenetrationMm, classification: isStandard ? "Standard" : "Outside target", trace, validation: { valid: true, issues } };
}

export function validateCementNormalConsistency(input: Partial<CementNormalConsistencyInput>): ValidationReport {
  const result = calculateCementNormalConsistency(input as CementNormalConsistencyInput);
  if (!result) return { valid: false, issues: [{ level: "data", severity: "error", code: "NORMAL_CONSISTENCY_INPUT_INVALID", message: "Normal-consistency inputs are incomplete or physically invalid." }] };
  return result.validation;
}
