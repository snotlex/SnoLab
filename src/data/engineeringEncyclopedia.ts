export interface EncyclopediaTerm {
  key: string;
  termAr: string;
  termEn: string;
  termFr: string;
  definitionAr: string;
  definitionEn: string;
  definitionFr: string;
  standard: string;
  category: "mix_design" | "aggregate_physics" | "chemicals" | "mechanical_properties" | "durability";
  formula?: string;
}

export const ENCYCLOPEDIA_TERMS: EncyclopediaTerm[] = [
  {
    key: "fck28",
    termAr: "المقاومة المميزة للضغط بعمر 28 يوماً (fck28)",
    termEn: "Characteristic Compressive Strength (fck28)",
    termFr: "Résistance Caractéristique à la Compression à 28j (fck28)",
    definitionAr: "مقاومة الخرسانة للضغط المقاسة على عينات أسطوانية (150×300 مم) أو مكعبة (150 مم) بعد 28 يوماً من المعالجة القياسية، والتي لا يُتوقع أن يقل عنها أكثر من 5% من نتائج الفحوصات المخبرية.",
    definitionEn: "The compressive strength of concrete measured on cylinder (150x300mm) or cube specimens after 28 days of standard moist curing, below which not more than 5% of all test results are expected to fall.",
    definitionFr: "La valeur de la résistance à la compression à 28 jours d'âge en dessous de laquelle 5% de l'ensemble des résultats des essais de compression possibles sont susceptibles de se situer.",
    standard: "NF EN 206, ACI 318, ASTM C39",
    category: "mechanical_properties",
    formula: "fcm28 >= fck28 + 1.64 * \\sigma"
  },
  {
    key: "wc_ratio",
    termAr: "نسبة الماء إلى الإسمنت (W/C)",
    termEn: "Water-Cement Ratio (W/C)",
    termFr: "Rapport Eau/Ciment (E/C)",
    definitionAr: "المعامل الأكثر أهمية في كيمياء وتكنولوجيا الخرسانة. يعبر عن النسبة بين وزن ماء الخلط الفعال إلى وزن الإسمنت البورتلاندي. يحدد هذا المعامل حجم الفراغات الشعرية في العجينة المتصلبة ونفوذيتها ومقاومتها للضغط والانحناء.",
    definitionEn: "The ratio of the weight of mixing water to the weight of cement. It is the single most critical factor determining concrete porosity, permeability, mechanical strength, and resistance to environmental degradation.",
    definitionFr: "Rapport entre la masse d'eau efficace et la masse de ciment sec dans le mélange. C'est le principal facteur contrôlant la porosité de la pâte de ciment hydratée et la résistance finale du béton.",
    standard: "NF EN 206, ACI 211.1",
    category: "mix_design",
    formula: "W/C = \\frac{Water}{Cement}"
  },
  {
    key: "dmax",
    termAr: "القطر الأقصى الاسمي للركام (Dmax)",
    termEn: "Maximum Aggregate Size (Dmax)",
    termFr: "Dimension Maximale des Granulats (Dmax)",
    definitionAr: "أكبر مقاس اسمي لحبيبات الحصى أو الركام الخشن المستخدم في الخلطة، ويتم تحديده هندسياً بالاعتماد على أبعاد العضو الإنشائي، والمسافات البينية لحديد التسليح، وسمك الغطاء الخرساني الواقي.",
    definitionEn: "The largest nominal size of aggregate particles used in the concrete. Its selection depends on structural element thickness, minimum clear spacing between reinforcing bars, and the required concrete cover thickness.",
    definitionFr: "La plus grande taille nominale des granulats utilisés dans le béton. Elle est choisie en fonction de l'épaisseur des voiles, de l'enrobage et de la distance libre entre les armatures.",
    standard: "NF EN 12620, ASTM C33, NF P 18-541",
    category: "aggregate_physics",
    formula: "D_{max} \\le \\frac{Thickness}{5} \\text{ or } \\le \\frac{Spacing}{0.75}"
  },
  {
    key: "fineness_modulus",
    termAr: "معامل نعومة الرمل (FM)",
    termEn: "Sand Fineness Modulus (FM)",
    termFr: "Module de Finesse du Sable (MF)",
    definitionAr: "معامل تجريبي يعبر عن متوسط مقاس الرمل الفعلي. يُحسب بجمع النسب المئوية المتراكمة المحتجزة على مجموعة الغرابيل القياسية وقسمتها على 100. النطاق الأمثل هندسياً لخرسانة قابلة للتشغيل هو (2.2 - 2.8).",
    definitionEn: "An empirical factor that represents the weighted average size of sand particles. It is calculated by summing the cumulative percentages of aggregate retained on standard sieves and dividing by 100. The ideal range is 2.2 to 2.8.",
    definitionFr: "Critère de caractérisation de la granulométrie d'un sable. Somme des refus cumulés, exprimés en pourcentages de la masse de l'échantillon, sur une série de tamis standards divisée par 100. L'optimum se situe entre 2.2 et 2.8.",
    standard: "NF EN 12620, ASTM C136",
    category: "aggregate_physics",
    formula: "FM = \\frac{\\sum \\text{Cumulative % Retained on Sieves}}{100}"
  },
  {
    key: "pivot_point",
    termAr: "نقطة الانعطاف المرجعية (Pivot Point)",
    termEn: "Dreux-Gorisse Pivot Point",
    termFr: "Point de Rupture / Pivot de Dreux",
    definitionAr: "نقطة حرجة على منحنى التدرج الحبيبي المثالي لدروكس-غوريس، يرمز لإحداثياتها بـ (X, Y). تحدد نسبة الرمل الخفيفة (الأنعم من مقاس الانعطاف) ونسبة الحصى الكلية لضمان الرص الفراغي الأقصى للخلطة.",
    definitionEn: "The critical coordinate on the ideal Dreux-Gorisse target grading curve, denoted as (X, Y). The X-coordinate is defined as Dmax/2 for Dmax <= 20mm or midpoint otherwise. The Y-coordinate represents the optimum sand proportion.",
    definitionFr: "Le point de transition ou d'inflexion (X, Y) sur la courbe de référence Dreux-Gorisse. L'abscisse X sépare les sables des gravillons et l'ordonnée Y définit la proportion optimale d'éléments fins pour un compactage optimal.",
    standard: "Dreux-Gorisse French Standard",
    category: "aggregate_physics",
    formula: "X = D_{max}/2 \\text{ (if } D_{max} \\le 20) \\text{ or } X \\approx \\text{midpoint}"
  },
  {
    key: "granular_constant_k",
    termAr: "معامل التماسك الحبيبي (K)",
    termEn: "Granular Constant (K / K0)",
    termFr: "Coefficient Granulaire / Terme Correctif (K)",
    definitionAr: "معامل تصحيحي يُضاف لإحداثيات نقطة الانعطاف Y لتعديل نسبة الرمل والحصويات الدقيقة بناءً على رتبة الإسمنت، ونوع الدمك والاهتزاز، وخشونة الرمل (FM)، لتفادي الفراغات والحفاظ على قابلية تشغيل ممتازة.",
    definitionEn: "A corrective factor added to the target curve's pivot point Y-coordinate to adjust sand dosage based on binder content, sand fineness modulus, and the level of compaction vibration energy applied.",
    definitionFr: "Terme correctif ajouté à l'ordonnée Y du point de rupture de la courbe de référence pour ajuster le besoin en sable selon le dosage en ciment, la puissance de vibration et la finesse du sable.",
    standard: "Georges Dreux Compaction Norms",
    category: "aggregate_physics",
    formula: "Y = 50 - \\sqrt{D_{max}} + K_0 + K_s"
  },
  {
    key: "compactness_gamma0",
    termAr: "معامل الارتصاص الحجمي (γ0)",
    termEn: "Compactness Coefficient (γ0)",
    termFr: "Coefficient de Compacité (γ0)",
    definitionAr: "يعبر عن النسبة المئوية للحجم الحقيقي للركام والإسمنت المستهلك في المتر المكعب من الخرسانة مقارنةً بالحجم الكلي الصلب. يتوقف هذا المعامل على قطر الركام الأقصى Dmax وقوام الخرسانة ونوع الدمك.",
    definitionEn: "An engineering parameter reflecting the total solid volume occupancy (aggregates + cementitious materials) in a unit volume of concrete. It is determined by compaction efficiency, consistency, and aggregate size Dmax.",
    definitionFr: "Rapport du volume absolu des matières solides (granulats + ciment) au volume total du béton frais vibré. Ce coefficient varie en fonction de la taille maximale des granulats, de la consistance et du serrage.",
    standard: "Dreux Formulation Table 4.4",
    category: "mix_design",
    formula: "V_{solids} = \\gamma_0 \\times 1000 \\text{ liters}"
  },
  {
    key: "slump",
    termAr: "هبوط مخروط أبرامز / قابلية التشغيل (Slump)",
    termEn: "Abrams Cone Slump / Workability",
    termFr: "Affaissement au Cône d'Abrams",
    definitionAr: "فحص حقلي سريع يُقاس بالمليمتر أو السنتيمتر يعبر عن قوام الخرسانة الطازجة وقابليتها للتدفق والتشغيل والضخ ورصها داخل القوالب الخشبية دون حدوث ظاهرة الانفصال الحبيبي.",
    definitionEn: "A standard field test measuring the vertical slump of freshly mixed concrete upon removing a standard Abrams cone mold. It indicates the consistency, ease of flow, placing, and pumping workability of the mix.",
    definitionFr: "Mesure de la consistance et de l'ouvrabilité du béton frais en mesurant l'affaissement vertical d'un cône tronconique normalisé après démoulage immédiat.",
    standard: "NF EN 12350-2, ASTM C143",
    category: "mix_design",
    formula: "Class: S1 (1-4 cm), S2 (5-9 cm), S3 (10-15 cm), S4 (16-21 cm), S5 (>= 22 cm)"
  },
  {
    key: "superplasticizer",
    termAr: "المُلدنات الفائقة / مخفضات المياه عالية المدى (HRWRA)",
    termEn: "Superplasticizers / High-Range Water Reducers",
    termFr: "Superplastifiants / Réducteurs d'Eau Haut de Gamme",
    definitionAr: "مركبات كيميائية نشطة سطحياً تضاف بنسب ضئيلة للخرسانة لتعمل على تفريق حبيبات الإسمنت المشحونة، مما يقلل بشدة طلب ماء الخلط الفعال بنسبة تصل إلى 30% مع الاحتفاظ بقوام انسيابي فائق وقابل للضخ.",
    definitionEn: "Surfactant chemical admixtures that disperse cement particles through electrostatic or steric repulsion, allowing water reductions of up to 30% while maintaining flowability and high early strengths.",
    definitionFr: "Adjuvants organiques solubles dans l'eau qui provoquent la défloculation et la dispersion des grains de ciment par répulsion électrostatique ou stérique, permettant d'abaisser l'E/C jusqu'à 30%.",
    standard: "NF EN 934-2, ASTM C494 Type F/G",
    category: "chemicals",
    formula: "Dosage \\in [0.2\\%, 2.5\\%] \\text{ by weight of binder}"
  },
  {
    key: "moisture_correction",
    termAr: "تصحيح رطوبة الركام الفعلي (Moisture Correction)",
    termEn: "Aggregate Moisture Correction",
    termFr: "Correction d'Humidité des Granulats",
    definitionAr: "إجراء حسابي إلزامي لمطابقة الواقع الميداني. يتم فيه تعديل أوزان الرمل والحصى الرطبة المضافة للخلاطة بناءً على نسب الرطوبة السطحية الفعالة، وخصم فارق المياه من ماء الخلط الفعلي لحماية نسبة (W/C).",
    definitionEn: "The process of adjusting aggregate batched weights and mixing water volume to account for free moisture on aggregates. It ensures that the net effective water-cement ratio in the wet paste remains exactly as designed.",
    definitionFr: "Ajustement des masses de sable et de gravier humides à peser lors du gâchage, et déduction de l'eau libre apportée par ces granulats de la quantité d'eau de gâchage totale conçue pour respecter l'E/C.",
    standard: "ACI 301, ASTM C566, NF EN 1097-5",
    category: "mix_design",
    formula: "W_{wet} = W_{dry} \\times (1 + w/100) \\quad \\& \\quad Water_{added} = Water_{eff} - \\sum (W_{dry} \\times \\text{Free Moisture})"
  },
  {
    key: "bolomey_g",
    termAr: "معامل الركام لبلومي (G)",
    termEn: "Bolomey Granular Factor (G)",
    termFr: "Facteur Granulaire de Bolomey (G)",
    definitionAr: "معامل تجريبي يصف جودة الركام الخشن وتدرجه وملمسه السطحي (ركام نهري ناعم مقابل ركام مكسر خشن)، ويؤثر مباشرة في حساب مقاومة الضغط المستهدفة ونسبة الماء للإسمنت.",
    definitionEn: "An empirical coefficient reflecting aggregate surface texture and geometric quality (e.g., rounded river gravel vs. crushed angular limestone), which directly impacts target paste-strength and W/C estimations.",
    definitionFr: "Paramètre empirique caractérisant la qualité de la forme et de la surface des granulats (ex. graviers alluvionnaires roulés doux vs. granulats de carrière concassés angulaires).",
    standard: "Bolomey Formulation Theory",
    category: "aggregate_physics",
    formula: "fcm = G \\times fce \\times (C/W - 0.5)"
  },
  {
    key: "scms",
    termAr: "المواد الإسمنتية التكميلية (SCMs)",
    termEn: "Supplementary Cementitious Materials (SCMs)",
    termFr: "Ajouts Cimentaires / Matériaux Pouzzolaniques",
    definitionAr: "مواد دقيقة مثل غبار السيليكا، الرماد المتطاير، أو خبث الأفران، تمتلك خواصاً هيدروليكية أو بوزولانية. تتفاعل كيميائياً مع هيدروكسيد الكالسيوم الحر لتنتج روابط (C-S-H) إضافية تحسّن من كثافة ومقاومة ومتانة الخرسانة.",
    definitionEn: "Finely divided mineral admixtures (Silica Fume, Fly Ash, Slag) with pozzolanic or latent hydraulic properties. They chemically react with free calcium hydroxide to form additional binder gel (C-S-H), improving durability.",
    definitionFr: "Substances minérales finement broyées (fumée de silice, cendres volantes, laitier) qui réagissent chimiquement avec la chaux libre issue de l'hydratation pour former des gels liants supplémentaires (C-S-H).",
    standard: "NF EN 197-1, ASTM C618, ASTM C1240",
    category: "chemicals",
    formula: "K_{efficiency} \\times SCM \\text{ acts as Cement equivalent}"
  }
];

export const getTermByKey = (key: string): EncyclopediaTerm | undefined => {
  return ENCYCLOPEDIA_TERMS.find(t => t.key === key);
};
