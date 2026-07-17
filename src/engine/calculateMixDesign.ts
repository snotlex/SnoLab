import { MixDesignInput, MixDesignResult } from "./types";
import { mixDesignEngine } from "../mix-design/core/MixDesignEngine";

/**
 * Solid unified router for Concrete Mix Design computation.
 * Orchestrates calculating proportions, analyzing packing curves, and evaluating criteria.
 */
export function calculateMixDesign(input: MixDesignInput): MixDesignResult {
  const methodId = input.methodId || "dreux-gorisse";

  return mixDesignEngine.calculate({
    methodId,
    input,
    context: { language: "ar" }
  });
}
