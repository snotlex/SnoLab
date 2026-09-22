import type { CalculationTraceStep, ValidationIssue, ValidationReport } from "../types/laboratoryDomain";
export interface AggregateElongationIndexInput extends Record<string, unknown> { totalMassG: number; elongatedMassG: number; }
export interface AggregateElongationIndexOutput { elongationIndexPercent: number; classification: "Low" | "Moderate" | "High"; trace: CalculationTraceStep[]; validation: ValidationReport; }
const error = (code: string, message: string, field?: string): ValidationIssue => ({ level: "data", severity: "error", code, message, field });
export function calculateAggregateElongationIndex(input: AggregateElongationIndexInput): AggregateElongationIndexOutput | undefined {
  const issues: ValidationIssue[] = [];
  if (!Number.isFinite(input.totalMassG) || input.totalMassG <= 0) issues.push(error("INVALID_TOTAL_MASS", "Total aggregate mass must be greater than zero.", "totalMassG"));
  if (!Number.isFinite(input.elongatedMassG) || input.elongatedMassG < 0) issues.push(error("INVALID_ELONGATED_MASS", "Elongated mass must be zero or greater.", "elongatedMassG"));
  if (issues.length || input.elongatedMassG > input.totalMassG) return undefined;
  const elongationIndexPercent = Number(((input.elongatedMassG / input.totalMassG) * 100).toFixed(2));
  const classification = elongationIndexPercent <= 15 ? "Low" : elongationIndexPercent <= 25 ? "Moderate" : "High";
  const trace: CalculationTraceStep[] = [{ stepNumber: 1, label: "Elongation index", formula: "elongated particle mass / total sample mass × 100", substitution: `${input.elongatedMassG} / ${input.totalMassG} × 100`, result: elongationIndexPercent, unit: "%", inputs: { totalMassG: input.totalMassG, elongatedMassG: input.elongatedMassG } }];
  return { elongationIndexPercent, classification, trace, validation: { valid: true, issues: [] } };
}
export function validateAggregateElongationIndex(input: Partial<AggregateElongationIndexInput>): ValidationReport { const result = calculateAggregateElongationIndex(input as AggregateElongationIndexInput); return result?.validation || { valid: false, issues: [error("AGGREGATE_ELONGATION_INPUT_INVALID", "Elongation inputs are incomplete or physically invalid.")] }; }
