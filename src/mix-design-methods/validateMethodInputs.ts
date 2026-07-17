import { MixDesignMethodId } from "./types";
import { METHODS_REGISTRY } from "./methodRegistry";

export interface ValidationError {
  field: string;
  messageAr: string;
  messageFr: string;
  messageEn: string;
  severity: "error" | "warning";
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export function validateMethodInputs(
  methodId: MixDesignMethodId,
  inputs: Record<string, any>
): ValidationResult {
  const definition = METHODS_REGISTRY[methodId];
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (!definition) {
    return {
      isValid: false,
      errors: [
        {
          field: "methodId",
          severity: "error",
          messageAr: "طريقة التصميم غير صالحة أو غير مسجلة.",
          messageFr: "Méthode de conception invalide ou non enregistrée.",
          messageEn: "Invalid or unregistered mix design method."
        }
      ],
      warnings: []
    };
  }

  // Helper validation checkers
  const checkRequired = (key: string, labelAr: string, labelFr: string, labelEn: string) => {
    const val = inputs[key];
    if (val === undefined || val === null || val === "" || (typeof val === "number" && isNaN(val))) {
      errors.push({
        field: key,
        severity: "error",
        messageAr: `حقل '${labelAr}' مطلوب ولم يتم ملؤه بعد.`,
        messageFr: `Le champ '${labelFr}' est requis.`,
        messageEn: `The field '${labelEn}' is required.`
      });
      return false;
    }
    return true;
  };

  const checkRange = (key: string, val: number, min?: number, max?: number, labelAr?: string, labelFr?: string, labelEn?: string) => {
    if (min !== undefined && val < min) {
      errors.push({
        field: key,
        severity: "error",
        messageAr: `قيمة '${labelAr}' لا يمكن أن تقل عن ${min}.`,
        messageFr: `La valeur de '${labelFr}' ne peut pas être inférieure à ${min}.`,
        messageEn: `The value of '${labelEn}' cannot be less than ${min}.`
      });
    }
    if (max !== undefined && val > max) {
      errors.push({
        field: key,
        severity: "error",
        messageAr: `قيمة '${labelAr}' لا يمكن أن تتجاوز ${max}.`,
        messageFr: `La valeur de '${labelFr}' ne peut pas dépasser ${max}.`,
        messageEn: `The value of '${labelEn}' cannot exceed ${max}.`
      });
    }
  };

  // Validating Required Fields
  for (const field of definition.requiredInputs) {
    if (checkRequired(field.key, field.labelAr, field.labelFr, field.labelEn)) {
      const val = inputs[field.key];
      if (field.type === "number" && typeof val === "number") {
        checkRange(field.key, val, field.min, field.max, field.labelAr, field.labelFr, field.labelEn);
      }
    }
  }

  // Extra logical engineering validations
  // 1. Slump
  if (typeof inputs.slump === "number") {
    if (inputs.slump < 0) {
      errors.push({
        field: "slump",
        severity: "error",
        messageAr: "لا يمكن أن يكون الهبوط سالباً.",
        messageFr: "L'affaissement ne peut pas être négatif.",
        messageEn: "Slump value cannot be negative."
      });
    } else if (inputs.slump > 25) {
      warnings.push({
        field: "slump",
        severity: "warning",
        messageAr: "الهبوط مرتفع جداً (>25 سم)، قد يسبب انفصال حبيبي ما لم تستعمل ملدنات مناسبة.",
        messageFr: "Affaissement très élevé, risque de ségrégation sans superplastifiant adapté.",
        messageEn: "High slump (>25 cm) warning. May cause segregation unless dynamic admixtures are applied."
      });
    }
  }

  // 2. Concrete Strength
  if (typeof inputs.fck28 === "number") {
    if (inputs.fck28 <= 0) {
      errors.push({
        field: "fck28",
        severity: "error",
        messageAr: "المقاومة المستهدفة fck يجب أن تكون أكبر من الصفر.",
        messageFr: "La résistance ciblée fck doit être strictement supérieure à zéro.",
        messageEn: "The target strength fck must be strictly positive."
      });
    } else if (inputs.fck28 > 75 && methodId !== "dreux-gorisse") {
      warnings.push({
        field: "fck28",
        severity: "warning",
        messageAr: "المقاومة المستهدفة عالية للغاية لهذه الطريقة التقليدية، يفضل التحول لطريقة Dreux أو استشارة خبير.",
        messageFr: "Résistance ciblée très élevée pour cette méthode classique. Dreux-Gorisse ou l'avis d'un expert est conseillé.",
        messageEn: "Very high target strength requested for this standard method. Dreux-Gorisse or expert validation advisable."
      });
    }
  }

  // 3. Water-to-Cement Ratio (if provided in custom field or calculated)
  if (typeof inputs.internalWcOverride === "number") {
    if (inputs.internalWcOverride <= 0 || inputs.internalWcOverride > 1.0) {
      errors.push({
        field: "internalWcOverride",
        severity: "error",
        messageAr: "نسبة الماء إلى الإسمنت يجب أن تكون بين 0.15 و 1.0",
        messageFr: "Le rapport E/C doit être compris entre 0.15 et 1.0",
        messageEn: "Water-to-cement ratio must reside between 0.15 and 1.0"
      });
    } else if (inputs.internalWcOverride > 0.65) {
      warnings.push({
        field: "internalWcOverride",
        severity: "warning",
        messageAr: "نسبة الماء إلى الإسمنت مرتفعة (>0.65)، هذا سيقلل المتانة ومقاومة الكسر.",
        messageFr: "Rapport E/C élevé (>0.65), réduisant la durabilité et la résistance à long terme.",
        messageEn: "High W/C ratio warning (>0.65). Significantly reduces concrete durability and target strength."
      });
    }
  }

  // 4. Moisture Contents
  if (typeof inputs.moistureSand === "number" && inputs.moistureSand < 0) {
    errors.push({
      field: "moistureSand",
      severity: "error",
      messageAr: "نسبة رطوبة الرمل لا يمكن أن تكون سالبة.",
      messageFr: "Le taux d'humidité du sable ne peut pas être négatif.",
      messageEn: "Sand moisture percentage cannot be negative."
    });
  }
  if (typeof inputs.moistureGravel === "number" && inputs.moistureGravel < 0) {
    errors.push({
      field: "moistureGravel",
      severity: "error",
      messageAr: "نسبة رطوبة الحصى لا يمكن أن تكون سالبة.",
      messageFr: "Le taux d'humidité du gravier ne peut pas être négatif.",
      messageEn: "Gravel moisture percentage cannot be negative."
    });
  }

  // 5. Specific densities
  if (typeof inputs.sandRelativeDensity === "number" && inputs.sandRelativeDensity !== 0 && (inputs.sandRelativeDensity < 1.0 || inputs.sandRelativeDensity > 4.0)) {
    errors.push({
      field: "sandRelativeDensity",
      severity: "error",
      messageAr: "الكثافة النوعية للرمل يجب أن تكون قيمة هندسية بين 1.0 و 4.0",
      messageFr: "La densité relative du sable doit se situer entre 1.0 et 4.0",
      messageEn: "Specific gravity of sand must reside between 1.0 and 4.0"
    });
  }
  if (typeof inputs.gravelRelativeDensity === "number" && inputs.gravelRelativeDensity !== 0 && (inputs.gravelRelativeDensity < 1.0 || inputs.gravelRelativeDensity > 4.0)) {
    errors.push({
      field: "gravelRelativeDensity",
      severity: "error",
      messageAr: "الكثافة النوعية للحصى يجب أن تكون قيمة هندسية بين 1.0 و 4.0",
      messageFr: "La densité relative du gravier doit se situer entre 1.0 et 4.0",
      messageEn: "Specific gravity of gravel must reside between 1.0 and 4.0"
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
