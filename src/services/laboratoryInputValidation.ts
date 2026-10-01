import type { LabTestDefinition } from "../types/laboratoryTypes";

export interface LaboratoryInputIssue {
  path: string;
  code: "required" | "not_numeric" | "not_finite" | "below_minimum" | "above_maximum" | "duplicate" | "order" | "relationship" | "row_count";
  message: string;
}

const OPTIONAL_INPUTS: Record<string, string[]> = {
  AGG_MOISTURE_CONTENT: ["absorptionPercent", "designAggregateDryMassKg", "designWaterKg"],
  AGG_LOS_ANGELES: ["finesMassG", "massBalanceToleranceG"],
  AGG_MICRO_DEVAL: ["abrasiveChargeG"],
  AGG_SHAPE_FLAKINESS: ["massBalanceToleranceG"],
  CEM_FINENESS_BLAINE: ["airTemperatureC"],
  CEM_SETTING_TIME: ["initialSetThresholdMm", "finalSetThresholdMm"],
  CEM_COMPRESSIVE_STRENGTH: ["prismWidthMm", "prismDepthMm"],
  WATER_PH: ["waterTemperatureC"]
};
const REQUIRED_EXTRA_INPUTS: Record<string, string[]> = {
  AGG_MICRO_DEVAL: ["waterVolumeMl"]
};

const isBlank = (value: unknown) => value === undefined || value === null || (typeof value === "string" && value.trim() === "");
const finiteNumber = (value: unknown): number | undefined => {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value !== "string" || !value.trim()) return undefined;
  const normalized = value.trim().replace(/,/g, ".");
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(normalized)) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
};

/** Remove example measurements from a catalog template while retaining its structural rows and categorical choices. */
export function createBlankLaboratoryInputs(definition: LabTestDefinition): Record<string, any> {
  const blank = (value: any, path: string): any => {
    if (Array.isArray(value)) {
      return value.map((row, index) => blank(row, `${path}.${index}`));
    }
    if (value && typeof value === "object") {
      return Object.fromEntries(Object.entries(value).map(([key, nested]) => {
        // Sieve apertures are the fixed test template, not a measured value.
        if (path.startsWith("sieves.") && key === "sieve") return [key, nested];
        return [key, blank(nested, path ? `${path}.${key}` : key)];
      }));
    }
    if (typeof value === "number") return undefined;
    return value;
  };
  return blank(definition.defaultInputs, "");
}

function numericLeaves(template: any, value: any, path: string, issues: LaboratoryInputIssue[], optional: Set<string>) {
  if (Array.isArray(template)) {
    const actual = Array.isArray(value) ? value : [];
    if (template.length > 0 && actual.length < template.length) {
      issues.push({ path: path || "measurements", code: "row_count", message: "Add all required measurement rows before running this test." });
    }
    template.forEach((entry, index) => numericLeaves(entry, actual[index], `${path}.${index}`, issues, optional));
    if (template.length > 0 && actual.length > template.length) {
      actual.slice(template.length).forEach((entry, offset) => numericLeaves(template[0], entry, `${path}.${template.length + offset}`, issues, optional));
    }
    return;
  }
  if (template && typeof template === "object") {
    for (const [key, nested] of Object.entries(template)) {
      // Sieve apertures come from the standard's sieve set; only retained mass is measured.
      if (path.startsWith("sieves.") && key === "sieve") continue;
      numericLeaves(nested, value?.[key], path ? `${path}.${key}` : key, issues, optional);
    }
    return;
  }
  if (typeof template === "number") {
    const field = path.replace(/\.\d+/g, "[]");
    if (optional.has(path) || optional.has(field)) return;
    if (isBlank(value)) {
      issues.push({ path, code: "required", message: "A measured value is required." });
      return;
    }
    const parsed = finiteNumber(value);
    if (parsed === undefined) {
      issues.push({ path, code: typeof value === "number" ? "not_finite" : "not_numeric", message: "Enter a finite numeric value." });
      return;
    }
    if (parsed < 0) {
      issues.push({ path, code: "below_minimum", message: "This value cannot be negative." });
      return;
    }
    const key = path.split(".").at(-1)?.toLowerCase() || "";
    if (/(percent|percentage|humidity|waterpercent|replacementrate|dosagepercent)/.test(key) && parsed > 100) {
      issues.push({ path, code: "above_maximum", message: "Percentage must be between 0 and 100%." });
    }
    if (/ph$/.test(key) && parsed > 14) {
      issues.push({ path, code: "above_maximum", message: "pH must be between 0 and 14." });
    }
    if (/(mass|weight|volume|density|length|diameter|strength|dosage|seconds|time|charge|concentration)/.test(key) && parsed === 0 && !/(timeMinutes|retained|penetration|fines|suspended|chlorides|sulfates|impurities|solids|dissolved)/.test(key)) {
      issues.push({ path, code: "below_minimum", message: "This measured quantity must be greater than zero." });
    }
    return;
  }
  if (typeof template === "string" && isBlank(value) && !optional.has(path)) {
    issues.push({ path, code: "required", message: "Choose or enter a value for this field." });
  }
}

function numberAt(inputs: Record<string, any>, key: string): number | undefined {
  return finiteNumber(inputs?.[key]);
}

/** Test-specific data, range, time-series and physical relationship checks. */
export function validateLaboratoryInputs(testId: string, definition: LabTestDefinition, inputs: Record<string, any>): LaboratoryInputIssue[] {
  const issues: LaboratoryInputIssue[] = [];
  const optional = new Set(OPTIONAL_INPUTS[testId] || []);
  numericLeaves(definition.defaultInputs, inputs, "", issues, optional);
  const add = (path: string, code: LaboratoryInputIssue["code"], message: string) => issues.push({ path, code, message });
  for (const path of REQUIRED_EXTRA_INPUTS[testId] || []) {
    const value = finiteNumber(inputs?.[path]);
    if (value === undefined) add(path, "required", "A measured value is required.");
    else if (value <= 0) add(path, "below_minimum", "This measured quantity must be greater than zero.");
  }

  const checkUniqueOrder = (rows: any[], valueKey: string, path: string, descending = false) => {
    const values = rows.map(row => finiteNumber(row?.[valueKey]));
    const seen = new Set<number>();
    let previous: number | undefined;
    values.forEach((value, index) => {
      if (value === undefined) return;
      if (seen.has(value!)) add(`${path}.${index}.${valueKey}`, "duplicate", "Duplicate measurement rows are not allowed.");
      seen.add(value!);
      if (previous !== undefined && (descending ? value! >= previous : value! <= previous)) {
        add(`${path}.${index}.${valueKey}`, "order", descending ? "Readings must be entered in strictly descending order." : "Readings must be entered in strictly increasing order.");
      }
      previous = value;
    });
  };

  if (testId === "AGG_SIEVE") {
    const rows = Array.isArray(inputs.sieves) ? inputs.sieves : [];
    rows.forEach((row, index) => {
      if (finiteNumber(row?.sieve) === undefined) add(`sieves.${index}.sieve`, "required", "A sieve aperture is required for every row.");
      if (finiteNumber(row?.retained) === undefined) add(`sieves.${index}.retained`, "required", "A retained mass is required for every sieve row.");
    });
    checkUniqueOrder(rows, "sieve", "sieves", true);
    const total = numberAt(inputs, "totalWeight");
    const retained = rows.reduce((sum, row) => sum + (finiteNumber(row?.retained) ?? 0), 0);
    if (total !== undefined && retained > total) add("sieves", "relationship", "The total retained mass cannot exceed the dry sample mass.");
  }
  if (testId === "AGG_BULK_DENSITY") {
    const empty = numberAt(inputs, "containerEmptyWeightKg");
    const loose = numberAt(inputs, "looseFilledWeightKg");
    const compacted = numberAt(inputs, "compactedWeightKg");
    if (empty !== undefined && loose !== undefined && loose <= empty) add("looseFilledWeightKg", "relationship", "Filled container mass must exceed the empty container mass.");
    if (empty !== undefined && compacted !== undefined && compacted <= empty) add("compactedWeightKg", "relationship", "Compacted container mass must exceed the empty container mass.");
    if (loose !== undefined && compacted !== undefined && compacted < loose) add("compactedWeightKg", "relationship", "Compacted mass must be greater than or equal to loose mass.");
  }
  if (testId === "AGG_SPECIFIC_GRAVITY") {
    const od = numberAt(inputs, "ovenDryMassG");
    const ssd = numberAt(inputs, "ssdMassG");
    const m2 = numberAt(inputs, "pycnometerSampleWaterMassG");
    const m3 = numberAt(inputs, "pycnometerWaterMassG");
    if (od !== undefined && ssd !== undefined && ssd < od) add("ssdMassG", "relationship", "SSD mass must be greater than or equal to oven-dry mass.");
    if (m2 !== undefined && m3 !== undefined && m2 <= m3) add("pycnometerSampleWaterMassG", "relationship", "Pycnometer with sample and water must weigh more than the pycnometer with water alone.");
  }
  if (testId === "AGG_MOISTURE_CONTENT") {
    const wet = numberAt(inputs, "wetMassG");
    const dry = numberAt(inputs, "dryMassG");
    const tare = numberAt(inputs, "tareMassG");
    if (wet !== undefined && dry !== undefined && wet < dry) add("wetMassG", "relationship", "Wet mass must be greater than or equal to dry mass.");
    if (dry !== undefined && tare !== undefined && dry <= tare) add("dryMassG", "relationship", "Dry mass must exceed the container tare mass.");
  }
  if (testId === "AGG_SAND_EQUIVALENT") {
    const total = numberAt(inputs, "h1TotalHeightMm");
    const sand = numberAt(inputs, "h2SandHeightMm");
    if (total !== undefined && sand !== undefined && sand > total) add("h2SandHeightMm", "relationship", "Sand layer height cannot exceed total suspension height.");
  }
  if (testId === "AGG_BULKING_SAND") {
    const rows = Array.isArray(inputs.moistureSteps) ? inputs.moistureSteps : [];
    if (rows.length < 2) add("moistureSteps", "row_count", "Enter at least two moisture-volume readings.");
    checkUniqueOrder(rows, "moisturePercent", "moistureSteps");
  }
  if (testId === "AGG_LOS_ANGELES" || testId === "AGG_MICRO_DEVAL") {
    const initial = numberAt(inputs, "initialMassG");
    const retained = numberAt(inputs, "retainedMassOn1_6mmG");
    if (initial !== undefined && retained !== undefined && retained > initial) add("retainedMassOn1_6mmG", "relationship", "Retained mass cannot exceed initial sample mass.");
  }
  if (testId === "CEM_SPECIFIC_GRAVITY") {
    const initial = numberAt(inputs, "initialVolumeMl");
    const final = numberAt(inputs, "finalVolumeMl");
    if (initial !== undefined && final !== undefined && final <= initial) add("finalVolumeMl", "relationship", "Final volume must exceed initial volume.");
  }
  if (testId === "CEM_SETTING_TIME") {
    const rows = Array.isArray(inputs.timeReadings) ? inputs.timeReadings : [];
    if (rows.length < 2) add("timeReadings", "row_count", "Enter at least two time-ordered readings.");
    checkUniqueOrder(rows, "timeMinutes", "timeReadings");
    rows.forEach((row, index) => {
      const value = finiteNumber(row?.penetrationMm);
      if (value !== undefined && value > 40) add(`timeReadings.${index}.penetrationMm`, "above_maximum", "Vicat penetration cannot exceed the needle travel range (40 mm).");
    });
    const humidity = numberAt(inputs, "humidityPercent");
    if (humidity !== undefined && humidity > 100) add("humidityPercent", "above_maximum", "Relative humidity must be between 0 and 100%.");
    const temp = numberAt(inputs, "roomTempC");
    if (temp !== undefined && (temp < -20 || temp > 80)) add("roomTempC", "above_maximum", "Temperature must be within the supported laboratory range (-20 to 80 °C).");
  }
  if (testId === "CEM_SOUNDNESS") {
    const before = numberAt(inputs, "pointerDistanceBeforeBoilingA");
    const after = numberAt(inputs, "pointerDistanceAfterBoilingB");
    if (before !== undefined && after !== undefined && after < before) add("pointerDistanceAfterBoilingB", "relationship", "The final indicator distance cannot be less than the initial distance.");
  }
  if (testId === "CEM_FINENESS_BLAINE") {
    const porosity = numberAt(inputs, "bedPorosityE");
    if (porosity !== undefined && (porosity <= 0 || porosity >= 1)) add("bedPorosityE", "above_maximum", "Bed porosity must be greater than 0 and less than 1.");
  }
  if (testId === "CEM_COMPRESSIVE_STRENGTH") {
    for (const key of ["strength2dPrismsKn", "strength7dPrismsKn", "strength28dPrismsKn"]) {
      const values = Array.isArray(inputs[key]) ? inputs[key] : [];
      if (values.length < 3) add(key, "row_count", "Enter at least three valid prism readings for each reported age.");
      values.forEach((value, index) => {
        if (isBlank(value)) add(`${key}.${index}`, "required", "A measured strength is required; blank readings are not zero.");
      });
    }
  }
  if (testId === "ADM_SOLID_CONTENT") {
    const empty = numberAt(inputs, "emptyDishMassG");
    const wet = numberAt(inputs, "dishPlusWetAdmixtureMassG");
    const dry = numberAt(inputs, "dishPlusDryResidueMassG");
    if (empty !== undefined && wet !== undefined && wet <= empty) add("dishPlusWetAdmixtureMassG", "relationship", "Dish plus wet admixture mass must exceed empty dish mass.");
    if (wet !== undefined && dry !== undefined && dry > wet) add("dishPlusDryResidueMassG", "relationship", "Dry residue mass cannot exceed wet sample mass.");
  }
  if (testId === "SCM_LOSS_ON_IGNITION") {
    const dry = numberAt(inputs, "drySampleMassG");
    const calcined = numberAt(inputs, "calcinedSampleMassG");
    if (dry !== undefined && calcined !== undefined && calcined > dry) add("calcinedSampleMassG", "relationship", "Calcined mass cannot exceed the dry sample mass.");
  }
  return issues;
}

const LABELS: Record<string, { ar: string; fr: string; en: string }> = {
  abrasiveChargeBalls: { ar: "عدد كرات الشحن الكاشط", fr: "Nombre de billes abrasives", en: "Abrasive charge balls" },
  admixedMixWaterL: { ar: "ماء الخلط مع الإضافة", fr: "Eau de gâchage avec adjuvant", en: "Admixed mix water" },
  admixtureMassG: { ar: "كتلة الإضافة", fr: "Masse d'adjuvant", en: "Admixture mass" },
  admixtureVolumeMl: { ar: "حجم الإضافة", fr: "Volume d'adjuvant", en: "Admixture volume" },
  airFlowTimeSeconds: { ar: "زمن مرور الهواء", fr: "Temps d'écoulement de l'air", en: "Air-flow time" },
  airViscosityMicroPaS: { ar: "لزوجة الهواء", fr: "Viscosité de l'air", en: "Air viscosity" },
  apparatusConstantK: { ar: "ثابت الجهاز", fr: "Constante de l'appareil", en: "Apparatus constant" },
  bedPorosityE: { ar: "مسامية سرير الإسمنت", fr: "Porosité du lit de ciment", en: "Cement-bed porosity" },
  calcinedSampleMassG: { ar: "كتلة العينة بعد الحرق", fr: "Masse calcinée", en: "Calcined sample mass" },
  cementDensityGPerCm3: { ar: "كثافة الإسمنت", fr: "Masse volumique du ciment", en: "Cement density" },
  cementMassG: { ar: "كتلة الإسمنت", fr: "Masse de ciment", en: "Cement mass" },
  chloridesMgPerL: { ar: "تركيز الكلوريدات", fr: "Teneur en chlorures", en: "Chloride concentration" },
  compactedWeightKg: { ar: "كتلة الوعاء بعد الدمك", fr: "Masse après compactage", en: "Compacted container mass" },
  concreteApplication: { ar: "تطبيق الخرسانة", fr: "Application du béton", en: "Concrete application" },
  containerEmptyWeightKg: { ar: "كتلة الوعاء الفارغ", fr: "Masse du récipient vide", en: "Empty container mass" },
  containerVolumeLiters: { ar: "حجم الوعاء", fr: "Volume du récipient", en: "Container volume" },
  controlMixWaterL: { ar: "ماء خلطة الضبط", fr: "Eau du mélange témoin", en: "Control mix water" },
  controlPrism28dStrengthMpa: { ar: "مقاومة موشور الضبط عند 28 يومًا", fr: "Résistance témoin à 28 j", en: "Control prism 28-day strength" },
  diameterMm: { ar: "القطر", fr: "Diamètre", en: "Diameter" },
  dishPlusDryResidueMassG: { ar: "كتلة الطبق مع البقايا الجافة", fr: "Masse du récipient avec résidu sec", en: "Dish plus dry residue mass" },
  dishPlusWetAdmixtureMassG: { ar: "كتلة الطبق مع الإضافة الرطبة", fr: "Masse du récipient avec adjuvant humide", en: "Dish plus wet admixture mass" },
  displacedVolumeMl: { ar: "الحجم المزاح", fr: "Volume déplacé", en: "Displaced volume" },
  dyeConcentrationGPerL: { ar: "تركيز محلول الصبغة", fr: "Concentration de la solution colorante", en: "Dye solution concentration" },
  dyeSolutionInjectedMl: { ar: "حجم محلول الصبغة المحقون", fr: "Volume de solution injecté", en: "Injected dye solution volume" },
  dosagePercentOfCement: { ar: "جرعة الإضافة من كتلة الإسمنت", fr: "Dosage par masse de ciment", en: "Dosage by cement mass" },
  dryMassG: { ar: "الكتلة الجافة", fr: "Masse sèche", en: "Dry mass" },
  drySampleMassG: { ar: "كتلة العينة الجافة", fr: "Masse sèche de l'échantillon", en: "Dry sample mass" },
  dryVolumeCm3: { ar: "الحجم الجاف", fr: "Volume sec", en: "Dry volume" },
  emptyDishMassG: { ar: "كتلة الطبق الفارغ", fr: "Masse du récipient vide", en: "Empty dish mass" },
  fiberDensityGPerCm3: { ar: "كثافة الألياف", fr: "Masse volumique des fibres", en: "Fiber density" },
  fiberDiameterMm: { ar: "قطر الليف", fr: "Diamètre de la fibre", en: "Fiber diameter" },
  fiberDosageKgPerM3: { ar: "جرعة الألياف", fr: "Dosage de fibres", en: "Fiber dosage" },
  fiberLengthMm: { ar: "طول الليف", fr: "Longueur de la fibre", en: "Fiber length" },
  fiberType: { ar: "نوع الليف", fr: "Type de fibre", en: "Fiber type" },
  finalVolumeMl: { ar: "الحجم النهائي", fr: "Volume final", en: "Final volume" },
  fraction0_2MassG: { ar: "كتلة الجزء 0–2 مم", fr: "Masse de la fraction 0–2 mm", en: "0–2 mm fraction mass" },
  gradingFraction: { ar: "الفئة الحبيبية", fr: "Fraction granulaire", en: "Grading fraction" },
  h1TotalHeightMm: { ar: "الارتفاع الكلي للمعلق", fr: "Hauteur totale de suspension", en: "Total suspension height" },
  h2SandHeightMm: { ar: "ارتفاع طبقة الرمل", fr: "Hauteur de la couche de sable", en: "Sand layer height" },
  humidityPercent: { ar: "الرطوبة النسبية", fr: "Humidité relative", en: "Relative humidity" },
  initialMassG: { ar: "الكتلة الابتدائية", fr: "Masse initiale", en: "Initial mass" },
  initialVolumeMl: { ar: "الحجم الابتدائي", fr: "Volume initial", en: "Initial volume" },
  lengthMm: { ar: "الطول", fr: "Longueur", en: "Length" },
  looseFilledWeightKg: { ar: "كتلة الوعاء المملوء دون دمك", fr: "Masse en vrac", en: "Loose-filled container mass" },
  materialType: { ar: "نوع المادة", fr: "Type de matériau", en: "Material type" },
  measuredPh: { ar: "الأس الهيدروجيني المقاس", fr: "pH mesuré", en: "Measured pH" },
  moisturePercent: { ar: "نسبة الرطوبة", fr: "Teneur en humidité", en: "Moisture content" },
  moistureSteps: { ar: "قراءات الانتفاخ الحجمي", fr: "Lectures de gonflement volumique", en: "Bulking measurements" },
  "moistureSteps[].moisturePercent": { ar: "نسبة الرطوبة", fr: "Teneur en humidité", en: "Moisture content" },
  "moistureSteps[].volumeCm3": { ar: "الحجم المقاس", fr: "Volume mesuré", en: "Measured volume" },
  ovenDryMassG: { ar: "الكتلة الجافة بالفرن", fr: "Masse sèche à l'étuve", en: "Oven-dry mass" },
  passingBarSievesMassG: { ar: "كتلة المواد المارة من المناخل", fr: "Masse passant les tamis", en: "Mass passing the sieves" },
  penetrationMm: { ar: "اختراق الإبرة", fr: "Pénétration de l'aiguille", en: "Needle penetration" },
  plungerPenetrationMm: { ar: "اختراق المكبس", fr: "Pénétration du piston", en: "Plunger penetration" },
  pointerDistanceAfterBoilingB: { ar: "مسافة المؤشر بعد الغليان B", fr: "Distance après ébullition B", en: "Pointer distance after boiling B" },
  pointerDistanceBeforeBoilingA: { ar: "مسافة المؤشر قبل الغليان A", fr: "Distance avant ébullition A", en: "Pointer distance before boiling A" },
  pycnometerSampleWaterMassG: { ar: "كتلة البيكنومتر مع العينة والماء", fr: "Pycnomètre avec échantillon et eau", en: "Pycnometer with sample and water" },
  pycnometerWaterMassG: { ar: "كتلة البيكنومتر مع الماء فقط", fr: "Pycnomètre avec eau seule", en: "Pycnometer with water only" },
  replacementRatePercent: { ar: "نسبة الاستبدال", fr: "Taux de substitution", en: "Replacement rate" },
  retainedMassOn1_6mmG: { ar: "الكتلة المحتجزة على منخل 1.6 مم", fr: "Masse retenue au tamis 1,6 mm", en: "Mass retained on 1.6 mm sieve" },
  roomTempC: { ar: "درجة حرارة الغرفة", fr: "Température ambiante", en: "Room temperature" },
  sampleMassG: { ar: "كتلة العينة", fr: "Masse de l'échantillon", en: "Sample mass" },
  scmBlendedPrism28dStrengthMpa: { ar: "مقاومة موشور الإضافة عند 28 يومًا", fr: "Résistance du mélange avec ajout à 28 j", en: "SCM blended prism 28-day strength" },
  scmType: { ar: "نوع الإضافة المعدنية", fr: "Type d'ajout minéral", en: "Mineral addition type" },
  ssdMassG: { ar: "كتلة الحالة المشبعة سطحًا والجافة", fr: "Masse SSD", en: "Saturated surface-dry mass" },
  sulfatesMgPerL: { ar: "تركيز الكبريتات", fr: "Teneur en sulfates", en: "Sulfate concentration" },
  suspendedSolidsMgPerL: { ar: "المواد العالقة", fr: "Matières en suspension", en: "Suspended solids" },
  tareMassG: { ar: "كتلة الوعاء الفارغ", fr: "Tare du récipient", en: "Container tare" },
  targetCementClass: { ar: "فئة الإسمنت المستهدفة", fr: "Classe de ciment visée", en: "Target cement class" },
  targetSlumpMm: { ar: "الهبوط المستهدف", fr: "Affaissement cible", en: "Target slump" },
  temperatureC: { ar: "درجة حرارة الاختبار", fr: "Température d'essai", en: "Test temperature" },
  tensileStrengthMpa: { ar: "مقاومة الشد", fr: "Résistance à la traction", en: "Tensile strength" },
  testMethod: { ar: "طريقة الاختبار", fr: "Méthode d'essai", en: "Test method" },
  totalDissolvedSolidsMgPerL: { ar: "المواد الصلبة الذائبة الكلية", fr: "Solides dissous totaux", en: "Total dissolved solids" },
  totalSampleMassG: { ar: "كتلة العينة الكلية", fr: "Masse totale de l'échantillon", en: "Total sample mass" },
  totalWeight: { ar: "وزن العينة الكلي", fr: "Masse totale de l'échantillon", en: "Total sample mass" },
  volumeCm3: { ar: "الحجم", fr: "Volume", en: "Volume" },
  waterPercent: { ar: "نسبة ماء العجينة", fr: "Teneur en eau de la pâte", en: "Paste water content" },
  waterTemperatureC: { ar: "درجة حرارة الماء", fr: "Température de l'eau", en: "Water temperature" },
  waterVolumeMl: { ar: "حجم الماء", fr: "Volume d'eau", en: "Water volume" },
  wetMassG: { ar: "الكتلة الرطبة", fr: "Masse humide", en: "Wet mass" },
  "sieves[].retained": { ar: "الكتلة المحتجزة", fr: "Masse retenue", en: "Retained mass" },
  "sieves[].sieve": { ar: "فتحة المنخل", fr: "Ouverture du tamis", en: "Sieve aperture" },
  "timeReadings[].timeMinutes": { ar: "زمن القراءة", fr: "Temps de lecture", en: "Reading time" },
  "timeReadings[].penetrationMm": { ar: "اختراق الإبرة", fr: "Pénétration de l'aiguille", en: "Needle penetration" },
  timeMinutes: { ar: "زمن القراءة", fr: "Temps de lecture", en: "Reading time" },
  strength2dPrismsKn: { ar: "مقاومة الموشورات عند يومين", fr: "Résistance des prismes à 2 jours", en: "2-day prism strength" },
  strength7dPrismsKn: { ar: "مقاومة الموشورات عند 7 أيام", fr: "Résistance des prismes à 7 jours", en: "7-day prism strength" },
  strength28dPrismsKn: { ar: "مقاومة الموشورات عند 28 يومًا", fr: "Résistance des prismes à 28 jours", en: "28-day prism strength" }
};

export function getLaboratoryFieldLabel(key: string, language: "ar" | "fr" | "en"): string {
  return LABELS[key]?.[language] || key.replace(/([A-Z])/g, " $1").replace(/^./, first => first.toUpperCase());
}

export function getLaboratoryFieldUnit(key: string): string {
  if (/temperature|roomTemp/i.test(key)) return "°C";
  if (/timeMinutes$/.test(key)) return "min";
  if (key === "totalWeight") return "g";
  if (/MgPerL$/.test(key)) return "mg/L";
  if (/MicroPaS$/.test(key)) return "µPa·s";
  if (/GPerCm3$/.test(key)) return "g/cm³";
  if (/KgPerM3$/.test(key)) return "kg/m³";
  if (/PrismsKn$/.test(key)) return "kN";
  if (/Seconds$/.test(key)) return "s";
  if (/Liters$|MixWaterL$/.test(key)) return "L";
  if (/Ml$/.test(key)) return "mL";
  if (/Cm3$/.test(key)) return "cm³";
  if (/Mpa$/.test(key)) return "MPa";
  if (/Mm$/.test(key)) return "mm";
  if (/Kg$/.test(key)) return "kg";
  if (/MassG$|WeightG$|G$/.test(key)) return "g";
  if (/Percent|RatePercent|MoisturePercent|WaterPercent|DosagePercent|ReplacementRatePercent/.test(key)) return "%";
  if (/Balls$/.test(key)) return "balls";
  return "";
}
const ISSUE_MESSAGES: Record<string, { ar: string; fr: string }> = {
  "Add all required measurement rows before running this test.": { ar: "أكمل جميع صفوف القياس المطلوبة قبل تشغيل الاختبار.", fr: "Complétez toutes les lignes de mesure requises avant l'essai." },
  "Enter at least two moisture-volume readings.": { ar: "أدخل قراءتين على الأقل للرطوبة والحجم.", fr: "Saisissez au moins deux lectures d'humidité et de volume." },
  "Percentage must be between 0 and 100%.": { ar: "يجب أن تكون النسبة بين 0 و100٪.", fr: "Le pourcentage doit être compris entre 0 et 100 %." },
  "pH must be between 0 and 14.": { ar: "يجب أن تكون قيمة الأس الهيدروجيني بين 0 و14.", fr: "Le pH doit être compris entre 0 et 14." },
  "This value cannot be negative.": { ar: "لا يمكن أن تكون هذه القيمة سالبة.", fr: "Cette valeur ne peut pas être négative." },
  "This measured quantity must be greater than zero.": { ar: "يجب أن تكون هذه الكمية المقاسة أكبر من الصفر.", fr: "Cette grandeur mesurée doit être supérieure à zéro." },
  "The total retained mass cannot exceed the dry sample mass.": { ar: "لا يجوز أن يتجاوز مجموع الكتل المحتجزة كتلة العينة الجافة.", fr: "La masse totale retenue ne peut pas dépasser la masse sèche de l'échantillon." },
  "Filled container mass must exceed the empty container mass.": { ar: "يجب أن تتجاوز كتلة الوعاء المملوء كتلة الوعاء الفارغ.", fr: "La masse du récipient rempli doit dépasser celle du récipient vide." },
  "Compacted container mass must exceed the empty container mass.": { ar: "يجب أن تتجاوز كتلة الوعاء المدموك كتلة الوعاء الفارغ.", fr: "La masse du récipient compacté doit dépasser celle du récipient vide." },
  "Compacted mass must be greater than or equal to loose mass.": { ar: "يجب ألا تقل الكتلة المدموكة عن الكتلة غير المدموكة.", fr: "La masse compactée doit être supérieure ou égale à la masse en vrac." },
  "SSD mass must be greater than or equal to oven-dry mass.": { ar: "يجب ألا تقل كتلة الحالة المشبعة السطح الجاف عن الكتلة الجافة بالفرن.", fr: "La masse SSD doit être supérieure ou égale à la masse sèche à l'étuve." },
  "Pycnometer with sample and water must weigh more than the pycnometer with water alone.": { ar: "يجب أن تزيد كتلة البيكنومتر مع العينة والماء على كتلته مع الماء فقط.", fr: "Le pycnomètre avec l'échantillon et l'eau doit être plus lourd qu'avec l'eau seule." },
  "Wet mass must be greater than or equal to dry mass.": { ar: "يجب ألا تقل الكتلة الرطبة عن الكتلة الجافة.", fr: "La masse humide doit être supérieure ou égale à la masse sèche." },
  "Dry mass must exceed the container tare mass.": { ar: "يجب أن تتجاوز الكتلة الجافة كتلة الوعاء الفارغ.", fr: "La masse sèche doit dépasser la tare du récipient." },
  "Sand layer height cannot exceed total suspension height.": { ar: "لا يجوز أن يتجاوز ارتفاع طبقة الرمل الارتفاع الكلي للمعلق.", fr: "La hauteur de la couche de sable ne peut pas dépasser celle de la suspension totale." },
  "Retained mass cannot exceed initial sample mass.": { ar: "لا يجوز أن تتجاوز الكتلة المحتجزة كتلة العينة الابتدائية.", fr: "La masse retenue ne peut pas dépasser la masse initiale de l'échantillon." },
  "Final volume must exceed initial volume.": { ar: "يجب أن يتجاوز الحجم النهائي الحجم الابتدائي.", fr: "Le volume final doit dépasser le volume initial." },
  "Vicat penetration cannot exceed the needle travel range (40 mm).": { ar: "لا يجوز أن يتجاوز اختراق إبرة فيكات مدى حركتها (40 مم).", fr: "La pénétration Vicat ne peut pas dépasser la course de l'aiguille (40 mm)." },
  "Relative humidity must be between 0 and 100%.": { ar: "يجب أن تقع الرطوبة النسبية بين 0 و100٪.", fr: "L'humidité relative doit être comprise entre 0 et 100 %." },
  "Temperature must be within the supported laboratory range (-20 to 80 °C).": { ar: "يجب أن تكون درجة الحرارة بين ‎-20 و80°م.", fr: "La température doit être comprise entre -20 et 80 °C." },
  "The final indicator distance cannot be less than the initial distance.": { ar: "لا يجوز أن تقل المسافة النهائية للمؤشر عن المسافة الابتدائية.", fr: "La distance finale de l'indicateur ne peut pas être inférieure à la distance initiale." },
  "Bed porosity must be greater than 0 and less than 1.": { ar: "يجب أن تكون مسامية السرير أكبر من 0 وأقل من 1.", fr: "La porosité du lit doit être supérieure à 0 et inférieure à 1." },
  "Enter at least two time-ordered readings.": { ar: "أدخل قراءتين على الأقل مرتبتين زمنيًا.", fr: "Saisissez au moins deux lectures ordonnées dans le temps." },
  "Enter at least three valid prism readings for each reported age.": { ar: "أدخل ثلاث قراءات موشورية صحيحة على الأقل لكل عمر مُبلغ عنه.", fr: "Saisissez au moins trois lectures valides par âge déclaré." }
};

export function localizeLaboratoryIssue(issue: LaboratoryInputIssue, language: "ar" | "fr" | "en"): string {
  const key = issue.path.replace(/\.\d+/g, "[]");
  const label = LABELS[key]?.[language] || issue.path.replace(/\.\d+/g, "").replace(/([A-Z])/g, " $1");
  if (language === "ar") {
    if (issue.code === "required") return `الحقل «${label}» مطلوب؛ لا تُعامل القيمة الفارغة على أنها صفر.`;
    if (issue.code === "order") return `يجب أن تكون «${label}» مرتبة ${issue.path.startsWith("sieves.") ? "تنازليًا" : "تصاعديًا"} دون تكرار.`;
    if (issue.code === "duplicate") return `توجد قراءة مكررة في «${label}».`;
    if (issue.code === "relationship") return ISSUE_MESSAGES[issue.message]?.ar || issue.message;
    if (issue.code === "row_count") return ISSUE_MESSAGES[issue.message]?.ar || `أكمل صفوف القياس المطلوبة في «${label}».`;
    if (issue.code === "above_maximum") return ISSUE_MESSAGES[issue.message]?.ar || `القيمة في «${label}» أعلى من الحد المسموح.`;
    if (issue.code === "below_minimum") return ISSUE_MESSAGES[issue.message]?.ar || `القيمة في «${label}» أقل من الحد الأدنى المسموح.`;
    return `تحقق من «${label}»: أدخل قيمة رقمية منتهية وضمن المجال المنطقي.`;
  }
  if (language === "fr") {
    if (issue.code === "required") return `Le champ « ${label} » est requis ; une valeur vide n'est jamais zéro.`;
    if (issue.code === "order") return `Les valeurs de « ${label} » doivent être strictement ${issue.path.startsWith("sieves.") ? "décroissantes" : "croissantes"}.`;
    if (issue.code === "duplicate") return `Une lecture est dupliquée dans « ${label} ».`;
    if (issue.code === "relationship") return ISSUE_MESSAGES[issue.message]?.fr || issue.message;
    if (issue.code === "row_count") return ISSUE_MESSAGES[issue.message]?.fr || `Complétez les lignes de mesure requises pour « ${label} ».`;
    if (issue.code === "above_maximum") return ISSUE_MESSAGES[issue.message]?.fr || `La valeur de « ${label} » dépasse la limite autorisée.`;
    if (issue.code === "below_minimum") return ISSUE_MESSAGES[issue.message]?.fr || `La valeur de « ${label} » est inférieure au minimum autorisé.`;
    return `Vérifiez « ${label} » : saisissez une valeur numérique finie dans la plage autorisée.`;
  }
  if (issue.code === "required") return `“${label}” is required; blank is not treated as zero.`;
  if (issue.code === "order") return `“${label}” readings must be strictly ${issue.path.startsWith("sieves.") ? "decreasing" : "increasing"}.`;
  if (issue.code === "duplicate") return `A reading is duplicated in “${label}”.`;
  if (issue.code === "relationship") return issue.message;
  return `Check “${label}”: enter a finite numeric value within the valid range.`;
}
