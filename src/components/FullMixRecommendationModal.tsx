/**
 * Full Mix Recommendation Suite Modal
 * 
 * Synthesizes the overall mix composition proposal (Binders, Aggregates, Water, Admixtures, SCMs, Fibers)
 * Allows reviewing the full engineering synergy and accepting all or selected suggestions.
 */

import React, { useState } from "react";
import { 
  X, 
  Check, 
  Sparkles, 
  Layers, 
  AlertTriangle,
  Info,
  ChevronRight,
  ShieldCheck,
  CheckCheck
} from "lucide-react";
import { 
  RecommendationPlanResult, 
  SupportedMaterialRole,
  RoleRecommendationGroup
} from "../services/materialRecommendationEngine";
import { EngineeringMaterial, MixDesignInput } from "../types";

interface FullMixRecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendationPlan: RecommendationPlanResult;
  onApplySuite: (selectedRoles: SupportedMaterialRole[]) => void;
  language: "ar" | "fr" | "en";
}

export const FullMixRecommendationModal: React.FC<FullMixRecommendationModalProps> = ({
  isOpen,
  onClose,
  recommendationPlan,
  onApplySuite,
  language
}) => {
  if (!isOpen) return null;

  const isRtl = language === "ar";
  const { roleGroups, overallCompatibilityScore, requirementPlan } = recommendationPlan;

  // Active roles that have candidates
  const availableRoles = (Object.keys(roleGroups) as SupportedMaterialRole[]).filter(
    r => roleGroups[r]?.topCandidate !== null && roleGroups[r]?.roleRequirement.requirementType !== "forbidden"
  );

  const [selectedRoles, setSelectedRoles] = useState<Record<SupportedMaterialRole, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    availableRoles.forEach(r => {
      initial[r] = true;
    });
    return initial as Record<SupportedMaterialRole, boolean>;
  });

  const toggleRole = (role: SupportedMaterialRole) => {
    setSelectedRoles(prev => ({
      ...prev,
      [role]: !prev[role]
    }));
  };

  const handleSelectAll = () => {
    const updated: Record<string, boolean> = {};
    availableRoles.forEach(r => {
      updated[r] = true;
    });
    setSelectedRoles(updated as Record<SupportedMaterialRole, boolean>);
  };

  const handleDeselectAll = () => {
    setSelectedRoles({} as Record<SupportedMaterialRole, boolean>);
  };

  const handleApply = () => {
    const activeSelectedRoles = availableRoles.filter(r => selectedRoles[r]);
    if (activeSelectedRoles.length === 0) {
      alert(language === "ar" ? "يرجى تحديد مادة واحدة على الأقل للتطبيق." : "Please select at least one material to apply.");
      return;
    }
    onApplySuite(activeSelectedRoles);
    onClose();
  };

  const selectedCount = availableRoles.filter(r => selectedRoles[r]).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
      <div 
        className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        dir={isRtl ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-900/50">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">
                  {language === "ar" ? "اقتراح باقة الخلطة المتكاملة" : "Complete Mix Engineering Proposal"}
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/30 border border-emerald-400/30 text-emerald-200 font-extrabold">
                  {overallCompatibilityScore}% {language === "ar" ? "توافق عام" : "Overall Fit"}
                </span>
              </div>
              <p className="text-xs text-indigo-200/70 mt-0.5">
                {language === "ar" 
                  ? `باقة مواد منسقة ومتكاملة هندسياً لتصميم خرسانة (${requirementPlan.concreteType}) بمقاومة (${requirementPlan.targetStrength} MPa)`
                  : `Synthesized constituent package for (${requirementPlan.concreteType}) concrete at ${requirementPlan.targetStrength} MPa`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
            <Layers className="w-4 h-4 text-indigo-500" />
            <span>
              {language === "ar" 
                ? `المواد المحددة للتطبيق: ${selectedCount} من إجمالي ${availableRoles.length}`
                : `Selected for application: ${selectedCount} of ${availableRoles.length}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
            >
              {language === "ar" ? "تحديد الكل" : "Select All"}
            </button>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <button
              onClick={handleDeselectAll}
              className="text-slate-500 dark:text-slate-400 hover:underline cursor-pointer"
            >
              {language === "ar" ? "إلغاء التحديد" : "Deselect All"}
            </button>
          </div>
        </div>

        {/* Roles List */}
        <div className="p-6 overflow-y-auto space-y-3.5 flex-1">
          {availableRoles.map(role => {
            const group = roleGroups[role];
            if (!group || !group.topCandidate) return null;

            const cand = group.topCandidate;
            const mat = cand.material;
            const isChecked = !!selectedRoles[role];
            const isMandatory = group.roleRequirement.requirementType === "mandatory";

            return (
              <div
                key={role}
                onClick={() => toggleRole(role)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                  isChecked
                    ? "bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-800/80 shadow-xs"
                    : "bg-slate-50/50 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100"
                }`}
              >
                <div className="mt-0.5">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleRole(role)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 dark:bg-slate-900 cursor-pointer"
                    onClick={e => e.stopPropagation()}
                  />
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        {group.roleRequirement.roleLabelAr}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">
                        ({group.roleRequirement.roleLabelEn})
                      </span>
                      {isMandatory ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                          {language === "ar" ? "إلزامي" : "Mandatory"}
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {language === "ar" ? "اختياري" : "Optional"}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-extrabold px-2 py-0.5 rounded-md ${
                        cand.compatibilityScore >= 80
                          ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                          : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                      }`}>
                        {cand.compatibilityScore}% {language === "ar" ? "توافق" : "Fit"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                    <span>{mat.name}</span>
                    {mat.englishName && (
                      <span className="text-[11px] text-slate-400 font-normal">
                        ({mat.englishName})
                      </span>
                    )}
                  </div>

                  {/* Highlights */}
                  {cand.keyHighlights.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      {cand.keyHighlights.slice(0, 2).map((hl, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-medium border border-emerald-500/20 flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span>{hl}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans leading-relaxed">
                    {cand.justificationAr}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
            {language === "ar" 
              ? "لن يتم تطبيق أي تعديل إلا بعد الضغط على زر التطبيق أدناه." 
              : "No changes are applied until you confirm below."}
          </div>

          <div className="flex items-center gap-2.5 ms-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {language === "ar" ? "إلغاء دون تعديل" : "Cancel"}
            </button>

            <button
              onClick={handleApply}
              disabled={selectedCount === 0}
              className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" />
              <span>
                {language === "ar" 
                  ? `قبول وتطبيق المواد المحددة (${selectedCount})` 
                  : `Accept & Apply Selected (${selectedCount})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
