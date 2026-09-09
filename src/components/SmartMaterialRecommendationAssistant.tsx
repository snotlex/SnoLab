/**
 * Smart Engineering Material Recommendation Assistant (المساعد الهندسي لاقتراح المواد)
 * 
 * Core Philosophy: "SnoLab suggests, does not impose" (SnoLab يقترح ولا يفرض).
 * Project Data -> Engineering Analysis -> Material Recommendations -> Explain Recommendation -> [قبول الاقتراح] / [رفض].
 * 
 * Embeds seamlessly within Step 3 "تحضير الخلطة".
 */

import React, { useState } from "react";
import { 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  AlertTriangle, 
  Layers, 
  Sliders, 
  History, 
  Check, 
  X, 
  ArrowRight, 
  ArrowLeft,
  ShieldCheck, 
  Beaker, 
  Wrench, 
  HelpCircle,
  Clock,
  Sparkle,
  PlusCircle,
  FileEdit,
  Flame,
  Award
} from "lucide-react";
import { 
  RecommendationPlanResult, 
  SupportedMaterialRole, 
  RoleRecommendationGroup,
  MaterialCompatibilityResult,
  CandidateNeedsData,
  RecommendationDecisionRecord,
  recordProjectRecommendationDecision,
  getProjectRecommendationDecisions,
  applyRecommendedMaterialToInputs
} from "../services/materialRecommendationEngine";
import { EngineeringMaterial, MixDesignInput } from "../types";
import { FullMixRecommendationModal } from "./FullMixRecommendationModal";
import { RecommendationHistoryModal } from "./RecommendationHistoryModal";

interface SmartMaterialRecommendationAssistantProps {
  inputs: MixDesignInput;
  materialsDatabase: EngineeringMaterial[];
  recommendationPlan: RecommendationPlanResult;
  onApplyMaterial: (role: SupportedMaterialRole, material: EngineeringMaterial) => void;
  onApplySuite: (selectedRoles: SupportedMaterialRole[]) => void;
  onOpenBatchPropertiesModal: () => void;
  onDecisionsChange: () => void;
  language: "ar" | "fr" | "en";
  activeProjectId?: string;
}

export const SmartMaterialRecommendationAssistant: React.FC<SmartMaterialRecommendationAssistantProps> = ({
  inputs,
  materialsDatabase,
  recommendationPlan,
  onApplyMaterial,
  onApplySuite,
  onOpenBatchPropertiesModal,
  onDecisionsChange,
  language,
  activeProjectId = "default"
}) => {
  const isRtl = language === "ar";
  const [isFullSuiteModalOpen, setIsFullSuiteModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [expandedWhyRole, setExpandedWhyRole] = useState<Record<string, boolean>>({});
  const [expandedAlternativesRole, setExpandedAlternativesRole] = useState<Record<string, boolean>>({});
  const [expandedIneligibleRole, setExpandedIneligibleRole] = useState<Record<string, boolean>>({});
  const [expandedNeedsDataRole, setExpandedNeedsDataRole] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const decisions = getProjectRecommendationDecisions(activeProjectId);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const toggleWhy = (role: string) => {
    setExpandedWhyRole(prev => ({ ...prev, [role]: !prev[role] }));
  };

  const toggleAlternatives = (role: string) => {
    setExpandedAlternativesRole(prev => ({ ...prev, [role]: !prev[role] }));
  };

  const toggleIneligible = (role: string) => {
    setExpandedIneligibleRole(prev => ({ ...prev, [role]: !prev[role] }));
  };

  const toggleNeedsData = (role: string) => {
    setExpandedNeedsDataRole(prev => ({ ...prev, [role]: !prev[role] }));
  };

  // Handle Accept Single Recommendation
  const handleAccept = (role: SupportedMaterialRole, material: EngineeringMaterial, score: number) => {
    // 1. Record decision in history
    const record: RecommendationDecisionRecord = {
      id: `${role}_${material.id}_${Date.now()}`,
      projectId: activeProjectId,
      role,
      materialId: material.id,
      materialName: material.name,
      materialCategory: material.category || role,
      isSystem: !!(material.isSystem || material.sourceType === "system_demo"),
      action: "accept",
      compatibilityScore: score,
      timestamp: new Date().toISOString(),
      context: {
        concreteType: inputs.concreteType || "NSC",
        mixDesignMethod: inputs.selectedMethod || "dreux",
        targetStrength: inputs.fck28
      }
    };
    recordProjectRecommendationDecision(record);
    onDecisionsChange();

    // 2. Apply material to project
    onApplyMaterial(role, material);

    // 3. Feedback Toast
    showToast(
      language === "ar" 
        ? `✓ تم قبول وتطبيق المادة (${material.name}) على الخلطة بنجاح!` 
        : `✓ Accepted & applied (${material.name}) to mix preparation!`
    );
  };

  // Handle Reject Single Recommendation
  const handleReject = (role: SupportedMaterialRole, material: EngineeringMaterial, score: number) => {
    // 1. Record rejection decision
    const record: RecommendationDecisionRecord = {
      id: `${role}_${material.id}_${Date.now()}`,
      projectId: activeProjectId,
      role,
      materialId: material.id,
      materialName: material.name,
      materialCategory: material.category || role,
      isSystem: !!(material.isSystem || material.sourceType === "system_demo"),
      action: "reject",
      compatibilityScore: score,
      timestamp: new Date().toISOString(),
      context: {
        concreteType: inputs.concreteType || "NSC",
        mixDesignMethod: inputs.selectedMethod || "dreux",
        targetStrength: inputs.fck28
      }
    };
    recordProjectRecommendationDecision(record);
    onDecisionsChange();

    // 2. Feedback Toast
    showToast(
      language === "ar" 
        ? `تم رفض الاقتراح (${material.name}). يتم الآن عرض البديل الأفضل التالي.` 
        : `Suggestion rejected (${material.name}). Showing next best alternative.`
    );
  };

  const { roleGroups, overallCompatibilityScore, requirementPlan, dataSufficiency } = recommendationPlan;
  const activeRoles = (Object.keys(roleGroups) as SupportedMaterialRole[]).filter(
    r => roleGroups[r]?.roleRequirement.requirementType !== "forbidden"
  );

  return (
    <div className="space-y-4" dir={isRtl ? "rtl" : "ltr"}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
          <button 
            onClick={() => setToastMessage(null)}
            className="ms-2 text-emerald-200 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Container Card */}
      <div className="bg-gradient-to-br from-indigo-900/10 via-slate-900/5 to-slate-900/10 dark:from-indigo-950/40 dark:via-slate-900/60 dark:to-slate-900/40 rounded-2xl border-2 border-indigo-500/20 dark:border-indigo-500/30 overflow-hidden shadow-sm">
        {/* Banner Header */}
        <div className="px-5 py-4 bg-white/60 dark:bg-slate-900/60 border-b border-indigo-500/15 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-indigo-500/25">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>{language === "ar" ? "المساعد الهندسي لاقتراح المواد" : "Smart Engineering Material Recommendation System"}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                    SnoLab AI Engine
                  </span>
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>{language === "ar" ? "SnoLab يقترح ولا يفرض — تحليلات هندسية قابلة للتفسير مع إمكانية القبول أو الرفض" : "SnoLab suggests, does not impose — explainable engineering recommendations with Accept/Reject flow"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Overall Score Badge */}
            <div className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 flex items-center gap-2">
              <span className="text-[10px] text-indigo-600 dark:text-indigo-300 font-bold uppercase">
                {language === "ar" ? "توافق الباقة" : "Suite Fit"}
              </span>
              <span className="text-xs font-black text-indigo-700 dark:text-indigo-300">
                {overallCompatibilityScore}%
              </span>
            </div>

            {/* Full Mix Proposal Button */}
            <button
              onClick={() => setIsFullSuiteModalOpen(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-xs font-bold shadow-xs shadow-indigo-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{language === "ar" ? "اقتراح الخلطة الكاملة" : "Full Mix Proposal"}</span>
            </button>

            {/* Decision History Button */}
            <button
              onClick={() => setIsHistoryModalOpen(true)}
              className="px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>{language === "ar" ? "سجل القرارات" : "History"}</span>
              {decisions.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[10px] font-bold flex items-center justify-center">
                  {decisions.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Data Sufficiency Warning (if inputs missing) */}
        {!dataSufficiency.isSufficient && (
          <div className="p-4 bg-amber-500/10 border-b border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">
                {language === "ar" ? "تنبيه هندسي: بيانات المشروع تحتاج استكمال لإعطاء توصيات دقيقة" : "Engineering Warning: Project parameters need completion"}
              </span>
              <ul className="list-disc list-inside text-[11px] opacity-90">
                {dataSufficiency.missingParameters.map((p, i) => (
                  <li key={i}>{p.recommendationAr}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Roles Grid */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {activeRoles.map(role => {
            const group = roleGroups[role];
            if (!group) return null;

            const req = group.roleRequirement;
            const topCandidate = group.topCandidate;
            const currentSelection = group.currentSelectionAssessment;
            const isWhyOpen = !!expandedWhyRole[role];
            const isAlternativesOpen = !!expandedAlternativesRole[role];
            const isNeedsDataOpen = !!expandedNeedsDataRole[role];
            const isMandatory = req.requirementType === "mandatory";

            return (
              <div
                key={role}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 flex flex-col justify-between space-y-3 shadow-xs hover:border-indigo-500/40 transition-all"
              >
                {/* Role Header */}
                <div className="space-y-1 pb-2 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                      <span>{req.roleLabelAr}</span>
                    </span>

                    {isMandatory ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                        {language === "ar" ? "إلزامي" : "Required"}
                      </span>
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        {language === "ar" ? "اختياري" : "Optional"}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {req.roleLabelEn}
                  </span>
                </div>

                {/* Current Project Selection Status */}
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60 text-[11px] space-y-1">
                  <div className="text-[10px] text-slate-400 font-medium">
                    {language === "ar" ? "المادة المختارة حالياً:" : "Current Selection:"}
                  </div>
                  {currentSelection && currentSelection.material ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                          {currentSelection.material.name}
                        </span>
                        <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${
                          currentSelection.compatibilityScore >= 80
                            ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                            : "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                        }`}>
                          {currentSelection.compatibilityScore}%
                        </span>
                      </div>

                      {/* Superior alternative notice */}
                      {currentSelection.isSuperiorAlternativeAvailable && (
                        <div className="text-[10px] text-indigo-700 dark:text-indigo-300 font-semibold bg-indigo-50 dark:bg-indigo-950/40 p-1 rounded border border-indigo-100 dark:border-indigo-900/40 flex items-center gap-1">
                          <Sparkle className="w-3 h-3 text-indigo-500 shrink-0" />
                          <span>
                            {language === "ar" 
                              ? `اقتراح SnoLab متوافق بنسبة أعلى (+${currentSelection.superiorScoreDifference}%)` 
                              : `SnoLab suggestion has higher fit (+${currentSelection.superiorScoreDifference}%)`}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-slate-400 italic text-[10px]">
                      {language === "ar" ? "لم يتم اختيار مادة بعد" : "No material selected yet"}
                    </div>
                  )}
                </div>

                {/* Top Recommended Candidate */}
                {topCandidate ? (
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-50/70 to-slate-50 dark:from-indigo-950/30 dark:to-slate-900 border border-indigo-200/80 dark:border-indigo-800/60 space-y-2">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-400 flex items-center gap-1">
                        <Award className="w-3 h-3 text-indigo-600" />
                        <span>{language === "ar" ? "توصية SnoLab الأولى" : "Top Recommendation"}</span>
                      </span>

                      {/* Score Gauge Badge */}
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                        topCandidate.compatibilityScore >= 90
                          ? "bg-emerald-600 text-white shadow-xs"
                          : topCandidate.compatibilityScore >= 75
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-amber-600 text-white"
                      }`}>
                        {topCandidate.compatibilityScore}% {language === "ar" ? "توافق" : "Fit"}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <div className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                        {topCandidate.material.name}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {topCandidate.material.englishName && (
                          <span className="text-[10px] text-slate-400">
                            {topCandidate.material.englishName}
                          </span>
                        )}
                        {topCandidate.material.isSystem || topCandidate.material.sourceType === "system_demo" ? (
                          <span className="text-[9px] px-1 py-0.2 rounded font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                            {language === "ar" ? "مادة نظام" : "SYSTEM"}
                          </span>
                        ) : (
                          <span className="text-[9px] px-1 py-0.2 rounded font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                            {language === "ar" ? "مادتي الخاصة" : "MY MATERIAL"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Key Highlights */}
                    {topCandidate.keyHighlights.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap pt-0.5">
                        {topCandidate.keyHighlights.slice(0, 2).map((hl, idx) => (
                          <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-500/20 flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5 text-emerald-600" />
                            <span>{hl}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Explanatory Dropdown ("لماذا هذه المادة؟") */}
                    <div>
                      <button
                        onClick={() => toggleWhy(role)}
                        className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Info className="w-3 h-3" />
                        <span>{language === "ar" ? "لماذا تم اقتراح هذه المادة؟" : "Why this material?"}</span>
                        {isWhyOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      {isWhyOpen && (
                        <div className="mt-2 p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] space-y-1.5 animate-fadeIn">
                          <div className="font-semibold text-slate-700 dark:text-slate-300">
                            {topCandidate.justificationAr}
                          </div>

                          <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                            {topCandidate.factors.map((f, fi) => (
                              <div key={fi} className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                                <span>{f.labelAr}:</span>
                                <span className="font-bold text-slate-700 dark:text-slate-300">
                                  {f.scoreEarned}/{f.maxScore}
                                </span>
                              </div>
                            ))}
                          </div>

                          {topCandidate.warnings.length > 0 && (
                            <div className="p-1.5 bg-amber-500/10 rounded text-[9px] text-amber-700 dark:text-amber-300 space-y-0.5">
                              {topCandidate.warnings.map((w, wi) => (
                                <div key={wi} className="flex items-start gap-1">
                                  <span>⚠️</span>
                                  <span>{w}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons: Accept or Reject */}
                    <div className="pt-1 flex items-center gap-1.5">
                      <button
                        onClick={() => handleAccept(role, topCandidate.material, topCandidate.compatibilityScore)}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{language === "ar" ? "قبول الاقتراح" : "Accept"}</span>
                      </button>

                      <button
                        onClick={() => handleReject(role, topCandidate.material, topCandidate.compatibilityScore)}
                        className="px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                        title={language === "ar" ? "رفض الاقتراح وعرض البديل التالي" : "Decline and see next alternative"}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{language === "ar" ? "رفض" : "Reject"}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center text-[11px] text-amber-700 dark:text-amber-300 space-y-1">
                    <div className="font-bold">
                      {language === "ar" ? "لا توجد مادة معتمدة ومكتملة الخصائص" : "No complete eligible material in repository"}
                    </div>
                    <div className="text-[10px] opacity-90">
                      {language === "ar" ? "يرجى تسجيل أو استكمال خصائص مادة في المستودع" : "Please add or complete missing properties"}
                    </div>
                  </div>
                )}

                {/* Sub-sections: Needs Data & Alternatives */}
                <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                  {/* Candidates Needing Data */}
                  {group.needsData.length > 0 && (
                    <div>
                      <button
                        onClick={() => toggleNeedsData(role)}
                        className="w-full text-[10px] font-semibold text-amber-700 dark:text-amber-400 hover:underline flex items-center justify-between py-1 cursor-pointer"
                      >
                        <span className="flex items-center gap-1">
                          <Wrench className="w-3 h-3 text-amber-600" />
                          <span>{language === "ar" ? `مواد مرشحة تحتاج استكمال بيانات (${group.needsData.length})` : `Candidates needing data (${group.needsData.length})`}</span>
                        </span>
                        {isNeedsDataOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      {isNeedsDataOpen && (
                        <div className="mt-1 space-y-1.5 bg-amber-50/50 dark:bg-amber-950/20 p-2 rounded-lg border border-amber-200/50 dark:border-amber-900/30 text-[10px]">
                          {group.needsData.map((nd, ndi) => (
                            <div key={ndi} className="flex items-center justify-between gap-1 pb-1 border-b border-amber-200/40 dark:border-amber-900/20 last:border-0 last:pb-0">
                              <div className="min-w-0">
                                <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                  {nd.material.name}
                                </div>
                                <div className="text-[9px] text-amber-700 dark:text-amber-400">
                                  {language === "ar" ? `تنقص: ${nd.missingProperties.join(", ")}` : `Missing: ${nd.missingProperties.join(", ")}`}
                                </div>
                              </div>

                              <button
                                onClick={onOpenBatchPropertiesModal}
                                className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold shrink-0 flex items-center gap-1 cursor-pointer"
                              >
                                <FileEdit className="w-3 h-3" />
                                <span>{language === "ar" ? "إكمال الخاصية" : "Complete"}</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Alternatives List */}
                  {group.alternatives.length > 0 && (
                    <div>
                      <button
                        onClick={() => toggleAlternatives(role)}
                        className="w-full text-[10px] font-semibold text-slate-600 dark:text-slate-400 hover:underline flex items-center justify-between py-1 cursor-pointer"
                      >
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3 text-slate-500" />
                          <span>{language === "ar" ? `البدائل المتاحة (${group.alternatives.length})` : `Available Alternatives (${group.alternatives.length})`}</span>
                        </span>
                        {isAlternativesOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      {isAlternativesOpen && (
                        <div className="mt-1 space-y-1 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px]">
                          {group.alternatives.map((alt, ai) => (
                            <div key={ai} className="flex items-center justify-between gap-1 py-1 border-b border-slate-200/50 dark:border-slate-700/50 last:border-0">
                              <div className="min-w-0">
                                <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                                  {alt.material.name}
                                </span>
                                <span className="text-[9px] text-slate-400">
                                  {alt.compatibilityScore}% {language === "ar" ? "توافق" : "fit"}
                                </span>
                              </div>

                              <button
                                onClick={() => handleAccept(role, alt.material, alt.compatibilityScore)}
                                className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[9px] font-bold shrink-0 cursor-pointer"
                              >
                                {language === "ar" ? "قبول هذا البديل" : "Accept Alternative"}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      <FullMixRecommendationModal
        isOpen={isFullSuiteModalOpen}
        onClose={() => setIsFullSuiteModalOpen(false)}
        recommendationPlan={recommendationPlan}
        onApplySuite={onApplySuite}
        language={language}
      />

      <RecommendationHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        projectId={activeProjectId}
        decisions={decisions}
        onDecisionsChange={onDecisionsChange}
        language={language}
      />
    </div>
  );
};
