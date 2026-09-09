/**
 * Smart Engineering Material Recommendation & Approval System (SnoLab Materials Suggester)
 * 
 * Core Philosophy: "SnoLab suggests, does not impose" (SnoLab يقترح ولا يفرض).
 * Project Data -> Engineering Analysis -> Material Recommendations -> Explain Recommendation -> [قبول الاقتراح] / [رفض].
 * 
 * Embeds within Step 3 "تحضير الخلطة".
 */

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  Award, 
  Info, 
  Layers, 
  Check, 
  XCircle, 
  History,
  FileEdit,
  Wrench,
  CheckCheck,
  RotateCcw,
  Sparkle,
  Lock,
  X
} from "lucide-react";
import { EngineeringMaterial, MixDesignInput } from "../types";
import { 
  generateMaterialRecommendations, 
  RecommendationPlanResult,
  SupportedMaterialRole,
  MaterialCompatibilityResult,
  RoleRecommendationGroup,
  RecommendationDecisionRecord,
  recordProjectRecommendationDecision,
  getProjectRecommendationDecisions,
  getRoleUserDecisions,
  normalizeProjectId
} from "../services/materialRecommendationEngine";
import { recordEngineerApproval, getLatestApprovalForContext, EngineerSignOffRecord } from "../services/materialApprovalService";
import { FullMixRecommendationModal } from "./FullMixRecommendationModal";
import { RecommendationHistoryModal } from "./RecommendationHistoryModal";

export interface SelectedMaterialIds {
  selectedCementId?: string;
  selectedSandId?: string;
  selectedGravelId?: string;
  selectedWaterId?: string;
  selectedAdmixtureId?: string;
  selectedScmId?: string;
  selectedFiberId?: string;
  selectedSpecialBinderId?: string;
  selectedLightweightAggregateId?: string;
  selectedHeavyweightAggregateId?: string;
}

interface SmartMaterialsSuggesterProps {
  concreteType: string;
  mixDesignMethod?: string;
  activeProject?: any;
  fck28: number;
  dMax?: number;
  exposureClass?: string;
  hasPumping?: boolean;
  materialsDatabase: EngineeringMaterial[];
  onApplySuggestions: (selectedIds: SelectedMaterialIds) => void;
  language: string;
  inputs?: MixDesignInput;
  onApplySingleMaterial?: (role: SupportedMaterialRole, material: EngineeringMaterial) => void;
  onOpenBatchPropertiesModal?: () => void;
}

export const SmartMaterialsSuggester: React.FC<SmartMaterialsSuggesterProps> = ({
  concreteType,
  mixDesignMethod = "dreux",
  activeProject = "default",
  fck28,
  dMax = 20,
  exposureClass = "X0",
  hasPumping = false,
  materialsDatabase,
  onApplySuggestions,
  language,
  inputs,
  onApplySingleMaterial,
  onOpenBatchPropertiesModal
}) => {
  const isAr = language === "ar";
  const isFr = language === "fr";
  const isRtl = isAr;

  const resolvedProjectId = useMemo(() => normalizeProjectId(activeProject), [activeProject]);

  const [decisionVersion, setDecisionVersion] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isFullSuiteModalOpen, setIsFullSuiteModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  // Engineer Sign-off state
  const [engineerName, setEngineerName] = useState("");
  const [engineerTitle, setEngineerTitle] = useState("Chief Materials Engineer");
  const [approvalNotes, setApprovalNotes] = useState("");
  const [approvalFeedback, setApprovalFeedback] = useState<string | null>(null);

  // Accordion expansion states
  const [expandedJustifications, setExpandedJustifications] = useState<Record<string, boolean>>({});
  const [expandedAlternatives, setExpandedAlternatives] = useState<Record<string, boolean>>({});
  const [expandedNeedsData, setExpandedNeedsData] = useState<Record<string, boolean>>({});
  const [expandedIneligible, setExpandedIneligible] = useState<Record<string, boolean>>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Generate structured material recommendations via dedicated Engine
  const recommendationPlan: RecommendationPlanResult = useMemo(() => {
    return generateMaterialRecommendations(
      materialsDatabase || [],
      {
        concreteType,
        mixDesignMethod,
        targetStrength: fck28,
        maxAggregateSize: dMax,
        exposureClass,
        hasPumping,
        selectedCementId: inputs?.selectedCementId,
        selectedSandId: inputs?.selectedSandId,
        selectedGravelId: inputs?.selectedGravelId,
        selectedWaterId: inputs?.selectedWaterId,
        selectedAdmixtureId: inputs?.selectedAdmixtureId,
        selectedScmId: inputs?.selectedScmId,
        selectedFiberId: inputs?.selectedFiberId,
        selectedSpecialBinderId: inputs?.selectedSpecialBinderId,
        selectedLightweightAggregateId: inputs?.selectedLightweightAggregateId,
        selectedHeavyweightAggregateId: inputs?.selectedHeavyweightAggregateId
      },
      { id: resolvedProjectId }
    );
  }, [
    materialsDatabase, 
    concreteType, 
    mixDesignMethod, 
    fck28, 
    dMax, 
    exposureClass, 
    hasPumping, 
    resolvedProjectId, 
    inputs,
    decisionVersion
  ]);

  const decisions = useMemo(() => {
    return getProjectRecommendationDecisions(resolvedProjectId);
  }, [resolvedProjectId, decisionVersion]);

  // Check if there is an existing approval for this context
  const existingApproval: EngineerSignOffRecord | null = useMemo(() => {
    return getLatestApprovalForContext(concreteType, mixDesignMethod, resolvedProjectId);
  }, [concreteType, mixDesignMethod, resolvedProjectId, approvalFeedback]);

  // Toggle helpers
  const toggleJustification = (role: string) => {
    setExpandedJustifications(prev => ({ ...prev, [role]: !prev[role] }));
  };
  const toggleAlternatives = (role: string) => {
    setExpandedAlternatives(prev => ({ ...prev, [role]: !prev[role] }));
  };
  const toggleNeedsData = (role: string) => {
    setExpandedNeedsData(prev => ({ ...prev, [role]: !prev[role] }));
  };
  const toggleIneligible = (role: string) => {
    setExpandedIneligible(prev => ({ ...prev, [role]: !prev[role] }));
  };

  // 1. ACCEPT RECOMMENDATION FLOW
  const handleAcceptRecommendation = (role: SupportedMaterialRole, material: EngineeringMaterial, score: number) => {
    // Record acceptance
    const record: RecommendationDecisionRecord = {
      id: `${role}_${material.id}_${Date.now()}`,
      projectId: resolvedProjectId,
      role,
      materialId: material.id,
      materialName: material.name,
      materialCategory: material.category || role,
      isSystem: !!(material.isSystem || material.sourceType === "system_demo"),
      action: "accept",
      compatibilityScore: score,
      timestamp: new Date().toISOString(),
      context: {
        concreteType,
        mixDesignMethod,
        targetStrength: fck28
      }
    };
    recordProjectRecommendationDecision(record);
    setDecisionVersion(v => v + 1);

    // Apply to mix
    if (onApplySingleMaterial) {
      onApplySingleMaterial(role, material);
    } else {
      const fieldMap: Partial<Record<SupportedMaterialRole, keyof SelectedMaterialIds>> = {
        cement: "selectedCementId",
        sand: "selectedSandId",
        gravel: "selectedGravelId",
        water: "selectedWaterId",
        admixture: "selectedAdmixtureId",
        scm: "selectedScmId",
        fiber: "selectedFiberId",
        specialBinder: "selectedSpecialBinderId",
        lightweightAggregate: "selectedLightweightAggregateId",
        heavyweightAggregate: "selectedHeavyweightAggregateId"
      };
      const key = fieldMap[role];
      if (key) {
        onApplySuggestions({ [key]: material.id });
      }
    }

    showToast(
      isAr 
        ? `✓ تم قبول التوصية وتطبيق المادة (${material.name}) على الخلطة!` 
        : `✓ Recommendation accepted & (${material.name}) applied to mix!`
    );
  };

  // 2. REJECT RECOMMENDATION FLOW
  const handleRejectRecommendation = (role: SupportedMaterialRole, material: EngineeringMaterial, score: number) => {
    // Record rejection
    const record: RecommendationDecisionRecord = {
      id: `${role}_${material.id}_${Date.now()}`,
      projectId: resolvedProjectId,
      role,
      materialId: material.id,
      materialName: material.name,
      materialCategory: material.category || role,
      isSystem: !!(material.isSystem || material.sourceType === "system_demo"),
      action: "reject",
      compatibilityScore: score,
      timestamp: new Date().toISOString(),
      context: {
        concreteType,
        mixDesignMethod,
        targetStrength: fck28
      }
    };
    recordProjectRecommendationDecision(record);
    setDecisionVersion(v => v + 1);

    showToast(
      isAr 
        ? `تم رفض الاقتراح (${material.name}). المشروع لم يتغير ويتم الآن عرض البديل الأنسب التالي.` 
        : `Suggestion rejected (${material.name}). Project remains unchanged; showing next best alternative.`
    );
  };

  // 3. FULL MIX PROPOSAL BATCH APPLICATION
  const handleApplySuite = (selectedRoles: SupportedMaterialRole[]) => {
    const selectedIds: SelectedMaterialIds = {};

    for (const r of selectedRoles) {
      const topCand = recommendationPlan.roleGroups[r]?.topCandidate;
      if (topCand) {
        if (r === "cement") selectedIds.selectedCementId = topCand.material.id;
        if (r === "sand") selectedIds.selectedSandId = topCand.material.id;
        if (r === "gravel") selectedIds.selectedGravelId = topCand.material.id;
        if (r === "water") selectedIds.selectedWaterId = topCand.material.id;
        if (r === "admixture") selectedIds.selectedAdmixtureId = topCand.material.id;
        if (r === "scm") selectedIds.selectedScmId = topCand.material.id;
        if (r === "fiber") selectedIds.selectedFiberId = topCand.material.id;
        if (r === "specialBinder") selectedIds.selectedSpecialBinderId = topCand.material.id;
        if (r === "lightweightAggregate") selectedIds.selectedLightweightAggregateId = topCand.material.id;
        if (r === "heavyweightAggregate") selectedIds.selectedHeavyweightAggregateId = topCand.material.id;

        // Record accept for each
        recordProjectRecommendationDecision({
          id: `${r}_${topCand.material.id}_${Date.now()}`,
          projectId: resolvedProjectId,
          role: r,
          materialId: topCand.material.id,
          materialName: topCand.material.name,
          materialCategory: topCand.material.category || r,
          isSystem: !!(topCand.material.isSystem || topCand.material.sourceType === "system_demo"),
          action: "accept",
          compatibilityScore: topCand.compatibilityScore,
          timestamp: new Date().toISOString(),
          context: { concreteType, mixDesignMethod, targetStrength: fck28 }
        });
      }
    }

    setDecisionVersion(v => v + 1);
    onApplySuggestions(selectedIds);

    showToast(
      isAr 
        ? `✓ تم تطبيق باقة المواد المختارة (${selectedRoles.length} أصناف) بنجاح!` 
        : `✓ Selected material suite (${selectedRoles.length} roles) applied successfully!`
    );
  };

  // 4. ENGINEER SIGN-OFF
  const handleConfirmApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!engineerName.trim()) return;

    const approvedMaterialsList = Object.entries(recommendationPlan.roleGroups).map(([role, group]) => {
      const topMat = group.topCandidate?.material;
      return {
        role,
        materialId: topMat?.id || "",
        materialName: topMat?.name || "Unassigned",
        compatibilityScore: group.topCandidate?.compatibilityScore || 0,
        density: topMat?.density
      };
    }).filter(item => item.materialId !== "");

    const record = recordEngineerApproval({
      projectId: resolvedProjectId,
      concreteType,
      mixDesignMethod,
      targetStrength: fck28,
      engineerName: engineerName.trim(),
      engineerTitle: engineerTitle.trim(),
      notes: approvalNotes.trim(),
      status: "approved",
      approvedMaterials: approvedMaterialsList
    });

    setShowApprovalModal(false);
    setApprovalFeedback(isAr ? `تم توثيق اعتماد المهندس بنجاح (#${record.approvalId})` : `Approval signed by ${record.engineerName}`);
    setTimeout(() => setApprovalFeedback(null), 5000);
  };

  const activeRoles = Object.values(recommendationPlan.roleGroups).filter(
    g => g.roleRequirement.requirementType !== "forbidden"
  );

  return (
    <div 
      className={`bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border-2 border-indigo-500/30 rounded-2xl p-5 shadow-xl space-y-5 text-slate-100 font-sans ${isRtl ? "text-right" : "text-left"}`} 
      id="smart-material-recommendation-center"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-bold border border-emerald-400/40 animate-bounce">
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

      {/* HEADER BAR */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center border-b border-indigo-500/20 pb-4 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-gradient-to-br from-indigo-500/30 to-indigo-700/30 text-indigo-400 rounded-xl border border-indigo-500/40 shadow-inner">
              <Sparkles size={20} className="animate-pulse" />
            </span>
            <div>
              <h3 className="text-sm font-black text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                <span>{isAr ? "المساعد الهندسي الذكي لاقتراح المواد" : "Smart Engineering Material Recommendation System"}</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-400/30 font-mono">
                  SnoLab Pro
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                <span>
                  {isAr 
                    ? "SnoLab يقترح ولا يفرض: تحليل المعطيات ← اقتراحات هندسية مفسرة ← قبول أو رفض"
                    : "SnoLab suggests, does not impose: Project Data → Analysis → Recommendations → Accept / Reject"}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Strip */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start lg:justify-end">
          {/* Compatibility Score */}
          <div className="flex items-center gap-2 bg-slate-800/90 px-3.5 py-2 rounded-xl border border-slate-700 shadow-inner">
            <div className="text-center">
              <span className="text-[10px] text-slate-400 block font-medium">{isAr ? "توافق الباقة" : "Mix Fit"}</span>
              <span className={`text-base font-black font-mono ${recommendationPlan.overallCompatibilityScore >= 80 ? "text-emerald-400" : "text-amber-400"}`}>
                {recommendationPlan.overallCompatibilityScore}%
              </span>
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-900 border border-slate-700">
              <Award size={16} className={recommendationPlan.overallCompatibilityScore >= 80 ? "text-emerald-400" : "text-amber-400"} />
            </div>
          </div>

          {/* Full Mix Proposal Button */}
          <button
            type="button"
            onClick={() => setIsFullSuiteModalOpen(true)}
            className="text-xs flex items-center gap-1.5 font-bold px-3.5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Layers size={15} />
            <span>{isAr ? "اقتراح الخلطة الكاملة" : "Full Mix Proposal"}</span>
          </button>

          {/* Decision Audit Log Button */}
          <button
            type="button"
            onClick={() => setIsHistoryModalOpen(true)}
            className="text-xs flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3 py-2.5 rounded-xl border border-slate-700 transition-colors cursor-pointer"
            title={isAr ? "سجل قرارات القبول والرفض" : "Decisions History"}
          >
            <History size={15} className="text-indigo-400" />
            <span>{isAr ? "سجل القرارات" : "History"}</span>
            {decisions.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-500/30 text-indigo-300 font-mono font-bold">
                {decisions.length}
              </span>
            )}
          </button>

          {/* Engineer Sign-off Button */}
          <button
            type="button"
            onClick={() => setShowApprovalModal(true)}
            className="text-xs flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold px-3 py-2.5 rounded-xl border border-sky-500/30 hover:border-sky-500/60 transition-all cursor-pointer"
            title={isAr ? "ختم وتوثيق اعتماد المهندس المشرف" : "Engineer Sign-Off"}
          >
            <ShieldCheck size={15} className="text-sky-400" />
            <span>{isAr ? "اعتماد المهندس" : "Sign-off"}</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK BANNER */}
      {approvalFeedback && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-300 font-semibold flex items-center gap-2"
        >
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{approvalFeedback}</span>
        </motion.div>
      )}

      {/* CONTEXT SUMMARY STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs">
        <div>
          <span className="text-[10px] text-slate-500 block">{isAr ? "نوع الخرسانة:" : "Concrete Type:"}</span>
          <span className="font-black text-indigo-400">{concreteType}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 block">{isAr ? "طريقة التصميم:" : "Mix Method:"}</span>
          <span className="font-bold text-sky-400 uppercase">{mixDesignMethod}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 block">{isAr ? "المقاومة المميزة fck28:" : "Target Strength:"}</span>
          <span className="font-bold text-emerald-400">{fck28} MPa</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 block">{isAr ? "فئة التعرض / Dmax:" : "Exposure / Dmax:"}</span>
          <span className="font-bold text-slate-300">{exposureClass} / {dMax} mm</span>
        </div>
      </div>

      {/* DATA SUFFICIENCY NOTICE (IF ANY) */}
      {!recommendationPlan.dataSufficiency.isSufficient && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <strong className="text-amber-300 font-bold block">
              {isAr ? "تنبيه هندسي: بيانات المشروع تحتاج استكمال لتقديم ترشيحات دقيقة" : "Engineering Warning: Incomplete project inputs"}
            </strong>
            <ul className="list-disc list-inside text-[11px] text-amber-200/90 space-y-0.5">
              {recommendationPlan.dataSufficiency.missingParameters.map((p, i) => (
                <li key={i}>{p.recommendationAr}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* WARNING IF MISSING MANDATORY ROLES */}
      {!recommendationPlan.isReadyForMix && recommendationPlan.missingMandatoryRoles.length > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3.5 flex items-start gap-3">
          <AlertTriangle size={18} className="text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <strong className="text-rose-300 font-bold block">
              {isAr ? "تنبيه هندسي: يوجد نقص في مواد أساسية إلزامية!" : "Engineering Notice: Missing Mandatory Material Constituents!"}
            </strong>
            <p className="text-rose-200/80">
              {isAr 
                ? `الخرسانة من نوع (${concreteType}) تتطلب توفير مواد مكتملة الخصائص ومعتمدة للأصناف التالية: ${recommendationPlan.missingMandatoryRoles.join("، ")}.`
                : `The selected concrete type (${concreteType}) requires complete, validated materials for: ${recommendationPlan.missingMandatoryRoles.join(", ")}.`}
            </p>
          </div>
        </div>
      )}

      {/* ROLES RECOMMENDATIONS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeRoles.map(group => {
          const role = group.role;
          const req = group.roleRequirement;
          const topCandidate = group.topCandidate;
          const currentSelection = group.currentSelectionAssessment;
          const isJustificationOpen = !!expandedJustifications[role];
          const isAlternativesOpen = !!expandedAlternatives[role];
          const isNeedsDataOpen = !!expandedNeedsData[role];
          const isIneligibleOpen = !!expandedIneligible[role];

          return (
            <div 
              key={role} 
              className={`bg-slate-900/85 border rounded-xl p-4 flex flex-col justify-between space-y-3.5 transition-all ${
                group.roleStatus === "warning_missing_mandatory"
                  ? "border-rose-500/40 bg-rose-950/10"
                  : topCandidate && topCandidate.compatibilityScore >= 80
                  ? "border-indigo-500/30 hover:border-indigo-500/60 shadow-xs"
                  : "border-slate-800"
              }`}
            >
              {/* Role Header */}
              <div className="space-y-1">
                <div className="flex justify-between items-start pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{req.icon}</span>
                    <span className="text-xs font-black text-slate-100">{isAr ? req.roleLabelAr : req.roleLabelEn}</span>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    req.requirementType === "mandatory"
                      ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                      : req.requirementType === "conditional"
                      ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                      : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                  }`}>
                    {req.requirementType === "mandatory" ? (isAr ? "إلزامي" : "Mandatory") : req.requirementType === "conditional" ? (isAr ? "مشروط" : "Conditional") : (isAr ? "اختياري" : "Optional")}
                  </span>
                </div>

                <p className="text-[10px] text-slate-400 line-clamp-2">
                  {isAr ? req.reasonAr : isFr ? req.reasonFr : req.reasonEn}
                </p>
              </div>

              {/* CURRENT SELECTION STATUS IN PROJECT */}
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>{isAr ? "المادة المختارة حالياً بالخلطة:" : "Current Mix Material:"}</span>
                  {currentSelection && (
                    <span className={`px-1.5 py-0.2 rounded font-semibold text-[9px] ${
                      currentSelection.isCompliant ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                    }`}>
                      {currentSelection.isCompliant ? (isAr ? "مطابق" : "Compliant") : (isAr ? "غير معتمد" : "Incompliant")}
                    </span>
                  )}
                </div>

                {currentSelection && currentSelection.material ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-slate-200 truncate">
                        {currentSelection.material.name}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        {currentSelection.compatibilityScore}%
                      </span>
                    </div>

                    {/* Superior alternative notice */}
                    {currentSelection.isSuperiorAlternativeAvailable && (
                      <div className="text-[10px] text-indigo-300 bg-indigo-950/50 p-1.5 rounded border border-indigo-800/60 flex items-center gap-1.5">
                        <Sparkle size={12} className="text-indigo-400 shrink-0" />
                        <span>
                          {isAr 
                            ? `توصية SnoLab أعلى توافقاً بنسبة (+${currentSelection.superiorScoreDifference}%)` 
                            : `SnoLab proposal has higher fit (+${currentSelection.superiorScoreDifference}%)`}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-slate-500 italic text-[10px]">
                    {isAr ? "لم يتم تحديد مادة لهذا الصنف بعد." : "No material chosen yet."}
                  </div>
                )}
              </div>

              {/* TOP RECOMMENDATION CARD */}
              {topCandidate ? (
                <div className="bg-gradient-to-br from-indigo-950/40 via-slate-950 to-slate-950 border border-indigo-500/30 rounded-xl p-3 space-y-2.5 shadow-inner">
                  <div className="flex justify-between items-start gap-1">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-indigo-300">
                        <Award size={12} className="text-indigo-400" />
                        <span>{isAr ? "اقتراح SnoLab الهندسي" : "SnoLab Recommendation"}</span>
                      </div>
                      <h4 className="text-xs font-black text-amber-300 leading-snug mt-0.5 truncate">
                        {topCandidate.material.name}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        {topCandidate.material.englishName && (
                          <span className="text-[9px] text-slate-400 font-mono">
                            {topCandidate.material.englishName}
                          </span>
                        )}
                        {topCandidate.material.isSystem || topCandidate.material.sourceType === "system_demo" ? (
                          <span className="text-[8px] bg-sky-500/15 text-sky-300 px-1.5 py-0.2 rounded font-semibold border border-sky-500/20">
                            {isAr ? "نظام" : "System"}
                          </span>
                        ) : (
                          <span className="text-[8px] bg-emerald-500/15 text-emerald-300 px-1.5 py-0.2 rounded font-semibold border border-emerald-500/20">
                            {isAr ? "مادتي" : "My Material"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Score Badge */}
                    <div className="text-center shrink-0">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded font-mono border ${
                        topCandidate.compatibilityScore >= 85
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : topCandidate.compatibilityScore >= 70
                          ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                          : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      }`}>
                        {topCandidate.compatibilityScore}%
                      </span>
                    </div>
                  </div>

                  {/* Highlights Chips */}
                  {topCandidate.keyHighlights.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {topCandidate.keyHighlights.slice(0, 2).map((hl, idx) => (
                        <span key={idx} className="text-[9px] bg-slate-800/80 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700/80 flex items-center gap-1">
                          <Check size={10} className="text-emerald-400" />
                          <span>{hl}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Explanatory Dropdown ("لماذا هذه المادة؟") */}
                  <div className="pt-1 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => toggleJustification(role)}
                      className="text-[10px] text-indigo-300 hover:text-indigo-200 flex items-center justify-between w-full font-bold cursor-pointer"
                    >
                      <span className="flex items-center gap-1">
                        <Info size={12} className="text-indigo-400" />
                        <span>{isAr ? "لماذا تم اقتراح هذه المادة؟" : "Why this recommendation?"}</span>
                      </span>
                      {isJustificationOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>

                    <AnimatePresence>
                      {isJustificationOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 space-y-2 text-[10px] bg-slate-900/95 p-2.5 rounded-lg border border-indigo-500/20 text-slate-300 overflow-hidden"
                        >
                          <p className="font-medium text-slate-200 leading-relaxed">
                            💡 {isAr ? topCandidate.justificationAr : topCandidate.justificationEn}
                          </p>

                          <div className="space-y-1 pt-1.5 border-t border-slate-800">
                            {topCandidate.factors.map((f, fIdx) => (
                              <div key={fIdx} className="flex justify-between items-center text-[9px] text-slate-400">
                                <span>{isAr ? f.labelAr : f.labelEn}:</span>
                                <span className="font-mono text-slate-200 font-bold">{f.scoreEarned}/{f.maxScore}</span>
                              </div>
                            ))}
                          </div>

                          {topCandidate.warnings.length > 0 && (
                            <div className="p-1.5 bg-amber-500/10 rounded text-[9px] text-amber-300 space-y-0.5 border border-amber-500/20">
                              {topCandidate.warnings.map((w, wi) => (
                                <div key={wi} className="flex items-start gap-1">
                                  <span>⚠️</span>
                                  <span>{w}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* ACTION BUTTONS: ACCEPT OR REJECT */}
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAcceptRecommendation(role, topCandidate.material, topCandidate.compatibilityScore)}
                      className="flex-1 py-1.5 px-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-900/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <CheckCircle2 size={14} />
                      <span>{isAr ? "قبول الاقتراح" : "Accept"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRejectRecommendation(role, topCandidate.material, topCandidate.compatibilityScore)}
                      className="py-1.5 px-3 bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                      title={isAr ? "رفض الاقتراح وعرض البديل الأنسب التالي" : "Decline and show next best alternative"}
                    >
                      <XCircle size={14} />
                      <span>{isAr ? "رفض" : "Reject"}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-rose-950/30 border border-rose-800/50 rounded-lg p-3 text-center space-y-1.5">
                  <XCircle size={18} className="text-rose-400 mx-auto" />
                  <p className="text-[10px] font-bold text-rose-300">
                    {isAr ? "لا توجد مادة معتمدة ومكتملة الخصائص لهذا الصنف!" : "No eligible material found in repository!"}
                  </p>
                  <p className="text-[9px] text-rose-400/80">
                    {isAr ? "يرجى الانتقال لمستودع المواد لإدخال الخواص الفيزيائية والاعتماد." : "Please complete required properties in Material Library."}
                  </p>
                </div>
              )}

              {/* ACCORDION SECTIONS: ALTERNATIVES & NEEDS DATA */}
              <div className="space-y-1.5 pt-1 border-t border-slate-800">
                {/* 1. CANDIDATES NEEDING DATA */}
                {group.needsData.length > 0 && (
                  <div>
                    <button
                      type="button"
                      onClick={() => toggleNeedsData(role)}
                      className="w-full text-[10px] font-semibold text-amber-400 hover:text-amber-300 flex items-center justify-between py-1 cursor-pointer"
                    >
                      <span className="flex items-center gap-1">
                        <Wrench size={12} className="text-amber-400" />
                        <span>{isAr ? `مواد تحتاج استكمال بيانات (${group.needsData.length})` : `Needs data (${group.needsData.length})`}</span>
                      </span>
                      {isNeedsDataOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>

                    {isNeedsDataOpen && (
                      <div className="mt-1 space-y-1.5 bg-amber-950/20 p-2 rounded-lg border border-amber-500/20 text-[10px]">
                        {group.needsData.map((nd, ndi) => (
                          <div key={ndi} className="flex items-center justify-between gap-1 pb-1.5 border-b border-amber-500/20 last:border-0 last:pb-0">
                            <div className="min-w-0">
                              <div className="font-bold text-slate-200 truncate">
                                {nd.material.name}
                              </div>
                              <div className="text-[9px] text-amber-300/80">
                                {isAr ? `تنقص: ${nd.missingProperties.join("، ")}` : `Missing: ${nd.missingProperties.join(", ")}`}
                              </div>
                            </div>

                            {onOpenBatchPropertiesModal && (
                              <button
                                type="button"
                                onClick={onOpenBatchPropertiesModal}
                                className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded text-[10px] font-bold shrink-0 flex items-center gap-1 cursor-pointer"
                              >
                                <FileEdit size={11} />
                                <span>{isAr ? "إكمال الخاصية" : "Complete"}</span>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. ALTERNATIVES LIST */}
                {group.alternatives.length > 0 && (
                  <div>
                    <button
                      type="button"
                      onClick={() => toggleAlternatives(role)}
                      className="w-full text-[10px] font-semibold text-slate-400 hover:text-slate-300 flex items-center justify-between py-1 cursor-pointer"
                    >
                      <span className="flex items-center gap-1">
                        <Layers size={12} className="text-slate-400" />
                        <span>{isAr ? `البدائل المتاحة (${group.alternatives.length})` : `Alternatives (${group.alternatives.length})`}</span>
                      </span>
                      {isAlternativesOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>

                    {isAlternativesOpen && (
                      <div className="mt-1 space-y-1.5 bg-slate-950/80 p-2 rounded-lg border border-slate-800 text-[10px]">
                        {group.alternatives.map((alt, ai) => (
                          <div key={ai} className="flex items-center justify-between gap-1 py-1 border-b border-slate-800 last:border-0">
                            <div className="min-w-0">
                              <span className="font-bold text-slate-200 truncate block">
                                {alt.material.name}
                              </span>
                              <span className="text-[9px] text-slate-400">
                                {alt.compatibilityScore}% {isAr ? "توافق" : "fit"}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAcceptRecommendation(role, alt.material, alt.compatibilityScore)}
                              className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[9px] font-bold shrink-0 transition-colors cursor-pointer"
                            >
                              {isAr ? "قبول هذا البديل" : "Accept"}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. INELIGIBLE LIST */}
                {group.ineligible.length > 0 && (
                  <div>
                    <button
                      type="button"
                      onClick={() => toggleIneligible(role)}
                      className="w-full text-[10px] font-semibold text-slate-500 hover:text-slate-400 flex items-center justify-between py-1 cursor-pointer"
                    >
                      <span className="flex items-center gap-1">
                        <XCircle size={12} className="text-slate-500" />
                        <span>{isAr ? `المواد غير المؤهلة (${group.ineligible.length})` : `Ineligible (${group.ineligible.length})`}</span>
                      </span>
                      {isIneligibleOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>

                    {isIneligibleOpen && (
                      <div className="mt-1 space-y-1 bg-rose-950/20 p-2 rounded-lg border border-rose-900/30 text-[10px]">
                        {group.ineligible.map((inelig, ii) => (
                          <div key={ii} className="py-1 border-b border-rose-900/20 last:border-0">
                            <div className="font-bold text-rose-300 truncate">
                              {inelig.material.name}
                            </div>
                            <div className="text-[9px] text-slate-400">
                              {inelig.warnings.join(" | ") || (isAr ? "خصائص غير متطابقة" : "Incompatible properties")}
                            </div>
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

      {/* FULL MIX PROPOSAL MODAL */}
      <FullMixRecommendationModal
        isOpen={isFullSuiteModalOpen}
        onClose={() => setIsFullSuiteModalOpen(false)}
        recommendationPlan={recommendationPlan}
        onApplySuite={handleApplySuite}
        language={language as "ar" | "fr" | "en"}
      />

      {/* DECISION AUDIT HISTORY MODAL */}
      <RecommendationHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        projectId={resolvedProjectId}
        decisions={decisions}
        onDecisionsChange={() => setDecisionVersion(v => v + 1)}
        language={language as "ar" | "fr" | "en"}
      />

      {/* ENGINEER SIGN-OFF MODAL */}
      <AnimatePresence>
        {showApprovalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4"
              dir={isRtl ? "rtl" : "ltr"}
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={20} className="text-sky-400" />
                  <h3 className="text-sm font-black text-slate-100">
                    {isAr ? "اعتماد المهندس المشرف للمواد" : "Chief Engineer Material Sign-Off"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowApprovalModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleConfirmApproval} className="space-y-4 text-xs">
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1 font-bold">
                    {isAr ? "اسم المهندس المشرف:" : "Engineer Full Name:"}
                  </label>
                  <input
                    type="text"
                    required
                    value={engineerName}
                    onChange={(e) => setEngineerName(e.target.value)}
                    placeholder={isAr ? "د. م. أحمد محمد" : "Eng. John Doe, PE"}
                    className="w-full p-2 rounded bg-slate-950 border border-slate-700 text-slate-100 focus:border-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 block mb-1 font-bold">
                    {isAr ? "المسمى الوظيفي / الصلاحية:" : "Title / Credentials:"}
                  </label>
                  <input
                    type="text"
                    value={engineerTitle}
                    onChange={(e) => setEngineerTitle(e.target.value)}
                    className="w-full p-2 rounded bg-slate-950 border border-slate-700 text-slate-100 focus:border-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 block mb-1 font-bold">
                    {isAr ? "ملاحظات الاعتماد المخبري أو الفني:" : "Engineering Notes / Lab Sign-Off:"}
                  </label>
                  <textarea
                    rows={3}
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    placeholder={isAr ? "تم التحقق من نتائج كسر العينات وتوافق التدرج الحبيبي..." : "Verified sieve analysis and compressive strength records..."}
                    className="w-full p-2 rounded bg-slate-950 border border-slate-700 text-slate-100 focus:border-sky-500 outline-none resize-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowApprovalModal(false)}
                    className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                  >
                    {isAr ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-sky-900/50 cursor-pointer"
                  >
                    <ShieldCheck size={14} />
                    <span>{isAr ? "توقيع وختم الاعتماد" : "Sign & Seal Approval"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
