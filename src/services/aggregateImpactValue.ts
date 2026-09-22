import type { CalculationTraceStep, ValidationIssue, ValidationReport } from "../types/laboratoryDomain";
export interface AggregateImpactValueInput extends Record<string, unknown> { initialMassG: number; passingMassG: number; }
export interface AggregateImpactValueOutput { impactValuePercent: number; classification: "Excellent" | "Good" | "Acceptable" | "Fail"; trace: CalculationTraceStep[]; validation: ValidationReport; }
const error = (code: string, message: string, field?: string): ValidationIssue => ({ level: "data", severity: "error", code, message, field });
export function calculateAggregateImpactValue(input: AggregateImpactValueInput): AggregateImpactValueOutput | undefined {
  const issues: ValidationIssue[] = [];
  if (!Number.isFinite(input.initialMassG) || input.initialMassG <= 0) issues.push(error("INVALID_INITIAL_MASS", "Initial mass must be greater than zero.", "initialMassG"));
  if (!Number.isFinite(input.passingMassG) || input.passingMassG < 0) issues.push(error("INVALID_PASSING_MASS", "Passing mass must be zero or greater.", "passingMassG"));
  if (issues.length || input.passingMassG > input.initialMassG) return undefined;
  const impactValuePercent = Number(((input.passingMassG / input.initialMassG) * 100).toFixed(2));
  const classification = impactValuePercent <= 20 ? "Excellent" : impactValuePercent <= 30 ? "Good" : impactValuePercent <= 45 ? "Acceptable" : "Fail";
  const trace: CalculationTraceStep[] = [{ stepNumber: 1, label: "Aggregate impact value", formula: "passing mass after impact / initial mass × 100", substitution: `${input.passingMassG} / ${input.initialMassG} × 100`, result: impactValuePercent, unit: "%", inputs: { initialMassG: input.initialMassG, passingMassG: input.passingMassG } }];
  return { impactValuePercent, classification, trace, validation: { valid: true, issues: [] } };
}
export function validateAggregateImpactValue(input: Partial<AggregateImpactValueInput>): ValidationReport { const result = calculateAggregateImpactValue(input as AggregateImpactValueInput); return result?.validation || { valid: false, issues: [error("AGGREGATE_IMPACT_INPUT_INVALID", "Aggregate impact inputs are incomplete or physically invalid.")] }; }
