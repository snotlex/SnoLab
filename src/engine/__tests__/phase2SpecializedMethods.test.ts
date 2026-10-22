import { describe, expect, it } from "vitest";
import { MixDesignMethodRegistry } from "../../mix-design/core/MixDesignMethodRegistry";
import { selectConcreteMixDesignRoute } from "../../mix-design/core/concreteMixDesignSelector";
import {
  calculateGpcMix,
  calculateRacMix,
  calculateShcMix,
  calculateShotcreteMix
} from "../../mix-design/methods/phase2/Phase2SpecializedMethods";

const materials = [
  { id: "cement-1", name: "Cement", category: "cement", density: 3.15 },
  { id: "sand-1", name: "Sand", category: "fine aggregate", density: 2.65 },
  { id: "gravel-1", name: "Gravel", category: "coarse aggregate", density: 2.65 },
  { id: "scm-1", name: "Fly ash precursor", category: "SCM", density: 2.20 },
  { id: "adm-1", name: "Activator / admixture", category: "admixture", density: 1.40 },
  { id: "water-1", name: "Water", category: "water", density: 1.00 }
];

function input(extra: Record<string, unknown>) {
  return {
    concreteType: "GPC",
    fck28: 35,
    controlClass: "normal",
    cementType: "CEM I",
    cementClassStrength: 42.5,
    dMax: 20,
    slump: 10,
    aggregateType: "concasse",
    aggregateQuality: "standard",
    hasPumping: false,
    sandRelativeDensity: 2.65,
    gravelRelativeDensity: 2.65,
    cementDensity: 3150,
    airContent: 2,
    moistureSand: 0,
    moistureGravel: 0,
    selectedMethod: "dreux",
    selectedCementId: "cement-1",
    selectedSandId: "sand-1",
    selectedGravelId: "gravel-1",
    selectedWaterId: "water-1",
    selectedWaterName: "Water",
    selectedScmId: "scm-1",
    selectedAdmixtureId: "adm-1",
    materialsDatabase: materials,
    ...extra
  } as any;
}

describe("phase-2 specialized concrete engines", () => { // regression suite
  it("activates all four phase-2 routes", () => {
    for (const type of ["GPC", "RAC", "SHC", "SHOTCRETE"]) {
      const route = selectConcreteMixDesignRoute({ concreteType: type } as any);
      expect(route.support).toBe("active");
      expect(route.mode).toBe("specialized");
    }
  });

  it("registers GPC, RAC, SHC and shotcrete", () => {
    const registry = MixDesignMethodRegistry.getInstance();
    for (const id of [
      "geopolymer-specialized",
      "recycled-aggregate-specialized",
      "self-healing-specialized",
      "shotcrete-specialized"
    ]) {
      expect(registry.has(id)).toBe(true);
      expect(registry.get(id).metadata.status).toBe("active");
    }
  });

  it("closes GPC absolute volume", () => {
    const result = calculateGpcMix(input({
      concreteType: "GPC",
      gpcPrecursorKgM3: 400,
      gpcActivatorLiquidKgM3: 200,
      gpcWaterKgM3: 160,
      gpcWaterBinderRatio: 0.40,
      gpcActivatorToPrecursorRatio: 0.50,
      gpcCoarseAggregateVolumeFraction: 0.35
    }));
    expect(result.calculationStatus).toBe("needs_trial_mix");
    expect(result.absoluteVolumeTotal).toBeCloseTo(1000, 1);
    expect(result.validation.isValid).toBe(true);
  });

  it("calculates cementless GPC against a populated material repository", () => {
    const gpcMaterials = materials.filter((material) => material.id !== "cement-1");
    const result = calculateGpcMix(input({
      concreteType: "GPC",
      selectedCementId: undefined,
      cementType: undefined,
      cementClassStrength: undefined,
      cementDensity: undefined,
      materialsDatabase: gpcMaterials,
      gpcPrecursorKgM3: 400,
      gpcActivatorLiquidKgM3: 200,
      gpcWaterKgM3: 160,
      gpcWaterBinderRatio: 0.40,
      gpcActivatorToPrecursorRatio: 0.50,
      gpcCoarseAggregateVolumeFraction: 0.35
    }));
    expect(result.calculationStatus).toBe("needs_trial_mix");
    expect(result.quantities?.cement).toBe(0);
    expect(result.absoluteVolumeTotal).toBeCloseTo(1000, 1);
    expect(result.validation.isValid).toBe(true);
    expect(result.recommendations.join(" ")).not.toContain("Required material not found: cement");
  });

  it("closes RAC volume and exposes moisture conditioning", () => {
    const result = calculateRacMix(input({
      concreteType: "RAC",
      racCementKgM3: 360,
      racWaterKgM3: 165,
      racWaterBinderRatio: 0.458,
      racCoarseAggregateKgM3: 1050,
      racReplacementPercent: 50,
      racRecycledAggregateDensityKgM3: 2350,
      racRecycledAbsorptionPercent: 6,
      racPreSaturationPercent: 70,
      racSuperplasticizerDosage: 0
    }));
    expect(result.calculationStatus).toBe("needs_trial_mix");
    expect(result.absoluteVolumeTotal).toBeCloseTo(1000, 1);
    expect(result.validation.isValid).toBe(true);
  });



  it("subtracts current recycled-aggregate moisture before computing extra prewet water", () => {
    const result: any = calculateRacMix(input({
      concreteType: "RAC",
      moistureGravel: 4,
      racCementKgM3: 360,
      racWaterKgM3: 165,
      racWaterBinderRatio: 0.458,
      racCoarseAggregateKgM3: 1050,
      racReplacementPercent: 50,
      racRecycledAggregateDensityKgM3: 2350,
      racRecycledAbsorptionPercent: 6,
      racPreSaturationPercent: 70,
      racSuperplasticizerDosage: 0
    }));

    const prewetStep = result.trace.find((step: any) => step.stepId === "rac-3");
    expect(prewetStep.output).toBeCloseTo(1.05, 6);
  });

  it("blocks RAC when recycled aggregate replacement is zero", () => {
    const result = calculateRacMix(input({
      concreteType: "RAC",
      racCementKgM3: 360,
      racWaterKgM3: 165,
      racWaterBinderRatio: 0.458,
      racCoarseAggregateKgM3: 1050,
      racReplacementPercent: 0,
      racRecycledAggregateDensityKgM3: 2350,
      racRecycledAbsorptionPercent: 6,
      racPreSaturationPercent: 70,
      racSuperplasticizerDosage: 0
    }));

    expect(result.calculationStatus).toBe("blocked");
    expect(result.validation.isValid).toBe(false);
    expect(result.errors.join(" ")).toContain("replacement");
  });

  it("includes healing-agent volume in SHC closure", () => {
    const result = calculateShcMix(input({
      concreteType: "SHC",
      shcCementKgM3: 350,
      shcWaterKgM3: 160,
      shcWaterBinderRatio: 0.457,
      shcHealingAgentDosageKgM3: 20,
      shcHealingAgentDensityKgM3: 1200,
      shcHealingAgentType: "microcapsules",
      shcCoarseAggregateVolumeFraction: 0.40,
      shcSuperplasticizerDosage: 1.2
    }));
    expect(result.calculationStatus).toBe("needs_trial_mix");
    expect(result.absoluteVolumeTotal).toBeCloseTo(1000, 1);
    expect(result.validation.isValid).toBe(true);
  });

  it("uses explicit accelerator and W/B inputs for shotcrete", () => {
    const result = calculateShotcreteMix(input({
      concreteType: "SHOTCRETE",
      selectedScmId: "scm-1",
      shotcreteWaterKgM3: 180,
      shotcreteWaterBinderRatio: 0.45,
      shotcreteCementFraction: 0.90,
      shotcreteAcceleratorPercent: 2,
      shotcreteSuperplasticizerPercent: 1,
      shotcreteCoarseAggregateVolumeFraction: 0.25
    }));
    expect(result.calculationStatus).toBe("needs_trial_mix");
    expect(result.absoluteVolumeTotal).toBeCloseTo(1000, 1);
    expect(result.validation.isValid).toBe(true);
    const acceleratorCheck = (result as any).compliance?.checks?.find((check: any) => check.parameter === "accelerator");
    expect(acceleratorCheck?.requirement).toContain("0-12%");
    expect(acceleratorCheck?.status).toBe("compliant");
  });
});
