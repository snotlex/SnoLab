import type { CalculationTraceStep, ValidationIssue, ValidationReport } from "../types/laboratoryDomain";
export interface CementHydrationHeatInput extends Record<string, unknown> { cementMassG: number; initialHeatJ: number; finalHeatJ: number; }
export interface CementHydrationHeatOutput { heatOfHydrationJPerG: number; trace: CalculationTraceStep[]; validation: ValidationReport; }
const error = (code: string, message: string, field?: string): ValidationIssue => ({ level: "data", severity: "error", code, message, field });
export function calculateCementHydrationHeat(input: CementHydrationHeatInput): CementHydrationHeatOutput | undefined {
  const issues: ValidationIssue[] = [];
  if (!Number.isFinite(input.cementMassG) || input.cementMassG <= 0) issues.push(error("INVALID_CEMENT_MASS", "Cement mass must be greater than zero.", "cementMassG"));
  if (!Number.isFinite(input.initialHeatJ) || input.initialHeatJ < 0) issues.push(error("INVALID_INITIAL_HEAT", "Initial heat must be zero or greater.", "initialHeatJ"));
  if (!Number.isFinite(input.finalHeatJ) || input.finalHeatJ < input.initialHeatJ) issues.push(error("INVALID_FINAL_HEAT", "Final heat must be at least the initial heat.", "finalHeatJ"));
  if (issues.length) return undefined;
  const heatOfHydrationJPerG = Number(((input.finalHeatJ - input.initialHeatJ) / input.cementMassG).toFixed(3));
  const trace: CalculationTraceStep[] = [{ stepNumber: 1, label: "Heat of hydration", formula: "(final heat − initial heat) / cement mass", substitution: `(${input.finalHeatJ} − ${input.initialHeatJ}) / ${input.cementMassG}`, result: heatOfHydrationJPerG, unit: "J/g", inputs: { cementMassG: input.cementMassG, initialHeatJ: input.initialHeatJ, finalHeatJ: input.finalHeatJ } }];
  return { heatOfHydrationJPerG, trace, validation: { valid: true, issues: [] } };
}
export function validateCementHydrationHeat(input: Partial<CementHydrationHeatInput>): ValidationReport { const result = calculateCementHydrationHeat(input as CementHydrationHeatInput); return result?.validation || { valid: false, issues: [error("CEMENT_HYDRATION_HEAT_INPUT_INVALID", "Hydration heat inputs are incomplete or physically invalid.")] }; }
