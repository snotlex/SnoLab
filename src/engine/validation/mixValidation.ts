import { MixValidationResult, CheckResult, ValidationMessage, ValidationStatus } from "./types";
import { EN206_EXPOSURE_RULES } from "./en206Rules";
import {
  isFiniteNumber,
  makeMessage,
  makeCheckResult,
  combineStatus,
  computeScore,
  approximatelyEqual,
  extractNumericResult
} from "./validationUtils";

export function validateMixDesign(input: any, result: any): MixValidationResult {
  const errors: ValidationMessage[] = [];
  const warnings: ValidationMessage[] = [];
  const infos: ValidationMessage[] = [];
  const recommendations: string[] = [];

  // Helper arrays for checks status
  const statuses: ValidationStatus[] = [];

  // ---------------------------------------------------------------------------
  // A. Volume Closure Check
  // ---------------------------------------------------------------------------
  // total volume = cementVolume + silicaVolume + flyAshVolume + slagVolume + water + activeAirVolume + sandVolume + gravelVolume + admixVolume
  // In the core: input has airContent (%). 1% air = 10 L.
  // Let's compute actual total volume from the result.
  const cementKg = result.cementKg || result.cementWeight || 0;
  const cementDensity = input.cementDensity || 3105;
  const cDensityL = cementDensity > 100 ? cementDensity / 1000 : cementDensity;
  const cementVolL = cementKg / cDensityL;

  // SCM weights - retrieve directly from explicit result fields if available, otherwise calculate using fallback
  const cleanNum = (val: any) => (typeof val === "number" && isFinite(val) && !isNaN(val) ? val : 0);
  const flyAshKg = cleanNum(typeof result.flyAshKg === "number" ? result.flyAshKg : 
                   (input.dosageFlyAsh && (result.cementWeight || result.cementKg) ? ((result.cementWeight || result.cementKg) * (input.dosageFlyAsh / 100)) : 0));
  const slagKg = cleanNum(typeof result.slagKg === "number" ? result.slagKg : 
                 (input.dosageSlag && (result.cementWeight || result.cementKg) ? ((result.cementWeight || result.cementKg) * (input.dosageSlag / 100)) : 0));
  const silicaFumeKg = cleanNum(typeof result.silicaFumeKg === "number" ? result.silicaFumeKg : 
                       (input.dosageSilicaFume && (result.cementWeight || result.cementKg) ? ((result.cementWeight || result.cementKg) * (input.dosageSilicaFume / 100)) : 0));

  const flyAshVolL = flyAshKg / 2.2;
  const slagVolL = slagKg / 2.9;
  const silicaVolL = silicaFumeKg / 2.2;

  const waterVolL = result.waterKg || result.waterContentActual || 0;
  const airVolL = (input.airContent || 0) * 10;

  const sandKg = result.fineAggregateKg || result.sandWeightDry || 0;
  const gravelKg = result.coarseAggregateKg || result.gravelWeightDry || 0;
  const sandDensity = input.sandRelativeDensity || 2.65;
  const sDensityL = sandDensity > 10 ? sandDensity / 1000 : sandDensity;
  const gravelDensity = input.gravelRelativeDensity || 2.68;
  const gDensityL = gravelDensity > 10 ? gravelDensity / 1000 : gravelDensity;

  const sandVolL = sandKg / sDensityL;
  const gravelVolL = gravelKg / gDensityL;

  // Admixtures volume
  const admixWeightsTotal = result.admixtureKg || 0;
  const admixVolL = admixWeightsTotal / 1.15;

  const totalCalculatedVolume = cementVolL + flyAshVolL + slagVolL + silicaVolL + waterVolL + airVolL + sandVolL + gravelVolL + admixVolL;
  const deviation = totalCalculatedVolume - 1000;
  const absDeviation = Math.abs(deviation);

  let volStatus: ValidationStatus = "valid";
  const volMsgs: ValidationMessage[] = [];

  if (absDeviation > 0.5) {
    volStatus = "invalid";
    const msg = makeMessage(
      "VOL_ERR",
      "error",
      `الانحراف الحجمي (${absDeviation.toFixed(2)} لتر) تجاوز الهامش المقبول (±0.5 لتر/م³). الحجم الإجمالي المحسوب هو ${totalCalculatedVolume.toFixed(2)} لتر.`,
      { 
        value: totalCalculatedVolume.toFixed(1), 
        limit: "1000 ± 0.5", 
        unit: "L/m³",
        messageEn: `Absolute volume closure failed. The calculated component volumes do not close to 1.000 m³ within the configured tolerance (calculated volume is ${totalCalculatedVolume.toFixed(2)} L/m³, deviation of ${deviation.toFixed(2)} L).`,
        messageFr: `L'écart de fermeture de volume absolu a échoué. Les volumes calculés ne bouclent pas à 1,000 m³ dans la tolérance configurée (volume calculé : ${totalCalculatedVolume.toFixed(2)} L/m³, écart de ${deviation.toFixed(2)} L).`
      }
    );
    volMsgs.push(msg);
    errors.push(msg);
  } else if (absDeviation > 0.2) {
    volStatus = "warning";
    const msg = makeMessage(
      "VOL_WAR",
      "warning",
      `انحراف حجمي طفيف (${absDeviation.toFixed(2)} لتر) يرجى التأكد من استقرار القوانين الرياضية لجمع الركامات.`,
      { 
        value: totalCalculatedVolume.toFixed(2), 
        limit: "1000 ± 0.2", 
        unit: "L/m³",
        messageEn: `Slight absolute volume closure deviation (${absDeviation.toFixed(2)} L). Please ensure packing curve coordinates are fully stabilized.`,
        messageFr: `Légère déviation de fermeture volumétrique (${absDeviation.toFixed(2)} L). Veuillez vérifier la stabilité des courbes de mélange.`
      }
    );
    volMsgs.push(msg);
    warnings.push(msg);
  } else {
    volMsgs.push(makeMessage("VOL_OK", "info", `الإغلاق الحجمي ممتاز ومثالي: ${totalCalculatedVolume.toFixed(2)} لتر/م³.`, {
      messageEn: `Excellent volume closure: ${totalCalculatedVolume.toFixed(2)} L/m³.`,
      messageFr: `Fermeture volumétrique excellente : ${totalCalculatedVolume.toFixed(2)} L/m³.`
    }));
  }
  statuses.push(volStatus);
  const volumeClosureCheck = makeCheckResult("volumeClosure", "الإغلاق الحجمي (Volume Closure)", volStatus, volMsgs, {
    value: totalCalculatedVolume,
    expected: 1000,
    tolerance: 0.5,
    unit: "L/m³"
  });

  // ---------------------------------------------------------------------------
  // B. Water/Cement Ratio (W/C) or Water/Binder Ratio (W/B)
  // ---------------------------------------------------------------------------
  const wc = result.wcRatio || 0;
  let wcStatus: ValidationStatus = "valid";
  const wcMsgs: ValidationMessage[] = [];

  if (!isFiniteNumber(wc) || wc <= 0) {
    wcStatus = "invalid";
    const msg = makeMessage("WC_ERR_INVALID", "error", `نسبة الماء/الإسمنت (${wc}) غير صالحة أو صفرية.`, {
      messageEn: `The water/cement ratio (${wc}) is invalid or zero.`,
      messageFr: `Le rapport eau/ciment (${wc}) est invalide ou vaut zéro.`
    });
    wcMsgs.push(msg);
    errors.push(msg);
  } else {
    if (wc > 0.65) {
      wcStatus = "warning";
      const msg = makeMessage("WC_WAR_HIGH", "warning", `نسبة الماء/الإسمنت ${wc.toFixed(3)} مرتفعة جداً للخرسانة الإنشائية (يفضل ألا تتجاوز 0.60 لتأمين المقاومة).`, { 
        value: wc, 
        limit: 0.65,
        messageEn: `The water/cement ratio (${wc.toFixed(3)}) is high for structural concrete (preferably should not exceed 0.60 for durability and strength).`,
        messageFr: `Le rapport eau/ciment (${wc.toFixed(3)}) est élevé pour du béton de structure (il est préférable de ne pas dépasser 0,60 pour la durabilité).`
      });
      wcMsgs.push(msg);
      warnings.push(msg);
      recommendations.push("انصح باستخدام ملدن فائق لخفض كمية المياه الصافية مع المحافظة على الهبوط المطلوب لتقليل W/C.");
    } else if (wc < 0.25) {
      wcStatus = "warning";
      const msg = makeMessage("WC_WAR_LOW", "warning", `نسبة الماء/الإسمنت ${wc.toFixed(3)} منخفضة بشكل كبير. قد تصبح الخرسانة شديدة القساوة وصعبة العمل والصب دون مضافات سائلة عالية الأداء.`, { 
        value: wc, 
        limit: 0.25,
        messageEn: `The water/cement ratio (${wc.toFixed(3)}) is extremely low. The fresh mix will be very stiff and difficult to place without high-performance superplasticizers.`,
        messageFr: `Le rapport eau/ciment (${wc.toFixed(3)}) est extrêmement bas. Le mélange frais sera très ferme et difficile à mettre en œuvre sans superplastifiants hautes performances.`
      });
      wcMsgs.push(msg);
      warnings.push(msg);
    } else if (wc >= 0.35 && wc <= 0.55) {
      wcMsgs.push(makeMessage("WC_INFO_IDEAL", "info", `نسبة W/C مثالية وواقعية جداً لصب المنشآت العادية: ${wc.toFixed(3)}.`, {
        messageEn: `The W/C ratio is optimal and highly realistic for ordinary concrete: ${wc.toFixed(3)}.`,
        messageFr: `Le rapport E/C est optimal et réaliste pour du béton ordinaire : ${wc.toFixed(3)}.`
      }));
    }
  }
  statuses.push(wcStatus);
  const wcRatioCheck = makeCheckResult("wcRatio", "نسبة الماء إلى الإسمنت (W/C)", wcStatus, wcMsgs, {
    value: wc,
    unit: ""
  });

  // ---------------------------------------------------------------------------
  // C. Cement Content Check
  // ---------------------------------------------------------------------------
  // EN 206 uses cumulative binder for replacement in many cases, but let's check cementWeight
  const cementVal = result.cementKg || result.cementWeight || 0;
  let cemStatus: ValidationStatus = "valid";
  const cemMsgs: ValidationMessage[] = [];

  if (cementVal < 200) {
    cemStatus = "invalid";
    const msg = makeMessage("CEM_ERR_L", "error", `كمية الإسمنت (${cementVal.toFixed(1)} كجم/م³) منخفضة للغاية وغير مقبولة لهيكل خرساني مسلح (الحد الأدني المطلق 200 كجم/م³).`, { value: cementVal, limit: 200, unit: "kg/m³" });
    cemMsgs.push(msg);
    errors.push(msg);
  } else if (cementVal < 250) {
    cemStatus = "warning";
    const msg = makeMessage("CEM_WAR_L", "warning", `كمية الإسمنت (${cementVal.toFixed(1)} كجم/م³) منخفضة. معظم الأكواد تشترط 250 كجم/م³ كحد أدنى للمتانة وحماية التسليح.`, { value: cementVal, limit: 250, unit: "kg/m³" });
    cemMsgs.push(msg);
    warnings.push(msg);
    recommendations.push("يفضل زيادة محتوى الإسمنت لضمان متانة الخرسانة ومقاومة الكربنة والصدأ لفولاذ التسليح.");
  } else if (cementVal > 650) {
    cemStatus = "invalid";
    const msg = makeMessage("CEM_ERR_H", "error", `محتوى الإسمنت غير واقعي هندسياً (${cementVal.toFixed(1)} كجم/م³) ويتجاوز الحدود الآمنة للحرارة والتشقق والجدوى الاقتصادية.`, { value: cementVal, limit: 650, unit: "kg/m³" });
    cemMsgs.push(msg);
    errors.push(msg);
  } else if (cementVal > 550) {
    cemStatus = "warning";
    const msg = makeMessage("CEM_WAR_H", "warning", `محتوى الإسمنت مرتفع جداً (${cementVal.toFixed(1)} كجم/م³). خطر الزحف والانكماش ومشاكل حرارة التميه العالية (تشرخ الكتلة).`, { value: cementVal, limit: 550, unit: "kg/m³" });
    cemMsgs.push(msg);
    warnings.push(msg);
    recommendations.push("انصح باستبدال جزء من الإسمنت برماد بركاني أو متطاير (Fly Ash) أو خبث الأفران (Slag) لتخفيض السخونة الذاتية ولأسباب اقتصادية.");
  } else {
    cemMsgs.push(makeMessage("CEM_OK", "info", `محتوى الإسمنت سليم هندسياً: ${cementVal.toFixed(1)} كجم/م³.`));
  }
  statuses.push(cemStatus);
  const cementContentCheck = makeCheckResult("cementContent", "محتوى الإسمنت (Cement Content)", cemStatus, cemMsgs, {
    value: cementVal,
    unit: "kg/m³"
  });

  // ---------------------------------------------------------------------------
  // D. Water Content Check
  // ---------------------------------------------------------------------------
  const waterVal = result.waterKg || result.waterContentActual || 0;
  let watStatus: ValidationStatus = "valid";
  const watMsgs: ValidationMessage[] = [];

  if (waterVal <= 0) {
    watStatus = "invalid";
    const msg = makeMessage("WAT_ERR_Z", "error", `كمية المياه المضافة صفرية أو سالبة!`);
    watMsgs.push(msg);
    errors.push(msg);
  } else if (waterVal < 100) {
    watStatus = "warning";
    const msg = makeMessage("WAT_WAR_L", "warning", `كمية مياه خلط منخفضة جداً (${waterVal.toFixed(1)} لتر). هل تم استخدام ملدنات بنسب عالية؟ قد تصعب عملية الترطيب والخلط المتجانس في الخلاطة.`, { value: waterVal, limit: 100, unit: "L/m³" });
    watMsgs.push(msg);
    warnings.push(msg);
  } else if (waterVal > 230 && waterVal <= 260) {
    watStatus = "warning";
    const msg = makeMessage("WAT_WAR_H", "warning", `كمية مياه الخلط مرتفعة (${waterVal.toFixed(1)} لتر/م³). سيضعف هذا المقاومة ويزيد فراغات وسامية الخرسانة المتصلدة بشكل ملحوظ.`, { value: waterVal, limit: 230, unit: "L/m³" });
    watMsgs.push(msg);
    warnings.push(msg);
    recommendations.push("لتخفيض المياه الزائدة، استعمل الملدنات الكيميائية الفائقة (Superplasticizers) لإنقاص كمية الماء حرصاً على قوة الهيكل ومقاومته للتحلل.");
  } else if (waterVal > 260) {
    watStatus = "invalid";
    const msg = makeMessage("WAT_ERR_H", "error", `كمية مياه الخلط (${waterVal.toFixed(1)} لتر/م³) تتجاوز جميع المعايير المقبولة لخرسانة إنشائية حقيقية. الخلطة ستنفصل حبيباً وتسيل تماماً.`, { value: waterVal, limit: 260, unit: "L/m³" });
    watMsgs.push(msg);
    errors.push(msg);
  } else {
    watMsgs.push(makeMessage("WAT_OK", "info", `كمية مياه الخلط ممتازة وضمن النطاق الموصى به: ${waterVal.toFixed(1)} لتر/م³.`));
  }
  statuses.push(watStatus);
  const waterContentCheck = makeCheckResult("waterContent", "محتوى ماء الخلط (Water Content)", watStatus, watMsgs, {
    value: waterVal,
    unit: "L/m³"
  });

  // ---------------------------------------------------------------------------
  // E. Fresh Density Check
  // ---------------------------------------------------------------------------
  const densityVal = result.totalFreshDensity || result.freshDensityKgM3 || 0;
  let denStatus: ValidationStatus = "valid";
  const denMsgs: ValidationMessage[] = [];

  const isSpecialConcrete = typeof input.concreteType === "string" &&
    ["LWC", "HWC", "PERVIOUS", "UHPC", "BFUP"].includes(input.concreteType);

  if (densityVal < 1900 || densityVal > 2800) {
    if (isSpecialConcrete) {
      denStatus = "warning";
      const msg = makeMessage("DEN_WAR_SPEC_OUT", "warning", `الكثافة الطازجة (${densityVal.toFixed(1)} كجم/م³) خارج النطاق القياسي للخرسانة العادية، لكن هذا متوقع لخلطة من الصنف الخاص (${input.concreteType}).`);
      denMsgs.push(msg);
      warnings.push(msg);
    } else {
      denStatus = "invalid";
      const msg = makeMessage("DEN_ERR_OUT", "error", `الكثافة الطازجة الناتجة (${densityVal.toFixed(1)} كجم/م³) غير معقولة هندسياً للخرسانة العادية. يرجى مراجعة الكثافات النوعية للرمل والحصى والإسمنت.`, { value: densityVal, limit: "1900 - 2800", unit: "kg/m³" });
      denMsgs.push(msg);
      errors.push(msg);
    }
  } else if (densityVal < 2100 || densityVal > 2600) {
    denStatus = "warning";
    const msg = makeMessage("DEN_WAR_OUT", "warning", `الكثافة الطازجة (${densityVal.toFixed(1)} كجم/م³) غير مألوفة وعادية (المجال الطبيعي 2200-2500 كجم/م³).`, { value: densityVal, limit: "2100 - 2600", unit: "kg/m³" });
    denMsgs.push(msg);
    warnings.push(msg);
  } else {
    denMsgs.push(makeMessage("DEN_OK", "info", `الكثافة الطازجة مثالية ومطابقة للخرسانة العادية: ${densityVal.toFixed(1)} كجم/م³.`));
  }
  statuses.push(denStatus);
  const freshDensityCheck = makeCheckResult("freshDensity", "الكثافة الطازجة للخرسانة (Fresh Density)", denStatus, denMsgs, {
    value: densityVal,
    unit: "kg/m³"
  });

  // ---------------------------------------------------------------------------
  // F. Aggregate Moisture Check
  // ---------------------------------------------------------------------------
  // input has: moistureSand, moistureGravel, sandAbsorption, gravelAbsorption, and corrected waterWeightWet (result.waterWeightWet)
  const mSand = input.moistureSand !== undefined ? input.moistureSand : 0;
  const mGravel = input.moistureGravel !== undefined ? input.moistureGravel : 0;
  const absSand = input.sandAbsorption !== undefined ? input.sandAbsorption : 1.5;
  const absGravel = input.gravelAbsorption !== undefined ? input.gravelAbsorption : 0.8;
  const correctedWater = result.waterWeightWet !== undefined ? result.waterWeightWet : result.waterContentActual;

  let moistStatus: ValidationStatus = "valid";
  const moistMsgs: ValidationMessage[] = [];

  const sandFreeSurfaceWater = sandKg * Math.max(0, mSand - absSand) / 100;
  const gravelFreeSurfaceWater = gravelKg * Math.max(0, mGravel - absGravel) / 100;
  const totalFreeSurfaceWater = sandFreeSurfaceWater + gravelFreeSurfaceWater;

  const sandAbsorptionDeficit = mSand < absSand ? sandKg * (absSand - mSand) / 100 : 0;
  const gravelAbsorptionDeficit = mGravel < absGravel ? gravelKg * (absGravel - mGravel) / 100 : 0;
  const totalAbsorptionDeficit = sandAbsorptionDeficit + gravelAbsorptionDeficit;

  const rawWaterToAdd = waterVolL - totalFreeSurfaceWater + totalAbsorptionDeficit;

  if (mSand < 0 || mGravel < 0 || absSand < 0 || absGravel < 0) {
    moistStatus = "invalid";
    const msg = makeMessage("MOIST_ERR_NEG", "error", `نسب رطوبة أو امتصاص الركامات سالبة! هذه قيمة فيزيائية خاطئة.`, {
      messageEn: "Aggregate moisture or absorption percentages are negative! This is a physically invalid value.",
      messageFr: "Les taux d'humidité ou d'absorption des granulats sont négatifs ! C'est une valeur physiquement invalide."
    });
    moistMsgs.push(msg);
    errors.push(msg);
  } else if (rawWaterToAdd < 0) {
    moistStatus = "invalid";
    const msg = makeMessage("MOIST_ERR_WATER_NEG", "error", `ماء الخلاطة الصافي المصحح سالباً (${rawWaterToAdd.toFixed(1)} لتر). الرطوبة الحرة للركامات تجاوزت ماء خلط التصميم الكلي!`, {
      value: rawWaterToAdd.toFixed(1),
      limit: "0",
      unit: "L/m³",
      messageEn: `The calculated batch water to add is negative (${rawWaterToAdd.toFixed(1)} L). Free aggregate surface moisture exceeds the design mixing water requirement!`,
      messageFr: `L'eau de gâchée calculée est négative (${rawWaterToAdd.toFixed(1)} L). L'humidité libre des granulats dépasse l'exigence d'eau de mélange nominale !`
    });
    moistMsgs.push(msg);
    errors.push(msg);
  } else if (correctedWater < 50) {
    moistStatus = "warning";
    const msg = makeMessage("MOIST_WAR_WATER_LOW", "warning", `ماء الخلاطة الصافي المصحح المضاف منخفض جداً (${correctedWater.toFixed(1)} لتر). الرمل والحصى رطبان بشدة لدرجة تزويد كامل مياه الخلط تقريباً. الحذر مطلوب من رطوبة غير متوافقة في الساحة.`, { value: correctedWater, limit: 50, unit: "L/m³" });
    moistMsgs.push(msg);
    warnings.push(msg);
  } else {
    if (mSand > 15) {
      moistStatus = "warning";
      const msg = makeMessage("MOIST_WAR_SAND_HIGH", "warning", `رطوبة الرمل مرتفعة جداً (${mSand}%). قد تسبب صعوبة إمساك وتغيرات مفاجئة بنسب الخلط.`, { value: mSand, limit: 15, unit: "%" });
      moistMsgs.push(msg);
      warnings.push(msg);
    }
    if (mGravel > 8) {
      moistStatus = "warning";
      const msg = makeMessage("MOIST_WAR_GRAV_HIGH", "warning", `رطوبة الحصى مرتفعة جداً (${mGravel}%). قد يحبس الركام ماء إضافي يفسد السيطرة على قوام الخلطة.`, { value: mGravel, limit: 8, unit: "%" });
      moistMsgs.push(msg);
      warnings.push(msg);
    }

    if (moistStatus === "valid") {
      moistMsgs.push(makeMessage("MOIST_OK", "info", "رطوبة الركام وامتصاصه تقع ضمن الحدود الآمنة الطبيعية لمواقع العمل والورشات الجافة والرطبة."));
    }
  }

  // SSD matching log
  if (mSand > absSand) {
    moistMsgs.push(makeMessage("SSD_SAND_SUB", "info", `الرمل يحتوي على رطوبة حرة أكبر من الامتصاص، لذا تم إنقاص ماء الخلط الفعلي بمقدار ${(sandKg * (mSand - absSand) / 100).toFixed(1)} لتر لتأمين متطلبات SSD.`));
  } else if (mSand < absSand) {
    moistMsgs.push(makeMessage("SSD_SAND_ADD", "info", `الرمل جاف ويتعطش للامتصاص، لذا تم زيادة ماء الخلط بمقدار ${(sandKg * (absSand - mSand) / 100).toFixed(1)} لتر لتعويض مياه التميؤ المحبوسة للترطيب.`));
  }

  statuses.push(moistStatus);
  const aggregateMoistureCheck = makeCheckResult("aggregateMoisture", "رطوبة الركام وتصحيح SSD (Aggregate Moisture)", moistStatus, moistMsgs, {
    value: correctedWater,
    unit: "L/m³"
  });

  // ---------------------------------------------------------------------------
  // G. Admixture Dosage Check
  // ---------------------------------------------------------------------------
  const superDosage = input.dosageSuper !== undefined ? input.dosageSuper : 0;
  let admStatus: ValidationStatus = "valid";
  const admMsgs: ValidationMessage[] = [];

  if (superDosage < 0) {
    admStatus = "invalid";
    const msg = makeMessage("ADM_ERR_NEG", "error", `جرعة الملدن الكيميائي سالبة.`);
    admMsgs.push(msg);
    errors.push(msg);
  } else if (superDosage > 5) {
    admStatus = "invalid";
    const msg = makeMessage("ADM_ERR_EXTREME", "error", `جرعة الملدن الفائق (${superDosage}%) تتجاوز الحد الأقصى المطلق (5% من وزن الرابط). الخرسانة ستتعرض لتأخير هائل بالشك والترابط وضعف حاد بالمقاومة ومشاكل نزف ثقيلة.`, { value: superDosage, limit: 5, unit: "%" });
    admMsgs.push(msg);
    errors.push(msg);
  } else if (superDosage > 3) {
    admStatus = "warning";
    const msg = makeMessage("ADM_WAR_HIGH", "warning", `جرعة الملدن الفائق مرتفعة (${superDosage}%). تجاوزت الفئة الموصى بها اعتيادياً (أكبر من 3%). قد تسبب بطء الشك والتصلب المبكر.`, { value: superDosage, limit: 3, unit: "%" });
    admMsgs.push(msg);
    warnings.push(msg);
    recommendations.push("راجع المواصفات الفنية للشركة الصانعة للملدن الفائق للمجال الآمن قبل خلط النسب.");
  } else if (superDosage > 0) {
    admMsgs.push(makeMessage("ADM_OK", "info", `جرعة الملدن تقع في النطاق الفعال والآمن للتشغيل: ${superDosage}%.`));
  } else {
    admMsgs.push(makeMessage("ADM_NONE", "info", "لم يتم استخدام ملدنات كيميائية فائقة، دمج الرطوبة والصب يعتمد تماماً على ماء الخلاطة الصافي."));
  }
  statuses.push(admStatus);
  const admixtureDosageCheck = makeCheckResult("admixtureDosage", "جرعة الملدنات الكيميائية (Admixture Dosage)", admStatus, admMsgs, {
    value: superDosage,
    unit: "%"
  });

  // ---------------------------------------------------------------------------
  // H. Workability (Slump) Check
  // ---------------------------------------------------------------------------
  const slumpVal = input.slump; // in cm
  let slumpStatus: ValidationStatus = "valid";
  const slumpMsgs: ValidationMessage[] = [];

  if (!isFiniteNumber(slumpVal) || slumpVal < 0 || slumpVal > 40) {
    slumpStatus = "warning";
    const msg = makeMessage("SLUMP_WAR_OUT", "warning", `قيمة هبوط مخروط هبوط أبرامز غير طبيعية أو خارج المجالات القياسية هندسياً لخرسانة البناء.`);
    slumpMsgs.push(msg);
    warnings.push(msg);
  } else {
    // slump in cm. 20 mm is 2 cm, 220 mm is 22 cm.
    if (slumpVal < 2) {
      slumpStatus = "warning";
      const msg = makeMessage("SLUMP_WAR_LOW", "warning", `الهبوط ضئيل جداً (${slumpVal} سم - خرسانة شديدة الجفاف والجساوة). صعبة الحركة وبحاجة ماسة لرص واهتزاز مكثف بالورشة.`, { value: slumpVal, limit: 2, unit: "cm" });
      slumpMsgs.push(msg);
      warnings.push(msg);
      recommendations.push("انصح باستخدام هزازات ميكانيكية وصب بضغط عالي، أو تزويد الخلطة بملدن فائق لتحويل القوام إلى لدن قابل للضخ.");
    } else if (slumpVal > 22) {
      slumpStatus = "warning";
      const msg = makeMessage("SLUMP_WAR_HIGH", "warning", `الهبوط مرتفع جداً (${slumpVal} سم). خطر حاد للانفصال الحبيبي ونزف ماء المعجون وتراكم الركامات بالأسفل. الخرسانة تفقد تماسكها وسلاستها.`, { value: slumpVal, limit: 22, unit: "cm" });
      slumpMsgs.push(msg);
      warnings.push(msg);
    } else if (slumpVal > 15 && wc > 0.55) {
      slumpStatus = "warning";
      const msg = makeMessage("SLUMP_WC_RISK", "warning", `دمج سلبي بين قوام هادئ سائل جداً (${slumpVal} سم) ومعدل ماء مرتفع (W/C > 0.55). هذا ينذر بصدق بخطر حدوث نزف ماء غزير وانفصال فظيع للركام الخشن.`);
      slumpMsgs.push(msg);
      warnings.push(msg);
      recommendations.push("اخفض نسبة الماء فوراً واستعن بالملدن الكيميائي لامتلاك تشغيل ممتاز ومنع النزف والانفصال الحبيبي.");
    } else {
      slumpMsgs.push(makeMessage("SLUMP_OK", "info", `تناسق وقوام الخرسانة ممتاز: هبوط ${slumpVal} سم (قوام لدن/سلس مناسب للصب العام والضخ).`));
    }
  }
  statuses.push(slumpStatus);
  const workabilityCheck = makeCheckResult("workability", "تشغيلية وقوام الخرسانة (Workability & Slump)", slumpStatus, slumpMsgs, {
    value: slumpVal,
    unit: "cm"
  });

  // ---------------------------------------------------------------------------
  // I. Exposure Class conforming EN 206 Check
  // ---------------------------------------------------------------------------
  const expClass = input.exposureClass || "X0";
  let expStatus: ValidationStatus = "valid";
  const expMsgs: ValidationMessage[] = [];

  const expRule = EN206_EXPOSURE_RULES[expClass];
  if (!expRule) {
    expStatus = "warning";
    const msg = makeMessage("EXP_WAR_UNKNOWN", "warning", `فئة التعرض للمحيط والتآكل (${expClass}) غير معرفة أو غير مسجلة بالجداول الأساسية لـ EN 206. تم تفعيل شروط عامة.`, {
      messageEn: `The exposure class (${expClass}) is unknown or not defined in the EN 206 tables. Generic settings have been applied.`,
      messageFr: `La classe d'exposition (${expClass}) est inconnue ou non définie dans les tables de la norme EN 206. Des paramètres génériques ont été appliqués.`
    });
    expMsgs.push(msg);
    warnings.push(msg);
  } else {
    expMsgs.push(makeMessage("EXP_INFO", "info", `فئة التعرض المختارة: ${expClass} - ${expRule.notesAr}`, {
      messageEn: `Selected exposure class: ${expClass} - ${expRule.notesEn}`,
      messageFr: `Classe d'exposition sélectionnée : ${expClass} - ${expRule.notesFr}`
    }));

    // Check maximum Water/Cement or Water/Binder ratio
    const limitMaxWc = expRule.maxWcRatio;
    if (limitMaxWc !== undefined) {
      if (wc > limitMaxWc) {
        expStatus = "invalid";
        const msg = makeMessage(
          "EXP_ERR_WC",
          "error",
          `نسبة W/C الفعلية (${wc.toFixed(3)}) تتجاوز الحد الأقصى المطلوب للمقاومة والمتانة طبقاً لـ EN 206 لفئة التعرض ${expClass} (الحد المسموح ≤ ${limitMaxWc.toFixed(2)}).`,
          { 
            value: wc.toFixed(3), 
            limit: limitMaxWc, 
            unit: "",
            messageEn: `The actual W/C ratio (${wc.toFixed(3)}) exceeds the EN 206 maximum requirement of ${limitMaxWc.toFixed(2)} for exposure class ${expClass}.`,
            messageFr: `Le rapport E/C réel (${wc.toFixed(3)}) dépasse l'exigence maximale de la norme EN 206 de ${limitMaxWc.toFixed(2)} pour la classe d'exposition ${expClass}.`
          }
        );
        expMsgs.push(msg);
        errors.push(msg);
        recommendations.push(`لتحقيق المتانة وضمان عمر الخدمة الهيكلي لـ ${expClass}، يجب إنقاص نسبة W/C لتصبح أقل من ${limitMaxWc}. استعن بالملدنات لخفض المياه حرصاً على القبول.`);
      } else {
        expMsgs.push(makeMessage("EXP_OK_WC", "info", `نسبة W/C الفعلية (${wc.toFixed(3)}) مطابقة وفي الحدود المطلوبة للمتانة لـ ${expClass} (أقل من ${limitMaxWc.toFixed(2)}).`, {
          messageEn: `The actual W/C ratio (${wc.toFixed(3)}) is compliant with EN 206 durability requirements for ${expClass} (≤ ${limitMaxWc.toFixed(2)}).`,
          messageFr: `Le rapport E/C réel (${wc.toFixed(3)}) est conforme aux exigences de durabilité de la norme EN 206 pour ${expClass} (≤ ${limitMaxWc.toFixed(2)}).`
        }));
      }
    }

    // Check minimum Cement or Binder content
    const limitMinCem = expRule.minCementKgM3;
    if (limitMinCem !== undefined) {
      if (cementVal < limitMinCem) {
        // EN 206 rule is fatal
        expStatus = "invalid";
        const msg = makeMessage(
          "EXP_ERR_CEM",
          "error",
          `محتوى الإسمنت (${cementVal.toFixed(1)} كجم) يقل عن الحد الأدنى الصارم للمتانة لـ EN 206 للفئة ${expClass} (مطلوب لا يقل عن ${limitMinCem} كجم/م³).`,
          { 
            value: cementVal, 
            limit: limitMinCem, 
            unit: "kg/m³",
            messageEn: `The calculated cement content (${cementVal.toFixed(1)} kg/m³) is below the EN 206 strict minimum durability limit of ${limitMinCem} kg/m³ for class ${expClass}.`,
            messageFr: `Le dosage en ciment (${cementVal.toFixed(1)} kg/m³) est inférieur à la limite minimale stricte de durabilité de la norme EN 206 de ${limitMinCem} kg/m³ pour la classe ${expClass}.`
          }
        );
        expMsgs.push(msg);
        errors.push(msg);
        recommendations.push(`ارفع كمية الإسمنت بالخلطة لتتجاوز ${limitMinCem} كجم/م³ لتوفير مصل المانح لقلويات الأسمنت لحماية فولاذ التسليح من الصدأ المستحث بفئة التعرض ${expClass}.`);
      } else {
        expMsgs.push(makeMessage("EXP_OK_CEM", "info", `كمية الإسمنت (${cementVal.toFixed(1)} كجم) مطابقة تماماً لشروط متانة الكود لكلاس ${expClass} (حد أدنى ${limitMinCem} كجم).`, {
          messageEn: `The cement content (${cementVal.toFixed(1)} kg/m³) is compliant with EN 206 durability limits for ${expClass} (≥ ${limitMinCem} kg/m³).`,
          messageFr: `Le dosage en ciment (${cementVal.toFixed(1)} kg/m³) est conforme aux limites de durabilité de la norme EN 206 pour ${expClass} (≥ ${limitMinCem} kg/m³).`
        }));
      }
    }

    // Check strength class
    const minFck = expRule.minFck;
    const actualFck = input.fck28 || 0;
    if (minFck !== undefined && actualFck > 0) {
      if (actualFck < minFck) {
        expStatus = "invalid";
        const msg = makeMessage(
          "EXP_ERR_STR",
          "error",
          `المقاومة المميزة المدخلة fck = ${actualFck} MPa أقل من رتبة الخرسانة المطلوبة لمقاومة كلاس التعرض للبيئة ${expClass} (مطلوب على الأقل ${minFck} MPa - الفئة ${expRule.minStrengthClass}).`,
          { 
            value: `C${actualFck}`, 
            limit: expRule.minStrengthClass,
            messageEn: `The characteristic compressive strength (fck = ${actualFck} MPa) is below the minimum required class of ${expRule.minStrengthClass} (${minFck} MPa) for exposure class ${expClass}.`,
            messageFr: `La résistance caractéristique (fck = ${actualFck} MPa) est inférieure à la classe minimale requise de ${expRule.minStrengthClass} (${minFck} MPa) pour la classe d'exposition ${expClass}.`
          }
        );
        expMsgs.push(msg);
        errors.push(msg);
        recommendations.push(`يجب رفع رتبة الخرسانة المدخلة fck إلى ${minFck} MPa على الأقل لتطابق متطلبات فئة التعرض ${expClass}.`);
      } else {
        expMsgs.push(makeMessage("EXP_OK_STR", "info", `المقاومة المميزة المدخلة fck = ${actualFck} MPa تحقق أو تتجاوز الحد الأدنى المطلوب لكلاس ${expClass} (${minFck} MPa).`, {
          messageEn: `The characteristic compressive strength (fck = ${actualFck} MPa) meets or exceeds the EN 206 required minimum of ${minFck} MPa for class ${expClass}.`,
          messageFr: `La résistance caractéristique (fck = ${actualFck} MPa) respecte ou dépasse le minimum requis par la norme EN 206 de ${minFck} MPa pour la classe ${expClass}.`
        }));
      }
    }
  }
  statuses.push(expStatus);
  const exposureClassCheck = makeCheckResult("exposureClass", "فئة التعرض والمتانة EN 206 (Exposure Class)", expStatus, expMsgs, {
    value: expClass,
    unit: ""
  });

  // Combine overall status and score
  const overallStatus = combineStatus(statuses);
  const isValidOverall = overallStatus !== "invalid";
  const scoreVal = computeScore(errors.length, warnings.length);

  return {
    valid: isValidOverall,
    status: overallStatus,
    score: scoreVal,
    errors,
    warnings,
    infos,
    recommendations,
    checks: {
      volumeClosure: volumeClosureCheck,
      wcRatio: wcRatioCheck,
      cementContent: cementContentCheck,
      waterContent: waterContentCheck,
      freshDensity: freshDensityCheck,
      aggregateMoisture: aggregateMoistureCheck,
      admixtureDosage: admixtureDosageCheck,
      exposureClass: exposureClassCheck,
      workability: workabilityCheck
    }
  };
}
