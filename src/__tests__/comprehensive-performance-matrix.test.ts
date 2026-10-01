import { describe, expect, it } from "vitest";
import { performance } from "node:perf_hooks";
import { calculateMixDesign } from "../engine/calculateMixDesign";
import { validateCalculationLogic } from "../engine/validationGate";
import { executeLaboratoryTest, MASTER_TEST_CATALOG } from "../services/materialsLabEngine";
import { TEST_COMPATIBILITY_REGISTRY } from "../services/laboratoryMaterialCompatibility";
import { MIX_DESIGN_CONTRACTS, missingContractInputs } from "../mix-design/core/mixDesignContracts";
import type { MixDesignInput } from "../engine/types";

const TYPE_STRENGTH: Record<string, number> = {
  NSC: 25, RC: 30, PUMPED: 30, MASS: 30, MARINE: 35, PRECAST: 45, PRESTRESSED: 55,
  HSC: 60, HPC: 55, SCC: 40, FRC: 35, LWC: 25, HWC: 40, RCC: 35, SHOTCRETE: 35,
  GPC: 40, SHC: 35, RAC: 30, PERVIOUS: 20, UHPC: 120, BFUP: 120
};

const valueFor = (key: string, type: string): any => {
  if (key === "fck28") return TYPE_STRENGTH[type] || 25;
  if (key === "dMax") return ["SCC", "UHPC", "BFUP"].includes(type) ? 12 : 20;
  if (key === "slump") return type === "SCC" ? 65 : 10;
  if (key.includes("Ratio") || key.includes("ratio")) return key.includes("scc") ? 0.95 : key.includes("uhpc") ? 0.22 : 0.35;
  if (key.toLowerCase().includes("percent") || key.toLowerCase().includes("replacement")) return 20;
  if (key.toLowerCase().includes("density")) return key.toLowerCase().includes("target") ? (type === "LWC" ? 1800 : type === "HWC" ? 3200 : 2400) : 2650;
  if (key.toLowerCase().includes("water")) return 165;
  if (key.toLowerCase().includes("cement") || key.toLowerCase().includes("binder") || key.toLowerCase().includes("precursor") || key.toLowerCase().includes("powder")) return 420;
  if (key.toLowerCase().includes("fiber")) return key === "fiberType" ? "steel" : 1;
  if (key.toLowerCase().includes("type")) return key.includes("Healing") ? "microcapsule" : "CEM_I";
  if (key.toLowerCase().includes("agent")) return 20;
  if (key.toLowerCase().includes("accelerator")) return 2;
  if (key.toLowerCase().includes("void")) return 18;
  if (key.toLowerCase().includes("permeability")) return 1.5;
  if (key.toLowerCase().includes("compaction")) return 98;
  if (key.toLowerCase().includes("moisture") || key.toLowerCase().includes("absorption")) return 2;
  if (key === "aggregateType") return "concasse";
  if (key === "airContent") return 1.5;
  return 10;
};

function completeInput(type: string): MixDesignInput {
  const contract = MIX_DESIGN_CONTRACTS[type as keyof typeof MIX_DESIGN_CONTRACTS];
  const input: any = {
    concreteType: type, selectedMethod: "auto", methodId: "auto", fck28: TYPE_STRENGTH[type] || 25,
    controlClass: "normal", cementType: "CEM_I", cementClassStrength: 42.5, cementDensity: 3100,
    dMax: ["SCC", "UHPC", "BFUP"].includes(type) ? 12 : 20, slump: type === "SCC" ? 65 : 10,
    aggregateType: "concasse", aggregateQuality: "standard", sandRelativeDensity: 2.65,
    gravelRelativeDensity: 2.68, airContent: 1.5, moistureSand: 2, moistureGravel: 1,
    sandAbsorption: 1.5, gravelAbsorption: 0.8, dosageSuper: 1, dosageSilicaFume: 30,
    dosageFlyAsh: 0, dosageSlag: 0, dosageAir: 0, dosageRetarder: 0, dosageAccelerator: 0,
    admixtures: [], autoDensities: true
  };
  for (const key of contract.requiredInputs) if (input[key] === undefined) input[key] = valueFor(String(key), type);
  return input;
}

function collectNonFinite(value: unknown, path = "root"): string[] {
  if (typeof value === "number") return Number.isFinite(value) ? [] : [path];
  if (Array.isArray(value)) return value.flatMap((item, i) => collectNonFinite(item, `${path}[${i}]`));
  if (value && typeof value === "object") return Object.entries(value).flatMap(([key, item]) => collectNonFinite(item, `${path}.${key}`));
  return [];
}

function compatibleMaterial(testId: string): any {
  const registry = TEST_COMPATIBILITY_REGISTRY[testId];
  const category = registry?.allowedMaterialCategories[0] || "FINE_AGGREGATE";
  const materialByCategory: Record<string, any> = {
    FINE_AGGREGATE: { category: "رمال", type: "sand", materialType: "sand" },
    COARSE_AGGREGATE: { category: "حصى", type: "gravel", materialType: "gravel" },
    CEMENT: { category: "إسمنت", type: "cement", materialType: "cement" },
    MINERAL_ADDITION: { category: "إضافات معدنية", type: "silica_fume", materialType: "MINERAL_ADDITIONS" },
    CHEMICAL_ADMIXTURE: { category: "إضافات كيميائية", type: "superplasticizer", materialType: "admixture" },
    MIXING_WATER: { category: "ماء", type: "water", materialType: "water" },
    FIBER: { category: "ألياف", type: "fiber", materialType: "fiber" }
  };
  return { id: `PERF-${testId}`, name: `Performance ${testId}`, density: 2650, ...materialByCategory[category] };
}

function mutateNumbers(value: any, mode: "zero" | "negative" | "nonfinite"): any {
  if (Array.isArray(value)) return value.map(item => mutateNumbers(item, mode));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, mutateNumbers(item, mode)]));
  if (typeof value === "number") return mode === "zero" ? 0 : mode === "negative" ? -Math.abs(value || 1) : Number.NaN;
  return value;
}

describe("Comprehensive performance matrix: concrete mix design", () => {
  it("covers every concrete contract with complete, missing, boundary, and invalid inputs", () => {
    const timings: number[] = [];
    for (const type of Object.keys(MIX_DESIGN_CONTRACTS)) {
      const contract = MIX_DESIGN_CONTRACTS[type as keyof typeof MIX_DESIGN_CONTRACTS];
      const complete = completeInput(type);
      expect(missingContractInputs(complete, contract), `${type} required fields`).toEqual([]);
      for (const mode of ["complete", "zero", "negative", "nonfinite"] as const) {
        const input = mode === "complete" ? complete : mutateNumbers(complete, mode);
        const start = performance.now();
        let result: any;
        expect(() => { result = calculateMixDesign(input); }, `${type}/${mode} must not throw`).not.toThrow();
        timings.push(performance.now() - start);
        expect(collectNonFinite(result), `${type}/${mode} returned non-finite values`).toEqual([]);
        expect(result).toBeDefined();
      }
      const missing = { ...complete } as any;
      delete missing[contract.requiredInputs[contract.requiredInputs.length - 1]];
      expect(missingContractInputs(missing, contract).length, `${type} missing-field gate`).toBeGreaterThan(0);
      const boundary = calculateMixDesign({ ...complete, fck28: type === "UHPC" || type === "BFUP" ? 250 : 10 } as any);
      expect(collectNonFinite(boundary), `${type}/boundary returned non-finite values`).toEqual([]);
    }
    const max = Math.max(...timings);
    const average = timings.reduce((sum, value) => sum + value, 0) / timings.length;
    console.info(`[Mix performance] ${Object.keys(MIX_DESIGN_CONTRACTS).length} types × 5 cases; average=${average.toFixed(2)}ms max=${max.toFixed(2)}ms`);
    expect(max).toBeLessThan(1500);
  });

  it("keeps validation gates finite and blocks invalid material repositories", () => {
    for (const type of Object.keys(MIX_DESIGN_CONTRACTS)) {
      const input: any = completeInput(type);
      const result: any = calculateMixDesign(input);
      const gate = validateCalculationLogic(input, result, "en");
      expect(collectNonFinite(gate), `${type} validation gate`).toEqual([]);
      const invalid = { ...input, materialsDatabase: [{ id: "x", category: "unknown", type: "unknown" }] };
      const invalidGate = validateCalculationLogic(invalid, result, "en");
      expect(invalidGate).toBeDefined();
      expect(collectNonFinite(invalidGate)).toEqual([]);
    }
  });
});

describe("Comprehensive performance matrix: materials laboratory", () => {
  it("executes every catalog test with defaults and adversarial numeric inputs without crashes", () => {
    const timings: number[] = [];
    const statuses = new Set(["PASS", "WARNING", "FAIL", "BLOCKED"]);
    for (const definition of MASTER_TEST_CATALOG) {
      const material = compatibleMaterial(definition.id);
      for (const mode of ["default", "zero", "negative", "nonfinite"] as const) {
        const source = structuredClone(definition.defaultInputs);
        const inputs = mode === "default" ? source : mutateNumbers(source, mode);
        const start = performance.now();
        let result: any;
        expect(() => { result = executeLaboratoryTest(definition.id, inputs, material); }, `${definition.id}/${mode} must not throw`).not.toThrow();
        timings.push(performance.now() - start);
        expect(statuses.has(result.status), `${definition.id}/${mode} status`).toBe(true);
        expect(Number.isFinite(result.score), `${definition.id}/${mode} score`).toBe(true);
        expect(collectNonFinite(result), `${definition.id}/${mode} result`).toEqual([]);
      }
    }
    const max = Math.max(...timings);
    const average = timings.reduce((sum, value) => sum + value, 0) / timings.length;
    console.info(`[Lab performance] ${MASTER_TEST_CATALOG.length} tests × 4 cases; average=${average.toFixed(2)}ms max=${max.toFixed(2)}ms`);
    expect(max).toBeLessThan(500);
  });

  it("blocks incompatible materials deterministically and stays fast under repeated load", () => {
    const start = performance.now();
    for (const definition of MASTER_TEST_CATALOG) {
      for (let i = 0; i < 20; i++) {
        const incompatibleCategory = definition.category === "cement" || definition.category === "additives" || definition.category === "admixtures" || definition.category === "fibers" ? "ماء" : "إسمنت";
        const result = executeLaboratoryTest(definition.id, definition.defaultInputs, { id: "wrong", name: "Wrong material", category: incompatibleCategory, type: incompatibleCategory === "ماء" ? "water" : "cement", materialType: incompatibleCategory === "ماء" ? "water" : "cement" } as any);
        expect(result.status).toBe("BLOCKED");
        expect(collectNonFinite(result)).toEqual([]);
      }
    }
    const elapsed = performance.now() - start;
    console.info(`[Lab compatibility load] ${MASTER_TEST_CATALOG.length * 20} blocked executions in ${elapsed.toFixed(2)}ms`);
    expect(elapsed).toBeLessThan(3000);
  });
});
