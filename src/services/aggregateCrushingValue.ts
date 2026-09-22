import type { CalculationTraceStep, ValidationIssue, ValidationReport } from "../types/laboratoryDomain";

export interface AggregateCrushingValueInput extends Record<string, unknown> {
  initialMassG: number;
  crushedPassingMassG: number;
}

export interface AggregateCrushingValueOutput {
  crushingValuePercent: number;
  classification: "Excellent" | "Good" | "Acceptable" | "Fail";
  trace: CalculationTraceStep[];
  validation: ValidationReport;
}

function error(code: string, message: string, field?: string): ValidationIssue {
  return { level: "data", severity: "error", code, message, field };
}

export function calculateAggregateCrushingValue(input: AggregateCrushingValueInput): AggregateCrushingValueOutput | undefined {
  const issues: ValidationIssue[] = [];
  if (!Number.isFinite(input.initialMassG) || input.initialMassG <= 0) issues.push(error("INVALID_INITIAL_MASS", "Initial aggregate mass must be greater than zero.", "initialMassG"));
  if (!Number.isFinite(input.crushedPassingMassG) || input.crushedPassingMassG < 0) issues.push(error("INVALID_CRUSHED_MASS", "Crushed passing mass must be zero or greater.", "crushedPassingMassG"));
  if (issues.length || input.crushedPassingMassG > input.initialMassG) return undefined;

  const crushingValuePercent = Number(((input.crushedPassingMassG / input.initialMassG) * 100).toFixed(2));
  const classification = crushingValuePercent <= 20 ? "Excellent" : crushingValuePercent <= 30 ? "Good" : crushingValuePercent <= 45 ? "Acceptable" : "Fail";
  const trace: CalculationTraceStep[] = [{
    stepNumber: 1,
    label: "Aggregate crushing value",
    formula: "mass passing after crushing / initial sample mass × 100",
    substitution: `${input.crushedPassingMassG} / ${input.initialMassG} × 100`,
    result: crushingValuePercent,
    unit: "%",
    inputs: { initialMassG: input.initialMassG, crushedPassingMassG: input.crushedPassingMassG }
  }];
  return { crushingValuePercent, classification, trace, validation: { valid: true, issues: [] } };
}

export function validateAggregateCrushingValue(input: Partial<AggregateCrushingValueInput>): ValidationReport {
  const result = calculateAggregateCrushingValue(input as AggregateCrushingValueInput);
  if (!result) return { valid: false, issues: [{ level: "data", severity: "error", code: "AGGREGATE_CRUSHING_INPUT_INVALID", message: "Aggregate crushing inputs are incomplete or physically invalid." }] };
  return result.validation;
}
