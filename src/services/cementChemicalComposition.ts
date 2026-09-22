import type { CalculationTraceStep, ValidationIssue, ValidationReport } from "../types/laboratoryDomain";

export interface CementChemicalCompositionInput extends Record<string, unknown> {
  sampleMassG: number;
  sulfateMassG: number;
  chlorideMassG: number;
  insolubleResidueMassG: number;
  lossOnIgnitionMassG: number;
}

export interface CementChemicalCompositionOutput {
  sulfatePercent: number;
  chloridePercent: number;
  insolubleResiduePercent: number;
  lossOnIgnitionPercent: number;
  trace: CalculationTraceStep[];
  validation: ValidationReport;
}

function error(code: string, message: string, field?: string): ValidationIssue {
  return { level: "data", severity: "error", code, message, field };
}

export function calculateCementChemicalComposition(input: CementChemicalCompositionInput): CementChemicalCompositionOutput | undefined {
  const issues: ValidationIssue[] = [];
  if (!Number.isFinite(input.sampleMassG) || input.sampleMassG <= 0) issues.push(error("INVALID_SAMPLE_MASS", "Cement sample mass must be greater than zero.", "sampleMassG"));
  for (const field of ["sulfateMassG", "chlorideMassG", "insolubleResidueMassG", "lossOnIgnitionMassG"] as const) {
    if (!Number.isFinite(input[field]) || input[field] < 0) issues.push(error("INVALID_COMPONENT_MASS", `${field} must be zero or greater.`, field));
    else if (Number.isFinite(input.sampleMassG) && input[field] > input.sampleMassG) issues.push(error("COMPONENT_EXCEEDS_SAMPLE", `${field} cannot exceed the sample mass.`, field));
  }
  if (issues.length) return undefined;
  const percent = (mass: number) => Number(((mass / input.sampleMassG) * 100).toFixed(3));
  const sulfatePercent = percent(input.sulfateMassG);
  const chloridePercent = percent(input.chlorideMassG);
  const insolubleResiduePercent = percent(input.insolubleResidueMassG);
  const lossOnIgnitionPercent = percent(input.lossOnIgnitionMassG);
  const trace: CalculationTraceStep[] = [
    { stepNumber: 1, label: "Sulfate content", formula: "sulfate mass / sample mass × 100", substitution: `${input.sulfateMassG} / ${input.sampleMassG} × 100`, result: sulfatePercent, unit: "%", inputs: { sampleMassG: input.sampleMassG, sulfateMassG: input.sulfateMassG } },
    { stepNumber: 2, label: "Chloride content", formula: "chloride mass / sample mass × 100", substitution: `${input.chlorideMassG} / ${input.sampleMassG} × 100`, result: chloridePercent, unit: "%", inputs: { sampleMassG: input.sampleMassG, chlorideMassG: input.chlorideMassG } },
    { stepNumber: 3, label: "Insoluble residue", formula: "insoluble residue mass / sample mass × 100", substitution: `${input.insolubleResidueMassG} / ${input.sampleMassG} × 100`, result: insolubleResiduePercent, unit: "%", inputs: { sampleMassG: input.sampleMassG, insolubleResidueMassG: input.insolubleResidueMassG } },
    { stepNumber: 4, label: "Loss on ignition", formula: "loss on ignition mass / sample mass × 100", substitution: `${input.lossOnIgnitionMassG} / ${input.sampleMassG} × 100`, result: lossOnIgnitionPercent, unit: "%", inputs: { sampleMassG: input.sampleMassG, lossOnIgnitionMassG: input.lossOnIgnitionMassG } }
  ];
  return { sulfatePercent, chloridePercent, insolubleResiduePercent, lossOnIgnitionPercent, trace, validation: { valid: true, issues: [] } };
}

export function validateCementChemicalComposition(input: Partial<CementChemicalCompositionInput>): ValidationReport {
  const result = calculateCementChemicalComposition(input as CementChemicalCompositionInput);
  if (!result) return { valid: false, issues: [{ level: "data", severity: "error", code: "CEMENT_CHEMICAL_INPUT_INVALID", message: "Cement chemical composition inputs are incomplete or physically invalid." }] };
  return result.validation;
}
