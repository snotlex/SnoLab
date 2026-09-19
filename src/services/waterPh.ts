import type { CalculationTraceStep, ValidationIssue, ValidationReport } from "../types/laboratoryDomain";

export interface WaterPhInput extends Record<string, unknown> {
  measuredPh: number;
  waterTemperatureC?: number;
}

export interface WaterPhOutput {
  waterPh: number;
  classification: "Pass" | "Warning" | "Fail";
  trace: CalculationTraceStep[];
  validation: ValidationReport;
}

function error(code: string, message: string, field?: string): ValidationIssue {
  return { level: "data", severity: "error", code, message, field };
}
function warning(code: string, message: string, field?: string): ValidationIssue {
  return { level: "engineering", severity: "warning", code, message, field };
}

export function calculateWaterPh(input: WaterPhInput): WaterPhOutput | undefined {
  const issues: ValidationIssue[] = [];
  if (!Number.isFinite(input.measuredPh) || input.measuredPh < 0 || input.measuredPh > 14) issues.push(error("INVALID_PH", "Measured pH must be between 0 and 14.", "measuredPh"));
  if (input.waterTemperatureC !== undefined && (!Number.isFinite(input.waterTemperatureC) || input.waterTemperatureC < 0 || input.waterTemperatureC > 60)) issues.push(error("INVALID_WATER_TEMPERATURE", "Water temperature must be between 0 and 60 °C when recorded.", "waterTemperatureC"));
  if (issues.length) return undefined;
  if (input.waterTemperatureC !== undefined && (input.waterTemperatureC < 15 || input.waterTemperatureC > 30)) issues.push(warning("TEMPERATURE_OUTSIDE_PH_REFERENCE", "Water temperature is outside the 15–30 °C reference band; record the instrument compensation condition." , "waterTemperatureC"));
  const classification = input.measuredPh >= 5 && input.measuredPh <= 8.5 ? "Pass" : input.measuredPh >= 4.5 && input.measuredPh <= 9.5 ? "Warning" : "Fail";
  const trace: CalculationTraceStep[] = [
    { stepNumber: 1, label: "Measured water pH", formula: "direct calibrated pH-meter reading", substitution: `${input.measuredPh}`, result: input.measuredPh, unit: "pH", inputs: { measuredPh: input.measuredPh, waterTemperatureC: input.waterTemperatureC } }
  ];
  return { waterPh: input.measuredPh, classification, trace, validation: { valid: true, issues } };
}

export function validateWaterPh(input: Partial<WaterPhInput>): ValidationReport {
  const result = calculateWaterPh(input as WaterPhInput);
  if (!result) return { valid: false, issues: [{ level: "data", severity: "error", code: "WATER_PH_INPUT_INVALID", message: "Water pH inputs are incomplete or physically invalid." }] };
  return result.validation;
}
