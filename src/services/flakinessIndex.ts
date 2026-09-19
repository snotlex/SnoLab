import type { CalculationTraceStep, ValidationIssue, ValidationReport } from "../types/laboratoryDomain";

export interface FlakinessFraction {
  sizeRange: string;
  totalMassG: number;
  passingMassG: number;
}

export interface FlakinessInput extends Record<string, unknown> {
  totalSampleMassG: number;
  passingBarSievesMassG: number;
  fractions?: FlakinessFraction[];
  massBalanceToleranceG?: number;
}

export interface FlakinessOutput {
  flakinessIndexPercent: number;
  passingMassG: number;
  totalMassG: number;
  classification: "Excellent" | "Acceptable" | "Fail";
  trace: CalculationTraceStep[];
  validation: ValidationReport;
}

function error(code: string, message: string, field?: string): ValidationIssue {
  return { level: "data", severity: "error", code, message, field };
}
function warning(code: string, message: string, field?: string): ValidationIssue {
  return { level: "engineering", severity: "warning", code, message, field };
}

export function calculateFlakinessIndex(input: FlakinessInput): FlakinessOutput | undefined {
  const issues: ValidationIssue[] = [];
  if (!Number.isFinite(input.totalSampleMassG) || input.totalSampleMassG <= 0) issues.push(error("INVALID_TOTAL_SAMPLE", "Total sample mass must be greater than zero.", "totalSampleMassG"));
  if (!Number.isFinite(input.passingBarSievesMassG) || input.passingBarSievesMassG < 0) issues.push(error("INVALID_PASSING_MASS", "Mass passing the bar sieves must be zero or greater.", "passingBarSievesMassG"));
  if (input.massBalanceToleranceG !== undefined && (!Number.isFinite(input.massBalanceToleranceG) || input.massBalanceToleranceG < 0)) issues.push(error("INVALID_MASS_TOLERANCE", "Mass-balance tolerance must be zero or greater.", "massBalanceToleranceG"));
  if (issues.length) return undefined;
  if (input.passingBarSievesMassG > input.totalSampleMassG) issues.push(error("PASSING_EXCEEDS_TOTAL", "Passing bar-sieve mass cannot exceed total sample mass.", "passingBarSievesMassG"));
  if (input.fractions !== undefined) {
    if (!Array.isArray(input.fractions) || input.fractions.length === 0) issues.push(error("EMPTY_FRACTIONS", "Fractions must contain at least one size range when supplied.", "fractions"));
    else {
      const sumTotal = input.fractions.reduce((sum, fraction, index) => {
        if (!fraction.sizeRange.trim()) issues.push(error("INVALID_FRACTION_LABEL", "Each fraction must have a size-range label.", `fractions[${index}].sizeRange`));
        if (!Number.isFinite(fraction.totalMassG) || fraction.totalMassG <= 0) issues.push(error("INVALID_FRACTION_TOTAL", "Fraction total mass must be greater than zero.", `fractions[${index}].totalMassG`));
        if (!Number.isFinite(fraction.passingMassG) || fraction.passingMassG < 0 || fraction.passingMassG > fraction.totalMassG) issues.push(error("INVALID_FRACTION_PASSING", "Fraction passing mass must be between zero and its total mass.", `fractions[${index}].passingMassG`));
        return sum + fraction.totalMassG;
      }, 0);
      const sumPassing = input.fractions.reduce((sum, fraction) => sum + fraction.passingMassG, 0);
      const tolerance = input.massBalanceToleranceG ?? 1;
      if (Math.abs(sumTotal - input.totalSampleMassG) > tolerance) issues.push(error("FRACTION_TOTAL_MISMATCH", "Fraction total masses do not match the declared sample mass."));
      if (Math.abs(sumPassing - input.passingBarSievesMassG) > tolerance) issues.push(error("FRACTION_PASSING_MISMATCH", "Fraction passing masses do not match the declared passing mass."));
    }
  }
  if (issues.some(item => item.severity === "error")) return undefined;

  const flakinessIndexPercent = Number(((input.passingBarSievesMassG / input.totalSampleMassG) * 100).toFixed(2));
  const classification = flakinessIndexPercent <= 20 ? "Excellent" : flakinessIndexPercent <= 30 ? "Acceptable" : "Fail";
  if (flakinessIndexPercent > 30) issues.push(warning("HIGH_FLAKINESS_INDEX", "Flakiness index exceeds the configured acceptable screening level."));
  const trace: CalculationTraceStep[] = [
    { stepNumber: 1, label: "Flaky-particle mass", formula: "sum of mass passing bar sieves", substitution: `${input.passingBarSievesMassG}`, result: input.passingBarSievesMassG, unit: "g", inputs: { passingBarSievesMassG: input.passingBarSievesMassG, fractionCount: input.fractions?.length ?? 0 } },
    { stepNumber: 2, label: "Flakiness index", formula: "passing mass / total sample mass × 100", substitution: `${input.passingBarSievesMassG} / ${input.totalSampleMassG} × 100`, result: flakinessIndexPercent, unit: "%", inputs: { passingBarSievesMassG: input.passingBarSievesMassG, totalSampleMassG: input.totalSampleMassG } }
  ];
  return { flakinessIndexPercent, passingMassG: input.passingBarSievesMassG, totalMassG: input.totalSampleMassG, classification, trace, validation: { valid: true, issues } };
}

export function validateFlakiness(input: Partial<FlakinessInput>): ValidationReport {
  const result = calculateFlakinessIndex(input as FlakinessInput);
  if (!result) return { valid: false, issues: [{ level: "data", severity: "error", code: "FLAKINESS_INPUT_INVALID", message: "Flakiness inputs are incomplete or physically invalid." }] };
  return result.validation;
}
