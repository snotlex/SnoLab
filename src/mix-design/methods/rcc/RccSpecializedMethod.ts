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
    name: "Roller-Compacted Concrete",
    shortName: "RCC / BCR",
    version: "1.0.0",
    description:
      "RCC starting proportioning based on optimum moisture, maximum dry density, cementitious content, aggregate blend and moisture correction; laboratory compaction and strength verification remain mandatory.",
    references: [
      "FHWA-HIF-16-003 Roller-Compacted Concrete Pavement",
      "ASTM C1170/C1170M",
      "ASTM C1435/C1435M"
    ],
    supportedLanguages: ["ar", "fr", "en"],
    status: "active"
  };

  public isApplicable(
    input: MixDesignInput,
    _context: CalculationContext
  ): ApplicabilityResult {
    return checkRccApplicability(input);
  }

  public validateInputs(
    input: MixDesignInput,
    _context: CalculationContext
  ): ValidationResult {
    return validateRccInputs(input, "ar");
  }

  public calculate(
    input: MixDesignInput,
    _context: CalculationContext
  ): MixDesignResult {
    return calculateRccMix(input, "ar");
  }
}

export const rccSpecializedMethod = new RccSpecializedMethod();
