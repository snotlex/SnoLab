import { MaterialDraftValidation, MaterialDraftProperty } from "./types";

export class Validator {
  /**
   * Validates a material draft against engineering physical limits,
   * category-specific required parameters, and Dreux-Gorisse method eligibility.
   */
  public static validateDraft(
    name: string,
    category: string,
    properties: Record<string, MaterialDraftProperty>
  ): MaterialDraftValidation {
    const errors: string[] = [];
    const warnings: string[] = [];
    const missingRequiredForCategory: string[] = [];
    const missingRequiredForDreux: string[] = [];

    // 1. Fundamental Identity check
    if (!name || name.trim() === "") {
      errors.push("اسم المادة مطلوب ولا يمكن أن يكون فارغاً.");
    }

    // Helper to check if a property has a meaningful value (0 is 100% valid!)
    const hasValue = (key: string): boolean => {
      const prop = properties[key];
      if (!prop) return false;
      const v = prop.normalizedValue !== undefined ? prop.normalizedValue : prop.value;
      if (v === 0) return true; // 0 is VALID!
      if (v === null || v === undefined) return false;
      if (typeof v === "string" && v.trim() === "") return false;
      return true;
    };

    const getNum = (key: string): number | null => {
      const prop = properties[key];
      if (!prop) return null;
      const v = prop.normalizedValue !== undefined ? prop.normalizedValue : prop.value;
      if (v === 0) return 0;
      if (typeof v === "number" && !isNaN(v)) return v;
      return null;
    };

    // 2. Physical Sanity Checks
    const density = getNum("density");
    if (density !== null && (density < 300 || density > 6000)) {
      warnings.push(`قيمة الكثافة (${density} كغ/م³) تقع خارج النطاق الهندسي المعتاد (300 - 6000 كغ/م³).`);
    }

    const sg = getNum("specificGravity");
    if (sg !== null && (sg < 0.5 || sg > 5.0)) {
      warnings.push(`قيمة الوزن النوعي (${sg}) تقع خارج النطاق الهندسي المعتاد (0.5 - 5.0).`);
    }

    const abs = getNum("absorption");
    if (abs !== null && (abs < 0 || abs > 35)) {
      warnings.push(`نسبة امتصاص الماء (${abs}%) غير منطقية هندسياً (يجب أن تكون بين 0% و 35%).`);
    }

    const fm = getNum("finenessModulus");
    if (fm !== null && (fm < 0.8 || fm > 4.5)) {
      warnings.push(`معامل النعومة (${fm}) خارج الحدود الهندسية للرمال (0.8 - 4.5).`);
    }

    const dmax = getNum("dMax");
    if (dmax !== null && (dmax <= 0 || dmax > 120)) {
      warnings.push(`المقاس الأقصى للركام Dmax (${dmax} مم) غير معتاد للخرسانة.`);
    }

    const se = getNum("SandEquivalent");
    if (se !== null && (se < 0 || se > 100)) {
      warnings.push(`المكافئ الرملي SE (${se}%) يجب أن يكون بين 0% و 100%.`);
    }

    // 3. Category-Specific Completeness Requirements
    const hasDensityOrSg = hasValue("density") || hasValue("specificGravity");

    switch (category) {
      case "رمال":
        if (!hasDensityOrSg) {
          missingRequiredForCategory.push("الكثافة الحقيقية أو الوزن النوعي");
          missingRequiredForDreux.push("الكثافة الحقيقية للرمل");
        }
        if (!hasValue("absorption")) {
          missingRequiredForCategory.push("نسبة الامتصاص المائي");
        }
        if (!hasValue("finenessModulus")) {
          missingRequiredForDreux.push("معامل النعومة (FM) لحساب منحنى درو-غوريس");
        }
        break;

      case "حصى":
        if (!hasDensityOrSg) {
          missingRequiredForCategory.push("الكثافة الحقيقية أو الوزن النوعي");
          missingRequiredForDreux.push("الكثافة الحقيقية للحصى");
        }
        if (!hasValue("dMax")) {
          missingRequiredForCategory.push("المقاس الأقصى Dmax");
          missingRequiredForDreux.push("المقاس الأقصى Dmax لحساب نقطة الانعطاف ونسب الخلط");
        }
        break;

      case "إسمنت":
        if (!hasDensityOrSg) {
          missingRequiredForCategory.push("كثافة الإسمنت الحقيقية");
          missingRequiredForDreux.push("كثافة الإسمنت لحساب الحجم المطلق");
        }
        if (!hasValue("strength28d")) {
          missingRequiredForCategory.push("مقاومة الإسمنت في 28 يوماً");
          missingRequiredForDreux.push("مقاومة الإسمنت المعيارية (f_c28) لتطبيق معادلة بولومي");
        }
        break;

      case "ماء":
        if (!hasDensityOrSg) {
          // Note: Standard water density is 1000 kg/m³ and is automatically supplied if unstated
        }
        break;

      case "إضافات كيميائية":
        if (!hasValue("recommendedDosage")) {
          missingRequiredForCategory.push("الجرعة الموصى بها");
        }
        break;

      case "إضافات معدنية":
        if (!hasDensityOrSg) {
          missingRequiredForDreux.push("الكثافة الحقيقية للإضافة المعدنية لحساب الحجم المطلق");
        }
        break;

      case "ألياف":
        if (!hasDensityOrSg) {
          missingRequiredForDreux.push("كثافة مادة الألياف لحساب الحجم المستبدل");
        }
        if (!hasValue("recommendedDosage") && !hasValue("dosage")) {
          missingRequiredForCategory.push("الجرعة الموصى بها للألياف (kg/m³)");
        }
        break;
    }

    const isComplete = errors.length === 0 && missingRequiredForCategory.length === 0;
    const isEligibleForDreuxGorisse = errors.length === 0 && missingRequiredForDreux.length === 0;

    return {
      isComplete,
      isEligibleForDreuxGorisse,
      missingRequiredForCategory,
      missingRequiredForDreux,
      errors,
      warnings
    };
  }
}
