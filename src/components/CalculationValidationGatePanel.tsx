import React from "react";
import { ShieldCheck, ShieldAlert, AlertTriangle, Info, ArrowLeftRight } from "lucide-react";
import { ValidationGateResult } from "../engine/validationGate";

interface CalculationValidationGatePanelProps {
  validation: ValidationGateResult;
  onNavigateToInputs: () => void;
  language: "ar" | "fr" | "en";
  setActiveSidebarTab?: (tab: any) => void;
  materialsDatabase?: any[];
  inputs?: any;
}

const LOCALIZED_MESSAGES: Record<"ar" | "fr" | "en", Record<string, { title: string; action: string }>> = {
  ar: {
    concrete_type_incompatible: {
      title: "لا يمكن إنشاء التقرير لأن المدخلات غير مناسبة وتتعارض تماماً مع متطلبات صنف الخرسانة المحدد.",
      action: "الإجراء المقترح: يرجى الضغط على زر 'تطبيق التوصيات' في الخطوة 2 لضبط المدخلات الفنية (المقاومة المستهدفة، الهبوط، الملدنات الفائقة، غبار السيليكا) تلقائياً بما يتطابق مع هذا النوع."
    },
    missing: {
      title: "لا يمكن إنشاء التقرير لأن بعض المدخلات الأساسية ناقصة أو غير صالحة.",
      action: "الإجراء المقترح: قم بتدوين كامل المعايير الضرورية (المقاومة المطلوبة fck28، قياس التميز slump، القطر الأكبر Dmax، مواصفات المواد) لتشغيل خوارزمية الحل بنجاح."
    },
    negative: {
      title: "لا يمكن إنشاء التقرير لأن الحسابات تحتوي على قيم سالبة غير منطقية.",
      action: "الإجراء المقترح: يرجى مراجعة وتعديل قيم الأوزان للأركام والإسمنت والمياه المضافة لمنع وجود نتائج سالبة غير منطقية."
    },
    moisture_water: {
      title: "لا يمكن إنشاء التقرير لأن رطوبة الركام أكبر من ماء التصميم. يجب تعديل الرطوبة أو إعادة حساب الخلطة.",
      action: "الإجراء المقترح: يرجى الاتجاه لتخفيض نسبة رطوبة الرمل أو الحصى، أو إقرار ماء تصميم أساسي أكبر لتفادي المياه الحرة الفائضة عن الحاجة."
    },
    wc_ratio: {
      title: "لا يمكن إنشاء التقرير لأن نسبة الماء إلى الإسمنت خارج الحدود المنطقية.",
      action: "الإجراء المقترح: يرجى ضبط كمية ماء التصميم الإجمالي أو الإسمنت للتأكد من المحافظة على نسبة W/C عيارية تتراوح بين 0.25 و 0.75 لتحقيق الانضغاط والحدود الهندسية المقبولة."
    },
    cement_range: {
      title: "لا يمكن إنشاء التقرير لأن كمية الإسمنت خارج المجال المنطقي للخرسانة العادية.",
      action: "الإجراء المقترح: تدوين وزن إسمنت ملائم بين 150 كجم/م³ و 700 كجم/م³ للخرسانات العادية."
    },
    water_range: {
      title: "لا يمكن إنشاء التقرير لأن كمية ماء التصميم خارج المجال المنطقي.",
      action: "الإجراء المقترح: يرجى صياغة ماء تصميم يتراوح بين 80 و 300 لتر/م³ لتفادي الجفاف الشديد أو الإفراط غير المقبول في تميع العينات."
    },
    weight_range: {
      title: "لا يمكن إنشاء التقرير لأن الوزن الإجمالي للتشغيلة خارج المجال المنطقي للخرسانة العادية.",
      action: "الإجراء المقترح: يرجى تعديل أوزان المواد الجافة (الإسمنت والرمل والحصى والماء المضاف) ليبقى وزن المتر المكعب العادي بين 1800 و 2700 كجم/م³."
    },
    sand_ratio: {
      title: "لا يمكن إنشاء التقرير لأن توزيع الرمل والحصى غير منطقي.",
      action: "الإجراء المقترح: يجب ضبط وتعديل تدرج ونسب سحب الركام بحيث لا تقل نسبة الرمل الكلية عن 25% ولا تزيد عن 60% من الركام الكلي."
    },
    moisture_range: {
      title: "لا يمكن إنشاء التقرير لأن قيم الرطوبة أو الامتصاص خارج المجال المنطقي.",
      action: "الإجراء المقترح: يرجى ضبط نسب الرطوبة لتكون رطوبة الرمل (أقل من 20٪)، رطوبة الحصى (أقل من 10٪)، والامتصاص قياسياً ومطابقاً للواقع."
    },
    contradiction: {
      title: "لا يمكن إنشاء التقرير بسبب تناقض بين الوزن الجاف والوزن الرطب للركام.",
      action: "الإجراء المقترح: لا يمكن هندسياً أن يقل الوزن الرطب للركام عن وزنه الجاف عند إدخال رطوبة موجبة. يرجى فحص الحسابات أو المدخلات."
    },
    cost_sum: {
      title: "لا يمكن إنشاء التقرير لأن مجموع الكلفة لا يطابق تفاصيل الكلفة.",
      action: "الإجراء المقترح: تم الكشف عن تباين حسابي بين مجموع بنود الكلفة الفردية والقيمة الكلية. يرجى تصفح أسعار المدخلات وإعادة الصياغة."
    },
    unit_mix: {
      title: "خلط غير متناسق في الوحدات",
      action: "الإجراء المقترح: تأكد من مكاملة المشروع في النظام المتري بالكامل وتجنب استخدام أي وحدات غير معتمدة."
    },
    sand_wet_moisture_mismatch: {
      title: "لا يمكن إنشاء التقرير لأن وزن الرمل الرطب لا يطابق معادلة الرطوبة.",
      action: "الإجراء المقترح: يرجى التحقق من وزن الرمل الرطب ومطابقته لنسبة الرطوبة المُدخلة."
    },
    gravel_wet_moisture_mismatch: {
      title: "لا يمكن إنشاء التقرير لأن وزن الحصى الرطب لا يطابق معادلة الرطوبة.",
      action: "الإجراء المقترح: يرجى التحقق من وزن الحصى الرطب ومطابقته لنسبة الرطوبة المُدخلة."
    },
    total_moisture_water_mismatch: {
      title: "لا يمكن إنشاء التقرير لأن كمية ماء الرطوبة الكلي لا تطابق معادلة الرطوبة للركام.",
      action: "الإجراء المقترح: تحقق من معادلات المياه ومحتوى الرطوبة للركام الكلي."
    },
    absorption_water_mismatch: {
      title: "لا يمكن إنشاء التقرير لأن كمية ماء الامتصاص للركام لا تطابق معادلة الامتصاص.",
      action: "الإجراء المقترح: تحقق من قيمة امتصاص الماء للأركام."
    },
    aggregate_free_water_mismatch: {
      title: "لا يمكن إنشاء التقرير لأن الماء الحر للركام لا يطابق معادلات الرطوبة والامتصاص.",
      action: "الإجراء المقترح: يرجى التحقق من حسابات المياه الحرة المكتسبة من الرطوبة والامتصاص."
    },
    absorption_deficit_mismatch: {
      title: "لا يمكن إنشاء التقرير لأن قيمة عجز الامتصاص للركام لا تطابق قيم الرطوبة والامتصاص.",
      action: "الإجراء المقترح: تصفح العجز في الامتصاص ومعالجته في الخلطة."
    },
    actual_water_added_mismatch: {
      title: "لا يمكن إنشاء التقرير لأن كمية الماء المضاف فعلياً لا تطابق معادلة تصحيح الرطوبة والامتصاص.",
      action: "الإجراء المقترح: ضبط كمية الماء الفعلي المضاف للتشغيلة."
    },
    total_batch_weight_mismatch: {
      title: "لا يمكن إنشاء التقرير لأن الوزن الإجمالي للتشغيلة لا يطابق مجموع المواد الفعلية.",
      action: "الإجراء المقترح: تأكد من تناسق الوزن الإجمالي مع مجموع الإسمنت والماء والركام الرطب والملدنات."
    },
    water_cement_ratio_mismatch: {
      title: "لا يمكن إنشاء التقرير لأن نسبة الماء إلى الإسمنت لا تطابق معادلتها الحسابية.",
      action: "الإجراء المقترح: تأكد من صحة حساب نسبة W/C الفعالة."
    },
    contains_nan_or_infinity: {
      title: "لا يمكن إنشاء التقرير بسبب وجود قيم غير معقولة حسابياً (NaN أو جيب ما لا نهاية).",
      action: "الإجراء المقترح: يرجى التحقق من صحة كافة تفاصيل المدخلات وخلو المقادير من القسمة على صفر أو القيم المفقودة."
    },
    result_invalid: {
      title: "الحسابات غير صالحة ولا مطابقة للمعايير المطلوبة.",
      action: "الإجراء المقترح: يرجى التحقق من رسائل الخطأ التفصيلية لتصحيح التدرج أو الأبعاد."
    },
    material_blocked: {
      title: "لا يمكن حساب الخلطة قبل إدخال مواد المشروع في مستودع المواد وتفعيلها.",
      action: "الإجراء المقترح: أدخل مواد المشروع أولًا في مستودع المواد: الإسمنت، الرمل، الحصى، ومياه الخلط. لا يمكن تشغيل الحساب قبل إدخال الخصائص الحقيقية للمواد."
    },
    material_diagnostic_only: {
      title: "الحساب هندسي تشخيصي وتجريبي فقط بسبب عدم تحديد مواد أساسية معتمدة من مستودع المواد.",
      action: "الإجراء المقترح: يرجى الانتقال إلى خطوة اختيار المواد وتعيين الإسمنت، الرمل، الحصى، والماء من المستودع لتفعيل اعتماد التصميم وحفظ التقرير."
    },
    en206_non_compliant: {
      title: "الخلطة غير مطابقة للمواصفة القياسية الأوروبية EN 206.",
      action: "الإجراء المقترح: يرجى ضبط نسبة الماء إلى الإسمنت ومحتوى الإسمنت كحد أدنى بما يتوافق مع فئة التعرض المحددة."
    },
    materials_missing: {
      title: "المواد المطلوبة للخلطة غير محددة أو مفقودة من مستودع المواد.",
      action: "الإجراء المقترح: يرجى تحديد الإسمنت، الرمل، الحصى، والمياه من مستودع المواد لتشغيل الحسابات."
    },
    properties_missing: {
      title: "الخصائص الهندسية المطلوبة للمواد (مثل الكثافة، الرطوبة، والامتصاص) غير موجودة أو غير صالحة.",
      action: "الإجراء المقترح: يرجى تعبئة جميع الخصائص الفيزيائية للمواد المحددة في مستودع المواد."
    },
    granular_optimization_not_approved: {
      title: "لم يتم اعتماد تحسين تدرج الحبيبات في مركز الهندسة الحبيبية.",
      action: "الإجراء المقترح: يرجى الانتقال إلى مركز الهندسة الحبيبية، والتحقق من تدرج الركام ثم الضغط على زر 'اعتماد ونقل البيانات'."
    },
    aggregate_percentages_not_100: {
      title: "مجموع نسب خلط الركام لا يساوي 100%.",
      action: "الإجراء المقترح: يرجى موازنة نسب خلط الركام في مركز الهندسة الحبيبية لتساوي 100% تماماً."
    },
    particle_size_distribution_invalid: {
      title: "منحنى التوزيع الحبيبي المعتمد غير صالح أو يحتوي على قيم غير مقبولة.",
      action: "الإجراء المقترح: يرجى فحص تدرج الرمل والحصى في مركز الهندسة الحبيبية للتأكد من ملاءمة القيم والنسب الحبيبية."
    },
    project_name_missing: {
      title: "اسم المشروع الإنشائي مفقود أو غير معرّف.",
      action: "الإجراء المقترح: يرجى تحديد اسم المشروع في علبة مشاريع مستودع التخزين لتنشيط الخلطة بشكل قانوني."
    },
    project_client_missing: {
      title: "اسم العميل أو مالك المشروع غير محدد.",
      action: "الإجراء المقترح: يرجى الانتقال إلى علامة التبويب المشاريع وملء حقل العميل الفعال لتكامل الفواتير والتقارير."
    },
    project_plant_missing: {
      title: "محطة خلط البيتون غير محددة للمشروع.",
      action: "الإجراء المقترح: يرجى تصفح تبويب المشاريع واختيار محطة الخلط لربط الإنتاج الفعلي بالموقع الإنشائي."
    },
    generic: {
      title: "خطأ هندسي في مطابقة المعايير",
      action: "الإجراء المقترح: يرجى إعادة مراجعة وتصفح أحدث مدخلات التصميم في لوحة الإدخال والتحقق من متطابقة البارامترات الهندسية."
    }
  },
  en: {
    concrete_type_incompatible: {
      title: "The report cannot be generated because inputs are incompatible and conflict with the selected concrete type requirements.",
      action: "Recommended Action: Click 'Apply Suggestions' under Step 2 to automatically adjust technical parameters (target strength, slump, superplasticizer, silica fume) tailored for this concrete class."
    },
    missing: {
      title: "The report cannot be generated because some core inputs are missing or invalid.",
      action: "Recommended Action: Specify all necessary design parameters (requested fck28, target slump, max aggregate size Dmax, and materials spec) to execute the design algorithm."
    },
    negative: {
      title: "The report cannot be generated because calculation results contain illogical negative values.",
      action: "Recommended Action: Review and adjust material batch weights (aggregates, cement, added water) to prevent mathematically impossible negative outputs."
    },
    moisture_water: {
      title: "The report cannot be generated because aggregate moisture exceeds design water. Moisture correction is impossible.",
      action: "Recommended Action: Decrease sand/gravel surface moisture values, or increase baseline design water to avoid surplus free run-off water."
    },
    wc_ratio: {
      title: "The report cannot be generated because the water/cement (W/C) ratio is outside logical limits.",
      action: "Recommended Action: Adjust total design water or cement content to maintain a standard W/C ratio between 0.25 and 0.75 for compliance."
    },
    cement_range: {
      title: "The report cannot be generated because cement content is outside the logical range for standard concrete.",
      action: "Recommended Action: Maintain a practical cement weight between 150 kg/m³ and 700 kg/m³ for normal weight concretes."
    },
    water_range: {
      title: "The report cannot be generated because design mixing water is outside the logical range.",
      action: "Recommended Action: Target an absolute mixing water amount between 80 and 300 L/m³ to avoid extreme dryness or excessive fluid liquefaction."
    },
    weight_range: {
      title: "The report cannot be generated because the total batch weight per m³ is outside standard concrete thresholds.",
      action: "Recommended Action: Adjust material dosages so the total calculated fresh concrete unit weight sits within a safe 1800 to 2700 kg/m³ range."
    },
    sand_ratio: {
      title: "The report cannot be generated because the sand-to-aggregate ratio is illogical.",
      action: "Recommended Action: Adjust aggregate fractions such that fine sand comprises between 25% and 60% of the combined total skeleton."
    },
    moisture_range: {
      title: "The report cannot be generated because moisture or absorption parameters are outside realistic physical boundaries.",
      action: "Recommended Action: Set moisture ranges realistically: sand moisture (<20%), gravel moisture (<10%), and standard aggregate absorption rates."
    },
    contradiction: {
      title: "The report cannot be generated due to a mathematical contradiction between dry and wet aggregate weights.",
      action: "Recommended Action: It is physically impossible for wet aggregate weight to fall below dry target weight under positive moisture. Verify inputs."
    },
    cost_sum: {
      title: "The report cannot be generated because cost breakdown summation is inconsistent with the total cost.",
      action: "Recommended Action: An itemized sum variance was detected against the total cost. Verify material unit rates and recalculate."
    },
    unit_mix: {
      title: "Inconsistent Unit Mix",
      action: "Recommended Action: Ensure the project is fully compiled under SI Metric units and avoid any unsupported units or parameters."
    },
    sand_wet_moisture_mismatch: {
      title: "The report cannot be generated because wet sand weight does not match the moisture equation.",
      action: "Recommended Action: Check and verify wet sand weight against specified moisture inputs."
    },
    gravel_wet_moisture_mismatch: {
      title: "The report cannot be generated because wet gravel weight does not match the moisture equation.",
      action: "Recommended Action: Check and verify wet gravel weight against specified moisture inputs."
    },
    total_moisture_water_mismatch: {
      title: "The report cannot be generated because total aggregate moisture water does not match the moisture equation.",
      action: "Recommended Action: Verify water calculations and moisture content of aggregates."
    },
    absorption_water_mismatch: {
      title: "The report cannot be generated because aggregate absorption water does not match the absorption equation.",
      action: "Recommended Action: Check absorption settings and formulas for aggregates."
    },
    aggregate_free_water_mismatch: {
      title: "The report cannot be generated because aggregate free surface water does not match moisture and absorption equations.",
      action: "Recommended Action: Verify free water calculations from moisture and absorption rates."
    },
    absorption_deficit_mismatch: {
      title: "The report cannot be generated because aggregate absorption deficit does not match moisture and absorption rates.",
      action: "Recommended Action: Review absorption deficit calculations."
    },
    actual_water_added_mismatch: {
      title: "The report cannot be generated because the actual water to add does not match the moisture and absorption correction equations.",
      action: "Recommended Action: Adjust total added mixing water based on moisture correction."
    },
    total_batch_weight_mismatch: {
      title: "The report cannot be generated because the total real batch weight does not match the sum of actual constituent weights.",
      action: "Recommended Action: Ensure total dosage matches the exact sum of cement, added water, wet aggregates, and admixtures."
    },
    water_cement_ratio_mismatch: {
      title: "The report cannot be generated because the water/cement ratio does not match its calculation equation.",
      action: "Recommended Action: Verify water/cement (W/C) math based on effective water and cement dosage."
    },
    contains_nan_or_infinity: {
      title: "The report cannot be generated because calculation results contain a non-numeric error (NaN or Infinity).",
      action: "Recommended Action: Verify input variables and ensure no zero-division or uninitialized parameters are processed."
    },
    result_invalid: {
      title: "The mix design is marked as mathematically or physically invalid.",
      action: "Recommended Action: Inspect underlying errors and resolve aggregate or cementitious balance issues."
    },
    material_blocked: {
      title: "The report cannot be generated because unapproved, rejected, or inactive materials are used in the mix.",
      action: "Recommended Action: Review the materials repository and assign approved, active basic constituents to this formulation."
    },
    material_diagnostic_only: {
      title: "Calculation is diagnostic and experimental only because approved basic materials have not been selected from the repository.",
      action: "Recommended Action: Navigate to the materials selection step and assign cement, sand, gravel, and water from the repository to enable full validation and report saving."
    },
    en206_non_compliant: {
      title: "The mixture is non-compliant with standard EN 206 limits.",
      action: "Recommended Action: Adjust total binder, minimum cement weight, or maximum standard W/C ratio for the selected exposure class."
    },
    materials_missing: {
      title: "Required mix materials are missing or not selected from the repository.",
      action: "Recommended Action: Please select cement, sand, gravel, and water from the Material Library first."
    },
    properties_missing: {
      title: "Required material engineering properties (density, moisture, absorption) are missing or invalid.",
      action: "Recommended Action: Enter all physical properties for selected materials in the Material Library."
    },
    granular_optimization_not_approved: {
      title: "Granular optimization has not been approved in the Granular Engineering Center.",
      action: "Recommended Action: Go to the Granular Engineering Center, verify aggregates grading and click 'Approve & Transfer'."
    },
    aggregate_percentages_not_100: {
      title: "Aggregate proportions do not sum to exactly 100%.",
      action: "Recommended Action: Balance the aggregate mixing ratios in the Granular Engineering Center to total exactly 100%."
    },
    particle_size_distribution_invalid: {
      title: "The approved aggregate particle size distribution curve is invalid.",
      action: "Recommended Action: Check aggregate sieve grading curves in the Granular Engineering Center."
    },
    project_name_missing: {
      title: "Construction project name is missing or undefined.",
      action: "Recommended Action: Specify the active project name in the Projects Vault to validate the mix design record."
    },
    project_client_missing: {
      title: "Project client/owner is missing or unspecified.",
      action: "Recommended Action: Navigate to the Projects tab and specify the active client to synchronize invoices and reports."
    },
    project_plant_missing: {
      title: "Concrete batching plant is missing or unspecified.",
      action: "Recommended Action: Go to the Projects tab and select the target mixing plant to link formulation with site production."
    },
    generic: {
      title: "Engineering constraint conformance error",
      action: "Recommended Action: Double-check formulation inputs in the active config pane and check compliance with engineering codes."
    }
  },
  fr: {
    concrete_type_incompatible: {
      title: "Le rapport ne peut pas être généré car les paramètres saisis sont incompatibles avec les exigences du type de béton sélectionné.",
      action: "Action recommandée : Cliquez sur 'Appliquer les suggestions' à l'étape 2 pour configurer automatiquement les paramètres requis (résistance, affaissement, plastifiants, fumée de silice) pour ce type."
    },
    missing: {
      title: "Le rapport ne peut pas être généré car certains paramètres fondamentaux sont manquants ou invalides.",
      action: "Action recommandée : Veuillez renseigner tous les paramètres nécessaires (fc28 ciblé, affaissement, dMax, caractéristiques des matériaux) pour exécuter l'algorithme."
    },
    negative: {
      title: "Le rapport ne peut pas être généré car les résultats contiennent des masses ou valeurs négatives illogiques.",
      action: "Action recommandée : Vérifiez et ajustez les pesées des matériaux (granulats, ciment, eau) pour éviter des résultats mathématiquement impossibles."
    },
    moisture_water: {
      title: "Le rapport ne peut pas être généré car l'apport hydrique des granulats humides excède l'eau de formulation.",
      action: "Action recommandée : Réduisez la teneur en eau (humidité) du sable ou du gravier, ou augmentez l'eau de formulation pour éliminer l'excès d'eau libre."
    },
    wc_ratio: {
      title: "Le rapport ne peut pas être généré car le rapport Eau/Ciment (E/C) est en dehors des limites logiques.",
      action: "Action recommandée : Ajustez la quantité d'eau efficace ou le dosage en ciment pour maintenir un rapport E/C conforme entre 0,25 et 0,75."
    },
    cement_range: {
      title: "Le rapport ne peut pas être généré car le dosage en ciment est hors spécifications pour un béton structurel standard.",
      action: "Action recommandée : Ajustez le dosage en ciment pour obtenir une valeur pratique comprise entre 150 kg/m³ et 700 kg/m³."
    },
    water_range: {
      title: "Le rapport ne peut pas être généré car le dosage en eau de formulation est hors limites physiques.",
      action: "Action recommandée : Visez une quantité totale d'eau efficace entre 80 et 300 L/m³ pour éviter une sécheresse extrême ou une liquéfaction excessive."
    },
    weight_range: {
      title: "Le rapport ne peut pas être généré car la masse volumique totale calculée est hors spécifications.",
      action: "Action recommandée : Modifiez les dosages matériels pour que la masse volumique du béton frais reste comprise entre 1800 et 2700 kg/m³."
    },
    sand_ratio: {
      title: "Le rapport ne peut pas être généré car la proportion de sables par rapport aux gravillons est déséquilibrée.",
      action: "Action recommandée : Ajustez les fractions de granulats pour obtenir un pourcentage de sables de 25% à 60% par rapport au squelette granulaire total."
    },
    moisture_range: {
      title: "Le rapport ne peut pas être généré car les valeurs d'humidité ou d'absorption sont physiquement irréalistes.",
      action: "Action recommandée : Corrigez les humidités : sable (<20%), gravier (<10%), et les taux d'absorption standard correspondants."
    },
    contradiction: {
      title: "Le rapport ne peut pas être généré en raison d'une contradiction physique entre la masse sèche et humide des granulats.",
      action: "Action recommandée : Il est physiquement impossible d'avoir une masse humide inférieure à la masse sèche avec une humidité positive."
    },
    cost_sum: {
      title: "Le rapport ne peut pas être généré car la somme du détail des coûts diverge du coût total.",
      action: "Action recommandée : Une incohérence de tarification a été détectée. Veuillez passer en revue les prix unitaires de chaque constituant."
    },
    unit_mix: {
      title: "Mélange incohérent d'unités",
      action: "Action recommandée : Assurez-vous que le projet est entièrement formulé dans le système métrique SI."
    },
    sand_wet_moisture_mismatch: {
      title: "Le rapport ne peut pas être généré car la masse du sable humide ne correspond pas à l'équation d'humidité.",
      action: "Action recommandée : Vérifiez la masse du sable humide par rapport au taux d'humidité."
    },
    gravel_wet_moisture_mismatch: {
      title: "Le rapport ne peut pas être généré car la masse du gravier humide ne correspond pas à l'équation d'humidité.",
      action: "Action recommandée : Vérifiez la masse du gravier humide par rapport au taux d'humidité."
    },
    total_moisture_water_mismatch: {
      title: "Le rapport ne peut pas être généré car la quantité d'eau totale d'humidité ne correspond pas à l'équation.",
      action: "Action recommandée : Vérifiez les équations hydrauliques et d'humidité du squelette."
    },
    absorption_water_mismatch: {
      title: "Le rapport ne peut pas être généré car la quantité d'eau d'absorption ne correspond pas à l'équation.",
      action: "Action recommandée : Contrôlez le taux d'absorption d'eau des granulats."
    },
    aggregate_free_water_mismatch: {
      title: "Le rapport ne peut pas être généré car l'eau libre des granulats ne correspond pas aux équations d'humidité/absorption.",
      action: "Action recommandée : Vérifiez les calculs de l'eau libre acquise par humidité/absorption."
    },
    absorption_deficit_mismatch: {
      title: "Le rapport ne peut pas être généré car le déficit d'absorption ne correspond pas aux taux d'humidité/absorption.",
      action: "Action recommandée : Vérifiez le calcul du déficit d'absorption."
    },
    actual_water_added_mismatch: {
      title: "Le rapport ne peut pas être généré car l'eau de gâchée réelle à ajouter ne correspond pas à l'équation de correction.",
      action: "Action recommandée : Ajustez la quantité d'eau réellement ajoutée selon la correction."
    },
    total_batch_weight_mismatch: {
      title: "Le rapport ne peut pas être généré car la masse volumique réelle de la gâchée diverge de la somme des constituants.",
      action: "Action recommandée : Assurez-vous que la masse totale correspond exactement à la somme (ciment, eau de gâchée, granulats humides, adjuvants)."
    },
    water_cement_ratio_mismatch: {
      title: "Le rapport ne peut pas être généré car le rapport Eau/Ciment calculé diverge de sa valeur théorique.",
      action: "Action recommandée : Vérifiez le calcul du rapport E/C efficace."
    },
    contains_nan_or_infinity: {
      title: "Le rapport ne peut pas être généré car les calculs contiennent des erreurs arithmétiques (NaN ou Infini).",
      action: "Action recommandée : Vérifiez que les entrées ne provoquent pas de division par zéro."
    },
    result_invalid: {
      title: "La formulation est marquée comme non valide physiques ou mathématiques.",
      action: "Action recommandée : Consultez les messages d'incapacité physiques et modifiez les proportions."
    },
    material_blocked: {
      title: "Le rapport ne peut pas être généré car des matériaux non approuvés, rejetés ou inactifs sont utilisés.",
      action: "Action recommandée : Veuillez revoir le référentiel des matériaux et sélectionner des composants approuvés et actifs."
    },
    material_diagnostic_only: {
      title: "Les calculs sont uniquement diagnostiques et expérimentaux car aucun matériau de base approuvé n'a été sélectionné.",
      action: "Action recommandée : Veuillez associer un ciment, un sable, un gravier et de l'eau issus du référentiel des matériaux approuvés pour activer la validation et sauvegarder le rapport."
    },
    en206_non_compliant: {
      title: "La formulation n'est pas conforme aux exigences strictes de la norme EN 206.",
      action: "Action recommandée : Rectifiez le rapport Eau/Ciment ou le dosage en liant minimal requis pour cette classe d'exposition."
    },
    materials_missing: {
      title: "Les matériaux requis pour la formulation sont manquants ou non sélectionnés.",
      action: "Action recommandée : Veuillez sélectionner le ciment, le sable, le gravier et l'eau dans la Bibliothèque des Matériaux."
    },
    properties_missing: {
      title: "Les propriétés d'ingénierie requises (densité, humidité, absorption) sont manquantes ou invalides.",
      action: "Action recommandée : Veuillez renseigner toutes les caractéristiques physiques des matériaux sélectionnés."
    },
    granular_optimization_not_approved: {
      title: "L'optimisation granulaire n'a pas été approuvée dans le Centre d'Ingénierie Granulaire.",
      action: "Action recommandée : Veuillez vous rendre dans le Centre d'Ingénierie Granulaire, vérifier les courbes et cliquer sur 'Approuver & Transférer'."
    },
    aggregate_percentages_not_100: {
      title: "Le total des pourcentages des granulats ne fait pas exactement 100%.",
      action: "Action recommandée : Équilibrez les proportions de mélange des granulats pour atteindre exactement 100%."
    },
    particle_size_distribution_invalid: {
      title: "La courbe de distribution granulométrique approuvée est invalide.",
      action: "Action recommandée : Vérifiez les courbes d'analyse granulométrique des granulats."
    },
    project_name_missing: {
      title: "Le nom du projet de construction est manquant ou indéfini.",
      action: "Action recommandée : Spécifiez le nom du projet actif dans l'onglet Projets pour valider la formulation."
    },
    project_client_missing: {
      title: "Le client/propriétaire du projet est manquant ou non spécifié.",
      action: "Action recommandée : Accédez à l'onglet Projets et spécifiez le client actif pour synchroniser les rapports."
    },
    project_plant_missing: {
      title: "La centrale à béton est manquante ou non spécifiée.",
      action: "Action recommandée : Allez dans l'onglet Projets et sélectionnez la centrale de malaxage cible."
    },
    generic: {
      title: "Erreur de conformité aux limites de formulation",
      action: "Action recommandée : Passez en revue vos paramètres d'entrée dans le panneau de gauche pour corriger les écarts de conformité."
    }
  }
};

const resolveErrorMessage = (error: string, lang: "ar" | "fr" | "en") => {
  const dictionary = LOCALIZED_MESSAGES[lang] || LOCALIZED_MESSAGES["en"];
  return dictionary[error] || dictionary["generic"];
};

const resolveWarningMessage = (warn: string, lang: "ar" | "fr" | "en") => {
  const dictionary: Record<"ar" | "fr" | "en", Record<string, string>> = {
    ar: {
      wc_high: "نسبة الماء إلى الإسمنت مرتفعة وقد تؤثر على المقاومة والمتانة.",
      cement_low: "كمية الإسمنت منخفضة وقد لا تحقق المتانة المطلوبة.",
      cement_high: "كمية الإسمنت مرتفعة وقد تسبب حرارة إماهة عالية أو انكماشاً."
    },
    en: {
      wc_high: "The W/C ratio is high and could affect compressive strength and durability.",
      cement_low: "Low cement dosage may not achieve sufficient structural durability.",
      cement_high: "High cement dosage is flagged; potential risk of mass thermal cracks or shrinkage."
    },
    fr: {
      wc_high: "Le rapport E/C est élevé, ce qui pourrait compromettre la résistance et la durabilité.",
      cement_low: "Le dosage en ciment est faible et pourrait ne pas garantir la durabilité requise.",
      cement_high: "Dosage élevé en ciment ; risque d'élévation thermique ou de retrait fissurant."
    }
  };
  const langDict = dictionary[lang] || dictionary["en"];
  return langDict[warn] || warn;
};

const resolveInfoMessage = (inf: string, lang: "ar" | "fr" | "en") => {
  const dictionary: Record<"ar" | "fr" | "en", Record<string, string>> = {
    ar: {
      basis_si: "أساس الحساب: النظام المتري الهندسي SI",
      cost_basis_wet: "كلفة الركام: أساس الوزن الرطب",
      cost_basis_dry: "كلفة الركام: أساس الوزن الجاف"
    },
    en: {
      basis_si: "Basis: SI Metric System of Units",
      cost_basis_wet: "Aggregate Cost basis: Wet Weight",
      cost_basis_dry: "Aggregate Cost basis: Dry Weight"
    },
    fr: {
      basis_si: "Base : Système métrique international SI",
      cost_basis_wet: "Coût des granulats : Base poids humide",
      cost_basis_dry: "Coût des granulats : Base poids sec"
    }
  };
  const langDict = dictionary[lang] || dictionary["en"];
  return langDict[inf] || inf;
};

export const CalculationValidationGatePanel: React.FC<CalculationValidationGatePanelProps> = ({
  validation,
  onNavigateToInputs,
  language,
  setActiveSidebarTab,
  materialsDatabase,
  inputs
}) => {
  const { isValidForReport, criticalErrors, warnings, infos } = validation;
  const isRtl = language === "ar";

  const getMissingPropertiesDetails = () => {
    if (!inputs || !materialsDatabase) return [];
    const missing = [];
    
    // Cement
    if (inputs.selectedCementId) {
      const cement = materialsDatabase.find((m: any) => m.id === inputs.selectedCementId);
      if (cement) {
        const dens = cement.density || inputs.cementDensity;
        if (!dens || dens <= 0) {
          missing.push({
            materialId: cement.id,
            materialName: cement.name || (language === "ar" ? "إسمنت المشروع" : "Project Cement"),
            propertyAr: "الكثافة المطلقة للإسمنت",
            propertyEn: "Cement absolute density",
            propertyFr: "Masse volumique absolue du ciment",
          });
        }
        const str = parseFloat(cement.strengthClass || "0");
        if (!str || str <= 0) {
          missing.push({
            materialId: cement.id,
            materialName: cement.name || (language === "ar" ? "إسمنت المشروع" : "Project Cement"),
            propertyAr: "رتبة مقاومة الإسمنت",
            propertyEn: "Cement strength class",
            propertyFr: "Classe de résistance du ciment",
          });
        }
      }
    }
    
    // Sand
    if (inputs.selectedSandId) {
      const sand = materialsDatabase.find((m: any) => m.id === inputs.selectedSandId);
      if (sand) {
        const dens = sand.ssdDensity || sand.density || sand.relativeDensity || sand.specificGravity;
        if (!dens || dens <= 0) {
          missing.push({
            materialId: sand.id,
            materialName: sand.name || (language === "ar" ? "الرمل" : "Sand"),
            propertyAr: "الكثافة النوعية للرمل",
            propertyEn: "Sand relative density / Gs",
            propertyFr: "Masse volumique du sable",
          });
        }
        const abs = sand.absorption;
        if (abs === undefined || abs < 0) {
          missing.push({
            materialId: sand.id,
            materialName: sand.name || (language === "ar" ? "الرمل" : "Sand"),
            propertyAr: "معامل الامتصاص للرمل",
            propertyEn: "Sand water absorption %",
            propertyFr: "Absorption d'eau du sable %",
          });
        }
        const moist = sand.moisture;
        if (moist === undefined || moist < 0) {
          missing.push({
            materialId: sand.id,
            materialName: sand.name || (language === "ar" ? "الرمل" : "Sand"),
            propertyAr: "محتوى رطوبة الرمل",
            propertyEn: "Sand moisture content %",
            propertyFr: "Teneur en eau du sable %",
          });
        }
        const bulk = sand.bulkDensity;
        if (!bulk || bulk <= 0) {
          missing.push({
            materialId: sand.id,
            materialName: sand.name || (language === "ar" ? "الرمل" : "Sand"),
            propertyAr: "الكثافة الظاهرية للرمل",
            propertyEn: "Sand bulk density",
            propertyFr: "Masse volumique apparente du sable",
          });
        }
      }
    }
    
    // Gravel
    if (inputs.selectedGravelId) {
      const gravel = materialsDatabase.find((m: any) => m.id === inputs.selectedGravelId);
      if (gravel) {
        const dens = gravel.ssdDensity || gravel.density || gravel.relativeDensity || gravel.specificGravity;
        if (!dens || dens <= 0) {
          missing.push({
            materialId: gravel.id,
            materialName: gravel.name || (language === "ar" ? "الحصى" : "Gravel"),
            propertyAr: "الكثافة النوعية للبحص / الحصى",
            propertyEn: "Gravel relative density / Gs",
            propertyFr: "Masse volumique du gravier",
          });
        }
        const abs = gravel.absorption;
        if (abs === undefined || abs < 0) {
          missing.push({
            materialId: gravel.id,
            materialName: gravel.name || (language === "ar" ? "الحصى" : "Gravel"),
            propertyAr: "معامل الامتصاص للبحص / الحصى",
            propertyEn: "Gravel water absorption %",
            propertyFr: "Absorption d'eau du gravier %",
          });
        }
        const moist = gravel.moisture;
        if (moist === undefined || moist < 0) {
          missing.push({
            materialId: gravel.id,
            materialName: gravel.name || (language === "ar" ? "الحصى" : "Gravel"),
            propertyAr: "محتوى رطوبة البحص / الحصى",
            propertyEn: "Gravel moisture content %",
            propertyFr: "Teneur en eau du gravier %",
          });
        }
        const bulk = gravel.bulkDensity;
        if (!bulk || bulk <= 0) {
          missing.push({
            materialId: gravel.id,
            materialName: gravel.name || (language === "ar" ? "الحصى" : "Gravel"),
            propertyAr: "الكثافة الظاهرية للحصى / الركام",
            propertyEn: "Gravel bulk density",
            propertyFr: "Masse volumique apparente du gravier",
          });
        }
      }
    }
    
    return missing;
  };

  // Panel text localization
  const allPanelTexts = {
    ar: {
      btnReturn: "الرجوع لتصحيح المدخلات",
      title: "بوابة التحقق الهندسي: Calculation Validation Gate",
      subtitle: "تم اكتشاف تناقضات برمجية وهندسية تمنع إصدار شهادة الخلطة أو التقارير.",
      validTitle: "بوابة التحقق الهندسي: الحسابات ممتازة ومتناسقة",
      validSubtitle: "تطابق تام وموثق لكافة معايير خريطة صياغة خرسانة سنوسي-دركس غوريس.",
      warnHeader: "توصيات وتحذيرات هندسية هامة (لا توقف توليد التقرير)"
    },
    en: {
      btnReturn: "Return to Input Correction",
      title: "Calculation Validation Gate",
      subtitle: "Engineering or logical conflicts detected that block report generation.",
      validTitle: "Validation Gate: Computations Verified & Consistent",
      validSubtitle: "Perfect standard compliance for all structural concrete formulation checks.",
      warnHeader: "Important Engineering Warnings & Advisory (Report allowed)"
    },
    fr: {
      btnReturn: "Corriger les paramètres d'entrée",
      title: "Portail de Validation des Calculs (Validation Gate)",
      subtitle: "Incohérences de formulation identifiées bloquant la certification de formule.",
      validTitle: "Validation : Calculs Cohérents & Qualité Conforme",
      validSubtitle: "Respect absolu de tous les critères de la formulation du mélange.",
      warnHeader: "Avertissements & Recommandations Techniques (Rapport autorisé)"
    }
  };
  const panelTexts = allPanelTexts[language] || allPanelTexts["en"];

  return (
    <div id="calculation-validation-gate-container" className={`w-full animate-fade-in ${isRtl ? "text-right" : "text-left"}`}>
      {!isValidForReport ? (
        <div className="bg-rose-50/95 dark:bg-rose-950/20 border-2 border-rose-300 dark:border-rose-900 rounded-2xl p-6 shadow-md space-y-4">
          <div className={`flex items-center justify-between border-b border-rose-200/50 dark:border-rose-900/50 pb-3 ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
            <button
              onClick={onNavigateToInputs}
              className="flex items-center gap-2 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer font-sans"
            >
              <ArrowLeftRight size={14} />
              {panelTexts.btnReturn}
            </button>
            <div className={`flex items-center gap-2.5 ${isRtl ? "flex-row" : "flex-row-reverse text-left"}`}>
              <div>
                <h4 className="text-sm font-black text-rose-800 dark:text-rose-100 font-sans">
                  {panelTexts.title}
                </h4>
                <p className="text-[11px] text-rose-500 font-medium">
                  {panelTexts.subtitle}
                </p>
              </div>
              <div className="p-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg shrink-0">
                <ShieldAlert size={22} />
              </div>
            </div>
          </div>

          <div className="space-y-3.5 mt-2">
            {criticalErrors.map((err, i) => {
              const localized = resolveErrorMessage(err, language);
              return (
                <div
                  key={i}
                  className="bg-white/80 dark:bg-slate-900/50 border border-rose-100 dark:border-rose-950 rounded-xl p-4 shadow-sm"
                >
                  <div className={`flex items-start gap-2.5 ${isRtl ? "justify-end flex-row" : "justify-start flex-row-reverse"}`}>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 leading-relaxed font-sans mt-0.5">
                      {localized.title}
                    </span>
                    <div className="p-1 bg-rose-50 text-rose-600 dark:bg-rose-900/10 rounded-md shrink-0 mt-0.5">
                      <ShieldAlert size={14} className="animate-pulse" />
                    </div>
                  </div>
                  <div className={`mt-2 ${isRtl ? "pr-6 border-r-2 mr-2" : "pl-6 border-l-2 ml-2"} border-slate-300 dark:border-slate-800`}>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed font-sans">
                      {localized.action}
                    </p>
                  </div>

                  {err === "properties_missing" && getMissingPropertiesDetails().length > 0 && (
                    <div className={`mt-3 pt-3 border-t border-rose-100/40 dark:border-rose-950/20 space-y-2 ${isRtl ? "text-right" : "text-left"}`}>
                      <p className="text-[11px] font-bold text-rose-700 dark:text-rose-400">
                        {isRtl ? "⚠️ الخصائص المفقودة المكتشفة:" : "⚠️ Detected Missing Properties:"}
                      </p>
                      <div className="grid grid-cols-1 gap-1.5">
                        {getMissingPropertiesDetails().map((missingProp, idx) => (
                          <div 
                            key={idx} 
                            className={`flex items-center justify-between gap-3 p-2 bg-rose-50/30 dark:bg-rose-950/10 rounded-lg border border-rose-100/30 dark:border-rose-950/20 ${isRtl ? "flex-row-reverse" : "flex-row"}`}
                          >
                            <div className="text-[10.5px]">
                              <span className="font-bold text-slate-700 dark:text-slate-300">
                                {missingProp.materialName}
                              </span>
                              <span className="mx-1.5 text-slate-400">|</span>
                              <span className="text-rose-600 dark:text-rose-400 font-semibold font-sans">
                                {language === "ar" ? missingProp.propertyAr : language === "fr" ? missingProp.propertyFr : missingProp.propertyEn}
                              </span>
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => {
                                if (setActiveSidebarTab) {
                                  setActiveSidebarTab("materials_library");
                                  setTimeout(() => {
                                    const triggerEdit = new CustomEvent("trigger-edit-material", { 
                                      detail: { materialId: missingProp.materialId } 
                                    });
                                    window.dispatchEvent(triggerEdit);
                                  }, 150);
                                }
                              }}
                              className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-[10px] rounded transition-all cursor-pointer shadow-sm hover:shadow"
                            >
                              ⚙️ {isRtl ? "ضبط الآن" : language === "fr" ? "Ajuster" : "Adjust Now"}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {setActiveSidebarTab && (
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={() => {
                          const tabMap: Record<string, string> = {
                            material_blocked: "materials_library",
                            material_diagnostic_only: "materials_library",
                            materials_missing: "calculator",
                            properties_missing: "calculator",
                            granular_optimization_not_approved: "sieve",
                            aggregate_percentages_not_100: "sieve",
                            particle_size_distribution_invalid: "sieve",
                            cost_sum: "cost",
                            concrete_type_incompatible: "calculator",
                            project_name_missing: "saved_projects",
                            project_client_missing: "saved_projects",
                            project_plant_missing: "saved_projects",
                          };
                          const targetTab = tabMap[err] || "calculator";
                          setActiveSidebarTab(targetTab);
                          setTimeout(() => {
                            const errorSelectorMap: Record<string, string> = {
                              material_blocked: "materials-library-tab-panel",
                              material_diagnostic_only: "materials-library-tab-panel",
                              materials_missing: "step3-materials-selection",
                              properties_missing: "step4-material-properties",
                              granular_optimization_not_approved: "sieve-grading-tab-panel",
                              aggregate_percentages_not_100: "sieve-grading-tab-panel",
                              particle_size_distribution_invalid: "sieve-grading-tab-panel",
                              cost_sum: "advanced-financial-dashboard-container",
                              concrete_type_incompatible: "step1-project-requirements",
                              project_name_missing: "projects-vault-panel",
                              project_client_missing: "projects-vault-panel",
                              project_plant_missing: "projects-vault-panel",
                              wc_ratio: "step1-project-requirements",
                              cement_range: "step1-project-requirements",
                              water_range: "step1-project-requirements",
                              weight_range: "step1-project-requirements",
                              sand_ratio: "step1-project-requirements",
                              en206_non_compliant: "step1-project-requirements",
                              moisture_water: "step4-material-properties",
                              moisture_range: "step4-material-properties",
                              contradiction: "step4-material-properties",
                              sand_wet_moisture_mismatch: "step4-material-properties",
                              gravel_wet_moisture_mismatch: "step4-material-properties",
                              total_moisture_water_mismatch: "step4-material-properties",
                              absorption_water_mismatch: "step4-material-properties",
                              aggregate_free_water_mismatch: "step4-material-properties",
                              absorption_deficit_mismatch: "step4-material-properties",
                              actual_water_added_mismatch: "step4-material-properties",
                            };
                            const elementId = errorSelectorMap[err] || errorSelectorMap[targetTab];
                            if (elementId) {
                              const element = document.getElementById(elementId);
                              if (element) {
                                element.scrollIntoView({ behavior: "smooth", block: "center" });
                                element.classList.add("ring-4", "ring-blue-500", "dark:ring-blue-400", "ring-offset-2", "dark:ring-offset-slate-900", "transition-all", "duration-500");
                                setTimeout(() => {
                                  element.classList.remove("ring-4", "ring-blue-500", "dark:ring-blue-400", "ring-offset-2", "dark:ring-offset-slate-900");
                                }, 3000);
                              }
                            }
                          }, 150);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10.5px] rounded-lg shadow-sm transition-all cursor-pointer font-sans"
                      >
                        {(() => {
                          const labels: Record<string, Record<"ar" | "fr" | "en", string>> = {
                            materials_library: {
                              ar: "📂 الانتقال لمستودع المواد ↗",
                              en: "📂 Edit Material Library ↗",
                              fr: "📂 Éditer la Bibliothèque des Matériaux ↗"
                            },
                            materials_missing: {
                              ar: "⚙️ اختيار مواد الخلطة ↗",
                              en: "⚙️ Select Mix Materials ↗",
                              fr: "⚙️ Sélectionner les Matériaux ↗"
                            },
                            properties_missing: {
                              ar: "⚙️ إدخال خصائص المواد ↗",
                              en: "⚙️ Enter Material Properties ↗",
                              fr: "⚙️ Saisir les Propriétés ↗"
                            },
                            sieve: {
                              ar: "📈 غرابيل وتدرج الركام ↗",
                              en: "📈 Complete Sieve & Grading ↗",
                              fr: "📈 Ajuster la Courbe Granulométrique ↗"
                            },
                            cost: {
                              ar: "💰 جدول وتحليل التكاليف ↗",
                              en: "💰 Complete Price Details ↗",
                              fr: "💰 Analyser les Coûts ↗"
                            },
                            calculator: {
                              ar: "⚙️ إكمال معايير ومحددات الحساب ↗",
                              en: "⚙️ Complete Criteria ↗",
                              fr: "⚙️ Ajuster les Paramètres ↗"
                            },
                            saved_projects: {
                              ar: "📂 تعديل بيانات المشروع ↗",
                              en: "📂 Edit Project Details ↗",
                              fr: "📂 Modifier les Détails du Projet ↗"
                            }
                          };
                          const labelKey = {
                            material_blocked: "materials_library",
                            material_diagnostic_only: "materials_library",
                            materials_missing: "materials_missing",
                            properties_missing: "properties_missing",
                            granular_optimization_not_approved: "sieve",
                            aggregate_percentages_not_100: "sieve",
                            particle_size_distribution_invalid: "sieve",
                            cost_sum: "cost",
                            concrete_type_incompatible: "calculator",
                            project_name_missing: "saved_projects",
                            project_client_missing: "saved_projects",
                            project_plant_missing: "saved_projects",
                          }[err] || "calculator";
                          return labels[labelKey]?.[language] || labels[labelKey]?.["en"] || "⚙️ Complete Criteria";
                        })()}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        (() => {
          const isLimited = validation.methodApplicability?.level === "limited";
          
          const validTitle = isLimited
            ? (language === "ar" ? "بوابة التحقق الهندسي: خلطة صالحة بمحددات" : language === "fr" ? "Validation : Formule Valide avec Limitations" : "Validation Gate: Valid with Limitations")
            : panelTexts.validTitle;

          const validSubtitle = isLimited
            ? (language === "ar" ? "تم التحقق من الحسابات مع وجود قيود على قابلية تطبيق طريقة درو-غوريس القياسية." : language === "fr" ? "Calculs vérifiés mais avec des contraintes sur l'applicabilité de la méthode Dreux-Gorisse." : "Calculations verified but with constraints on standard Dreux-Gorisse applicability.")
            : panelTexts.validSubtitle;

          const containerClass = isLimited
            ? "bg-amber-50/40 dark:bg-amber-950/10 border-2 border-amber-300 dark:border-amber-900 rounded-2xl p-5 shadow-sm space-y-4"
            : "bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-5 shadow-sm space-y-4";

          const iconContainerClass = isLimited
            ? "p-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg shrink-0 animate-pulse"
            : "p-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg shrink-0";

          return (
            <div className={containerClass}>
              <div className={`flex items-center gap-2.5 border-b pb-3 ${isLimited ? "border-amber-100 dark:border-amber-950" : "border-emerald-100 dark:border-emerald-950"} ${isRtl ? "justify-end flex-row" : "justify-start flex-row-reverse"}`}>
                <div className={isRtl ? "text-right" : "text-left"}>
                  <h4 className={`text-xs font-bold font-sans ${isLimited ? "text-amber-800 dark:text-amber-100" : "text-emerald-800 dark:text-emerald-100"}`}>
                    {validTitle}
                  </h4>
                  <p className={`text-[10px] font-medium ${isLimited ? "text-amber-650 dark:text-amber-400" : "text-emerald-600"}`}>
                    {validSubtitle}
                  </p>
                </div>
                <div className={iconContainerClass}>
                  {isLimited ? <AlertTriangle size={18} /> : <ShieldCheck size={18} />}
                </div>
              </div>

              {/* Warnings Section if exists */}
              {warnings.length > 0 && (
                <div className="bg-amber-50/45 dark:bg-amber-950/5 border border-amber-250 dark:border-amber-900/50 rounded-xl p-4 space-y-2">
                  <div className={`flex items-center gap-1.5 text-amber-800 dark:text-amber-250 font-black text-[11px] mb-1 ${isRtl ? "justify-end flex-row" : "justify-start flex-row-reverse"}`}>
                    <span>{panelTexts.warnHeader}</span>
                    <AlertTriangle size={14} className="shrink-0" />
                  </div>
                  <ul className="space-y-1.5">
                    {warnings.map((warn, index) => {
                      const localizedWarn = resolveWarningMessage(warn, language);
                      return (
                        <li key={index} className={`flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-300 leading-tight ${isRtl ? "justify-end flex-row" : "justify-start flex-row-reverse text-left"}`}>
                          <span>{localizedWarn}</span>
                          <span className="text-amber-500 shrink-0 mt-0.5">•</span>
                        </li>
                      );
                    })}
                  </ul>

                  {setActiveSidebarTab && (
                    <div className="pt-2 border-t border-amber-200/40 flex justify-end">
                      <button
                        onClick={() => {
                          setActiveSidebarTab("calculator");
                          setTimeout(() => {
                            const element = document.getElementById("mixwizard-calculator-screen");
                            if (element) {
                              element.scrollIntoView({ behavior: "smooth", block: "start" });
                            }
                          }, 150);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-extrabold text-[10px] rounded-lg shadow-xs transition-all cursor-pointer font-sans"
                      >
                        {language === "ar" ? "⚙️ الانتقال لمحرك الحسابات لتعديل المعايير ↗" : language === "fr" ? "⚙️ Aller au Calculateur pour ajuster ↗" : "⚙️ Go to Calculator to Adjust Criteria ↗"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Actionable Recommendations Section if exists */}
              {validation.recommendations && validation.recommendations.length > 0 && (
                <div className="bg-blue-50/45 dark:bg-blue-950/5 border border-blue-200 dark:border-blue-900/50 rounded-xl p-4 space-y-2">
                  <div className={`flex items-center gap-1.5 text-blue-800 dark:text-blue-250 font-black text-[11px] mb-1 ${isRtl ? "justify-end flex-row" : "justify-start flex-row-reverse"}`}>
                    <span>{language === "ar" ? "التوصيات الإنشائية المقترحة" : language === "fr" ? "Recommandations Techniques" : "Actionable Engineering Recommendations"}</span>
                    <Info size={14} className="shrink-0" />
                  </div>
                  <ul className="space-y-1.5">
                    {validation.recommendations.map((rec, index) => (
                      <li key={index} className={`flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-300 leading-tight ${isRtl ? "justify-end flex-row" : "justify-start flex-row-reverse text-left"}`}>
                        <span>{rec}</span>
                        <span className="text-blue-500 shrink-0 mt-0.5">•</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Calculation Notes Section if exists */}
              {validation.calculationNotes && validation.calculationNotes.length > 0 && (
                <div className="bg-slate-50/60 dark:bg-slate-900/10 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 space-y-2">
                  <div className={`flex items-center gap-1.5 text-slate-700 dark:text-slate-250 font-bold text-[11px] mb-1 ${isRtl ? "justify-end flex-row" : "justify-start flex-row-reverse"}`}>
                    <span>{language === "ar" ? "ملاحظات الحساب والتدقيق الهندسي" : language === "fr" ? "Notes de Calcul" : "Engineering Calculation Notes"}</span>
                    <Info size={14} className="shrink-0" />
                  </div>
                  <ul className="space-y-1">
                    {validation.calculationNotes.map((note, index) => (
                      <li key={index} className={`flex items-start gap-2 text-[10.5px] text-slate-500 dark:text-slate-400 leading-tight ${isRtl ? "justify-end flex-row" : "justify-start flex-row-reverse text-left"}`}>
                        <span>{note}</span>
                        <span className="text-slate-450 shrink-0 mt-0.5">•</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Validation Info Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {infos.map((inf, idx) => (
                  <div
                    key={idx}
                    className={`bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 rounded-xl p-3 flex items-center justify-between ${isRtl ? "flex-row text-right" : "flex-row-reverse text-left"}`}
                  >
                    <div className="p-1 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-md shrink-0">
                      <Info size={13} />
                    </div>
                    <span className="text-[10.5px] font-sans font-medium text-slate-500 dark:text-slate-400 trailing-tight">
                      {resolveInfoMessage(inf, language)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
};
