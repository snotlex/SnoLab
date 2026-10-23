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
  const candidate = input as Partial<SoilSieveInput> | null | undefined;
  const rawRows = candidate?.rows;
  const rows: unknown[] = Array.isArray(rawRows) ? rawRows : [];
  const totalSampleMassG = candidate?.totalSampleMassG;
  const washLossMassG = candidate?.washLossMassG;
  const issues: ValidationIssue[] = [];
  if (!finite(totalSampleMassG) || totalSampleMassG <= 0) issues.push(issue("SOIL_SIEVE_TOTAL_MASS_INVALID", "Total soil sample mass must be positive and finite.", "totalSampleMassG"));
  if (!Array.isArray(rawRows) || rows.length < 2) issues.push(issue("SOIL_SIEVE_ROWS_INSUFFICIENT", "At least two sieve rows are required.", "rows"));
  const validRows: SoilSievePoint[] = [];
  for (let index = 0; index < rows.length; index += 1) {
    const value = rows[index];
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      issues.push(issue("SOIL_SIEVE_ROW_INVALID", "Each sieve row must be an object.", `rows.${index}`));
      continue;
    }
    const row = value as SoilSievePoint;
    validRows.push(row);
    if (!finite(row.sieveMm) || row.sieveMm < 0) issues.push(issue("SOIL_SIEVE_APERTURE_INVALID", "Sieve aperture must be finite and non-negative.", `rows.${index}.sieveMm`));
    if (!finite(row.retainedMassG) || row.retainedMassG < 0) issues.push(issue("SOIL_SIEVE_MASS_INVALID", "Retained mass must be finite and non-negative.", `rows.${index}.retainedMassG`));
  }
  const apertures = validRows.map(row => row.sieveMm).filter(finite);
  if (new Set(apertures).size !== apertures.length) issues.push(issue("SOIL_SIEVE_DUPLICATE_APERTURE", "Each sieve aperture must appear only once.", "rows"));
  const retainedTotal = validRows.reduce((sum, row) => sum + (finite(row.retainedMassG) ? row.retainedMassG : 0), 0);
  const accountedMass = retainedTotal + (finite(washLossMassG) ? washLossMassG : 0);
  if (finite(totalSampleMassG) && accountedMass > totalSampleMassG + 1e-9) issues.push(issue("SOIL_SIEVE_MASS_BALANCE_EXCEEDS_TOTAL", "Retained mass plus wash loss cannot exceed the total sample mass.", "rows"));
  if (washLossMassG !== undefined && (!finite(washLossMassG) || washLossMassG < 0)) issues.push(issue("SOIL_SIEVE_WASH_LOSS_INVALID", "Wash loss must be finite and non-negative.", "washLossMassG"));
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
  const candidate = input as Partial<ProctorInput> | null | undefined;
  const rawPoints = candidate?.points;
  const points: unknown[] = Array.isArray(rawPoints) ? rawPoints : [];
  const moldVolumeCm3 = candidate?.moldVolumeCm3;
  const issues: ValidationIssue[] = [];
  if (!finite(moldVolumeCm3) || moldVolumeCm3 <= 0) issues.push(issue("PROCTOR_MOLD_VOLUME_INVALID", "Mold volume must be positive and finite.", "moldVolumeCm3"));
  if (!Array.isArray(rawPoints) || points.length < 3) issues.push(issue("PROCTOR_POINTS_INSUFFICIENT", "At least three moisture-density points are required.", "points"));
  const validPoints: ProctorPoint[] = [];
  for (let index = 0; index < points.length; index += 1) {
    const value = points[index];
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      issues.push(issue("PROCTOR_POINT_INVALID", "Each Proctor point must be an object.", `points.${index}`));
      continue;
    }
    const point = value as ProctorPoint;
    validPoints.push(point);
    if (!finite(point.waterContentPercent) || point.waterContentPercent < 0) issues.push(issue("PROCTOR_WATER_CONTENT_INVALID", "Water content must be finite and non-negative.", `points.${index}.waterContentPercent`));
    if (!finite(point.wetSampleMassG) || point.wetSampleMassG <= 0) issues.push(issue("PROCTOR_WET_MASS_INVALID", "Wet sample mass must be positive and finite.", `points.${index}.wetSampleMassG`));
  }
  const moistureValues = validPoints.map(point => point.waterContentPercent).filter(finite);
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


export interface LiquidLimitPoint { blows: number; waterContentPercent: number; }
export type DeterminationStatus = "measured" | "not_determined";
export type AtterbergInput = Record<string, unknown> & {
  liquidLimitStatus: DeterminationStatus;
  liquidLimitPoints: LiquidLimitPoint[];
  plasticLimitStatus: DeterminationStatus;
  plasticLimitWaterContentsPercent: number[];
  samplePassing425Micron: boolean;
};
export interface AtterbergResult {
  liquidLimitPercent?: number;
  plasticLimitPercent?: number;
  plasticityIndex?: number;
  plasticityStatus: "PLASTIC" | "NP";
  nonPlasticReason?: "liquid_limit_not_determined" | "plastic_limit_not_determined" | "plastic_limit_ge_liquid_limit";
  flowCurve: { intercept: number; slopePerLnBlow: number; rSquared: number; predictedWaterContentAt25Blows: number } | null;
  trace: CalculationTraceStep[];
}

export interface CbrPenetrationPoint { penetrationMm: number; loadKN: number; }
export type CbrCondition = "soaked" | "unsoaked" | "immediate";
export type CbrInput = Record<string, unknown> & {
  referenceMethod: "AASHTO_T193";
  condition: CbrCondition;
  penetrationPoints: CbrPenetrationPoint[];
  pistonAreaMm2: number;
  swellPercent?: number;
  soakDurationHours?: number;
  moldingWaterContentPercent: number;
  dryDensityGPerCm3: number;
};
export interface CbrResult {
  cbrAt254Percent: number;
  cbrAt508Percent: number;
  loadAt254KN: number;
  loadAt508KN: number;
  swellPercent?: number;
  condition: CbrCondition;
  trace: CalculationTraceStep[];
}

const validPercent = (value: unknown): value is number => finite(value) && value >= 0 && value <= 1000;

export function validateAtterbergInput(input: AtterbergInput): ValidationIssue[] {
  const candidate = input as Partial<AtterbergInput> | null | undefined;
  const issues: ValidationIssue[] = [];
  if (candidate?.samplePassing425Micron !== true) issues.push(issue("ATTERBERG_REQUIRES_425_MICRON_FRACTION", "Record that the tested specimen is the fraction passing the 0.425 mm (No. 40) sieve.", "samplePassing425Micron"));
  if (candidate?.liquidLimitStatus !== "measured" && candidate?.liquidLimitStatus !== "not_determined") issues.push(issue("ATTERBERG_LL_STATUS_INVALID", "Liquid-limit determination status is required.", "liquidLimitStatus"));
  if (candidate?.plasticLimitStatus !== "measured" && candidate?.plasticLimitStatus !== "not_determined") issues.push(issue("ATTERBERG_PL_STATUS_INVALID", "Plastic-limit determination status is required.", "plasticLimitStatus"));
  const llPoints: unknown[] = Array.isArray(candidate?.liquidLimitPoints) ? candidate.liquidLimitPoints : [];
  if (candidate?.liquidLimitStatus === "measured") {
    if (llPoints.length < 3) issues.push(issue("ATTERBERG_LL_POINTS_INSUFFICIENT", "Multipoint liquid limit requires at least three measured points.", "liquidLimitPoints"));
    const validPoints = llPoints.filter((point): point is LiquidLimitPoint => Boolean(point && typeof point === "object" && !Array.isArray(point)));
    validPoints.forEach((point, index) => {
      if (!finite(point.blows) || point.blows <= 0) issues.push(issue("ATTERBERG_BLOWS_INVALID", "Blow count must be positive and finite.", `liquidLimitPoints.${index}.blows`));
      if (!validPercent(point.waterContentPercent)) issues.push(issue("ATTERBERG_WATER_CONTENT_INVALID", "Water content must be finite and non-negative.", `liquidLimitPoints.${index}.waterContentPercent`));
    });
    const blows = validPoints.map(point => point.blows).filter(finite);
    if (new Set(blows).size !== blows.length) issues.push(issue("ATTERBERG_DUPLICATE_BLOW_COUNT", "Each liquid-limit point must have a distinct blow count.", "liquidLimitPoints"));
    if (blows.length && (!blows.some(value => value < 25) || !blows.some(value => value > 25))) issues.push(issue("ATTERBERG_25_BLOWS_NOT_BRACKETED", "Multipoint data must include blow counts below and above 25 for a supported interpolation.", "liquidLimitPoints"));
  }
  const plValues: unknown[] = Array.isArray(candidate?.plasticLimitWaterContentsPercent) ? candidate.plasticLimitWaterContentsPercent : [];
  if (candidate?.plasticLimitStatus === "measured") {
    if (plValues.length < 2) issues.push(issue("ATTERBERG_PL_TRIALS_INSUFFICIENT", "At least two plastic-limit water-content determinations are required.", "plasticLimitWaterContentsPercent"));
    plValues.forEach((value, index) => { if (!validPercent(value)) issues.push(issue("ATTERBERG_PL_WATER_CONTENT_INVALID", "Plastic-limit water content must be finite and non-negative.", `plasticLimitWaterContentsPercent.${index}`)); });
  }
  return issues;
}

export function calculateAtterberg(input: AtterbergInput): AtterbergResult {
  const validation = validateAtterbergInput(input);
  if (validation.length) throw new Error(validation.map(item => item.code).join(","));
  let liquidLimitPercent: number | undefined;
  let plasticLimitPercent: number | undefined;
  let flowCurve: AtterbergResult["flowCurve"] = null;
  const trace: CalculationTraceStep[] = [];
  if (input.liquidLimitStatus === "measured") {
    const points = input.liquidLimitPoints;
    const x = points.map(point => Math.log(point.blows));
    const y = points.map(point => point.waterContentPercent);
    const meanX = x.reduce((sum, value) => sum + value, 0) / x.length;
    const meanY = y.reduce((sum, value) => sum + value, 0) / y.length;
    const denominator = x.reduce((sum, value) => sum + (value - meanX) ** 2, 0);
    const slopePerLnBlow = x.reduce((sum, value, index) => sum + (value - meanX) * (y[index] - meanY), 0) / denominator;
    const intercept = meanY - slopePerLnBlow * meanX;
    liquidLimitPercent = intercept + slopePerLnBlow * Math.log(25);
    const residualSum = y.reduce((sum, value, index) => sum + (value - (intercept + slopePerLnBlow * x[index])) ** 2, 0);
    const totalSum = y.reduce((sum, value) => sum + (value - meanY) ** 2, 0);
    const rSquared = totalSum === 0 ? 1 : 1 - residualSum / totalSum;
    flowCurve = { intercept, slopePerLnBlow, rSquared, predictedWaterContentAt25Blows: liquidLimitPercent };
    trace.push({ stepNumber: 1, label: "Liquid limit at 25 blows", formula: "LL = a + b·ln(25), where w = a + b·ln(N) is least-squares flow curve", substitution: `a=${intercept}; b=${slopePerLnBlow}`, result: liquidLimitPercent, unit: "%", inputs: { blowCount: 25, pointCount: points.length, rSquared } });
  }
  if (input.plasticLimitStatus === "measured") {
    plasticLimitPercent = input.plasticLimitWaterContentsPercent.reduce((sum, value) => sum + value, 0) / input.plasticLimitWaterContentsPercent.length;
    trace.push({ stepNumber: trace.length + 1, label: "Plastic limit mean", formula: "PL = Σwᵢ / n", substitution: `${input.plasticLimitWaterContentsPercent.join(" + ")} / ${input.plasticLimitWaterContentsPercent.length}`, result: plasticLimitPercent, unit: "%", inputs: { determinationCount: input.plasticLimitWaterContentsPercent.length } });
  }
  const nonPlasticReason = input.liquidLimitStatus !== "measured" ? "liquid_limit_not_determined" : input.plasticLimitStatus !== "measured" ? "plastic_limit_not_determined" : liquidLimitPercent !== undefined && plasticLimitPercent !== undefined && plasticLimitPercent >= liquidLimitPercent ? "plastic_limit_ge_liquid_limit" : undefined;
  const nonPlastic = nonPlasticReason !== undefined;
  const plasticityIndex = nonPlastic || liquidLimitPercent === undefined || plasticLimitPercent === undefined ? undefined : liquidLimitPercent - plasticLimitPercent;
  if (plasticityIndex !== undefined) trace.push({ stepNumber: trace.length + 1, label: "Plasticity index", formula: "PI = LL − PL", substitution: `${liquidLimitPercent} − ${plasticLimitPercent}`, result: plasticityIndex, unit: "%", inputs: { liquidLimitPercent, plasticLimitPercent } });
  return { ...(liquidLimitPercent === undefined ? {} : { liquidLimitPercent }), ...(plasticLimitPercent === undefined ? {} : { plasticLimitPercent }), ...(plasticityIndex === undefined ? {} : { plasticityIndex }), plasticityStatus: nonPlastic ? "NP" : "PLASTIC", ...(nonPlasticReason ? { nonPlasticReason } : {}), flowCurve, trace };
}

export function validateCbrInput(input: CbrInput): ValidationIssue[] {
  const candidate = input as Partial<CbrInput> | null | undefined;
  const issues: ValidationIssue[] = [];
  if (candidate?.referenceMethod !== "AASHTO_T193") issues.push(issue("CBR_REFERENCE_METHOD_INVALID", "This diagnostic calculation currently implements the AASHTO T 193 reference-stress basis only.", "referenceMethod"));
  if (!["soaked", "unsoaked", "immediate"].includes(candidate?.condition || "")) issues.push(issue("CBR_CONDITION_INVALID", "Record whether the specimen is soaked, unsoaked, or immediate CBR.", "condition"));
  if (!finite(candidate?.pistonAreaMm2) || candidate.pistonAreaMm2 <= 0) issues.push(issue("CBR_PISTON_AREA_INVALID", "Piston area must be positive and finite.", "pistonAreaMm2"));
  if (!validPercent(candidate?.moldingWaterContentPercent)) issues.push(issue("CBR_MOLDING_WATER_INVALID", "Molding water content must be finite and non-negative.", "moldingWaterContentPercent"));
  if (!finite(candidate?.dryDensityGPerCm3) || candidate.dryDensityGPerCm3 <= 0) issues.push(issue("CBR_DRY_DENSITY_INVALID", "Dry density must be positive and finite.", "dryDensityGPerCm3"));
  if (candidate?.soakDurationHours !== undefined && (!finite(candidate.soakDurationHours) || candidate.soakDurationHours < 0)) issues.push(issue("CBR_SOAK_DURATION_INVALID", "Soak duration must be finite and non-negative.", "soakDurationHours"));
  if (candidate?.condition === "soaked" && (!finite(candidate.soakDurationHours) || candidate.soakDurationHours <= 0)) issues.push(issue("CBR_SOAK_DURATION_REQUIRED", "A soaked specimen requires a recorded positive soak duration.", "soakDurationHours"));
  if (candidate?.condition === "soaked" && !validPercent(candidate.swellPercent)) issues.push(issue("CBR_SWELL_REQUIRED", "Record measured swell percent for a soaked specimen.", "swellPercent"));
  if (candidate?.swellPercent !== undefined && !validPercent(candidate.swellPercent)) issues.push(issue("CBR_SWELL_INVALID", "Swell percent must be finite and non-negative.", "swellPercent"));
  const rawPoints: unknown[] = Array.isArray(candidate?.penetrationPoints) ? candidate.penetrationPoints : [];
  if (!Array.isArray(candidate?.penetrationPoints) || rawPoints.length < 2) issues.push(issue("CBR_PENETRATION_POINTS_INSUFFICIENT", "At least two penetration/load measurements are required.", "penetrationPoints"));
  const points = rawPoints.filter((point): point is CbrPenetrationPoint => Boolean(point && typeof point === "object" && !Array.isArray(point)));
  points.forEach((point, index) => {
    if (!finite(point.penetrationMm) || point.penetrationMm < 0) issues.push(issue("CBR_PENETRATION_INVALID", "Penetration must be finite and non-negative.", `penetrationPoints.${index}.penetrationMm`));
    if (!finite(point.loadKN) || point.loadKN < 0) issues.push(issue("CBR_LOAD_INVALID", "Load must be finite and non-negative.", `penetrationPoints.${index}.loadKN`));
  });
  const penetrations = points.map(point => point.penetrationMm).filter(finite);
  if (new Set(penetrations).size !== penetrations.length) issues.push(issue("CBR_DUPLICATE_PENETRATION", "Penetration values must be unique.", "penetrationPoints"));
  if (!penetrations.includes(2.54)) issues.push(issue("CBR_254MM_POINT_REQUIRED", "A measured load at 2.54 mm is required; interpolation is not performed.", "penetrationPoints"));
  if (!penetrations.includes(5.08)) issues.push(issue("CBR_508MM_POINT_REQUIRED", "A measured load at 5.08 mm is required; interpolation is not performed.", "penetrationPoints"));
  return issues;
}

export function calculateCbr(input: CbrInput): CbrResult {
  const validation = validateCbrInput(input);
  if (validation.length) throw new Error(validation.map(item => item.code).join(","));
  const point254 = input.penetrationPoints.find(point => point.penetrationMm === 2.54)!;
  const point508 = input.penetrationPoints.find(point => point.penetrationMm === 5.08)!;
  const referenceStressAt254MPa = 6.895;
  const referenceStressAt508MPa = 10.342;
  const referenceLoadAt254KN = referenceStressAt254MPa * input.pistonAreaMm2 / 1000;
  const referenceLoadAt508KN = referenceStressAt508MPa * input.pistonAreaMm2 / 1000;
  const cbrAt254Percent = point254.loadKN / referenceLoadAt254KN * 100;
  const cbrAt508Percent = point508.loadKN / referenceLoadAt508KN * 100;
  const trace: CalculationTraceStep[] = [
    { stepNumber: 1, label: "CBR at 2.54 mm", formula: "CBR₂.₅₄ = measured load / (6.895 MPa × piston area) × 100", substitution: `${point254.loadKN} / ${referenceLoadAt254KN}`, result: cbrAt254Percent, unit: "%", inputs: { penetrationMm: 2.54, loadKN: point254.loadKN, pistonAreaMm2: input.pistonAreaMm2, referenceStressMPa: referenceStressAt254MPa } },
    { stepNumber: 2, label: "CBR at 5.08 mm", formula: "CBR₅.₀₈ = measured load / (10.342 MPa × piston area) × 100", substitution: `${point508.loadKN} / ${referenceLoadAt508KN}`, result: cbrAt508Percent, unit: "%", inputs: { penetrationMm: 5.08, loadKN: point508.loadKN, pistonAreaMm2: input.pistonAreaMm2, referenceStressMPa: referenceStressAt508MPa } }
  ];
  if (input.swellPercent !== undefined) trace.push({ stepNumber: 3, label: "Specimen swell", formula: "Recorded swell percent (not part of CBR ratio)", substitution: `condition=${input.condition}; soakHours=${input.soakDurationHours ?? "not applicable"}`, result: input.swellPercent, unit: "%", inputs: { swellPercent: input.swellPercent, soakDurationHours: input.soakDurationHours ?? "not applicable" } });
  return { cbrAt254Percent, cbrAt508Percent, loadAt254KN: point254.loadKN, loadAt508KN: point508.loadKN, ...(input.swellPercent === undefined ? {} : { swellPercent: input.swellPercent }), condition: input.condition, trace };
}
