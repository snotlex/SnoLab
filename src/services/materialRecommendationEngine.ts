/**
 * SnoLab Smart Engineering Material Recommendation Engine
 * 
 * Orchestrates intelligent engineering material recommendations based on:
 * Concrete Type + Mix Design Method + Project Requirements (Strength, Workability, Slump, Exposure, Dmax, Density).
 * 
 * Core Architectural Mandate:
 * "SnoLab suggests, does not impose" (SnoLab يقترح ولا يفرض).
 * Project Data -> Engineering Analysis -> Material Recommendations -> Explain Recommendation -> [قبول الاقتراح] / [رفض].
 * 
 * In accordance with:
 * - ACI 211.1-22 & ACI 301
 * - EN 206 / NF EN 12620 / Dreux-Gorisse
 * - AFGC-UHPC & RILEM TC
 */

import { EngineeringMaterial, MixDesignInput, AggregateType, AggregateQuality } from "../types";
import { 
  SupportedMaterialRole, 
  normalizeMaterialRole, 
  MATERIAL_PROPERTY_SCHEMAS,
  MaterialPropertyDefinition
} from "./materialPropertySchema";
export type { SupportedMaterialRole };
import { 
  determineMaterialRequirements, 
  MaterialRequirementPlan, 
  MaterialRoleRequirement, 
  ProjectRequirementsInput 
} from "./materialRequirementEngine";
import { 
  evaluateMaterialCompatibility, 
  MaterialCompatibilityResult, 
  ScoringContext 
} from "./materialCompatibilityEngine";
export type { MaterialCompatibilityResult };
import { isMaterialEligible, MaterialEligibilityResult } from "./materialEligibilityService";
import { isUserMaterial } from "../engine/suitabilityGate";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface RecommendationDecisionRecord {
  id: string;
  projectId?: string;
  role: SupportedMaterialRole;
  materialId: string;
  materialName: string;
  materialCategory: string;
  isSystem: boolean;
  action: "accept" | "reject";
  compatibilityScore: number;
  reason?: string;
  timestamp: string;
  context: {
    concreteType: string;
    mixDesignMethod: string;
    targetStrength?: number;
  };
}

export interface CandidateNeedsData {
  material: EngineeringMaterial;
  role: SupportedMaterialRole;
  potentialScore: number;
  missingProperties: string[];
  missingPropertyDefinitions: MaterialPropertyDefinition[];
  pendingApproval: boolean;
  notesAr: string;
  notesEn: string;
}

export interface SelectionAssessment {
  materialId: string;
  material: EngineeringMaterial | null;
  role: SupportedMaterialRole;
  isCompliant: boolean;
  compatibilityScore: number;
  tier: "recommended" | "alternative" | "not_eligible";
  eligibility: MaterialEligibilityResult | null;
  statusLabelAr: string;
  statusLabelEn: string;
  warnings: string[];
  isSuperiorAlternativeAvailable: boolean;
  superiorCandidateName?: string;
  superiorScoreDifference?: number;
}

export interface RoleRecommendationGroup {
  roleRequirement: MaterialRoleRequirement;
  role: SupportedMaterialRole;
  topCandidate: MaterialCompatibilityResult | null;
  recommended: MaterialCompatibilityResult[];
  alternatives: MaterialCompatibilityResult[];
  needsData: CandidateNeedsData[];
  ineligible: MaterialCompatibilityResult[];
  userRejectedCandidates: MaterialCompatibilityResult[];
  hasEligibleCandidate: boolean;
  roleStatus: "satisfied" | "warning_missing_mandatory" | "optional_unassigned" | "forbidden_excluded";
  currentSelectionAssessment?: SelectionAssessment;
}

export interface ProjectDataSufficiency {
  isSufficient: boolean;
  missingParameters: Array<{
    key: string;
    labelAr: string;
    labelEn: string;
    recommendationAr: string;
    recommendationEn: string;
  }>;
  warnings: string[];
}

export interface RecommendationPlanResult {
  requirementPlan: MaterialRequirementPlan;
  roleGroups: Record<SupportedMaterialRole, RoleRecommendationGroup>;
  recommendedSet: Partial<Record<SupportedMaterialRole, EngineeringMaterial>>;
  overallCompatibilityScore: number;
  isReadyForMix: boolean;
  missingMandatoryRoles: string[];
  globalWarnings: string[];
  summaryAr: string;
  summaryEn: string;
  summaryFr: string;
  dataSufficiency: ProjectDataSufficiency;
  evaluatedMaterialsCount: number;
  eligibleMaterialsCount: number;
}

// ============================================================================
// DECISION AUDIT & LOGGING REPOSITORY (localStorage backed with quota recovery)
// ============================================================================

const DECISIONS_STORAGE_KEY_PREFIX = "snolab_material_recommendation_decisions_";

/**
 * Normalizes any project reference (string, object, or nested ID) into a clean, safe string ID.
 * Prevents invalid tokens like "[object Object]".
 */
export function normalizeProjectId(projectOrId: any): string {
  if (!projectOrId) return "default";
  if (typeof projectOrId === "string") {
    const trimmed = projectOrId.trim();
    if (!trimmed || trimmed === "[object Object]" || trimmed === "undefined" || trimmed === "null") {
      return "default";
    }
    return trimmed;
  }
  if (typeof projectOrId === "object" && projectOrId !== null) {
    if (typeof projectOrId.id === "string" && projectOrId.id.trim()) {
      return normalizeProjectId(projectOrId.id);
    }
    if (typeof projectOrId.id === "object" && projectOrId.id !== null) {
      return normalizeProjectId(projectOrId.id);
    }
    if (typeof projectOrId.projectId === "string" && projectOrId.projectId.trim()) {
      return normalizeProjectId(projectOrId.projectId);
    }
    if (typeof projectOrId.name === "string" && projectOrId.name.trim()) {
      return projectOrId.name.trim();
    }
  }
  return "default";
}

// In-memory fallback cache to ensure zero data loss and uninterrupted UI operation if storage is full
const inMemoryDecisionsCache = new Map<string, RecommendationDecisionRecord[]>();

/**
 * Proactively cleans up corrupted keys (like [object Object]) or temporary caches
 * to recover local storage quota when needed.
 */
function cleanupCorruptedOrDisposableStorage(): void {
  if (typeof localStorage === "undefined") return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.includes("[object Object]") || k.startsWith("snolab_material_recommendation_decisions_[object"))) {
        keysToRemove.push(k);
      }
    }
    for (const k of keysToRemove) {
      try {
        localStorage.removeItem(k);
      } catch {}
    }

    // Also remove non-critical search query caches if quota is tight
    const disposableKeys = [
      "snolab_working_project_cache",
      "system_material_searchQuery",
      "user_material_searchQuery"
    ];
    for (const k of disposableKeys) {
      try {
        localStorage.removeItem(k);
      } catch {}
    }
  } catch {}
}

// Initial sweep to purge any corrupted legacy keys immediately
if (typeof localStorage !== "undefined") {
  try {
    cleanupCorruptedOrDisposableStorage();
  } catch {}
}

/**
 * Resiliently persists decisions to localStorage, gracefully handling QuotaExceededError
 */
function safePersistDecisions(pId: string, decisions: RecommendationDecisionRecord[]): void {
  // Always update in-memory cache first
  inMemoryDecisionsCache.set(pId, decisions);

  if (typeof localStorage === "undefined") return;

  const key = `${DECISIONS_STORAGE_KEY_PREFIX}${pId}`;

  try {
    localStorage.setItem(key, JSON.stringify(decisions));
  } catch (err: any) {
    const isQuotaExceeded =
      err?.name === "QuotaExceededError" ||
      err?.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
      err?.code === 22 ||
      err?.code === 1014 ||
      (typeof err?.message === "string" && err.message.toLowerCase().includes("quota"));

    if (isQuotaExceeded) {
      try {
        cleanupCorruptedOrDisposableStorage();
        // Try saving a compacted slice of recent decisions
        const compacted = decisions.slice(0, 20);
        localStorage.setItem(key, JSON.stringify(compacted));
      } catch (retryErr) {
        // Graceful fallback to memory without crashing or emitting unhandled exceptions
        console.warn(`[SafeStorage] localStorage quota reached for decisions (${pId}); retained in memory session.`);
      }
    } else {
      console.warn("Could not save recommendation decision to localStorage:", err);
    }
  }
}

export function saveProjectRecommendationDecisions(projectId: any = "default", decisions: RecommendationDecisionRecord[]): void {
  const pId = normalizeProjectId(projectId);
  safePersistDecisions(pId, decisions);
}

export function getProjectRecommendationDecisions(projectId: any = "default"): RecommendationDecisionRecord[] {
  const pId = normalizeProjectId(projectId);
  try {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(`${DECISIONS_STORAGE_KEY_PREFIX}${pId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const mem = inMemoryDecisionsCache.get(pId) || [];
          if (mem.length > 0) {
            const combined = [...mem, ...parsed.filter(p => !mem.some(m => m.id === p.id))];
            return combined.slice(0, 50);
          }
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn("Failed to load recommendation decisions from localStorage:", err);
  }
  return inMemoryDecisionsCache.get(pId) || [];
}

export function recordProjectRecommendationDecision(record: RecommendationDecisionRecord): void {
  try {
    const pId = normalizeProjectId(record.projectId);
    const cleanRecord: RecommendationDecisionRecord = {
      ...record,
      projectId: pId,
      context: {
        concreteType: String(record.context?.concreteType || "NSC"),
        mixDesignMethod: String(record.context?.mixDesignMethod || "dreux"),
        targetStrength: typeof record.context?.targetStrength === "number" ? record.context.targetStrength : undefined
      }
    };
    const existing = getProjectRecommendationDecisions(pId);
    // Filter out previous decisions for the same role and material to avoid duplicates
    const updated = [cleanRecord, ...existing.filter(d => !(d.role === cleanRecord.role && d.materialId === cleanRecord.materialId))].slice(0, 50);
    safePersistDecisions(pId, updated);
  } catch (err) {
    console.warn("Failed to save recommendation decision:", err);
  }
}

export function clearProjectRecommendationDecisions(projectId: any = "default"): void {
  const pId = normalizeProjectId(projectId);
  inMemoryDecisionsCache.delete(pId);
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(`${DECISIONS_STORAGE_KEY_PREFIX}${pId}`);
      // Also scrub any legacy [object Object] keys if present
      localStorage.removeItem(`${DECISIONS_STORAGE_KEY_PREFIX}[object Object]`);
    }
  } catch (err) {
    console.warn("Failed to clear recommendation decisions:", err);
  }
}

export function getRoleUserDecisions(projectId: any = "default"): {
  accepted: Partial<Record<SupportedMaterialRole, string>>;
  rejected: Partial<Record<SupportedMaterialRole, string[]>>;
} {
  const pId = normalizeProjectId(projectId);
  const decisions = getProjectRecommendationDecisions(pId);
  const accepted: Partial<Record<SupportedMaterialRole, string>> = {};
  const rejected: Partial<Record<SupportedMaterialRole, string[]>> = {};

  for (const d of decisions) {
    if (d.action === "accept") {
      if (!accepted[d.role]) {
        accepted[d.role] = d.materialId;
      }
    } else if (d.action === "reject") {
      if (!rejected[d.role]) {
        rejected[d.role] = [];
      }
      if (!rejected[d.role]!.includes(d.materialId)) {
        rejected[d.role]!.push(d.materialId);
      }
    }
  }

  return { accepted, rejected };
}

// ============================================================================
// DATA SUFFICIENCY CHECK
// ============================================================================

export function checkProjectDataSufficiency(inputs: ProjectRequirementsInput): ProjectDataSufficiency {
  const missing: ProjectDataSufficiency["missingParameters"] = [];
  const warnings: string[] = [];

  if (!inputs.concreteType) {
    missing.push({
      key: "concreteType",
      labelAr: "نوع الخرسانة",
      labelEn: "Concrete Type",
      recommendationAr: "يرجى تحديد نوع الخرسانة (مثل NSC, HSC, SCC, FRC, UHPC) لتطبيق اشتراطات الكود المناسبة.",
      recommendationEn: "Please specify the concrete type (e.g. NSC, HSC, SCC, FRC, UHPC)."
    });
  }

  const fck = Number(inputs.targetStrength);
  if (!fck || fck <= 0) {
    missing.push({
      key: "targetStrength",
      labelAr: "المقاومة المستهدفة (fc28 / fck)",
      labelEn: "Target Strength (fc28 / fck)",
      recommendationAr: "يرجى إدخال قيمة المقاومة التصميمية المستهدفة لترشيح رتبة الإسمنت المناسبة.",
      recommendationEn: "Please enter the target design compressive strength."
    });
  }

  const dMax = Number(inputs.maxAggregateSize);
  if (!dMax || dMax <= 0) {
    warnings.push("لم يتم تحديد القطر الأقصى للبحص Dmax بدقة، سيتم افتراض 20 مم افتراضياً.");
  }

  if (inputs.slumpCm === undefined || inputs.slumpCm === null) {
    warnings.push("لم يتم إدخال الهبوط المطلوب بدقة، سيتم تطبيق هبوط قياسي للمنشآت العامة.");
  }

  return {
    isSufficient: missing.length === 0,
    missingParameters: missing,
    warnings
  };
}

// ============================================================================
// MAIN RECOMMENDATION ENGINE FUNCTION
// ============================================================================

/**
 * Generates engineering-grade material recommendations based on:
 * Concrete Type + Mix Design Method + Target Strength + Slump + Exposure + Dmax.
 * Strictly respects user decisions (Accept / Reject) without imposing changes.
 */
export function generateMaterialRecommendations(
  materialsDatabase: EngineeringMaterial[],
  inputs: ProjectRequirementsInput & {
    selectedCementId?: string;
    selectedSandId?: string;
    selectedGravelId?: string;
    selectedWaterId?: string;
    selectedAdmixtureId?: string;
    selectedScmId?: string;
    selectedFiberId?: string;
    selectedSpecialBinderId?: string;
    selectedLightweightAggregateId?: string;
    selectedHeavyweightAggregateId?: string;
  },
  activeProject?: any,
  userDecisionsOverride?: {
    accepted?: Partial<Record<SupportedMaterialRole, string>>;
    rejected?: Partial<Record<SupportedMaterialRole, string[]>>;
  }
): RecommendationPlanResult {
  const pId = normalizeProjectId(activeProject);
  const storedDecisions = getRoleUserDecisions(pId);
  const userDecisions = userDecisionsOverride || storedDecisions;

  const dataSufficiency = checkProjectDataSufficiency(inputs);
  const requirementPlan = determineMaterialRequirements(inputs);
  const concreteType = requirementPlan.concreteType;
  const method = requirementPlan.mixDesignMethod;

  const scoringContext: ScoringContext = {
    concreteType,
    mixDesignMethod: method,
    targetStrength: requirementPlan.targetStrength,
    slumpCm: inputs.slumpCm,
    exposureClass: requirementPlan.exposureClass,
    maxAggregateSize: requirementPlan.maxAggregateSize,
    targetDensity: inputs.targetDensity,
    hasPumping: inputs.hasPumping,
    activeProject
  };

  const roleGroups: Partial<Record<SupportedMaterialRole, RoleRecommendationGroup>> = {};
  const recommendedSet: Partial<Record<SupportedMaterialRole, EngineeringMaterial>> = {};
  const missingMandatoryRoles: string[] = [];
  const globalWarnings: string[] = [...dataSufficiency.warnings];

  let totalScoreSum = 0;
  let evaluatedRolesCount = 0;
  let totalEvaluatedMaterialsCount = 0;
  let totalEligibleMaterialsCount = 0;

  // Currently selected materials mapping
  const currentSelections: Partial<Record<SupportedMaterialRole, string>> = {
    cement: inputs.selectedCementId,
    sand: inputs.selectedSandId,
    gravel: inputs.selectedGravelId,
    water: inputs.selectedWaterId,
    admixture: inputs.selectedAdmixtureId,
    scm: inputs.selectedScmId,
    fiber: inputs.selectedFiberId,
    specialBinder: inputs.selectedSpecialBinderId,
    lightweightAggregate: inputs.selectedLightweightAggregateId,
    heavyweightAggregate: inputs.selectedHeavyweightAggregateId
  };

  // Evaluate each defined role in the requirement plan
  for (const req of requirementPlan.roles) {
    const role = req.role;
    const roleRejectedIds = userDecisions.rejected?.[role] || [];

    if (req.requirementType === "forbidden") {
      roleGroups[role] = {
        roleRequirement: req,
        role,
        topCandidate: null,
        recommended: [],
        alternatives: [],
        needsData: [],
        ineligible: [],
        userRejectedCandidates: [],
        hasEligibleCandidate: false,
        roleStatus: "forbidden_excluded"
      };
      continue;
    }

    // 1. Filter candidates for this role from the materials repository
    const candidateMaterials = materialsDatabase.filter(m => {
      if (!m) return false;
      const mRole = normalizeMaterialRole(m.category || m.type);
      if (mRole === role) return true;

      // Category matching aliases
      if (role === "cement" && (m.category === "إسمنت" || m.category === "مجلدات خاصة")) return true;
      if (role === "sand" && m.category === "رمال") return true;
      if (role === "gravel" && ["حصى", "ركام", "ركام معاد تدويره"].includes(m.category)) return true;
      if (role === "water" && (m.category === "ماء" || m.type === "water")) return true;
      if (role === "admixture" && (m.category === "إضافات كيميائية" || m.type === "admixture")) return true;
      if (role === "scm" && (m.category === "إضافات معدنية" || m.type === "scm")) return true;
      if (role === "fiber" && (m.category === "ألياف" || m.type === "fiber")) return true;
      if (role === "lightweightAggregate" && (m.category === "ركام خفيف" || (m.name || "").includes("خفيف"))) return true;
      if (role === "heavyweightAggregate" && (m.category === "ركام ثقيل" || (m.name || "").includes("ثقيل"))) return true;
      if (role === "specialBinder" && (m.category === "مجلدات خاصة" || m.category === "إضافات معدنية")) return true;

      return false;
    });

    totalEvaluatedMaterialsCount += candidateMaterials.length;

    // 2. Evaluate compatibility and eligibility for each candidate
    const evaluatedCandidates: MaterialCompatibilityResult[] = [];
    const needsDataCandidates: CandidateNeedsData[] = [];

    for (const mat of candidateMaterials) {
      const comp = evaluateMaterialCompatibility(mat, role, req, scoringContext);
      evaluatedCandidates.push(comp);

      if (comp.eligibility.eligible) {
        totalEligibleMaterialsCount++;
      } else {
        // Check if this material is a strong candidate that just needs missing data
        if (
          !comp.eligibility.incompatibleWithConcreteType &&
          comp.eligibility.missingProperties.length > 0 &&
          comp.eligibility.missingProperties.length <= 4
        ) {
          needsDataCandidates.push({
            material: mat,
            role,
            potentialScore: Math.min(95, comp.compatibilityScore + 35),
            missingProperties: comp.eligibility.missingProperties,
            missingPropertyDefinitions: comp.eligibility.missingPropertyDefinitions,
            pendingApproval: !comp.eligibility.isSystemMaterial && comp.eligibility.approvalStatus !== "Approved",
            notesAr: `تنقص المادة ${comp.eligibility.missingProperties.length} من الخصائص الإلزامية (${comp.eligibility.missingProperties.join(", ")}). استكمالها يرفع توافقها إلى ~${Math.min(95, comp.compatibilityScore + 35)}%.`,
            notesEn: `Missing ${comp.eligibility.missingProperties.length} required properties (${comp.eligibility.missingProperties.join(", ")}). Completing them raises compatibility to ~${Math.min(95, comp.compatibilityScore + 35)}%.`
          });
        }
      }
    }

    // Sort evaluated candidates descending by score
    evaluatedCandidates.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    needsDataCandidates.sort((a, b) => b.potentialScore - a.potentialScore);

    // Split candidates into buckets
    const userRejectedCandidates: MaterialCompatibilityResult[] = [];
    const availableEligibleCandidates: MaterialCompatibilityResult[] = [];
    const ineligibleCandidates: MaterialCompatibilityResult[] = [];

    for (const cand of evaluatedCandidates) {
      const isRejectedByUser = roleRejectedIds.includes(cand.material.id);
      if (isRejectedByUser) {
        userRejectedCandidates.push(cand);
        continue;
      }

      const isCompleteAndReady = 
        cand.eligibility.eligible &&
        cand.eligibility.missingProperties.length === 0 &&
        cand.eligibility.invalidProperties.length === 0 &&
        cand.material.readinessStatus !== "incomplete" &&
        cand.material.readinessStatus !== "draft" &&
        cand.eligibility.lifecycleStatus !== "pending_approval";

      if (isCompleteAndReady) {
        availableEligibleCandidates.push(cand);
      } else {
        ineligibleCandidates.push(cand);
      }
    }

    const recommended = availableEligibleCandidates.filter(c => c.tier === "recommended");
    const alternatives = availableEligibleCandidates.filter(c => c.tier === "alternative" || c.tier === "recommended");

    // Select the Top Candidate (best eligible candidate NOT rejected by the user)
    const topCandidate = availableEligibleCandidates.length > 0 ? availableEligibleCandidates[0] : null;

    let roleStatus: RoleRecommendationGroup["roleStatus"] = "satisfied";
    if (req.requirementType === "mandatory") {
      if (!topCandidate) {
        roleStatus = "warning_missing_mandatory";
        missingMandatoryRoles.push(req.roleLabelAr);
        globalWarnings.push(`لا توجد مادة معتمدة ومكتملة الخصائص للصنف الإلزامي: ${req.roleLabelAr}`);
      } else {
        recommendedSet[role] = topCandidate.material;
        totalScoreSum += topCandidate.compatibilityScore;
        evaluatedRolesCount++;
      }
    } else if (req.requirementType === "optional" || req.requirementType === "conditional") {
      if (topCandidate) {
        recommendedSet[role] = topCandidate.material;
        totalScoreSum += topCandidate.compatibilityScore;
        evaluatedRolesCount++;
      } else {
        roleStatus = "optional_unassigned";
      }
    }

    // 3. Assess Current Selection (if any)
    const currentMatId = currentSelections[role];
    let currentSelectionAssessment: SelectionAssessment | undefined = undefined;

    if (currentMatId) {
      const currentMat = materialsDatabase.find(m => m.id === currentMatId) || null;
      if (currentMat) {
        const curComp = evaluateMaterialCompatibility(currentMat, role, req, scoringContext);
        const scoreDiff = topCandidate ? (topCandidate.compatibilityScore - curComp.compatibilityScore) : 0;
        const isSuperior = topCandidate !== null && topCandidate.material.id !== currentMat.id && scoreDiff >= 8;

        let statusAr = curComp.eligibility.eligible 
          ? (curComp.compatibilityScore >= 80 ? "معتمد ومطابق تماماً للمواصفات" : "مقبول مع توصية بتحسين التوافق")
          : "غير مطابق للشروط / تنقصه خواص معتمدة";
        let statusEn = curComp.eligibility.eligible
          ? (curComp.compatibilityScore >= 80 ? "Certified & Fully Compliant" : "Acceptable with Optimization Potential")
          : "Incompliant / Missing certified properties";

        currentSelectionAssessment = {
          materialId: currentMatId,
          material: currentMat,
          role,
          isCompliant: curComp.eligibility.eligible,
          compatibilityScore: curComp.compatibilityScore,
          tier: curComp.tier,
          eligibility: curComp.eligibility,
          statusLabelAr: statusAr,
          statusLabelEn: statusEn,
          warnings: curComp.warnings,
          isSuperiorAlternativeAvailable: isSuperior,
          superiorCandidateName: isSuperior ? topCandidate?.material.name : undefined,
          superiorScoreDifference: isSuperior ? scoreDiff : undefined
        };
      }
    }

    roleGroups[role] = {
      roleRequirement: req,
      role,
      topCandidate,
      recommended: recommended.slice(0, 3),
      alternatives: alternatives.filter(a => a.material.id !== topCandidate?.material.id),
      needsData: needsDataCandidates,
      ineligible: ineligibleCandidates.slice(0, 5),
      userRejectedCandidates,
      hasEligibleCandidate: availableEligibleCandidates.length > 0,
      roleStatus,
      currentSelectionAssessment
    };
  }

  const overallCompatibilityScore = evaluatedRolesCount > 0 
    ? Math.round(totalScoreSum / evaluatedRolesCount) 
    : 0;

  const isReadyForMix = missingMandatoryRoles.length === 0 && dataSufficiency.isSufficient;

  const summaryAr = isReadyForMix
    ? `تم ترشيح باقة متكاملة ومتوافقة هندسياً بنسبة ${overallCompatibilityScore}% لتصميم خرسانة (${concreteType}) بمقاومة (${requirementPlan.targetStrength} MPa).`
    : `يوجد نقص في ${missingMandatoryRoles.length} من المواد الإلزامية لتصميم خرسانة (${concreteType}). يرجى مراجعة مستودع المواد.`;

  const summaryEn = isReadyForMix
    ? `Generated an engineered material package (${overallCompatibilityScore}% compatibility) for (${concreteType}) mix at ${requirementPlan.targetStrength} MPa.`
    : `Missing ${missingMandatoryRoles.length} mandatory constituent(s) for (${concreteType}) mix design.`;

  const summaryFr = isReadyForMix
    ? `Ensemble de constituants recommandé avec ${overallCompatibilityScore}% de compatibilité pour béton (${concreteType}) ${requirementPlan.targetStrength} MPa.`
    : `Il manque ${missingMandatoryRoles.length} constituant(s) obligatoire(s) pour le béton (${concreteType}).`;

  return {
    requirementPlan,
    roleGroups: roleGroups as Record<SupportedMaterialRole, RoleRecommendationGroup>,
    recommendedSet,
    overallCompatibilityScore,
    isReadyForMix,
    missingMandatoryRoles,
    globalWarnings,
    summaryAr,
    summaryEn,
    summaryFr,
    dataSufficiency,
    evaluatedMaterialsCount: totalEvaluatedMaterialsCount,
    eligibleMaterialsCount: totalEligibleMaterialsCount
  };
}

// ============================================================================
// MATERIAL APPLICATION HELPER (UPON USER ACCEPTANCE)
// ============================================================================

/**
 * Generates the updated MixDesignInput object when an engineer accepts a recommendation.
 * Updates all relevant physical, pricing, and calibration parameters consistently.
 */
export function applyRecommendedMaterialToInputs(
  prevInputs: MixDesignInput,
  role: SupportedMaterialRole,
  material: EngineeringMaterial
): MixDesignInput {
  const updated: MixDesignInput = { ...prevInputs };
  const dens = material.density || material.specificGravity || 0;
  const price = material.price || 0;
  const abs = material.absorption !== undefined ? material.absorption : 0;
  const moist = material.moisture !== undefined ? material.moisture : 0;

  switch (role) {
    case "cement": {
      const parsedStr = material.strengthClass ? parseFloat(String(material.strengthClass)) : undefined;
      const strClass = !isNaN(Number(parsedStr)) ? parsedStr : prevInputs.cementClassStrength;
      updated.selectedCementId = material.id;
      updated.cementType = material.name;
      if (dens > 0) {
        updated.cementDensity = dens > 1000 ? dens : dens * 1000;
      }
      if (strClass !== undefined) {
        updated.cementClassStrength = strClass;
      }
      if (price > 0) updated.priceCement = price;
      break;
    }

    case "sand": {
      updated.selectedSandId = material.id;
      updated.sandType = material.name;
      if (dens > 0) {
        updated.sandRelativeDensity = dens > 10 ? dens / 1000 : dens;
      }
      if (abs !== undefined) updated.sandAbsorption = abs;
      if (moist !== undefined) updated.moistureSand = moist;
      if (material.finenessModulus) updated.finenessModulus = material.finenessModulus;
      if (price > 0) updated.priceSand = price;
      break;
    }

    case "gravel": {
      const shape = material.particleShape === "مكسر" || material.particleShape === "زاوي" 
        ? AggregateType.CONCASSE 
        : AggregateType.ROULE;

      let qualityVal = AggregateQuality.STANDARD;
      if (material.aggregateQuality === "excellent") qualityVal = AggregateQuality.EXCELLENT;
      else if (material.aggregateQuality === "poor") qualityVal = AggregateQuality.POOR;
      else if (material.aggregateQuality === "standard") qualityVal = AggregateQuality.STANDARD;
      else {
        const qStr = String(material.quality || "").toLowerCase();
        if (qStr.includes("excellent") || qStr.includes("ممتاز") || qStr.includes("عالي")) {
          qualityVal = AggregateQuality.EXCELLENT;
        } else if (qStr.includes("poor") || qStr.includes("ضعيف")) {
          qualityVal = AggregateQuality.POOR;
        }
        if (material.losAngelesAbrasion !== undefined) {
          if (material.losAngelesAbrasion < 15) qualityVal = AggregateQuality.EXCELLENT;
          else if (material.losAngelesAbrasion > 30) qualityVal = AggregateQuality.POOR;
        }
      }

      updated.selectedGravelId = material.id;
      updated.gravelType = material.name;
      if (dens > 0) {
        updated.gravelRelativeDensity = dens > 10 ? dens / 1000 : dens;
      }
      if (abs !== undefined) updated.gravelAbsorption = abs;
      if (moist !== undefined) updated.moistureGravel = moist;
      if (material.dMax) updated.dMax = material.dMax;
      updated.aggregateType = shape;
      updated.aggregateQuality = qualityVal;
      if (price > 0) updated.priceGravel = price;
      break;
    }

    case "water": {
      const pH = material.engineeringData?.pH ?? (material as any).pH;
      const chloride = material.engineeringData?.chloride ?? (material as any).chlorideContent;
      const sulphate = material.engineeringData?.sulphate ?? (material as any).sulphateContent;
      const temp = material.engineeringData?.temperature ?? (material as any).temperature;

      updated.selectedWaterId = material.id;
      updated.selectedWaterName = material.name;
      if (pH !== undefined) updated.selectedWaterPH = pH;
      if (chloride !== undefined) updated.selectedWaterChlorideContent = chloride;
      if (sulphate !== undefined) updated.selectedWaterSulphateContent = sulphate;
      if (temp !== undefined) updated.selectedWaterTemperature = temp;
      if (price > 0) updated.priceWater = price;
      break;
    }

    case "admixture": {
      const wr = material.waterReduction;
      updated.selectedAdmixtureId = material.id;
      updated.selectedAdmixtureName = material.name;
      if (dens > 0) {
        updated.selectedAdmixtureDensity = dens > 10 ? dens / 1000 : dens;
      }
      if (wr !== undefined) {
        updated.selectedAdmixtureWaterReduction = wr;
      }
      if (price > 0) updated.priceSuper = price;
      break;
    }

    case "scm": {
      updated.selectedScmId = material.id;
      updated.selectedScmName = material.name;
      if (dens > 0) {
        updated.selectedScmDensity = dens > 100 ? dens : dens * 1000;
      }
      if (price > 0) updated.priceSilicaFume = price;
      break;
    }

    case "fiber": {
      updated.selectedFiberId = material.id;
      updated.selectedFiberName = material.name;
      if (material.fiberType) updated.fiberType = material.fiberType;
      if (dens > 0) {
        updated.fiberDensity = dens > 100 ? dens : dens * 1000;
      }
      if ((material as any).tensileStrength) updated.fiberTensileStrengthMPa = (material as any).tensileStrength;
      if (price > 0) updated.priceFiber = price;
      break;
    }

    case "specialBinder": {
      updated.selectedSpecialBinderId = material.id;
      updated.selectedSpecialBinderName = material.name;
      if (dens > 0) {
        updated.specialBinderDensity = dens > 100 ? dens : dens * 1000;
      }
      if (price > 0) updated.priceSpecialBinder = price;
      break;
    }

    case "lightweightAggregate": {
      updated.selectedLightweightAggregateId = material.id;
      updated.selectedLightweightAggregateName = material.name;
      if (dens > 0) updated.lightweightAggregateDensity = dens;
      if (abs !== undefined) updated.lightweightAggregateAbsorption = abs;
      if (moist !== undefined) updated.lightweightAggregateMoisture = moist;
      break;
    }

    case "heavyweightAggregate": {
      updated.selectedHeavyweightAggregateId = material.id;
      updated.selectedHeavyweightAggregateName = material.name;
      if (dens > 0) updated.heavyweightAggregateDensity = dens;
      if (abs !== undefined) updated.heavyweightAggregateAbsorption = abs;
      if (moist !== undefined) updated.heavyweightAggregateMoisture = moist;
      break;
    }
  }

  return updated;
}
