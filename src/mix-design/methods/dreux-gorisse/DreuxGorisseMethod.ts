import { MixDesignMethod } from "../../core/MixDesignMethod";
import {
  MixDesignInput,
  CalculationContext,
  MixDesignMethodMetadata,
  ApplicabilityResult,
  ValidationResult,
  MixDesignResult
} from "../../core/types";
import { DREUX_GORISSE_METADATA } from "./dreuxGorisseConstants";
import { checkDreuxGorisseApplicability } from "./dreuxGorisseApplicability";
import { validateDreuxGorisseInputs } from "./dreuxGorisseValidation";
import { calculateDreuxGorisse } from "./dreuxGorisseCalculation";

/**
 * Strategy implementation of the Dreux-Gorisse Mix Design method.
 */
export class DreuxGorisseMethod implements MixDesignMethod {
  public readonly metadata: MixDesignMethodMetadata = DREUX_GORISSE_METADATA;

  public isApplicable(
    input: MixDesignInput,
    context: CalculationContext
  ): ApplicabilityResult {
    return checkDreuxGorisseApplicability(input);
  }

  public validateInputs(
    input: MixDesignInput,
    context: CalculationContext
  ): ValidationResult {
    return validateDreuxGorisseInputs(input, context.language);
  }

  public calculate(
    input: MixDesignInput,
    context: CalculationContext
  ): MixDesignResult {
    return calculateDreuxGorisse(input, context.language);
  }
}
export const dreuxGorisseMethod = new DreuxGorisseMethod();
