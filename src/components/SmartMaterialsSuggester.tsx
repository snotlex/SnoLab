import React, { useMemo } from "react";
import { motion } from "motion/react";
import { Sparkles, CheckCircle2, AlertTriangle, ArrowRight, Layers, Flame, Droplet, Hammer } from "lucide-react";
import { EngineeringMaterial, AggregateType } from "../types";
import { CONCRETE_TYPE_CONFIGS } from "../concreteTypes";

interface SmartMaterialsSuggesterProps {
  concreteType: string;
  fck28: number;
  materialsDatabase: EngineeringMaterial[];
  onApplySuggestions: (selectedIds: {
    selectedCementId?: string;
    selectedSandId?: string;
    selectedGravelId?: string;
    selectedWaterId?: string;
    selectedAdmixtureId?: string;
    selectedScmId?: string;
    selectedFiberId?: string;
    selectedSpecialBinderId?: string;
  }) => void;
  language: string;
}

export const SmartMaterialsSuggester: React.FC<SmartMaterialsSuggesterProps> = ({
  concreteType,
  fck28,
  materialsDatabase,
  onApplySuggestions,
  language,
}) => {
  const isAr = language === "ar";
  const isFr = language === "fr";
  const isRtl = isAr;

  const activeConcreteCode = (concreteType || "NSC").toUpperCase();
  const activeConfig = CONCRETE_TYPE_CONFIGS[activeConcreteCode];

  // Logic to determine if categories are allowed
  const isCementAllowed = activeConfig ? activeConfig.allowedCategories.includes("إسمنت") || activeConfig.allowedCategories.includes("مجلدات خاصة") : true;
  const isSandAllowed = activeConfig ? activeConfig.allowedCategories.includes("رمال") : true;
  const isGravelAllowed = activeConfig ? activeConfig.allowedCategories.some(cat => ["حصى", "ركام خفيف", "ركام ثقيل"].includes(cat)) : true;
  const isWaterAllowed = activeConfig ? activeConfig.allowedCategories.includes("ماء") : true;
  const isAdmixtureAllowed = activeConfig ? activeConfig.allowedCategories.includes("إضافات كيميائية") : true;
  const isScmAllowed = activeConfig ? activeConfig.allowedCategories.includes("إضافات معدنية") : true;
  const isFiberAllowed = activeConfig ? activeConfig.allowedCategories.includes("ألياف") : true;
  const isSpecialBinderAllowed = activeConfig ? activeConfig.allowedCategories.includes("مجلدات خاصة") : true;

  // Filter approved & active materials
  const activeMaterials = useMemo(() => {
    return (materialsDatabase || []).filter(m => {
      if (!m) return false;
      const status = (m.status || m.Status || "").toLowerCase();
      const appStatus = (m.approvalStatus || m.ApprovalStatus || "").toLowerCase();
      
      const isDraft = status === "draft" || appStatus === "draft";
      const isArchived = status === "archived" || status === "موقوف" || appStatus === "archived";
      const isRejected = status === "rejected" || appStatus === "rejected";
      
      if (isDraft || isArchived || isRejected) return false;
      return true;
    });
  }, [materialsDatabase]);

  // Dynamic Suggestion Engine based on Concrete Type and Required Strength
  const suggestions = useMemo(() => {
    if (activeMaterials.length === 0) return null;

    // 1. CEMENT / BINDER
    let cementList = activeMaterials.filter(m => m.category === "إسمنت" || m.category === "مجلدات خاصة");
    let suggestedCement: EngineeringMaterial | undefined;
    let cementReason = {
      ar: "إسمنت متزن عياري CEM II أو CEM I رتبة 42.5 ملائم تماماً للقوة المستهدفة.",
      fr: "Ciment standard CEM I/II 42.5 équilibré, idéal pour la résistance ciblée.",
      en: "Standard balanced CEM I/II 42.5 cement, perfectly suited for the target strength."
    };

    if (activeConcreteCode === "GPC") {
      suggestedCement = cementList.find(m => m.category === "مجلدات خاصة" || m.name.includes("جيوبوليمر") || m.name.toLowerCase().includes("geopolymer"));
      if (!suggestedCement) suggestedCement = cementList.find(m => m.name.toLowerCase().includes("slag") || m.name.includes("خبث") || m.name.toLowerCase().includes("fly ash") || m.name.includes("رماد"));
      cementReason = {
        ar: "مادة رابطة جيوبوليمرية خالية من الكلنكر لخفض الانبعاثات الكربونية.",
        fr: "Liant géopolymère sans clinker pour réduire l'empreinte carbone.",
        en: "Clinker-free geopolymer binder to reduce carbon footprint."
      };
    } else if (activeConcreteCode === "UHPC" || activeConcreteCode === "BFUP" || fck28 >= 100) {
      suggestedCement = cementList.find(m => m.name.includes("52.5") || m.name.includes("CEM I 52.5") || m.strengthClass === "52.5" || m.cementClassStrength === 52.5);
      cementReason = {
        ar: "إسمنت عالي الفعالية ومبكر التصلد CEM I 52.5 R لضمان أعلى مستويات الكثافة والتراص.",
        fr: "Ciment haute performance CEM I 52.5 R pour une compacité maximale.",
        en: "High-early strength CEM I 52.5 R cement to ensure maximum packing and strength."
      };
    } else if (activeConcreteCode === "HSC" || activeConcreteCode === "HPC" || fck28 >= 40) {
      suggestedCement = cementList.find(m => m.name.includes("52.5") || m.strengthClass === "52.5") || cementList.find(m => m.name.includes("42.5") || m.strengthClass === "42.5");
      cementReason = {
        ar: "إسمنت عالي الجودة رتبة 42.5 أو 52.5 لضمان تماسك الهيكل الأسمنتي ومقاومة الضغط العالي.",
        fr: "Ciment classe 42.5 ou 52.5 pour assurer la matrice à haute résistance.",
        en: "Class 42.5 or 52.5 cement to support high-strength cementitious matrix."
      };
    } else {
      suggestedCement = cementList.find(m => m.name.includes("42.5") || m.strengthClass === "42.5") || cementList.find(m => m.name.includes("32.5") || m.strengthClass === "32.5");
    }
    // Strict compatibility check if config is available
    if (suggestedCement && activeConfig && !activeConfig.isMaterialCompatible(suggestedCement)) {
      suggestedCement = cementList.find(m => activeConfig.isMaterialCompatible(m));
    }
    if (!suggestedCement && cementList.length > 0) {
      suggestedCement = cementList[0];
    }

    // 2. SAND
    let sandList = activeMaterials.filter(m => m.category === "رمال");
    let suggestedSand: EngineeringMaterial | undefined;
    let sandReason = {
      ar: "رمل متوسط عياري ذو تدرج متوازن لتقليل الفراغات وتحقيق تشغيلية ممتازة.",
      fr: "Sable moyen standard à granularité équilibrée pour minimiser les vides.",
      en: "Standard medium sand with balanced grading to minimize voids and ensure workability."
    };

    if (activeConcreteCode === "UHPC" || activeConcreteCode === "BFUP") {
      suggestedSand = sandList.find(m => m.name.includes("سيليسي") || m.name.toLowerCase().includes("siliceous") || m.name.toLowerCase().includes("silica") || m.name.includes("ناعم") || m.name.toLowerCase().includes("fine"));
      sandReason = {
        ar: "رمل سيليسي ناعم نقي جداً لتحقيق تراص مثالي نانو-هيكلي.",
        fr: "Sable siliceux fin extra-pur pour un empilement granulaire micrométrique.",
        en: "Extra-pure fine siliceous sand to achieve micrometric granular packing."
      };
    } else if (activeConcreteCode === "SCC") {
      suggestedSand = sandList.find(m => m.name.includes("ناعم") || m.name.toLowerCase().includes("fine") || m.name.includes("متوسط") || m.name.toLowerCase().includes("medium"));
      sandReason = {
        ar: "رمل ناعم/متوسط لزيادة لزوجة معجون الخلطة ومنع انفصال مكونات الخرسانة ذاتية الدمك.",
        fr: "Sable fin/moyen pour augmenter la viscosité et éviter la ségrégation du BAP.",
        en: "Fine/medium sand to increase viscosity and prevent segregation in self-consolidating mix."
      };
    } else if (activeConcreteCode === "HSC" || activeConcreteCode === "HPC" || fck28 >= 40) {
      suggestedSand = sandList.find(m => m.name.includes("خشن") || m.name.toLowerCase().includes("coarse") || m.name.includes("سيليسي") || m.name.toLowerCase().includes("siliceous"));
      sandReason = {
        ar: "رمل خشن ذو معامل نعومة مرتفع (> 2.7) لتقليل طلب الماء ورفع الكفاءة الصلبة.",
        fr: "Sable grossier avec MF élevé (> 2.7) pour optimiser le squelette solide.",
        en: "Coarse sand with high FM (> 2.7) to optimize the solid skeleton and reduce water demand."
      };
    }
    if (suggestedSand && activeConfig && !activeConfig.isMaterialCompatible(suggestedSand)) {
      suggestedSand = sandList.find(m => activeConfig.isMaterialCompatible(m));
    }
    if (!suggestedSand && sandList.length > 0) {
      suggestedSand = sandList[0];
    }

    // 3. GRAVEL / AGGREGATE
    let gravelList = activeMaterials.filter(m => ["حصى", "ركام خفيف", "ركام ثقيل"].includes(m.category));
    let suggestedGravel: EngineeringMaterial | undefined;
    let gravelReason = {
      ar: "حصى قياسي متزن ومقاوم يضمن الهيكل الإنشائي المترابط لخرسانة الصب.",
      fr: "Gravillons résistants de calibre standard pour l'ossature du béton.",
      en: "Resistant standard aggregates of balanced size for structural integrity."
    };

    if (activeConcreteCode === "LWC") {
      suggestedGravel = gravelList.find(m => m.category === "ركام خفيف" || m.name.includes("خفيف") || m.name.toLowerCase().includes("lightweight") || m.name.includes("بوميس") || m.name.toLowerCase().includes("pumice"));
      gravelReason = {
        ar: "ركام خفيف مسامي (حجر خفاف أو طين متمدد) لتقليل الوزن الذاتي للمنشأة.",
        fr: "Granulats légers (ponce ou argile expansée) pour alléger la structure.",
        en: "Lightweight porous aggregate (pumice or expanded clay) to reduce dead-load weight."
      };
    } else if (activeConcreteCode === "HWC") {
      suggestedGravel = gravelList.find(m => m.category === "ركام ثقيل" || m.name.includes("ثقيل") || m.name.toLowerCase().includes("heavyweight") || m.name.includes("باريت") || m.name.toLowerCase().includes("barite") || m.name.includes("مغنيتيت"));
      gravelReason = {
        ar: "ركام ثقيل عالي الكثافة (باريت أو هيماتيت) لضمان متانة درع الإشعاع النووي.",
        fr: "Granulats lourds (barytine) pour la radioprotection et densité élevée.",
        en: "High-density heavy aggregate (barite or magnetite) for radiation shielding."
      };
    } else if (activeConcreteCode === "UHPC" || activeConcreteCode === "BFUP") {
      suggestedGravel = gravelList.find(m => m.name.includes("3/8") || m.name.includes("صغير") || m.name.toLowerCase().includes("fine") || (m.dMax && m.dMax <= 8));
      gravelReason = {
        ar: "حصى دقيق للغاية بقطر أقصى (Dmax <= 8 مم) يضمن استقرار الرص الميكروي المتجانس.",
        fr: "Gravillons ultra-fins (Dmax <= 8 mm) assurant l'homogénéité structurale.",
        en: "Ultra-fine gravel (Dmax <= 8 mm) to ensure microstructure homogeneity."
      };
    } else if (activeConcreteCode === "SCC") {
      suggestedGravel = gravelList.find(m => m.name.includes("8/15") || m.name.includes("مكسر") || (m.dMax && m.dMax <= 15));
      gravelReason = {
        ar: "حصى قياس 8/15 (Dmax <= 15 مم) يمنع حجز الخرسانة عند انسيابها بين التسليح الكثيف.",
        fr: "Gravillons 8/15 évitant le blocage entre les armatures serrées.",
        en: "Small size 8/15 aggregate to prevent blocking between dense reinforcement bars."
      };
    } else if (activeConcreteCode === "HSC" || activeConcreteCode === "HPC" || fck28 >= 45) {
      suggestedGravel = gravelList.find(m => m.name.includes("بازلت") || m.name.toLowerCase().includes("basalt") || m.name.includes("مكسر") || m.name.toLowerCase().includes("crushed"));
      gravelReason = {
        ar: "ركام مكسر بازلتي صلب جداً ذو زوايا حادة لرفع قوة التماسك والتشابك الميكانيكي مع الأسمنت.",
        fr: "Gravillon basaltique concassé très dur pour maximiser l'adhérence mécanique.",
        en: "Highly hard crushed basaltic aggregate for maximum mechanical bond and strength."
      };
    }
    if (suggestedGravel && activeConfig && !activeConfig.isMaterialCompatible(suggestedGravel)) {
      suggestedGravel = gravelList.find(m => activeConfig.isMaterialCompatible(m));
    }
    if (!suggestedGravel && gravelList.length > 0) {
      suggestedGravel = gravelList[0];
    }

    // 4. WATER
    let waterList = activeMaterials.filter(m => m.category === "ماء" || m.type === "water");
    let suggestedWater = waterList[0];
    let waterReason = {
      ar: "ماء خلط عذب ونقي مطابق للمواصفات الفنية خالٍ من الأملاح الضارة والزيوت.",
      fr: "Eau potable propre et neutre conforme aux exigences de gâchage.",
      en: "Potable clean mixing water meeting engineering standard requirements."
    };

    // 5. ADMIXTURE
    let admixList = activeMaterials.filter(m => m.category === "إضافات كيميائية");
    let suggestedAdmixture: EngineeringMaterial | undefined;
    let admixtureReason = {
      ar: "ملدن لتحسين التشغيلية وتسهيل الصب دون زيادة كمية الماء.",
      fr: "Plastifiant pour améliorer l'ouvrabilité et faciliter la mise en œuvre.",
      en: "Standard water reducer/plasticizer to improve workability without extra water."
    };

    if (activeConcreteCode === "UHPC" || activeConcreteCode === "BFUP" || activeConcreteCode === "SCC" || fck28 >= 40) {
      suggestedAdmixture = admixList.find(m => m.name.includes("فائق") || m.name.toLowerCase().includes("super") || m.name.toLowerCase().includes("pce") || m.name.toLowerCase().includes("polycarboxylate"));
      admixtureReason = {
        ar: "ملدن فائق عالي الكفاءة (Superplasticizer PCE) لتخفيض الماء بنسبة > 25% مع الحفاظ على القوام السائل.",
        fr: "Superplastifiant haut de gamme (PCE) pour réduire l'eau de gâchage de 25%.",
        en: "High-range polycarboxylate superplasticizer to reduce water by >25% while maintaining fluid consistency."
      };
    } else if (fck28 >= 30) {
      suggestedAdmixture = admixList.find(m => m.name.includes("ملدن") || m.name.toLowerCase().includes("plasticizer") || m.name.includes("محدث") || m.name.includes("مخفض"));
    }
    if (suggestedAdmixture && activeConfig && !activeConfig.isMaterialCompatible(suggestedAdmixture)) {
      suggestedAdmixture = admixList.find(m => activeConfig.isMaterialCompatible(m));
    }
    if (!suggestedAdmixture && admixList.length > 0) {
      suggestedAdmixture = admixList[0];
    }

    // 6. SCM (Mineral Admixtures)
    let scmList = activeMaterials.filter(m => m.category === "إضافات معدنية");
    let suggestedScm: EngineeringMaterial | undefined;
    let scmReason = {
      ar: "إضافات بوزولانية نشطة لملء المسامات وتحسين متانة الهيكل طويل الأمد.",
      fr: "Addition minérale active pour combler les pores et améliorer la durabilité.",
      en: "Active mineral addition to fill pores and enhance long-term durability."
    };

    if (activeConcreteCode === "UHPC" || activeConcreteCode === "BFUP" || activeConcreteCode === "HPC") {
      suggestedScm = scmList.find(m => m.name.includes("سيليكا") || m.name.toLowerCase().includes("silica") || m.name.toLowerCase().includes("fume"));
      scmReason = {
        ar: "غبار سيليكا فائق النعومة لملء الفراغات البينية وتوليد سيليكات الكالسيوم المتماسكة (C-S-H).",
        fr: "Fumée de silice ultra-fine pour remplir les micro-vides et former du C-S-H dense.",
        en: "Ultra-fine silica fume to fill micro-voids and trigger reactive C-S-H gel formation."
      };
    } else if (activeConcreteCode === "GPC") {
      suggestedScm = scmList.find(m => m.name.includes("خبث") || m.name.toLowerCase().includes("slag") || m.name.includes("رماد") || m.name.toLowerCase().includes("fly ash"));
      scmReason = {
        ar: "خبث فرن أو رماد متطاير لتأمين السيليكات والألومينات اللازمة للبلمرة الجيولوجية.",
        fr: "Laitier ou cendres volantes apportant silice et alumine pour la géopolymérisation.",
        en: "Slag or fly ash providing silicate and aluminate precursors for geopolymeric binders."
      };
    }
    if (suggestedScm && activeConfig && !activeConfig.isMaterialCompatible(suggestedScm)) {
      suggestedScm = scmList.find(m => activeConfig.isMaterialCompatible(m));
    }
    if (!suggestedScm && scmList.length > 0) {
      suggestedScm = scmList[0];
    }

    // 7. FIBER
    let fiberList = activeMaterials.filter(m => m.category === "ألياف");
    let suggestedFiber: EngineeringMaterial | undefined;
    let fiberReason = {
      ar: "ألياف تسليح لتعزيز مقاومة الضغط والشد ومكافحة الانكماش اللدن الخرساني.",
      fr: "Fibres de renforcement pour limiter le retrait plastique.",
      en: "Reinforcing fibers to mitigate plastic shrinkage cracking."
    };

    if (activeConcreteCode === "FRC" || activeConcreteCode === "UHPC" || activeConcreteCode === "BFUP") {
      suggestedFiber = fiberList.find(m => m.name.includes("فولاذ") || m.name.toLowerCase().includes("steel")) || fiberList.find(m => m.name.includes("ألياف") || m.name.toLowerCase().includes("fiber"));
      fiberReason = {
        ar: "ألياف فولاذية دقيقة لرفع مقاومة الشد المباشر ومقاومة الصدمات والدونة الإنشائية.",
        fr: "Fibres métalliques pour accroître la résistance à la traction et la ductilité.",
        en: "Micro-steel fibers to significantly boost tensile strength, impact resistance, and ductility."
      };
    }
    if (suggestedFiber && activeConfig && !activeConfig.isMaterialCompatible(suggestedFiber)) {
      suggestedFiber = fiberList.find(m => activeConfig.isMaterialCompatible(m));
    }
    if (!suggestedFiber && fiberList.length > 0) {
      suggestedFiber = fiberList[0];
    }

    return {
      cement: suggestedCement, cementReason,
      sand: suggestedSand, sandReason,
      gravel: suggestedGravel, gravelReason,
      water: suggestedWater, waterReason,
      admixture: suggestedAdmixture, admixtureReason,
      scm: suggestedScm, scmReason,
      fiber: suggestedFiber, fiberReason
    };
  }, [activeMaterials, activeConcreteCode, fck28, activeConfig]);

  const handleApply = () => {
    if (!suggestions) return;
    onApplySuggestions({
      selectedCementId: suggestions.cement?.id,
      selectedSandId: suggestions.sand?.id,
      selectedGravelId: suggestions.gravel?.id,
      selectedWaterId: suggestions.water?.id,
      selectedAdmixtureId: suggestions.admixture?.id,
      selectedScmId: suggestions.scm?.id,
      selectedFiberId: suggestions.fiber?.id,
      selectedSpecialBinderId: activeConcreteCode === "GPC" ? suggestions.cement?.id : undefined,
    });
  };

  if (!suggestions) {
    return (
      <div className="bg-red-500/10 border border-red-500/25 rounded-2xl p-4 text-center space-y-2">
        <AlertTriangle className="text-red-500 mx-auto" size={24} />
        <p className="text-xs font-bold text-red-700 dark:text-red-400">
          {isAr
            ? "لم يتم العثور على مواد نشطة في مكتبة المواد لتقديم الاقتراحات!"
            : "No active materials found in the materials library to generate suggestions!"}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-500/10 dark:via-transparent dark:to-transparent border border-amber-500/20 dark:border-amber-500/30 rounded-2xl p-5 shadow-sm space-y-4 text-right" id="smart-materials-suggester-panel">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-amber-500/10 dark:border-amber-500/20 pb-3 gap-3">
        <button
          type="button"
          onClick={handleApply}
          className="w-full sm:w-auto text-xs flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-550 to-amber-600 hover:from-amber-600 hover:to-amber-700 cursor-pointer text-slate-900 font-black px-4 py-2.5 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] border border-amber-400 shadow-md"
        >
          <CheckCircle2 size={15} className="text-slate-900 shrink-0" />
          <span>
            {isAr ? "تطبيق واختيار المواد المقترحة تلقائياً" : isFr ? "Appliquer et Sélectionner les Matériaux" : "Apply & Auto-Select Recommended Materials"}
          </span>
        </button>

        <div className="flex items-center gap-2.5 justify-end w-full sm:w-auto">
          <div>
            <h4 className="text-xs font-black text-amber-600 dark:text-amber-400 flex items-center gap-1 justify-end uppercase tracking-widest font-mono select-none">
              <span>{isAr ? "مساعد اقتراح المواد الذكي (من مكتبة المواد العامة)" : "Smart Material Suggestion Assistant"}</span>
              <Sparkles size={14} className="text-amber-500 animate-pulse" />
            </h4>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {isAr ? "اقتراحات صحيحة، منطقية ومستوردة مباشرة من مستودع المواد للمقاومة المستهدفة" : "Logical & certified materials matching the target design parameters"}
            </p>
          </div>
        </div>
      </div>

      {/* Concrete Type & Strength Parameters Summary */}
      <div className="bg-amber-500/5 dark:bg-amber-500/2 p-3.5 rounded-xl border border-amber-300/10 text-[11px] leading-relaxed text-slate-700 dark:text-slate-350 pr-4 border-r-4 border-r-amber-500">
        <strong className="text-slate-800 dark:text-white block mb-0.5 font-bold">
          {isAr ? "التوجيه الهندسي والمطابقة للخلطة:" : "Engineering Guidance & Matching Summary:"}
        </strong>
        {isAr ? (
          <span>
            تم تحليل نوع الخرسانة المحددة <span className="font-extrabold text-amber-600">({concreteType})</span> والمقاومة المميزة المطلوبة <span className="font-extrabold text-amber-600">({fck28} MPa)</span>. تم تحديد أنسب التراكيب الكيميائية والفيزيائية للمواد المتوفرة في <strong>المكتبة العامة للمواد</strong> لمطابقة معايير جودة الخرسانة ومتانتها.
          </span>
        ) : (
          <span>
            Analyzed concrete type <span className="font-extrabold text-amber-600">({concreteType})</span> and target strength <span className="font-extrabold text-amber-600">({fck28} MPa)</span>. Recommended materials have been selected from the <strong>Public Materials Library</strong> to guarantee optimum durability and structural safety.
          </span>
        )}
      </div>

      {/* Suggested Grid Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1 text-right">
        {/* Item 1: Cement */}
        {isCementAllowed && (
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 p-3.5 rounded-xl flex flex-col justify-between space-y-2 relative">
            <div className="flex justify-between items-start">
              <span className="text-[8.5px] bg-red-500/10 text-red-500 dark:text-red-400 font-bold px-1.5 py-0.5 rounded font-mono">CEMENT SPEC</span>
              <span className="text-[8.5px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black px-1.5 py-0.5 rounded flex items-center gap-1">
                ✓ {isAr ? "مكتبة المواد" : "Library"}
              </span>
            </div>
            <div>
              <span className="text-[9.5px] text-slate-400 block font-semibold leading-none">{isAr ? "الإسمنت المقترح:" : "Suggested Cement:"}</span>
              <p className="text-xs font-black text-slate-850 dark:text-slate-200 mt-1 leading-snug">
                {suggestions.cement ? suggestions.cement.name : (isAr ? "لا يوجد إسمنت معتمد في المكتبة" : "No cement found")}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 border-t border-slate-100 dark:border-slate-800/60 pt-1">
                💡 {suggestions.cementReason[language as "ar" | "fr" | "en"] || suggestions.cementReason.ar}
              </p>
              {suggestions.cement && (
                <div className="mt-1 flex flex-wrap gap-1">
                  <span className="text-[8.5px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1 py-0.2 rounded font-mono">
                    {isAr ? "الكثافة:" : "Density:"} {suggestions.cement.density || suggestions.cement.specificGravity}
                  </span>
                  {suggestions.cement.provenance && (
                    <span className="text-[8.5px] text-blue-500 bg-blue-500/5 px-1 py-0.2 rounded font-mono">
                      📍 {suggestions.cement.provenance}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Item 2: Sand */}
        {isSandAllowed && (
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 p-3.5 rounded-xl flex flex-col justify-between space-y-2 relative">
            <div className="flex justify-between items-start">
              <span className="text-[8.5px] bg-amber-500/10 text-amber-500 dark:text-amber-450 font-bold px-1.5 py-0.5 rounded font-mono">SAND SPEC</span>
              <span className="text-[8.5px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black px-1.5 py-0.5 rounded flex items-center gap-1">
                ✓ {isAr ? "مكتبة المواد" : "Library"}
              </span>
            </div>
            <div>
              <span className="text-[9.5px] text-slate-400 block font-semibold leading-none">{isAr ? "الرمل المقترح:" : "Suggested Sand:"}</span>
              <p className="text-xs font-black text-slate-850 dark:text-slate-200 mt-1 leading-snug">
                {suggestions.sand ? suggestions.sand.name : (isAr ? "لا يوجد رمل معتمد في المكتبة" : "No sand found")}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 border-t border-slate-100 dark:border-slate-800/60 pt-1">
                💡 {suggestions.sandReason[language as "ar" | "fr" | "en"] || suggestions.sandReason.ar}
              </p>
              {suggestions.sand && (
                <div className="mt-1 flex flex-wrap gap-1">
                  <span className="text-[8.5px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1 py-0.2 rounded font-mono">
                    {isAr ? "معامل النعومة:" : "FM:"} {suggestions.sand.finenessModulus || 2.6}
                  </span>
                  {suggestions.sand.provenance && (
                    <span className="text-[8.5px] text-blue-500 bg-blue-500/5 px-1 py-0.2 rounded font-mono">
                      📍 {suggestions.sand.provenance}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Item 3: Gravel */}
        {isGravelAllowed && (
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 p-3.5 rounded-xl flex flex-col justify-between space-y-2 relative">
            <div className="flex justify-between items-start">
              <span className="text-[8.5px] bg-sky-500/10 text-sky-500 dark:text-sky-455 font-bold px-1.5 py-0.5 rounded font-mono">GRAVEL SPEC</span>
              <span className="text-[8.5px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black px-1.5 py-0.5 rounded flex items-center gap-1">
                ✓ {isAr ? "مكتبة المواد" : "Library"}
              </span>
            </div>
            <div>
              <span className="text-[9.5px] text-slate-400 block font-semibold leading-none">{isAr ? "الحصى/الركام المقترح:" : "Suggested Gravel:"}</span>
              <p className="text-xs font-black text-slate-850 dark:text-slate-200 mt-1 leading-snug">
                {suggestions.gravel ? suggestions.gravel.name : (isAr ? "لا يوجد ركام معتمد في المكتبة" : "No gravel found")}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 border-t border-slate-100 dark:border-slate-800/60 pt-1">
                💡 {suggestions.gravelReason[language as "ar" | "fr" | "en"] || suggestions.gravelReason.ar}
              </p>
              {suggestions.gravel && (
                <div className="mt-1 flex flex-wrap gap-1">
                  <span className="text-[8.5px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1 py-0.2 rounded font-mono">
                    {isAr ? "القطر الأقصى Dmax:" : "Dmax:"} {suggestions.gravel.dMax || 20} {isAr ? "مم" : "mm"}
                  </span>
                  {suggestions.gravel.provenance && (
                    <span className="text-[8.5px] text-blue-500 bg-blue-500/5 px-1 py-0.2 rounded font-mono">
                      📍 {suggestions.gravel.provenance}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Item 4: Admixture */}
        {isAdmixtureAllowed && suggestions.admixture && (
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 p-3.5 rounded-xl flex flex-col justify-between space-y-2 relative">
            <div className="flex justify-between items-start">
              <span className="text-[8.5px] bg-purple-500/10 text-purple-500 dark:text-purple-400 font-bold px-1.5 py-0.5 rounded font-mono">ADMIX SPEC</span>
              <span className="text-[8.5px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black px-1.5 py-0.5 rounded flex items-center gap-1">
                ✓ {isAr ? "مكتبة المواد" : "Library"}
              </span>
            </div>
            <div>
              <span className="text-[9.5px] text-slate-400 block font-semibold leading-none">{isAr ? "المحسن/الملدن المقترح:" : "Suggested Admixture:"}</span>
              <p className="text-xs font-black text-slate-850 dark:text-slate-200 mt-1 leading-snug">
                {suggestions.admixture.name}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 border-t border-slate-100 dark:border-slate-800/60 pt-1">
                💡 {suggestions.admixtureReason[language as "ar" | "fr" | "en"] || suggestions.admixtureReason.ar}
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                <span className="text-[8.5px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1 py-0.2 rounded font-mono">
                  {isAr ? "تقليل الماء:" : "Water Red:"} {suggestions.admixture.waterReduction || 20}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Item 5: SCM */}
        {isScmAllowed && suggestions.scm && (
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 p-3.5 rounded-xl flex flex-col justify-between space-y-2 relative">
            <div className="flex justify-between items-start">
              <span className="text-[8.5px] bg-blue-500/10 text-blue-500 dark:text-blue-400 font-bold px-1.5 py-0.5 rounded font-mono">SCM SPEC</span>
              <span className="text-[8.5px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black px-1.5 py-0.5 rounded flex items-center gap-1">
                ✓ {isAr ? "مكتبة المواد" : "Library"}
              </span>
            </div>
            <div>
              <span className="text-[9.5px] text-slate-400 block font-semibold leading-none">{isAr ? "الإضافات المعدنية المقترحة:" : "Suggested SCM:"}</span>
              <p className="text-xs font-black text-slate-850 dark:text-slate-200 mt-1 leading-snug">
                {suggestions.scm.name}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 border-t border-slate-100 dark:border-slate-800/60 pt-1">
                💡 {suggestions.scmReason[language as "ar" | "fr" | "en"] || suggestions.scmReason.ar}
              </p>
            </div>
          </div>
        )}

        {/* Item 6: Fiber */}
        {isFiberAllowed && suggestions.fiber && (
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 p-3.5 rounded-xl flex flex-col justify-between space-y-2 relative">
            <div className="flex justify-between items-start">
              <span className="text-[8.5px] bg-teal-500/10 text-teal-500 dark:text-teal-400 font-bold px-1.5 py-0.5 rounded font-mono">FIBER SPEC</span>
              <span className="text-[8.5px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black px-1.5 py-0.5 rounded flex items-center gap-1">
                ✓ {isAr ? "مكتبة المواد" : "Library"}
              </span>
            </div>
            <div>
              <span className="text-[9.5px] text-slate-400 block font-semibold leading-none">{isAr ? "الألياف المقترحة:" : "Suggested Fiber:"}</span>
              <p className="text-xs font-black text-slate-850 dark:text-slate-200 mt-1 leading-snug">
                {suggestions.fiber.name}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 border-t border-slate-100 dark:border-slate-800/60 pt-1">
                💡 {suggestions.fiberReason[language as "ar" | "fr" | "en"] || suggestions.fiberReason.ar}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
