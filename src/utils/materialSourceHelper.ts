import { EngineeringMaterial } from "../types";

/**
 * SnoLab Material Source Governance:
 * Strictly separates System Materials (مواد النظام) from User Materials (مواد المستخدم).
 * 
 * Rules:
 * 1. System materials are immutable, standard reference materials provided by SnoLab.
 * 2. User materials are created manually, imported via Excel, or cloned/forked from system materials.
 * 3. An imported or user-added material NEVER becomes a system material under any circumstance.
 * 4. Editing a system material creates a forked user material copy; the system material remains intact.
 * 5. System materials cannot be deleted or corrupted by the user.
 */

/**
 * Determines if a material belongs strictly to SnoLab System Materials.
 */
export function isSystemMaterial(m: any): boolean {
  if (!m) return false;

  // 1. Explicit materialSource flag takes precedence
  if (m.materialSource === "system") return true;
  if (m.materialSource === "user") return false;

  // 2. Explicit boolean flags
  if (m.isCustom === true) return false;
  if (m.source === "user_import" || m.source === "user_custom" || m.source === "user") return false;
  if (m.sourceType === "imported" || m.sourceType === "user_created") return false;

  // 3. System indicators
  if (m.isSystem === true) return true;
  if (m.sourceType === "system_demo") return true;

  const idStr = String(m.id || m.Id || "").toLowerCase();

  // Known system prefixes
  if (
    idStr.startsWith("sys-") ||
    idStr.startsWith("sys_") ||
    idStr.startsWith("preset-") ||
    idStr.includes("seeded") ||
    idStr.includes("fallback")
  ) {
    return true;
  }

  const knownSystemIds = [
    "sand-oued-", "sand-larbaa-", "sand-bouira-",
    "gravel-biskra-", "gravel-jijel-",
    "cem-chlef", "cem-slag-", "cem-silica-", "admixture-visco"
  ];
  if (knownSystemIds.some(sysId => idStr.includes(sysId))) {
    return true;
  }

  const createdBy = String(m.createdBy || m.CreatedBy || "").toLowerCase();
  if (
    createdBy.includes("snolab") ||
    createdBy.includes("central reference") ||
    createdBy.includes("system standard")
  ) {
    return true;
  }

  // Default: if it doesn't match known system markers, it is a user material
  return false;
}

/**
 * Determines if a material is a User Material (مواد المستخدم / موادي).
 */
export function isUserMaterial(m: any): boolean {
  if (!m) return false;
  return !isSystemMaterial(m);
}

/**
 * Returns the normalized materialSource tag.
 */
export function getMaterialSource(m: any): "system" | "user" {
  return isSystemMaterial(m) ? "system" : "user";
}

/**
 * Normalizes an EngineeringMaterial to ensure materialSource, isSystem, and isCustom are always explicitly populated.
 */
export function normalizeMaterialSource(m: EngineeringMaterial): EngineeringMaterial {
  const isSys = isSystemMaterial(m);
  return {
    ...m,
    materialSource: isSys ? "system" : "user",
    isSystem: isSys,
    isCustom: !isSys,
    source: isSys ? (m.source || "system") : (m.source || "user"),
    sourceType: isSys ? (m.sourceType || "system_demo") : (m.sourceType || "user_created"),
    sourceLabel: isSys 
      ? (m.sourceLabel || "System Reference") 
      : (m.source === "user_import" ? "User Import (Excel)" : "User Material")
  };
}

/**
 * Ensures an entire list of materials is normalized with clear source boundaries.
 */
export function ensureMaterialsPartitioned(materials: EngineeringMaterial[]): {
  systemMaterials: EngineeringMaterial[];
  userMaterials: EngineeringMaterial[];
  normalizedAll: EngineeringMaterial[];
} {
  const normalizedAll = (materials || []).map(normalizeMaterialSource);
  const systemMaterials = normalizedAll.filter(m => m.materialSource === "system");
  const userMaterials = normalizedAll.filter(m => m.materialSource === "user");

  return { systemMaterials, userMaterials, normalizedAll };
}

/**
 * Forks a System Material into a new User Material (Requirement 6).
 * Creates an independent, editable user copy linked to the original system material.
 */
export function forkSystemMaterial(
  systemMat: EngineeringMaterial,
  customName?: string,
  userEmail: string = "المستخدم"
): EngineeringMaterial {
  const timestamp = Date.now();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const newId = `USR-${systemMat.id.replace(/^(SYS-|sys_)/i, "")}-${randomSuffix}`;

  const defaultArName = customName || `${systemMat.name} - مخصص`;
  const defaultEnName = `${systemMat.englishName || systemMat.name} - Custom`;

  const userCopy: EngineeringMaterial = {
    ...systemMat,
    id: newId,
    MaterialID: newId,
    MaterialCode: newId,
    name: defaultArName,
    englishName: defaultEnName,
    ArabicName: defaultArName,
    EnglishName: defaultEnName,
    
    // Explicit User Material Ownership
    materialSource: "user",
    isSystem: false,
    isCustom: true,
    source: "user_custom",
    sourceType: "user_created",
    sourceLabel: "Customized from System Reference",
    originalSystemMaterialId: systemMat.id,
    ownerId: "user_local",
    createdBy: userEmail,
    createdDate: new Date().toISOString().split("T")[0],
    updatedDate: new Date().toISOString().split("T")[0],
    updatedAt: timestamp,
    version: 1,
    status: "نشط",
    ApprovalStatus: "Approved",
    readOnly: false,
    lifecycleHistory: [
      {
        date: new Date().toISOString().split("T")[0],
        version: 1,
        author: userEmail,
        changes: `إنشاء نسخة مستخدم مخصصة مشتقة من مادة النظام الأصلية (${systemMat.name} [${systemMat.id}])`,
        approvalStatus: "Approved"
      }
    ]
  };

  return userCopy;
}
