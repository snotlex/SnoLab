import type { CalculationTraceStep, ValidationIssue, ValidationReport } from "../types/laboratoryDomain";

export interface CementSoundnessInput extends Record<string, unknown> {
  pointerDistanceBeforeBoilingMm: number;
  pointerDistanceAfterBoilingMm: number;
}

export interface CementSoundnessOutput {
  expansionMm: number;
  classification: "Sound" | "Fail";
  trace: CalculationTraceStep[];
  validation: ValidationReport;
}

function error(code: string, message: string, field?: string): ValidationIssue {
  return { level: "data", severity: "error", code, message, field };
}

export function calculateCementSoundness(input: CementSoundnessInput): CementSoundnessOutput | undefined {
  const issues: ValidationIssue[] = [];
  if (!Number.isFinite(input.pointerDistanceBeforeBoilingMm) || input.pointerDistanceBeforeBoilingMm <= 0) issues.push(error("INVALID_BEFORE_DISTANCE", "Before-boiling pointer distance must be greater than zero.", "pointerDistanceBeforeBoilingMm"));
  if (!Number.isFinite(input.pointerDistanceAfterBoilingMm) || input.pointerDistanceAfterBoilingMm < 0) issues.push(error("INVALID_AFTER_DISTANCE", "After-boiling pointer distance must be zero or greater.", "pointerDistanceAfterBoilingMm"));
  if (issues.length) return undefined;
  if (input.pointerDistanceAfterBoilingMm < input.pointerDistanceBeforeBoilingMm) issues.push(error("AFTER_DISTANCE_BELOW_BEFORE", "After-boiling distance cannot be below the before-boiling distance for this expansion calculation."));
  if (issues.length) return undefined;

  const expansionMm = Number((input.pointerDistanceAfterBoilingMm - input.pointerDistanceBeforeBoilingMm).toFixed(2));
  const classification = expansionMm <= 10 ? "Sound" : "Fail";
  const trace: CalculationTraceStep[] = [
    { stepNumber: 1, label: "Le Chatelier expansion", formula: "after-boiling pointer distance − before-boiling pointer distance", substitution: `${input.pointerDistanceAfterBoilingMm} − ${input.pointerDistanceBeforeBoilingMm}`, result: expansionMm, unit: "mm", inputs: { pointerDistanceBeforeBoilingMm: input.pointerDistanceBeforeBoilingMm, pointerDistanceAfterBoilingMm: input.pointerDistanceAfterBoilingMm } }
  ];
  return { expansionMm, classification, trace, validation: { valid: true, issues: [] } };
}

export function validateCementSoundness(input: Partial<CementSoundnessInput>): ValidationReport {
  const result = calculateCementSoundness(input as CementSoundnessInput);
  if (!result) return { valid: false, issues: [{ level: "data", severity: "error", code: "SOUNDNESS_INPUT_INVALID", message: "Cement soundness inputs are incomplete or physically invalid." }] };
  return result.validation;
}
