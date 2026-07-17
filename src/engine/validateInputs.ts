export interface InputValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const INPUT_MESSAGES_MAP: Record<string, { ar: string; fr: string; en: string }> = {
  "حجم الصب (Concrete Volume) يجب أن يكون أكبر من الصفر.": {
    ar: "حجم الصب (Concrete Volume) يجب أن يكون أكبر من الصفر.",
    fr: "Le volume de béton doit être supérieur à zéro.",
    en: "Concrete volume must be greater than zero."
  },
  "مقاومة الضغط المميزة للخرسانة (fck28) يجب أن تكون أكبر من الصفر.": {
    ar: "مقاومة الضغط المميزة للخرسانة (fck28) يجب أن تكون أكبر من الصفر.",
    fr: "La résistance caractéristique du béton (fck28) doit être supérieure à zéro.",
    en: "Characteristic concrete compressive strength (fck28) must be greater than zero."
  },
  "مقاومة الضغط المميزة fck28 المطلوبة يجب أن تقع بين 5 و 150 ميجاباسكال.": {
    ar: "مقاومة الضغط المميزة fck28 المطلوبة يجب أن تقع بين 5 و 150 ميجاباسكال.",
    fr: "La résistance caractéristique fck28 demandée doit être comprise entre 5 et 150 MPa.",
    en: "The required characteristic compressive strength fck28 must be between 5 and 150 MPa."
  },
  "حجم الركام الأقصى Dmax غير مقبول هندسياً (يجب أن يكون بين 2 و 150 مم).": {
    ar: "حجم الركام الأقصى Dmax غير مقبول هندسياً (يجب أن يكون بين 2 و 150 مم).",
    fr: "Le diamètre maximal des granulats dMax n'est pas admissible (doit être compris entre 2 et 150 mm).",
    en: "The maximum aggregate size Dmax is not acceptable (must be between 2 and 150 mm)."
  },
  "قيمة الهبوط Slump يجب أن تكون بين 0 و 40 سم.": {
    ar: "قيمة الهبوط Slump يجب أن تكون بين 0 و 40 سم.",
    fr: "L'affaissement (Slump) doit être compris entre 0 et 40 cm.",
    en: "The targeted concrete Slump must be between 0 and 40 cm."
  },
  "نسبة الهواء المدمج (Air Content) يجب أن تكون بين 0٪ و 10٪.": {
    ar: "نسبة الهواء المدمج (Air Content) يجب أن تكون بين 0٪ و 10٪.",
    fr: "La teneur en air occlus doit être comprise entre 0% et 10%.",
    en: "The entrapped air content must be between 0% and 10%."
  },
  "الكثافة النوعية للرمال للرمل (Sand Specific Gravity) غير منطقية هندسياً (يجب أن تقع بين 1.5 و 3.5).": {
    ar: "الكثافة النوعية للرمال للرمل (Sand Specific Gravity) غير منطقية هندسياً (يجب أن تقع بين 1.5 و 3.5).",
    fr: "La masse volumique absolue du sable n'est pas réaliste (doit être comprise entre 1.5 et 3.5).",
    en: "The specific gravity of concrete sand is unrealistic (must be between 1.5 and 3.5)."
  },
  "الكثافة النوعية للحصى (Gravel Specific Gravity) غير منطقية هندسياً (يجب أن تقع بين 1.5 و 3.5).": {
    ar: "الكثافة النوعية للحصى (Gravel Specific Gravity) غير منطقية هندسياً (يجب أن تقع بين 1.5 و 3.5).",
    fr: "La masse volumique absolue des gravillons n'est pas réaliste (doit être comprise entre 1.5 et 3.5).",
    en: "The specific gravity of concrete gravel is unrealistic (must be between 1.5 and 3.5)."
  },
  "الكثافة المطلقة للإسمنت (Cement Specific Gravity) غير منطقية (يجب أن تقع بين 2.5 و 3.5، أي 2500 - 3500 كجم/م³).": {
    ar: "الكثافة المطلقة للإسمنت (Cement Specific Gravity) غير منطقية (يجب أن تقع بين 2.5 و 3.5، أي 2500 - 3500 كجم/م³).",
    fr: "La masse volumique absolue du ciment n'est pas réaliste (doit être comprise entre 2.5 et 3.5, soit 2500 - 3500 kg/m³).",
    en: "The specific gravity of cement is unrealistic (must be between 2.5 and 3.5, i.e., 2500 to 3500 kg/m³)."
  },
  "نسبة رطوبة الرمل (Sand Moisture) غير منطقية (يجب أن تقع بين 0٪ و 20٪).": {
    ar: "نسبة رطوبة الرمل (Sand Moisture) غير منطقية (يجب أن تقع بين 0٪ و 20٪).",
    fr: "La teneur en eau (humidité) du sable est hors limites (doit être comprise entre 0% et 20%).",
    en: "The moisture content of sand is out of bounds (must be between 0% and 20%)."
  },
  "نسبة رطوبة الحصى (Gravel Moisture) غير منطقية (يجب أن تقع بين 0٪ و 20٪).": {
    ar: "نسبة رطوبة الحصى (Gravel Moisture) غير منطقية (يجب أن تقع بين 0٪ و 20٪).",
    fr: "La teneur en eau (humidité) du gravier est hors limites (doit être comprise entre 0% et 20%).",
    en: "The moisture content of gravel is out of bounds (must be between 0% and 20%)."
  },
  "نسبة امتصاص الرمل للماء (Sand Absorption) يجب أن تقع بين 0٪ و 10٪.": {
    ar: "نسبة امتصاص الرمل للماء (Sand Absorption) يجب أن تقع بين 0٪ و 10٪.",
    fr: "Le taux d'absorption d'eau du sable doit être compris entre 0% et 10%.",
    en: "Water absorption rate of concrete sand must be between 0% and 10%."
  },
  "نسبة امتصاص الحصى للماء (Gravel Absorption) يجب أن تقع بين 0٪ و 10٪.": {
    ar: "نسبة امتصاص الحصى للماء (Gravel Absorption) يجب أن تقع بين 0٪ و 10٪.",
    fr: "Le taux d'absorption d'eau du gravier doit être compris entre 0% et 10%.",
    en: "Water absorption rate of concrete gravel must be between 0% and 10%."
  },
  "جرعة المدن الفائق (Superplasticizer Dosage) يجب أن تتراوح بين 0٪ و 5٪ من وزن الإسمنت.": {
    ar: "جرعة المدن الفائق (Superplasticizer Dosage) يجب أن تتراوح بين 0٪ و 5٪ من وزن الإسمنت.",
    fr: "Le dosage en superplastifiant doit être compris entre 0% et 5% du poids du ciment.",
    en: "The dosage of superplasticizer must be between 0% and 5% of cement weight."
  },
  "نسبة الإضافات المعدنية SCM الإجمالية تجاوزت الحد الأقصى المنطقي (80٪ من وزن الإسمنت).": {
    ar: "نسبة الإضافات المعدنية SCM الإجمالية تجاوزت الحد الأقصى المنطقي (80٪ من وزن الإسمنت).",
    fr: "Le taux global de cendres/fumées/laitier (SCM) dépasse la limite rationnelle de 80%.",
    en: "The total cement replacement percentage (SCM) exceeds the physical maximum limit of 80%."
  },
  "هذا الرابط الخاص لن يغيّر الحسابات رقمياً حتى يتم تحديد نسبة الاستبدال.": {
    ar: "هذا الرابط الخاص لن يغيّر الحسابات رقمياً حتى يتم تحديد نسبة الاستبدال.",
    fr: "Ce liant spécial ne changera pas les calculs numériquement tant que le pourcentage de substitution n'est pas spécifié.",
    en: "This special binder will not numerically alter calculations until the replacement percentage is specified."
  }
};

const translateList = (arr: string[], lang: "ar" | "fr" | "en") => {
  return arr.map(msg => {
    const match = INPUT_MESSAGES_MAP[msg];
    if (match) {
      return match[lang];
    }
    return msg;
  });
};

export function validateMixInputs(input: any, language: "ar" | "fr" | "en" = "ar"): InputValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Concrete volume (if specified, e.g. batchVolume)
  if (input.batchVolume !== undefined && input.batchVolume <= 0) {
    errors.push("حجم الصب (Concrete Volume) يجب أن يكون أكبر من الصفر.");
  }

  // 2. Target strength (fck28)
  if (input.fck28 === undefined || input.fck28 <= 0) {
    errors.push("مقاومة الضغط المميزة للخرسانة (fck28) يجب أن تكون أكبر من الصفر.");
  } else if (input.fck28 < 5 || input.fck28 > 150) {
    errors.push("مقاومة الضغط المميزة fck28 المطلوبة يجب أن تقع بين 5 و 150 ميجاباسكال.");
  }

  // 2b. Aggregate size Dmax
  if (input.dMax !== undefined && (input.dMax < 2 || input.dMax > 150)) {
    errors.push("حجم الركام الأقصى Dmax غير مقبول هندسياً (يجب أن يكون بين 2 و 150 مم).");
  }

  // 3. Slump
  if (input.slump === undefined || input.slump < 0 || input.slump > 40) {
    errors.push("قيمة الهبوط Slump يجب أن تكون بين 0 و 40 سم.");
  }

  // 4. Air Content
  if (input.airContent !== undefined) {
    if (input.airContent < 0 || input.airContent > 10) {
      errors.push("نسبة الهواء المدمج (Air Content) يجب أن تكون بين 0٪ و 10٪.");
    }
  }

  // 5. Aggregate Relative Densities
  const sandSG = input.sandRelativeDensity;
  const gravelSG = input.gravelRelativeDensity;
  
  if (sandSG !== undefined) {
    const normalizedSandSG = sandSG > 10 ? sandSG / 1000 : sandSG;
    if (normalizedSandSG <= 1.5 || normalizedSandSG > 3.5) {
      errors.push("الكثافة النوعية للرمال للرمل (Sand Specific Gravity) غير منطقية هندسياً (يجب أن تقع بين 1.5 و 3.5).");
    }
  }
  
  if (gravelSG !== undefined) {
    const normalizedGravelSG = gravelSG > 10 ? gravelSG / 1000 : gravelSG;
    if (normalizedGravelSG <= 1.5 || normalizedGravelSG > 3.5) {
      errors.push("الكثافة النوعية للحصى (Gravel Specific Gravity) غير منطقية هندسياً (يجب أن تقع بين 1.5 و 3.5).");
    }
  }

  // 6. Cement Density
  const cementDens = input.cementDensity;
  if (cementDens !== undefined) {
    const normalizedCementSG = cementDens > 10 ? cementDens / 1000 : cementDens;
    if (normalizedCementSG <= 2.5 || normalizedCementSG > 3.5) {
      errors.push("الكثافة المطلقة للإسمنت (Cement Specific Gravity) غير منطقية (يجب أن تقع بين 2.5 و 3.5، أي 2500 - 3500 كجم/م³).");
    }
  }

  // 7. Moisture contents
  const mSand = input.moistureSand !== undefined ? input.moistureSand : 0;
  const mGravel = input.moistureGravel !== undefined ? input.moistureGravel : 0;
  
  if (mSand < 0 || mSand > 20) {
    errors.push("نسبة رطوبة الرمل (Sand Moisture) غير منطقية (يجب أن تقع بين 0٪ و 20٪).");
  }
  if (mGravel < 0 || mGravel > 20) {
    errors.push("نسبة رطوبة الحصى (Gravel Moisture) غير منطقية (يجب أن تقع بين 0٪ و 20٪).");
  }

  // 8. Absorption contents
  const absSand = input.sandAbsorption !== undefined ? input.sandAbsorption : 0;
  const absGravel = input.gravelAbsorption !== undefined ? input.gravelAbsorption : 0;
  
  if (absSand < 0 || absSand > 10) {
    errors.push("نسبة امتصاص الرمل للماء (Sand Absorption) يجب أن تقع بين 0٪ و 10٪.");
  }
  if (absGravel < 0 || absGravel > 10) {
    errors.push("نسبة امتصاص الحصى للماء (Gravel Absorption) يجب أن تقع بين 0٪ و 10٪.");
  }

  // 9. Superplasticizer dosage
  const dsSuper = input.dosageSuper !== undefined ? input.dosageSuper : 0;
  if (dsSuper < 0 || dsSuper > 5) {
    errors.push("جرعة المدن الفائق (Superplasticizer Dosage) يجب أن تتراوح بين 0٪ و 5٪ من وزن الإسمنت.");
  }

  // 10. SCM total percentage
  const sf = input.dosageSilicaFume !== undefined ? input.dosageSilicaFume : 0;
  const fa = input.dosageFlyAsh !== undefined ? input.dosageFlyAsh : 0;
  const sl = input.dosageSlag !== undefined ? input.dosageSlag : 0;
  const totalSCMPercent = sf + fa + sl;
  
  if (totalSCMPercent > 80) {
    errors.push("نسبة الإضافات المعدنية SCM الإجمالية تجاوزت الحد الأقصى المنطقي (80٪ من وزن الإسمنت).");
  }

  // 11. Special Binder warning
  if (input.selectedSpecialBinderId && (input.specialBinderReplacementPercent === undefined || input.specialBinderReplacementPercent === null || input.specialBinderReplacementPercent <= 0)) {
    warnings.push("هذا الرابط الخاص لن يغيّر الحسابات رقمياً حتى يتم تحديد نسبة الاستبدال.");
  }

  const valid = errors.length === 0;

  return {
    valid,
    errors: translateList(errors, language),
    warnings: translateList(warnings, language)
  };
}
