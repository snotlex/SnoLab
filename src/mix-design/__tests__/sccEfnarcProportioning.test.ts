import { describe, expect, it } from "vitest";
import { calculateMixDesign } from "../../engine/calculateMixDesign";
import { createTestInput } from "../../__tests__/testHelper";

describe("SCC EFNARC-oriented proportioning", () => {
  it("uses volumetric powder/water/aggregate controls and closes at 1 m3", () => {
    const result: any = calculateMixDesign(createTestInput({
      concreteType: "SCC",
      fck28: 35,
      dMax: 16,
      sccPowderKgM3: 500,
      sccWaterPowderRatioByVolume: 0.90,
      sccCoarseAggregateVolumeFraction: 0.32,
      sccTargetSlumpFlowMm: 650,
      dosageSuper: 1.0
    }));

    expect(result.methodId).toBe("scc-specialized");
    expect(result.status).toBe("success");
    expect(result.calculationStatus).toBe("needs_trial_mix");
    expect(result.quantities.totalBinder).toBeCloseTo(500, 6);
    expect(result.engineeringAudit.waterPowderVolumeRatio).toBeCloseTo(0.90, 3);
    expect(result.engineeringAudit.coarseAggregateVolumeFraction).toBeCloseTo(0.32, 6);
    expect(result.absoluteVolumeTotal).toBeCloseTo(1000, 3);
    expect(result.fineAggregateKg).toBeGreaterThan(0);
  });

  it("does not derive SCC water from fck using an unsupported empirical equation", () => {
    const a: any = calculateMixDesign(createTestInput({
      concreteType: "SCC",
      fck28: 25,
      dMax: 16,
      sccPowderKgM3: 500,
      sccWaterPowderRatioByVolume: 0.90
    }));
    const b: any = calculateMixDesign(createTestInput({
      concreteType: "SCC",
      fck28: 60,
      dMax: 16,
      sccPowderKgM3: 500,
      sccWaterPowderRatioByVolume: 0.90
    }));

    expect(a.waterKg).toBeCloseTo(b.waterKg, 6);
    expect(a.quantities.totalBinder).toBeCloseTo(b.quantities.totalBinder, 6);
  });

  it("blocks an initial composition outside the EFNARC-oriented powder envelope", () => {
    const result: any = calculateMixDesign(createTestInput({
      concreteType: "SCC",
      dMax: 16,
      sccPowderKgM3: 650,
      sccWaterPowderRatioByVolume: 0.90
    }));

    expect(result.calculationStatus).toBe("blocked");
    expect(result.isValid).toBe(false);
  });
});
