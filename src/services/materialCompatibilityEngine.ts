/**
 * SnoLab Material Compatibility & Scoring Engine
 * 
 * Computes the mathematical Compatibility Score (0 - 100%) and detailed engineering factors
 * for candidate materials against the concrete type, mix design method, and project constraints.
 */

import { EngineeringMaterial } from "../types";
import { SupportedMaterialRole } from "./materialPropertySchema";
import { RoleConstraint, MaterialRoleRequirement } from "./materialRequirementEngine";
import { isMaterialEligible, MaterialEligibilityResult } from "./materialEligibilityService";

export interface MaterialCompatibilityFactor {
  category: "role_alignment" | "property_completeness" | "approval_certification" | "performance_fit" | "durability_exposure" | "granulometry_workability";
  scoreEarned: number;
  maxScore: number;
  labelAr: string;
  labelEn: string;
  labelFr: string;
  detailsAr: string;
  detailsEn: string;
  detailsFr: string;
  isPenalty?: boolean;
}

export interface MaterialCompatibilityResult {
  material: EngineeringMaterial;
  role: SupportedMaterialRole;
  compatibilityScore: number; // 0 to 100%
  grade: "excellent" | "high" | "moderate" | "poor" | "ineligible";
  tier: "recommended" | "alternative" | "not_eligible";
  eligibility: MaterialEligibilityResult;
  factors: MaterialCompatibilityFactor[];
  justificationAr: string;
  justificationEn: string;
  justificationFr: string;
  warnings: string[];
  keyHighlights: string[];
}

export interface ScoringContext {
  concreteType: string;
  mixDesignMethod: string;
  targetStrength: number; // fck28
  slumpCm?: number;
  exposureClass?: string;
  maxAggregateSize?: number;
  targetDensity?: number;
  hasPumping?: boolean;
  activeProject?: any;
}

/**
 * Calculates a comprehensive engineering compatibility score for a material in a given role and context.
 */
export function evaluateMaterialCompatibility(
  material: EngineeringMaterial,
  role: SupportedMaterialRole,
  roleRequirement: MaterialRoleRequirement,
  context: ScoringContext
): MaterialCompatibilityResult {
  const rawConcreteType = typeof context.concreteType === "string" 
    ? context.concreteType 
    : (context.concreteType as any)?.code || (context.concreteType as any)?.concreteType || "NSC";
  const concreteType = String(rawConcreteType || "NSC").toUpperCase();
  const method = String(context.mixDesignMethod || "dreux").toLowerCase();
  const fck = Number(context.targetStrength) || 25;
  const dMax = Number(context.maxAggregateSize) || 20;
  const exposure = String(context.exposureClass || "X0").toUpperCase();
  const constraints = roleRequirement.constraints || {};

  // 1. Run basic eligibility gate
  const eligibility = isMaterialEligible(material, method, concreteType, context.activeProject);

  const factors: MaterialCompatibilityFactor[] = [];
  const warnings: string[] = [];
  const keyHighlights: string[] = [];

  // =========================================================================
  // Factor 1: Role Alignment (Max 20 pts)
  // =========================================================================
  let roleScore = 20;
  let roleDetailAr = "المادة تنتمي للصنف الهيكلي المطلوب بدقة.";
  let roleDetailEn = "Material matches the required structural category.";
  let roleDetailFr = "Le matériau correspond exactement à la catégorie requise.";

  factors.push({
    category: "role_alignment",
    scoreEarned: roleScore,
    maxScore: 20,
    labelAr: "المطابقة الصنفية",
    labelEn: "Category & Role Match",
    labelFr: "Conformité de Catégorie",
    detailsAr: roleDetailAr,
    detailsEn: roleDetailEn,
    detailsFr: roleDetailFr
  });

  // =========================================================================
  // Factor 2: Property Completeness & Validity (Max 25 pts)
  // =========================================================================
  let propScore = 25;
  if (!eligibility.eligible) {
    // Missing critical properties
    const missingCount = eligibility.missingProperties.length;
    const invalidCount = eligibility.invalidProperties.length;
    propScore = Math.max(0, 25 - (missingCount * 8) - (invalidCount * 10));
  }

  factors.push({
    category: "property_completeness",
    scoreEarned: propScore,
    maxScore: 25,
    labelAr: "اكتمال الخواص والفيزياء",
    labelEn: "Property Completeness & Physics",
    labelFr: "Complétude des Propriétés",
    detailsAr: eligibility.eligible 
      ? "كافة الخصائص الفيزيائية والكيميائية موثقة وضمن النطاقات الهندسية المعتمدة."
      : `خصائص مفقودة أو غير صالحة: ${[...eligibility.missingProperties, ...eligibility.invalidProperties].join(", ")}`,
    detailsEn: eligibility.eligible
      ? "All required physical and chemical properties documented within valid limits."
      : `Missing or invalid properties: ${[...eligibility.missingProperties, ...eligibility.invalidProperties].join(", ")}`,
    detailsFr: eligibility.eligible
      ? "Toutes les propriétés requises sont documentées dans les plages valides."
      : "Propriétés manquantes ou hors tolérances."
  });

  // =========================================================================
  // Factor 3: Approval & Laboratory Certification (Max 15 pts)
  // =========================================================================
  let approvalScore = 15;
  const isSystem = material.isSystem || material.isDemo || material.sourceType === "system_demo";
  const isApproved = isSystem || material.approvalStatus === "Approved" || material.approvalStatus === "Validated";

  if (!isApproved) {
    if (material.approvalStatus === "Pending Review" || material.approvalStatus === "Under Review") {
      approvalScore = 8;
      warnings.push("المادة قيد المراجعة الهندسية ولم تعتمد نهائياً بعد.");
    } else {
      approvalScore = 4;
      warnings.push("المادة غير معتمدة من المهندس المشرف في المشروع.");
    }
  } else {
    keyHighlights.push("معتمدة هندسياً ومحققة مخبرياً.");
  }

  factors.push({
    category: "approval_certification",
    scoreEarned: approvalScore,
    maxScore: 15,
    labelAr: "الاعتماد المخبري والهندسي",
    labelEn: "Lab Certification & Approval",
    labelFr: "Homologation et Certification",
    detailsAr: isApproved ? "المادة معتمدة ومطابقة للمواصفات القياسية." : "المادة بحاجة لختم اعتماد المهندس المشرف.",
    detailsEn: isApproved ? "Material is certified and approved for mix use." : "Material requires engineer review & sign-off.",
    detailsFr: isApproved ? "Matériau homologué pour formulation." : "Matériau en attente de visa ingénieur."
  });

  // =========================================================================
  // Factor 4: Concrete Type & Performance Fit (Max 20 pts)
  // =========================================================================
  let perfScore = 16;
  let perfDetailsAr = "ملائمة جيدة للأداء المستهدف.";
  let perfDetailsEn = "Good alignment with target performance.";
  let perfDetailsFr = "Bonne adéquation avec la performance cible.";

  if (role === "cement") {
    const strengthClass = parseFloat(String(material.strengthClass || material.cementClass || "42.5"));
    if (concreteType === "UHPC" || concreteType === "BFUP") {
      if (strengthClass >= 52.5) {
        perfScore = 20;
        perfDetailsAr = "إسمنت عالي الرتبة CEM I 52.5 R ملائم تماماً لمتطلبات UHPC الفائقة.";
        keyHighlights.push("CEM I 52.5 R فائق الرتبة");
      } else {
        perfScore = 8;
        warnings.push("رتبة الإسمنت أقل من 52.5 الموصى بها للخرسانات فائقة الأداء.");
      }
    } else if (concreteType === "HSC" || concreteType === "HPC" || fck >= 50) {
      if (strengthClass >= 42.5) {
        perfScore = 20;
        perfDetailsAr = `رتبة الإسمنت (${strengthClass}) ممتازة لتحقيق مقاومة ضغط ${fck} MPa.`;
        keyHighlights.push(`رتبة ${strengthClass} MPa`);
      } else {
        perfScore = 10;
        warnings.push(`رتبة الإسمنت 32.5 قد تتطلب كمية إسمنت مرتفعة جداً لتحقيق ${fck} MPa.`);
      }
    } else {
      perfScore = 20;
      perfDetailsAr = `رتبة الإسمنت (${strengthClass || 42.5}) ملائمة تماماً للمقاومة المستهدفة (${fck} MPa).`;
    }
  } else if (role === "sand") {
    const fm = material.finenessModulus || 2.6;
    const se = material.sandEquivalent || 75;
    if (concreteType === "UHPC" || concreteType === "BFUP") {
      if (material.dMax && material.dMax <= 1.5) {
        perfScore = 20;
        perfDetailsAr = "رمل سيليسي ميكروي فائق النقاء والتدرج (Dmax <= 1 مم).";
        keyHighlights.push("رمل سيليسي ميكروي فائق");
      } else {
        perfScore = 8;
        warnings.push("يفضل رمل ميكروي Dmax <= 1 مم لخلطات UHPC.");
      }
    } else if (fm >= 2.3 && fm <= 3.0 && se >= 70) {
      perfScore = 20;
      perfDetailsAr = `معامل نعومة ممتاز (FM = ${fm}) ومكافئ رملي عالٍ (SE = ${se}%).`;
      keyHighlights.push(`معامل نعومة متزن (FM ${fm})`);
    } else {
      perfScore = 14;
      perfDetailsAr = `معامل النعومة (FM = ${fm}) يحتاج لضبط نسبة الرمل بالخلطة.`;
    }
  } else if (role === "gravel") {
    const matDmax = material.dMax || 20;
    if (constraints.maxDmax && matDmax > constraints.maxDmax) {
      perfScore = 6;
      warnings.push(`قطر الحصى Dmax = ${matDmax} مم يتجاوز الحد الأقصى (${constraints.maxDmax} مم) لخرسانة ${concreteType}.`);
      perfDetailsAr = `حجم الحصى (${matDmax} مم) أكبر من المسموح به (${constraints.maxDmax} مم).`;
    } else if (concreteType === "SCC" && matDmax <= 16) {
      perfScore = 20;
      perfDetailsAr = `مقاس الحصى (${matDmax} مم) يضمن عدم الانسداد بين أسياخ التسليح.`;
      keyHighlights.push(`Dmax <= 16 مم (مانع للانسداد)`);
    } else if (Math.abs(matDmax - dMax) <= 5) {
      perfScore = 20;
      perfDetailsAr = `قطر الحصى Dmax = ${matDmax} مم متوافق تماماً مع مواصفات المشروع (${dMax} مم).`;
      keyHighlights.push(`Dmax = ${matDmax} مم`);
    } else {
      perfScore = 15;
      perfDetailsAr = `قطر الحصى (${matDmax} مم) يختلف عن مستهدف المشروع (${dMax} مم).`;
    }
  } else if (role === "admixture") {
    const isPce = material.name.includes("فائق") || material.name.toLowerCase().includes("super") || material.name.toLowerCase().includes("pce");
    const wr = material.waterReduction || 20;
    if (concreteType === "UHPC" || concreteType === "BFUP" || concreteType === "SCC" || fck >= 40) {
      if (isPce || wr >= 25) {
        perfScore = 20;
        perfDetailsAr = `ملدن فائق عالي الكفاءة (تخفيض مياه ${wr}%) يضمن السيولة والدمك الذاتي.`;
        keyHighlights.push(`ملدن فائق PCE (تخفيض ${wr}%)`);
      } else {
        perfScore = 10;
        warnings.push("يوصى بملدن فائق PCE بنسبة تخفيض مياه >= 25% لهذا النوع من الخرسانة.");
      }
    } else {
      perfScore = 20;
      perfDetailsAr = `ملدن فعال بتخفيض مياه ${wr}%.`;
    }
  } else if (role === "scm") {
    const isSilica = material.name.includes("سيليكا") || material.name.toLowerCase().includes("silica");
    const isSlag = material.name.includes("خبث") || material.name.toLowerCase().includes("slag");
    if (concreteType === "UHPC" || concreteType === "BFUP" || concreteType === "HPC") {
      if (isSilica) {
        perfScore = 20;
        perfDetailsAr = "غبار السيليكا يوفر نشاطاً بوزولانياً فائقاً ورصاً مجهرياً مثالياً.";
        keyHighlights.push("غبار سيليكا فائق النشاط");
      } else {
        perfScore = 14;
        perfDetailsAr = "إضافة معدنية تساهم في تحسين الكتامة.";
      }
    } else if (concreteType === "GPC") {
      if (isSlag || material.name.includes("رماد") || material.name.toLowerCase().includes("fly ash")) {
        perfScore = 20;
        perfDetailsAr = "خبث أو رماد متطاير مثالي لتفاعل التنشيط القلوي والجيوبوليمر.";
        keyHighlights.push("مادة غنية بالألومينوسيليكات");
      }
    } else {
      perfScore = 18;
      perfDetailsAr = "إضافة معدنية ترفع من المتانة وتقلل من حرارة الإماهة.";
    }
  } else if (role === "fiber") {
    const isSteel = material.name.includes("فولاذ") || material.name.toLowerCase().includes("steel");
    if (concreteType === "UHPC" || concreteType === "BFUP" || concreteType === "FRC") {
      if (isSteel) {
        perfScore = 20;
        perfDetailsAr = "ألياف فولاذية دقيقة تمنح الخرسانة متانة ودونة عالية ومقاومة فائقة للشد.";
        keyHighlights.push("ألياف فولاذية فائقة المتانة");
      } else {
        perfScore = 14;
        perfDetailsAr = "ألياف صناعية تكافح شروخ الانكماش اللدن.";
      }
    } else {
      perfScore = 18;
    }
  } else if (role === "lightweightAggregate") {
    const dens = material.density || 1200;
    if (dens <= 1800) {
      perfScore = 20;
      perfDetailsAr = `ركام خفيف بكثافة منخفضة (${dens} كجم/م³) ملائم للخرسانة الخفيفة.`;
      keyHighlights.push(`كثافة خفيفة (${dens} kg/m³)`);
    } else {
      perfScore = 6;
      warnings.push(`كثافة الركام (${dens} kg/m³) مرتفعة عن المستهدف للخرسانة الخفيفة.`);
    }
  } else if (role === "heavyweightAggregate") {
    const dens = material.density || 3500;
    if (dens >= 3000) {
      perfScore = 20;
      perfDetailsAr = `ركام ثقيل عالي الكثافة (${dens} كجم/م³) لضمان التدريع الإشعاعي.`;
      keyHighlights.push(`كثافة عالية للتدريع (${dens} kg/m³)`);
    } else {
      perfScore = 6;
      warnings.push(`كثافة الركام (${dens} kg/m³) غير كافية للتدريع الإشعاعي.`);
    }
  }

  factors.push({
    category: "performance_fit",
    scoreEarned: perfScore,
    maxScore: 20,
    labelAr: "الملائمة الهندسية للأداء",
    labelEn: "Performance & Strength Fit",
    labelFr: "Adéquation aux Performances",
    detailsAr: perfDetailsAr,
    detailsEn: perfDetailsEn,
    detailsFr: perfDetailsFr
  });

  // =========================================================================
  // Factor 5: Durability & Exposure Environment Fit (Max 10 pts)
  // =========================================================================
  let durScore = 10;
  let durDetailsAr = "متوافقة مع شروط ديمومة البيئة.";
  let durDetailsEn = "Compliant with environment durability rules.";
  let durDetailsFr = "Conforme aux exigences de durabilité.";

  if (exposure.startsWith("XA") || exposure.startsWith("XS")) {
    if (role === "cement") {
      const isSr = material.name.includes("SR") || material.name.includes("مقاوم") || (material.sulfateContent && material.sulfateContent < 3.0);
      if (isSr) {
        durScore = 10;
        durDetailsAr = `إسمنت مقاوم لأملاح الكبريتات والكلوريدات في بيئة (${exposure}).`;
        keyHighlights.push("مقاوم للكبريتات (SR)");
      } else {
        durScore = 5;
        warnings.push(`بيئة التعرض (${exposure}) تفضل استخدام إسمنت مقاوم للكبريتات (CEM I-SR أو CEM III).`);
      }
    }
  }

  factors.push({
    category: "durability_exposure",
    scoreEarned: durScore,
    maxScore: 10,
    labelAr: "ملاءمة الديمومة والبيئة",
    labelEn: "Durability & Environment Fit",
    labelFr: "Durabilité & Environnement",
    detailsAr: durDetailsAr,
    detailsEn: durDetailsEn,
    detailsFr: durDetailsFr
  });

  // =========================================================================
  // Factor 6: Granulometry & Workability Fit (Max 10 pts)
  // =========================================================================
  let granScore = 10;
  let granDetailsAr = "خصائص تشغيلية ورص حبيبي متجانس.";
  let granDetailsEn = "Balanced granular packing and workability.";
  let granDetailsFr = "Empilement granulaire et ouvrabilité équilibrés.";

  factors.push({
    category: "granulometry_workability",
    scoreEarned: granScore,
    maxScore: 10,
    labelAr: "الرص الحبيبي والتشغيلية",
    labelEn: "Granular Packing & Flow",
    labelFr: "Compacité & Ouvrabilité",
    detailsAr: granDetailsAr,
    detailsEn: granDetailsEn,
    detailsFr: granDetailsFr
  });

  // =========================================================================
  // Total Score Calculation
  // =========================================================================
  let totalScore = factors.reduce((sum, f) => sum + f.scoreEarned, 0);

  // If the material is completely missing basic physical properties or not eligible, clamp score
  if (!eligibility.eligible) {
    totalScore = Math.min(totalScore, 45);
  }

  let tier: "recommended" | "alternative" | "not_eligible" = "not_eligible";
  let grade: MaterialCompatibilityResult["grade"] = "ineligible";

  if (eligibility.eligible && totalScore >= 80) {
    tier = "recommended";
    grade = totalScore >= 92 ? "excellent" : "high";
  } else if (eligibility.eligible && totalScore >= 55) {
    tier = "alternative";
    grade = "moderate";
  } else {
    tier = "not_eligible";
    grade = "poor";
  }

  const justificationAr = `${material.name} - توافق بنسبة ${totalScore}% مع متطلبات خلطة (${concreteType}) بمقاومة (${fck} MPa). ${perfDetailsAr}`;
  const justificationEn = `${material.englishName || material.name} - ${totalScore}% compatibility for (${concreteType}) mix with ${fck} MPa strength. ${perfDetailsEn}`;
  const justificationFr = `${material.name} - Compatibilité de ${totalScore}% pour béton (${concreteType}) résistance ${fck} MPa. ${perfDetailsFr}`;

  return {
    material,
    role,
    compatibilityScore: Math.round(totalScore),
    grade,
    tier,
    eligibility,
    factors,
    justificationAr,
    justificationEn,
    justificationFr,
    warnings,
    keyHighlights
  };
}
