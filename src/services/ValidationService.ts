import { 
  MaterialCoreRecord, 
  PropertyDefinition, 
  MaterialPropertyValue, 
  PropertyValidationStatus 
} from "../types/materialCoreTypes";
import { PropertyService } from "./PropertyService";
import { MaterialTypeSchemaService } from "./MaterialTypeSchemaService";

export interface PropertyValidationAssessment {
  propertyId: string;
  status: PropertyValidationStatus; // VALID, WARNING, INVALID, INCOMPLETE, NOT_APPLICABLE
  severity: "VALID" | "WARNING" | "INVALID";
  value: any;
  canonicalUnit: string;
  messageAr?: string;
  messageEn?: string;
}

export interface MaterialValidationReport {
  materialId: string;
  materialName: string;
  overallStatus: "VALID" | "INCOMPLETE" | "INVALID" | "PENDING_REVIEW";
  isValidForCalculation: boolean;
  score: number; // 0 - 100%
  completedRequiredCount: number;
  totalRequiredCount: number;
  missingRequiredPropertyIds: string[];
  propertyAssessments: Record<string, PropertyValidationAssessment>;
  warnings: string[];
  errors: string[];
  plausibilityIssues: string[];
}

/**
 * Central Engineering Validation Engine for SnoLab
 * Validates properties, ranges, cross-property engineering plausibility, and mix readiness.
 */
export class ValidationService {
  /**
   * Validates an individual property value against its definition and rules.
   * Differentiates between strictly IMPOSSIBLE/INVALID vs UNUSUAL/WARNING vs VALID.
   */
  public static validatePropertyValue(
    propertyId: string, 
    rawVal: any,
    materialContext?: any
  ): PropertyValidationAssessment {
    const def = PropertyService.getDefinition(propertyId);
    if (!def) {
      return {
        propertyId,
        status: "VALID",
        severity: "VALID",
        value: rawVal,
        canonicalUnit: "-"
      };
    }

    // Check NOT_APPLICABLE
    if (PropertyService.isNotApplicable(rawVal)) {
      return {
        propertyId,
        status: "NOT_APPLICABLE",
        severity: "VALID",
        value: "NOT_APPLICABLE",
        canonicalUnit: def.canonicalUnit,
        messageAr: "الخاصية غير منطبقة على هذه المادة",
        messageEn: "Property is not applicable for this material"
      };
    }

    // Check MISSING / EMPTY (STRICT: 0 is NOT empty!)
    if (!PropertyService.hasMeaningfulValue(rawVal)) {
      return {
        propertyId,
        status: "INCOMPLETE",
        severity: "INVALID",
        value: null,
        canonicalUnit: def.canonicalUnit,
        messageAr: "القيمة مفقودة",
        messageEn: "Value is missing"
      };
    }

    // Normalize value
    const norm = PropertyService.normalizeValue(rawVal, def);
    if (!norm.isValid) {
      return {
        propertyId,
        status: "INVALID",
        severity: "INVALID",
        value: rawVal,
        canonicalUnit: def.canonicalUnit,
        messageAr: norm.error || "قيمة رقمية غير صالحة",
        messageEn: norm.error || "Invalid numeric value"
      };
    }

    const val = norm.normalizedValue;

    // Numerical range validation
    if (typeof val === "number" && def.validation) {
      const { min, max, warningMin, warningMax } = def.validation;

      // 1. Strict Physical Impossibility Check (INVALID)
      if (min !== undefined && val < min) {
        return {
          propertyId,
          status: "INVALID",
          severity: "INVALID",
          value: val,
          canonicalUnit: def.canonicalUnit,
          messageAr: `القيمة (${val} ${def.canonicalUnit}) أدنى من الحد الهندسي المستحيل فيزيائياً (${min} ${def.canonicalUnit})`,
          messageEn: `Value (${val} ${def.canonicalUnit}) is below physically possible minimum (${min} ${def.canonicalUnit})`
        };
      }

      if (max !== undefined && val > max) {
        return {
          propertyId,
          status: "INVALID",
          severity: "INVALID",
          value: val,
          canonicalUnit: def.canonicalUnit,
          messageAr: `القيمة (${val} ${def.canonicalUnit}) تتجاوز الحد الأقصى المستحيل فيزيائياً (${max} ${def.canonicalUnit})`,
          messageEn: `Value (${val} ${def.canonicalUnit}) exceeds physically possible maximum (${max} ${def.canonicalUnit})`
        };
      }

      // 2. Typical Engineering Range Check (WARNING)
      if (warningMin !== undefined && val < warningMin) {
        return {
          propertyId,
          status: "WARNING",
          severity: "WARNING",
          value: val,
          canonicalUnit: def.canonicalUnit,
          messageAr: `قيمة غير معتادة (${val} ${def.canonicalUnit}): النطاق الهندسي المألوف يبدأ من (${warningMin} ${def.canonicalUnit})`,
          messageEn: `Unusual value (${val} ${def.canonicalUnit}): Typical range starts at (${warningMin} ${def.canonicalUnit})`
        };
      }

      if (warningMax !== undefined && val > warningMax) {
        return {
          propertyId,
          status: "WARNING",
          severity: "WARNING",
          value: val,
          canonicalUnit: def.canonicalUnit,
          messageAr: `قيمة غير معتادة (${val} ${def.canonicalUnit}): النطاق الهندسي المألوف ينتهي عند (${warningMax} ${def.canonicalUnit})`,
          messageEn: `Unusual value (${val} ${def.canonicalUnit}): Typical range caps at (${warningMax} ${def.canonicalUnit})`
        };
      }
    }

    // Enum validation
    if (def.dataType === "enum" && def.options && def.options.length > 0) {
      const exists = def.options.some(o => o.value.toLowerCase() === String(val).toLowerCase());
      if (!exists) {
        return {
          propertyId,
          status: "WARNING",
          severity: "WARNING",
          value: val,
          canonicalUnit: def.canonicalUnit,
          messageAr: `خيار مخصص خارج القائمة المعيارية (${val})`,
          messageEn: `Custom option outside standard choices (${val})`
        };
      }
    }

    return {
      propertyId,
      status: "VALID",
      severity: "VALID",
      value: val,
      canonicalUnit: def.canonicalUnit
    };
  }

  /**
   * Cross-Property Engineering Plausibility Verification.
   * Checks inter-dependent properties like SSD density >= Dry density, dMin < dMax, etc.
   */
  public static checkCrossPropertyPlausibility(material: MaterialCoreRecord): string[] {
    const issues: string[] = [];

    const getNum = (propId: string): number | undefined => {
      const p = material.properties[propId];
      if (!p || !PropertyService.hasMeaningfulValue(p.value)) return undefined;
      const n = typeof p.value === "number" ? p.value : parseFloat(p.value);
      return isNaN(n) ? undefined : n;
    };

    const dryDensity = getNum("PROP-SPECIFIC-GRAVITY");
    const ssdDensity = getNum("PROP-SSD-DENSITY");
    const absorption = getNum("PROP-ABSORPTION");
    const bulkDensity = getNum("PROP-BULK-DENSITY");

    // 1. SSD density must be >= Dry density (since SSD includes water in permeable pores)
    if (dryDensity !== undefined && ssdDensity !== undefined) {
      if (ssdDensity < dryDensity * 0.98) {
        issues.push(`تعارض فيزيائي: كثافة SSD (${ssdDensity} kg/m³) لا يمكن هندسياً أن تكون أقل من الكثافة الجافة (${dryDensity} kg/m³)`);
      }
    }

    // 2. Bulk density must be strictly less than real/particle density
    if (bulkDensity !== undefined && dryDensity !== undefined) {
      if (bulkDensity >= dryDensity) {
        issues.push(`تعارض فيزيائي: الكثافة الظاهرية السائبة (${bulkDensity} kg/m³) لا يمكن أن تفوق أو تساوي الكثافة الحقيقية (${dryDensity} kg/m³)`);
      }
    }

    // 3. Theoretical SSD calculation check: SSD ~= dry * (1 + absorption / 100)
    if (dryDensity !== undefined && absorption !== undefined && ssdDensity !== undefined && dryDensity > 0) {
      const expectedSSD = dryDensity * (1 + absorption / 100);
      const diffPct = Math.abs(ssdDensity - expectedSSD) / expectedSSD * 100;
      if (diffPct > 8) {
        issues.push(`تحذير تباعد: كثافة SSD المسجلة (${ssdDensity}) تبتعد بنسبة (${diffPct.toFixed(1)}%) عن القيمة المحسوبة من الامتصاص (${expectedSSD.toFixed(0)} kg/m³)`);
      }
    }

    // 4. dMin must be strictly < dMax
    const dMin = getNum("PROP-DMIN");
    const dMax = getNum("PROP-DMAX");
    if (dMin !== undefined && dMax !== undefined) {
      if (dMin >= dMax) {
        issues.push(`خطأ تحبيبي: المقاس الأدنى dMin (${dMin} mm) يجب أن يكون أصغر قطعاً من المقاس الأقصى Dmax (${dMax} mm)`);
      }
    }

    // 5. Initial setting time must be < Final setting time
    const tInit = getNum("PROP-CEM-INITIAL-SETTING");
    const tFin = getNum("PROP-CEM-FINAL-SETTING");
    if (tInit !== undefined && tFin !== undefined) {
      if (tInit >= tFin) {
        issues.push(`خطأ زمني: زمن الشك الابتدائي (${tInit} دقيقة) لا يمكن أن يتجاوز زمن الشك النهائي (${tFin} دقيقة)`);
      }
    }

    return issues;
  }

  /**
   * Full Material Validation Report against the Material-Type Schema.
   */
  public static validateMaterial(
    material: MaterialCoreRecord,
    mixContext?: any
  ): MaterialValidationReport {
    const requiredPropIds = MaterialTypeSchemaService.getRequiredPropertiesForMaterial(material, mixContext);
    const assessments: Record<string, PropertyValidationAssessment> = {};
    const missing: string[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    let completedRequiredCount = 0;

    // Check all properties present in the material
    for (const [propId, propVal] of Object.entries(material.properties)) {
      const assess = ValidationService.validatePropertyValue(propId, propVal.value, material);
      assessments[propId] = assess;

      if (assess.severity === "INVALID" && assess.messageAr) {
        errors.push(`${propId}: ${assess.messageAr}`);
      } else if (assess.severity === "WARNING" && assess.messageAr) {
        warnings.push(`${propId}: ${assess.messageAr}`);
      }
    }

    // Check required properties completeness
    for (const reqId of requiredPropIds) {
      const propVal = material.properties[reqId];
      const hasVal = propVal && PropertyService.hasMeaningfulValue(propVal.value);

      if (!hasVal) {
        missing.push(reqId);
        const def = PropertyService.getDefinition(reqId);
        const name = def?.nameAr || reqId;
        errors.push(`الخاصية الإلزامية مفقودة: ${name} (${reqId})`);
        assessments[reqId] = {
          propertyId: reqId,
          status: "INCOMPLETE",
          severity: "INVALID",
          value: null,
          canonicalUnit: def?.canonicalUnit || "-",
          messageAr: `خاصية إلزامية ناقصة (${name})`,
          messageEn: `Missing required property (${def?.name || reqId})`
        };
      } else {
        completedRequiredCount++;
      }
    }

    // Cross-property plausibility check
    const plausibilityIssues = ValidationService.checkCrossPropertyPlausibility(material);
    for (const issue of plausibilityIssues) {
      if (issue.startsWith("تعارض فيزيائي") || issue.startsWith("خطأ")) {
        errors.push(issue);
      } else {
        warnings.push(issue);
      }
    }

    const totalRequiredCount = requiredPropIds.length;
    const score = totalRequiredCount > 0 
      ? Math.round((completedRequiredCount / totalRequiredCount) * 100) 
      : 100;

    let overallStatus: "VALID" | "INCOMPLETE" | "INVALID" | "PENDING_REVIEW" = "VALID";
    if (errors.length > 0) {
      overallStatus = missing.length > 0 ? "INCOMPLETE" : "INVALID";
    } else if (warnings.length > 0) {
      overallStatus = "PENDING_REVIEW";
    }

    const isValidForCalculation = missing.length === 0 && errors.filter(e => !e.includes("مفقودة")).length === 0;

    return {
      materialId: material.id,
      materialName: material.name,
      overallStatus,
      isValidForCalculation,
      score,
      completedRequiredCount,
      totalRequiredCount,
      missingRequiredPropertyIds: missing,
      propertyAssessments: assessments,
      warnings,
      errors,
      plausibilityIssues
    };
  }
}
