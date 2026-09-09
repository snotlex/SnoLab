/**
 * SnoLab Dreux-Gorisse Pre-Calculation Validator
 * 
 * Strict engineering validation gate that executes before the Dreux-Gorisse engine runs.
 * Verifies all required inputs, material properties, and granulometric curves.
 * 
 * Prevents zero-output failures by enforcing CALCULATION_BLOCKED status with
 * complete diagnostic breakdown (Property, Value, Unit, Source, Required For, Material, Action)
 * rather than ambiguous "Missing Data #1" errors.
 */

import { DreuxResolvedInputs, DreuxInputTraceItem } from "./dreuxInputResolver";

export interface DreuxValidationItem {
  property: string;
  propertyAr: string;
  propertyId: string;
  materialId?: string;
  materialName?: string;
  materialRole: "cement" | "sand" | "gravel" | "water" | "admixture" | "scm" | "project";
  value: any;
  formattedValue: string;
  unit: string;
  source: string;
  requiredFor: string;
  requiredForAr: string;
  status: "Missing" | "Invalid" | "Valid";
  statusAr: "مفقود" | "غير صالح" | "صالح";
  action: string;
  actionAr: string;
}

export interface DreuxPreCalculationReport {
  canCalculate: boolean;
  status: "CALCULATION_READY" | "CALCULATION_BLOCKED";
  summaryAr: string;
  summaryEn: string;
  totalRequiredChecked: number;
  validCount: number;
  missingCount: number;
  invalidCount: number;
  items: DreuxValidationItem[];
  missingOrInvalidItems: DreuxValidationItem[];
}

export class DreuxPreCalculationValidator {
  public static validate(resolved: DreuxResolvedInputs): DreuxPreCalculationReport {
    const items: DreuxValidationItem[] = [];

    // 1. CEMENT CHECKS
    // -------------------------------------------------------------------------
    const cementHasId = Boolean(resolved.cement.materialId);
    items.push({
      property: "Cement Selection",
      propertyAr: "اختيار مادة الإسمنت",
      propertyId: "PROP_CEM_SELECTION",
      materialId: resolved.cement.materialId,
      materialName: resolved.cement.name,
      materialRole: "cement",
      value: resolved.cement.materialId,
      formattedValue: resolved.cement.name || "None",
      unit: "-",
      source: resolved.cement.source,
      requiredFor: "Binder hydration and compressive strength development",
      requiredForAr: "إماهة الرابط وتطوير المقاومة الميكانيكية للخرسانة",
      status: cementHasId ? "Valid" : "Missing",
      statusAr: cementHasId ? "صالح" : "مفقود",
      action: cementHasId ? "None" : "Select an approved Cement in Mix Preparation",
      actionAr: cementHasId ? "لا يوجد" : "يرجى اختيار مادة إسمنت معتمدة من مستودع المواد"
    });

    const cStrength = resolved.cement.strengthClass;
    const cStrengthValid = cStrength >= 25 && cStrength <= 70;
    items.push({
      property: "Cement Strength Class",
      propertyAr: "صنف مقاومة الإسمنت (Class)",
      propertyId: "PROP_CEM_CLASS",
      materialId: resolved.cement.materialId,
      materialName: resolved.cement.name,
      materialRole: "cement",
      value: cStrength,
      formattedValue: `${cStrength} MPa`,
      unit: "MPa",
      source: resolved.cement.source,
      requiredFor: "Féret/Bolomey W/C calculation in Dreux-Gorisse",
      requiredForAr: "حساب نسبة الماء إلى الإسمنت W/C بمعادلة فيري/بولومي",
      status: cStrengthValid ? "Valid" : (!cStrength ? "Missing" : "Invalid"),
      statusAr: cStrengthValid ? "صالح" : (!cStrength ? "مفقود" : "غير صالح"),
      action: cStrengthValid ? "None" : "Set standard cement strength class (32.5, 42.5, 52.5)",
      actionAr: cStrengthValid ? "لا يوجد" : "حدد رتبة مقاومة الإسمنت القياسية (32.5 أو 42.5 أو 52.5 ميغاباسكال)"
    });

    const cDensity = resolved.cement.density;
    const cDensityValid = cDensity >= 2800 && cDensity <= 3300;
    items.push({
      property: "Cement Density",
      propertyAr: "الكثافة الحقيقية للإسمنت",
      propertyId: "PROP_CEM_DENSITY",
      materialId: resolved.cement.materialId,
      materialName: resolved.cement.name,
      materialRole: "cement",
      value: cDensity,
      formattedValue: `${cDensity} kg/m³`,
      unit: "kg/m³",
      source: resolved.cement.source,
      requiredFor: "Absolute volumetric balance equation (1000 L / m³)",
      requiredForAr: "معادلة الحجم المطلق لـ 1000 لتر من الخرسانة",
      status: cDensityValid ? "Valid" : (!cDensity ? "Missing" : "Invalid"),
      statusAr: cDensityValid ? "صالح" : (!cDensity ? "مفقود" : "غير صالح"),
      action: cDensityValid ? "None" : "Specify cement density in Material Library (typically 3100 kg/m³)",
      actionAr: cDensityValid ? "لا يوجد" : "أدخل الكثافة الحقيقية للإسمنت في مستودع المواد (3100 كجم/م³ عيارياً)"
    });

    // 2. FINE AGGREGATE (SAND) CHECKS
    // -------------------------------------------------------------------------
    const sandHasId = Boolean(resolved.fineAggregate.materialId);
    items.push({
      property: "Sand Selection",
      propertyAr: "اختيار مادة الرمل",
      propertyId: "PROP_SND_SELECTION",
      materialId: resolved.fineAggregate.materialId,
      materialName: resolved.fineAggregate.name,
      materialRole: "sand",
      value: resolved.fineAggregate.materialId,
      formattedValue: resolved.fineAggregate.name || "None",
      unit: "-",
      source: resolved.fineAggregate.source,
      requiredFor: "Fine skeleton and workability paste carrier",
      requiredForAr: "الهيكل الحبيبي الناعم وملاط تشغيل الخرسانة",
      status: sandHasId ? "Valid" : "Missing",
      statusAr: sandHasId ? "صالح" : "مفقود",
      action: sandHasId ? "None" : "Select an approved Sand material in Mix Preparation",
      actionAr: sandHasId ? "لا يوجد" : "يرجى اختيار مادة رمل معتمدة من مستودع المواد"
    });

    const fm = resolved.fineAggregate.finenessModulus;
    const fmValid = fm >= 1.5 && fm <= 3.8;
    items.push({
      property: "Sand Fineness Modulus (FM)",
      propertyAr: "معامل نعومة الرمل (Fineness Modulus)",
      propertyId: "PROP_SND_FM",
      materialId: resolved.fineAggregate.materialId,
      materialName: resolved.fineAggregate.name,
      materialRole: "sand",
      value: fm,
      formattedValue: fm ? fm.toFixed(2) : "None",
      unit: "-",
      source: resolved.finenessModulusSource === "derived_from_granulometry" ? "Derived from Sieve Curve" : resolved.fineAggregate.source,
      requiredFor: "Sand ratio (G/S) and Dreux reference curve pivot point",
      requiredForAr: "تحديد نسبة الرمل والحصى وإحداثيات نقطة الانعطاف في منحنى درو",
      status: fmValid ? "Valid" : (!fm ? "Missing" : "Invalid"),
      statusAr: fmValid ? "صالح" : (!fm ? "مفقود" : "غير صالح"),
      action: fmValid ? "None" : "Input sand Fineness Modulus or Granulometry in Material Library",
      actionAr: fmValid ? "لا يوجد" : "أدخل معامل النعومة أو بيانات التدرج الحبيبي للرمل في مستودع المواد"
    });

    const sandSG = resolved.fineAggregate.specificGravity;
    const sandSGValid = sandSG >= 2.0 && sandSG <= 3.2;
    items.push({
      property: "Sand Specific Gravity",
      propertyAr: "الكثافة النوعية للرمل (Specific Gravity)",
      propertyId: "PROP_SND_SPECIFIC_GRAVITY",
      materialId: resolved.fineAggregate.materialId,
      materialName: resolved.fineAggregate.name,
      materialRole: "sand",
      value: sandSG,
      formattedValue: `${sandSG.toFixed(2)} (${resolved.fineAggregate.density} kg/m³)`,
      unit: "Dimensionless / kg/m³",
      source: resolved.fineAggregate.source,
      requiredFor: "Volumetric calculation of dry sand weight per cubic meter",
      requiredForAr: "حساب الوزن الجاف للرمل لكل متر مكعب خرسانة بمعادلة الحجم المطلق",
      status: sandSGValid ? "Valid" : (!sandSG ? "Missing" : "Invalid"),
      statusAr: sandSGValid ? "صالح" : (!sandSG ? "مفقود" : "غير صالح"),
      action: sandSGValid ? "None" : "Set sand specific gravity / density in Material Library",
      actionAr: sandSGValid ? "لا يوجد" : "أدخل الكثافة النوعية أو الظاهرية للرمل في مستودع المواد"
    });

    // 3. COARSE AGGREGATE (GRAVEL) CHECKS & DMAX
    // -------------------------------------------------------------------------
    const gravelHasId = Boolean(resolved.coarseAggregate.materialId);
    items.push({
      property: "Gravel Selection",
      propertyAr: "اختيار مادة الحصى",
      propertyId: "PROP_GRV_SELECTION",
      materialId: resolved.coarseAggregate.materialId,
      materialName: resolved.coarseAggregate.name,
      materialRole: "gravel",
      value: resolved.coarseAggregate.materialId,
      formattedValue: resolved.coarseAggregate.name || "None",
      unit: "-",
      source: resolved.coarseAggregate.source,
      requiredFor: "Coarse granular skeleton and structural load bearing",
      requiredForAr: "الهيكل الحبيبي الخشن ومقاومة الأحمال الإنشائية",
      status: gravelHasId ? "Valid" : "Missing",
      statusAr: gravelHasId ? "صالح" : "مفقود",
      action: gravelHasId ? "None" : "Select an approved Gravel material in Mix Preparation",
      actionAr: gravelHasId ? "لا يوجد" : "يرجى اختيار مادة حصى معتمدة من مستودع المواد"
    });

    const dMax = resolved.dMax;
    const dMaxValid = dMax >= 4 && dMax <= 150;
    items.push({
      property: "Maximum Aggregate Size (Dmax)",
      propertyAr: "المقاس الأقصى للركام (Dmax)",
      propertyId: "PROP_GRV_DMAX",
      materialId: resolved.coarseAggregate.materialId,
      materialName: resolved.coarseAggregate.name,
      materialRole: "gravel",
      value: dMax,
      formattedValue: dMax ? `${dMax} mm` : "None",
      unit: "mm",
      source: resolved.dMaxSource === "derived_from_granulometry" ? "Derived from Sieve Curve" : resolved.coarseAggregate.source,
      requiredFor: "Dreux reference curve inflection point (X=D/2) and basic water demand",
      requiredForAr: "نقطة الانعطاف لمنحنى درو القياسي (X=D/2) واحتياج الماء الأساسي للخلطة",
      status: dMaxValid ? "Valid" : (!dMax ? "Missing" : "Invalid"),
      statusAr: dMaxValid ? "صالح" : (!dMax ? "مفقود" : "غير صالح"),
      action: dMaxValid ? "None" : "Complete Dmax or Granulometry curve for gravel in Material Library",
      actionAr: dMaxValid ? "لا يوجد" : "أدخل قيمة Dmax أو جدول التدرج الحبيبي للحصى في مستودع المواد"
    });

    const gravelSG = resolved.coarseAggregate.specificGravity;
    const gravelSGValid = gravelSG >= 2.0 && gravelSG <= 3.5;
    items.push({
      property: "Gravel Specific Gravity",
      propertyAr: "الكثافة النوعية للحصى (Specific Gravity)",
      propertyId: "PROP_GRV_SPECIFIC_GRAVITY",
      materialId: resolved.coarseAggregate.materialId,
      materialName: resolved.coarseAggregate.name,
      materialRole: "gravel",
      value: gravelSG,
      formattedValue: `${gravelSG.toFixed(2)} (${resolved.coarseAggregate.density} kg/m³)`,
      unit: "Dimensionless / kg/m³",
      source: resolved.coarseAggregate.source,
      requiredFor: "Volumetric balance equation to calculate dry gravel mass",
      requiredForAr: "معادلة الحجم المطلق لتحديد كتلة الحصى الجاف في المتر المكعب",
      status: gravelSGValid ? "Valid" : (!gravelSG ? "Missing" : "Invalid"),
      statusAr: gravelSGValid ? "صالح" : (!gravelSG ? "مفقود" : "غير صالح"),
      action: gravelSGValid ? "None" : "Set gravel density / specific gravity in Material Library",
      actionAr: gravelSGValid ? "لا يوجد" : "أدخل الكثافة الحقيقية أو النوعية للحصى في مستودع المواد"
    });

    // 4. WATER CHECKS
    // -------------------------------------------------------------------------
    const waterHasId = Boolean(resolved.water.materialId);
    items.push({
      property: "Water Selection",
      propertyAr: "اختيار مياه الخلط",
      propertyId: "PROP_WAT_SELECTION",
      materialId: resolved.water.materialId,
      materialName: resolved.water.name,
      materialRole: "water",
      value: resolved.water.materialId,
      formattedValue: resolved.water.name || "None",
      unit: "-",
      source: resolved.water.source,
      requiredFor: "Hydration reaction and plastic workability",
      requiredForAr: "تفاعل الإماهة مع الإسمنت والتشغيلية اللدنة",
      status: waterHasId ? "Valid" : "Missing",
      statusAr: waterHasId ? "صالح" : "مفقود",
      action: waterHasId ? "None" : "Select mixing water in Mix Preparation",
      actionAr: waterHasId ? "لا يوجد" : "اختر مياه الخلط من مستودع المواد"
    });

    // 5. PROJECT PARAMETER CHECKS
    // -------------------------------------------------------------------------
    const fck = resolved.targetStrength;
    const fckValid = fck >= 10 && fck <= 120;
    items.push({
      property: "Target Compressive Strength (fck28)",
      propertyAr: "المقاومة المميزة المستهدفة (fck28)",
      propertyId: "PARAM_PROJ_FCK28",
      materialRole: "project",
      value: fck,
      formattedValue: `${fck} MPa`,
      unit: "MPa",
      source: "Project Input",
      requiredFor: "Target mean strength fcm28 and water-to-cement ratio (W/C)",
      requiredForAr: "تحديد المقاومة المتوسطة fcm28 ونسبة الماء إلى الإسمنت W/C",
      status: fckValid ? "Valid" : (!fck ? "Missing" : "Invalid"),
      statusAr: fckValid ? "صالح" : (!fck ? "مفقود" : "غير صالح"),
      action: fckValid ? "None" : "Set target compressive strength fck28 between 10 and 100 MPa",
      actionAr: fckValid ? "لا يوجد" : "حدد المقاومة المميزة المستهدفة بين 10 و 100 ميغاباسكال"
    });

    const slump = resolved.workability;
    const slumpValid = slump >= 0 && slump <= 30;
    items.push({
      property: "Target Slump",
      propertyAr: "الهبوط المستهدف (Slump)",
      propertyId: "PARAM_PROJ_SLUMP",
      materialRole: "project",
      value: slump,
      formattedValue: `${slump} cm`,
      unit: "cm",
      source: "Project Input",
      requiredFor: "Initial water demand and vibration coefficient in Dreux-Gorisse",
      requiredForAr: "تحديد كمية الماء الابتدائية ومعامل الدمك والاهتزاز",
      status: slumpValid ? "Valid" : (!slump ? "Missing" : "Invalid"),
      statusAr: slumpValid ? "صالح" : (!slump ? "مفقود" : "غير صالح"),
      action: slumpValid ? "None" : "Set target slump between 0 and 25 cm",
      actionAr: slumpValid ? "لا يوجد" : "حدد قيمة الهبوط المستهدف بين 0 و 25 سم"
    });

    // Evaluation
    const missingOrInvalid = items.filter(i => i.status !== "Valid");
    const canCalculate = missingOrInvalid.length === 0;
    const validCount = items.filter(i => i.status === "Valid").length;
    const missingCount = items.filter(i => i.status === "Missing").length;
    const invalidCount = items.filter(i => i.status === "Invalid").length;

    const summaryAr = canCalculate 
      ? "جميع المدخلات والخصائص الهندسية مكتملة ومتطابقة مع اشتراطات طريقة Dreux-Gorisse. المحرك جاهز لإجراء الحساب واستخراج أوزان الخلطة الجافة."
      : `تم حجب الحساب (CALCULATION_BLOCKED): يوجد ${missingCount} خاصية مفقودة و ${invalidCount} خاصية غير مطابقة للمواصفات. يرجى استكمال البيانات أدناه لتمكين المحرك من حل معادلة الخلطة.`;

    const summaryEn = canCalculate
      ? "All engineering inputs and material properties are complete and comply with Dreux-Gorisse method constraints. Engine is ready to compute dry mix weights."
      : `Calculation blocked (CALCULATION_BLOCKED): ${missingCount} properties missing and ${invalidCount} properties invalid. Complete the itemized requirements below to enable calculation.`;

    return {
      canCalculate,
      status: canCalculate ? "CALCULATION_READY" : "CALCULATION_BLOCKED",
      summaryAr,
      summaryEn,
      totalRequiredChecked: items.length,
      validCount,
      missingCount,
      invalidCount,
      items,
      missingOrInvalidItems: missingOrInvalid
    };
  }
}
