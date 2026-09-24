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
  calculateRccMix,
  checkRccApplicability,
  validateRccInputs
} from "./rccMixDesign";

export class RccSpecializedMethod implements MixDesignMethod {
  public readonly metadata: MixDesignMethodMetadata = {
    id: "rcc-specialized",
    name: "Roller-Compacted Concrete (RCC)",
    shortName: "RCC",
    version: "1.0.0",
    description: "Laboratory moisture-density-driven RCC proportioning using optimum moisture content, maximum dry density, cementitious content and aggregate mass split.",
    references: [
      "FHWA HIF-16-003 Roller-Compacted Concrete Pavement",
      "ACI 327R Roller-Compacted Concrete Pavements"
    ],
    supportedLanguages: ["ar", "fr", "en"],
    status: "active"
  };

  public isApplicable(input: MixDesignInput, _context: CalculationContext): ApplicabilityResult {
    return checkRccApplicability(input);
  }

  public validateInputs(input: MixDesignInput, _context: CalculationContext): ValidationResult {
    return validateRccInputs(input, "ar");
  }

  public calculate(input: MixDesignInput, _context: CalculationContext): MixDesignResult {
    return calculateRccMix(input, "ar");
  }
}

export const rccSpecializedMethod = new RccSpecializedMethod();