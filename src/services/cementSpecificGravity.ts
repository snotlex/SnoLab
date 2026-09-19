import type { CalculationTraceStep, ValidationIssue, ValidationReport } from "../types/laboratoryDomain";

export interface CementSpecificGravityInput extends Record<string, unknown> {
  cementMassG: number;
  initialVolumeMl: number;
  finalVolumeMl: number;
}

export interface CementSpecificGravityOutput {
  densityGPerCm3: number;
  densityKgPerM3: number;
  specificGravity: number;
  displacedVolumeMl: number;
  trace: CalculationTraceStep[];
  validation: ValidationReport;
}

function error(code: string, message: string, field?: string): ValidationIssue {
  return { level: "data", severity: "error", code, message, field };
}
function warning(code: string, message: string): ValidationIssue {
  return { level: "engineering", severity: "warning", code, message };
}

export function calculateCementSpecificGravity(input: CementSpecificGravityInput): CementSpecificGravityOutput | undefined {
  const issues: ValidationIssue[] = [];
  if (!Number.isFinite(input.cementMassG) || input.cementMassG <= 0) issues.push(error("INVALID_CEMENT_MASS", "Cement mass must be greater than zero.", "cementMassG"));
  if (!Number.isFinite(input.initialVolumeMl) || input.initialVolumeMl < 0) issues.push(error("INVALID_INITIAL_VOLUME", "Initial flask volume must be zero or greater.", "initialVolumeMl"));
  if (!Number.isFinite(input.finalVolumeMl) || input.finalVolumeMl < 0) issues.push(error("INVALID_FINAL_VOLUME", "Final flask volume must be zero or greater.", "finalVolumeMl"));
  if (issues.length) return undefined;
  if (input.finalVolumeMl <= input.initialVolumeMl) issues.push(error("NON_POSITIVE_DISPLACEMENT", "Final volume must exceed initial volume to produce a positive displaced volume."));
  if (issues.length) return undefined;

  const displacedVolumeMl = Number((input.finalVolumeMl - input.initialVolumeMl).toFixed(4));
  const densityGPerCm3 = Number((input.cementMassG / displacedVolumeMl).toFixed(4));
  const densityKgPerM3 = Math.round(densityGPerCm3 * 1000);
  const specificGravity = Number(densityGPerCm3.toFixed(3));
  if (densityGPerCm3 < 2.8 || densityGPerCm3 > 3.4) issues.push(warning("DENSITY_OUTSIDE_TYPICAL_RANGE", "Measured cement density is outside the typical 2.8–3.4 g/cm³ screening range; review the fluid, temperature and readings."));
  const trace: CalculationTraceStep[] = [
    { stepNumber: 1, label: "Displaced volume", formula: "final volume − initial volume", substitution: `${input.finalVolumeMl} − ${input.initialVolumeMl}`, result: displacedVolumeMl, unit: "ml", inputs: { initialVolumeMl: input.initialVolumeMl, finalVolumeMl: input.finalVolumeMl } },
    { stepNumber: 2, label: "Cement density", formula: "cement mass / displaced volume", substitution: `${input.cementMassG} / ${displacedVolumeMl}`, result: densityGPerCm3, unit: "g/cm³", inputs: { cementMassG: input.cementMassG, displacedVolumeMl } },
    { stepNumber: 3, label: "Specific gravity", formula: "density relative to water at reference condition", substitution: `${densityGPerCm3} / 1.000`, result: specificGravity, unit: "-", inputs: { densityGPerCm3 } }
  ];
  return { densityGPerCm3, densityKgPerM3, specificGravity, displacedVolumeMl, trace, validation: { valid: true, issues } };
}

export function validateCementSpecificGravity(input: Partial<CementSpecificGravityInput>): ValidationReport {
  const result = calculateCementSpecificGravity(input as CementSpecificGravityInput);
  if (!result) return { valid: false, issues: [{ level: "data", severity: "error", code: "CEMENT_DENSITY_INPUT_INVALID", message: "Cement density inputs are incomplete or physically invalid." }] };
  return result.validation;
}
