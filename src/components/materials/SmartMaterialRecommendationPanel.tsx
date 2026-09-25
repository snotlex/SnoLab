import React, { useMemo, useState } from "react";
import { AlertTriangle, Check, ChevronDown, ChevronUp, Info, Sparkles, X } from "lucide-react";
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

const roleLabels: Record<string, string> = {
  cement: "الإسمنت", sand: "الرمل", gravel: "الركام الخشن", water: "ماء الخلط",
  admixture: "المضاف الكيميائي", scm: "المضاف المعدني", fiber: "الألياف",
  lightweightAggregate: "الركام الخفيف", heavyweightAggregate: "الركام الثقيل", specialBinder: "المادة الرابطة"
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

export const SmartMaterialRecommendationPanel: React.FC<SmartMaterialRecommendationPanelProps> = ({
  inputs, setInputs, materials, activeProject, language = "ar"
}) => {
  const isAr = language === "ar";
  const [dismissed, setDismissed] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const recommendation = useMemo<RecommendationPlanResult>(() => (
    generateMaterialRecommendations(materials, inputContext(inputs), activeProject)
  ), [materials, inputs, activeProject]);
  const dosagePlan = useMemo<RecommendedDosagePlan>(() => (
    buildRecommendedDosagePlan(recommendation, inputContext(inputs))
  ), [recommendation, inputs]);

  if (dismissed) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-4 py-3" dir={isAr ? "rtl" : "ltr"}>
        <span className="text-xs text-slate-500">{isAr ? "تم إخفاء اقتراح المواد. يمكنك إظهاره مجددًا." : "Material recommendation dismissed. You can show it again."}</span>
        <button type="button" onClick={() => setDismissed(false)} className="text-xs font-bold text-blue-500 hover:underline">{isAr ? "إظهار الاقتراح" : "Show recommendation"}</button>
      </div>
    );
  }

  const recommendedEntries = Object.entries(recommendation.recommendedSet) as [SupportedMaterialRole, EngineeringMaterial][];
  const alternatives = (Object.values(recommendation.roleGroups || {}) as Array<RecommendationPlanResult["roleGroups"][SupportedMaterialRole]>).flatMap(group => group?.alternatives || []).slice(0, 3);
  const accept = () => {
    if (!recommendation.isReadyForMix || recommendedEntries.length === 0) {
      setFeedback(isAr ? "لا يمكن قبول الاقتراح: لا توجد باقة مكتملة لكل المواد الإلزامية." : "Cannot accept: no complete package for all mandatory constituents.");
      return;
    }
    const updated = applyRecommendedPackageToInputs(inputs, recommendation, dosagePlan);
    setInputs(updated);
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
      timestamp: new Date().toISOString(),
      context: { concreteType: recommendation.requirementPlan.concreteType, mixDesignMethod: recommendation.requirementPlan.mixDesignMethod, targetStrength: recommendation.requirementPlan.targetStrength }
    }));
    setFeedback(isAr ? "تم قبول الاقتراح وتطبيق المواد والجرعات وإعادة التحقق الهندسي." : "Recommendation accepted; materials, dosages and engineering checks were applied.");
  };

  const reject = () => {
    recommendedEntries.forEach(([role, material]) => recordProjectRecommendationDecision({
      id: `REC-${Date.now()}-${role}-${material.id}`,
      projectId: activeProject, role, materialId: material.id, materialName: material.name,
      materialCategory: material.category || material.type, isSystem: !!material.isSystem || material.id.startsWith("SYS-"),
      action: "reject", compatibilityScore: recommendation.roleGroups[role]?.topCandidate?.compatibilityScore || 0,
      reason: "User rejected Smart Engineering Recommendation", timestamp: new Date().toISOString(),
      context: { concreteType: recommendation.requirementPlan.concreteType, mixDesignMethod: recommendation.requirementPlan.mixDesignMethod, targetStrength: recommendation.requirementPlan.targetStrength }
    }));
    setDismissed(true);
  };

  return (
    <section className="rounded-2xl border border-indigo-400/30 dark:border-indigo-400/20 bg-gradient-to-br from-indigo-500/10 via-blue-500/5 to-transparent p-4 shadow-sm space-y-4" dir={isAr ? "rtl" : "ltr"} id="smart-material-recommendation-panel">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-indigo-300/20 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center"><Sparkles size={20} /></div>
          <div>
            <h3 className="text-sm md:text-base font-black text-slate-900 dark:text-white">{isAr ? "اقتراح المواد والجرعات الهندسي الذكي" : "Smart Engineering Material & Dosage Recommendation"}</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">{isAr ? "محرك قواعد قابل للتفسير؛ يقترح ولا يفرض، ويستخدم المواد المكتملة والمؤهلة فقط." : "Explainable rules engine; advisory only, using complete eligible materials."}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
          <span className="rounded-full bg-blue-500/10 text-blue-500 px-2 py-1">{String(inputs.concreteType || "NSC").toUpperCase()}</span>
          <span className="rounded-full bg-slate-500/10 text-slate-500 px-2 py-1">fck {inputs.fck28} MPa</span>
          <span className="rounded-full bg-slate-500/10 text-slate-500 px-2 py-1">Dmax {inputs.dMax} mm</span>
          <span className="rounded-full bg-slate-500/10 text-slate-500 px-2 py-1">Slump {inputs.slump} cm</span>
        </div>
      </div>

      <div className={`rounded-xl border px-3 py-2 text-xs ${recommendation.isReadyForMix ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "border-amber-400/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"}`}>
        {recommendation.isReadyForMix ? recommendation.summaryAr : (isAr ? "لا توجد مادة مؤهلة حاليًا لهذه المتطلبات." : "No eligible material package is currently available for these requirements.")}
      </div>

      {recommendation.globalWarnings.length > 0 && <div className="space-y-1 text-[10px] text-amber-700 dark:text-amber-300">{recommendation.globalWarnings.slice(0, 3).map((warning, i) => <div key={i} className="flex gap-1.5 items-start"><AlertTriangle size={13} className="shrink-0" />{warning}</div>)}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
        {recommendedEntries.map(([role, material]) => {
          const score = recommendation.roleGroups[role]?.topCandidate?.compatibilityScore || 0;
          return <div key={role} className="rounded-xl border border-slate-200/70 dark:border-slate-700 bg-white/70 dark:bg-slate-900/50 p-3">
            <div className="flex justify-between gap-2 text-[10px] text-slate-500"><span>{roleLabels[role] || role}</span><strong className="text-emerald-500">{score}%</strong></div>
            <div className="font-black text-xs text-slate-800 dark:text-white mt-1 truncate">{material.name}</div>
            <div className="text-[9px] text-slate-400 mt-1">{material.dataProvenance || material.sourceType || material.source || "REFERENCE"}</div>
          </div>;
        })}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
        <div className="rounded-lg bg-white/60 dark:bg-slate-900/40 p-2"><span className="text-slate-500 block">W/B</span><strong>{dosagePlan.waterBinderRatio.toFixed(2)} ({dosagePlan.waterBinderRange[0].toFixed(2)}–{dosagePlan.waterBinderRange[1].toFixed(2)})</strong></div>
        <div className="rounded-lg bg-white/60 dark:bg-slate-900/40 p-2"><span className="text-slate-500 block">Binder / Water</span><strong>{dosagePlan.binderKgM3} / {dosagePlan.waterKgM3} kg/m³</strong></div>
        <div className="rounded-lg bg-white/60 dark:bg-slate-900/40 p-2"><span className="text-slate-500 block">Sand / Coarse</span><strong>{dosagePlan.sandKgM3} / {dosagePlan.coarseAggregateKgM3} kg/m³</strong></div>
        <div className="rounded-lg bg-white/60 dark:bg-slate-900/40 p-2"><span className="text-slate-500 block">{isAr ? "جرعات إضافية" : "Additives"}</span><strong>{dosagePlan.mineralAdmixture ? `${dosagePlan.mineralAdmixture.replacementPercent}% SCM` : "—"}{dosagePlan.chemicalAdmixture ? ` + ${dosagePlan.chemicalAdmixture.dosagePercent}%` : ""}{dosagePlan.fiber ? ` + ${dosagePlan.fiber.dosageKgM3} kg fiber` : ""}</strong></div>
      </div>

      {feedback && <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 px-3 py-2 text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2"><Info size={14} />{feedback}</div>}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={accept} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5"><Check size={15} />{isAr ? "قبول وتطبيق الاقتراح" : "Accept & Apply Recommendation"}</button>
        <button type="button" onClick={reject} className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5"><X size={15} />{isAr ? "رفض الاقتراح" : "Reject"}</button>
        <button type="button" onClick={() => setShowAlternatives(v => !v)} className="px-3 py-2 rounded-xl text-blue-600 dark:text-blue-300 text-xs font-bold flex items-center gap-1.5">{showAlternatives ? <ChevronUp size={14} /> : <ChevronDown size={14} />}{isAr ? "عرض أفضل البدائل" : "Show top alternatives"}</button>
      </div>
      {showAlternatives && <div className="grid grid-cols-1 md:grid-cols-3 gap-2">{alternatives.length ? alternatives.map(alt => <div key={alt.material.id} className="rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-[10px]"><div className="font-bold truncate">{alt.material.name}</div><div className="text-emerald-500 font-black">{alt.compatibilityScore}%</div><div className="text-slate-500 mt-1">{alt.justificationAr || alt.warnings?.[0] || "بديل متوافق وفق القواعد"}</div></div>) : <div className="text-xs text-slate-500 col-span-full">{isAr ? "لا توجد بدائل مؤهلة إضافية." : "No additional eligible alternatives."}</div>}</div>}
      <div className="text-[9px] text-slate-400 flex items-center gap-1"><Info size={12} />{isAr ? "الاقتراح مرجعي أولي ويجب التحقق المخبري قبل التنفيذ." : "Reference starting point; laboratory verification is required before execution."}</div>
    </section>
  );
};
