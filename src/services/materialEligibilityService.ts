/**
 * SnoLab Central Material Eligibility & Governance Service
 * 
 * Rules:
 * 1. Mix Preparation (تحضير الخلطة) ONLY displays & accepts materials where:
 *    Complete (100% required properties) + Validated (all values in range) + Engineer Approved + Context-Compatible.
 * 2. Any material with missing properties, pending validation, pending approval, or rejected status
 *    is STRICTLY excluded from the selection dropdown in Mix Preparation.
 * 3. Single Source of Truth for eligibility checking across the entire application.
 * 4. Automatic invalidation of engineer approval when essential technical properties are mutated.
 */

import { EngineeringMaterial } from "../types";
import { 
  MATERIAL_PROPERTY_SCHEMAS, 
  MaterialPropertyDefinition, 
  SupportedMaterialRole, 
  normalizeMaterialRole, 
  getMaterialPropValue 
} from "./materialPropertySchema";
import { CONCRETE_TYPE_CONFIGS } from "../concreteTypes";
import { isUserMaterial } from "../utils/materialSourceHelper";
import { isMaterialApprovedByEngineer } from "./materialApprovalService";
import { MaterialService } from "./MaterialService";

export type MaterialLifecycleStatus =
  | "incomplete"
  | "pending_validation"
  | "validated"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "ready_for_mix";

export interface MaterialEligibilityResult {
  eligible: boolean;
  lifecycleStatus: MaterialLifecycleStatus;
  materialId: string;
  materialName: string;
  englishName?: string;
  category: string;
  role: SupportedMaterialRole;
  isSystemMaterial: boolean;
  isUserMaterial: boolean;
  approvalStatus: "Approved" | "Pending Review" | "Pending Approval" | "Draft" | "Rejected" | "Archived" | "Certified" | string;
  engineerApproval?: {
    status: "pending" | "approved" | "rejected";
    engineerName?: string;
    approvalDate?: string;
    notes?: string;
  };
  missingProperties: string[];
  missingPropertyDefinitions: MaterialPropertyDefinition[];
  invalidProperties: Array<{
    key: string;
    definition?: MaterialPropertyDefinition;
    value: any;
    errorAr?: string;
    errorEn?: string;
    errorFr?: string;
  }>;
  incompatibleWithConcreteType: boolean;
  incompatibilityReasonAr?: string;
  incompatibilityReasonEn?: string;
  incompatibilityReasonFr?: string;
  reasonsAr: string[];
  reasonsEn: string[];
  reasonsFr: string[];
}

/**
 * List of essential engineering properties whose alteration MUST invalidate previous approval
 */
export const CRITICAL_ENGINEERING_PROPERTIES = [
  "density",
  "specificGravity",
  "ssdDensity",
  "bulkDensity",
  "absorption",
  "moisture",
  "finenessModulus",
  "dMax",
  "sandEquivalent",
  "methyleneBlue",
  "losAngeles",
  "microDeval",
  "flakinessIndex",
  "elongationIndex",
  "strengthClass",
  "strength28d",
  "initialSetting",
  "finalSetting",
  "blaineFineness",
  "soundness",
  "admixtureType",
  "solidContent",
  "waterReduction",
  "recommendedDosage",
  "maxDosage",
  "ph",
  "pozzolanicIndex",
  "fiberType",
  "tensileStrength",
  "aspectRatio"
];

// ============================================================================
// CENTRAL ELIGIBILITY EVALUATION FUNCTION
// ============================================================================

/**
 * Evaluates whether a material is 100% eligible for use in Mix Preparation.
 * Strict: Requires 100% completeness of required properties + valid values + engineer approval + active state.
 */
export function isMaterialEligible(
  material: EngineeringMaterial | null | undefined,
  mixDesignMethod: string = "dreux",
  concreteType: string = "NSC",
  _project?: any
): MaterialEligibilityResult {
  if (!material) {
    return {
      eligible: false,
      lifecycleStatus: "incomplete",
      materialId: "",
      materialName: "",
      category: "",
      role: "other",
      isSystemMaterial: false,
      isUserMaterial: false,
      approvalStatus: "Draft",
      missingProperties: [],
      missingPropertyDefinitions: [],
      invalidProperties: [],
      incompatibleWithConcreteType: false,
      reasonsAr: ["المادة غير موجودة أو فارغة."],
      reasonsEn: ["Material does not exist or is undefined."],
      reasonsFr: ["Le matériau n'existe pas ou est non défini."]
    };
  }

  const role = normalizeMaterialRole(material.category || material.type);
  const isUser = isUserMaterial(material);
  const isSystem = !isUser;

  const rawApproval = String(
    material.ApprovalStatus || 
    (material as any).approvalStatus || 
    (material as any).certificationStatus || 
    "Draft"
  ).trim();

  const statusStr = String(material.status || (material as any).Status || "نشط").toLowerCase();
  const isArchived = statusStr === "archived" || statusStr === "موقوف" || rawApproval.toLowerCase() === "archived";
  const isDraft = rawApproval.toLowerCase() === "draft" || statusStr === "draft";
  const isExplicitlyRejected = rawApproval.toLowerCase() === "rejected" || statusStr === "rejected";

  const reasonsAr: string[] = [];
  const reasonsEn: string[] = [];
  const reasonsFr: string[] = [];

  // Check 1: Archived or Soft-Deleted
  if (isArchived) {
    return {
      eligible: false,
      lifecycleStatus: "rejected",
      materialId: material.id,
      materialName: material.name,
      englishName: material.englishName,
      category: material.category || "",
      role,
      isSystemMaterial: isSystem,
      isUserMaterial: isUser,
      approvalStatus: "Archived",
      missingProperties: [],
      missingPropertyDefinitions: [],
      invalidProperties: [],
      incompatibleWithConcreteType: false,
      reasonsAr: ["المادة مؤرشفة أو موقوفة عن الاستخدام."],
      reasonsEn: ["Material is archived or suspended from use."],
      reasonsFr: ["Le matériau est archivé ou suspendu."]
    };
  }

  // Check 2: Explicit Rejection
  if (isExplicitlyRejected) {
    return {
      eligible: false,
      lifecycleStatus: "rejected",
      materialId: material.id,
      materialName: material.name,
      englishName: material.englishName,
      category: material.category || "",
      role,
      isSystemMaterial: isSystem,
      isUserMaterial: isUser,
      approvalStatus: "Rejected",
      missingProperties: [],
      missingPropertyDefinitions: [],
      invalidProperties: [],
      incompatibleWithConcreteType: false,
      reasonsAr: ["تم رفض المادة من قبل المهندس المشرف."],
      reasonsEn: ["Material has been rejected by the supervising engineer."],
      reasonsFr: ["Le matériau a été rejeté par l'ingénieur responsable."]
    };
  }

  // Check 3: Concrete Type Compatibility
  const rawCode = typeof concreteType === "string" && concreteType.trim()
    ? concreteType
    : (concreteType as any)?.code || (concreteType as any)?.concreteType || (concreteType as any)?.type || "NSC";
  const concreteCode = String(rawCode || "NSC").toUpperCase();
  const activeConcreteConfig = CONCRETE_TYPE_CONFIGS[concreteCode];
  let incompatibleWithConcreteType = false;
  let incompAr: string | undefined;
  let incompEn: string | undefined;
  let incompFr: string | undefined;

  if (activeConcreteConfig) {
    // Normalized category comparison using standardized roles
    const matRoleNorm = normalizeMaterialRole(material.category || material.type);

    // Check if material category is allowed
    const isCatAllowed = activeConcreteConfig.allowedCategories.some(cat => {
      const allowedRole = normalizeMaterialRole(cat);
      if (allowedRole === matRoleNorm) return true;
      if (matRoleNorm === "cement" && allowedRole === "cement") return true;
      if (matRoleNorm === "sand" && allowedRole === "sand") return true;
      if (["gravel", "lightweight_aggregate", "heavyweight_aggregate", "recycled_aggregate"].includes(matRoleNorm) &&
          ["gravel", "lightweight_aggregate", "heavyweight_aggregate", "recycled_aggregate"].includes(allowedRole)) return true;
      return false;
    });

    if (!isCatAllowed) {
      incompatibleWithConcreteType = true;
      incompAr = `صنف المادة (${material.category}) غير مسموح به في نوع الخرسانة المختار (${concreteCode}).`;
      incompEn = `Material category (${material.category}) is not allowed in selected concrete type (${concreteCode}).`;
      incompFr = `La catégorie (${material.category}) n'est pas autorisée pour le type de béton (${concreteCode}).`;
    } else if (activeConcreteConfig.isMaterialCompatible && !activeConcreteConfig.isMaterialCompatible(material)) {
      incompatibleWithConcreteType = true;
      incompAr = `خصائص المادة غير متوافقة مع المتطلبات الفنية لنوع الخرسانة (${concreteCode}).`;
      incompEn = `Material properties are incompatible with technical requirements of concrete type (${concreteCode}).`;
      incompFr = `Les propriétés du matériau ne sont pas compatibles avec le type de béton (${concreteCode}).`;
    }
  }

  // Check 4: Property Completeness & Validation (100% Required)
  const schemas = MATERIAL_PROPERTY_SCHEMAS[role] || [];
  const missingPropertyDefinitions: MaterialPropertyDefinition[] = [];
  const missingProperties: string[] = [];
  const invalidProperties: Array<{
    key: string;
    definition?: MaterialPropertyDefinition;
    value: any;
    errorAr?: string;
    errorEn?: string;
    errorFr?: string;
  }> = [];

  for (const schema of schemas) {
    const isReq = schema.isRequired(material, mixDesignMethod, concreteType);
    const val = getMaterialPropValue(material, schema.key);

    const hasVal = val !== undefined && val !== null && val !== "" && (
      typeof val === "number" ? !isNaN(val) : String(val).trim() !== ""
    );

    if (isReq && !hasVal) {
      missingProperties.push(schema.key);
      missingPropertyDefinitions.push(schema);
    } else if (hasVal) {
      const validationRes = schema.validate(val, material, mixDesignMethod);
      if (!validationRes.isValid) {
        invalidProperties.push({
          key: schema.key,
          definition: schema,
          value: val,
          errorAr: validationRes.errorAr,
          errorEn: validationRes.errorEn,
          errorFr: validationRes.errorFr
        });
      }
    }
  }

  // Check 4.1: Strict Dreux-Gorisse method requirements (Requirement 11)
  if (mixDesignMethod.toLowerCase().includes("dreux")) {
    if (role === "sand") {
      const hasDens = getMaterialPropValue(material, "density") !== undefined || getMaterialPropValue(material, "specificGravity") !== undefined;
      const fm = getMaterialPropValue(material, "finenessModulus");
      const abs = getMaterialPropValue(material, "absorption");
      if (!hasDens && !missingProperties.includes("density")) {
        missingProperties.push("density");
      }
      if ((fm === undefined || fm === null || fm === "") && !missingProperties.includes("finenessModulus")) {
        missingProperties.push("finenessModulus");
      }
      if ((abs === undefined || abs === null || abs === "") && !missingProperties.includes("absorption")) {
        missingProperties.push("absorption");
      }
    } else if (role === "gravel") {
      const hasDens = getMaterialPropValue(material, "density") !== undefined || getMaterialPropValue(material, "specificGravity") !== undefined;
      const dmax = getMaterialPropValue(material, "dMax");
      if (!hasDens && !missingProperties.includes("density")) {
        missingProperties.push("density");
      }
      if ((dmax === undefined || dmax === null || dmax === "") && !missingProperties.includes("dMax")) {
        missingProperties.push("dMax");
      }
    } else if (role === "cement") {
      const hasDens = getMaterialPropValue(material, "density") !== undefined || getMaterialPropValue(material, "specificGravity") !== undefined;
      const str = getMaterialPropValue(material, "strength28d") || getMaterialPropValue(material, "strengthClass") || getMaterialPropValue(material, "cementClass");
      if (!hasDens && !missingProperties.includes("density")) {
        missingProperties.push("density");
      }
      if (!str && !missingProperties.includes("strengthClass")) {
        missingProperties.push("strengthClass");
      }
    } else if (role === "water") {
      const isContaminated = 
        (material as any).isContaminated === true ||
        (material as any).contaminated === true ||
        String((material as any).quality || "").toLowerCase().includes("contamin") ||
        String((material as any).quality || "").toLowerCase().includes("ملوث");
      if (isContaminated) {
        invalidProperties.push({
          key: "waterQuality",
          value: "contaminated",
          errorAr: "ماء ملوث غير مطابق لمواصفة خلط الخرسانة (EN 1008)"
        });
      }
    }
  }

  // Check 5: Engineer Approval verification
  // Rule: READY IS NOT APPROVED (Requirement 6)
  // System materials are pre-certified standard references.
  // User materials require explicit engineer approval. Completeness does NOT automatically confer approval.
  const isApprovedByEngineer = isSystem ? true : (
    rawApproval === "Approved" || 
    rawApproval === "Certified" || 
    rawApproval === "\u0645\u0639\u062a\u0645\u062f" ||
    rawApproval.toLowerCase() === "approved" ||
    rawApproval.toLowerCase() === "certified" ||
    (material as any).engineerApproval?.status === "approved"
  ) && !isDraft && rawApproval !== "Incomplete" && rawApproval !== "Pending Review" && rawApproval !== "Pending Approval" && rawApproval !== "Draft" && rawApproval !== "\u0642\u064a\u062f \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629";

  const isPendingApproval = !isApprovedByEngineer && (isDraft || rawApproval === "Pending Review" || rawApproval === "Pending Approval" || rawApproval === "قيد المراجعة" || rawApproval === "Incomplete");

  let engineerApprovalRecord = (material as any).engineerApproval;
  if (!engineerApprovalRecord && isApprovedByEngineer) {
    engineerApprovalRecord = {
      status: "approved",
      engineerName: material.createdBy || "Engineer",
      approvalDate: material.approvalDate || material.updatedDate || new Date().toISOString().split("T")[0],
      notes: "معتمد هندسياً للاستخدام في الخلطات"
    };
  }

  // Lifecycle Status Derivation
  let lifecycleStatus: MaterialLifecycleStatus;

  if (missingProperties.length > 0) {
    lifecycleStatus = "incomplete";
    reasonsAr.push(`تنقص المادة ${missingProperties.length} من الخصائص الإلزامية المطلوبة لطريقة (${mixDesignMethod}) ونوع الخرسانة (${concreteCode}).`);
    reasonsEn.push(`Material is missing ${missingProperties.length} required properties for method (${mixDesignMethod}) and concrete (${concreteCode}).`);
    reasonsFr.push(`Il manque ${missingProperties.length} propriétés obligatoires pour la méthode (${mixDesignMethod}).`);
  } else if (invalidProperties.length > 0) {
    lifecycleStatus = "pending_validation";
    reasonsAr.push(`توجد ${invalidProperties.length} خاصية خارج النطاق الهندسي المسموح به.`);
    reasonsEn.push(`${invalidProperties.length} properties are outside acceptable engineering ranges.`);
    reasonsFr.push(`${invalidProperties.length} propriétés sont hors des plages admissibles.`);
  } else if (isUser && !isApprovedByEngineer) {
    lifecycleStatus = isPendingApproval ? "pending_approval" : "validated";
    reasonsAr.push("المادة مكتملة وصحيحة ولكنها بانتظار اعتماد المهندس المشرف.");
    reasonsEn.push("Material is complete and valid but pending engineer approval.");
    reasonsFr.push("Matériau complet et valide mais en attente d'approbation par l'ingénieur.");
  } else if (incompatibleWithConcreteType) {
    lifecycleStatus = "validated";
    if (incompAr) reasonsAr.push(incompAr);
    if (incompEn) reasonsEn.push(incompEn);
    if (incompFr) reasonsFr.push(incompFr);
  } else {
    // 100% Complete, Valid, Approved, Compatible, and Active!
    lifecycleStatus = "ready_for_mix";
  }

  // Strict Eligibility Decision:
  // ONLY true if lifecycleStatus === "ready_for_mix"
  const isEligible = (
    lifecycleStatus === "ready_for_mix" &&
    missingProperties.length === 0 &&
    invalidProperties.length === 0 &&
    !incompatibleWithConcreteType &&
    (isSystem ? true : isApprovedByEngineer) &&
    !isArchived &&
    !isExplicitlyRejected
  );

  return {
    eligible: isEligible,
    lifecycleStatus,
    materialId: material.id,
    materialName: material.name,
    englishName: material.englishName,
    category: material.category || "",
    role,
    isSystemMaterial: isSystem,
    isUserMaterial: isUser,
    approvalStatus: isApprovedByEngineer ? "Approved" : (isPendingApproval ? "Pending Review" : rawApproval),
    engineerApproval: engineerApprovalRecord,
    missingProperties,
    missingPropertyDefinitions,
    invalidProperties,
    incompatibleWithConcreteType,
    incompatibilityReasonAr: incompAr,
    incompatibilityReasonEn: incompEn,
    incompatibilityReasonFr: incompFr,
    reasonsAr,
    reasonsEn,
    reasonsFr
  };
}

// ============================================================================
// FILTER ELIGIBLE MATERIALS FOR A GIVEN SELECTION SLOT
// ============================================================================
// CENTRAL ELIGIBILITY GATE FUNCTION (Requirement 12)
// ============================================================================

/**
 * Consolidated Central Eligibility Gate.
 * Evaluates if a material can enter mix design calculations.
 * Used identically across Mix Preparation, Compatibility Engine, and UI selectors.
 */
export function canMaterialEnterMixDesign(
  material: EngineeringMaterial | any | null | undefined,
  mixDesignMethod: string = "dreux",
  concreteType: string = "NSC",
  project?: any
): { eligible: boolean; reasons: string[]; missingProperties: string[]; status: MaterialLifecycleStatus } {
  if (!material) {
    return {
      eligible: false,
      reasons: ["المادة غير محددة."],
      missingProperties: [],
      status: "incomplete"
    };
  }

  // Support transparent bridging from MaterialCoreRecord if passed
  let targetMat: EngineeringMaterial = material;
  if (material.properties && !material.name && (material.categoryUnified || material.category)) {
    try {
      targetMat = MaterialService.toEngineeringMaterial(material);
    } catch {
      targetMat = material;
    }
  }

  const evalResult = isMaterialEligible(targetMat, mixDesignMethod, concreteType, project);
  return {
    eligible: evalResult.eligible,
    reasons: evalResult.reasonsAr,
    missingProperties: evalResult.missingProperties,
    status: evalResult.lifecycleStatus
  };
}

/**
 * Returns materials in repository matching a specific role/category slot that are eligible
 * for use in Mix Preparation (Requirement 14).
 * Raw or incomplete materials that do not pass the eligibility gate are excluded.
 */
export function getAvailableMaterialsForRole(
  materials: EngineeringMaterial[],
  roleOrCategory: string,
  mixDesignMethod: string = "dreux",
  concreteType: string = "NSC",
  project?: any,
  onlyEligible: boolean = true
): EngineeringMaterial[] {
  if (!Array.isArray(materials)) return [];

  const targetRole = normalizeMaterialRole(roleOrCategory);

  return materials.filter(material => {
    if (!material) return false;
    
    const matRole = normalizeMaterialRole(material.category || material.type);
    
    let isRoleMatch = matRole === targetRole;
    if (!isRoleMatch) {
      if (targetRole === "sand" && material.category === "رمال") isRoleMatch = true;
      if ((targetRole === "gravel" || (targetRole as string) === "coarse_aggregate") && ["حصى", "ركام خفيف", "ركام ثقيل", "ركام معاد تدويره"].includes(material.category)) isRoleMatch = true;
      if (targetRole === "cement" && ["إسمنت", "مجلدات خاصة"].includes(material.category)) isRoleMatch = true;
      if (targetRole === "water" && ["ماء", "water"].includes(material.category || material.type)) isRoleMatch = true;
      if (targetRole === "admixture" && ["إضافات كيميائية", "admixture"].includes(material.category || material.type)) isRoleMatch = true;
      if ((targetRole === "scm" || (targetRole as string) === "mineral_addition") && ["إضافات معدنية", "scm"].includes(material.category || material.type)) isRoleMatch = true;
      if (targetRole === "fiber" && ["ألياف", "fiber"].includes(material.category || material.type)) isRoleMatch = true;
      if ((targetRole === "specialBinder" || (targetRole as string) === "special_binder") && ["مجلدات خاصة", "special_binder"].includes(material.category || material.type)) isRoleMatch = true;
    }

    if (!isRoleMatch) return false;

    if (onlyEligible) {
      const gate = canMaterialEnterMixDesign(material, mixDesignMethod, concreteType, project);
      return gate.eligible;
    }

    return true;
  });
}

/**
 * Returns ONLY the materials that are 100% eligible, complete, validated, approved,
 * and matching the specific role/category slot for the active mix preparation context.
 */
export function getEligibleMaterials(
  materials: EngineeringMaterial[],
  roleOrCategory: string,
  mixDesignMethod: string = "dreux",
  concreteType: string = "NSC",
  project?: any
): EngineeringMaterial[] {
  if (!Array.isArray(materials)) return [];

  const targetRole = normalizeMaterialRole(roleOrCategory);

  return materials.filter(material => {
    if (!material) return false;
    
    const matRole = normalizeMaterialRole(material.category || material.type);
    
    // Check role match:
    let isRoleMatch = matRole === targetRole;
    if (!isRoleMatch) {
      if (targetRole === "sand" && material.category === "رمال") isRoleMatch = true;
      if ((targetRole === "gravel" || (targetRole as string) === "coarse_aggregate") && ["حصى", "ركام خفيف", "ركام ثقيل", "ركام معاد تدويره"].includes(material.category)) isRoleMatch = true;
      if (targetRole === "cement" && ["إسمنت", "مجلدات خاصة"].includes(material.category)) isRoleMatch = true;
      if (targetRole === "water" && ["ماء", "water"].includes(material.category || material.type)) isRoleMatch = true;
      if (targetRole === "admixture" && ["إضافات كيميائية", "admixture"].includes(material.category || material.type)) isRoleMatch = true;
      if ((targetRole === "scm" || (targetRole as string) === "mineral_addition") && ["إضافات معدنية", "scm"].includes(material.category || material.type)) isRoleMatch = true;
      if (targetRole === "fiber" && ["ألياف", "fiber"].includes(material.category || material.type)) isRoleMatch = true;
      if ((targetRole === "specialBinder" || (targetRole as string) === "special_binder") && ["مجلدات خاصة", "special_binder"].includes(material.category || material.type)) isRoleMatch = true;
    }

    if (!isRoleMatch) return false;

    // Strict eligibility check
    const evalResult = isMaterialEligible(material, mixDesignMethod, concreteType, project);
    return evalResult.eligible;
  });
}

// ============================================================================
// SELECTION VALIDATION (GUARD AGAINST MANUAL OR PROGRAMMATIC INVALID SELECTION)
// ============================================================================

export interface MaterialSelectionValidation {
  isValid: boolean;
  material?: EngineeringMaterial;
  eligibility?: MaterialEligibilityResult;
  errorAr?: string;
  errorEn?: string;
  errorFr?: string;
}

/**
 * Validates a material ID when an assignment attempt is made.
 * Permits selection in Mix Preparation so user can complete missing properties via the Batch Modal.
 */
export function validateMaterialSelection(
  materialId: string | null | undefined,
  materials: EngineeringMaterial[],
  arg3?: string,
  arg4?: string,
  arg5?: string | any,
  arg6?: any
): MaterialSelectionValidation {
  if (!materialId) {
    return {
      isValid: true,
      material: undefined
    };
  }

  const material = materials.find(m => m.id === materialId);
  if (!material) {
    return {
      isValid: false,
      errorAr: "المادة المحددة غير موجودة في مستودع المواد.",
      errorEn: "Selected material does not exist in the material library.",
      errorFr: "Le matériau sélectionné n'existe pas dans le référentiel."
    };
  }

  // Gracefully handle both 5-argument and 6-argument calls:
  // 6 args: (materialId, materials, role, method, concreteType, project)
  // 5 args: (materialId, materials, method, concreteType, project)
  let targetRole: string | undefined = undefined;
  let mixDesignMethod = "dreux";
  let concreteType = "NSC";
  let project: any = undefined;

  if (arg6 !== undefined) {
    targetRole = typeof arg3 === "string" ? arg3 : undefined;
    mixDesignMethod = typeof arg4 === "string" ? arg4 : "dreux";
    concreteType = typeof arg5 === "string" ? arg5 : (arg5?.code || "NSC");
    project = arg6;
  } else if (typeof arg5 === "object" && arg5 !== null) {
    // 5 arguments: (id, materials, method, concreteType, project)
    mixDesignMethod = typeof arg3 === "string" ? arg3 : "dreux";
    concreteType = typeof arg4 === "string" ? arg4 : (arg4 as any)?.code || "NSC";
    project = arg5;
  } else {
    // Standard defaults
    mixDesignMethod = typeof arg3 === "string" ? arg3 : "dreux";
    concreteType = typeof arg4 === "string" ? arg4 : (arg4 as any)?.code || "NSC";
    project = arg5;
  }

  // 1. Role match check if targetRole provided
  if (targetRole) {
    const normTarget = normalizeMaterialRole(targetRole);
    const normMat = normalizeMaterialRole(material.category || material.type);
    if (normTarget !== normMat) {
      return {
        isValid: false,
        material,
        errorAr: `صنف المادة (${material.category || material.type}) لا يطابق المكون المطلوب (${targetRole}).`,
        errorEn: `Material category (${material.category || material.type}) does not match required role (${targetRole}).`,
        errorFr: `La catégorie (${material.category || material.type}) ne correspond pas au rôle requis (${targetRole}).`
      };
    }
  }

  // 2. Strict eligibility check using canonical gate
  const eligibility = isMaterialEligible(material, mixDesignMethod, concreteType, project);

  if (!eligibility.eligible) {
    return {
      isValid: false,
      material,
      eligibility,
      errorAr: eligibility.reasonsAr.length > 0 ? eligibility.reasonsAr[0] : "المادة غير مؤهلة للاستخدام في تحضير الخلطة الخرسانية.",
      errorEn: eligibility.reasonsEn.length > 0 ? eligibility.reasonsEn[0] : "Material is not eligible for use in concrete mix preparation.",
      errorFr: eligibility.reasonsFr.length > 0 ? eligibility.reasonsFr[0] : "Le matériau n'est pas éligible pour la préparation du mélange."
    };
  }

  return {
    isValid: true,
    material,
    eligibility
  };
}

// ============================================================================
// MUTATION GOVERNANCE & APPROVAL INVALIDATION
// ============================================================================

/**
 * Inspects changes between previous and updated material objects.
 * If any critical engineering property changed, invalidates previous approval
 * and sets status to 'Pending Review', logging the change in audit history.
 */
export function handleMaterialMutationWithGovernance(
  previousMaterial: EngineeringMaterial,
  updatedMaterial: EngineeringMaterial,
  engineerOrModifierName: string = "User"
): {
  material: EngineeringMaterial;
  approvalInvalidated: boolean;
  invalidatedProperties: string[];
} {
  const alteredCriticalProps: string[] = [];

  for (const prop of CRITICAL_ENGINEERING_PROPERTIES) {
    const prevVal = getMaterialPropValue(previousMaterial, prop);
    const nextVal = getMaterialPropValue(updatedMaterial, prop);

    const prevStr = prevVal === undefined || prevVal === null ? "" : String(prevVal).trim();
    const nextStr = nextVal === undefined || nextVal === null ? "" : String(nextVal).trim();

    if (prevStr !== nextStr) {
      alteredCriticalProps.push(prop);
    }
  }

  const wasApproved = 
    previousMaterial.ApprovalStatus === "Approved" || 
    (previousMaterial as any).approvalStatus === "Approved" ||
    (previousMaterial as any).engineerApproval?.status === "approved";

  if (alteredCriticalProps.length > 0 && wasApproved) {
    const today = new Date().toISOString().split("T")[0];
    const changeNote = `تم تعديل خصائص هندسية أساسية (${alteredCriticalProps.join(", ")}) بواسطة ${engineerOrModifierName}. يلزم إعادة مراجعة واعتماد المهندس.`;

    const nextHistory = [
      ...(previousMaterial.lifecycleHistory || []),
      {
        date: today,
        version: (previousMaterial.version || 1) + 1,
        author: engineerOrModifierName,
        changes: `Approval invalidated due to mutation of: ${alteredCriticalProps.join(", ")}`,
        approvalStatus: "Pending Review"
      }
    ];

    const updatedEngineerApproval = {
      status: "pending" as const,
      engineerName: undefined,
      approvalDate: undefined,
      notes: changeNote,
      history: [
        ...((previousMaterial as any).engineerApproval?.history || []),
        {
          date: today,
          action: "reset_to_pending" as const,
          engineerName: engineerOrModifierName,
          notes: changeNote,
          previousStatus: "approved",
          newStatus: "pending"
        }
      ]
    };

    const governedMaterial: EngineeringMaterial = {
      ...updatedMaterial,
      ApprovalStatus: "Pending Review",
      status: "قيد المراجعة",
      version: (previousMaterial.version || 1) + 1,
      updatedDate: today,
      updatedAt: Date.now(),
      lifecycleHistory: nextHistory,
      ...({ engineerApproval: updatedEngineerApproval } as any)
    };

    return {
      material: governedMaterial,
      approvalInvalidated: true,
      invalidatedProperties: alteredCriticalProps
    };
  }

  return {
    material: updatedMaterial,
    approvalInvalidated: false,
    invalidatedProperties: []
  };
}

// ============================================================================
// ENGINEER APPROVAL / REJECTION ACTIONS
// ============================================================================

export function approveMaterialByEngineer(
  material: EngineeringMaterial,
  engineerName: string,
  notes?: string
): EngineeringMaterial {
  const today = new Date().toISOString().split("T")[0];
  const currentVersion = material.version || 1;

  const newHistory = [
    ...(material.lifecycleHistory || []),
    {
      date: today,
      version: currentVersion,
      author: engineerName,
      changes: "اعتماد المهندس المشرف للمادة",
      approvalStatus: "Approved"
    }
  ];

  const engineerApproval = {
    status: "approved" as const,
    engineerName: engineerName.trim() || "Approved Engineer",
    approvalDate: today,
    notes: notes || "تم اعتماد المادة هندسياً بعد اكتمال الخصائص والمطابقة القياسية.",
    history: [
      ...((material as any).engineerApproval?.history || []),
      {
        date: today,
        action: "approve" as const,
        engineerName: engineerName.trim() || "Approved Engineer",
        notes: notes || "Approved for mix design",
        previousStatus: material.ApprovalStatus || "Draft",
        newStatus: "approved"
      }
    ]
  };

  return {
    ...material,
    ApprovalStatus: "Approved",
    status: "نشط",
    approvalDate: today,
    lifecycleHistory: newHistory,
    ...({ engineerApproval } as any)
  };
}

export function rejectMaterialByEngineer(
  material: EngineeringMaterial,
  engineerName: string,
  reason: string
): EngineeringMaterial {
  const today = new Date().toISOString().split("T")[0];
  const currentVersion = material.version || 1;

  const newHistory = [
    ...(material.lifecycleHistory || []),
    {
      date: today,
      version: currentVersion,
      author: engineerName,
      changes: `رفض المادة: ${reason}`,
      approvalStatus: "Rejected"
    }
  ];

  const engineerApproval = {
    status: "rejected" as const,
    engineerName: engineerName.trim() || "Engineer",
    approvalDate: today,
    notes: reason || "تم رفض المادة لعدم مطابقة المواصفات الهندسية.",
    history: [
      ...((material as any).engineerApproval?.history || []),
      {
        date: today,
        action: "reject" as const,
        engineerName: engineerName.trim() || "Engineer",
        notes: reason,
        previousStatus: material.ApprovalStatus || "Draft",
        newStatus: "rejected"
      }
    ]
  };

  return {
    ...material,
    ApprovalStatus: "Rejected",
    status: "موقوف",
    lifecycleHistory: newHistory,
    ...({ engineerApproval } as any)
  };
}

// ============================================================================
// CENTRAL SYSTEM MATERIAL READINESS CHECK
// ============================================================================

export interface SystemMaterialReadinessResult {
  readinessStatus: "READY" | "NOT_READY";
  isReady: boolean;
  materialId: string;
  materialName: string;
  isSystemMaterial: boolean;
  validationStatus: "VALIDATED" | "DRAFT" | "PENDING_VALIDATION" | "INVALID";
  usableInMixDesign: boolean;
  requiredPropertiesComplete: boolean;
  missingRequiredProperties: string[];
  invalidProperties: Array<{
    propertyKey: string;
    propertyId?: string;
    error: string;
    value: any;
  }>;
  checks: {
    materialExists: boolean;
    materialTypeExists: boolean;
    requiredPropertiesExist: boolean;
    requiredValuesExist: boolean;
    unitsValid: boolean;
    dataTypesValid: boolean;
    engineeringValidationPassed: boolean;
    crossPropertyValidationPassed: boolean;
    requiredDataForMixDesignExists: boolean;
    requiredDataForRecommendationExists: boolean;
  };
  reasonsAr: string[];
  reasonsEn: string[];
}

/**
 * SystemMaterialReadinessCheck: Central authority checking material readiness.
 * Returns READY only when:
 * 1. Material exists
 * 2. Material Type exists
 * 3. Required Properties exist
 * 4. Required Values exist (0 is valid where physically valid, e.g. absorption, chlorides)
 * 5. Units valid
 * 6. Data Types valid
 * 7. Engineering validation passed
 * 8. Cross-property validation passed (e.g. bulkDensity < density, dMin < dMax)
 * 9. Required data for Mix Design exists
 * 10. Required data for Recommendation exists
 */
export function SystemMaterialReadinessCheck(
  material: EngineeringMaterial | null | undefined,
  mixDesignMethod: string = "dreux",
  concreteType: string = "NSC"
): SystemMaterialReadinessResult {
  if (!material) {
    return {
      readinessStatus: "NOT_READY",
      isReady: false,
      materialId: "",
      materialName: "",
      isSystemMaterial: false,
      validationStatus: "INVALID",
      usableInMixDesign: false,
      requiredPropertiesComplete: false,
      missingRequiredProperties: ["material"],
      invalidProperties: [],
      checks: {
        materialExists: false,
        materialTypeExists: false,
        requiredPropertiesExist: false,
        requiredValuesExist: false,
        unitsValid: false,
        dataTypesValid: false,
        engineeringValidationPassed: false,
        crossPropertyValidationPassed: false,
        requiredDataForMixDesignExists: false,
        requiredDataForRecommendationExists: false
      },
      reasonsAr: ["المادة غير معرفة أو فارغة."],
      reasonsEn: ["Material is undefined or null."]
    };
  }

  const matId = material.id || (material as any).MaterialID || "";
  const matName = material.name || (material as any).Name || "";
  const isSystem = 
    material.isSystem === true ||
    (material as any).sourceType === "SYSTEM" ||
    (material as any).sourceType === "system" ||
    (material as any).sourceType === "system_demo" ||
    material.source === "system" ||
    matId.startsWith("SYS-") ||
    matId.startsWith("preset-") ||
    matId.startsWith("standard-");

  const role = normalizeMaterialRole(material.category || material.type);
  const materialTypeExists = Boolean(role && role !== "other");

  const missingRequiredProperties: string[] = [];
  const invalidProperties: Array<{
    propertyKey: string;
    propertyId?: string;
    error: string;
    value: any;
  }> = [];
  const reasonsAr: string[] = [];
  const reasonsEn: string[] = [];

  // Check 1 & 2
  const materialExists = Boolean(matId && matName);

  // Check schemas for this role
  const schemas = MATERIAL_PROPERTY_SCHEMAS[role] || [];
  let requiredPropertiesExist = true;
  let requiredValuesExist = true;
  let unitsValid = true;
  let dataTypesValid = true;
  let engineeringValidationPassed = true;

  for (const schema of schemas) {
    const isReq = schema.isRequired(material, mixDesignMethod, concreteType);
    const val = getMaterialPropValue(material, schema.key);

    // Distinguish NOT_APPLICABLE vs MISSING
    const meta = (material as any).propertyMetadata?.[schema.key];
    const isNotApplicable = meta?.status === "not_applicable" || meta?.value === "NOT_APPLICABLE" || val === "N/A";

    if (isNotApplicable) {
      // Not applicable is not a deficiency
      continue;
    }

    // 0 is a valid number (e.g. absorption: 0, chlorides: 0, moisture: 0)
    const hasVal = val !== undefined && val !== null && val !== "" && (
      typeof val === "number" ? !isNaN(val) : String(val).trim() !== ""
    );

    if (isReq && !hasVal) {
      requiredPropertiesExist = false;
      requiredValuesExist = false;
      missingRequiredProperties.push(schema.key);
    } else if (hasVal) {
      // Validate Data Type
      if (schema.unit && typeof val !== "number" && !isNaN(Number(val))) {
        // Can be parsed to number, acceptable
      }

      // Validate Engineering Ranges
      const valRes = schema.validate(val, material, mixDesignMethod);
      if (!valRes.isValid) {
        engineeringValidationPassed = false;
        invalidProperties.push({
          propertyKey: schema.key,
          propertyId: schema.propertyId,
          error: valRes.errorAr || "القيمة خارج النطاق الهندسي المسموح",
          value: val
        });
      }
    }
  }

  // Check 8: Cross-property validation
  let crossPropertyValidationPassed = true;
  const density = getMaterialPropValue(material, "density");
  const bulkDensity = getMaterialPropValue(material, "bulkDensity");
  if (typeof density === "number" && typeof bulkDensity === "number" && density > 0 && bulkDensity > 0) {
    if (bulkDensity >= density) {
      crossPropertyValidationPassed = false;
      invalidProperties.push({
        propertyKey: "bulkDensity",
        error: "الكثافة الظاهرية لا يمكن أن تكون أكبر من أو تساوي الكثافة المطلقة",
        value: bulkDensity
      });
    }
  }

  const dMin = getMaterialPropValue(material, "dMin");
  const dMax = getMaterialPropValue(material, "dMax");
  if (typeof dMin === "number" && typeof dMax === "number" && dMin > 0 && dMax > 0) {
    if (dMin >= dMax) {
      crossPropertyValidationPassed = false;
      invalidProperties.push({
        propertyKey: "dMin",
        error: "الحجم الأدنى dMin يجب أن يكون أقل من الحجم الأقصى dMax",
        value: dMin
      });
    }
  }

  // Check 9: Required data for Mix Design exists
  let requiredDataForMixDesignExists = true;
  if (role === "sand") {
    const sDens = getMaterialPropValue(material, "density");
    const sBulk = getMaterialPropValue(material, "bulkDensity");
    const sAbs = getMaterialPropValue(material, "absorption");
    const sFm = getMaterialPropValue(material, "finenessModulus");
    if (!sDens || !sBulk || sAbs === undefined || !sFm) {
      requiredDataForMixDesignExists = false;
    }
  } else if (role === "gravel") {
    const gDens = getMaterialPropValue(material, "density");
    const gBulk = getMaterialPropValue(material, "bulkDensity");
    const gAbs = getMaterialPropValue(material, "absorption");
    const gDmax = getMaterialPropValue(material, "dMax");
    if (!gDens || !gBulk || gAbs === undefined || !gDmax) {
      requiredDataForMixDesignExists = false;
    }
  } else if (role === "cement") {
    const cDens = getMaterialPropValue(material, "density");
    const cClass = getMaterialPropValue(material, "strengthClass");
    if (!cDens || !cClass) {
      requiredDataForMixDesignExists = false;
    }
  }

  // Check 10: Required data for Recommendation exists
  const requiredDataForRecommendationExists = materialTypeExists && materialExists;

  const isReady = 
    materialExists &&
    materialTypeExists &&
    missingRequiredProperties.length === 0 &&
    invalidProperties.length === 0 &&
    crossPropertyValidationPassed &&
    requiredDataForMixDesignExists &&
    requiredDataForRecommendationExists;

  const readinessStatus: "READY" | "NOT_READY" = isReady ? "READY" : "NOT_READY";
  const validationStatus = isReady 
    ? "VALIDATED" 
    : (invalidProperties.length > 0 ? "INVALID" : "DRAFT");

  if (!isReady) {
    if (missingRequiredProperties.length > 0) {
      reasonsAr.push(`تنقص المادة ${missingRequiredProperties.length} من الخصائص الإلزامية: ${missingRequiredProperties.join(", ")}`);
      reasonsEn.push(`Material is missing ${missingRequiredProperties.length} required properties: ${missingRequiredProperties.join(", ")}`);
    }
    if (invalidProperties.length > 0) {
      reasonsAr.push(`توجد ${invalidProperties.length} خصائص غير صالحة هندسياً.`);
      reasonsEn.push(`There are ${invalidProperties.length} engineering property validation errors.`);
    }
  }

  return {
    readinessStatus,
    isReady,
    materialId: matId,
    materialName: matName,
    isSystemMaterial: isSystem,
    validationStatus,
    usableInMixDesign: isReady,
    requiredPropertiesComplete: missingRequiredProperties.length === 0,
    missingRequiredProperties,
    invalidProperties,
    checks: {
      materialExists,
      materialTypeExists,
      requiredPropertiesExist: missingRequiredProperties.length === 0,
      requiredValuesExist,
      unitsValid,
      dataTypesValid,
      engineeringValidationPassed: invalidProperties.length === 0,
      crossPropertyValidationPassed,
      requiredDataForMixDesignExists,
      requiredDataForRecommendationExists
    },
    reasonsAr,
    reasonsEn
  };
}

