export interface ExpandedMaterial {
  id: string;
  name: string;
  englishName: string;
  group: "المواد الأساسية" | "الخلطات الكيميائية" | "الشوائب المعدنية" | "الألياف" | "الركام الخاص" | "المواد المتقدمة";
  category: string;
  desc: string;
  uses: string;
  compatibleTypes: string[];
  catalogOnly?: boolean;
  calculationInfluence?: "none" | "high" | "low" | "medium";
  density?: number;
  cementDensity?: number;
  strengthClass?: number | string;
  pH?: number;
  chlorides?: number;
  sulphates?: number;
  absorption?: number;
  FM?: number;
  dMax?: number;
  dosage?: number;
  waterReduction?: number;
  airPercentage?: number;
  replacementPercent?: number;
  price?: number;
  particleShape?: string;
  losAngeles?: number;
  heavyweightType?: string;
  specialBinderReplacementPercent?: number;
  alkalineRatio?: number;
  specialBinderStrengthClass?: string;
  fiberType?: string;
  fiberDosageKgM3?: number;
  fiberDensity?: number;
  fiberLengthMm?: number;
  fiberDiameterMm?: number;
  fiberTensileStrengthMPa?: number;
}

export const DEFAULT_EXPANDED_MATERIALS: ExpandedMaterial[] = [
  // --- 1. المواد الأساسية (Base Materials) ---
  {
    id: "exp-opc",
    name: "الأسمنت البورتلاندي العادي (OPC - CEM I)",
    englishName: "Ordinary Portland Cement (OPC - CEM I)",
    group: "المواد الأساسية",
    category: "الأسمنت",
    desc: "مادة رابطة هيدروليكية تتفاعل مع الماء لتكوين مركبات غروية لاصقة. يعتبر النوع العادي (OPC) الخيار الأفضل للبناء العام والمنشآت التقليدية.",
    uses: "يربط حبيبات الرمل والحصى لتكوين كتلة متجانسة، ويحدد المقاومة النهائية للضغط، ويتحكم في سرعة التصلب تحت الظروف القياسية.",
    compatibleTypes: ["NSC", "SCC", "FRC", "LWC", "RCC", "SHOTCRETE", "SHC", "RAC", "PERVIOUS"],
    density: 3150,
    cementDensity: 3150,
    strengthClass: 42.5,
    price: 15.0
  },
  {
    id: "exp-src",
    name: "الأسمنت المقاوم للكبريتات (SRPC)",
    englishName: "Sulfate Resistant Portland Cement (SRPC)",
    group: "المواد الأساسية",
    category: "الأسمنت",
    desc: "أسمنت بورتلاندي ذو محتوى منخفض جداً من ألومينات ثلاثي الكالسيوم (C3A) لمنع التفاعل الكيميائي المدمر مع كبريتات التربة والمياه.",
    uses: "يُستخدم كعامل رابط رئيسي في الأساسات، القواعد الخرسانية الأرضية، المنشآت المحاذية للمياه المالحة لمنع تفتت الهيكل بفعل الكبريتات.",
    compatibleTypes: ["HPC", "HWC", "NSC", "RAC"],
    density: 3180,
    cementDensity: 3180,
    strengthClass: 42.5,
    price: 17.0
  },
  {
    id: "exp-rapid",
    name: "الأسمنت سريع التصلب (Rapid Hardening)",
    englishName: "Rapid Hardening Cement",
    group: "المواد الأساسية",
    category: "الأسمنت",
    desc: "أسمنت مطحون بنعومة مفرطة لزيادة مساحة السطح النوعي وتفعيل الإماهة المبكرة لتأمين قوة سريعة في زمن وجيز.",
    uses: "يُستخدم في أعمال الطوارئ، الصب في الطقس البارد، عمليات فك القوالب السريعة، وأعمال ترميم وإصلاح الطرق لتقصير زمن التعطيل.",
    compatibleTypes: ["SHOTCRETE", "NSC", "UHPC", "BFUP"],
    density: 3120,
    cementDensity: 3120,
    strengthClass: 52.5,
    price: 18.0
  },
  {
    id: "exp-lowheat",
    name: "الأسمنت منخفض الحرارة (Low Heat)",
    englishName: "Low Heat Portland Cement",
    group: "المواد الأساسية",
    category: "الأسمنت",
    desc: "أسمنت بورتلاندي يتميز بمعدل إماهة وتوليد حراري بطيء للغاية أثناء التفاعل مع الماء لتجنب التدرجات الحرارية الكبيرة.",
    uses: "يُستخدم لصب الكتل الخرسانية الضخمة كالسدود والقواعد العملاقة لمنع حدوث التشققات الناتجة عن الإجهادات الحرارية للكتلة.",
    compatibleTypes: ["RCC", "NSC"],
    density: 3200,
    cementDensity: 3200,
    strengthClass: 32.5,
    price: 16.5
  },
  {
    id: "exp-white",
    name: "الأسمنت الأبيض (White Cement)",
    englishName: "White Portland Cement",
    group: "المواد الأساسية",
    category: "الأسمنت",
    desc: "أسمنت بورتلاندي يُصنع بمواد أولية خالية من الحديد والمغنيسيوم لتأمين لون ناصع البياض دون المساس بالخصائص الهيدروليكية.",
    uses: "يُستخدم لأعمال التشطيبات والديكورات المعمارية، وتصنيع الجص الملون، والخرسانة الظاهرة الجميلة كعنصر جمالي وبنائي متكامل.",
    compatibleTypes: ["NSC", "LWC"],
    density: 3050,
    cementDensity: 3050,
    strengthClass: 32.5,
    price: 25.0
  },
  {
    id: "exp-hscem",
    name: "الأسمنت عالي المقاومة (High Strength)",
    englishName: "High Strength Cement",
    group: "المواد الأساسية",
    category: "الأسمنت",
    desc: "أسمنت فائق النقاوة والنعومة مصمم خصيصاً لتحقيق إجهادات ميكانيكية استثنائية تفوق 52.5 ميغاباسكال في فترات قياسية.",
    uses: "يُستخدم في صب الأعمدة الشاهقة للأبراج، الجسور المعلقة، المنشآت ذات الأحمال الهندسية العالية جداً كعنصر تماسك فائق الكثافة.",
    compatibleTypes: ["HSC", "HPC", "SCC", "UHPC", "BFUP"],
    density: 3160,
    cementDensity: 3160,
    strengthClass: 52.5,
    price: 20.0
  },
  {
    id: "exp-potable",
    name: "ماء صالح للشرب (Potable Water)",
    englishName: "Potable Water",
    group: "المواد الأساسية",
    category: "الماء",
    desc: "الوسط الرئيسي للتفاعل الكيميائي للإسمنت (Hydration). ماء نقي وخالٍ تماماً من الكلوريدات الضارة، الشوائب العضوية، والأملاح لتجنب الصدأ وتدهور العجينة.",
    uses: "أفضل خيار لخلط الخرسانة وضمان تحقيق أفضل قابلية تشغيل (Workability) والتحكم في تفاعل الإسمنت، حيث تؤدي جودته لضمان قوة الترابط المطلوبة.",
    compatibleTypes: ["NSC", "HSC", "HPC", "SCC", "FRC", "LWC", "HWC", "RCC", "SHOTCRETE", "GPC", "SHC", "RAC", "PERVIOUS", "UHPC", "BFUP"],
    pH: 7.0,
    chlorides: 150,
    sulphates: 200,
    price: 2.0
  },
  {
    id: "exp-treated",
    name: "مياه معالجة ومستصلحة (Treated Water)",
    englishName: "Treated Recycled Water",
    group: "المواد الأساسية",
    category: "الماء",
    desc: "مياه صرف معالجة كيميائياً وصناعياً تم فحصها مخبرياً للتأكد من خلوها من الملوثات المؤثرة سلباً على تبلور الإسمنت.",
    uses: "تُستخدم كبديل بيئي مستدام لمياه الشرب في مشاريع الطرق والتطبيقات غير الإنشائية الصديقة للبيئة بهدف تحسين الاستدامة.",
    compatibleTypes: ["NSC", "HSC", "HPC", "SCC", "FRC", "LWC", "HWC", "RCC", "SHOTCRETE", "SHC", "RAC", "PERVIOUS"],
    pH: 7.4,
    chlorides: 350,
    sulphates: 450,
    price: 1.0
  },
  {
    id: "exp-seawater",
    name: "مياه البحر (Sea Water)",
    englishName: "Sea Water",
    group: "المواد الأساسية",
    category: "الماء",
    desc: "مياه مالحة مشبعة بأملاح الكلور والكلوريدات. لا تستخدم إلا في شروط خرسانية صارمة جداً وبمضافات خاصة.",
    uses: "يقتصر استخدامها بشكل استثنائي في الخرسانة العادية (غير المسلحة) مع إضافات مقاومة للكلور، ويُمنع منعاً باتاً في الخرسانة المسلحة لمنع صدأ الحديد.",
    compatibleTypes: ["NSC"],
    pH: 8.2,
    chlorides: 19000,
    sulphates: 2700,
    price: 0.5
  },
  {
    id: "exp-natsand",
    name: "الرمل الطبيعي (نهري/بحري)",
    englishName: "Natural Sand",
    group: "المواد الأساسية",
    category: "الركام الناعم",
    desc: "جزيئات سيليسيّة ناعمة مستخلصة من الوديان أو الشواطئ تتميز بحواف مستديرة تحسن من قوام المونة وتدفقها.",
    uses: "تملأ الفراغات البينية الصغيرة بين جزيئات الحصى لزيادة كثافة الخرسانة وتأمين تماسك رائع للخلطة الخرسانية والحد من ظهور المسامات السطحية.",
    compatibleTypes: ["NSC", "SCC", "FRC", "LWC", "RCC", "SHOTCRETE", "SHC", "RAC"],
    density: 2650,
    absorption: 1.2,
    FM: 2.6,
    price: 8.0
  },
  {
    id: "exp-mansand",
    name: "الرمل الصناعي (المكسر)",
    englishName: "Manufactured Sand",
    group: "المواد الأساسية",
    category: "الركام الناعم",
    desc: "رمل مصنع ينتج من سحق الأحجار الصلبة كالبازلت أو الحجر الجيري، ويتميز بزوايا حادة وملمس خشن يزيد التماسك الحبيبي ميكانيكياً.",
    uses: "تقليل الفراغات، تحسين متانة خرسانة الأحمال العالية بفضل الترابط الفيزيائي الفائق لحبيباته الزاوية القوية، وتحقيق نسب خلط اقتصادية.",
    compatibleTypes: ["HSC", "HPC", "SCC", "FRC", "UHPC", "BFUP", "GPC"],
    density: 2700,
    absorption: 1.8,
    FM: 3.1,
    price: 11.0
  },
  {
    id: "exp-gravel",
    name: "الحصى الطبيعي (Natural Gravel)",
    englishName: "Natural Gravel",
    group: "المواد الأساسية",
    category: "الركام الخشن",
    desc: "حصى كبير ومغسول يشكل الهيكل العظمي والحجمي الأساسي للخرسانة, مما يقلل من حجم العجينة الأسمنتية المطلوبة ويمنع الانكماش.",
    uses: "يعطي الخرسانة قوتها الأساسية ويقلل التكلفة وحرارة الإماهة، كما يحسن بشكل ممتاز مقاومة الضغط والانحناء في المنشآت العادية.",
    compatibleTypes: ["NSC", "SCC", "FRC", "LWC", "SHC", "RAC"],
    density: 2680,
    absorption: 0.8,
    dMax: 20,
    particleShape: "rounded",
    losAngeles: 22,
    price: 12.0
  },
  {
    id: "exp-crushed",
    name: "الحجر المكسر (Crushed Stone)",
    englishName: "Crushed Stone",
    group: "المواد الأساسية",
    category: "الركام الخشن",
    desc: "صخور طبيعية مسحوقة ميكانيكياً لتمتلك أسطحاً خشنة وحواف مدببة تضمن تداخلاً هندسياً مميزاً داخل عجينة الأسمنت.",
    uses: "توفير مقاومة عالية ضد الضغط والقص والبري، مما يجعله مثالياً للبلاطات المعرضة للأحمال وهياكل المباني الإنشائية.",
    compatibleTypes: ["NSC", "HSC", "HPC", "SCC", "FRC", "RCC", "SHC", "RAC", "PERVIOUS"],
    density: 2720,
    absorption: 1.5,
    dMax: 20,
    particleShape: "crushed",
    losAngeles: 18,
    price: 14.0
  },
  {
    id: "exp-granite",
    name: "الجرانيت (Crushed Granite)",
    englishName: "Crushed Granite",
    group: "المواد الأساسية",
    category: "الركام الخشن",
    desc: "حصى خشن مستخلص من صخور الجرانيت النارية الصلبة ذات المقاومة العالية للبري والصدمات والتحميل الميكانيكي المستمر.",
    uses: "يشكل المادة المصلبة في الخرسانة عالية القوة لزيادة مقاومة العناصر الإنشائية الحاملة للضغط والتوتر كالأعمدة الطويلة والجسور.",
    compatibleTypes: ["HSC", "HPC", "UHPC", "BFUP"],
    density: 2800,
    absorption: 0.5,
    dMax: 15,
    particleShape: "crushed",
    losAngeles: 12,
    price: 20.0
  },
  {
    id: "exp-basalt",
    name: "البازلت (Crushed Basalt)",
    englishName: "Crushed Basalt",
    group: "المواد الأساسية",
    category: "الركام الخشن",
    desc: "صخر بركاني مكسر داكن اللون شديد الكثافة والصلابة والقدرة على تحمل التآكل الكيميائي والبري الميكانيكي العنيف.",
    uses: "يُستخدم كركام فائق في مشاريع الطرق السريعة والمطارات، والخرسانة عالية القوة كونه يحسن مقاومة الضغط لدرجات متقدمة.",
    compatibleTypes: ["HSC", "HPC", "UHPC", "BFUP"],
    density: 2900,
    absorption: 0.7,
    dMax: 15,
    particleShape: "crushed",
    losAngeles: 14,
    price: 22.0
  },
  {
    id: "exp-river",
    name: "حصى الأنهار (River Aggregates)",
    englishName: "River Gravel",
    group: "المواد الأساسية",
    category: "الركام الخشن",
    desc: "حصى ناعم مستدير طبيعياً بفعل تدفق مياه الأنهار، يتميز بنظافته الفائقة وخلوه من الطمي والمواد العضوية.",
    uses: "يعطي الهيكل الأساسي للخرسانة قوة ممتازة مع تسهيل انزلاق وتدفق الخرسانة داخل القوالب والتقليل من مقاومة الضخ بالمضخات الكبيرة.",
    compatibleTypes: ["NSC", "SCC", "PERVIOUS"],
    density: 2650,
    absorption: 0.9,
    dMax: 25,
    particleShape: "rounded",
    losAngeles: 25,
    price: 9.0
  },

  // --- 2. الملدنات والإضافات الكيميائية (Chemical Admixtures) ---
  {
    id: "exp-plasticizer",
    name: "الملدّنات العادية (Plasticizers)",
    englishName: "Plasticizers / Water Reducers",
    group: "الخلطات الكيميائية",
    category: "الملدنات",
    desc: "مواد كيميائية تضاف للخرسانة لتقليل قوى الاحتكاك والتوتر السطحي بين جزيئات الإسمنت مما يزيد سيولتها وتشغيلها بشكل آمن.",
    uses: "تُستخدم لتقليل ماء الخلط بنسبة 5% إلى 15% مع المحافظة على نفس درجة التشغيلية (Workability)، مما يزيد مقاومة الضغط ويحسن الجودة النهائية.",
    compatibleTypes: ["NSC", "LWC", "RAC"],
    density: 1200,
    dosage: 1.0,
    waterReduction: 10,
    price: 45.0
  },
  {
    id: "exp-superplast",
    name: "الملدّنات الفائقة (Superplasticizers)",
    englishName: "Superplasticizers",
    group: "الخلطات الكيميائية",
    category: "الملدنات الفائقة",
    desc: "مضاف كيميائي قوي جداً يعمل على تشتيت جزيئات الأسمنت كهربائياً مما يجعل الخرسانة ذات تدفق عالٍ وسيولة تشبه الماء دون انفصال حبيبي.",
    uses: "لا غنى عنه في الخرسانة عالية المقاومة والخرسانة ذاتية الدمك (SCC). يقلل المياه بنسبة تصل لـ 30-40% مما يرفع المقاومة ويحسن الرص بدون هزاز ميكانيكي.",
    compatibleTypes: ["HSC", "HPC", "SCC", "FRC", "UHPC", "BFUP", "SHC", "HWC"],
    density: 1220,
    dosage: 2.0,
    waterReduction: 25,
    price: 75.0
  },
  {
    id: "exp-accelerator",
    name: "المسرّعات الكيميائية (Accelerators)",
    englishName: "Accelerating Admixtures",
    group: "الخلطات الكيميائية",
    category: "المسرعات",
    desc: "إضافات كيميائية تسرع تفاعل الإسمنت وتقلل من زمن الشك الابتدائي والنهائي لتسريع الانتقال للحالة الصلبة.",
    uses: "تُستعمل لتسريع زمن التصلب والشك في إصلاحات الطوارئ السريعة والصب في الطقس البارد لمنع تجمد المياه وضمان زيادة المقاومة المبكرة.",
    compatibleTypes: ["SHOTCRETE", "NSC"],
    density: 1250,
    dosage: 1.5,
    price: 55.0
  },
  {
    id: "exp-retarder",
    name: "المبطّئات الكيميائية (Retarders)",
    englishName: "Retarding Admixtures",
    group: "الخلطات الكيميائية",
    category: "المبطيئات",
    desc: "إضافات تؤخر بداية تبلور الإسمنت وتؤجل زمن الشك لزيادة مدة بقاء الخرسانة في الحالة اللدنة سهلة التشكيل.",
    uses: "تمنع التصلب السريع للخرسانة وتسهل التشغيل والصب في الأجواء الحارة جداً، كما تسمح بنقل الخرسانة الجاهزة لمسافات طويلة دون تيبس.",
    compatibleTypes: ["RCC", "NSC", "LWC"],
    density: 1180,
    dosage: 0.8,
    price: 50.0
  },
  {
    id: "exp-waterproof",
    name: "إضافات مانعة للماء (Waterproofing admixtures)",
    englishName: "Waterproofing Admixtures",
    group: "الخلطات الكيميائية",
    category: "مانعات الماء",
    desc: "إضافات سادة للمسام ومقاومة للرطوبة تقلل من نفاذية المياه داخل البنية الخرسانية المتصلدة.",
    uses: "تُستخدم في خزانات المياه والمنشآت المائية، الأنفاق، والأساسات العميقة لمنع تسرب المياه وتقليل تشققات الرطوبة.",
    compatibleTypes: ["HPC", "SHC", "NSC"],
    catalogOnly: true,
    calculationInfluence: "none"
  },
  {
    id: "exp-airentrain",
    name: "مواد إدخال الهواء (Air-entraining agents)",
    englishName: "Air-Entraining Admixtures",
    group: "الخلطات الكيميائية",
    category: "حوابس الهواء",
    desc: "مركبات كيميائية تولد ملايين الفقاعات الهوائية المجهرية الثابتة بداخل الخرسانة لتكون وسائد لامتصاص التمدد الإستاتيكي.",
    uses: "تُستخدم لحماية الخرسانة في الأرصفة والطرق بالمناطق الباردة من خطر التجمد والذوبان (Freeze-Thaw) وتحسن تشغيل الخرسانة بشكل ملحوظ.",
    compatibleTypes: ["LWC", "NSC"],
    density: 1100,
    dosage: 0.1,
    airPercentage: 4.5,
    price: 65.0
  },

  // --- 3. الشوائب والإضافات المعدنية (Mineral Additions) ---
  {
    id: "exp-flyash",
    name: "الرماد المتطاير (Fly Ash)",
    englishName: "Fly Ash",
    group: "الشوائب المعدنية",
    category: "الرماد المتطاير",
    desc: "بقايا رماد ناعم ناتج عن حرق الفحم الحجري في محطات الطاقة الكهربائية. يتفاعل كيميائياً كبوزولان غني بالسيليكا مع نواتج إماهة الإسمنت.",
    uses: "يُستخدم كبديل جزئي للإسمنت لرفع متانة الخرسانة بعيدة المدى، تقليل حرارة الإماهة الإجمالية، تحسين التشغيلية ومقاومة المياه الجوفية.",
    compatibleTypes: ["HPC", "SCC", "RCC", "GPC", "RAC"],
    density: 2200,
    replacementPercent: 20,
    price: 25.0
  },
  {
    id: "exp-ggbs",
    name: "خبث الأفران العالي (GGBS)",
    englishName: "Ground Granulated Blast-furnace Slag",
    group: "الشوائب المعدنية",
    category: "خبث الأفران",
    desc: "ناتج ثانوي زجاجي مطحون ناعماً من صناعة الحديد والصلب يتصلب كيميائياً ببطء مع نواتج جير الإسمنت ليعطي خرسانة فاتحة اللون.",
    uses: "استبدال جزئي للإسمنت للحد من نفاذية الأملاح، تعزيز مقاومة الكبريتات والكلوريدات في البيئات البحرية، وتخفيض البصمة الكربونية للخلطة.",
    compatibleTypes: ["HPC", "SCC", "RCC", "GPC", "RAC"],
    density: 2900,
    replacementPercent: 35,
    price: 30.0
  },
  {
    id: "exp-silicafume",
    name: "السيليكا فيوم (Silica Fume)",
    englishName: "Silica Fume",
    group: "الشوائب المعدنية",
    category: "السيليكا فيوم",
    desc: "مسحوق غير متبلور ناعم للغاية (بمقياس دون الميكرون) ناتج عن صناعة السيليكون. يتمتع بفعالية بوزولانية فائقة تزيد كثافة الترابط بشكل حاسم.",
    uses: "عنصر لا بد منه في الخرسانة عالية وفائقة المقاومة (HPC, UHPC)، حيث ترفع المقاومة الميكانيكية بشكل كبير جداً وتسد أدق الفراغات المجهرية.",
    compatibleTypes: ["HSC", "HPC", "UHPC", "BFUP", "SHOTCRETE", "HWC"],
    density: 2200,
    replacementPercent: 8,
    price: 90.0
  },
  {
    id: "exp-metakaolin",
    name: "الميتاكاؤلين (Metakaolin)",
    englishName: "Metakaolin",
    group: "الشوائب المعدنية",
    category: "الميتاكاولين",
    desc: "طين كاولين محروق تحت درجات حرارة متحكم بها ليصبح ذا نشاط بوزولاني فائق الجودة والسرعة بالمقارنة بالبوزولانات الأخرى.",
    uses: "يُستخدم في إنتاج خرسانة متينة وجميلة وذات نفاذية متدنية للغاية، ويساعد في تسريع تفاعل التصلب وزيادة المقاومة الميكانيكية ومقاومة الصدمات.",
    compatibleTypes: ["HPC", "UHPC", "GPC"],
    density: 2500,
    replacementPercent: 10,
    price: 45.0
  },
  {
    id: "exp-limestone",
    name: "الحجر الجيري الناعم (Limestone powder)",
    englishName: "Limestone Powder",
    group: "الشوائب المعدنية",
    category: "بودرة الحجر الجيري",
    desc: "مسحوق كربونات الكالسيوم المطحون بدقة متناهية، يعمل كمالئ فيزيائي دقيق ومحسن لقوام الملاط الإسمنتي.",
    uses: "تحسين قابلية التشغيل والتدفق في الخرسانات ذاتية الدمك والخلطات الاقتصادية، وتقليل كلفة المواد النواعم مع الحفاظ على القوام متماسكاً.",
    compatibleTypes: ["SCC", "NSC"],
    density: 2700,
    replacementPercent: 12,
    price: 15.0
  },

  // --- 4. الألياف (Fibers) ---
  {
    id: "exp-steelfiber",
    name: "الألياف الفولاذية (Steel fibers)",
    englishName: "Steel Fibers",
    group: "الألياف",
    category: "ألياف الصلب",
    desc: "أسلاك فولاذية كربونية قصيرة ومموجة تخلط مع الخرسانة لتشكيل شبكة تسليح ثلاثية الأبعاد قادرة على تحمل إجهادات الشد والانحناء الكبيرة.",
    uses: "تُستخدم لتأمين مقاومة ممتازة للتشقق، وزيادة تحمل الشد والصدمات بالأرضيات الصناعية للمصانع وفي الأنفاق والخرسانة المقذوفة.",
    compatibleTypes: ["FRC", "UHPC", "BFUP", "SHOTCRETE"],
    fiberType: "steel",
    fiberDosageKgM3: 45,
    fiberDensity: 7850,
    fiberLengthMm: 35,
    fiberDiameterMm: 0.55,
    fiberTensileStrengthMPa: 1100,
    price: 180.0
  },
  {
    id: "exp-glassfiber",
    name: "الألياف الزجاجية (Glass fibers)",
    englishName: "Alkali-Resistant Glass Fibers",
    group: "الألياف",
    category: "الألياف الزجاجية",
    desc: "ألياف زجاجية مقاومة للوسط القلوي للأسمنت تخلط لرفع مرونة الصفائح الخرسانية الرقيقة والقطع التجميلية الخفيفة.",
    uses: "الاستخدام الأساسي في الواجهات الخارجية الرقيقة والخرسانة الديكورية (GRC) لمنع الشروخ السطحية والشعرية بفعل تقلبات الطقس والرياح.",
    compatibleTypes: ["FRC", "UHPC", "LWC"],
    fiberType: "synthetic",
    fiberDosageKgM3: 15,
    fiberDensity: 2600,
    fiberLengthMm: 12,
    fiberDiameterMm: 0.014,
    fiberTensileStrengthMPa: 1700,
    price: 150.0
  },
  {
    id: "exp-polyfiber",
    name: "الألياف البوليمرية (PP fibers)",
    englishName: "Polypropylene Fibers",
    group: "الألياف",
    category: "الألياف البوليمرية",
    desc: "شعيرات خفيفة من مادة البولي بروبيلين تتميز بمقاومتها الشديدة للانكماش اللدن وحبس التبخر المائي المفاجئ.",
    uses: "تُستخدم في الأرصفة والطرق وبلاطات الأسطح لمنع نشوء التشقبات الانكماشية المبكرة وتحسين تماسك الخرسانة ومقاومة الحريق.",
    compatibleTypes: ["FRC", "SHOTCRETE", "NSC"],
    fiberType: "synthetic",
    fiberDosageKgM3: 1.5,
    fiberDensity: 910,
    fiberLengthMm: 19,
    fiberDiameterMm: 0.03,
    fiberTensileStrengthMPa: 400,
    price: 120.0
  },

  // --- 5. الركام الخاص (Special Aggregates) ---
  {
    id: "exp-perlite",
    name: "الركام الخفيف (البيرلايت / الفيرميكوليت)",
    englishName: "Perlite & Vermiculite Aggregates",
    group: "الركام الخاص",
    category: "الركام الخفيف",
    desc: "ركام معدني بركاني أو طبيعي ممدد بالحرارة يحتوي على بنية خلوية مفرغة خفيفة جداً وعازلة للصوت والحرارة.",
    uses: "يُستخدم كركام لصب الخرسانة خفيفة الوزن لتأمين عزل حراري فائق، تقليل وزن المنشأ الإجمالي، وتخفيف كلفة الأعمدة الحاملة.",
    compatibleTypes: ["LWC"]
  },
  {
    id: "exp-barite",
    name: "الركام الثقيل (الباريت / الهيماتيت / المغنتيت)",
    englishName: "Heavyweight Aggregates (Barite / Magnetite)",
    group: "الركام الخاص",
    category: "الركام الثقيل",
    desc: "معادن حديدية طبيعية ثقيلة كالهيماتيت والباريت والمغنتيت تتمتع بكتلة نوعية فائقة تزيد كثافة الخرسانة الإجمالية بشكل مضاعف.",
    uses: "تُستخدم لإنتاج خرسانة ثقيلة الوزن لغايات الحماية التامة من الإشعاع النووي في المفاعلات والسينية في غرف الأشعة بالمستشفيات.",
    compatibleTypes: ["HWC"]
  },

  // --- 6. المواد المتقدمة (Advanced Materials) ---
  {
    id: "exp-geobinder",
    name: "مواد رابطة جيوبوليمرية (Geopolymer)",
    englishName: "Geopolymer Alkaline Binders",
    group: "المواد المتقدمة",
    category: "الجيوبوليمر",
    desc: "بديل ثوري للإسمنت البورتلاندي يعتمد على منشطات قلوية كيميائية تدمج الألومينوسيليكات بيئياً دون إنتاج غاز ثاني أكسيد الكربون.",
    uses: "تُستخدم لصب الخرسانة الجيوبوليمرية الخضراء الصديقة للبيئة والمنشآت ذات الحماية القصوى ضد الأحماض والمواد الكيميائية العنيفة.",
    compatibleTypes: ["GPC"]
  },
  {
    id: "exp-epoxy",
    name: "راتنجات الإيبوكسي (Epoxy resins)",
    englishName: "Structural Epoxy Resins",
    group: "المواد المتقدمة",
    category: "الإيبوكسي",
    desc: "بوليمرات صناعية سائلة ثنائية المركب تمتاز بقوة التصاق كيميائي غير عادية ومقاومة تامة لتسرب الرطوبة والكيماويات.",
    uses: "تُستخدم في إصلاح وتدعيم الشروخ الخرسانية الميكانيكية، وربط عناصر الخرسانة الحديثة بالقديمة بقوة تلاصق فائقة الصلابة والمتانة.",
    compatibleTypes: ["SHC", "HPC"]
  },
  {
    id: "exp-nanosilica",
    name: "المواد النانوية (السيليكا النانوية / الألومينا النانوية)",
    englishName: "Nanomaterials (Nano silica / Nano alumina)",
    group: "المواد المتقدمة",
    category: "المواد النانوية",
    desc: "جزيئات نانوية بالغة الصغر تخترق بنية عجينة الترطيب الإسمنتي لتلغي المسام الشعرية تماماً وتعدل من بلورات الهدرتة مجهرياً.",
    uses: "تُستخدم في الخرسانة المتقدمة جداً (UHPC) والخرسانة عالية القوة لتقليل الفراغات النانوية ورفع مقاومة الضغط والشد بشكل استثنائي وغير مسبوق.",
    compatibleTypes: ["UHPC", "BFUP", "HPC", "HSC"],
    catalogOnly: true,
    calculationInfluence: "none"
  },
  {
    id: "exp-biohealing",
    name: "مواد ذاتية الإصلاح (بكتيرية وكبسولية)",
    englishName: "Self-healing Agents (Bacterial / Capsule)",
    group: "المواد المتقدمة",
    category: "ذاتية الإصلاح",
    desc: "أنظمة حيوية تعتمد على سلالات بكتيرية خاملة أو كبسولات مجهرية كيميائية تفرز الكربونات أو اللواصق تلقائياً عند نمو التشققات بفعل الرطوبة.",
    uses: "سد التشققات الانكماشية تلقائياً وبشكل ذاتي لمنع وصول الأكسجين والماء لحديد التسليح الداخلي وحمايته من التآكل مدى الحياة.",
    compatibleTypes: ["SHC"],
    catalogOnly: true,
    calculationInfluence: "none"
  }
];
