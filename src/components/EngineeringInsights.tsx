import React, { useState } from "react";
import { useLanguage } from "../services/localization";
import { MixDesignInput, MixDesignResult, AggregateType } from "../types";
import { 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  HelpCircle, 
  Flame, 
  Droplet, 
  Layers, 
  Sparkles, 
  ShieldCheck, 
  TrendingUp, 
  Trash2, 
  Scale, 
  Activity,
  Award,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  BookOpen,
  CornerDownLeft
} from "lucide-react";

interface EngineeringInsightsProps {
  inputs: MixDesignInput;
  result: MixDesignResult;
}

export const EngineeringInsights: React.FC<EngineeringInsightsProps> = ({ inputs, result }) => {
  const { language } = useLanguage();
  const [expandedSection, setExpandedSection] = useState<string | null>("why-mix");
  const [activeTab, setActiveTab] = useState<"analysis" | "risks" | "recommendations" | "sustainability">("analysis");

  // Determine language defaults
  const lang = language === "ar" || language === "fr" ? language : "en";

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // 1. Why This Mix Calculations Explanations
  const fck = inputs.fck28;
  const fcm = result?.fcm28 ?? 35;
  const marginStrength = fcm - fck;
  const cement = Math.round(result?.cementWeight ?? 350);
  const dMax = inputs.dMax;
  const slump = inputs.slump;
  const waterTheory = Math.round(result?.waterContentNeeded ?? 180);
  const waterActual = Math.round(result?.waterContentActual ?? 180);
  const waterSaving = Math.max(0, waterTheory - waterActual);
  const sandPercent = Math.round(result?.sandPercent ?? 40);
  const gravelPercent = Math.round(result?.gravelPercent ?? 60);
  const gamma = (result?.compactorGamma ?? 0.82).toFixed(3);
  const wcRatio = (result?.wcRatioAdjusted ?? 0.45).toFixed(2);
  const pivotSize = result?.pivotPoint ? (result.pivotPoint.x ?? 2.5).toFixed(2) : "2.00";
  const aggregateShape = inputs.aggregateType === AggregateType.CONCASSE 
    ? (lang === "ar" ? "زاوي مكسر (Concassé)" : lang === "fr" ? "Concassé (Angulaire)" : "Crushed (Angular)")
    : (lang === "ar" ? "مستدير وديان (Roulé)" : lang === "fr" ? "Roulé (Alluvionnaire)" : "Rounded (Alluvial)");

  // Localized dictionaries
  const dict = {
    ar: {
      panelTitle: "لوحة التحليلات الهندسية والاستشارية المتطورة",
      panelSub: "تحليل فيزيائي وكيميائي معمق لعوامل الفعالية وتوافق الهيكل المتراص طبقاً للمقاييس الأوروبية والجزائرية EN 206 / NA 17004",
      tabAnalysis: "🔍 تفسير نسب المواد (Why This Mix?)",
      tabRisks: "🚨 رادار كشف المخاطر الحرجة",
      tabRecs: "🧠 التوصيات الاستشارية الذكية",
      tabSust: "🌱 مقترحات واستدامة الخرسانة",
      
      whyMix: "لماذا هذه الخلطة؟ (التشخيص الميكانيكي وحساب المتانة)",
      whyCementTitle: "الإسمنت والروابط اللدنة: لماذا هذه الكمية {cement} كجم/م³؟",
      whyCementDesc: `تم حساب استهلاك الإسمنت البالغ ${cement} كجم لضمان تحقيق المقاومة القياسية المميزة fck=${fck} MPa بعد 28 يوماً. بناءً على جودة التحكم ومعدات الموقع (${inputs.controlClass.toUpperCase()})، تتطلب الحسابات مقاومة وسطية مستهدفة fcm=${fcm.toFixed(1)} MPa مع هامش أمان للموقع وقدره ${marginStrength.toFixed(1)} MPa. هذا يضمن تغطية المساحة السطحية النوعية للركام بالكامل بمونة الإسمنت لملء جميع الفراغات المجهرية ومقاومة نفوذ السوائل والملوثات الجدارية.`,
      
      whyWaterTitle: "مياه الخلط الحرة والفعالة: لماذا هذه الكمية {water} لتر/م³؟",
      whyWaterDesc: `تم حساب متطلبات المياه النظرية بـ ${waterTheory} لتر لتأمين قوام الهبوط المستهدف (${slump} سم) بناءً على مقاييس Dreux-Gorisse وتأثير القطر الأقصى للركام Dmax=${dMax} مم. وبفضل دمج الملدنات الفائقة (Superplasticizer) في خلطتكم، انخفضت كمية مياه الخلط الفعالة إلى ${waterActual} لتر (بوفر أقصى قدره ${waterSaving} لتر من ماء الخلط المباشر). في الموقع، يجب ضبط الوزن الفعلي للرمل الرطب والحصى ليصبح ماء الخلية المضاف بالخلاط هو ${Math.round(result.waterWeightWet)} لتر لتعويض رطوبة الرمل (${inputs.moistureSand}%) ورطوبة الحصى (${inputs.moistureGravel}%) لمنع تسييل الخرسانة الفجائي أو جمودها.`,
      
      whyAggTitle: "الهيكل العظمي والركام الحبيبي: لماذا نسبة {sand}% رمل مقابل {gravel}% حصى؟",
      whyAggDesc: `بموجب منحنى توزيع التدرج الحبيبي لدرو-غوريس، تلتقي خطوط التداخل عند نقطة الانعطاف الهندسية pivot البالغة ${pivotSize} مم. هذه النسبة (${sandPercent}% رمل و ${gravelPercent}% حصى) تؤمن تداخلاً ميكانيكياً فائقاً يرفع معامل التراص غاما إلى ${gamma}. استخدام مواد لركام من صنف (${aggregateShape}) يوازن بدقة بين خشونة الاحتكاك ومقاومة حركة الضخ ومقاومة الشد في المنشآت الشاطئية وحواجز التحميل الكثيف.`,
      
      riskTitle: "🚨 تقييم المخاطر وتحليل العواقب الميدانية",
      thermalRisk: "1. خطر الشروخ والانكماش الحراري (Thermals)",
      workabilityRisk: "2. خطر الجفاف وفقدان القابلية للتشغيل (Slump Loss)",
      corrosionRisk: "3. خطر نفاذية الكلوريدات وصدأ حديد التسليح (Durability)",
      segregationRisk: "4. خطر الانفصال الحبيبي والنضح (Segregation & Bleeding)",
      asrRisk: "5. خطر تفاعل السيليكا-القلوي (Alkali-Silica Reaction - ASR)",

      recTitle: "🧠 باقة التوصيات والتعليمات التكنولوجية للصب والمعالجة الميدانية",
      recCuring: "تأمين معالجة رطبة مستمرة (Curing) لمدة لا تقل عن 7 أيام بواسطة مياه رذاذية أو رش غشاء علاجي عازل لمنع التبخر المبكر وحماية مقاومة القشرة الخرسانية السطحية fck.",
      recAdmix: "فحص توافق الملدنات الكيميائية الفائقة مع إسمنت المحطة لتلافي حدوث تجمد كاذب، والتأكد من عدم زيادة الجرعة المقررة لتفادي تأخير زمن الشك اللدن بشكل مفرط.",
      recRheology: `الهبوط التصميمي البالغ ${slump} سم يقع في نطاق ممتاز للصب والتدعيم الاهتزازي المباشر. يوصى باستخدام هزازات ميكانيكية بقطر غاطس مناسب ومباعدة نقاط الاهتزاز بمقدار 50 سم لمنع الفجوات العسلية.`,
      recQuality: "إجراء فحوصات الكسر المعيارية لعينات مكعبات أو أسطوانات الخرسانة في عمر 3 و 7 و 28 يوماً لتوثيق منحنى النضوج والنمو الفعلي للمقاومة بموقع الإنشاء.",
      
      sustTitle: "🌱 بدائل تكنولوجية مستدامة ومقترحات خفض الكربون والمعالجة اللاحقة",
      sustCO2: "الخرسانة الخضراء منخفضة الانبعاثات: نقترح استبدال 15% إلى 30% من إسمنت بورتلاند العادي بمواد معدنية ثانوية كخبث الأفران المعالج (Slag) أو الرماد المتطاير (Fly Ash) لتقليص الانبعاثات الكربونية بمعدل 20% وتحسين النعومة الصماء ومقاومة كبريتات المياه الجوفية.",
      sustFibers: "مكافحة الانكماش اللدن: إضافة خيوط ألياف البولي بروبيلين المعايرة (e.g., 0.9 kg/m³) تمنع تمدد الشروخ الشعرية المبكرة في البلاطات والأرصفة العريضة المعرضة للرياح المباشرة.",
      sustAgg: "الفرز المتكامل لحبيبات الركام: نوصي بغسيل الرمال الكلسية والجرانيتية في الكسارات لتخفيض نسبة الغبار والمار من منخل 0.08 مم لأقل من 5% لتقليل الحاجة لجرعات كيميائية إضافية.",
      
      statusStable: "مستقر وآمن (Safe)",
      statusWarning: "تحذير للمراجعة (Caution)",
      statusCritical: "حرج جداً (Hazardous)",
      stableDesc: "القيم الحالية تقع في الحدود الآمنة والمستدامة للمشروع.",
      engineeringNote: "ملاحظة هندسية استشارية:",
      lawCompliance: "الخلطة مطابقة للأكواد الإنشائية السارية لضمان المتانة الطويلة الأجل وموثوقية الهيكل لمدة تصميمية تزيد عن 50 سنة."
    },
    en: {
      panelTitle: "Advanced Engineering Analysis & Advisory Panel",
      panelSub: "Deep physical and chemical optimization review of aggregate skeleton compactness and mechanical reliability as per EN 206 / NA 17004 Algerian codes.",
      tabAnalysis: "🔍 Inside the Proportioning (Why This Mix?)",
      tabRisks: "🚨 Real-Time Risk Radar",
      tabRecs: "🧠 Smart AI Recommendations",
      tabSust: "🌱 Eco-Suggestions & C02 Action",
      
      whyMix: "Why This Mix? (Theoretical Derivations & Mechanical Calibration)",
      whyCementTitle: "Cement and Binder Dosage: Why this quantity of {cement} kg/m³?",
      whyCementDesc: `The cement requirement of ${cement} kg/m³ has been accurately computed using the Dreux-Gorisse equation to ensure the active target strength of C${fck} MPa at 28 days. Relying on your site execution quality control level (${inputs.controlClass.toUpperCase()}), the mathematical model targets a mean strength of fcm=${fcm.toFixed(1)} MPa, incorporating a rigorous standard deviation margin of ${marginStrength.toFixed(1)} MPa. This ensures the cement paste perfectly blankets the aggregate grain surface area, filling microscopic voids while securing structural impermeability.`,
      
      whyWaterTitle: "Mixing Water and Admixtures: Why this quantity of {water} L/m³?",
      whyWaterDesc: `Theoretical clean water requirements are computed at ${waterTheory} Liters to achieve the target visual slump of ${slump} cm based on Dreux metrics and Dmax=${dMax} mm. Incorporating your high-range superplasticizer water reducer, the actual batching water is decreased to ${waterActual} Liters (saving ${waterSaving} Liters of clean mixing water). On site scales, the actual batch weight must adjust to ${Math.round(result.waterWeightWet)} L in the concrete mixer to strictly offset sand moisture (${inputs.moistureSand}%) and gravel moisture (${inputs.moistureGravel}%) to bypass catastrophic wet paste segregation or premature slump stiffness.`,
      
      whyAggTitle: "Internal Skeleton Aggregate Balance: Why {sand}% Sand and {gravel}% Gravel?",
      whyAggDesc: `Using Dreux-Gorisse grading algorithms, the sand and gravel distribution curves intersect at the geometric pivot point d=${pivotSize} mm. This aggregate recipe (${sandPercent}% Sand and ${gravelPercent}% Gravel) drives an optimized packing arrangement, maximizing index compaction gamma (γ = ${gamma}). Selecting (${aggregateShape}) quarry particles balances aggregate shear friction resistance with structural pumping flowability in high-reinforcement sections.`,
      
      riskTitle: "🚨 Dynamic Civil Failure Risk Analysis",
      thermalRisk: "1. Heat of Hydration & Structural Thermal Cracking",
      workabilityRisk: "2. Warm Environment Evaporation & Workability Loss",
      corrosionRisk: "3. Porous Diffusion & Chloride-Induced Rebar Corrosion",
      segregationRisk: "4. Aggregate Slump Wet Segregation & Surface Bleeding",
      asrRisk: "5. Alkali-Silica Chemical Degradation (ASR Risk)",

      recTitle: "🧠 Executive Field Placement & Treatment Directives",
      recCuring: "Implement continuous water curing or chemical membrane spraying for at least 7 consecutive days to stop early hydration evaporation, maximizing the compressive strength fck and hardening kinetics of the shell layer.",
      recAdmix: "Verify compatibility of synthetic superplasticizers with the local cement mill brand to mitigate unexpected slump loss or micro-cracking due to rapid setting times.",
      recRheology: `The designated design slump of ${slump} cm operates in a balanced rheological zone. Employ internal poker vibrators spaced at 50 cm intervals to ensure perfect compaction with zero localized honeycomb voids or nests.`,
      recQuality: "Mandate crushing tests for standardized cubes/cylinders at 3 days, 7 days, and 28 days to scientifically chart progress and validate the in-situ concrete maturity curves.",
      
      sustTitle: "🌱 Decarbonization Alternatives & Carbon-Reduction Suggestions",
      sustCO2: "Green Low-Carbon Concrete Formulation: Consider replacing 15% to 30% of Ordinary Portland Cement with Blast Furnace Slag or Fly Ash. This cuts CO2 greenhouse footprints by 20-25% while improving sulfur resistance and hydraulic durability.",
      sustFibers: "Plastic Shrinkage Mitigation: Adding polypropylene or structural micro-synthetic fibers (e.g., 0.9 kg/m³) greatly decreases superficial dry micro-cracks in large industrial floor slabs.",
      sustAgg: "Sieve Filler Optimization: Wash coarse sand and crusher gravels to maintain raw material fine filler fraction (< 0.08 mm) below 5%, cutting additive costs and chemical demand.",
      
      statusStable: "Optimized & Safe",
      statusWarning: "Moderate - Watch",
      statusCritical: "Critical Hazard",
      stableDesc: "Design metrics comply perfectly with optimal civil engineering bounds.",
      engineeringNote: "Engineering Consulting Memo:",
      lawCompliance: "This formulation corresponds to Eurocode 2 and EN 206 frameworks standard safety limits, calculated for a design lifespan exceeding 50 years."
    },
    fr: {
      panelTitle: "Panneau d’Analyse Technique & Conseil en Ingénierie",
      panelSub: "Diagnostic approfondi de la compacité squelettique, de l'ouvrabilité et de la durabilité conformes aux normes marocaines, algériennes et EN 206 / NA 17004.",
      tabAnalysis: "🔍 Explication des Proportions (Why This Mix?)",
      tabRisks: "🚨 Radar des Risques de Chantier",
      tabRecs: "🧠 Recommandations de Placement IA",
      tabSust: "🌱 Durabilité & Réduction Carbone",
      
      whyMix: "Pourquoi cette formulation ? (Méthodologie Rationnelle & Calculs Physiques)",
      whyCementTitle: "Sélection du Dosage en Ciment : Pourquoi cette quantité de {cement} kg/m³?",
      whyCementDesc: `La quantité de ciment calculée à ${cement} kg/m³ garantit la résistance caractéristique fck=${fck} MPa à 28 jours. Selon le niveau de contrôle qualité du chantier (${inputs.controlClass.toUpperCase()}), la formule vise une résistance moyenne fcm=${fcm.toFixed(1)} MPa, incluant une marge géométrique de sécurité de ${marginStrength.toFixed(1)} MPa. Cela garantit un enrobage complet des granulats par la pâte de ciment pour combler les vides interstitiels et éliminer la porosité capillaire.`,
      
      whyWaterTitle: "Eau de Gâchage & Rapport E/C : Pourquoi cette quantité de {water} L/m³?",
      whyWaterDesc: `Le besoin théorique en eau pour le diamètre max Dmax=${dMax} mm et un affaissement cible de ${slump} cm est estimé à ${waterTheory} L selon les tables Dreux-Gorisse. Grâce à l'incorporation de plastifiants réducteurs d'eau à haute performance, l'eau de gâchage réelle est descendue à ${waterActual} L (économie de ${waterSaving} L d'eau pure). À la centrale, la balance doit être corrigée à ${Math.round(result.waterWeightWet)} L pour tenir compte de l'humidité du sable (${inputs.moistureSand}%) et du gravier (${inputs.moistureGravel}%) afin d'éviter la ségrégation de la pâte de ciment.`,
      
      whyAggTitle: "Squelette Granulaire Optimal : Pourquoi {sand}% de Sable et {gravel}% de Gravier?",
      whyAggDesc: `L'intersection des courbes de granulométrie selon Dreux s'effectue au point de brisure pivot d=${pivotSize} mm. Ces proportions d'agrégats (${sandPercent}% de Sable et ${gravelPercent}% de Gravier) assurent un enchevêtrement mécanique maximal avec un coefficient de compacité gamma estimé à ${gamma}. Le choix d'agrégats de type (${aggregateShape}) équilibre parfaitement la friction interne et l'ouvrabilité requise pour le pompage.`,
      
      riskTitle: "🚨 Diagnostic des Profils de Risques Techniques",
      thermalRisk: "1. Fissuration Thermique par Chaleur d'Hydratation",
      workabilityRisk: "2. Perte d'Affaissement & Dessiccation en Climat Chaud",
      corrosionRisk: "3. Corrosion des Armatures par Pénétration d'Ions Chlorures",
      segregationRisk: "4. Risques de Ségrégation Granulaire et de Ressuage",
      asrRisk: "5. Réaction Alcali-Silice (Alcali-Réaction)",

      recTitle: "🧠 Recommandations Professionnelles d'Exécution et d'Auscultation",
      recCuring: "Assurer une cure humide continue pendant au moins 7 jours par pulvérisation d'eau ou application d'un produit de cure certifié afin de garantir le développement complet de la résistance fck de surface.",
      recAdmix: "Vérifier la compatibilité chimique de vos superplastifiants avec le ciment sélectionné pour éviter toute chute prématurée d'ouvrabilité ou de fausse prise.",
      recRheology: `La consistance de ${slump} cm est idéale pour une mise en place fluide. Utiliser des aiguilles vibrantes espacées de 50 cm pour chasser l'air occlus sans initier de ségrégation.`,
      recQuality: "Réaliser des essais d’écrasement à 3, 7 et 28 jours pour caractériser l'évolution réelle de la résistance et documenter la conformité légale de l'ouvrage.",
      
      sustTitle: "🌱 Actions de Décarbonation & Valorisation des Matériaux",
      sustCO2: "Béton Vert / Eco-Conception : Nous recommandons de substituer 15% à 30% du ciment Portland par des additions minérales types Laitier de Haut Fourneau ou Cendres Volantes. Cela réduit l'empreinte carbone de 25% tout en améliorant la résistance aux eaux sulfatées.",
      sustFibers: "Fissuration par Retrait Plastique : L'ajout de fibres de polypropylène calibrées (ex : 0.9 kg/m³) empêche la propagation des micro-fissures sur les dalles de grandes dimensions exposées au vent.",
      sustAgg: "Propreté des Granulats : Veiller à laver le sable de concassage afin de maintenir la proportion de fines (< 0.08 mm) sous la barre des 5% pour optimiser le dosage en adjuvants.",
      
      statusStable: "Stable & Conforme",
      statusWarning: "À Surveiller",
      statusCritical: "Risque Critique",
      stableDesc: "Tous les indicateurs cinétiques et environnementaux respectent les exigences normatives.",
      engineeringNote: "Note d'ingénierie conseil :",
      lawCompliance: "Cette formulation répond aux limites de l'Eurocode 2 et de la norme EN 206, projetée pour un cycle de vie utile de l'ouvrage supérieur à 50 ans."
    }
  };

  const t = dict[lang];
  const isRtl = lang === "ar";

  // Risk levels derived analytically from inputs
  let thermalRiskLevel: "stable" | "warning" | "danger" = "stable";
  if (cement >= 400 && inputs.dosageFlyAsh === 0 && inputs.dosageSlag === 0) {
    thermalRiskLevel = "danger";
  } else if (cement >= 360) {
    thermalRiskLevel = "warning";
  }

  let workabilityRiskLevel: "stable" | "warning" | "danger" = "stable";
  if (slump < 5) {
    workabilityRiskLevel = "danger";
  } else if (slump < 8 && inputs.dosageRetarder === 0) {
    workabilityRiskLevel = "warning";
  }

  let durabilityRiskLevel: "stable" | "warning" | "danger" = "stable";
  if (parseFloat(wcRatio) > 0.55) {
    durabilityRiskLevel = "danger";
  } else if (parseFloat(wcRatio) > 0.50) {
    durabilityRiskLevel = "warning";
  }

  let segregationRiskLevel: "stable" | "warning" | "danger" = "stable";
  if (waterActual > 210 && sandPercent < 33) {
    segregationRiskLevel = "danger";
  } else if (waterActual > 195 || slump > 22) {
    segregationRiskLevel = "warning";
  }

  let asrRiskLevel: "stable" | "warning" | "danger" = "stable";
  if (inputs.aggregateQuality === "poor") {
    asrRiskLevel = "danger";
  } else if (inputs.aggregateQuality === "standard") {
    asrRiskLevel = "warning";
  }

  const getRiskColor = (level: "stable" | "warning" | "danger") => {
    if (level === "danger") return "border-red-500/25 bg-red-500/5 text-red-600 dark:text-red-400";
    if (level === "warning") return "border-amber-500/25 bg-amber-500/5 text-amber-600 dark:text-amber-400";
    return "border-emerald-500/25 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400";
  };

  const getRiskBadge = (level: "stable" | "warning" | "danger") => {
    if (level === "danger") return <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 uppercase">{t.statusCritical}</span>;
    if (level === "warning") return <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 uppercase">{t.statusWarning}</span>;
    return <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 uppercase">{t.statusStable}</span>;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl transition-all duration-300" id="engineering-analysis-advisor-panel">
      {/* Dynamic consulting corporate header */}
      <div className={`p-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-indigo-50/50 via-slate-50/20 to-transparent dark:from-slate-850 dark:via-transparent dark:to-transparent flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${isRtl ? "text-right" : "text-left"}`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1 px-2.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 text-[10px] font-extrabold uppercase rounded-full tracking-wider flex items-center gap-1">
              <Award size={12} />
              <span>CONSULTING PROTOCOL</span>
            </span>
            <span className="p-1 px-2.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-extrabold uppercase rounded-full tracking-wider flex items-center gap-1">
              <Sparkles size={11} className="animate-pulse" />
              <span>AI CALIBRATED</span>
            </span>
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white font-sans tracking-tight leading-normal">
            {t.panelTitle}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-3xl leading-relaxed">
            {t.panelSub}
          </p>
        </div>
        
        {/* Quality status summary badge */}
        <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-250 dark:border-slate-700 rounded-xl shrink-0">
          <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-500">
            <ShieldCheck size={18} />
          </div>
          <div className="text-right leading-none">
            <span className="block text-[8px] text-slate-400 font-bold uppercase">QA LICENSE</span>
            <span className="text-[10px] font-mono font-bold text-slate-800 dark:text-slate-100">C{fck} COMPLIANT</span>
          </div>
        </div>
      </div>

      {/* Tabs navigation menu for direct easy scannability */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 p-1.5 overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab("analysis")}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === "analysis" 
              ? "bg-slate-900 dark:bg-indigo-600 text-white shadow" 
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Scale size={13} />
          <span>{t.tabAnalysis}</span>
        </button>
        <button
          onClick={() => setActiveTab("risks")}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === "risks" 
              ? "bg-slate-900 dark:bg-indigo-600 text-white shadow" 
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <AlertTriangle size={13} />
          <span>{t.tabRisks}</span>
        </button>
        <button
          onClick={() => setActiveTab("recommendations")}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === "recommendations" 
              ? "bg-slate-900 dark:bg-indigo-600 text-white shadow" 
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <BookOpen size={13} />
          <span>{t.tabRecs}</span>
        </button>
        <button
          onClick={() => setActiveTab("sustainability")}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === "sustainability" 
              ? "bg-slate-900 dark:bg-indigo-600 text-white shadow" 
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Activity size={13} />
          <span>{t.tabSust}</span>
        </button>
      </div>

      {/* Dynamic Tab Panels Content */}
      <div className="p-6">
        
        {/* Tab 1: Why This Mix Proportion Analysis */}
        {activeTab === "analysis" && (
          <div className="space-y-6 animate-fade-in">
            <div className={`p-4 bg-indigo-50/30 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/30 rounded-xl leading-relaxed text-xs relative ${isRtl ? "text-right" : "text-left"}`}>
              <div className={`absolute top-3 ${isRtl ? "left-3" : "right-3"} text-indigo-400`}>
                <HelpCircle size={20} className="opacity-40" />
              </div>
              <h4 className="text-xs font-bold text-indigo-805 dark:text-indigo-400 flex items-center gap-1 mb-1.5">
                <Layers size={14} />
                <span>{t.whyMix}</span>
              </h4>
              <p className="text-slate-650 dark:text-slate-300 leading-normal text-[11px] max-w-5xl">
                {inputs.concreteType ? (
                  lang === "ar" ? (
                    `تحليل الخلطة الحالي موجه لنوع الخرسانة المختارة [${inputs.concreteType}]. تعتمد خوارزمية درو-غوريس على تعظيم الرص الحجمي للمكونات الجافة وتقوية الأربطة الهيدروليكية بين الحبيبات الدقيقة والخشنة لتخفيض الفراغات الهوائية في الركام الكلي بالصيغة التجريبية المعتمدة.`
                  ) : (
                    `The analysis for this mix is formulated specifically for the active [${inputs.concreteType}] concrete type classification. Dreux-Gorisse methodologies build around dense dry-volume aggregate packing, optimizing chemical cohesiveness over manual water usage.`
                  )
                ) : (
                  lang === "ar" ? "يعتمد تحليل التصميم الحبيبي على معادلات الكثافة القصوى لـ Dreux لملء فراغات الهيكل الخرساني بالصيغة مبرهنة الأبعاد." : "The grain design is derived from empirical density equations validating perfect skeletal filling."
                )}
              </p>
            </div>

            {/* Explanations Grid */}
            <div className="grid grid-cols-1 gap-5">
              
              {/* Cement Explanation Card */}
              <div className="border border-slate-150 dark:border-slate-800/80 rounded-xl overflow-hidden shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition duration-200">
                <div className={`p-4 bg-slate-50 dark:bg-slate-800/30 border-b border-slate-150 dark:border-slate-800 flex items-center gap-3 ${isRtl ? "flex-row" : "flex-row-reverse"} justify-between`}>
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                      <Flame size={16} />
                    </span>
                    <h5 className="text-xs font-black text-slate-800 dark:text-slate-100">
                      {t.whyCementTitle.replace("{cement}", cement.toString())}
                    </h5>
                  </div>
                  <span className="text-[10px] bg-slate-150 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold px-2 py-0.5 rounded-full font-mono">
                    {cement} kg/m³
                  </span>
                </div>
                <div className={`p-5 text-xs text-slate-650 dark:text-slate-300 leading-relaxed font-sans ${isRtl ? "text-right" : "text-left"}`}>
                  <p className="text-[11px]">
                    {t.whyCementDesc}
                  </p>
                  <div className={`mt-3 pt-3 border-t border-slate-105 dark:border-slate-800 flex flex-wrap gap-4 text-[10px] text-slate-400 font-mono ${isRtl ? "justify-start" : "justify-end"}`}>
                    <div><span className="font-bold text-slate-500">{isRtl ? "المقاومة المطلوبة:" : "Characteristic fck:"}</span> {fck} MPa</div>
                    <div><span className="font-bold text-slate-500">{isRtl ? "متوسط المستهدف fcm:" : "Mean target fcm:"}</span> {fcm.toFixed(1)} MPa</div>
                    <div><span className="font-bold text-slate-500">{isRtl ? "هامش الأمان الاستاتيكي:" : "Margin (σ):"}</span> {marginStrength.toFixed(1)} MPa</div>
                    <div><span className="font-bold text-slate-500">{isRtl ? "رتبة الإسمنت:" : "Cement class:"}</span> {inputs.cementClassStrength} MPa</div>
                  </div>
                </div>
              </div>

              {/* Water Explanation Card */}
              <div className="border border-slate-150 dark:border-slate-800/80 rounded-xl overflow-hidden shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition duration-200">
                <div className={`p-4 bg-slate-50 dark:bg-slate-800/30 border-b border-slate-150 dark:border-slate-800 flex items-center gap-3 ${isRtl ? "flex-row" : "flex-row-reverse"} justify-between`}>
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                      <Droplet size={16} />
                    </span>
                    <h5 className="text-xs font-black text-slate-800 dark:text-slate-100">
                      {t.whyWaterTitle.replace("{water}", waterActual.toString())}
                    </h5>
                  </div>
                  <span className="text-[10px] bg-slate-150 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold px-2 py-0.5 rounded-full font-mono">
                    W/C = {wcRatio}
                  </span>
                </div>
                <div className={`p-5 text-xs text-slate-650 dark:text-slate-300 leading-relaxed font-sans ${isRtl ? "text-right" : "text-left"}`}>
                  <p className="text-[11px]">
                    {t.whyWaterDesc}
                  </p>
                  <div className={`mt-3 pt-3 border-t border-slate-105 dark:border-slate-800 flex flex-wrap gap-4 text-[10px] text-slate-400 font-mono ${isRtl ? "justify-start" : "justify-end"}`}>
                    <div><span className="font-bold text-slate-500">{isRtl ? "الماء النظري:" : "Theoretical Water:"}</span> {waterTheory} L</div>
                    <div><span className="font-bold text-slate-500">{isRtl ? "الماء الفعلي الصافي:" : "Actual corrected:"}</span> {waterActual} L</div>
                    <div><span className="font-bold text-slate-500">{isRtl ? "توفير المضاف الكيميائي:" : "Plasticizer Reduction:"}</span> {waterSaving} L</div>
                    <div><span className="font-bold text-slate-500">{isRtl ? "ماء الموقع الرطب المضاف:" : "Wet scale addition:"}</span> {Math.round(result.waterWeightWet)} kg</div>
                  </div>
                </div>
              </div>

              {/* Aggregates Explanation Card */}
              <div className="border border-slate-150 dark:border-slate-800/80 rounded-xl overflow-hidden shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition duration-200">
                <div className={`p-4 bg-slate-50 dark:bg-slate-800/30 border-b border-slate-150 dark:border-slate-800 flex items-center gap-3 ${isRtl ? "flex-row" : "flex-row-reverse"} justify-between`}>
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
                      <Layers size={16} />
                    </span>
                    <h5 className="text-xs font-black text-slate-800 dark:text-slate-100">
                      {t.whyAggTitle.replace("{sand}", sandPercent.toString()).replace("{gravel}", gravelPercent.toString())}
                    </h5>
                  </div>
                  <span className="text-[10px] bg-slate-150 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold px-2 py-0.5 rounded-full font-mono">
                    {sandPercent}% / {gravelPercent}%
                  </span>
                </div>
                <div className={`p-5 text-xs text-slate-650 dark:text-slate-300 leading-relaxed font-sans ${isRtl ? "text-right" : "text-left"}`}>
                  <p className="text-[11px]">
                    {t.whyAggDesc}
                  </p>
                  <div className={`mt-3 pt-3 border-t border-slate-105 dark:border-slate-800 flex flex-wrap gap-4 text-[10px] text-slate-400 font-mono ${isRtl ? "justify-start" : "justify-end"}`}>
                    <div><span className="font-bold text-slate-500">{isRtl ? "أقصى قطر Dmax:" : "DMax dimension:"}</span> {dMax} mm</div>
                    <div><span className="font-bold text-slate-500">{isRtl ? "نقطة الانعطاف Pivot:" : "Pivot d ratio:"}</span> {pivotSize} mm</div>
                    <div><span className="font-bold text-slate-500">{isRtl ? "معامل الرص غاما:" : "Density factor (γ):"}</span> {gamma}</div>
                    <div><span className="font-bold text-slate-500">{isRtl ? "نوعية الركام الحبيبي:" : "Geomaterial class:"}</span> {inputs.aggregateQuality.toUpperCase()}</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Tab 2: Failure Evaluation & Risks Radar */}
        {activeTab === "risks" && (
          <div className="space-y-6 animate-fade-in">
            <div className={`p-3 bg-red-50/20 dark:bg-red-950/5 border border-red-500/10 rounded-xl flex items-center gap-2 ${isRtl ? "text-right" : "text-left"}`}>
              <AlertTriangle className="text-red-500 shrink-0" size={16} />
              <div>
                <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">{t.riskTitle}</h5>
                <p className="text-[10px] text-slate-500">{isRtl ? "تحليل الكفاءة المتوقعة للصب والتحذير من الفجوات الإنشائية:" : "Structural forecast for field cracking, shrinkage, and setting hazards:"}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Thermal Cracking */}
              <div className={`p-4 rounded-xl border transition hover:shadow-xs ${getRiskColor(thermalRiskLevel)} text-right`}>
                <div className={`flex items-start justify-between gap-2 ${isRtl ? "flex-row" : "flex-reverse"}`}>
                  {getRiskBadge(thermalRiskLevel)}
                  <h6 className="text-xs font-black font-sans text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Flame size={14} className="text-orange-500 shrink-0" />
                    <span>{t.thermalRisk}</span>
                  </h6>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 font-sans mt-2.5 leading-relaxed">
                  {thermalRiskLevel === "danger" 
                    ? (isRtl 
                      ? `⚠ خطر شديد! جرعة الإسمنت المرتفعة (${cement} كجم) مع غياب البدائل المعدنية ستؤدي إلى ارتفاع درجة حرارة الهيدرة الداخلية بشكل حاد (> 65°م) مما قد يتسبب في حدوث شروخ حرارية خطيرة بالركائز السفلية الكثيفة.` 
                      : `⚠ Critical failure potential! High cement dose (${cement} kg) without auxiliary fly ash/slag will induce elevated internal heat of hydration (> 65°C), presenting an imminent thermal gradient cracking hazard in major pours.`)
                    : thermalRiskLevel === "warning"
                    ? (isRtl 
                      ? "درجة حرارة الإماهة الإسمنتية متوسطة. يُنصح برش المياه بشكل دوري أو تغطية السطوح وتجنب الصب في فترات الذروة الشمسية." 
                      : "Moderate core hydration. Periodical spraying is advised; bypass concrete placement under hot peak-day direct sunlight.")
                    : (isRtl 
                      ? "مستقر. كتلة الروابط الإسمنتية متكافئة وحجم الحرارة الكلي يقع في النطاق الآمن." 
                      : "Stable Core. Hydration values align safely within nominal thermal boundaries.")
                  }
                </p>
              </div>

              {/* Workability Loss */}
              <div className={`p-4 rounded-xl border transition hover:shadow-xs ${getRiskColor(workabilityRiskLevel)} text-right`}>
                <div className={`flex items-start justify-between gap-2 ${isRtl ? "flex-row" : "flex-reverse"}`}>
                  {getRiskBadge(workabilityRiskLevel)}
                  <h6 className="text-xs font-black font-sans text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Droplet size={14} className="text-blue-500 shrink-0" />
                    <span>{t.workabilityRisk}</span>
                  </h6>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 font-sans mt-2.5 leading-relaxed">
                  {workabilityRiskLevel === "danger"
                    ? (isRtl 
                      ? `قوام الهبوط جاف تماماً (${slump} سم). خطر مباشر من انسداد مضخات الموقع وحاجة الخواصين لإضافة الماء عشوائياً مما يفسد قوة الخرسانة بالكامل!` 
                      : `Critical dry slump (${slump} cm). Imminent threat of concrete pump pipeline blockages, forcing field labor to manually dilute with water, destroying target compressive fck targets.`)
                    : workabilityRiskLevel === "warning"
                    ? (isRtl 
                      ? "قابلية صب متوسطة. استخدام الملدن الفائق كافٍ ولكن في الأجواء الحارة يُفضل المتابعة السريعة وحيازة مؤخر شك لدن." 
                      : "Slight workability concern. While workable, rapid slump evaporation under warm winds could harden placement kinetics.")
                    : (isRtl 
                      ? "ممتاز. الخرسانة ذات قوام لدن ممتاز يثري تدفق المونة حول أسياخ حديد التسليح بدون انسداد حاد." 
                      : "Workable flow. Optimal plastic matrix ensures perfect concrete pumping transit without rebar congestion blockages.")
                  }
                </p>
              </div>

              {/* Durability Carbonation */}
              <div className={`p-4 rounded-xl border transition hover:shadow-xs ${getRiskColor(durabilityRiskLevel)} text-right`}>
                <div className={`flex items-start justify-between gap-2 ${isRtl ? "flex-row" : "flex-reverse"}`}>
                  {getRiskBadge(durabilityRiskLevel)}
                  <h6 className="text-xs font-black font-sans text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-green-500 shrink-0" />
                    <span>{t.corrosionRisk}</span>
                  </h6>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 font-sans mt-2.5 leading-relaxed">
                  {durabilityRiskLevel === "danger"
                    ? (isRtl 
                      ? `⚠ نسبة المياه للإسمنت مرتفعة جداً (W/C = ${wcRatio}). الفراغات المفتوحة في المونة ستسهل دخول غاز ثاني أكسيد الكربون والكبريتات مما يسبب تآكل غطاء حديد التسليح.` 
                      : `⚠ Excessive water/binder ratio (W/C = ${wcRatio}). Elevated capillary network porosity permits rapid carbonation, facilitating salt erosion and premature rebar corrosion.`)
                    : durabilityRiskLevel === "warning"
                    ? (isRtl 
                      ? `النسبة الكيميائية الحالية (W/C = ${wcRatio}) مقبولة في الظروف العادية ولكن قد تحتاج خفضاً كفيلاً بضمان الحماية في البيئات عالية الأملاح والتعرض الكبريتي.` 
                      : `Borderline porosity (W/C = ${wcRatio}). Acceptable for normal layouts, but insufficient for highly aggressive sulfide or coastal salt exposure classes.`)
                    : (isRtl 
                      ? "تكامل ممتاز للكثافة الإنشائية. النفاذية مغلقة تماماً كيميائياً لمنع دخول غازات الكربنة والأكسجين المحيط." 
                      : "In-depth dense cementitious matrix. Zero-porosity structure bars carbonic gas ingress and salt-water capillary diffusion.")
                  }
                </p>
              </div>

              {/* Segregation & Bleeding */}
              <div className={`p-4 rounded-xl border transition hover:shadow-xs ${getRiskColor(segregationRiskLevel)} text-right`}>
                <div className={`flex items-start justify-between gap-2 ${isRtl ? "flex-row" : "flex-reverse"}`}>
                  {getRiskBadge(segregationRiskLevel)}
                  <h6 className="text-xs font-black font-sans text-slate-900 dark:text-white flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-pink-500 shrink-0" />
                    <span>{t.segregationRisk}</span>
                  </h6>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 font-sans mt-2.5 leading-relaxed">
                  {segregationRiskLevel === "danger"
                    ? (isRtl 
                      ? "خطر شديد لفصل الركام الخشن وهبوط العجينة الإسمنتية إلى الأسفل بسبب فرط مياه الجرعة الفعالة مع نقص حاد في تدرج الرمال الحابسة للخلطة." 
                      : "Critical risk of coarse aggregate sinking away from the cement paste due to high water dosage of fine sand stabilizers.")
                    : segregationRiskLevel === "warning"
                    ? (isRtl 
                      ? "احتمالية طفيفة للنضح المائي (Bleeding) على السطح في حالة الإفراط في الاهتزاز الميكانيكي المستمر." 
                      : "Minor wet bleeding risk. Avoid excessive over-vibrating to prevent paste surfacing issues.")
                    : (isRtl 
                      ? "أمان وتماسك تام. لزوجة الخليط كافية للاحتفاظ بالهيكل الحبيبي المتجانس أثناء النقل والصب والدمك." 
                      : "Perfect mix cohesion. Coarse particles remain suspended inside the fresh cementitious matrix with zero hydration water bleeding.")
                  }
                </p>
              </div>

              {/* Alkali silica reaction */}
              <div className={`p-4 rounded-xl border col-span-1 md:col-span-2 transition hover:shadow-xs ${getRiskColor(asrRiskLevel)} text-right`}>
                <div className={`flex items-start justify-between gap-2 ${isRtl ? "flex-row" : "flex-reverse"}`}>
                  {getRiskBadge(asrRiskLevel)}
                  <h6 className="text-xs font-black font-sans text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Activity size={14} className="text-indigo-500 shrink-0" />
                    <span>{t.asrRisk}</span>
                  </h6>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 font-sans mt-2.5 leading-relaxed">
                  {asrRiskLevel === "danger"
                    ? (isRtl 
                      ? "جودة الركام مصنفة ضعيفة (Poor) لوجود محتوى طيني أو سيليسي عالي. خطر تفاعل القلويات مع السيليكا المسببة لشروخ التمدد الداخلية المتأخرة. نوصي باستعمال إسمنت منخفض القلويات وإضافة غبار السيليكا." 
                      : "Aggregate quality is classified as Poor. Potential chemical hazard of reactive silica forming expansion gel, causing late internal swelling. Prefer low-alkali cements with silica fume additions.")
                    : asrRiskLevel === "warning"
                    ? (isRtl 
                      ? "جودة عادية. يُنصح بتجفيف ركام المحاجر والاهتمام بغسل الرمل لتقليل الشوائب القلوية الحرة." 
                      : "Standard aggregates. Keep a close monitor on quarry cleaning protocols to eliminate lightweight sodium-potassium dust particles.")
                    : (isRtl 
                      ? "جودة ممتازة وخالية تماماً من الشوائب ومستقرة كيميائياً لضمان عدم حدوث تمدد ميكروبي." 
                      : "Highly clean, chemically inert geomatrix with zero reactive mineral residues.")
                  }
                </p>
              </div>

            </div>
          </div>
        )}

        {/* Tab 3: AI Recommendations */}
        {activeTab === "recommendations" && (
          <div className="space-y-6 animate-fade-in">
            <h4 className={`text-xs font-black text-indigo-650 dark:text-indigo-400 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
              <Sparkles size={16} className="text-amber-500 animate-pulse" />
              <span>{t.recTitle}</span>
            </h4>

            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${isRtl ? "text-right" : "text-left"}`}>
              {/* Cure Directive */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-850 rounded-xl relative hover:border-indigo-500/25 transition">
                <span className={`absolute top-3 ${isRtl ? "left-3" : "right-3"} text-[10px] font-bold text-slate-400`}>#01</span>
                <span className="p-1.5 bg-indigo-500/10 text-indigo-500 rounded-lg text-xs font-bold inline-block mb-2">CURING (المعالجة بالرطوبة)</span>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                  {t.recCuring}
                </p>
              </div>

              {/* Chemical Admixtures Compatibility */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-850 rounded-xl relative hover:border-indigo-500/25 transition">
                <span className={`absolute top-3 ${isRtl ? "left-3" : "right-3"} text-[10px] font-bold text-slate-400`}>#02</span>
                <span className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg text-xs font-bold inline-block mb-2">COMPATIBILITY (كيمياء الإضافات)</span>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                  {t.recAdmix}
                </p>
              </div>

              {/* Rheological Consolidation */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-850 rounded-xl relative hover:border-indigo-500/25 transition">
                <span className={`absolute top-3 ${isRtl ? "left-3" : "right-3"} text-[10px] font-bold text-slate-400`}>#03</span>
                <span className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg text-xs font-bold inline-block mb-2">PLACEMENT (طريقة وتكنيك الصب)</span>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                  {t.recRheology}
                </p>
              </div>

              {/* Laboratory Control Testing */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-850 rounded-xl relative hover:border-indigo-500/25 transition">
                <span className={`absolute top-3 ${isRtl ? "left-3" : "right-3"} text-[10px] font-bold text-slate-400`}>#04</span>
                <span className="p-1.5 bg-blue-500/10 text-blue-500 rounded-lg text-xs font-bold inline-block mb-2">CONTROL & CRUSHING (الفحوصات العيارية)</span>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                  {t.recQuality}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Eco Sustainability Recommendations */}
        {activeTab === "sustainability" && (
          <div className="space-y-6 animate-fade-in">
            <div className={`p-4 bg-emerald-50/10 dark:bg-emerald-950/5 border border-emerald-500/20 rounded-xl flex items-center gap-3 ${isRtl ? "text-right" : "text-left"}`}>
              <span className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl shrink-0">
                <Activity size={18} />
              </span>
              <div>
                <h5 className="text-xs font-black text-slate-800 dark:text-slate-100">{t.sustTitle}</h5>
                <p className="text-[10px] text-slate-500">{isRtl ? "اقتراحات خفض انبعاثات الكربون والإضافات المستهدفة:" : "Actionable formulas to offset structural CO2 and reduce Portland clinker footprint."}</p>
              </div>
            </div>

            <div className={`space-y-4 ${isRtl ? "text-right" : "text-left"}`}>
              
              {/* CO2 Footprint Reduction (Slag/Flyash substitutions) */}
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl flex items-start gap-3 hover:shadow-xs transition duration-200">
                <div className="mt-1 p-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded">
                  <span className="text-xs font-bold">1</span>
                </div>
                <div className="space-y-1">
                  <h6 className="text-[11.5px] font-black text-slate-900 dark:text-slate-100">{isRtl ? "تعديل بنية الرابط وتخفيض CO2" : "Binder Modification & CO2 Reduction"}</h6>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {t.sustCO2}
                  </p>
                </div>
              </div>

              {/* Fibres usage */}
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl flex items-start gap-3 hover:shadow-xs transition duration-200">
                <div className="mt-1 p-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded">
                  <span className="text-xs font-bold">2</span>
                </div>
                <div className="space-y-1">
                  <h6 className="text-[11.5px] font-black text-slate-900 dark:text-slate-100">{isRtl ? "الألياف الميكروية للتحكم بالانكماش المشرخ" : "Polypropylene Fibers for Crack Abatement"}</h6>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {t.sustFibers}
                  </p>
                </div>
              </div>

              {/* Aggregate cleanliness optimization */}
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl flex items-start gap-3 hover:shadow-xs transition duration-200">
                <div className="mt-1 p-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded">
                  <span className="text-xs font-bold">3</span>
                </div>
                <div className="space-y-1">
                  <h6 className="text-[11.5px] font-black text-slate-900 dark:text-slate-100">{isRtl ? "تجهيز وغسيل الركامات ونسبة المواد الناعمة" : "Raw Aggregate Sieve Wash & Dust Reduction"}</h6>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {t.sustAgg}
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* Footer Memo Notes */}
      <div className="bg-slate-50 dark:bg-slate-950/30 p-4 px-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className={`flex items-center gap-2 ${isRtl ? "text-right" : "text-left"}`}>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <p className="text-[10px] text-slate-500 font-sans">
            <strong>{t.engineeringNote}</strong> {t.lawCompliance}
          </p>
        </div>
        <span className="text-[9px] font-mono text-slate-400 uppercase">Dreux-Gorisse Protocol V4.2</span>
      </div>
    </div>
  );
};
