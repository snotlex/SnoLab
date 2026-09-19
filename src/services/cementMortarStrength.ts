import type { CalculationTraceStep, ValidationIssue, ValidationReport } from "../types/laboratoryDomain";

export interface CementMortarStrengthInput extends Record<string, unknown> {
  strength2dPrismsKn: number[];
  strength7dPrismsKn: number[];
  strength28dPrismsKn: number[];
  prismWidthMm?: number;
  prismDepthMm?: number;
}

export interface CementMortarStrengthOutput {
  strength2dMPa: number;
  strength7dMPa: number;
  strength28dMPa: number;
  strengthClass: "Below 32.5" | "32.5" | "42.5" | "52.5";
  compressionAreaMm2: number;
  trace: CalculationTraceStep[];
  validation: ValidationReport;
}

function error(code: string, message: string, field?: string): ValidationIssue {
  return { level: "data", severity: "error", code, message, field };
}
function warning(code: string, message: string): ValidationIssue {
  return { level: "engineering", severity: "warning", code, message };
}

export function calculateCementMortarStrength(input: CementMortarStrengthInput): CementMortarStrengthOutput | undefined {
  const issues: ValidationIssue[] = [];
  const ageSeries = [input.strength2dPrismsKn, input.strength7dPrismsKn, input.strength28dPrismsKn];
  ageSeries.forEach((series, ageIndex) => {
    if (!Array.isArray(series) || series.length < 3) issues.push(error("INSUFFICIENT_PRISM_RESULTS", `At least three prism force results are required for age series ${[2, 7, 28][ageIndex]} days.`));
    else if (series.some(force => !Number.isFinite(force) || force <= 0)) issues.push(error("INVALID_PRISM_FORCE", "All prism failure forces must be finite and greater than zero."));
  });
  if (input.prismWidthMm !== undefined && (!Number.isFinite(input.prismWidthMm) || input.prismWidthMm <= 0)) issues.push(error("INVALID_PRISM_WIDTH", "Prism compression width must be greater than zero.", "prismWidthMm"));
  if (input.prismDepthMm !== undefined && (!Number.isFinite(input.prismDepthMm) || input.prismDepthMm <= 0)) issues.push(error("INVALID_PRISM_DEPTH", "Prism compression depth must be greater than zero.", "prismDepthMm"));
  if (input.prismWidthMm !== undefined && input.prismWidthMm !== 40) issues.push(error("NON_STANDARD_PRISM_WIDTH", "The configured EN 196-1 prism compression width must be 40 mm.", "prismWidthMm"));
  if (input.prismDepthMm !== undefined && input.prismDepthMm !== 40) issues.push(error("NON_STANDARD_PRISM_DEPTH", "The configured EN 196-1 prism compression depth must be 40 mm.", "prismDepthMm"));
  if (issues.length) return undefined;

  const compressionAreaMm2 = 40 * 40;
  const averageStrength = (series: number[]) => Number(((series.reduce((sum, force) => sum + force, 0) / series.length) * 1000 / compressionAreaMm2).toFixed(2));
  const strength2dMPa = averageStrength(input.strength2dPrismsKn);
  const strength7dMPa = averageStrength(input.strength7dPrismsKn);
  const strength28dMPa = averageStrength(input.strength28dPrismsKn);
  if (strength7dMPa < strength2dMPa) issues.push(warning("NON_MONOTONIC_STRENGTH", "Seven-day average strength is below the two-day average; review curing and specimen records."));
  if (strength28dMPa < strength7dMPa) issues.push(warning("NON_MONOTONIC_STRENGTH", "Twenty-eight-day average strength is below the seven-day average; review curing and specimen records."));
  const strengthClass = strength28dMPa >= 52.5 ? "52.5" : strength28dMPa >= 42.5 ? "42.5" : strength28dMPa >= 32.5 ? "32.5" : "Below 32.5";
  const trace: CalculationTraceStep[] = [
    { stepNumber: 1, label: "Two-day compressive strength", formula: "mean force × 1000 / (40 × 40)", substitution: `mean(${input.strength2dPrismsKn.join(", ")}) × 1000 / 1600`, result: strength2dMPa, unit: "MPa", inputs: { specimenCount: input.strength2dPrismsKn.length, compressionAreaMm2 } },
    { stepNumber: 2, label: "Seven-day compressive strength", formula: "mean force × 1000 / (40 × 40)", substitution: `mean(${input.strength7dPrismsKn.join(", ")}) × 1000 / 1600`, result: strength7dMPa, unit: "MPa", inputs: { specimenCount: input.strength7dPrismsKn.length, compressionAreaMm2 } },
    { stepNumber: 3, label: "Twenty-eight-day compressive strength", formula: "mean force × 1000 / (40 × 40)", substitution: `mean(${input.strength28dPrismsKn.join(", ")}) × 1000 / 1600`, result: strength28dMPa, unit: "MPa", inputs: { specimenCount: input.strength28dPrismsKn.length, compressionAreaMm2 } }
  ];
  return { strength2dMPa, strength7dMPa, strength28dMPa, strengthClass, compressionAreaMm2, trace, validation: { valid: true, issues } };
}

export function validateCementMortarStrength(input: Partial<CementMortarStrengthInput>): ValidationReport {
  const result = calculateCementMortarStrength(input as CementMortarStrengthInput);
  if (!result) return { valid: false, issues: [{ level: "data", severity: "error", code: "MORTAR_STRENGTH_INPUT_INVALID", message: "Cement mortar strength inputs are incomplete or physically invalid." }] };
  return result.validation;
}
