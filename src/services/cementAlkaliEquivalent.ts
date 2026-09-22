import type { CalculationTraceStep, ValidationIssue, ValidationReport } from "../types/laboratoryDomain";
export interface CementAlkaliEquivalentInput extends Record<string, unknown> { sodiumOxidePercent: number; potassiumOxidePercent: number; }
export interface CementAlkaliEquivalentOutput { alkaliEquivalentPercent: number; trace: CalculationTraceStep[]; validation: ValidationReport; }
const error = (code: string, message: string, field?: string): ValidationIssue => ({ level: "data", severity: "error", code, message, field });
export function calculateCementAlkaliEquivalent(input: CementAlkaliEquivalentInput): CementAlkaliEquivalentOutput | undefined {
  const issues: ValidationIssue[] = [];
  for (const field of ["sodiumOxidePercent", "potassiumOxidePercent"] as const) if (!Number.isFinite(input[field]) || input[field] < 0) issues.push(error("INVALID_ALKALI_INPUT", `${field} must be zero or greater.`, field));
  if (issues.length) return undefined;
  const alkaliEquivalentPercent = Number((input.sodiumOxidePercent + 0.658 * input.potassiumOxidePercent).toFixed(3));
  const trace: CalculationTraceStep[] = [{ stepNumber: 1, label: "Equivalent alkali", formula: "Na₂O + 0.658 × K₂O", substitution: `${input.sodiumOxidePercent} + 0.658 × ${input.potassiumOxidePercent}`, result: alkaliEquivalentPercent, unit: "%", inputs: { sodiumOxidePercent: input.sodiumOxidePercent, potassiumOxidePercent: input.potassiumOxidePercent } }];
  return { alkaliEquivalentPercent, trace, validation: { valid: true, issues: [] } };
}
export function validateCementAlkaliEquivalent(input: Partial<CementAlkaliEquivalentInput>): ValidationReport { const result = calculateCementAlkaliEquivalent(input as CementAlkaliEquivalentInput); return result?.validation || { valid: false, issues: [error("CEMENT_ALKALI_INPUT_INVALID", "Alkali inputs are incomplete or physically invalid.")] }; }
