import { 
  MaterialCoreRecord, 
  MaterialCategoryUnified 
} from "../types/materialCoreTypes";
import { MaterialService } from "./MaterialService";
import { ValidationService, MaterialValidationReport } from "./ValidationService";
import { canMaterialEnterMixDesign } from "./materialEligibilityService";

export interface EligibilityResult {
  materialId: string;
  isEligible: boolean;
  status: "ELIGIBLE" | "NEEDS_DATA" | "INELIGIBLE";
  score: number; // 0 - 100
  reasonsAr: string[];
  reasonsEn: string[];
  missingRequiredProperties: string[];
  incompatibleReasons: string[];
  validationReport: MaterialValidationReport;
}

export interface MixDesignContext {
  concreteType: string; // e.g. "NORMAL", "HPC", "SCC", "PAVEMENT", "LIGHTWEIGHT", "HEAVYWEIGHT", "MASS"
  mixDesignMethod: string; // e.g. "dreux", "aci", "faury", "bolomey"
  targetStrength?: number; // fck28 in MPa
  exposureClass?: string; // X0, XC1-4, XD1-3, XS1-3, XA1-3
  workability?: string; // Slump class S1 - S5
  dMax?: number; // mm
  desiredDensity?: number; // kg/m³
}

/**
 * Central Material Eligibility Service for SnoLab
 * Deterministically evaluates material eligibility for mix preparation & calculation.
 */
export class EligibilityService {
  /**
   * Evaluates if a material is eligible for a given mix context.
   * Deterministic criteria:
   * 1. Category must match required mix component.
   * 2. All schema-required properties must have valid meaningful values.
   * 3. Must be active (not suspended).
   * 4. Concrete type compatibility (e.g. SCC requires superplasticizer, HPC requires high-grade cement, etc.).
   * 5. Mix design method requirements (e.g. Dreux requires specific gravity, Dmax, FM for sands).
   */
  public static evaluateEligibility(
    material: MaterialCoreRecord,
    targetRole: MaterialCategoryUnified,
    context: MixDesignContext
  ): EligibilityResult {
    const reasonsAr: string[] = [];
    const reasonsEn: string[] = [];
    const incompatibleReasons: string[] = [];

    // 1. Category matching
    if (material.category !== targetRole) {
      incompatibleReasons.push(`الصنف '${material.category}' لا يطابق المكون المطلوب '${targetRole}'`);
      return {
        materialId: material.id,
        isEligible: false,
        status: "INELIGIBLE",
        score: 0,
        reasonsAr: ["الصنف غير متطابق"],
        reasonsEn: ["Category mismatch"],
        missingRequiredProperties: [],
        incompatibleReasons,
        validationReport: ValidationService.validateMaterial(material, context)
      };
    }

    // 2. Lifecycle status check
    if (material.status === "SUSPENDED") {
      incompatibleReasons.push("المادة موقوفة إدارياً ولا يمكن استخدامها");
      return {
        materialId: material.id,
        isEligible: false,
        status: "INELIGIBLE",
        score: 0,
        reasonsAr: ["المادة موقوفة"],
        reasonsEn: ["Material is suspended"],
        missingRequiredProperties: [],
        incompatibleReasons,
        validationReport: ValidationService.validateMaterial(material, context)
      };
    }

    // 3. Schema Completeness & Validation
    const valReport = ValidationService.validateMaterial(material, context);

    if (valReport.missingRequiredPropertyIds.length > 0) {
      return {
        materialId: material.id,
        isEligible: false,
        status: "NEEDS_DATA",
        score: Math.max(10, valReport.score - 30),
        reasonsAr: valReport.missingRequiredPropertyIds.map(id => `تنقص الخاصية الإلزامية: ${id}`),
        reasonsEn: valReport.missingRequiredPropertyIds.map(id => `Missing required property: ${id}`),
        missingRequiredProperties: valReport.missingRequiredPropertyIds,
        incompatibleReasons: [],
        validationReport: valReport
      };
    }

    if (!valReport.isValidForCalculation) {
      return {
        materialId: material.id,
        isEligible: false,
        status: "INELIGIBLE",
        score: 20,
        reasonsAr: valReport.errors,
        reasonsEn: ["Validation errors detected in material properties"],
        missingRequiredProperties: [],
        incompatibleReasons: valReport.errors,
        validationReport: valReport
      };
    }

    // Authoritative Single Gate Integration:
    // Verify using canMaterialEnterMixDesign from materialEligibilityService
    const engMat = MaterialService.toEngineeringMaterial(material);
    const canonicalGate = canMaterialEnterMixDesign(
      engMat, 
      context.mixDesignMethod || "dreux", 
      context.concreteType || "NSC"
    );

    if (!canonicalGate.eligible) {
      const isNeedsData = canonicalGate.status === "incomplete" || canonicalGate.missingProperties.length > 0;
      return {
        materialId: material.id,
        isEligible: false,
        status: isNeedsData ? "NEEDS_DATA" : "INELIGIBLE",
        score: isNeedsData ? 30 : 10,
        reasonsAr: canonicalGate.reasons,
        reasonsEn: canonicalGate.reasons,
        missingRequiredProperties: canonicalGate.missingProperties,
        incompatibleReasons: canonicalGate.reasons,
        validationReport: valReport
      };
    }

    // 4. Domain & Concrete Type Compatibility Rules (No false fallback values)
    const getNum = (propId: string): number | undefined => {
      const p = material.properties[propId];
      if (!p || p.value === null || p.value === undefined) return undefined;
      return typeof p.value === "number" ? p.value : parseFloat(p.value);
    };

    const getStr = (propId: string): string | undefined => {
      const p = material.properties[propId];
      return p?.value ? String(p.value) : undefined;
    };

    let score = 80;

    // Cement specific checks
    if (targetRole === "CEMENT") {
      const strength = getNum("PROP-CEM-STRENGTH-28D");
      const targetFck = context.targetStrength;

      if (strength !== undefined) {
        if (context.concreteType === "HPC" && strength < 42.5) {
          incompatibleReasons.push("الخرسانة عالية الأداء (HPC) تتطلب إسمنت برتبة 42.5 أو 52.5 على الأقل");
        } else if (strength >= 52.5 && targetFck !== undefined && targetFck >= 40) {
          score += 15;
          reasonsAr.push("رتبة مقاومة عالية 52.5 ممتازة للمقاومة العالية المستهدفة");
        } else if (strength >= 42.5) {
          score += 10;
          reasonsAr.push("رتبة مقاومة معيارية 42.5 مناسبة ومطابقة");
        }
      }

      // Sulfate exposure
      if (context.exposureClass && ["XA1", "XA2", "XA3"].includes(context.exposureClass)) {
        const cemClass = getStr("PROP-CEM-CLASS") || "";
        if (!cemClass.includes("CRS") && !cemClass.includes("III") && !cemClass.includes("IV")) {
          score -= 15;
          reasonsAr.push("بيئة عدوانية كبريتية: يفضل استخدام إسمنت مقاوم للكبريتات (CRS/SRC)");
        }
      }
    }

    // Sand specific checks
    if (targetRole === "SAND") {
      const fm = getNum("PROP-FM");
      const se = getNum("PROP-SAND-EQUIVALENT");

      if (fm !== undefined) {
        if (fm >= 2.2 && fm <= 2.8) {
          score += 10;
          reasonsAr.push(`معامل نعومة مثالي (${fm}) يمنح قابلية تشغيل ممتازة ورصاً متجانساً`);
        } else if (fm < 2.0) {
          score -= 10;
          reasonsAr.push(`رمل ناعم جداً (${fm}) قد يزيد من استهلاك الماء والإسمنت`);
        } else if (fm > 3.0) {
          score -= 5;
          reasonsAr.push(`رمل خشن نسبياً (${fm}) قد يسبب انفصالاً حبيبياً ما لم يعوض برمل ناعم`);
        }
      }

      if (se !== undefined) {
        if (se < 65) {
          incompatibleReasons.push(`المكافئ الرملي (${se}%) دون الحد الأدنى المسموح للمنشآت (65%)`);
        } else if (se >= 75) {
          score += 10;
          reasonsAr.push(`مكافئ رملي ممتاز (${se}%) يؤكد نظافة الرمل من الطين`);
        }
      }
    }

    // Gravel specific checks
    if (targetRole === "GRAVEL") {
      const dmax = getNum("PROP-DMAX");
      if (dmax !== undefined) {
        if (context.dMax && Math.abs(dmax - context.dMax) > 5) {
          score -= 10;
          reasonsAr.push(`المقاس الأقصى Dmax (${dmax} mm) يختلف عن المستهدف (${context.dMax} mm)`);
        } else {
          score += 10;
          reasonsAr.push(`المقاس الأقصى Dmax (${dmax} mm) متوافق تماماً مع قيود التسليح والأبعاد`);
        }
      }
    }

    // Laboratory provenance bonus
    if (material.dataSource === "LABORATORY") {
      score += 5;
      reasonsAr.push("بيانات معتمدة من نتائج اختبارات مخبرية فعلية");
    }

    const isEligible = canonicalGate.eligible && incompatibleReasons.length === 0;

    return {
      materialId: material.id,
      isEligible,
      status: isEligible ? "ELIGIBLE" : "INELIGIBLE",
      score: Math.min(100, Math.max(0, score)),
      reasonsAr: isEligible ? reasonsAr : [...canonicalGate.reasons, ...incompatibleReasons],
      reasonsEn: isEligible ? reasonsEn : [...canonicalGate.reasons, ...incompatibleReasons],
      missingRequiredProperties: [],
      incompatibleReasons: [...canonicalGate.reasons, ...incompatibleReasons],
      validationReport: valReport
    };
  }

  /**
   * Filters and returns ONLY eligible and complete materials for a target category.
   * Perfect for Mix Preparation selection panels so incomplete materials never clutter the UI.
   */
  public static getEligibleMaterials(
    materials: MaterialCoreRecord[],
    targetRole: MaterialCategoryUnified,
    context: MixDesignContext
  ): {
    eligible: MaterialCoreRecord[];
    needsData: Array<{ material: MaterialCoreRecord; missingProps: string[] }>;
    ineligible: Array<{ material: MaterialCoreRecord; reason: string }>;
  } {
    const eligible: MaterialCoreRecord[] = [];
    const needsData: Array<{ material: MaterialCoreRecord; missingProps: string[] }> = [];
    const ineligible: Array<{ material: MaterialCoreRecord; reason: string }> = [];

    for (const mat of materials) {
      if (mat.category !== targetRole) continue;

      const evalRes = EligibilityService.evaluateEligibility(mat, targetRole, context);
      if (evalRes.status === "ELIGIBLE") {
        eligible.push(mat);
      } else if (evalRes.status === "NEEDS_DATA") {
        needsData.push({ material: mat, missingProps: evalRes.missingRequiredProperties });
      } else {
        ineligible.push({ material: mat, reason: evalRes.incompatibleReasons.join(" • ") });
      }
    }

    return { eligible, needsData, ineligible };
  }
}
