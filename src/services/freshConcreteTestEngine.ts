import type { CalculationTraceStep, ValidationIssue } from "../types/laboratoryDomain";

export type FreshConcreteTemperatureInput = Record<string, unknown> & { measuredTemperatureC: number; ambientTemperatureC?: number; batchId: string; measuredAt?: string; };
export type FreshConcreteSlumpInput = Record<string, unknown> & { slumpMm: number; targetSlumpMm?: number; toleranceMm?: number; batchId: string; placementLocation?: string; measuredAt?: string; };
export interface FreshConcreteTemperatureResult { temperatureC: number; trace: CalculationTraceStep[]; }
export interface FreshConcreteSlumpResult { slumpMm: number; deviationMm?: number; trace: CalculationTraceStep[]; }
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const issue = (code: string, message: string, field?: string): ValidationIssue => ({ level: "data", severity: "error", code, message, field });

export function validateFreshConcreteTemperatureInput(input: FreshConcreteTemperatureInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!input.batchId?.trim()) issues.push(issue("FRESH_BATCH_ID_REQUIRED", "Batch identity is required.", "batchId"));
  if (!finite(input.measuredTemperatureC)) issues.push(issue("FRESH_TEMPERATURE_INVALID", "Measured temperature must be finite.", "measuredTemperatureC"));
  if (input.ambientTemperatureC !== undefined && !finite(input.ambientTemperatureC)) issues.push(issue("AMBIENT_TEMPERATURE_INVALID", "Ambient temperature must be finite.", "ambientTemperatureC"));
  return issues;
}
export function calculateFreshConcreteTemperature(input: FreshConcreteTemperatureInput): FreshConcreteTemperatureResult {
  const validation = validateFreshConcreteTemperatureInput(input);
  if (validation.length) throw new Error(validation.map(item => item.code).join(","));
  return { temperatureC: input.measuredTemperatureC, trace: [{ stepNumber: 1, label: "Measured temperature", formula: "Tfresh = measured reading", substitution: `${input.measuredTemperatureC}`, result: input.measuredTemperatureC, unit: "°C", inputs: { batchId: input.batchId } }] };
}

export function validateFreshConcreteSlumpInput(input: FreshConcreteSlumpInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!input.batchId?.trim()) issues.push(issue("FRESH_BATCH_ID_REQUIRED", "Batch identity is required.", "batchId"));
  if (!finite(input.slumpMm) || input.slumpMm < 0) issues.push(issue("SLUMP_INVALID", "Slump must be finite and non-negative.", "slumpMm"));
  if (input.targetSlumpMm !== undefined && (!finite(input.targetSlumpMm) || input.targetSlumpMm < 0)) issues.push(issue("SLUMP_TARGET_INVALID", "Target slump must be finite and non-negative.", "targetSlumpMm"));
  if (input.toleranceMm !== undefined && (!finite(input.toleranceMm) || input.toleranceMm < 0)) issues.push(issue("SLUMP_TOLERANCE_INVALID", "Slump tolerance must be finite and non-negative.", "toleranceMm"));
  return issues;
}
export function calculateFreshConcreteSlump(input: FreshConcreteSlumpInput): FreshConcreteSlumpResult {
  const validation = validateFreshConcreteSlumpInput(input);
  if (validation.length) throw new Error(validation.map(item => item.code).join(","));
  const deviationMm = input.targetSlumpMm === undefined ? undefined : input.slumpMm - input.targetSlumpMm;
  return { slumpMm: input.slumpMm, deviationMm, trace: [{ stepNumber: 1, label: "Slump deviation", formula: "Δ = measured − target", substitution: input.targetSlumpMm === undefined ? "target not supplied" : `${input.slumpMm} − ${input.targetSlumpMm}`, result: deviationMm ?? "not_configured", unit: "mm", inputs: { batchId: input.batchId } }] };
}
