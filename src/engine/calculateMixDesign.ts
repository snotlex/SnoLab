import { MixDesignInput, MixDesignResult } from "../mix-design/core/types";
import { mixDesignEngine } from "../mix-design/core/MixDesignEngine";
import { selectConcreteMixDesignRoute } from "../mix-design/core/concreteMixDesignSelector";
import { normalizeMixDesignResult } from "../mix-design/shared/resultNormalization";
import { getMixDesignContract } from "../mix-design/core/mixDesignContracts";

function containsNonFiniteNumber(value: unknown): boolean {
  if (typeof value === "number") return !Number.isFinite(value);
  if (Array.isArray(value)) return value.some(containsNonFiniteNumber);
  if (value && typeof value === "object") return Object.values(value).some(containsNonFiniteNumber);
  return false;
}

function sanitizeNonFinite<T>(value: T): T {
  if (typeof value === "number" && !Number.isFinite(value)) return undefined as T;
  if (Array.isArray(value)) return value.map(item => sanitizeNonFinite(item)) as T;
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitizeNonFinite(item)])) as T;
  return value;
}

function blockedInputResult(input: MixDesignInput): MixDesignResult {
  return {
    method: { id: "blocked-input-validation", name: "Input validation gate", version: "1.0" },
    methodId: "blocked-input-validation",
    methodName: "Input validation gate",
    status: "blocked",
    calculationStatus: "blocked",
    engineStatus: "blocked",
    confidenceLevel: "low",
    inputSnapshot: sanitizeNonFinite(input),
    quantities: { totalBinder: 0, effectiveWater: 0, addedWater: 0, fineAggregates: 0, coarseAggregates: 0, admixtures: [] },
    ratios: { waterBinderRatio: 0 },
    physicalProperties: { theoreticalFreshDensity: 0, absoluteVolume: 0, volumeClosureError: 0 },
    validation: { isValid: false, errors: [{ code: "non_finite_input", severity: "error", field: "input", message: "Input contains NaN or Infinity." }], warnings: [] },
    warnings: [],
    trace: [],
    calculatedAt: new Date().toISOString(),
    trialMixRequired: true
  } as MixDesignResult;
}

/** Unified mix-design router with concrete-specific automatic routing. */
export function calculateMixDesign(input: MixDesignInput): MixDesignResult {
  if (containsNonFiniteNumber(input)) return blockedInputResult(input);
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
