import type { CalculationTraceStep, ValidationIssue } from "../types/laboratoryDomain";

export type HardenedConcreteCompressiveInput = Record<string, unknown> & {
  failureLoadKN: number;
  loadedAreaMm2: number;
  ageDays: number;
  specimenId: string;
  batchId: string;
  targetStrengthMpa?: number;
};

export type HardenedConcreteSplitTensileInput = Record<string, unknown> & {
  failureLoadKN: number;
  cylinderDiameterMm: number;
  cylinderLengthMm: number;
  ageDays: number;
  specimenId: string;
  batchId: string;
  targetStrengthMpa?: number;
};

export interface HardenedConcreteStrengthResult {
  strengthMpa: number;
  trace: CalculationTraceStep[];
}

const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const issue = (code: string, message: string, field?: string): ValidationIssue => ({ level: "data", severity: "error", code, message, field });

function validateCommon(input: { ageDays: number; specimenId: string; batchId: string }): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!input.batchId?.trim()) issues.push(issue("HARDENED_BATCH_ID_REQUIRED", "Batch identity is required.", "batchId"));
  if (!input.specimenId?.trim()) issues.push(issue("HARDENED_SPECIMEN_ID_REQUIRED", "Specimen identity is required.", "specimenId"));
  if (!finite(input.ageDays) || input.ageDays <= 0 || input.ageDays > 3650) issues.push(issue("HARDENED_AGE_INVALID", "Specimen age must be finite and between 1 and 3650 days.", "ageDays"));
  return issues;
}

export function validateHardenedConcreteCompressiveInput(input: HardenedConcreteCompressiveInput): ValidationIssue[] {
  const issues = validateCommon(input);
  if (!finite(input.failureLoadKN) || input.failureLoadKN <= 0) issues.push(issue("COMPRESSIVE_LOAD_INVALID", "Failure load must be finite and greater than zero.", "failureLoadKN"));
  if (!finite(input.loadedAreaMm2) || input.loadedAreaMm2 <= 0) issues.push(issue("COMPRESSIVE_AREA_INVALID", "Loaded area must be finite and greater than zero.", "loadedAreaMm2"));
  if (input.targetStrengthMpa !== undefined && (!finite(input.targetStrengthMpa) || input.targetStrengthMpa <= 0)) issues.push(issue("COMPRESSIVE_TARGET_INVALID", "Target strength must be finite and greater than zero.", "targetStrengthMpa"));
  return issues;
}

export function calculateHardenedConcreteCompressive(input: HardenedConcreteCompressiveInput): HardenedConcreteStrengthResult {
  const validation = validateHardenedConcreteCompressiveInput(input);
  if (validation.length) throw new Error(validation.map(item => item.code).join(","));
  const strengthMpa = (input.failureLoadKN * 1000) / input.loadedAreaMm2;
  return { strengthMpa, trace: [{ stepNumber: 1, label: "Compressive strength", formula: "fc = failure load / loaded area", substitution: `${input.failureLoadKN} × 1000 / ${input.loadedAreaMm2}`, result: strengthMpa, unit: "MPa", inputs: { ageDays: input.ageDays, specimenId: input.specimenId, batchId: input.batchId } }] };
}

export function validateHardenedConcreteSplitTensileInput(input: HardenedConcreteSplitTensileInput): ValidationIssue[] {
  const issues = validateCommon(input);
  if (!finite(input.failureLoadKN) || input.failureLoadKN <= 0) issues.push(issue("SPLIT_TENSILE_LOAD_INVALID", "Failure load must be finite and greater than zero.", "failureLoadKN"));
  if (!finite(input.cylinderDiameterMm) || input.cylinderDiameterMm <= 0) issues.push(issue("SPLIT_TENSILE_DIAMETER_INVALID", "Cylinder diameter must be finite and greater than zero.", "cylinderDiameterMm"));
  if (!finite(input.cylinderLengthMm) || input.cylinderLengthMm <= 0) issues.push(issue("SPLIT_TENSILE_LENGTH_INVALID", "Cylinder length must be finite and greater than zero.", "cylinderLengthMm"));
  if (input.targetStrengthMpa !== undefined && (!finite(input.targetStrengthMpa) || input.targetStrengthMpa <= 0)) issues.push(issue("SPLIT_TENSILE_TARGET_INVALID", "Target strength must be finite and greater than zero.", "targetStrengthMpa"));
  return issues;
}

export function calculateHardenedConcreteSplitTensile(input: HardenedConcreteSplitTensileInput): HardenedConcreteStrengthResult {
  const validation = validateHardenedConcreteSplitTensileInput(input);
  if (validation.length) throw new Error(validation.map(item => item.code).join(","));
  const strengthMpa = (2 * input.failureLoadKN * 1000) / (Math.PI * input.cylinderLengthMm * input.cylinderDiameterMm);
  return { strengthMpa, trace: [{ stepNumber: 1, label: "Splitting tensile strength", formula: "fct = 2P / (π × L × d)", substitution: `2 × ${input.failureLoadKN} × 1000 / (π × ${input.cylinderLengthMm} × ${input.cylinderDiameterMm})`, result: strengthMpa, unit: "MPa", inputs: { ageDays: input.ageDays, specimenId: input.specimenId, batchId: input.batchId } }] };
}
