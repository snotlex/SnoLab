import { MixDesignInput, ApplicabilityResult } from "../../core/types";

/**
 * Concrete Type Evaluator for Dreux-Gorisse Method
 * 
 * Rules:
 * - NSC (Normal Strength Concrete): Standard theoretical domain (fck <= 50 MPa, Slump 3-18 cm).
 * - HSC / HPC / UHPC: Dreux empirical Bolomey/Dreux formula is invalid above 50 MPa without silica fume / superplasticizer matrix packing. Marked limited with mandatory trial mix.
 * - SCC (Self-Consolidating Concrete): Standard slump is invalid; requires slump-flow (600-800 mm), V-funnel, and high paste/powder volume. Marked limited with mandatory trial mix.
 * - LWC (Lightweight Concrete): Requires lightweight aggregate specific density, high absorption water compensation, and pre-wetting. Marked limited with mandatory trial mix.
 * - HWC (Heavyweight / Radiation Shielding): Requires barite/magnetite density verification and volume balance.
 * - RCC (Roller Compacted Concrete): Zero slump, high compaction energy, low water content. Marked limited with mandatory trial mix.
 * - SHOTCRETE: Accelerator, fibers, rebound loss, and spray trial required. Marked limited with mandatory trial mix.
 * - GPC (Geopolymer Concrete): Cementless alkali-activated binder. Dreux-Gorisse Portland hydration model is NOT applicable. Marked not_applicable with blocked/trial mix required.
 */
export function checkDreuxGorisseApplicability(
  input: MixDesignInput
): ApplicabilityResult {
  const reasons: string[] = [];
  const recommendations: string[] = [];
  let level: "applicable" | "limited" | "not_applicable" = "applicable";

  const slump = input.slump || 0;
  const fck = input.fck28 || 0;
  const concreteType = (input.concreteType || "NSC").toUpperCase().trim();

  // 1. Concrete Type Governance
  switch (concreteType) {
    case "GPC":
    case "GEOPOLYMER":
      level = "not_applicable";
      reasons.push("طريقة Dreux-Gorisse تعتمد كلياً على تفاعلات هيدرات الإسمنت البورتلاندي (C-S-H)، ولا تنطبق فيزيائياً أو كيميائياً على الخرسانة الجيوبوليمرية الخالية من الإسمنت والمفعلة قلوياً.");
      recommendations.push("يجب استخدام نموذج تصميم الخلطات الجيوبوليمرية المستقل، وتحديد نسبة المنشط القلوي (Na2SiO3 / NaOH) ونسبة السائل إلى المواد الصلبة مع إجراء خلطات تجريبية إلزامية.");
      break;

    case "HSC":
    case "HPC":
    case "UHPC":
      level = "limited";
      reasons.push(`خرسانة عالية / فائقة الأداء (${concreteType}): معادلة دروكس التجريبية الكلاسيكية غير معايرة وحدها للمقاومات العالية (fck = ${fck} MPa).`);
      recommendations.push("يلزم استخدام نموذج ملء الفراغات الدقيقة مع إضافة غبار السيليكا (Silica Fume) وملدنات فائقة الجيل الثالث وإجراء خلطات تجريبية مخبرية لضبط الهبوط والانفصال الحبيبي.");
      break;

    case "SCC":
      level = "limited";
      reasons.push("الخرسانة ذاتية الدمك (SCC): طريقة دروكس الكلاسيكية تعتمد على هبوط مخروط أبرامز والاهتزاز الميكانيكي، بينما تتطلب SCC تدفق الهبوط (Slump-flow من 600 إلى 800 مم)، وحجم عجينة مرتفع ومقاومة للانفصال.");
      recommendations.push("يلزم قياس زمن قمع V-Funnel واجتياز صندوق L-Box واختبار ثبات المنخل، مع تنفيذ خلطة تجريبية فعلية بالمختبر.");
      break;

    case "LWC":
      level = "limited";
      reasons.push("الخرسانة خفيفة الوزن (LWC): تتطلب حسابات خاصة لامتصاص الركام الخفيف المسامي واشتراط ترطيب مسبق (Pre-wetting) لمنع امتصاص ماء الخلط الفعال.");
      recommendations.push("يجب التحقق من الكثافة الجافة للركام الخفيف وتشبيعه مسبقاً قبل الصب وإجراء خلطة تجريبية لضبط الوزن الحجمي.");
      break;

    case "HWC":
      if (level === "applicable") level = "limited";
      reasons.push("الخرسانة الثقيلة (HWC): تتطلب كثافات نوعية مرتفعة جداً للركام الثقيل (مثل الباريت أو الهيماتيت) وتوازن خاص لمنع الترسيب.");
      recommendations.push("تأكد من إدخال الكثافة الحقيقية للركام الثقيل واختبار مقاومة الانفصال الحبيبي أثناء النقل.");
      break;

    case "RCC":
      level = "limited";
      reasons.push("الخرسانة المدحولة بالحدل (RCC): قوام الخرسانة جاف تماماً (Zero-slump) وتعتمد على طاقة الرص بالمداحل ولا يناسبها نموذج دروكس الرطب.");
      recommendations.push("يلزم تحديد نسبة الرطوبة المثلى باختبار بروكتور المعدل وإجراء خلطات رص تجريبية.");
      break;

    case "SHOTCRETE":
      level = "limited";
      reasons.push("الخرسانة المرشوشة (Shotcrete): ترتبط بنسب ارتداد الركام وإضافة مسرعات شك فورية وألياف تسليح.");
      recommendations.push("النسب المحسوبة تعتبر أولية وتتطلب تجربة رش حقلية لتقييم الارتداد والالتصاق.");
      break;

    case "NSC":
    default:
      // Standard checks for NSC
      if (fck > 50) {
        level = "limited";
        reasons.push(`المقاومة المطلوبة (${fck} MPa) تتجاوز النطاق النموذجي لطريقة دروكس الكلاسيكية (حتى 50 MPa).`);
        recommendations.push("يوصى باستخدام إضافات معدنية وملدن فائق مع خلطة تجريبية مخبرية تأكيدية.");
      }
      break;
  }

  // 2. Additional physical constraints
  if (slump >= 20 && level === "applicable") {
    level = "limited";
    reasons.push(`قيمة الهبوط (${slump} سم) مرتفعة جداً وتزيد من احتمالية حدوث انفصال حبيبي ونزيف مائي بالخلطة العادية.`);
    recommendations.push("استخدم ملدناً فائقاً مع تعديل نسبة الرمل إلى الحصى أو تحويل التصميم إلى خرسانة ذاتية الدمك SCC.");
  }

  if (slump <= 2 && concreteType !== "RCC" && level === "applicable") {
    level = "limited";
    reasons.push(`قيمة الهبوط (${slump} سم) شديدة الجفاف لخرسانة اعتيادية.`);
    recommendations.push("تأكد من وسيلة الدمك والاهتزاز الميكانيكي المستخدمة بالموقع.");
  }

  return {
    level,
    reasons,
    recommendations
  };
}
