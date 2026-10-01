import { calculateMixDesign } from "../src/engine/calculateMixDesign";
import { createTestInput } from "../src/__tests__/testHelper";
import { selectConcreteMixDesignRoute } from "../src/mix-design/core/concreteMixDesignSelector";
import { MIX_DESIGN_CONTRACTS } from "../src/mix-design/core/mixDesignContracts";
import { evaluateEngineeringGate } from "../src/services/engineeringVerificationEngine";
import { AggregateQuality, AggregateType } from "../src/types";

const types = Object.keys(MIX_DESIGN_CONTRACTS);

const base = {
  enforceInputContract: true,
  materialsDatabase: [],
  fck28: 30,
  dMax: 20,
  slump: 8,
  cementType: "CEM I",
  cementClassStrength: 42.5,
  cementDensity: 3100,
  sandRelativeDensity: 2.65,
  gravelRelativeDensity: 2.68,
  aggregateType: AggregateType.CONCASSE,
  aggregateQuality: AggregateQuality.STANDARD,
  airContent: 1,
  moistureSand: 2,
  moistureGravel: 1,
  sandAbsorption: 1.5,
  gravelAbsorption: 0.8,
  dosageSuper: 0,
  dosageSilicaFume: 0,
  dosageFlyAsh: 0,
  dosageSlag: 0,
};

function inputFor(type: string): any {
  const input: any = createTestInput({ ...base, concreteType: type });
  switch (type) {
    case "HSC": Object.assign(input, { fck28: 60, dosageSuper: 2, dosageSilicaFume: 10, hscWaterKgM3: 160, hscWaterBinderRatio: 0.30 }); break;
    case "HPC": Object.assign(input, { fck28: 50, dosageSuper: 1.5, dosageSilicaFume: 8, hpcWaterKgM3: 165, hpcWaterBinderRatio: 0.32 }); break;
    case "SCC": Object.assign(input, { fck28: 35, dMax: 16, sccTargetSlumpFlowMm: 650, sccPowderKgM3: 500, sccWaterPowderRatioByVolume: 0.90, sccCoarseAggregateVolumeFraction: 0.32 }); break;
    case "FRC": Object.assign(input, { fck28: 35, frcWaterKgM3: 170, frcWaterBinderRatio: 0.45, frcFiberVolumePercent: 1.5, fiberType: "steel", fiberDensity: 7850, frcCoarseAggregateVolumeFraction: 0.35 }); break;
    case "LWC": Object.assign(input, { fck28: 30, dMax: 16, lwcTargetDensityKgM3: 1750, lwcWaterKgM3: 170, lwcWaterBinderRatio: 0.45, lightweightAggregateDensity: 1600, lightweightAggregateAbsorption: 12, lwcPrewetDegreePercent: 70 }); break;
    case "HWC": Object.assign(input, { fck28: 35, hwcTargetDensityKgM3: 3000, hwcWaterKgM3: 170, hwcWaterBinderRatio: 0.45, heavyweightAggregateDensity: 4000, heavyweightAggregateAbsorption: 1 }); break;
    case "RCC": Object.assign(input, { fck28: 30, slump: 1, rccWaterKgM3: 125, rccWaterBinderRatio: 0.35, rccOptimumMoisturePercent: 5, rccMaxDryDensityKgM3: 2300, rccFineAggregatePercent: 50, rccCompactionTargetPercent: 98 }); break;
    case "SHOTCRETE": Object.assign(input, { fck28: 35, dMax: 12, shotcreteWaterKgM3: 180, shotcreteWaterBinderRatio: 0.45, shotcreteCementFraction: 0.85, shotcreteAcceleratorPercent: 4, shotcreteSuperplasticizerPercent: 1, shotcreteCoarseAggregateVolumeFraction: 0.30, shotcreteExecutionMethod: "wet" }); break;
    case "GPC": Object.assign(input, { fck28: 35, gpcPrecursorKgM3: 400, gpcActivatorLiquidKgM3: 160, gpcWaterKgM3: 160, gpcWaterBinderRatio: 0.40, gpcActivatorToPrecursorRatio: 0.40, gpcCoarseAggregateVolumeFraction: 0.35 }); break;
    case "SHC": Object.assign(input, { fck28: 35, shcCementKgM3: 400, shcWaterKgM3: 160, shcWaterBinderRatio: 0.40, shcHealingAgentDosageKgM3: 20, shcHealingAgentDensityKgM3: 1200, shcHealingAgentType: "bacterial mineral agent", shcCoarseAggregateVolumeFraction: 0.35 }); break;
    case "RAC": Object.assign(input, { fck28: 35, racCementKgM3: 380, racWaterKgM3: 170, racWaterBinderRatio: 0.45, racCoarseAggregateKgM3: 900, racReplacementPercent: 50, racRecycledAggregateDensityKgM3: 2200, racRecycledAbsorptionPercent: 8, racPreSaturationPercent: 50 }); break;
    case "PERVIOUS": Object.assign(input, { fck28: 15, dMax: 12, slump: 1, perviousTargetVoidContentPercent: 20, perviousTargetPermeabilityMmPerS: 2, perviousPasteVolumePercent: 18, perviousWaterBinderRatio: 0.32, approvedBulkDensity: 1450, approvedVoidRatio: 20 }); break;
    case "UHPC": Object.assign(input, { fck28: 120, dMax: 4, uhpcWaterBinderRatio: 0.22, uhpcFiberVolumePercent: 2, uhpcQuartzPowderKgM3: 150, dosageSilicaFume: 20, dosageSuper: 2.2 }); break;
    case "BFUP": Object.assign(input, { fck28: 120, dMax: 4, bfupWaterBinderRatio: 0.22, bfupFiberVolumePercent: 2, bfupQuartzPowderKgM3: 150, dosageSilicaFume: 20, dosageSuper: 2.2, fiberType: "steel", fiberDensity: 7850 }); break;
  }
  return input;
}

function num(value: unknown): number | undefined {
  return typeof value === "number" ? value : Number.isFinite(Number(value)) ? Number(value) : undefined;
}

const rows = types.map((type) => {
  const input = inputFor(type);
  const route = selectConcreteMixDesignRoute(input, "auto");
  const result: any = calculateMixDesign(input);
  const gateCalculator = evaluateEngineeringGate(input, "calculator", []);
  const gateReports = evaluateEngineeringGate(input, "reports", []);
  const closure = num(result.volumeClosureError ?? result.physicalProperties?.volumeClosureError ?? result.absoluteVolumeCheck?.deviationL);
  const numericFields = ["cementKg", "waterKg", "fineAggregateKg", "coarseAggregateKg", "admixtureKg", "freshDensityKgM3", "wcRatio", "absoluteVolumeTotal"];
  const nonFiniteFields = numericFields.filter((field) => result[field] !== undefined && !Number.isFinite(Number(result[field])));
  return {
    type,
    route: route.methodId,
    routeSupport: route.support,
    resultStatus: result.status,
    calculationStatus: result.calculationStatus,
    isValid: result.isValid,
    closure,
    closureOk: closure === undefined || Math.abs(closure) <= 5,
    nonFiniteFields,
    gateCalculator: { state: gateCalculator.gateState, blocked: gateCalculator.isBlocked, missing: gateCalculator.missingCount },
    gateReports: { state: gateReports.gateState, blocked: gateReports.isBlocked, missing: gateReports.missingCount },
    errors: (result.errors || result.validation?.errors || []).slice(0, 3).map((e: any) => typeof e === "string" ? e : e.message),
    warnings: (result.warnings || []).slice(0, 3).map(String)
  };
});

for (const row of rows) {
  console.log(JSON.stringify(row));
}
const summary = {
  total: rows.length,
  valid: rows.filter((r) => r.isValid === true && r.resultStatus === "success").length,
  blocked: rows.filter((r) => r.calculationStatus === "blocked" || r.resultStatus === "not-supported").length,
  closureFailures: rows.filter((r) => !r.closureOk).length,
  nonFiniteFailures: rows.filter((r) => r.nonFiniteFields.length > 0).length,
  gateBlockedReports: rows.filter((r) => r.gateReports.blocked).length,
};
console.log(`SUMMARY ${JSON.stringify(summary)}`);
