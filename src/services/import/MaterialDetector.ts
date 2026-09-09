import { ConfidenceLevel } from "./types";
import { UnitNormalizer } from "./UnitNormalizer";

export interface CategoryDetectionResult {
  category: string; // "إسمنت" | "رمال" | "حصى" | "إضافات كيميائية" | "إضافات معدنية" | "ألياف" | "ماء" | "أخرى"
  materialType: string; // "مادة رابطة" | "ركام" | "إضافات كيميائية" | "إضافات معدنية" | "ألياف" | "ماء" | "أخرى"
  confidence: ConfidenceLevel;
  confidenceScore: number;
  needsReview: boolean;
  reason: string;
}

export class MaterialDetector {
  /**
   * Identifies material category and general materialType from name, headers, and property values.
   */
  public static detectCategory(
    identifierText: string,
    headers?: string[],
    sampleRows?: any[]
  ): CategoryDetectionResult {
    const normText = (identifierText || "").toLowerCase().trim()
      .replace(/[أإآ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ي/g, "ى");

    // 1. Text Analysis (Sheet name or Material designation)
    if (/(ciment|cement|portland|clinker|\bcem\b|اسمنت|إسمنت|مادة رابطة|liant)/i.test(normText)) {
      return {
        category: "إسمنت",
        materialType: "مادة رابطة",
        confidence: "HIGH",
        confidenceScore: 95,
        needsReview: false,
        reason: "تم التعرف على صنف الإسمنت من الاسم أو الكلمات المفتاحية."
      };
    }

    if (/(sable|sand|fine.*aggr|رمل|رمال|ركام ناعم|\b0\/[2345]\b)/i.test(normText)) {
      return {
        category: "رمال",
        materialType: "ركام",
        confidence: "HIGH",
        confidenceScore: 95,
        needsReview: false,
        reason: "تم التعرف على صنف الرمال من التسمية أو المقاس الحبيبي (0/D)."
      };
    }

    if (/(gravier|gravel|coarse.*aggr|concasse|حصى|حصمة|ركام خشن|\b[3458]\/[0-9]+\b|\b10\/20\b|\b15\/25\b)/i.test(normText)) {
      return {
        category: "حصى",
        materialType: "ركام",
        confidence: "HIGH",
        confidenceScore: 95,
        needsReview: false,
        reason: "تم التعرف على صنف الحصى من التسمية أو المقاس الحبيبي (d/D)."
      };
    }

    if (/(admixture|adjuvant|superplast|plastifiant|retarder|accelerat|ملدن|اضافات كيميائية|مضاف كيميائي)/i.test(normText)) {
      return {
        category: "إضافات كيميائية",
        materialType: "إضافات كيميائية",
        confidence: "HIGH",
        confidenceScore: 95,
        needsReview: false,
        reason: "تم التعرف على الإضافات الكيميائية من الكلمات المفتاحية."
      };
    }

    if (/(silica.*fume|fly.*ash|pozzolan|pouzzolane|slag|laitier|غبار السيليكا|رماد متطاير|بوزولان|اضافات معدنية|\bscm\b)/i.test(normText)) {
      return {
        category: "إضافات معدنية",
        materialType: "إضافات معدنية",
        confidence: "HIGH",
        confidenceScore: 95,
        needsReview: false,
        reason: "تم التعرف على الإضافات المعدنية من التسمية العلمية."
      };
    }

    if (/(fibre|fiber|acier|polyprop|الياف|ألياف)/i.test(normText)) {
      return {
        category: "ألياف",
        materialType: "ألياف",
        confidence: "HIGH",
        confidenceScore: 95,
        needsReview: false,
        reason: "تم التعرف على صنف الألياف الإنشائية."
      };
    }

    if (/(water|eau|ماء|مياه)/i.test(normText)) {
      return {
        category: "ماء",
        materialType: "ماء",
        confidence: "HIGH",
        confidenceScore: 95,
        needsReview: false,
        reason: "تم التعرف على ماء الخلط."
      };
    }

    // 2. Header analysis if text alone was inconclusive
    if (headers && headers.length > 0) {
      const hJoined = headers.join(" ").toLowerCase();

      if (/(fineness.*modulus|\bfm\b|\bmf\b|sand.*equiv|\bse\b|معامل.*النعومة|المكافئ.*الرملي)/i.test(hJoined)) {
        return {
          category: "رمال",
          materialType: "ركام",
          confidence: "MEDIUM",
          confidenceScore: 78,
          needsReview: false,
          reason: "أعمدة الجدول تحتوي على خصائص تميز الرمال (معامل النعومة / المكافئ الرملي)."
        };
      }

      if (/(los.*angeles|\bla\b|micro.*deval|\bmde\b|dmax|d_max)/i.test(hJoined)) {
        return {
          category: "حصى",
          materialType: "ركام",
          confidence: "MEDIUM",
          confidenceScore: 78,
          needsReview: false,
          reason: "أعمدة الجدول تحتوي على خصائص تميز الحصى (لوس أنجلوس / Dmax)."
        };
      }

      if (/(cem.*class|strength.*28|fc28|fck28|مقاومة.*28)/i.test(hJoined)) {
        return {
          category: "إسمنت",
          materialType: "مادة رابطة",
          confidence: "MEDIUM",
          confidenceScore: 75,
          needsReview: false,
          reason: "أعمدة الجدول تشير إلى رتب ومقاومة الإسمنت."
        };
      }

      if (/(dosage|water.*reduc|جرعة|تخفيض.*الماء)/i.test(hJoined)) {
        return {
          category: "إضافات كيميائية",
          materialType: "إضافات كيميائية",
          confidence: "MEDIUM",
          confidenceScore: 75,
          needsReview: false,
          reason: "أعمدة الجدول تحتوي على الجرعة ونسبة تخفيض الماء الخاصة بالإضافات."
        };
      }
    }

    // 3. Inspect sample values heuristics
    if (sampleRows && sampleRows.length > 0) {
      for (const row of sampleRows) {
        for (const [col, val] of Object.entries(row)) {
          const cLower = col.toLowerCase();
          const num = UnitNormalizer.extractNumberAndUnit(val).value;
          if (num !== null) {
            if ((cLower.includes("dmax") || cLower.includes("max")) && num > 4 && num <= 63) {
              return {
                category: "حصى",
                materialType: "ركام",
                confidence: "MEDIUM",
                confidenceScore: 70,
                needsReview: false,
                reason: "تحليل القيم الرقمية: مقاس الحبيبات الأقصى Dmax أكبر من 4 مم."
              };
            }
            if ((cLower.includes("fm") || cLower.includes("modulus")) && num >= 1.5 && num <= 4.0) {
              return {
                category: "رمال",
                materialType: "ركام",
                confidence: "MEDIUM",
                confidenceScore: 70,
                needsReview: false,
                reason: "تحليل القيم الرقمية: معامل النعومة FM يقع في نطاق الرمال (1.5-4.0)."
              };
            }
          }
        }
      }
    }

    // Ambiguous fallback -> Flag as Needs Review rather than guessing blindly!
    return {
      category: "أخرى",
      materialType: "أخرى",
      confidence: "NEEDS_REVIEW",
      confidenceScore: 20,
      needsReview: true,
      reason: "لم نتمكن من تحديد نوع المادة تلقائياً بدرجة موثوقية كافية، يرجى اختيار الفئة يدوياً."
    };
  }

  public static getMaterialTypeForCategory(category: string): string {
    switch (category) {
      case "إسمنت":
      case "مجلدات خاصة":
        return "مادة رابطة";
      case "رمال":
      case "حصى":
      case "ركام خفيف":
      case "ركام ثقيل":
      case "مواد مالئة":
        return "ركام";
      case "إضافات كيميائية":
        return "إضافات كيميائية";
      case "إضافات معدنية":
        return "إضافات معدنية";
      case "ألياف":
        return "ألياف";
      case "ماء":
        return "ماء";
      default:
        return "أخرى";
    }
  }
}
