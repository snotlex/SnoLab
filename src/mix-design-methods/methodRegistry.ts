import { MixDesignMethodDefinition } from "./types";

export const METHODS_REGISTRY: Record<string, MixDesignMethodDefinition> = {
  "dreux-gorisse": {
    id: "dreux-gorisse",
    nameAr: "طريقة دو-غوريس الفرنسية",
    nameFr: "Méthode Dreux-Gorisse",
    nameEn: "Dreux-Gorisse French Method",
    category: "complete-design",
    implementationStatus: "complete",
    descriptionAr: "الطريقة القياسية الكلاسيكية الفرنسية الأكثر استخداماً في الجزائر. تُعنى بحساب التدرج الحبيبي المثالي عبر تصميم منحنى مكسور يحقق الكثافة الرصّية العظمى للركام.",
    descriptionFr: "La méthode classique française la plus utilisée en Algérie. Permet de concevoir une courbe granulo idéale brisée pour maximiser la compacité du mélange.",
    descriptionEn: "The classical French standard method widely used in Algeria and France. Focuses on designing an ideal broken grading curve to achieve maximum aggregate compaction.",
    useCasesAr: [
      "تصميم الخلطات الإنشائية القياسية",
      "الخرسانة المسلحة عالية المقاومة للأبراج والجسور",
      "ملاءمة مثالية للركام والرمال المتاحة محلياً في الجزائر"
    ],
    useCasesFr: [
      "Formulation de bétons de structure standard",
      "Béton armé à haute résistance pour bâtiments et ponts",
      "Excellente adaptation aux agrégats locaux en Algérie"
    ],
    useCasesEn: [
      "Standard structural concrete design",
      "High-strength reinforced concrete for towers and bridges",
      "Ideal fit for Algerian and North African local aggregates"
    ],
    limitationsAr: [
      "تتطلب معرفة دقيقة بالمنحنيات الحبيبية للرمل والحصى بالموقع",
      "الحسابات والرسومات البيانية معقدة وصعبة التطوير اليدوي"
    ],
    limitationsFr: [
      "Nécessite une analyse granulométrique précise du sable et du gravier",
      "Calculs graphiques complexes difficiles à optimiser manuellement"
    ],
    limitationsEn: [
      "Requires precise sieve analysis data of both sands and gravels",
      "Graphical computations are complex to carry out manually"
    ],
    outputType: "complete-mix",
    requiredInputs: [
      {
        key: "fck28",
        labelAr: "المقاومة المميزة المستهدفة بعمر 28 يوم",
        labelFr: "Résistance caractéristique fck (28 jours)",
        labelEn: "Target Characteristic Strength at 28 days",
        type: "number",
        unit: "MPa",
        required: true,
        min: 10,
        max: 250,
        helpTextAr: "مقاومة كسر الأسطوانات المطلوبة هندسياً بعد 28 يوماً",
        helpTextFr: "Résistance à la compression souhaitée à 28 jours",
        helpTextEn: "Core design characteristic strength required at 28 days"
      },
      {
        key: "cementClassStrength",
        labelAr: "رتبة مقاومة الإسمنت في المختبر",
        labelFr: "Classe de résistance du ciment",
        labelEn: "Cement Lab Strength Rating",
        type: "number",
        unit: "MPa",
        required: true,
        min: 32.5,
        max: 52.5,
        helpTextAr: "الرتبة المكتوبة على كيس الإسمنت (مثال: 42.5 أو 52.5 أو 32.5)",
        helpTextFr: "Classe normalisée (ex: 32.5, 42.5 ou 52.5)",
        helpTextEn: "The catalog nominal strength score of the cement"
      },
      {
        key: "slump",
        labelAr: "قوام الهبوط المطلوب (مخروط أبراهام)",
        labelFr: "Affaissement au cône (Slump)",
        labelEn: "Target Slump Range",
        type: "number",
        unit: "cm",
        required: true,
        min: 0,
        max: 30,
        helpTextAr: "مقدار نزول الخرسانة بالسنتيمتر لتحديد درجة التشغيلية",
        helpTextFr: "Valeur d'affaissement mesurée au cône",
        helpTextEn: "Slump height in cm to check fluid workability"
      },
      {
        key: "dMax",
        labelAr: "القطر الأقصى لحبيبات الركام (D_max)",
        labelFr: "Dimensions maximales des granulats (Dmax)",
        labelEn: "Nominal Maximum Aggregate Size (D_max)",
        type: "number",
        unit: "mm",
        required: true,
        min: 1,
        max: 120,
        helpTextAr: "أكبر مقاس لحبيبات الركام المستخدم بالخلطة",
        helpTextFr: "Le plus grand diamètre de granulat admis",
        helpTextEn: "Sieve dimension of the largest gravel particles"
      },
      {
        key: "aggregateType",
        labelAr: "نوع تضاريس الركام المستخدم",
        labelFr: "Type d'agrégat (Faciès)",
        labelEn: "Aggregate Particle Shape Type",
        type: "select",
        required: true,
        options: [
          { value: "roule", labelAr: "مستدير / ركام وديان", labelFr: "Roulé / Alluvionnaire", labelEn: "Rounded / River Gravel" },
          { value: "concasse", labelAr: "مكسر / ركام مقالع", labelFr: "Concassé / Carrière", labelEn: "Crushed / Quarry Stone" }
        ],
        helpTextAr: "طبيعة تلامس الحبيبات (مكسر كسارة أو طبيعي وديان)",
        helpTextFr: "Nature de la surface géométrique des gravillons",
        helpTextEn: "Surface topography affects particle interlocking"
      }
    ],
    optionalInputs: [
      {
        key: "controlClass",
        labelAr: "رتبة المراقبة وضبط الجودة بالموقع",
        labelFr: "Qualité du contrôle sur chantier",
        labelEn: "Site Quality Control Class",
        type: "select",
        required: false,
        options: [
          { value: "high", labelAr: "مراقبة صارمة (ممتازة)", labelFr: "Rigoureux (Excellent)", labelEn: "Strict (Excellent)" },
          { value: "normal", labelAr: "مراقبة عادية (متوسطة)", labelFr: "Normal (Moyen)", labelEn: "Standard (Average)" },
          { value: "low", labelAr: "مراقبة ضعيفة (موقع عادي)", labelFr: "Faible", labelEn: "Low (Basic)" }
        ]
      },
      {
        key: "sandRelativeDensity",
        labelAr: "الكثافة النوعية للرمل جاف",
        labelFr: "Densité relative du sable (sec)",
        labelEn: "Specific Gravity of Sand (SSD)",
        type: "number",
        required: false,
        min: 1.5,
        max: 3.5
      },
      {
        key: "gravelRelativeDensity",
        labelAr: "الكثافة النوعية للحصى جاف",
        labelFr: "Densité relative du gravier (sec)",
        labelEn: "Specific Gravity of Coarse Aggregate",
        type: "number",
        required: false,
        min: 1.5,
        max: 3.5
      },
      {
        key: "cementDensity",
        labelAr: "الكثافة المطلقة للإسمنت",
        labelFr: "Masse volumique absolue du ciment",
        labelEn: "Absolute Density of Cement",
        type: "number",
        unit: "kg/m³",
        required: false,
        min: 2500,
        max: 3500
      }
    ]
  }
};
