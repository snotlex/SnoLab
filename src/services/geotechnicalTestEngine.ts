import type { CalculationTraceStep, ValidationIssue } from "../types/laboratoryDomain";

export interface SoilSievePoint { sieveMm: number; retainedMassG: number; }
export type SoilSieveInput = Record<string, unknown> & { totalSampleMassG: number; rows: SoilSievePoint[]; washLossMassG?: number; };
export interface SoilSieveResult { rows: Array<SoilSievePoint & { percentRetained: number; cumulativePercentRetained: number; percentPassing: number }>; finesPercent?: number; massBalanceErrorG: number; trace: CalculationTraceStep[]; }
export interface ProctorPoint { waterContentPercent: number; wetSampleMassG: number; }
export type ProctorInput = Record<string, unknown> & { points: ProctorPoint[]; moldVolumeCm3: number; };
export interface ProctorResult { points: Array<ProctorPoint & { dryDensityGPerCm3: number }>; maximumDryDensityGPerCm3: number; optimumMoisturePercent: number; trace: CalculationTraceStep[]; }

const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const issue = (code: string, message: string, field?: string): ValidationIssue => ({ level: "data", severity: "error", code, message, field });

export function validateSoilSieveInput(input: SoilSieveInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!finite(input.totalSampleMassG) || input.totalSampleMassG <= 0) issues.push(issue("SOIL_SIEVE_TOTAL_MASS_INVALID", "Total soil sample mass must be positive and finite.", "totalSampleMassG"));
  if (!Array.isArray(input.rows) || input.rows.length < 2) issues.push(issue("SOIL_SIEVE_ROWS_INSUFFICIENT", "At least two sieve rows are required.", "rows"));
  input.rows?.forEach((row, index) => {
    if (!finite(row.sieveMm) || row.sieveMm < 0) issues.push(issue("SOIL_SIEVE_APERTURE_INVALID", "Sieve aperture must be finite and non-negative.", `rows.${index}.sieveMm`));
    if (!finite(row.retainedMassG) || row.retainedMassG < 0) issues.push(issue("SOIL_SIEVE_MASS_INVALID", "Retained mass must be finite and non-negative.", `rows.${index}.retainedMassG`));
  });
  const apertures = input.rows?.map(row => row.sieveMm).filter(finite) || [];
  if (new Set(apertures).size !== apertures.length) issues.push(issue("SOIL_SIEVE_DUPLICATE_APERTURE", "Each sieve aperture must appear only once.", "rows"));
  const retainedTotal = input.rows?.reduce((sum, row) => sum + (finite(row.retainedMassG) ? row.retainedMassG : 0), 0) || 0;
  const accountedMass = retainedTotal + (finite(input.washLossMassG) ? input.washLossMassG : 0);
  if (finite(input.totalSampleMassG) && accountedMass > input.totalSampleMassG + 1e-9) issues.push(issue("SOIL_SIEVE_MASS_BALANCE_EXCEEDS_TOTAL", "Retained mass plus wash loss cannot exceed the total sample mass.", "rows"));
  if (input.washLossMassG !== undefined && (!finite(input.washLossMassG) || input.washLossMassG < 0)) issues.push(issue("SOIL_SIEVE_WASH_LOSS_INVALID", "Wash loss must be finite and non-negative.", "washLossMassG"));
  return issues;
}

export function calculateSoilSieve(input: SoilSieveInput): SoilSieveResult {
  const validation = validateSoilSieveInput(input);
  if (validation.length) throw new Error(validation.map(item => item.code).join(","));
  const rows = [...input.rows].sort((a, b) => b.sieveMm - a.sieveMm);
  let cumulative = 0;
  const measuredRows = rows.map(row => {
    const percentRetained = row.retainedMassG / input.totalSampleMassG * 100;
    cumulative += percentRetained;
    return { ...row, percentRetained, cumulativePercentRetained: cumulative, percentPassing: Math.max(0, 100 - cumulative) };
  });
  const finesRow = measuredRows.find(row => row.sieveMm === 0.063);
  const massBalanceErrorG = rows.reduce((sum, row) => sum + row.retainedMassG, 0) + (input.washLossMassG || 0) - input.totalSampleMassG;
  return { rows: measuredRows, finesPercent: finesRow?.percentPassing, massBalanceErrorG, trace: [{ stepNumber: 1, label: "Mass balance", formula: "Σ retained + wash loss − total", substitution: `${rows.reduce((sum, row) => sum + row.retainedMassG, 0)} + ${input.washLossMassG || 0} − ${input.totalSampleMassG}`, result: massBalanceErrorG, unit: "g", inputs: { totalSampleMassG: input.totalSampleMassG } }] };
}

export function validateProctorInput(input: ProctorInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!finite(input.moldVolumeCm3) || input.moldVolumeCm3 <= 0) issues.push(issue("PROCTOR_MOLD_VOLUME_INVALID", "Mold volume must be positive and finite.", "moldVolumeCm3"));
  if (!Array.isArray(input.points) || input.points.length < 3) issues.push(issue("PROCTOR_POINTS_INSUFFICIENT", "At least three moisture-density points are required.", "points"));
  input.points?.forEach((point, index) => {
    if (!finite(point.waterContentPercent) || point.waterContentPercent < 0) issues.push(issue("PROCTOR_WATER_CONTENT_INVALID", "Water content must be finite and non-negative.", `points.${index}.waterContentPercent`));
    if (!finite(point.wetSampleMassG) || point.wetSampleMassG <= 0) issues.push(issue("PROCTOR_WET_MASS_INVALID", "Wet sample mass must be positive and finite.", `points.${index}.wetSampleMassG`));
  });
  const moistureValues = input.points?.map(point => point.waterContentPercent).filter(finite) || [];
  if (new Set(moistureValues).size !== moistureValues.length) issues.push(issue("PROCTOR_DUPLICATE_WATER_CONTENT", "Each Proctor moisture content must be unique.", "points"));
  return issues;
}

export function calculateProctor(input: ProctorInput): ProctorResult {
  const validation = validateProctorInput(input);
  if (validation.length) throw new Error(validation.map(item => item.code).join(","));
  const points = input.points.map(point => {
    const wetDensity = point.wetSampleMassG / input.moldVolumeCm3;
    const dryDensityGPerCm3 = wetDensity / (1 + point.waterContentPercent / 100);
    return { ...point, dryDensityGPerCm3 };
  });
  const peak = points.reduce((best, point) => point.dryDensityGPerCm3 > best.dryDensityGPerCm3 ? point : best);
  return { points, maximumDryDensityGPerCm3: peak.dryDensityGPerCm3, optimumMoisturePercent: peak.waterContentPercent, trace: [{ stepNumber: 1, label: "Dry density", formula: "ρd = ρwet / (1 + w)", substitution: "one calculated point per measured moisture content", result: peak.dryDensityGPerCm3, unit: "g/cm³", inputs: { moldVolumeCm3: input.moldVolumeCm3 } }] };
}
