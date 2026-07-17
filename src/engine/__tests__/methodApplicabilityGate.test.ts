import { describe, it, expect } from "vitest";
import { calculateDreuxGorisse } from "../../utils";
import { MixDesignInput } from "../../types";

describe("Dreux-Gorisse Method Applicability & Strength Feasibility Gates", () => {
  const getBaseInput = (): MixDesignInput => ({
    bypassSuitabilityGate: true,
    fck28: 25, // C25/30
    controlClass: "normal",
    cementType: "CEM_II",
    cementClassStrength: 42.5,
    dMax: 20,
    slump: 8,
    aggregateType: "concasse" as any,
    aggregateQuality: "standard" as any,
    hasPumping: false,
    sandRelativeDensity: 2.65,
    gravelRelativeDensity: 2.68,
    cementDensity: 3100,
    airContent: 1.5,
    moistureSand: 0.0,
    moistureGravel: 0.0,
    sandAbsorption: 1.5,
    gravelAbsorption: 0.8,
    admixtures: [],
    dosageSuper: 1.0,
    dosageAir: 0.0,
    dosageRetarder: 0.0,
    dosageAccelerator: 0.0,
    dosageSilicaFume: 0.0,
    dosageFlyAsh: 0.0,
    dosageSlag: 0.0,
    selectedMethod: "dreux",
    exposureClass: "X0",
    durabilityLevel: "standard",
    carbonationLevel: "none",
    chloridesLevel: "none",
    sulfatesLevel: "none",
    priceCement: 17,
    priceSand: 2.5,
    priceGravel: 2.8,
    priceSuper: 120,
    priceAir: 95,
    priceRetarder: 85,
    priceAccelerator: 110,
    priceSilicaFume: 60,
    priceFlyAsh: 35,
    priceSlag: 30,
    priceLabor: 0,
    priceWater: 0,
    sandType: "Standard Sand",
    gravelType: "Standard Gravel",
    autoDensities: true
  });

  it("should verify that standard C25 concrete is fully applicable and valid", () => {
    const input = getBaseInput();
    const res = calculateDreuxGorisse(input);
    expect(res).toBeDefined();
    expect(res.isValid).toBe(true);
    expect(res.methodApplicability).toBeDefined();
    expect(res.methodApplicability?.applicable).toBe(true);
    expect(res.methodApplicability?.level).toBe("applicable");
    expect(res.methodApplicability?.reasons.length).toBe(0);
  });

  it("should verify that C45 triggers limited applicability warning", () => {
    const input = {
      ...getBaseInput(),
      fck28: 45
    };
    const res = calculateDreuxGorisse(input);
    expect(res).toBeDefined();
    expect(res.isValid).toBe(true); // limited is still valid as a mix design but has warning
    expect(res.methodApplicability).toBeDefined();
    expect(res.methodApplicability?.applicable).toBe(true);
    expect(res.methodApplicability?.level).toBe("limited");
    expect(res.methodApplicability?.reasons.length).toBeGreaterThan(0);
    expect(res.warnings?.some(w => w.includes("C45-C50") || w.includes("zone limite") || w.includes("borderline"))).toBe(true);
  });

  it("should verify that C60 triggers not_applicable level and fails validity gate", () => {
    const input = {
      ...getBaseInput(),
      fck28: 60
    };
    const res = calculateDreuxGorisse(input);
    expect(res).toBeDefined();
    expect(res.isValid).toBe(false);
    expect(res.methodApplicability).toBeDefined();
    expect(res.methodApplicability?.applicable).toBe(false);
    expect(res.methodApplicability?.level).toBe("not_applicable");
    expect(res.errors?.some(e => e.includes("60") || e.includes("HSC") || e.includes("diagnostic"))).toBe(true);
  });

  it("should verify that C80 explicit test triggers not_applicable level, fails validity, and returns quantities for diagnostic purposes only", () => {
    const input = {
      ...getBaseInput(),
      fck28: 80
    };
    const res = calculateDreuxGorisse(input);
    expect(res).toBeDefined();
    expect(res.isValid).toBe(false);
    expect(res.methodApplicability).toBeDefined();
    expect(res.methodApplicability?.applicable).toBe(false);
    expect(res.methodApplicability?.level).toBe("not_applicable");
    expect(res.errors?.some(e => e.includes("80") || e.includes("HSC") || e.includes("diagnostic") || e.includes("60"))).toBe(true);
  });

  it("should verify that self-compacting concrete triggers limited applicability", () => {
    const input = {
      ...getBaseInput(),
      concreteType: "Self-Compacting Concrete (SCC)"
    };
    const res = calculateDreuxGorisse(input);
    expect(res).toBeDefined();
    expect(res.isValid).toBe(true);
    expect(res.methodApplicability?.level).toBe("limited");
    expect(res.methodApplicability?.reasons.some(r => r.toLowerCase().includes("scc") || r.toLowerCase().includes("self-compacting") || r.includes("ذاتية الرص"))).toBe(true);
  });

  it("should verify that lightweight concrete triggers limited applicability", () => {
    const input = {
      ...getBaseInput(),
      concreteType: "Lightweight Béton"
    };
    const res = calculateDreuxGorisse(input);
    expect(res).toBeDefined();
    expect(res.isValid).toBe(true);
    expect(res.methodApplicability?.level).toBe("limited");
    expect(res.methodApplicability?.reasons.some(r => r.toLowerCase().includes("lightweight") || r.toLowerCase().includes("légers") || r.includes("خفيفة الوزن"))).toBe(true);
  });

  it("should verify that recycled aggregate concrete triggers limited applicability", () => {
    const input = {
      ...getBaseInput(),
      concreteType: "Béton recyclé"
    };
    const res = calculateDreuxGorisse(input);
    expect(res).toBeDefined();
    expect(res.isValid).toBe(true);
    expect(res.methodApplicability?.level).toBe("limited");
    expect(res.methodApplicability?.reasons.some(r => r.toLowerCase().includes("recyclé") || r.toLowerCase().includes("recycled") || r.includes("المعاد تدويره"))).toBe(true);
  });

  it("should verify that mass concrete triggers limited applicability", () => {
    const input = {
      ...getBaseInput(),
      concreteType: "Massive concrete pour"
    };
    const res = calculateDreuxGorisse(input);
    expect(res).toBeDefined();
    expect(res.isValid).toBe(true);
    expect(res.methodApplicability?.level).toBe("limited");
    expect(res.methodApplicability?.reasons.some(r => r.toLowerCase().includes("mass") || r.toLowerCase().includes("massif") || r.includes("الكتلية"))).toBe(true);
  });

  it("should verify that extreme slump triggers limited applicability", () => {
    const input = {
      ...getBaseInput(),
      slump: 22
    };
    const res = calculateDreuxGorisse(input);
    expect(res).toBeDefined();
    expect(res.isValid).toBe(true);
    expect(res.methodApplicability?.level).toBe("limited");
    expect(res.methodApplicability?.reasons.some(r => r.toLowerCase().includes("slump") || r.toLowerCase().includes("affaissement") || r.includes("الهبوط المرتفع"))).toBe(true);
  });
});
