import { 
  MaterialCoreRecord, 
  MaterialCategoryUnified 
} from "../types/materialCoreTypes";
import { EligibilityService, MixDesignContext, EligibilityResult } from "./EligibilityService";

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
}
