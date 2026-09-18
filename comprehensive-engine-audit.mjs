import { calculateDreuxGorisseCore } from './src/engine/dreuxGorisseCore.ts';
import { CONCRETE_TYPE_CONFIGS } from './src/concreteTypes.ts';

const common = {
  bypassSuitabilityGate: true, fck28: 40, controlClass: 'normal', cementType: 'CEM I', cementClassStrength: 52.5,
  dMax: 20, slump: 8, aggregateType: 'concasse', aggregateQuality: 'standard', hasPumping: false,
  sandRelativeDensity: 2.65, gravelRelativeDensity: 2.68, cementDensity: 3100, airContent: 1.5,
  moistureSand: 2, moistureGravel: 1, sandAbsorption: 1.2, gravelAbsorption: 0.8, finenessModulus: 2.6,
  admixtures: [], dosageSuper: 1.2, dosageAir: 0, dosageRetarder: 0, dosageAccelerator: 0,
  dosageSilicaFume: 0, dosageFlyAsh: 0, dosageSlag: 0, selectedMethod: 'dreux', exposureClass: 'X0',
  durabilityLevel: 'standard', carbonationLevel: 'none', chloridesLevel: 'none', sulfatesLevel: 'none',
  priceCement: 1, priceSand: 1, priceGravel: 1, priceSuper: 1, priceAir: 1, priceRetarder: 1,
  priceAccelerator: 1, priceSilicaFume: 1, priceFlyAsh: 1, priceSlag: 1, priceLabor: 1, priceWater: 1,
  sandType: 'standard', gravelType: 'standard', autoDensities: false, batchVolume: 1,
  selectedCementId: 'cement', selectedSandId: 'sand', selectedGravelId: 'gravel', selectedWaterId: 'water', materialsDatabase: []
};

const allCodes = Object.keys(CONCRETE_TYPE_CONFIGS);
const overrides = {
  HSC: { fck28: 70, dosageSuper: 1.8, dosageSilicaFume: 8 },
  HPC: { fck28: 60, dosageSuper: 1.8, dosageSilicaFume: 8, dosageFlyAsh: 15 },
  SCC: { slump: 24, dMax: 16, dosageSuper: 1.8 },
  LWC: { gravelRelativeDensity: 1.8, selectedLightweightAggregateId: 'lwa', lightweightAggregateDensity: 1.8, lightweightAggregateAbsorption: 8, lightweightAggregateMoisture: 4 },
  HWC: { gravelRelativeDensity: 3.5, selectedHeavyweightAggregateId: 'hwa', heavyweightAggregateDensity: 3.5 },
  RCC: { slump: 1, dMax: 25, dosageSuper: 0.2, dosageFlyAsh: 20 },
  SHOTCRETE: { dMax: 12, dosageAccelerator: 3 },
  GPC: { cementClassStrength: undefined, cementDensity: undefined, selectedCementId: undefined, cementType: 'cementless', dosageFlyAsh: 60, dosageSlag: 40, dosageSuper: 1.5, specialBinderStrengthClass: 42.5, selectedSpecialBinderId: 'activator' },
  SHC: { selectedSpecialBinderId: 'healing', specialBinderDensity: 1500, specialBinderReplacementPercent: 5 },
  RAC: { selectedGravelId: 'recycled-gravel', dosageSuper: 1.2 },
  PERVIOUS: { slump: 1, dosageSuper: 0, airContent: 18, dMax: 20 },
  UHPC: { fck28: 120, dMax: 10, slump: 22, dosageSuper: 2, dosageSilicaFume: 18 },
  BFUP: { fck28: 120, dMax: 10, slump: 22, dosageSuper: 2, dosageSilicaFume: 18, selectedFiberId: 'steel-fiber', fiberDosageKgM3: 80, fiberDensity: 7850 },
  RC: { dosageSuper: 1.2 }, PUMPED: { slump: 16, hasPumping: true, dosageSuper: 1.5 },
  MASS: { fck28: 30, dosageSuper: 0.5, dosageFlyAsh: 25 }, MARINE: { exposureClass: 'XS1', dosageSuper: 1.5, dosageSlag: 35 },
  PRECAST: { dosageSuper: 1.5, dosageAccelerator: 0.5 }, PRESTRESSED: { fck28: 50, dosageSuper: 1.5 },
  FRC: { selectedFiberId: 'steel-fiber', fiberDosageKgM3: 35, fiberDensity: 7850, dosageSuper: 1.2 }
};

function clean(v) { return typeof v === 'number' && Number.isFinite(v) ? Number(v.toFixed(3)) : v; }
function run(code) {
  const input = { ...common, concreteType: code, ...(overrides[code] || {}) };
  const r = calculateDreuxGorisseCore(input, 'en');
  const abs = r.absoluteVolumeCheck || {};
  return {
    code, valid: !!r.valid, isValid: !!r.isValid, engineStatus: r.engineStatus || null,
    errors: r.errors || [], warnings: (r.warnings || []).slice(0, 6),
    cementKgM3: clean(r.cementWeight), flyAshKgM3: clean(r.cementitiousMaterials?.flyAsh), slagKgM3: clean(r.cementitiousMaterials?.slag), silicaFumeKgM3: clean(r.cementitiousMaterials?.silicaFume),
    totalBinderKgM3: clean(r.totalBinder), effectiveWaterL: clean(r.effectiveWater), batchWaterToAddL: clean(r.batchWaterToAdd),
    waterBinderRatio: clean(r.waterBinderRatio), sandKgM3: clean(r.sandWeightDry), gravelKgM3: clean(r.gravelWeightDry),
    freshDensityKgM3: clean(r.totalFreshDensity), volumeClosureValid: abs.isValid ?? null, volumeClosureErrorL: clean(abs.errorLiters ?? abs.deviationLiters ?? abs.error),
    traceCount: r.calculationTrace?.length || 0
  };
}

const results = allCodes.map(run);
const summary = { generatedAt: new Date().toISOString(), typeCount: results.length, validCount: results.filter(x => x.valid).length, invalidCount: results.filter(x => !x.valid).length, results };
console.log(JSON.stringify(summary, null, 2));
