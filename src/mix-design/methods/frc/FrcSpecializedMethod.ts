import { MixDesignMethod } from "../../core/MixDesignMethod";
import { MixDesignInput, CalculationContext, MixDesignMethodMetadata, ApplicabilityResult, ValidationResult, MixDesignResult } from "../../core/types";
import { calculateFrcMix, checkFrcApplicability, validateFrcInputs } from "./frcMixDesign";

export class FrcSpecializedMethod implements MixDesignMethod {
  public readonly metadata: MixDesignMethodMetadata = {
    id: "fiber-reinforced-specialized",
    name: "Fiber-Reinforced Concrete",
    shortName: "FRC",
    version: "1.0.0",
    description: "Fiber-explicit initial proportioning with absolute-volume closure, fiber volume/mass control and mandatory fresh/hardened performance verification.",
    references: [
      "ACI 544.4R Guide to Design with Fiber-Reinforced Concrete",
      "EN 14651 Metallic fiber concrete — Measuring the flexural tensile strength"
    ],
    supportedLanguages: ["ar", "fr", "en"],
    status: "active"
  };

  public isApplicable(input: MixDesignInput, _context: CalculationContext): ApplicabilityResult {
    return checkFrcApplicability(input);
  }

  public validateInputs(input: MixDesignInput, _context: CalculationContext): ValidationResult {
    return validateFrcInputs(input, "ar");
  }

  public calculate(input: MixDesignInput, _context: CalculationContext): MixDesignResult {
    return calculateFrcMix(input, "ar");
  }
}

export const frcSpecializedMethod = new FrcSpecializedMethod();
