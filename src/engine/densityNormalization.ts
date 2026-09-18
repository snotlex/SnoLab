/**
 * Density Normalization Utility for SnoLab Concrete Mix Design Engine
 * Strictly enforces SI units (kg/m³ and relative density) and eliminates silent ambiguous conversions.
 */

export interface NormalizedDensityResult {
  densityKgM3: number;
  specificGravity: number; // Relative to water (1.0 = 1000 kg/m³)
  densityKgL: number;      // Numerically equal to specific gravity
  sourceUnit: "kg/m3" | "relative";
  isValid: boolean;
  error?: string;
}

/**
 * Normalizes an input density value to standard SI units.
 * 
 * Rules:
 * - Relative density / Specific Gravity: values between 0.8 and 10.0
 *   (e.g., 2.65 -> 2650 kg/m³, SG = 2.65)
 * - Standard density in kg/m³: values between 850 and 10000 kg/m³
 *   (e.g., 2650 -> 2650 kg/m³, SG = 2.65)
 * - Ambiguous values between 10.0 and 850 kg/m³: REJECTED with an explicit error.
 * - Non-positive, infinite, or NaN values: REJECTED.
 */
export function normalizeDensity(
  value: number | undefined | null,
  materialName: string = "المادة"
): NormalizedDensityResult {
  if (value === undefined || value === null || isNaN(value) || !isFinite(value)) {
    return {
      densityKgM3: 0,
      specificGravity: 0,
      densityKgL: 0,
      sourceUnit: "relative",
      isValid: false,
      error: `قيمة الكثافة لـ (${materialName}) مفقودة أو غير معرّفة (NaN/Undefined).`
    };
  }

  if (value <= 0) {
    return {
      densityKgM3: 0,
      specificGravity: 0,
      densityKgL: 0,
      sourceUnit: "relative",
      isValid: false,
      error: `قيمة الكثافة لـ (${materialName}) سالبة أو تساوي صفراً (${value}). يجب أن تكون قيمة موجبة.`
    };
  }

  // Case 1: Specific Gravity (relative to water, 1.0 = 1000 kg/m³)
  // Normal engineering range for building materials: 0.80 (very light) to 9.5 (heavy steel / barite)
  if (value >= 0.8 && value <= 10.0) {
    const densityKgM3 = value * 1000;
    return {
      densityKgM3,
      specificGravity: value,
      densityKgL: value,
      sourceUnit: "relative",
      isValid: true
    };
  }

  // Case 2: SI Density in kg/m³
  // Normal engineering range: 850 kg/m³ to 10000 kg/m³
  if (value >= 850 && value <= 10000) {
    const specificGravity = value / 1000;
    return {
      densityKgM3: value,
      specificGravity,
      densityKgL: specificGravity,
      sourceUnit: "kg/m3",
      isValid: true
    };
  }

  // Case 3: Ambiguous or unrealistic value (e.g., 10 < value < 850 or value > 10000)
  return {
    densityKgM3: 0,
    specificGravity: 0,
    densityKgL: 0,
    sourceUnit: "relative",
    isValid: false,
    error: `قيمة الكثافة (${value}) لـ (${materialName}) غامضة وغير مقبولة هندسياً. القيم المقبولة إما كثافة نسبية [0.8 - 10.0] أو كجم/م³ [850 - 10000].`
  };
}
