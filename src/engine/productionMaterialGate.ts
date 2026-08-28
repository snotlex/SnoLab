import { EngineeringMaterial, MaterialSuitability, MixDesignInput } from "../types";

const APPROVED_STATUSES = new Set(["approved", "validated", "certified"]);
const ACTIVE_STATUSES = new Set(["active", "نشط"]);

function text(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function present(value: unknown): boolean {
  if (value === undefined || value === null || value === "") return false;
  if (typeof value === "number") return Number.isFinite(value);
  return true;
}

function finitePositive(value: unknown): boolean {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function getValue(material: any, keys: string[]): unknown {
  for (const key of keys) {
    if (present(material?.[key])) return material[key];
  }
  for (const key of keys) {
    if (present(material?.engineeringData?.[key])) return material.engineeringData[key];
  }
  return undefined;
}

function isSystemLikeMaterial(material: EngineeringMaterial): boolean {
  const id = text(material.id || material.MaterialID || material.MaterialCode);
  const source = text(material.source || material.sourceType || material.Source || material.SourceType);
  const createdBy = text(material.createdBy || material.CreatedBy);

  const blockedId = ["preset", "seeded", "fallback", "default", "demo"].some(token => id.includes(token));
  const blockedSource = ["system", "system_demo", "demo", "seeded", "default"].includes(source);
  const blockedCreator = ["system", "setup", "seed", "demo", "admin"].some(token => createdBy.includes(token));
  return Boolean(material.isDemo) || blockedId || blockedSource || blockedCreator;
}

function isApprovedAndActiveProduction(material: EngineeringMaterial): boolean {
  const approval = text(material.ApprovalStatus || material.approvalStatus || material.Status);
  const status = text(material.status || material.Status);
  return APPROVED_STATUSES.has(approval) && ACTIVE_STATUSES.has(status);
}

function categoryOf(material: EngineeringMaterial): string {
  const raw = text(material.category || material.Category || material.materialType || material.type);
  if (["sand", "رمال", "الركام الناعم"].includes(raw)) return "sand";
  if (["gravel", "حصى", "الركام الخشن", "aggregate"].includes(raw)) return "gravel";
  if (["cement", "إسمنت", "الأسمنت", "الاسمنت"].includes(raw)) return "cement";
  if (["water", "ماء", "الماء"].includes(raw)) return "water";
  if (["admixture", "chemical_admixture", "إضافات كيميائية", "الملدنات", "الملدنات الفائقة"].includes(raw)) return "admixture";
  if (["scm", "mineral_admixture", "إضافات معدنية", "الرماد المتطاير", "السيليكا فيوم", "خبث الأفران", "بودرة الحجر الجيري"].includes(raw)) return "scm";
  if (["fiber", "fibers", "fibres", "ألياف"].includes(raw)) return "fiber";
  if (["special_binder", "special binder", "مجلدات خاصة"].includes(raw)) return "special_binder";
  return raw;
}

function requiredProperties(material: EngineeringMaterial, category: string): string[] {
  const common: string[] = [];
  if (category === "cement") {
    if (!finitePositive(getValue(material, ["density", "Density", "ssdDensity", "specificGravity", "SpecificGravity"]))) common.push("density");
    if (!present(getValue(material, ["strengthClass", "cementClass", "cementClassStrength", "strength28d", "strength2d"]))) common.push("strengthClass");
  }
  if (category === "sand") {
    if (!finitePositive(getValue(material, ["density", "Density", "specificGravity", "SpecificGravity", "ssdDensity"]))) common.push("density");
    if (!present(getValue(material, ["absorption", "Absorption", "waterAbsorption"]))) common.push("absorption");
    if (!present(getValue(material, ["moisture", "Moisture", "moistureContent", "MoistureContent"]))) common.push("moisture");
    if (!present(getValue(material, ["finenessModulus", "FinenessModulus", "gradationData", "gradation_data"]))) common.push("gradation/finenessModulus");
  }
  if (category === "gravel") {
    if (!finitePositive(getValue(material, ["density", "Density", "specificGravity", "SpecificGravity", "ssdDensity"]))) common.push("density");
    if (!present(getValue(material, ["absorption", "Absorption", "waterAbsorption"]))) common.push("absorption");
    if (!present(getValue(material, ["moisture", "Moisture", "moistureContent", "MoistureContent"]))) common.push("moisture");
    if (!finitePositive(getValue(material, ["dMax", "dmax", "DMax", "Dmax"]))) common.push("dMax");
    if (!present(getValue(material, ["particleShape", "ParticleShape", "shapeIndex"]))) common.push("particleShape");
  }
  if (category === "water") {
    // Water density is treated as a physical constant only for volume conversion; it is not a required user property.
    if (!present(material.name || material.ArabicName || material.EnglishName)) common.push("name");
  }
  if (category === "admixture") {
    if (!finitePositive(getValue(material, ["density", "Density"]))) common.push("density");
    if (!present(getValue(material, ["recommendedDosage", "dosage", "Dosage"]))) common.push("recommendedDosage");
  }
  if (category === "scm") {
    if (!finitePositive(getValue(material, ["density", "Density", "specificGravity", "SpecificGravity"]))) common.push("density");
    if (!present(getValue(material, ["recommendedDosage", "dosage", "Dosage", "replacementPercent", "replacement"]))) common.push("dosage/replacementPercent");
  }
  if (category === "fiber") {
    if (!finitePositive(getValue(material, ["density", "Density", "fiberDensity"]))) common.push("density");
    if (!present(getValue(material, ["fiberDosageKgM3", "dosage", "recommendedDosage"]))) common.push("fiberDosageKgM3");
  }
  if (category === "special_binder") {
    if (!finitePositive(getValue(material, ["density", "Density", "specificGravity", "SpecificGravity"]))) common.push("density");
  }
  return common;
}

export function validateProductionMaterialSet(
  input: MixDesignInput,
  materials: EngineeringMaterial[] = []
): MaterialSuitability {
  if (input.bypassSuitabilityGate && process.env.NODE_ENV === "test") {
    return { status: "approved", missingMaterials: [], invalidMaterials: [], incompatibleMaterials: [], warnings: [], recommendations: [] };
  }

  const byId = new Map(materials.map(material => [material.id, material]));
  const selected: Array<{ key: string; id?: string }> = [
    { key: "cement", id: input.selectedCementId },
    { key: "sand", id: input.selectedSandId },
    { key: "gravel", id: input.selectedGravelId },
    { key: "water", id: input.selectedWaterId }
  ];

  const missingMaterials: string[] = [];
  const invalidMaterials: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  for (const entry of selected) {
    if (!entry.id) {
      missingMaterials.push(entry.key);
      continue;
    }
    const material = byId.get(entry.id);
    if (!material) {
      missingMaterials.push(entry.key);
      continue;
    }
    if (isSystemLikeMaterial(material)) {
      invalidMaterials.push(`${entry.key}:system_source`);
      continue;
    }
    if (!isApprovedAndActiveProduction(material)) {
      invalidMaterials.push(`${entry.key}:not_approved_or_inactive`);
      continue;
    }
    const expectedCategory = entry.key;
    const actualCategory = categoryOf(material);
    if (actualCategory !== expectedCategory) {
      invalidMaterials.push(`${entry.key}:incompatible_category`);
      continue;
    }
    const missingProps = requiredProperties(material, actualCategory);
    if (missingProps.length > 0) {
      invalidMaterials.push(`${entry.key}:missing_properties:${missingProps.join(",")}`);
    }
  }

  const optional: Array<{ key: string; id?: string }> = [
    { key: "admixture", id: input.selectedAdmixtureId },
    { key: "scm", id: input.selectedScmId },
    { key: "fiber", id: input.selectedFiberId },
    { key: "special_binder", id: input.selectedSpecialBinderId }
  ];
  for (const entry of optional) {
    if (!entry.id) continue;
    const material = byId.get(entry.id);
    if (!material) {
      missingMaterials.push(entry.key);
      continue;
    }
    if (isSystemLikeMaterial(material)) {
      invalidMaterials.push(`${entry.key}:system_source`);
      continue;
    }
    if (!isApprovedAndActiveProduction(material)) {
      invalidMaterials.push(`${entry.key}:not_approved_or_inactive`);
      continue;
    }
    const actualCategory = categoryOf(material);
    if (actualCategory !== entry.key) {
      invalidMaterials.push(`${entry.key}:incompatible_category`);
      continue;
    }
    const missingProps = requiredProperties(material, actualCategory);
    if (missingProps.length > 0) invalidMaterials.push(`${entry.key}:missing_properties:${missingProps.join(",")}`);
  }

  if (input.specialBinderReplacementPercent && input.specialBinderReplacementPercent > 0 && !input.selectedSpecialBinderId) {
    missingMaterials.push("special_binder");
  }

  if (invalidMaterials.some(item => item.includes(":missing_properties:"))) {
    warnings.push("لا يمكن تشغيل الحساب لأن إحدى المواد المختارة تفتقد خصائص هندسية مطلوبة.");
    recommendations.push("افتح المادة، أكمل جميع الخصائص المحددة، ثم أعد اعتمادها قبل استخدامها في التصميم.");
  }
  if (invalidMaterials.some(item => item.includes("system_source"))) {
    warnings.push("المواد النظامية أو التجريبية ليست صالحة كمدخلات إنتاجية للحساب.");
    recommendations.push("اختر مادة حقيقية مستوردة أو مضافة أو مخبرية بعد اعتمادها وتفعيلها.");
  }
  if (invalidMaterials.some(item => item.includes("not_approved_or_inactive"))) {
    warnings.push("توجد مادة غير معتمدة أو غير نشطة ضمن المدخلات.");
    recommendations.push("لاستخدام المادة في الحساب، يجب أن تكون Approved/Validated/Certified وحالتها Active/نشط.");
  }

  const status: MaterialSuitability["status"] = missingMaterials.length || invalidMaterials.length ? "blocked" : "approved";
  return {
    status,
    missingMaterials,
    invalidMaterials,
    incompatibleMaterials: invalidMaterials.filter(item => item.includes("incompatible_category")),
    warnings,
    recommendations,
    reason: missingMaterials.length ? "missing_material_data" : invalidMaterials.length ? "invalid_material_data" : undefined
  };
}
