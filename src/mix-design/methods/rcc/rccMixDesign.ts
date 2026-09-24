import {
  MixDesignInput,
  MixDesignResult,
  ValidationResult,
  ApplicabilityResult
} from "../../core/types";
import {
  computeMoistureBatch,
  makeSpecializedResult,
  materialDensityKgM3,
  materialProperty,
  resolveSpecializedMaterials
} from "../shared/specializedMixDesignUtils";

const VERSION = "1.0.0";

function isRcc(input: MixDesignInput): boolean {
  return String(input.concreteType || "").trim().toUpperCase() === "RCC";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function checkRccApplicability(input: MixDesignInput): ApplicabilityResult {
  if (!isRcc(input)) {
    return {
      level: "not_applicable",
      reasons: ["The RCC engine requires concreteType = RCC."],
      recommendations: ["Select RCC before running the roller-compacted concrete engine."]
    };
  }

  return {
    level: "applicable",
    reasons: [],
    recommendations: [
      "RCC water demand must be anchored to a laboratory moisture-density curve, not conventional slump.",
      "Verify optimum moisture content, maximum dry density and strength on representative trial batches."
    ]
  };
}

export function validateRccInputs(
  input: MixDesignInput,
  language: "ar" | "fr" | "en" = "ar"
): ValidationResult {
  const errors: any[] = [];
  const warnings: any[] = [];
  const materials = resolveSpecializedMaterials(input, language, false, false, true);

  errors.push(...materials.errors.map((message) => ({
    code: "material_resolution",
    severity: "error",
    field: "materialsDatabase",
    message
  })));

  const omc = Number((input as any).rccOptimumMoisturePercent ?? NaN);
  const mdd = Number((input as any).rccMaxDryDensityKgM3 ?? NaN);
  const cement = Number((input as any).rccCementContentKgM3 ?? NaN);
  const sandFraction = Number((input as any).rccSandFractionPercent ?? 52);
  const fines = Number((input as any).rccFinesPassing75umPercent ?? NaN);
  const compaction = Number((input as any).rccCompactionTargetPercent ?? 98);
  const dMax = Number(input.dMax);

  if (!Number.isFinite(omc) || omc < 3 || omc > 8) {
    errors.push({
      code: "omc",
      severity: "error",
      field: "rccOptimumMoisturePercent",
      message: "RCC optimum moisture content must come from a validated moisture-density test and fall within the current 3-8% engine envelope."
    });
  }

  if (!Number.isFinite(mdd) || mdd < 2000 || mdd > 2600) {
    errors.push({
      code: "mdd",
      severity: "error",
      field: "rccMaxDryDensityKgM3",
      message: "RCC maximum dry density must come from the validated moisture-density relationship and fall within the current 2000-2600 kg/m3 engine envelope."
    });
  }

  if (!Number.isFinite(cement) || cement < 200 || cement > 400) {
    errors.push({
      code: "cement_content",
      severity: "error",
      field: "rccCementContentKgM3",
      message: "RCC binder/cementitious content must be within 200-400 kg/m3 in the current starting-proportion envelope."
    });
  }

  if (!Number.isFinite(sandFraction) || sandFraction < 45 || sandFraction > 60) {
    errors.push({
      code: "sand_fraction",
      severity: "error",
      field: "rccSandFractionPercent",
      message: "RCC sand fraction must be between 45% and 60% of total aggregate mass in the current engine."
    });
  } else if (sandFraction < 50 || sandFraction > 55) {
    warnings.push({
      code: "sand_fraction",
      severity: "warning",
      field: "rccSandFractionPercent",
      message: "The selected RCC sand fraction is outside the common 50-55% starting range and should be verified against the project aggregate gradation."
    });
  }

  if (Number.isFinite(fines) && (fines < 0 || fines > 8)) {
    errors.push({
      code: "fines",
      severity: "error",
      field: "rccFinesPassing75umPercent",
      message: "Minus-75-micron fines are limited to 0-8% in the current RCC proportioning envelope."
    });
  }

  if (!Number.isFinite(compaction) || compaction < 90 || compaction > 100) {
    errors.push({
      code: "compaction_target",
      severity: "error",
      field: "rccCompactionTargetPercent",
      message: "RCC compaction target must be between 90% and 100% of maximum dry density."
    });
  }

  if (!Number.isFinite(dMax) || dMax <= 0 || dMax > 40) {
    errors.push({
      code: "dmax",
      severity: "error",
      field: "dMax",
      message: "RCC Dmax must be within 0-40 mm in the current engine."
    });
  }

  if (Number(input.slump || 0) > 2) {
    warnings.push({
      code: "slump_ignored",
      severity: "warning",
      field: "slump",
      message: "RCC is zero-slump/very stiff; conventional slump is not the controlling design parameter."
    });
  }

  return { isValid: errors.length === 0, errors, warnings };
}

export function calculateRccMix(
  input: MixDesignInput,
  language: "ar" | "fr" | "en" = "ar"
): MixDesignResult {
  const validation = validateRccInputs(input, language);
  const materials = resolveSpecializedMaterials(input, language, false, false, true);

  if (!validation.isValid || materials.errors.length > 0) {
    return makeSpecializedResult(input, {
      methodId: "rcc-specialized",
      methodName: "Roller-Compacted Concrete (RCC)",
      version: VERSION,
      cementKg: 0,
      waterKg: 0,
      fineAggregateKg: 0,
      coarseAggregateKg: 0,
      admixtureKg: 0,
      waterBinderRatio: 0,
      freshDensityKgM3: 0,
      absoluteVolumeL: 0,
      warnings: validation.warnings.map((w) => w.message),
      assumptions: [],
      recommendations: [
        ...validation.errors.map((e) => e.message),
        ...materials.errors,
        "Run the RCC moisture-density laboratory test and synchronize OMC/MDD before producing a calculation."
      ],
      trace: [],
      complianceChecks: [
        ...validation.errors.map((e) => ({
          parameter: e.code,
          requirement: "Valid RCC laboratory-driven input",
          actual: e.message,
          status: "non_compliant" as const
        })),
        ...materials.errors.map((message) => ({
          parameter: "materials",
          requirement: "Approved aggregate and water materials",
          actual: message,
          status: "non_compliant" as const
        }))
      ],
      lifecycle: "blocked"
    });
  }

  const cementDensity = materialDensityKgM3(materials.materials.cement, Number(input.cementDensity || 3150));
  const scmPercent =
    Number(input.dosageFlyAsh || 0) +
    Number(input.dosageSlag || 0) +
    Number(input.dosageSilicaFume || 0);

  const scmKg = Math.max(0, Number((input as any).rccScmContentKgM3 || 0));
  const cementKg = Number((input as any).rccCementContentKgM3);
  const binder = cementKg + scmKg;

  const mdd = Number((input as any).rccMaxDryDensityKgM3);
  const omc = Number((input as any).rccOptimumMoisturePercent);
  const compactionTarget = Number((input as any).rccCompactionTargetPercent || 98);
  const sandFraction = clamp(Number((input as any).rccSandFractionPercent || 52), 45, 60);

  const aggregateDryMass = mdd - binder;
  const sandDryKg = Math.max(0, aggregateDryMass * sandFraction / 100);
  const gravelDryKg = Math.max(0, aggregateDryMass - sandDryKg);

  const waterTotal = aggregateDryMass + binder > 0
    ? (aggregateDryMass + binder) * omc / 100
    : 0;

  const waterBinderRatio = binder > 0 ? waterTotal / binder : Infinity;

  const sandCorrection = computeMoistureBatch(
    sandDryKg,
    Number(input.moistureSand || 0),
    Number(input.sandAbsorption || materialProperty(materials.materials.sand, ["absorption", "Absorption"], 0) || 0)
  );

  const gravelCorrection = computeMoistureBatch(
    gravelDryKg,
    Number(input.moistureGravel || 0),
    Number(input.gravelAbsorption || materialProperty(materials.materials.gravel, ["absorption", "Absorption"], 0) || 0)
  );

  const waterToAdd = Math.max(
    0,
    waterTotal -
      sandCorrection.freeSurfaceWater -
      gravelCorrection.freeSurfaceWater +
      sandCorrection.absorptionDeficit +
      gravelCorrection.absorptionDeficit
  );

  const effectiveCompactedDryMass = binder + sandDryKg + gravelDryKg;
  const compactedWetMass = effectiveCompactedDryMass + waterTotal;

  const sandDensity = materialDensityKgM3(materials.materials.sand, Number(input.sandRelativeDensity || 2.65) * 1000);
  const gravelDensity = materialDensityKgM3(materials.materials.gravel, Number(input.gravelRelativeDensity || 2.65) * 1000);
  const solidVolumeL =
    cementKg / cementDensity * 1000 +
    (scmKg / Number(input.selectedScmDensity || 2200) * 1000) +
    sandDryKg / sandDensity * 1000 +
    gravelDryKg / gravelDensity * 1000 +
    waterTotal;

  const compactedAirVoidPercent = 100 * (1 - solidVolumeL / 1000);

  const waterBinderOutside =
    !Number.isFinite(waterBinderRatio) ||
    waterBinderRatio < 0.30 ||
    waterBinderRatio > 0.50;

  const lifecycle =
    waterBinderOutside ||
    aggregateDryMass <= 0 ||
    compactedAirVoidPercent < 0 ||
    compactedAirVoidPercent > 25
      ? "blocked" as const
      : "needs_trial_mix" as const;

  const complianceChecks: any[] = [
    {
      parameter: "omc",
      requirement: "validated RCC moisture-density curve",
      actual: omc.toFixed(2) + "%",
      status: "compliant"
    },
    {
      parameter: "mdd",
      requirement: "validated maximum dry density",
      actual: mdd.toFixed(1) + " kg/m3",
      status: "compliant"
    },
    {
      parameter: "water_binder",
      requirement: "0.30-0.50 starting envelope",
      actual: waterBinderRatio.toFixed(3),
      status: waterBinderOutside ? "non_compliant" : "compliant"
    },
    {
      parameter: "sand_fraction",
      requirement: "45-60% of aggregate mass",
      actual: sandFraction.toFixed(1) + "%",
      status: sandFraction >= 45 && sandFraction <= 60 ? "compliant" : "non_compliant"
    },
    {
      parameter: "compaction",
      requirement: "project-specific field compaction target",
      actual: compactionTarget.toFixed(1) + "% of MDD",
      status: "warning"
    },
    {
      parameter: "air_voids",
      requirement: "0-25% compacted air-void diagnostic envelope",
      actual: compactedAirVoidPercent.toFixed(2) + "%",
      status: compactedAirVoidPercent >= 0 && compactedAirVoidPercent <= 25 ? "compliant" : "non_compliant"
    },
    {
      parameter: "trial_mix",
      requirement: "moisture-density curve and strength verification",
      actual: "Required",
      status: "warning"
    }
  ];

  const warnings = [
    "RCC water content is controlled from the laboratory moisture-density relationship, not conventional slump.",
    "The mix requires compaction verification and strength testing at maximum density/optimum moisture.",
    "The numerical result is a starting proportioning result and requires project-specific RCC trial batching."
  ];

  const assumptions = [
    "Validated OMC = " + omc.toFixed(2) + "%.",
    "Validated MDD = " + mdd.toFixed(1) + " kg/m3.",
    "Binder = " + binder.toFixed(1) + " kg/m3.",
    "Dry aggregate mass = " + aggregateDryMass.toFixed(1) + " kg/m3.",
    "Sand fraction = " + sandFraction.toFixed(1) + "% of dry aggregate mass.",
    "Total water = " + waterTotal.toFixed(1) + " kg/m3.",
    "W/B = " + waterBinderRatio.toFixed(3) + "."
  ];

  const recommendations = [
    "Use the actual RCC moisture-density curve generated from the laboratory mixture and compaction method.",
    "Verify field density against the project compaction target and control moisture during paving/placement.",
    "Cast and test trial-batch specimens at the selected OMC/MDD condition for the project strength requirement.",
    "Verify aggregate gradation and segregation resistance before production."
  ];

  const result: any = makeSpecializedResult(input, {
    methodId: "rcc-specialized",
    methodName: "Roller-Compacted Concrete (RCC)",
    version: VERSION,
    cementKg,
    waterKg: waterTotal,
    fineAggregateKg: sandDryKg,
    coarseAggregateKg: gravelDryKg,
    admixtureKg: 0,
    scmKg,
    waterBinderRatio,
    freshDensityKgM3: compactedWetMass,
    absoluteVolumeL: solidVolumeL,
    warnings,
    assumptions,
    recommendations,
    trace: [
      {
        stepId: "rcc-1",
        label: "Read optimum moisture content from the validated RCC moisture-density curve.",
        formula: "w_opt = laboratory moisture-density peak",
        inputs: { omc, mdd },
        output: omc,
        unit: "%"
      },
      {
        stepId: "rcc-2",
        label: "Set dry binder/aggregate mass from maximum dry density.",
        formula: "M_dry = MDD = binder + dry aggregates",
        inputs: { mdd, binder },
        output: effectiveCompactedDryMass,
        unit: "kg/m3"
      },
      {
        stepId: "rcc-3",
        label: "Split dry aggregate mass into sand and coarse aggregate.",
        formula: "M_sand = M_agg·sand_fraction",
        inputs: { aggregateDryMass, sandFraction },
        output: { sandDryKg, gravelDryKg },
        unit: "kg/m3"
      },
      {
        stepId: "rcc-4",
        label: "Determine total water from the optimum moisture content.",
        formula: "W = (binder + dry aggregates)·OMC",
        inputs: { effectiveCompactedDryMass, omc },
        output: waterTotal,
        unit: "kg/m3"
      },
      {
        stepId: "rcc-5",
        label: "Correct batch water for aggregate surface moisture and absorption.",
        formula: "Wadd = W - Wfree + Wdeficit",
        inputs: {
          sandFreeWater: sandCorrection.freeSurfaceWater,
          gravelFreeWater: gravelCorrection.freeSurfaceWater,
          sandAbsorptionDeficit: sandCorrection.absorptionDeficit,
          gravelAbsorptionDeficit: gravelCorrection.absorptionDeficit
        },
        output: waterToAdd,
        unit: "kg/m3"
      },
      {
        stepId: "rcc-6",
        label: "Diagnose compacted air-void content from absolute volumes.",
        formula: "Vair = 1000 - Vsolid+water",
        inputs: { solidVolumeL },
        output: compactedAirVoidPercent,
        unit: "%"
      }
    ],
    complianceChecks,
    lifecycle
  });

  result.waterToAdd = waterToAdd;
  result.batchWaterToAdd = waterToAdd;
  result.rccOptimumMoisturePercent = omc;
  result.rccMaxDryDensityKgM3 = mdd;
  result.rccCementContentKgM3 = cementKg;
  result.rccSandFractionPercent = sandFraction;
  result.rccWaterKgM3 = waterTotal;
  result.rccWaterBinderRatio = waterBinderRatio;
  result.rccCompactionTargetPercent = compactionTarget;
  result.rccDryAggregateKgM3 = aggregateDryMass;
  result.rccCompactedWetMassKgM3 = compactedWetMass;
  result.rccCompactedAirVoidPercent = compactedAirVoidPercent;

  result.engineeringAudit = {
    specializedMethod: "RCC",
    framework: "FHWA-oriented RCC moisture-density and compaction workflow",
    optimumMoisturePercent: omc,
    maximumDryDensityKgM3: mdd,
    cementitiousContentKgM3: binder,
    waterKgM3: waterTotal,
    waterBinderRatio,
    sandFractionPercent: sandFraction,
    compactionTargetPercent: compactionTarget,
    compactedAirVoidPercent
  };

  result.materialSuitability = {
    status: "approved",
    missingMaterials: [],
    invalidMaterials: [],
    incompatibleMaterials: [],
    warnings: [],
    recommendations
  };

  return result as MixDesignResult;
}