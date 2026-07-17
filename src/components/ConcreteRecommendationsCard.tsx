import React, { useState, useMemo } from "react";
import { 
  Check, 
  Settings, 
  Cpu, 
  HelpCircle, 
  Info, 
  CheckCircle2, 
  Layers,
  Sparkles,
  Droplet,
  Flame,
  Activity,
  Maximize2,
  Plus,
  Edit3,
  Trash2,
  Search,
  Filter,
  Save,
  X,
  Eye,
  FileText
} from "lucide-react";
import { MixDesignInput, EngineeringMaterial } from "../types";
import { useLanguage } from "../services/localization";
import { ExpandedMaterial, DEFAULT_EXPANDED_MATERIALS } from "../data/expandedMaterials";

// Design matching for recommendations
export interface ConcreteRecommendation {
  typeKey: string;
  nameAr: string;
  nameSubAr: string;
  summaryAr: string;
  
  // Suggested Materials
  cementAr: string;
  cementTypeKey: "cem_32_5" | "cem_42_5" | "cem_52_5" | "cem_ii_a" | "cem_ii_b" | "cem_custom";
  
  aggregateAr: string;
  aggregateTypeKey: "gravel_3_8" | "gravel_8_15" | "gravel_15_25" | "gravel_25_40" | "gravel_basalt" | "gravel_calcareous" | "gravel_river" | "gravel_crushed" | "gravel_custom";
  
  sandAr: string;
  sandTypeKey: "fine_sand" | "medium_sand" | "coarse_sand" | "river_sand" | "quarry_sand" | "siliceous_sand" | "calcareous_sand" | "custom_sand";
  
  admixtureAr: string;
  admixtureTypeKey: "admix_super" | "admix_plasticizer" | "admix_retarder" | "admix_accelerator" | "admix_air" | "admix_none";

  // Suggested Target Engineering Parameters
  targetStrength: number;     // MPa
  targetWCRatio: string;      // e.g. "0.40 - 0.45"
  suggestedWCRatio: number;   // actual recommended value
  targetDmax: number;         // mm
  targetSlump: number;        // cm
  targetAirContent: number;   // %
  targetFinenessMod: string;  // MF range

  // Additives Dosages (%) to inject
  dosageSuper: number;
  dosageAir: number;
  dosageRetarder: number;
  dosageAccelerator: number;
  
  // Minerals Dosages (%)
  dosageSilicaFume: number;
  dosageFlyAsh: number;
  dosageSlag: number;
}

export const CONCRETE_RECOMMENDATIONS: Record<string, ConcreteRecommendation> = {
  NSC: {
    typeKey: "NSC",
    nameAr: "الخرسانة عادية المقاومة (NSC)",
    nameSubAr: "العناصر السكنية العادية والخرسانة غير المسلحة",
    summaryAr: "توصية قياسية لإنشاء الأعمدة والأسقف العادية بسماكة متوسطة، حيث الأولوية هي الكفاءة الاقتصادية والتشغيلية المريحة وتدرج الركام القياسي.",
    cementAr: "إسمنت عياري CEM I 42.5 رتبة مقاومة متزنة",
    cementTypeKey: "cem_42_5",
    aggregateAr: "حصى 8/15 مم عياري كلسي متزن لتغطية ممتازة",
    aggregateTypeKey: "gravel_8_15",
    sandAr: "رمل وادي طبيعي متوسط (Medium Sand)",
    sandTypeKey: "medium_sand",
    admixtureAr: "بدون إضافات كيميائية أو ملدن قياسي خفيف حسب الحاجة فقط",
    admixtureTypeKey: "admix_none",
    targetStrength: 25,
    targetWCRatio: "0.50 - 0.55",
    suggestedWCRatio: 0.52,
    targetDmax: 20,
    targetSlump: 8,
    targetAirContent: 1.5,
    targetFinenessMod: "2.5 - 2.8",
    dosageSuper: 0.0,
    dosageAir: 0.0,
    dosageRetarder: 0.0,
    dosageAccelerator: 0.0,
    dosageSilicaFume: 0.0,
    dosageFlyAsh: 0.0,
    dosageSlag: 0.0
  },
  HSC: {
    typeKey: "HSC",
    nameAr: "الخرسانة عالية المقاومة (HSC)",
    nameSubAr: "الأبراج السكنية الشاهقة وقواعد الهياكل الحاملة الكبرى",
    summaryAr: "تتطلب نسبة ماء/إسمنت منخفضة لزيادة المقاومة وعينات ركام صخرية متينة تقاوم التفتت الداخلي مع تشتت فراغات دقيق.",
    cementAr: "إسمنت فائق القوة CEM I 52.5 مبكر التصلد",
    cementTypeKey: "cem_52_5",
    aggregateAr: "حصى بازلتي متين جداً لمنع قصف الخرسانة عند زيادة الأحمال",
    aggregateTypeKey: "gravel_basalt",
    sandAr: "رمل خشن (Coarse Sand) لتخفيض مساحة الركام السطحية",
    sandTypeKey: "coarse_sand",
    admixtureAr: "الملدنات الفائقة Superplasticizer لضمان السيلان مع قلة مياه الخلط",
    admixtureTypeKey: "admix_super",
    targetStrength: 50,
    targetWCRatio: "0.32 - 0.38",
    suggestedWCRatio: 0.35,
    targetDmax: 12,
    targetSlump: 16,
    targetAirContent: 1.0,
    targetFinenessMod: "2.8 - 3.2",
    dosageSuper: 1.5,
    dosageAir: 0.0,
    dosageRetarder: 0.4,
    dosageAccelerator: 0.0,
    dosageSilicaFume: 6.0,
    dosageFlyAsh: 0.0,
    dosageSlag: 0.0
  },
  HPC: {
    typeKey: "HPC",
    nameAr: "الخرسانة عالية الأداء (HPC / BHP)",
    nameSubAr: "الجسور البحرية والمحطات الكربوناتية والمنشآت المعرضة للكبريتات",
    summaryAr: "تركز على زيادة الكثافة وتخميد الفراغات المجهرية كيميائياً لمنع تسرب الرطوبة والكلوريدات المدمرة لحديد التسليح الداخلي.",
    cementAr: "إسمنت مركب CEM II/A أو إسمنت CEM I 52.5 عياري النعومة",
    cementTypeKey: "cem_52_5",
    aggregateAr: "حصى بازلتي أو حصى مكسر حاد الأطراف (Crushed Gravel)",
    aggregateTypeKey: "gravel_crushed",
    sandAr: "رمل سيليسي شديد الكفاءة والنقاوة لتدعيم التماسك الكيميائي",
    sandTypeKey: "siliceous_sand",
    admixtureAr: "Superplasticizer مع إضافات غبار السيليكا (Silica Fume) والرماد المتطاير",
    admixtureTypeKey: "admix_super",
    targetStrength: 60,
    targetWCRatio: "0.28 - 0.34",
    suggestedWCRatio: 0.30,
    targetDmax: 16,
    targetSlump: 18,
    targetAirContent: 1.5,
    targetFinenessMod: "2.7 - 3.1",
    dosageSuper: 1.8,
    dosageAir: 0.0,
    dosageRetarder: 0.5,
    dosageAccelerator: 0.0,
    dosageSilicaFume: 8.5,
    dosageFlyAsh: 10.0,
    dosageSlag: 0.0
  },
  SCC: {
    typeKey: "SCC",
    nameAr: "الخرسانة ذاتية الرص (SCC / BAP)",
    nameSubAr: "القوالب المعقدة الممتلئة بحديد التسليح الكثيف",
    summaryAr: "تنساب كالماء تماماً بفعل ثقلها الذاتي وتملأ كل الزوايا والممرات الضيقة دون حدوث انفصال للركام أو الحاجة لرجّاج العمال بالموقع.",
    cementAr: "إسمنت عياري CEM I 42.5 مع دمج بودرة الرمل الإضافية",
    cementTypeKey: "cem_42_5",
    aggregateAr: "حصى صغيرة ناعمة 3/8 عياري خفيف الحركة لا يعلق بحديد التسليح",
    aggregateTypeKey: "gravel_3_8",
    sandAr: "رمل نهري (River Sand) مستدير ناعم ومصقول يقلل الاحتكاك الداخلي",
    sandTypeKey: "river_sand",
    admixtureAr: "جرعة عالية من Superplasticizer قوية مع حشوات الرماد المتطاير",
    admixtureTypeKey: "admix_super",
    targetStrength: 35,
    targetWCRatio: "0.36 - 0.42",
    suggestedWCRatio: 0.38,
    targetDmax: 10,
    targetSlump: 22,
    targetAirContent: 2.0,
    targetFinenessMod: "2.4 - 2.7",
    dosageSuper: 2.2,
    dosageAir: 0.0,
    dosageRetarder: 0.6,
    dosageAccelerator: 0.0,
    dosageSilicaFume: 4.0,
    dosageFlyAsh: 15.0,
    dosageSlag: 10.0
  },
  FRC: {
    typeKey: "FRC",
    nameAr: "الخرسانة المسلحة بالألياف (FRC)",
    nameSubAr: "البلاطات الصناعية ومسارات المطارات المعرضة للصدمات الفورية",
    summaryAr: "تحتوي على ألياف تخلق مصفوفة مقاومة لتشكل الشروخ السطحية والانكماش الحراري والتأثيرات النبضية المستمرة.",
    cementAr: "إسمنت متين CEM I 42.5 عالي الجودة لضمان التصاق الألياف",
    cementTypeKey: "cem_42_5",
    aggregateAr: "حصى 8/15 عيارية متوسطة متزنة الحوائط والهندسة الحشوية",
    aggregateTypeKey: "gravel_8_15",
    sandAr: "رمل طبيعي متوسط (Medium Sand) متساوي الفراغات والمناخل",
    sandTypeKey: "medium_sand",
    admixtureAr: "Superplasticizer عادي لتعويض الفقد في تشغيلية الألياف المكبوسة لزجاً",
    admixtureTypeKey: "admix_super",
    targetStrength: 35,
    targetWCRatio: "0.40 - 0.45",
    suggestedWCRatio: 0.42,
    targetDmax: 16,
    targetSlump: 12,
    targetAirContent: 2.0,
    targetFinenessMod: "2.6 - 2.9",
    dosageSuper: 1.2,
    dosageAir: 0.0,
    dosageRetarder: 0.2,
    dosageAccelerator: 0.0,
    dosageSilicaFume: 0.0,
    dosageFlyAsh: 5.0,
    dosageSlag: 0.0
  },
  LWC: {
    typeKey: "LWC",
    nameAr: "الخرسانة خفيفة الوزن (LWC)",
    nameSubAr: "أسقف الترميم، الجدران العازلة للحرارة وعناصر تقليل العبء الهيكلي",
    summaryAr: "تتميز بوزن حجمي ضئيل للغاية وتدعيم معامِلات العزل الصوتي والحراري بفضل الفجوات الهوائية الكبيرة والركام خفيف الوزن المتمدد.",
    cementAr: "إسمنت مركب بيئي من فئة CEM II/A ذو احتكاك وسلاسة مطواعة",
    cementTypeKey: "cem_ii_a",
    aggregateAr: "نوع مخصص (Gravel Custom/Expanded) - خرسانة طينية متمددة أو بوماس خفيف الوزن",
    aggregateTypeKey: "gravel_custom",
    sandAr: "رمل ناعم مغسول ومصنف بدقة لتفادي سد فقاعات الهياكل الخفيفة",
    sandTypeKey: "fine_sand",
    admixtureAr: "Air Entraining (إضافة حابس جزيئات الهواء الهادئ لزيادة اللطافة الإنشائية)",
    admixtureTypeKey: "admix_air",
    targetStrength: 15,
    targetWCRatio: "0.45 - 0.52",
    suggestedWCRatio: 0.48,
    targetDmax: 12,
    targetSlump: 6,
    targetAirContent: 5.5,
    targetFinenessMod: "2.2 - 2.5",
    dosageSuper: 0.5,
    dosageAir: 1.5,
    dosageRetarder: 0.0,
    dosageAccelerator: 0.0,
    dosageSilicaFume: 0.0,
    dosageFlyAsh: 10.0,
    dosageSlag: 0.0
  },
  HWC: {
    typeKey: "HWC",
    nameAr: "الخرسانة ثقيلة الوزن (HWC)",
    nameSubAr: "مفاعلات الطاقة النووية ومراكز الأشعة الطبية والأوزان المعدنية",
    summaryAr: "تعترض الإشعاعات بفضل ركام معدني ثقيل ذو كثافة فائقة جداً (كالبارييت أو الهيماتيت) يحجب أشعة غاما والنيوترونات السريعة.",
    cementAr: "إسمنت متزن مقاوم للكبريتات ذو رص ميكانيكي عالي كصيغة CEM I 42.5",
    cementTypeKey: "cem_42_5",
    aggregateAr: "نوع مخصص (Gravel Custom) - ركام ثقيل معدني بكثافة مطلقة تتجاوز 4200 كجم/م³",
    aggregateTypeKey: "gravel_custom",
    sandAr: "رمل خشن قوي ذو قدرة ارتكاب عالية (Coarse Sand)",
    sandTypeKey: "coarse_sand",
    admixtureAr: "الملدّنات الفائقة Superplasticizer لتفادي زيادة كمية المياه وضمان التماسك المطلق",
    admixtureTypeKey: "admix_super",
    targetStrength: 35,
    targetWCRatio: "0.38 - 0.44",
    suggestedWCRatio: 0.40,
    targetDmax: 20,
    targetSlump: 8,
    targetAirContent: 1.0,
    targetFinenessMod: "2.8 - 3.1",
    dosageSuper: 1.4,
    dosageAir: 0.0,
    dosageRetarder: 0.3,
    dosageAccelerator: 0.0,
    dosageSilicaFume: 0.0,
    dosageFlyAsh: 0.0,
    dosageSlag: 15.0
  },
  RCC: {
    typeKey: "RCC",
    nameAr: "الخرسانة المدحولة (RCC)",
    nameSubAr: "جسم السدود العملاقة ورصفات الطرق السريعة ذات السرعات الإجهادية الشاقة",
    summaryAr: "خرسانة جافة بالكامل تُصب بكميات خيالية بدون قوالب وتفرد بآليات تعبيد الطرق وتُدمك بحدلات ثقيلة كروية حتى الرص الأقصى.",
    cementAr: "إسمنت مركب من صياغة CEM II/B ذو تبخر وحرارة مائية هادئة",
    cementTypeKey: "cem_ii_b",
    aggregateAr: "ركام ركيزة خشنة وضخمة عيار 25/40 مم لتقليل السطح والمشتق المائي",
    aggregateTypeKey: "gravel_25_40",
    sandAr: "رمل طبيعي خشن وثابت الحبيبات (Coarse Sand)",
    sandTypeKey: "coarse_sand",
    admixtureAr: "بدون مضافات أو إضافة مؤخر (Retarder) للحفاظ على جفاف وثبات دمعة الرطوبة",
    admixtureTypeKey: "admix_none",
    targetStrength: 20,
    targetWCRatio: "0.35 - 0.40",
    suggestedWCRatio: 0.38,
    targetDmax: 40,
    targetSlump: 0,
    targetAirContent: 1.5,
    targetFinenessMod: "2.9 - 3.2",
    dosageSuper: 0.0,
    dosageAir: 0.0,
    dosageRetarder: 0.0,
    dosageAccelerator: 0.0,
    dosageSilicaFume: 0.0,
    dosageFlyAsh: 20.0,
    dosageSlag: 10.0
  },
  SHOTCRETE: {
    typeKey: "SHOTCRETE",
    nameAr: "الخرسانة المقذوفة (Shotcrete)",
    nameSubAr: "تدعيم الأنفاق والمنحدرات الجبلية وحفر الأساسات العميقة موقعياً",
    summaryAr: "تُقذف الخرسانة بسرعة لسرعة تشغيلية فائقة تحت ضغط هواء شديد بمواسير ضخ وتتميز بوجود مسرعات تماسك فوري لتمنع الهبوط للجدران والسقوف.",
    cementAr: "إسمنت عالي الفعالية مبكر التصلد ونقي للغاية CEM I 52.5",
    cementTypeKey: "cem_52_5",
    aggregateAr: "حصى صغيرة 3/8 عيارية لمنع انسداد مخرج الفاصل الهوائي للمسدس",
    aggregateTypeKey: "gravel_3_8",
    sandAr: "رمل ناعم (Fine Sand) لإعطاء لزوجة وسماكة تشبه المونة الهيدروليكية",
    sandTypeKey: "fine_sand",
    admixtureAr: "Accelerator (مسرع التصلد والشك الفوري موقعياً لمنع تساقط الخرسانة)",
    admixtureTypeKey: "admix_accelerator",
    targetStrength: 30,
    targetWCRatio: "0.40 - 0.46",
    suggestedWCRatio: 0.42,
    targetDmax: 8,
    targetSlump: 6,
    targetAirContent: 3.0,
    targetFinenessMod: "2.3 - 2.6",
    dosageSuper: 0.8,
    dosageAir: 0.0,
    dosageRetarder: 0.0,
    dosageAccelerator: 2.5,
    dosageSilicaFume: 5.0,
    dosageFlyAsh: 0.0,
    dosageSlag: 0.0
  },
  GPC: {
    typeKey: "GPC",
    nameAr: "الخرسانة الجيوبوليمرية الخضراء (GPC)",
    nameSubAr: "مشاريع التنمية المستدامة الخالية تماماً من انبعاثات الإسمنت الكربوني",
    summaryAr: "خرسانة متطورة تستخدم الرماد المتطاير (Fly Ash) والخبث النشط وتتصلد بالكلوريدات والقلويات لتفادي حرق وإشعاع الإسمنت الطبيعي.",
    cementAr: "نوع مخصص (Cement Custom / Geopolymer Linker) - صياغة خالية من غراء الـ Clinker",
    cementTypeKey: "cem_custom",
    aggregateAr: "حصى بازلتية صلدة متأصلة ميكانيكياً لمقاومة التأثير الحمضي والمحلول",
    aggregateTypeKey: "gravel_basalt",
    sandAr: "رمل سيليسي شديد البلورة لتدعيم التكاثف السيليكاتي بالخلطة",
    sandTypeKey: "siliceous_sand",
    admixtureAr: "الملدّن الفائق Superplasticizer مع تفعيل مخبري خاص بمذيب قلوي",
    admixtureTypeKey: "admix_super",
    targetStrength: 40,
    targetWCRatio: "0.30 - 0.35",
    suggestedWCRatio: 0.32,
    targetDmax: 14,
    targetSlump: 14,
    targetAirContent: 1.0,
    targetFinenessMod: "2.7 - 3.0",
    dosageSuper: 1.6,
    dosageAir: 0.0,
    dosageRetarder: 0.0,
    dosageAccelerator: 0.0,
    dosageSilicaFume: 0.0,
    dosageFlyAsh: 35.0,
    dosageSlag: 25.0
  },
  SHC: {
    typeKey: "SHC",
    nameAr: "الخرسانة ذاتية المعالجة (SHC)",
    nameSubAr: "العناصر المغمورة بالكامل بالمياه والأنفاق صعبة الصيانة الفورية",
    summaryAr: "خرسانة بيولوجية مبتكرة مدمج بها كبسولات بكتيرية مغذية أو جزيئات كيميائية غير نشطة تفرز كربونات الكالسيوم لسد الشروخ في حالة تسرب المياه.",
    cementAr: "إسمنت متعدّد الاستخدامات ذو مسامية متزنة كأولويّة CEM I 42.5",
    cementTypeKey: "cem_42_5",
    aggregateAr: "حصى 8/15 قياسي عياري يضمن حركة تلامس هادئة وعقد رطوبة ممتازة",
    aggregateTypeKey: "gravel_8_15",
    sandAr: "رمل وادي طبيعي متوسط (Medium Sand) ملائم ومغسول",
    sandTypeKey: "medium_sand",
    admixtureAr: "بدون مضافات تؤثر على نمو الكائنات الدقيقة الحيوية بالخرسانة",
    admixtureTypeKey: "admix_none",
    targetStrength: 30,
    targetWCRatio: "0.45 - 0.50",
    suggestedWCRatio: 0.46,
    targetDmax: 16,
    targetSlump: 10,
    targetAirContent: 2.0,
    targetFinenessMod: "2.5 - 2.8",
    dosageSuper: 0.8,
    dosageAir: 0.0,
    dosageRetarder: 0.0,
    dosageAccelerator: 0.0,
    dosageSilicaFume: 0.0,
    dosageFlyAsh: 5.0,
    dosageSlag: 0.0
  },
  RAC: {
    typeKey: "RAC",
    nameAr: "خرسانة الركام المعاد تدويره (RAC)",
    nameSubAr: "مشاريع حماية البيئة وإعادة تأهيل ومعالجة الأنقاض الإنشائية موقعياً",
    summaryAr: "تستغل ركام بيتون مهدّم سابقاً ومغسول ومكسر، ولذلك ترتكز التوصيات على التعويض الهيدروليكي للمسام الكبرى الماصة للماء.",
    cementAr: "إسمنت مركب بيئي عالي الكيانات الرابطة CEM II/A",
    cementTypeKey: "cem_ii_a",
    aggregateAr: "نوع مخصص (Gravel Custom/Recycled) - ركام خرساني معاد تدويره ومنظف ومجرش بكثافة معتدلة",
    aggregateTypeKey: "gravel_custom",
    sandAr: "رمل محجر عالي الخشونة حاد الحبيبات للتراص (Quarry Sand)",
    sandTypeKey: "quarry_sand",
    admixtureAr: "الملدّنات بمعدلات دقيقة لضبط التعويض للامتصاص القياسي الفائق للماء",
    admixtureTypeKey: "admix_super",
    targetStrength: 25,
    targetWCRatio: "0.42 - 0.48",
    suggestedWCRatio: 0.45,
    targetDmax: 16,
    targetSlump: 8,
    targetAirContent: 2.0,
    targetFinenessMod: "2.6 - 2.9",
    dosageSuper: 1.4,
    dosageAir: 0.0,
    dosageRetarder: 0.2,
    dosageAccelerator: 0.0,
    dosageSilicaFume: 0.0,
    dosageFlyAsh: 10.0,
    dosageSlag: 5.0
  },
  PERVIOUS: {
    typeKey: "PERVIOUS",
    nameAr: "الخرسانة النفاذة للمياه (Pervious)",
    nameSubAr: "مواقف السيارات الصديقة للبيئة والباحات المتكاملة لامتصاص السيول",
    summaryAr: "لا تحتوي الخرسانة على رمال تقريباً لتترك فراغات تواصل مفتوحة وكثيفة تتيح لمياه الأمطار العبور مباشرة لباطن الأرض دون تشكل برك.",
    cementAr: "إسمنت قياسي CEM I 42.5 بقوام رابط هيدروليكي سميك ومحكم للأغلفة",
    cementTypeKey: "cem_42_5",
    aggregateAr: "حصى خشن معتدل التقطيع 15/25 مم أحادي الحجم لتعظيم فراغات العبور",
    aggregateTypeKey: "gravel_15_25",
    sandAr: "رمل ناعم جداً وبنسبة ضعيفة للغاية لا تزيد عن 5 إلى 10٪ كأقصى تقدير",
    sandTypeKey: "fine_sand",
    admixtureAr: "ملدن عادي يحسن تماسك العجينة حول الحصوات دون سد الثقوب الإنشائية",
    admixtureTypeKey: "admix_plasticizer",
    targetStrength: 10,
    targetWCRatio: "0.30 - 0.35",
    suggestedWCRatio: 0.32,
    targetDmax: 20,
    targetSlump: 2,
    targetAirContent: 20.0, // High void ratio
    targetFinenessMod: "1.8 - 2.2",
    dosageSuper: 0.5,
    dosageAir: 0.0,
    dosageRetarder: 0.0,
    dosageAccelerator: 0.0,
    dosageSilicaFume: 0.0,
    dosageFlyAsh: 0.0,
    dosageSlag: 0.0
  },
  UHPC: {
    typeKey: "UHPC",
    nameAr: "الخرسانة فائقة الأداء (UHPC)",
    nameSubAr: "العناصر المعمارية الرقيقة الفاخرة والمنشآت العسكرية شديدة الحماية وقواعد الآلات",
    summaryAr: "تمثل قمة الهندسة الإنشائية المعاصرة، خرسانة فولاذية المقاومة والصلابة ذات تعبئة فراغات شبه معدومة وتطحين كيميائي متجانس.",
    cementAr: "إسمنت فائق النعومة والبلورة الغرانيتية CEM I 52.5 عالي المقاومة",
    cementTypeKey: "cem_52_5",
    aggregateAr: "حصى بالغة الصغر 3/8 ركامية مم أو رمل حصوي ناعم جداً بكثافة صلبة",
    aggregateTypeKey: "gravel_3_8",
    sandAr: "رمل سيليكا سيليسي فائق الصلابة لتدعيم التلاحم الإنشائي الداخلي",
    sandTypeKey: "siliceous_sand",
    admixtureAr: "أعلى تراكيز الملدنات الفائقة Superplasticizer مع غبار السيليكا المكثف",
    admixtureTypeKey: "admix_super",
    targetStrength: 120,
    targetWCRatio: "0.18 - 0.22",
    suggestedWCRatio: 0.20,
    targetDmax: 5,
    targetSlump: 24,
    targetAirContent: 2.0,
    targetFinenessMod: "2.6 - 3.0",
    dosageSuper: 2.5,
    dosageAir: 0.0,
    dosageRetarder: 0.8,
    dosageAccelerator: 0.0,
    dosageSilicaFume: 20.0,
    dosageFlyAsh: 15.0,
    dosageSlag: 10.0
  },
  BFUP: {
    typeKey: "BFUP",
    nameAr: "الخرسانة الليفية فائقة الأداء (BFUP / UHPFRC)",
    nameSubAr: "الأسقف مسبقة الإجهاد بالغة النحافة والعناصر الهيدروليكية القابلة للالتواء",
    summaryAr: "تجمع بين قوة الـ UHPC المذهلة ومرونة ثني ومطيلية فائقة للمركب الخرساني بفعل شبكة ألياف ميكرو-فولاذية متشابكة هندسياً وتتحمل الشد العالي والقص القاسي.",
    cementAr: "إسمنت فائق الكفاءة CEM I 52.5 لإحكام التلاصق والتماسك مع أشكال الألياف",
    cementTypeKey: "cem_52_5",
    aggregateAr: "ركام رملي ناعم مصغر عياري 3/8 مم لأعلى رص حجمي وحركي هادئ",
    aggregateTypeKey: "gravel_3_8",
    sandAr: "رمل كوارتزي سيليسي دقيق الحواف (Siliceous Sand)",
    sandTypeKey: "siliceous_sand",
    admixtureAr: "درجة قصوى لنسبة الملدنات Superplasticizer المشتتة مع الرماد وسيليكا الكوارتز",
    admixtureTypeKey: "admix_super",
    targetStrength: 140,
    targetWCRatio: "0.15 - 0.20",
    suggestedWCRatio: 0.18,
    targetDmax: 5,
    targetSlump: 26,
    targetAirContent: 2.0,
    targetFinenessMod: "2.5 - 2.9",
    dosageSuper: 2.5,
    dosageAir: 0.0,
    dosageRetarder: 0.9,
    dosageAccelerator: 0.0,
    dosageSilicaFume: 25.0,
    dosageFlyAsh: 20.0,
    dosageSlag: 15.0
  }
};

interface LocalizedRecFields {
  name: string;
  summary: string;
  cement: string;
  aggregate: string;
  sand: string;
  admixture: string;
}

const EN_REC_FIELDS: Record<string, LocalizedRecFields> = {
  NSC: {
    name: "Normal Strength Concrete (NSC)",
    summary: "Standard recommendation for normal columns and standard slabs of moderate thickness, where the priority is economic efficiency, easy workability, and standard aggregate grading.",
    cement: "Standard Cement CEM I 42.5 with balanced strength grade",
    aggregate: "Standard Limestone Gravel 8/15 mm for excellent coverage",
    sand: "Medium Natural River Sand",
    admixture: "No chemical additives or light standard plasticizer only as needed"
  },
  HSC: {
    name: "High Strength Concrete (HSC)",
    summary: "Requires a low water/cement ratio to maximize compressive strength, along with durable basaltic aggregates to prevent internal micro-cracking.",
    cement: "High Strength Cement CEM I 52.5 R (High Early Strength)",
    aggregate: "Durable Basaltic Gravel to prevent brittle crushing under high load",
    sand: "Coarse Sand to minimize the aggregate surface area",
    admixture: "Superplasticizer to ensure flowability with very low water content"
  },
  HPC: {
    name: "High Performance Concrete (HPC / BHP)",
    summary: "Focuses on maximizing density and chemically sealing micro-voids to prevent ingress of moisture and chlorides that corrode reinforcement.",
    cement: "Blended Cement CEM II/A or Fine CEM I 52.5",
    aggregate: "Basaltic or Sharp Crushed Gravel for strong interlocking",
    sand: "Siliceous Sand with high purity for chemical bonding",
    admixture: "Superplasticizer combined with Silica Fume and Fly Ash additives"
  },
  SCC: {
    name: "Self-Consolidating Concrete (SCC / BAP)",
    summary: "Flows like water under its own weight, filling all complex corners and narrow channels without aggregate segregation or mechanical vibration.",
    cement: "Standard Cement CEM I 42.5 combined with limestone filler",
    aggregate: "Fine Gravel 3/8 mm for easy movement between tight rebar",
    sand: "Round River Sand to minimize internal friction during flow",
    admixture: "High dosage of Superplasticizer with Fly Ash fillers"
  },
  FRC: {
    name: "Fiber-Reinforced Concrete (FRC)",
    summary: "Contains fibers creating a matrix resistant to surface cracking, thermal shrinkage, and heavy dynamic impact loads.",
    cement: "High Quality CEM I 42.5 Cement to ensure proper fiber bonding",
    aggregate: "Gravel 8/15 mm with balanced packing packing geometry",
    sand: "Medium River Sand with uniform grain size distribution",
    admixture: "Superplasticizer to compensate for loss of workability due to fibers"
  },
  LWC: {
    name: "Lightweight Concrete (LWC)",
    summary: "Features low bulk density and excellent thermal/acoustic insulation thanks to large void structure and expanded lightweight aggregates.",
    cement: "Ecological Blended Cement CEM II/A with improved workability",
    aggregate: "Expanded clay or lightweight Pumice (Gravel Custom)",
    sand: "Fine washed and graded sand to preserve lightweight voids",
    admixture: "Air-Entraining Agent (AEA) to improve durability and lower density"
  },
  HWC: {
    name: "Heavyweight Concrete (HWC)",
    summary: "Blocks radiation using ultra-high density heavy metallic aggregate (like barite or hematite) shielding gamma and neutron rays.",
    cement: "Sulfate-Resisting Cement like CEM I 42.5 with dense packing",
    aggregate: "Heavy metallic aggregate with density exceeding 4200 kg/m³",
    sand: "High density Coarse Sand with high load resistance",
    admixture: "Superplasticizer to avoid excess water and ensure maximum consolidation"
  },
  RCC: {
    name: "Roller-Compacted Concrete (RCC)",
    summary: "A zero-slump dry concrete paved with standard asphalt equipment and compacted with heavy vibratory rollers.",
    cement: "Blended Cement CEM II/B with low heat of hydration",
    aggregate: "Coarse aggregate 25/40 mm to reduce cement paste demand",
    sand: "Coarse natural sand with stable particle size",
    admixture: "No additives or Retarder to maintain optimal moisture during rolling"
  },
  SHOTCRETE: {
    name: "Shotcrete / Sprayed Concrete",
    summary: "Sprayed at high velocity under pneumatic pressure with special accelerators to ensure immediate adhesion on walls/ceilings.",
    cement: "High Performance Rapid Hardening CEM I 52.5 Cement",
    aggregate: "Fine Gravel 3/8 mm to prevent nozzle clogging during spraying",
    sand: "Fine Sand to provide sticky mortar-like consistency",
    admixture: "Setting Accelerator for instant adhesion and zero-slump mockup"
  },
  GPC: {
    name: "Green Geopolymer Concrete (GPC)",
    summary: "Eco-friendly advanced concrete using fly ash and slag activated by alkali solutions, entirely eliminating cement clinker CO2 emissions.",
    cement: "Custom Binder (Geopolymer Linker) - 100% Clinker-free formulation",
    aggregate: "Hard Basaltic Gravel for high chemical and acid resistance",
    sand: "Siliceous Sand to enhance silicate crystallization",
    admixture: "Superplasticizer with specialized laboratory alkaline activator"
  },
  SHC: {
    name: "Self-Healing Concrete (SHC)",
    summary: "Innovative bio-concrete containing bacterial capsules that produce calcium carbonate to seal cracks automatically when water leaks in.",
    cement: "Multi-purpose CEM I 42.5 Cement with balanced porosity",
    aggregate: "Standard Gravel 8/15 mm ensuring excellent contact and moisture holding",
    sand: "Washed Medium River Sand",
    admixture: "No additives that could harm the bio-healing microbes"
  },
  RAC: {
    name: "Recycled Aggregate Concrete (RAC)",
    summary: "Eco-friendly concrete utilizing crushed recycled concrete aggregate, adjusted to compensate for high water absorption of recycled materials.",
    cement: "Blended ecological CEM II/A cement with high binders",
    aggregate: "Crushed and washed recycled concrete aggregates",
    sand: "Quarry Sand with coarse texture for stable mechanical interlocking",
    admixture: "Superplasticizer to carefully control water absorption"
  },
  PERVIOUS: {
    name: "Pervious Concrete",
    summary: "Contains little to no sand, creating large interconnected macropores that allow rain water to drain directly into the subsoil.",
    cement: "Standard Cement CEM I 42.5 with thick paste coating",
    aggregate: "Single-size coarse gravel 15/25 mm to maximize voids",
    sand: "Minimal Fine Sand (less than 5% to 10% max)",
    admixture: "Plasticizer to keep paste cohesive around aggregates without clogging voids"
  },
  UHPC: {
    name: "Ultra-High Performance Concrete (UHPC)",
    summary: "The pinnacle of modern concrete engineering, offering steel-like strength, nearly zero porosity, and a highly homogeneous microstructure.",
    cement: "Ultra-fine CEM I 52.5 Cement with high strength",
    aggregate: "Very fine aggregate or quartz flour under 5 mm",
    sand: "High purity Siliceous Quartz Sand for strong micro-bonding",
    admixture: "Highest dose of Superplasticizer with dense Silica Fume"
  },
  BFUP: {
    name: "UHPC Fiber-Reinforced Concrete (BFUP / UHPFRC)",
    summary: "Combines the extreme strength of UHPC with high ductile bending capacity using a dense network of micro-steel fibers.",
    cement: "Ultra-high performance CEM I 52.5 Cement for optimal fiber bonding",
    aggregate: "Fine aggregate under 5 mm for dense homogeneous packing",
    sand: "Fine Quartz Siliceous Sand",
    admixture: "Highest dose of Superplasticizer with fly ash and silica fume"
  }
};

const FR_REC_FIELDS: Record<string, LocalizedRecFields> = {
  NSC: {
    name: "Béton de Résistance Normale (NSC)",
    summary: "Recommandation standard pour les poteaux ordinaires et les dalles de moyenne épaisseur, privilégiant l'économie et la maniabilité courante.",
    cement: "Ciment standard CEM I 42.5 à résistance équilibrée",
    aggregate: "Gravier calcaire standard 8/15 mm pour un enrobage optimal",
    sand: "Sable de rivière naturel moyen",
    admixture: "Sans adjuvant ou plastifiant standard léger si nécessaire uniquement"
  },
  HSC: {
    name: "Béton à Haute Résistance (HSC)",
    summary: "Nécessite un faible rapport Eau/Ciment pour maximiser la résistance à la compression, avec des granulats basaltiques très durs.",
    cement: "Ciment à haute résistance CEM I 52.5 R (Prise Rapide)",
    aggregate: "Gravier basaltique pour éviter la rupture fragile sous forte charge",
    sand: "Sable grossier pour réduire la surface spécifique des granulats",
    admixture: "Superplastifiant pour garantir la fluidité avec un très faible apport d'eau"
  },
  HPC: {
    name: "Béton à Hautes Performances (HPC / BHP)",
    summary: "Focalisé sur la densité maximale et le colmatage chimique des pores pour empêcher la pénétration d'agents agressifs (chlorures, sulfates).",
    cement: "Ciment composé CEM II/A ou CEM I 52.5 très fin",
    aggregate: "Gravier basaltique ou concassé pour un excellent enchevêtrement",
    sand: "Sable siliceux pur pour des liaisons chimiques renforcées",
    admixture: "Superplastifiant combiné avec de la Fumée de Silice et des Cendres Volantes"
  },
  SCC: {
    name: "Béton Autoplaçant (SCC / BAP)",
    summary: "S'écoule comme de l'eau sous l'effet de son propre poids, remplissant les coffrages complexes sans vibration mécanique.",
    cement: "Ciment CEM I 42.5 combiné avec du filler calcaire",
    aggregate: "Gravillon fin 3/8 mm pour passer facilement entre les armatures denses",
    sand: "Sable de rivière rond pour réduire les frottements internes",
    admixture: "Forte dose de Superplastifiant avec fillers de cendres volantes"
  },
  FRC: {
    name: "Béton Renforcé de Fibres (FRC)",
    summary: "Contient des fibres créant une matrice résistante à la fissuration de surface, au retrait thermique et aux chocs dynamiques.",
    cement: "Ciment CEM I 42.5 de haute qualité pour l'adhérence des fibres",
    aggregate: "Gravier 8/15 mm à empilement géométrique régulier",
    sand: "Sable moyen à granulométrie uniforme",
    admixture: "Superplastifiant pour compenser la perte de maniabilité due aux fibres"
  },
  LWC: {
    name: "Béton Léger (LWC)",
    summary: "Densité réduite et excellente isolation thermique grâce à une structure poreuse et des granulats légers expansés.",
    cement: "Ciment composé écologique CEM II/A à maniabilité améliorée",
    aggregate: "Argile expansée ou pierre ponce légère (Gravel Custom)",
    sand: "Sable fin lavé et classé pour préserver les vides légers",
    admixture: "Adjuvant entraîneur d'air (AEA) pour la durabilité et la légèreté"
  },
  HWC: {
    name: "Béton Lourd (HWC)",
    summary: "Bloque les rayonnements grâce à des granulats métalliques lourds ultra-denses (baryte, hématite) protégeant des rayons gamma.",
    cement: "Ciment résistant aux sulfates CEM I 42.5 à empilement dense",
    aggregate: "Granulat métallique lourd avec densité supérieure à 4200 kg/m³",
    sand: "Sable grossier à haute densité et forte résistance",
    admixture: "Superplastifiant pour limiter l'eau et garantir une compacité maximale"
  },
  RCC: {
    name: "Béton Compacté au Rouleau (RCC)",
    summary: "Béton sec sans affaissement mis en œuvre avec du matériel routier et compacté par des rouleaux vibrants lourds.",
    cement: "Ciment composé CEM II/B à faible chaleur d'hydratation",
    aggregate: "Gros granulat 25/40 mm pour réduire la pâte de ciment",
    sand: "Sable naturel grossier à granulométrie stable",
    admixture: "Sans adjuvant ou retardateur pour maintenir l'humidité lors du compactage"
  },
  SHOTCRETE: {
    name: "Béton Projeté (Shotcrete)",
    summary: "Projeté à grande vitesse sous pression pneumatique avec accélérateurs spéciaux pour une adhésion immédiate sur parois.",
    cement: "Ciment performant à durcissement rapide CEM I 52.5",
    aggregate: "Gravillon fin 3/8 mm pour éviter le blocage de la buse",
    sand: "Sable fin pour obtenir une consistance de mortier collant",
    admixture: "Accélérateur de prise pour une fixation instantanée sans glissement"
  },
  GPC: {
    name: "Béton Géopolymère Écologique (GPC)",
    summary: "Béton innovant utilisant des cendres volantes et du laitier activés alcalinement, éliminant totalement le ciment clinker.",
    cement: "Liant sur mesure (Geopolymer Linker) - formule 100% sans clinker",
    aggregate: "Gravier basaltique dur pour une haute résistance chimique",
    sand: "Sable siliceux pour favoriser la cristallisation des silicates",
    admixture: "Superplastifiant avec activateur alcalin spécifique"
  },
  SHC: {
    name: "Béton Autocicatrisant (SHC)",
    summary: "Bio-béton contenant des capsules bactériennes qui produisent du carbonate de calcium pour colmater automatiquement les fissures.",
    cement: "Ciment polyvalent CEM I 42.5 à porosité contrôlée",
    aggregate: "Gravier standard 8/15 mm maintenant une excellente humidité",
    sand: "Sable moyen de rivière lavé",
    admixture: "Sans adjuvant nocif pour les micro-organismes réparateurs"
  },
  RAC: {
    name: "Béton de Granulats Recyclés (RAC)",
    summary: "Béton écologique utilisant des granulats de béton recyclé concassé, formulé pour compenser leur forte absorption d'eau.",
    cement: "Ciment écologique CEM II/A à haute teneur en liants",
    aggregate: "Granulats de béton recyclé concassés et lavés",
    sand: "Sable de carrière à texture rugueuse pour un bon enchevêtrement",
    admixture: "Superplastifiant pour réguler précisément l'absorption d'eau"
  },
  PERVIOUS: {
    name: "Béton Drainant / Perméable",
    summary: "Béton presque sans sable créant de grands pores interconnectés qui permettent à l'eau de pluie de s'infiltrer directement.",
    cement: "Ciment standard CEM I 42.5 enveloppant épaissement les gravillons",
    aggregate: "Gravier monoclasse gros 15/25 mm pour maximiser les vides",
    sand: "Sable fin minimal (moins de 5% à 10% maximum)",
    admixture: "Plastifiant pour maintenir la pâte cohérente autour des cailloux"
  },
  UHPC: {
    name: "Béton à Ultra-Hautes Performances (UHPC)",
    summary: "Le sommet de la technologie du béton, offrant une résistance proche de l'acier et une porosité quasi nulle.",
    cement: "Ciment ultra-fin CEM I 52.5 à haute résistance",
    aggregate: "Granulats très fins ou farine de quartz sous 5 mm",
    sand: "Sable siliceux quartzeux très pur pour des micro-liaisons fortes",
    admixture: "Dosage maximal de Superplastifiant avec fumée de silice dense"
  },
  BFUP: {
    name: "Béton Fibré à Ultra-Hautes Performances (BFUP)",
    summary: "Combine l'extrême résistance du UHPC avec une grande ductilité grâce à un réseau de micro-fibres d'acier.",
    cement: "Ciment ultra-performant CEM I 52.5 pour une adhérence optimale des fibres",
    aggregate: "Granulats fins sous 5 mm pour un empilement homogène et dense",
    sand: "Sable siliceux quartzeux fin",
    admixture: "Dosage maximal de Superplastifiant avec cendres volantes et fumée de silice"
  }
};

interface ConcreteRecommendationsCardProps {
  currentType: string;
  materials?: EngineeringMaterial[];
  onApply: (rec: ConcreteRecommendation) => void;
  expandedMaterials?: ExpandedMaterial[];
  onUpdateExpandedMaterials?: (updated: ExpandedMaterial[]) => void;
}

export const ConcreteRecommendationsCard: React.FC<ConcreteRecommendationsCardProps> = ({ 
  currentType, 
  materials,
  onApply,
  expandedMaterials = [],
  onUpdateExpandedMaterials
}) => {
  const { language, isRtl } = useLanguage();

  const [activeGroup, setActiveGroup] = useState<string>("الكل");
  const [searchVal, setSearchVal] = useState<string>("");
  const [editingMaterial, setEditingMaterial] = useState<ExpandedMaterial | null>(null);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  
  // Draft state for adding/editing
  const [draftName, setDraftName] = useState<string>("");
  const [draftEnglishName, setDraftEnglishName] = useState<string>("");
  const [draftGroup, setDraftGroup] = useState<ExpandedMaterial["group"]>("المواد الأساسية");
  const [draftCategory, setDraftCategory] = useState<string>("");
  const [draftDesc, setDraftDesc] = useState<string>("");
  const [draftUses, setDraftUses] = useState<string>("");
  const [draftCompatibleTypes, setDraftCompatibleTypes] = useState<string[]>([]);

  const GROUPS_LIST = [
    "الكل",
    "المواد الأساسية",
    "الخلطات الكيميائية",
    "الشوائب المعدنية",
    "الألياف",
    "الركام الخاص",
    "المواد المتقدمة"
  ] as const;

  const ALL_CONCRETE_TYPES = [
    { code: "NSC", name: "عادية المقاومة (NSC)" },
    { code: "HSC", name: "عالية المقاومة (HSC)" },
    { code: "HPC", name: "عالية الأداء (HPC)" },
    { code: "SCC", name: "ذاتية الدمك (SCC)" },
    { code: "FRC", name: "مسلحة بالألياف (FRC)" },
    { code: "LWC", name: "خفيفة الوزن (LWC)" },
    { code: "HWC", name: "ثقيلة الوزن (HWC)" },
    { code: "RCC", name: "مدكوكة بالحدل (RCC)" },
    { code: "SHOTCRETE", name: "مقذوفة (Shotcrete)" },
    { code: "GPC", name: "جيوبوليمر (GPC)" },
    { code: "SHC", name: "ذاتية الإصلاح (SHC)" },
    { code: "RAC", name: "ركام معاد تدويره (RAC)" },
    { code: "PERVIOUS", name: "نفاذة للمياه (Pervious)" },
    { code: "UHPC", name: "فائقة الأداء (UHPC)" },
    { code: "BFUP", name: "ألياف فائقة الأداء (BFUP)" }
  ];

  // Normalize the selected type to upper-case to match keys safely
  const keyMatch = (currentType || "NSC").toUpperCase();
  const rec = CONCRETE_RECOMMENDATIONS[keyMatch] || CONCRETE_RECOMMENDATIONS.NSC;

  // Dynamic material resolution from expanded materials database
  const compatibleExpanded = useMemo(() => {
    return (expandedMaterials || []).filter(m => {
      // Must be compatible with the selected concrete type
      const isCompatible = m.compatibleTypes.some(t => t.toUpperCase() === keyMatch);
      if (!isCompatible) return false;
      
      // Match group if not "الكل"
      if (activeGroup !== "الكل" && m.group !== activeGroup) return false;
      
      // Match search query
      if (searchVal.trim() !== "") {
        const query = searchVal.toLowerCase();
        const nameMatch = m.name.toLowerCase().includes(query) || m.englishName.toLowerCase().includes(query);
        const catMatch = m.category.toLowerCase().includes(query);
        const descMatch = m.desc.toLowerCase().includes(query) || m.uses.toLowerCase().includes(query);
        return nameMatch || catMatch || descMatch;
      }
      
      return true;
    });
  }, [expandedMaterials, keyMatch, activeGroup, searchVal]);

  const handleEditClick = (mat: ExpandedMaterial) => {
    setEditingMaterial(mat);
    setDraftName(mat.name);
    setDraftEnglishName(mat.englishName);
    setDraftGroup(mat.group);
    setDraftCategory(mat.category);
    setDraftDesc(mat.desc);
    setDraftUses(mat.uses);
    setDraftCompatibleTypes(mat.compatibleTypes);
    setIsAddingNew(false);
  };

  const handleAddNewClick = () => {
    setIsAddingNew(true);
    setEditingMaterial(null);
    setDraftName("");
    setDraftEnglishName("");
    setDraftGroup("المواد الأساسية");
    setDraftCategory("");
    setDraftDesc("");
    setDraftUses("");
    setDraftCompatibleTypes([keyMatch]);
  };

  const handleSaveDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftName.trim() || !draftCategory.trim()) return;

    if (isAddingNew) {
      const newMat: ExpandedMaterial = {
        id: `exp-custom-${Date.now()}`,
        name: draftName,
        englishName: draftEnglishName || draftName,
        group: draftGroup,
        category: draftCategory,
        desc: draftDesc,
        uses: draftUses,
        compatibleTypes: draftCompatibleTypes
      };
      if (onUpdateExpandedMaterials) {
        onUpdateExpandedMaterials([...expandedMaterials, newMat]);
      }
      setIsAddingNew(false);
    } else if (editingMaterial) {
      const updated = expandedMaterials.map(m => {
        if (m.id === editingMaterial.id) {
          return {
            ...m,
            name: draftName,
            englishName: draftEnglishName || draftName,
            group: draftGroup,
            category: draftCategory,
            desc: draftDesc,
            uses: draftUses,
            compatibleTypes: draftCompatibleTypes
          };
        }
        return m;
      });
      if (onUpdateExpandedMaterials) {
        onUpdateExpandedMaterials(updated);
      }
      setEditingMaterial(null);
    }
  };

  const handleDeleteMaterial = (id: string) => {
    const updated = expandedMaterials.filter(m => m.id !== id);
    if (onUpdateExpandedMaterials) {
      onUpdateExpandedMaterials(updated);
    }
  };

  const toggleCompatibleType = (code: string) => {
    if (draftCompatibleTypes.includes(code)) {
      setDraftCompatibleTypes(draftCompatibleTypes.filter(c => c !== code));
    } else {
      setDraftCompatibleTypes([...draftCompatibleTypes, code]);
    }
  };

  // Dynamic material resolution from materials database
  const getMatchedMaterial = (category: string, typeKey: string, defaultName: string) => {
    if (!materials || materials.length === 0) return { name: defaultName, provenance: undefined, sourceQuarry: undefined, quality: undefined };
    
    const catMats = materials.filter(m => m.category === category);
    if (catMats.length === 0) return { name: defaultName, provenance: undefined, sourceQuarry: undefined, quality: undefined };

    let matched;
    if (category === "إسمنت") {
      matched = catMats.find(m => (
        (typeKey === "cem_52_5" && m.name.includes("52.5")) ||
        (typeKey === "cem_42_5" && m.name.includes("42.5")) ||
        (typeKey === "cem_32_5" && m.name.includes("32.5")) ||
        (typeKey === "cem_ii_a" && (m.name.includes("CEM II") || m.name.includes("II/A"))) ||
        (typeKey === "cem_ii_b" && (m.name.includes("CEM II") || m.name.includes("II/B")))
      ));
    } else if (category === "رمال") {
      matched = catMats.find(m => (
        (typeKey === "fine_sand" && m.name.includes("ناعم")) ||
        (typeKey === "medium_sand" && m.name.includes("متوسط")) ||
        (typeKey === "coarse_sand" && m.name.includes("خشن")) ||
        (typeKey === "river_sand" && (m.name.includes("نهر") || (m.englishName && m.englishName.includes("River")))) ||
        (typeKey === "quarry_sand" && (m.name.includes("محجر") || m.name.includes("كسارة") || (m.englishName && m.englishName.includes("Crushed")))) ||
        (typeKey === "siliceous_sand" && (m.name.includes("سيليسي") || (m.englishName && m.englishName.includes("Silica")))) ||
        (typeKey === "calcareous_sand" && (m.name.includes("كلسي") || (m.englishName && m.englishName.includes("Calcareous"))))
      ));
    } else if (category === "حصى") {
      matched = catMats.find(m => (
        (typeKey === "gravel_3_8" && m.name.includes("3/8")) ||
        (typeKey === "gravel_8_15" && m.name.includes("8/15")) ||
        (typeKey === "gravel_15_25" && m.name.includes("15/25")) ||
        (typeKey === "gravel_25_40" && m.name.includes("25/40")) ||
        (typeKey === "gravel_basalt" && (m.name.includes("بازلت") || (m.englishName && m.englishName.includes("Basalt")))) ||
        (typeKey === "gravel_calcareous" && (m.name.includes("كلس") || (m.englishName && m.englishName.includes("Calcite")) || (m.englishName && m.englishName.includes("Calcareous")))) ||
        (typeKey === "gravel_river" && (m.name.includes("نهري") || (m.englishName && m.englishName.includes("River")))) ||
        (typeKey === "gravel_crushed" && (m.name.includes("مكسر") || (m.englishName && m.englishName.includes("Crushed"))))
      ));
    } else if (category === "إضافات كيميائية") {
      matched = catMats.find(m => (
        (typeKey === "admix_super" && (m.name.includes("فائق") || m.name.includes("Superplasticizer"))) ||
        (typeKey === "admix_plasticizer" && (m.name.includes("ملدن") || m.name.includes("Plasticizer")))
      ));
    }

    if (!matched) {
      matched = catMats[0];
    }
    
    return matched ? {
      name: matched.name,
      provenance: matched.provenance || matched.region,
      sourceQuarry: matched.sourceQuarry || matched.source,
      quality: matched.quality || matched.desc
    } : { name: defaultName, provenance: undefined, sourceQuarry: undefined, quality: undefined };
  };

  const resolvedCement = getMatchedMaterial("إسمنت", rec.cementTypeKey, rec.cementAr);
  const resolvedGravel = getMatchedMaterial("حصى", rec.aggregateTypeKey, rec.aggregateAr);
  const resolvedSand = getMatchedMaterial("رمال", rec.sandTypeKey, rec.sandAr);
  const resolvedAdmixture = getMatchedMaterial("إضافات كيميائية", rec.admixtureTypeKey, rec.admixtureAr);

  const getLocalizedFields = (): LocalizedRecFields => {
    if (language === "ar") {
      return {
        name: rec.nameAr,
        summary: rec.summaryAr,
        cement: resolvedCement.name,
        aggregate: resolvedGravel.name,
        sand: resolvedSand.name,
        admixture: resolvedAdmixture.name
      };
    } else if (language === "fr") {
      const frFields = FR_REC_FIELDS[keyMatch] || FR_REC_FIELDS.NSC;
      return {
        ...frFields,
        cement: resolvedCement.name,
        aggregate: resolvedGravel.name,
        sand: resolvedSand.name,
        admixture: resolvedAdmixture.name
      };
    } else {
      const enFields = EN_REC_FIELDS[keyMatch] || EN_REC_FIELDS.NSC;
      return {
        ...enFields,
        cement: resolvedCement.name,
        aggregate: resolvedGravel.name,
        sand: resolvedSand.name,
        admixture: resolvedAdmixture.name
      };
    }
  };

  const fields = getLocalizedFields();

  const handleApplyClick = () => {
    onApply(rec);
  };

  return (
    <div className={`bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-500/10 dark:via-transparent dark:to-transparent border border-amber-500/20 dark:border-amber-500/30 rounded-2xl p-5 shadow-sm space-y-4 ${isRtl ? "text-right" : "text-left"}`} id="concreteRecommendationsPanel">
      
      {/* Header and Title */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-amber-500/10 dark:border-amber-500/20 pb-3 gap-3 ${isRtl ? "flex-col sm:flex-row" : "flex-col sm:flex-row-reverse"}`}>
        
        {/* CTA Button to Apply Suggestions */}
        <button
          type="button"
          onClick={handleApplyClick}
          className="w-full sm:w-auto text-xs flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-550 to-amber-600 hover:from-amber-600 hover:to-amber-700 hover:shadow-md cursor-pointer text-slate-900 font-black px-4 py-2 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] border border-amber-400"
          title={language === "ar" ? "تحديث نموذج إدخال المعطيات بهذه المعايير المقترحة" : language === "fr" ? "Mettre à jour le formulaire avec ces spécifications recommandées" : "Update input form with these recommended specifications"}
        >
          <CheckCircle2 size={14} className="text-slate-900 shrink-0" />
          <span>
            {language === "ar" ? "تطبيق التوصيات المقترحة على الحسابات" :
             language === "fr" ? "Appliquer les recommandations proposées" :
             "Apply Suggested Recommendations"}
          </span>
        </button>

        <div className={`flex items-center gap-2.5 ${isRtl ? "justify-end" : "justify-start"}`}>
          <div className={isRtl ? "text-right" : "text-left"}>
            <h4 className={`text-xs font-black text-amber-600 dark:text-amber-400 flex items-center gap-1 ${isRtl ? "justify-end" : "justify-start"} uppercase tracking-widest font-mono select-none`}>
              <span>
                {language === "ar" ? "توصيات المواد والخصائص الذكية" :
                 language === "fr" ? "Recommandations Matériaux" :
                 "Smart Material Recommendations"}
              </span>
              <Sparkles size={13} className="text-amber-500" />
            </h4>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {language === "ar" ? "توجيهات هندسية آلية ملائمة لـ " :
               language === "fr" ? "Directives techniques pour " :
               "Automated guidelines for "}
              <span className="font-extrabold text-slate-800 dark:text-slate-300">{fields.name}</span>
            </p>
          </div>
          <div className="w-9 h-9 bg-amber-500/10 text-amber-500 flex items-center justify-center rounded-xl shrink-0">
            <Cpu size={18} className="animate-pulse" />
          </div>
        </div>

      </div>

      {/* Brief Summary Explanation for the Selected Concrete Type */}
      <div className={`bg-amber-500/5 dark:bg-amber-500/2 p-3.5 rounded-xl border border-amber-300/10 text-[11px] leading-relaxed text-slate-700 dark:text-slate-350 ${isRtl ? "pr-4 border-r-4 border-r-amber-500" : "pl-4 border-l-4 border-l-amber-500"} font-sans`}>
        <strong className="text-slate-800 dark:text-white block mb-0.5 font-bold">
          {language === "ar" ? "لماذا هذا التكوين للمواد؟" :
           language === "fr" ? "Pourquoi cette composition ?" :
           "Why this composition?"}
        </strong>
        {fields.summary}
      </div>

      {/* Grid containing Material Specifications Suggestions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
        
        {/* Suggestion 1: Cement */}
        <div className={`bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 p-3.5 rounded-xl flex flex-col justify-between space-y-2 relative ${isRtl ? "text-right" : "text-left"}`}>
          <div className="flex justify-between items-start">
            <span className="text-[9px] bg-red-500/10 text-red-500 dark:text-red-400 font-black px-1.5 py-0.5 rounded font-mono">CEM SPEC</span>
            <Flame size={14} className="text-red-500" />
          </div>
          <div>
            <span className="text-[9.5px] text-slate-400 block font-semibold leading-none">
              {language === "ar" ? "الإسمنت المقترح:" :
               language === "fr" ? "Ciment proposé :" :
               "Suggested Cement:"}
            </span>
            <p className="text-xs font-black text-slate-850 dark:text-slate-200 mt-1 leading-snug">
              {fields.cement}
            </p>
            {(resolvedCement.provenance || resolvedCement.sourceQuarry) && (
              <div className="mt-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/60 flex items-center gap-1">
                <span className="text-[9.5px] font-black text-red-500 dark:text-red-400 bg-red-500/5 px-1.5 py-0.5 rounded leading-none">
                  📍 {resolvedCement.sourceQuarry || resolvedCement.provenance}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Suggestion 2: Gravel / Aggregate */}
        <div className={`bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 p-3.5 rounded-xl flex flex-col justify-between space-y-2 ${isRtl ? "text-right" : "text-left"}`}>
          <div className="flex justify-between items-start">
            <span className="text-[9px] bg-sky-500/10 text-sky-500 dark:text-sky-450 font-black px-1.5 py-0.5 rounded font-mono">GRAVEL SPEC</span>
            <Layers size={14} className="text-sky-500" />
          </div>
          <div>
            <span className="text-[9.5px] text-slate-400 block font-semibold leading-none">
              {language === "ar" ? "الحصى/الركام المقترح:" :
               language === "fr" ? "Gravillons proposés :" :
               "Suggested Gravel:"}
            </span>
            <p className="text-xs font-black text-slate-850 dark:text-slate-200 mt-1 leading-snug">
              {fields.aggregate}
            </p>
            {(resolvedGravel.provenance || resolvedGravel.sourceQuarry) && (
              <div className="mt-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/60 flex items-center gap-1">
                <span className="text-[9.5px] font-black text-sky-500 dark:text-sky-450 bg-sky-500/5 px-1.5 py-0.5 rounded leading-none">
                  📍 {resolvedGravel.sourceQuarry || resolvedGravel.provenance}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Suggestion 3: Sand */}
        <div className={`bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 p-3.5 rounded-xl flex flex-col justify-between space-y-2 ${isRtl ? "text-right" : "text-left"}`}>
          <div className="flex justify-between items-start">
            <span className="text-[9px] bg-amber-500/10 text-amber-500 dark:text-amber-450 font-black px-1.5 py-0.5 rounded font-mono">SAND SPEC</span>
            <Layers size={14} className="text-amber-500" />
          </div>
          <div>
            <span className="text-[9.5px] text-slate-400 block font-semibold leading-none">
              {language === "ar" ? "الرمل المقترح:" :
               language === "fr" ? "Sable proposé :" :
               "Suggested Sand:"}
            </span>
            <p className="text-xs font-black text-slate-850 dark:text-slate-200 mt-1 leading-snug">
              {fields.sand}
            </p>
            {(resolvedSand.provenance || resolvedSand.sourceQuarry) && (
              <div className="mt-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/60 flex items-center gap-1">
                <span className="text-[9.5px] font-black text-amber-500 dark:text-amber-450 bg-amber-500/5 px-1.5 py-0.5 rounded leading-none">
                  📍 {resolvedSand.sourceQuarry || resolvedSand.provenance}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Suggestion 4: Admixtures / Modifiers */}
        <div className={`bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 p-3.5 rounded-xl flex flex-col justify-between space-y-2 ${isRtl ? "text-right" : "text-left"}`}>
          <div className="flex justify-between items-start">
            <span className="text-[9px] bg-blue-500/10 text-blue-500 dark:text-blue-450 font-black px-1.5 py-0.5 rounded font-mono">ADMIX SPEC</span>
            <Droplet size={14} className="text-blue-500" />
          </div>
          <div>
            <span className="text-[9.5px] text-slate-400 block font-semibold leading-none">
              {language === "ar" ? "الإضافات والمحسنات:" :
               language === "fr" ? "Adjuvants/Additions :" :
               "Admixtures & Additions:"}
            </span>
            <p className="text-xs font-black text-slate-850 dark:text-slate-200 mt-1 leading-snug">
              {fields.admixture}
            </p>
            {(resolvedAdmixture.provenance || resolvedAdmixture.sourceQuarry) && (
              <div className="mt-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/60 flex items-center gap-1">
                <span className="text-[9.5px] font-black text-blue-500 dark:text-blue-450 bg-blue-500/5 px-1.5 py-0.5 rounded leading-none">
                  📍 {resolvedAdmixture.sourceQuarry || resolvedAdmixture.provenance}
                </span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Suggested Engineering Target Parameters Layout */}
      <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200/70 dark:border-slate-800/80 space-y-3">
        
        <span className="text-[10px] font-black text-slate-450 uppercase tracking-wider block">
          {language === "ar" ? "🔧 الخصائص والمعايير الهندسية والفيزيائية المستهدفة (Target Physical Parameters):" :
           language === "fr" ? "🔧 Paramètres Physiques & Propriétés Techniques Cibles :" :
           "🔧 Target Physical & Engineering Parameters:"}
        </span>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          
          {/* Parameter: fck28 */}
          <div className={`bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 px-3 py-2 rounded-lg ${isRtl ? "text-right" : "text-left"}`}>
            <span className="text-[9px] text-slate-400 font-bold block leading-none mb-1">
              {language === "ar" ? "المقاومة fck28" : language === "fr" ? "Résistance fck28" : "Strength fck28"}
            </span>
            <strong className="text-xs font-mono text-slate-805 dark:text-slate-200">
              {rec.targetStrength} <span className="text-[10px] font-sans">MPa</span>
            </strong>
          </div>

          {/* Parameter: W/C Ratio */}
          <div className={`bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 px-3 py-2 rounded-lg ${isRtl ? "text-right" : "text-left"}`}>
            <span className="text-[9px] text-slate-400 font-bold block leading-none mb-1">
              {language === "ar" ? "نسبة الماء / الإسمنت" : language === "fr" ? "Rapport E/C" : "W/C Ratio"}
            </span>
            <strong className="text-xs font-mono text-amber-500 dark:text-amber-400">
              {rec.targetWCRatio}
            </strong>
          </div>

          {/* Parameter: Dmax */}
          <div className={`bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 px-3 py-2 rounded-lg ${isRtl ? "text-right" : "text-left"}`}>
            <span className="text-[9px] text-slate-400 font-bold block leading-none mb-1">
              {language === "ar" ? "القطر الأقصى Dmax" : language === "fr" ? "Taille Dmax" : "Dmax Size"}
            </span>
            <strong className="text-xs font-mono text-slate-805 dark:text-slate-200">
              {rec.targetDmax} <span className="text-[10px] font-sans">{language === "ar" ? "مم" : "mm"}</span>
            </strong>
          </div>

          {/* Parameter: Slump */}
          <div className={`bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 px-3 py-2 rounded-lg ${isRtl ? "text-right" : "text-left"}`}>
            <span className="text-[9px] text-slate-400 font-bold block leading-none mb-1">
              {language === "ar" ? "الهبوط المستهدف" : language === "fr" ? "Affaissement cible" : "Target Slump"}
            </span>
            <strong className="text-xs font-mono text-slate-805 dark:text-slate-200">
              {rec.targetSlump} <span className="text-[10px] font-sans">{language === "ar" ? "سم" : "cm"}</span>
            </strong>
          </div>

          {/* Parameter: Air Content */}
          <div className={`bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 px-3 py-2 rounded-lg ${isRtl ? "text-right" : "text-left"}`}>
            <span className="text-[9px] text-slate-400 font-bold block leading-none mb-1">
              {language === "ar" ? "نسبة الهواء المحبوس" : language === "fr" ? "Teneur en Air" : "Air Content"}
            </span>
            <strong className="text-xs font-mono text-slate-805 dark:text-slate-200">
              {rec.targetAirContent} <span className="text-[10px] font-sans">%</span>
            </strong>
          </div>

          {/* Parameter: Fineness modulus */}
          <div className={`bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 px-3 py-2 rounded-lg ${isRtl ? "text-right" : "text-left"}`}>
            <span className="text-[9px] text-slate-400 font-bold block leading-none mb-1">
              {language === "ar" ? "معامل النعومة MF" : language === "fr" ? "Module de Finesse" : "Fineness Modulus"}
            </span>
            <strong className="text-xs font-mono text-[#4F46E5] dark:text-violet-400">
              {rec.targetFinenessMod}
            </strong>
          </div>

        </div>

        {/* Micro advisory footer inside card */}
        <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center text-[9px] text-slate-400 dark:text-slate-500 pt-1 gap-1`}>
          <span>
            {language === "ar" ? "* تعتمد الحسابات الدقيقة لمقاومة الضغط على تداخل الإضافات المعدنية ومظهر الرص بطريقة درو." :
             language === "fr" ? "* Les calculs précis de résistance dépendent des adjuvants et du compactage de Dreux-Gorisse." :
             "* Precise strength calculations depend on mineral admixtures interaction and Dreux-Gorisse compaction."}
          </span>
          <span>
            {language === "ar" ? "توصيات مطابقة للمواصفة الجزائرية ومعايير الكود العربي المشترك EN 206-1" :
             language === "fr" ? "Conforme aux normes Algériennes et standards Eurocode/EN 206-1" :
             "Complies with Algerian standards & EN 206-1 joint Arab code"}
          </span>
        </div>

      </div>

      {/* COMPATIBLE MATERIALS AND COMPONENTS EXPANDED CATALOG (المواد والمكونات المتوافقة بالتفصيل) */}
      <div className="bg-slate-50 dark:bg-[#1E293B]/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 mt-6">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-slate-200 dark:border-slate-800 gap-3">
          <div>
            <h4 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
              <Layers size={16} className="text-blue-500" />
              <span>
                {language === "ar" ? "المكونات الكاملة والمواد المتوافقة" :
                 language === "fr" ? "Matériaux compatibles et composants" :
                 "Full Components & Compatible Materials"}
              </span>
              <span className="text-xs bg-blue-550/10 text-blue-550 dark:text-blue-400 px-2.5 py-0.5 rounded-full font-bold">
                {compatibleExpanded.length} {language === "ar" ? "مواد متوافقة" : "materials"}
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {language === "ar" ? `جميع المواد الأساسية والمتقدمة المتوافقة لتصميم خلطة ${fields.name} بنجاح.` :
               language === "fr" ? `Tous les matériaux compatibles recommandés pour formuler le béton ${fields.name}.` :
               `All compatible materials recommended to formulate ${fields.name} successfully.`}
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddNewClick}
            className="w-full sm:w-auto text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-black px-3.5 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/10 hover:scale-[1.02] cursor-pointer"
          >
            <Plus size={14} strokeWidth={3} />
            <span>{language === "ar" ? "إضافة مادة جديدة للكتالوج" : "Add New Material"}</span>
          </button>
        </div>

        {/* Search & Group Filters Bar */}
        <div className="flex flex-col md:flex-row gap-3 items-center">
          
          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder={language === "ar" ? "ابحث بالاسم، الفئة، أو الوصف..." : "Search by name, category, desc..."}
              className="w-full pr-10 pl-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 text-right"
              dir="rtl"
            />
            {searchVal && (
              <button
                type="button"
                onClick={() => setSearchVal("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Group Filter Tabs (Scrollable on small screens) */}
          <div className="flex gap-1.5 overflow-x-auto w-full py-1 scrollbar-none justify-start md:justify-end" dir="rtl">
            {GROUPS_LIST.map((group) => {
              const isActive = activeGroup === group;
              return (
                <button
                  key={group}
                  type="button"
                  onClick={() => setActiveGroup(group)}
                  className={`text-[11px] font-black px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                    isActive 
                      ? "bg-blue-600 text-white shadow" 
                      : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  }`}
                >
                  {language === "ar" ? group :
                   group === "الكل" ? "All" :
                   group === "المواد الأساسية" ? "Base" :
                   group === "الخلطات الكيميائية" ? "Admixtures" :
                   group === "الشوائب المعدنية" ? "Minerals" :
                   group === "الألياف" ? "Fibers" :
                   group === "الركام الخاص" ? "Special" : "Advanced"}
                </button>
              );
            })}
          </div>

        </div>

        {/* ADD OR EDIT FORM DRAWER */}
        {(isAddingNew || editingMaterial) && (
          <form onSubmit={handleSaveDraft} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border-2 border-blue-500/30 shadow-lg space-y-4 text-right animate-fade-in" dir="rtl">
            
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => { setIsAddingNew(false); setEditingMaterial(null); }}
                className="p-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-500"
              >
                <X size={15} />
              </button>
              <h5 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                <Plus size={15} className="text-emerald-500" />
                <span>{isAddingNew ? "إضافة مادة متوافقة جديدة" : `تعديل مادة: ${editingMaterial?.name}`}</span>
              </h5>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Arabic Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 block">الاسم بالكامل (عربي) *</label>
                <input
                  type="text"
                  required
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder="مثال: أسمنت بورتلاندي مقاوم للكبريتات"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 text-right"
                />
              </div>

              {/* English Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 block">الاسم بالكامل (إنجليزي)</label>
                <input
                  type="text"
                  value={draftEnglishName}
                  onChange={(e) => setDraftEnglishName(e.target.value)}
                  placeholder="Example: Sulfate Resistant Cement"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 text-left"
                  dir="ltr"
                />
              </div>

              {/* Group */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 block">الفئة الكبرى (Group) *</label>
                <select
                  value={draftGroup}
                  onChange={(e) => setDraftGroup(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 text-right"
                >
                  <option value="المواد الأساسية">المواد الأساسية</option>
                  <option value="الخلطات الكيميائية">الخلطات الكيميائية</option>
                  <option value="الشوائب المعدنية">الشوائب المعدنية</option>
                  <option value="الألياف">الألياف</option>
                  <option value="الركام الخاص">الركام الخاص</option>
                  <option value="المواد المتقدمة">المواد المتقدمة</option>
                </select>
              </div>

              {/* Specific Category */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 block">فئة المادة الفرعية *</label>
                <input
                  type="text"
                  required
                  value={draftCategory}
                  onChange={(e) => setDraftCategory(e.target.value)}
                  placeholder="مثال: الأسمنت، الركام الخشن، الألياف"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 text-right"
                />
              </div>

            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 block">الوصف المختصر (Short Description) *</label>
              <textarea
                required
                value={draftDesc}
                onChange={(e) => setDraftDesc(e.target.value)}
                placeholder="اكتب وصفاً علمياً مختصراً للمادة وتركيبها..."
                rows={2}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 text-right"
              />
            </div>

            {/* Usage in Concrete */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 block">الاستخدام والتأثير في الخرسانة (Usage in Concrete) *</label>
              <textarea
                required
                value={draftUses}
                onChange={(e) => setDraftUses(e.target.value)}
                placeholder="ما هي الفائدة الهندسية والنسب المقترحة لإضافتها بالخلطة؟"
                rows={2}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 text-right"
              />
            </div>

            {/* Compatibility Checklist */}
            <div className="space-y-2 border-t border-slate-150 dark:border-slate-800/80 pt-3">
              <label className="text-[10px] font-black text-slate-400 block">الخرسانات المتوافقة مع هذه المادة (Concrete Compatibility) *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2" dir="rtl">
                {ALL_CONCRETE_TYPES.map((type) => {
                  const isChecked = draftCompatibleTypes.includes(type.code);
                  return (
                    <label
                      key={type.code}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-[10px] font-bold cursor-pointer transition-all ${
                        isChecked 
                          ? "bg-blue-500/10 border-blue-400 text-blue-600 dark:text-blue-400" 
                          : "bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-500"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleCompatibleType(type.code)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3 h-3 cursor-pointer"
                      />
                      <span>{type.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 border-t border-slate-150 dark:border-slate-800/80 pt-3">
              <button
                type="button"
                onClick={() => { setIsAddingNew(false); setEditingMaterial(null); }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black cursor-pointer"
              >
                {language === "ar" ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow cursor-pointer"
              >
                <Save size={13} />
                <span>{language === "ar" ? "حفظ المادة" : "Save Material"}</span>
              </button>
            </div>

          </form>
        )}

        {/* COMPATIBLE MATERIALS LISTING GRID */}
        {compatibleExpanded.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-400">
            <Info size={24} className="mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-semibold">
              {language === "ar" ? "لا توجد مواد متطابقة ومسجلة في هذه الفئة حالياً لهذا الصنف." : "No compatible materials found in this category."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {compatibleExpanded.map((mat) => (
              <div 
                key={mat.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative group text-right"
                dir="rtl"
              >
                {/* Card Tag & Category */}
                <div className="flex justify-between items-start mb-2">
                  
                  {/* Action buttons (Visible on hover on desktop, or always on mobile) */}
                  <div className="flex gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleEditClick(mat)}
                      className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-all cursor-pointer"
                      title={language === "ar" ? "تعديل المادة" : "Edit Material"}
                    >
                      <Edit3 size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMaterial(mat.id)}
                      className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 transition-all cursor-pointer"
                      title={language === "ar" ? "حذف المادة" : "Delete Material"}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  <span className="text-[9px] bg-blue-550/10 text-blue-550 dark:text-blue-400 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                    {mat.category}
                  </span>
                </div>

                {/* Material Names */}
                <div className="space-y-0.5">
                  <h5 className="text-xs font-black text-slate-800 dark:text-slate-100 leading-snug">
                    {mat.name}
                  </h5>
                  <span className="text-[9px] font-mono text-slate-400 block font-bold leading-none">
                    {mat.englishName}
                  </span>
                </div>

                {/* Description & Usage */}
                <div className="mt-3 space-y-2 border-t border-slate-100 dark:border-slate-800/80 pt-2 text-[11px] leading-relaxed">
                  
                  {/* Short Description */}
                  <div className="text-slate-600 dark:text-slate-350">
                    <span className="font-extrabold text-slate-400 block text-[9.5px] leading-none mb-1">
                      {language === "ar" ? "الوصف الهيدروليكي والمجهري:" : "Description:"}
                    </span>
                    <p className="font-sans leading-relaxed">{mat.desc}</p>
                  </div>

                  {/* Usage in Concrete */}
                  <div className="bg-blue-500/5 dark:bg-blue-500/2 p-2 rounded-lg border border-blue-500/10 text-slate-700 dark:text-slate-300">
                    <span className="font-extrabold text-blue-500 dark:text-blue-400 block text-[9.5px] leading-none mb-1">
                      💡 {language === "ar" ? "التطبيق ودوره في الخرسانة:" : "Usage in Concrete:"}
                    </span>
                    <p className="font-sans leading-relaxed font-semibold">{mat.uses}</p>
                  </div>

                </div>

              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
};
