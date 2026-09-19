import type { CalculationTraceStep, ValidationIssue, ValidationReport } from "../types/laboratoryDomain";

export interface MethyleneBlueInput extends Record<string, unknown> {
  fraction0_2MassG: number;
  dyeSolutionInjectedMl: number;
  dyeConcentrationGPerL: number;
  endpointConfirmed?: boolean;
}

export interface MethyleneBlueOutput {
  methyleneBlueValueGPerKg: number;
  dyeMassG: number;
  endpointConfirmed?: boolean;
  classification: "Clean" | "Acceptable" | "Fail";
  trace: CalculationTraceStep[];
  validation: ValidationReport;
}

function error(code: string, message: string, field?: string): ValidationIssue {
  return { level: "data", severity: "error", code, message, field };
}

export function calculateMethyleneBlue(input: MethyleneBlueInput): MethyleneBlueOutput | undefined {
  const issues: ValidationIssue[] = [];
  if (!Number.isFinite(input.fraction0_2MassG) || input.fraction0_2MassG <= 0) issues.push(error("INVALID_FINE_FRACTION_MASS", "The 0/2 mm fraction mass must be greater than zero.", "fraction0_2MassG"));
  if (!Number.isFinite(input.dyeSolutionInjectedMl) || input.dyeSolutionInjectedMl < 0) issues.push(error("INVALID_DYE_VOLUME", "Injected dye volume must be zero or greater.", "dyeSolutionInjectedMl"));
  if (!Number.isFinite(input.dyeConcentrationGPerL) || input.dyeConcentrationGPerL <= 0) issues.push(error("INVALID_DYE_CONCENTRATION", "Dye concentration must be greater than zero.", "dyeConcentrationGPerL"));
  if (input.endpointConfirmed === false) issues.push(error("ENDPOINT_NOT_CONFIRMED", "The titration endpoint must be confirmed before accepting the MB result.", "endpointConfirmed"));
  if (issues.length) return undefined;

  const dyeMassG = Number(((input.dyeSolutionInjectedMl / 1000) * input.dyeConcentrationGPerL).toFixed(5));
  const methyleneBlueValueGPerKg = Number(((dyeMassG / (input.fraction0_2MassG / 1000))).toFixed(3));
  const classification = methyleneBlueValueGPerKg <= 1 ? "Clean" : methyleneBlueValueGPerKg <= 1.5 ? "Acceptable" : "Fail";
  const trace: CalculationTraceStep[] = [
    { stepNumber: 1, label: "Dye mass", formula: "dye volume / 1000 × concentration", substitution: `${input.dyeSolutionInjectedMl} / 1000 × ${input.dyeConcentrationGPerL}`, result: dyeMassG, unit: "g", inputs: { dyeSolutionInjectedMl: input.dyeSolutionInjectedMl, dyeConcentrationGPerL: input.dyeConcentrationGPerL } },
    { stepNumber: 2, label: "Methylene Blue value", formula: "dye mass / fine fraction mass × 1000", substitution: `${dyeMassG} / ${input.fraction0_2MassG / 1000} × 1`, result: methyleneBlueValueGPerKg, unit: "g/kg", inputs: { dyeMassG, fineFractionMassKg: input.fraction0_2MassG / 1000 } },
    { stepNumber: 3, label: "Endpoint condition", formula: "endpoint confirmation recorded", substitution: input.endpointConfirmed === undefined ? "not supplied" : String(input.endpointConfirmed), result: input.endpointConfirmed === false ? 0 : 1, unit: "boolean", inputs: { endpointConfirmed: input.endpointConfirmed === undefined ? 0 : input.endpointConfirmed ? 1 : 0 } }
  ];
  return { methyleneBlueValueGPerKg, dyeMassG, endpointConfirmed: input.endpointConfirmed, classification, trace, validation: { valid: true, issues: [] } };
}

export function validateMethyleneBlue(input: Partial<MethyleneBlueInput>): ValidationReport {
  const result = calculateMethyleneBlue(input as MethyleneBlueInput);
  if (!result) return { valid: false, issues: [{ level: "data", severity: "error", code: "METHYLENE_BLUE_INPUT_INVALID", message: "Methylene Blue inputs are incomplete or physically invalid." }] };
  return result.validation;
}
