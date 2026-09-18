/**
 * EN 206 Concrete Specification & Durability Compliance Engine
 * 
 * Standards Reference:
 * Code: EN 206:2013+A2:2021 (Concrete - Specification, performance, production and conformity)
 * Table F.1: Recommended limiting values for composition and properties of concrete
 * 
 * Note: These values are INDICATIVE European baseline values. National Annexes (e.g. NF EN 206/CN, DIN EN 206, BS 8500)
 * may specify stricter limits for local conditions and cements.
 */

export interface EN206ExposureLimit {
  exposureClass: string;
  descriptionAr: string;
  descriptionEn: string;
  minCementKg: number;
  maxWcRatio: number;
  minAirPercent?: number;
  code: string;
  edition: string;
  source: string;
  isIndicative: boolean;
}

export const EN206_INDICATIVE_LIMITS: Record<string, EN206ExposureLimit> = {
  X0: {
    exposureClass: "X0",
    descriptionAr: "لا خطر تآكل أو هجوم كيميائي (خرسانة كتلية غير مسلحة أو بيئة داخلية جافة)",
    descriptionEn: "No risk of corrosion or attack (unreinforced mass concrete or dry indoor)",
    minCementKg: 240,
    maxWcRatio: 0.70,
    code: "EN 206",
    edition: "2013+A2:2021",
    source: "Indicative (Table F.1 - National Annex may supersede)",
    isIndicative: true
  },
  XC1: {
    exposureClass: "XC1",
    descriptionAr: "جاف أو رطب باستمرار (خرسانة داخلية أو مغمورة بالكامل بالماء)",
    descriptionEn: "Dry or permanently wet (indoor structures or permanently submerged)",
    minCementKg: 260,
    maxWcRatio: 0.65,
    code: "EN 206",
    edition: "2013+A2:2021",
    source: "Indicative (Table F.1 - National Annex may supersede)",
    isIndicative: true
  },
  XC2: {
    exposureClass: "XC2",
    descriptionAr: "رطب، ونادراً جاف (أساسات وخزانات مياه)",
    descriptionEn: "Wet, rarely dry (foundations, water tanks)",
    minCementKg: 280,
    maxWcRatio: 0.60,
    code: "EN 206",
    edition: "2013+A2:2021",
    source: "Indicative (Table F.1 - National Annex may supersede)",
    isIndicative: true
  },
  XC3: {
    exposureClass: "XC3",
    descriptionAr: "رطوبة معتدلة (خرسانة خارجية محمية من المطر)",
    descriptionEn: "Moderate humidity (external concrete sheltered from rain)",
    minCementKg: 280,
    maxWcRatio: 0.55,
    code: "EN 206",
    edition: "2013+A2:2021",
    source: "Indicative (Table F.1 - National Annex may supersede)",
    isIndicative: true
  },
  XC4: {
    exposureClass: "XC4",
    descriptionAr: "دوري رطب وجاف (أسطح خارجية معرضة للمطر المباشر)",
    descriptionEn: "Cyclic wet and dry (external surfaces exposed to direct rain)",
    minCementKg: 300,
    maxWcRatio: 0.50,
    code: "EN 206",
    edition: "2013+A2:2021",
    source: "Indicative (Table F.1 - National Annex may supersede)",
    isIndicative: true
  },
  XD1: {
    exposureClass: "XD1",
    descriptionAr: "رطوبة معتدلة مع كلوريدات جوية غير بحرية",
    descriptionEn: "Moderate humidity with non-marine airborne chlorides",
    minCementKg: 300,
    maxWcRatio: 0.55,
    code: "EN 206",
    edition: "2013+A2:2021",
    source: "Indicative (Table F.1 - National Annex may supersede)",
    isIndicative: true
  },
  XD2: {
    exposureClass: "XD2",
    descriptionAr: "رطب ونادراً جاف، ملامس لمياه تحتوي على كلوريدات (حمامات سباحة)",
    descriptionEn: "Wet, rarely dry, in contact with chloride water (swimming pools)",
    minCementKg: 320,
    maxWcRatio: 0.50,
    code: "EN 206",
    edition: "2013+A2:2021",
    source: "Indicative (Table F.1 - National Annex may supersede)",
    isIndicative: true
  },
  XD3: {
    exposureClass: "XD3",
    descriptionAr: "دوري رطب وجاف مع رذاذ أملاح إزالة الجليد (جسور ومواقف سيارات)",
    descriptionEn: "Cyclic wet and dry with de-icing salts spray (bridges, car parks)",
    minCementKg: 340,
    maxWcRatio: 0.45,
    code: "EN 206",
    edition: "2013+A2:2021",
    source: "Indicative (Table F.1 - National Annex may supersede)",
    isIndicative: true
  },
  XS1: {
    exposureClass: "XS1",
    descriptionAr: "معرض لأملاح جوية بحرية دون تلامس مباشر مع ماء البحر",
    descriptionEn: "Exposed to airborne sea salts without direct sea water contact",
    minCementKg: 300,
    maxWcRatio: 0.50,
    code: "EN 206",
    edition: "2013+A2:2021",
    source: "Indicative (Table F.1 - National Annex may supersede)",
    isIndicative: true
  },
  XS2: {
    exposureClass: "XS2",
    descriptionAr: "مغمور كلياً في ماء البحر",
    descriptionEn: "Permanently submerged in seawater",
    minCementKg: 320,
    maxWcRatio: 0.45,
    code: "EN 206",
    edition: "2013+A2:2021",
    source: "Indicative (Table F.1 - National Annex may supersede)",
    isIndicative: true
  },
  XS3: {
    exposureClass: "XS3",
    descriptionAr: "منطقة المد والجزر ورذاذ الأمواج البحرية العاتية",
    descriptionEn: "Tidal, splash, and spray marine zones",
    minCementKg: 340,
    maxWcRatio: 0.45,
    code: "EN 206",
    edition: "2013+A2:2021",
    source: "Indicative (Table F.1 - National Annex may supersede)",
    isIndicative: true
  },
  XF1: {
    exposureClass: "XF1",
    descriptionAr: "تشبع معتدل بالماء مع تجمد وذوبان بدون أملاح إزالة الجليد",
    descriptionEn: "Moderate water saturation with freeze-thaw without de-icing salts",
    minCementKg: 300,
    maxWcRatio: 0.55,
    code: "EN 206",
    edition: "2013+A2:2021",
    source: "Indicative (Table F.1 - National Annex may supersede)",
    isIndicative: true
  },
  XF2: {
    exposureClass: "XF2",
    descriptionAr: "تشبع معتدل بالماء مع تجمد وأملاح إزالة الجليد",
    descriptionEn: "Moderate water saturation with freeze-thaw and de-icing salts",
    minCementKg: 320,
    maxWcRatio: 0.55,
    minAirPercent: 4.0,
    code: "EN 206",
    edition: "2013+A2:2021",
    source: "Indicative (Table F.1 - National Annex may supersede)",
    isIndicative: true
  },
  XF3: {
    exposureClass: "XF3",
    descriptionAr: "تشبع عالٍ بالماء مع تجمد وذوبان بدون أملاح",
    descriptionEn: "High water saturation with freeze-thaw without de-icing salts",
    minCementKg: 320,
    maxWcRatio: 0.50,
    code: "EN 206",
    edition: "2013+A2:2021",
    source: "Indicative (Table F.1 - National Annex may supersede)",
    isIndicative: true
  },
  XF4: {
    exposureClass: "XF4",
    descriptionAr: "تشبع عالٍ بالماء مع تجمد ورذاذ أملاح إزالة الجليد أو ماء البحر",
    descriptionEn: "High water saturation with freeze-thaw and de-icing salts or seawater",
    minCementKg: 340,
    maxWcRatio: 0.45,
    minAirPercent: 4.0,
    code: "EN 206",
    edition: "2013+A2:2021",
    source: "Indicative (Table F.1 - National Annex may supersede)",
    isIndicative: true
  },
  XA1: {
    exposureClass: "XA1",
    descriptionAr: "بيئة كيميائية ذات عدوانية منخفضة وفق EN 206",
    descriptionEn: "Slightly aggressive chemical environment according to EN 206",
    minCementKg: 300,
    maxWcRatio: 0.55,
    code: "EN 206",
    edition: "2013+A2:2021",
    source: "Indicative (Table F.1 - National Annex may supersede)",
    isIndicative: true
  },
  XA2: {
    exposureClass: "XA2",
    descriptionAr: "بيئة كيميائية معتدلة العدوانية (مياه كبريتية أو أسمدة)",
    descriptionEn: "Moderately aggressive chemical environment (sulfate ground)",
    minCementKg: 320,
    maxWcRatio: 0.50,
    code: "EN 206",
    edition: "2013+A2:2021",
    source: "Indicative (Table F.1 - National Annex may supersede)",
    isIndicative: true
  },
  XA3: {
    exposureClass: "XA3",
    descriptionAr: "بيئة كيميائية شديدة العدوانية (تتطلب معالجة خاصة وإسمنت مقاوم للكبريتات)",
    descriptionEn: "Highly aggressive chemical environment (requires sulfate-resisting cement)",
    minCementKg: 360,
    maxWcRatio: 0.45,
    code: "EN 206",
    edition: "2013+A2:2021",
    source: "Indicative (Table F.1 - National Annex may supersede)",
    isIndicative: true
  }
};

export function getEN206ExposureLimits(exposureClass: string): EN206ExposureLimit {
  const normClass = (exposureClass || "X0").toUpperCase().trim();
  return EN206_INDICATIVE_LIMITS[normClass] || EN206_INDICATIVE_LIMITS["X0"];
}

export interface ComplianceCheckParams {
  exposureClass: string;
  cementType?: string;
  cementKg: number;
  totalBinderKg?: number;
  waterKg: number;
  wcRatio: number;
  airContentPercent?: number;
}

export interface ComplianceCheckResult {
  isCompliant: boolean;
  code: string;
  edition: string;
  source: string;
  exposureClass: string;
  checks: {
    parameter: string;
    requirement: string;
    actual: string;
    status: "compliant" | "warning" | "non_compliant";
  }[];
}

export function checkEN206Compliance(params: ComplianceCheckParams): ComplianceCheckResult {
  const limits = getEN206ExposureLimits(params.exposureClass);
  const checks: ComplianceCheckResult["checks"] = [];
  let isCompliant = true;

  const binderToCheck = params.totalBinderKg !== undefined && params.totalBinderKg > 0
    ? params.totalBinderKg
    : params.cementKg;

  // 1. Minimum Cement / Binder Content
  const cementOk = binderToCheck >= limits.minCementKg;
  checks.push({
    parameter: `الحد الأدنى لمحتوى الإسمنت/الرابط (${limits.exposureClass})`,
    requirement: `>= ${limits.minCementKg} kg/m³`,
    actual: `${Math.round(binderToCheck)} kg/m³`,
    status: cementOk ? "compliant" : "non_compliant"
  });
  if (!cementOk) isCompliant = false;

  // 2. Maximum W/C or W/B Ratio
  const wcOk = params.wcRatio <= limits.maxWcRatio + 0.005; // tiny numerical epsilon
  checks.push({
    parameter: `الحد الأقصى لنسبة الماء إلى الرابط W/C (${limits.exposureClass})`,
    requirement: `<= ${limits.maxWcRatio.toFixed(2)}`,
    actual: params.wcRatio.toFixed(3),
    status: wcOk ? "compliant" : "non_compliant"
  });
  if (!wcOk) isCompliant = false;

  // 3. Air Content (if required for freeze-thaw XF2/XF4)
  if (limits.minAirPercent !== undefined) {
    const airOk = (params.airContentPercent ?? 0) >= limits.minAirPercent;
    checks.push({
      parameter: `الحد الأدنى للهواء المحبوس (${limits.exposureClass})`,
      requirement: `>= ${limits.minAirPercent.toFixed(1)}%`,
      actual: `${(params.airContentPercent ?? 0).toFixed(1)}%`,
      status: airOk ? "compliant" : "non_compliant"
    });
    if (!airOk) isCompliant = false;
  }

  return {
    isCompliant,
    code: limits.code,
    edition: limits.edition,
    source: limits.source,
    exposureClass: limits.exposureClass,
    checks
  };
}
