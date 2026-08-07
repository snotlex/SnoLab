/**
 * Comprehensive Catalog of Structural Elements for Concrete Mix Design
 * Governs slump, Dmax, minimum cement content, and exposure class recommendations.
 */

export interface StructuralElementConfig {
  id: string;
  nameAr: string;
  nameEn: string;
  nameFr: string;
  category: "vertical" | "horizontal" | "infrastructure" | "hydraulic" | "precast" | "masonry" | "custom";
  recommendedSlump: { min: number; max: number; target: number }; // cm
  recommendedDmax: number; // mm
  minCementKgM3: number; // kg/m³
  defaultExposureClass: string;
  vibrationRecommendationAr: string;
  descriptionAr: string;
  engineeringAdviceAr: string;
}

export const STRUCTURAL_ELEMENTS: StructuralElementConfig[] = [
  {
    id: "column",
    nameAr: "عمود إنشائي (Column)",
    nameEn: "Reinforced Column",
    nameFr: "Poteau en Béton Armé",
    category: "vertical",
    recommendedSlump: { min: 10, max: 16, target: 14 },
    recommendedDmax: 20,
    minCementKgM3: 350,
    defaultExposureClass: "XC1",
    vibrationRecommendationAr: "هز ميكانيكي داخلي بالإبرة الرجاجة بقطر 35-50 مم مع تجنب ملامسة حديد التسليح لمنع الانفصال الحبيبي.",
    descriptionAr: "عنصر رأسي يحمل أحمالاً ضاغطة محورية ومزدحمة بحديد التسليح الرأسي والكانات المغلقة.",
    engineeringAdviceAr: "ينصح بزيادة انسيابية القوام (Slump 12-16 سم) لتفادي التعشيش في أسفل العمود حول التراكبات."
  },
  {
    id: "beam",
    nameAr: "جسر / جائز (Beam)",
    nameFr: "Poutre en Béton Armé",
    nameEn: "Reinforced Beam",
    category: "horizontal",
    recommendedSlump: { min: 8, max: 14, target: 10 },
    recommendedDmax: 20,
    minCementKgM3: 330,
    defaultExposureClass: "XC1",
    vibrationRecommendationAr: "رج ميكانيكي غاطس على فترات متقاربة 30-50 سم مسافة بين النقاط.",
    descriptionAr: "عنصر أفقي يتأثر بإجهادات الانعطاف والقص الحاد مع كثافة تسليح سفلي وعلوي.",
    engineeringAdviceAr: "تأكد أن المقاس الأقصى للركام Dmax لا يتجاوز 3/4 التباعد الصافي بين سياخ التسليح السفلي."
  },
  {
    id: "slab",
    nameAr: "بلاطة سقف (Slab)",
    nameFr: "Dalle de Plancher",
    nameEn: "Floor Slab",
    category: "horizontal",
    recommendedSlump: { min: 8, max: 12, target: 10 },
    recommendedDmax: 20,
    minCementKgM3: 320,
    defaultExposureClass: "XC1",
    vibrationRecommendationAr: "استخدام مسطرة اهتزازية سطحية (Poutre vibrante) أو مالمة ميكانيكية لدمك البلاطة وتمليس السطح.",
    descriptionAr: "بلاطة مصمتة أو مفرغة مسطحة تغطي المساحات الأفقية للمبنى.",
    engineeringAdviceAr: "احرص على المعالجة بالماء أو رش مركب معالجة فور تسوية السطح لمنع الانكماش البلاستيكي."
  },
  {
    id: "footing",
    nameAr: "قاعدة خرسانية منفردة/مستمرة (Footing)",
    nameFr: "Semelle d'Fondation",
    nameEn: "Isolated/Strip Footing",
    category: "infrastructure",
    recommendedSlump: { min: 6, max: 10, target: 8 },
    recommendedDmax: 25,
    minCementKgM3: 300,
    defaultExposureClass: "XC2",
    vibrationRecommendationAr: "دك ميكانيكي غاطس بإبرة رجاجة واسعة القطر 50-70 مم.",
    descriptionAr: "قاعدة أساسات موجهة لنقل أحمال الأعمدة للجدار والتربة الحاملة.",
    engineeringAdviceAr: "استخدم Dmax = 25 مم أو 31.5 مم لتقليل الطلب على الماء والإسمنت مع الحفاظ على المقاومة."
  },
  {
    id: "foundation",
    nameAr: "أساسات كتلية / حصيرة (Raft Foundation)",
    nameFr: "Radier Général",
    nameEn: "Raft / Mat Foundation",
    category: "infrastructure",
    recommendedSlump: { min: 8, max: 14, target: 12 },
    recommendedDmax: 25,
    minCementKgM3: 350,
    defaultExposureClass: "XC2",
    vibrationRecommendationAr: "رج ميكانيكي مكثف باستخدام عدة إبر رجاجة على خطوط صب منتظمة.",
    descriptionAr: "حصيرة خرسانية مسلحة واسعة النطاق تتطلب كميات خرسانة ضخمة وسرعة صب متواصلة.",
    engineeringAdviceAr: "ينصح باستخدام إسمنت معتدل الحرارة أو إضافة الرماد المتطاير/الخبث لتقليل الإجهادات الحرارية."
  },
  {
    id: "retaining_wall",
    nameAr: "جدار استنادي (Retaining Wall)",
    nameFr: "Mur de Soutènement",
    nameEn: "Retaining Wall",
    category: "vertical",
    recommendedSlump: { min: 10, max: 14, target: 12 },
    recommendedDmax: 20,
    minCementKgM3: 350,
    defaultExposureClass: "XC4",
    vibrationRecommendationAr: "هز ميكانيكي على طبقات لا تتجاوز 40-50 سم ارتفاع في القالب.",
    descriptionAr: "جدار رأسي مصمم لمقاومة الضغط الجانبي للتربة أو المياه.",
    engineeringAdviceAr: "يجب اختيار فئة تعرض مناسبة للتربة المجاورة (الكبريتات والمياه الجوفية XA1/XA2)."
  },
  {
    id: "shear_wall",
    nameAr: "جدار قص / جدار مصعد (Shear Wall)",
    nameFr: "Voile en Béton Armé",
    nameEn: "Shear Wall / Core Wall",
    category: "vertical",
    recommendedSlump: { min: 12, max: 16, target: 14 },
    recommendedDmax: 16,
    minCementKgM3: 360,
    defaultExposureClass: "XC1",
    vibrationRecommendationAr: "هز ميكانيكي دقيق بإبر رفيعة 25-35 مم لمنع تكتل الحبيبات بين شباك التسليح المزدحمة.",
    descriptionAr: "جدار إنشائي صلب يقاوم القوى الجانبية للرياح والزلازل بالمنشآت العالية.",
    engineeringAdviceAr: "استخدم Dmax <= 16 مم وقواماً عالي السيولة (أو SCC) لملء القوالب الضيقة."
  },
  {
    id: "stair",
    nameAr: "درج / سلم خرساني (Staircase)",
    nameFr: "Escalier en Béton",
    nameEn: "Concrete Staircase",
    category: "vertical",
    recommendedSlump: { min: 6, max: 10, target: 8 },
    recommendedDmax: 20,
    minCementKgM3: 330,
    defaultExposureClass: "XC1",
    vibrationRecommendationAr: "دك خفيف بالرجاج الإبرة لمنع انزلاق الخرسانة الطازجة من الدرجات المائلة.",
    descriptionAr: "عنصر مائل مكون من درجات ودرجات استراحة يتأثر بحركات الصب المائلة.",
    engineeringAdviceAr: "تجنب القوام السيال جداً (Slump > 10 cm) لعدم فيضان الخرسانة من القوالب المفتوحة."
  },
  {
    id: "pavement",
    nameAr: "رصف خرساني صناعي (Industrial Pavement)",
    nameFr: "Dallage Industriel",
    nameEn: "Concrete Pavement",
    category: "horizontal",
    recommendedSlump: { min: 4, max: 8, target: 6 },
    recommendedDmax: 25,
    minCementKgM3: 320,
    defaultExposureClass: "XF1",
    vibrationRecommendationAr: "دمك بمسطرة اهتزازية أو آلة رصف بلاطات صناعية.",
    descriptionAr: "أرضيات مصانع ومستودعات ومعارض معرضة لأحمال الرافعة الشوكية والتآكل الاحتكاكي.",
    engineeringAdviceAr: "ينصح بدمج الألياف الفولاذية أو البولي بروبيلين لمقاومة التبرقش والتآكل السطحي."
  },
  {
    id: "sidewalk",
    nameAr: "رصيف مشاة (Sidewalk)",
    nameFr: "Trottoir / Chaussée Piétonne",
    nameEn: "Pedestrian Sidewalk",
    category: "horizontal",
    recommendedSlump: { min: 6, max: 10, target: 8 },
    recommendedDmax: 20,
    minCementKgM3: 280,
    defaultExposureClass: "XF1",
    vibrationRecommendationAr: "دمك يدوي بالدكاكة أو مسطرة التمليس.",
    descriptionAr: "ممرات المشاة والأرصفة الخارجية العادية.",
    engineeringAdviceAr: "استخدم خرسانة عادية اقتصادية مع توفير فاصل تمدد كل 3-6 أمتار."
  },
  {
    id: "road",
    nameAr: "طريق خرساني سريعة (Concrete Highway Road)",
    nameFr: "Route en Béton",
    nameEn: "Concrete Highway Road",
    category: "infrastructure",
    recommendedSlump: { min: 2, max: 6, target: 4 },
    recommendedDmax: 25,
    minCementKgM3: 350,
    defaultExposureClass: "XF2",
    vibrationRecommendationAr: "رص بدماكات آليات رصف الطرق الميكانيكية (Slipform Paver).",
    descriptionAr: "طرق السيارات والشاحنات ذات الحركة المرورية الشديدة والعوامل الجوية المتغيرة.",
    engineeringAdviceAr: "يتطلب قواماً جافاً جداً (Slump 2-5 سم) لإنهاء الرصف بفرادة الطرق الآلية."
  },
  {
    id: "bridge",
    nameAr: "جسر / كوبري إنشائي (Bridge Element)",
    nameFr: "Ouvrage d'Art / Pont",
    nameEn: "Bridge Deck & Pier",
    category: "infrastructure",
    recommendedSlump: { min: 10, max: 16, target: 12 },
    recommendedDmax: 20,
    minCementKgM3: 380,
    defaultExposureClass: "XD3",
    vibrationRecommendationAr: "هز ميكانيكي عالي الدقة موزع هندسياً على كامل جسد الجسر.",
    descriptionAr: "ركائز وبلاطات جسور الطرق والسكك الحديدية المعرضة للاهتزازات الدورية والبيئة الخارجية.",
    engineeringAdviceAr: "استخدم خرسانة عالية الأداء (HPC) أو مسبقة الإجهاد بنسبة W/C <= 0.40 للتحمل الممتد."
  },
  {
    id: "tunnel",
    nameAr: "تبطين أنفاق (Tunnel Lining)",
    nameFr: "Revêtement de Tunnel",
    nameEn: "Tunnel Lining",
    category: "infrastructure",
    recommendedSlump: { min: 12, max: 18, target: 15 },
    recommendedDmax: 16,
    minCementKgM3: 360,
    defaultExposureClass: "XA2",
    vibrationRecommendationAr: "قذف بالرش الهوائي المضغوط (Shotcrete) أو صب بقمائن الأنفاق الهيدروليكية.",
    descriptionAr: "تبطين جدران وقيعان الأنفاق الجبلية وتحت الأرضية.",
    engineeringAdviceAr: "استخدم خرسانة مقذوفة (Shotcrete) مزودة بمسرع شك فوري وألياف تعزيز."
  },
  {
    id: "dam",
    nameAr: "سد خرساني كتلي (Concrete Dam)",
    nameFr: "Barrage en Béton",
    nameEn: "Concrete Dam Wall",
    category: "hydraulic",
    recommendedSlump: { min: 0, max: 4, target: 2 },
    recommendedDmax: 40,
    minCementKgM3: 220,
    defaultExposureClass: "XA1",
    vibrationRecommendationAr: "دمك بمداحل اهتزازية ثقيلة (Roller Compacted Concrete).",
    descriptionAr: "كتلة خرسانية ضخمة لحجز مياه الأنهار والوديان.",
    engineeringAdviceAr: "استخدم الخرسانة المدحولة (RCC) بحجم ركام كبير Dmax = 40 مم لتجنب الانبعاث الحراري."
  },
  {
    id: "culvert",
    nameAr: "عبارة صندوقية / ممر مائي (Box Culvert)",
    nameFr: "Prtal / Cadre Béton",
    nameEn: "Box Culvert",
    category: "hydraulic",
    recommendedSlump: { min: 8, max: 12, target: 10 },
    recommendedDmax: 20,
    minCementKgM3: 350,
    defaultExposureClass: "XA1",
    vibrationRecommendationAr: "هز إبرة ميكانيكي قياسي.",
    descriptionAr: "منشأ صندوقي لمرار مياه الأمطار أو الأودية تحت الطرق والسكك.",
    engineeringAdviceAr: "اختر إسمنت مقاوم للكبريتات (CEM II/S أو CEM III) لمقاومة نحر مياه السيول."
  },
  {
    id: "pipe",
    nameAr: "أنبوب خرساني دائري (Concrete Pipe)",
    nameFr: "Tuyau en Béton",
    nameEn: "Concrete Pipe",
    category: "precast",
    recommendedSlump: { min: 2, max: 6, target: 4 },
    recommendedDmax: 16,
    minCementKgM3: 350,
    defaultExposureClass: "XA2",
    vibrationRecommendationAr: "دمك بالدوران المحوري والاهتزاز القالبي (Radial Pressing / Spinning).",
    descriptionAr: "أنابيب نقل مياه الصرف الصحي والمياه الصناعية والري.",
    engineeringAdviceAr: "تطلب قواماً شديد الجفاف للكبس والنزع الفوري للقوالب بمصانع المسبقات."
  },
  {
    id: "reservoir",
    nameAr: "خزان مياه أرضي (Underground Water Reservoir)",
    nameFr: "Réservoir d'Eau Enterré",
    nameEn: "Underground Water Tank",
    category: "hydraulic",
    recommendedSlump: { min: 10, max: 14, target: 12 },
    recommendedDmax: 20,
    minCementKgM3: 360,
    defaultExposureClass: "XS1",
    vibrationRecommendationAr: "رج ميكانيكي دقيق لعدم ترك أي جيوب هوائية تسمح بتسرب المياه.",
    descriptionAr: "منشأ مائي معزول لمنع تسرب المياه الداخلية أو المياه الجوفية الخارجية.",
    engineeringAdviceAr: "يجب اختيار نسبة W/C <= 0.45 واستخدام إضافات بلورية مانعة للكتامة والنفاذية."
  },
  {
    id: "water_tank",
    nameAr: "خزان مياه علوي (Elevated Water Tank)",
    nameFr: "Château d'Eau",
    nameEn: "Elevated Water Tower",
    category: "hydraulic",
    recommendedSlump: { min: 10, max: 14, target: 12 },
    recommendedDmax: 20,
    minCementKgM3: 380,
    defaultExposureClass: "XC4",
    vibrationRecommendationAr: "رج ميكانيكي مكثف في القوالب الدائرية والأعمدة الحاملة.",
    descriptionAr: "خزان مرتفع على عمود أو هيكل إنشائي لحفظ ضغط المياه.",
    engineeringAdviceAr: "استخدم خرسانة عازلة عالية المقاومة مع إضافة ملدن فائق ومادة الكتامة."
  },
  {
    id: "precast",
    nameAr: "عنصر خرساني مسبق الصنع (Precast Element)",
    nameFr: "Élément Préfabriqué",
    nameEn: "Precast Concrete Member",
    category: "precast",
    recommendedSlump: { min: 8, max: 14, target: 10 },
    recommendedDmax: 20,
    minCementKgM3: 380,
    defaultExposureClass: "XC1",
    vibrationRecommendationAr: "اهتزاز طاولة الصب المصنعية (Table vibrante) أو هز ميكانيكي مكثف.",
    descriptionAr: "عناصر مصنعة بالكامل داخل المصنع ثم تنقل وتثبت في الموقع.",
    engineeringAdviceAr: "استخدم إسمنت CEM I 52.5N لضمان سرعة اكتساب المقاومة المبكرة وفك القوالب."
  },
  {
    id: "block",
    nameAr: "بلوك خرساني مسمط (Solid Concrete Block)",
    nameFr: "Bloc Béton Plein",
    nameEn: "Solid Masonry Block",
    category: "masonry",
    recommendedSlump: { min: 2, max: 5, target: 3 },
    recommendedDmax: 12.5,
    minCementKgM3: 250,
    defaultExposureClass: "X0",
    vibrationRecommendationAr: "كبس واهتزاز بآلة مكبس البلوك المصنعية (Pondeuse à bloc).",
    descriptionAr: "وحدات بناء مسمطة للجدران الحاملة والقواطع.",
    engineeringAdviceAr: "تتطلب قواماً ترابياً جافاً للكبس الميكانيكي والنقل السريع."
  },
  {
    id: "hollow_block",
    nameAr: "بلوك مفرغ / هردي (Hollow Concrete Block)",
    nameFr: "Bloc Béton Creux",
    nameEn: "Hollow Masonry Block",
    category: "masonry",
    recommendedSlump: { min: 2, max: 5, target: 3 },
    recommendedDmax: 10,
    minCementKgM3: 250,
    defaultExposureClass: "X0",
    vibrationRecommendationAr: "كبس اهتزازي هيدروليكي بمصانع البلوك.",
    descriptionAr: "وحدات بلك مفرغ للجدران الخفيفة وبلاطات الهردي.",
    engineeringAdviceAr: "استخدم ركام Dmax <= 10 مم لضمان ملاءمة جدران البلوك الرقيقة."
  },
  {
    id: "masonry",
    nameAr: "مونة بناء ومحارة (Masonry / Plaster Mortar)",
    nameFr: "Mortier de Maçonnerie / Enduit",
    nameEn: "Masonry Mortar / Render",
    category: "masonry",
    recommendedSlump: { min: 10, max: 14, target: 12 },
    recommendedDmax: 5,
    minCementKgM3: 300,
    defaultExposureClass: "X0",
    vibrationRecommendationAr: "تطبيق بفرش البناء والمسطرين اليدوي.",
    descriptionAr: "مونة رباط ومحارة للحيطان المعتادة.",
    engineeringAdviceAr: "تستخدم رمل ناعم وحصى دقيق دونه حصى خشن (Dmax <= 5 مم)."
  },
  {
    id: "custom",
    nameAr: "عنصر مخصص آخر (Custom Structural Element)",
    nameFr: "Autre Élément Personnalisé",
    nameEn: "Custom Structural Element",
    category: "custom",
    recommendedSlump: { min: 8, max: 14, target: 10 },
    recommendedDmax: 20,
    minCementKgM3: 300,
    defaultExposureClass: "XC1",
    vibrationRecommendationAr: "دمك ميكانيكي يتطابق مع سمك وكثافة العنصر الخاص.",
    descriptionAr: "أي عنصر إنشائي مخصص يحدده مهندس الخلطات الإنشائية.",
    engineeringAdviceAr: "قم بتعديل قيم الهبوط وDmax والمقاومة يدوياً طبقاً لمواصفات المشروع الخاصة."
  }
];

export function getStructuralElementById(id: string): StructuralElementConfig {
  return STRUCTURAL_ELEMENTS.find(el => el.id === id) || STRUCTURAL_ELEMENTS[STRUCTURAL_ELEMENTS.length - 1];
}
