import type { CalculationTraceStep, ValidationIssue, ValidationReport } from "../types/laboratoryDomain";

export interface AggregateMoistureInput extends Record<string, unknown> {
  wetMassG: number;
  dryMassG: number;
  tareMassG: number;
  absorptionPercent?: number;
  designAggregateDryMassKg?: number;
  designWaterKg?: number;
}

export interface AggregateMoistureOutput {
  netWetMassG: number;
  netDryMassG: number;
  waterMassG: number;
  moisturePercent: number;
  waterContributionPerTonKg: number;
  absorptionDemandPerTonKg?: number;
  netFreeWaterContributionPerTonKg?: number;
  correctedWaterToAddKg?: number;
  wetAggregateBatchMassKg?: number;
  trace: CalculationTraceStep[];
  validation: ValidationReport;
}

function issue(code: string, message: string, field?: string, severity: ValidationIssue["severity"] = "error"): ValidationIssue {
  return { level: severity === "warning" ? "engineering" : "data", severity, code, message, field };
}

export function calculateAggregateMoisture(input: AggregateMoistureInput): AggregateMoistureOutput | undefined {
  const issues: ValidationIssue[] = [];
  for (const [field, value] of [["wetMassG", input.wetMassG], ["dryMassG", input.dryMassG], ["tareMassG", input.tareMassG]] as const) {
    if (!Number.isFinite(value)) issues.push(issue("INVALID_NUMERIC_INPUT", `${field} must be a finite number.`, field));
  }
  if (input.absorptionPercent !== undefined && (!Number.isFinite(input.absorptionPercent) || input.absorptionPercent < 0)) {
    issues.push(issue("INVALID_ABSORPTION", "Absorption must be zero or greater when supplied.", "absorptionPercent"));
  }
  if (input.designAggregateDryMassKg !== undefined && (!Number.isFinite(input.designAggregateDryMassKg) || input.designAggregateDryMassKg <= 0)) {
    issues.push(issue("INVALID_DESIGN_AGGREGATE_MASS", "Design aggregate dry mass must be greater than zero.", "designAggregateDryMassKg"));
  }
  if (input.designWaterKg !== undefined && (!Number.isFinite(input.designWaterKg) || input.designWaterKg < 0)) {
    issues.push(issue("INVALID_DESIGN_WATER", "Design water must be zero or greater.", "designWaterKg"));
  }
  if (input.designWaterKg !== undefined && input.designAggregateDryMassKg === undefined) {
    issues.push(issue("DESIGN_MASS_REQUIRED", "Design aggregate dry mass is required when correcting design water.", "designAggregateDryMassKg"));
  }
  if (issues.some(item => item.severity === "error")) return undefined;

  const netWetMassG = input.wetMassG - input.tareMassG;
  const netDryMassG = input.dryMassG - input.tareMassG;
  if (netDryMassG <= 0) issues.push(issue("INVALID_NET_DRY_MASS", "Dry sample mass after tare must be greater than zero.", "dryMassG"));
  if (netWetMassG < netDryMassG) issues.push(issue("WET_BELOW_DRY_MASS", "Wet sample mass cannot be lower than dry sample mass.", "wetMassG"));
  if (issues.some(item => item.severity === "error")) return undefined;

  const waterMassG = netWetMassG - netDryMassG;
  const moisturePercent = Number(((waterMassG / netDryMassG) * 100).toFixed(3));
  const waterContributionPerTonKg = Number((moisturePercent * 10).toFixed(3));
  const absorptionDemandPerTonKg = input.absorptionPercent === undefined ? undefined : Number((input.absorptionPercent * 10).toFixed(3));
  const netFreeWaterContributionPerTonKg = absorptionDemandPerTonKg === undefined
    ? undefined
    : Number((waterContributionPerTonKg - absorptionDemandPerTonKg).toFixed(3));
  const correctedWaterToAddKg = input.designWaterKg === undefined || input.designAggregateDryMassKg === undefined
    ? undefined
    : Number((input.designWaterKg - ((moisturePercent - (input.absorptionPercent || 0)) / 100) * input.designAggregateDryMassKg).toFixed(3));
  const wetAggregateBatchMassKg = input.designAggregateDryMassKg === undefined
    ? undefined
    : Number((input.designAggregateDryMassKg * (1 + moisturePercent / 100)).toFixed(3));

  const trace: CalculationTraceStep[] = [
    { stepNumber: 1, label: "Net dry mass", formula: "dry mass − tare", substitution: `${input.dryMassG} − ${input.tareMassG}`, result: netDryMassG, unit: "g", inputs: { dryMassG: input.dryMassG, tareMassG: input.tareMassG } },
    { stepNumber: 2, label: "Water mass", formula: "net wet mass − net dry mass", substitution: `${netWetMassG} − ${netDryMassG}`, result: waterMassG, unit: "g", inputs: { netWetMassG, netDryMassG } },
    { stepNumber: 3, label: "Moisture content", formula: "water mass / net dry mass × 100", substitution: `${waterMassG} / ${netDryMassG} × 100`, result: moisturePercent, unit: "%", inputs: { waterMassG, netDryMassG } },
    { stepNumber: 4, label: "Water contribution per tonne", formula: "moisture percentage × 10", substitution: `${moisturePercent} × 10`, result: waterContributionPerTonKg, unit: "kg/t", inputs: { moisturePercent } }
  ];
  if (absorptionDemandPerTonKg !== undefined) trace.push({ stepNumber: 5, label: "Net free-water contribution", formula: "moisture contribution − absorption demand", substitution: `${waterContributionPerTonKg} − ${absorptionDemandPerTonKg}`, result: netFreeWaterContributionPerTonKg ?? 0, unit: "kg/t", inputs: { waterContributionPerTonKg, absorptionDemandPerTonKg } });
  if (correctedWaterToAddKg !== undefined) trace.push({ stepNumber: trace.length + 1, label: "Corrected design water", formula: "design water − net free-water contribution × design aggregate mass / 1000", substitution: "design water − aggregate free-water contribution", result: correctedWaterToAddKg, unit: "kg", inputs: { designWaterKg: input.designWaterKg ?? 0, designAggregateDryMassKg: input.designAggregateDryMassKg ?? 0 } });
  return {
    netWetMassG,
    netDryMassG,
    waterMassG,
    moisturePercent,
    waterContributionPerTonKg,
    absorptionDemandPerTonKg,
    netFreeWaterContributionPerTonKg,
    correctedWaterToAddKg,
    wetAggregateBatchMassKg,
    trace,
    validation: { valid: !issues.some(item => item.severity === "error"), issues }
  };
}

export function validateAggregateMoisture(input: Partial<AggregateMoistureInput>): ValidationReport {
  const result = calculateAggregateMoisture(input as AggregateMoistureInput);
  if (!result) return { valid: false, issues: [{ level: "data", severity: "error", code: "MOISTURE_INPUT_INVALID", message: "Moisture inputs are incomplete or physically invalid." }] };
  return result.validation;
}
