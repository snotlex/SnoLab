import { MixDesignMethodId } from "./types";

export interface ComplianceCheck {
  id: string;
  labelAr: string;
  labelFr: string;
  labelEn: string;
  status: "pass" | "warning" | "fail" | "not-enough-data";
  messageAr: string;
  messageFr: string;
  messageEn: string;
}

export interface ComplianceResult {
  status: "pass" | "warning" | "fail" | "not-enough-data";
  checks: ComplianceCheck[];
}

export function checkMixCompliance(
  methodId: MixDesignMethodId,
  inputs: any,
  calculatedQuantities?: {
    cementKgPerM3?: number;
    waterLPerM3?: number;
    sandKgPerM3?: number;
    coarseAggregateKgPerM3?: number;
  },
  ratios?: {
    waterCementRatio?: number;
  }
): ComplianceResult {
  const checks: ComplianceCheck[] = [];
  let overallStatus: "pass" | "warning" | "fail" | "not-enough-data" = "pass";

  const cement = calculatedQuantities?.cementKgPerM3 || 0;
  const wc = ratios?.waterCementRatio || (calculatedQuantities?.waterLPerM3 && cement ? calculatedQuantities.waterLPerM3 / cement : 0);

  // 1. Minimum Cement Content Check (EN 206 limits structural concrete to >= 300 kg)
  if (cement > 0) {
    const passedMin = cement >= 280;
    const passedExcellent = cement >= 300;
    
    checks.push({
      id: "min-cement",
      labelAr: "الحد الأدنى لمحتوى الإسمنت بالخلطة",
      labelFr: "Teneur minimale en ciment",
      labelEn: "Minimum Cement Content Limit",
      status: passedExcellent ? "pass" : passedMin ? "warning" : "fail",
      messageAr: passedExcellent 
        ? `وزن الإسمنت (${cement} كجم/م³) ممتاز ويحقق شروط المتانة الإنشائية القياسية.` 
        : passedMin 
          ? `وزن الإسمنت (${cement} كجم/م³) مقبول لكنه منخفض نسبيًا لقوالب صب الرطوبة الخارجية.`
          : `وزن الإسمنت (${cement} كجم/م³) ضعيف جداً للصب الإنشائي المسلح القياسي (أقل من 280 كجم).`,
      messageFr: passedExcellent
        ? `Masse de ciment (${cement} kg/m³) idéale pour une durabilité structurelle conforme.`
        : passedMin
          ? `Masse de ciment (${cement} kg/m³) faible pour d'excellentes caractéristiques extérieures.`
          : `Masse de ciment (${cement} kg/m³) non conforme pour du béton de structure (<280 kg/m³).`,
      messageEn: passedExcellent
        ? `Cement weight (${cement} kg/m³) complies perfectly with structural durability requirements.`
        : passedMin
          ? `Cement weight (${cement} kg/m³) is acceptable but marginal for open outdoor exposure.`
          : `Cement weight (${cement} kg/m³) is below standard limit (<280 kg/m³) for reinforced structures.`
    });
  } else {
    checks.push({
      id: "min-cement",
      labelAr: "الحد الأدنى لمحتوى الإسمنت بالخلطة",
      labelFr: "Teneur minimale en ciment",
      labelEn: "Minimum Cement Content Limit",
      status: "not-enough-data",
      messageAr: "البيانات غير كافية لحساب متطلبات الإسمنت الأدنى.",
      messageFr: "Données insuffisantes pour évaluer la teneur minimale en ciment.",
      messageEn: "Insufficient data to verify minimum cement content rules."
    });
  }

  // 2. Water-to-Cement Ratio (W/C) Limit Check
  if (wc > 0) {
    const passedWcStrict = wc <= 0.50;
    const passedWcAcceptable = wc <= 0.60;
    
    checks.push({
      id: "wc-ratio-limit",
      labelAr: "أقصى نسبة ماء إلى الإسمنت (W/C)",
      labelFr: "Rapport Eau/Ciment (E/C) maximal",
      labelEn: "Maximum W/C Ratio Limit",
      status: passedWcStrict ? "pass" : passedWcAcceptable ? "warning" : "fail",
      messageAr: passedWcStrict
        ? `نسبة الماء إلى الإسمنت المثيرة للاهتمام (${wc.toFixed(2)}) جيدة جداً وتحقق نفوذية ضئيلة بمواصفة EN 206.`
        : passedWcAcceptable
          ? `نسبة الماء إلى الإسمنت (${wc.toFixed(2)}) مقبولة للمشاريع العادية لكنها قد تسبب نفاذية رطوبة متوسطة.`
          : `نسبة الماء إلى الإسمنت مرتفعة للغاية (${wc.toFixed(2)}) وقد تُضعف المقاومة وتُسهل صدأ حديد التسليح.`,
      messageFr: passedWcStrict
        ? `Rapport E/C (${wc.toFixed(2)}) idéal pour préserver la compacité interne.`
        : passedWcAcceptable
          ? `Rapport E/C de (${wc.toFixed(2)}) toléré pour applications secondaires.`
          : `Rapport E/C trop élevé (${wc.toFixed(2)}), risque élevé de porosité et de corrosion des aciers.`,
      messageEn: passedWcStrict
        ? `Excellent W/C ratio (${wc.toFixed(2)}) ensures low permeability and high durability.`
        : passedWcAcceptable
          ? `W/C ratio (${wc.toFixed(2)}) is acceptable for standard light-wear structures.`
          : `High W/C ratio (${wc.toFixed(2)}) detected. Increases risk of voids and steel reinforcement corrosion.`
    });
  } else {
    checks.push({
      id: "wc-ratio-limit",
      labelAr: "أقصى نسبة ماء إلى الإسمنت (W/C)",
      labelFr: "Rapport Eau/Ciment (E/C) maximal",
      labelEn: "Maximum W/C Ratio Limit",
      status: "not-enough-data",
      messageAr: "لا تتوفر نسبة ماء مسجلة للتحقق.",
      messageFr: "Pas de ratio E/C calculé disponible.",
      messageEn: "No calculated W/C ratio available for verification."
    });
  }

  // 3. Lab Data Verification (Moisture and Sieve)
  const isMoistureDefined = inputs.moistureSand !== undefined && inputs.moistureGravel !== undefined;
  checks.push({
    id: "lab-data-correction",
    labelAr: "تكامل بيانات المختبر والرطوبة الميدانية",
    labelFr: "Données de laboratoire et humidité",
    labelEn: "Lab Data and Field Moisture Integration",
    status: isMoistureDefined ? "pass" : "warning",
    messageAr: isMoistureDefined
      ? "تعديل رطوبة الركامات الميداني مفعل، المقادير الرطبة محسوبة ومصححة للوزن بالموقع."
      : "تحذير: لم تدخل نسب رطوبة الركامات. سيتم افتراض حالة رطوبة جافة وهي غير واقعية بالموقع.",
    messageFr: isMoistureDefined
      ? "Correction d'humidité intégrée, masses réelles sur chantier recalculées avec succès."
      : "Avertissement: humidité des granulats manquante, calculs basés sur un état sec non réaliste.",
    messageEn: isMoistureDefined
      ? "Field aggregate moisture correction is active. Wet weight proportions computed successfully."
      : "Warning: Aggregate moisture values missing. Clean dry state assumptions used which are unrealistic."
  });

  // Calculate overall status
  const statuses = checks.map(c => c.status);
  if (statuses.includes("fail")) {
    overallStatus = "fail";
  } else if (statuses.includes("warning")) {
    overallStatus = "warning";
  } else if (statuses.includes("not-enough-data")) {
    overallStatus = "not-enough-data";
  }

  return {
    status: overallStatus,
    checks
  };
}
