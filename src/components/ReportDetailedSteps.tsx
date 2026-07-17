import React from "react";
import { MixDesignResult } from "../types";

interface ReportDetailedStepsProps {
  result: MixDesignResult;
}

export const ReportDetailedSteps: React.FC<ReportDetailedStepsProps> = ({ result }) => {
  if (!result.detailedSteps || result.detailedSteps.length === 0) return null;

  return (
    <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 text-right">
      <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mb-4 font-sans flex items-center gap-1.5 justify-end">
        <span>خطوات الحساب الرياضية الفنية للفرمان الموقعي (Step-by-Step Mechanics Journal)</span>
        <span className="text-amber-500 font-bold">📝</span>
      </h4>
      <div className="bg-slate-50 dark:bg-slate-950 p-5 border border-slate-200 dark:border-slate-850 text-xs leading-relaxed space-y-3 font-sans">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {result.detailedSteps.map((step, idx) => {
            const displayText = step.startsWith("•") || step.startsWith("-") ? step.substring(1).trim() : step;
            return (
              <div key={`step-log-${idx}`} className="flex items-start gap-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-none relative shadow-3xs hover:border-amber-500/20 dark:hover:border-amber-500/20 transition-all">
                <span className="w-5 h-5 shrink-0 bg-amber-500 text-slate-950 font-black rounded-none flex items-center justify-center text-[10px] font-mono leading-none">
                  {idx + 1}
                </span>
                <p className="text-right text-slate-700 dark:text-slate-300 font-medium leading-relaxed font-sans text-[11.5px] flex-1">
                  {displayText}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
