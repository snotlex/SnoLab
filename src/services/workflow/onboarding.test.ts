import { describe, expect, it } from "vitest";
import { getOnboardingPath, ONBOARDING_PATHS } from "./onboarding";

describe("onboarding paths", () => {
  it("exposes exactly the two guided roles", () => {
    expect(ONBOARDING_PATHS.map(path => path.role)).toEqual(["design-engineer", "lab-quality"]);
  });

  it("gives every path minimum inputs, outputs and explicit boundaries", () => {
    for (const path of ONBOARDING_PATHS) {
      for (const language of ["ar", "fr", "en"] as const) {
        expect(path.minimumInputs[language].length).toBeGreaterThan(0);
        expect(path.expectedOutputs[language].length).toBeGreaterThan(0);
        expect(path.boundaries[language].length).toBeGreaterThan(0);
      }
    }
  });

  it("falls back safely to the design path for an unknown role", () => {
    expect(getOnboardingPath("unknown-role" as never).role).toBe("design-engineer");
  });
});
