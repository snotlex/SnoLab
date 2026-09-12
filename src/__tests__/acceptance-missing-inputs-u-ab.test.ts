import { describe, it, expect } from "vitest";
import { calculateDreuxGorisseCore } from "../engine/dreuxGorisseCore";
import { validateMixInputs } from "../engine/validateInputs";
import { checkMaterialSuitability } from "../engine/suitabilityGate";
import { createTestInput } from "./testHelper";
import { AggregateType, AggregateQuality, EngineeringMaterial } from "../types";

describe("Final Acceptance Tests (U–AB): Strict Elimination of Engineering Fallbacks", () => {
  const validBaseInput = createTestInput({
    fck28: 30,
    controlClass: "normal",
    cementType: "CEM I",
    cementClassStrength: 42.5,
    dMax: 20,
    slump: 8,
    aggregateType: AggregateType.CONCASSE,
    aggregateQuality: AggregateQuality.EXCELLENT,
    hasPumping: false,
    sandRelativeDensity: 2.62,
    gravelRelativeDensity: 2.68,
    cementDensity: 3100,
    airContent: 1.5,
    moistureSand: 2.0,
    moistureGravel: 1.0,
    sandAbsorption: 1.0,
    gravelAbsorption: 0.8,
    admixtures: [],
    dosageSuper: 0,
    dosageAir: 0,
    dosageRetarder: 0,
    dosageAccelerator: 0,
    selectedMethod: "dreux"
  });

  // Acceptance Test U: Missing or zero fck28
  describe("U. Acceptance: Target Compressive Strength (fck28)", () => {
    it("MUST NOT silently assume or default fck28 when undefined", () => {
      const input = createTestInput({
        ...validBaseInput,
        fck28: undefined as any
      });

      const res = calculateDreuxGorisseCore(input, "en");
      expect(res.isValid).toBe(false);
      expect(res.valid).toBe(false);
      expect(res.errors.some(e => e.toLowerCase().includes("fck") || e.includes("compressive strength"))).toBe(true);
      expect(res.cementWeight).toBe(0);
      expect(res.wcRatio).toBe(0);
    });

    it("MUST reject zero or negative fck28", () => {
      const inputZero = createTestInput({ ...validBaseInput, fck28: 0 });
      const resZero = calculateDreuxGorisseCore(inputZero, "en");
      expect(resZero.isValid).toBe(false);
      expect(resZero.errors.length).toBeGreaterThan(0);

      const inputNeg = createTestInput({ ...validBaseInput, fck28: -25 });
      const resNeg = calculateDreuxGorisseCore(inputNeg, "en");
      expect(resNeg.isValid).toBe(false);
      expect(resNeg.errors.length).toBeGreaterThan(0);
    });

    it("MUST reject physically impossible fck28 outside [5, 150] MPa", () => {
      const inputLow = createTestInput({ ...validBaseInput, fck28: 2 });
      const resLow = calculateDreuxGorisseCore(inputLow, "en");
      expect(resLow.isValid).toBe(false);

      const inputHigh = createTestInput({ ...validBaseInput, fck28: 250 });
      const resHigh = calculateDreuxGorisseCore(inputHigh, "en");
      expect(resHigh.isValid).toBe(false);
    });
  });

  // Acceptance Test V: Missing or invalid aggregate maximum size (Dmax)
  describe("V. Acceptance: Maximum Aggregate Size (Dmax)", () => {
    it("MUST NOT invent Dmax when missing or undefined", () => {
      const input = createTestInput({
        ...validBaseInput,
        dMax: undefined as any
      });

      const res = calculateDreuxGorisseCore(input, "en");
      expect(res.isValid).toBe(false);
      expect(res.errors.some(e => e.toLowerCase().includes("dmax"))).toBe(true);
      expect(res.cementWeight).toBe(0);
    });

    it("MUST reject Dmax outside structural bounds [2, 150] mm", () => {
      const inputTooSmall = createTestInput({ ...validBaseInput, dMax: 1 });
      const resSmall = calculateDreuxGorisseCore(inputTooSmall, "en");
      expect(resSmall.isValid).toBe(false);
      expect(resSmall.errors.some(e => e.toLowerCase().includes("dmax"))).toBe(true);

      const inputTooLarge = createTestInput({ ...validBaseInput, dMax: 200 });
      const resLarge = calculateDreuxGorisseCore(inputTooLarge, "en");
      expect(resLarge.isValid).toBe(false);
      expect(resLarge.errors.some(e => e.toLowerCase().includes("dmax"))).toBe(true);
    });
  });

  // Acceptance Test W: Missing or invalid Cement Strength Class (sigmaC / cementClassStrength)
  describe("W. Acceptance: Cement Strength Class", () => {
    it("MUST NOT invent cement strength class when missing", () => {
      const input = createTestInput({
        ...validBaseInput,
        cementClassStrength: undefined as any
      });

      const res = calculateDreuxGorisseCore(input, "en");
      expect(res.isValid).toBe(false);
      expect(res.errors.some(e => e.toLowerCase().includes("cement strength") || e.toLowerCase().includes("cement"))).toBe(true);
      expect(res.wcRatio).toBe(0);
      expect(res.cementWeight).toBe(0);
    });

    it("MUST reject cement class outside realistic standards [20, 80] MPa", () => {
      const inputLow = createTestInput({ ...validBaseInput, cementClassStrength: 10 });
      const resLow = calculateDreuxGorisseCore(inputLow, "en");
      expect(resLow.isValid).toBe(false);

      const inputHigh = createTestInput({ ...validBaseInput, cementClassStrength: 120 });
      const resHigh = calculateDreuxGorisseCore(inputHigh, "en");
      expect(resHigh.isValid).toBe(false);
    });
  });

  // Acceptance Test X: Missing Cement Density (Absolute Specific Gravity)
  describe("X. Acceptance: Cement Absolute Density", () => {
    it("MUST NOT assume standard 3100 kg/m3 silently when missing from engineering inputs", () => {
      const input = createTestInput({
        ...validBaseInput,
        cementDensity: undefined as any
      });

      const res = calculateDreuxGorisseCore(input, "en");
      expect(res.isValid).toBe(false);
      expect(res.errors.some(e => e.toLowerCase().includes("cement") && e.toLowerCase().includes("density"))).toBe(true);
      expect(res.totalFreshDensity).toBe(0);
    });

    it("MUST reject unrealistic cement density outside [2500, 3500] kg/m3", () => {
      const inputUnrealistic = createTestInput({
        ...validBaseInput,
        cementDensity: 1200 // physically impossible for Portland cement
      });

      const res = calculateDreuxGorisseCore(inputUnrealistic, "en");
      expect(res.isValid).toBe(false);
      expect(res.errors.some(e => e.toLowerCase().includes("density") || e.toLowerCase().includes("gravity"))).toBe(true);
    });
  });

  // Acceptance Test Y: Missing Aggregate Specific Gravities
  describe("Y. Acceptance: Sand and Gravel Relative Densities", () => {
    it("MUST NOT invent sand specific gravity when missing", () => {
      const input = createTestInput({
        ...validBaseInput,
        sandRelativeDensity: undefined as any
      });

      const res = calculateDreuxGorisseCore(input, "en");
      expect(res.isValid).toBe(false);
      expect(res.errors.some(e => e.toLowerCase().includes("sand") && (e.toLowerCase().includes("gravity") || e.toLowerCase().includes("density")))).toBe(true);
    });

    it("MUST NOT invent gravel specific gravity when missing", () => {
      const input = createTestInput({
        ...validBaseInput,
        gravelRelativeDensity: undefined as any
      });

      const res = calculateDreuxGorisseCore(input, "en");
      expect(res.isValid).toBe(false);
      expect(res.errors.some(e => e.toLowerCase().includes("gravel") && (e.toLowerCase().includes("gravity") || e.toLowerCase().includes("density")))).toBe(true);
    });

    it("MUST reject unrealistic specific gravities (e.g. < 1.5 or > 3.5)", () => {
      const inputInvalidSand = createTestInput({
        ...validBaseInput,
        sandRelativeDensity: 0.8
      });
      const resSand = calculateDreuxGorisseCore(inputInvalidSand, "en");
      expect(resSand.isValid).toBe(false);

      const inputInvalidGravel = createTestInput({
        ...validBaseInput,
        gravelRelativeDensity: 5.5
      });
      const resGravel = calculateDreuxGorisseCore(inputInvalidGravel, "en");
      expect(resGravel.isValid).toBe(false);
    });
  });

  // Acceptance Test Z: Slump Boundary Enforcement
  describe("Z. Acceptance: Target Workability / Slump", () => {
    it("MUST reject invalid slump out of range [0, 40] cm", () => {
      const inputExcessive = createTestInput({
        ...validBaseInput,
        slump: 60
      });

      const res = calculateDreuxGorisseCore(inputExcessive, "en");
      expect(res.isValid).toBe(false);
      expect(res.errors.some(e => e.toLowerCase().includes("slump"))).toBe(true);
    });
  });

  // Acceptance Test AA: Multilingual Error Output Consistency
  describe("AA. Acceptance: Multilingual Validation Messaging (Arabic, French, English)", () => {
    it("provides localized error messages without breaking engine validation", () => {
      const invalidInput = createTestInput({
        ...validBaseInput,
        fck28: undefined as any,
        dMax: undefined as any
      });

      const resAr = calculateDreuxGorisseCore(invalidInput, "ar");
      expect(resAr.isValid).toBe(false);
      expect(resAr.errors.some(e => e.includes("مقاومة") || e.includes("Dmax"))).toBe(true);

      const resFr = calculateDreuxGorisseCore(invalidInput, "fr");
      expect(resFr.isValid).toBe(false);
      expect(resFr.errors.some(e => e.includes("résistance") || e.includes("Dmax"))).toBe(true);

      const resEn = calculateDreuxGorisseCore(invalidInput, "en");
      expect(resEn.isValid).toBe(false);
      expect(resEn.errors.some(e => e.includes("strength") || e.includes("Dmax"))).toBe(true);
    });
  });

  // Acceptance Test AB: Concrete Type Suitability Gate (Missing Specialist Materials)
  describe("AB. Acceptance: Suitability Gate for Specialized Concrete", () => {
    const mockActiveMaterials = [
      { id: "cem-1", name: "CEM I", category: "CEMENT", type: "cement", ApprovalStatus: "Approved", status: "نشط", density: 3.15, strengthClass: "42.5", ownerId: "user-123", source: "user" },
      { id: "sand-1", name: "Sand 0/4", category: "SAND", type: "sand", ApprovalStatus: "Approved", status: "نشط", density: 2.65, absorption: 1.2, moisture: 3.0, finenessModulus: 2.8, ownerId: "user-123", source: "user" },
      { id: "grav-1", name: "Gravel 4/20", category: "GRAVEL", type: "gravel", ApprovalStatus: "Approved", status: "نشط", density: 2.68, absorption: 0.8, moisture: 1.0, dMax: 20, ownerId: "user-123", source: "user" },
      { id: "wat-1", name: "Water", category: "WATER", type: "water", ApprovalStatus: "Approved", status: "نشط", density: 1.0, absorption: 0, ownerId: "user-123", source: "user" }
    ] as unknown as EngineeringMaterial[];

    it("MUST block calculation when SCC lacks superplasticizer", () => {
      const sccInput = createTestInput({
        ...validBaseInput,
        bypassSuitabilityGate: false,
        concreteType: "scc",
        selectedCementId: "cem-1",
        selectedSandId: "sand-1",
        selectedGravelId: "grav-1",
        selectedWaterId: "wat-1",
        selectedAdmixtureId: undefined,
        dosageSuper: 0,
        admixtures: [],
        materialsDatabase: mockActiveMaterials
      });

      const suitability = checkMaterialSuitability(sccInput, mockActiveMaterials);
      expect(suitability.status).toBe("blocked");
      expect(suitability.incompatibleMaterials).toContain("superplasticizer");

      const coreRes = calculateDreuxGorisseCore(sccInput, "en");
      expect(coreRes.isValid).toBe(false);
    });

    it("MUST block calculation when FIBER concrete lacks structural fibers", () => {
      const fiberInput = createTestInput({
        ...validBaseInput,
        bypassSuitabilityGate: false,
        concreteType: "fiber",
        selectedCementId: "cem-1",
        selectedSandId: "sand-1",
        selectedGravelId: "grav-1",
        selectedWaterId: "wat-1",
        selectedFiberId: undefined,
        materialsDatabase: mockActiveMaterials
      });

      const suitability = checkMaterialSuitability(fiberInput, mockActiveMaterials);
      expect(suitability.status).toBe("blocked");
      expect(suitability.incompatibleMaterials).toContain("fiber");

      const coreRes = calculateDreuxGorisseCore(fiberInput, "en");
      expect(coreRes.isValid).toBe(false);
    });
  });
});
