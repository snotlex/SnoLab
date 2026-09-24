import { MixDesignMethod } from "../../core/MixDesignMethod";
import {
  MixDesignInput,
  CalculationContext,
  MixDesignMethodMetadata,
  ApplicabilityResult,
  ValidationResult,
  MixDesignResult
} from "../../core/types";
import { calculateSccMix, checkSccApplicability, validateSccInputs } from "./sccMixDesign";

export class SccSpecializedMethod implements MixDesignMethod {
  public readonly metadata: MixDesignMethodMetadata = {
    id: "scc-specialized",
    name: "SCC / Self-Compacting Concrete",
    shortName: "SCC",
    version: "1.0.0",
    description: "Specialized volume-based SCC proportioning with EFNARC-oriented fresh-concrete verification requirements.",
    references: ["EFNARC European Guidelines for Self-Compacting Concrete"],
    supportedLanguages: ["ar", "fr", "en"],
    status: "active"
  };

  public isApplicable(input: MixDesignInput, _context: CalculationContext): ApplicabilityResult {
    return checkSccApplicability(input);
  }

  public validateInputs(input: MixDesignInput, _context: CalculationContext): ValidationResult {
    return validateSccInputs(input, "ar");
  }

  public calculate(input: MixDesignInput, _context: CalculationContext): MixDesignResult {
    return calculateSccMix(input, "ar");
  }
}

export const sccSpecializedMethod = new SccSpecializedMethod();
