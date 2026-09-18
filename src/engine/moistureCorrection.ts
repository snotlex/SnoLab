/**
 * Concrete Aggregate Moisture and SSD Correction Engine
 * 
 * Conforms to ACI 211.1-22 & EN 206 principles:
 * - SSD (Saturated Surface Dry) state is the theoretical benchmark for mix design.
 * - Total moisture M (%) and absorption A (%) are defined relative to oven-dry mass.
 * - asBatchedAggregate = SSD aggregate mass * (1 + M/100) / (1 + A/100)
 * - When M > A (wet of SSD): freeSurfaceWater = SSD aggregate mass * (M - A)/100 / (1 + A/100)
 * - When M < A (dry of SSD): absorptionDeficit = SSD aggregate mass * (A - M)/100 / (1 + A/100)
 * - waterToAdd = effectiveWater - totalFreeSurfaceWater + totalAbsorptionDeficit
 * - If rawWaterToAdd < 0: aggregates supply more free water than required effective water.
 *   waterToAdd is capped at 0 with an auditable critical warning.
 */

export type AggregateMoistureState = "dryOfSSD" | "SSD" | "wetOfSSD";

export interface AggregateMoistureDetail {
  fractionName: string;
  ovenDryKg: number;
  ssdKg: number;
  absorptionPercent: number;
  totalMoisturePercent: number;
  moistureState: AggregateMoistureState;
  asBatchedKg: number;
  freeSurfaceWaterKg: number;
  absorptionDeficitKg: number;
}

export interface MoistureCorrectionResult {
  // Detailed aggregate fractions
  fineAggregate: AggregateMoistureDetail;
  coarseAggregate: AggregateMoistureDetail;
  aggregates: AggregateMoistureDetail[];

  // Totals
  totalFreeSurfaceWaterKg: number;
  totalAbsorptionDeficitKg: number;
  effectiveWaterKg: number;
  rawWaterToAddKg: number;
  waterToAddKg: number;
  moistureState: AggregateMoistureState;
  warnings: string[];

  // Backward compatibility aliases
  sandWetKg: number;
  gravelWetKg: number;
  waterAddedKg: number;
  sandTotalMoistureWater: number;
  gravelTotalMoistureWater: number;
  sandFreeSurfaceWater: number;
  gravelFreeSurfaceWater: number;
  sandAbsorptionDeficit: number;
  gravelAbsorptionDeficit: number;
  totalFreeSurfaceWater: number;
  totalAbsorptionDeficit: number;
}

export interface MoistureCorrectionParams {
  // Aggregate design mass: can be specified as dry or SSD
  sandDryKg?: number;
  gravelDryKg?: number;
  sandSSDKg?: number;
  gravelSSDKg?: number;
  effectiveWaterKg?: number;
  waterPureKg?: number; // legacy alias for effectiveWaterKg

  sandMoisturePercent?: number;  // total moisture M (%)
  gravelMoisturePercent?: number; // total moisture M (%)
  sandAbsorptionPercent?: number; // absorption capacity A (%)
  gravelAbsorptionPercent?: number; // absorption capacity A (%)
}

/**
 * Calculates SSD moisture corrections and field batching quantities.
 */
export function applyMoistureCorrection(params: MoistureCorrectionParams): MoistureCorrectionResult {
  const warnings: string[] = [];

  const M_sand = Math.max(0, params.sandMoisturePercent ?? 0);
  const M_gravel = Math.max(0, params.gravelMoisturePercent ?? 0);
  const A_sand = Math.max(0, params.sandAbsorptionPercent ?? 0);
  const A_gravel = Math.max(0, params.gravelAbsorptionPercent ?? 0);

  const effectiveWater = params.effectiveWaterKg ?? params.waterPureKg ?? 0;

  // Resolve fine aggregate dry & SSD masses
  let sandDryKg = 0;
  let sandSSDKg = 0;
  if (params.sandSSDKg !== undefined && params.sandSSDKg > 0) {
    sandSSDKg = params.sandSSDKg;
    sandDryKg = sandSSDKg / (1 + A_sand / 100);
  } else {
    sandDryKg = params.sandDryKg ?? 0;
    sandSSDKg = sandDryKg * (1 + A_sand / 100);
  }

  // Resolve coarse aggregate dry & SSD masses
  let gravelDryKg = 0;
  let gravelSSDKg = 0;
  if (params.gravelSSDKg !== undefined && params.gravelSSDKg > 0) {
    gravelSSDKg = params.gravelSSDKg;
    gravelDryKg = gravelSSDKg / (1 + A_gravel / 100);
  } else {
    gravelDryKg = params.gravelDryKg ?? 0;
    gravelSSDKg = gravelDryKg * (1 + A_gravel / 100);
  }

  // Fine Aggregate calculations
  let sandState: AggregateMoistureState = "SSD";
  let sandFreeSurfaceWater = 0;
  let sandAbsorptionDeficit = 0;

  if (Math.abs(M_sand - A_sand) < 0.001) {
    sandState = "SSD";
  } else if (M_sand > A_sand) {
    sandState = "wetOfSSD";
    sandFreeSurfaceWater = sandSSDKg * (M_sand - A_sand) / 100 / (1 + A_sand / 100);
  } else {
    sandState = "dryOfSSD";
    sandAbsorptionDeficit = sandSSDKg * (A_sand - M_sand) / 100 / (1 + A_sand / 100);
  }

  const sandAsBatchedKg = sandSSDKg * (1 + M_sand / 100) / (1 + A_sand / 100);
  const sandTotalMoistureWater = sandDryKg * (M_sand / 100);

  // Coarse Aggregate calculations
  let gravelState: AggregateMoistureState = "SSD";
  let gravelFreeSurfaceWater = 0;
  let gravelAbsorptionDeficit = 0;

  if (Math.abs(M_gravel - A_gravel) < 0.001) {
    gravelState = "SSD";
  } else if (M_gravel > A_gravel) {
    gravelState = "wetOfSSD";
    gravelFreeSurfaceWater = gravelSSDKg * (M_gravel - A_gravel) / 100 / (1 + A_gravel / 100);
  } else {
    gravelState = "dryOfSSD";
    gravelAbsorptionDeficit = gravelSSDKg * (A_gravel - M_gravel) / 100 / (1 + A_gravel / 100);
  }

  const gravelAsBatchedKg = gravelSSDKg * (1 + M_gravel / 100) / (1 + A_gravel / 100);
  const gravelTotalMoistureWater = gravelDryKg * (M_gravel / 100);

  // Aggregation
  const totalFreeSurfaceWater = sandFreeSurfaceWater + gravelFreeSurfaceWater;
  const totalAbsorptionDeficit = sandAbsorptionDeficit + gravelAbsorptionDeficit;

  const rawWaterToAdd = effectiveWater - totalFreeSurfaceWater + totalAbsorptionDeficit;
  const waterToAdd = Math.max(0, rawWaterToAdd);

  if (rawWaterToAdd < 0) {
    warnings.push(
      `تحذير حرج: الركام رطب جداً ويورد ماءً حراً (${totalFreeSurfaceWater.toFixed(1)} كجم) أكبر من ماء الخلط الفعال (${effectiveWater.toFixed(1)} كجم). تم تثبيت ماء الإضافة عند 0 كجم/م³ مع فائض ماء حر قدره ${Math.abs(rawWaterToAdd).toFixed(1)} كجم/م³، مما يزيد من نسبة W/C الفعلية ويهدد هبوط الخرسانة ومقاومتها.`
    );
  } else if (M_sand === 0 && M_gravel === 0) {
    warnings.push("ملاحظة: تم اعتبار الركام جافاً تماماً (0% رطوبة)، وتمت إضافة ماء تعويض امتصاص لتأمين حالة SSD.");
  }

  let overallMoistureState: AggregateMoistureState = "SSD";
  if (totalFreeSurfaceWater > totalAbsorptionDeficit) {
    overallMoistureState = "wetOfSSD";
  } else if (totalAbsorptionDeficit > totalFreeSurfaceWater) {
    overallMoistureState = "dryOfSSD";
  }

  const fineDetail: AggregateMoistureDetail = {
    fractionName: "الرمل (Fine Aggregate)",
    ovenDryKg: sandDryKg,
    ssdKg: sandSSDKg,
    absorptionPercent: A_sand,
    totalMoisturePercent: M_sand,
    moistureState: sandState,
    asBatchedKg: sandAsBatchedKg,
    freeSurfaceWaterKg: sandFreeSurfaceWater,
    absorptionDeficitKg: sandAbsorptionDeficit
  };

  const coarseDetail: AggregateMoistureDetail = {
    fractionName: "الحصى (Coarse Aggregate)",
    ovenDryKg: gravelDryKg,
    ssdKg: gravelSSDKg,
    absorptionPercent: A_gravel,
    totalMoisturePercent: M_gravel,
    moistureState: gravelState,
    asBatchedKg: gravelAsBatchedKg,
    freeSurfaceWaterKg: gravelFreeSurfaceWater,
    absorptionDeficitKg: gravelAbsorptionDeficit
  };

  return {
    fineAggregate: fineDetail,
    coarseAggregate: coarseDetail,
    aggregates: [fineDetail, coarseDetail],
    totalFreeSurfaceWaterKg: totalFreeSurfaceWater,
    totalAbsorptionDeficitKg: totalAbsorptionDeficit,
    effectiveWaterKg: effectiveWater,
    rawWaterToAddKg: rawWaterToAdd,
    waterToAddKg: waterToAdd,
    moistureState: overallMoistureState,
    warnings,

    // Backward compatibility aliases
    sandWetKg: sandAsBatchedKg,
    gravelWetKg: gravelAsBatchedKg,
    waterAddedKg: waterToAdd,
    sandTotalMoistureWater,
    gravelTotalMoistureWater,
    sandFreeSurfaceWater,
    gravelFreeSurfaceWater,
    sandAbsorptionDeficit,
    gravelAbsorptionDeficit,
    totalFreeSurfaceWater,
    totalAbsorptionDeficit
  };
}
