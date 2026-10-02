import React from "react";

type Language = "ar" | "fr" | "en";

export interface WorkflowProgressProps {
  activeStep: number;
  totalSteps?: number;
  language: Language;
}

export const WorkflowProgress: React.FC<WorkflowProgressProps> = ({ activeStep, totalSteps = 5, language }) => {
  const safeStep = Math.min(Math.max(activeStep, 0), totalSteps);
  const label = language === "ar" ? "مراحل" : language === "fr" ? "étapes" : "stages";
  return (
    <div className="flex items-center gap-3" aria-label={language === "ar" ? "تقدم مسار العمل" : "Workflow progress"}>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" role="progressbar" aria-valuemin={0} aria-valuemax={totalSteps} aria-valuenow={safeStep}>
        <div className="h-full rounded-full bg-[#C7F43A] transition-all duration-500" style={{ width: `${(safeStep / totalSteps) * 100}%` }} />
      </div>
      <span className="shrink-0 text-[10px] font-bold text-slate-500 dark:text-slate-400">
        {safeStep}/{totalSteps} {label}
      </span>
    </div>
  );
};
