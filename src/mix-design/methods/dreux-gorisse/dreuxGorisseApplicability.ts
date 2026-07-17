import { MixDesignInput, ApplicabilityResult } from "../../core/types";

/**
 * Evaluates whether the Dreux-Gorisse mix design method is applicable for the given inputs.
 */
export function checkDreuxGorisseApplicability(
  input: MixDesignInput
): ApplicabilityResult {
  const reasons: string[] = [];
  let level: "applicable" | "limited" | "not_applicable" = "applicable";

  const slump = input.slump || 0;
  const fck = input.fck28 || 0;

  if (fck > 50) {
    level = "limited";
    reasons.push("Dreux-Gorisse method is historically validated for standard and reinforced concrete up to 50 MPa. High-Performance Concrete (HPC) requires special formulas.");
  }
  if (slump >= 20) {
    level = "limited";
    reasons.push("High slump values (>20 cm) may lead to segregation or require specialized Self-Consolidating Concrete (SCC) design.");
  }

  return {
    level,
    reasons
  };
}
