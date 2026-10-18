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
    references: [
      "EFNARC European Guidelines for Self-Compacting Concrete, May 2005 (guidance; this implementation is EFNARC-oriented, not verified as an exact published equation set)",
      "ACI PRC-237-07, Self-Consolidating Concrete (reapproved 2019; guidance reference)",
      "ASTM C1611/C1611M-21, slump-flow test method for self-consolidating concrete (test method, not a mix-design equation)"
    ],
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
