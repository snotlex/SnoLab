import type { CalculationTraceStep, ValidationIssue, ValidationReport } from "../types/laboratoryDomain";
export interface AggregateClayLumpsInput extends Record<string, unknown> { drySampleMassG: number; clayLumpsMassG: number; }
export interface AggregateClayLumpsOutput { clayLumpsPercent: number; classification: "Low" | "Moderate" | "High"; trace: CalculationTraceStep[]; validation: ValidationReport; }
const error = (code: string, message: string, field?: string): ValidationIssue => ({ level: "data", severity: "error", code, message, field });
export function calculateAggregateClayLumps(input: AggregateClayLumpsInput): AggregateClayLumpsOutput | undefined {
  const issues: ValidationIssue[] = [];
  if (!Number.isFinite(input.drySampleMassG) || input.drySampleMassG <= 0) issues.push(error("INVALID_DRY_MASS", "Dry sample mass must be greater than zero.", "drySampleMassG"));
  if (!Number.isFinite(input.clayLumpsMassG) || input.clayLumpsMassG < 0) issues.push(error("INVALID_CLAY_MASS", "Clay-lumps mass must be zero or greater.", "clayLumpsMassG"));
  if (issues.length || input.clayLumpsMassG > input.drySampleMassG) return undefined;
  const clayLumpsPercent = Number(((input.clayLumpsMassG / input.drySampleMassG) * 100).toFixed(2));
  const classification = clayLumpsPercent <= 1 ? "Low" : clayLumpsPercent <= 3 ? "Moderate" : "High";
  const trace: CalculationTraceStep[] = [{ stepNumber: 1, label: "Clay lumps content", formula: "clay lumps mass / dry sample mass × 100", substitution: `${input.clayLumpsMassG} / ${input.drySampleMassG} × 100`, result: clayLumpsPercent, unit: "%", inputs: { drySampleMassG: input.drySampleMassG, clayLumpsMassG: input.clayLumpsMassG } }];
  return { clayLumpsPercent, classification, trace, validation: { valid: true, issues: [] } };
}
export function validateAggregateClayLumps(input: Partial<AggregateClayLumpsInput>): ValidationReport { const result = calculateAggregateClayLumps(input as AggregateClayLumpsInput); return result?.validation || { valid: false, issues: [error("AGGREGATE_CLAY_INPUT_INVALID", "Clay-lumps inputs are incomplete or physically invalid.")] }; }
