import { MixDesignInput, MixDesignResult } from "../types";
import { ValidationResult, ConcreteTypeMeta, CONCRETE_TYPES_CATALOG } from "../concreteTypes";

export interface ConcreteValidationReport {
  concreteType: string;
  meta: ConcreteTypeMeta;
  status: "compliant" | "warning" | "requires_optimization";
  assessments: ValidationResult[];
  recommendations: string[];
  optimizationSuggestions: string[];
}

/**
 * Clean, decoupled interface for concrete validation rules.
 */
export interface ConcreteTypeRule {
  readonly code: string;
  validate(inputs: MixDesignInput, result: MixDesignResult): {
    assessments: ValidationResult[];
    recommendations: string[];
    optimizationSuggestions: string[];
  };
}

/**
 * Normal Strength Concrete Rule (NSC)
 */
export class NormalStrengthConcreteRule implements ConcreteTypeRule {
  readonly code = "NSC";

  validate(inputs: MixDesignInput, result: MixDesignResult) {
    const assessments: ValidationResult[] = [];
    const recommendations: string[] = [];
    const optimizationSuggestions: string[] = [];

    const fck = inputs.fck28 || 25;
    const cement = result.cementWeight || 350;

    const fckOk = fck <= 35;
    assessments.push({
      paramName: "strength_range",
      arabicName: "المقاومة المستهدفة (fc28)",
      status: fckOk ? "compliant" : "warning",
      requirement: "fc28 <= 35 MPa",
      actual: `${fck} MPa`,
      note: fckOk ? "المقاومة مثالية للخرسانة العادية دون الحاجة لمحسنات خاصة." : "المقاومة مرتفعة نسبياً للخرسانة العادية، نوصي بترقية تصنيف الخرسانة إلى HSC."
    });

    const cementOk = cement >= 280 && cement <= 380;
    assessments.push({
      paramName: "cement_range",
      arabicName: "محتوى الإسمنت (Cement)",
      status: cementOk ? "compliant" : "warning",
      requirement: "280 - 380 kg/m³",
      actual: `${Math.round(cement)} kg/m³`,
      note: cementOk ? "محتوى الإسمنت متطابق هندسياً للخرسانة الهيكلية العادية." : "كمية الإسمنت خارج النطاق الاقتصادي العادي."
    });

    if (!fckOk) {
      recommendations.push("⚠ يرجى تعديل خيار 'نوع الخرسانة' إلى خرسانة عالية المقاومة (HSC) لتلقي توجيهات تدعيم أفضل لإجهاد الضغط الكبير.");
    }
    recommendations.push("✓ الخلطة ملائمة للمشاريع الاعتيادية والمنشآت السكنية البسيطة.");
    optimizationSuggestions.push("تأكد من الحفاظ على رطوبة الركام بمستواها الفعلي والتحكم في ماء الخلط للحفاظ على رتبة الخرسانة.");

    return { assessments, recommendations, optimizationSuggestions };
  }
}

/**
 * High Strength Concrete Rule (HSC)
 */
export class HighStrengthConcreteRule implements ConcreteTypeRule {
  readonly code = "HSC";

  validate(inputs: MixDesignInput, result: MixDesignResult) {
    const assessments: ValidationResult[] = [];
    const recommendations: string[] = [];
    const optimizationSuggestions: string[] = [];

    const fck = inputs.fck28 || 25;
    const wc = result.wcRatioAdjusted || result.wcRatio || 0.50;
    const cement = result.cementWeight || 350;
    const sSuper = inputs.dosageSuper || 0;
    const silica = inputs.dosageSilicaFume || 0;

    const fckOk = fck >= 40;
    assessments.push({
      paramName: "hsc_strength",
      arabicName: "المقاومة المستهدفة (fc28)",
      status: fckOk ? "compliant" : "non_compliant",
      requirement: "fc28 >= 40 MPa",
      actual: `${fck} MPa`,
      note: fckOk ? "سليمة، المقاومة تناسب متطلبات الخرسانة المرتفعة التحمل." : "غير كافية، الخرسانة عالية المقاومة هندسياً تتطلب مقاومة ضغط حقيقية لا تقل عن 40 ميغاباسكال."
    });

    const wcOk = wc <= 0.35;
    assessments.push({
      paramName: "hsc_wc",
      arabicName: "نسبة الماء للاسمنت (W/C)",
      status: wcOk ? "compliant" : "non_compliant",
      requirement: "W/C <= 0.35",
      actual: `${wc.toFixed(2)}`,
      note: wcOk ? "ممتازة، النسبة مخفضة لرفع تماسك العجينة وتقوية منطقة الاتصال الفاصلة (ITZ)." : "مرفوض هندسياً، الخرسانة عالية المقاومة تتطلب W/C منخفض جداً لتفادي المسامية الكبيرة."
    });

    const cementOk = cement >= 400;
    assessments.push({
      paramName: "hsc_cement",
      arabicName: "وزن الإسمنت",
      status: cementOk ? "compliant" : "warning",
      requirement: "Cement >= 400 kg/m³",
      actual: `${Math.round(cement)} kg/m³`,
      note: cementOk ? "جرعة صحيحة لتأمين كمية مناسبة من جل الـ C-S-H الرابط." : "نوصي برفع كمية الإسمنت أو استخدام غبار السيليكا لتعويض النقص الحركي لجهود الضغط."
    });

    const superOk = sSuper >= 1.0;
    assessments.push({
      paramName: "hsc_superplasticizer",
      arabicName: "الملدّن الفائق (Superplasticizer)",
      status: superOk ? "compliant" : "non_compliant",
      requirement: "جرعة الملدّن الفائق >= 1.0%",
      actual: `${sSuper.toFixed(2)}%`,
      note: superOk ? "إضافة ممتازة لخدمة السيولة والمحافظة على انخفاض كمية الماء المضافة." : "معدل الملدن غير كافٍ. لترطيب إسمنت كثيف (>=400كغ) بماء قليل لا بد من جرعة ملدّن فائق حقيقية لتجنب تكتل الإسمنت."
    });

    if (!wcOk) recommendations.push("⚠ قم بتقليل نسبة الماء المستهدفة أو زيادة الإكتفاء بالملدن لخفض W/C Ratio إلى أقل من 0.35.");
    if (!superOk) recommendations.push("⚠ تفعيل وضبط جرعة الملدن الفائق إلى 1.0% أو أكثر في نافذة الإضافات الكيميائية.");
    if (silica === 0) recommendations.push("💡 نوصي بإضافة غبار السيليكا (Silica Fume) بنسبة 5% إلى 10% كإضافة معدنية لملء الفراغات النانوية.");

    optimizationSuggestions.push(
      "استبدل جزءاً من الركام الخشن بحصى كسارات بقطر صغير (D_max <= 16 مم) لزيادة مساحة الالتصاق والحد من الشروخ الميكروية.",
      "استخدم الإسمنت ذو الرتبة العالية (سواء كان CEM I 52.5N أو كيرف منخل عالي المتانة) لتقليل محتوى الإسمنت الكلي وتفادي الحرارة المرتفعة."
    );

    return { assessments, recommendations, optimizationSuggestions };
  }
}

/**
 * High Performance Concrete Rule (HPC)
 */
export class HighPerformanceConcreteRule implements ConcreteTypeRule {
  readonly code = "HPC";

  validate(inputs: MixDesignInput, result: MixDesignResult) {
    const assessments: ValidationResult[] = [];
    const recommendations: string[] = [];
    const optimizationSuggestions: string[] = [];

    const wc = result.wcRatioAdjusted || result.wcRatio || 0.50;
    const sSuper = inputs.dosageSuper || 0;
    const silica = inputs.dosageSilicaFume || 0;

    const wcOk = wc <= 0.38;
    assessments.push({
      paramName: "hpc_wc",
      arabicName: "نسبة الماء الشامل (W/C)",
      status: wcOk ? "compliant" : "non_compliant",
      requirement: "W/C <= 0.38",
      actual: `${wc.toFixed(2)}`,
      note: wcOk ? "مثالية لخفض المسامية المتصلة بالبيتون وتحقيق أعلى درجات المتانة." : "نسبة الماء مرتفعة وتسهل نفاذ الكبريتات والكلوريدات الساحلية. يجب أن لا تزيد عن 0.38 للـ HPC."
    });

    const superOk = sSuper >= 1.2;
    assessments.push({
      paramName: "hpc_super",
      arabicName: "جرعة الملدن الفائق كنسبة إسمية",
      status: superOk ? "compliant" : "warning",
      requirement: "Dosage >= 1.2%",
      actual: `${sSuper.toFixed(2)}%`,
      note: superOk ? "تمنح الخليط القابلية الكافية للصب مع الماء المنخفض." : "يرجى رفع الملدن ف ف لتأمين تشغيلية تامة دون اللجوء لإضافة ماء إضافي يخرب المتانة."
    });

    const silicaOk = silica >= 5.0;
    assessments.push({
      paramName: "hpc_silica",
      arabicName: "غبار السيليكا (Silica Fume)",
      status: silicaOk ? "compliant" : "warning",
      requirement: "Silica Fume >= 5.0%",
      actual: `${silica.toFixed(2)}%`,
      note: silicaOk ? "توافق تام للخلطة. ستملأ تفاعلات البوزولانا الفجوات المجهرية بالكامل." : "يستحسن بشدة إضافة غبار السيليكا بنسبة تفوق 5% لسد نفاذية الخرسانة وحماية حديد التسليح من التآكل (Durability)."
    });

    if (!wcOk) recommendations.push("⚠ لزيادة عمر البيتون في المشاريع الكبرى، يرجى خفض W/C عن طريق دعم الملدن الفائق بالتدريج.");
    if (!silicaOk) recommendations.push("💡 غبار السيليكا (Silica Fume) أساسي في الخرسانات الجزائرية الشاطئية لرفع جدار المقاومة الكيميائية.");
    
    optimizationSuggestions.push(
      "نوصي باستخدام ركامات صلبة ذات مواصفات ممتازة ومغسولة بالكامل لتقليل المواد الطينية الناعمة الضارة كلياً.",
      "تأكد من تصنيف جودة التحكم (Control Class) على الوضع 'عالي' بمقاومة الإسمنت لضمان استقرار الانحراف المعياري في حسابات درو."
    );

    return { assessments, recommendations, optimizationSuggestions };
  }
}

/**
 * Self-Consolidating Concrete Rule (SCC)
 */
export class SelfConsolidatingConcreteRule implements ConcreteTypeRule {
  readonly code = "SCC";

  validate(inputs: MixDesignInput, result: MixDesignResult) {
    const assessments: ValidationResult[] = [];
    const recommendations: string[] = [];
    const optimizationSuggestions: string[] = [];

    const slump = inputs.slump || 8;
    const sSuper = inputs.dosageSuper || 0;
    const cement = result.cementWeight || 350;
    const silica = inputs.dosageSilicaFume || 0;
    const flyAsh = inputs.dosageFlyAsh || 0;
    const slag = inputs.dosageSlag || 0;

    const slumpOk = slump >= 20;
    assessments.push({
      paramName: "scc_slump",
      arabicName: "هبوط مخروط أبرامز (Slump)",
      status: slumpOk ? "compliant" : "non_compliant",
      requirement: "Slump >= 20 cm (Slump Flow > 600mm)",
      actual: `${slump} cm`,
      note: slumpOk ? "السيولة ممتازة لمطابقة شروط التدفق الذاتي للخرسانة ذاتية الرص." : "القيمة منخفضة جداً للخرسانة ذاتية الرص. البيتون سيتطلب هزا ميكانيكيا ولن ينساب بحرية."
    });

    const superOk = sSuper >= 1.2;
    assessments.push({
      paramName: "scc_super",
      arabicName: "نسبة الملدن الفائق",
      status: superOk ? "compliant" : "non_compliant",
      requirement: "جرعة الملدن >= 1.2%",
      actual: `${sSuper.toFixed(2)}%`,
      note: superOk ? "كافية للمساعدة على سيولة عالية مع الحفاظ على تماسك العجينة منعاً للاستقرار المائي." : "غير كافية، يتطلب البيتون ذاتي الرص تزيليقاً غروياً فائقاً للتحرك دون انعزال حبيبي."
    });

    // Total powder estimation
    const totalPowder = cement + (cement * (silica + flyAsh + slag) / 100);
    const powderOk = totalPowder >= 450;
    assessments.push({
      paramName: "scc_powder",
      arabicName: "المحتوى الغباري الناعم (Powder Content)",
      status: powderOk ? "compliant" : "warning",
      requirement: "Powder >= 450 kg/m³",
      actual: `${Math.round(totalPowder)} kg/m³`,
      note: powderOk ? "كمية الرواسب الدقيقة كافية لحماية حبات الرص من الانعزال المائي (Segregation)." : "مستوى الناعم قليل مما يؤدي لمخاطر الانعزال وهرب حصى الكتل (Segregation). نوصي برفع المكونات الغبارية من خبث أو رماد متطاير."
    });

    const dmaxOk = inputs.dMax <= 16;
    assessments.push({
      paramName: "scc_dmax",
      arabicName: "القطر الأقصى للركام (Dmax)",
      status: dmaxOk ? "compliant" : "warning",
      requirement: "Dmax <= 16mm",
      actual: `${inputs.dMax} mm`,
      note: dmaxOk ? "مثالي، لتجنب الانسداد الحبيبي بين قضبان حديد التسليح الضيقة." : "يفضل خفض القطر الأقصى إلى 16مم أو 14مم لوقاية القوالب الضيقة من العرقلة الإنشائية الحبيبية."
    });

    if (!slumpOk) recommendations.push("⚠ يجب رفع نسبة الهبوط المستهدفة (Slump) لتكون 20 سم أو أكثر لتهيئة الخرسانة للتأهيل الذاتي للتدفق.");
    recommendations.push("✓ يرجى مراجعة اختبارات الانسياب بالموقع قبل الصب (L-Box test, J-Ring test, Slump Flow) لضمان قدرة تغلغل البيتون.");
    
    optimizationSuggestions.push(
      "أضف جزءاً من الرماد المتطاير (Fly Ash) بنسبة 10-15% أو غبار السيليكا لتعزيز معايين لزوجة عجينة التشييد.",
      "تجنب استخدام الركامات المكسرة كلياً ذات الزوايا الخشنة والحادة واستبدلها جزئياً بركام كروي مغسول لتحسين معامل الرص واندفاع المزيج."
    );

    return { assessments, recommendations, optimizationSuggestions };
  }
}

/**
 * Fiber-Reinforced Concrete Rule (FRC)
 */
export class FiberReinforcedConcreteRule implements ConcreteTypeRule {
  readonly code = "FRC";

  validate(inputs: MixDesignInput, result: MixDesignResult) {
    const assessments: ValidationResult[] = [];
    const recommendations: string[] = [];
    const optimizationSuggestions: string[] = [];

    assessments.push({
      paramName: "frc_fibers",
      arabicName: "إضافة التسليح الليفي (Fibers)",
      status: "warning",
      requirement: "يتطلب تحديد وإضافة الألياف الإنشائية للمزيج",
      actual: "تحديد خارجي يدرج في الخلاطة مباشرة",
      note: "طريقة درو تساعد على تقويم أوزان الركامات، بينما يتم حساب الألياف كنسب الحجم التصميمي الإضافي."
    });

    recommendations.push(
      "💡 الألياف الموصى بها للشقوق البلاستيكية والسطوح المعرضة للشمس: ألياف البولي بروبيلين الدقيقة (Polypropylene Coarse/Micro Fibers) بجرعة تتراوح بين 0.6 إلى 1.5 كجم/م³.",
      "💡 الألياف الموصى بها للأغراض الإنشائية وتبطين الأرضيات الثقيلة والأنفاق: ألياف فولاذية مقوسة الأطراف (Steel Hooked-End Fibers) بجرعة من 20 إلى 45 كجم/م³."
    );
    optimizationSuggestions.push(
      "نظراً لأن إضافة الألياف الميكانيكية تسبب عادةً فقداناً في تشغيلية البيتون وقابلية حركته، نوصي برفع الهبوط المستهدف بـ 2-3 سم أو زيادة جرعة الملدن الفائق بنسبة 0.2% للتغطية.",
      "تأكد من خلط الألياف في خلاطة الموقع لمدة لا تقل عن 5 دقائق لضمان توزيع متجانس تماماً ومنع تكور الألياف (Fiber Balling)."
    );

    return { assessments, recommendations, optimizationSuggestions };
  }
}

/**
 * Lightweight Concrete Rule (LWC)
 */
export class LightweightConcreteRule implements ConcreteTypeRule {
  readonly code = "LWC";

  validate(inputs: MixDesignInput, result: MixDesignResult) {
    const assessments: ValidationResult[] = [];
    const recommendations: string[] = [];
    const optimizationSuggestions: string[] = [];

    const sandDens = inputs.sandRelativeDensity || 0;
    const gravelDens = inputs.gravelRelativeDensity || 0;
    const freshDensity = result.totalFreshDensity || 2400;

    const lowDens = sandDens < 2000 || gravelDens < 2050;
    assessments.push({
      paramName: "lwc_density",
      arabicName: "كثافة الركام (Aggregate Relative Density)",
      status: lowDens ? "compliant" : "non_compliant",
      requirement: "كثافة الركام < 2000 كجم/م³ (تتطلب ركاماً خفيفاً)",
      actual: sandDens > 0 && gravelDens > 0 ? `رمل: ${sandDens}، حصى: ${gravelDens} كجم/م³` : "غير متوفر",
      note: lowDens ? "سليمة، تم اختيار كثافة منخفضة تناسب مواد الركام الخفيفة (مثل الطين المصنّع، البيرلايت، الحجر الخفاف الطائر)." : "مستوى الكثافة المحددة يعبر عن ركام تقليدي كثيف وثقيل، مما يتعارض تقنياً مع الخرسانة خفيفة الوزن."
    });

    const dryDens = freshDensity - 150; // Approximating dry density
    const densOk = dryDens <= 1800;
    assessments.push({
      paramName: "lwc_concrete_density",
      arabicName: "الكثافة الجافة التقديرية للخرسانة",
      status: densOk ? "compliant" : "warning",
      requirement: "Density <= 1800 kg/m³",
      actual: `${Math.round(dryDens)} kg/m³`,
      note: densOk ? "ممتازة، تصنيف الخرسانة خفيفة الوزن محقق بنجاح." : "الكثافة الكلية مرتفعة نسبياً للخرسانة الخفيفة العازلة."
    });

    if (!lowDens) {
      recommendations.push("⚠ قم بالدخول وإلغاء تفعيل 'الكثافات التلقائية' وتعديل الكثافة النوعية للرمال والحصى يدوياً لتناسب الركام الخفيف (مثال: الرمل 1600 كغم/م³ والحصى 1200 كغم/م³).");
    }
    recommendations.push("💡 احرص على تشرّب الركام الخفيف بالماء قبل الصب بـ 24 ساعة للتحكم بماء الخلط لأنها تمتص نسباً عالية من الماء الصافي.");
    optimizationSuggestions.push(
      "الخرسانة خفيفة الوزن ذات مقاومة ضغط محدودة عادة (غالباً 15-25 MPa)، تجنب تحديد ومطالبة قيم fc28 تفوق 35 ميغاباسكال لخطورة زيادة كميات الإسمنت بشكل مفرط."
    );

    return { assessments, recommendations, optimizationSuggestions };
  }
}

/**
 * Heavyweight Concrete Rule (HWC)
 */
export class HeavyweightConcreteRule implements ConcreteTypeRule {
  readonly code = "HWC";

  validate(inputs: MixDesignInput, result: MixDesignResult) {
    const assessments: ValidationResult[] = [];
    const recommendations: string[] = [];
    const optimizationSuggestions: string[] = [];

    const sandDens = inputs.sandRelativeDensity || 0;
    const gravelDens = inputs.gravelRelativeDensity || 0;
    const freshDensity = result.totalFreshDensity || 2400;

    const highDens = sandDens >= 3000 && gravelDens >= 3100;
    assessments.push({
      paramName: "hwc_density",
      arabicName: "كثافة ركامات الخلطة",
      status: highDens ? "compliant" : "non_compliant",
      requirement: "كثافة الركام >= 3000 كجم/م³",
      actual: sandDens > 0 && gravelDens > 0 ? `رمل: ${sandDens}، حصى: ${gravelDens} كجم/م³` : "غير متوفر",
      note: highDens ? "متوافقة هندسياً مع مواصفات ركامات الحماية الإشعاعية الثقيلة." : "غير متطابقة، لإنتاج الخرسانة الثقيلة يجب استبدال الركام العادي بركامات تعدينية ثقيلة (Baryte, Hematite, Magnetite) ذات كثافة نوعية كبيرة."
    });

    const totalDensOk = freshDensity >= 2800;
    assessments.push({
      paramName: "hwc_total_density",
      arabicName: "الكثافة الرطبة التقريبية للبيتون",
      status: totalDensOk ? "compliant" : "warning",
      requirement: "Fresh Density >= 2900 kg/m³",
      actual: `${Math.round(freshDensity)} kg/m³`,
      note: totalDensOk ? "رائعة، تؤمن الفعالية التامة لامتصاص وحجب وتشتيت الإشعاعات." : "غير كافية، الكثافة الإجمالية المحسوبة تقل عن المعين التقني للخرسانات الثقيلة."
    });

    if (!highDens) {
      recommendations.push("⚠ قم بتعديل الكثافات النوعية للرمل والحصى يدوياً في قائمة الإدخالات بالتوقف عن الحساب الآلي وإدخال كثافة ثقيلة (مثال: رمل 3500 كجم/م³، وحصى 4200 كجم/م³).");
    }
    optimizationSuggestions.push(
      "يتعرض الركام الثقيل لخطر كبير من الانعزال بالترسيب السريع للحصى نحو الأسفل، نوصي بخفض الهبوط المستهدف وتجنب الصب من مسافات مرتفعة.",
      "تأكد من قدرة الخلاطة والرافعات الموقعية على تحمل الضغط المرقق لوزنها الثقيل (فالحجم الذي تحمله الخلاطة يقل تقريباً بالنصف لتفادي الحمل الزائد)."
    );

    return { assessments, recommendations, optimizationSuggestions };
  }
}

/**
 * Roller-Compacted Concrete Rule (RCC)
 */
export class RollerCompactedConcreteRule implements ConcreteTypeRule {
  readonly code = "RCC";

  validate(inputs: MixDesignInput, result: MixDesignResult) {
    const assessments: ValidationResult[] = [];
    const recommendations: string[] = [];
    const optimizationSuggestions: string[] = [];

    const slump = inputs.slump || 8;
    const cement = result.cementWeight || 350;

    const slumpOk = slump === 0;
    assessments.push({
      paramName: "rcc_slump",
      arabicName: "الهبوط بقمع أبرامز (Slump)",
      status: slumpOk ? "compliant" : "non_compliant",
      requirement: "Slump = 0 cm (Zero-Slump)",
      actual: `${slump} cm`,
      note: slumpOk ? "مثالية، الخليط جاف جداً ومطابق لخواص فرش المداحل الإنشائية." : "غير متوافقة، الخرسانة المدحولة يجب أن تكون جافة تماماً وقوامها ترابي رطب بدون هبوط إطلاقاً ليتسنى رصها بالمداحل."
    });

    const cementOk = cement <= 280;
    assessments.push({
      paramName: "rcc_cement",
      arabicName: "جرعة الإسمنت",
      status: cementOk ? "compliant" : "warning",
      requirement: "Cement <= 280 kg/m³",
      actual: `${Math.round(cement)} kg/m³`,
      note: cementOk ? "اقتصادية، جرعة الإسمنت ملائمة لمتطلبات السدود والفرش الكتلي." : "نوصي بخفض محتوى الإسمنت كإجراء اقتصادي وتقليل الانبعاثات الحرارية في السدد الكبيرة."
    });

    if (!slumpOk) recommendations.push("⚠ قم بتعديل قيمة الهبوط (Slump) في الواجهة لتكون صفر سم (0) لتحقيق الهيكل الجاف والمجفف الترابي للخرسانة المدحولة.");
    optimizationSuggestions.push(
      "امزج الخلطة باستخدام نسبة رمل معتدلة واستعن بالرماد المتطاير (Fly ash) لاستبدال جزء من الكلينكر وخفض حرارة تفاعلات الصب الجماعية.",
      "تنفيذ اختبار Vebe للحفاظ على استقرار زمن الرص المميز للخلطة في حدود 15-25 ثانية لضمان الدمك الفعال."
    );

    return { assessments, recommendations, optimizationSuggestions };
  }
}

/**
 * Sprayed Concrete Rule (Shotcrete)
 */
export class SprayedConcreteRule implements ConcreteTypeRule {
  readonly code = "SHOTCRETE";

  validate(inputs: MixDesignInput, result: MixDesignResult) {
    const assessments: ValidationResult[] = [];
    const recommendations: string[] = [];
    const optimizationSuggestions: string[] = [];

    const sAcc = inputs.dosageAccelerator || 0;
    const dMax = inputs.dMax || 20;

    const accOk = sAcc >= 1.0;
    assessments.push({
      paramName: "shotcrete_accelerator",
      arabicName: "جرعة معجل الشك والتصليد",
      status: accOk ? "compliant" : "warning",
      requirement: "جرعة المسرع المعجل >= 1.0%",
      actual: `${sAcc.toFixed(2)}%`,
      note: accOk ? "تمت برمجة المسرع الكيميائي بمعدل يساعد على التصلد اللحظي عند الارتطام بالأسقف." : "نوصي بتفعيل أو رفع جرعة معجل التصليد (Accelerator) في لوحة الإضافات الكيميائية لمنع تساقط الكتل المصبوبة بالموقع."
    });

    const dmaxOk = dMax <= 16;
    assessments.push({
      paramName: "shotcrete_dmax",
      arabicName: "أقصى قطر للركام (Dmax)",
      status: dmaxOk ? "compliant" : "warning",
      requirement: "Dmax <= 16mm",
      actual: `${dMax} mm`,
      note: dmaxOk ? "ممتازة، لمنع التناثر والارتداد العكسي للحصوات الضخمة (Rebound Loss)." : "حجم الركام كبير وقد يقود لارتداد ثقيل للحبيبات على العمال. يرجى تعديله ليكون Dmax <= 16 مم."
    });

    if (!accOk) recommendations.push("💡 قم بزيادة نسبة 'المسرّع' الكيميائي لزر تسريع الترابط اللحظي للخرسانة المقذوفة.");
    recommendations.push("💡 اختر ركاماً مكسراً ومغسولاً بشكل ممتاز لتعزيز الخشونة الهيكلية ودرجة الالتزام بالشبكة المعدنية.");
    optimizationSuggestions.push(
      "يتم صياغة خلطات الخرسانة المقذوفة بجرعة إسمنتية مرتفعة نسبياً (380-450 كغ/م³) لتقوية الاتصال المباشر.",
      "احرص على مراقبة معدلات الارتداد وتعديل ضغط المضخة بالتبادل مع زاوية فوهة الصب المناسبة التي تبلغ 90 درجة للأسطح الموجهة."
    );

    return { assessments, recommendations, optimizationSuggestions };
  }
}

/**
 * Geopolymer Concrete Rule (GPC)
 */
export class GeopolymerConcreteRule implements ConcreteTypeRule {
  readonly code = "GPC";

  validate(inputs: MixDesignInput, result: MixDesignResult) {
    const assessments: ValidationResult[] = [];
    const recommendations: string[] = [];
    const optimizationSuggestions: string[] = [];

    const flyAsh = inputs.dosageFlyAsh || 0;
    const slag = inputs.dosageSlag || 0;
    const mineralOk = flyAsh >= 15.0 || slag >= 15.0;

    assessments.push({
      paramName: "gpc_binders",
      arabicName: "المواد البوزولانية البديلة المقررة",
      status: mineralOk ? "compliant" : "non_compliant",
      requirement: "Fly Ash >= 15% أو Slag >= 15%",
      actual: `رماد متطاير: ${flyAsh}%، خبث: ${slag}%`,
      note: mineralOk ? "سليمة، محتوى المواد البينية البوزولانية يسمح بالتفاعل الجيوبوليمري الفعّال." : "غير كافية، الخرسانة الجيوبوليميرية الخضراء تتطلب أن تستند بشكل رئيسي على معايير رماد متطاير نشط أو خبث كأصول روابط."
    });

    recommendations.push(
      "⚠ الخرسانة الجيوبوليميرية تحتاج كيميائياً تفعيل الرابط بواسطة سائل التنشيط القلوي (Alkaline Activator Solution) المكون من سيليكات الصوديوم وهيدروكسيد الصوديوم المذاب.",
      "يجب أن يتم صب ومقاومة هذه الخرسانة بالمعالجة الحرارية الجافة لدرجة حرارة 60-80 درجة مئوية لمدة 24 ساعة لضمان البلمرة الجيومعدنية الكاملة."
    );
    optimizationSuggestions.push(
      "استشر المعامل المتخصصة لتنظيم تركيز مولارية هيدروكسيد الصوديوم (تتراوح عادة بين 8 إلى 16 مولار) لتفادي الفوارق الميكانيكية.",
      "يمكن خفض كمية الإسمنت البورتلاندي التقليدي بالخلطة إلى الحدود الدنيا أو تصفيره تماماً والاعتماد هندسياً كلياً على الروابط البوزولانية الفعالة."
    );

    return { assessments, recommendations, optimizationSuggestions };
  }
}

/**
 * Self-Healing Concrete Rule (SHC)
 */
export class SelfHealingConcreteRule implements ConcreteTypeRule {
  readonly code = "SHC";

  validate(inputs: MixDesignInput, result: MixDesignResult) {
    const assessments: ValidationResult[] = [];
    const recommendations: string[] = [];
    const optimizationSuggestions: string[] = [];

    assessments.push({
      paramName: "shc_healing",
      arabicName: "تقنية المعالجة الذاتية (Crystalline Agent)",
      status: "warning",
      requirement: "تضمين كبسولات كيميائية أو بكتيريا Bacillus المترسبة للكلس",
      actual: "إضافة متخصصة تدرج عند الرش",
      note: "يتم فحص الخرسانة باستخدام القوالب الاعتيادية، بينما تظهر فعالية المعالجة الذاتية عبر الزمن عند التشقق الفعلي الحركي."
    });

    recommendations.push(
      "💡 يوصى بإضافة عوامل كيميائية بلورية (Crystalline Admixtures) بنسبة 1-2% من وزن الإسمنت لإنتاج كربونات الكالسيوم عند التفاعل مع الماء المتسرب للشروخ.",
      "💡 يمكن استخدام التكنولوجيا الحيوية الذكية بإضافة بواقي بكتيرية محمية داخل كبسولات طينية مع مغذيات الخميرة (Lactate) لترسيب الأحجار الجيرية بالشقوق الذاتية."
    );
    optimizationSuggestions.push(
      "لضمان عمل نظام المعالجة الذاتية بكفاءة، حافظ على نسبة رمل معتدلة لتقوية تماسك الغلاف وحول خلطة البيتون نحو المتانة الأطول."
    );

    return { assessments, recommendations, optimizationSuggestions };
  }
}

/**
 * Recycled Aggregate Concrete Rule (RAC)
 */
export class RecycledAggregateConcreteRule implements ConcreteTypeRule {
  readonly code = "RAC";

  validate(inputs: MixDesignInput, result: MixDesignResult) {
    const assessments: ValidationResult[] = [];
    const recommendations: string[] = [];
    const optimizationSuggestions: string[] = [];

    const isRecycled = (inputs.sandType || "").includes("معاد") || 
                      (inputs.gravelType || "").includes("معاد") || 
                      (inputs.sandType || "").includes("Recycled") || 
                      (inputs.gravelType || "").includes("Recycled");

    assessments.push({
      paramName: "rac_aggregates",
      arabicName: "اعتماد ركام معاد تدويره (Recycled Aggregates)",
      status: isRecycled ? "compliant" : "warning",
      requirement: "استخدام ركام معاد تدويره من الهدم الخرساني والمباني",
      actual: isRecycled ? "معتمد جزئياً بالأسماء" : "لم يتم تحديده صراحة بالكتالوج المترابط",
      note: isRecycled ? "توافق تام للخلطة الخضراء الداعمة للبيئة." : "نوصي بتسمية واستخدام ركام مخصص معاد تدويره كجزء من الركام الخشن بنسبة 20-50% لتلبية متطلبات الاستدامة."
    });

    assessments.push({
      paramName: "rac_absorption",
      arabicName: "تصحيح معامل الامتصاص المائي",
      status: (inputs.moistureGravel || 0) >= 2.0 ? "compliant" : "warning",
      requirement: "نسب رطوبة/امتصاص الحصى المعاد تدويره >= 2.0%",
      actual: `رطوبة الركام: ${inputs.moistureGravel || 0}%`,
      note: "الركام المعاد تدويره يحتوي على كتل عجينة إسمنتية ملتصقة قديمة تمتص ماء الخلط بقوة تفوق الركام الطبيعي مرتين أو ثلاث مرات."
    });

    if ((inputs.moistureGravel || 0) < 2.0) {
      recommendations.push("⚠ الرجاء تعديل وضبط رطوبة الحصى المستهدفة يدوياً لتكون أعلى (مثال 2.5%) لحساب تصحيح الماء لامتصاص الركام المعاد تدويره الفعلي بالخلاطة.");
    }
    recommendations.push("💡 لا نوصي باستعمال الركام المعاد تدويره بنسبة تفوق 50% كبديل ركام خشن للعناصر الإنشائية المعرضة للأعاصير أو الهزات الأرضية العالية.");
    optimizationSuggestions.push(
      "قم بإضافة إضافات بوزولانية طبيعية أو غبار السيليكا لتعويض الفقدان الطفيف لمقاومة الضغط الناتجة عن تعرية الركام التدويري القديم.",
      "قم بغسل الركام وتخليصه من بقايا الجبس أو الأخشاب الطافية لضمان سلامة التشكيل الحبيبي."
    );

    return { assessments, recommendations, optimizationSuggestions };
  }
}

/**
 * Pervious Concrete Rule (PERVIOUS)
 */
export class PerviousConcreteRule implements ConcreteTypeRule {
  readonly code = "PERVIOUS";

  validate(inputs: MixDesignInput, result: MixDesignResult) {
    const assessments: ValidationResult[] = [];
    const recommendations: string[] = [];
    const optimizationSuggestions: string[] = [];

    const sandPct = result.sandPercent || 40;
    const slump = inputs.slump || 0;

    const lowSand = sandPct <= 15;
    assessments.push({
      paramName: "pervious_sand_ratio",
      arabicName: "نسبة مساهمة الرمل الناعم (Sand Percent)",
      status: lowSand ? "compliant" : "non_compliant",
      requirement: "Sand Percent <= 15% (خلطة مسامية خشنة)",
      actual: `${sandPct.toFixed(1)}%`,
      note: lowSand ? "ممتازة، ندرة الرمل تسمح بإنشاء الفراغات والقنوات المسامية المطلوبة لتصريف وتغلغل المياه." : "فشل، نسبة الرمل مرتفعة جداً وتملأ الفراغات الحبيبية، مما يلغي نفاذية المياه ويحولها لخرسانة مصمتة عادية."
    });

    const slumpOk = slump <= 3;
    assessments.push({
      paramName: "pervious_slump",
      arabicName: "قوام الهبوط المطلوب (Slump)",
      status: slumpOk ? "compliant" : "warning",
      requirement: "Slump <= 3 cm (قوام شديد الجفاف)",
      actual: `${slump} cm`,
      note: slumpOk ? "متوافقة، العجينة لزجة وتغلف حبات الحصى فقط دون سيلانها وسد الفراغات السفلية للخلطة." : "هبوط مرتفع سيتسبب في انسياب وتراكم العجينة الإسمنتية بالقاع لتشكل طبقة كتيمة تسد مسام الصرف تماماً."
    });

    if (!lowSand) {
      recommendations.push("⚠ يجب تقليل نسبة الرمل يدوياً بشدة أو إعادة ضبط الحبيبات لمنحنى التدرج للحد من مساهمة الركام الناعم الرملي.");
    }
    if (!slumpOk) {
      recommendations.push("⚠ يجب تقليل الهبوط (Slump) بمقحم الحاسبة ليكون 0-2 سم للحفاظ على بقاء الفراغات المسامية مفتوحة ومستقرة.");
    }
    optimizationSuggestions.push(
      "المقاومة المتوقعة للبيتون النفاذ ضعيفة نسبياً (عادة 10-18 MPa)، تجنب محاكاة وتطلب مقاومة ضغط تفوق الـ 20 ميغاباسكال لتعارضها مع نفاذية الصرف المسامي.",
      "يوصى باستخدام حصى ذي تدرج حبيبي موحد المقاس (مثال: حجم واحد حاد كالحصى 8/15) لزيادة فاعلية قنوات الري التصريفية الرأسية."
    );

    return { assessments, recommendations, optimizationSuggestions };
  }
}

/**
 * High Performance Ultra Concrete Rules (UHPC / BFUP)
 */
export class UltraHighPerformanceConcreteRule implements ConcreteTypeRule {
  readonly code = "UHPC";

  validate(inputs: MixDesignInput, result: MixDesignResult) {
    const assessments: ValidationResult[] = [];
    const recommendations: string[] = [];
    const optimizationSuggestions: string[] = [];

    assessments.push({
      paramName: "specialized_criteria",
      arabicName: "طريقة التصميم المتكامل",
      status: "non_compliant",
      requirement: "يتطلب نموذجاً حسابياً مستقلاً مخصصاً للمعالجة والحرارة والضغط المرتفع",
      actual: `طريقة الحساب الحالية: ${inputs.selectedMethod?.toUpperCase() || "غير معروف"}`,
      note: "الأنواع فائقة الأداء تتطلب نماذج ونظريات حبيبية مخصصة ومعالجة حرارية فريدة. لا نوصي بالاعتماد على مخرجات الطرق الحجمية العادية لهذه الخرسانة."
    });

    recommendations.push(
      "⚠ تصميم خرسانة UHPC يحتاج كشافات حبيبية نانوية (غبار السيليكا ومطاحن الكوارتز) ونسب ماء/إسمنت استثنائية (W/C <= 0.18) مدعمة بألياف حديدية دقيقة.",
      "يرجى مراجعة البرمجيات المتخصصة بنماذج التعبئة الحبيبية الفراغية القصوى (مثل نموذج Larrard الحبيبي لملء الفراغات)."
    );

    optimizationSuggestions.push(
      "قم بإجراء فحص مخبري حقيقي في مصانع خرسانية مجهزة بأجهزة تبخير ومعالجة حرارية حرجة تفوق 90 درجة مئوية لموثوقية التحمل الحجمي."
    );

    return { assessments, recommendations, optimizationSuggestions };
  }
}

export class UltraHighPerformanceFibreConcreteRule implements ConcreteTypeRule {
  readonly code = "BFUP";

  validate(inputs: MixDesignInput, result: MixDesignResult) {
    const assessments: ValidationResult[] = [];
    const recommendations: string[] = [];
    const optimizationSuggestions: string[] = [];

    assessments.push({
      paramName: "specialized_criteria",
      arabicName: "طريقة التصميم المتكامل",
      status: "non_compliant",
      requirement: "يتطلب نموذجاً حسابياً مستقلاً مخصصاً للمعالجة والحرارة والضغط المرتفع",
      actual: `طريقة الحساب الحالية: ${inputs.selectedMethod?.toUpperCase() || "غير معروف"}`,
      note: "الأنواع ليفية الأداء تتطلب نماذج ونظريات حبيبية مخصصة ومعالجة حرارية فريدة. لا نوصي بالاعتماد على مخرجات الطرق الحجمية العادية لهذه الخرسانة."
    });

    recommendations.push(
      "⚠ تصميم خرسانة BFUP يحتاج كشافات حبيبية نانوية (غبار السيليكا ومطاحن الكوارتز) ونسب ماء/إسمنت استثنائية (W/C <= 0.18) مدعمة بألياف حديدية دقيقة.",
      "يرجى مراجعة البرمجيات المتخصصة بنماذج التعبئة الحبيبية الفراغية القصوى (مثل نموذج Larrard الحبيبي لملء الفراغات)."
    );

    optimizationSuggestions.push(
      "قم بإجراء فحص مخبري حقيقي في مصانع خرسانية مجهزة بأجهزة تبخير ومعالجة حرارية حرجة تفوق 90 درجة مئوية لموثوقية التحمل الحجمي."
    );

    return { assessments, recommendations, optimizationSuggestions };
  }
}


/**
 * The unified validation service implementing the rule-based catalog checks
 */
export class ConcreteValidator {
  private static rules = new Map<string, ConcreteTypeRule>();

  static {
    // Register all rules statically
    this.registerRule(new NormalStrengthConcreteRule());
    this.registerRule(new HighStrengthConcreteRule());
    this.registerRule(new HighPerformanceConcreteRule());
    this.registerRule(new SelfConsolidatingConcreteRule());
    this.registerRule(new FiberReinforcedConcreteRule());
    this.registerRule(new LightweightConcreteRule());
    this.registerRule(new HeavyweightConcreteRule());
    this.registerRule(new RollerCompactedConcreteRule());
    this.registerRule(new SprayedConcreteRule());
    this.registerRule(new GeopolymerConcreteRule());
    this.registerRule(new SelfHealingConcreteRule());
    this.registerRule(new RecycledAggregateConcreteRule());
    this.registerRule(new PerviousConcreteRule());
    this.registerRule(new UltraHighPerformanceConcreteRule());
    this.registerRule(new UltraHighPerformanceFibreConcreteRule());
  }

  static registerRule(rule: ConcreteTypeRule) {
    this.rules.set(rule.code, rule);
  }

  /**
   * Evaluates the final Mix Design input & results against the designated concrete type's rules.
   */
  static validate(
    typeCode: string,
    inputs: MixDesignInput,
    result: MixDesignResult
  ): ConcreteValidationReport {
    const meta = CONCRETE_TYPES_CATALOG.find((t) => t.code === typeCode) || CONCRETE_TYPES_CATALOG[0];
    const rule = this.rules.get(typeCode);

    if (!rule) {
      // Fallback to minimal validation if rule is not found
      return {
        concreteType: typeCode,
        meta,
        status: "compliant",
        assessments: [],
        recommendations: ["✓ لم يتم تحديد قواعد فحص رقمية مخصصة لهذا التصنيف المالي."],
        optimizationSuggestions: []
      };
    }

    const { assessments, recommendations, optimizationSuggestions } = rule.validate(inputs, result);

    const hasNonCompliant = assessments.some((a) => a.status === "non_compliant");
    const hasWarning = assessments.some((a) => a.status === "warning");
    
    // Status resolution
    let status: "compliant" | "warning" | "requires_optimization" = "compliant";
    if (meta.isSpecialized || hasNonCompliant) {
      status = "requires_optimization";
    } else if (hasWarning) {
      status = "warning";
    }

    return {
      concreteType: typeCode,
      meta,
      status,
      assessments,
      recommendations,
      optimizationSuggestions
    };
  }
}
