export interface MoistureCorrectionResult {
  sandWetKg: number;
  gravelWetKg: number;
  waterAddedKg: number;
}

export function applyMoistureCorrection(params: {
  sandDryKg: number;
  gravelDryKg: number;
  waterPureKg: number;
  sandMoisturePercent: number;  // e.g. 4.5%
  gravelMoisturePercent: number; // e.g. 1.2%
}): MoistureCorrectionResult {
  const sandMoistureDecimal = params.sandMoisturePercent / 100;
  const gravelMoistureDecimal = params.gravelMoisturePercent / 100;

  // Wet aggregate weight = Dry weight * (1 + moisture%)
  const sandWetKg = params.sandDryKg * (1 + sandMoistureDecimal);
  const gravelWetKg = params.gravelDryKg * (1 + gravelMoistureDecimal);

  // Water contributed by aggregates
  const sandWaterContribution = params.sandDryKg * sandMoistureDecimal;
  const gravelWaterContribution = params.gravelDryKg * gravelMoistureDecimal;

  // Water added at the mixer = Required pure water - water already present in aggregates
  const waterAddedKg = params.waterPureKg - sandWaterContribution - gravelWaterContribution;

  return {
    sandWetKg,
    gravelWetKg,
    waterAddedKg: Math.max(0, waterAddedKg)
  };
}
