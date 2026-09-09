/**
 * Recommendation History & Decision Audit Modal
 * 
 * Displays the full engineering decision paper trail:
 * Accepted vs Rejected recommendations with timestamps, compatibility scores, and rationale.
 */

import React from "react";
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  RotateCcw, 
  Sparkles,
  Award
} from "lucide-react";
import { 
  RecommendationDecisionRecord,
  clearProjectRecommendationDecisions,
  recordProjectRecommendationDecision,
  saveProjectRecommendationDecisions,
  normalizeProjectId
} from "../services/materialRecommendationEngine";

interface RecommendationHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: any;
  decisions: RecommendationDecisionRecord[];
  onDecisionsChange: () => void;
  language: "ar" | "fr" | "en";
}

export const RecommendationHistoryModal: React.FC<RecommendationHistoryModalProps> = ({
  isOpen,
  onClose,
  projectId = "default",
  decisions,
  onDecisionsChange,
  language
}) => {
  if (!isOpen) return null;

  const isRtl = language === "ar";
  const pId = normalizeProjectId(projectId);

  const handleClearAll = () => {
    if (window.confirm(
      language === "ar" 
        ? "هل أنت متأكد من مسح جميع قرارات التوصيات السابقة لهذا المشروع؟" 
        : "Are you sure you want to clear all past recommendation decisions for this project?"
    )) {
      clearProjectRecommendationDecisions(pId);
      onDecisionsChange();
    }
  };

  const handleRevertDecision = (decision: RecommendationDecisionRecord) => {
    // Reverting means removing it from the active decisions log
    const all = decisions.filter(d => d.id !== decision.id);
    if (all.length === 0) {
      clearProjectRecommendationDecisions(pId);
    } else {
      saveProjectRecommendationDecisions(pId, all);
    }
    onDecisionsChange();
  };

  const acceptedCount = decisions.filter(d => d.action === "accept").length;
  const rejectedCount = decisions.filter(d => d.action === "reject").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]"
        dir={isRtl ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <span>{language === "ar" ? "سجل قرارات واعتمادات التوصيات" : "Recommendation Decisions Audit Log"}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/30 border border-indigo-400/30 text-indigo-200">
                  {decisions.length}
                </span>
              </h3>
              <p className="text-xs text-indigo-200/70">
                {language === "ar" 
                  ? "توثيق رسمي لخيارات المهندس بين قبول توصيات SnoLab أو رفضها" 
                  : "Engineering audit trail of accepted and declined SnoLab recommendations"}
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

        {/* Stats Strip */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>{language === "ar" ? `مقبولة: ${acceptedCount}` : `Accepted: ${acceptedCount}`}</span>
            </span>
            <span className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-semibold">
              <XCircle className="w-4 h-4" />
              <span>{language === "ar" ? `مرفوضة: ${rejectedCount}` : `Declined: ${rejectedCount}`}</span>
            </span>
          </div>

          {decisions.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 font-medium transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{language === "ar" ? "مسح السجل" : "Clear Log"}</span>
            </button>
          )}
        </div>

        {/* Body list */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {decisions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 space-y-2">
              <Sparkles className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 animate-pulse" />
              <p className="text-sm font-medium">
                {language === "ar" 
                  ? "لا توجد قرارات مسجلة بعد. عند قبولك أو رفضك لأي توصية ستظهر هنا تلقائياً." 
                  : "No decisions recorded yet. Any accepted or rejected recommendations will appear here."}
              </p>
            </div>
          ) : (
            decisions.map(decision => {
              const isAccepted = decision.action === "accept";
              const formattedDate = new Date(decision.timestamp).toLocaleString(
                language === "ar" ? "ar-EG" : language === "fr" ? "fr-FR" : "en-US",
                { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
              );

              return (
                <div
                  key={decision.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                    isAccepted
                      ? "bg-emerald-500/5 border-emerald-500/20 dark:bg-emerald-950/20"
                      : "bg-rose-500/5 border-rose-500/20 dark:bg-rose-950/20"
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`mt-0.5 p-1 rounded-full shrink-0 ${
                      isAccepted ? "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/50" : "text-rose-600 bg-rose-100 dark:bg-rose-900/50"
                    }`}>
                      {isAccepted ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-slate-800 dark:text-white truncate">
                          {decision.materialName}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-bold uppercase bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {decision.role}
                        </span>
                        {decision.isSystem && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold">
                            {language === "ar" ? "نظام" : "System"}
                          </span>
                        )}
                        <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                          decision.compatibilityScore >= 80 
                            ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                            : "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                        }`}>
                          {decision.compatibilityScore}%
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <span>
                          {isAccepted 
                            ? (language === "ar" ? "تم قبول الاقتراح وتطبيقه على الخلطة" : "Accepted & applied to mix inputs") 
                            : (language === "ar" ? "تم رفض الاقتراح وإبقاؤه كبديل اختياري" : "Declined suggestion")}
                        </span>
                        <span>•</span>
                        <span className="text-[10px] text-slate-400">{formattedDate}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRevertDecision(decision)}
                    title={language === "ar" ? "إلغاء هذا القرار" : "Revert this decision"}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-xl text-xs font-semibold hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors cursor-pointer"
          >
            {language === "ar" ? "إغلاق" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
};
