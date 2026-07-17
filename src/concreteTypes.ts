/**
 * Concrete Type Validation, Recommendation, and Optimization System
 * Implements full separation of design calculations vs validation checking.
 */
import { MixDesignInput, MixDesignResult, EngineeringMaterial } from "./types";

export interface ConcreteTypeConfig {
  code: string;
  allowedCategories: string[];
  requiredCategories: string[];
  forbiddenCategories: string[];
  requiredProperties: string[];
  isMaterialCompatible: (m: EngineeringMaterial) => boolean;
  getCustomValidationErrors?: (inputs: MixDesignInput, materials: EngineeringMaterial[]) => Array<{
    id: string;
    message: string;
    recommendation: string;
  }>;
}

export const CONCRETE_TYPE_CONFIGS: Record<string, ConcreteTypeConfig> = {
  NSC: {
    code: "NSC",
    allowedCategories: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية"],
    requiredCategories: ["إسمنت", "رمال", "حصى", "ماء"],
    forbiddenCategories: ["ألياف", "إضافات معدنية", "ركام خفيف", "ركام ثقيل", "مجلدات خاصة"],
    requiredProperties: ["density", "absorption", "moisture"],
    isMaterialCompatible: (m: EngineeringMaterial) => {
      const cat = m.category;
      if (cat === "إسمنت") {
        const nameLower = (m.name || "").toLowerCase();
        const engLower = (m.englishName || "").toLowerCase();
        return !nameLower.includes("جيوبوليمر") && !engLower.includes("geopolymer") && !nameLower.includes("خبث") && !engLower.includes("slag") && !nameLower.includes("bacterial");
      }
      if (cat === "حصى") {
        return (m.density || 2600) >= 2000 && (m.density || 2600) <= 2900;
      }
      if (cat === "رمال") {
        const nameLower = (m.name || "").toLowerCase();
        const engLower = (m.englishName || "").toLowerCase();
        return !nameLower.includes("معاد") && !engLower.includes("recycled");
      }
      return true;
    }
  },
  HSC: {
    code: "HSC",
    allowedCategories: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية", "إضافات معدنية"],
    requiredCategories: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية", "إضافات معدنية"],
    forbiddenCategories: ["ألياف", "ركام خفيف", "ركام ثقيل", "مجلدات خاصة"],
    requiredProperties: ["density", "absorption", "moisture", "strengthClass"],
    isMaterialCompatible: (m: EngineeringMaterial) => {
      const cat = m.category;
      if (cat === "إسمنت") {
        const strClass = parseFloat(m.strengthClass || "0");
        return strClass >= 42.5;
      }
      if (cat === "حصى") {
        return (m.density || 2600) >= 2650;
      }
      if (cat === "إضافات معدنية") {
        const nameLower = (m.name || "").toLowerCase();
        const engLower = (m.englishName || "").toLowerCase();
        return nameLower.includes("سيليكا") || engLower.includes("silica");
      }
      if (cat === "إضافات كيميائية") {
        const nameLower = (m.name || "").toLowerCase();
        const engLower = (m.englishName || "").toLowerCase();
        return m.admixtureType === "superplasticizer" || nameLower.includes("فائق") || engLower.includes("super");
      }
      return true;
    },
    getCustomValidationErrors: (inputs) => {
      const errors = [];
      if (!inputs.dosageSuper || inputs.dosageSuper <= 0) {
        errors.push({
          id: "hsc_missing_super",
          message: "الخرسانة عالية المقاومة (HSC) تفتقر إلى ملدن فائق نشط.",
          recommendation: "يرجى اختيار مادة ملدن فائق وتحديد جرعة تزيد عن 1.0% لخفض نسبة الماء للأسمنت بشكل فعّال."
        });
      }
      if (!inputs.dosageSilicaFume || inputs.dosageSilicaFume < 5) {
        errors.push({
          id: "hsc_missing_silica",
          message: "الخرسانة عالية المقاومة تتطلب غبار السيليكا بنسبة >= 5%.",
          recommendation: "يرجى اختيار غبار سيليكا وتحديد جرعة مناسبة لتفعيل التفاعل البوزولاني الناعم."
        });
      }
      return errors;
    }
  },
  HPC: {
    code: "HPC",
    allowedCategories: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية", "إضافات معدنية"],
    requiredCategories: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية", "إضافات معدنية"],
    forbiddenCategories: ["ألياف", "ركام خفيف", "ركام ثقيل", "مجلدات خاصة"],
    requiredProperties: ["density", "absorption", "moisture", "strengthClass"],
    isMaterialCompatible: (m: EngineeringMaterial) => {
      const cat = m.category;
      if (cat === "إسمنت") {
        return true;
      }
      if (cat === "إضافات معدنية") {
        const nameLower = (m.name || "").toLowerCase();
        const engLower = (m.englishName || "").toLowerCase();
        return nameLower.includes("سيليكا") || engLower.includes("silica") || nameLower.includes("رماد") || engLower.includes("fly") || nameLower.includes("خبث") || engLower.includes("slag");
      }
      if (cat === "إضافات كيميائية") {
        const nameLower = (m.name || "").toLowerCase();
        const engLower = (m.englishName || "").toLowerCase();
        return m.admixtureType === "superplasticizer" || nameLower.includes("فائق") || engLower.includes("super");
      }
      return true;
    },
    getCustomValidationErrors: (inputs) => {
      const errors = [];
      if (!inputs.dosageSuper || inputs.dosageSuper <= 0) {
        errors.push({
          id: "hpc_missing_super",
          message: "الخرسانة عالية الأداء تتطلب ملدناً فائقاً لضمان خفض نسبة المياه والمسامية.",
          recommendation: "أضف مادة ملدن فائق (Superplasticizer) مع جرعة لا تقل عن 0.8%."
        });
      }
      if ((inputs.dosageSilicaFume || 0) <= 0 && (inputs.dosageFlyAsh || 0) <= 0 && (inputs.dosageSlag || 0) <= 0) {
        errors.push({
          id: "hpc_missing_scm",
          message: "الخرسانة عالية الأداء (HPC) تتطلب إضافة بوزولانية نشطة (رماد متطاير، غبار سيليكا، أو خبث) لزيادة المتانة والكتامة الكيميائية.",
          recommendation: "اختر مادة من الإضافات المعدنية (SCM) وضبط جرعتها."
        });
      }
      return errors;
    }
  },
  SCC: {
    code: "SCC",
    allowedCategories: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية", "إضافات معدنية"],
    requiredCategories: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية"],
    forbiddenCategories: ["ألياف", "ركام خفيف", "ركام ثقيل", "مجلدات خاصة"],
    requiredProperties: ["density", "absorption", "moisture"],
    isMaterialCompatible: (m: EngineeringMaterial) => {
      const cat = m.category;
      if (cat === "حصى") {
        return (m.dMax || 20) <= 16;
      }
      if (cat === "إضافات معدنية" || cat === "مواد مالئة") {
        const nameLower = (m.name || "").toLowerCase();
        const engLower = (m.englishName || "").toLowerCase();
        return nameLower.includes("فيلر") || nameLower.includes("جيري") || engLower.includes("filler") || engLower.includes("limestone");
      }
      if (cat === "إضافات كيميائية") {
        const nameLower = (m.name || "").toLowerCase();
        const engLower = (m.englishName || "").toLowerCase();
        return m.admixtureType === "superplasticizer" || nameLower.includes("لزوجة") || engLower.includes("vma") || engLower.includes("viscosity") || nameLower.includes("فائق") || engLower.includes("super");
      }
      return true;
    },
    getCustomValidationErrors: (inputs) => {
      const errors = [];
      if (inputs.dMax > 16) {
        errors.push({
          id: "scc_high_dmax",
          message: "القطر الأقصى للركام Dmax أكبر من 16 مم في خرسانة SCC.",
          recommendation: "يرجى تعديل القطر الأقصى للركام Dmax ليكون 16 مم أو أقل لمنع انسداد وتكتل الحبيبات عند التدفق الفراغي المزدحم بالحديد."
        });
      }
      if (!inputs.dosageSuper || inputs.dosageSuper <= 0) {
        errors.push({
          id: "scc_missing_super",
          message: "الخرسانة ذاتية الرص تتطلب ملدناً فائقاً بجرعة سيولة مرتفعة.",
          recommendation: "اختر ملدناً فائقاً عالي المدى بجرعة بين 1.0% و 2.5% لتوفير التدفق الحر تحت تأثير الوزن الذاتي."
        });
      }
      return errors;
    }
  },
  LWC: {
    code: "LWC",
    allowedCategories: ["إسمنت", "رمال", "ركام خفيف", "ماء", "إضافات كيميائية"],
    requiredCategories: ["إسمنت", "رمال", "ركام خفيف", "ماء"],
    forbiddenCategories: ["حصى", "ركام ثقيل", "ألياف", "مجلدات خاصة", "إضافات معدنية"],
    requiredProperties: ["density", "absorption", "moisture"],
    isMaterialCompatible: (m: EngineeringMaterial) => {
      return m.category === "ركام خفيف" || m.category === "إسمنت" || m.category === "رمال" || m.category === "ماء" || m.category === "إضافات كيميائية";
    }
  },
  HWC: {
    code: "HWC",
    allowedCategories: ["إسمنت", "رمال", "ركام ثقيل", "ماء", "إضافات كيميائية"],
    requiredCategories: ["إسمنت", "رمال", "ركام ثقيل", "ماء"],
    forbiddenCategories: ["حصى", "ركام خفيف", "ألياف", "مجلدات خاصة", "إضافات معدنية"],
    requiredProperties: ["density", "absorption", "moisture"],
    isMaterialCompatible: (m: EngineeringMaterial) => {
      return m.category === "ركام ثقيل" || m.category === "إسمنت" || m.category === "رمال" || m.category === "ماء" || m.category === "إضافات كيميائية";
    }
  },
  RCC: {
    code: "RCC",
    allowedCategories: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية", "إضافات معدنية"],
    requiredCategories: ["إسمنت", "رمال", "حصى", "ماء"],
    forbiddenCategories: ["ألياف", "ركام خفيف", "ركام ثقيل", "مجلدات خاصة"],
    requiredProperties: ["density", "absorption", "moisture"],
    isMaterialCompatible: (m: EngineeringMaterial) => {
      const cat = m.category;
      if (cat === "حصى") {
        return (m.dMax || 20) >= 20;
      }
      return true;
    },
    getCustomValidationErrors: (inputs) => {
      const errors = [];
      if (inputs.slump > 3) {
        errors.push({
          id: "rcc_high_slump",
          message: "الهبوط المستهدف مرتفع جداً للخرسانة المدحولة (RCC).",
          recommendation: "الخرسانة المدحولة بالحدالات تتطلب قواماً شديد الجفاف بهبوط صفر إلى 2 سم كحد أقصى لتتحمل حركة مداحل الرص."
        });
      }
      return errors;
    }
  },
  SHOTCRETE: {
    code: "SHOTCRETE",
    allowedCategories: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية", "ألياف", "إضافات معدنية"],
    requiredCategories: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية"],
    forbiddenCategories: ["ركام خفيف", "ركام ثقيل", "مجلدات خاصة"],
    requiredProperties: ["density", "absorption", "moisture"],
    isMaterialCompatible: (m: EngineeringMaterial) => {
      const cat = m.category;
      if (cat === "حصى") {
        return (m.dMax || 20) <= 16;
      }
      return true;
    },
    getCustomValidationErrors: (inputs) => {
      const errors = [];
      if (inputs.dMax > 16) {
        errors.push({
          id: "shotcrete_high_dmax",
          message: "القطر الأقصى للركام كبير نسبياً لخرسانة الرش (Shotcrete).",
          recommendation: "يفضل خفض Dmax إلى 12 مم أو 16 مم كحد أقصى لتفادي الارتداد الحبيبي الشديد للبحص وجروح الأنابيب والانسدادات الحركية."
        });
      }
      if (!inputs.dosageAccelerator || inputs.dosageAccelerator <= 0) {
        errors.push({
          id: "shotcrete_missing_accelerator",
          message: "خرسانة الرش (Shotcrete) تتطلب إضافة مسرع شك فوري لتثبيت الطبقات المنبثقة.",
          recommendation: "أضف مادة مسرع شك (Accelerator) بجرعة نشطة (مثال 3.0% - 6.0%) in قسم الإضافات الكيميائية لضمان تماسك سريع بالأسطح الرأسية."
        });
      }
      return errors;
    }
  },
  GPC: {
    code: "GPC",
    allowedCategories: ["رمال", "حصى", "ماء", "إضافات معدنية", "مجلدات خاصة"],
    requiredCategories: ["رمال", "حصى", "ماء", "إضافات معدنية", "مجلدات خاصة"],
    forbiddenCategories: ["إسمنت", "ألياف", "ركام خفيف", "ركام ثقيل"],
    requiredProperties: ["density", "absorption", "moisture"],
    isMaterialCompatible: (m: EngineeringMaterial) => {
      const cat = m.category;
      if (cat === "إسمنت") {
        return false;
      }
      if (cat === "إضافات معدنية") {
        const nameLower = (m.name || "").toLowerCase();
        const engLower = (m.englishName || "").toLowerCase();
        return nameLower.includes("رماد") || engLower.includes("fly") || nameLower.includes("خبث") || engLower.includes("slag") || nameLower.includes("سيليكا") || engLower.includes("silica");
      }
      return true;
    },
    getCustomValidationErrors: (inputs) => {
      const errors = [];
      if (!inputs.selectedSpecialBinderId) {
        errors.push({
          id: "gpc_missing_activator",
          message: "الخرسانة الجيوبوليمرية تفتقر إلى سائل التنشيط القلوي والمجلد المخصص.",
          recommendation: "اختر سائل تفعيل قلوي أو مجلد جيوبوليمر مخصص من قسم الروابط والمجلدات الخاصة لتنفيذ الترابط الجيومعدني."
        });
      }
      if ((inputs.dosageFlyAsh || 0) < 15 && (inputs.dosageSlag || 0) < 15) {
        errors.push({
          id: "gpc_missing_binders",
          message: "الخرسانة الجيوبوليمرية تتطلب نسبة كافية من الرماد المتطاير أو الخبث كمادة رابطة بديلة.",
          recommendation: "يرجى تحديد جرعة رماد متطاير أو خبث لا تقل عن 15% من وزن المزيج لتكون قاعدة التفاعل النشطة."
        });
      }
      return errors;
    }
  },
  SHC: {
    code: "SHC",
    allowedCategories: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية", "مجلدات خاصة"],
    requiredCategories: ["إسمنت", "رمال", "حصى", "ماء", "مجلدات خاصة"],
    forbiddenCategories: ["ألياف", "ركام خفيف", "ركام ثقيل"],
    requiredProperties: ["density", "absorption", "moisture"],
    isMaterialCompatible: (m: EngineeringMaterial) => {
      const cat = m.category;
      if (cat === "مجلدات خاصة") {
        const nameLower = (m.name || "").toLowerCase();
        const engLower = (m.englishName || "").toLowerCase();
        return nameLower.includes("بكتير") || nameLower.includes("بلور") || nameLower.includes("ذاتي") || engLower.includes("healing") || engLower.includes("bacterial") || engLower.includes("crystalline");
      }
      return true;
    },
    getCustomValidationErrors: (inputs) => {
      const errors = [];
      if (!inputs.selectedSpecialBinderId) {
        errors.push({
          id: "shc_missing_agent",
          message: "خرسانة المعالجة الذاتية (SHC) تتطلب اختيار عامل كبسولات ذكية أو بكتيريا Bacillus.",
          recommendation: "اختر مادة معالجة ذاتية بلورية أو كبسولات بكتيرية من قائمة الروابط والمجلدات الخاصة."
        });
      }
      return errors;
    }
  },
  RAC: {
    code: "RAC",
    allowedCategories: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية"],
    requiredCategories: ["إسمنت", "رمال", "حصى", "ماء"],
    forbiddenCategories: ["ركام خفيف", "ركام ثقيل", "مجلدات خاصة", "ألياف", "إضافات معدنية"],
    requiredProperties: ["density", "absorption", "moisture"],
    isMaterialCompatible: (m: EngineeringMaterial) => {
      const cat = m.category;
      if (cat === "حصى") {
        const nameLower = (m.name || "").toLowerCase();
        const engLower = (m.englishName || "").toLowerCase();
        return nameLower.includes("معاد") || engLower.includes("recycled") || m.type === "recycled";
      }
      return true;
    },
    getCustomValidationErrors: (inputs, materials) => {
      const errors = [];
      const gravel = materials.find(m => m.id === inputs.selectedGravelId);
      if (gravel) {
        const nameLower = (gravel.name || "").toLowerCase();
        const engLower = (gravel.englishName || "").toLowerCase();
        const isRecycled = nameLower.includes("معاد") || engLower.includes("recycled") || gravel.type === "recycled";
        if (!isRecycled) {
          errors.push({
            id: "rac_not_recycled",
            message: "الركام الخشن المحدد ليس ركاماً معاد تدويره.",
            recommendation: "خرسانة RAC تتطلب ركاماً خشناً معاد تدويره (Recycled Aggregate) من مخلفات هدم الأبنية لدعم الاستدامة."
          });
        }
      }
      return errors;
    }
  },
  PERVIOUS: {
    code: "PERVIOUS",
    allowedCategories: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية"],
    requiredCategories: ["إسمنت", "رمال", "حصى", "ماء"],
    forbiddenCategories: ["ركام خفيف", "ركام ثقيل", "مجلدات خاصة", "ألياف", "إضافات معدنية"],
    requiredProperties: ["density", "absorption", "moisture"],
    isMaterialCompatible: (m: EngineeringMaterial) => {
      return m.category !== "ألياف" && m.category !== "ركام خفيف" && m.category !== "ركام ثقيل" && m.category !== "مجلدات خاصة" && m.category !== "إضافات معدنية" && m.category !== "مواد مالئة";
    },
    getCustomValidationErrors: (inputs) => {
      const errors = [];
      if (inputs.slump > 3) {
        errors.push({
          id: "pervious_high_slump",
          message: "خرسانة المسامات تطلب قواماً شديد الجفاف (هبوط <= 3 سم).",
          recommendation: "اضبط الهبوط ليكون منخفضاً لتجنب سيلان وتجمع العجينة بقاع الخرطوش الإنشائي وسد مسارات الصرف."
        });
      }
      return errors;
    }
  },
  UHPC: {
    code: "UHPC",
    allowedCategories: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية", "ألياف", "إضافات معدنية"],
    requiredCategories: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية", "ألياف", "إضافات معدنية"],
    forbiddenCategories: ["ركام خفيف", "ركام ثقيل", "مجلدات خاصة"],
    requiredProperties: ["density", "absorption", "moisture", "strengthClass"],
    isMaterialCompatible: (m: EngineeringMaterial) => {
      const cat = m.category;
      if (cat === "إسمنت") {
        const strClass = parseFloat(m.strengthClass || "0");
        return strClass >= 52.5;
      }
      if (cat === "ألياف") {
        const nameLower = (m.name || "").toLowerCase();
        const engLower = (m.englishName || "").toLowerCase();
        return nameLower.includes("فولاذ") || engLower.includes("steel");
      }
      if (cat === "إضافات معدنية") {
        const nameLower = (m.name || "").toLowerCase();
        const engLower = (m.englishName || "").toLowerCase();
        return nameLower.includes("سيليكا") || engLower.includes("silica") || nameLower.includes("كوارتز") || engLower.includes("quartz");
      }
      if (cat === "إضافات كيميائية") {
        const nameLower = (m.name || "").toLowerCase();
        const engLower = (m.englishName || "").toLowerCase();
        return m.admixtureType === "superplasticizer" || nameLower.includes("فائق") || engLower.includes("super");
      }
      return true;
    },
    getCustomValidationErrors: (inputs) => {
      const errors = [];
      if (!inputs.selectedFiberId) {
        errors.push({
          id: "uhpc_missing_fibers",
          message: "الخرسانة فائقة المقاومة والتحمل (UHPC) تتطلب ألياف فولاذية إنشائية لمقاومة التمزيق والهندسة الهيكلية.",
          recommendation: "يرجى تفعيل واختيار ألياف فولاذية نشطة بنسبة حركية تفوق 25 كجم/م³."
        });
      }
      if (!inputs.dosageSilicaFume || inputs.dosageSilicaFume < 15) {
        errors.push({
          id: "uhpc_low_silica",
          message: "محتوى غبار السيليكا منخفض لخرسانة UHPC (يجب أن يكون >= 15%).",
          recommendation: "ارفع جرعة غبار السيليكا لتعبئة الفراغات المجهرية الفائقة التناهي بالصغر."
        });
      }
      return errors;
    }
  },
  BFUP: {
    code: "BFUP",
    allowedCategories: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية", "ألياف", "إضافات معدنية"],
    requiredCategories: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية", "ألياف", "إضافات معدنية"],
    forbiddenCategories: ["ركام خفيف", "ركام ثقيل", "مجلدات خاصة"],
    requiredProperties: ["density", "absorption", "moisture", "strengthClass"],
    isMaterialCompatible: (m: EngineeringMaterial) => {
      const cat = m.category;
      if (cat === "إسمنت") {
        const strClass = parseFloat(m.strengthClass || "0");
        return strClass >= 52.5;
      }
      if (cat === "ألياف") {
        const nameLower = (m.name || "").toLowerCase();
        const engLower = (m.englishName || "").toLowerCase();
        return nameLower.includes("فولاذ") || engLower.includes("steel");
      }
      if (cat === "إضافات معدنية") {
        const nameLower = (m.name || "").toLowerCase();
        const engLower = (m.englishName || "").toLowerCase();
        return nameLower.includes("سيليكا") || engLower.includes("silica") || nameLower.includes("كوارتز") || engLower.includes("quartz");
      }
      if (cat === "إضافات كيميائية") {
        const nameLower = (m.name || "").toLowerCase();
        const engLower = (m.englishName || "").toLowerCase();
        return m.admixtureType === "superplasticizer" || nameLower.includes("فائق") || engLower.includes("super");
      }
      return true;
    },
    getCustomValidationErrors: (inputs) => {
      const errors = [];
      if (!inputs.selectedFiberId) {
        errors.push({
          id: "bfup_missing_fibers",
          message: "الخرسانة الليفية فائقة الأداء (BFUP) تتطلب ألياف فولاذية إنشائية لضبط مقاومة الشد والانعطاف.",
          recommendation: "يرجى تحديد جرعة ألياف فولاذية نشطة ومطابقة."
        });
      }
      return errors;
    }
  },
  RC: {
    code: "RC",
    allowedCategories: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية", "إضافات معدنية"],
    requiredCategories: ["إسمنت", "رمال", "حصى", "ماء"],
    forbiddenCategories: ["ركام خفيف", "ركام ثقيل", "مجلدات خاصة"],
    requiredProperties: ["density", "absorption", "moisture"],
    isMaterialCompatible: (m) => {
      const cat = m.category;
      return cat !== "ركام خفيف" && cat !== "ركام ثقيل" && cat !== "مجلدات خاصة";
    },
    getCustomValidationErrors: (inputs) => {
      const errors = [];
      const isRounded = inputs.aggregateType === "roule";
      const dMax = inputs.dMax;
      const fce = inputs.cementClassStrength * 1.1;
      const G = isRounded ? (dMax <= 12.5 ? 0.40 : dMax <= 25 ? 0.50 : 0.55) : (dMax <= 12.5 ? 0.35 : dMax <= 25 ? 0.45 : 0.50);
      const stdDev = inputs.controlClass === "high" ? 4.0 : inputs.controlClass === "low" ? 8.0 : 6.0;
      const fcm28 = inputs.fck28 + 1.64 * stdDev;
      const approxWc = inputs.internalWcOverride || (1 / ((fcm28 / (G * fce)) + 0.5));

      if (approxWc > 0.55) {
        errors.push({
          id: "rc_high_wc",
          message: "نسبة الماء إلى الإسمنت المطلوبة مرتفعة جداً للخرسانة المسلحة التقليدية (أكبر من 0.55).",
          recommendation: "يرجى تقليل نسبة المياه المستهدفة لحماية قضبان حديد التسليح من الرطوبة والصدأ وتأمين عمر أطول للمنشأة."
        });
      }
      return errors;
    }
  },
  PUMPED: {
    code: "PUMPED",
    allowedCategories: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية", "إضافات معدنية"],
    requiredCategories: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية"],
    forbiddenCategories: ["ركام خفيف", "ركام ثقيل"],
    requiredProperties: ["density", "absorption", "moisture"],
    isMaterialCompatible: (m) => {
      const cat = m.category;
      return cat !== "ركام خفيف" && cat !== "ركام ثقيل";
    },
    getCustomValidationErrors: (inputs) => {
      const errors = [];
      if (inputs.slump < 12 || inputs.slump > 18) {
        errors.push({
          id: "pumped_slump_range",
          message: "قوام الهبوط المطلوب خارج النطاق النموذجي للضخ (12 - 18 سم).",
          recommendation: "اضبط الهبوط ليكون في النطاق الموصى به (12 إلى 18 سم) لضمان حركة سلسة بالأنابيب دون انفصال أو انسداد ميكانيكي."
        });
      }
      return errors;
    }
  },
  MASS: {
    code: "MASS",
    allowedCategories: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية", "إضافات معدنية"],
    requiredCategories: ["إسمنت", "رمال", "حصى", "ماء"],
    forbiddenCategories: ["ألياف", "مجلدات خاصة", "ركام خفيف"],
    requiredProperties: ["density", "absorption", "moisture"],
    isMaterialCompatible: (m) => {
      const cat = m.category;
      return cat !== "ألياف" && cat !== "مجلدات خاصة" && cat !== "ركام خفيف";
    },
    getCustomValidationErrors: (inputs) => {
      const errors = [];
      if (inputs.fck28 > 35) {
        errors.push({
          id: "mass_high_strength",
          message: "المقاومة المميزة المطلوبة مرتفعة جداً للخرسانة الكتلية الضخمة.",
          recommendation: "يفضل خفض المقاومة المطلوبة أو استخدام إسمنت معتدل الإماهة CEM II لتقليل الانبعاثات الحرارية والتشققات بقلب المصبوبة الكتلية."
        });
      }
      return errors;
    }
  },
  MARINE: {
    code: "MARINE",
    allowedCategories: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية", "إضافات معدنية"],
    requiredCategories: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية", "إضافات معدنية"],
    forbiddenCategories: ["ركام خفيف"],
    requiredProperties: ["density", "absorption", "moisture", "strengthClass"],
    isMaterialCompatible: (m) => {
      const cat = m.category;
      return cat !== "ركام خفيف";
    },
    getCustomValidationErrors: (inputs) => {
      const errors = [];
      const isRounded = inputs.aggregateType === "roule";
      const dMax = inputs.dMax;
      const fce = inputs.cementClassStrength * 1.1;
      const G = isRounded ? (dMax <= 12.5 ? 0.40 : dMax <= 25 ? 0.50 : 0.55) : (dMax <= 12.5 ? 0.35 : dMax <= 25 ? 0.45 : 0.50);
      const stdDev = inputs.controlClass === "high" ? 4.0 : inputs.controlClass === "low" ? 8.0 : 6.0;
      const fcm28 = inputs.fck28 + 1.64 * stdDev;
      const approxWc = inputs.internalWcOverride || (1 / ((fcm28 / (G * fce)) + 0.5));

      if (approxWc > 0.40) {
        errors.push({
          id: "marine_high_wc",
          message: "نسبة الماء للأسمنت المطلوبة مرتفعة جداً للخرسانة البحرية المعرضة للأملاح والكبريتات.",
          recommendation: "يرجى خفض نسبة W/C لتكون 0.40 أو أقل لعرقلة نفاذ الأملاح وحماية تسليح الأساسات."
        });
      }
      return errors;
    }
  },
  PRECAST: {
    code: "PRECAST",
    allowedCategories: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية", "إضافات معدنية"],
    requiredCategories: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية"],
    forbiddenCategories: ["مجلدات خاصة"],
    requiredProperties: ["density", "absorption", "moisture", "strengthClass"],
    isMaterialCompatible: (m) => {
      return m.category !== "مجلدات خاصة";
    },
    getCustomValidationErrors: (inputs) => {
      const errors = [];
      if (inputs.cementClassStrength < 42.5) {
        errors.push({
          id: "precast_low_cement_strength",
          message: "رتبة مقاومة الإسمنت منخفضة لإنتاج عناصر خرسانية مسبقة الصنع سريعة القوالب.",
          recommendation: "يفضل استخدام إسمنت CEM I 42.5N أو CEM I 52.5N لتعجيل زمن إزالة القوالب بالمصانع."
        });
      }
      return errors;
    }
  },
  PRESTRESSED: {
    code: "PRESTRESSED",
    allowedCategories: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية", "إضافات معدنية"],
    requiredCategories: ["إسمنت", "رمال", "حصى", "ماء", "إضافات كيميائية", "إضافات معدنية"],
    forbiddenCategories: ["ركام خفيف", "مجلدات خاصة"],
    requiredProperties: ["density", "absorption", "moisture", "strengthClass"],
    isMaterialCompatible: (m) => {
      const cat = m.category;
      return cat !== "ركام خفيف" && cat !== "مجلدات خاصة";
    },
    getCustomValidationErrors: (inputs) => {
      const errors = [];
      if (inputs.fck28 < 45) {
        errors.push({
          id: "prestressed_low_strength",
          message: "المقاومة المميزة المطلوبة منخفضة للخرسانة مسبقة الإجهاد.",
          recommendation: "يرجى زيادة قيمة المقاومة الإنشائية لتكون 45 ميغاباسكال على الأقل لتتحمل قوى شد أوتار الفولاذ الإنشائية العالية."
        });
      }
      return errors;
    }
  }
};

export interface ValidationResult {
  paramName: string;
  arabicName: string;
  status: "compliant" | "warning" | "non_compliant";
  requirement: string;
  actual: string;
  note: string;
}

export interface ConcreteTypeMeta {
  code: string;
  nameAr: string;
  nameFr: string;
  nameEn: string;
  descriptionAr: string;
  generalUsageAr: string;
  isSpecialized: boolean; // True for UHPC/BFUP
  materialsAr?: string;   // Materials used (المواد)
  mixingAr?: string;      // Mixing & preparation (الخلط والتحضير)
}

export const CONCRETE_TYPES_CATALOG: ConcreteTypeMeta[] = [
  {
    code: "NSC",
    nameAr: "الخرسانة عادية المقاومة (NSC)",
    nameFr: "Béton de Résistance Ordinaire",
    nameEn: "Normal Strength Concrete",
    descriptionAr: "الخرسانة التقليدية المستخدمة في العناصر الإنشائية العادية التي لا تتعرض لإجهادات ميكانيكية أو بيئية حرجة.",
    generalUsageAr: "المباني العادية، البلاطات، الأعمدة والجسور العادية، الأرصفة، والأساسات غير الخاصة.",
    isSpecialized: false,
    materialsAr: "إسمنت عادي (مثل CEM I 42.5 أو CEM II)، رمل، حصى متدرج، ماء، وأحياناً مضاف مميّع بسيط.",
    mixingAr: "تُخلط المواد الجافة أولاً: حصى + رمل + إسمنت، ثم يضاف الماء تدريجياً حتى نحصل على قوام قابل للصب. لا يجب زيادة الماء كثيراً لأنه يضعف المقاومة."
  },
  {
    code: "HSC",
    nameAr: "الخرسانة عالية المقاومة (HSC)",
    nameFr: "Béton Haute Résistance (BHR)",
    nameEn: "High Strength Concrete",
    descriptionAr: "خرسانة تمتاز بمقاومة ضغط فائقة تتعدى 40 أو 50 ميغاباسكال، لتخفيض أبعاد العناصر الإنشائية للأبراج الشاهقة الحاملة وتجهيزات الكباري.",
    generalUsageAr: "الأبراج السكنية الشاهقة، الجسور، الأعمدة ذات الأحمال الكبيرة، والمنشآت التي تحتاج مقاومة ضغط عالية.",
    isSpecialized: false,
    materialsAr: "إسمنت عالي الجودة وفائق القوة (CEM I 52.5)، ركام قوي ونظيف جداً (مثل البازلت)، ملدنات فائقة (Superplasticizers) قوية، وغبار السيليكا (Silica Fume).",
    mixingAr: "خلط ميكانيكي دقيق ومكثف لضمان توزيع الملدن الفائق وتشتيت غبار السيليكا بشكل متجانس بالخلطة، مع الالتزام التام بنسب الماء المنخفضة جداً (W/C <= 0.35)."
  },
  {
    code: "HPC",
    nameAr: "الخرسانة عالية الأداء (HPC / BHP)",
    nameFr: "Béton à Hautes Performances (BHP)",
    nameEn: "High Performance Concrete",
    descriptionAr: "خرسانة مصممة خصيصاً لتوفير متانة فائقة ومقاومة نفاذية ممتازة في البيئات القاسية (المقالع الرملية المالحة والمناطق الساحلية الكيميائية).",
    generalUsageAr: "الأشغال البحرية والموانئ، السدود، كباري الطرق السريعة ومصانع المياه الكيميائية والبيئات الكبريتية.",
    isSpecialized: false,
    materialsAr: "إسمنت مركب أو مقاوم للكبريتات، غبار السيليكا، رماد متطاير (Fly Ash) أو خبث الأفران (Slag)، ركام بازلتي مكسر حاد الأطراف، وملدنات فائقة متطورة لنسبة مياه منخفضة جداً (W/C <= 0.38).",
    mixingAr: "إضافة دقيقة للمواد الناعمة وتمديد زمن الخلط لضمان التفاعل البوزولاني الكامل وملء الفراغات المجهرية بالكامل، مما يمنع تسرب الرطوبة والكلوريدات المدمرة لحديد التسليح."
  },
  {
    code: "SCC",
    nameAr: "الخرسانة ذاتية الرص (SCC / BAP)",
    nameFr: "Béton Autoplaçant (BAP)",
    nameEn: "Self-Consolidating Concrete",
    descriptionAr: "خرسانة عالية السيولة والانسيابية تتدفق تحت تأثير وزنها الذاتي، تملأ القوالب الضيقة والمزدحمة بحديد التسليح تماماً دون الحاجة للهز الميكانيكي أو حدوث انفصال للركام.",
    generalUsageAr: "العناصر رقيقة الأبعاد، الجدران المسلحة بكثافة، القوالب المعقدة الممتلئة بحديد التسليح، والقطع مسبقة الصنع المعقدة.",
    isSpecialized: false,
    materialsAr: "إسمنت، كمية كبيرة من المواد الناعمة أو بودرة الحشو (Limestone Filler)، ركام صغير وخفيف الحركة (Dmax <= 16mm)، رمل نهري مستدير لتقليل الاحتكاك، وجرعة عالية من الملدنات الفائقة القوية ومعدلات اللزوجة.",
    mixingAr: "الخلط لضمان تماسك العجينة اللزجة ومنع الانعزال الحبيبي أو النضح المائي. يتم صبها بدون هز ميكانيكي لتموجها الحر التام بفعل ثقلها الذاتي لتملأ كل الممرات الضيقة."
  },
  {
    code: "FRC",
    nameAr: "الخرسانة المسلحة بالألياف (FRC)",
    nameFr: "Béton Renforcé de Fibres",
    nameEn: "Fiber-Reinforced Concrete",
    descriptionAr: "خرسانة معززة بجرعات محددة من الألياف (الفولاذية، الزجاجية، أو البولي بروبيلين) لزيادة طاقة الامتصاص والتحكم في شروخ الانكماش البلاستيكي والحراري والصدمات.",
    generalUsageAr: "أرضيات المصانع والمستودعات الثقيلة، الطرق الخرسانية، مسارات المطارات المعرضة للصدمات الفورية، وتبطين الأنفاق والممرات المائية.",
    isSpecialized: false,
    materialsAr: "مكونات الخرسانة التقليدية مضافاً إليها ألياف فولاذية مقوسة الأطراف (للأغراض الهيكلية) أو ألياف البولي بروبيلين (لمقاومة الشروخ السطحية والانكماش البلاستيكي)، وملدنات فائقة لتعويض القابلية التشغيلية.",
    mixingAr: "إضافة الألياف بانتظام وتدريجياً أثناء عملية الخلط لضمان توزيعها العشوائي المتجانس في الخلطة ومنع تكتل الألياف (Fiber Balling) مع استمرار الخلط لمدة لا تقل عن 5 دقائق."
  },
  {
    code: "LWC",
    nameAr: "الخرسانة خفيفة الوزن (LWC)",
    nameFr: "Béton Léger",
    nameEn: "Lightweight Concrete",
    descriptionAr: "خرسانة ذات كثافة جافة منخفضة يتم إنتاجها باستخدام ركام خفيف الوزن (مثل الطين المتمدد أو الخفاف) لتقليل الأحمال الميتة وتوفير عزل حراري وصوتي مميز.",
    generalUsageAr: "الأسقف الديكورية العازلة، الجدران غير الحاملة، أسقف الترميم، وتخفيف الوزن الإجمالي للهيكل الإنشائي للمباني القديمة.",
    isSpecialized: false,
    materialsAr: "إسمنت، ركام خفيف الوزن (طين متمدد Expanded Clay أو حجر الخفاف الطبيعي Pumice)، رمل ناعم، ومضافات حابسة للهواء لرفع كفاءة العزل الحراري وخفض الوزن الحجمي.",
    mixingAr: "يجب غمر الركام خفيف الوزن بالماء قبل الخلط بـ 24 ساعة لضمان عدم امتصاصه للماء الصافي المخصص للخلطة. يتم الخلط بلطف لتفادي تكسر جزيئاته الهشة أثناء التحضير الهيكلي."
  },
  {
    code: "HWC",
    nameAr: "الخرسانة ثقيلة الوزن (HWC)",
    nameFr: "Béton Lourd",
    nameEn: "Heavyweight Concrete",
    descriptionAr: "خرسانة مصممة بكثافة تتجاوز 2900 كجم/م³ باستخدام ركامات معدنية عالية الكثافة (مثل الباريت أو الهيماتيت) تستخدم بشكل أساسي للوقاية من الإشعاعات.",
    generalUsageAr: "جدران غرف الأشعة في المستشفيات، المفاعلات النووية، وموازنات الموانئ ومراكز الأشعة الطبية.",
    isSpecialized: false,
    materialsAr: "إسمنت، ركام معدني ثقيل عالي الكثافة (مثل البارييت Barite أو الهيماتيت Hematite الكثيف)، رمل خشن قوي ذو قدرة ارتكاب عالية، وملدنات فائقة للدمك الأقصى.",
    mixingAr: "عدم تجاوز 50-60% من سعة الخلاطة المعتادة نظراً للوزن الهائل للمواد لتجنب زيادة العبء على المحرك. يراعى الصب السريع لتجنب مخاطر الانفصال بالترسيب السريع للحصى الثقيلة."
  },
  {
    code: "RCC",
    nameAr: "الخرسانة المدحولة (RCC)",
    nameFr: "Béton Compacté au Rouleau",
    nameEn: "Roller-Compacted Concrete",
    descriptionAr: "خلطة جافة خالية من الهبوط تفرش بآلات رصف الطرق وتدمك بمداحل ميكانيكية ثقيلة لصب الكتل الخرسانية الضخمة بمحتوى إسمنت اقتصادي وحرارة منخفضة.",
    generalUsageAr: "السدود الجاذبية الضخمة، مواقف السيارات الصناعية الثقيلة، وقواعد الطرق السريعة وساحات الشحن الكبرى.",
    isSpecialized: false,
    materialsAr: "محتوى إسمنت اقتصادي ومنخفض (CEM II/B)، رماد متطاير (Fly Ash) بنسب عالية للحد من الانبعاثات الحرارية، ركام خشن ضخم (Dmax يصل لـ 40 مم)، ونسبة مياه ضئيلة جداً للحصول على قوام ترابي رطب.",
    mixingAr: "الخلط لإنتاج خلطة خالية تماماً من الهبوط ذات قوام ترابي رطب. تنقل بشاحنات قلابة وتفرد بآلية رصف الطرق (Paver) ثم تدمك فوراً بمداحل اهتزازية ثقيلة حتى الوصول للكثافة القصوى."
  },
  {
    code: "SHOTCRETE",
    nameAr: "الخرسانة المقذوفة (Shotcrete)",
    nameFr: "Béton Projeté",
    nameEn: "Sprayed Concrete",
    descriptionAr: "خرسانة يتم دفعها وضخها بضغط هواء مرتفع عبر خراطيم بسرعة لتستقر فوق الأسطح بشكل مباشر وتتماسك ذاتياً بفعل طاقة الاصطدام ودعم المسرعات.",
    generalUsageAr: "تدعيم المنحدرات الترابية والأنفاق والمغارات، وترميم الشروخ الإنشائية العميقة موقعياً وسقوف المباني المعلقة.",
    isSpecialized: false,
    materialsAr: "إسمنت فائق الفعالية مبكر التصلد (CEM I 52.5)، ركام صغير الحجم (Dmax <= 16mm) لمنع انسداد مخرج الفاصل الهوائي، رمل ناعم للزوجة المونة، ومضاف مسرع للشك الفوري (Accelerators).",
    mixingAr: "تُقذف الخرسانة بسرعة فائقة تحت ضغط هواء شديد بمواسير ضخ، حيث يتم دمج مسرع التماسك والشك فوري موقعياً عند فوهة القذف مباشرة لتلتصق بالسطوح دون تساقط."
  },
  {
    code: "GPC",
    nameAr: "الخرسانة الجيوبوليمرية الخضراء (GPC)",
    nameFr: "Béton Géopolymère",
    nameEn: "Geopolymer Concrete",
    descriptionAr: "خرسانة مبتكرة صديقة للبيئة تلغي استعمال الإسمنت التقليدي تماماً وتستبدله بمواد رابطة نشطة مثل الرماد المتطاير أو خبث الأفران المفعل بالقلويات.",
    generalUsageAr: "المشاريع المستدامة منخفضة البصمة الكربونية، الهياكل المقاومة للأحماض الشديدة والمواد الكيميائية ومنشآت الصرف الصحي البيئية.",
    isSpecialized: false,
    materialsAr: "رماد متطاير (Fly Ash)، خبث الأفران النشط (GGBS)، محلول تفعيل قلوي (هيدروكسيد الصوديوم وسيليكات الصوديوم)، ركام بازلتي صلب، وملدنات فائقة لضمان المتانة الخالية تماماً من الكربون.",
    mixingAr: "تُخلط المواد البينية البوزولانية الجافة أولاً مع الركام، ثم يضاف محلول التنشيط القلوي المحضر مسبقاً بدقة. تتطلب معالجة حرارية جافة (60-80 درجة مئوية لمدة 24 ساعة) لتنشيط التكاثف البوليمري."
  },
  {
    code: "SHC",
    nameAr: "الخرسانة ذاتية المعالجة (SHC)",
    nameFr: "Béton Autocicatrisant",
    nameEn: "Self-Healing Concrete",
    descriptionAr: "خرسانة ذكية مضاف إليها كبسولات بكتيرية مغذية أو مواد بلورية كيميائية تتفاعل مع الرطوبة عند حدوث الشروخ لإغلاقها تلقائياً بالترسب الكلسي التلقائي.",
    generalUsageAr: "المنشآت تحت المائية المغمورة، خزانات المياه الصالحة للشرب، والأنفاق صعبة الصيانة الفورية السريعة.",
    isSpecialized: false,
    materialsAr: "إسمنت قياسي، ركام طبيعي متزن، رمل، ماء، بالإضافة لجرعة كبسولات بكتيرية محمية (Bacillus) مع مواد مغذية، أو عوامل كيميائية بلورية بلزوجة عالية تترسب في الشقوق.",
    mixingAr: "تُخلط المكونات بالطرق العادية مع إضافة كبسولات البكتيريا أو المواد البلورية بجرعة مدروسة (1-2% من وزن الإسمنت). يجب تفادي المضافات التي تضر بالبنية الحيوية للكبسولات لضمان عملها بفعالية."
  },
  {
    code: "RAC",
    nameAr: "خرسانة الركام المعاد تدويره (RAC)",
    nameFr: "Béton à Granulats Recyclés",
    nameEn: "Recycled Aggregate Concrete",
    descriptionAr: "خرسانة داعمة للاقتصاد الدائري تعتمد على تدوير ركام الهدم والبناء بعد غسله وتكسيره لاستخدامه بنسب مئوية وتوفير مصادر المحاجر الطبيعية والبيئية.",
    generalUsageAr: "مشاريع التنمية وحماية البيئة، الطرق الفرعية، الفرشات التحتية، والعناصر غير المعرضة لإجهادات هندسية حرجة.",
    isSpecialized: false,
    materialsAr: "ركام خرساني معاد تدويره ومجرش بنسبة 20-50% كبديل للركام الخشن الطبيعي، رمل محجر خشن (Quarry Sand)، إسمنت مركب بيئي، وملدنات فائقة لتعويض الامتصاص المائي المرتفع.",
    mixingAr: "يجب ترطيب الركام المعاد تدويره مسبقاً أو تعديل نسبة مياه الخلط بالزيادة المدروسة لتعويض الامتصاص القوي جداً للماء في الركام القديم الناتج عن بقايا العجينة الإسمنتية الملتصقة به."
  },
  {
    code: "PERVIOUS",
    nameAr: "الخرسانة النفاذة للمياه (Pervious)",
    nameFr: "Béton Drainant",
    nameEn: "Pervious/Porous Concrete",
    descriptionAr: "خرسانة مسامية ذات هيكل حبيبي يخلو تماماً من حبات الرمل الناعم، لتشكل شبكة فراغات متصلة تصرف مياه الأمطار مباشرة للأرض وتمنع البرك والسيول.",
    generalUsageAr: "مواقف السيارات الصديقة للبيئة، ممرات المشاة، الساحات والحدائق، ومحيط المسابح والباحات المفتوحة لامتصاص السيول.",
    isSpecialized: false,
    materialsAr: "إسمنت قياسي، حصى خشن معتدل التقطيع موحد المقاس (مثل 15/25 مم) لتعظيم قنوات ري الصرف، رمل ناعم جداً بنسبة ضئيلة للغاية (أقل من 5-10% فقط)، وملدنات عادية.",
    mixingAr: "تُخلط كمية إسمنت كافية لتغليف حبات الحصى فقط بطبقة هيدروليكية لاصقة دون ملء الفراغات بينها. يجب أن يكون الهبوط منخفضاً جداً (0-2 سم) لتفادي سيلان العجينة لأسفل وسد ثقوب الصرف."
  },
  {
    code: "UHPC",
    nameAr: "الخرسانة فائقة الأداء (UHPC) - تصميم متقدم",
    nameFr: "Béton Fibré Ultra-Hautes Performances",
    nameEn: "Ultra-High Performance Concrete",
    descriptionAr: "خرسانة إنشائية متقدمة للغاية تتجاوز مقاومتها 120 ميغاباسكال بجرعات عالية من غبار السيليكا المجهري والألياف وتدرج فراغي شبه منعدم تماماً.",
    generalUsageAr: "العناصر المعمارية الرقيقة الفاخرة، المنشآت العسكرية والمدنية الحرجة، قواعد الآلات الثقيلة، والوصلات مسبقة الإجهاد الفائقة الحماية.",
    isSpecialized: true,
    materialsAr: "إسمنت فائق النعومة (CEM I 52.5)، غبار السيليكا المجهري بنسبة عالية (15-25%)، رمل سيليسي ممتاز ونقي، جرعة قصوى من الملدنات الفائقة للحفاظ على نسبة مياه بالغة الانخفاض (W/C <= 0.20).",
    mixingAr: "تتطلب طاقة خلط ميكانيكي عالية جداً وزمن خلط ممتد في خلاطات خاصة مجهزة لكسر قوى التماسك بين الحبيبات بالغة النعومة وتفعيل الملدن بالكامل دون أي انفصال حبيبي."
  },
  {
    code: "BFUP",
    nameAr: "الخرسانة الليفية فائقة الأداء (BFUP)",
    nameFr: "Béton Fibré Ultra-Performant (BFUP)",
    nameEn: "Ultra-High Performance Fibre-Reinforced Concrete",
    descriptionAr: "قمة تكنولوجيا هندسة المواد الخرسانية المركبة، مرونة مطيلية فائقة لمقاومة الشد والضغط والقص تحت نظام تسليح ليفي كربون/فولاذي دقيق وخاص بالكامل.",
    generalUsageAr: "الأسقف بالغة النحافة مسبقة الإجهاد، جسور المشاة المعلقة الفريدة، المفاعلات النووية المتطورة، والتدريع العسكري والإنشائي المتطور.",
    isSpecialized: true,
    materialsAr: "إسمنت فائق النعومة (CEM I 52.5)، غبار السيليكا، رمل سيليكا فائق الصلابة، ملدنات فائقة عالية الكثافة، وألياف ميكرو-فولاذية دقيقة (Steel Micro-fibers) بجرعات حجمية عالية ومقاومة للشد الفولاذي.",
    mixingAr: "تُخلط المواد بالغة النعومة مع الملدن أولاً بدقة فائقة، ثم تضاف الألياف الميكرو-فولاذية تدريجياً وبسرعة محددة لمنع تكتلها (Fibrillation) وضمان توزيع متشابك ممتاز بجميع الاتجاهات."
  },
  {
    code: "RC",
    nameAr: "الخرسانة المسلحة التقليدية (RC)",
    nameFr: "Béton Armé Courant",
    nameEn: "Reinforced Concrete",
    descriptionAr: "خرسانة هيكلية مصممة خصيصاً لصب العناصر المحتوية على قضبان حديد التسليح لحمايتها من التآكل وتأمين نقل إجهادات الشد.",
    generalUsageAr: "الأعمدة، الجسور، الأسقف المسلحة، القواعد الإنشائية، والجدران الاستنادية بالمباني.",
    isSpecialized: false,
    materialsAr: "إسمنت بورتلاندي، رمال نظيفة، حصى متدرج القطر، ماء، وملدنات لتحسين التشغيلية عند صب حديد التسليح الكثيف.",
    mixingAr: "خلط متجانس للبحص والرمل والإسمنت أولاً، ثم إضافة ماء الخلط المذاب فيه الملدن لضمان التفاف العجينة حول قضبان الفولاذ دون تعشيش."
  },
  {
    code: "PUMPED",
    nameAr: "الخرسانة القابلة للضخ (PUMPED)",
    nameFr: "Béton Pompable",
    nameEn: "Pumped Concrete",
    descriptionAr: "خرسانة ذات لزوجة وتماسك داخلي ممتاز مصممة خصيصاً ليتم ضخها عبر خطوط الأنابيب الطويلة والرأسية دون حدوث سد للأنابيب.",
    generalUsageAr: "صب الأبراج الشاهقة، المنشآت البعيدة عن شاحنات خلط الخرسانة، والخرسانة سريعة المناولة الموقعية.",
    isSpecialized: false,
    materialsAr: "محتوى مرتفع نسبيًا من الرمل الناعم، إسمنت، حصى ناعم Dmax <= 20mm، ملدنات فائقة، ومواد محسنة للزوجة لمنع انفصال البحص عن العجينة.",
    mixingAr: "يتطلب خلطًا أطول نسبياً لتفعيل المضافات وتحقيق قوام متماسك (Slump 12-18 cm) ينزلق جدارياً بسهولة مع حماية حديد الأنابيب."
  },
  {
    code: "MASS",
    nameAr: "الخرسانة الكتلية الضخمة (MASS)",
    nameFr: "Béton de Masse",
    nameEn: "Mass Concrete",
    descriptionAr: "خرسانة تصب في كتل ميكانيكية ضخمة كالسدود والقواعد الكبرى، تمتاز بانبعاث حراري بالغة الانخفاض لتقليل شروخ الإجهاد الحراري.",
    generalUsageAr: "قواعد السدود، القواعد الحصيرة بالغة الضخامة للأبراج، الدعامات الكبرى للجسور.",
    isSpecialized: false,
    materialsAr: "محتوى إسمنت منخفض ومستبدل جزئياً بالرماد المتطاير أو الخبث، ركام خشن بقطر كبير Dmax >= 31.5mm لتخفيض مساحة الترطيب الإجمالية.",
    mixingAr: "يتم خلطها واستخدام ثلج مجروش أو تبريد الركام لضمان عدم تخطي درجة حرارة الصب peak لـ 32 درجة مئوية موقعياً لتفادي التشقق الحراري."
  },
  {
    code: "MARINE",
    nameAr: "الخرسانة البحرية (MARINE)",
    nameFr: "Béton Maritime",
    nameEn: "Marine Concrete",
    descriptionAr: "خرسانة ذات مقاومة فائقة لنفاذ أملاح الكبريتات والكلوريدات بالبيئة البحرية لحماية منشآت الشواطئ والموانئ والمجاري المائية.",
    generalUsageAr: "أرصفة الموانئ، كتل كاسرات الأمواج، القواعد البحرية، والجسور فوق خلجان المياه المالحة.",
    isSpecialized: false,
    materialsAr: "إسمنت مقاوم للكبريتات (CEM I-SR)، غبار السيليكا لسد مسام البنية المجهرية، ركام بازلتي كثيف وصلب.",
    mixingAr: "ضبط نسبة المياه لأقصى حد كتامة (W/C <= 0.40) مع خلط ممتد لتسهيل التفاعل البوزولاني الثانوي وحماية حديد التسليح الداخلي تماماً."
  },
  {
    code: "PRECAST",
    nameAr: "خرسانة العناصر مسبقة الصنع (PRECAST)",
    nameFr: "Béton de Préfabrication",
    nameEn: "Precast Concrete",
    descriptionAr: "خرسانة ذات تصلد مبكر سريع وقابلية فائقة للدمك مصممة لإنتاج الأنابيب والجدران مسبقة الصنع بالمصانع لإعادة استخدام القوالب بسرعة.",
    generalUsageAr: "الجدران الجاهزة، حواجز الطرق، الأنابيب الخرسانية الكبيرة، البلاطات المفرغة سريعة الفك.",
    isSpecialized: false,
    materialsAr: "إسمنت سريع التصلد CEM I 52.5R، معجل شك كيميائي، ركام قوي ومتدرج القطر.",
    mixingAr: "يتبعها غالباً معالجة بخارية حرارية بالمصانع لتسريع تطور قوى الضغط بعمر ساعات معدودة تمهيداً لفك القوالب الحركي الفوري."
  },
  {
    code: "PRESTRESSED",
    nameAr: "الخرسانة مسبقة الإجهاد (PRESTRESSED)",
    nameFr: "Béton Précontraint",
    nameEn: "Prestressed Concrete",
    descriptionAr: "خرسانة إنشائية ممتازة ذات زحف وانكماش منخفضين جداً ومقاومة ضغط فائقة، مصممة لتحمل قوى شد الأوتار الفولاذية دون تهشم.",
    generalUsageAr: "روافد الجسور الطويلة، عوارض المباني الرياضية ذات البحور الواسعة، الصوامع الإنشائية الكبرى.",
    isSpecialized: false,
    materialsAr: "إسمنت عالي الرتبة، غبار سيليكا، ملدنات فائقة لتقليل المياه (W/C <= 0.35)، ويمنع كلياً المضافات المحتوية على الكلوريدات.",
    mixingAr: "دقة متناهية بالخلط وتجنب الفراغات تماماً لمنع حدوث تركيز إجهاد عند مخارج ومراسي شد الأوتار الفولاذية المسبقة الإجهاد."
  }
];

export interface ConcreteTypeTranslations {
  description: string;
  usage: string;
  materials?: string;
  mixing?: string;
}

const CONCRETE_TRANSLATIONS_DB: Record<string, Record<string, ConcreteTypeTranslations>> = {
  fr: {
    NSC: {
      description: "Béton conventionnel utilisé pour les éléments structurels courants non soumis à des contraintes critiques.",
      usage: "Bâtiments courants, dalles, poteaux et poutres standard, trottoirs et fondations simples.",
      materials: "Ciment ordinaire (CEM I 42.5 ou CEM II), sable, gravier calibré, eau, et parfois un plastifiant de base.",
      mixing: "Mélanger d'abord les granulats à sec (gravier, sable, ciment), puis ajouter l'eau progressivement."
    },
    HSC: {
      description: "Béton à ultra-haute résistance à la compression dépassant 40-50 MPa, pour réduire les sections des poteaux.",
      usage: "Tours de grande hauteur, ponts, poteaux fortement chargés et structures exigeant une haute résistance.",
      materials: "Ciment haute performance (CEM I 52.5), granulats très durs (basalte), superplastifiant puissant et fumée de silice.",
      mixing: "Malaxage mécanique intense pour disperser la fumée de silice et le superplastifiant avec un rapport E/C très bas (<= 0.35)."
    },
    HPC: {
      description: "Conçu pour offrir une durabilité supérieure et une excellente imperméabilité dans des environnements agressifs.",
      usage: "Ouvrages maritimes, ports, barrages, ponts d'autoroutes et usines chimiques.",
      materials: "Ciment résistant aux sulfates, fumée de silice, cendres volantes, granulats basaltiques concassés et superplastifiants avancés (E/C <= 0.38).",
      mixing: "Malaxage prolongé pour assurer une réaction pouzzolanique complète et remplir les vides microscopiques, empêchant la pénétration de chlore."
    },
    SCC: {
      description: "Béton hautement fluide qui s'écoule sous l'effet de sa propre gravité, remplissant parfaitement les coffrages denses sans vibration.",
      usage: "Éléments minces, voiles densément armés, coffrages complexes et pièces préfabriquées difficiles d'accès.",
      materials: "Ciment, filler calcaire, granulats fins (Dmax <= 16mm), sable roulé, superplastifiant à fort dosage et agent de cohésion.",
      mixing: "Malaxer pour garantir la cohésion de la pâte visqueuse sans ségrégation ni ressuage. Coulage sans vibration."
    },
    FRC: {
      description: "Béton renforcé de fibres (acier, verre ou polymères) pour augmenter l'absorption d'énergie et limiter la fissuration.",
      usage: "Dallages industriels, routes en béton, pistes d'aéroports et revêtements de tunnels.",
      materials: "Béton standard additionné de fibres d'acier ou de polypropylène, avec superplastifiant pour compenser la maniabilité.",
      mixing: "Introduire les fibres progressivement pour éviter l'effet d'ours (boules de fibres) et malaxer pendant au moins 5 minutes."
    },
    LWC: {
      description: "Béton à faible masse volumique sèche utilisant des granulats légers pour réduire les charges mortes et isoler.",
      usage: "Chapes d'isolation, cloisons non porteuses, rénovation de planchers et allègement de structures existantes.",
      materials: "Ciment, granulats légers (argile expansée, pierre ponce), sable fin et entraîneur d'air.",
      mixing: "Pré-humidifier les granulats légers 24h avant pour éviter qu'ils n'absorbent l'eau du mélange. Malaxage doux."
    },
    HWC: {
      description: "Béton conçu avec une densité supérieure à 2900 kg/m³ à l'aide de granulats lourds, principalement pour la radioprotection.",
      usage: "Murs de bunkers médicaux, réacteurs nucléaires, contrepoids et centres d'imagerie.",
      materials: "Ciment, granulats lourds (barytine ou hématite), sable dense de haute qualité et superplastifiants.",
      mixing: "Limiter le volume à 50-60% de la capacité du malaxeur en raison du poids extrême. Couler rapidement pour éviter la décantation."
    },
    RCC: {
      description: "Mélange sec sans affaissement étalé par des finisseurs et compacté au rouleau vibrant lourd.",
      usage: "Barrages-poids massifs, parkings industriels lourds et bases d'autoroutes.",
      materials: "Faible teneur en ciment (CEM II), fort taux de cendres volantes, gros granulats (Dmax 40mm) et très peu d'eau.",
      mixing: "Produire un mélange de consistance terreuse humide. Transporter par camions et compacter immédiatement au rouleau."
    },
    SHOTCRETE: {
      description: "Projeté à haute vitesse sous pression d'air comprimé pour adhérer directement aux parois.",
      usage: "Soutènement des tunnels, stabilisation des talus, réparations structurelles et voûtes.",
      materials: "Ciment à durcissement rapide, granulats fins (Dmax <= 16mm), sable fin et accélérateurs de prise.",
      mixing: "La projection se fait à grande vitesse par tuyaux. L'accélérateur est introduit directement à la buse de projection."
    },
    GPC: {
      description: "Béton innovant écologique qui élimine le ciment traditionnel en le remplaçant par du laitier ou cendres activés par alcalis.",
      usage: "Projets durables bas carbone, ouvrages résistants aux acides et milieux d'assainissement.",
      materials: "Cendres volantes, laitier GGBS, solution d'activation (NaOH et silicate de sodium) et granulats basaltiques.",
      mixing: "Mélanger les poudres sèches et les granulats, puis ajouter le liquide d'activation. Nécessite une cure thermique (60-80°C pendant 24h)."
    },
    SHC: {
      description: "Béton intelligent contenant des capsules de bactéries ou des agents cristallins pour auto-colmater les fissures.",
      usage: "Ouvrages sous-marins, réservoirs d'eau potable et tunnels à maintenance difficile.",
      materials: "Ciment standard, granulats, capsules bactériennes (Bacillus) et nutriments associés ou agents cristallins.",
      mixing: "Mélanger normalement en ajoutant les capsules microbiologiques (1-2% du poids de ciment). Éviter les adjuvants toxiques pour la bactérie."
    },
    RAC: {
      description: "Béton circulaire utilisant des graviers de démolition lavés et concassés pour préserver les ressources naturelles.",
      usage: "Routes secondaires, dalles de propreté, structures secondaires et aménagement urbain.",
      materials: "Granulats de béton recyclé (20-50%), sable de carrière, ciment composé et superplastifiant pour compenser l'absorption.",
      mixing: "Pré-humidifier les granulats recyclés pour compenser leur forte absorption d'eau due au vieux mortier adhérent."
    },
    PERVIOUS: {
      description: "Béton poreux drainant sans sable fin, créant un réseau de vides interconnectés pour laisser passer l'eau.",
      usage: "Parkings perméables, allées piétonnes, pourtours de piscines et cours pavées de gestion de crues.",
      materials: "Ciment, gravier uniforme monoclasse (15/25 mm), très peu de sable fin (moins de 5%) et plastifiants.",
      mixing: "Mélanger juste assez de ciment pour enrober les granulats sans boucher les vides. L'affaissement doit être nul."
    },
    UHPC: {
      description: "Béton à ultra-hautes performances dépassant 120 MPa grâce à un squelette granulaire extrêmement dense.",
      usage: "Éléments d'architecture fine, ouvrages de défense civile critiques, joints de clavetage et pièces précontraintes.",
      materials: "Ciment ultrafin (CEM I 52.5), fort taux de fumée de silice (15-25%), sable quartzeux et dosage maximal de superplastifiant.",
      mixing: "Exige un malaxeur à haute énergie pour briser les forces de cohésion des poudres ultrafines sans aucun ajout d'eau inutile (E/C <= 0.20)."
    },
    BFUP: {
      description: "Le sommet de l'ingénierie des matériaux, offrant une ductilité extrême sous un système de micro-renforcement métallique.",
      usage: "Dalles ultra-minces précontraintes, passerelles suspendues piétonnes d'avant-garde et blindages militaires.",
      materials: "Ciment ultrafin, fumée de silice, sable de silice de haute pureté, superplastifiant dense et micro-fibres d'acier à haute résistance.",
      mixing: "Mélanger d'abord les poudres avec le superplastifiant, puis introduire les micro-fibres métalliques à vitesse constante pour éviter les nœuds."
    }
  },
  en: {
    NSC: {
      description: "Conventional concrete used for standard structural elements not exposed to critical mechanical or environmental stresses.",
      usage: "Standard buildings, slabs, standard columns and beams, pavements, and non-specialized foundations.",
      materials: "Standard cement (such as CEM I 42.5 or CEM II), sand, graded gravel, water, and sometimes a basic plasticizer.",
      mixing: "Mix dry ingredients first: gravel + sand + cement, then add water gradually until a workable consistency is achieved."
    },
    HSC: {
      description: "Concrete characterized by superior compressive strength exceeding 40-50 MPa, to optimize structural dimensions of high-rise columns.",
      usage: "High-rise towers, bridges, heavily loaded columns, and structures requiring high compressive capacity.",
      materials: "Premium quality cement (CEM I 52.5), clean hard aggregates (like basalt), high-range water reducers, and silica fume.",
      mixing: "Precise and intense mechanical mixing to ensure homogeneous distribution of superplasticizers and silica fume under low W/C (<= 0.35)."
    },
    HPC: {
      description: "Specially engineered concrete to provide superior durability and excellent low permeability in harsh environments.",
      usage: "Marine works, ports, dams, highway bridges, chemical water plants, and sulfate-rich environments.",
      materials: "Sulfate-resistant or blended cement, silica fume, fly ash, angular crushed basalt, and advanced superplasticizers (W/C <= 0.38).",
      mixing: "Prolonged mixing to guarantee full pozzolanic reaction and fill microscopic voids, blocking moisture and chloride ingress."
    },
    SCC: {
      description: "Highly fluid concrete flowing under its own weight, completely filling congested formwork without mechanical consolidation.",
      usage: "Thin structural elements, densely reinforced walls, complex formworks, and intricate precast components.",
      materials: "Cement, limestone filler powder, small size aggregates (Dmax <= 16mm), rounded river sand, and high dosage superplasticizers.",
      mixing: "Mix carefully to maintain cohesive viscous paste, preventing aggregate segregation or water bleeding. Pour without vibration."
    },
    FRC: {
      description: "Concrete reinforced with specific fiber dosages to increase energy absorption and control plastic/thermal shrinkage cracking.",
      usage: "Heavy-duty industrial floors, concrete roads, airport runways, and tunnel linings.",
      materials: "Standard concrete components with steel or polypropylene fibers, plus superplasticizers to maintain workability.",
      mixing: "Add fibers gradually during mixing to prevent fiber balling, mixing for at least 5 minutes to ensure uniform dispersion."
    },
    LWC: {
      description: "Low dry density concrete produced using lightweight aggregates to reduce dead loads and provide thermal insulation.",
      usage: "Insulating roof decks, non-load-bearing walls, floor restorations, and structural weight reduction of buildings.",
      materials: "Cement, lightweight aggregates (such as expanded clay or pumice), fine sand, and air-entraining agents.",
      mixing: "Pre-saturate lightweight aggregates with water 24 hours before mixing. Mix gently to prevent fragile particles from crushing."
    },
    HWC: {
      description: "Concrete designed with a density exceeding 2900 kg/m³ using heavyweight aggregates, primarily for radiation shielding.",
      usage: "Hospital X-ray rooms, nuclear reactors, port counterweights, and medical imaging centers.",
      materials: "Cement, heavyweight aggregates (such as barite or hematite), dense high-quality sand, and superplasticizers.",
      mixing: "Do not exceed 50-60% of mixer capacity due to extreme weight. Pour quickly to prevent heavyweight aggregate settlement."
    },
    RCC: {
      description: "Dry, zero-slump mix spread with paving equipment and compacted with heavy vibratory rollers for massive concrete structures.",
      usage: "Massive gravity dams, heavy industrial parking lots, and highway base courses.",
      materials: "Low and economical cement content (CEM II), high fly ash content, large aggregates (Dmax up to 40mm), and minimal water.",
      mixing: "Mix to produce a damp earth consistency. Transport via dump trucks, lay with a road paver, and compact immediately."
    },
    SHOTCRETE: {
      description: "Concrete conveyed through a hose and pneumatically projected at high velocity onto a surface, compacting itself dynamically.",
      usage: "Tunnel linings, slope stabilization, rock support, structural repairs, and curved architectural structures.",
      materials: "Rapid-hardening high-performance cement, small aggregate size (Dmax <= 16mm), and accelerators added at nozzle.",
      mixing: "Sprayed at high velocity under pneumatic pressure, where set accelerators are integrated at the nozzle for immediate adhesion."
    },
    GPC: {
      description: "Innovative eco-friendly concrete replacing Portland cement entirely with alkaline-activated binders like fly ash or slag.",
      usage: "Sustainable low-carbon projects, acid-resistant structures, and chemical or wastewater environments.",
      materials: "Fly ash, GGBS (slag), alkaline activator solution (sodium hydroxide & sodium silicate), and basalt aggregates.",
      mixing: "Mix dry pozzolanic materials and aggregates first, then add the alkaline activator. Requires dry thermal curing (60-80°C for 24h)."
    },
    SHC: {
      description: "Smart concrete containing encapsulated bacteria or crystalline agents that react with moisture to seal cracks automatically.",
      usage: "Underwater structures, potable water reservoirs, and tunnels with restricted maintenance access.",
      materials: "Standard cement, balanced aggregates, protected bacterial capsules (Bacillus) with nutrients, or crystalline agents.",
      mixing: "Mix ingredients normally, adding bacterial capsules (1-2% of cement weight). Avoid chemical admixtures that disrupt bio-activity."
    },
    RAC: {
      description: "Circular economy concrete incorporating recycled construction and demolition waste as aggregates to conserve natural resources.",
      usage: "Environmental projects, sub-bases, secondary roads, non-critical structural elements, and landscaping.",
      materials: "Recycled concrete aggregate (20-50%), quarry sand, eco-friendly blended cement, and superplasticizers.",
      mixing: "Pre-wet the recycled aggregates or increase mixing water to compensate for the high water absorption of the old adhered mortar."
    },
    PERVIOUS: {
      description: "Porous/permeable concrete with zero to low sand, creating highly interconnected voids that drain rainwater directly.",
      usage: "Permeable parking lots, pedestrian pathways, swimming pool surrounds, and stormwater management areas.",
      materials: "Standard cement, coarse aggregate of uniform size (e.g., 15/25 mm), minimal sand (less than 5-10%), and water.",
      mixing: "Mix cement paste sufficient to coat the gravel particles without clogging voids. Maintain zero slump (0-2 cm) to prevent clogging."
    },
    UHPC: {
      description: "Advanced structural concrete exceeding 120 MPa compressive strength with extremely dense packing and zero internal voids.",
      usage: "Thin high-end architectural elements, critical infrastructure, connection joints, and prestressed components.",
      materials: "Ultrafine cement (CEM I 52.5), high-dosage silica fume (15-25%), pure quartz sand, and maximum superplasticizer (W/C <= 0.20).",
      mixing: "Requires high-energy mechanical mixing and extended mixing time to break powder cohesiveness and activate water reducers."
    },
    BFUP: {
      description: "The pinnacle of composite concrete materials technology, displaying extreme tensile and shear ductility under fiber reinforcement.",
      usage: "Ultra-thin prestressed roof decks, futuristic pedestrian bridges, advanced nuclear containment, and military armoring.",
      materials: "Ultrafine cement, silica fume, high-purity silica sand, premium superplasticizers, and high-tensile steel micro-fibers.",
      mixing: "Mix ultrafine components with superplasticizer first, then add steel micro-fibers gradually to prevent clustering and ensure dispersion."
    }
  }
};

export function getConcreteTypeDetails(code: string, lang: string): ConcreteTypeTranslations {
  const meta = CONCRETE_TYPES_CATALOG.find((t) => t.code === code) || CONCRETE_TYPES_CATALOG[0];
  const normalizedLang = (lang || "ar").toLowerCase();
  
  if (normalizedLang === "fr" || normalizedLang === "en") {
    const translationSet = CONCRETE_TRANSLATIONS_DB[normalizedLang];
    if (translationSet && translationSet[code]) {
      return translationSet[code];
    }
  }
  
  // Default to Arabic
  return {
    description: meta.descriptionAr,
    usage: meta.generalUsageAr,
    materials: meta.materialsAr,
    mixing: meta.mixingAr
  };
}

export interface ConcreteValidationReport {
  concreteType: string;
  meta: ConcreteTypeMeta;
  status: "compliant" | "warning" | "requires_optimization";
  assessments: ValidationResult[];
  recommendations: string[];
  optimizationSuggestions: string[];
}

export function validateConcreteType(
  typeCode: string,
  inputs: MixDesignInput,
  result: MixDesignResult
): ConcreteValidationReport {
  const meta = CONCRETE_TYPES_CATALOG.find((t) => t.code === typeCode) || CONCRETE_TYPES_CATALOG[0];

  const assessments: ValidationResult[] = [];
  const recommendations: string[] = [];
  const optimizationSuggestions: string[] = [];

  // If the requested concrete type is specialized (UHPC/BFUP), immediately report specialized design is required.
  if (meta.isSpecialized) {
    assessments.push({
      paramName: "specialized_criteria",
      arabicName: "طريقة التصميم المتكامل",
      status: "non_compliant",
      requirement: "يتطلب نموذجاً حسابياً مستقلاً مخصصاً للمعالجة والحرارة والضغط المرتفع",
      actual: `طريقة الحساب الحالية: ${inputs.selectedMethod?.toUpperCase() || "غير معروف"}`,
      note: "الأنواع فائقة الأداء تتطلب نماذج ونظريات حبيبية مخصصة ومعالجة حرارية فريدة. لا نوصي بالاعتماد على مخرجات الطرق الحجمية العادية لهذه الخرسانة."
    });

    recommendations.push(
      "⚠ تصميم خرسانة UHPC/BFUP يحتاج كشافات حبيبية نانوية (غبار السيليكا ومطاحن الكوارتز) ونسب ماء/إسمنت استثنائية (W/C <= 0.18) مدعمة بألياف حديدية دقيقة.",
      "يرجى مراجعة البرمجيات المتخصصة بنماذج التعبئة الحبيبية الفراغية القصوى (مثل نموذج Larrard الحبيبي لملء الفراغات)."
    );

    optimizationSuggestions.push(
      "قم بإجراء فحص مخبري حقيقي في مصانع خرسانية مجهزة بأجهزة تبخير ومعالجة حرارية حرجة تفوق 90 درجة مئوية لموثوقية التحمل الحجمي."
    );

    return {
      concreteType: typeCode,
      meta,
      status: "requires_optimization",
      assessments,
      recommendations,
      optimizationSuggestions
    };
  }

  // Common handy inputs & results extracted safely
  const wc = result.wcRatioAdjusted || result.wcRatio || 0.50;
  const cement = result.cementWeight || 350;
  const fck = inputs.fck28 || 25;
  const sSuper = inputs.dosageSuper || 0;
  const sAcc = inputs.dosageAccelerator || 0;
  const sAir = inputs.dosageAir || 0;
  const silica = inputs.dosageSilicaFume || 0;
  const slump = inputs.slump || 8;
  const sandPct = result.sandPercent || 40;
  const freshDensity = result.totalFreshDensity || 2400;
  const sandDens = inputs.sandRelativeDensity || 0;
  const gravelDens = inputs.gravelRelativeDensity || 0;

  switch (typeCode) {
    case "NSC": {
      // Normal Strength Concrete
      // Suitable for fck28 <= 35
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
      break;
    }

    case "HSC": {
      // High Strength Concrete
      // Target fc28 >= 40, W/C <= 0.35, Cement >= 400 kg/m³
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
      break;
    }

    case "HPC": {
      // High Performance Concrete (BHP)
      // W/C <= 0.40, Cement >= 400, superplasticizer recommened, Silica recommended, durability indicators.
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
      break;
    }

    case "SCC": {
      // Self-Consolidating Concrete (BAP)
      // Slump Target >= 20 cm, Superplasticizer >= 1.2%, Powder Content (cement + mineral) >= 450
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
      const totalPowder = cement + (cement * (silica + (inputs.dosageFlyAsh || 0) + (inputs.dosageSlag || 0)) / 100);
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
      break;
    }

    case "FRC": {
      // Fiber-Reinforced Concrete
      // Addition of fibers. Dosage recomendation.
      const hasFibers = inputs.dosageSuper > 0 || silica > 0; // Just visual flag, fibers are noted in recommendations
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
      break;
    }

    case "LWC": {
      // Lightweight Concrete
      // Low densities check, dry concrete density check.
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
      break;
    }

    case "HWC": {
      // Heavyweight Concrete
      // Aggregate densities must be high (>= 3000 kg/m³). Sand and Gravel densities should be high.
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
      break;
    }

    case "RCC": {
      // Roller-Compacted Concrete
      // Slump target must be exactly 0 cm
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
      break;
    }

    case "SHOTCRETE": {
      // Sprayed Concrete (Shotcrete)
      // Accelerator is recommended (dosageAccelerator >= 1.0%), Dmax <= 16mm (rebound prevention).
      const accOk = sAcc >= 1.0;
      assessments.push({
        paramName: "shotcrete_accelerator",
        arabicName: "جرعة معجل الشك والتصليد",
        status: accOk ? "compliant" : "warning",
        requirement: "جرعة المسرع المعجل >= 1.0%",
        actual: `${sAcc.toFixed(2)}%`,
        note: accOk ? "تمت برمجة المسرع الكيميائي بمعدل يساعد على التصلد اللحظي عند الارتطام بالأسقف." : "نوصي بتفعيل أو رفع جرعة معجل التصليد (Accelerator) في لوحة الإضافات الكيميائية لمنع تساقط الكتل المصبوبة بالموقع."
      });

      const dmaxOk = inputs.dMax <= 16;
      assessments.push({
        paramName: "shotcrete_dmax",
        arabicName: "أقصى قطر للركام (Dmax)",
        status: dmaxOk ? "compliant" : "warning",
        requirement: "Dmax <= 16mm",
        actual: `${inputs.dMax} mm`,
        note: dmaxOk ? "ممتازة، لمنع التناثر والارتداد العكسي للحصوات الضخمة (Rebound Loss)." : "حجم الركام كبير وقد يقود لارتداد ثقيل للحبيبات على العمال. يرجى تعديله ليكون Dmax <= 16 مم."
      });

      if (!accOk) recommendations.push("💡 قم بزيادة نسبة 'المسرّع' الكيميائي لزر تسريع الترابط اللحظي للخرسانة المقذوفة.");
      recommendations.push("💡 اختر ركاماً مكسراً ومغسولاً بشكل ممتاز لتعزيز الخشونة الهيكلية ودرجة الالتزام بالشبكة المعدنية.");
      optimizationSuggestions.push(
        "يتم صياغة خلطات الخرسانة المقذوفة بجرعة إسمنتية مرتفعة نسبياً (380-450 كغ/م³) لتقوية الاتصال المباشر.",
        "احرص على مراقبة معدلات الارتداد وتعديل ضغط المضخة بالتبادل مع زاوية فوهة الصب المناسبة التي تبلغ 90 درجة للأسطح الموجهة."
      );
      break;
    }

    case "GPC": {
      // Geopolymer Concrete
      // Low cement, high Fly ash & Slag activation.
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

      // Strict Cementless Validation: Verify if standard Portland Cement is selected/used
      const isTraditionalCement = inputs.selectedCementId && 
        !inputs.selectedCementId.includes("geopolymer") && 
        !inputs.selectedCementId.includes("slag") && 
        !inputs.selectedCementId.includes("flyash") && 
        !inputs.cementType?.includes("جيوبوليمر") && 
        !inputs.cementType?.includes("Geopolymer") &&
        !inputs.cementType?.includes("خبث") &&
        !inputs.cementType?.includes("Slag");

      assessments.push({
        paramName: "gpc_cementless",
        arabicName: "منع الإسمنت البورتلاندي التقليدي",
        status: !isTraditionalCement ? "compliant" : "non_compliant",
        requirement: "إسمنت تقليدي = 0% (خالية تماماً من الكلينكر)",
        actual: isTraditionalCement ? "تم اختيار إسمنت بورتلاندي كربوني عادي" : "تم استخدام الرابط الجيوبوليمري الصديق للبيئة",
        note: !isTraditionalCement ? "سليمة، الخلطة تعتمد كلياً على الروابط الخضراء الخالية من الإسمنت التقليدي الكربوني." : "مرفوض، يمنع استخدام الإسمنت البورتلاندي التقليدي في الخرسانة الجيوبوليمرية (GPC). يرجى تغيير نوع الإسمنت إلى رابط بوزولاني/جيوبوليمري صديق للبيئة."
      });

      recommendations.push(
        "⚠ الخرسانة الجيوبوليميرية تحتاج كيميائياً تفعيل الرابط بواسطة سائل التنشيط القلوي (Alkaline Activator Solution) المكون من سيليكات الصوديوم وهيدروكسيد الصوديوم المذاب.",
        "يجب أن يتم صب ومقاومة هذه الخرسانة بالمعالجة الحرارية الجافة لدرجة حرارة 60-80 درجة مئوية لمدة 24 ساعة لضمان البلمرة الجيومعدنية الكاملة."
      );
      if (isTraditionalCement) {
        recommendations.push("❌ خطأ حرج: يمنع استخدام الإسمنت البورتلاندي التقليدي في خرسانة GPC. يرجى اختيار رابط جيوبوليمر بوزولاني صديق للبيئة من قائمة المواد.");
      }
      optimizationSuggestions.push(
        "استشر المعامل المتخصصة لتنظيم تركيز مولارية هيدروكسيد الصوديوم (تتراوح عادة بين 8 إلى 16 مولار) لتفادي الفوارق الميكانيكية.",
        "تم تصفير كمية الإسمنت البورتلاندي تلقائياً في حسابات الخلطة لضمان الخلو التام من الكلينكر والاعتماد الكلي على التفعيل القلوي للبوزولانا."
      );
      break;
    }

    case "SHC": {
      // Self-Healing Concrete
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
      break;
    }

    case "RAC": {
      // Recycled Aggregate Concrete
      const isRecycled = inputs.sandType.includes("معاد") || inputs.gravelType.includes("معاد") || inputs.sandType.includes("Recycled") || inputs.gravelType.includes("Recycled");
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
        status: inputs.moistureGravel >= 2.0 ? "compliant" : "warning",
        requirement: "نسب رطوبة/امتصاص الحصى المعاد تدويره >= 2.0%",
        actual: `رطوبة الركام: ${inputs.moistureGravel}%`,
        note: "الركام المعاد تدويره يحتوي على كتل عجينة إسمنتية ملتصقة قديمة تمتص ماء الخلط بقوة تفوق الركام الطبيعي مرتين أو ثلاث مرات."
      });

      if (inputs.moistureGravel < 2.0) {
        recommendations.push("⚠ الرجاء تعديل وضبط رطوبة الحصى المستهدفة يدوياً لتكون أعلى (مثال 2.5%) لحساب تصحيح الماء لامتصاص الركام المعاد تدويره الفعلي بالخلاطة.");
      }
      recommendations.push("💡 لا نوصي باستعمال الركام المعاد تدويره بنسبة تفوق 50% كبديل ركام خشن للعناصر الإنشائية المعرضة للأعاصير أو الهزات الأرضية العالية.");
      optimizationSuggestions.push(
        "قم بإضافة إضافات بوزولانية طبيعية أو غبار السيليكا لتعويض الفقدان الطفيف لمقاومة الضغط الناتجة عن تعرية الركام التدويري القديم.",
        "قم بغسل الركام وتخليصه من بقايا الجبس أو الأخشاب الطافية لضمان سلامة التشكيل الحبيبي."
      );
      break;
    }

    case "PERVIOUS": {
      // Pervious Concrete
      // No or very little sand! sand percent <= 15%. Target slump very low.
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
      break;
    }
  }

  // Deduce status based on any non_compliant assessments
  const hasNonCompliant = assessments.some((a) => a.status === "non_compliant");
  const hasWarning = assessments.some((a) => a.status === "warning");
  const status = hasNonCompliant
    ? "requires_optimization"
    : hasWarning
    ? "warning"
    : "compliant";

  return {
    concreteType: typeCode,
    meta,
    status,
    assessments,
    recommendations,
    optimizationSuggestions
  };
}
