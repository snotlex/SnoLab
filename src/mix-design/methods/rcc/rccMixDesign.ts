import { resolveSpecializedMaterials } from "../shared/specializedMixDesignUtils";

import {
  MixDesignInput,
  ApplicabilityResult,
  ValidationError,
  ValidationResult,
  MixDesignResult,
  MaterialQuantity,
  CalculationTraceStep
} from "../../core/types";

const EPS = 1e-9;

function positive(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > EPS;
}

function pct(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
}

function message(language: "ar" | "fr" | "en", ar: string, fr: string, en: string): string {
  return language === "fr" ? fr : language === "en" ? en : ar;
}

function densityFromRelative(relativeDensity: number): number {
  return relativeDensity * 1000;
}

function getAggregateDensity(input: MixDesignInput): number {
  const sand = densityFromRelative(input.sandRelativeDensity);
  const gravel = densityFromRelative(input.gravelRelativeDensity);
  const finePct = (input.rccFineAggregatePercent ?? 52.5) / 100;
  const coarsePct = 1 - finePct;
  return finePct * sand + coarsePct * gravel;
}

function getAggregateMoistureCorrection(
  drySandKg: number,
  dryGravelKg: number,
  input: MixDesignInput
): { freeSurfaceWaterKg: number; wetSandKg: number; wetGravelKg: number; addedWaterKg: number } {
  const sandMoisture = Math.max(0, input.moistureSand || 0) / 100;
  const gravelMoisture = Math.max(0, input.moistureGravel || 0) / 100;
  const sandAbsorption = Math.max(0, input.sandAbsorption || 0) / 100;
  const gravelAbsorption = Math.max(0, input.gravelAbsorption || 0) / 100;

  const sandFree = drySandKg * Math.max(0, sandMoisture - sandAbsorption);
  const gravelFree = dryGravelKg * Math.max(0, gravelMoisture - gravelAbsorption);
  const wetSandKg = drySandKg * (1 + sandMoisture);
  const wetGravelKg = dryGravelKg * (1 + gravelMoisture);

  return {
    freeSurfaceWaterKg: sandFree + gravelFree,
    wetSandKg,
    wetGravelKg,
    addedWaterKg: 0
  };
}

export function checkRccApplicability(input: MixDesignInput): ApplicabilityResult {
  const type = String(input.concreteType || "").trim().toUpperCase();
  if (type !== "RCC" && type !== "BCR" && type !== "ROLLER COMPACTED CONCRETE") {
    return {
      level: "not_applicable",
      reasons: ["The RCC method is reserved for roller-compacted concrete."],
      recommendations: ["Select concrete type RCC/BCR before using the RCC method."]
    };
  }

  return {
    level: "applicable",
    reasons: [],
    recommendations: [
      "The computed proportions are a laboratory starting mix, not a final field approval.",
      "Confirm optimum moisture, compacted density and strength by RCC laboratory trials."
    ]
  };
}

export function validateRccInputs(
  input: MixDesignInput,
  language: "ar" | "fr" | "en"
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const resolvedMaterials = resolveSpecializedMaterials(input, language, false, false, true);
  for (const error of resolvedMaterials.errors) {
    errors.push({ code: "RCC_MATERIAL_RESOLUTION", severity: "error", field: "materialsDatabase", message: error });
  }

  const required: Array<[keyof MixDesignInput, string]> = [
    ["rccWaterKgM3", message(language, "ماء RCC الكلي", "Eau totale RCC", "RCC total water")],
    ["rccWaterBinderRatio", message(language, "نسبة الماء إلى المواد الرابطة", "Rapport eau/liant", "water-to-binder ratio")],
    ["rccOptimumMoisturePercent", message(language, "الرطوبة المثلى", "Humidité optimale", "optimum moisture")],
    ["rccMaxDryDensityKgM3", message(language, "الكثافة الجافة القصوى", "Masse volumique sèche maximale", "maximum dry density")],
    ["rccFineAggregatePercent", message(language, "نسبة الرمل من الركام", "Teneur en sable", "fine aggregate percentage")]
  ];

  for (const [field, label] of required) {
    if (!positive(input[field])) {
      errors.push({
        code: "RCC_REQUIRED_INPUT",
        severity: "error",
        field: String(field),
        message: message(
          language,
          `يجب إدخال ${label} بقيمة موجبة.`,
          `La valeur de ${label} doit être positive.`,
          `${label} must be a positive value.`
        )
      });
    }
  }

  if (positive(input.rccWaterBinderRatio) && (input.rccWaterBinderRatio! < 0.20 || input.rccWaterBinderRatio! > 0.60)) {
    warnings.push({
      code: "RCC_WB_OUTSIDE_TYPICAL",
      severity: "warning",
      field: "rccWaterBinderRatio",
      message: message(
        language,
        "نسبة الماء إلى الرابط خارج المجال الابتدائي المعتاد لـRCC؛ يجب تأكيدها مخبريًا.",
        "Le rapport eau/liant est hors d'une plage initiale courante pour le RCC; il doit être confirmé au laboratoire.",
        "The water-to-binder ratio is outside a common initial RCC range and must be confirmed by laboratory trials."
      )
    });
  }

  if (positive(input.rccOptimumMoisturePercent) && (input.rccOptimumMoisturePercent! < 2 || input.rccOptimumMoisturePercent! > 10)) {
    warnings.push({
      code: "RCC_OMC_OUTSIDE_TYPICAL",
      severity: "warning",
      field: "rccOptimumMoisturePercent",
      message: message(
        language,
        "الرطوبة المثلى خارج مجال أولي شائع؛ لا تعتمد القيمة دون منحنى الرطوبة-الكثافة.",
        "L'humidité optimale est hors d'une plage initiale courante; ne pas la retenir sans courbe humidité-densité.",
        "Optimum moisture is outside a common initial range; do not accept it without a moisture-density curve."
      )
    });
  }

  if (positive(input.rccMaxDryDensityKgM3) && input.rccMaxDryDensityKgM3! < 1800) {
    warnings.push({
      code: "RCC_LOW_DRY_DENSITY",
      severity: "warning",
      field: "rccMaxDryDensityKgM3",
      message: message(
        language,
        "الكثافة الجافة القصوى منخفضة نسبيًا لـRCC؛ راجع تدرج الركام والدمك.",
        "La masse volumique sèche maximale est relativement faible pour un RCC; vérifier la granularité et le compactage.",
        "Maximum dry density is relatively low for RCC; review aggregate grading and compaction."
      )
    });
  }

  if (positive(input.rccFineAggregatePercent) && (input.rccFineAggregatePercent! < 40 || input.rccFineAggregatePercent! > 60)) {
    warnings.push({
      code: "RCC_FINE_AGGREGATE_OUTSIDE_TYPICAL",
      severity: "warning",
      field: "rccFineAggregatePercent",
      message: message(
        language,
        "نسبة الرمل خارج المجال الشائع لتدرج RCC؛ يجب تأكيد التدرج المختلط مخبريًا.",
        "La teneur en sable est hors d'une plage courante pour le RCC; confirmer la granularité combinée au laboratoire.",
        "Fine aggregate percentage is outside a common RCC range; confirm combined grading in the laboratory."
      )
    });
  }

  if (input.dMax > 50) {
    errors.push({
      code: "RCC_DMAX_LIMIT",
      severity: "error",
      field: "dMax",
      message: message(
        language,
        "اختبار الكثافة/القوام ASTM C1170 يطبق مباشرة حتى Dmax = 50 mm؛ راجع منهج الاختبار عند تجاوز ذلك.",
        "La méthode ASTM C1170 s'applique directement jusqu'à Dmax = 50 mm; vérifier la méthode au-delà.",
        "ASTM C1170 directly applies up to Dmax = 50 mm; review the test method above that size."
      )
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export function calculateRccMix(
  input: MixDesignInput,
  language: "ar" | "fr" | "en"
): MixDesignResult {
  const validation = validateRccInputs(input, language);
  if (!validation.isValid) {
    return blockedRccResult(input, validation, language);
  }

  const water = input.rccWaterKgM3!;
  const wb = input.rccWaterBinderRatio!;
  const dryDensity = input.rccMaxDryDensityKgM3!;
  const finePct = input.rccFineAggregatePercent! / 100;
  const coarsePct = 1 - finePct;

  const totalBinder = water / wb;
  const totalDryAggregate = dryDensity - totalBinder;

  if (totalDryAggregate <= 0) {
    return blockedRccResult(input, {
      isValid: false,
      errors: [{
        code: "RCC_NEGATIVE_AGGREGATE_MASS",
        severity: "error",
        field: "rccMaxDryDensityKgM3",
        message: message(
          language,
          "الكثافة الجافة المدخلة لا تسمح بكتلة ركام موجبة بعد طرح الرابط.",
          "La masse volumique sèche ne permet pas une masse positive de granulats après soustraction du liant.",
          "The supplied dry density does not leave a positive aggregate mass after binder subtraction."
        )
      }],
      warnings: validation.warnings
    }, language);
  }

  const cementReplacement = Math.min(100, Math.max(0, input.selectedScmReplacementPercent || 0));
  const scm = totalBinder * cementReplacement / 100;
  const cement = totalBinder - scm;

  const fineAggregate = totalDryAggregate * finePct;
  const coarseAggregate = totalDryAggregate * coarsePct;

  const moisture = getAggregateMoistureCorrection(fineAggregate, coarseAggregate, input);
  const freeSurfaceWater = moisture.freeSurfaceWaterKg;
  const addedWater = Math.max(0, water - freeSurfaceWater);

  const cementDensity = positive(input.cementDensity) ? input.cementDensity : 3100;
  const scmDensity = positive(input.selectedScmDensity) ? input.selectedScmDensity : cementDensity;
  const aggregateDensity = getAggregateDensity(input);
  const airPercent = Math.max(0, input.airContent || 0);

  const binderVolume = cement / cementDensity + scm / scmDensity;
  const aggregateVolume = totalDryAggregate / aggregateDensity;
  const waterVolume = water / 1000;
  const airVolume = airPercent / 100;
  const theoreticalVolume = binderVolume + aggregateVolume + waterVolume + airVolume;
  const closureError = Math.abs(theoreticalVolume - 1) * 100;

  const admixtureRows: MaterialQuantity[] = [];
  const superDosage = Math.max(0, input.dosageSuper || 0);
  if (superDosage > 0) {
    admixtureRows.push({
      id: input.selectedAdmixtureId || "superplasticizer",
      name: input.selectedAdmixtureName || "Superplasticizer",
      type: "admixture",
      weight: superDosage
    });
  }

  const admixtureKg = admixtureRows.reduce((sum, row) => sum + row.weight, 0);
  const freshDensity = dryDensity + water + admixtureKg;
  const actualMoisturePercent = dryDensity > 0 ? (water / dryDensity) * 100 : 0;
  const moistureDeviation = actualMoisturePercent - input.rccOptimumMoisturePercent!;

  const checks = [
    {
      parameter: "Optimum moisture",
      requirement: `Target ±0.5 percentage point from laboratory OMC`,
      actual: `${actualMoisturePercent.toFixed(2)}%`,
      status: Math.abs(moistureDeviation) <= 0.5 ? "compliant" : "warning"
    },
    {
      parameter: "Dry density",
      requirement: `${input.rccMaxDryDensityKgM3!.toFixed(1)} kg/m³ laboratory reference`,
      actual: `${dryDensity.toFixed(1)} kg/m³`,
      status: "compliant"
    },
    {
      parameter: "Water/binder",
      requirement: `Input target = ${wb.toFixed(3)}`,
      actual: `${(water / totalBinder).toFixed(3)}`,
      status: "compliant"
    },
    {
      parameter: "Volume closure",
      requirement: "Engineering diagnostic close to 1.000 m³",
      actual: `${theoreticalVolume.toFixed(4)} m³`,
      status: closureError <= 2 ? "compliant" : "warning"
    }
  ] as const;

  const warnings = [
    ...validation.warnings.map(w => w.message),
    "RCC proportions are a laboratory starting mixture; optimum moisture and maximum dry density must be established/confirmed experimentally.",
    "Confirm compressive strength on specimens molded with the RCC-specific compaction procedure before approving the mix for production.",
    Math.abs(moistureDeviation) > 0.5
      ? `Calculated water content is ${moistureDeviation >= 0 ? "+" : ""}${moistureDeviation.toFixed(2)} percentage points from the supplied optimum moisture.`
      : ""
  ].filter(Boolean);

  const trace: CalculationTraceStep[] = [
    {
      stepId: "rcc-binder",
      label: "Cementitious content from design water and W/B",
      formula: "B = W / (W/B)",
      inputs: { waterKgM3: water, waterBinderRatio: wb },
      output: { totalBinderKgM3: totalBinder }
    },
    {
      stepId: "rcc-aggregate",
      label: "Dry aggregate mass from maximum dry density",
      formula: "Magg,dry = rho_d,max - B",
      inputs: { maxDryDensityKgM3: dryDensity, totalBinderKgM3: totalBinder },
      output: { aggregateKgM3: totalDryAggregate }
    },
    {
      stepId: "rcc-split",
      label: "Fine/coarse aggregate split",
      formula: "Msand = Magg × p_f; Mcoarse = Magg × (1-p_f)",
      inputs: { fineAggregatePercent: finePct * 100 },
      output: { sandKgM3: fineAggregate, coarseKgM3: coarseAggregate }
    },
    {
      stepId: "rcc-moisture",
      label: "Aggregate moisture correction",
      formula: "Wadded = max(0, Wdesign - Wfree,surface)",
      inputs: {
        designWaterKgM3: water,
        freeSurfaceWaterKgM3: freeSurfaceWater
      },
      output: {
        addedWaterKgM3: addedWater,
        wetSandKgM3: moisture.wetSandKg,
        wetGravelKgM3: moisture.wetGravelKg
      }
    },
    {
      stepId: "rcc-verification",
      label: "Moisture-density verification",
      formula: "w_actual = Wdesign / rho_d,max × 100",
      inputs: { waterKgM3: water, maxDryDensityKgM3: dryDensity },
      output: {
        actualMoisturePercent,
        optimumMoisturePercent: input.rccOptimumMoisturePercent,
        deviationPercentagePoint: moistureDeviation
      }
    }
  ];

  const isTrialReady = Math.abs(moistureDeviation) <= 0.5 && closureError <= 2;

  return {
    methodName: "RCC / BCR Specialized",
    methodId: "rcc-specialized",
    methodVersion: "1.0.0",
    status: "needs-trial-mix",
    category: "complete-design",
    implementationStatus: "engineering-review",
    isStandaloneCompleteMethod: true,
    cementKg: cement,
    waterKg: addedWater,
    fineAggregateKg: moisture.wetSandKg,
    coarseAggregateKg: moisture.wetGravelKg,
    admixtureKg,
    airContentPercent: airPercent,
    wcRatio: cement > 0 ? addedWater / cement : 0,
    freshDensityKgM3: freshDensity,
    absoluteVolumeCheck: {
      isValid: closureError <= 2,
      totalAbsVolumeL: theoreticalVolume * 1000,
      cementVolL: (cement / cementDensity) * 1000,
      waterVolL: waterVolume * 1000,
      sandVolL: (fineAggregate / densityFromRelative(input.sandRelativeDensity)) * 1000,
      gravelVolL: (coarseAggregate / densityFromRelative(input.gravelRelativeDensity)) * 1000,
      airVolL: airVolume * 1000,
      admixtureVolL: 0,
      deviationPercent: closureError
    },
    warnings,
    errors: [],
    assumptions: [
      "The supplied maximum dry density represents the compacted dry density reference for the selected RCC aggregate blend.",
      "The supplied optimum moisture is a laboratory result or approved project value.",
      "Fine/coarse split is a dry-mass split of total aggregate.",
      "Aggregate moisture correction uses free surface water = moisture - absorption when both are available."
    ],
    compliance: {
      standardName: "RCC laboratory verification: ASTM C1170/C1170M and ASTM C1435/C1435M",
      isCompliant: false,
      checks: checks.map(c => ({
        ...c,
        status: c.status === "compliant" ? "compliant" : "warning"
      }))
    },
    methodApplicability: {
      applicable: true,
      level: "applicable",
      reasons: [],
      recommendations: [
        "Perform moisture-density trials and confirm maximum dry density and optimum moisture.",
        "Verify strength using RCC-specific specimen preparation and compressive testing."
      ]
    },
    recommendations: [
      "Do not treat the numerical starting mix as final production approval.",
      "Use the SnoLab laboratory module to record the moisture-density curve and strength results.",
      "Confirm aggregate combined grading and segregation resistance before field placement."
    ],
    theoreticalCementDemand: totalBinder,
    actualCementUsed: cement,
    waterDemand: water,
    waterCementRatio: cement > 0 ? water / cement : 0,
    absoluteVolumeTotal: theoreticalVolume,
    volumeClosureError: closureError,
    calculationNotes: [
      `Total cementitious content = ${totalBinder.toFixed(1)} kg/m³.`,
      `Dry aggregate content = ${totalDryAggregate.toFixed(1)} kg/m³.`,
      `Calculated added batch water after aggregate moisture correction = ${addedWater.toFixed(1)} kg/m³.`,
      `RCC moisture deviation from supplied OMC = ${moistureDeviation.toFixed(2)} percentage points.`
    ],
    validationSummary: isTrialReady
      ? "Starting RCC proportions pass numerical moisture/volume diagnostics and require laboratory trial verification."
      : "Starting RCC proportions require adjustment or laboratory verification before acceptance.",
    materialSuitability: {
      status: Array.isArray(input.materialsDatabase) && input.materialsDatabase.length > 0 ? "approved" : "warning",
      missingMaterials: [],
      invalidMaterials: [],
      incompatibleMaterials: [],
      warnings: [
        ...(Array.isArray(input.materialsDatabase) && input.materialsDatabase.length > 0 ? [] : [
          "RCC calculation was executed without a populated material repository; production use requires approved project materials."
        ]),
        "Aggregate moisture/absorption values directly affect the added batch-water correction."
      ],
      recommendations: [
        "Keep selected aggregate, cement, water and SCM records linked to the project for traceability."
      ]
    },
    isValid: true,
    valid: true,
    standardsCompliance: {
      method: "RCC specialized",
      laboratoryTrialRequired: true,
      moistureDensityVerificationRequired: true,
      strengthVerificationRequired: true
    },
    method: {
      id: "rcc-specialized",
      name: "Roller-Compacted Concrete",
      version: "1.0.0"
    },
    inputSnapshot: input,
    quantities: {
      cement,
      supplementaryCementitiousMaterials: scm,
      totalBinder,
      effectiveWater: water,
      addedWater,
      fineAggregates: moisture.wetSandKg,
      coarseAggregates: moisture.wetGravelKg,
      admixtures: admixtureRows
    },
    ratios: {
      waterCementRatio: cement > 0 ? addedWater / cement : undefined,
      waterBinderRatio: water / totalBinder,
      sandAggregateRatio: finePct
    },
    physicalProperties: {
      theoreticalFreshDensity: freshDensity,
      absoluteVolume: theoreticalVolume,
      volumeClosureError: closureError
    },
    validation,
    internalWarnings: validation.warnings.map(w => ({
      code: w.code,
      severity: w.severity,
      field: w.field,
      message: w.message
    })),
    trace,
    calculatedAt: new Date().toISOString(),
    calculationStatus: "needs_trial_mix",
    engineStatus: "needs_trial_mix",
    confidenceLevel: "medium"
  } as MixDesignResult;
}

function blockedRccResult(
  input: MixDesignInput,
  validation: ValidationResult,
  _language: "ar" | "fr" | "en"
): MixDesignResult {
  return {
    methodName: "RCC / BCR Specialized",
    methodId: "rcc-specialized",
    methodVersion: "1.0.0",
    status: "not-supported",
    category: "complete-design",
    implementationStatus: "needs-engineering-review",
    isStandaloneCompleteMethod: true,
    cementKg: 0,
    waterKg: 0,
    fineAggregateKg: 0,
    coarseAggregateKg: 0,
    admixtureKg: 0,
    airContentPercent: 0,
    wcRatio: 0,
    freshDensityKgM3: 0,
    absoluteVolumeCheck: {
      isValid: false,
      totalAbsVolumeL: 0,
      cementVolL: 0,
      waterVolL: 0,
      sandVolL: 0,
      gravelVolL: 0,
      airVolL: 0,
      admixtureVolL: 0,
      deviationPercent: 100
    },
    warnings: validation.warnings.map(w => w.message),
    errors: validation.errors.map(e => e.message),
    assumptions: [],
    compliance: {
      standardName: "RCC specialized validation",
      isCompliant: false,
      checks: validation.errors.map(e => ({
        parameter: e.field,
        requirement: "Valid RCC input",
        actual: "Missing or invalid",
        status: "non_compliant" as const
      }))
    },
    recommendations: [
      "Provide the RCC-specific laboratory inputs and material properties before calculating."
    ],
    methodApplicability: {
      applicable: false,
      level: "not_applicable",
      reasons: validation.errors.map(e => e.message),
      recommendations: ["Complete all required RCC inputs."]
    },
    isValid: false,
    valid: false,
    calculationStatus: "blocked",
    engineStatus: "blocked",
    confidenceLevel: "preliminary",
    method: {
      id: "rcc-specialized",
      name: "Roller-Compacted Concrete",
      version: "1.0.0"
    },
    inputSnapshot: input,
    quantities: {
      totalBinder: 0,
      effectiveWater: 0,
      addedWater: 0,
      fineAggregates: 0,
      coarseAggregates: 0,
      admixtures: []
    },
    ratios: { waterBinderRatio: 0 },
    physicalProperties: {
      theoreticalFreshDensity: 0,
      absoluteVolume: 0,
      volumeClosureError: 100
    },
    validation,
    internalWarnings: [],
    trace: [],
    calculatedAt: new Date().toISOString()
  } as MixDesignResult;
}
