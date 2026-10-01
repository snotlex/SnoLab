import { describe, expect, it } from "vitest";
import { canApproveMix, deriveMixLifecycleStatus } from "../services/mixLifecycle";

describe("mix lifecycle governance", () => {
  it("keeps incomplete work as a draft without inventing approval", () => {
    expect(deriveMixLifecycleStatus({ criticalErrors: 2, warnings: 0, hasRequiredInputs: false })).toBe("draft");
    expect(canApproveMix({ criticalErrors: 2, warnings: 0, hasRequiredInputs: false })).toEqual({ allowed: false, reason: "critical-errors" });
  });

  it("requires engineering review when only warnings remain", () => {
    expect(deriveMixLifecycleStatus({ criticalErrors: 0, warnings: 1, hasRequiredInputs: true })).toBe("needs-review");
    expect(canApproveMix({ criticalErrors: 0, warnings: 1, hasRequiredInputs: true })).toEqual({ allowed: false, reason: "warnings" });
  });

  it("allows approval only after all required inputs pass without warnings", () => {
    expect(canApproveMix({ criticalErrors: 0, warnings: 0, hasRequiredInputs: true })).toEqual({ allowed: true });
  });
});
