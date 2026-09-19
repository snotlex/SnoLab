import type { CalculationTraceStep, ValidationIssue, ValidationReport } from "../types/laboratoryDomain";

export interface SpecificGravityInput extends Record<string, unknown> {
  ovenDryMassG: number;
  ssdMassG: number;
  pycnometerSampleWaterMassG: number;
  pycnometerWaterMassG: number;
}

export interface SpecificGravityOutput {
  absoluteDensityGPerCm3: number;
  absoluteDensityKgM3: number;
  ssdDensityGPerCm3: number;
  ssdDensityKgM3: number;
  waterAbsorptionPercent: number;
  displacedVolumeCm3: number;
  ssdVolumeCm3: number;
  trace: CalculationTraceStep[];
  validation: ValidationReport;
}

function validationIssue(code: string, message: string, field?: string, severity: ValidationIssue["severity"] = "error"): ValidationIssue {
  return { level: severity === "warning" ? "engineering" : "data", severity, code, message, field };
}

export function calculateAggregateSpecificGravity(input: SpecificGravityInput): SpecificGravityOutput | undefined {
  const values = [
    ["ovenDryMassG", input.ovenDryMassG],
    ["ssdMassG", input.ssdMassG],
    ["pycnometerSampleWaterMassG", input.pycnometerSampleWaterMassG],
    ["pycnometerWaterMassG", input.pycnometerWaterMassG]
  ] as const;
  const issues: ValidationIssue[] = [];
  for (const [field, value] of values) {
    if (!Number.isFinite(value) || value <= 0) issues.push(validationIssue("INVALID_MASS", `${field} must be a finite mass greater than zero.`, field));
  }
  if (issues.length) return undefined;

  const dry = input.ovenDryMassG;
  const ssd = input.ssdMassG;
  const pycnometerSampleWater = input.pycnometerSampleWaterMassG;
  const pycnometerWater = input.pycnometerWaterMassG;
  if (ssd < dry) issues.push(validationIssue("SSD_BELOW_DRY_MASS", "SSD mass cannot be lower than oven-dry mass.", "ssdMassG"));

  const displacedVolumeCm3 = dry + pycnometerWater - pycnometerSampleWater;
  const ssdVolumeCm3 = ssd + pycnometerWater - pycnometerSampleWater;
  if (displacedVolumeCm3 <= 0) issues.push(validationIssue("INVALID_DISPLACED_VOLUME", "Calculated displaced volume must be greater than zero."));
  if (ssdVolumeCm3 <= 0) issues.push(validationIssue("INVALID_SSD_VOLUME", "Calculated SSD volume must be greater than zero."));
  if (issues.some(item => item.severity === "error")) return undefined;

  const absoluteDensityGPerCm3 = Number((dry / displacedVolumeCm3).toFixed(4));
  const ssdDensityGPerCm3 = Number((ssd / ssdVolumeCm3).toFixed(4));
  const waterAbsorptionPercent = Number((((ssd - dry) / dry) * 100).toFixed(3));
  if (absoluteDensityGPerCm3 < 1.5 || absoluteDensityGPerCm3 > 4.0) {
    issues.push(validationIssue("DENSITY_OUTSIDE_TYPICAL_RANGE", "Absolute density is outside the typical aggregate screening range; confirm specimen and equipment records.", "ovenDryMassG", "warning"));
  }

  const trace: CalculationTraceStep[] = [
    {
      stepNumber: 1,
      label: "Displaced volume",
      formula: "M4 + M3 − M2",
      substitution: `${dry} + ${pycnometerWater} − ${pycnometerSampleWater}`,
      result: displacedVolumeCm3,
      unit: "cm³",
      inputs: { M4: dry, M3: pycnometerWater, M2: pycnometerSampleWater }
    },
    {
      stepNumber: 2,
      label: "Absolute density",
      formula: "M4 / (M4 + M3 − M2)",
      substitution: `${dry} / ${displacedVolumeCm3}`,
      result: absoluteDensityGPerCm3,
      unit: "g/cm³",
      inputs: { M4: dry, displacedVolumeCm3 }
    },
    {
      stepNumber: 3,
      label: "SSD density",
      formula: "M1 / (M1 + M3 − M2)",
      substitution: `${ssd} / ${ssdVolumeCm3}`,
      result: ssdDensityGPerCm3,
      unit: "g/cm³",
      inputs: { M1: ssd, ssdVolumeCm3 }
    },
    {
      stepNumber: 4,
      label: "Water absorption",
      formula: "(M1 − M4) / M4 × 100",
      substitution: `(${ssd} − ${dry}) / ${dry} × 100`,
      result: waterAbsorptionPercent,
      unit: "%",
      inputs: { M1: ssd, M4: dry }
    }
  ];
  return {
    absoluteDensityGPerCm3,
    absoluteDensityKgM3: Number((absoluteDensityGPerCm3 * 1000).toFixed(1)),
    ssdDensityGPerCm3,
    ssdDensityKgM3: Number((ssdDensityGPerCm3 * 1000).toFixed(1)),
    waterAbsorptionPercent,
    displacedVolumeCm3: Number(displacedVolumeCm3.toFixed(4)),
    ssdVolumeCm3: Number(ssdVolumeCm3.toFixed(4)),
    trace,
    validation: { valid: !issues.some(item => item.severity === "error"), issues }
  };
}

export function validateAggregateSpecificGravity(input: Partial<SpecificGravityInput>): ValidationReport {
  const result = calculateAggregateSpecificGravity(input as SpecificGravityInput);
  if (!result) return {
    valid: false,
    issues: [{ level: "data", severity: "error", code: "SPECIFIC_GRAVITY_INPUT_INVALID", message: "Specific-gravity inputs are incomplete or physically invalid." }]
  };
  return result.validation;
}
