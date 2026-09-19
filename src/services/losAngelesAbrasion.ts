import type { CalculationTraceStep, ValidationIssue, ValidationReport } from "../types/laboratoryDomain";

export interface LosAngelesInput extends Record<string, unknown> {
  initialMassG: number;
  retainedMassOn1_6mmG: number;
  finesMassG?: number;
  massBalanceToleranceG?: number;
}

export interface LosAngelesOutput {
  losAngelesAbrasionPercent: number;
  lostMassG: number;
  unaccountedMassG?: number;
  classification: "Exceptional" | "Good" | "Acceptable" | "Fail";
  trace: CalculationTraceStep[];
  validation: ValidationReport;
}

function error(code: string, message: string, field?: string): ValidationIssue {
  return { level: "data", severity: "error", code, message, field };
}
function warning(code: string, message: string, field?: string): ValidationIssue {
  return { level: "engineering", severity: "warning", code, message, field };
}

export function calculateLosAngelesAbrasion(input: LosAngelesInput): LosAngelesOutput | undefined {
  const issues: ValidationIssue[] = [];
  if (!Number.isFinite(input.initialMassG) || input.initialMassG <= 0) issues.push(error("INVALID_INITIAL_MASS", "Initial test mass must be greater than zero.", "initialMassG"));
  if (!Number.isFinite(input.retainedMassOn1_6mmG) || input.retainedMassOn1_6mmG < 0) issues.push(error("INVALID_RETAINED_MASS", "Retained mass must be zero or greater.", "retainedMassOn1_6mmG"));
  if (input.finesMassG !== undefined && (!Number.isFinite(input.finesMassG) || input.finesMassG < 0)) issues.push(error("INVALID_FINES_MASS", "Fines mass must be zero or greater when supplied.", "finesMassG"));
  if (input.massBalanceToleranceG !== undefined && (!Number.isFinite(input.massBalanceToleranceG) || input.massBalanceToleranceG < 0)) issues.push(error("INVALID_MASS_TOLERANCE", "Mass-balance tolerance must be zero or greater.", "massBalanceToleranceG"));
  if (issues.length) return undefined;
  if (input.retainedMassOn1_6mmG > input.initialMassG) issues.push(error("RETAINED_EXCEEDS_INITIAL", "Retained mass cannot exceed initial test mass.", "retainedMassOn1_6mmG"));
  if (issues.length) return undefined;

  const lostMassG = input.initialMassG - input.retainedMassOn1_6mmG;
  let unaccountedMassG: number | undefined;
  if (input.finesMassG !== undefined) {
    unaccountedMassG = Number((input.initialMassG - input.retainedMassOn1_6mmG - input.finesMassG).toFixed(4));
    const tolerance = input.massBalanceToleranceG ?? 1;
    if (unaccountedMassG < -tolerance) issues.push(error("RECOVERED_MASS_EXCEEDS_INITIAL", "Retained and fines masses exceed the initial mass beyond tolerance."));
    else if (Math.abs(unaccountedMassG) > tolerance) issues.push(warning("UNACCOUNTED_MASS", "Mass balance has unexplained loss greater than the configured tolerance."));
  }
  const losAngelesAbrasionPercent = Number(((lostMassG / input.initialMassG) * 100).toFixed(2));
  const classification = losAngelesAbrasionPercent <= 20 ? "Exceptional" : losAngelesAbrasionPercent <= 30 ? "Good" : losAngelesAbrasionPercent <= 35 ? "Acceptable" : "Fail";
  const trace: CalculationTraceStep[] = [
    { stepNumber: 1, label: "Mass loss", formula: "initial mass − retained mass", substitution: `${input.initialMassG} − ${input.retainedMassOn1_6mmG}`, result: lostMassG, unit: "g", inputs: { initialMassG: input.initialMassG, retainedMassOn1_6mmG: input.retainedMassOn1_6mmG } },
    { stepNumber: 2, label: "Los Angeles abrasion", formula: "mass loss / initial mass × 100", substitution: `${lostMassG} / ${input.initialMassG} × 100`, result: losAngelesAbrasionPercent, unit: "%", inputs: { lostMassG, initialMassG: input.initialMassG } }
  ];
  if (unaccountedMassG !== undefined) trace.push({ stepNumber: 3, label: "Mass balance", formula: "initial − retained − fines", substitution: `${input.initialMassG} − ${input.retainedMassOn1_6mmG} − ${input.finesMassG}`, result: unaccountedMassG, unit: "g", inputs: { initialMassG: input.initialMassG, retainedMassOn1_6mmG: input.retainedMassOn1_6mmG, finesMassG: input.finesMassG } });
  return {
    losAngelesAbrasionPercent,
    lostMassG,
    unaccountedMassG,
    classification,
    trace,
    validation: { valid: !issues.some(item => item.severity === "error"), issues }
  };
}

export function validateLosAngeles(input: Partial<LosAngelesInput>): ValidationReport {
  const result = calculateLosAngelesAbrasion(input as LosAngelesInput);
  if (!result) return { valid: false, issues: [{ level: "data", severity: "error", code: "LOS_ANGELES_INPUT_INVALID", message: "Los Angeles inputs are incomplete or physically invalid." }] };
  return result.validation;
}
