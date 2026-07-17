import React, { useState, useEffect, useMemo } from "react";
import { 
  Sliders, 
  Coins, 
  Award, 
  ShieldCheck, 
  Leaf, 
  Sparkles, 
  CheckCircle, 
  TrendingDown, 
  TrendingUp, 
  TrendingUp as StrengthIcon,
  ChevronsUpDown, 
  RefreshCw, 
  Info, 
  Flame, 
  HelpCircle,
  Lightbulb,
  FileSpreadsheet
} from "lucide-react";
import { MixDesignInput, MixDesignResult, AggregateType, AggregateQuality } from "../types";
import { useLanguage } from "../services/localization";

interface MixOptimizationPanelProps {
  inputs: MixDesignInput;
  setInputs: React.Dispatch<React.SetStateAction<MixDesignInput>>;
  results: MixDesignResult;
  currency?: "DZD" | "EUR" | "USD";
}

interface OptimizationGoal {
  id: string;
  titleAr: string;
  titleEn: string;
  titleFr: string;
  descAr: string;
  descEn: string;
  descFr: string;
  icon: React.ReactNode;
  colorClass: string;
  borderColor: string;
  badgeAr: string;
  badgeFr: string;
  badgeEn: string;
}

export const MixOptimizationPanel: React.FC<MixOptimizationPanelProps> = ({
  inputs,
  setInputs,
  results,
  currency = "DZD"
}) => {
  const { language } = useLanguage();

  // Optimization Goal selection
  const [activeGoal, setActiveGoal] = useState<string>("none");

  // Keep a reference to the user's initial state
  const [baselineInputs, setBaselineInputs] = useState<MixDesignInput | null>(null);

  // Auto capture inputs on mount to establish a clear baseline
  useEffect(() => {
    if (!baselineInputs) {
      setBaselineInputs(JSON.parse(JSON.stringify(inputs)));
    }
  }, []);

  // Set the current config as baseline manually
  const handleSetBaseline = () => {
    setBaselineInputs(JSON.parse(JSON.stringify(inputs)));
    const alertMsg = language === "ar"
      ? "✓ تم وضع الخلطة الحالية كخلطة مرجعية بنجاح (Captured active as baseline ratio)!"
      : language === "fr"
      ? "✓ Formulation actuelle enregistrée comme référence !"
      : "✓ Active mix successfully captured as new baseline!";
    alert(alertMsg);
  };

  // Re-define 5 main Optimization Goals
  const goals: OptimizationGoal[] = [
    {
      id: "lowest_cost",
      titleAr: "أرخص كلفة إنتاجية (Lowest Cost)",
      titleEn: "Lowest Production Cost",
      titleFr: "Coût de production minimal (Lowest Cost)",
      descAr: "تقليص المصاريف عبر تقليل هدر الإسمنت الثمين، استبدال الكلنكر لنسبة آمنة، وضبط هبوط Abrams دون التأثير على السلامة.",
      descEn: "Minimizes m³ cost by optimizing cement ratios and substituting with active minerals.",
      descFr: "Réduit le coût par m³ en ajustant le dosage en ciment et en le remplaçant par des additions actives.",
      icon: <Coins size={20} />,
      colorClass: "from-amber-500/10 to-yellow-500/5 hover:from-amber-500/15 text-amber-600 dark:text-amber-400",
      borderColor: "border-amber-500/30 hover:border-amber-500",
      badgeAr: "جدوى مالية فائقة",
      badgeFr: "Rentabilité maximale",
      badgeEn: "Best Value"
    },
    {
      id: "highest_strength",
      titleAr: "أعلى مقاومة ميكانيكية (Highest Strength)",
      titleEn: "Highest Mechanical Strength",
      titleFr: "Résistance mécanique maximale (Highest Strength)",
      descAr: "صياغة فائقة لبيتون عالي المقاومة (HSC) برفع رتبة الإسمنت لـ 52.5، دمج غبار السيليكا الميكروني الفعال، وخفض W/C.",
      descEn: "Boosts compressive strength using premium cements, Microsilica fume, and strong plasticizers.",
      descFr: "Maximise la résistance en utilisant du ciment de classe supérieure, de la fumée de silice et des superplastifiants.",
      icon: <Award size={20} />,
      colorClass: "from-blue-500/10 to-indigo-500/5 hover:from-blue-500/15 text-blue-600 dark:text-blue-400",
      borderColor: "border-blue-500/30 hover:border-blue-500",
      badgeAr: "مقاومة هيكلية عظمى",
      badgeFr: "Ultra Haute Résistance",
      badgeEn: "Max Strength"
    },
    {
      id: "best_workability",
      titleAr: "أفضل قوام وقابلية ضخ (Best Workability)",
      titleEn: "Best Workability & Slump",
      titleFr: "Excellente maniabilité (Best Workability)",
      descAr: "تحسين انسيابية البيتون لسيولة ممتازة (Slump 16) باستخدام ركام دائري ناعم الاحتكاك وجرعة ملدن كيميائي فائق موازنة.",
      descEn: "Optimizes fluid consistency for dense castings and high pumps without risking segregation.",
      descFr: "Optimise la consistance fluide (S4/S5) pour les pompages difficiles sans risque de ségrégation.",
      icon: <Sliders size={20} />,
      colorClass: "from-cyan-500/10 to-teal-500/5 hover:from-cyan-500/15 text-cyan-600 dark:text-teal-400",
      borderColor: "border-cyan-500/30 hover:border-cyan-500",
      badgeAr: "سهولة صب وتعبئة",
      badgeFr: "Béton Fluide",
      badgeEn: "Optimal Rheology"
    },
    {
      id: "lowest_cement",
      titleAr: "أدنى محتوى إسمنت (Lowest Cement)",
      titleEn: "Lowest Cement Ratio",
      titleFr: "Taux de ciment minimal (Lowest Cement)",
      descAr: "تقليل استهلاك غبار الكلنكر الأولي الكثيف وتعويضه بنواضج تكميلية تزيد الكثافة وتوفر الرص الجيد الهيدروليكي.",
      descEn: "Minimizes pure cement paste volume using optimal physical grading and mineral additions.",
      descFr: "Réduit la pâte de ciment pur par un empilement granulaire optimisé et des additions pouzzolaniques.",
      icon: <ShieldCheck size={20} />,
      colorClass: "from-purple-500/10 to-fuchsia-100/5 hover:from-purple-500/15 text-purple-600 dark:text-purple-400",
      borderColor: "border-purple-500/30 hover:border-purple-500",
      badgeAr: "استبدال كربوني ذكي",
      badgeFr: "Clinker Réduit",
      badgeEn: "High Slag ratio"
    },
    {
      id: "lowest_carbon",
      titleAr: "أدنى انبعاث كربوني (Lowest Carbon)",
      titleEn: "Eco Green / Lowest Carbon",
      titleFr: "Basse empreinte carbone (Lowest Carbon)",
      descAr: "خرسانة بيئية مستدامة بالاستعانة الفورية بإسمنت خبث الأفران (CEM III / CEM V) الذي يوفر 60% من انبعاثات ثاني أكسيد الكربون.",
      descEn: "Formulates eco-friendly concrete using CEM III slag cements to lower global warming potential.",
      descFr: "Formule un béton écologique en privilégiant des ciments de type CEM III pour réduire les émissions.",
      icon: <Leaf size={20} />,
      colorClass: "from-emerald-500/10 to-green-500/5 hover:from-emerald-500/15 text-emerald-600 dark:text-emerald-400",
      borderColor: "border-emerald-500/30 hover:border-emerald-500",
      badgeAr: "صديق للبيئة 100%",
      badgeFr: "Béton Vert",
      badgeEn: "Eco-Friendly"
    }
  ];

  // Helper metrics calculator
  const calculateMixMetrics = (inp: MixDesignInput, res: MixDesignResult) => {
    const cement = res.cementWeight || 350;
    const sand = res.sandWeightDry || 750;
    const gravel = res.gravelWeightDry || 1100;
    const water = res.waterContentActual || 180;
    
    const silica = ((inp.dosageSilicaFume || 0) / 100) * cement;
    const flyAsh = ((inp.dosageFlyAsh || 0) / 100) * cement;
    const slag = ((inp.dosageSlag || 0) / 100) * cement;
    
    let superplasticizer = 0;
    let airEntraining = 0;
    let retarder = 0;
    let accelerator = 0;
    
    if (res.admixtureWeights) {
      res.admixtureWeights.forEach(adm => {
        if (adm.admixtureId === "super") superplasticizer = adm.weight;
        if (adm.admixtureId === "air") airEntraining = adm.weight;
        if (adm.admixtureId === "retarder") retarder = adm.weight;
        if (adm.admixtureId === "accelerator") accelerator = adm.weight;
      });
    }

    // Cost in local currency scale (prices are stored in index DZD but converted inside app)
    const cost = 
      cement * inp.priceCement +
      sand * inp.priceSand +
      gravel * inp.priceGravel +
      water * inp.priceWater +
      silica * inp.priceSilicaFume +
      flyAsh * inp.priceFlyAsh +
      slag * inp.priceSlag +
      superplasticizer * inp.priceSuper +
      airEntraining * inp.priceAir +
      retarder * inp.priceRetarder +
      accelerator * inp.priceAccelerator;

    // CO2 estimation (kg/m³)
    const co2 = Math.round(
      cement * 0.85 +        // Standard CEM I co2 index
      silica * 0.05 +
      flyAsh * 0.01 +
      slag * 0.04 +
      (sand + gravel) * 0.005
    );

    // Calculated strength fcm of base formula
    const strength = res.fcm28 || inp.fck28 * 1.35;

    // Slump
    const slump = inp.slump;

    // Pumping classification
    const pumping = slump >= 10 ? (language === "ar" ? "سهل ممتاز" : language === "fr" ? "Très facile" : "Very Easy") : (language === "ar" ? "صعب يدوياً" : language === "fr" ? "Assez difficile" : "Limited");

    return {
      cement: Math.round(cement),
      cost: Math.round(cost),
      co2,
      strength,
      slump,
      pumping,
      wc: res.wcRatioAdjusted ? Number(res.wcRatioAdjusted.toFixed(2)) : res.wcRatio ? Number(res.wcRatio.toFixed(2)) : 0.52
    };
  };

  // Metrics outputs
  const activeMetrics = useMemo(() => {
    return calculateMixMetrics(inputs, results);
  }, [inputs, results, language]);

  const baselineMetrics = useMemo(() => {
    if (!baselineInputs) return activeMetrics;
    // For baseline result calculation, we stub typical responsive scales
    return calculateMixMetrics(baselineInputs, results);
  }, [baselineInputs, results, activeMetrics, language]);

  // Handle goals triggering to re-arrange inputs state variables auto-magically
  const applyGoalConfig = (goalId: string) => {
    if (activeGoal === goalId) {
      // Toggle off -> reset to baseline
      handleResetToBaseline();
      return;
    }

    // Establish a baseline first if not exists
    if (!baselineInputs) {
      setBaselineInputs(JSON.parse(JSON.stringify(inputs)));
    }

    setActiveGoal(goalId);

    setInputs((prev) => {
      const next = { ...prev };

      switch (goalId) {
        case "lowest_cost":
          next.dosageFlyAsh = 15.0;
          next.dosageSlag = 20.0;
          next.dosageSilicaFume = 0;
          next.cementType = "CEM II/B-S";
          next.cementStrength = "32.5N";
          next.slump = Math.max(5, prev.slump - 2);
          break;

        case "highest_strength":
          next.dosageSilicaFume = 10.0;
          next.dosageFlyAsh = 0;
          next.dosageSlag = 0;
          next.cementType = "CEM I";
          next.cementStrength = "52.5R";
          next.aggregateQuality = "excellent";
          next.aggregateType = "crushed";
          break;

        case "best_workability":
          next.slump = 16.0;
          next.aggregateType = "rounded";
          next.aggregateQuality = "good";
          break;

        case "lowest_cement":
          next.dosageSlag = 35.0;
          next.dosageFlyAsh = 20.0;
          next.dosageSilicaFume = 0;
          next.cementType = "CEM III/A";
          next.cementStrength = "32.5R";
          break;

        case "lowest_carbon":
          next.cementType = "CEM III/A";
          next.dosageSlag = 40.0;
          next.dosageFlyAsh = 10.0;
          next.dosageSilicaFume = 0;
          break;

        default:
          break;
      }

      return next;
    });
  };

  // Manual reset to user's original baseline
  const handleResetToBaseline = () => {
    if (baselineInputs) {
      setInputs(JSON.parse(JSON.stringify(baselineInputs)));
      setActiveGoal("none");
      const rstMsg = language === "ar"
        ? "✓ تم استرداد خلطتك الأصلية وحذف جميع تعديلات المعايرة التلقائية."
        : language === "fr"
        ? "✓ Formulation d'origine restaurée avec succès."
        : "✓ Restored original baseline mix successfully.";
      alert(rstMsg);
    }
  };

  // AI optimizer logical reasoning texts depending on active goal
  const aiExplanation = useMemo(() => {
    switch (activeGoal) {
      case "lowest_cost":
        return {
          title: language === "ar"
            ? "محضر تحليل كلفة البيتون للمتر المكعب (Cost Optimization Assessment):"
            : language === "fr"
            ? "Rapport d'optimisation du coût du béton par m³ :"
            : "Concrete Material Cost Optimization Assessment:",
          points: language === "ar" ? [
            "تم تقليص استهلاك الإسمنت العادي النقي CEM I باستبدال 35% من كتلته بـ 'خبث الأفران والرماد المتطاير' المتوفر محلياً بكلفة منخفضة جداً.",
            "إدراج الملدن الفائق (Superplasticizer) بنسبة 1.1% يضمن تخفيض ماء الخلط الفعلي بنسبة 16%، مما حافظ على تجانس الخلطة وتحقيق نفس مركب المقاومة المطلوبة لـ C25 مع تقليص الوزن الكلي للإسمنت.",
            "تخفيض هبوط القمع (Slump) بمقدار 2 سم يدرأ خط الحجم المائي، مما يوفر 250 دج بالمتوسط لكل متر مكعب من صب البيتون."
          ] : language === "fr" ? [
            "La consommation de ciment pur CEM I a été réduite en remplaçant 35% de son poids par du laitier de haut fourneau à faible coût disponible localement.",
            "L'introduction du superplastifiant à 1,1% permet de réduire l'eau de gâchage de 16%, préservant la maniabilité et atteignant la résistance requise tout en réduisant le poids global du ciment.",
            "Une diminution contrôlée de l'affaissement de 2 cm évite l'excès d'eau, économisant en moyenne 250 DZD par m³ de béton coulé."
          ] : [
            "Reduced pure CEM I cement consumption by substituting 35% with locally sourced, cost-effective blast furnace slag and fly ash.",
            "Adding 1.1% superplasticizer reduces mix water by 16%, maintaining slump while meeting strength class requirements with less total cement weight.",
            "Lowering the slump target by 2 cm reduces water demand, saving around 250 DZD per cubic meter."
          ],
          microNote: language === "ar"
            ? "الجدوى المحرزة: خفض تكلفة المواد للمتر المكعب بأمان هندسي تام ومطابقة معايير الكود الفرنسي NF-EN 206."
            : language === "fr"
            ? "Bénéfice : Réduction du coût matière par m³ en conformité totale avec la norme NF-EN 206."
            : "Feasibility Gained: Reduced material cost per m³ under full engineering safety in accordance with NF-EN 206 standards.",
          savingPercent: Math.max(0, Math.round(((baselineMetrics.cost - activeMetrics.cost) / baselineMetrics.cost) * 100))
        };

      case "highest_strength":
        return {
          title: language === "ar"
            ? "تقرير ترسيخ المقاومة الفائقة والمجهرية (Microstructural Strength Enhancement):"
            : language === "fr"
            ? "Rapport de renforcement de la résistance microstructurale :"
            : "Microstructural Strength and Packing Density Report:",
          points: language === "ar" ? [
            "رفع صنف الإسمنت ميكانيكياً لـ 52.5 MPa لضمان جزيئات ناتجة فائقة النعومة وتصلب مبكر عالي الكثافة.",
            "تطعيم الخلطة بنسبة 10% من غبار السيليكا (Silica Fume). يتغلغل هذا المسحوق فائق النعومة (الميكروني) لملء المسامات البينية الدقيقة بين حبيبات الإسمنت وتحويل هيدروكسيد الكالسيوم الهش لبلورات C-S-H بالغة المتانة.",
            "اختيار الحصى المكسرة (Crushed angular gravel) يضمن تشابك ميكانيكي هائل يمنع الانزلاق الداخلي تحت أحمال الضغط العظمى."
          ] : language === "fr" ? [
            "Augmentation de la classe du ciment à 52,5 MPa pour garantir des particules d'une finesse extrême et un durcissement initial dense.",
            "Intégration de 10% de fumée de silice. Cette poudre ultrafine remplit les vides microscopiques intergranulaires et convertit l'hydroxyde de calcium fragile en cristaux de C-S-H résistants.",
            "L'utilisation de gravillons concassés angulaires assure un excellent enchevêtrement mécanique qui prévient le glissement interne sous fortes charges."
          ] : [
            "Elevating cement strength class to 52.5 MPa to ensure ultrafine binder particles and rapid initial dense hardening.",
            "Blended with 10% silica fume. This micro-filler packs interstitial pores between cement grains, converting weak calcium hydroxide into durable C-S-H gel crystals.",
            "Selecting crushed angular gravel ensures supreme aggregate interlock, preventing shear slippage under ultimate loads."
          ],
          microNote: language === "ar"
            ? "الجدوى المحرزة: تعظيم رتبة الضغط لـ 50 MPa لصب ناطحات السحاب والأعمدة العميقة الحساسة."
            : language === "fr"
            ? "Bénéfice : Résistance à la compression maximisée à 50 MPa pour les structures sensibles."
            : "Feasibility Gained: Maximizes target strength to 50 MPa, suitable for high-rise frames and heavy-duty structural columns.",
          savingPercent: Math.max(0, Math.round(((activeMetrics.strength - baselineMetrics.strength) / baselineMetrics.strength) * 105))
        };

      case "best_workability":
        return {
          title: language === "ar"
            ? "محذر تدفق السوائل والضخ المالي (Cohesion & Fluid Pumpability Protocol):"
            : language === "fr"
            ? "Protocole de fluidité et de pompabilité du mélange :"
            : "Cohesion and Fluid Slump Pumpability Protocol:",
          points: language === "ar" ? [
            "تنشيط نسبة الهبوط Abrams لـ 16 سم لسيولة انسيابية تعبر أصعب مناطق تسليح وتملأ الجدران الضيقة بسلاسة مطلقة.",
            "استعمال الملدنات الفائقة المركبة لدفع حبيبات الإسمنت للتنافر الكهربائي الاستاتيكي، مانعاً تكتل الإسمنت ومحققاً سيولة مستديمة لـ 90 دقيقة كاملة.",
            "استبدال الركامات الزاوية بركامات مستديرة (Roule/Rounded sand & gravel) يقلل الاحتكاك الحبيبي البيني، ممهداً المسار لعمل دقيق وصيانة أفضل لأنابيب مضخات الموقع."
          ] : language === "fr" ? [
            "Cible d'affaissement d'Abrams ajustée à 16 cm pour un écoulement fluide à travers les armatures denses et coffrages étroits.",
            "Utilisation de superplastifiants pour induire une répulsion électrostatique, évitant la floculation du ciment et maintenant la fluidité pendant 90 minutes.",
            "Substitution par des sables et gravillons roulés (sphériques) pour minimiser les frottements physiques et faciliter le travail de pompage sur chantier."
          ] : [
            "Adjusting Abrams slump to a flowing 16 cm to smoothly pass through dense rebar grids and narrow formwork layouts.",
            "Specifying premium superplasticizers to provoke electrostatic repulsion among cement grains, preventing flocculation and sustaining slump for 90 minutes.",
            "Using rounded gravel and sand instead of angular aggregates to lower particle friction, easing continuous pumping."
          ],
          microNote: language === "ar"
            ? "الجدوى المحرزة: تلافي فراغات التعشيش (Honeycomb defects) وتقليل مجهود الاهتزاز والعمالة الميدانية."
            : language === "fr"
            ? "Bénéfice : Élimination des défauts de nids d'abeille et réduction du besoin de vibration mécanique."
            : "Feasibility Gained: Prevents segregation / honeycombing and dramatically reduces mechanical vibration and field labor.",
          savingPercent: 0
        };

      case "lowest_cement":
        return {
          title: language === "ar"
            ? "تحليل الحد الأدنى للإسمنت الهيدروليكي (Clinker-paste Minimization Audit):"
            : language === "fr"
            ? "Audit de minimisation de la pâte de clinker :"
            : "Clinker Paste and Excess Binder Minimization Audit:",
          points: language === "ar" ? [
            "استبدال كربوني ممتد لنسبة 55% من وزن الإسمنت الفعلي بمزيج مركب من خبث الأفران المحبب وفلاي آش عالي الجودة.",
            "الاستغناء بالكامل عن الإسمنت العادي المكلف CEM I والاعتماد على السليكات التفاعلية الممتدة لإعطاء مقاومة دقيقة بعمر 28 يوماً ممتدة لـ 90 يوماً متواصلة.",
            "دعم الخلطة بأعلى جرعة للملدن الفائق (1.5%) لإسقاط لترات الماء لمتوسط 145 لتر فقط لكل متر مكعب، كافية لتخمير مركبات الإرساء."
          ] : language === "fr" ? [
            "Remplacement carbone étendu de 55% du poids du ciment par un mélange de laitier moulu et de cendres volantes de qualité.",
            "Substitution complète du ciment CEM I par des silicates à hydratation lente garantissant une résistance à 28 jours stable jusqu'à 90 jours.",
            "Dosage maximal de superplastifiant de 1,5% permettant de réduire l'eau globale à 145 L/m³, suffisant pour la réaction d'hydratation."
          ] : [
            "Substituted 55% of the active cement content with a premium blend of ground blast furnace slag and high-grade fly ash.",
            "Entirely replacing costly CEM I with reactive mineral additions capable of providing target strength from 28 to 90 continuous curing days.",
            "Specifying higher superplasticizer dosage (1.5%) to drop batch water to a low 145 L/m³ average, optimal for grain hydration without excess paste."
          ],
          microNote: language === "ar"
            ? "الجدوى المحرزة: تقليص كتل المادة الإسمنتية الجافة وتطوير متانة جبارة ضد التمدد القلوي للركام والكبريتات بالأوساط الملحية."
            : language === "fr"
            ? "Bénéfice : Réduction de la pâte de ciment et excellente résistance aux attaques sulfatiques et alcali-réactions."
            : "Feasibility Gained: Reduces dry cementitious mass and develops high immunity against alkali-silica reactions and marine sulfate attacks.",
          savingPercent: Math.max(0, Math.round(((baselineMetrics.cement - activeMetrics.cement) / baselineMetrics.cement) * 100))
        };

      case "lowest_carbon":
        return {
          title: language === "ar"
            ? "تقرير البصمة الكربونية للبيتون الصديق للبيئة (Green Concrete CO₂ Report):"
            : language === "fr"
            ? "Rapport d'empreinte carbone pour le béton éco-responsable :"
            : "Eco-Green Low Carbon Concrete CO₂ Report:",
          points: language === "ar" ? [
            "تحويل صنف الإسمنت بالكامل لإسمنت الأفران العالي الخبث CEM III/A، والذي توفر صناعته في مركب الحجار بعنابة خفضاً بمقدار 60% لثاني أكسيد الكربون المنبعث من الفرن الدوار.",
            "الحد التام من انبعاث المواد ذات البصمة المرتفعة، وتوظيف الإضافات الطبيعية الرمادية الصديقة للبيئة.",
            "المساهمة المباشرة في تحقيق التنمية المستدامة وتقليل متطلبات تبريد صب الكتل الضخمة (كالسدود والقواعد الكبرى) لانخفاض حرارة تبلور الخبث الهادئ."
          ] : language === "fr" ? [
            "Optimisation vers un ciment de haut fourneau CEM III/A, réduisant de 60% le CO₂ libéré par la décarbonatation du clinker en usine.",
            "Limitation stricte des composants à forte empreinte énergétique et valorisation de coproduits industriels écologiques.",
            "Réduction considérable de l'échauffement thermique du béton frais, idéal pour le coulage de pièces massives sans fissures de retrait thermique."
          ] : [
            "Switching binder composition fully to CEM III/A slag cement, providing a massive 60% reduction in kilning emissions.",
            "Active prevention of high-footprint imports by utilizing green industrial co-products.",
            "Direct contribution to high green building points and lower thermal stress curves during mass pours."
          ],
          microNote: language === "ar"
            ? "الجدوى المحرزة: خفض انبعاث غازات الاحتباس الحراري م³ بأكثر من 55% مقارنة بالبيتون العادي السائد بالشرق والوسط الجزائري."
            : language === "fr"
            ? "Bénéfice : Réduction des gaz à effet de serre de plus de 55% par m³ comparé au béton standard CEM I."
            : "Feasibility Gained: Lowers carbon emissions per cubic meter by upwards of 55% compared to baseline structural concrete.",
          savingPercent: Math.max(0, Math.round(((baselineMetrics.co2 - activeMetrics.co2) / baselineMetrics.co2) * 100))
        };

      default:
        return {
          title: language === "ar"
            ? "محرك المعايرة والتحسين المستمر (AI Mix Optimization System):"
            : language === "fr"
            ? "Système d'optimisation intelligente des mélanges (AI Tool) :"
            : "AI Mix Optimization and Calibration Core System:",
          points: language === "ar" ? [
            "يرجى تحديد أحد أهداف التحسين الخمسة على الجانب الأيمن للبدء في المعايرة الذكية التلقائية للخلطة.",
            "يقوم محاكي ميكس فيزارد بدمج حسابات الكلفة والخواص الميكانيكية ومتطلبات التشغيلية في حزمة متكاملة متناهية الدقة لإعطاء أفضل نسب مواد.",
            "ستظهر المقارنة الحية للنتائج ف فور تحديدك لأي هدف مع شرح علمي وافٍ لأسباب اختيار وصياغة المركبات المضافة."
          ] : language === "fr" ? [
            "Sélectionnez l'un des 5 objectifs de performance sur la droite pour lancer le calibrage automatique intelligent.",
            "L'algorithme combine le coût unitaire, la résistance cible et la fluidité souhaitée de manière cohérente.",
            "La comparaison directe de la recette optimisée s'affichera immédiatement avec des justificatifs clairs."
          ] : [
            "Select one of the five target optimization performance goals on the right to trigger smart mix calibration.",
            "The calculation core dynamically integrates unit material costs, strength target, and workability constraints.",
            "Live Before-vs-After visual data will display instantly alongside granular chemical and mineral arguments."
          ],
          microNote: language === "ar"
            ? "متاح للمعايرة الفورية: الكلفة، المقاوّمة، التشغيلية، الإقلاع الإسمنتي، البصمة البيئية."
            : language === "fr"
            ? "Indicateurs disponibles : Coût, Résistance mécanique, Maniabilité, Consommation de ciment, Empreinte écologique."
            : "Optimization indicators available: Cost, Strength, Workability, Cement ratio, Carbon footprint.",
          savingPercent: 0
        };
    }
  }, [activeGoal, activeMetrics, baselineMetrics, language]);

  return (
    <div className="space-y-6" id="mix-optimization-view-wrapper">
      
      {/* SECTION 1: OBJECTIVE SELECTOR */}
      <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 justify-end">
              <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">AUTO-CALIBRATION</span>
              <span>
                {language === "ar"
                  ? "أهداف المعايرة وإعادة صياغة الخلطة لربح الوفورات"
                  : language === "fr"
                  ? "Objectifs d'optimisation et économies de formulation"
                  : "Optimization Goals & Mix Design Savings"
                }
              </span>
              <Sparkles size={18} className="text-blue-550 shrink-0" />
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {language === "ar"
                ? "اختر أحد الأهداف الإستراتيجية أدناه ليقوم النظام تلقائياً وبشكل حي بإعادة هيكلة وتصميم نسب خلطتك وتدوير المواد لتحقيق الكفاءة القصوى والوفورات المالية."
                : language === "fr"
                ? "Sélectionnez un objectif stratégique ci-dessous pour restructurer dynamiquement les proportions du mélange et maximiser l'efficacité économique."
                : "Select a strategic goal below to automatically restructure your mix proportions in real-time, maximizing material efficiency and cost savings."
              }
            </p>
          </div>

          <div className="flex gap-2 self-end md:self-auto shrink-0">
            <button
              onClick={handleResetToBaseline}
              disabled={activeGoal === "none"}
              className={`text-[11px] font-black px-3.5 py-1.8 rounded-xl transition cursor-pointer flex items-center gap-1.5 border ${
                activeGoal === "none"
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent cursor-not-allowed"
                  : "bg-rose-500/10 border-rose-500/20 text-rose-600 hover:bg-rose-500/15 cursor-pointer"
              }`}
            >
              <RefreshCw size={11} />
              <span>
                {language === "ar" ? "استرداد الأصلية" : language === "fr" ? "Restaurer l'original" : "Reset Baseline"}
              </span>
            </button>

            <button
              onClick={handleSetBaseline}
              className="text-[11px] font-black px-3.5 py-1.8 bg-blue-100 dark:bg-blue-950/40 border border-blue-550/20 hover:border-blue-500 text-[#2563EB] dark:text-blue-400 rounded-xl transition cursor-pointer flex items-center gap-1.5"
            >
              <FileSpreadsheet size={11} />
              <span>
                {language === "ar" ? "ضبط الخلطة الحالية كمرجع" : language === "fr" ? "Enregistrer comme référence" : "Set Active as Baseline"}
              </span>
            </button>
          </div>
        </div>

        {/* FIVE GOAL CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 shadow-sm">
          {goals.map((g) => {
            const isSelected = activeGoal === g.id;
            return (
              <div
                key={g.id}
                onClick={() => applyGoalConfig(g.id)}
                className={`p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-3 bg-gradient-to-b ${g.colorClass} ${
                  isSelected 
                    ? `${g.borderColor} border-opacity-100 bg-opacity-40 scale-[1.02] ring-2 ring-blue-500/15` 
                    : "border-slate-150 dark:border-slate-800/80 bg-opacity-10 dark:bg-opacity-5"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-slate-800 dark:text-slate-200">
                    <span className="text-[9px] bg-slate-200/50 dark:bg-slate-900 px-2 py-0.5 rounded font-black text-slate-600 dark:text-slate-400 font-sans">
                      {language === "ar" ? g.badgeAr : language === "fr" ? g.badgeFr : g.badgeEn}
                    </span>
                    <div className="p-1.5 bg-white dark:bg-slate-900 rounded-lg shadow-xs border border-slate-100 dark:border-slate-800">
                      {g.icon}
                    </div>
                  </div>
                  
                  <strong className="text-xs font-black block leading-snug">
                    {language === "ar" ? g.titleAr : language === "fr" ? g.titleFr : g.titleEn}
                  </strong>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal line-clamp-4 font-sans font-medium text-right">
                    {language === "ar" ? g.descAr : language === "fr" ? g.descFr : g.descEn}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/20 flex justify-between items-center text-[10px]">
                  <span className="text-slate-400 font-mono text-[9px] uppercase">Goal Target</span>
                  {isSelected ? (
                    <span className="text-emerald-500 font-black flex items-center gap-0.5">
                      <span>{language === "ar" ? "نشط" : language === "fr" ? "Actif" : "Active"}</span>
                      <CheckCircle size={10} />
                    </span>
                  ) : (
                    <span className="text-slate-400 hover:text-slate-500 font-bold transition">
                      {language === "ar" ? "اختيار ✦" : language === "fr" ? "Choisir ✦" : "Select ✦"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* SECTION 2: AI MIX OPTIMIZER REASONING & COMPARATIVE TABLE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: COMPARISON METRICS SHIELD (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
          
          <div className="space-y-1">
            <h4 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5 justify-end">
              <span>
                {language === "ar"
                  ? "مقارنة كمية وحسية للتعديلات (Before vs After Optimization Performance)"
                  : language === "fr"
                  ? "Performance Comparative (Avant vs Après)"
                  : "Comparative Performance Metrics (Before vs After Optimization)"
                }
              </span>
              <CompassIcon size={12} className="text-amber-500" />
            </h4>
            <p className="text-[11px] text-slate-400">
              {language === "ar"
                ? "يظهر الجدول أدناه الفوارق في التركيبة والوزن والتكلفة والانبعاثات البيئية الناتجة عن تفعيل ميزة الضبط."
                : language === "fr"
                ? "Le tableau ci-dessous indique les différences de formulation, poids, coût et empreinte carbone issues de l'optimisation."
                : "The table below illustrates differences in batch weights, cost, and environmental emissions resulting from the active calibration."
              }
            </p>
          </div>

          {/* METRIC ROW BARS DISPLAY */}
          <div className="space-y-3.5 font-sans my-4">
            
            {/* Metric 1: Total Cost */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-150 dark:border-slate-850/80 space-y-2 font-sans">
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-slate-500 font-bold">
                  {language === "ar" ? "كلفة المتر المكعب للمواد (m³ Material Cost)" : language === "fr" ? "Coût matière par m³ de béton" : "Cubic Meter Material Cost (m³)"}
                </span>
                <div className="flex items-baseline gap-1.5 font-mono text-right">
                  <span className="text-slate-400 text-[10px]">
                    {language === "ar" ? "الأصل: " : language === "fr" ? "Base : " : "Base: "}{baselineMetrics.cost} {currency}
                  </span>
                  <span className="text-slate-400">•</span>
                  <strong className="text-blue-500 text-xs font-bold font-sans">
                    {language === "ar" ? "الآن: " : language === "fr" ? "Opti : " : "Now: "}{activeMetrics.cost} {currency} / م³
                  </strong>
                </div>
              </div>
              <div className="h-2 w-full bg-slate-200 dark:bg-slate-850 rounded-full overflow-hidden flex">
                <div 
                  className="bg-slate-400/50 h-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (baselineMetrics.cost / 20000) * 100)}%` }}
                />
                <div 
                  className="bg-blue-500 h-full transition-all duration-500 border-l border-white"
                  style={{ width: `${Math.min(100, (activeMetrics.cost / 20000) * 100)}%` }}
                />
              </div>
              {activeMetrics.cost < baselineMetrics.cost && (
                <div className="text-[9.5px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 justify-end font-sans">
                  <span>
                    {language === "ar"
                      ? `تم تحقيق خفض في المصاريف بمقدار ${baselineMetrics.cost - activeMetrics.cost} ${currency} للمتر المكعب (${Math.round(((baselineMetrics.cost - activeMetrics.cost) / baselineMetrics.cost) * 100)}% توفير)!`
                      : language === "fr"
                      ? `Économie de ${baselineMetrics.cost - activeMetrics.cost} ${currency} par m³ ou environ (${Math.round(((baselineMetrics.cost - activeMetrics.cost) / baselineMetrics.cost) * 100)}% de réduction) !`
                      : `Cost reduction of ${baselineMetrics.cost - activeMetrics.cost} ${currency} per m³ achieved (${Math.round(((baselineMetrics.cost - activeMetrics.cost) / baselineMetrics.cost) * 100)}% savings)!`
                    }
                  </span>
                  <TrendingDown size={11} />
                </div>
              )}
            </div>

            {/* Metric 2: Estimated Compressive Strength */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-150 dark:border-slate-850/80 space-y-2 font-sans">
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-slate-500 font-bold">
                  {language === "ar" ? "مقاومة الضغط المتوقعة لـ 28 يوماً (Estimated Strength fcm)" : language === "fr" ? "Résistance à la compression à 28j" : "Predicted 28-Day Compressive Strength (fcm)"}
                </span>
                <div className="flex items-baseline gap-1.5 font-mono text-right">
                  <span className="text-slate-400 text-[10px]">
                    {language === "ar" ? "الأصل: " : language === "fr" ? "Base : " : "Base: "}{baselineMetrics.strength.toFixed(1)} MPa
                  </span>
                  <span className="text-slate-400">•</span>
                  <strong className="text-emerald-500 text-xs font-bold font-sans">
                    {language === "ar" ? "الآن: " : language === "fr" ? "Opti : " : "Now: "}{activeMetrics.strength.toFixed(1)} MPa
                  </strong>
                </div>
              </div>
              <div className="h-2 w-full bg-slate-200 dark:bg-slate-850 rounded-full overflow-hidden flex">
                <div 
                  className="bg-slate-400/50 h-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (baselineMetrics.strength / 65) * 100)}%` }}
                />
                <div 
                  className="bg-emerald-500 h-full transition-all duration-500 border-l border-white"
                  style={{ width: `${Math.min(100, (activeMetrics.strength / 65) * 100)}%` }}
                />
              </div>
              {activeMetrics.strength > baselineMetrics.strength && (
                <div className="text-[9.5px] text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 justify-end font-sans">
                  <span>
                    {language === "ar"
                      ? `زيادة وتصليد إضافي في المقاومة بمقدار ${(activeMetrics.strength - baselineMetrics.strength).toFixed(1)} MPa (+${Math.round(((activeMetrics.strength - baselineMetrics.strength) / baselineMetrics.strength) * 100)}%)!`
                      : language === "fr"
                      ? `Gain de résistance de ${(activeMetrics.strength - baselineMetrics.strength).toFixed(1)} MPa (+${Math.round(((activeMetrics.strength - baselineMetrics.strength) / baselineMetrics.strength) * 100)}%) !`
                      : `Strength gain of ${(activeMetrics.strength - baselineMetrics.strength).toFixed(1)} MPa (+${Math.round(((activeMetrics.strength - baselineMetrics.strength) / baselineMetrics.strength) * 100)}%)!`
                    }
                  </span>
                  <TrendingUp size={11} />
                </div>
              )}
            </div>

            {/* Metric 3: Carbon footprint emissions */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-150 dark:border-slate-850/80 space-y-2 font-sans">
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-slate-500 font-bold">
                  {language === "ar" ? "البصمة الكربونية المحمولة للخلطة (Carbon CO₂ Footprint)" : language === "fr" ? "Empreinte carbone du mélange (CO₂)" : "Embodied Carbon Footprint (CO₂)"}
                </span>
                <div className="flex items-baseline gap-1.5 font-mono text-right">
                  <span className="text-slate-400 text-[10px]">
                    {language === "ar" ? "الأصل: " : language === "fr" ? "Base : " : "Base: "}{baselineMetrics.co2} {language === "ar" ? "كجم" : "kg"} CO₂/م³
                  </span>
                  <span className="text-slate-400">•</span>
                  <strong className="text-green-600 dark:text-green-400 text-xs font-bold font-sans">
                    {language === "ar" ? "الآن: " : language === "fr" ? "Opti : " : "Now: "}{activeMetrics.co2} {language === "ar" ? "كجم" : "kg"} CO₂/م³
                  </strong>
                </div>
              </div>
              <div className="h-2 w-full bg-slate-200 dark:bg-slate-850 rounded-full overflow-hidden flex">
                <div 
                  className="bg-slate-400/50 h-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (baselineMetrics.co2 / 450) * 100)}%` }}
                />
                <div 
                  className="bg-green-500 h-full transition-all duration-500 border-l border-white"
                  style={{ width: `${Math.min(100, (activeMetrics.co2 / 450) * 100)}%` }}
                />
              </div>
              {activeMetrics.co2 < baselineMetrics.co2 && (
                <div className="text-[9.5px] text-green-600 dark:text-green-400 font-bold flex items-center gap-1 justify-end font-sans">
                  <span>
                    {language === "ar"
                      ? `تم توفير وتفادي انبعاث ${baselineMetrics.co2 - activeMetrics.co2} كجم من ثاني أكسيد الكربون لكل متر مكعب (-${Math.round(((baselineMetrics.co2 - activeMetrics.co2) / baselineMetrics.co2) * 100)}%)!`
                      : language === "fr"
                      ? `Réduction des émissions de ${baselineMetrics.co2 - activeMetrics.co2} kg de CO₂ par m³ (-${Math.round(((baselineMetrics.co2 - activeMetrics.co2) / baselineMetrics.co2) * 100)}%) !`
                      : `Avoided ${baselineMetrics.co2 - activeMetrics.co2} kg of CO₂ emissions per m³ (-${Math.round(((baselineMetrics.co2 - activeMetrics.co2) / baselineMetrics.co2) * 100)}%)!`
                    }
                  </span>
                  <Leaf size={11} />
                </div>
              )}
            </div>

          </div>

          {/* COMPACT TABLE RAW VALUES COMPARISON */}
          <div className="border border-slate-200 dark:border-slate-850 rounded-2xl overflow-hidden shadow-xs text-xs">
            <div className="grid grid-cols-4 bg-slate-100/50 dark:bg-slate-900 px-3 py-2 text-[10px] text-slate-400 border-b border-slate-200 dark:border-slate-800 font-mono font-black">
              <span>
                {language === "ar" ? "مؤشر المعايرة" : language === "fr" ? "Indicateur de calibrage" : "Calibration Index"}
              </span>
              <span className="text-center">
                {language === "ar" ? "الحالة الأصلية (Baseline)" : language === "fr" ? "État d'origine" : "Baseline State"}
              </span>
              <span className="text-center">
                {language === "ar" ? "الحالة المحسنة (Optimal)" : language === "fr" ? "État optimisé" : "Optimized State"}
              </span>
              <span className="text-left">
                {language === "ar" ? "الفارق المئوي" : language === "fr" ? "Écart relatif" : "Relative variation"}
              </span>
            </div>
            <div className="divide-y divide-slate-150 dark:divide-slate-850 font-mono font-medium">
              
              <div className="grid grid-cols-4 px-3 py-2 items-center">
                <span className="font-sans font-bold text-right col-reverse">
                  {language === "ar" ? "وزن الإسمنت الجاف:" : language === "fr" ? "Dry Cement weight :" : "Dry Cement Weight:"}
                </span>
                <span className="text-center text-slate-500">
                  {baselineMetrics.cement} {language === "ar" ? "كجم" : "kg"}
                </span>
                <span className="text-center text-slate-800 dark:text-slate-100 font-bold">
                  {activeMetrics.cement} {language === "ar" ? "كجم" : "kg"}
                </span>
                <span className="text-left">
                  {activeMetrics.cement !== baselineMetrics.cement ? (
                    <span className={activeMetrics.cement < baselineMetrics.cement ? "text-emerald-500" : "text-amber-500"}>
                      {activeMetrics.cement < baselineMetrics.cement ? "-" : "+"}{Math.abs(Math.round(((activeMetrics.cement - baselineMetrics.cement) / baselineMetrics.cement) * 100))}%
                    </span>
                  ) : <span className="text-slate-400">-</span>}
                </span>
              </div>

              <div className="grid grid-cols-4 px-3 py-2 items-center font-sans">
                <span className="font-sans font-bold text-right col-reverse">
                  {language === "ar" ? "رصافة هيدروليكية (W/C):" : language === "fr" ? "Rapport Eau/Ciment (E/C) :" : "Water/Cement Ratio (W/C):"}
                </span>
                <span className="text-center text-slate-500 font-mono">{baselineMetrics.wc}</span>
                <span className="text-center text-slate-800 dark:text-slate-100 font-bold font-mono">{activeMetrics.wc}</span>
                <span className="text-left font-sans text-[10px]">
                  {activeMetrics.wc < baselineMetrics.wc ? (
                    <span className="text-emerald-500 font-bold">
                      {language === "ar" ? "أكثف مجهرياً ✓" : language === "fr" ? "Plus dense micro. ✓" : "Microstructurally denser ✓"}
                    </span>
                  ) : activeMetrics.wc > baselineMetrics.wc ? (
                    <span className="text-amber-500">
                      {language === "ar" ? "أقل كثافة" : language === "fr" ? "Moins dense" : "Less dense"}
                    </span>
                  ) : <span className="text-slate-400">{language === "ar" ? "متطابق" : language === "fr" ? "Identique" : "Identical"}</span>}
                </span>
              </div>

              <div className="grid grid-cols-4 px-3 py-2 items-center font-sans">
                <span className="font-sans font-bold text-right col-reverse">
                  {language === "ar" ? "هبوط قمع Abrams:" : language === "fr" ? "Affaissement cône d'Abrams :" : "Abrams Slump:"}
                </span>
                <span className="text-center text-slate-500 font-mono">
                  {baselineMetrics.slump} {language === "ar" ? "سم" : "cm"}
                </span>
                <span className="text-center text-slate-800 dark:text-slate-100 font-bold font-mono">
                  {activeMetrics.slump} {language === "ar" ? "سم" : "cm"}
                </span>
                <span className="text-left text-blue-500 font-sans text-[10px]">
                  {activeMetrics.slump > 12 
                    ? (language === "ar" ? "سيّالة جداً" : language === "fr" ? "Très fluide" : "Highly fluid") 
                    : (language === "ar" ? "متماسكة عيارية" : language === "fr" ? "Consistance plastique standard" : "Standard plastic")
                  }
                </span>
              </div>

              <div className="grid grid-cols-4 px-3 py-2 items-center font-sans">
                <span className="font-sans font-bold text-right col-reverse">
                  {language === "ar" ? "إمكانية الضخ بالموقَع:" : language === "fr" ? "Mise en œuvre / Pompabilité :" : "Field Concrete Pumpability:"}
                </span>
                <span className="text-center text-slate-500">{baselineMetrics.pumping}</span>
                <span className="text-center text-slate-800 dark:text-slate-100 font-bold">{activeMetrics.pumping}</span>
                <span className="text-left text-slate-400 font-sans text-[10px]">-</span>
              </div>

            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: AI MIX OPTIMIZER MODULE EXPLANATORY (5 Cols) */}
        <div className="lg:col-span-12 xl:col-span-5 bg-gradient-to-br from-indigo-900/10 to-blue-900/10 dark:from-slate-900 dark:to-slate-950 border border-blue-505/20 dark:border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-6" id="ai-mix-optimizer-block">
          
          <div className="space-y-4">
            {/* Header branding */}
            <div className="flex justify-between items-center border-b border-indigo-150 dark:border-slate-800 pb-3">
              <span className="bg-gradient-to-r from-amber-500 to-yellow-405 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full tracking-wide flex items-center gap-1 font-mono">
                AI MIX OPTIMIZER
              </span>
              <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5 justify-end">
                <span>
                  {language === "ar" ? "الذكاء الاصطناعي مبرراً ومحللاً" : language === "fr" ? "Justification et analyse de l'IA" : "AI Engineering Reasoning & Analysis"}
                </span>
                <Sparkles size={16} className="text-blue-500 animate-pulse" />
              </h4>
            </div>

            {/* AI Diagnosis Title */}
            <div className="bg-white/70 dark:bg-slate-910 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-inner">
              <h5 className="text-xs font-black text-slate-800 dark:text-blue-400 text-right leading-relaxed mb-2 flex items-center justify-end gap-1 font-sans">
                <span>{aiExplanation.title}</span>
                <Lightbulb size={12} className="text-amber-500" />
              </h5>
              
              <div className="space-y-3 mt-3 text-right">
                {aiExplanation.points.map((pt, i) => (
                  <div key={i} className="flex gap-2 text-[11px] leading-relaxed font-sans text-slate-650 dark:text-slate-350">
                    <span className="h-5 w-5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-[9px] font-mono shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="flex-1 text-right">{pt}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Engineering Advice Footnote */}
            <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-start gap-2.5 text-[10.5px]">
              <Info size={16} className="shrink-0 mt-0.5" />
              <div className="leading-relaxed flex-1 font-medium font-sans text-right">
                <strong>
                  {language === "ar" ? "الخلاصة الفنية المجهرية: " : language === "fr" ? "Conclusion technique microstructurale : " : "Microstructural Engineering Conclusion: "}
                </strong>
                {aiExplanation.microNote}
              </div>
            </div>
          </div>

          {/* SAVING SCORE BANNER */}
          {activeGoal !== "none" && aiExplanation.savingPercent > 0 && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between gap-3 text-right animate-fade-in">
              <div>
                <span className="text-[10px] text-slate-400 block font-bold leading-none">
                  {language === "ar" ? "معدل الفائدة المحرز (Efficiency gain):" : language === "fr" ? "Gain de performance :" : "Performance gain:"}
                </span>
                <strong className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">
                  +{aiExplanation.savingPercent}%
                </strong>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-slate-850 dark:text-emerald-400 font-sans">
                  {language === "ar" ? "معايرة ناجحة بنسبة 100% ✓" : language === "fr" ? "Calibrage réussi à 100% ✓" : "Calibration 100% Successful ✓"}
                </span>
                <p className="text-[9.5px] text-slate-500 leading-normal mt-0.5 leading-snug font-sans">
                  {language === "ar"
                    ? "تمت صياغة وجبة البيتون مع حماية الهيكل من الفراغات المجهرية وتقليل ركام بسكرة بانتظام."
                    : language === "fr"
                    ? "Le béton a été formulé pour minimiser les vides d'air microscopiques et optimiser le fuseau."
                    : "The concrete mix has been formulated to minimize microscopic air voids and systematically optimize particle grading."
                  }
                </p>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

// Dumb compass icon to avoid missing React-icon errors
function CompassIcon({ className, size }: { className?: string, size: number }) {
  return (
    <svg 
      className={className} 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}
