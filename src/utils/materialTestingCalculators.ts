import { MaterialTestRecord, ComplianceDetail, TestStatus } from "../types/laboratoryTypes";

// ==========================================
// 1. AGGREGATES CALCULATORS (A)
// ==========================================

export interface SieveRow {
  sieve: number; // mm
  retained: number; // g
  cumRetained?: number; // %
  passing: number; // %
}

export interface SieveAnalysisResult {
  finenessModulus?: number;
  dMax?: number;
  finesContent?: number;
  processedRows: SieveRow[];
  status: TestStatus;
  interpretation: string;
  compliance: ComplianceDetail[];
  dataState?: "missing" | "invalid" | "valid";
}

export function calculateSieveAnalysis(
  totalWeight: number,
  sieves: { sieve: number; retained: number }[],
  materialType: "sand" | "gravel" = "sand"
): SieveAnalysisResult {
  // 1. Missing measurements: No sieve rows provided
  if (!sieves || sieves.length === 0) {
    const missingCompliance: ComplianceDetail[] = [
      {
        parameter: "القطر الأقصى للحبيبات (Dmax)",
        measured: "غير متوفر (بيانات مفقودة)",
        limit: "حسب المخطط والمواصفة الإنشائية",
        status: "FAIL",
        note: "لم يتم تقديم بيانات مناخل"
      },
      {
        parameter: "نسبة المواد الناعمة (<0.063 مم)",
        measured: "غير متوفر (بيانات مفقودة)",
        limit: "≤ 3.0% (رمل مغسول) / ≤ 5.0% (رمل مكسر)",
        status: "FAIL",
        note: "لم يتم تقديم بيانات مناخل"
      }
    ];

    if (materialType === "sand") {
      missingCompliance.unshift({
        parameter: "معامل النعومة (FM)",
        measured: "غير متوفر (بيانات مفقودة)",
        limit: "2.20 - 3.10 (NF EN 12620 / ASTM C33)",
        status: "FAIL",
        note: "لم يتم تقديم بيانات مناخل"
      });
    }

    return {
      finenessModulus: undefined,
      dMax: undefined,
      finesContent: undefined,
      processedRows: [],
      status: "FAIL",
      interpretation: "لا توجد بيانات غربلة مدخلة لإجراء التحليل الحبيبي (NF EN 933-1).",
      compliance: missingCompliance,
      dataState: "missing"
    };
  }

  // 2. Invalid measurements: Negative weights or zero total
  const sumRetained = sieves.reduce((acc, s) => acc + (s.retained || 0), 0);
  const hasNegativeRetained = sieves.some(s => s.retained < 0);
  const actualTotal = totalWeight > 0 ? totalWeight : sumRetained;

  if (totalWeight < 0 || hasNegativeRetained || actualTotal <= 0) {
    return {
      finenessModulus: undefined,
      dMax: undefined,
      finesContent: undefined,
      processedRows: [],
      status: "FAIL",
      interpretation: "بيانات الكتل المدخلة لاختبار الغربلة غير صالحة فيزيائياً (NF EN 933-1).",
      compliance: [{
        parameter: "كتلة العينة والمناخل",
        measured: "غير صالح فيزيائياً",
        limit: "كتل موجبة (NF EN 933-1)",
        status: "FAIL",
        note: "الكتل المدخلة سالبة أو غير منطقية"
      }],
      dataState: "invalid"
    };
  }

  // 3. Valid calculation
  let cumRetWeight = 0;
  const processedRows: SieveRow[] = [];

  sieves.forEach(s => {
    cumRetWeight += s.retained;
    const cumRetPercent = actualTotal > 0 ? (cumRetWeight / actualTotal) * 100 : 0;
    const passPercent = Math.max(0, Math.min(100, 100 - cumRetPercent));
    processedRows.push({
      sieve: s.sieve,
      retained: s.retained,
      cumRetained: parseFloat(cumRetPercent.toFixed(2)),
      passing: parseFloat(passPercent.toFixed(2))
    });
  });

  // Calculate Fineness Modulus (standard sieves: 0.125, 0.25, 0.5, 1.0, 2.0, 4.0)
  let finenessModulus: number | undefined = undefined;
  if (materialType === "sand") {
    const standardFMSieves = [0.125, 0.25, 0.5, 1.0, 2.0, 4.0];
    const matchedRows = standardFMSieves
      .map(sz => processedRows.find(r => Math.abs(r.sieve - sz) < 0.02))
      .filter((r): r is SieveRow => r !== undefined);

    // Standard FM calculation requires adequate sieve coverage (at least 4 standard fractions)
    if (matchedRows.length >= 4) {
      let sumCumRet = 0;
      matchedRows.forEach(row => {
        sumCumRet += (100 - row.passing);
      });
      finenessModulus = parseFloat((sumCumRet / 100).toFixed(2));
    } else {
      finenessModulus = undefined; // Insufficient sieve coverage: do not fabricate 0
    }
  } else {
    finenessModulus = undefined; // Not applicable for coarse aggregates
  }

  // Determine Dmax (smallest sieve aperture with >= 95% passing)
  const sorted = [...processedRows].sort((a, b) => b.sieve - a.sieve);
  const dmaxRow = sorted.find(r => r.passing >= 95);
  const dMax = dmaxRow ? dmaxRow.sieve : undefined; // Undetermined if no sieve has >= 95% passing

  // Fines content (< 0.063 mm / 0.08 mm)
  const finesRow = processedRows.find(r => r.sieve <= 0.08);
  const finesContent = finesRow !== undefined
    ? parseFloat((100 - (finesRow.cumRetained ?? 0)).toFixed(2))
    : undefined; // Undetermined if fines sieve was not tested

  let status: TestStatus = "PASS";
  let interpretation = "";
  const compliance: ComplianceDetail[] = [];

  if (materialType === "sand") {
    if (finenessModulus !== undefined) {
      const isFmGood = finenessModulus >= 2.2 && finenessModulus <= 3.1;
      const isFmWarn = (finenessModulus >= 2.0 && finenessModulus < 2.2) || (finenessModulus > 3.1 && finenessModulus <= 3.4);
      
      compliance.push({
        parameter: "معامل النعومة (FM)",
        measured: finenessModulus,
        limit: "2.20 - 3.10 (NF EN 12620 / ASTM C33)",
        status: isFmGood ? "PASS" : isFmWarn ? "WARNING" : "FAIL",
        note: isFmGood ? "معامل نعومة مثالي لتشغيلية ومقاومة الخرسانة" : isFmWarn ? "رمل ناعم جداً أو خشن نسبياً" : "رمل خارج الحدود القياسية المعتمدة"
      });

      if (!isFmGood) status = isFmWarn ? "WARNING" : "FAIL";
      interpretation = isFmGood 
        ? `رمل مطابق للمواصفات القياسية (NF EN 933-1). معامل النعومة ${finenessModulus} يمنح تجانساً عالياً وقابلية ضخ وتشغيلية ممتازة.`
        : isFmWarn 
        ? `رمل مقبول مع تنبيه (FM = ${finenessModulus}). يُوصى بتعديل نسبة الركام الخشن لتفادي استهلاك إسمنت إضافي.`
        : `رمل غير مطابق للمواصفات (FM = ${finenessModulus}). يتطلب خلطه برمل تصحيحي لتعديل منحنى التدرج الحبيبي.`;
    } else {
      compliance.push({
        parameter: "معامل النعومة (FM)",
        measured: "غير متوفر (تغطية مناخل غير كافية)",
        limit: "2.20 - 3.10 (NF EN 12620 / ASTM C33)",
        status: "WARNING",
        note: "يتطلب حساب معامل النعومة تغطية كافية لمناخل الرمل القياسية (0.125 - 4.0 مم)"
      });
      if (status === "PASS") status = "WARNING";
      interpretation = "تحليل حبيبي للرمل ببيانات مناخل غير مكتملة؛ لم يتم تحديد معامل النعومة لعدم كفاية تغطية المناخل القياسية (NF EN 933-1).";
    }

    if (finesContent !== undefined) {
      compliance.push({
        parameter: "نسبة المواد الناعمة (<0.063 مم)",
        measured: `${finesContent.toFixed(1)}%`,
        limit: "≤ 3.0% (رمل مغسول) / ≤ 5.0% (رمل مكسر)",
        status: finesContent <= 3.0 ? "PASS" : finesContent <= 5.0 ? "WARNING" : "FAIL",
        note: finesContent <= 3.0 ? "مطابق للخرسانات الإنشائية عالية الأداء" : "يتطلب مراقبة ماء الخلط والمكافئ الرملي"
      });
      if (finesContent > 5.0) status = "FAIL";
      else if (finesContent > 3.0 && status === "PASS") status = "WARNING";
    } else {
      compliance.push({
        parameter: "نسبة المواد الناعمة (<0.063 مم)",
        measured: "غير متوفر (لم يتم فحص منخل المواد الناعمة)",
        limit: "≤ 3.0% (رمل مغسول) / ≤ 5.0% (رمل مكسر)",
        status: "WARNING",
        note: "لم يتم فحص منخل المواد الناعمة (0.08 مم أو 0.063 مم)"
      });
    }

    if (dMax !== undefined) {
      compliance.push({
        parameter: "القطر الأقصى للحبيبات (Dmax)",
        measured: `${dMax} mm`,
        limit: "حسب المخطط والمواصفة الإنشائية",
        status: "PASS",
        note: "مطابق لمتطلبات الغطاء الخرساني وتباعد حديد التسليح"
      });
    } else {
      compliance.push({
        parameter: "القطر الأقصى للحبيبات (Dmax)",
        measured: "غير محدد (لا يوجد منخل بنسبة مارة ≥ 95%)",
        limit: "حسب المخطط والمواصفة الإنشائية",
        status: "WARNING",
        note: "الركام المحبوس على أكبر منخل لا يحقق شرط Dmax (المارة ≥ 95%)"
      });
    }
  } else {
    // Gravel
    if (dMax !== undefined) {
      compliance.push({
        parameter: "القطر الأقصى للحبيبات (Dmax)",
        measured: `${dMax} mm`,
        limit: "حسب المخطط والمواصفة الإنشائية",
        status: "PASS",
        note: "مطابق لمتطلبات الغطاء الخرساني وتباعد حديد التسليح"
      });
      interpretation = `تدرج حبيبي متوازن للركام الخشن Dmax = ${dMax} mm متوافق مع متطلبات NF EN 933-1.`;
    } else {
      compliance.push({
        parameter: "القطر الأقصى للحبيبات (Dmax)",
        measured: "غير محدد (لا يوجد منخل بنسبة مارة ≥ 95%)",
        limit: "حسب المخطط والمواصفة الإنشائية",
        status: "WARNING",
        note: "لا يوجد منخل مفحوص يحقق نسبة مارة ≥ 95% لتحديد Dmax"
      });
      if (status === "PASS") status = "WARNING";
      interpretation = "لم يتم تحديد القطر الأقصى Dmax لعدم وجود منخل يحقق نسبة مارة ≥ 95% أو لغياب بيانات المناخل (NF EN 933-1).";
    }

    if (finesContent !== undefined) {
      compliance.push({
        parameter: "نسبة المواد الناعمة (<0.063 مم)",
        measured: `${finesContent.toFixed(1)}%`,
        limit: "≤ 1.5% (حصى خشن مغسول)",
        status: finesContent <= 1.5 ? "PASS" : "WARNING",
        note: finesContent <= 1.5 ? "حصى خشن نقي ونظيف" : "نسبة غبار مرتفعة تتطلب غسل الحصى"
      });
    }
  }

  return {
    finenessModulus,
    dMax,
    finesContent,
    processedRows,
    status,
    interpretation,
    compliance,
    dataState: "valid"
  };
}

export function calculateBulkDensity(
  containerVolumeLiters: number, // V in liters
  emptyContainerWeightKg: number, // M0 in kg
  filledContainerWeightKg: number, // M1 in kg
  isCompacted: boolean = false
) {
  const netWeightKg = filledContainerWeightKg - emptyContainerWeightKg;
  const volumeM3 = containerVolumeLiters / 1000;

  if (containerVolumeLiters <= 0 || emptyContainerWeightKg < 0 || filledContainerWeightKg <= emptyContainerWeightKg || volumeM3 <= 0) {
    return {
      netWeightKg: undefined,
      bulkDensityKgM3: undefined,
      status: "FAIL" as TestStatus,
      interpretation: "بيانات وعاء القياس أو الكتل غير صالحة لحساب الكتلة الحجمية الظاهرية (NF EN 1097-3).",
      compliance: [{
        parameter: isCompacted ? "الكتلة الحجمية الظاهرية المرصوصة" : "الكتلة الحجمية الظاهرية السائبة",
        measured: "غير متوفر (بيانات غير صالحة)",
        unit: "kg/m³",
        limit: isCompacted ? "1450 - 1750 kg/m³" : "1300 - 1600 kg/m³",
        status: "FAIL",
        note: "كتلة العينة الصافية أو حجم الوعاء غير موجب"
      }],
      dataState: "invalid" as const
    };
  }

  const bulkDensityKgM3 = Math.round(netWeightKg / volumeM3);
  const standardLimit = isCompacted ? "1450 - 1750 kg/m³" : "1300 - 1600 kg/m³";
  const isValid = bulkDensityKgM3 >= 1200 && bulkDensityKgM3 <= 1850;

  const compliance: ComplianceDetail[] = [{
    parameter: isCompacted ? "الكتلة الحجمية الظاهرية المرصوصة" : "الكتلة الحجمية الظاهرية السائبة",
    measured: `${bulkDensityKgM3} kg/m³`,
    unit: "kg/m³",
    limit: standardLimit,
    status: isValid ? "PASS" : "WARNING",
    note: isValid ? "كثافة ظاهرية نموذجية للركام الطبيعي والمكسر" : "كثافة منخفضة أو مرتفعة تستدعي فحص نوعية الصخر"
  }];

  return {
    netWeightKg: parseFloat(netWeightKg.toFixed(3)),
    bulkDensityKgM3,
    status: (isValid ? "PASS" : "WARNING") as TestStatus,
    interpretation: `الكتلة الحجمية الظاهرية المحسوبة هي ${bulkDensityKgM3} kg/m³ وفق المواصفة NF EN 1097-3. النتيجة ملائمة لحساب الفراغات وتخزين الصوامع.`,
    compliance,
    dataState: "valid" as const
  };
}

export interface SpecificGravityResult {
  ovenDryRelativeDensity?: number;
  ssdRelativeDensity?: number;
  realDensityKgM3?: number;
  ssdDensityKgM3?: number;
  waterAbsorptionPercent?: number;
  status: TestStatus;
  interpretation: string;
  compliance: ComplianceDetail[];
  dataState?: "missing" | "invalid" | "valid";
}

export function calculateSpecificGravityAndAbsorption(
  ovenDryWeightG: number, // M1
  ssdWeightG: number, // M2
  apparentWeightInWaterG: number // M3 (سلة الغمر في الماء)
): SpecificGravityResult {
  const isMissing = !ovenDryWeightG || !ssdWeightG || !apparentWeightInWaterG || ovenDryWeightG <= 0 || ssdWeightG <= 0 || apparentWeightInWaterG <= 0;
  if (isMissing) {
    return {
      ovenDryRelativeDensity: undefined,
      ssdRelativeDensity: undefined,
      realDensityKgM3: undefined,
      ssdDensityKgM3: undefined,
      waterAbsorptionPercent: undefined,
      status: "FAIL",
      interpretation: "بيانات الكتل مفقودة لإجراء اختبار الكثافة والامتصاص (NF EN 1097-6). يرجى إدخال قيم موجبة للكتل M1 و M2 و M3.",
      compliance: [
        {
          parameter: "الكثافة الحقيقية الجافة (Specific Gravity)",
          measured: "غير متوفر (بيانات مفقودة)",
          limit: "2.50 - 2.80",
          status: "FAIL",
          note: "كتل العينة غير مدخلة"
        },
        {
          parameter: "كثافة السطح المشبع الجاف (SSD Density)",
          measured: "غير متوفر (بيانات مفقودة)",
          limit: "2550 - 2850 kg/m³",
          status: "FAIL",
          note: "كتل العينة غير مدخلة"
        },
        {
          parameter: "نسبة الامتصاصية WA24 (%)",
          measured: "غير متوفر (بيانات مفقودة)",
          limit: "≤ 2.5%",
          status: "FAIL",
          note: "كتل العينة غير مدخلة"
        }
      ],
      dataState: "missing"
    };
  }

  const volumeG = ssdWeightG - apparentWeightInWaterG; // (M2 - M3)
  const isInvalid = volumeG <= 0 || ssdWeightG < ovenDryWeightG;

  if (isInvalid) {
    const reason = volumeG <= 0
      ? "كتلة الغمر في الماء أكبر من أو تساوي كتلة العينة المشبعة (حجم مائي غير موجب)"
      : "كتلة السطح المشبع (M2) أقل من كتلة العينة المجففة (M1)";
    return {
      ovenDryRelativeDensity: undefined,
      ssdRelativeDensity: undefined,
      realDensityKgM3: undefined,
      ssdDensityKgM3: undefined,
      waterAbsorptionPercent: undefined,
      status: "FAIL",
      interpretation: `قياسات غير صالحة فيزيائياً: ${reason} (NF EN 1097-6).`,
      compliance: [
        {
          parameter: "الكثافة الحقيقية الجافة (Specific Gravity)",
          measured: "غير صالح فيزيائياً",
          limit: "2.50 - 2.80",
          status: "FAIL",
          note: reason
        },
        {
          parameter: "كثافة السطح المشبع الجاف (SSD Density)",
          measured: "غير صالح فيزيائياً",
          limit: "2550 - 2850 kg/m³",
          status: "FAIL",
          note: reason
        },
        {
          parameter: "نسبة الامتصاصية WA24 (%)",
          measured: "غير صالح فيزيائياً",
          limit: "≤ 2.5%",
          status: "FAIL",
          note: reason
        }
      ],
      dataState: "invalid"
    };
  }

  const ovenDryRelativeDensity = parseFloat((ovenDryWeightG / volumeG).toFixed(3));
  const ssdRelativeDensity = parseFloat((ssdWeightG / volumeG).toFixed(3));
  const realDensityKgM3 = Math.round(ovenDryRelativeDensity * 1000);
  const ssdDensityKgM3 = Math.round(ssdRelativeDensity * 1000);

  // Preserve valid measured zero if ssdWeightG === ovenDryWeightG (completely non-porous aggregate)
  const waterAbsorptionPercent = parseFloat((((ssdWeightG - ovenDryWeightG) / ovenDryWeightG) * 100).toFixed(2));

  const isAbsGood = waterAbsorptionPercent <= 2.5;
  const isAbsWarn = waterAbsorptionPercent > 2.5 && waterAbsorptionPercent <= 4.0;
  const isDensityGood = ovenDryRelativeDensity >= 2.40 && ovenDryRelativeDensity <= 3.00;
  const status: TestStatus = (!isDensityGood || waterAbsorptionPercent > 4.0) ? "FAIL" : (!isAbsGood) ? "WARNING" : "PASS";

  const compliance: ComplianceDetail[] = [
    {
      parameter: "الكثافة الحقيقية الجافة (Specific Gravity)",
      measured: ovenDryRelativeDensity,
      limit: "2.50 - 2.80",
      status: isDensityGood ? "PASS" : "FAIL",
      note: isDensityGood ? "كثافة حقيقية مطابقة للركام الكلسي والسيليسي" : "كثافة خارج النطاق القياسي المعتمد"
    },
    {
      parameter: "كثافة السطح المشبع الجاف (SSD Density)",
      measured: `${ssdDensityKgM3} kg/m³`,
      limit: "2550 - 2850 kg/m³",
      status: isDensityGood ? "PASS" : "FAIL",
      note: "تُستخدم مباشرة في الحسابات الحجمية للخلطة"
    },
    {
      parameter: "نسبة الامتصاصية WA24 (%)",
      measured: `${waterAbsorptionPercent}%`,
      limit: "≤ 2.5% (خرسانات عادية) / ≤ 1.5% (خرسانات عالية الأداء)",
      status: isAbsGood ? "PASS" : isAbsWarn ? "WARNING" : "FAIL",
      note: isAbsGood ? "امتصاصية منخفضة ممتازة" : isAbsWarn ? "امتصاصية متوسطة تتطلب تصحيح ماء الخلط" : "ركام عالي الامتصاص (مسامي)"
    }
  ];

  return {
    ovenDryRelativeDensity,
    ssdRelativeDensity,
    realDensityKgM3,
    ssdDensityKgM3,
    waterAbsorptionPercent,
    status,
    interpretation: `الكثافة الحقيقية ${ovenDryRelativeDensity} (${realDensityKgM3} kg/m³) ونسبة الامتصاص WA24 = ${waterAbsorptionPercent}% وفق NF EN 1097-6. يتم تغذية هذه القيم مباشرة لمحرك حساب الخلطة وتصحيح المياه.`,
    compliance,
    dataState: "valid"
  };
}

export function calculateMoistureContent(
  wetSampleWeightG: number, // M_wet
  drySampleWeightG: number, // M_dry
  tareWeightG: number = 0
) {
  const wetNet = wetSampleWeightG - tareWeightG;
  const dryNet = drySampleWeightG - tareWeightG;

  if (dryNet <= 0 || wetNet < dryNet) {
    return {
      moisturePercent: undefined,
      status: "FAIL" as TestStatus,
      interpretation: dryNet <= 0
        ? "كتلة العينة الجافة مفقودة أو غير موجبة لحساب نسبة الرطوبة (NF EN 1097-5)."
        : "كتلة العينة الرطبة أقل من كتلة العينة الجافة (قياس غير صالح فيزيائياً).",
      compliance: [{
        parameter: "نسبة الرطوبة الطبيعية (w %)",
        measured: "غير متوفر (بيانات غير صالحة)",
        limit: "0 - 8%",
        status: "FAIL",
        note: "الكتل المدخلة سالبة أو غير متناسقة"
      }],
      dataState: "invalid" as const
    };
  }

  // If wetNet === dryNet, moisturePercent is 0.00 (valid measured zero!)
  const moisturePercent = parseFloat((((wetNet - dryNet) / dryNet) * 100).toFixed(2));

  const compliance: ComplianceDetail[] = [{
    parameter: "نسبة الرطوبة الطبيعية (w %)",
    measured: `${moisturePercent}%`,
    limit: "تخضع للظروف الجوية في المحطة (0 - 8%)",
    status: moisturePercent <= 6.0 ? "PASS" : "WARNING",
    note: `تتطلب تصحيحاً فورياً لماء الخلط بمقدار ${moisturePercent}% من وزن الركام الجاف`
  }];

  return {
    moisturePercent,
    status: (moisturePercent <= 6.0 ? "PASS" : "WARNING") as TestStatus,
    interpretation: `نسبة الرطوبة الطبيعية المقاسة هي ${moisturePercent}% (NF EN 1097-5). يجب خصم هذه الكمية من ماء الخلط وإضافتها لوزن الركام الرطب في محطة الخلط.`,
    compliance,
    dataState: "valid" as const
  };
}

export function calculateSandEquivalent(
  h1VisualMm: number, // Total height (sand + flocculate)
  h2SandMm: number, // Sand sediment height
  h2PistonMm?: number // Sand height with piston
) {
  if (h1VisualMm <= 0 || h2SandMm < 0 || h2SandMm > h1VisualMm) {
    return {
      esVisual: undefined,
      esPiston: undefined,
      sandCategory: "غير محدد",
      status: "FAIL" as TestStatus,
      interpretation: "ارتفاعات أنبوب المكافئ الرملي غير صالحة فيزيائياً (NF EN 933-8).",
      compliance: [{
        parameter: "المكافئ الرملي بالمكبس (ES Piston)",
        measured: "غير متوفر (بيانات غير صالحة)",
        limit: "≥ 75% (NF EN 933-8 / NF P 18-598)",
        status: "FAIL",
        note: "الارتفاعات المدخلة سالبة أو غير منطقية"
      }],
      dataState: "invalid" as const
    };
  }

  const esVisual = parseFloat(((h2SandMm / h1VisualMm) * 100).toFixed(1));
  const esPiston = (h2PistonMm !== undefined && h2PistonMm >= 0 && h2PistonMm <= h1VisualMm)
    ? parseFloat(((h2PistonMm / h1VisualMm) * 100).toFixed(1))
    : parseFloat(Math.max(0, esVisual - 4).toFixed(1));

  const isPass = esPiston >= 75;
  const isWarn = esPiston >= 65 && esPiston < 75;
  const status: TestStatus = isPass ? "PASS" : isWarn ? "WARNING" : "FAIL";

  let sandCategory = "";
  if (esPiston >= 80) sandCategory = "رمل نقي جداً، مناسب للخرسانات عالية الأداء";
  else if (esPiston >= 75) sandCategory = "رمل نقي مطابق للخرسانات الإنشائية القياسية";
  else if (esPiston >= 65) sandCategory = "رمل طميي طفيف، مقبول مع مراقبة ماء الخلط";
  else sandCategory = "رمل غير مطابق لاحتوائه على نسبة عالية من الطين والشوائب";

  const compliance: ComplianceDetail[] = [
    {
      parameter: "المكافئ الرملي بالمكبس (ES Piston)",
      measured: `${esPiston}%`,
      limit: "≥ 75% (NF EN 933-8 / NF P 18-598)",
      status,
      note: sandCategory
    },
    {
      parameter: "المكافئ الرملي البصري (ESV)",
      measured: `${esVisual}%`,
      limit: "≥ 80%",
      status: esVisual >= 80 ? "PASS" : "WARNING",
      note: "قراءة بصرية للطور الرسوبي"
    }
  ];

  return {
    esVisual,
    esPiston,
    sandCategory,
    status,
    interpretation: `المكافئ الرملي بالمكبس ${esPiston}% (${sandCategory}) وفق NF EN 933-8. النتيجة ${isPass ? "تضمن نقاء الرمل من الطين وعدم امتصاص الإسمنت والماء بصورة مفرطة." : "تتطلب غسل الرمل أو خلطه برمل سيليسي نقي."}`,
    compliance,
    dataState: "valid" as const
  };
}

export function calculateSandBulking(
  dryVolumeCm3: number,
  wetVolumes: { moisturePercent: number; wetVolumeCm3: number }[]
) {
  if (dryVolumeCm3 <= 0 || !wetVolumes || wetVolumes.length === 0) {
    return {
      curvePoints: [],
      maxBulkingPercent: undefined,
      criticalMoisture: undefined,
      status: "FAIL" as TestStatus,
      interpretation: "بيانات اختبار انتفاخ الرمل مفقودة أو غير صالحة (NF P 18-596).",
      compliance: [{
        parameter: "أقصى انتفاخ حجمي للرمل (Max Bulking)",
        measured: "غير متوفر (بيانات مفقودة)",
        limit: "15% - 35%",
        status: "FAIL",
        note: "الحجم الجاف أو نقاط الانتفاخ غير مدخلة"
      }],
      dataState: "missing" as const
    };
  }

  const curvePoints = wetVolumes.map(pt => {
    const bulkingFactor = dryVolumeCm3 > 0 
      ? parseFloat((((pt.wetVolumeCm3 - dryVolumeCm3) / dryVolumeCm3) * 100).toFixed(1))
      : 0;
    return {
      moisture: pt.moisturePercent,
      volume: pt.wetVolumeCm3,
      bulkingPercent: bulkingFactor
    };
  });

  const maxBulkingPoint = curvePoints.reduce((max, curr) => curr.bulkingPercent > max.bulkingPercent ? curr : max, curvePoints[0]);

  const compliance: ComplianceDetail[] = [{
    parameter: "أقصى انتفاخ حجمي للرمل (Max Bulking)",
    measured: `+${maxBulkingPoint.bulkingPercent}% عند رطوبة ${maxBulkingPoint.moisture}%`,
    limit: "15% - 35% (ظاهرة طبيعية في الرمال الرطبة)",
    status: "PASS",
    note: "يؤكد ضرورة الكيل بالوزن في محطات الخلط وتجنب الكيل بالحجم"
  }];

  return {
    curvePoints,
    maxBulkingPercent: maxBulkingPoint.bulkingPercent,
    criticalMoisture: maxBulkingPoint.moisture,
    status: "PASS" as TestStatus,
    interpretation: `يصل انتفاخ الرمل الرطب إلى ذروته (+${maxBulkingPoint.bulkingPercent}%) عند رطوبة ${maxBulkingPoint.moisture}%. يُثبت هذا الاختبار علمياً خطورة الكيل الحجمي للخرسانة ويبرهن حتمية الكيل بالوزن مع تصحيح الرطوبة.`,
    compliance,
    dataState: "valid" as const
  };
}

export function calculateLosAngeles(
  initialWeightG: number, // M (typically 5000g)
  retainedOn1_6mmG: number // m (retained on 1.6mm sieve after 500 revolutions)
) {
  if (initialWeightG <= 0 || retainedOn1_6mmG < 0 || retainedOn1_6mmG > initialWeightG) {
    return {
      laPercent: undefined,
      laClass: "غير محدد",
      status: "FAIL" as TestStatus,
      interpretation: "كتل اختبار لوس أنجلوس غير صالحة فيزيائياً (NF EN 1097-2).",
      compliance: [{
        parameter: "معامل لوس أنجلوس للتفتت (LA %)",
        measured: "غير متوفر (بيانات غير صالحة)",
        limit: "≤ 25% (NF EN 1097-2 / NF P 18-573)",
        status: "FAIL",
        note: "الكتل المدخلة سالبة أو غير متناسقة"
      }],
      dataState: "invalid" as const
    };
  }

  const passingG = initialWeightG - retainedOn1_6mmG;
  const laPercent = parseFloat(((passingG / initialWeightG) * 100).toFixed(1));

  const isLA20 = laPercent <= 20;
  const isLA25 = laPercent <= 25;
  const isLA30 = laPercent <= 30;
  const status: TestStatus = isLA25 ? "PASS" : isLA30 ? "WARNING" : "FAIL";

  const laClass = isLA20 ? "LA20 (ممتاز جداً للخرسانات عالية المقاومة والأرضيات الصناعية)"
    : isLA25 ? "LA25 (ممتاز للخرسانات الإنشائية والجسور)"
    : isLA30 ? "LA30 (قياسي صالح للمباني العامة)"
    : "LA > 30 (ركام هش غير مطابق للخرسانات الإنشائية)";

  const compliance: ComplianceDetail[] = [{
    parameter: "معامل لوس أنجلوس للتفتت (LA %)",
    measured: `${laPercent}%`,
    limit: "≤ 25% (NF EN 1097-2 / NF P 18-573)",
    status,
    note: laClass
  }];

  return {
    laPercent,
    laClass,
    status,
    interpretation: `معامل لوس أنجلوس المحسوب ${laPercent}% يمنح الركام تصنيف [${laClass}] بموجب المواصفة NF EN 1097-2. الركام يتمتع بصلابة ومقاومة ممتازة للصدم والتفتت الميكانيكي.`,
    compliance,
    dataState: "valid" as const
  };
}

/** Backward-compatible name used by the laboratory verification suite. */
export const calculateLosAngelesAbrasion = calculateLosAngeles;

export function calculateMicroDeval(
  initialWeightG: number, // M (typically 500g)
  retainedOn1_6mmG: number // m (retained on 1.6mm after 2 hours rotation in water)
) {
  if (initialWeightG <= 0 || retainedOn1_6mmG < 0 || retainedOn1_6mmG > initialWeightG) {
    return {
      mdePercent: undefined,
      mdeClass: "غير محدد",
      status: "FAIL" as TestStatus,
      interpretation: "كتل اختبار ميكرو-ديفال غير صالحة فيزيائياً (NF EN 1097-1).",
      compliance: [{
        parameter: "معامل ميكرو-ديفال بالماء (MDE %)",
        measured: "غير متوفر (بيانات غير صالحة)",
        limit: "≤ 20% (NF EN 1097-1)",
        status: "FAIL",
        note: "الكتل المدخلة سالبة أو غير متناسقة"
      }],
      dataState: "invalid" as const
    };
  }

  const passingG = initialWeightG - retainedOn1_6mmG;
  const mdePercent = parseFloat(((passingG / initialWeightG) * 100).toFixed(1));

  const isMDE15 = mdePercent <= 15;
  const isMDE20 = mdePercent <= 20;
  const isMDE25 = mdePercent <= 25;
  const status: TestStatus = isMDE20 ? "PASS" : isMDE25 ? "WARNING" : "FAIL";

  const mdeClass = isMDE15 ? "MDE15 (مقاومة فائقة للتآكل بالاحتكاك الرطب)"
    : isMDE20 ? "MDE20 (مطابق للخرسانات المعرضة للاحتكاك والمياه)"
    : isMDE25 ? "MDE25 (مقبول للمنشآت العادية)"
    : "MDE > 25 (تآكل مرتفع في وجود الماء)";

  const compliance: ComplianceDetail[] = [{
    parameter: "معامل ميكرو-ديفال بالماء (MDE %)",
    measured: `${mdePercent}%`,
    limit: "≤ 20% (NF EN 1097-1)",
    status,
    note: mdeClass
  }];

  return {
    mdePercent,
    mdeClass,
    status,
    interpretation: `معامل ميكرو-ديفال الرطب ${mdePercent}% (${mdeClass}) وفق NF EN 1097-1، ما يضمن متانة الركام عند التعرض للتآكل المائي والبيئات الرطبة.`,
    compliance,
    dataState: "valid" as const
  };
}

export function calculateVoidContent(
  bulkDensityKgM3: number,
  specificGravityRealKgM3: number
) {
  if (bulkDensityKgM3 <= 0 || specificGravityRealKgM3 <= 0 || bulkDensityKgM3 >= specificGravityRealKgM3) {
    return {
      voidPercent: undefined,
      status: "FAIL" as TestStatus,
      interpretation: "الكثافة الظاهرية أو الحقيقية غير صالحة لحساب الفراغات البينية (يجب أن تكون الكثافة الحقيقية أكبر من الظاهرية).",
      compliance: [{
        parameter: "نسبة الفراغات البينية (Void Content V%)",
        measured: "غير متوفر (بيانات غير صالحة)",
        limit: "32% - 46% (NF EN 1097-3)",
        status: "FAIL",
        note: "الكثافات غير منطقية لحساب الفراغات"
      }],
      dataState: "invalid" as const
    };
  }

  const voidPercent = parseFloat(((1 - (bulkDensityKgM3 / specificGravityRealKgM3)) * 100).toFixed(1));

  const isGood = voidPercent >= 30 && voidPercent <= 48;
  const status: TestStatus = isGood ? "PASS" : "WARNING";

  const compliance: ComplianceDetail[] = [{
    parameter: "نسبة الفراغات البينية (Void Content V%)",
    measured: `${voidPercent}%`,
    limit: "32% - 46% (NF EN 1097-3)",
    status,
    note: isGood ? "فراغات بينية مثالية لملء عجينة الإسمنت" : "نسبة فراغات مرتفعة تزيد من استهلاك المونة الإسمنتية"
  }];

  return {
    voidPercent,
    status,
    interpretation: `نسبة الفراغات البينية بين الحبيبات هي ${voidPercent}% محسوبة من الكثافة الظاهرية (${bulkDensityKgM3} kg/m³) والحقيقية (${specificGravityRealKgM3} kg/m³) وفق NF EN 1097-3.`,
    compliance,
    dataState: "valid" as const
  };
}

export function calculateParticleShapeAndFlakiness(
  totalWeightG: number,
  passingBarSievesWeightG: number, // Poids passant aux grilles à fentes (Flakiness FI)
  nonCubicalParticlesWeightG: number // Poids particules non cubiques L/E > 3 (Shape Index SI)
) {
  if (totalWeightG <= 0 || passingBarSievesWeightG < 0 || nonCubicalParticlesWeightG < 0) {
    return {
      flakinessIndexFI: undefined,
      shapeIndexSI: undefined,
      status: "FAIL" as TestStatus,
      interpretation: "كتلة العينة الإجمالية أو كتل الغربلة غير صالحة لاختبار معامل التفرطح والشكل (NF EN 933-3/4).",
      compliance: [
        {
          parameter: "معامل التفرطح / الرقاقة (Flakiness Index FI %)",
          measured: "غير متوفر (بيانات غير صالحة)",
          limit: "≤ 20%",
          status: "FAIL",
          note: "الكتل المدخلة غير صالحة"
        },
        {
          parameter: "معامل الاستطالة وشكل الحبيبات (Shape Index SI %)",
          measured: "غير متوفر (بيانات غير صالحة)",
          limit: "≤ 20%",
          status: "FAIL",
          note: "الكتل المدخلة غير صالحة"
        }
      ],
      dataState: "invalid" as const
    };
  }

  const flakinessIndexFI = parseFloat(((passingBarSievesWeightG / totalWeightG) * 100).toFixed(1));
  const shapeIndexSI = parseFloat(((nonCubicalParticlesWeightG / totalWeightG) * 100).toFixed(1));

  const isFlakinessPass = flakinessIndexFI <= 20; // FI20 / FI15
  const isShapePass = shapeIndexSI <= 20; // SI20

  const status: TestStatus = (isFlakinessPass && isShapePass) ? "PASS" : (flakinessIndexFI <= 30 && shapeIndexSI <= 30) ? "WARNING" : "FAIL";

  const compliance: ComplianceDetail[] = [
    {
      parameter: "معامل التفرطح / الرقاقة (Flakiness Index FI %)",
      measured: `${flakinessIndexFI}%`,
      limit: "≤ 20% (NF EN 933-3 / Catégorie FI20)",
      status: isFlakinessPass ? "PASS" : flakinessIndexFI <= 30 ? "WARNING" : "FAIL",
      note: isFlakinessPass ? "شكل حبيبي متناسق ومكعب يضمن مقاومة انضغاط وتشغيلية عالية" : "حبيبات مفلطحة تزيد من استهلاك الماء وتضعف الخرسانة"
    },
    {
      parameter: "معامل الاستطالة وشكل الحبيبات (Shape Index SI %)",
      measured: `${shapeIndexSI}%`,
      limit: "≤ 20% (NF EN 933-4 / Catégorie SI20)",
      status: isShapePass ? "PASS" : shapeIndexSI <= 30 ? "WARNING" : "FAIL",
      note: isShapePass ? "حبيبات متساوية الأبعاد وغير إبرية" : "حبيبات إبرية مستطيلة معرضة للكسر أثناء الرص"
    }
  ];

  return {
    flakinessIndexFI,
    shapeIndexSI,
    status,
    interpretation: `معامل التفرطح FI = ${flakinessIndexFI}% ومعامل الشكل SI = ${shapeIndexSI}% بموجب المواصفتين NF EN 933-3 و NF EN 933-4. الحبيبات مكعبة وشديدة التماسك مع مصفوفة الإسمنت.`,
    compliance,
    dataState: "valid" as const
  };
}

// ==========================================
// 2. CEMENT CALCULATORS (B)
// ==========================================

export function calculateCementProperties(
  blaineCm2G: number,
  normalConsistencyPercent: number,
  initialSettingMin: number,
  finalSettingMin: number,
  soundnessExpansionMm: number,
  strength2d: number,
  strength7d: number,
  strength28d: number,
  strengthClass: "32.5" | "42.5" | "52.5" = "42.5",
  specificGravityGPerCm3: number = 3.12,
  residue45umPercent: number = 4.5,
  flexural28d: number = 7.2
) {
  const min28d = strengthClass === "52.5" ? 52.5 : strengthClass === "42.5" ? 42.5 : 32.5;
  const min2d = strengthClass === "52.5" ? 20.0 : strengthClass === "42.5" ? 10.0 : 0;
  const is28dPass = strength28d >= min28d;
  const isSettingPass = initialSettingMin >= 60 && finalSettingMin <= 360;
  const isSoundnessPass = soundnessExpansionMm <= 10.0;
  const isBlainePass = blaineCm2G >= 2800 && blaineCm2G <= 5000;
  const isDensityPass = specificGravityGPerCm3 >= 2.95 && specificGravityGPerCm3 <= 3.25;

  const status: TestStatus = (is28dPass && isSettingPass && isSoundnessPass && isBlainePass && isDensityPass) 
    ? "PASS" 
    : (!is28dPass || !isSoundnessPass) ? "FAIL" : "WARNING";

  const compliance: ComplianceDetail[] = [
    {
      parameter: "الكثافة الحقيقية للإسمنت (Specific Gravity)",
      measured: `${specificGravityGPerCm3} g/cm³ (${Math.round(specificGravityGPerCm3 * 1000)} kg/m³)`,
      limit: "3.00 - 3.20 g/cm³ (NF EN 196-6)",
      status: isDensityPass ? "PASS" : "WARNING",
      note: "كثافة حقيقية مطابقة للإسمنت البورتلاندي المعياري"
    },
    {
      parameter: "النعومة السطحية لبلين (Blaine)",
      measured: `${blaineCm2G} cm²/g`,
      limit: "≥ 2800 cm²/g (NF EN 196-6)",
      status: isBlainePass ? "PASS" : "WARNING",
      note: "مساحة سطحية مثالية لسرعة الإماهة وتطور المقاومة"
    },
    {
      parameter: "المتبقي على منخل 45 ميكرون (Sieve 45µm)",
      measured: `${residue45umPercent}%`,
      limit: "≤ 14.0% (NF EN 196-6)",
      status: residue45umPercent <= 14 ? "PASS" : "WARNING",
      note: "نعومة طحن عالية وسرعة تفاعل متجانسة"
    },
    {
      parameter: "القوام القياسي لجهاز فيكات",
      measured: `${normalConsistencyPercent}%`,
      limit: "24% - 30% (NF EN 196-3)",
      status: "PASS",
      note: "نسبة الماء إلى الإسمنت القياسية لتحضير عجينة فيكات"
    },
    {
      parameter: "زمن الشك الابتدائي (Initial Setting)",
      measured: `${initialSettingMin} دقيقة`,
      limit: "≥ 60 دقيقة (صنف 42.5/52.5)",
      status: initialSettingMin >= 60 ? "PASS" : "FAIL",
      note: "يضمن وقتاً كافياً لنقل وصب ودمج الخرسانة"
    },
    {
      parameter: "زمن الشك النهائي (Final Setting)",
      measured: `${finalSettingMin} دقيقة`,
      limit: "≤ 360 دقيقة (6 ساعات)",
      status: finalSettingMin <= 360 ? "PASS" : "WARNING",
      note: "بداية مرحلة التصلد واكتساب المقاومة"
    },
    {
      parameter: "تمدد وثبات لوشاتوليه (Soundness Expansion)",
      measured: `${soundnessExpansionMm} mm`,
      limit: "≤ 10.0 mm (NF EN 196-3)",
      status: isSoundnessPass ? "PASS" : "FAIL",
      note: isSoundnessPass ? "إسمنت سليم وخالٍ من أكسيد الكالسيوم الحر الممدد" : "خطر تمدد وتشقق الخرسانة"
    },
    {
      parameter: "مقاومة المونة المعيارية للضغط 28 يوم",
      measured: `${strength28d} MPa`,
      limit: `≥ ${min28d} MPa (NF EN 196-1 صنف ${strengthClass})`,
      status: is28dPass ? "PASS" : "FAIL",
      note: `المقاومة المعيارية المحققة ${strength28d} MPa تفوق الحد الأدنى للصنف ${strengthClass}`
    },
    {
      parameter: "مقاومة الشد بالانحناء 28 يوم (Flexural Strength)",
      measured: `${flexural28d} MPa`,
      limit: "≥ 5.0 MPa (NF EN 196-1)",
      status: flexural28d >= 5.0 ? "PASS" : "WARNING",
      note: "مطيلية وتماسك مصفوفة المونة الإسمنتية"
    }
  ];

  return {
    specificGravityGPerCm3,
    blaineCm2G,
    residue45umPercent,
    normalConsistencyPercent,
    initialSettingMin,
    finalSettingMin,
    soundnessExpansionMm,
    strength2d,
    strength7d,
    strength28d,
    flexural28d,
    status,
    interpretation: `إسمنت بورتلاندي صنف ${strengthClass} مطابق لمتطلبات المواصفة NF EN 197-1 و NF EN 196. زمن الشك الابتدائي ${initialSettingMin} دقيقة والمقاومة المعيارية 28 يوماً بلغت ${strength28d} MPa، ما يحقق ثقة تامة لتصميم الخلطات الخرسانية الإنشائية.`,
    compliance
  };
}

// ==========================================
// 3. WATER TESTING CALCULATORS (C)
// ==========================================

export function calculateWaterQuality(
  pH: number,
  chloridesMgL: number,
  sulfatesMgL: number,
  tdsMgL: number,
  organicMatterMgL: number = 20
) {
  const isPHGood = pH >= 6.5 && pH <= 8.5;
  const isChloridesGood = chloridesMgL <= 500; // 500 mg/L for reinforced concrete (EN 1008)
  const isSulfatesGood = sulfatesMgL <= 2000; // 2000 mg/L (EN 1008)
  const isTdsGood = tdsMgL <= 2000;

  const isPass = isPHGood && isChloridesGood && isSulfatesGood && isTdsGood;
  const status: TestStatus = isPass ? "PASS" : (!isChloridesGood || !isSulfatesGood) ? "FAIL" : "WARNING";

  const compliance: ComplianceDetail[] = [
    {
      parameter: "درجة الحموضة (pH)",
      measured: pH,
      limit: "≥ 5.5 و ≤ 9.0 (NF EN 1008)",
      status: isPHGood ? "PASS" : "WARNING",
      note: "وسط معتدل يمنع تأكل الخرسانة وتأخر الشك"
    },
    {
      parameter: "محتوى الكلوريدات (Cl⁻)",
      measured: `${chloridesMgL} mg/L`,
      limit: "≤ 500 mg/L (خرسانة مسلحة) / ≤ 1000 mg/L (خرسانة عادية)",
      status: isChloridesGood ? "PASS" : "FAIL",
      note: isChloridesGood ? "آمن تماماً من خطر صدأ حديد التسليح" : "خطر كهروميكانيكي لصدأ وتآكل التسليح"
    },
    {
      parameter: "محتوى الكبريتات (SO₄²⁻)",
      measured: `${sulfatesMgL} mg/L`,
      limit: "≤ 2000 mg/L (NF EN 1008)",
      status: isSulfatesGood ? "PASS" : "FAIL",
      note: isSulfatesGood ? "آمن من الهجوم الكبريتي الداخلي وتكوين الإترينجايت المتأخر" : "تركيز مرتفع قد يسبب تفتت الخرسانة"
    },
    {
      parameter: "المواد الصلبة الذائبة الكلية (TDS)",
      measured: `${tdsMgL} mg/L`,
      limit: "≤ 2000 mg/L",
      status: isTdsGood ? "PASS" : "WARNING",
      note: "نقاء عالي للمياه المستخدمة في الخلط والمعالجة"
    }
  ];

  return {
    pH,
    chloridesMgL,
    sulfatesMgL,
    tdsMgL,
    status,
    interpretation: isPass 
      ? `عينة المياه مطابقة بالكامل للمواصفة القياسية NF EN 1008 لمياه خلط ومعالجة الخرسانة الإنشائية والمسلحة.`
      : `تنبيه: عينة المياه تحتوي على شوائب أو أملاح تتجاوز الحدود المسموحة بموجب NF EN 1008 وتتطلب معالجة قبل الاستخدام.`,
    compliance
  };
}

// ==========================================
// 4. CHEMICAL ADMIXTURES CALCULATORS (D)
// ==========================================

export function calculateAdmixtureProperties(
  densityGPerCm3: number,
  pH: number,
  solidContentPercent: number,
  waterReductionPercent: number,
  settingTimeDiffMin: number
) {
  const isDensityGood = densityGPerCm3 >= 1.02 && densityGPerCm3 <= 1.25;
  const isSolidGood = solidContentPercent >= 15 && solidContentPercent <= 45;
  const isWaterRedGood = waterReductionPercent >= 12;

  const status: TestStatus = (isDensityGood && isSolidGood && isWaterRedGood) ? "PASS" : "WARNING";

  const compliance: ComplianceDetail[] = [
    {
      parameter: "الكثافة النسبية (Specific Gravity)",
      measured: `${densityGPerCm3} g/cm³`,
      limit: "1.02 - 1.25 g/cm³ (NF EN 480-8)",
      status: isDensityGood ? "PASS" : "WARNING",
      note: "كثافة مميزة للملدنات الفائقة من الجيل الثالث (بولي كربوكسيلات)"
    },
    {
      parameter: "المحتوى الصلب / المادة الجافة (Dry Extract)",
      measured: `${solidContentPercent}%`,
      limit: "المواصفة التقنية للمصنع ± 1.5%",
      status: isSolidGood ? "PASS" : "WARNING",
      note: "تركيز المادة الفعالة البوليميرية"
    },
    {
      parameter: "قدرة تخفيض ماء الخلط (Water Reduction)",
      measured: `${waterReductionPercent}%`,
      limit: "≥ 12% (ملدنات عادية) / ≥ 20% (ملدنات فائقة عالية الكفاءة)",
      status: isWaterRedGood ? "PASS" : "WARNING",
      note: "تخفيض عالي للماء يرفع المقاومة ويقلل المسامية"
    },
    {
      parameter: "التأثير على زمن الشك (Setting Impact)",
      measured: `${settingTimeDiffMin > 0 ? `+${settingTimeDiffMin}` : settingTimeDiffMin} دقيقة`,
      limit: "± 90 دقيقة مقارنة بالخرسانة المرجعية",
      status: Math.abs(settingTimeDiffMin) <= 90 ? "PASS" : "WARNING",
      note: settingTimeDiffMin > 0 ? "تأخير معتدل للمحافظة على التشغيلية في الطقس الحار" : "تسريع لفك القوالب المبكر"
    }
  ];

  return {
    densityGPerCm3,
    pH,
    solidContentPercent,
    waterReductionPercent,
    settingTimeDiffMin,
    status,
    interpretation: `المضاف الكيميائي معتمد وفق المواصفة NF EN 934-2. يحقق تخفيضاً مائياً بنسبة ${waterReductionPercent}% مع ثبات المحتوى الصلب (${solidContentPercent}%)، ما يحسن مقاومة الخرسانة ومتانتها دون انفصال حبيبي.`,
    compliance
  };
}

// ==========================================
// 5. MINERAL ADDITIVES CALCULATORS (E)
// ==========================================

export function calculateSCMProperties(
  materialType: "silica_fume" | "fly_ash" | "slag" | "metakaolin",
  specificGravity: number,
  finenessBetOrBlaine: number,
  pozzolanicActivity28dPercent: number,
  lossOnIgnitionPercent: number,
  sio2Percent: number
) {
  const isPozzolanicGood = pozzolanicActivity28dPercent >= 75; // ASTM C618 / NF EN 450
  const isLoiGood = lossOnIgnitionPercent <= 5.0;

  const status: TestStatus = (isPozzolanicGood && isLoiGood) ? "PASS" : "WARNING";

  const compliance: ComplianceDetail[] = [
    {
      parameter: "مؤشر الفعالية البوزولانية (IAP 28j)",
      measured: `${pozzolanicActivity28dPercent}%`,
      limit: "≥ 75% (NF EN 450-1 / ASTM C311)",
      status: isPozzolanicGood ? "PASS" : "WARNING",
      note: "تفاعل نشط مع هيدروكسيد الكالسيوم الحر لتكوين C-S-H إضافي"
    },
    {
      parameter: "فقد الحرق (Loss on Ignition - LOI)",
      measured: `${lossOnIgnitionPercent}%`,
      limit: "≤ 5.0% (لضمان نقاء المادة من الكربون غير المحترق)",
      status: isLoiGood ? "PASS" : "FAIL",
      note: isLoiGood ? "نسبة كربون منخفضة لا تستهلك الملدنات ولا الهواء المحبوس" : "نسبة كربون مرتفعة تتطلب زيادة جرعة الملدن"
    },
    {
      parameter: "محتوى السيليكا النشطة (SiO₂)",
      measured: `${sio2Percent}%`,
      limit: materialType === "silica_fume" ? "≥ 85%" : "≥ 40%",
      status: "PASS",
      note: "مصدر السيليكا المتفاعلة لتعزيز كثافة البنية المجهرية"
    }
  ];

  return {
    specificGravity,
    finenessBetOrBlaine,
    pozzolanicActivity28dPercent,
    lossOnIgnitionPercent,
    sio2Percent,
    status,
    interpretation: `المادة الإضافية المعدنية (${materialType}) تحقق مؤشر فعالية بوزولانية ${pozzolanicActivity28dPercent}% وفقد حرق ${lossOnIgnitionPercent}%، مما يجعلها مطابقة للمواصفات الدولية وتعمل على سد المسامات الدقيقة ورفع المقاومة وديمومة الخرسانة ضد الكبريتات.`,
    compliance
  };
}

// ==========================================
// 6. FIBERS TESTING CALCULATORS (F)
// ==========================================

export function calculateFiberProperties(
  fiberType: "steel" | "polypropylene" | "glass" | "synthetic",
  lengthMm: number,
  diameterMm: number,
  tensileStrengthMpa: number,
  youngModulusGpa: number,
  densityGPerCm3: number,
  recommendedDosageKgM3: number
) {
  const aspectRatio = diameterMm > 0 ? parseFloat((lengthMm / diameterMm).toFixed(1)) : 0;
  const isTensileGood = tensileStrengthMpa >= 500;

  const status: TestStatus = isTensileGood ? "PASS" : "WARNING";

  const compliance: ComplianceDetail[] = [
    {
      parameter: "معامل النسبة الباعية (Aspect Ratio L/d)",
      measured: `${aspectRatio}`,
      limit: "40 - 80 (NF EN 14889)",
      status: (aspectRatio >= 35 && aspectRatio <= 90) ? "PASS" : "WARNING",
      note: "تثبيت ميكانيكي مثالي داخل مصفوفة الخرسانة ومقاومة الانسحاب"
    },
    {
      parameter: "مقاومة الشد للألياف (Tensile Strength)",
      measured: `${tensileStrengthMpa} MPa`,
      limit: fiberType === "steel" ? "≥ 1000 MPa" : "≥ 400 MPa",
      status: isTensileGood ? "PASS" : "WARNING",
      note: "تحكم فائق في تشكلات الشقوق الشعرية والانكماش اللدن"
    },
    {
      parameter: "معامل المرونة (Young's Modulus)",
      measured: `${youngModulusGpa} GPa`,
      limit: fiberType === "steel" ? "≥ 200 GPa" : "≥ 5 GPa",
      status: "PASS",
      note: "صلابة الألياف في نقل الإجهادات وسلوك ما بعد التشقق"
    }
  ];

  return {
    aspectRatio,
    tensileStrengthMpa,
    youngModulusGpa,
    densityGPerCm3,
    recommendedDosageKgM3,
    status,
    interpretation: `ألياف (${fiberType}) مطابقة للمواصفة القياسية NF EN 14889. النسبة الباعية (${aspectRatio}) ومقاومة الشد (${tensileStrengthMpa} MPa) توفر جسوراً ميكانيكية فعالة لمنع انتشار الشقوق ورفع المطيلية ومقاومة الصدمات.`,
    compliance
  };
}
