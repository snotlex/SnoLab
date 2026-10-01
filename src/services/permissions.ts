export type UserRole = "operator" | "lab-technician" | "qc-engineer" | "design-engineer" | "reviewer" | "approver" | "administrator";
export type Permission = "edit-inputs" | "record-trial-mix" | "approve-test" | "open-ncr" | "approve-production" | "delete-version" | "manage-calibration";
const MATRIX: Record<UserRole, Permission[]> = {
  operator: ["record-trial-mix", "open-ncr"],
  "lab-technician": ["record-trial-mix", "approve-test", "open-ncr"],
  "qc-engineer": ["approve-test", "open-ncr", "manage-calibration"],
  "design-engineer": ["edit-inputs", "record-trial-mix", "open-ncr"],
  reviewer: ["approve-test", "open-ncr"],
  approver: ["approve-production", "open-ncr"],
  administrator: ["edit-inputs", "record-trial-mix", "approve-test", "open-ncr", "approve-production", "delete-version", "manage-calibration"]
};
export const permissionsFor = (role: UserRole) => MATRIX[role] || [];
export const can = (role: UserRole, permission: Permission) => permissionsFor(role).includes(permission);
export const separationOfDuties = (creatorId: string | undefined, approverId: string | undefined) => Boolean(creatorId && approverId && creatorId !== approverId);
export const isUserRole = (value: unknown): value is UserRole => typeof value === "string" && Object.prototype.hasOwnProperty.call(MATRIX, value);
export const resolveUserRole = (value: unknown, fallback: UserRole = "design-engineer"): UserRole => isUserRole(value) ? value : fallback;
