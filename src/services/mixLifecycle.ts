export type MixLifecycleStatus =
  | "draft"
  | "data-validation"
  | "engineering-review"
  | "trial-mix-required"
  | "trial-mix-tested"
  | "performance-verified"
  | "approved"
  | "superseded"
  | "archived"
  // Legacy aliases kept for previously stored projects.
  | "needs-review";

export interface MixLifecycleCheck {
  criticalErrors: number;
  warnings: number;
  hasRequiredInputs: boolean;
  hasValidatedInputs?: boolean;
  hasPassedTrialMix?: boolean;
  performanceVerified?: boolean;
  isApproved?: boolean;
  isSuperseded?: boolean;
  isArchived?: boolean;
}

export function deriveMixLifecycleStatus(check: MixLifecycleCheck): MixLifecycleStatus {
  if (check.isArchived) return "archived";
  if (check.isSuperseded) return "superseded";
  if (check.isApproved) return "approved";
  if (check.performanceVerified) return "performance-verified";
  if (check.hasPassedTrialMix) return "trial-mix-tested";
  if (!check.hasRequiredInputs || check.criticalErrors > 0) return "draft";
  if (check.hasValidatedInputs === false) return "data-validation";
  if (check.warnings > 0) return "engineering-review";
  return "trial-mix-required";
}

export type LifecycleApprovalBlockReason = "critical-errors" | "missing-inputs" | "warnings" | "trial-mix-required" | "performance-verification-required";

export function canApproveMix(check: MixLifecycleCheck): { allowed: boolean; reason?: LifecycleApprovalBlockReason } {
  if (check.criticalErrors > 0) return { allowed: false, reason: "critical-errors" };
  if (!check.hasRequiredInputs) return { allowed: false, reason: "missing-inputs" };
  if (check.warnings > 0) return { allowed: false, reason: "warnings" };
  if (!check.hasPassedTrialMix) return { allowed: false, reason: "trial-mix-required" };
  if (!check.performanceVerified) return { allowed: false, reason: "performance-verification-required" };
  return { allowed: true };
}

export const LIFECYCLE_STEPS: readonly MixLifecycleStatus[] = [
  "draft", "data-validation", "engineering-review", "trial-mix-required", "trial-mix-tested", "performance-verified", "approved"
];

export function isLifecycleStatus(value: unknown): value is MixLifecycleStatus {
  return typeof value === "string" && ["draft", "data-validation", "engineering-review", "trial-mix-required", "trial-mix-tested", "performance-verified", "approved", "superseded", "archived", "needs-review"].includes(value);
}
