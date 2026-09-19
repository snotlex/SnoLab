import type { CalculationTraceStep, ValidationIssue, ValidationReport } from "../types/laboratoryDomain";

export interface BlaineInput extends Record<string, unknown> {
  airFlowTimeSeconds: number;
  apparatusConstantK: number;
  bedPorosityE: number;
  cementDensityGPerCm3: number;
  airViscosityMicroPaS: number;
  airTemperatureC?: number;
}

export interface BlaineOutput {
  blaineFinenessCm2PerG: number;
  blaineFinenessM2PerKg: number;
  trace: CalculationTraceStep[];
  validation: ValidationReport;
}

function error(code: string, message: string, field?: string): ValidationIssue {
  return { level: "data", severity: "error", code, message, field };
}
function warning(code: string, message: string, field?: string): ValidationIssue {
  return { level: "engineering", severity: "warning", code, message, field };
}

export function calculateBlaineFineness(input: BlaineInput): BlaineOutput | undefined {
  const issues: ValidationIssue[] = [];
  if (!Number.isFinite(input.airFlowTimeSeconds) || input.airFlowTimeSeconds <= 0) issues.push(error("INVALID_AIR_FLOW_TIME", "Air-flow time must be greater than zero.", "airFlowTimeSeconds"));
  if (!Number.isFinite(input.apparatusConstantK) || input.apparatusConstantK <= 0) issues.push(error("INVALID_APPARATUS_CONSTANT", "Apparatus constant K must be greater than zero and calibrated.", "apparatusConstantK"));
  if (!Number.isFinite(input.bedPorosityE) || input.bedPorosityE <= 0 || input.bedPorosityE >= 1) issues.push(error("INVALID_BED_POROSITY", "Bed porosity must be strictly between zero and one.", "bedPorosityE"));
  if (!Number.isFinite(input.cementDensityGPerCm3) || input.cementDensityGPerCm3 <= 0) issues.push(error("INVALID_CEMENT_DENSITY", "Cement density must be greater than zero.", "cementDensityGPerCm3"));
  if (!Number.isFinite(input.airViscosityMicroPaS) || input.airViscosityMicroPaS <= 0) issues.push(error("INVALID_AIR_VISCOSITY", "Air viscosity must be greater than zero.", "airViscosityMicroPaS"));
  if (input.airTemperatureC !== undefined && (!Number.isFinite(input.airTemperatureC) || input.airTemperatureC < 0 || input.airTemperatureC > 60)) issues.push(error("INVALID_AIR_TEMPERATURE", "Air temperature must be between 0 and 60 °C when recorded.", "airTemperatureC"));
  if (issues.length) return undefined;
  if (input.airTemperatureC !== undefined && (input.airTemperatureC < 18 || input.airTemperatureC > 27)) issues.push(warning("TEMPERATURE_OUTSIDE_REFERENCE", "Air temperature is outside the 18–27 °C reference band; confirm the viscosity value and temperature correction." , "airTemperatureC"));

  const porosityTerm = Math.sqrt(input.bedPorosityE ** 3) / (input.cementDensityGPerCm3 * (1 - input.bedPorosityE));
  const timeTerm = Math.sqrt(input.airFlowTimeSeconds) / Math.sqrt(0.1 * input.airViscosityMicroPaS);
  const blaineFinenessCm2PerG = Number((input.apparatusConstantK * porosityTerm * timeTerm).toFixed(2));
  const blaineFinenessM2PerKg = Number((blaineFinenessCm2PerG / 10).toFixed(2));
  if (blaineFinenessCm2PerG < 2800) issues.push(warning("BLAINE_BELOW_TYPICAL", "Blaine fineness is below the configured 2800 cm²/g screening level."));
  const trace: CalculationTraceStep[] = [
    { stepNumber: 1, label: "Porosity-density term", formula: "sqrt(e³) / (rho × (1 − e))", substitution: `sqrt(${input.bedPorosityE}³) / (${input.cementDensityGPerCm3} × (1 − ${input.bedPorosityE}))`, result: Number(porosityTerm.toFixed(6)), unit: "", inputs: { bedPorosityE: input.bedPorosityE, cementDensityGPerCm3: input.cementDensityGPerCm3 } },
    { stepNumber: 2, label: "Flow-time viscosity term", formula: "sqrt(t) / sqrt(0.1 × eta)", substitution: `sqrt(${input.airFlowTimeSeconds}) / sqrt(0.1 × ${input.airViscosityMicroPaS})`, result: Number(timeTerm.toFixed(6)), unit: "", inputs: { airFlowTimeSeconds: input.airFlowTimeSeconds, airViscosityMicroPaS: input.airViscosityMicroPaS } },
    { stepNumber: 3, label: "Blaine fineness", formula: "K × porosity-density term × flow-time viscosity term", substitution: `${input.apparatusConstantK} × ${porosityTerm.toFixed(6)} × ${timeTerm.toFixed(6)}`, result: blaineFinenessCm2PerG, unit: "cm²/g", inputs: { apparatusConstantK: input.apparatusConstantK } }
  ];
  return { blaineFinenessCm2PerG, blaineFinenessM2PerKg, trace, validation: { valid: true, issues } };
}

export function validateBlaine(input: Partial<BlaineInput>): ValidationReport {
  const result = calculateBlaineFineness(input as BlaineInput);
  if (!result) return { valid: false, issues: [{ level: "data", severity: "error", code: "BLAINE_INPUT_INVALID", message: "Blaine inputs are incomplete or physically invalid." }] };
  return result.validation;
}
