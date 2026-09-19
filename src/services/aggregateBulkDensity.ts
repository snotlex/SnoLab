import type { CalculationTraceStep, ValidationIssue, ValidationReport } from "../types/laboratoryDomain";

export interface BulkDensityInput extends Record<string, unknown> {
  containerVolumeLiters: number;
  containerEmptyWeightKg: number;
  looseFilledWeightKg: number;
  compactedWeightKg: number;
}

export interface BulkDensityOutput {
  looseDensityKgM3: number;
  compactedDensityKgM3: number;
  looseDensityTPerM3: number;
  compactionIndex: number;
  looseAggregateMassKg: number;
  compactedAggregateMassKg: number;
  trace: CalculationTraceStep[];
  validation: ValidationReport;
}

function issue(code: string, message: string, field?: string, severity: ValidationIssue["severity"] = "error"): ValidationIssue {
  return { level: severity === "warning" ? "engineering" : "data", severity, code, message, field };
}

export function calculateAggregateBulkDensity(input: BulkDensityInput): BulkDensityOutput | undefined {
  const values = [
    ["containerVolumeLiters", input.containerVolumeLiters],
    ["containerEmptyWeightKg", input.containerEmptyWeightKg],
    ["looseFilledWeightKg", input.looseFilledWeightKg],
    ["compactedWeightKg", input.compactedWeightKg]
  ] as const;
  const issues: ValidationIssue[] = [];
  for (const [field, value] of values) {
    if (!Number.isFinite(value)) issues.push(issue("INVALID_NUMERIC_INPUT", `${field} must be a finite number.`, field));
  }
  if (issues.length) return undefined;
  const volume = input.containerVolumeLiters;
  const empty = input.containerEmptyWeightKg;
  const looseMass = input.looseFilledWeightKg - empty;
  const compactedMass = input.compactedWeightKg - empty;
  if (volume <= 0) issues.push(issue("INVALID_CONTAINER_VOLUME", "Container volume must be greater than zero.", "containerVolumeLiters"));
  if (looseMass <= 0) issues.push(issue("INVALID_LOOSE_NET_MASS", "Loose filled mass must exceed empty container mass.", "looseFilledWeightKg"));
  if (compactedMass <= 0) issues.push(issue("INVALID_COMPACTED_NET_MASS", "Compacted mass must exceed empty container mass.", "compactedWeightKg"));
  if (compactedMass < looseMass) issues.push(issue("COMPACTION_LOWER_THAN_LOOSE", "Compacted net mass should not be lower than loose net mass.", "compactedWeightKg", "warning"));
  if (issues.some(item => item.severity === "error")) return undefined;

  const looseDensityKgM3 = Number(((looseMass / volume) * 1000).toFixed(1));
  const compactedDensityKgM3 = Number(((compactedMass / volume) * 1000).toFixed(1));
  const looseDensityTPerM3 = Number((looseDensityKgM3 / 1000).toFixed(3));
  const compactionIndex = Number((compactedDensityKgM3 / looseDensityKgM3).toFixed(4));
  if (looseDensityKgM3 <= 0 || compactedDensityKgM3 <= 0 || !Number.isFinite(compactionIndex)) {
    issues.push(issue("NON_FINITE_DENSITY_RESULT", "Density calculation produced an invalid result."));
  }
  const trace: CalculationTraceStep[] = [
    { stepNumber: 1, label: "Loose net mass", formula: "loose filled mass − empty container mass", substitution: `${input.looseFilledWeightKg} − ${empty}`, result: looseMass, unit: "kg", inputs: { looseFilledWeightKg: input.looseFilledWeightKg, containerEmptyWeightKg: empty } },
    { stepNumber: 2, label: "Compacted net mass", formula: "compacted mass − empty container mass", substitution: `${input.compactedWeightKg} − ${empty}`, result: compactedMass, unit: "kg", inputs: { compactedWeightKg: input.compactedWeightKg, containerEmptyWeightKg: empty } },
    { stepNumber: 3, label: "Loose bulk density", formula: "net mass / volume × 1000", substitution: `${looseMass} / ${volume} × 1000`, result: looseDensityKgM3, unit: "kg/m³", inputs: { netMassKg: looseMass, volumeLiters: volume } },
    { stepNumber: 4, label: "Compacted bulk density", formula: "net mass / volume × 1000", substitution: `${compactedMass} / ${volume} × 1000`, result: compactedDensityKgM3, unit: "kg/m³", inputs: { netMassKg: compactedMass, volumeLiters: volume } },
    { stepNumber: 5, label: "Compaction index", formula: "compacted density / loose density", substitution: `${compactedDensityKgM3} / ${looseDensityKgM3}`, result: compactionIndex, unit: "-", inputs: { compactedDensityKgM3, looseDensityKgM3 } }
  ];
  return {
    looseDensityKgM3,
    compactedDensityKgM3,
    looseDensityTPerM3,
    compactionIndex,
    looseAggregateMassKg: Number(looseMass.toFixed(4)),
    compactedAggregateMassKg: Number(compactedMass.toFixed(4)),
    trace,
    validation: { valid: !issues.some(item => item.severity === "error"), issues }
  };
}

export function validateAggregateBulkDensity(input: Partial<BulkDensityInput>): ValidationReport {
  const result = calculateAggregateBulkDensity(input as BulkDensityInput);
  if (!result) return { valid: false, issues: [{ level: "data", severity: "error", code: "BULK_DENSITY_INPUT_INVALID", message: "Bulk-density inputs are incomplete or physically invalid." }] };
  return result.validation;
}
