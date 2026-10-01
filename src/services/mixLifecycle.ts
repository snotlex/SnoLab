export type MixLifecycleStatus = "draft" | "needs-review" | "approved";

export interface MixLifecycleCheck {
  criticalErrors: number;
  warnings: number;
  hasRequiredInputs: boolean;
}

export function deriveMixLifecycleStatus(check: MixLifecycleCheck): Exclude<MixLifecycleStatus, "approved"> {
  if (check.criticalErrors > 0 || !check.hasRequiredInputs) return "draft";
  return check.warnings > 0 ? "needs-review" : "draft";
}

export function canApproveMix(check: MixLifecycleCheck): { allowed: boolean; reason?: "critical-errors" | "missing-inputs" | "warnings" } {
  if (check.criticalErrors > 0) return { allowed: false, reason: "critical-errors" };
  if (!check.hasRequiredInputs) return { allowed: false, reason: "missing-inputs" };
  if (check.warnings > 0) return { allowed: false, reason: "warnings" };
  return { allowed: true };
}
