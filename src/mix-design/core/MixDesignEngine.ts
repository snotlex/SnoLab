import { MixDesignRequest, MixDesignResult, CalculationContext, MixDesignInput } from "./types";
import { MixDesignMethodRegistry } from "./MixDesignMethodRegistry";
import { MethodValidationException, MethodNotFoundException, UnsupportedMethodVersionError } from "./errors";

export class MixDesignEngine {
  private registry: MixDesignMethodRegistry;

  constructor(registry?: MixDesignMethodRegistry) {
    this.registry = registry || MixDesignMethodRegistry.getInstance();
  }

  /**
   * Executes mix design calculation after validation, routing to the correct registered strategy.
   * Seamlessly handles legacy inputs lacking a methodId by defaulting to 'dreux-gorisse'.
   */
  public calculate(request: MixDesignRequest): MixDesignResult {
    // 1. Migrate / default legacy projects that don't contain methodId to 'dreux-gorisse'
    const methodId = request.methodId || "dreux-gorisse";
    const context = request.context || { language: "ar" };
    const input = request.input;

    // 2. Fetch the corresponding strategy from our registry, with compatibility support
    if (!this.registry.has(methodId)) {
      if (context.strict) {
        throw new MethodNotFoundException(methodId);
      }
      return {
        methodId,
        status: "not-supported",
        category: "complete-design",
        implementationStatus: "not-implemented",
        isStandaloneCompleteMethod: false,
        warnings: ["This mix design method is not supported."],
        assumptions: [],
        calculationSteps: [],
        limitations: [],
        isValid: false,
        valid: false,
        errors: ["Method not supported."]
      } as any;
    }

    const method = this.registry.get(methodId);

    // 3. Apply actual methodVersion verification
    if (request.methodVersion && request.methodVersion !== method.metadata.version) {
      throw new UnsupportedMethodVersionError(
        methodId,
        request.methodVersion,
        method.metadata.version
      );
    }

    // 4. Call isApplicable() before validateInputs() and calculate()
    const applicability = method.isApplicable(input, context);

    // 5. Perform strategy-specific input validation
    const validation = method.validateInputs(input, context);

    // 6. Handle validation errors.
    // Prevent calculation if there are any validation errors (critical errors)
    const criticalErrors = validation.errors.filter(e => e.severity === "error");
    if (criticalErrors.length > 0) {
      if (context.strict) {
        throw new MethodValidationException(criticalErrors);
      }
      return {
        methodId,
        methodVersion: method.metadata.version,
        status: "not-supported",
        category: "complete-design",
        implementationStatus: "complete",
        isStandaloneCompleteMethod: true,
        isValid: false,
        valid: false,
        errors: validation.errors.map(e => e.message),
        warnings: validation.warnings.map(w => w.message),
        cementKg: 0,
        waterKg: 0,
        fineAggregateKg: 0,
        coarseAggregateKg: 0,
        admixtureKg: 0,
        airContentPercent: 0,
        wcRatio: 0,
        freshDensityKgM3: 0,
        absoluteVolumeCheck: 0,
        assumptions: [],
        compliance: {
          standardName: "EN 206",
          waterCementRatioLimitOk: false,
          minimumCementLimitOk: false,
          airContentLimitOk: false,
          admixtureDosageLimitOk: false,
          cementClassStrengthOk: false
        },
        standardsCompliance: {
          waterCementRatioLimitOk: false,
          minimumCementLimitOk: false,
          airContentLimitOk: false,
          admixtureDosageLimitOk: false,
          cementClassStrengthOk: false
        }
      } as any;
    }

    // 7. Execute computation
    const result = method.calculate(input, context);

    // Ensure calculationMethod id and version are populated with each result
    result.method = {
      id: method.metadata.id,
      name: method.metadata.name,
      version: method.metadata.version
    };

    return result;
  }

  /**
   * Safe migration utility for project objects loaded from state or local storage.
   */
  public migrateProject(project: any): any {
    if (!project) return project;
    
    const updatedInputs = {
      ...project.inputs,
      methodId: project.inputs?.methodId || "dreux-gorisse",
      selectedMethod: project.inputs?.selectedMethod || "dreux"
    };

    return {
      ...project,
      methodId: project.methodId || "dreux-gorisse",
      methodVersion: project.methodVersion || "1.0.0",
      inputs: updatedInputs,
      calculationMethod: {
        id: project.calculationMethod?.id || project.methodId || "dreux-gorisse",
        version: project.calculationMethod?.version || "1.0.0"
      }
    };
  }
}
export const mixDesignEngine = new MixDesignEngine();
