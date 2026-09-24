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
  calculateHwcMix,
  checkHwcApplicability,
  validateHwcInputs
} from "./hwcMixDesign";

export class HwcSpecializedMethod implements MixDesignMethod {
  public readonly metadata: MixDesignMethodMetadata = {
    id: "heavyweight-specialized",
    name: "Heavyweight Concrete",
    shortName: "HWC",
    version: "1.0.0",
    description: "Heavyweight concrete proportioning using target density, heavyweight aggregate density, volume split, and moisture correction.",
    references: [
      "ACI PRC-304.3-20 Heavyweight Concrete: Measuring, Mixing, Transporting and Placing",
      "ACI PRC-211.1 Guide for Selecting Proportions for Normal-Density and High-Density Concrete"
    ],
    supportedLanguages: ["ar", "fr", "en"],
    status: "active"
  };

  public isApplicable(input: MixDesignInput, _context: CalculationContext): ApplicabilityResult {
    return checkHwcApplicability(input);
  }

  public validateInputs(input: MixDesignInput, _context: CalculationContext): ValidationResult {
    return validateHwcInputs(input, "ar");
  }

  public calculate(input: MixDesignInput, _context: CalculationContext): MixDesignResult {
    return calculateHwcMix(input, "ar");
  }
}

export const hwcSpecializedMethod = new HwcSpecializedMethod();