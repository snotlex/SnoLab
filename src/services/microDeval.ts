import type { CalculationTraceStep, ValidationIssue, ValidationReport } from "../types/laboratoryDomain";

export interface MicroDevalInput extends Record<string, unknown> {
  initialMassG: number;
  retainedMassOn1_6mmG: number;
  waterVolumeMl: number;
  gradingFraction?: string;
  abrasiveChargeG?: number;
}

export interface MicroDevalOutput {
  microDevalPercent: number;
  lostMassG: number;
  gradingFraction?: string;
  trace: CalculationTraceStep[];
  validation: ValidationReport;
}

function error(code: string, message: string, field?: string): ValidationIssue {
  return { level: "data", severity: "error", code, message, field };
}
function warning(code: string, message: string, field?: string): ValidationIssue {
  return { level: "engineering", severity: "warning", code, message, field };
}

export function calculateMicroDeval(input: MicroDevalInput): MicroDevalOutput | undefined {
  const issues: ValidationIssue[] = [];
  if (!Number.isFinite(input.initialMassG) || input.initialMassG <= 0) issues.push(error("INVALID_INITIAL_MASS", "Initial test mass must be greater than zero.", "initialMassG"));
  if (!Number.isFinite(input.retainedMassOn1_6mmG) || input.retainedMassOn1_6mmG < 0) issues.push(error("INVALID_RETAINED_MASS", "Retained mass must be zero or greater.", "retainedMassOn1_6mmG"));
  if (!Number.isFinite(input.waterVolumeMl) || input.waterVolumeMl <= 0) issues.push(error("INVALID_WATER_VOLUME", "Micro-Deval water volume must be greater than zero.", "waterVolumeMl"));
  if (input.abrasiveChargeG !== undefined && (!Number.isFinite(input.abrasiveChargeG) || input.abrasiveChargeG <= 0)) issues.push(error("INVALID_ABRASIVE_CHARGE", "Abrasive charge must be greater than zero when supplied.", "abrasiveChargeG"));
  if (input.gradingFraction !== undefined && !input.gradingFraction.trim()) issues.push(error("INVALID_GRADING_FRACTION", "Grading fraction cannot be empty.", "gradingFraction"));
  if (issues.length) return undefined;
  if (input.retainedMassOn1_6mmG > input.initialMassG) issues.push(error("RETAINED_EXCEEDS_INITIAL", "Retained mass cannot exceed initial test mass.", "retainedMassOn1_6mmG"));
  if (input.waterVolumeMl < input.initialMassG) issues.push(warning("LOW_WATER_TO_SAMPLE_RATIO", "Water volume is lower than the sample mass; confirm the wet Micro-Deval setup and method sheet.", "waterVolumeMl"));
  if (issues.some(item => item.severity === "error")) return undefined;

  const lostMassG = input.initialMassG - input.retainedMassOn1_6mmG;
  const microDevalPercent = Number(((lostMassG / input.initialMassG) * 100).toFixed(2));
  if (microDevalPercent > 25) issues.push(warning("MDE_ABOVE_STANDARD_SCREENING", "MDE exceeds the configured standard structural screening level; acceptance depends on project specification."));
  const trace: CalculationTraceStep[] = [
    { stepNumber: 1, label: "Wet-test mass loss", formula: "initial mass − retained mass", substitution: `${input.initialMassG} − ${input.retainedMassOn1_6mmG}`, result: lostMassG, unit: "g", inputs: { initialMassG: input.initialMassG, retainedMassOn1_6mmG: input.retainedMassOn1_6mmG } },
    { stepNumber: 2, label: "Micro-Deval coefficient", formula: "mass loss / initial mass × 100", substitution: `${lostMassG} / ${input.initialMassG} × 100`, result: microDevalPercent, unit: "%", inputs: { lostMassG, initialMassG: input.initialMassG } },
    { stepNumber: 3, label: "Wet condition", formula: "water volume recorded as positive test condition", substitution: `${input.waterVolumeMl} ml`, result: input.waterVolumeMl, unit: "ml", inputs: { waterVolumeMl: input.waterVolumeMl, gradingFraction: input.gradingFraction } }
  ];
  return {
    microDevalPercent,
    lostMassG,
    gradingFraction: input.gradingFraction,
    trace,
    validation: { valid: !issues.some(item => item.severity === "error"), issues }
  };
}

export function validateMicroDeval(input: Partial<MicroDevalInput>): ValidationReport {
  const result = calculateMicroDeval(input as MicroDevalInput);
  if (!result) return { valid: false, issues: [{ level: "data", severity: "error", code: "MICRO_DEVAL_INPUT_INVALID", message: "Micro-Deval inputs are incomplete or physically invalid." }] };
  return result.validation;
}
