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
      "ACI PRC-544.3-08, Guide for Specifying, Proportioning, and Production of Fiber-Reinforced Concrete (reapproved 2023; formula-level comparison pending)",
      "BS EN 14651:2005+A1:2007, metallic fibre concrete flexural tensile strength test (test method, not a mix-design equation)",
      "ASTM C1116/C1116M-23, fiber-reinforced concrete specification (edition and project applicability to be confirmed)"
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
