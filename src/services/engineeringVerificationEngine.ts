import { EngineeringMaterial, MixDesignInput, ActiveProject } from "../types";
import { isMaterialEligible, MaterialEligibilityResult } from "./materialEligibilityService";

export type RoleStatus =
  | "not_required"
  | "unselected"
  | "ready"
  | "incomplete"
  | "pending_approval"
  | "invalid"
  | "incompatible";

export interface RequiredMaterialRole {
  role: "cement" | "sand" | "gravel" | "water" | "admixture" | "scm" | "fiber" | "specialBinder";
  roleLabelAr: string;
  roleLabelEn: string;
  roleLabelFr: string;
  icon: string;
  isRequired: boolean;
  sourceReasonAr: string;
  sourceReasonEn: string;
  sourceReasonFr: string;
  selectedMaterialId?: string;
  selectedMaterial?: EngineeringMaterial | null;
  eligibility?: MaterialEligibilityResult;
  status: RoleStatus;
}

export type EngineeringGateState = "NO_VERIFICATION_NEEDED" | "READY" | "NEEDS_ATTENTION" | "BLOCKED";

export interface EngineeringVerificationResult {
  gateState: EngineeringGateState;
  isBlocked: boolean;
  requiredCount: number;
  selectedCount: number;
  readyCount: number;
  missingCount: number;
  roles: RequiredMaterialRole[];
  summaryMessageAr: string;
  summaryMessageEn: string;
  summaryMessageFr: string;
  debugTelemetry?: {
    currentOperation: string;
    method: string;
    concreteType: string;
    selectedMaterialsCount: number;
    requiredMaterialsCount: number;
    missingCount: number;
    gate: string;
    reasons: Array<{ role: string; reason: string }>;
  };
}

/**
 * Dynamically computes material requirements for the active mix design based on:
 * Current Project + Concrete Type + Mix Design Method + Selected Materials + Operation Context.
 * 
 * Rules:
 * 1. Sand and Gravel are NOT hardcoded. They appear as required ONLY if current mix design context requires them.
 * 2. Does NOT use library/demo materials to determine project readiness.
 * 3. Does NOT block Mix Preparation ('calculator') tab — users must be free to edit and choose materials.
 * 4. In results/reports tabs, blocks with clear actionable cards if required materials are missing or incomplete.
 */
export function evaluateEngineeringGate(
  inputs: MixDesignInput | undefined,
  currentOperation: string = "calculator",
  materialsDatabase: EngineeringMaterial[] = [],
  activeProject?: ActiveProject | null
): EngineeringVerificationResult {
  const method = String(inputs?.selectedMethod || "dreux").toLowerCase();
  const rawConcreteType = typeof inputs?.concreteType === "string"
    ? inputs.concreteType
    : (inputs?.concreteType as any)?.code || (inputs?.concreteType as any)?.concreteType || "NSC";
  const concreteType = String(rawConcreteType || "NSC").toUpperCase();
  const dMax = typeof inputs?.dMax === "number" && !isNaN(inputs.dMax) ? inputs.dMax : undefined;

  // 1. Determine Dynamic Roles
  const roles: RequiredMaterialRole[] = [];

  // Cement / Binder Role
  const isCementRequired = true; // Required for concrete/mortar mix design
  roles.push({
    role: "cement",
    roleLabelAr: "الإسمنت / المجلد الأساسي",
    roleLabelEn: "Cement / Binder",
    roleLabelFr: "Ciment / Liant",
    icon: "🏗️",
    isRequired: isCementRequired,
    sourceReasonAr: `مطلوب لطريقة (${method}) لحساب محتوى الإسمنت ومعادلة بولومي ونسبة W/C.`,
    sourceReasonEn: `Required for (${method}) method to calculate binder content and W/C ratio.`,
    sourceReasonFr: `Requis pour la méthode (${method}) afin de calculer le dosage en liant et le rapport E/C.`,
    selectedMaterialId: inputs?.selectedCementId,
    status: "unselected"
  });

  // Fine Aggregate (Sand) Role
  const isSandRequired = concreteType !== "PASTE"; // Standard concrete and mortar methods need sand
  roles.push({
    role: "sand",
    roleLabelAr: "الركام الناعم (الرمل)",
    roleLabelEn: "Fine Aggregate (Sand)",
    roleLabelFr: "Granulat fin (Sable)",
    icon: "🏖️",
    isRequired: isSandRequired,
    sourceReasonAr: `مطلوب لطريقة (${method}) لحساب المنحنى الحبيبي ونسبة الرمل (Sand Ratio) والكثافة الحجمية.`,
    sourceReasonEn: `Required for (${method}) to determine sieve curve, sand ratio, and volume.`,
    sourceReasonFr: `Requis pour (${method}) pour déterminer la courbe granulométrique et le volume de sable.`,
    selectedMaterialId: inputs?.selectedSandId,
    status: "unselected"
  });

  // Coarse Aggregate (Gravel) Role
  // Not required for Mortar, Grout, or Dmax <= 4mm
  const isGravelRequired = concreteType !== "MORTAR" && concreteType !== "GROUT" && concreteType !== "PASTE" && (dMax === undefined || dMax > 4);
  if (isGravelRequired || inputs?.selectedGravelId) {
    roles.push({
      role: "gravel",
      roleLabelAr: "الركام الخشن (الحصى)",
      roleLabelEn: "Coarse Aggregate (Gravel)",
      roleLabelFr: "Gros granulat (Gravier)",
      icon: "🪨",
      isRequired: isGravelRequired,
      sourceReasonAr: isGravelRequired 
        ? (dMax !== undefined ? `مطلوب لنوع الخرسانة (${concreteType}) والقطر الأقصى (Dmax = ${dMax}mm) لحساب الهيكل الحصوي.` : `مطلوب لنوع الخرسانة (${concreteType}) لحساب الهيكل الحصوي.`)
        : `تم اختياره يدوياً في الخلطة الحالية.`,
      sourceReasonEn: isGravelRequired
        ? (dMax !== undefined ? `Required for concrete type (${concreteType}) and (Dmax = ${dMax}mm) to establish granular skeleton.` : `Required for concrete type (${concreteType}) to establish granular skeleton.`)
        : `Manually selected in current mix.`,
      sourceReasonFr: isGravelRequired
        ? (dMax !== undefined ? `Requis pour le type de béton (${concreteType}) et (Dmax = ${dMax}mm).` : `Requis pour le type de béton (${concreteType}).`)
        : `Sélectionné manuellement dans le mélange actuel.`,
      selectedMaterialId: inputs?.selectedGravelId,
      status: isGravelRequired ? "unselected" : "not_required"
    });
  }

  // Mixing Water Role
  const isWaterRequired = true;
  roles.push({
    role: "water",
    roleLabelAr: "مياه الخلط",
    roleLabelEn: "Mixing Water",
    roleLabelFr: "Eau de gâchage",
    icon: "💧",
    isRequired: isWaterRequired,
    sourceReasonAr: "مطلوب لتفاعل الإماهة وحساب تصحيح الرطوبة والامتصاص الفعلي.",
    sourceReasonEn: "Required for hydration and moisture/absorption batch correction.",
    sourceReasonFr: "Requis pour l'hydratation et la correction d'humidité/absorption.",
    selectedMaterialId: inputs?.selectedWaterId,
    status: "unselected"
  });

  // Admixture Role (Mandatory for SCC, UHPC, HPC, or if selected)
  const isAdmixtureMandatory = concreteType === "SCC" || concreteType === "UHPC" || concreteType === "HPC";
  if (isAdmixtureMandatory || inputs?.selectedAdmixtureId) {
    roles.push({
      role: "admixture",
      roleLabelAr: "الملدنات / الإضافات الكيميائية",
      roleLabelEn: "Chemical Admixture",
      roleLabelFr: "Adjuvant chimique",
      icon: "🧪",
      isRequired: isAdmixtureMandatory,
      sourceReasonAr: isAdmixtureMandatory 
        ? `إلزامي لنوع الخرسانة (${concreteType}) لتحقيق السيولة وتخفيض الماء بنسبة عالية.`
        : `تم اختياره في الخلطة الحالية.`,
      sourceReasonEn: isAdmixtureMandatory
        ? `Mandatory for concrete type (${concreteType}) to achieve self-compacting rheology / high water reduction.`
        : `Selected in current mix.`,
      sourceReasonFr: isAdmixtureMandatory
        ? `Obligatoire pour le type (${concreteType}).`
        : `Sélectionné dans le mélange.`,
      selectedMaterialId: inputs?.selectedAdmixtureId,
      status: isAdmixtureMandatory ? "unselected" : "not_required"
    });
  }

  // Fiber Role (Mandatory for FIBER concrete)
  if (concreteType === "FIBER" || inputs?.selectedFiberId) {
    const isFiberMandatory = concreteType === "FIBER";
    roles.push({
      role: "fiber",
      roleLabelAr: "الألياف الإنشائية",
      roleLabelEn: "Structural Fibers",
      roleLabelFr: "Fibres structurelles",
      icon: "🧵",
      isRequired: isFiberMandatory,
      sourceReasonAr: `إلزامي لصنف خرسانة الألياف (FIBER) لمقاومة الشد والتشقق.`,
      sourceReasonEn: `Mandatory for fiber-reinforced concrete to enhance tensile capacity.`,
      sourceReasonFr: `Obligatoire pour le béton fibré.`,
      selectedMaterialId: inputs?.selectedFiberId,
      status: isFiberMandatory ? "unselected" : "not_required"
    });
  }

  // SCM / Supplementary (Mandatory for GEOPOLYMER)
  if (concreteType === "GEOPOLYMER" || inputs?.selectedScmId) {
    const isScmMandatory = concreteType === "GEOPOLYMER";
    roles.push({
      role: "scm",
      roleLabelAr: "الإضافات المعدنية (SCM)",
      roleLabelEn: "Supplementary Cementitious (SCM)",
      roleLabelFr: "Additions minérales (SCM)",
      icon: "✨",
      isRequired: isScmMandatory,
      sourceReasonAr: `إلزامي لصنف خرسانة الجيوبوليمر كمصدر للسيليكا والألومينا.`,
      sourceReasonEn: `Mandatory for geopolymer concrete as alumino-silicate source.`,
      sourceReasonFr: `Obligatoire pour le béton géopolymère.`,
      selectedMaterialId: inputs?.selectedScmId,
      status: isScmMandatory ? "unselected" : "not_required"
    });
  }

  // 2. Evaluate each role against selected materials
  let requiredCount = 0;
  let selectedCount = 0;
  let readyCount = 0;
  let missingCount = 0;

  for (const r of roles) {
    if (r.isRequired) requiredCount++;

    // Find selected material from activeProject snapshots OR materialsDatabase
    let mat: EngineeringMaterial | null = null;
    if (r.selectedMaterialId) {
      mat = materialsDatabase.find(m => m.id === r.selectedMaterialId) || null;
      if (!mat && activeProject?.materialSnapshots) {
        const snapRole = r.role === "cement" ? "cement" : r.role === "sand" ? "sand" : r.role === "gravel" ? "gravel" : r.role === "water" ? "water" : r.role;
        mat = (activeProject.materialSnapshots as any)[snapRole] || null;
      }
    }

    r.selectedMaterial = mat;

    if (!r.selectedMaterialId || !mat) {
      r.status = r.isRequired ? "unselected" : "not_required";
      if (r.isRequired) missingCount++;
    } else {
      selectedCount++;
      // Evaluate strict eligibility
      const evalRes = isMaterialEligible(mat, method, concreteType, activeProject);
      r.eligibility = evalRes;

      if (evalRes.eligible) {
        r.status = "ready";
        if (r.isRequired) readyCount++;
      } else if (evalRes.incompatibleWithConcreteType) {
        r.status = "incompatible";
        if (r.isRequired) missingCount++;
      } else if (evalRes.missingProperties.length > 0) {
        r.status = "incomplete";
        if (r.isRequired) missingCount++;
      } else if (evalRes.invalidProperties.length > 0) {
        r.status = "invalid";
        if (r.isRequired) missingCount++;
      } else if (evalRes.lifecycleStatus === "pending_approval") {
        r.status = "pending_approval";
        if (r.isRequired) missingCount++;
      } else {
        r.status = "incomplete";
        if (r.isRequired) missingCount++;
      }
    }
  }

  // 3. Determine Overall Gate Status
  let gateState: EngineeringGateState = "READY";
  let isBlocked = false;

  // If outside calculation/report context, no blocking gate
  if (["saved_projects", "materials_library"].includes(currentOperation)) {
    gateState = "NO_VERIFICATION_NEEDED";
    isBlocked = false;
  } else if (currentOperation === "calculator") {
    // In Mix Preparation, never block the screen entirely!
    // Status is displayed inline so user can configure.
    isBlocked = false;
    gateState = missingCount === 0 ? "READY" : "NEEDS_ATTENTION";
  } else {
    // In calculation results tabs (cost, reports, simulation, sieve, optimization, journal, compliance_reports)
    if (missingCount > 0) {
      gateState = "BLOCKED";
      isBlocked = true;
    } else {
      gateState = "READY";
      isBlocked = false;
    }
  }

  // Summary Messages
  let summaryMessageAr = "✓ جميع متطلبات المواد مكتملة ومعتمدة هندسياً.";
  let summaryMessageEn = "✓ All required materials are complete, validated, and engineer approved.";
  let summaryMessageFr = "✓ Tous les matériaux requis sont complets, validés et approuvés.";

  if (gateState === "BLOCKED") {
    summaryMessageAr = `توجد ${missingCount} متطلبات أساسية غير مكتملة أو غير معتمدة تمنع إخراج الحسابات والتقرير.`;
    summaryMessageEn = `There are ${missingCount} missing or unvalidated requirements blocking calculation output.`;
    summaryMessageFr = `Il y a ${missingCount} exigences manquantes ou non validées bloquant les résultats.`;
  } else if (gateState === "NEEDS_ATTENTION") {
    summaryMessageAr = `بانتظار تعيين وإكمال خصائص المواد المطلوبة للخلطة (${missingCount} متبقية).`;
    summaryMessageEn = `Awaiting material selection and property completion (${missingCount} pending).`;
    summaryMessageFr = `En attente de sélection et de complétion des propriétés (${missingCount} en attente).`;
  }

  const debugTelemetry = {
    currentOperation,
    method,
    concreteType,
    selectedMaterialsCount: selectedCount,
    requiredMaterialsCount: requiredCount,
    missingCount,
    gate: gateState,
    reasons: roles.map(r => ({ role: r.role, reason: r.sourceReasonEn }))
  };

  // Development Telemetry Logging
  if (typeof process !== "undefined" && process.env?.NODE_ENV === "development") {
    console.log("[Verification Debug]", {
      "Current operation": currentOperation,
      "Method": method,
      "Concrete Type": concreteType,
      "Selected materials": selectedCount,
      "Required materials": requiredCount,
      "Missing": missingCount,
      "Gate": gateState,
      "Roles Detail": roles.map(r => ({
        role: r.role,
        required: r.isRequired,
        selectedId: r.selectedMaterialId,
        status: r.status,
        reason: r.sourceReasonEn
      }))
    });
  }

  return {
    gateState,
    isBlocked,
    requiredCount,
    selectedCount,
    readyCount,
    missingCount,
    roles,
    summaryMessageAr,
    summaryMessageEn,
    summaryMessageFr,
    debugTelemetry
  };
}
