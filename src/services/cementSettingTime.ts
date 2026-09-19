import type { CalculationTraceStep, ValidationIssue, ValidationReport } from "../types/laboratoryDomain";

export interface SettingTimeReading {
  timeMinutes: number;
  penetrationMm: number;
}

export interface CementSettingTimeInput extends Record<string, unknown> {
  waterPercent: number;
  roomTempC: number;
  humidityPercent: number;
  timeReadings: SettingTimeReading[];
  initialSetThresholdMm?: number;
  finalSetThresholdMm?: number;
}

export interface CementSettingTimeOutput {
  initialSettingMinutes: number;
  finalSettingMinutes: number;
  initialSetThresholdMm: number;
  finalSetThresholdMm: number;
  readings: SettingTimeReading[];
  trace: CalculationTraceStep[];
  validation: ValidationReport;
}

function error(code: string, message: string, field?: string): ValidationIssue {
  return { level: "data", severity: "error", code, message, field };
}
function warning(code: string, message: string, field?: string): ValidationIssue {
  return { level: "engineering", severity: "warning", code, message, field };
}

export function calculateCementSettingTime(input: CementSettingTimeInput): CementSettingTimeOutput | undefined {
  const issues: ValidationIssue[] = [];
  if (!Number.isFinite(input.waterPercent) || input.waterPercent <= 0 || input.waterPercent >= 100) issues.push(error("INVALID_WATER_PERCENT", "Water percentage must be between zero and 100.", "waterPercent"));
  if (!Number.isFinite(input.roomTempC) || input.roomTempC < 5 || input.roomTempC > 40) issues.push(error("INVALID_ROOM_TEMPERATURE", "Room temperature must be between 5 and 40 °C.", "roomTempC"));
  if (!Number.isFinite(input.humidityPercent) || input.humidityPercent < 0 || input.humidityPercent > 100) issues.push(error("INVALID_HUMIDITY", "Humidity must be between zero and 100 percent.", "humidityPercent"));
  if (!Array.isArray(input.timeReadings) || input.timeReadings.length < 2) issues.push(error("INSUFFICIENT_SETTING_READINGS", "At least two Vicat time readings are required.", "timeReadings"));
  const initialSetThresholdMm = input.initialSetThresholdMm ?? 5;
  const finalSetThresholdMm = input.finalSetThresholdMm ?? 0.5;
  if (!Number.isFinite(initialSetThresholdMm) || initialSetThresholdMm <= 0) issues.push(error("INVALID_INITIAL_THRESHOLD", "Initial-set penetration threshold must be greater than zero.", "initialSetThresholdMm"));
  if (!Number.isFinite(finalSetThresholdMm) || finalSetThresholdMm < 0 || finalSetThresholdMm >= initialSetThresholdMm) issues.push(error("INVALID_FINAL_THRESHOLD", "Final-set threshold must be non-negative and below the initial-set threshold.", "finalSetThresholdMm"));
  if (issues.length) return undefined;

  let previousTime = -Infinity;
  input.timeReadings.forEach((reading, index) => {
    if (!Number.isFinite(reading.timeMinutes) || reading.timeMinutes < 0) issues.push(error("INVALID_READING_TIME", "Reading time must be a non-negative finite value.", `timeReadings[${index}].timeMinutes`));
    if (!Number.isFinite(reading.penetrationMm) || reading.penetrationMm < 0) issues.push(error("INVALID_PENETRATION", "Penetration must be a non-negative finite value.", `timeReadings[${index}].penetrationMm`));
    if (reading.timeMinutes <= previousTime) issues.push(error("READINGS_NOT_INCREASING", "Vicat readings must be strictly increasing in time.", `timeReadings[${index}].timeMinutes`));
    previousTime = reading.timeMinutes;
  });
  if (issues.length) return undefined;

  const initialReading = input.timeReadings.find(reading => reading.penetrationMm <= initialSetThresholdMm);
  const finalReading = input.timeReadings.find(reading => reading.penetrationMm <= finalSetThresholdMm);
  if (!initialReading) issues.push(error("INITIAL_SET_NOT_OBSERVED", "No reading reaches the configured initial-set penetration threshold."));
  if (!finalReading) issues.push(error("FINAL_SET_NOT_OBSERVED", "No reading reaches the configured final-set penetration threshold."));
  if (initialReading && finalReading && finalReading.timeMinutes < initialReading.timeMinutes) issues.push(error("FINAL_BEFORE_INITIAL", "Final setting cannot occur before initial setting."));
  if (issues.some(issue => issue.severity === "error")) return undefined;

  if (initialReading.timeMinutes < 45) issues.push(warning("INITIAL_SET_BELOW_STANDARD_SCREEN", "Initial setting is below the common 45-minute screening limit."));
  if (finalReading.timeMinutes > 600) issues.push(warning("FINAL_SET_ABOVE_STANDARD_SCREEN", "Final setting exceeds the common 600-minute screening limit."));
  const trace: CalculationTraceStep[] = [
    { stepNumber: 1, label: "Initial setting", formula: "first reading with penetration ≤ initial threshold", substitution: `${initialReading.penetrationMm} mm ≤ ${initialSetThresholdMm} mm`, result: initialReading.timeMinutes, unit: "min", inputs: { timeMinutes: initialReading.timeMinutes, penetrationMm: initialReading.penetrationMm, thresholdMm: initialSetThresholdMm } },
    { stepNumber: 2, label: "Final setting", formula: "first reading with penetration ≤ final threshold", substitution: `${finalReading.penetrationMm} mm ≤ ${finalSetThresholdMm} mm`, result: finalReading.timeMinutes, unit: "min", inputs: { timeMinutes: finalReading.timeMinutes, penetrationMm: finalReading.penetrationMm, thresholdMm: finalSetThresholdMm } }
  ];
  return { initialSettingMinutes: initialReading.timeMinutes, finalSettingMinutes: finalReading.timeMinutes, initialSetThresholdMm, finalSetThresholdMm, readings: input.timeReadings, trace, validation: { valid: true, issues } };
}

export function validateCementSettingTime(input: Partial<CementSettingTimeInput>): ValidationReport {
  const result = calculateCementSettingTime(input as CementSettingTimeInput);
  if (!result) return { valid: false, issues: [{ level: "data", severity: "error", code: "SETTING_TIME_INPUT_INVALID", message: "Cement setting-time inputs are incomplete or physically invalid." }] };
  return result.validation;
}
