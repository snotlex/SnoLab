import { MixDesignRequest, MixDesignResult, CalculationContext, MixDesignInput } from "./types";
import { MixDesignMethodRegistry } from "./MixDesignMethodRegistry";
import { MethodValidationException, MethodNotFoundException, UnsupportedMethodVersionError } from "./errors";
import { selectConcreteMixDesignRoute } from "./concreteMixDesignSelector";

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
    const requestedMethodId = request.methodId || "auto";
    const context = request.context || { language: "ar" };
    const input = request.input;
    const route = selectConcreteMixDesignRoute(input, requestedMethodId);
    const methodId = route.methodId;
    const isAutomaticRoute = requestedMethodId === "auto";

    // Automatic routing is deliberately conservative: if SnoLab does not yet
    // have the specialized engine for the concrete family, do not silently
    // substitute Dreux-Gorisse and present the output as a final design.
    if (isAutomaticRoute && route.support !== "active") {
      return this.buildUnavailableRouteResult(input, route, context.language);
    }

    // An explicit method selection remains respected, but the method's own
    // applicability gate below decides whether that method is physically valid.
    // This keeps expert/manual workflows possible without making auto-routing
    // falsely claim that every concrete family is a Dreux-Gorisse design.

    // Fetch the corresponding strategy from our registry.
    if (!this.registry.has(methodId)) {
      if (context.strict) {
        throw new MethodNotFoundException(methodId);
      }
      return this.buildUnavailableMethodResult(
        input,
        methodId,
        route,
        context.language
      );
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

    // Call isApplicable() before validateInputs() and calculate().
    const applicability = method.isApplicable(input, context);
    const applicabilityView = {
      applicable: applicability.level === "applicable",
      level: applicability.level,
      reasons: applicability.reasons || [],
      recommendations: applicability.recommendations || []
    };

    // A method explicitly marked not_applicable is never allowed to emit a
    // numerical mix design.
    if (applicability.level === "not_applicable") {
      return this.buildBlockedApplicabilityResult(
        input,
        methodId,
        method.metadata.version,
        applicabilityView,
        context.language
      );
    }

    // Perform strategy-specific input validation
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
    result.methodApplicability = applicabilityView;

    if (applicability.level === "limited") {
      result.calculationStatus = "needs_trial_mix";
      result.engineStatus = "needs_trial_mix";
      result.warnings = [
        ...(result.warnings || []),
        "The selected method is limited for this concrete type; the numerical result is preliminary and requires laboratory trial-mix verification."
      ];
      result.calculationNotes = [
        ...(result.calculationNotes || []),
        ...applicabilityView.reasons,
        ...applicabilityView.recommendations
      ];
    }

    return result;
  }


  private buildUnavailableRouteResult(
    input: MixDesignInput,
    route: ReturnType<typeof selectConcreteMixDesignRoute>,
    language: "ar" | "fr" | "en"
  ): MixDesignResult {
    const message =
      language === "fr"
        ? `Le type de béton ${route.concreteType} nécessite ${route.nameFr}. Cette méthode spécialisée n'est pas encore activée dans SnoLab; aucun dosage Dreux-Gorisse de substitution n'est présenté comme résultat final.`
        : language === "en"
          ? `Concrete type ${route.concreteType} requires ${route.nameEn}. The specialized method is not yet enabled in SnoLab, so no Dreux-Gorisse substitute is presented as a final design.`
          : `نوع الخرسانة ${route.concreteType} يتطلب ${route.nameAr}. المحرك المتخصص غير مفعل بعد في SnoLab، لذلك لن يعرض النظام حساب درو-غوريس كتصميم نهائي بديل.`;

    return {
      methodId: route.methodId,
      status: "not-supported",
      category: "complete-design",
      implementationStatus: "needs-engineering-review",
      isStandaloneCompleteMethod: false,
      method: { id: route.methodId, name: route.nameEn, version: "planned" },
      inputSnapshot: input,
      quantities: {
        totalBinder: 0,
        effectiveWater: 0,
        addedWater: 0,
        fineAggregates: 0,
        coarseAggregates: 0,
        admixtures: []
      },
      ratios: { waterBinderRatio: 0 },
      physicalProperties: {
        theoreticalFreshDensity: 0,
        absoluteVolume: 0,
        volumeClosureError: 100
      },
      validation: {
        isValid: false,
        errors: [{
          code: "SPECIALIZED_METHOD_REQUIRED",
          severity: "error",
          field: "concreteType",
          message
        }],
        warnings: []
      },
      warnings: [message],
      internalWarnings: [],
      trace: [],
      calculatedAt: new Date().toISOString(),
      assumptions: [],
      calculationSteps: [],
      limitations: [route.reasonEn],
      isValid: false,
      valid: false,
      errors: ["specialized_method_required"],
      recommendations: [route.reasonAr, route.reasonFr, route.reasonEn],
      calculationStatus: "blocked",
      engineStatus: "blocked",
      confidenceLevel: "preliminary",
      calculationNotes: [
        route.reasonAr,
        route.reasonFr,
        route.reasonEn
      ],
      methodApplicability: {
        applicable: false,
        level: "not_applicable",
        reasons: [route.reasonAr],
        recommendations: [route.reasonAr]
      }
    } as any;
  }

  private buildUnavailableMethodResult(
    input: MixDesignInput,
    methodId: string,
    route: ReturnType<typeof selectConcreteMixDesignRoute>,
    language: "ar" | "fr" | "en"
  ): MixDesignResult {
    const message =
      language === "fr"
        ? `La méthode de dosage '${methodId}' n'est pas actuellement enregistrée dans SnoLab.`
        : language === "en"
          ? `Mix design method '${methodId}' is not currently registered in SnoLab.`
          : `طريقة تصميم الخلطات '${methodId}' غير مسجلة حاليًا في SnoLab.`;

    return this.buildUnavailableRouteResult(input, {
      ...route,
      methodId
    }, language);
  }

  private buildBlockedApplicabilityResult(
    input: MixDesignInput,
    methodId: string,
    version: string,
    applicability: {
      applicable: boolean;
      level: "applicable" | "limited" | "not_applicable";
      reasons: string[];
      recommendations: string[];
    },
    language: "ar" | "fr" | "en"
  ): MixDesignResult {
    const message =
      language === "fr"
        ? `La méthode ${methodId} n'est pas applicable au type de béton sélectionné; aucun dosage numérique n'est présenté comme résultat final.`
        : language === "en"
          ? `Method ${methodId} is not applicable to the selected concrete type; no numerical mix is presented as a final design.`
          : `طريقة ${methodId} غير مناسبة لنوع الخرسانة المختار؛ لن يتم تقديم أي خلطة رقمية كتصميم نهائي.`;

    return {
      methodId,
      status: "not-supported",
      category: "complete-design",
      implementationStatus: "needs-engineering-review",
      isStandaloneCompleteMethod: false,
      method: { id: methodId, name: methodId, version },
      inputSnapshot: input,
      quantities: {
        totalBinder: 0,
        effectiveWater: 0,
        addedWater: 0,
        fineAggregates: 0,
        coarseAggregates: 0,
        admixtures: []
      },
      ratios: { waterBinderRatio: 0 },
      physicalProperties: {
        theoreticalFreshDensity: 0,
        absoluteVolume: 0,
        volumeClosureError: 100
      },
      validation: {
        isValid: false,
        errors: [{
          code: "METHOD_NOT_APPLICABLE",
          severity: "error",
          field: "concreteType",
          message
        }],
        warnings: []
      },
      warnings: [...applicability.reasons, ...applicability.recommendations],
      internalWarnings: [],
      trace: [],
      calculatedAt: new Date().toISOString(),
      assumptions: [],
      calculationSteps: [],
      limitations: applicability.reasons,
      isValid: false,
      valid: false,
      errors: ["method_not_applicable"],
      recommendations: applicability.recommendations,
      methodApplicability: applicability,
      calculationStatus: "blocked",
      engineStatus: "blocked",
      confidenceLevel: "preliminary",
      calculationNotes: applicability.reasons
    } as any;
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
