import {
  MixDesignInput,
  CalculationContext,
  MixDesignMethodMetadata,
  ApplicabilityResult,
  ValidationResult,
  MixDesignResult
} from "./types";

export interface MixDesignMethod {
  readonly metadata: MixDesignMethodMetadata;

  isApplicable(
    input: MixDesignInput,
    context: CalculationContext
  ): ApplicabilityResult;

  validateInputs(
    input: MixDesignInput,
    context: CalculationContext
  ): ValidationResult;

  calculate(
    input: MixDesignInput,
    context: CalculationContext
  ): MixDesignResult;
}
