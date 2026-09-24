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
  calculateHscHpcMix,
  checkHscHpcApplicability,
  validateHscHpcInputs
} from "./hscHpcMixDesign";

export class HscHpcSpecializedMethod implements MixDesignMethod {
  public readonly metadata: MixDesignMethodMetadata = {
    id: "hsc-hpc-specialized",
    name: "HSC / HPC Specialized Mix Design",
    shortName: "HSC/HPC",
    version: "1.0.0",
    description: "High-strength/high-performance starting proportioning using water-binder, SCM, superplasticizer and absolute-volume controls, followed by mandatory trial-batch verification.",
    references: [
      "ACI PRC-211.4-08",
      "FHWA-RD-03-060 Concrete Mixture Optimization Using Statistical Methods"
    ],
    supportedLanguages: ["ar", "fr", "en"],
    status: "active"
  };

  public isApplicable(input: MixDesignInput, _context: CalculationContext): ApplicabilityResult {
    return checkHscHpcApplicability(input);
  }

  public validateInputs(input: MixDesignInput, _context: CalculationContext): ValidationResult {
    return validateHscHpcInputs(input, "ar");
  }

  public calculate(input: MixDesignInput, _context: CalculationContext): MixDesignResult {
    return calculateHscHpcMix(input, "ar");
  }
}

export const hscHpcSpecializedMethod = new HscHpcSpecializedMethod();
