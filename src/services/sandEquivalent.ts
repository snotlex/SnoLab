import type { CalculationTraceStep, ValidationIssue, ValidationReport } from "../types/laboratoryDomain";

export type SandEquivalentMethod = "piston" | "visual";

export interface SandEquivalentInput extends Record<string, unknown> {
  totalHeightMm: number;
  sandHeightMm: number;
  method: SandEquivalentMethod;
}

export interface SandEquivalentOutput {
  sandEquivalentPercent: number;
  method: SandEquivalentMethod;
  classification: "Clean" | "Acceptable" | "Fail";
  trace: CalculationTraceStep[];
  validation: ValidationReport;
}

function issue(code: string, message: string, field?: string): ValidationIssue {
  return { level: "data", severity: "error", code, message, field };
}

export function calculateSandEquivalent(input: SandEquivalentInput): SandEquivalentOutput | undefined {
  const issues: ValidationIssue[] = [];
  if (!Number.isFinite(input.totalHeightMm) || input.totalHeightMm <= 0) issues.push(issue("INVALID_TOTAL_HEIGHT", "Total suspension height must be greater than zero.", "totalHeightMm"));
  if (!Number.isFinite(input.sandHeightMm) || input.sandHeightMm < 0) issues.push(issue("INVALID_SAND_HEIGHT", "Sand height must be zero or greater.", "sandHeightMm"));
  if (input.sandHeightMm > input.totalHeightMm) issues.push(issue("SAND_HEIGHT_EXCEEDS_TOTAL", "Sand height cannot exceed total suspension height.", "sandHeightMm"));
  if (input.method !== "piston" && input.method !== "visual") issues.push(issue("INVALID_METHOD", "Method must be piston or visual.", "method"));
  if (issues.length) return undefined;

  const sandEquivalentPercent = Number(((input.sandHeightMm / input.totalHeightMm) * 100).toFixed(1));
  const classification = sandEquivalentPercent >= 75 ? "Clean" : sandEquivalentPercent >= 70 ? "Acceptable" : "Fail";
  const trace: CalculationTraceStep[] = [
    { stepNumber: 1, label: "Sand equivalent", formula: "sand height / total suspension height × 100", substitution: `${input.sandHeightMm} / ${input.totalHeightMm} × 100`, result: sandEquivalentPercent, unit: "%", inputs: { sandHeightMm: input.sandHeightMm, totalHeightMm: input.totalHeightMm, method: input.method } }
  ];
  return { sandEquivalentPercent, method: input.method, classification, trace, validation: { valid: true, issues: [] } };
}

export function validateSandEquivalent(input: Partial<SandEquivalentInput>): ValidationReport {
  const result = calculateSandEquivalent(input as SandEquivalentInput);
  if (!result) return { valid: false, issues: [{ level: "data", severity: "error", code: "SAND_EQUIVALENT_INPUT_INVALID", message: "Sand-equivalent inputs are incomplete or physically invalid." }] };
  return result.validation;
}
