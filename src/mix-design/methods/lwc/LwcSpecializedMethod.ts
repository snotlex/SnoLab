import { MixDesignMethod } from "../../core/MixDesignMethod";
import {
  MixDesignInput,
  CalculationContext,
  MixDesignMethodMetadata,
  ApplicabilityResult,
  ValidationResult,
  MixDesignResult
} from "../../core/types";
import {
  calculateLwcMix,
  checkLwcApplicability,
  validateLwcInputs
} from "./lwcMixDesign";

export class LwcSpecializedMethod implements MixDesignMethod {
  public readonly metadata: MixDesignMethodMetadata = {
    id: "lightweight-specialized",
    name: "Structural Lightweight Concrete",
    shortName: "LWC",
    version: "1.0.0",
    description: "ACI-211.2-oriented lightweight concrete proportioning with target density, lightweight-aggregate absorption and controlled prewetting.",
    references: [
      "ACI 211.2 Standard Practice for Selecting Proportions for Structural Lightweight Concrete"
    ],
    supportedLanguages: ["ar", "fr", "en"],
    status: "active"
  };

  public isApplicable(input: MixDesignInput, _context: CalculationContext): ApplicabilityResult {
    return checkLwcApplicability(input);
  }

  public validateInputs(input: MixDesignInput, _context: CalculationContext): ValidationResult {
    return validateLwcInputs(input, "ar");
  }

  public calculate(input: MixDesignInput, _context: CalculationContext): MixDesignResult {
    return calculateLwcMix(input, "ar");
  }
}

export const lwcSpecializedMethod = new LwcSpecializedMethod();
