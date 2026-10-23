import type { LaboratoryDomainId } from "../types/laboratoryDomain";
import type { AcceptanceProfile } from "./laboratoryAcceptanceEngine";

export interface LaboratoryAcceptanceContext {
  projectId: string;
  domainId: LaboratoryDomainId;
  testDefinitionId: string;
  standardId?: string;
  materialClass?: string;
  soilLayer?: string;
  concreteClass?: string;
  exposureClass?: string;
  placementMethod?: string;
  tags?: Record<string, string | number | boolean>;
}

export interface RegisteredAcceptanceProfile extends AcceptanceProfile {
  projectId: string;
  createdAt: string;
  updatedAt: string;
  revision: number;
}

export function validateAcceptanceProfile(profile: AcceptanceProfile): string[] {
  const errors: string[] = [];
  if (!profile.id.trim()) errors.push("ACCEPTANCE_PROFILE_ID_REQUIRED");
  if (!profile.testDefinitionId.trim()) errors.push("ACCEPTANCE_TEST_DEFINITION_REQUIRED");
  if (!profile.standardId.trim()) errors.push("ACCEPTANCE_STANDARD_REQUIRED");
  if (!profile.sourceDocumentId.trim()) errors.push("ACCEPTANCE_SOURCE_DOCUMENT_REQUIRED");
  if (!profile.unit.trim()) errors.push("ACCEPTANCE_UNIT_REQUIRED");
  if (profile.status === "Active" && profile.operator !== "informational") {
    if (profile.operator === "min" && profile.lowerLimit === undefined) errors.push("ACCEPTANCE_MIN_LIMIT_REQUIRED");
    if (profile.operator === "max" && profile.upperLimit === undefined) errors.push("ACCEPTANCE_MAX_LIMIT_REQUIRED");
    if (profile.operator === "between" && (profile.lowerLimit === undefined || profile.upperLimit === undefined)) errors.push("ACCEPTANCE_BOUNDS_REQUIRED");
    if (profile.operator === "target_with_tolerance" && (profile.targetValue === undefined || profile.tolerance === undefined)) errors.push("ACCEPTANCE_TARGET_TOLERANCE_REQUIRED");
  }
  return errors;
}

function matchesContext(profile: AcceptanceProfile, context: LaboratoryAcceptanceContext): boolean {
  if (profile.domainId !== context.domainId || profile.testDefinitionId !== context.testDefinitionId) return false;
  if (profile.appliesWhen.standardId && profile.appliesWhen.standardId !== context.standardId) return false;
  const { tags, ...baseContext } = context;
  const contextValues: Record<string, string | number | boolean | undefined> = { ...baseContext, ...(tags || {}) };
  return Object.entries(profile.appliesWhen).every(([key, expected]) => contextValues[key] === expected);
}

export function findAcceptanceProfile(profiles: AcceptanceProfile[], context: LaboratoryAcceptanceContext): AcceptanceProfile | undefined {
  const candidates = profiles.filter(profile => profile.status === "Active" && matchesContext(profile, context));
  if (!candidates.length) return undefined;
  const specificity = (profile: AcceptanceProfile) => Object.keys(profile.appliesWhen).length;
  return [...candidates].sort((a, b) => specificity(b) - specificity(a))[0];
}

export function registerAcceptanceProfile(profile: RegisteredAcceptanceProfile, registry: RegisteredAcceptanceProfile[] = []): RegisteredAcceptanceProfile[] {
  const errors = validateAcceptanceProfile(profile);
  if (errors.length) throw new Error(errors.join(","));
  return [...registry.filter(item => !(item.projectId === profile.projectId && item.id === profile.id)), { ...profile }];
}

export function reviewAcceptanceProfile(profile: AcceptanceProfile, reviewerId: string, reviewedAt = new Date().toISOString(), reviewNote = ""): AcceptanceProfile {
  if (!reviewerId.trim()) throw new Error("ACCEPTANCE_REVIEWER_REQUIRED");
  if (profile.status !== "Draft") throw new Error("ACCEPTANCE_PROFILE_NOT_DRAFT");
  const reviewed: AcceptanceProfile = { ...profile, status: "Active", reviewedBy: reviewerId, reviewedAt, reviewNote: reviewNote.trim() || undefined };
  const errors = validateAcceptanceProfile(reviewed);
  if (errors.length) throw new Error(errors.join(","));
  return reviewed;
}
