import { describe, it, expect } from "vitest";
import { METHODS_REGISTRY } from "../methodRegistry";

describe("Method Registry Status and Classifications", () => {
  it("should have correct classifications for Dreux-Gorisse", () => {
    const dreux = METHODS_REGISTRY["dreux-gorisse"];
    expect(dreux).toBeDefined();
    expect(dreux.category).toBe("complete-design");
    expect(dreux.implementationStatus).toBe("complete");
  });
});
