import React, { useMemo } from "react";
import { ShieldAlert, AlertTriangle, CheckCircle, Info, Sliders, Clock, Timer } from "lucide-react";
import { useLanguage } from "../services/localization";

interface ChemicalDosageMonitorProps {
  fck28: number;
  dosageSuper: number;
  dosageSilicaFume: number;
  dosageFlyAsh: number;
  selectedAdmixtureId?: string;
  materialsDatabase?: any[];
  dosageRetarder?: number;
  dosageAccelerator?: number;
  dosageAir?: number;
}

export const ChemicalDosageMonitor: React.FC<ChemicalDosageMonitorProps> = ({
  fck28,
  dosageSuper,
  dosageSilicaFume,
  dosageFlyAsh,
  selectedAdmixtureId,
  materialsDatabase,
  dosageRetarder = 0,
  dosageAccelerator = 0,
  dosageAir = 0
}) => {
  const { language } = useLanguage();

  // 1. Calculate thresholds dynamically based on required fck28 strength
  const superThresholds = useMemo(() => {
    let maxRec = 1.5;
    let reason = "";
    
    if (fck28 < 25) {
      maxRec = 0.8;
      reason = language === "ar"
        ? "الخرسانة ذات المقاومة العادية دون 25 ميجاباسكال لا تحتاج لجرعات عالية؛ المضافة الزائدة تسبب النزيف والسيولة المفرطة."
        : language === "fr"
        ? "Le béton de résistance normale (<25 MPa) ne nécessite pas de doses élevées d'adjuvant ; un excès peut provoquer du ressuage et une fluidité excessive."
        : "Normal strength concrete (<25 MPa) does not need high admixture dosages; excess leads to bleeding and excessive fluidity.";
    } else if (fck28 >= 40) {
      maxRec = 2.2;
      reason = language === "ar"
        ? "الخرسانة عالية الأداء (فوق 40 ميجاباسكال) تتحمل جرعات ملدنات عالية لتخفيض الماء الشديد وتحقيق كثافة صلبة فائقة."
        : language === "fr"
        ? "Le béton haute performance (>40 MPa) tolère des doses élevées de superplastifiants pour une réduction d'eau intense et une compacité maximale."
        : "High-performance concrete (>40 MPa) tolerates high superplasticizer dosages for deep water reduction and dense structure.";
    } else {
      maxRec = 1.5;
      reason = language === "ar"
        ? "للقوى المتوسطة الإنشائية (25-40 ميجاباسكال)، يفضل إبقاء الملدن في حدود 1.5% لتفادي تأخر شك وثبات القوالب."
        : language === "fr"
        ? "Pour la résistance structurelle moyenne (25-40 MPa), il est préférable de limiter le superplastifiant à 1,5% pour éviter les retards de prise."
        : "For structural medium strength (25-40 MPa), it is recommended to keep superplasticizer below 1.5% to avoid set delays.";
    }
    
    const critical = 2.5;
    return { maxRec, critical, reason };
  }, [fck28, language]);

  const silicaThresholds = useMemo(() => {
    let maxRec = 8.0;
    let reason = "";
    
    if (fck28 < 35) {
      maxRec = 2.0; // low limit
      reason = language === "ar"
        ? "ميكروسيليكا غير مجدية اقتصادياً ومجهدة للتشغيل في رتب خرسانة منخفضة (< 35 MPa) وتزيد تشققات الانكماش."
        : language === "fr"
        ? "La fumée de silice est économiquement injustifiée et difficile à mettre en œuvre pour les bétons de classe faible (<35 MPa)."
        : "Silica fume is uneconomical and degrades workability for lower concrete strength classes (<35 MPa).";
    } else if (fck28 >= 50) {
      maxRec = 12.0;
      reason = language === "ar"
        ? "للخرسانة فائقة القوة (>= 50 MPa)، غبار السيليكا بجرعة حتى 12% ضروري لتعبئة مسام العجينة الإسمنتية ميكروسكوبياً."
        : language === "fr"
        ? "Pour le béton à très haute résistance (>= 50 MPa), la fumée de silice jusqu'à 12% est essentielle pour remplir microscopiquement les vides de la pâte de ciment."
        : "For ultra-high strength (>= 50 MPa), silica fume up to 12% is essential to microscopically pack cement paste pores.";
    } else {
      maxRec = 8.0;
      reason = language === "ar"
        ? "للقوى العادية العالية (35-50 MPa)، جرعة 8% مثالية لتحسين الديمومة ومقاومة نفاذية الكلوريدات والكبريتات."
        : language === "fr"
        ? "Pour les résistances élevées standard (35-50 MPa), un dosage de 8% est idéal pour améliorer la durabilité et la résistance aux chlorures et sulfates."
        : "For standard high strength (35-50 MPa), an 8% dosage is ideal to improve durability and resist chloride/sulfate penetration.";
    }
    
    const critical = 10.0;
    return { maxRec, critical, reason };
  }, [fck28, language]);

  const flyAshThresholds = useMemo(() => {
    let maxRec = 15.0;
    let reason = "";
    
    if (fck28 >= 45) {
      maxRec = 10.0;
      reason = language === "ar"
        ? "في الرتب العالية (>= 45 MPa)، الرماد المتطاير المفرط يبطئ إماهة السليكات المبكرة مما يهدد بلوغ القوة التصميمية عند 28 يوماً."
        : language === "fr"
        ? "Pour les classes élevées (>= 45 MPa), un excès de cendres volantes ralentit l'hydratation précoce, compromettant la résistance à 28 jours."
        : "In high classes (>= 45 MPa), excessive fly ash slows early hydration of silicates, threatening target strength at 28 days.";
    } else if (fck28 < 25) {
      maxRec = 20.0;
      reason = language === "ar"
        ? "في المنشآت الكتلية ورتب الخرسانة العادية والفرشات، جرعة حتى 20% ممتازة لتقليل الحرارة وتقليل التكلفة واكتساب القوة لمدى طويل."
        : language === "fr"
        ? "Pour le béton de masse et les fondations, un dosage jusqu'à 20% réduit la chaleur d'hydratation, baisse le coût et augmente la résistance à long terme."
        : "In mass concrete and normal foundations, up to 20% dosage is excellent to lower hydration heat, minimize costs, and favor long-term strength.";
    } else {
      maxRec = 15.0;
      reason = language === "ar"
        ? "لرتب الخرسانة الإنشائية القياسية، ينصح بحدود 15% لاستبدال مثمر واقتصادي للإسمنت دون إضعاف مقاومة الضغط بالشدة المبكرة."
        : language === "fr"
        ? "Pour le béton structurel standard, une limite de 15% est recommandée pour une substitution économique sans affaiblir la résistance initiale."
        : "For standard structural concrete, about 15% is recommended for a balanced and economical cement replacement without weakening initial strength.";
    }
    
    const critical = 25.0;
    return { maxRec, critical, reason };
  }, [fck28, language]);

  // 2. Evaluate state for each chemical
  const superStatus = useMemo(() => {
    const val = dosageSuper;
    const { maxRec, critical } = superThresholds;
    if (val === 0) return { level: "none", color: "text-slate-400 bg-slate-100 dark:bg-slate-800", text: language === "ar" ? "غير مستخدم" : language === "fr" ? "Non utilisé" : "Unused" };
    if (val > critical) return { level: "critical", color: "text-rose-600 dark:text-rose-450 bg-rose-50 dark:bg-rose-950/20 border-rose-350 dark:border-rose-900/30", text: language === "ar" ? "خطر حرج ⚠️" : language === "fr" ? "Danger critique ⚠️" : "Critical danger ⚠️" };
    if (val > maxRec) return { level: "warning", color: "text-amber-600 dark:text-amber-450 bg-amber-50 dark:bg-amber-955/20 border-amber-350 dark:border-amber-900/30", text: language === "ar" ? "تحذير: تجاوز الموصى به ⚠️" : language === "fr" ? "Alerte : Limite dépassée ⚠️" : "Warning: Exceeded recommended ⚠️" };
    return { level: "safe", color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/15 border-emerald-350 dark:border-emerald-900/30", text: language === "ar" ? "آمن ومتزن ✓" : language === "fr" ? "Sûr et conforme ✓" : "Safe and conform ✓" };
  }, [dosageSuper, superThresholds, language]);

  const silicaStatus = useMemo(() => {
    const val = dosageSilicaFume;
    const { maxRec, critical } = silicaThresholds;
    if (val === 0) return { level: "none", color: "text-slate-400 bg-slate-100 dark:bg-slate-800", text: language === "ar" ? "غير مستخدم" : language === "fr" ? "Non utilisé" : "Unused" };
    if (val > critical) return { level: "critical", color: "text-rose-600 dark:text-rose-450 bg-rose-50 dark:bg-rose-950/20 border-rose-350 dark:border-rose-900/30", text: language === "ar" ? "خطر حرج ⚠️" : language === "fr" ? "Danger critique ⚠️" : "Critical danger ⚠️" };
    if (val > maxRec) return { level: "warning", color: "text-amber-600 dark:text-amber-450 bg-amber-50 dark:bg-amber-955/20 border-amber-350 dark:border-amber-900/30", text: language === "ar" ? "تحذير: تجاوز الموصى به ⚠️" : language === "fr" ? "Alerte : Limite dépassée ⚠️" : "Warning: Exceeded recommended ⚠️" };
    return { level: "safe", color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/15 border-emerald-350 dark:border-emerald-900/30", text: language === "ar" ? "آمن ومتزن ✓" : language === "fr" ? "Sûr et conforme ✓" : "Safe and conform ✓" };
  }, [dosageSilicaFume, silicaThresholds, language]);

  const flyAshStatus = useMemo(() => {
    const val = dosageFlyAsh;
    const { maxRec, critical } = flyAshThresholds;
    if (val === 0) return { level: "none", color: "text-slate-400 bg-slate-100 dark:bg-slate-800", text: language === "ar" ? "غير مستخدم" : language === "fr" ? "Non utilisé" : "Unused" };
    if (val > critical) return { level: "critical", color: "text-rose-600 dark:text-rose-450 bg-rose-50 dark:bg-rose-950/20 border-rose-350 dark:border-rose-900/30", text: language === "ar" ? "خطر حرج ⚠️" : language === "fr" ? "Danger critique ⚠️" : "Critical danger ⚠️" };
    if (val > maxRec) return { level: "warning", color: "text-amber-600 dark:text-amber-450 bg-amber-50 dark:bg-amber-955/20 border-amber-350 dark:border-amber-900/30", text: language === "ar" ? "تحذير: تجاوز الموصى به ⚠️" : language === "fr" ? "Alerte : Limite dépassée ⚠️" : "Warning: Exceeded recommended ⚠️" };
    return { level: "safe", color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/15 border-emerald-350 dark:border-emerald-900/30", text: language === "ar" ? "آمن ومتزن ✓" : language === "fr" ? "Sûr et conforme ✓" : "Safe and conform ✓" };
  }, [dosageFlyAsh, flyAshThresholds, language]);

  // Determine overall alarm state
  const hasAlarm = superStatus.level === "critical" || superStatus.level === "warning" || 
                   silicaStatus.level === "critical" || silicaStatus.level === "warning" || 
                   flyAshStatus.level === "critical" || flyAshStatus.level === "warning";

  const settingTimeDetails = useMemo(() => {
    let totalImpactMinutes = 0;
    let matchedAdmixName = "";
    let matchedAdmixAr = "";
    let matchedAdmixFr = "";

    // If there is a selected admixture, look up its metadata and calculate precise impact
    if (selectedAdmixtureId && materialsDatabase) {
      const matched = materialsDatabase.find((m: any) => m.id === selectedAdmixtureId);
      if (matched) {
        matchedAdmixName = matched.englishName || matched.name;
        matchedAdmixAr = matched.name;
        matchedAdmixFr = matched.englishName || matched.name;
        
        // Find corresponding dosage in current mix
        let actualDosage = 0;
        if (matched.admixtureType === "superplasticizer" || matched.admixtureType === "plasticizer" || matched.admixtureType === "water_reducer") {
          actualDosage = dosageSuper;
        } else if (matched.admixtureType === "retarder") {
          actualDosage = dosageRetarder;
        } else if (matched.admixtureType === "accelerator") {
          actualDosage = dosageAccelerator;
        } else if (matched.admixtureType === "air_entraining") {
          actualDosage = dosageAir;
        }

        const recDos = matched.recommendedDosage || 1.0;
        // Scale the database settingTimeImpact based on actual dosage compared to recommended dosage
        if (matched.settingTimeImpact !== undefined) {
          const baseImpact = matched.settingTimeImpact;
          totalImpactMinutes = recDos > 0 ? (actualDosage / recDos) * baseImpact : 0;
        }
      }
    } else {
      // If no specific material is selected, fall back to standard heuristic values for sliders
      const superImpact = dosageSuper * 25; // +25 mins per 1%
      const retarderImpact = dosageRetarder * 480; // +480 mins per 1%
      const acceleratorImpact = dosageAccelerator * -120; // -120 mins per 1%
      totalImpactMinutes = superImpact + retarderImpact + acceleratorImpact;
    }

    // Baseline setting times for standard OPC concrete at 20°C
    const baseInitialSettingTime = 180; // 3 hours
    const baseFinalSettingTime = 270;   // 4.5 hours

    const estimatedInitial = Math.max(30, Math.round(baseInitialSettingTime + totalImpactMinutes));
    const estimatedFinal = Math.max(60, Math.round(baseFinalSettingTime + totalImpactMinutes * 1.25));

    // Determine setting safety level
    let level: "optimal" | "warning" | "danger" = "optimal";
    let messageAr = "";
    let messageEn = "";
    let messageFr = "";

    if (estimatedInitial < 60) {
      level = "danger";
      messageAr = "⚠️ خطر شك وميضي (Flash Set): زمن الشك الابتدائي أقل من 60 دقيقة! خطر تجمد مبكر وفواصل صب باردة.";
      messageEn = "⚠️ Flash Set Hazard: Initial setting time is under 60 minutes! Severe risk of premature stiffening.";
      messageFr = "⚠️ Risque de prise éclair : Le temps de prise initial est inférieur à 60 min ! Risque de raidissement prématuré.";
    } else if (estimatedInitial > 480) {
      level = "warning";
      messageAr = "⚠️ تأخر شك مفرط: زمن الشك يتجاوز 8 ساعات! قد يتسبب في تأخر فك القوالب وجفاف السطح المبكر.";
      messageEn = "⚠️ Excessive Set Retardation: Setting time exceeds 8 hours! Will delay form stripping and curing.";
      messageFr = "⚠️ Retard de prise excessif : Le temps de prise dépasse 8 heures ! Retardera le décoffrage.";
    } else {
      level = "optimal";
      messageAr = "✓ نافذة الإماهة آمنة ومتزنة لعملية الصب والمعالجة بموقع الورشة.";
      messageEn = "✓ Safe hydration and setting window. Excellent workability retention for placement.";
      messageFr = "✓ Fenêtre d'hydratation et de prise optimale. Bonne maniabilité pour la mise en œuvre.";
    }

    return {
      totalImpactMinutes,
      estimatedInitial,
      estimatedFinal,
      level,
      messageAr,
      messageEn,
      messageFr,
      matchedAdmixName,
      matchedAdmixAr,
      matchedAdmixFr
    };
  }, [selectedAdmixtureId, materialsDatabase, dosageSuper, dosageRetarder, dosageAccelerator, dosageAir]);

  const criticalAlarms = useMemo(() => {
    return [
      {
        title: language === "ar" ? "الملدن الفائق العالي" : language === "fr" ? "Superplastifiant élevé" : "High Superplasticizer",
        status: superStatus,
        val: dosageSuper,
        limits: superThresholds,
        desc: language === "ar"
          ? "يتسبب بوقوع النزيف الوعائي الشديد وانفصال معجون الأسمنت المجمع عن الهيكل الحصوي."
          : language === "fr"
          ? "Provoque un ressuage sévère et la ségrégation de la pâte de ciment."
          : "Causes severe bleeding and segregation of cement paste from aggregates."
      },
      {
        title: language === "ar" ? "ميكروسيليكا (غبار السيليكا)" : language === "fr" ? "Fumée de silice active" : "Silica Fume",
        status: silicaStatus,
        val: dosageSilicaFume,
        limits: silicaThresholds,
        desc: language === "ar"
          ? "يفقد الخرسانة رشاقتها وقوامها للضخ ويقود فوراً لشروخ الانكماش البلاستيكي الحاد."
          : language === "fr"
          ? "Réduit la maniabilité de pompage et provoque des fissures de retrait plastique prématuré."
          : "Loss of pumpability and causes sudden plastic shrinkage cracking."
      },
      {
        title: language === "ar" ? "الرماد المتطاير" : language === "fr" ? "Cendres volantes" : "Fly Ash",
        status: flyAshStatus,
        val: dosageFlyAsh,
        limits: flyAshThresholds,
        desc: language === "ar"
          ? "يثبط معدل التصلب المبكر للإسمنت، مما يعرقل بلوغ الخرسانة لمقاومة الكسر التصميمية."
          : language === "fr"
          ? "Ralentit la prise précoce, empêchant l'atteinte de la résistance cible à 28 jours."
          : "Retards early hydration, threatening target compressive strength."
      }
    ].filter(item => item.status.level === "critical" || item.status.level === "warning");
  }, [superStatus, silicaStatus, flyAshStatus, dosageSuper, dosageSilicaFume, dosageFlyAsh, superThresholds, silicaThresholds, flyAshThresholds, language]);

  return (
    <div className="bg-slate-50 dark:bg-slate-900/40 rounded-xl p-4 border border-slate-200 dark:border-slate-800/80 space-y-3.5 text-right font-sans shrink-0">
      
      {/* Widget Header with Status */}
      <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5 flex-row-reverse">
          <span className={`text-[10px] font-bold p-0.5 px-2 rounded-full font-sans ${
            hasAlarm 
              ? "bg-amber-500/10 text-amber-500 animate-pulse" 
              : "bg-emerald-500/10 text-emerald-400"
          }`}>
            {hasAlarm 
              ? (language === "ar" ? "تنبيـه نشط" : language === "fr" ? "Alerte active" : "Active Alarm")
              : (language === "ar" ? "آمن ومطابق للكود" : language === "fr" ? "Conforme au Code" : "Code Compliant")
            }
          </span>
        </div>
        <div className="text-right col-reverse">
          <h5 className="text-[11px] font-black text-slate-800 dark:text-slate-100 flex items-center justify-end gap-1">
            <span>
              {language === "ar" 
                ? "نظام الحراسة والتحكم الذكي بالإضافات الكيميائية"
                : language === "fr"
                ? "Contrôle intelligent des adjuvants"
                : "Smart Admixture Safeguard System"
              }
            </span>
            <Sliders size={13} className="text-indigo-500" />
          </h5>
          <p className="text-[9px] text-slate-400">
            {language === "ar"
              ? "التحقق من الحدود القصوى والجرعات بناءً على المقاومة التصميمية المستهدفة"
              : language === "fr"
              ? "Vérification des limites selon la résistance cible"
              : "Verify dosage limits according to target compressive strength"
            } (<span className="font-mono text-indigo-400 font-bold">{fck28} MPa</span>)
          </p>
        </div>
      </div>

      {/* Visual Bar Grid of actuals vs limits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        
        {/* Superplasticizer alert gauge */}
        <div className={`p-2.5 border rounded-lg ${superStatus.color} transition-all duration-250`}>
          <div className="flex justify-between items-center text-[10px] mb-1">
            <span className="font-bold">{superStatus.text}</span>
            <span className="text-slate-500 dark:text-slate-400">
              {language === "ar" ? "الملدن الفائق" : language === "fr" ? "Superplastifiant" : "Superplasticizer"}
            </span>
          </div>
          <div className="flex justify-between items-end mt-1.5">
            <span className="text-[8px] text-slate-400 font-mono">
              {language === "ar" ? "الحد الأقصى: " : language === "fr" ? "Max recommandé : " : "Recommended Max: "}{superThresholds.maxRec}%
            </span>
            <strong className="text-sm font-black font-semi text-right font-mono">{dosageSuper}%</strong>
          </div>
          {/* Progress gauge indicator */}
          <div className="h-1 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-1.5">
            <div 
              style={{ width: `${Math.min(100, (dosageSuper / 3.0) * 100)}%` }} 
              className={`h-full rounded-full ${
                superStatus.level === "critical" 
                  ? "bg-rose-500" 
                  : superStatus.level === "warning" 
                    ? "bg-amber-500" 
                    : "bg-emerald-500"
              }`}
            />
          </div>
        </div>

        {/* Silica Fume alert gauge */}
        <div className={`p-2.5 border rounded-lg ${silicaStatus.color} transition-all duration-250`}>
          <div className="flex justify-between items-center text-[10px] mb-1">
            <span className="font-bold">{silicaStatus.text}</span>
            <span className="text-slate-500 dark:text-slate-400">
              {language === "ar" ? "ميكروسيليكا (غبار السيليكا)" : language === "fr" ? "Fumée de silice" : "Silica Fume"}
            </span>
          </div>
          <div className="flex justify-between items-end mt-1.5 align-right">
            <span className="text-[8px] text-slate-400 font-mono">
              {language === "ar" ? "الحد الأقصى: " : language === "fr" ? "Max recommandé : " : "Recommended Max: "}{silicaThresholds.maxRec}%
            </span>
            <strong className="text-sm font-black font-semi text-right font-mono">{dosageSilicaFume}%</strong>
          </div>
          {/* Progress gauge indicator */}
          <div className="h-1 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-1.5">
            <div 
              style={{ width: `${Math.min(100, (dosageSilicaFume / 12.0) * 100)}%` }} 
              className={`h-full rounded-full ${
                silicaStatus.level === "critical" 
                  ? "bg-rose-500" 
                  : silicaStatus.level === "warning" 
                    ? "bg-amber-500" 
                    : "bg-emerald-500"
              }`}
            />
          </div>
        </div>

        {/* Fly Ash alert gauge */}
        <div className={`p-2.5 border rounded-lg ${flyAshStatus.color} transition-all duration-250`}>
          <div className="flex justify-between items-center text-[10px] mb-1">
            <span className="font-bold">{flyAshStatus.text}</span>
            <span className="text-slate-500 dark:text-slate-400">
              {language === "ar" ? "الرماد المتطاير" : language === "fr" ? "Cendres volantes" : "Fly Ash"}
            </span>
          </div>
          <div className="flex justify-between items-end mt-1.5 align-right">
            <span className="text-[8px] text-slate-400 font-mono">
              {language === "ar" ? "الحد الأقصى: " : language === "fr" ? "Max recommandé : " : "Recommended Max: "}{flyAshThresholds.maxRec}%
            </span>
            <strong className="text-sm font-black font-semi text-right font-mono">{dosageFlyAsh}%</strong>
          </div>
          {/* Progress gauge indicator */}
          <div className="h-1 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-1.5">
            <div 
              style={{ width: `${Math.min(100, (dosageFlyAsh / 20.0) * 100)}%` }} 
              className={`h-full rounded-full ${
                flyAshStatus.level === "critical" 
                  ? "bg-rose-500" 
                  : flyAshStatus.level === "warning" 
                    ? "bg-amber-500" 
                    : "bg-emerald-500"
              }`}
            />
          </div>
        </div>

      </div>

      {/* Chemical Setting Time Impact Monitor (ترقية التأثير على زمن الشك) */}
      <div className="p-3 bg-indigo-500/5 dark:bg-indigo-950/10 border border-indigo-200/50 dark:border-indigo-900/30 rounded-xl space-y-2 text-right">
        <div className="flex justify-between items-center pb-1 border-b border-indigo-100/50 dark:border-indigo-900/20">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1">
            <Timer size={12} className="text-indigo-400" />
            {settingTimeDetails.totalImpactMinutes > 0 ? "+" : ""}
            {Math.round(settingTimeDetails.totalImpactMinutes)} {language === "ar" ? "دقيقة" : "min"}
          </span>
          <h6 className="text-[11px] font-black text-indigo-950 dark:text-indigo-300 flex items-center gap-1.5 flex-row-reverse">
            <Clock size={13} className="text-indigo-500" />
            <span>
              {language === "ar" 
                ? "مؤشر التأثير على زمن الشك (Setting Time Impact)"
                : language === "fr"
                ? "Impact sur le temps de prise"
                : "Setting Time Impact Monitor"
              }
            </span>
          </h6>
        </div>

        {settingTimeDetails.matchedAdmixAr && (
          <p className="text-[9.5px] text-slate-500 dark:text-slate-400 font-sans">
            {language === "ar" ? `المادة النشطة المحددة: ` : `Selected active agent: `}
            <strong className="text-indigo-600 dark:text-indigo-400">
              {language === "ar" ? settingTimeDetails.matchedAdmixAr : settingTimeDetails.matchedAdmixName}
            </strong>
          </p>
        )}

        <div className="grid grid-cols-2 gap-2 text-center my-1.5">
          <div className="bg-white/50 dark:bg-slate-950/40 p-1.5 rounded border border-slate-100 dark:border-slate-800">
            <p className="text-[9px] text-slate-400">
              {language === "ar" ? "الشك الابتدائي التقديري" : language === "fr" ? "Prise Initiale Est." : "Est. Initial Set"}
            </p>
            <p className="text-sm font-black text-slate-800 dark:text-slate-200 font-mono">
              {Math.floor(settingTimeDetails.estimatedInitial / 60)}h {settingTimeDetails.estimatedInitial % 60}m
            </p>
            <span className="text-[8px] text-slate-400 block mt-0.5">
              {language === "ar" ? "القياسي: ~3 ساعات" : language === "fr" ? "Standard: ~3h" : "Standard: ~3h"}
            </span>
          </div>
          <div className="bg-white/50 dark:bg-slate-950/40 p-1.5 rounded border border-slate-100 dark:border-slate-800">
            <p className="text-[9px] text-slate-400">
              {language === "ar" ? "الشك النهائي التقديري" : language === "fr" ? "Prise Finale Est." : "Est. Final Set"}
            </p>
            <p className="text-sm font-black text-slate-800 dark:text-slate-200 font-mono">
              {Math.floor(settingTimeDetails.estimatedFinal / 60)}h {settingTimeDetails.estimatedFinal % 60}m
            </p>
            <span className="text-[8px] text-slate-400 block mt-0.5">
              {language === "ar" ? "القياسي: ~4.5 ساعات" : language === "fr" ? "Standard: ~4.5h" : "Standard: ~4.5h"}
            </span>
          </div>
        </div>

        <div className={`p-1.5 rounded text-[10px] text-right font-sans ${
          settingTimeDetails.level === "danger"
            ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
            : settingTimeDetails.level === "warning"
              ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
              : "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20"
        }`}>
          {language === "ar" ? settingTimeDetails.messageAr : language === "fr" ? settingTimeDetails.messageFr : settingTimeDetails.messageEn}
        </div>
      </div>

      {/* Critical warning details if any active */}
      {criticalAlarms.length > 0 ? (
        <div className="p-3 bg-red-100/10 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg space-y-2 text-right">
          <div className="flex items-center gap-1.5 justify-end text-xs font-bold text-rose-600 dark:text-rose-400">
            <span>
              {language === "ar" ? "تنبيه هندسي حرج: تجاوز الحدود المقبولة!" : language === "fr" ? "Alerte d'ingénierie critique : Limite dépassée !" : "Critical Engineering Alarm: Limit exceeded!"}
            </span>
            <ShieldAlert size={15} className="animate-bounce" />
          </div>
          <div className="space-y-1.5 text-[10px] text-slate-650 dark:text-slate-350 leading-relaxed font-sans">
            {criticalAlarms.map((alarm, idx) => (
              <p key={idx} className="border-r-2 border-rose-500 pr-2">
                • <strong>{alarm.title} ({alarm.val}%):</strong> {alarm.desc}{" "}
                <span className="text-rose-500 dark:text-rose-400 font-bold block mt-0.5">
                  {language === "ar" ? "التوصية الهندسية: التزم بحدود القوة المقابلة والبالغة " : language === "fr" ? "Recommandation : Limiter à " : "Engineering recommendation: Limit to "}{alarm.limits.maxRec}%
                </span>
              </p>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-2.5 bg-emerald-100/10 dark:bg-emerald-950/15 border border-emerald-200/50 dark:border-emerald-900/30 rounded-lg text-emerald-800 dark:text-emerald-350 text-[10px] leading-relaxed flex items-start gap-1 p-3">
          <CheckCircle size={14} className="shrink-0 text-emerald-500" />
          <span>
            ✓ <strong>
              {language === "ar" ? "المطابقة التقنية تامة: " : language === "fr" ? "Conformité technique totale : " : "Technical conformity complete: "}
            </strong>
            {language === "ar"
              ? `كافة جرعات الإضافات الكيمياوية تقع ضمن النسبة الآمنة الموصى بها في الكليات الهندسية لطريقة Dreux-Gorisse ومطابقتها للمقاومة المستهدفة البالغة ${fck28} MPa. هذا يقلل من مخاطر الانفصال، النزيف، أو تشقق الهيكل المبكر.`
              : language === "fr"
              ? `Tous les dosages d'adjuvants se situent dans la plage de sécurité recommandée pour la méthode Dreux-Gorisse selon la résistance cible de ${fck28} MPa. Cela réduit les risques de ségrégation, de ressuage ou de fissuration.`
              : `All admixture dosages are within safe boundaries recommended for the Dreux-Gorisse method according to the target compressive strength of ${fck28} MPa. This reduces the risk of segregation, bleeding, or early cracking.`
            }
          </span>
        </div>
      )}

      {/* Recommended Engineering limits guide fold */}
      <div className="p-2 bg-slate-100 dark:bg-slate-800/50 rounded text-[9.5px] leading-snug text-slate-500 flex items-start gap-1 justify-end">
        <div className="text-right">
          <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
            {language === "ar" ? "💡 إرشادات هندسية هامة للتطبيق بالموقع (Batch Curing Limits):" : language === "fr" ? "💡 Directives de chantier importantes (Curing & Malaxage) :" : "💡 Important Field Guidelines (Curing & Mixing Limit):"}
          </span>
          <span>
            {language === "ar"
              ? "كافة النسب محسوبة كوزن مئوي مباشر من إجمالي كتلة الإسمنت بالمتر المكعب. عند الضبط في الأجواء الحارة يُوصى بتقليل المسرعات، وفي حالة الصب المستمر استخدم ملدنات مع ميزة مؤخر الشك (Plastiretarders) لتجنب فواصل الصب الباردة."
              : language === "fr"
              ? "Tous les taux sont calculés en pourcentage massique de la masse de ciment. Par temps chaud, réduisez les accélérateurs et privilégiez les retardateurs de prise pour éviter les joints froids."
              : "All percentages are calculated by mass of cement content. In hot climates, reduce accelerator dosages and prioritize set retarders to prevent cold joints."
            }
          </span>
        </div>
        <Info size={11} className="text-indigo-400 shrink-0 mt-0.5" />
      </div>

    </div>
  );
};
