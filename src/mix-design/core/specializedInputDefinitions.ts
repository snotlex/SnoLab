export type SiteLanguage = "ar" | "fr" | "en";

export interface SpecializedInputDefinition {
  label: Record<SiteLanguage, string>;
  unit?: Record<SiteLanguage, string>;
  min?: number;
  max?: number;
  step?: number;
  integer?: boolean;
}

const d = (ar: string, fr: string, en: string, options: Omit<SpecializedInputDefinition, "label"> = {}): SpecializedInputDefinition => ({
  label: { ar, fr, en },
  ...options
});
const kg = { ar: "كغ/م³", fr: "kg/m³", en: "kg/m³" };
const ratio = { ar: "نسبة", fr: "rapport", en: "ratio" };
const percent = { ar: "%", fr: "%", en: "%" };
const mm = { ar: "مم", fr: "mm", en: "mm" };

export const SPECIALIZED_INPUT_DEFINITIONS: Record<string, SpecializedInputDefinition> = {
  dosageSuper: d("جرعة الملدن الفائق", "Dosage du superplastifiant", "Superplasticizer dosage", { unit: percent, min: 0, max: 5, step: 0.01 }),
  dosageSilicaFume: d("نسبة غبار السيليكا", "Taux de fumée de silice", "Silica fume dosage", { unit: percent, min: 0, max: 30, step: 0.1 }),
  hscWaterKgM3: d("ماء خرسانة HSC الفعال", "Eau efficace du béton HSC", "HSC effective water", { unit: kg, min: 125, max: 190, step: 1 }),
  hscWaterBinderRatio: d("نسبة الماء إلى المواد الرابطة HSC", "Rapport eau/liant HSC", "HSC water-to-binder ratio", { unit: ratio, min: 0.22, max: 0.36, step: 0.01 }),
  hpcWaterKgM3: d("ماء خرسانة HPC الفعال", "Eau efficace du béton HPC", "HPC effective water", { unit: kg, min: 125, max: 190, step: 1 }),
  hpcWaterBinderRatio: d("نسبة الماء إلى المواد الرابطة HPC", "Rapport eau/liant HPC", "HPC water-to-binder ratio", { unit: ratio, min: 0.25, max: 0.38, step: 0.01 }),
  sccTargetSlumpFlowMm: d("انتشار الهطول المستهدف SCC", "Étalement cible SCC", "SCC target slump flow", { unit: mm, min: 500, max: 850, step: 10 }),
  sccPowderKgM3: d("إجمالي المسحوق SCC", "Poudre totale SCC", "SCC total powder", { unit: kg, min: 380, max: 600, step: 1 }),
  sccWaterPowderRatioByVolume: d("نسبة الماء إلى المسحوق بالحجم SCC", "Rapport eau/poudre volumique SCC", "SCC water/powder ratio by volume", { unit: ratio, min: 0.8, max: 1.1, step: 0.01 }),
  sccCoarseAggregateVolumeFraction: d("الحجم النسبي للركام الخشن SCC", "Fraction volumique des gros granulats SCC", "SCC coarse aggregate volume fraction", { unit: percent, min: 0.2, max: 0.5, step: 0.01 }),
  frcWaterBinderRatio: d("نسبة الماء إلى المواد الرابطة FRC", "Rapport eau/liant FRC", "FRC water-to-binder ratio", { unit: ratio, min: 0.25, max: 0.7, step: 0.01 }),
  frcFiberVolumePercent: d("الحجم النسبي للألياف FRC", "Volume de fibres FRC", "FRC fiber volume", { unit: percent, min: 0.1, max: 6, step: 0.1 }),
  fiberType: d("نوع الألياف", "Type de fibres", "Fiber type"),
  fiberDensity: d("كثافة الألياف", "Masse volumique des fibres", "Fiber density", { unit: kg, min: 500, max: 10000, step: 10 }),
  lwcTargetDensityKgM3: d("الكثافة الطازجة المستهدفة LWC", "Masse volumique fraîche cible LWC", "LWC target fresh density", { unit: kg, min: 1400, max: 2000, step: 10 }),
  lwcWaterKgM3: d("ماء LWC", "Eau LWC", "LWC water", { unit: kg, min: 100, max: 240, step: 1 }),
  lwcWaterBinderRatio: d("نسبة الماء إلى المواد الرابطة LWC", "Rapport eau/liant LWC", "LWC water-to-binder ratio", { unit: ratio, min: 0.25, max: 0.65, step: 0.01 }),
  hwcTargetDensityKgM3: d("الكثافة الطازجة المستهدفة HWC", "Masse volumique fraîche cible HWC", "HWC target fresh density", { unit: kg, min: 2600, max: 5000, step: 10 }),
  hwcWaterKgM3: d("ماء HWC", "Eau HWC", "HWC water", { unit: kg, min: 100, max: 240, step: 1 }),
  hwcWaterBinderRatio: d("نسبة الماء إلى المواد الرابطة HWC", "Rapport eau/liant HWC", "HWC water-to-binder ratio", { unit: ratio, min: 0.25, max: 0.6, step: 0.01 }),
  rccWaterKgM3: d("ماء RCC الكلي", "Eau totale RCC", "RCC total water", { unit: kg, min: 80, max: 220, step: 1 }),
  rccWaterBinderRatio: d("نسبة الماء إلى المواد الرابطة RCC", "Rapport eau/liant RCC", "RCC water-to-binder ratio", { unit: ratio, min: 0.2, max: 0.6, step: 0.01 }),
  rccOptimumMoisturePercent: d("الرطوبة المثلى للرص RCC", "Humidité optimale de compactage RCC", "RCC optimum compaction moisture", { unit: percent, min: 3, max: 12, step: 0.1 }),
  rccMaxDryDensityKgM3: d("أقصى كثافة جافة RCC", "Masse volumique sèche maximale RCC", "RCC maximum dry density", { unit: kg, min: 1800, max: 2600, step: 10 }),
  rccCompactionTargetPercent: d("هدف الرص RCC", "Cible de compactage RCC", "RCC compaction target", { unit: percent, min: 90, max: 105, step: 0.1 }),
  shotcreteWaterKgM3: d("ماء الخرسانة المرشوشة", "Eau du béton projeté", "Shotcrete water", { unit: kg, min: 120, max: 230, step: 1 }),
  shotcreteWaterBinderRatio: d("نسبة الماء إلى المواد الرابطة للمرشوشة", "Rapport eau/liant du béton projeté", "Shotcrete water-to-binder ratio", { unit: ratio, min: 0.3, max: 0.55, step: 0.01 }),
  shotcreteAcceleratorPercent: d("جرعة المسرّع للخرسانة المرشوشة", "Dosage accélérateur béton projeté", "Shotcrete accelerator dosage", { unit: percent, min: 0, max: 12, step: 0.1 }),
  gpcPrecursorKgM3: d("كتلة المادة الأولية GPC", "Masse de précurseur GPC", "GPC precursor mass", { unit: kg, min: 250, max: 900, step: 1 }),
  gpcActivatorLiquidKgM3: d("سائل التنشيط GPC", "Liquide activateur GPC", "GPC activator liquid", { unit: kg, min: 50, max: 500, step: 1 }),
  gpcWaterKgM3: d("ماء GPC", "Eau GPC", "GPC water", { unit: kg, min: 50, max: 250, step: 1 }),
  gpcWaterBinderRatio: d("نسبة الماء إلى المواد الرابطة GPC", "Rapport eau/liant GPC", "GPC water-to-binder ratio", { unit: ratio, min: 0.2, max: 0.6, step: 0.01 }),
  gpcActivatorToPrecursorRatio: d("نسبة المنشّط إلى المادة الأولية GPC", "Rapport activateur/précurseur GPC", "GPC activator-to-precursor ratio", { unit: ratio, min: 0.2, max: 1.2, step: 0.01 }),
  shcCementKgM3: d("إسمنت SHC", "Ciment SHC", "SHC cement", { unit: kg, min: 250, max: 800, step: 1 }),
  shcWaterKgM3: d("ماء SHC", "Eau SHC", "SHC water", { unit: kg, min: 100, max: 240, step: 1 }),
  shcWaterBinderRatio: d("نسبة الماء إلى المواد الرابطة SHC", "Rapport eau/liant SHC", "SHC water-to-binder ratio", { unit: ratio, min: 0.25, max: 0.6, step: 0.01 }),
  shcHealingAgentDosageKgM3: d("جرعة مادة المعالجة الذاتية SHC", "Dosage de l'agent auto-cicatrisant SHC", "SHC self-healing agent dosage", { unit: kg, min: 0, max: 100, step: 0.1 }),
  shcHealingAgentDensityKgM3: d("كثافة مادة المعالجة الذاتية SHC", "Masse volumique de l'agent auto-cicatrisant SHC", "SHC self-healing agent density", { unit: kg, min: 500, max: 3000, step: 10 }),
  shcHealingAgentType: d("نوع مادة المعالجة الذاتية", "Type d'agent auto-cicatrisant", "Self-healing agent type"),
  racCementKgM3: d("إسمنت RAC", "Ciment RAC", "RAC cement", { unit: kg, min: 250, max: 700, step: 1 }),
  racWaterKgM3: d("ماء RAC", "Eau RAC", "RAC water", { unit: kg, min: 100, max: 240, step: 1 }),
  racWaterBinderRatio: d("نسبة الماء إلى المواد الرابطة RAC", "Rapport eau/liant RAC", "RAC water-to-binder ratio", { unit: ratio, min: 0.3, max: 0.65, step: 0.01 }),
  racCoarseAggregateKgM3: d("ركام RAC الخشن", "Gros granulats RAC", "RAC coarse aggregate", { unit: kg, min: 500, max: 1800, step: 1 }),
  racReplacementPercent: d("نسبة استبدال الركام المعاد تدويره", "Taux de remplacement par granulats recyclés", "Recycled aggregate replacement", { unit: percent, min: 0, max: 100, step: 1 }),
  racRecycledAggregateDensityKgM3: d("كثافة الركام المعاد تدويره", "Masse volumique des granulats recyclés", "Recycled aggregate density", { unit: kg, min: 1500, max: 3000, step: 10 }),
  racRecycledAbsorptionPercent: d("امتصاص الركام المعاد تدويره", "Absorption des granulats recyclés", "Recycled aggregate absorption", { unit: percent, min: 0, max: 15, step: 0.1 }),
  racPreSaturationPercent: d("نسبة إشباع الركام المعاد تدويره مسبقاً", "Pré-saturation des granulats recyclés", "Recycled aggregate pre-saturation", { unit: percent, min: 0, max: 100, step: 1 }),
  perviousTargetVoidContentPercent: d("محتوى الفراغات المستهدف للخرسانة النافذة", "Teneur en vides cible du béton perméable", "Pervious target void content", { unit: percent, min: 15, max: 30, step: 0.5 }),
  perviousTargetPermeabilityMmPerS: d("النفاذية المستهدفة للخرسانة النافذة", "Perméabilité cible du béton perméable", "Pervious target permeability", { unit: { ar: "مم/ث", fr: "mm/s", en: "mm/s" }, min: 0.5, max: 50, step: 0.1 }),
  perviousPasteVolumePercent: d("حجم العجينة في الخرسانة النافذة", "Volume de pâte du béton perméable", "Pervious paste volume", { unit: percent, min: 10, max: 30, step: 0.5 }),
  perviousWaterBinderRatio: d("نسبة الماء إلى المواد الرابطة للنافذة", "Rapport eau/liant du béton perméable", "Pervious water-to-binder ratio", { unit: ratio, min: 0.2, max: 0.5, step: 0.01 }),
  uhpcWaterBinderRatio: d("نسبة الماء إلى المواد الرابطة UHPC", "Rapport eau/liant UHPC", "UHPC water-to-binder ratio", { unit: ratio, min: 0.18, max: 0.28, step: 0.01 }),
  bfupWaterBinderRatio: d("نسبة الماء إلى المواد الرابطة BFUP", "Rapport eau/liant BFUP", "BFUP water-to-binder ratio", { unit: ratio, min: 0.18, max: 0.28, step: 0.01 }),
  uhpcFiberVolumePercent: d("حجم ألياف UHPC", "Volume de fibres UHPC", "UHPC fiber volume", { unit: percent, min: 0, max: 5, step: 0.1 }),
  bfupFiberVolumePercent: d("حجم ألياف BFUP", "Volume de fibres BFUP", "BFUP fiber volume", { unit: percent, min: 0, max: 5, step: 0.1 }),
  uhpcQuartzPowderKgM3: d("مسحوق الكوارتز UHPC", "Poudre de quartz UHPC", "UHPC quartz powder", { unit: kg, min: 0, max: 500, step: 1 }),
  bfupQuartzPowderKgM3: d("مسحوق الكوارتز BFUP", "Poudre de quartz BFUP", "BFUP quartz powder", { unit: kg, min: 0, max: 500, step: 1 })
};

export function getSpecializedInputDefinition(key: string): SpecializedInputDefinition {
  return SPECIALIZED_INPUT_DEFINITIONS[key] || d(key, key, key, { min: 0, max: 100000, step: 0.01 });
}

export function validateSpecializedInputValue(key: string, value: unknown): string | null {
  const definition = getSpecializedInputDefinition(key);
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "string" && !definition.min && !definition.max) return value.trim() ? null : "required";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "not_numeric";
  if (definition.integer && !Number.isInteger(numeric)) return "integer";
  if (definition.min !== undefined && numeric < definition.min) return "below_min";
  if (definition.max !== undefined && numeric > definition.max) return "above_max";
  return null;
}

export function validateSpecializedInputs(input: Record<string, any>, keys: string[]) {
  return keys.flatMap(key => {
    const error = validateSpecializedInputValue(key, input[key]);
    return error ? [{ key, error, definition: getSpecializedInputDefinition(key) }] : [];
  });
}

export function specializedInputErrorMessage(key: string, error: string, language: SiteLanguage): string {
  const definition = getSpecializedInputDefinition(key);
  if (error === "below_min") {
    return language === "ar" ? `القيمة يجب ألا تقل عن ${definition.min}` : language === "fr" ? `La valeur doit être ≥ ${definition.min}` : `Value must be ≥ ${definition.min}`;
  }
  if (error === "above_max") {
    return language === "ar" ? `القيمة يجب ألا تتجاوز ${definition.max}` : language === "fr" ? `La valeur doit être ≤ ${definition.max}` : `Value must be ≤ ${definition.max}`;
  }
  if (error === "not_numeric") return language === "ar" ? "أدخل رقماً صحيحاً" : language === "fr" ? "Saisissez un nombre valide" : "Enter a valid number";
  if (error === "integer") return language === "ar" ? "أدخل عدداً صحيحاً" : language === "fr" ? "Saisissez un entier" : "Enter an integer";
  return language === "ar" ? `قيمة غير صالحة لـ ${definition.label.ar}` : language === "fr" ? `Valeur invalide pour ${definition.label.fr}` : `Invalid value for ${definition.label.en}`;
}
