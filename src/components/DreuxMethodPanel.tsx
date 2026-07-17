import React, { useState } from "react";
import { 
  Award, 
  Activity, 
  Zap, 
  CheckCircle, 
  FileText, 
  Layers,
  Sparkles,
  Info,
  TrendingUp, 
  Cpu, 
  Sliders, 
  Maximize, 
  LineChart, 
  Feather, 
  Scale, 
  CloudRain, 
  Droplets, 
  Hammer, 
  Droplet, 
  Percent, 
  Package, 
  Shield, 
  Wind, 
  GitBranch, 
  Binary, 
  FlaskConical, 
  Gauge,
  HelpCircle,
  Eye,
  Grid
} from "lucide-react";
import { MixDesignInput, MixDesignResult } from "../types";

interface DreuxMethodPanelProps {
  inputs: MixDesignInput;
  results: MixDesignResult;
  onApplyPreset?: (methodId: string) => void;
}

export const DreuxMethodPanel: React.FC<DreuxMethodPanelProps> = ({ 
  inputs, 
  results
}) => {
  const [activeCategory, setActiveCategory] = useState<"all" | "performance" | "workability" | "materials" | "grading">("all");
  const [expandedParam, setExpandedParam] = useState<number | null>(null);

  // Active resolved variables
  const sandFineness = 2.6; // standard fallback
  
  // Define the 20 parameters
  const parameters = [
    {
      id: 1,
      category: "performance",
      symbol: "f_c28",
      nameAr: "مقاومة الخرسانة المطلوبة",
      nameFr: "Résistance requise de la chaux/béton",
      nameEn: "Target Concrete Compressive Strength",
      icon: TrendingUp,
      color: "from-blue-500 to-indigo-600",
      descriptionAr: "المقاومة الميكانيكية المميزة للخرسانة عند عمر 28 يوماً. تشكل الأساس لحساب المقاومة المستهدفة fcm28 التي تضمن هامش أمان يتناسب مع درجة التحكم في الموقع.",
      descriptionFr: "La résistance mécanique caractéristique du béton à 28 jours (fc28) qui détermine la résistance moyenne ciblée (fcm28) avec une marge de sécurité.",
      currentValue: `${inputs.fck28} MPa`
    },
    {
      id: 2,
      category: "performance",
      symbol: "σ_cem",
      nameAr: "صنف مقاومة الإسمنت",
      nameFr: "Classe de résistance du ciment",
      nameEn: "Cement Strength Class",
      icon: Cpu,
      color: "from-purple-500 to-indigo-600",
      descriptionAr: "المقاومة الاسمية لعلامة أو صنف الإسمنت المستعمل (مثل 32.5 أو 42.5 أو 52.5 ميجاباسكال). تؤثر مباشرة في حساب نسبة الماء/الإسمنت ومعدل صلابة الخرسانة المبكر.",
      descriptionFr: "La classe de résistance nominale du ciment utilisé (par ex. 32.5, 42.5, 52.5 MPa) influençant directement le rapport E/C.",
      currentValue: `${inputs.cementClassStrength || 42.5} MPa (${inputs.cementType || "CEM I / CEM II"})`
    },
    {
      id: 3,
      category: "workability",
      symbol: "Slump",
      nameAr: "قابلية التشغيل المطلوبة (الهبوط)",
      nameFr: "Affaissement au cône d'Abrams",
      nameEn: "Concrete Workability (Slump)",
      icon: Sliders,
      color: "from-amber-500 to-orange-600",
      descriptionAr: "مدى سيولة أو لدانة الخرسانة الطازجة مقاساً بالسنتمتر بقمع أبرامز. يحدد القوام المطلوب لتسهيل الصب والضخ دون حدوث انفصال حبيبي.",
      descriptionFr: "L'affaissement du cône mesurant la fluidité du béton frais (ferme, plastique, très plastique ou fluide) pour garantir la mise en œuvre.",
      currentValue: `${inputs.slump} cm`
    },
    {
      id: 4,
      category: "grading",
      symbol: "D_max",
      nameAr: "المقاس الأقصى للركام",
      nameFr: "Dimension maximale des granulats",
      nameEn: "Maximum Aggregate Size",
      icon: Maximize,
      color: "from-teal-500 to-emerald-600",
      descriptionAr: "أكبر قطر اسمي لحبيبات الحصى المستخدمة. يؤثر مباشرة على كمية المياه المطلوبة حيث أن تصغير المقاس يرفع المساحة السطحية النوعية للركام وبالتالي طلب المياه.",
      descriptionFr: "Le diamètre nominal maximal des granulats (Dmax). Plus Dmax est grand, plus la demande en eau efficace diminue grâce à la baisse de la surface spécifique.",
      currentValue: `${inputs.dMax} mm`
    },
    {
      id: 5,
      category: "grading",
      symbol: "Grading",
      nameAr: "التحليل الحبيبي للركام",
      nameFr: "Analyse granulométrique des agrégats",
      nameEn: "Aggregate Sieve Analysis",
      icon: LineChart,
      color: "from-emerald-500 to-teal-600",
      descriptionAr: "تحديد نسب المرور عبر الغرابيل للرمل والحصويات المختلفة لبناء منحنيات التدرج الحبيبي، مما يتيح حساب أفضل توليفة حجمية لملء الفراغات البينية للخرسانة.",
      descriptionFr: "La distribution de la taille des particules obtenue par tamisage, essentielle pour tracer les courbes granulométriques réelles de chaque composant.",
      currentValue: "متوفر بالمنحنيات"
    },
    {
      id: 6,
      category: "materials",
      symbol: "M_f",
      nameAr: "معامل النعومة للرمل",
      nameFr: "Module de finesse du sable",
      nameEn: "Sand Fineness Modulus",
      icon: Feather,
      color: "from-amber-500 to-yellow-600",
      descriptionAr: "مؤشر يعبر عن خشونة أو نعومة الرمل. القيمة المثالية تتراوح بين 2.2 إلى 2.8؛ الرمل الأنعم يرفع الطلب على الإسمنت والماء، والأخشن يضر تماسك الخلطة.",
      descriptionFr: "Le module de finesse du sable (Mf) qui indique le caractère fin ou grossier du sable pour ajuster la proportion idéale de sable fin.",
      currentValue: "2.60 (مثالي)"
    },
    {
      id: 7,
      category: "materials",
      symbol: "ρ_s / ρ_g",
      nameAr: "الكتلة الحجمية الحقيقية للمواد",
      nameFr: "Masse volumique absolue des matériaux",
      nameEn: "Absolute Relative Density",
      icon: Scale,
      color: "from-slate-500 to-blue-600",
      descriptionAr: "الكثافة النوعية المطلقة لكل من الإسمنت والركام (الرمل والحصى). تستخدم لتحويل نسب التصميم الحجمية النظرية لخلطة الخرسانة إلى أوزان فعلية بالكيلوغرام.",
      descriptionFr: "La masse volumique de chaque composant permettant la conversion exacte des volumes de la méthode en masses pesables de chantier.",
      currentValue: `الرمل: ${inputs.sandRelativeDensity} kg/m³ | الحصى: ${inputs.gravelRelativeDensity} kg/m³`
    },
    {
      id: 8,
      category: "materials",
      symbol: "Moisture",
      nameAr: "الرطوبة الطبيعية للركام",
      nameFr: "Humidité naturelle des granulats",
      nameEn: "Natural Aggregate Moisture",
      icon: CloudRain,
      color: "from-blue-400 to-sky-600",
      descriptionAr: "نسبة المياه الموجودة حراً على أسطح الركام بالورشة. تتطلب خصم كميات المياه الفائضة من ماء الخلط الحقيقي لمنع تمييع الخرسانة وزيادة وزن الركام الرطب.",
      descriptionFr: "Le pourcentage d'eau libre présente dans les granulats nécessitant une correction rigoureuse du dosage en eau et des masses humides de pesée.",
      currentValue: `الرمل: ${inputs.moistureSand}% | الحصى: ${inputs.moistureGravel}%`
    },
    {
      id: 9,
      category: "materials",
      symbol: "Abs %",
      nameAr: "امتصاص الركام للماء",
      nameFr: "Absorption d'eau des granulats",
      nameEn: "Aggregate Water Absorption",
      icon: Droplets,
      color: "from-cyan-500 to-blue-600",
      descriptionAr: "قدرة حبيبات الرمل والحصى على امتصاص الماء داخل مساماتها الداخلية. الركام غير المشبع يمتص جزءاً من ماء الخلط، مما يقلل الماء الفعّال المتاح لإماهة الإسمنت.",
      descriptionFr: "La capacité d'absorption des pores internes des granulats, essentielle pour calculer l'eau efficace active dans le rapport eau/liant.",
      currentValue: `الرمل: ${inputs.sandAbsorption !== undefined ? inputs.sandAbsorption : 1.5}% | الحصى: ${inputs.gravelAbsorption !== undefined ? inputs.gravelAbsorption : 0.8}%`
    },
    {
      id: 10,
      category: "materials",
      symbol: "Shape",
      nameAr: "شكل الركام وطبيعته",
      nameFr: "Forme et nature des granulats",
      nameEn: "Aggregate Shape & Texture",
      icon: Grid,
      color: "from-zinc-500 to-neutral-600",
      descriptionAr: "تحديد ما إذا كان الركام مكسراً (حاد الزوايا ويوفر ترابطاً ميكانيكياً قوياً) أو مدوراً نهریاً (يسهل التشغيلية بطلب مياه أقل). تؤثر في معامل التصحيح الحجمي.",
      descriptionFr: "La texture de surface (concassé ou roulé) influençant la compacité de serrage de la méthode Dreux et la résistance d'adhérence.",
      currentValue: inputs.aggregateType === "crushed" ? "مكسر (Crushed)" : "مدور نهرى (Rounded)"
    },
    {
      id: 11,
      category: "workability",
      symbol: "Comp.",
      nameAr: "طريقة الصب ودرجة الدمك",
      nameFr: "Moyen de serrage et compactage",
      nameEn: "Placing & Compaction Method",
      icon: Hammer,
      color: "from-stone-500 to-gray-600",
      descriptionAr: "مدى كثافة التسليح وطريقة الدمك (يدوي أو هزاز آلي أو خرسانة مضخوخة). تؤثر مباشرة في اختيار درجة الدمك ومعامل الرص الحسابي لضمان خلو الفراغات.",
      descriptionFr: "Le mode de vibration (aiguille, règle vibrante ou serrage manuel) qui détermine le coefficient de compacité appliqué à la formulation.",
      currentValue: inputs.hasPumping ? "صب بالمضخة (Pumping)" : "صب تقليدي (Normal)"
    },
    {
      id: 12,
      category: "workability",
      symbol: "E_0",
      nameAr: "كمية الماء الابتدائية للخلط",
      nameFr: "Teneur en eau initiale de base",
      nameEn: "Initial Base Water Content",
      icon: Droplet,
      color: "from-blue-400 to-indigo-500",
      descriptionAr: "الحجم الأساسي للمياه اللازم لترطيب المواد وتحقيق قوام الهبوط المطلوب بناءً على قطر الركام الأقصى وجودة الركام وشكله قبل تطبيق تصحيحات الرطوبة والإضافات.",
      descriptionFr: "Le volume d'eau initial théorique déterminé graphiquement ou par calcul d'après le Dmax et l'affaissement visé.",
      currentValue: `${Math.round(results.waterBeforeCorrection || 180)} L`
    },
    {
      id: 13,
      category: "performance",
      symbol: "E/C",
      nameAr: "نسبة الماء إلى الإسمنت",
      nameFr: "Rapport Eau/Ciment (E/C)",
      nameEn: "Water-to-Cement Ratio (W/C)",
      icon: Percent,
      color: "from-red-500 to-rose-600",
      descriptionAr: "أهم نسبة تصميمية في تكنولوجيا الخرسانة. تحسب مباشرة من قانون Bolomey المعدل بواسطة درو-غوريس لربط مقاومة الضغط بالمسامية ونفاذية الهيكل الخرساني.",
      descriptionFr: "Le rapport clé (E/C ou W/C) calculé via la formule de Bolomey pour réguler à la fois la résistance mécanique et la porosité du béton.",
      currentValue: results.wcRatioAdjusted !== undefined ? results.wcRatioAdjusted.toFixed(2) : "0.50"
    },
    {
      id: 14,
      category: "performance",
      symbol: "C",
      nameAr: "كمية أو وزن الإسمنت الفعلي",
      nameFr: "Dosage minimal en ciment",
      nameEn: "Cement Weight Content",
      icon: Package,
      color: "from-blue-600 to-slate-700",
      descriptionAr: "الوزن الكلي للإسمنت المطلوب لكل متر مكعب من الخرسانة. يتم استنتاجه بقسمة حجم المياه الفعال على نسبة الماء/الإسمنت مع مطابقة الحد الأدنى للكود لضمان الديمومة.",
      descriptionFr: "La masse de ciment requise par m³ de béton, calculée pour satisfaire la résistance cible et les exigences normatives de durabilité.",
      currentValue: `${Math.round(results.cementWeight || 350)} kg/m³`
    },
    {
      id: 15,
      category: "performance",
      symbol: "XC / XD",
      nameAr: "شروط التعرض والديمومة",
      nameFr: "Classes d'exposition et durabilité",
      nameEn: "Exposure Classes & Durability",
      icon: Shield,
      color: "from-green-600 to-teal-700",
      descriptionAr: "البيئة المحيطة بالعنصر الخرساني (مثل رطوبة، أملاح كبريتات، تجمد، أو مياه بحر). تفرض حدوداً قصوى لنسبة الماء/الإسمنت وحدوداً دنيا لوزن الإسمنت لضمان عدم تآكل التسليح.",
      descriptionFr: "Les conditions d'agression environnementale (durabilité, carbonatation, sulfates) dictant des contraintes strictes sur le rapport E/C maximal.",
      currentValue: inputs.exposureClass || "X0 (بيئة عادية)"
    },
    {
      id: 16,
      category: "workability",
      symbol: "Air %",
      nameAr: "الهواء المحبوس داخل الخرسانة",
      nameFr: "Volume d'air occlus",
      nameEn: "Entrained / Trapped Air Content",
      icon: Wind,
      color: "from-sky-400 to-indigo-500",
      descriptionAr: "النسبة المئوية لحجم الفراغات الهوائية غير المقصودة أو المستحدثة بإضافات حوابس الهواء لزيادة مقاومة الصقيع. يجب خصم هذا الحجم من حصة حجم الركامات الإجمالي.",
      descriptionFr: "Le pourcentage volumique d'air occlus dans le béton frais pris en compte dans l'équation de fermeture des volumes absolus (1000 Litres).",
      currentValue: `${inputs.airContent}%`
    },
    {
      id: 17,
      category: "grading",
      symbol: "Pivot Point",
      nameAr: "المنحنى الحبيبي المرجعي ونقطة الانعطاف",
      nameFr: "Courbe de référence et point de brisure",
      nameEn: "Reference Grading Curve & Pivot",
      icon: GitBranch,
      color: "from-emerald-600 to-indigo-600",
      descriptionAr: "المنحنى المثالي المستهدف لخلط الركام. يتميز بنقطة انعطاف (Pivot Point) إحداثياتها (X, Y) تحسب رياضياً بناءً على Dmax ونوع الركام ونوع الإسمنت لضمان هيكل ممتلئ كثيف.",
      descriptionFr: "La courbe cible brisée de Dreux définie par un point de transition (X, Y) calculé pour optimiser l'empilement des grains et éliminer les vides.",
      currentValue: `X: ${results.pivotPoint?.x?.toFixed(1) || "5.0"} mm | Y: ${results.pivotPoint?.y?.toFixed(1) || "48"}%`
    },
    {
      id: 18,
      category: "grading",
      symbol: "K (Correction)",
      nameAr: "معامل التصحيح الهيكلي التجريبي",
      nameFr: "Coefficient de correction K de Dreux",
      nameEn: "K Structure Correction Factor",
      icon: Binary,
      color: "from-violet-600 to-pink-600",
      descriptionAr: "معامل تجريبي مأخوذ من جداول Dreux الكلاسيكية لتعديل نقطة الانعطاف Y بناءً على محتوى الإسمنت، شكل الركام، وطريقة دكه، والنعومة الإجمالية لضمان مطابقة الكثافة العظمى.",
      descriptionFr: "Le coefficient correctif K qui ajuste la hauteur du point de brisure pour compenser le dosage en ciment et le serrage effectif.",
      currentValue: results.compactorGamma !== undefined ? results.compactorGamma.toFixed(3) : "1.00"
    },
    {
      id: 19,
      category: "materials",
      symbol: "Admixtures",
      nameAr: "استعمال المضافات الكيميائية والمعدنية",
      nameFr: "Ajouts et adjuvants chimiques",
      nameEn: "Chemical & Mineral Admixtures",
      icon: FlaskConical,
      color: "from-rose-500 to-orange-500",
      descriptionAr: "الملدنات الفائقة، مؤخرات الشك، أو الإضافات المعدنية كغبار السيليكا. تسمح بتقليص ماء الخلط بنسب تصل إلى 30% مع الحفاظ على تشغيلية ممتازة لصب الخرسانة عالية المقاومة.",
      descriptionFr: "Les superplastifiants et fumées de silice permettant d'atteindre des performances extrêmes en réduisant drastiquement l'eau libre.",
      currentValue: `الملدن: ${inputs.dosageSuper}% | السيليكا: ${inputs.dosageSilicaFume}%`
    },
    {
      id: 20,
      category: "workability",
      symbol: "ρ_fresh",
      nameAr: "الكثافة المتوقعة للخرسانة الطازجة",
      nameFr: "Masse volumique du béton frais",
      nameEn: "Fresh Concrete Fresh Density",
      icon: Gauge,
      color: "from-indigo-600 to-slate-900",
      descriptionAr: "الكتلة الحجمية الإجمالية المتوقعة للمتر المكعب الطازج بعد الصب والدمك. تعكس نجاح التراص الحبيبي وتتراوح عادة بين 2300 إلى 2500 كجم/م³ للخرسانة العادية.",
      descriptionFr: "La densité théorique calculée du mélange frais, indicatrice directe de la compacité de la formule finale élaborée.",
      currentValue: `${Math.round(results.totalFreshDensity || 2400)} kg/m³`
    }
  ];

  const filteredParameters = parameters.filter(p => 
    activeCategory === "all" ? true : p.category === activeCategory
  );

  return (
    <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 space-y-6 text-right font-sans" id="dreux-gorisse-academic-portal">
      
      {/* Header and Core Banner */}
      <div className="bg-gradient-to-l from-indigo-700 to-indigo-900 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-full -translate-x-12 -translate-y-12 blur-xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-indigo-550/20 rounded-full translate-x-12 translate-y-12 blur-2xl pointer-events-none"></div>
        
        <div className="space-y-2 z-10 text-right flex-1">
          <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold font-mono tracking-wider float-right">
            <Sparkles size={12} className="text-amber-300" />
            <span className="ml-1">DREUX-GORISSE ACADEMIC EXPLORER</span>
          </div>
          <div className="clear-both"></div>
          <h2 className="text-xl md:text-2xl font-black">الدليل الأكاديمي الشامل لمنهجية Dreux-Gorisse</h2>
          <p className="text-xs text-indigo-100 max-w-2xl leading-relaxed">
            تعتمد طريقة <strong>درو–غوريس</strong> الفرنسية التجريبية على المبدأ الهندسي للحجم المطلق الكلي للمتر المكعب من الخرسانة (1000 لتر). نستعرض هنا كافة المدخلات والمتغيرات العشرين الحاكمة لهذه الطريقة المعتمدة بنظامنا.
          </p>
        </div>
        
        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col items-center justify-center z-10 min-w-[150px] shrink-0">
          <Award size={36} className="text-amber-300 mb-1" />
          <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest leading-none">20 PARAMETERS</span>
          <span className="text-xs font-black text-white mt-1">منظومة معايير الخلط</span>
        </div>
      </div>

      {/* Navigation Filter Buttons */}
      <div className="flex flex-wrap justify-start md:justify-end gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
        <button 
          onClick={() => setActiveCategory("all")}
          className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${activeCategory === "all" ? "bg-indigo-650 text-white shadow-sm" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50"}`}
        >
          الكل (20 مدخل)
        </button>
        <button 
          onClick={() => setActiveCategory("performance")}
          className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${activeCategory === "performance" ? "bg-indigo-650 text-white shadow-sm" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50"}`}
        >
          الأداء والمقاومة
        </button>
        <button 
          onClick={() => setActiveCategory("workability")}
          className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${activeCategory === "workability" ? "bg-indigo-650 text-white shadow-sm" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50"}`}
        >
          التشغيلية والقوام
        </button>
        <button 
          onClick={() => setActiveCategory("materials")}
          className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${activeCategory === "materials" ? "bg-indigo-650 text-white shadow-sm" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50"}`}
        >
          المواد والامتصاص
        </button>
        <button 
          onClick={() => setActiveCategory("grading")}
          className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${activeCategory === "grading" ? "bg-indigo-650 text-white shadow-sm" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50"}`}
        >
          التدرج والمنحنيات
        </button>
      </div>

      {/* Grid of parameters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredParameters.map((p, idx) => {
          const IconComponent = p.icon;
          const isExpanded = expandedParam === p.id;
          
          return (
            <div 
              key={p.id}
              className={`p-5 bg-white dark:bg-[#0F172A] border ${isExpanded ? "border-indigo-500 shadow-md ring-1 ring-indigo-500/10" : "border-slate-200 dark:border-[#1E293B]"} rounded-xl transition-all duration-200 flex flex-col justify-between`}
            >
              <div className="flex items-start gap-4 flex-row-reverse text-right">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${p.color} text-white shrink-0`}>
                  <IconComponent size={20} />
                </div>
                
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center justify-between flex-row-reverse">
                    <span className="font-mono text-xs font-black text-indigo-650 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full">
                      {p.symbol}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      معيار #{p.id}
                    </span>
                  </div>
                  
                  <h3 className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                    {p.nameAr}
                  </h3>
                  
                  <p className="text-[10px] text-slate-400 italic font-mono leading-none">
                    {p.nameFr}
                  </p>
                  
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed pt-1">
                    {isExpanded ? p.descriptionAr : `${p.descriptionAr.slice(0, 100)}...`}
                  </p>
                </div>
              </div>
              
              {/* Dynamic bound value display */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between flex-row-reverse text-xs">
                <div className="flex items-center gap-1.5 flex-row-reverse">
                  <span className="text-[10px] text-slate-400 font-bold">القيمة الحالية في خلطتك:</span>
                  <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-black bg-emerald-50 dark:bg-emerald-950/25 px-2.5 py-1 rounded-md border border-emerald-500/10">
                    {p.currentValue}
                  </strong>
                </div>
                
                <button 
                  onClick={() => setExpandedParam(isExpanded ? null : p.id)}
                  className="text-[10px] font-extrabold text-indigo-650 hover:text-indigo-500 dark:text-indigo-400 flex items-center gap-1 flex-row-reverse cursor-pointer"
                >
                  <Eye size={12} />
                  <span>{isExpanded ? "عرض أقل" : "قراءة المزيد"}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Core Methodology Math Section */}
      <div className="bg-slate-100 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-end gap-1.5">
          <FileText size={14} className="text-indigo-500" />
          <span>المعادلة المرجعية وطريقة الحجوم المطلقة</span>
        </h4>
        
        <div className="text-center p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-250 dark:border-slate-800/80">
          <p className="text-xs text-slate-500 mb-2">معادلة الحجم الكلي المغلق للمتر المكعب الواحد (1 m³):</p>
          <div className="inline-block bg-slate-50 dark:bg-slate-950 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-sm font-black text-indigo-600 dark:text-indigo-400">
            {"V_cement + V_water + V_aggregates + V_air = 1000 Liters"}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 text-[10px] text-slate-500">
            <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded border border-slate-100 dark:border-slate-800">
              <span className="block font-bold text-slate-700 dark:text-slate-300">الإسمنت (C)</span>
              <span>C / ρ_c</span>
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded border border-slate-100 dark:border-slate-800">
              <span className="block font-bold text-slate-700 dark:text-slate-300">الماء الفعّال (E)</span>
              <span>E / 1.0</span>
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded border border-slate-100 dark:border-slate-800">
              <span className="block font-bold text-slate-700 dark:text-slate-300">الركام الصلب (S + G)</span>
              <span>(S / ρ_s) + (G / ρ_g)</span>
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded border border-slate-100 dark:border-slate-800">
              <span className="block font-bold text-slate-700 dark:text-slate-300">الهواء المحبوس (A)</span>
              <span>Air % * 10</span>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 leading-relaxed">
          إن الدقة المتناهية التي يوفرها محرك حساب درو-غوريس ترتكز على إيجاد منحنى التدرج الحبيبي التراكمي الفعلي ومطابقته لمنحنى درو المرجعي المنكسر عند نقطة الانعطاف (Pivot Point) المحسوبة لكل خلطة، مما يضمن خرسانة بلا فراغات داخلية وبأعلى كثافة ممكنة للتحمل.
        </p>
      </div>

    </div>
  );
};
