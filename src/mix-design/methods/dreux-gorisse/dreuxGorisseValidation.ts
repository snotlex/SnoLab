import { MixDesignInput, ValidationResult, ValidationError } from "../../core/types";

/**
 * Validates inputs according to engineering rules and ranges for the Dreux-Gorisse method.
 */
export function validateDreuxGorisseInputs(
  input: MixDesignInput,
  language: "ar" | "fr" | "en" = "ar"
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Helper validation checkers
  const checkRequired = (key: string, labelAr: string, labelFr: string, labelEn: string) => {
    const val = input[key];
    if (val === undefined || val === null || val === "" || (typeof val === "number" && isNaN(val))) {
      const msg = language === "fr" ? `Le champ '${labelFr}' est requis.` :
                  language === "en" ? `The field '${labelEn}' is required.` :
                  `الحقل '${labelAr}' مطلوب ولم يتم ملؤه بعد.`;
      errors.push({
        code: "REQUIRED_FIELD",
        field: key,
        severity: "error",
        message: msg
      });
      return false;
    }
    return true;
  };

  const checkRange = (key: string, val: number, min?: number, max?: number, labelAr?: string, labelFr?: string, labelEn?: string) => {
    if (min !== undefined && val < min) {
      const msg = language === "fr" ? `La valeur de '${labelFr}' ne peut pas être inférieure à ${min}.` :
                  language === "en" ? `The value of '${labelEn}' cannot be less than ${min}.` :
                  `قيمة '${labelAr}' لا يمكن أن تقل عن ${min}.`;
      errors.push({
        code: "VALUE_UNDER_MIN",
        field: key,
        severity: "error",
        message: msg
      });
    }
    if (max !== undefined && val > max) {
      const msg = language === "fr" ? `La valeur de '${labelFr}' ne peut pas dépasser ${max}.` :
                  language === "en" ? `The value of '${labelEn}' cannot exceed ${max}.` :
                  `قيمة '${labelAr}' لا يمكن أن تتجاوز ${max}.`;
      errors.push({
        code: "VALUE_EXCEEDS_MAX",
        field: key,
        severity: "error",
        message: msg
      });
    }
  };

  // 1. Target Compressive Strength
  if (checkRequired("fck28", "المقاومة المميزة fck28", "Résistance fck28", "Characteristic strength fck28")) {
    const fck = input.fck28;
    checkRange("fck28", fck, 5, 250, "المقاومة المميزة fck28", "Résistance fck28", "Characteristic strength fck28");
  }

  // 2. Slump
  if (checkRequired("slump", "الهبوط المستهدف", "Affaissement", "Target slump")) {
    const slump = input.slump;
    checkRange("slump", slump, 0, 40, "الهبوط المستهدف", "Affaissement", "Target slump");
  }

  // 3. D_max
  if (checkRequired("dMax", "القطر الأقصى للحبيبات Dmax", "D_max", "Max aggregate size Dmax")) {
    const dMax = input.dMax;
    checkRange("dMax", dMax, 2, 150, "القطر الأقصى للحبيبات Dmax", "Dmax", "Max aggregate size Dmax");
  }

  // 4. Relative densities
  if (typeof input.sandRelativeDensity === "number" && input.sandRelativeDensity !== 0) {
    const val = input.sandRelativeDensity > 10 ? input.sandRelativeDensity / 1000 : input.sandRelativeDensity;
    if (val < 1.0 || val > 4.0) {
      errors.push({
        code: "INVALID_SAND_DENSITY",
        field: "sandRelativeDensity",
        severity: "error",
        message: language === "fr" ? "La densité relative du sable doit se situer entre 1.0 et 4.0" :
                 language === "en" ? "Specific gravity of sand must reside between 1.0 and 4.0" :
                 "الكثافة النوعية للرمل يجب أن تكون قيمة هندسية بين 1.0 و 4.0"
      });
    }
  }

  if (typeof input.gravelRelativeDensity === "number" && input.gravelRelativeDensity !== 0) {
    const val = input.gravelRelativeDensity > 10 ? input.gravelRelativeDensity / 1000 : input.gravelRelativeDensity;
    if (val < 1.0 || val > 4.0) {
      errors.push({
        code: "INVALID_GRAVEL_DENSITY",
        field: "gravelRelativeDensity",
        severity: "error",
        message: language === "fr" ? "La densité relative du gravier doit se situer entre 1.0 et 4.0" :
                 language === "en" ? "Specific gravity of gravier doit se situer entre 1.0 et 4.0" :
                 "الكثافة النوعية للحصى يجب أن تكون قيمة هندسية بين 1.0 و 4.0"
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
