import { MixDesignInput } from "./types";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateInput(input: MixDesignInput): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (input.fck28 <= 0) {
    errors.push("Target strength (fck) must be greater than 0");
  }

  if (input.dMax <= 0) {
    errors.push("Maximum aggregate size (D_max) must be greater than 0");
  }

  if (input.cementClassStrength <= 0) {
    errors.push("Cement class strength must be greater than 0");
  }

  if (input.slump < 0) {
    errors.push("Slump cannot be negative");
  }

  if (input.hydrationStrengthRatio !== undefined && input.hydrationStrengthRatio <= 0) {
    warnings.push("Hydration strength ratio is set to an unusually low value");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
