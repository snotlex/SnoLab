import type { CalculationTraceStep, LaboratoryTestDefinition, ValidationIssue, ValidationReport } from "../types/laboratoryDomain";

export type VerificationStatus = "VERIFIED" | "NEEDS_REVIEW" | "INCORRECT" | "INCOMPLETE";
export interface IndependentCalculation { result: number | string; unit?: string; }
export interface VerificationOptions<TData extends Record<string, unknown>> {
  independentCalculate?: (data: TData) => IndependentCalculation | undefined;
  tolerance?: number;
}
export interface LaboratoryVerificationResult {
  status: VerificationStatus;
  primaryResult: number | string;
  independentResult?: number | string;
  absoluteDifference?: number;
  relativeDifferencePercent?: number;
  unit: string;
  issues: ValidationIssue[];
  traceComplete: boolean;
}

const issue = (code: string, message: string, severity: ValidationIssue["severity"] = "error"): ValidationIssue => ({ level: "mathematical", severity, code, message });

export const UNIT_CONVERSIONS: Readonly<Record<string, number>> = {
  "g↔kg": 0.001,
  "kg↔g": 1000,
  "mm↔cm": 0.1,
  "cm↔mm": 10,
  "mm↔m": 0.001,
  "m↔mm": 1000,
  "L↔m³": 0.001,
  "m³↔L": 1000,
  "cm³↔L": 0.001,
  "L↔cm³": 1000,
  "Pa↔kPa": 0.001,
  "kPa↔Pa": 1000,
  "kPa↔MPa": 0.001,
  "MPa↔kPa": 1000,
  "g/cm³↔kg/m³": 1000,
  "kg/m³↔g/cm³": 0.001
};

export function convertUnit(value: number, conversion: keyof typeof UNIT_CONVERSIONS): number {
  if (!Number.isFinite(value)) throw new Error("Unit conversion requires a finite number.");
  return value * UNIT_CONVERSIONS[conversion];
}

export function compareIndependentResults(primary: number | string, independent: number | string, tolerance = 1e-9): Pick<LaboratoryVerificationResult, "absoluteDifference" | "relativeDifferencePercent" | "status" | "issues"> {
  if (typeof primary !== "number" || typeof independent !== "number") {
    const status = primary === independent ? "VERIFIED" : "INCORRECT";
    return { status, issues: status === "VERIFIED" ? [] : [issue("INDEPENDENT_RESULT_MISMATCH", "Primary and independent results differ.")] };
  }
  if (!Number.isFinite(primary) || !Number.isFinite(independent)) return { status: "INCORRECT", issues: [issue("NON_FINITE_VERIFICATION_RESULT", "Verification produced a non-finite result.")] };
  const absoluteDifference = Math.abs(primary - independent);
  const relativeDifferencePercent = Math.abs(independent) > tolerance ? (absoluteDifference / Math.abs(independent)) * 100 : absoluteDifference * 100;
  const status = absoluteDifference <= tolerance ? "VERIFIED" : "INCORRECT";
  return { status, absoluteDifference, relativeDifferencePercent, issues: status === "VERIFIED" ? [] : [issue("INDEPENDENT_RESULT_MISMATCH", `Independent result differs by ${absoluteDifference}.`)] };
}

export function inspectCalculationTrace(trace: CalculationTraceStep[] | undefined, resultUnit: string | undefined): { complete: boolean; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  if (!trace?.length) issues.push(issue("CALCULATION_TRACE_MISSING", "Calculation trace is required for an auditable laboratory result."));
  for (const step of trace || []) {
    if (!step.formula || !step.substitution || step.result === undefined) issues.push(issue("CALCULATION_TRACE_INCOMPLETE", `Trace step ${step.stepNumber} is missing formula, substitution or result.`));
    if (resultUnit && step.unit && step.unit !== resultUnit) issues.push(issue("TRACE_UNIT_MISMATCH", `Trace step ${step.stepNumber} uses ${step.unit}; final result uses ${resultUnit}.`, "warning"));
  }
  return { complete: issues.every(item => item.severity !== "error"), issues };
}

export function validateDefinitionContract<TData extends Record<string, unknown>>(definition: LaboratoryTestDefinition<TData>, data: TData): ValidationReport {
  const issues: ValidationIssue[] = [];
  if (!definition.id || !definition.names.en) issues.push(issue("DEFINITION_ID_OR_NAME_MISSING", "A test definition must have an id and English name."));
  if (!definition.standard?.code) issues.push(issue("STANDARD_CODE_MISSING", "The standard code must be stored with the test definition."));
  for (const input of definition.inputs) {
    const value = data[input.key];
    if (input.required && (value === undefined || value === null || value === "")) issues.push({ level: "data", severity: "error", code: "REQUIRED_INPUT_MISSING", field: input.key, message: `${input.key} is required.` });
    if (input.numeric && value !== undefined && value !== null && (!Number.isFinite(Number(value)))) issues.push({ level: "data", severity: "error", code: "NUMERIC_INPUT_INVALID", field: input.key, message: `${input.key} must be finite.` });
    if (input.min !== undefined && value !== undefined && Number(value) < input.min) issues.push({ level: "engineering", severity: "error", code: "INPUT_BELOW_MINIMUM", field: input.key, message: `${input.key} is below its declared minimum.` });
    if (input.max !== undefined && value !== undefined && Number(value) > input.max) issues.push({ level: "engineering", severity: "error", code: "INPUT_ABOVE_MAXIMUM", field: input.key, message: `${input.key} exceeds its declared maximum.` });
  }
  return { valid: !issues.some(item => item.severity === "error"), issues };
}

export function verifyLaboratoryCalculation<TData extends Record<string, unknown>>(
  definition: LaboratoryTestDefinition<TData>,
  data: TData,
  primary: IndependentCalculation,
  trace: CalculationTraceStep[],
  options: VerificationOptions<TData> = {}
): LaboratoryVerificationResult {
  const contract = validateDefinitionContract(definition, data);
  const traceInspection = inspectCalculationTrace(trace, primary.unit || definition.resultUnit);
  const issues = [...contract.issues, ...traceInspection.issues];
  const unit = primary.unit || definition.resultUnit || "unspecified";
  if (!options.independentCalculate) {
    return { status: issues.some(item => item.severity === "error") ? "INCOMPLETE" : "NEEDS_REVIEW", primaryResult: primary.result, unit, issues: [...issues, issue("INDEPENDENT_VERIFIER_MISSING", "No independent calculation has been registered for this test.", "warning")], traceComplete: traceInspection.complete };
  }
  const independent = options.independentCalculate(data);
  if (!independent) return { status: "INCOMPLETE", primaryResult: primary.result, unit, issues: [...issues, issue("INDEPENDENT_CALCULATION_INCOMPLETE", "Independent calculation could not be completed.")], traceComplete: traceInspection.complete };
  if (independent.unit && independent.unit !== unit) issues.push(issue("RESULT_UNIT_MISMATCH", `Primary result uses ${unit}; independent result uses ${independent.unit}.`));
  const comparison = compareIndependentResults(primary.result, independent.result, options.tolerance);
  const status: VerificationStatus = issues.some(item => item.severity === "error") ? "INCOMPLETE" : comparison.status;
  return { status, primaryResult: primary.result, independentResult: independent.result, absoluteDifference: comparison.absoluteDifference, relativeDifferencePercent: comparison.relativeDifferencePercent, unit, issues: [...issues, ...comparison.issues], traceComplete: traceInspection.complete };
}
