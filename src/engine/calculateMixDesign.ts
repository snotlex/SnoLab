import { MixDesignInput, MixDesignResult } from "../mix-design/core/types";
import { mixDesignEngine } from "../mix-design/core/MixDesignEngine";
import { selectConcreteMixDesignRoute } from "../mix-design/core/concreteMixDesignSelector";

/**
 * Unified mix-design router.
 *
 * When methodId is absent, SnoLab now performs conservative automatic routing
 * from concreteType to the registered method. This keeps Dreux-Gorisse as the
 * active baseline for its supported families while preventing specialized
 * concrete from being silently calculated by an unrelated method.
 */
export function calculateMixDesign(input: MixDesignInput): MixDesignResult {
  const autoRoute = selectConcreteMixDesignRoute(input, "auto");
  const requestedMethodId = input.methodId;
  const methodId =
    !requestedMethodId ||
    (requestedMethodId === "dreux-gorisse" && autoRoute.mode === "specialized" && autoRoute.support === "active")
      ? "auto"
      : requestedMethodId;

  const result = mixDesignEngine.calculate({
    methodId,
    input,
    context: { language: "ar" }
  });

  // Legacy consumers and reports use the top-level methodName field.
  // Keep it synchronized even when a specialized strategy only populates
  // the structured method metadata.
  result.methodName = result.methodName || result.method?.name || methodId;
  return result;
}
