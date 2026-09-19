import type { CalculationTraceStep, ValidationIssue, ValidationReport } from "../types/laboratoryDomain";

export interface SandBulkingStep {
  moisturePercent: number;
  volumeCm3: number;
}

export interface SandBulkingInput extends Record<string, unknown> {
  dryVolumeCm3: number;
  moistureSteps: SandBulkingStep[];
}

export interface SandBulkingOutput {
  maxExpansionPercent: number;
  peakMoisturePercent: number;
  sandBulkingCoefficient: number;
  curve: Array<SandBulkingStep & { expansionPercent: number }>;
  trace: CalculationTraceStep[];
  validation: ValidationReport;
}

function error(code: string, message: string, field?: string): ValidationIssue {
  return { level: "data", severity: "error", code, message, field };
}

function warning(code: string, message: string, field?: string): ValidationIssue {
  return { level: "engineering", severity: "warning", code, message, field };
}

export function calculateSandBulking(input: SandBulkingInput): SandBulkingOutput | undefined {
  const issues: ValidationIssue[] = [];
  if (!Number.isFinite(input.dryVolumeCm3) || input.dryVolumeCm3 <= 0) issues.push(error("INVALID_DRY_VOLUME", "Dry reference volume must be greater than zero.", "dryVolumeCm3"));
  if (!Array.isArray(input.moistureSteps) || input.moistureSteps.length < 2) issues.push(error("INSUFFICIENT_BULKING_STEPS", "At least two moisture-volume points are required.", "moistureSteps"));
  if (issues.length) return undefined;

  let previousMoisture = -Infinity;
  input.moistureSteps.forEach((step, index) => {
    if (!Number.isFinite(step.moisturePercent) || step.moisturePercent < 0) issues.push(error("INVALID_MOISTURE_STEP", "Moisture must be a finite non-negative value.", `moistureSteps[${index}].moisturePercent`));
    if (!Number.isFinite(step.volumeCm3) || step.volumeCm3 <= 0) issues.push(error("INVALID_VOLUME_STEP", "Measured volume must be greater than zero.", `moistureSteps[${index}].volumeCm3`));
    if (step.moisturePercent <= previousMoisture) issues.push(error("MOISTURE_STEPS_NOT_INCREASING", "Moisture steps must be strictly increasing and must not contain duplicates.", `moistureSteps[${index}].moisturePercent`));
    previousMoisture = step.moisturePercent;
  });
  if (issues.length) return undefined;

  const curve = input.moistureSteps.map(step => ({
    ...step,
    expansionPercent: Number((((step.volumeCm3 - input.dryVolumeCm3) / input.dryVolumeCm3) * 100).toFixed(2))
  }));
  const peak = curve.reduce((best, current) => current.expansionPercent > best.expansionPercent ? current : best, curve[0]);
  const maxExpansionPercent = peak.expansionPercent;
  if (maxExpansionPercent < 0) issues.push(warning("NEGATIVE_EXPANSION", "All measured volumes are below the dry reference volume; verify the reference and readings."));
  if (maxExpansionPercent < 15 || maxExpansionPercent > 35) issues.push(warning("BULKING_OUTSIDE_TYPICAL_RANGE", "Peak sand bulking is outside the typical 15–35% screening range; review sample and measurement records."));
  const trace: CalculationTraceStep[] = curve.map((point, index) => ({
    stepNumber: index + 1,
    label: `Expansion at ${point.moisturePercent}% moisture`,
    formula: "(measured volume − dry volume) / dry volume × 100",
    substitution: `(${point.volumeCm3} − ${input.dryVolumeCm3}) / ${input.dryVolumeCm3} × 100`,
    result: point.expansionPercent,
    unit: "%",
    inputs: { moisturePercent: point.moisturePercent, measuredVolumeCm3: point.volumeCm3, dryVolumeCm3: input.dryVolumeCm3 }
  }));
  return {
    maxExpansionPercent,
    peakMoisturePercent: peak.moisturePercent,
    sandBulkingCoefficient: Number((1 + maxExpansionPercent / 100).toFixed(4)),
    curve,
    trace,
    validation: { valid: !issues.some(item => item.severity === "error"), issues }
  };
}

export function validateSandBulking(input: Partial<SandBulkingInput>): ValidationReport {
  const result = calculateSandBulking(input as SandBulkingInput);
  if (!result) return { valid: false, issues: [{ level: "data", severity: "error", code: "SAND_BULKING_INPUT_INVALID", message: "Sand-bulking inputs are incomplete or physically invalid." }] };
  return result.validation;
}
