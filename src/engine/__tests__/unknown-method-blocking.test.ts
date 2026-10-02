import { describe, expect, it } from "vitest";
import { EngineeringCore } from "../EngineeringCore";

describe("unknown calculation method safety gate", () => {
  it("blocks an unregistered method instead of calculating with Dreux-Gorisse", () => {
    const inputs: any = {
      selectedMethod: "method-that-does-not-exist",
      concreteType: "NSC",
      fck28: 30,
      cementClassStrength: 42.5,
      cementDensity: 3100,
      sandRelativeDensity: 2.65,
      gravelRelativeDensity: 2.68,
      moistureSand: 0,
      moistureGravel: 0,
      dMax: 20,
      aggregateType: "concasse",
      aggregateQuality: "standard",
      slump: 8,
      airContent: 1.5,
    };

    const result: any = EngineeringCore.createSession(
      {
        id: "unknown-method-test",
        name: "Unknown method test",
        client: "test",
        plant: "test",
        createdDate: new Date().toISOString(),
        inputs,
      } as any,
      [],
    ).mixDesignState.results;

    expect(result.status).toBe("blocked");
    expect(result.calculationStatus).toBe("blocked");
    expect(result.reasonCode).toBe("UNKNOWN_METHOD");
    expect(result.calculationSteps).toEqual([]);
    expect(result.methodName).toBe("method-that-does-not-exist");
    expect(result.cementKg).toBe(0);
  });
});
