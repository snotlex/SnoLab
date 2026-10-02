import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  FlaskConical,
  Info,
  Layers3,
  Sparkles,
  X
} from "lucide-react";
import { EngineeringMaterial, MixDesignInput } from "../../types";
import {
  applyRecommendedPackageToInputs,
  buildRecommendedDosagePlan,
  generateMaterialRecommendations,
  recordProjectRecommendationDecision,
  RecommendationPlanResult,
  RecommendedDosagePlan,
  SupportedMaterialRole
} from "../../services/materialRecommendationEngine";

interface SmartMaterialRecommendationPanelProps {
  inputs: MixDesignInput;
  setInputs: React.Dispatch<React.SetStateAction<MixDesignInput>>;
  materials: EngineeringMaterial[];
  activeProject?: any;
  language?: string;
}

type Locale = "ar" | "en" | "fr";
type Copy = {
  stage: string; title: string; subtitle: string; rulesBased: string; context: string;
  compatibility: string; checked: string; eligible: string; readyTitle: string;
  notReadyTitle: string; notReadyDescription: string; missingData: string;
  required: string; optional: string; recommendedMaterials: string; noCandidates: string;
  score: string; source: string; rationale: string; noRationale: string;
  dosages: string; ratio: string; binderWater: string; aggregates: string;
  additions: string; alternatives: string; hideAlternatives: string;
  noAlternatives: string; alternative: string; accept: string; reject: string;
  labNotice: string; feedbackAccepted: string; feedbackCannotAccept: string;
  feedbackRejected: string; showAgain: string; dismissed: string;
  projectType: string; strength: string; aggregateSize: string; slump: string;
};

const COPY: Record<Locale, Copy> = {
  ar: {
    stage: "المرحلة 03 / 05", title: "مقترح المواد الذكي",
    subtitle: "باقة مواد مرشحة وفق متطلبات المشروع وخصائص المواد المسجلة في المكتبة.",
    rulesBased: "ترشيح هندسي قابل للتفسير", context: "أساس الترشيح",
    compatibility: "التوافق الإجمالي", checked: "مادة جرى تقييمها", eligible: "مادة مؤهلة",
    readyTitle: "الباقة المقترحة جاهزة للمراجعة", notReadyTitle: "المقترح غير مكتمل بعد",
    notReadyDescription: "لا يمكن تطبيق باقة كاملة حاليًا. راجع المواد المطلوبة والبيانات الناقصة أدناه.",
    missingData: "مدخلات المشروع الناقصة", required: "إلزامي", optional: "اختياري",
    recommendedMaterials: "المواد المرشحة", noCandidates: "لا يوجد مرشح مؤهل لهذا الدور في مكتبة المواد الحالية.",
    score: "درجة التوافق", source: "المصدر", rationale: "سبب الترشيح",
    noRationale: "اختيرت هذه المادة وفق نتيجة فحص التوافق والأهلية المسجلة.",
    dosages: "ملخص الجرعات التقديري", ratio: "الماء / الرابط", binderWater: "الرابط / الماء",
    aggregates: "الرمل / الركام الخشن", additions: "الإضافات المقترحة",
    alternatives: "عرض البدائل المؤهلة", hideAlternatives: "إخفاء البدائل",
    noAlternatives: "لا توجد بدائل إضافية مؤهلة لهذه المتطلبات.", alternative: "بديل مؤهل",
    accept: "قبول الاقتراح وتطبيقه", reject: "رفض الاقتراح",
    labNotice: "هذا ترشيح أولي لدعم القرار؛ تحقّق مخبريًا من الخلطة قبل اعتمادها أو استخدامها ميدانيًا.",
    feedbackAccepted: "تم تطبيق المواد والجرعات المقترحة وتحديث مدخلات الخلطة.",
    feedbackCannotAccept: "لا يمكن تطبيق الاقتراح قبل اكتمال الأدوار الإلزامية وبيانات المشروع.",
    feedbackRejected: "تم رفض هذا المقترح. يمكنك إظهاره مجددًا أو اختيار المواد يدويًا.",
    showAgain: "إظهار المقترح مجددًا", dismissed: "تم إخفاء المقترح.",
    projectType: "نوع الخرسانة", strength: "المقاومة المستهدفة",
    aggregateSize: "أقصى مقاس للركام", slump: "الهبوط"
  },
  en: {
    stage: "STAGE 03 / 05", title: "Smart Material Proposal",
    subtitle: "A candidate material package based on project requirements and properties recorded in the library.",
    rulesBased: "Explainable engineering recommendation", context: "Recommendation basis",
    compatibility: "Overall compatibility", checked: "materials evaluated", eligible: "eligible materials",
    readyTitle: "Proposed package is ready for review", notReadyTitle: "The proposal is incomplete",
    notReadyDescription: "A complete package cannot be applied yet. Review the required materials and missing data below.",
    missingData: "Missing project inputs", required: "Required", optional: "Optional",
    recommendedMaterials: "Recommended materials", noCandidates: "No eligible candidate for this role is available in the current material library.",
    score: "Compatibility", source: "Source", rationale: "Why this material",
    noRationale: "Selected from the recorded compatibility and eligibility assessment.",
    dosages: "Indicative dosage summary", ratio: "Water / binder", binderWater: "Binder / water",
    aggregates: "Sand / coarse aggregate", additions: "Suggested additions",
    alternatives: "View eligible alternatives", hideAlternatives: "Hide alternatives",
    noAlternatives: "No additional eligible alternatives for these requirements.", alternative: "Eligible alternative",
    accept: "Accept and apply proposal", reject: "Reject proposal",
    labNotice: "This is a preliminary decision aid. Verify the mix through laboratory trials before approval or field use.",
    feedbackAccepted: "Recommended materials and dosages applied to the mix inputs.",
    feedbackCannotAccept: "The proposal cannot be applied until required roles and project inputs are complete.",
    feedbackRejected: "Proposal rejected. You can show it again or select materials manually.",
    showAgain: "Show proposal again", dismissed: "The proposal has been hidden.",
    projectType: "Concrete type", strength: "Target strength",
    aggregateSize: "Maximum aggregate size", slump: "Slump"
  },
  fr: {
    stage: "ÉTAPE 03 / 05", title: "Proposition intelligente des matériaux",
    subtitle: "Un ensemble de matériaux candidats selon les exigences du projet et les propriétés de la bibliothèque.",
    rulesBased: "Recommandation technique explicable", context: "Base de la recommandation",
    compatibility: "Compatibilité globale", checked: "matériaux évalués", eligible: "matériaux admissibles",
    readyTitle: "La proposition peut être examinée", notReadyTitle: "La proposition est incomplète",
    notReadyDescription: "Un ensemble complet ne peut pas encore être appliqué. Vérifiez les matériaux requis et les données manquantes.",
    missingData: "Données du projet manquantes", required: "Obligatoire", optional: "Optionnel",
    recommendedMaterials: "Matériaux proposés", noCandidates: "Aucun matériau admissible pour ce rôle dans la bibliothèque actuelle.",
    score: "Compatibilité", source: "Source", rationale: "Motif de sélection",
    noRationale: "Sélection fondée sur l’évaluation enregistrée de compatibilité et d’admissibilité.",
    dosages: "Résumé indicatif des dosages", ratio: "Eau / liant", binderWater: "Liant / eau",
    aggregates: "Sable / granulats grossiers", additions: "Ajouts proposés",
    alternatives: "Voir les alternatives admissibles", hideAlternatives: "Masquer les alternatives",
    noAlternatives: "Aucune autre alternative admissible pour ces exigences.", alternative: "Alternative admissible",
    accept: "Accepter et appliquer", reject: "Refuser la proposition",
    labNotice: "Cette proposition est indicative. Vérifiez le mélange par des essais en laboratoire avant approbation ou utilisation.",
    feedbackAccepted: "Les matériaux et dosages proposés ont été appliqués aux données du mélange.",
    feedbackCannotAccept: "La proposition ne peut être appliquée avant de compléter les rôles requis et les données du projet.",
    feedbackRejected: "Proposition refusée. Vous pouvez la réafficher ou choisir les matériaux manuellement.",
    showAgain: "Réafficher la proposition", dismissed: "La proposition a été masquée.",
    projectType: "Type de béton", strength: "Résistance cible",
    aggregateSize: "Dimension maximale des granulats", slump: "Affaissement"
  }
};

const ROLE_LABELS: Record<string, Record<Locale, string>> = {
  cement: { ar: "الإسمنت", en: "Cement", fr: "Ciment" },
  sand: { ar: "الرمل", en: "Sand", fr: "Sable" },
  gravel: { ar: "الركام الخشن", en: "Coarse aggregate", fr: "Granulats grossiers" },
  water: { ar: "ماء الخلط", en: "Mixing water", fr: "Eau de gâchage" },
  admixture: { ar: "المضاف الكيميائي", en: "Chemical admixture", fr: "Adjuvant chimique" },
  scm: { ar: "المضاف المعدني", en: "Mineral addition", fr: "Addition minérale" },
  fiber: { ar: "الألياف", en: "Fibres", fr: "Fibres" },
  lightweightAggregate: { ar: "الركام الخفيف", en: "Lightweight aggregate", fr: "Granulats légers" },
  heavyweightAggregate: { ar: "الركام الثقيل", en: "Heavyweight aggregate", fr: "Granulats lourds" },
  specialBinder: { ar: "المادة الرابطة الخاصة", en: "Special binder", fr: "Liant spécial" }
};

function inputContext(inputs: MixDesignInput) {
  return {
    concreteType: inputs.concreteType || "NSC",
    mixDesignMethod: inputs.selectedMethod || "dreux",
    targetStrength: inputs.fck28,
    targetDensity: (inputs as any).targetDensity,
    maxAggregateSize: inputs.dMax,
    slumpCm: inputs.slump,
    exposureClass: inputs.exposureClass,
    hasPumping: inputs.hasPumping,
    selectedCementId: inputs.selectedCementId,
    selectedSandId: inputs.selectedSandId,
    selectedGravelId: inputs.selectedGravelId,
    selectedWaterId: inputs.selectedWaterId,
    selectedAdmixtureId: inputs.selectedAdmixtureId,
    selectedScmId: inputs.selectedScmId,
    selectedFiberId: inputs.selectedFiberId,
    selectedLightweightAggregateId: inputs.selectedLightweightAggregateId,
    selectedHeavyweightAggregateId: inputs.selectedHeavyweightAggregateId,
    selectedSpecialBinderId: inputs.selectedSpecialBinderId
  };
}

const formatNumber = (value: number, digits = 0) =>
  Number.isFinite(value)
    ? value.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits })
    : "—";

export const SmartMaterialRecommendationPanel: React.FC<SmartMaterialRecommendationPanelProps> = ({
  inputs, setInputs, materials, activeProject, language = "ar"
}) => {
  const locale: Locale = language === "ar" || language === "fr" ? language : "en";
  const isAr = locale === "ar";
  const copy = COPY[locale];
  const [dismissed, setDismissed] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const recommendation = useMemo<RecommendationPlanResult>(
    () => generateMaterialRecommendations(materials, inputContext(inputs), activeProject),
    [materials, inputs, activeProject]
  );
  const dosagePlan = useMemo<RecommendedDosagePlan>(
    () => buildRecommendedDosagePlan(recommendation, inputContext(inputs)),
    [recommendation, inputs]
  );
  const recommendedEntries = Object.entries(recommendation.recommendedSet) as [SupportedMaterialRole, EngineeringMaterial][];
  const groupsWithAlternatives = (Object.entries(recommendation.roleGroups) as [SupportedMaterialRole, RecommendationPlanResult["roleGroups"][SupportedMaterialRole]][])
    .map(([role, group]) => ({ role, group }))
    .filter(({ group }) => (group?.alternatives.length || 0) > 0);
  const alternativeCount = groupsWithAlternatives.reduce((count, { group }) => count + (group?.alternatives.length || 0), 0);

  const accept = () => {
    if (!recommendation.isReadyForMix || recommendedEntries.length === 0) {
      setFeedback(copy.feedbackCannotAccept);
      return;
    }
    setInputs(applyRecommendedPackageToInputs(inputs, recommendation, dosagePlan));
    const timestamp = new Date().toISOString();
    recommendedEntries.forEach(([role, material]) => recordProjectRecommendationDecision({
      id: `REC-${Date.now()}-${role}-${material.id}`,
      projectId: activeProject,
      role,
      materialId: material.id,
      materialName: material.name,
      materialCategory: material.category || material.type,
      isSystem: !!material.isSystem || material.id.startsWith("SYS-"),
      action: "accept",
      compatibilityScore: recommendation.roleGroups[role]?.topCandidate?.compatibilityScore || 0,
      reason: "Smart Engineering Recommendation",
      timestamp,
      context: {
        concreteType: recommendation.requirementPlan.concreteType,
        mixDesignMethod: recommendation.requirementPlan.mixDesignMethod,
        targetStrength: recommendation.requirementPlan.targetStrength
      }
    }));
    setFeedback(copy.feedbackAccepted);
  };

  const reject = () => {
    const timestamp = new Date().toISOString();
    recommendedEntries.forEach(([role, material]) => recordProjectRecommendationDecision({
      id: `REC-${Date.now()}-${role}-${material.id}`,
      projectId: activeProject,
      role,
      materialId: material.id,
      materialName: material.name,
      materialCategory: material.category || material.type,
      isSystem: !!material.isSystem || material.id.startsWith("SYS-"),
      action: "reject",
      compatibilityScore: recommendation.roleGroups[role]?.topCandidate?.compatibilityScore || 0,
      reason: "User rejected Smart Engineering Recommendation",
      timestamp,
      context: {
        concreteType: recommendation.requirementPlan.concreteType,
        mixDesignMethod: recommendation.requirementPlan.mixDesignMethod,
        targetStrength: recommendation.requirementPlan.targetStrength
      }
    }));
    setFeedback(copy.feedbackRejected);
    setDismissed(true);
  };

  if (dismissed) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50" dir={isAr ? "rtl" : "ltr"}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300"><Layers3 size={19} /></div>
            <div><p className="text-sm font-black text-slate-800 dark:text-slate-100">{copy.dismissed}</p><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{feedback}</p></div>
          </div>
          <button type="button" onClick={() => setDismissed(false)} className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-xs font-extrabold text-blue-700 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-blue-900 dark:bg-slate-950 dark:text-blue-300 dark:hover:bg-slate-900">{copy.showAgain}</button>
        </div>
      </section>
    );
  }

  const contextItems = [
    { label: copy.projectType, value: String(inputs.concreteType || "NSC").toUpperCase() },
    { label: copy.strength, value: `${formatNumber(Number(inputs.fck28))} MPa` },
    { label: copy.aggregateSize, value: `${formatNumber(Number(inputs.dMax))} mm` },
    { label: copy.slump, value: `${formatNumber(Number(inputs.slump))} cm` }
  ];

  return (
    <section id="smart-material-recommendation-panel" className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950" dir={isAr ? "rtl" : "ltr"}>
      <header className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-5 py-5 text-white sm:px-7 sm:py-6">
        <div aria-hidden="true" className="pointer-events-none absolute -left-14 -top-20 h-56 w-56 rounded-full border border-white/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -left-2 -top-8 h-36 w-36 rounded-full border border-white/10" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-indigo-300/25 bg-indigo-300/10 px-2.5 py-1 text-[10px] font-black tracking-wide text-indigo-100">{copy.stage}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-[10px] font-bold text-emerald-100"><Sparkles size={12} />{copy.rulesBased}</span>
            </div>
            <h2 className="text-xl font-black leading-tight sm:text-2xl">{copy.title}</h2>
            <p className="mt-2 max-w-xl text-xs leading-6 text-slate-300 sm:text-sm">{copy.subtitle}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:min-w-[260px]">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3"><div className="text-[10px] font-semibold text-slate-300">{copy.compatibility}</div><div className="mt-1 font-mono text-2xl font-black text-emerald-300">{recommendation.overallCompatibilityScore}<span className="text-sm">%</span></div></div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3"><div className="text-[10px] font-semibold text-slate-300">{copy.checked}</div><div className="mt-1 font-mono text-2xl font-black text-white">{recommendation.evaluatedMaterialsCount}</div></div>
            <div className="col-span-2 flex items-center justify-between gap-2 rounded-xl bg-white/[0.06] px-3 py-2 text-[10px] text-slate-300"><span>{copy.eligible}</span><strong className="font-mono text-sm text-white">{recommendation.eligibleMaterialsCount}</strong></div>
          </div>
        </div>
      </header>

      <div className="space-y-5 p-4 sm:p-6">
        <section aria-label={copy.context} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/50">
          <div className="mb-3 flex items-center gap-2 text-xs font-black text-slate-700 dark:text-slate-200"><CircleHelp size={15} className="text-indigo-500" />{copy.context}</div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {contextItems.map(item => <div key={item.label} className="min-w-0 rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-950/70"><div className="truncate text-[10px] text-slate-500 dark:text-slate-400">{item.label}</div><div className="mt-1 truncate font-mono text-xs font-extrabold text-slate-800 dark:text-slate-100" dir="ltr">{item.value}</div></div>)}
          </div>
        </section>

        <div className={`flex items-start gap-3 rounded-2xl border p-4 ${recommendation.isReadyForMix ? "border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/70 dark:bg-emerald-950/30" : "border-amber-200 bg-amber-50/80 dark:border-amber-900/70 dark:bg-amber-950/25"}`}>
          <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${recommendation.isReadyForMix ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300"}`}>{recommendation.isReadyForMix ? <Check size={19} /> : <AlertTriangle size={19} />}</div>
          <div className="min-w-0 flex-1">
            <h3 className={`text-sm font-black ${recommendation.isReadyForMix ? "text-emerald-900 dark:text-emerald-200" : "text-amber-900 dark:text-amber-200"}`}>{recommendation.isReadyForMix ? copy.readyTitle : copy.notReadyTitle}</h3>
            <p className="mt-1 text-xs leading-5 text-slate-700 dark:text-slate-300">{recommendation.isReadyForMix ? (locale === "ar" ? recommendation.summaryAr : locale === "fr" ? recommendation.summaryFr : recommendation.summaryEn) : copy.notReadyDescription}</p>
            {!recommendation.isReadyForMix && recommendation.dataSufficiency.missingParameters.length > 0 && <div className="mt-3"><p className="mb-1.5 text-[10px] font-black text-amber-900 dark:text-amber-200">{copy.missingData}</p><div className="flex flex-wrap gap-1.5">{recommendation.dataSufficiency.missingParameters.map(item => <span key={item.key} className="rounded-full border border-amber-200 bg-white/70 px-2.5 py-1 text-[10px] font-semibold text-amber-900 dark:border-amber-800 dark:bg-slate-950/50 dark:text-amber-200">{locale === "ar" ? item.labelAr : item.labelEn}</span>)}</div></div>}
            {recommendation.globalWarnings.length > 0 && <ul className="mt-3 space-y-1 border-t border-amber-200/70 pt-2 dark:border-amber-900/60">{recommendation.globalWarnings.slice(0, 3).map((warning, index) => <li key={`${index}-${warning}`} className="flex items-start gap-1.5 text-[10px] leading-5 text-amber-800 dark:text-amber-200"><AlertTriangle size={12} className="mt-1 shrink-0" />{warning}</li>)}</ul>}
          </div>
        </div>

        <section>
          <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div><h3 className="text-sm font-black text-slate-900 dark:text-white">{copy.recommendedMaterials}</h3><p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">{recommendation.requirementPlan.roles.length} {locale === "ar" ? "أدوار مادية ضمن متطلبات الخلطة" : locale === "fr" ? "rôles de matériaux dans les exigences" : "material roles in the mix requirements"}</p></div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{recommendedEntries.length} {locale === "ar" ? "مواد مرشحة" : locale === "fr" ? "matériaux proposés" : "recommended materials"}</span>
          </div>
          {recommendedEntries.length > 0 ? <div className="grid gap-3 lg:grid-cols-2">
            {recommendedEntries.map(([role, material]) => {
              const group = recommendation.roleGroups[role];
              const candidate = group?.topCandidate;
              const score = Math.max(0, Math.min(100, candidate?.compatibilityScore || 0));
              const source = material.dataProvenance || material.sourceType || material.source;
              const isMandatory = group?.roleRequirement.requirementType === "mandatory";
              return <article key={role} className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-indigo-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-950 dark:hover:border-indigo-900">
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                  <div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300"><FlaskConical size={18} /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-1.5"><span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{ROLE_LABELS[role][locale]}</span><span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${isMandatory ? "bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>{isMandatory ? copy.required : copy.optional}</span></div><h4 className="mt-1 truncate text-sm font-black text-slate-900 dark:text-white" title={material.name}>{material.name}</h4></div></div>
                  <div className="shrink-0 text-end"><div className="font-mono text-lg font-black leading-none text-emerald-600 dark:text-emerald-400">{score}%</div><div className="mt-1 text-[9px] font-semibold text-slate-500 dark:text-slate-400">{copy.score}</div></div>
                </div>
                <div className="space-y-3 p-4">
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" aria-label={`${copy.score}: ${score}%`}><div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-[width] duration-500" style={{ width: `${score}%` }} /></div>
                  <div className="grid gap-2 sm:grid-cols-2"><div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900"><div className="text-[9px] font-bold text-slate-500 dark:text-slate-400">{copy.source}</div><div className="mt-1 truncate text-[10px] font-bold text-slate-800 dark:text-slate-200" title={String(source || "")}>{source || "REFERENCE"}</div></div><div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900"><div className="text-[9px] font-bold text-slate-500 dark:text-slate-400">{locale === "ar" ? "حالة التوافق" : locale === "fr" ? "Statut" : "Assessment"}</div><div className="mt-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">{candidate?.tier === "recommended" ? (locale === "ar" ? "مرشح موصى به" : locale === "fr" ? "Recommandé" : "Recommended") : (locale === "ar" ? "مرشح بديل" : locale === "fr" ? "Alternative" : "Alternative")}</div></div></div>
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-3 py-2.5 dark:border-indigo-950 dark:bg-indigo-950/30"><div className="mb-1 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wide text-indigo-700 dark:text-indigo-300"><Info size={12} />{copy.rationale}</div><p className="text-[10px] leading-5 text-slate-700 dark:text-slate-300">{candidate?.justificationAr || copy.noRationale}</p></div>
                </div>
              </article>;
            })}
          </div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center dark:border-slate-700 dark:bg-slate-900/40"><Layers3 size={22} className="mx-auto text-slate-400" /><p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-600 dark:text-slate-300">{copy.noCandidates}</p></div>}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/50">
          <div className="mb-3 flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"><Layers3 size={16} /></div><div><h3 className="text-xs font-black text-slate-900 dark:text-white">{copy.dosages}</h3><p className="mt-0.5 text-[9px] text-slate-500 dark:text-slate-400">{locale === "ar" ? "تقديرات للمراجعة وليست نتيجة الحساب النهائي" : locale === "fr" ? "Estimations à examiner, distinctes du calcul final" : "Estimates for review, not the final calculation result"}</p></div></div>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950"><div className="text-[9px] text-slate-500 dark:text-slate-400">{copy.ratio}</div><div className="mt-1 font-mono text-sm font-black text-slate-900 dark:text-white" dir="ltr">{formatNumber(dosagePlan.waterBinderRatio, 2)} <span className="text-[10px] font-semibold text-slate-500">({formatNumber(dosagePlan.waterBinderRange[0], 2)}–{formatNumber(dosagePlan.waterBinderRange[1], 2)})</span></div></div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950"><div className="text-[9px] text-slate-500 dark:text-slate-400">{copy.binderWater}</div><div className="mt-1 font-mono text-sm font-black text-slate-900 dark:text-white" dir="ltr">{formatNumber(dosagePlan.binderKgM3)} / {formatNumber(dosagePlan.waterKgM3)} <span className="text-[9px] font-semibold text-slate-500">kg/m³</span></div></div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950"><div className="text-[9px] text-slate-500 dark:text-slate-400">{copy.aggregates}</div><div className="mt-1 font-mono text-sm font-black text-slate-900 dark:text-white" dir="ltr">{formatNumber(dosagePlan.sandKgM3)} / {formatNumber(dosagePlan.coarseAggregateKgM3)} <span className="text-[9px] font-semibold text-slate-500">kg/m³</span></div></div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950"><div className="text-[9px] text-slate-500 dark:text-slate-400">{copy.additions}</div><div className="mt-1 text-[10px] font-extrabold leading-5 text-slate-900 dark:text-white">{dosagePlan.mineralAdmixture ? `${dosagePlan.mineralAdmixture.replacementPercent}% SCM` : "—"}{dosagePlan.chemicalAdmixture ? ` · ${dosagePlan.chemicalAdmixture.dosagePercent}%` : ""}{dosagePlan.fiber ? ` · ${dosagePlan.fiber.dosageKgM3} kg fiber` : ""}</div></div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
          <button type="button" onClick={() => setShowAlternatives(value => !value)} aria-expanded={showAlternatives} className="flex w-full items-center justify-between gap-3 bg-white px-4 py-3 text-start transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-400 dark:bg-slate-950 dark:hover:bg-slate-900">
            <span className="flex min-w-0 items-center gap-2"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"><Layers3 size={15} /></span><span><span className="block text-xs font-black text-slate-900 dark:text-white">{showAlternatives ? copy.hideAlternatives : copy.alternatives}</span><span className="mt-0.5 block text-[9px] text-slate-500 dark:text-slate-400">{alternativeCount} {locale === "ar" ? "بدائل مؤهلة" : locale === "fr" ? "alternatives admissibles" : "eligible alternatives"}</span></span></span>
            {showAlternatives ? <ChevronUp size={17} className="shrink-0 text-slate-500" /> : <ChevronDown size={17} className="shrink-0 text-slate-500" />}
          </button>
          {showAlternatives && <div className="space-y-4 border-t border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/40">
            {groupsWithAlternatives.length === 0 ? <p className="py-3 text-center text-xs text-slate-500 dark:text-slate-400">{copy.noAlternatives}</p> : groupsWithAlternatives.map(({ role, group }) => <div key={role}>
              <h4 className="mb-2 text-[10px] font-black text-slate-700 dark:text-slate-200">{ROLE_LABELS[role][locale]}</h4>
              <div className="grid gap-2 lg:grid-cols-2 xl:grid-cols-3">{group.alternatives.slice(0, 3).map(alt => <article key={alt.material.id} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950"><div className="flex items-start justify-between gap-2"><div className="min-w-0 truncate text-xs font-extrabold text-slate-900 dark:text-white" title={alt.material.name}>{alt.material.name}</div><span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 font-mono text-[9px] font-black text-blue-700 dark:bg-blue-950 dark:text-blue-300">{alt.compatibilityScore}%</span></div><p className="mt-2 line-clamp-3 text-[10px] leading-5 text-slate-600 dark:text-slate-400">{alt.justificationAr || alt.warnings?.[0] || copy.alternative}</p><div className="mt-2 border-t border-slate-100 pt-2 text-[9px] font-bold text-slate-500 dark:border-slate-800 dark:text-slate-400">{copy.alternative}</div></article>)}</div>
            </div>)}
          </div>}
        </section>

        {feedback && <div role="status" className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs font-semibold text-blue-800 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-200">{feedback}</div>}
        <footer className="flex flex-col gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-[10px] leading-5 text-slate-500 dark:text-slate-400"><Info size={14} className="mt-0.5 shrink-0 text-amber-500" />{copy.labNotice}</p>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <button type="button" onClick={reject} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-extrabold text-slate-700 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-rose-900 dark:hover:bg-rose-950/30 dark:hover:text-rose-300"><X size={15} />{copy.reject}</button>
            <button type="button" onClick={accept} disabled={!recommendation.isReadyForMix || recommendedEntries.length === 0} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-slate-800 dark:disabled:text-slate-500"><Check size={16} />{copy.accept}{isAr ? <ArrowLeft size={15} /> : <ArrowRight size={15} />}</button>
          </div>
        </footer>
      </div>
    </section>
  );
};
