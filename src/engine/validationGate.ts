import { MixDesignInput, MixDesignResult } from "./types";
import { validateConcreteType } from "../concreteTypes";

export interface ValidationGateResult {
  isValidForReport: boolean;
  criticalErrors: string[];
  warnings: string[];
  infos: string[];
  methodApplicability?: {
    applicable: boolean;
    level: "applicable" | "limited" | "not_applicable";
    reasons: string[];
    recommendations: string[];
  };
  validationSummary?: string;
  recommendations?: string[];
  calculationNotes?: string[];
}

export function validateCalculationLogic(
  inputs: any,
  results: any,
  language: "ar" | "fr" | "en" = "ar"
): ValidationGateResult {
  const criticalErrors: string[] = [];
  const warnings: string[] = [];
  const infos: string[] = [];

  // Helper to check for NaN/Infinity recursively
  const hasNaNOrInfinity = (obj: any): boolean => {
    if (obj === null || obj === undefined) return false;
    if (typeof obj === "number") {
      return isNaN(obj) || !isFinite(obj);
    }
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        if (hasNaNOrInfinity(obj[i])) return true;
      }
      return false;
    }
    if (typeof obj === "object") {
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          if (hasNaNOrInfinity(obj[key])) {
            return true;
          }
        }
      }
    }
    return false;
  };

  if (hasNaNOrInfinity(inputs) || hasNaNOrInfinity(results)) {
    criticalErrors.push("contains_nan_or_infinity");
    return {
      isValidForReport: false,
      criticalErrors,
      warnings,
      infos
    };
  }

  // Helper to check for invalid/missing numbers
  const isInvalidNum = (val: any) => 
    val === undefined || 
    val === null || 
    typeof val !== "number" || 
    isNaN(val) || 
    !isFinite(val);

  // 1. Missing or non-numeric inputs
  const cement = results ? (results.cementWeight ?? results.cementKg) : undefined;
  const sandDry = results ? (results.sandWeightDry ?? results.fineAggregateKg) : undefined;
  const gravelDry = results ? (results.gravelWeightDry ?? results.coarseAggregateKg) : undefined;
  const designWater = results ? (results.designWater ?? results.waterContentActual ?? results.waterKg) : undefined;

  // Granular Engineering Center Integration Validation Checks
  const hasRequiredMaterials = 
    !inputs || (
      (inputs.selectedCementId === undefined || !!inputs.selectedCementId) && 
      (inputs.selectedSandId === undefined || !!inputs.selectedSandId) && 
      (inputs.selectedGravelId === undefined || !!inputs.selectedGravelId) && 
      (inputs.selectedWaterId === undefined || !!inputs.selectedWaterId)
    );

  if (!hasRequiredMaterials) {
    criticalErrors.push("materials_missing");
  }

  // Project details validation
  if (inputs) {
    if (inputs.currentProject === "" || (inputs.currentProject !== undefined && inputs.currentProject.trim() === "")) {
      criticalErrors.push("project_name_missing");
    }
    if (inputs.currentClient === "" || (inputs.currentClient !== undefined && inputs.currentClient.trim() === "")) {
      criticalErrors.push("project_client_missing");
    }
    if (inputs.currentPlant === "" || (inputs.currentPlant !== undefined && inputs.currentPlant.trim() === "")) {
      criticalErrors.push("project_plant_missing");
    }
  }

  const hasRequiredProperties = 
    !inputs || (
      (inputs.cementDensity === undefined || (!isInvalidNum(inputs.cementDensity) && inputs.cementDensity > 0)) &&
      (inputs.sandRelativeDensity === undefined || (!isInvalidNum(inputs.sandRelativeDensity) && inputs.sandRelativeDensity > 0)) &&
      (inputs.gravelRelativeDensity === undefined || (!isInvalidNum(inputs.gravelRelativeDensity) && inputs.gravelRelativeDensity > 0)) &&
      (inputs.moistureSand === undefined || !isInvalidNum(inputs.moistureSand)) && 
      (inputs.moistureGravel === undefined || !isInvalidNum(inputs.moistureGravel)) &&
      (inputs.sandAbsorption === undefined || !isInvalidNum(inputs.sandAbsorption)) && 
      (inputs.gravelAbsorption === undefined || !isInvalidNum(inputs.gravelAbsorption)) &&
      (inputs.dMax === undefined || (!isInvalidNum(inputs.dMax) && inputs.dMax > 0))
    );

  if (!hasRequiredProperties) {
    criticalErrors.push("properties_missing");
  }

  if (inputs && inputs.isGranularOptimizedApproved !== undefined && !inputs.isGranularOptimizedApproved) {
    criticalErrors.push("granular_optimization_not_approved");
  }

  if (inputs && inputs.isGranularOptimizedApproved && inputs.approvedRatios) {
    let sum = 0;
    for (const val of Object.values(inputs.approvedRatios)) {
      sum += parseFloat(val as string) || 0;
    }
    if (Math.abs(sum - 100) > 0.1) {
      criticalErrors.push("aggregate_percentages_not_100");
    }
  }

  if (inputs && inputs.isGranularOptimizedApproved) {
    if (!inputs.approvedGradingCurve || inputs.approvedGradingCurve.length === 0 || inputs.approvedGradingCurve.some((pt: any) => pt.passing === undefined || isNaN(pt.passing) || pt.passing < 0 || pt.passing > 100)) {
      criticalErrors.push("particle_size_distribution_invalid");
    }
  }

  const isGpc = inputs && inputs.concreteType === "GPC";
  const activeBinder = isGpc 
    ? (results.totalBinder ?? (results.cementitiousMaterials ? (results.cementitiousMaterials.flyAsh + results.cementitiousMaterials.slag) : 0) ?? 350)
    : cement;

  const missingInputs = 
    !inputs ||
    !results ||
    isInvalidNum(inputs.fck28) || 
    isInvalidNum(inputs.slump) || 
    isInvalidNum(inputs.dMax) ||
    isInvalidNum(activeBinder) || activeBinder <= 0 ||
    isInvalidNum(sandDry) || sandDry <= 0 ||
    isInvalidNum(gravelDry) || gravelDry <= 0 ||
    isInvalidNum(designWater) || designWater <= 0;

  if (missingInputs || !hasRequiredMaterials || !hasRequiredProperties || (inputs && inputs.isGranularOptimizedApproved !== undefined && !inputs.isGranularOptimizedApproved)) {
    if (missingInputs && !criticalErrors.includes("missing")) {
      criticalErrors.push("missing");
    }
    return {
      isValidForReport: false,
      criticalErrors,
      warnings,
      infos
    };
  }

  // 2. Negative values or impossible values
  const sandWet = results.sandWeightWet ?? sandDry;
  const gravelWet = results.gravelWeightWet ?? gravelDry;
  const waterToAdd = results.waterToAdd !== undefined ? results.waterToAdd : (results.waterLiters ?? 0);
  const totalCost = results.totalCost ?? 0;

  const totalAdmixtureWeight = (results.admixtureWeights || []).reduce((acc: number, item: any) => acc + (item.weight || 0), 0);
  
  const totalBinderWeightForSum = isGpc 
    ? ((results.cementitiousMaterials?.flyAsh ?? 0) + (results.cementitiousMaterials?.slag ?? 0) + (results.cementitiousMaterials?.silicaFume ?? 0))
    : cement;
    
  const totalBatchWeight1m3 = totalBinderWeightForSum + (results.waterToAdd ?? results.waterContentActual ?? results.waterKg) + sandWet + gravelWet + totalAdmixtureWeight;

  const hasNegative = 
    activeBinder < 0 ||
    designWater < 0 ||
    waterToAdd < 0 ||
    sandDry < 0 ||
    sandWet < 0 ||
    gravelDry < 0 ||
    gravelWet < 0 ||
    totalBatchWeight1m3 < 0 ||
    totalAdmixtureWeight < 0 ||
    totalCost < 0;

  if (hasNegative) {
    criticalErrors.push("negative");
  }

  // 3. Water addition check
  const totalFreeSurfaceWater = results.totalFreeSurfaceWater ?? 0;
  if (waterToAdd < 0 || totalFreeSurfaceWater > designWater) {
    criticalErrors.push("moisture_water");
  }

  // 4. Water to cement ratio (W/C)
  const effectiveWater = results.effectiveWater ?? results.waterContentActual ?? results.waterKg;
  const waterCementRatio = effectiveWater / activeBinder;

  if (waterCementRatio < 0.25 || waterCementRatio > 0.75) {
    criticalErrors.push("wc_ratio");
  } else if (waterCementRatio >= 0.60 && waterCementRatio <= 0.75) {
    warnings.push("wc_high");
  }

  // 5. Cement quantity limits
  if (activeBinder < 150 || activeBinder > 700) {
    criticalErrors.push("cement_range");
  } else {
    if (activeBinder < 250) {
      warnings.push("cement_low");
    }
    if (activeBinder > 500) {
      warnings.push("cement_high");
    }
  }

  // 6. Design water limits
  if (designWater < 80 || designWater > 300) {
    criticalErrors.push("water_range");
  }

  // 7. Total batch weight per m3 limits
  if (totalBatchWeight1m3 < 1800 || totalBatchWeight1m3 > 2700) {
    criticalErrors.push("weight_range");
  }

  // 8. Aggregates dry weight and ratios
  const sandRatio = sandDry / (sandDry + gravelDry);
  if (sandDry <= 0 || gravelDry <= 0 || sandRatio < 0.25 || sandRatio > 0.60) {
    criticalErrors.push("sand_ratio");
  }

  // 9. Moisture and Absorption limits
  const moistureSand = inputs.moistureSand ?? 0;
  const moistureGravel = inputs.moistureGravel ?? 0;
  const sandAbsorption = inputs.sandAbsorption ?? 1.5;
  let gravelAbsorption = inputs.gravelAbsorption ?? 0.8;
  if (inputs.selectedLightweightAggregateId && inputs.lightweightAggregateAbsorption !== undefined) {
    gravelAbsorption = inputs.lightweightAggregateAbsorption;
  } else if (inputs.selectedHeavyweightAggregateId && inputs.heavyweightAggregateAbsorption !== undefined) {
    gravelAbsorption = inputs.heavyweightAggregateAbsorption;
  }

  const moistureOutRange = 
    moistureSand < 0 || 
    moistureGravel < 0 || 
    sandAbsorption < 0 || 
    gravelAbsorption < 0 ||
    moistureSand > 20 || 
    moistureGravel > 10 || 
    sandAbsorption > 10 || 
    gravelAbsorption > 8;

  if (moistureOutRange) {
    criticalErrors.push("moisture_range");
  }

  // 10. Dry vs Wet aggregates weight contradiction
  const isContradiction = 
    (moistureSand > 0 && sandWet < sandDry) || 
    (moistureGravel > 0 && gravelWet < gravelDry);

  if (isContradiction) {
    criticalErrors.push("contradiction");
  }

  // 11. Cost breakdown summation consistency (tolerance 0.5%)
  if (results.costBreakdown && results.totalCost) {
    const computedSum = (results.costBreakdown || []).reduce((acc: number, item: any) => acc + (item.cost || 0), 0);
    const diff = Math.abs(computedSum - results.totalCost);
    const maxDiff = results.totalCost * 0.005;
    if (computedSum > 0 && results.totalCost > 0 && diff > Math.max(0.1, maxDiff)) {
      criticalErrors.push("cost_sum");
    }
  }

  // --- Arithmetic Consistency Checks ---
  const tol = 0.5; // absolute tolerance in kg / L
  const relTol = 0.005; // 0.5% relative tolerance

  const isConsistent = (actual: any, expected: number, customTol = tol, customRelTol = relTol) => {
    if (actual === undefined || actual === null || typeof actual !== "number" || isNaN(actual) || !isFinite(actual)) {
      return false;
    }
    const diff = Math.abs(actual - expected);
    const maxRel = expected * customRelTol;
    return diff <= customTol || diff <= maxRel;
  };

  // 1. Sand wet weight validation
  const expectedSandWet = sandDry * (1 + moistureSand / 100);
  if (!isConsistent(sandWet, expectedSandWet)) {
    criticalErrors.push("sand_wet_moisture_mismatch");
  }

  // 2. Gravel wet weight validation
  const expectedGravelWet = gravelDry * (1 + moistureGravel / 100);
  if (!isConsistent(gravelWet, expectedGravelWet)) {
    criticalErrors.push("gravel_wet_moisture_mismatch");
  }

  // 3. Total moisture water validation
  const expectedSandTotalMoistureWater = sandDry * moistureSand / 100;
  const expectedGravelTotalMoistureWater = gravelDry * moistureGravel / 100;

  const sandTotalMoistureWaterActual = results.sandTotalMoistureWater ?? results.sandMoistureWater;
  const gravelTotalMoistureWaterActual = results.gravelTotalMoistureWater ?? results.gravelMoistureWater;

  if (sandTotalMoistureWaterActual !== undefined && !isConsistent(sandTotalMoistureWaterActual, expectedSandTotalMoistureWater)) {
    criticalErrors.push("total_moisture_water_mismatch");
  } else if (gravelTotalMoistureWaterActual !== undefined && !isConsistent(gravelTotalMoistureWaterActual, expectedGravelTotalMoistureWater)) {
    criticalErrors.push("total_moisture_water_mismatch");
  }

  // 4. Absorption water validation
  const expectedSandAbsorptionWater = sandDry * sandAbsorption / 100;
  const expectedGravelAbsorptionWater = gravelDry * gravelAbsorption / 100;

  const sandAbsorptionWaterActual = results.sandAbsorptionWater;
  const gravelAbsorptionWaterActual = results.gravelAbsorptionWater;

  if (sandAbsorptionWaterActual !== undefined && !isConsistent(sandAbsorptionWaterActual, expectedSandAbsorptionWater)) {
    criticalErrors.push("absorption_water_mismatch");
  } else if (gravelAbsorptionWaterActual !== undefined && !isConsistent(gravelAbsorptionWaterActual, expectedGravelAbsorptionWater)) {
    criticalErrors.push("absorption_water_mismatch");
  }

  // 5. Free surface water validation
  const mathSandFree = sandDry * Math.max(0, moistureSand - sandAbsorption) / 100;
  const mathGravelFree = gravelDry * Math.max(0, moistureGravel - gravelAbsorption) / 100;
  const expectedTotalFreeSurfaceWater = mathSandFree + mathGravelFree;

  if (!isConsistent(totalFreeSurfaceWater, expectedTotalFreeSurfaceWater)) {
    criticalErrors.push("aggregate_free_water_mismatch");
  }

  // 6. Absorption deficit validation
  const expectedSandAbsorptionDeficit = sandDry * Math.max(0, sandAbsorption - moistureSand) / 100;
  const expectedGravelAbsorptionDeficit = gravelDry * Math.max(0, gravelAbsorption - moistureGravel) / 100;
  const expectedTotalAbsorptionDeficit = expectedSandAbsorptionDeficit + expectedGravelAbsorptionDeficit;

  const totalAbsorptionDeficitActual = results.totalAbsorptionDeficit;
  if (totalAbsorptionDeficitActual !== undefined && !isConsistent(totalAbsorptionDeficitActual, expectedTotalAbsorptionDeficit)) {
    criticalErrors.push("absorption_deficit_mismatch");
  }

  // 7. Actual water to add validation
  let expectedWaterToAdd = designWater - expectedTotalFreeSurfaceWater + expectedTotalAbsorptionDeficit;
  expectedWaterToAdd = Math.max(0, expectedWaterToAdd);

  if (!isConsistent(waterToAdd, expectedWaterToAdd)) {
    criticalErrors.push("actual_water_added_mismatch");
  }

  // 8. Total real batch weight validation
  const expectedTotalBatchWeight = totalBinderWeightForSum + sandWet + gravelWet + waterToAdd + totalAdmixtureWeight;
  const totalBatchWeightActual = results.totalBatchWeight ?? results.totalBatchWeight1m3;

  if (totalBatchWeightActual !== undefined && !isConsistent(totalBatchWeightActual, expectedTotalBatchWeight)) {
    criticalErrors.push("total_batch_weight_mismatch");
  }

  // 9. Water to cement ratio validation
  const expectedWaterCementRatio = effectiveWater / activeBinder;
  const waterCementRatioActual = results.waterCementRatio;

  if (waterCementRatioActual !== undefined && !isConsistent(waterCementRatioActual, expectedWaterCementRatio, 0.005, 0.005)) {
    criticalErrors.push("water_cement_ratio_mismatch");
  }

  if (results.valid === false || results.isValid === false) {
    criticalErrors.push("result_invalid");
  }

  if (results.materialSuitability?.status === "blocked") {
    criticalErrors.push("material_blocked");
  }

  if (results.materialSuitability?.status === "diagnostic_only") {
    criticalErrors.push("material_diagnostic_only");
  }

  if (results.compliance && results.compliance.isCompliant === false) {
    criticalErrors.push("en206_non_compliant");
  }

  if (results.compliance?.checks?.some((c: any) => c.status === "non_compliant" || c.status === "invalid")) {
    if (!criticalErrors.includes("en206_non_compliant")) {
      criticalErrors.push("en206_non_compliant");
    }
  }

  // 12. Concrete Type specific validation gate
  if (inputs && results && inputs.concreteType) {
    try {
      const typeReport = validateConcreteType(inputs.concreteType, inputs, results);
      if (typeReport.status === "requires_optimization") {
        criticalErrors.push("concrete_type_incompatible");
      }
    } catch (e) {
      console.error("Error validating concrete type in gate:", e);
    }
  }

  if (hasNaNOrInfinity(results)) {
    criticalErrors.push("contains_nan_or_infinity");
  }

  // Infos
  infos.push("basis_si");
  if (inputs.costBasis) {
    infos.push(inputs.costBasis === "wet" ? "cost_basis_wet" : "cost_basis_dry");
  }

  return {
    isValidForReport: criticalErrors.length === 0,
    criticalErrors,
    warnings,
    infos,
    methodApplicability: results?.methodApplicability,
    validationSummary: results?.validationSummary,
    recommendations: results?.recommendations,
    calculationNotes: results?.calculationNotes
  };
}
