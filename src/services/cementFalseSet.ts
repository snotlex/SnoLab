import type { CalculationTraceStep, ValidationIssue, ValidationReport } from "../types/laboratoryDomain";
export interface CementFalseSetInput extends Record<string, unknown> { initialPenetrationMm: number; remixedPenetrationMm: number; }
export interface CementFalseSetOutput { recoveryPercent: number; classification: "No false set indication" | "False set indication"; trace: CalculationTraceStep[]; validation: ValidationReport; }
const error = (code: string, message: string, field?: string): ValidationIssue => ({ level: "data", severity: "error", code, message, field });
export function calculateCementFalseSet(input: CementFalseSetInput): CementFalseSetOutput | undefined {
  const issues: ValidationIssue[] = [];
  if (!Number.isFinite(input.initialPenetrationMm) || input.initialPenetrationMm <= 0) issues.push(error("INVALID_INITIAL_PENETRATION", "Initial penetration must be greater than zero.", "initialPenetrationMm"));
  if (!Number.isFinite(input.remixedPenetrationMm) || input.remixedPenetrationMm < 0) issues.push(error("INVALID_REMIXED_PENETRATION", "Remixed penetration must be zero or greater.", "remixedPenetrationMm"));
  if (issues.length) return undefined;
  const recoveryPercent = Number(((input.remixedPenetrationMm / input.initialPenetrationMm) * 100).toFixed(2));
  const classification = recoveryPercent >= 80 ? "No false set indication" : "False set indication";
  const trace: CalculationTraceStep[] = [{ stepNumber: 1, label: "False-set recovery", formula: "remixed penetration / initial penetration × 100", substitution: `${input.remixedPenetrationMm} / ${input.initialPenetrationMm} × 100`, result: recoveryPercent, unit: "%", inputs: { initialPenetrationMm: input.initialPenetrationMm, remixedPenetrationMm: input.remixedPenetrationMm } }];
  return { recoveryPercent, classification, trace, validation: { valid: true, issues: [] } };
}
export function validateCementFalseSet(input: Partial<CementFalseSetInput>): ValidationReport { const result = calculateCementFalseSet(input as CementFalseSetInput); return result?.validation || { valid: false, issues: [error("CEMENT_FALSE_SET_INPUT_INVALID", "False-set inputs are incomplete or physically invalid.")] }; }
