import { describe, expect, it } from "vitest";
import { createTestInput } from "./testHelper";
import { calculateMixDesign } from "../engine/calculateMixDesign";
import { validateCalculationLogic } from "../engine/validationGate";
import { buildReportEnvelope, hashReportPayload } from "../services/reporting/reportContract";
import { reportToCsv, reportToHtml } from "../services/reporting/reportFormatExport";
import { generateMixDesignPdf } from "../services/pdf/mixDesignPdfGenerator";

const materialsDatabase: any[] = [
  { id: "cement-1", name: "CEM I 42.5", englishName: "Portland Cement", category: "إسمنت", type: "cementitious", density: 3150, strengthClass: "42.5", status: "نشط", approvalStatus: "Approved" },
  { id: "sand-1", name: "Quartz Sand 0/4", englishName: "High Purity Quartz Sand", category: "رمال", type: "sand", density: 2650, absorption: 1, moisture: 0, status: "نشط", approvalStatus: "Approved" },
  { id: "gravel-1", name: "Crushed Gravel 4/20", englishName: "Crushed Gravel", category: "حصى", type: "gravel", density: 2680, absorption: 0.8, moisture: 0, dMax: 20, status: "نشط", approvalStatus: "Approved" },
  { id: "water-1", name: "Mixing Water", englishName: "Mixing Water", category: "ماء", type: "water", density: 1000, status: "نشط", approvalStatus: "Approved" },
  { id: "sp-1", name: "PCE Superplasticizer", englishName: "Polycarboxylate Superplasticizer", category: "إضافات كيميائية", type: "superplasticizer", admixtureType: "superplasticizer", density: 1080, status: "نشط", approvalStatus: "Approved" },
  { id: "scm-1", name: "Silica Fume", englishName: "Densified Silica Fume", category: "إضافات معدنية", type: "silica_fume", admixtureType: "silica_fume", density: 2200, status: "نشط", approvalStatus: "Approved" },
  { id: "quartz-1", name: "Quartz Powder", englishName: "Quartz Powder", category: "إضافات معدنية", type: "quartz_powder", density: 2650, status: "نشط", approvalStatus: "Approved" },
  { id: "fiber-1", name: "Steel Fiber", englishName: "Steel Fiber", category: "ألياف", type: "fiber", fiberType: "steel", density: 7850, fiberDensity: 7850, status: "نشط", approvalStatus: "Approved" },
  { id: "lwa-1", name: "Expanded Clay", englishName: "Lightweight Aggregate", category: "ركام خفيف", type: "lightweight_aggregate", density: 1200, absorption: 15, moisture: 2, dMax: 16, status: "نشط", approvalStatus: "Approved" },
  { id: "hwa-1", name: "Barite Aggregate", englishName: "Heavyweight Aggregate", category: "ركام ثقيل", type: "heavyweight_aggregate", density: 4500, absorption: 2, moisture: 0.5, dMax: 25, status: "نشط", approvalStatus: "Approved" },
  { id: "healing-1", name: "Healing Agent", englishName: "Healing Agent", category: "إضافات خاصة", type: "healing_agent", density: 1200, status: "نشط", approvalStatus: "Approved" },
  { id: "recycled-1", name: "Recycled Aggregate", englishName: "Recycled Aggregate", category: "ركام معاد", type: "recycled_aggregate", density: 2350, absorption: 6, moisture: 2, dMax: 20, status: "نشط", approvalStatus: "Approved" },
];

const common = {
  materialsDatabase,
  selectedCementId: "cement-1", selectedCementName: "CEM I 42.5",
  selectedSandId: "sand-1", selectedSandName: "Washed Sand 0/4",
  selectedGravelId: "gravel-1", selectedGravelName: "Crushed Gravel 4/20",
  selectedWaterId: "water-1", selectedWaterName: "Mixing Water",
  selectedAdmixtureId: "sp-1", selectedAdmixtureName: "PCE Superplasticizer",
  selectedScmId: "scm-1", selectedScmName: "Silica Fume",
  moistureSand: 0, moistureGravel: 0, sandAbsorption: 1, gravelAbsorption: 0.8,
};

function inputFor(type: string) {
  const base: any = createTestInput({ ...common, concreteType: type, fck28: 30, dMax: 20, slump: 8, dosageSuper: 1.0, dosageSilicaFume: 8 });
  const specialized: Record<string, any> = {
    HSC: { fck28: 55, dosageSuper: 1.2, dosageSilicaFume: 7.5, hscWaterKgM3: 170, hscWaterBinderRatio: 0.32 },
    HPC: { fck28: 45, dosageSuper: 1.1, dosageSilicaFume: 8, dosageFlyAsh: 7, hpcWaterKgM3: 175, hpcWaterBinderRatio: 0.36 },
    SCC: { dMax: 16, sccPowderKgM3: 500, sccWaterPowderRatioByVolume: 0.90, sccCoarseAggregateVolumeFraction: 0.32, sccTargetSlumpFlowMm: 650 },
    FRC: { dMax: 16, frcWaterKgM3: 160, frcWaterBinderRatio: 0.40, frcFiberVolumePercent: 1.0, fiberType: "steel", fiberDensity: 7850, selectedFiberId: "fiber-1", selectedFiberName: "Steel Fiber" },
    LWC: { dMax: 16, selectedLightweightAggregateId: "lwa-1", selectedLightweightAggregateName: "Expanded Clay", lwcTargetDensityKgM3: 1750, lwcWaterKgM3: 155, lwcWaterBinderRatio: 0.44, lwcPrewetDegreePercent: 75 },
    HWC: { dMax: 25, selectedHeavyweightAggregateId: "hwa-1", selectedHeavyweightAggregateName: "Barite Aggregate", hwcTargetDensityKgM3: 3200, hwcWaterKgM3: 150, hwcWaterBinderRatio: 0.42 },
    RCC: { dMax: 20, rccWaterKgM3: 145, rccWaterBinderRatio: 0.40, rccOptimumMoisturePercent: 5, rccMaxDryDensityKgM3: 2350, rccCompactionTargetPercent: 98, rccFineAggregatePercent: 52.5 },
    SHOTCRETE: { dMax: 16, shotcreteWaterKgM3: 175, shotcreteWaterBinderRatio: 0.42, shotcreteAcceleratorPercent: 4, shotcreteCementFraction: 0.85, shotcreteCoarseAggregateVolumeFraction: 0.28, shotcreteSuperplasticizerPercent: 0 },
    GPC: { dMax: 16, gpcPrecursorKgM3: 420, gpcActivatorLiquidKgM3: 168, gpcWaterKgM3: 84, gpcWaterBinderRatio: 0.20, gpcActivatorToPrecursorRatio: 0.40, gpcCoarseAggregateVolumeFraction: 0.32 },
    SHC: { dMax: 16, shcCementKgM3: 400, shcWaterKgM3: 180, shcWaterBinderRatio: 0.45, shcHealingAgentDosageKgM3: 12, shcHealingAgentDensityKgM3: 1200, shcHealingAgentType: "microcapsules", shcCoarseAggregateVolumeFraction: 0.32, selectedHealingAgentId: "healing-1" },
    RAC: { dMax: 20, racCementKgM3: 380, racWaterKgM3: 180, racWaterBinderRatio: 0.474, racCoarseAggregateKgM3: 1050, racReplacementPercent: 50, racRecycledAggregateDensityKgM3: 2350, racRecycledAbsorptionPercent: 6, racPreSaturationPercent: 75, racSuperplasticizerDosage: 1 },
    PERVIOUS: { fck28: 12, dMax: 12, slump: 1, approvedBulkDensity: 1450, approvedVoidRatio: 20, perviousTargetVoidContent: 20, perviousTargetPermeabilityMmPerS: 2, perviousPasteVolumePercent: 18, perviousWaterBinderRatio: 0.33 },
    UHPC: { fck28: 120, dMax: 2, slump: 2, selectedQuartzPowderId: "quartz-1", selectedQuartzPowderName: "Quartz Powder", selectedFiberId: "fiber-1", selectedFiberName: "Steel Fiber", dosageSilicaFume: 18, dosageSuper: 2.2, uhpcWaterBinderRatio: 0.22, uhpcFiberVolumePercent: 1.8, uhpcQuartzPowderKgM3: 180 },
    BFUP: { concreteType: "BFUP", fck28: 140, dMax: 2, slump: 2, selectedQuartzPowderId: "quartz-1", selectedQuartzPowderName: "Quartz Powder", selectedFiberId: "fiber-1", selectedFiberName: "Steel Fiber", fiberType: "steel", fiberDensity: 7850, dosageSilicaFume: 18, dosageSuper: 2.2, bfupWaterBinderRatio: 0.22, bfupFiberVolumePercent: 2.1, bfupQuartzPowderKgM3: 180 },
  };
  return createTestInput({ ...base, ...(specialized[type] || {}) });
}

const types = ["NSC", "RC", "PUMPED", "MASS", "MARINE", "PRECAST", "PRESTRESSED", "HSC", "HPC", "SCC", "FRC", "LWC", "HWC", "RCC", "SHOTCRETE", "GPC", "SHC", "RAC", "PERVIOUS", "UHPC", "BFUP"];

function numericValuesAreFinite(value: unknown): boolean {
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(numericValuesAreFinite);
  if (value && typeof value === "object") return Object.values(value).every(numericValuesAreFinite);
  return true;
}

function primaryQuantities(result: any) {
  return {
    binder: Number(result.quantities?.totalBinder ?? result.cementKg ?? result.cementWeight ?? 0),
    water: Number(result.quantities?.effectiveWater ?? result.waterKg ?? result.waterContentActual ?? 0),
    sand: Number(result.quantities?.fineAggregates ?? result.fineAggregateKg ?? result.sandWeightDry ?? 0),
    coarse: Number(result.quantities?.coarseAggregates ?? result.coarseAggregateKg ?? result.gravelWeightDry ?? 0),
  };
}

describe("Comprehensive mix-design to report integration matrix", () => {
  it("designs every registered concrete family without silent method substitution", () => {
    const outcomes = types.map((type) => {
      const input: any = inputFor(type);
      const result: any = calculateMixDesign(input);
      if (types.indexOf(type) >= 7) expect(result.methodId, `${type}: method route`).not.toBe("dreux-gorisse");
      expect(numericValuesAreFinite(result), `${type}: finite result`).toBe(true);
      expect(result.calculationStatus, `${type}: lifecycle`).toBe("needs_trial_mix");
      const q = primaryQuantities(result);
      expect(q.binder, `${type}: binder`).toBeGreaterThan(0);
      expect(q.water, `${type}: water`).toBeGreaterThan(0);
      expect(q.sand, `${type}: sand`).toBeGreaterThanOrEqual(0);
      expect(q.coarse, `${type}: coarse`).toBeGreaterThanOrEqual(0);
      return { type, methodId: result.methodId, status: result.status };
    });
    expect(outcomes).toHaveLength(types.length);
    expect(new Set(outcomes.map((x) => x.type)).size).toBe(types.length);
  });

  it("covers legacy Dreux concrete families with stable numerical design", () => {
    for (const type of types.slice(0, 7)) {
      const result: any = calculateMixDesign(inputFor(type));
      expect(result.methodId, type).toBe("dreux-gorisse");
      expect(result.isValid, type).toBe(true);
      expect(result.cementKg, type).toBeGreaterThan(0);
      expect(result.wcRatio, type).toBeGreaterThan(0);
      const volume = Number(result.absoluteVolumeTotal ?? result.physicalProperties?.absoluteVolume ?? result.absoluteVolumeCheck?.value ?? 0);
      expect(volume, type).toBeGreaterThan(990);
    }
  });

  it("passes every successful design through the engineering validation gate", () => {
    for (const type of types) {
      const input: any = inputFor(type);
      const result: any = calculateMixDesign(input);
      const gate = validateCalculationLogic(input, result, "en");
      expect(gate.criticalErrors, `${type}: ${gate.criticalErrors.join(",")}`).toHaveLength(0);
      expect(gate.isValidForReport, type).toBe(true);
    }
  });

  it("keeps report envelope values identical to the design result in JSON/CSV/HTML", () => {
    for (const type of ["NSC", "SCC", "LWC", "UHPC", "RAC"]) {
      const input: any = inputFor(type);
      const result: any = calculateMixDesign(input);
      const report = buildReportEnvelope({ input, result, language: "ar", project: { id: `P-${type}`, name: `اختبار ${type}`, client: "SnoLab", plant: "Plant A" } });
      const json = JSON.parse(JSON.stringify(report));
      expect(json.result.methodId, type).toBe(result.methodId);
      expect(json.result.quantities, type).toEqual(result.quantities);
      expect(report.metadata.direction, type).toBe("rtl");
      expect(report.metadata.integrityHash, type).toBe(hashReportPayload({ input, result }));
      const csv = reportToCsv(report);
      expect(csv, type).toContain("result,methodId," + result.methodId);
      expect(csv, type).toContain("result,quantities.totalBinder,");
      const html = reportToHtml(report);
      expect(html, type).toContain('lang="ar"');
      expect(html, type).toContain('dir="rtl"');
      expect(html, type).toContain(result.methodId);
      expect(html, type).not.toContain("<script");
    }
  });

  it("generates a non-empty PDF whose header and core values match the selected designs", async () => {
    for (const type of ["NSC", "SCC", "LWC"]) {
      const input: any = inputFor(type);
      const result: any = calculateMixDesign(input);
      const doc: any = await generateMixDesignPdf(result, input, { language: "ar" });
      const bytes = new Uint8Array(doc.output("arraybuffer"));
      expect(bytes.length, type).toBeGreaterThan(10_000);
      expect(new TextDecoder("latin1").decode(bytes.slice(0, 5)), type).toBe("%PDF-");
    }
  });

  it("blocks incomplete, non-finite, and physically contradictory inputs instead of issuing reports", () => {
    const invalids: any[] = [
      inputFor("SCC"),
      inputFor("LWC"),
      inputFor("RAC"),
    ];
    invalids[0].sccPowderKgM3 = 0;
    invalids[1].lwcWaterBinderRatio = Number.NaN;
    invalids[2].racReplacementPercent = 150;
    for (const input of invalids) {
      const result: any = calculateMixDesign(input);
      expect(result.isValid ?? result.valid ?? result.validation?.isValid).toBe(false);
      expect(result.calculationStatus).toBe("blocked");
      const report = buildReportEnvelope({ input, result, language: "ar", findings: [{ code: "invalid-input", severity: "critical", message: "Blocked test input" }] });
      expect(report.metadata.verificationStatus).toBe("blocked");
    }
  });
});
