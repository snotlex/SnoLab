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
  calculateUhpcBfupMix,
  checkUhpcBfupApplicability,
  validateUhpcBfupInputs
} from "./uhpcBfupMixDesign";

export class UhpcBfupSpecializedMethod implements MixDesignMethod {
  public readonly metadata: MixDesignMethodMetadata = {
    id: "uhpc-specialized",
    name: "UHPC / BFUP Specialized Mix Design",
    shortName: "UHPC/BFUP",
    version: "1.0.0",
    description: "Particle-packing and low-water-binder specialized proportioning for UHPC/BFUP with silica fume, quartz powder, high-range water reducer and steel-fiber volume control.",
    references: [
      "ACI 239R-18 Ultra-High-Performance Concrete",
      "AFGC Recommendations for Ultra-High Performance Fibre-Reinforced Concrete"
    ],
    supportedLanguages: ["ar", "fr", "en"],
    status: "active"
  };

  public isApplicable(input: MixDesignInput, _context: CalculationContext): ApplicabilityResult {
    return checkUhpcBfupApplicability(input);
  }

  public validateInputs(input: MixDesignInput, _context: CalculationContext): ValidationResult {
    return validateUhpcBfupInputs(input, "ar");
  }

  public calculate(input: MixDesignInput, _context: CalculationContext): MixDesignResult {
    return calculateUhpcBfupMix(input, "ar");
  }
}

export const uhpcBfupSpecializedMethod = new UhpcBfupSpecializedMethod();
