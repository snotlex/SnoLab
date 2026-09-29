import { MixDesignInput, MixDesignResult } from "../mix-design/core/types";
import { mixDesignEngine } from "../mix-design/core/MixDesignEngine";
import { selectConcreteMixDesignRoute } from "../mix-design/core/concreteMixDesignSelector";
import { normalizeMixDesignResult } from "../mix-design/shared/resultNormalization";
import { getMixDesignContract } from "../mix-design/core/mixDesignContracts";

/** Unified mix-design router with concrete-specific automatic routing. */
export function calculateMixDesign(input: MixDesignInput): MixDesignResult {
  const autoRoute = selectConcreteMixDesignRoute(input, "auto");
  const requestedMethodId = input.methodId;
  const methodId =
    !requestedMethodId ||
    (requestedMethodId === "dreux-gorisse" && autoRoute.mode === "specialized" && autoRoute.support === "active")
      ? "auto"
      : requestedMethodId;

  const result = normalizeMixDesignResult(mixDesignEngine.calculate({
    methodId,
    input,
    context: { language: "ar", strict: false }
  }), input) as MixDesignResult;

  const methodLabels: Record<string, string> = {
    "dreux-gorisse": "Dreux-Gorisse",
    "rcc-specialized": "RCC / BCR Specialized",
    "scc-specialized": "SCC / Self-Compacting Concrete",
    "hsc-hpc-specialized": "HSC / HPC Specialized",
    "lwc-specialized": "Lightweight Concrete Specialized",
    "hwc-specialized": "Heavyweight Concrete Specialized",
    "pervious-specialized": "Pervious Concrete Specialized",
    "uhpc-specialized": "UHPC / BFUP Specialized",
    "fiber-reinforced-specialized": "Fiber-Reinforced Concrete Specialized",
    "geopolymer-specialized": "Geopolymer Concrete Specialized",
    "recycled-aggregate-specialized": "Recycled Aggregate Concrete Specialized",
    "self-healing-specialized": "Self-Healing Concrete Specialized",
    "shotcrete-specialized": "Shotcrete Specialized"
  };
  const structuredName = result.method?.name;
  result.methodName = result.methodName && result.methodName !== "auto" && result.methodName !== result.methodId
    ? result.methodName
    : methodLabels[result.methodId] || structuredName || result.methodId || methodId;

  const contract = getMixDesignContract(autoRoute.concreteType);
  if (contract) {
    result.calculationMethod = contract.methodId;
    result.engineVersion = result.method?.version;
    result.engineeringFramework = contract.engineeringFramework;
    result.trialMixRequired = contract.trialMixRequired;
  }
  return result;
}
