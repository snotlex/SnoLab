import { MixDesignMethod } from "../../core/MixDesignMethod";
import {
  MixDesignInput,
  CalculationContext,
  MixDesignMethodMetadata,
  ApplicabilityResult,
  ValidationResult,
  MixDesignResult
} from "../../core/types";
import { calculatePerviousMix, checkPerviousApplicability, validatePerviousInputs } from "./perviousMixDesign";

export class PerviousSpecializedMethod implements MixDesignMethod {
  public readonly metadata: MixDesignMethodMetadata = {
    id: "pervious-specialized",
    name: "Pervious Concrete",
    shortName: "Pervious",
    version: "1.0.0",
    description: "Void-structure-based pervious concrete proportioning with aggregate bulk-density and paste-volume control.",
    references: ["NRMCA Pervious Concrete: Guideline to Mixture Proportioning", "ACI PRC-522-23"],
    supportedLanguages: ["ar", "fr", "en"],
    status: "active"
  };

  public isApplicable(input: MixDesignInput, _context: CalculationContext): ApplicabilityResult {
    return checkPerviousApplicability(input);
  }

  public validateInputs(input: MixDesignInput, _context: CalculationContext): ValidationResult {
    return validatePerviousInputs(input, "ar");
  }

  public calculate(input: MixDesignInput, _context: CalculationContext): MixDesignResult {
    return calculatePerviousMix(input, "ar");
  }
}

export const perviousSpecializedMethod = new PerviousSpecializedMethod();
