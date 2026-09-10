/**
 * SnoLab Material Approval & Governance Service
 * 
 * Manages Engineer Approval records, sign-off logs, overrides, and verification audit trails.
 */

import { EngineeringMaterial } from "../types";
import { normalizeProjectId } from "./materialRecommendationEngine";
import { isSystemMaterial } from "../utils/materialSourceHelper";

export interface EngineerSignOffRecord {
  approvalId: string;
  projectId?: string;
  concreteType: string;
  mixDesignMethod: string;
  targetStrength: number;
  engineerName: string;
  engineerTitle?: string;
  licenseNumber?: string;
  approvalDate: string; // ISO String
  approvalTimestamp: number;
  notes?: string;
  status: "approved" | "approved_with_conditions" | "rejected";
  approvedMaterials: {
    role: string;
    materialId: string;
    materialName: string;
    compatibilityScore: number;
    density?: number;
    notes?: string;
  }[];
  conditions?: string[];
  signatureHash?: string;
}

export interface MaterialGovernanceAuditEntry {
  id: string;
  materialId: string;
  materialName: string;
  action: "created" | "updated" | "approved" | "rejected" | "invalidated" | "override_applied";
  performer: string;
  timestamp: number;
  dateStr: string;
  details: string;
  previousValues?: Record<string, any>;
  newValues?: Record<string, any>;
}

const STORAGE_APPROVALS_KEY = "snolab_engineer_approvals";
const STORAGE_AUDIT_LOG_KEY = "snolab_material_governance_audit";

/**
 * Saves an engineer sign-off record for a set of approved materials in the active project.
 */
export function recordEngineerApproval(record: Omit<EngineerSignOffRecord, "approvalId" | "approvalTimestamp" | "approvalDate">): EngineerSignOffRecord {
  const now = new Date();
  const fullRecord: EngineerSignOffRecord = {
    ...record,
    projectId: record.projectId ? normalizeProjectId(record.projectId) : undefined,
    approvalId: `APPR-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
    approvalDate: now.toISOString(),
    approvalTimestamp: now.getTime(),
    signatureHash: `SIG-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
  };

  try {
    const existing = getStoredApprovals();
    existing.unshift(fullRecord);
    // Keep max 25 records in local vault
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem(STORAGE_APPROVALS_KEY, JSON.stringify(existing.slice(0, 25)));
      } catch (quotaErr) {
        localStorage.setItem(STORAGE_APPROVALS_KEY, JSON.stringify(existing.slice(0, 5)));
      }
    }
  } catch (e) {
    console.warn("Could not persist engineer approval record to localStorage:", e);
  }

  // Also log audit entries for each material
  for (const mat of fullRecord.approvedMaterials) {
    logGovernanceAudit({
      materialId: mat.materialId,
      materialName: mat.materialName,
      action: "approved",
      performer: fullRecord.engineerName,
      details: `Material approved by supervising engineer for ${fullRecord.concreteType} (${fullRecord.mixDesignMethod}) with compatibility score ${mat.compatibilityScore}%`
    });
  }

  return fullRecord;
}

/**
 * Retrieves all stored engineer approval records.
 */
export function getStoredApprovals(): EngineerSignOffRecord[] {
  try {
    if (typeof localStorage === "undefined") return [];
    const raw = localStorage.getItem(STORAGE_APPROVALS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Retrieves latest approval record for a specific concrete type and method if available.
 */
export function getLatestApprovalForContext(concreteType: string, method: string, projectId?: any): EngineerSignOffRecord | null {
  const list = getStoredApprovals();
  const rawConcrete = typeof concreteType === "string" ? concreteType : (concreteType as any)?.code || "NSC";
  const cType = String(rawConcrete || "NSC").toUpperCase();
  const mType = String(method || "dreux").toLowerCase();
  const targetProjectId = projectId ? normalizeProjectId(projectId) : undefined;
  
  return list.find(r => 
    String((r as any)?.concreteType || "NSC").toUpperCase() === cType && 
    String((r as any)?.mixDesignMethod || "dreux").toLowerCase() === mType &&
    (!targetProjectId || r.projectId === targetProjectId)
  ) || null;
}

/**
 * Logs a material governance action to the audit trail.
 */
export function logGovernanceAudit(entry: {
  materialId: string;
  materialName: string;
  action: MaterialGovernanceAuditEntry["action"];
  performer: string;
  details: string;
  previousValues?: Record<string, any>;
  newValues?: Record<string, any>;
}): void {
  try {
    if (typeof localStorage === "undefined") return;
    const now = new Date();
    const fullEntry: MaterialGovernanceAuditEntry = {
      id: `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now.getTime(),
      dateStr: now.toLocaleString(),
      ...entry
    };
    const raw = localStorage.getItem(STORAGE_AUDIT_LOG_KEY);
    const existing: MaterialGovernanceAuditEntry[] = raw ? JSON.parse(raw) : [];
    existing.unshift(fullEntry);
    localStorage.setItem(STORAGE_AUDIT_LOG_KEY, JSON.stringify(existing.slice(0, 100)));
  } catch (e) {
    console.warn("Could not log material governance audit:", e);
  }
}

/**
 * Checks if a material is approved by an engineer or system-certified.
 * Rule: READY IS NOT APPROVED.
 * Quality classification ("excellent", "standard") cannot confer engineer approval.
 * System materials are certified reference standards only when verified by isSystemMaterial.
 * User materials require explicit engineer approval.
 */
export function isMaterialApprovedByEngineer(material: EngineeringMaterial): boolean {
  if (!material) return false;

  // System reference materials are pre-certified standards
  if (isSystemMaterial(material)) {
    return true;
  }

  // Explicit unapproved markers always override
  const rawStatus = String(
    material.ApprovalStatus || 
    (material as any).approvalStatus || 
    material.Status || 
    (material as any).status || 
    ""
  ).trim().toLowerCase();

  if (
    rawStatus === "pending review" || 
    rawStatus === "pending approval" || 
    rawStatus === "incomplete" || 
    rawStatus === "draft" || 
    rawStatus === "rejected" || 
    rawStatus === "archived" ||
    rawStatus === "\u0642\u064a\u062f \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629" ||
    rawStatus === "\u0645\u0633\u0648\u062f\u0629" ||
    rawStatus === "\u0645\u0631\u0641\u0648\u0636" ||
    rawStatus === "\u0645\u0648\u0642\u0648\u0641"
  ) {
    return false;
  }

  // Check canonical engineerApproval record
  if ((material as any).engineerApproval?.status === "approved") {
    return true;
  }

  // Check canonical ApprovalStatus
  return rawStatus === "approved" || rawStatus === "certified" || rawStatus === "\u0645\u0639\u062a\u0645\u062f";
}
