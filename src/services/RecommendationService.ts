import { 
  MaterialCoreRecord, 
  MaterialCategoryUnified 
} from "../types/materialCoreTypes";
import { EligibilityService, MixDesignContext, EligibilityResult } from "./EligibilityService";
import { MixDesignInput } from "../types";
import { MaterialService } from "./MaterialService";

export interface MaterialCandidateRecommendation {
  material: MaterialCoreRecord;
  evaluation: EligibilityResult;
  rank: number;
  isTopChoice: boolean;
  recommendationType: "RECOMMENDED" | "ALTERNATIVE" | "NOT_ELIGIBLE";
  summaryReasonAr: string;
  summaryReasonEn: string;
}

export interface CategoryRecommendationReport {
  category: MaterialCategoryUnified;
  recommended: MaterialCandidateRecommendation | null;
  alternatives: MaterialCandidateRecommendation[];
  notEligible: MaterialCandidateRecommendation[];
}

/**
 * Deterministic Engineering Material Recommendation Engine
 * Combines eligibility criteria, engineering suitability scoring, and target optimization.
 */
export class RecommendationService {
  private static userDecisionLog: Array<{
    materialId: string;
    action: "ACCEPTED" | "REJECTED";
    timestamp: string;
    context: MixDesignContext;
  }> = [];

  /**
   * Evaluates all candidates in a category and ranks them.
   */
  public static recommendForCategory(
    materials: MaterialCoreRecord[],
    category: MaterialCategoryUnified,
    context: MixDesignContext
  ): CategoryRecommendationReport {
    const candidates = materials.filter(m => m.category === category);
    const evaluated: MaterialCandidateRecommendation[] = [];

    for (const mat of candidates) {
      const evalRes = EligibilityService.evaluateEligibility(mat, category, context);

      evaluated.push({
        material: mat,
        evaluation: evalRes,
        rank: 0,
        isTopChoice: false,
        recommendationType: evalRes.isEligible ? "ALTERNATIVE" : "NOT_ELIGIBLE",
        summaryReasonAr: evalRes.reasonsAr.join(" • ") || "مستوفي للمواصفات",
        summaryReasonEn: evalRes.reasonsEn.join(" • ") || "Meets specifications"
      });
    }

    // Separate eligible from non-eligible
    const eligibleList = evaluated.filter(e => e.evaluation.isEligible);
    const notEligibleList = evaluated.filter(e => !e.evaluation.isEligible);

    // Sort eligible descending by score
    eligibleList.sort((a, b) => b.evaluation.score - a.evaluation.score);

    // Rank candidates
    eligibleList.forEach((item, index) => {
      item.rank = index + 1;
      if (index === 0) {
        item.isTopChoice = true;
        item.recommendationType = "RECOMMENDED";
      } else {
        item.recommendationType = "ALTERNATIVE";
      }
    });

    const recommended = eligibleList.length > 0 ? eligibleList[0] : null;
    const alternatives = eligibleList.length > 1 ? eligibleList.slice(1) : [];

    return {
      category,
      recommended,
      alternatives,
      notEligible: notEligibleList
    };
  }

  /**
   * Logs an engineering decision (Accept or Reject).
   */
  public static recordDecision(
    materialId: string, 
    action: "ACCEPTED" | "REJECTED", 
    context: MixDesignContext
  ): void {
    RecommendationService.userDecisionLog.push({
      materialId,
      action,
      timestamp: new Date().toISOString(),
      context
    });
  }

  /**
   * Retrieves full audit history of recommendations.
   */
  public static getDecisionHistory(): Array<{
    materialId: string;
    action: "ACCEPTED" | "REJECTED";
    timestamp: string;
    context: MixDesignContext;
  }> {
    return [...RecommendationService.userDecisionLog];
  }

  public static getAuditTrail() {
    return RecommendationService.getDecisionHistory();
  }

  /**
   * Strictly applies an approved and eligible material to mix design inputs.
   * Disallows silent engineering fallbacks (such as 3100, 2650, 2.6, 20).
   * If a required property is missing, the application is rejected and existing mix inputs are preserved.
   */
  public static applyRecommendationToMixInputs(
    material: MaterialCoreRecord,
    currentInputs: MixDesignInput,
    _context?: MixDesignContext
  ): {
    success: boolean;
    updatedInputs: MixDesignInput;
    missingProperties: string[];
    errorMessageAr?: string;
    errorMessageEn?: string;
  } {
    if (!material) {
      return {
        success: false,
        updatedInputs: currentInputs,
        missingProperties: ["material"],
        errorMessageAr: "المادة غير محددة.",
        errorMessageEn: "Material is not specified."
      };
    }

    const category = material.category;

    if (category === "CEMENT") {
      const rawSg = MaterialService.getMaterialPropertyValue(material, "PROP-SPECIFIC-GRAVITY") ?? MaterialService.getMaterialPropertyValue(material, "PROP-DENSITY");
      const numSg = typeof rawSg === "number" ? rawSg : (rawSg ? parseFloat(String(rawSg)) : NaN);
      
      if (isNaN(numSg) || numSg <= 0) {
        return {
          success: false,
          updatedInputs: currentInputs,
          missingProperties: ["specificGravity / density"],
          errorMessageAr: `فشل تطبيق التوصية: خاصية الكثافة/الوزن النوعي غير متوفرة في مادة الإسمنت (${material.name}).`,
          errorMessageEn: `Failed to apply recommendation: Density / Specific Gravity missing in cement (${material.name}).`
        };
      }

      // Convert to standard relative density if in kg/m³
      const cementDensity = numSg > 10 ? numSg : numSg * 1000;
      const cementClass = MaterialService.getMaterialPropertyValue(material, "PROP-CEM-CLASS");

      return {
        success: true,
        updatedInputs: {
          ...currentInputs,
          cementDensity,
          cementType: cementClass ? String(cementClass) : currentInputs.cementType
        },
        missingProperties: []
      };
    }

    if (category === "SAND") {
      const rawSg = MaterialService.getMaterialPropertyValue(material, "PROP-SPECIFIC-GRAVITY") ?? MaterialService.getMaterialPropertyValue(material, "PROP-DENSITY");
      const rawAbs = MaterialService.getMaterialPropertyValue(material, "PROP-ABSORPTION");
      const rawFm = MaterialService.getMaterialPropertyValue(material, "PROP-FM");

      const missing: string[] = [];
      const numSg = typeof rawSg === "number" ? rawSg : (rawSg ? parseFloat(String(rawSg)) : NaN);
      const numAbs = typeof rawAbs === "number" ? rawAbs : (rawAbs !== undefined && rawAbs !== null && rawAbs !== "" ? parseFloat(String(rawAbs)) : NaN);
      const numFm = typeof rawFm === "number" ? rawFm : (rawFm !== undefined && rawFm !== null && rawFm !== "" ? parseFloat(String(rawFm)) : NaN);

      if (isNaN(numSg) || numSg <= 0) missing.push("density / specificGravity");
      if (isNaN(numAbs) || numAbs < 0) missing.push("absorption");
      if (isNaN(numFm) || numFm <= 0) missing.push("finenessModulus");

      if (missing.length > 0) {
        return {
          success: false,
          updatedInputs: currentInputs,
          missingProperties: missing,
          errorMessageAr: `فشل تطبيق التوصية: تنقص رمل (${material.name}) خصائص أساسية بدون قيم بديلة: ${missing.join(", ")}.`,
          errorMessageEn: `Failed to apply recommendation: Sand (${material.name}) missing required properties: ${missing.join(", ")}.`
        };
      }

      const sandRelativeDensity = numSg > 10 ? numSg / 1000 : numSg;

      return {
        success: true,
        updatedInputs: {
          ...currentInputs,
          sandRelativeDensity,
          sandAbsorption: numAbs,
          finenessModulus: numFm
        },
        missingProperties: []
      };
    }

    if (category === "GRAVEL") {
      const rawSg = MaterialService.getMaterialPropertyValue(material, "PROP-SPECIFIC-GRAVITY") ?? MaterialService.getMaterialPropertyValue(material, "PROP-DENSITY");
      const rawAbs = MaterialService.getMaterialPropertyValue(material, "PROP-ABSORPTION");
      const rawDmax = MaterialService.getMaterialPropertyValue(material, "PROP-DMAX");

      const missing: string[] = [];
      const numSg = typeof rawSg === "number" ? rawSg : (rawSg ? parseFloat(String(rawSg)) : NaN);
      const numAbs = typeof rawAbs === "number" ? rawAbs : (rawAbs !== undefined && rawAbs !== null && rawAbs !== "" ? parseFloat(String(rawAbs)) : NaN);
      const numDmax = typeof rawDmax === "number" ? rawDmax : (rawDmax !== undefined && rawDmax !== null && rawDmax !== "" ? parseFloat(String(rawDmax)) : NaN);

      if (isNaN(numSg) || numSg <= 0) missing.push("density / specificGravity");
      if (isNaN(numAbs) || numAbs < 0) missing.push("absorption");
      if (isNaN(numDmax) || numDmax <= 0) missing.push("dMax");

      if (missing.length > 0) {
        return {
          success: false,
          updatedInputs: currentInputs,
          missingProperties: missing,
          errorMessageAr: `فشل تطبيق التوصية: تنقص حصى (${material.name}) خصائص أساسية بدون قيم بديلة: ${missing.join(", ")}.`,
          errorMessageEn: `Failed to apply recommendation: Gravel (${material.name}) missing required properties: ${missing.join(", ")}.`
        };
      }

      const gravelRelativeDensity = numSg > 10 ? numSg / 1000 : numSg;

      return {
        success: true,
        updatedInputs: {
          ...currentInputs,
          gravelRelativeDensity,
          gravelAbsorption: numAbs,
          dMax: numDmax
        },
        missingProperties: []
      };
    }

    // Other categories do not alter aggregate/cement core mix inputs directly
    return {
      success: true,
      updatedInputs: currentInputs,
      missingProperties: []
    };
  }
}
