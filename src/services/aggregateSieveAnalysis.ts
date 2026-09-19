import type { CalculationTraceStep, ValidationIssue, ValidationReport } from "../types/laboratoryDomain";

export interface SieveAnalysisInput extends Record<string, unknown> {
  totalSampleMassG: number;
  sieves: Array<{ sieveMm: number; retainedMassG: number }>;
  finesSieveMm: number;
  massBalanceToleranceG: number;
  standardFinenessSievesMm?: number[];
}

export interface SieveAnalysisRow {
  sieveMm: number;
  retainedMassG: number;
  percentRetained: number;
  cumulativePercentRetained: number;
  percentPassing: number;
}

export interface SieveAnalysisOutput {
  rows: SieveAnalysisRow[];
  massRetainedTotalG: number;
  massBalanceErrorG: number;
  massBalanceValid: boolean;
  finenessModulus?: number;
  finesContentPercent?: number;
  d10Mm?: number;
  d30Mm?: number;
  d60Mm?: number;
  dMaxMm?: number;
  dMinMm?: number;
  trace: CalculationTraceStep[];
  validation: ValidationReport;
}

function error(code: string, message: string, field?: string): ValidationIssue {
  return { level: "data", severity: "error", code, message, field };
}

function warning(code: string, message: string, field?: string): ValidationIssue {
  return { level: "engineering", severity: "warning", code, message, field };
}

function interpolate(sortedRows: SieveAnalysisRow[], targetPassing: number): number | undefined {
  for (let index = 0; index < sortedRows.length - 1; index += 1) {
    const left = sortedRows[index];
    const right = sortedRows[index + 1];
    if ((left.percentPassing <= targetPassing && targetPassing <= right.percentPassing) ||
        (right.percentPassing <= targetPassing && targetPassing <= left.percentPassing)) {
      if (left.percentPassing === right.percentPassing) return left.sieveMm;
      const ratio = (targetPassing - left.percentPassing) / (right.percentPassing - left.percentPassing);
      return Number((left.sieveMm + ratio * (right.sieveMm - left.sieveMm)).toFixed(3));
    }
  }
  return undefined;
}

export function calculateSieveAnalysis(input: SieveAnalysisInput): SieveAnalysisOutput {
  const issues: ValidationIssue[] = [];
  if (!Number.isFinite(input.totalSampleMassG) || input.totalSampleMassG <= 0) {
    issues.push(error("INVALID_TOTAL_MASS", "Total sample mass must be greater than zero.", "totalSampleMassG"));
  }
  if (!Number.isFinite(input.finesSieveMm) || input.finesSieveMm <= 0) {
    issues.push(error("INVALID_FINES_SIEVE", "Fines sieve size must be greater than zero.", "finesSieveMm"));
  }
  if (!Number.isFinite(input.massBalanceToleranceG) || input.massBalanceToleranceG < 0) {
    issues.push(error("INVALID_MASS_TOLERANCE", "Mass-balance tolerance must be zero or greater.", "massBalanceToleranceG"));
  }
  if (!Array.isArray(input.sieves) || input.sieves.length < 2) {
    issues.push(error("INSUFFICIENT_SIEVES", "At least two sieve rows are required.", "sieves"));
  }

  const seen = new Set<number>();
  for (const [index, row] of (input.sieves || []).entries()) {
    if (!Number.isFinite(row.sieveMm) || row.sieveMm < 0) issues.push(error("INVALID_SIEVE_SIZE", "Sieve size must be zero or greater.", `sieves[${index}].sieveMm`));
    if (seen.has(row.sieveMm)) issues.push(error("DUPLICATE_SIEVE_SIZE", "Sieve sizes must be unique.", `sieves[${index}].sieveMm`));
    seen.add(row.sieveMm);
    if (!Number.isFinite(row.retainedMassG) || row.retainedMassG < 0) issues.push(error("INVALID_RETAINED_MASS", "Retained mass must be zero or greater.", `sieves[${index}].retainedMassG`));
  }

  const massRetainedTotalG = (input.sieves || []).reduce((sum, row) => sum + (Number.isFinite(row.retainedMassG) ? row.retainedMassG : 0), 0);
  const massBalanceErrorG = massRetainedTotalG - input.totalSampleMassG;
  const massBalanceValid = Number.isFinite(massBalanceErrorG) && Math.abs(massBalanceErrorG) <= input.massBalanceToleranceG;
  if (!massBalanceValid && Number.isFinite(massBalanceErrorG)) {
    issues.push(error("MASS_BALANCE_FAILED", `Retained mass differs from total sample mass by ${massBalanceErrorG.toFixed(3)} g.`));
  }

  const sortedInput = [...(input.sieves || [])].sort((a, b) => b.sieveMm - a.sieveMm);
  let cumulativeRetainedG = 0;
  const rows: SieveAnalysisRow[] = sortedInput.map(row => {
    cumulativeRetainedG += row.retainedMassG;
    const percentRetained = (row.retainedMassG / input.totalSampleMassG) * 100;
    const cumulativePercentRetained = (cumulativeRetainedG / input.totalSampleMassG) * 100;
    return {
      sieveMm: row.sieveMm,
      retainedMassG: row.retainedMassG,
      percentRetained: Number(percentRetained.toFixed(3)),
      cumulativePercentRetained: Number(cumulativePercentRetained.toFixed(3)),
      percentPassing: Number((100 - cumulativePercentRetained).toFixed(3))
    };
  });

  const ascendingRows = [...rows].filter(row => row.sieveMm > 0).sort((a, b) => a.sieveMm - b.sieveMm);
  const standardFinenessSievesMm = input.standardFinenessSievesMm || [0.125, 0.25, 0.5, 1, 2, 4];
  const fmRows = standardFinenessSievesMm.map(size => rows.find(row => Math.abs(row.sieveMm - size) < 0.0001));
  const finenessModulus = fmRows.every(Boolean)
    ? Number((fmRows.reduce((sum, row) => sum + (row?.cumulativePercentRetained || 0), 0) / 100).toFixed(3))
    : undefined;
  if (finenessModulus === undefined) issues.push(warning("FM_INCOMPLETE_SIEVE_SERIES", "Fineness modulus was not calculated because one or more configured standard sieves are missing."));

  const finesRow = rows.find(row => Math.abs(row.sieveMm - input.finesSieveMm) < 0.0001);
  const finesContentPercent = finesRow?.percentPassing;
  if (finesContentPercent === undefined) issues.push(warning("FINES_RESULT_UNAVAILABLE", "Fines content was not calculated because the configured fines sieve is missing."));

  const d10Mm = interpolate(ascendingRows, 10);
  const d30Mm = interpolate(ascendingRows, 30);
  const d60Mm = interpolate(ascendingRows, 60);
  const dMaxMm = ascendingRows.find(row => row.percentPassing >= 95)?.sieveMm;
  const dMinMm = ascendingRows.find(row => row.percentPassing > 5)?.sieveMm;
  if (dMaxMm === undefined) issues.push(warning("DMAX_UNAVAILABLE", "Dmax was not inferred because the measured curve does not reach 95% passing."));

  const validation: ValidationReport = {
    valid: !issues.some(item => item.severity === "error"),
    issues
  };
  const trace: CalculationTraceStep[] = [
    { stepNumber: 1, label: "Mass balance", formula: "Σ retained mass − total sample mass", substitution: `${massRetainedTotalG} − ${input.totalSampleMassG}`, result: massBalanceErrorG, unit: "g", inputs: { massRetainedTotalG, totalSampleMassG: input.totalSampleMassG } },
    { stepNumber: 2, label: "Passing percentage", formula: "100 − cumulative retained percentage", substitution: "100 − cumulative retained %", result: rows.length ? rows[rows.length - 1].percentPassing : "—", unit: "%", inputs: { rows: rows.length } }
  ];
  if (finenessModulus !== undefined) trace.push({ stepNumber: 3, label: "Fineness modulus", formula: "Σ cumulative retained on configured standard sieves / 100", substitution: `${fmRows.map(row => row?.cumulativePercentRetained).join(" + ")} / 100`, result: finenessModulus, inputs: { standardFinenessSievesMm: standardFinenessSievesMm.join(",") } });
  return { rows, massRetainedTotalG, massBalanceErrorG, massBalanceValid, finenessModulus, finesContentPercent, d10Mm, d30Mm, d60Mm, dMaxMm, dMinMm, trace, validation };
}
