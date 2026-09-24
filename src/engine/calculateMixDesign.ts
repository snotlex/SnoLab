import { MixDesignInput, MixDesignResult } from "../mix-design/core/types";
import { mixDesignEngine } from "../mix-design/core/MixDesignEngine";

/**
 * Unified mix-design router.
 *
 * When methodId is absent, SnoLab now performs conservative automatic routing
 * from concreteType to the registered method. This keeps Dreux-Gorisse as the
 * active baseline for its supported families while preventing specialized
 * concrete from being silently calculated by an unrelated method.
 */
export function calculateMixDesign(input: MixDesignInput): MixDesignResult {
  const methodId = input.methodId || "auto";

  return mixDesignEngine.calculate({
    methodId,
    input,
    context: { language: "ar" }
  });
}
