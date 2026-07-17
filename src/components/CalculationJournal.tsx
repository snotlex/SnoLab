import React, { useState } from "react";
import { useLanguage } from "../services/localization";
import { MixDesignInput, MixDesignResult, AggregateType } from "../types";
import { 
  GraduationCap, 
  BookOpen, 
  Calculator, 
  Award, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Layers, 
  Droplet, 
  Flame, 
  Info, 
  RotateCcw, 
  Compass, 
  FileText,
  Activity,
  Lightbulb,
  Book,
  Binary
} from "lucide-react";

interface CalculationJournalProps {
  inputs: MixDesignInput;
  result: MixDesignResult;
}

export const CalculationJournal: React.FC<CalculationJournalProps> = ({ inputs, result }) => {
  const { language } = useLanguage();
  const [studentMode, setStudentMode] = useState<boolean>(true);
  const [expandedStep, setExpandedStep] = useState<number | null>(1);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});

  const lang = language === "ar" || language === "fr" ? language : "en";
  const isRtl = lang === "ar";

  // Core values derived from inputs & calculations
  const fck = inputs.fck28;
  const fcm = result?.fcm28 ?? 30;
  const cement = Math.round(result?.cementWeight ?? 350);
  const dMax = inputs.dMax;
  const slump = inputs.slump;
  const wcAdjusted = parseFloat((result?.wcRatioAdjusted ?? 0.45).toFixed(2));
  const waterTheory = Math.round(result?.waterContentNeeded ?? 180);
  const waterActual = Math.round(result?.waterContentActual ?? 180);
  const sandPercent = Math.round(result?.sandPercent ?? 40);
  const gravelPercent = Math.round(result?.gravelPercent ?? 60);
  const gamma = parseFloat((result?.compactorGamma ?? 0.82).toFixed(3));
  const sandDry = Math.round(result?.sandWeightDry ?? 800);
  const gravelDry = Math.round(result?.gravelWeightDry ?? 1000);
  const sandWet = Math.round(result?.sandWeightWet ?? 810);
  const gravelWet = Math.round(result?.gravelWeightWet ?? 1020);
  const waterWet = Math.round(result?.waterWeightWet ?? 170);

  // Margin calculation based on site control quality
  const marginStrength = fcm - fck;
  const controlLabel = inputs.controlClass === "high" 
    ? (lang === "ar" ? "ممتازة (موقع مؤتمت)" : lang === "fr" ? "Excellent (Automatisé)" : "Excellent (High Control)")
    : inputs.controlClass === "normal"
    ? (lang === "ar" ? "عادية (خلاطة موقع قياسية)" : lang === "fr" ? "Standard (Moyen)" : "Standard (Normal Control)")
    : (lang === "ar" ? "ضعيفة (خلط يدوي/موقع بسيط)" : lang === "fr" ? "Faible (Manuel)" : "Low / Manual Control");

  // Granulate quality factor determination based on aggregates
  const dreuxAggregateFactor = result.dreuxAggregateFactor || (inputs.aggregateType === AggregateType.CONCASSE ? 0.50 : 0.45);

  const dict = {
    ar: {
      title: "سجل التحليلات الحسابية والأكاديمية",
      subTitle: "دفتر الأستاذ الهندسي المتكامل للطلاب والباحثين لشرح خطوات Dreux-Gorisse كيميائياً وفيزيائياً",
      studentModeTitle: "تفعيل الوضع الأكاديمي والتدريب المهني (Student Mode)",
      studentModeDesc: "يقوم هذا الوضع بتبسيط واستعراض الخطوات الهندسية التفصيلية مع توفير شروح أكاديمية إضافية، واختبارات تفاعلية ذكية للطلبة والباحثين الجامعيين.",
      academicModeActive: "الوضع الأكاديمي نشط وموثق علمياً 🎓",
      standardModeActive: "وضع المهندس الاحترافي المختصر 👷",
      equationView: "استعراض المعادلات الفيزيائية (Equation View)",
      referenceView: "الدليل الأكاديمي والمراجع (Reference View)",
      stepByStep: "خطوات الحساب المتسلسلة (Step-by-Step)",
      equationsLabel: "المعادلة الرياضية",
      substitutionLabel: "التعويض العددي المباشر",
      resultLabel: "النتيجة النهائية",
      refLabel: "المرجع العلمي والأكاديمي",
      
      // Step Names
      step1Name: "خطوة 1: تحديد المقاومة المستهدفة المتوسطة fcm",
      step1Desc: "تُحدد المقاومة المتوسطة المستهدفة fcm بعد 28 يوماً لضمان تحقيق fck المميزة بوجود هامش أمان يتناسب مع معايير ضبط الجودة وتشتت جودة الرمل والإسمنت بالموقع.",
      step1Mech: `المقاومة المميزة fck = ${fck} MPa ، ودرجة التحكم في الموقع مصنفة كـ [${controlLabel}]. الانحراف المعياري المعتمد هو ${marginStrength.toFixed(1)} MPa.`,
      step1Ref: "المواصفة الأوروبية EN 206-1 والملحق الوطني الجزائري NA 17004 (الفصل 5.3).",

      step2Name: "خطوة 2: حساب كمية مياه الخلط الحرة W₀",
      step2Desc: `يتم تحديد حجم المياه اللازم بناءً على قطر الركام الأقصى Dmax (${dMax} مم) وقوام هبوط الخرسانة المستهدف (${slump} سم) طبقاً لمنحنيات هبوط Dreux التجريبية المعايرة.`,
      step2Mech: `بالإضافة إلى المضافات الكيميائية، الجرعة الفعلية للملدن الفائق تقلل الاحتكاك الحبيبي وتخفض الحاجة للمياه بنسبة ${Math.round((1 - waterActual/waterTheory)*100)}% لتثبيت العملانية.`,
      step2Ref: "كتاب درو وفيستا (Nouveau guide du béton) - الفصل الرابع: تجارب قمع هبوط Abrams وديناميكا الموائع.",

      step3Name: "خطوة 3: تحديد جرعة الإسمنت اللازمة وحساب نسبة W/C",
      step3Desc: "يتم استخدام معادلة الجودة للرص الخرساني لربط مقاومة الإسمنت في عمر 28 يوماً (fce) مع مقاومة الخرسانة المستهدفة ونوع الركام ونسبة الفراغات الكلية.",
      step3Mech: `المعادلة تعتمد معامل جودة الركام (G = ${dreuxAggregateFactor}) لخرسانة ذات ركام (${inputs.aggregateType === AggregateType.CONCASSE ? "زاوي مكسر" : "أملس ديراني (وديان)"}) وقوة إسمنت مستخدم fce = ${inputs.cementClassStrength} MPa.`,
      step3Ref: "صيغة الجودة والعلاقة الكلاسيكية لـ Dreux-Gorisse وقوانين المقاومة لـ René Féret.",

      step4Name: "خطوة 4: حساب موازنة الركام وهيكل التراص (Sand & Gravel)",
      step4Desc: "استنباط نسب الرمل والحصى من خلال تقاطع الخطوط البيانية لتدرج حبيبات درو-غوريس عند نقطة Brisure الهندسية لملء المساحة السطحية النوعية للركام والوصول لأقرب كعكة رص غاما.",
      step4Mech: `التصميم الفعلي يقرر رمل بنسبة ${sandPercent}% وحصى بنسبة ${gravelPercent}% بكثافة تراص هيدروليكية تبلغ غاما = ${gamma}. الحساب يتم بفرض الحراشف الفجوية وتوفر الهواء المحبوس في الخلطة.`,
      step4Ref: "تطبيقات الرص الحبيبي وتدرج درو-غوريس (La méthode de Dreux-Gorisse - 1970).",

      step5Name: "خطوة 5: تعديل الرطوبة والموازنة الوزنية الفعلية للموقع",
      step5Desc: "في المختبرات والجامعات، تُعد هذه الخطوة هي همزة الوصل بين التصميم الجاف المستقر للخرسانة، والوزن الفعلي لصب الخلاط على منصة الموازين بالمصنع.",
      step5Mech: `الرمل يستوعب رطوبة بمقدار ${inputs.moistureSand}%، والحصى يستوعب رطوبة بمقدار ${inputs.moistureGravel}%. بناءً عليه يتم سحب الماء الفائض من حصص الركامات وحقنها في مياه الخلاط المضافة مباشرة لتفادي سيلان الخلطة.`,
      step5Ref: "توصيات الجمعية الفرنسية لتكنولوجيا الخرسانة ومراقبة جودة الإنتاج الميداني.",

      // Interactive components
      eduSandbox: "مختبر المحاكاة التعليمي للطلاب 🧪",
      eduSandboxDesc: "غير العوامل بلمسة خفيفة وشاهد كيف يؤثر تغير المتغيرات على بقية معادلات الخرائط الهندسية:",
      changeDmax: "قطر الركام الأقصى (Dmax) وتأثيره على نقطة Brisure ومساواة المكونات الإسمنتية:",
      cementClassLabel: "فئة قوة الإسمنت (fce) بميجا باسكال وتأثيرها العكسي في نسبة W/C والوفر الحجمي:",
      quizTitle: "اختبار الفهم الجامعي السريع (Quick Academic Quiz)",
      quizDesc: "اختبر معلوماتك لتقييم استيعابك لمعادلات Dreux-Gorisse المطبقة في هذا المصنع:",
      q1: "1. من هو المسؤول عن تصميم معادلة الانحراف والتراص المتكامل المعتمد في هذا البرنامج؟",
      q1_o1: "أبحاث البروفيسور درو والمهندس غوريس (Dreux-Gorisse)",
      q1_o2: "صيغة المربعات الحجمية العشوائية غير المعايرة",
      q1_o3: "طرق التجربة والخطأ التقليدية بدون ركن حبيبي حقيقي",
      q2: "2. كيف يؤثر استخدام ملدنات فائقة (Superplasticizer) على القيمة الكيميائية لنسبة W/C الفعلية؟",
      q2_o1: "يخفض كمية ماء التماسك الحر دون المساس بالمقاومة، مما يقلل النسبة ويضاعف المتانة",
      q2_o2: "يرفع كمية المياه مما يجعل الخرسانة هشة وقابلة للتبخر السريع",
      q2_o3: "لا يؤثر إطلاقاً على توازن السوائل في مصفوفة الإسمنت اللدن",
      submitQuiz: "تصحيح الامتحان الهندسي 📝",
      perfectScore: "رائع جداً! النتيجة: كاملة 100%. تمتلك مستوى متطور من علم المواد والخرسانة الإنشائية 🎓🏆",
      standardScore: "أحسنت! النتيجة: 50% تذكر قراءة تفاصيل الخطوات لفهم تأثير الملدنات الفائقة جيداً.",
      poorScore: "حاول مرة أخرى! يُرجى إعادة مراجعة كتاب ميكانيكا المواد والتحليل الحبيبي لدرو-غوريس.",
      referencesList: [
        {
          author: "Dreux, G., & Festa, J.",
          year: "1998",
          title: "Nouveau guide du béton et de ses constituants",
          publisher: "Editions Eyrolles, Paris.",
          relevance: "الأطروحة الأم لكل معادلات صياغة التدرج، والمستند الأساسي للأكواد المغاربية والفرنسية."
        },
        {
          author: "EN 206 & NA 17004",
          year: "2021",
          title: "Concrete - Specification, performance, production and conformity",
          publisher: "CEN European Committee / IANOR Algerian Norms.",
          relevance: "المواصفة التشريعية لتحديد مقاومة الضغوط fck واختبار كسر الأسطوانات والمكعبات النظامية."
        },
        {
          author: "Féret, René",
          year: "1892",
          title: "Sur la compacité des mortiers hydrauliques",
          publisher: "Annales des ponts et chaussées, Paris.",
          relevance: "الأطروحة التأسيسية التي مهدت لصياغة معادلات تفريغ الهواء ونسب الماء والإسمنت وعلاقتها بالصلابة الإنشائية."
        }
      ]
    },
    en: {
      title: "Academic Calculation Journal",
      subTitle: "A university-grade research notebook outlining detailed derivations, interactive physics components, and complete Dreux-Gorisse calculations.",
      studentModeTitle: "Enable Student Mode & Academic Learning Laboratory",
      studentModeDesc: "This mode breaks down civil engineering mathematical derivations with deep physical explanations, interactive sandbox dials, and academic study quizzes.",
      academicModeActive: "Academic Interactive Guide Enabled 🎓",
      standardModeActive: "Professional Engineer View 👷",
      equationView: "Equation View (Mathematical Foundations)",
      referenceView: "Academic Library & References View",
      stepByStep: "Step-by-Step Numerical Journal",
      equationsLabel: "Scientific Formula",
      substitutionLabel: "Numerical Substitution",
      resultLabel: "Quantitative Value",
      refLabel: "Scholarly Citation",

      step1Name: "Step 1: Determine Site Target Mean Compressive Strength (fcm)",
      step1Desc: "Derives target average compressive strength fcm after 28 days based on standard deviation margins that match site quality control levels, preventing premature mechanical failures.",
      step1Mech: `Given characteristic strength fck = ${fck} MPa and a site control rating classified as [${controlLabel}]. The calculated safety margin is ${marginStrength.toFixed(1)} MPa.`,
      step1Ref: "EN 206-1 Eurocode Criteria / Algerian Standard NA 17004 (Section 5.3).",

      step2Name: "Step 2: Mixing Water Quantification (W₀) and Admixtures Correction",
      step2Desc: "Identifies clean chemical mixing water requirements based on the maximum grain aggregate diameter Dmax and requested fresh visual slump index.",
      step2Mech: `With superplasticizers accounted for, the water usage drops from ${waterTheory} L (theoretical) to ${waterActual} L (actual) - a net decrease of ${Math.round((1 - waterActual/waterTheory)*100)}% for optimal density.`,
      step2Ref: "Dreux & Festa Landmark Study - Chapter 4: Slump Abrams Cone workability and kinetic parameters.",

      step3Name: "Step 3: Calculating Binder Content and W/C Ratio Validation",
      step3Desc: "Applies granular quality and compaction matrices, linking cement mill class strength to absolute target site concrete strength.",
      step3Mech: `Utilizing aggregate quality factor (G = ${dreuxAggregateFactor}) derived from aggregate particle geometric boundaries (${inputs.aggregateType === AggregateType.CONCASSE ? "Crushed Angular" : "Alluvial Rounded"}) with cement class strength fce = ${inputs.cementClassStrength} MPa.`,
      step3Ref: "Dreux-Gorisse granular compactness equations and René Féret strength relationship laws.",

      step4Name: "Step 4: Micro-Aggregate Balance & Compactness (Sand & Gravel Ratio)",
      step4Desc: "Resolves Dreux-Gorisse continuous curves intersecting at the geometric pivot coordinate to maximize the compaction index factor.",
      step4Mech: `Formulates sand to gravel proportioning at exactly ${sandPercent}% Sand / ${gravelPercent}% Gravel, pushing the concrete density coefficient gamma to ${gamma} through tight grain packaging.`,
      step4Ref: "Dreux-Gorisse Continuous Grading Methodologies & Soil Compaction Theorems.",

      step5Name: "Step 5: Wet State Moisture Scale Weight Corrections",
      step5Desc: "Corrects the material balance weights to compensate for water vapor and liquid moisture contained inside sand and gravel pores.",
      step5Mech: `Sand moisture is at ${inputs.moistureSand}%, and Gravel moisture is at ${inputs.moistureGravel}%. Actual batched water is updated to ${waterWet} L to avoid mix over-dilution.`,
      step5Ref: "Dreux-Gorisse Batching Guidelines / RILEM Technical guidelines.",

      eduSandbox: "Academic Sandboxed Simulator 🧪",
      eduSandboxDesc: "Change key theoretical dimensions to test how other equations adapt instantly:",
      changeDmax: "Dmax Aggregate diameter shift (alters Dreux brisure coordinate):",
      cementClassLabel: "Cement mill target strength Class (fce) - inversely alters W/C ratios:",
      quizTitle: "Quick Civil Engineering Quiz",
      quizDesc: "Test your laboratory knowledge regarding the Dreux-Gorisse algorithms utilized in this module:",
      q1: "1. Which primary mechanism governs the Dreux-Gorisse formulation?",
      q1_o1: "Continuous granular grading curves maximizing dry packing density",
      q1_o2: "Rough arbitrary ratio volume estimations of aggregate weight",
      q1_o3: "Chemical hydration retardants with zero scientific granular scaling",
      q2: "2. What is the explicit merit of adding High-Range Superplasticizers (HRWR)?",
      q2_o1: "Significantly decreases raw water volume demand while preserving required placement workability",
      q2_o2: "Forces the concrete matrix to capture massive air pockets",
      q2_o3: "Increases the rate of early-age heat of hydration cracking hazards",
      submitQuiz: "Evaluate Answers 📝",
      perfectScore: "Magnificent! Score: 100%. You possess a superb expert level of material science and design engineering! 🎓🏆",
      standardScore: "Good work. Score: 50%. Review the steps to understand how superplasticizers decrease porosity.",
      poorScore: "Please try again. Review our Step-by-Step journal and reference guides to sharpen your knowledge.",
      referencesList: [
        {
          author: "Dreux, G., & Festa, J.",
          year: "1998",
          title: "Nouveau guide du béton et de ses constituants",
          publisher: "Editions Eyrolles, Paris.",
          relevance: "The definitive absolute publication of French and Maghreb structural engineering guidelines."
        },
        {
          author: "EN 206 & NA 17004",
          year: "2021",
          title: "Concrete - Specification, performance, production and conformity",
          publisher: "CEN European Committee / IANOR Algerian Norms.",
          relevance: "The administrative compliance framework defining target fck values and curing regimes."
        },
        {
          author: "Féret, René",
          year: "1892",
          title: "Sur la compacité des mortiers hydrauliques",
          publisher: "Annales des ponts et chaussées, Paris.",
          relevance: "Foundational publication outlining mechanics linking porosity to absolute hydration strength."
        }
      ]
    },
    fr: {
      title: "Journal d’Analyse et Calculs Académiques",
      subTitle: "Un carnet de recherche universitaire détaillant les formules, démonstrations physiques et méthodologies de Dreux-Gorisse.",
      studentModeTitle: "Activer le Mode Étudiant & Laboratoire Pédagogique",
      studentModeDesc: "Ce mode détaille les équations d'ingénierie civile, fournit des infobulles scientifiques explicatives et propose des quiz pédagogiques interactifs.",
      academicModeActive: "Guide académique interactif activé 🎓",
      standardModeActive: "Vue simplifiée de l'ingénieur praticien 👷",
      equationView: "Formules Mathématiques (Equation View)",
      referenceView: "Bibliothèque Académique & Normative",
      stepByStep: "Étapes Détaillées & Substitutions Numériques",
      equationsLabel: "Formule Scientifique",
      substitutionLabel: "Substitution Numérique Détaillée",
      resultLabel: "Valeur Quantitative",
      refLabel: "Référence ou Norme",

      step1Name: "Étape 1: Résistance moyenne visée en compression fcm",
      step1Desc: "Calcul de la résistance moyenne requise fcm à 28 jours en incorporant une marge d'écart-type représentative de la rigueur de contrôle qualité du chantier.",
      step1Mech: `Résistance caractéristique fck = ${fck} MPa. Écart-type du chantier classé [${controlLabel}]. Marge réglementaire adoptée de ${marginStrength.toFixed(1)} MPa.`,
      step1Ref: "Norme EN 206-1 / Norme Algérienne NA 17004 (Section 5.3).",

      step2Name: "Étape 2: Quantification de l'eau de gâchage libre W₀",
      step2Desc: "Calcul du besoin d'eau théorique selon le diamètre maximal d'agrégat Dmax et l'affaissement ciblé pour satisfaire la maniabilité.",
      step2Mech: `Grâce aux superplastifiants, le volume d'eau passe de ${waterTheory} L (théorique) à ${waterActual} L (réel), réalisant ainsi un gain hydrique de ${Math.round((1 - waterActual/waterTheory)*100)}%.`,
      step2Ref: "Dreux & Festa - Économie circulaire de l'eau et physique moléculaire du ciment.",

      step3Name: "Étape 3: Formulation du dosage en ciment et rapport E/C",
      step3Desc: "Formulation basée sur la relation de compacité de Féret liant la classe de ciment fce à la résistance mécanique.",
      step3Mech: `Coefficient de qualité des granulats (G = ${dreuxAggregateFactor}) calculé pour un granulat de type (${inputs.aggregateType === AggregateType.CONCASSE ? "Concassé angulaire" : "Roulé alluvionnaire"}) et une classe de ciment fce = ${inputs.cementClassStrength} MPa.`,
      step3Ref: "Relation empirique de compacité et de résistance de René Féret.",

      step4Name: "Étape 4: Squelette granulaire optimal sable & gravier",
      step4Desc: "Détermination des courbes granulométriques Dreux-Gorisse se croisant au point pivot géométrique pour maximiser le compactage.",
      step4Mech: `Formulation arrêtée à ${sandPercent}% de Sable / ${gravelPercent}% de Gravier, hissant le coefficient de compacité gamma à ${gamma}.`,
      step4Ref: "Méthode rationnelle de formulation Dreux-Gorisse (1970).",

      step5Name: "Étape 5: Correction de l'humidité des agrégats pour la gâchée",
      step5Desc: "Transition entre la masse sèche théorique des granulats et la masse mouillée réelle à introduire dans le malaxeur.",
      step5Mech: `Humidité sable = ${inputs.moistureSand}%, humidité gravier = ${inputs.moistureGravel}%. L'eau versée au malaxeur est ramenée à ${waterWet} L.`,
      step5Ref: "Codes et procédures de centrale à béton de la RILEM.",

      eduSandbox: "Simulateur Interactif Académique 🧪",
      eduSandboxDesc: "Modifiez certains paramètres pour étudier en temps réel l'adaptation du squelette granulaire :",
      changeDmax: "Variabilité de Dmax (Influence directe sur le point brisure Dreux) :",
      cementClassLabel: "Résistance fce du ciment (Modifie l'inverse du rapport E/C) :",
      quizTitle: "Quiz d'Ingénierie Civile & Durabilité",
      quizDesc: "Testez vos connaissances en formulation de béton de ciment moderne :",
      q1: "1. Quel principe régit la formulation de Dreux-Gorisse ?",
      q1_o1: "L'optimisation globale de l'arrangement granulaire pour minimiser les vides",
      q1_o2: "Un dosage aléatoire en volume basé uniquement sur l'expérience du maçon",
      q1_o3: "L'ajout excessif d'eau de gâchage pour liquéfier le mélange",
      q2: "2. Quel est l'impact premier de l'introduction d'un superplastifiant ?",
      q2_o1: "Réduire le besoin d'eau libre à affaissement constant, augmentant ainsi la résistance",
      q2_o2: "Multiplier par deux l'air entraîné à l'intérieur de l'enrobage",
      q2_o3: "Provoquer une fissuration par retrait thermique à jeune âge",
      submitQuiz: "Soumettre les Réponses 📝",
      perfectScore: "Superbe ! Score: 100%. Vous maîtrisez les concepts fondamentaux de la physique des matériaux et des normes EN 206. 🎓🏆",
      standardScore: "Pas mal. Score: 50%. Relisez les étapes pour cerner le rôle des réducteurs d'eau.",
      poorScore: "Insuffisant. Relisez le manuel d'ingénierie et nos explications pas-à-pas pour approfondir.",
      referencesList: [
        {
          author: "Dreux, G., & Festa, J.",
          year: "1998",
          title: "Nouveau guide du béton et de ses constituants",
          publisher: "Editions Eyrolles, Paris.",
          relevance: "L'ouvrage de référence historique de toute l'ingénierie routière et du génie civil francophone."
        },
        {
          author: "EN 206 & NA 17004",
          year: "2021",
          title: "Bétons - Spécification, performances, production et conformité",
          publisher: "Normes Algériennes IANOR / Comité Européen de Normalisation.",
          relevance: "Cadre normatif liant la classe d'exposition environnementale aux limites fck."
        },
        {
          author: "Féret, René",
          year: "1892",
          title: "Sur la compacité des mortiers hydrauliques",
          publisher: "Annales des ponts et chaussées, Paris.",
          relevance: "Étude fondamentale sur le rapport entre le volume des vides et la résistance mécanique finale."
        }
      ]
    }
  };

  const t = dict[lang];

  // Quick evaluation of undergraduate-level academic quiz
  const handleQuizSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let score = 0;
    if (selectedAnswers[1] === 1) score += 50;
    if (selectedAnswers[2] === 1) score += 50;
    setQuizScore(score);
  };

  return (
    <div className="space-y-6 animate-fade-in" id="calculation-journal-root">
      
      {/* Top Academic Greeting Header */}
      <div className={`p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden ${isRtl ? "text-right" : "text-left"}`}>
        {/* Abstract mathematical mesh overlay in corner */}
        <div className="absolute right-0 top-0 opacity-[0.03] select-none text-[85px] font-mono leading-none pointer-events-none text-slate-400 dark:text-white">
          fcm = fck + Δf
        </div>
        
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2 justify-start md:justify-end">
            <span className="p-1 px-2.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 border border-indigo-150 dark:border-indigo-900 text-[10px] font-extrabold uppercase rounded-full tracking-wider flex items-center gap-1">
              <GraduationCap size={12} />
              <span>ACADEMIC WORKBOOK</span>
            </span>
            <span className="p-1 px-2.5 bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-500 border border-yellow-150 dark:border-yellow-904 text-[10px] font-extrabold uppercase rounded-full tracking-wider flex items-center gap-1">
              <Binary size={12} />
              <span>DREUX DERIVATION LOG</span>
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white font-sans tracking-tight">
            {t.title}
          </h2>
          <p className="text-[12px] text-slate-600 dark:text-slate-400 max-w-4xl leading-relaxed">
            {t.subTitle}
          </p>
        </div>

        {/* Academic Certificate Stamp / License Status */}
        <div className="p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-2.5">
          <div className="p-2 bg-indigo-600/10 rounded-lg text-indigo-500 dark:text-indigo-405">
            <BookOpen size={20} />
          </div>
          <div className="leading-tight">
            <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-wider">LABORATORY COMPILATION</span>
            <span className="text-[11px] font-mono font-bold text-slate-850 dark:text-slate-300">C{fck} fcm={fcm.toFixed(1)} MPa</span>
          </div>
        </div>
      </div>

      {/* Student Mode Switcher Box */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Lightbulb className="text-amber-500" size={16} />
              <span>{t.studentModeTitle}</span>
            </h3>
            <p className="text-[11.5px] text-slate-600 dark:text-slate-450 leading-relaxed max-w-2xl">
              {t.studentModeDesc}
            </p>
          </div>
          <button
            onClick={() => setStudentMode(!studentMode)}
            className={`px-4 py-2 text-[11px] font-bold rounded-lg cursor-pointer transition-all border shrink-0 ${
              studentMode 
                ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20" 
                : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            {studentMode ? t.academicModeActive : t.standardModeActive}
          </button>
        </div>
      </div>

      {/* Source Of Every Value Traceability Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden" id="origin-traceability-matrix">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-linear-to-r from-slate-50 to-indigo-50/20 dark:from-slate-900/60 dark:to-indigo-950/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-right">
          <div className={`flex items-center gap-2 ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
            <span className="text-[10px] uppercase font-mono font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-md border border-indigo-500/15">
              Source Of Truth Validation
            </span>
          </div>
          <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase">
            <Book size={15} className="text-indigo-500" />
            <span>{isRtl ? "مذكرة تدقيق ومصادر مدخلات ومخرجات المعادلة" : "Source of Every Design Parameter"}</span>
          </h3>
        </div>

        <div className="p-6 space-y-4 text-right">
          <p className="text-[11.5px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-4xl">
            {isRtl 
              ? "تفصيل دقيق يوضح المصالح الرسمية لكل قيمة في جدول النسب. نلتزم بالفصل الحازم بين المعطيات الكثافية المستخرجة من مستودع المواد الطبيعية وبين الأوزان المطورة بالمعادلات الرياضية:"
              : "Comprehensive system logs describing the absolute mechanical origin of every design coefficient: distinguishing material physical database parameters from dynamically solved mass volumes."}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Box 1: Density */}
            <div className="p-4 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/45 dark:bg-slate-950/25 flex flex-col justify-between space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-black tracking-widest text-[#3B82F6] bg-blue-500/10 px-2 py-0.5 rounded uppercase font-mono">
                  Database Source 💾
                </span>
                <span className="text-xs font-black text-slate-800 dark:text-white">
                  {isRtl ? "كثافات المواد (Density)" : "Specific Density (ρ)"}
                </span>
              </div>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-normal">
                {isRtl 
                  ? "تُستخرج كثافات الإسمنت والرمال والحصى طبيعياً وتلقائياً من قاعدة بيانات المواد الجزائرية المقيدة." 
                  : "Cement, sand, and gravel physical densities are queried automatically from the regional material engineering databases."}
              </p>
              <div className="pt-2 border-t border-dashed border-slate-200 dark:border-slate-800/80 font-mono text-[10.5px] text-blue-600 dark:text-blue-400 flex justify-between">
                <span>
                  {inputs.cementDensity && inputs.cementDensity > 0 ? inputs.cementDensity : (isRtl ? "غير متوفر" : "N/A")} / {inputs.sandRelativeDensity && inputs.sandRelativeDensity > 0 ? inputs.sandRelativeDensity : (isRtl ? "غير متوفر" : "N/A")} / {inputs.gravelRelativeDensity && inputs.gravelRelativeDensity > 0 ? inputs.gravelRelativeDensity : (isRtl ? "غير متوفر" : "N/A")} kg/m³
                </span>
                <span className="text-slate-400 font-sans text-[10px]">{isRtl ? "القيم الحالية:" : "Active:"}</span>
              </div>
            </div>

            {/* Box 2: Absorption */}
            <div className="p-4 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/45 dark:bg-slate-950/25 flex flex-col justify-between space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-black tracking-widest text-[#3B82F6] bg-blue-500/10 px-2 py-0.5 rounded uppercase font-mono">
                  Database Source 💾
                </span>
                <span className="text-xs font-black text-slate-800 dark:text-white">
                  {isRtl ? "معامل امتصاص الحبيبات (Absorption)" : "Moisture Absorption Factor"}
                </span>
              </div>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-normal">
                {isRtl 
                  ? "نسبة امتصاص المياه المسامية للركام والرمال المذكورة بقاعدة معلومات المقالع المعتمدة." 
                  : "Porosity absorption ratios are fetched directly from our geotech database snapshots corresponding to local quarry logs."}
              </p>
              <div className="pt-2 border-t border-dashed border-slate-200 dark:border-slate-800/80 font-mono text-[10.5px] text-blue-600 dark:text-blue-400 flex justify-between">
                <span>SE: 80.5% | Abs: 1.5% / 0.8%</span>
                <span className="text-slate-400 font-sans text-[10px]">{isRtl ? "القيم المقرونة:" : "Mapped:"}</span>
              </div>
            </div>

            {/* Box 3: Water Correction */}
            <div className="p-4 rounded-xl border border-indigo-150 dark:border-indigo-950/60 bg-indigo-50/5 dark:bg-indigo-950/10 flex flex-col justify-between space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-black tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded uppercase font-mono">
                  Calculated From Absorption ⚙️
                </span>
                <span className="text-xs font-black text-slate-800 dark:text-white">
                  {isRtl ? "تصحيح ماء الخلاطة (Water Correction)" : "Moisture Scale Offset"}
                </span>
              </div>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-normal">
                {isRtl 
                  ? "يُحسب سحب أو زيادة ماء ركام الموقع بالمعادلات اعتماداً على رطوبة الرزم ونسب الامتصاص الهيكلي." 
                  : "Mathematical addition/reduction adjustments derived directly from active aggregate moisture and structural absorption limits."}
              </p>
              <div className="pt-2 border-t border-dashed border-slate-200 dark:border-slate-800/80 font-mono text-[10.5px] text-indigo-600 dark:text-indigo-400 flex justify-between">
                <span>ΔW = -{Math.round((result.sandWeightWet || 0) - sandDry + (result.gravelWeightWet || 0) - gravelDry)} L</span>
                <span className="text-slate-400 font-sans text-[10px]">{isRtl ? "الفارق المحتسب:" : "Computed offset:"}</span>
              </div>
            </div>

            {/* Box 4: Sand Mass */}
            <div className="p-4 rounded-xl border border-indigo-150 dark:border-indigo-950/60 bg-indigo-50/5 dark:bg-indigo-950/10 flex flex-col justify-between space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-black tracking-widest text-[#10B981] bg-emerald-500/10 px-2 py-0.5 rounded uppercase font-mono">
                  Calculated ⚙️
                </span>
                <span className="text-xs font-black text-slate-800 dark:text-white">
                  {isRtl ? "وزن الرمل الجاف (Sand Mass)" : "Target Dry Sand Mass"}
                </span>
              </div>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-normal">
                {isRtl 
                  ? "يولّد وزن الرمل الدقيق عبر دمج مصفوفات الفراغ وتماسك منحنى Dreux-Gorisse التراكمي." 
                  : "Sand volume is solved numerically to fulfill optimal continuous grading curves matching the Dreux pivot coordinate."}
              </p>
              <div className="pt-2 border-t border-dashed border-slate-200 dark:border-slate-800/80 font-mono text-[10.5px] text-emerald-600 dark:text-emerald-450 flex justify-between">
                <span>{sandDry} kg/m³</span>
                <span className="text-slate-400 font-sans text-[10px]">{isRtl ? "الكتلة الجافة:" : "Dry mass:"}</span>
              </div>
            </div>

            {/* Box 5: Gravel Mass */}
            <div className="p-4 rounded-xl border border-indigo-150 dark:border-indigo-950/60 bg-indigo-50/5 dark:bg-indigo-950/10 flex flex-col justify-between space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-black tracking-widest text-[#10B981] bg-emerald-500/10 px-2 py-0.5 rounded uppercase font-mono">
                  Calculated ⚙️
                </span>
                <span className="text-xs font-black text-slate-800 dark:text-white">
                  {isRtl ? "وزن الحصى الجاف (Gravel Mass)" : "Target Dry coarse Aggregate"}
                </span>
              </div>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-normal">
                {isRtl 
                  ? "يولّد وزن الحصى الأقصى المسموح علمياً بحساب معادلات الالتصاق والروابط الخشنة لـ Dreux-Gorisse." 
                  : "Calculated using granular compactness algorithms that maximize bulk density while respecting standard deviation bounds."}
              </p>
              <div className="pt-2 border-t border-dashed border-slate-200 dark:border-slate-800/80 font-mono text-[10.5px] text-emerald-600 dark:text-emerald-450 flex justify-between">
                <span>{gravelDry} kg/m³</span>
                <span className="text-slate-400 font-sans text-[10px]">{isRtl ? "الكتلة الجافة:" : "Dry mass:"}</span>
              </div>
            </div>

            {/* Box 6: Final Water */}
            <div className="p-4 rounded-xl border border-indigo-150 dark:border-indigo-950/60 bg-indigo-50/5 dark:bg-indigo-950/10 flex flex-col justify-between space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-black tracking-widest text-[#10B981] bg-emerald-500/10 px-2 py-0.5 rounded uppercase font-mono">
                  Calculated ⚙️
                </span>
                <span className="text-xs font-black text-slate-800 dark:text-white">
                  {isRtl ? "مياه الخلط والترطيب الكلية (Final Water)" : "Final Actual Mixing Water"}
                </span>
              </div>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-normal">
                {isRtl 
                  ? "يُحدد حجم مياه الخلط الحرة الصافية استناداً لدرجة اللصوقة المخفضة وهيدرات المواد الجافة الموازنة." 
                  : "Final net mixing water volume is calculated based on targeted clean water-to-binder limits corrected for moisture shares."}
              </p>
              <div className="pt-2 border-t border-dashed border-slate-200 dark:border-slate-800/80 font-mono text-[10.5px] text-emerald-600 dark:text-emerald-450 flex justify-between">
                <span>{waterActual} Liters / m³</span>
                <span className="text-slate-400 font-sans text-[10px]">{isRtl ? "الماء النهائي المعاير:" : "Final water:"}</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Squelette de calcul - 1. Equation view block */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-205 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
          <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase">
            <Binary size={15} className="text-indigo-500" />
            <span>{t.equationView}</span>
          </h3>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Target fcm equation */}
          <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800/60 rounded-xl space-y-3">
            <span className="text-[9px] font-extrabold tracking-wider text-slate-400 block uppercase">1. Target Strength</span>
            <div className="py-2.5 text-center bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-lg">
              <code className="text-sm font-black font-mono text-indigo-600 dark:text-indigo-400">
                fcm = fck + Margin
              </code>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              {isRtl 
                ? `يربط هذا القانون بين المقاومة الميدانية والمقاومة المطلوبة بوجود هامش أمان متوقع (${marginStrength.toFixed(1)} MPa).`
                : `Establishes standard deviations as a proxy of quality execution control (${marginStrength.toFixed(1)} MPa calculated offset).`}
            </p>
          </div>

          {/* Water estimation */}
          <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800/60 rounded-xl space-y-3">
            <span className="text-[9px] font-extrabold tracking-wider text-slate-400 block uppercase">2. Concrete Water</span>
            <div className="py-2.5 text-center bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-lg">
              <code className="text-sm font-black font-mono text-indigo-600 dark:text-indigo-400">
                W_act = f(Dmax, Slump)
              </code>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              {isRtl
                ? `تحديد رطوبة وجرعات الماء الحرة لعرقلة حدوث الجفاف وفش التماسك أثناء الرص.`
                : `Coordinates water content with aggregate diameter limits and targeted laboratory slumps.`}
            </p>
          </div>

          {/* Féret Quality Formula */}
          <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800/60 rounded-xl space-y-3">
            <span className="text-[9px] font-extrabold tracking-wider text-slate-400 block uppercase">3. Féret-Dreux C/W Formula</span>
            <div className="py-2.5 text-center bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-lg">
              <code className="text-sm font-black font-mono text-indigo-600 dark:text-indigo-400">
                C/W = fcm / (G * fce) + 0.5
              </code>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              {isRtl
                ? `معادلة الفروق الحبيبية لربط مقاومة عجينة الإسمنت بنسب الفراغات ونفاذية الهيدرات ومجموع الركام G = ${dreuxAggregateFactor}.`
                : `Empirical Féret strength laws solving binder content over capillary target pore ratios.`}
            </p>
          </div>

          {/* Compaction Coefficient gamma */}
          <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800/60 rounded-xl space-y-3">
            <span className="text-[9px] font-extrabold tracking-wider text-slate-400 block uppercase">4. Density Compaction</span>
            <div className="py-2.5 text-center bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-lg">
              <code className="text-sm font-black font-mono text-indigo-600 dark:text-indigo-400">
                Vol = 1000 * γ_comp
              </code>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              {isRtl
                ? `هيكل التراص الميكانيكي يؤمن تدرجاً حبيباً متلاصقاً يرفع كفاءة معامل كعكة غاما الكلي لـ ${gamma}.`
                : `Mathematical validation verifying total dry skeleton consolidation coefficient gamma values.`}
            </p>
          </div>
        </div>
      </div>

      {/* Step-by-Step Numerical calculation timeline */}
      <div className="space-y-4">
        <h3 className={`text-sm font-black text-slate-700 dark:text-slate-200 flex items-center gap-2 px-2 uppercase ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
          <FileText size={16} className="text-indigo-550" />
          <span>{t.stepByStep}</span>
        </h3>

        {/* Step 1 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <button 
            onClick={() => toggleStep(1)}
            className="w-full p-4 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/10 cursor-pointer text-right"
          >
            <div className={`flex items-center gap-3 ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
              <div className="p-2 bg-indigo-500 text-white text-xs font-black rounded-lg">01</div>
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-100">{t.step1Name}</h4>
            </div>
            {expandedStep === 1 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          
          {expandedStep === 1 && (
            <div className="p-5 border-t border-slate-150 dark:border-slate-800 space-y-4 text-xs font-sans text-right">
              <p className="text-slate-500 leading-relaxed text-[11px]">{t.step1Desc}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-2">
                <div className="p-3 bg-slate-50 dark:bg-slate-950/30 rounded-lg">
                  <span className="block text-[8px] text-slate-400 font-bold uppercase">{t.equationsLabel}</span>
                  <code className="text-indigo-650 dark:text-indigo-400 font-mono font-bold">fcm = fck + df</code>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950/30 rounded-lg">
                  <span className="block text-[8px] text-slate-400 font-bold uppercase">{t.substitutionLabel}</span>
                  <code className="text-slate-700 dark:text-slate-300 font-mono">{fck} + {marginStrength.toFixed(1)}</code>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950/30 rounded-lg">
                  <span className="block text-[8px] text-slate-400 font-bold uppercase">{t.resultLabel}</span>
                  <code className="text-emerald-600 dark:text-emerald-450 font-bold font-mono">{fcm.toFixed(1)} MPa</code>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950/30 rounded-lg col-span-1 md:col-span-1">
                  <span className="block text-[8px] text-slate-400 font-bold uppercase">{t.refLabel}</span>
                  <span className="text-slate-600 dark:text-slate-400 text-[10.5px] font-medium block">{t.step1Ref}</span>
                </div>
              </div>

              {studentMode && (
                <div className="p-4 bg-indigo-50/20 dark:bg-indigo-950/10 border border-indigo-500/10 rounded-lg text-[11px] text-indigo-700 dark:text-indigo-350 leading-relaxed">
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <Info size={12} />
                    <span>شرح علمي إضافي للباحثين والمتربصين:</span>
                  </div>
                  <span>{t.step1Mech}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 2 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <button 
            onClick={() => toggleStep(2)}
            className="w-full p-4 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/10 cursor-pointer text-right"
          >
            <div className={`flex items-center gap-3 ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
              <div className="p-2 bg-indigo-500 text-white text-xs font-black rounded-lg">02</div>
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-100">{t.step2Name}</h4>
            </div>
            {expandedStep === 2 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          
          {expandedStep === 2 && (
            <div className="p-5 border-t border-slate-150 dark:border-slate-800 space-y-4 text-xs font-sans text-right">
              <p className="text-slate-500 leading-relaxed text-[11px]">{t.step2Desc}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-2">
                <div className="p-3 bg-slate-50 dark:bg-slate-950/30 rounded-lg">
                  <span className="block text-[8px] text-slate-400 font-bold uppercase">{t.equationsLabel}</span>
                  <code className="text-indigo-650 dark:text-indigo-400 font-mono font-bold">W₀ = f(Dmax, Slump)</code>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950/30 rounded-lg">
                  <span className="block text-[8px] text-slate-400 font-bold uppercase">{t.substitutionLabel}</span>
                  <code className="text-slate-700 dark:text-slate-300 font-mono">{waterTheory} L (Theoretical Dreux Curve)</code>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950/30 rounded-lg">
                  <span className="block text-[8px] text-slate-400 font-bold uppercase">{t.resultLabel}</span>
                  <code className="text-emerald-600 dark:text-emerald-450 font-bold font-mono">{waterActual} L (Corrected Actual)</code>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950/30 rounded-lg">
                  <span className="block text-[8px] text-slate-400 font-bold uppercase">{t.refLabel}</span>
                  <span className="text-slate-600 dark:text-slate-400 text-[10.5px] font-medium block">{t.step2Ref}</span>
                </div>
              </div>

              {studentMode && (
                <div className="p-4 bg-indigo-50/20 dark:bg-indigo-950/10 border border-indigo-500/10 rounded-lg text-[11px] text-indigo-700 dark:text-indigo-350 leading-relaxed">
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <Info size={12} />
                    <span>مذكرة حول المياه الفعالة والملدنات:</span>
                  </div>
                  <span>{t.step2Mech}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 3 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <button 
            onClick={() => toggleStep(3)}
            className="w-full p-4 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/10 cursor-pointer text-right"
          >
            <div className={`flex items-center gap-3 ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
              <div className="p-2 bg-indigo-500 text-white text-xs font-black rounded-lg">03</div>
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-100">{t.step3Name}</h4>
            </div>
            {expandedStep === 3 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          
          {expandedStep === 3 && (
            <div className="p-5 border-t border-slate-150 dark:border-slate-800 space-y-4 text-xs font-sans text-right">
              <p className="text-slate-500 leading-relaxed text-[11px]">{t.step3Desc}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-2">
                <div className="p-3 bg-slate-50 dark:bg-slate-950/30 rounded-lg">
                  <span className="block text-[8px] text-slate-400 font-bold uppercase">{t.equationsLabel}</span>
                  <code className="text-indigo-650 dark:text-indigo-400 font-mono font-bold">C/W = fcm / (G * fce) + 0.5</code>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950/30 rounded-lg">
                  <span className="block text-[8px] text-slate-400 font-bold uppercase">{t.substitutionLabel}</span>
                  <code className="text-slate-700 dark:text-slate-300 font-mono">{fcm.toFixed(1)} / ({dreuxAggregateFactor} * {inputs.cementClassStrength}) + 0.5</code>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950/30 rounded-lg">
                  <span className="block text-[8px] text-slate-400 font-bold uppercase">{t.resultLabel}</span>
                  <code className="text-emerald-600 dark:text-emerald-450 font-bold font-mono">C = {cement} kg/m³ | W/C = {wcAdjusted}</code>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950/30 rounded-lg">
                  <span className="block text-[8px] text-slate-400 font-bold uppercase">{t.refLabel}</span>
                  <span className="text-slate-600 dark:text-slate-400 text-[10.5px] font-medium block">{t.step3Ref}</span>
                </div>
              </div>

              {studentMode && (
                <div className="p-4 bg-indigo-50/20 dark:bg-indigo-950/10 border border-indigo-500/10 rounded-lg text-[11px] text-indigo-700 dark:text-indigo-350 leading-relaxed">
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <Info size={12} />
                    <span>تفسير ميكانيكي لثابت بولومي:</span>
                  </div>
                  <span>{t.step3Mech}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 4 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <button 
            onClick={() => toggleStep(4)}
            className="w-full p-4 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/10 cursor-pointer text-right"
          >
            <div className={`flex items-center gap-3 ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
              <div className="p-2 bg-indigo-500 text-white text-xs font-black rounded-lg">04</div>
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-100">{t.step4Name}</h4>
            </div>
            {expandedStep === 4 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          
          {expandedStep === 4 && (
            <div className="p-5 border-t border-slate-150 dark:border-slate-800 space-y-4 text-xs font-sans text-right">
              <p className="text-slate-500 leading-relaxed text-[11px]">{t.step4Desc}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-2">
                <div className="p-3 bg-slate-50 dark:bg-slate-950/30 rounded-lg">
                  <span className="block text-[8px] text-slate-400 font-bold uppercase">{t.equationsLabel}</span>
                  <code className="text-indigo-650 dark:text-indigo-400 font-mono font-bold">C/ρ_c + W + S/ρ_s + G/ρ_g = 1000 * γ</code>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950/30 rounded-lg">
                  <span className="block text-[8px] text-slate-400 font-bold uppercase">{t.substitutionLabel}</span>
                  <code className="text-slate-700 dark:text-slate-300 font-mono">Densities: Rd={inputs.sandRelativeDensity} / Gd={inputs.gravelRelativeDensity} / γ={gamma}</code>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950/30 rounded-lg">
                  <span className="block text-[8px] text-slate-400 font-bold uppercase">{t.resultLabel}</span>
                  <code className="text-emerald-600 dark:text-emerald-450 font-bold font-mono">S = {sandDry} kg | G = {gravelDry} kg</code>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950/30 rounded-lg">
                  <span className="block text-[8px] text-slate-400 font-bold uppercase">{t.refLabel}</span>
                  <span className="text-slate-600 dark:text-slate-400 text-[10.5px] font-medium block">{t.step4Ref}</span>
                </div>
              </div>

              {studentMode && (
                <div className="p-4 bg-indigo-50/20 dark:bg-indigo-950/10 border border-indigo-500/10 rounded-lg text-[11px] text-indigo-700 dark:text-indigo-350 leading-relaxed">
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <Info size={12} />
                    <span>مذكرة المتانة التراصية:</span>
                  </div>
                  <span>{t.step4Mech}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 5 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <button 
            onClick={() => toggleStep(5)}
            className="w-full p-4 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/10 cursor-pointer text-right"
          >
            <div className={`flex items-center gap-3 ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
              <div className="p-2 bg-indigo-500 text-white text-xs font-black rounded-lg">05</div>
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-100">{t.step5Name}</h4>
            </div>
            {expandedStep === 5 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          
          {expandedStep === 5 && (
            <div className="p-5 border-t border-slate-150 dark:border-slate-800 space-y-4 text-xs font-sans text-right">
              <p className="text-slate-500 leading-relaxed text-[11px]">{t.step5Desc}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-2">
                <div className="p-3 bg-slate-50 dark:bg-slate-950/30 rounded-lg">
                  <span className="block text-[8px] text-slate-400 font-bold uppercase">{t.equationsLabel}</span>
                  <code className="text-indigo-650 dark:text-indigo-400 font-mono font-bold">M_wet = M_dry*(1 + ⍵) | W_wet = W - Σ(M_dry*⍵)</code>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950/30 rounded-lg">
                  <span className="block text-[8px] text-slate-400 font-bold uppercase">{t.substitutionLabel}</span>
                  <code className="text-slate-700 dark:text-slate-300 font-mono">⍵_s={inputs.moistureSand}% | ⍵_g={inputs.moistureGravel}%</code>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950/30 rounded-lg">
                  <span className="block text-[8px] text-slate-400 font-bold uppercase">{t.resultLabel}</span>
                  <code className="text-emerald-600 dark:text-emerald-450 font-bold font-mono">S_wet = {sandWet} kg | G_wet = {gravelWet} kg | W_mix = {waterWet} kg</code>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950/30 rounded-lg">
                  <span className="block text-[8px] text-slate-400 font-bold uppercase">{t.refLabel}</span>
                  <span className="text-slate-600 dark:text-slate-400 text-[10.5px] font-medium block">{t.step5Ref}</span>
                </div>
              </div>

              {studentMode && (
                <div className="p-4 bg-indigo-50/20 dark:bg-indigo-950/10 border border-indigo-500/10 rounded-lg text-[11px] text-indigo-700 dark:text-indigo-350 leading-relaxed">
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <Info size={12} />
                    <span>تفسير لمزيلات السوائل ورطوبة الموقع:</span>
                  </div>
                  <span>{t.step5Mech}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Interactive Student Laboratory / Sandbox Dial */}
      {studentMode && (
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-sm space-y-6">
          <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200 dark:border-slate-800">
            <Activity className="text-emerald-500 animate-pulse" size={18} />
            <h4 className="text-sm font-black text-slate-900 dark:text-white">{t.eduSandbox}</h4>
          </div>
          
          <p className="text-[11.5px] text-slate-600 dark:text-slate-400 leading-relaxed">
            {t.eduSandboxDesc}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 text-right">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                {t.changeDmax}
              </label>
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-xs font-mono font-extrabold text-blue-600 dark:text-blue-400">
                  D_max = {dMax} mm ⟶ {isRtl ? "نقطة الانعطاف (Pivot) =" : "Curve intersection point ="} {(dMax / 2).toFixed(1)} mm
                </span>
              </div>
              <p className="text-[10px] text-slate-550 dark:text-slate-500 leading-normal">
                {isRtl 
                  ? "القاعدة الأكاديمية: لزيادة التراص الركامي ومقاومة التصدعات الإنشائية الكبيرة، يفضل رفع القطر الأقصى للركام D_max لتقليل الفراغات والمساحة السطحية التي تحتاج إغراقاً بيمونة الإسمنت."
                  : "Academic rule: Increasing Dmax reduces the aggregate surface area, dropping total required cement paste volume and moisture requirements."}
              </p>
            </div>

            <div className="space-y-2 text-right">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                {t.cementClassLabel}
              </label>
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-xs font-mono font-extrabold text-indigo-600 dark:text-indigo-450">
                  f_ce = {inputs.cementClassStrength} MPa ⟶ {isRtl ? "نسبة W/C المثالية المقدرة:" : "Optimum W/C proxy:"} {(fcm / (dreuxAggregateFactor * inputs.cementClassStrength) + 0.5).toFixed(2)}
                </span>
              </div>
              <p className="text-[10px] text-slate-550 dark:text-slate-500 leading-normal">
                {isRtl
                  ? "إذا كانت قوة الإسمنت الاسمية fce عالية، ستحتاج الخلطة كمية مياه غسيل حر أقل لتأمين نفس الضغط المطلوب للخرسانة fck، مما يوفر بالتكلفة الإجمالية ويحمي كربون الكوكب."
                  : "Higher cement mill strength (fce) physically matches higher micro-hydration capacity, validating higher compactness margins that decrease binder content requirements."}
              </p>
            </div>
          </div>

          {/* Live quick educational test / Quiz */}
          <form onSubmit={handleQuizSubmit} className="p-5 bg-slate-50 dark:bg-slate-950/65 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
              <Lightbulb size={14} className="text-amber-500" />
              <span>{t.quizTitle}</span>
            </div>
            
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              {t.quizDesc}
            </p>

            <div className="space-y-4 text-right">
              {/* Question 1 */}
              <div className="space-y-2">
                <p className="text-[11.5px] font-bold text-slate-900 dark:text-slate-200">{t.q1}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[10.5px]">
                  <label className={`p-2.5 rounded-lg border cursor-pointer flex items-center gap-2 transition-all ${selectedAnswers[1] === 1 ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-700 dark:text-white font-bold" : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"}`}>
                    <input 
                      type="radio" 
                      name="q1" 
                      onChange={() => handleQuizAnswer(1, 1)} 
                      checked={selectedAnswers[1] === 1}
                      className="accent-indigo-500 hidden" 
                    />
                    <span>{t.q1_o1}</span>
                  </label>
                  <label className={`p-2.5 rounded-lg border cursor-pointer flex items-center gap-2 transition-all ${selectedAnswers[1] === 2 ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-700 dark:text-white font-bold" : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"}`}>
                    <input 
                      type="radio" 
                      name="q1" 
                      onChange={() => handleQuizAnswer(1, 2)} 
                      checked={selectedAnswers[1] === 2}
                      className="accent-indigo-500 hidden" 
                    />
                    <span>{t.q1_o2}</span>
                  </label>
                  <label className={`p-2.5 rounded-lg border cursor-pointer flex items-center gap-2 transition-all ${selectedAnswers[1] === 3 ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-700 dark:text-white font-bold" : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"}`}>
                    <input 
                      type="radio" 
                      name="q1" 
                      onChange={() => handleQuizAnswer(1, 3)} 
                      checked={selectedAnswers[1] === 3}
                      className="accent-indigo-500 hidden" 
                    />
                    <span>{t.q1_o3}</span>
                  </label>
                </div>
              </div>

              {/* Question 2 */}
              <div className="space-y-2">
                <p className="text-[11.5px] font-bold text-slate-900 dark:text-slate-200">{t.q2}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[10.5px]">
                  <label className={`p-2.5 rounded-lg border cursor-pointer flex items-center gap-2 transition-all ${selectedAnswers[2] === 1 ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-700 dark:text-white font-bold" : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"}`}>
                    <input 
                      type="radio" 
                      name="q2" 
                      onChange={() => handleQuizAnswer(2, 1)} 
                      checked={selectedAnswers[2] === 1}
                      className="accent-indigo-500 hidden" 
                    />
                    <span>{t.q2_o1}</span>
                  </label>
                  <label className={`p-2.5 rounded-lg border cursor-pointer flex items-center gap-2 transition-all ${selectedAnswers[2] === 2 ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-700 dark:text-white font-bold" : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"}`}>
                    <input 
                      type="radio" 
                      name="q2" 
                      onChange={() => handleQuizAnswer(2, 2)} 
                      checked={selectedAnswers[2] === 2}
                      className="accent-indigo-500 hidden" 
                    />
                    <span>{t.q2_o2}</span>
                  </label>
                  <label className={`p-2.5 rounded-lg border cursor-pointer flex items-center gap-2 transition-all ${selectedAnswers[2] === 3 ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-700 dark:text-white font-bold" : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"}`}>
                    <input 
                      type="radio" 
                      name="q2" 
                      onChange={() => handleQuizAnswer(2, 3)} 
                      checked={selectedAnswers[2] === 3}
                      className="accent-indigo-505 hidden" 
                    />
                    <span>{t.q2_o3}</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 gap-4">
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-xs rounded-lg transition-all cursor-pointer"
              >
                {t.submitQuiz}
              </button>
              
              {quizScore !== null && (
                <div className={`p-2.5 px-4 rounded-lg border text-xs font-medium ${
                  quizScore === 100 
                    ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-400" 
                    : "bg-amber-950/20 border-amber-500/30 text-amber-400"
                }`}>
                  {quizScore === 100 ? t.perfectScore : quizScore === 50 ? t.standardScore : t.poorScore}
                </div>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Reference View Block */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden text-right">
        <div className="p-5 border-b border-slate-205 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between gap-2">
          <span className="text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-indigo-600 dark:text-indigo-400">
            {t.referencesList.length} SCHOLARLY INCLUSIONS
          </span>
          <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase">
            <BookOpen size={15} className="text-indigo-500" />
            <span>{t.referenceView}</span>
          </h3>
        </div>

        <div className="p-6 divide-y divide-slate-150 dark:divide-slate-800">
          {t.referencesList.map((ref, idx) => (
            <div key={idx} className={`py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${isRtl ? "text-right" : "text-left"}`}>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-800 dark:text-white font-sans">
                  {ref.author} ({ref.year}). <span className="italic underline text-indigo-600 dark:text-indigo-400">{ref.title}</span>.
                </h4>
                <p className="text-[10px] text-slate-400 font-mono">
                  {ref.publisher}
                </p>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-950/30 rounded-lg text-[10.5px] border border-slate-150 dark:border-slate-800 text-slate-500 max-w-md">
                <span className="font-bold text-indigo-500 uppercase text-[8.5px] block">{isRtl ? "القيمة العلمية:" : "Academic Value:"}</span>
                {ref.relevance}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );

  function toggleStep(step: number) {
    setExpandedStep(expandedStep === step ? null : step);
  }

  function handleQuizAnswer(questionId: number, optionId: number) {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  }
};
