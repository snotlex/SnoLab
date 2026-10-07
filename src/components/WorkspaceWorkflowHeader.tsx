import React from "react";
import { ChevronLeft, ChevronRight, FolderX, LockKeyhole, CheckCircle2 } from "lucide-react";
import { WorkflowProgress } from "./WorkflowProgress";

type Language = "ar" | "fr" | "en";
type StepIcon = React.ComponentType<{ size?: number; className?: string }>;

export interface WorkspaceWorkflowStep {
  num: number;
  label: string;
  desc: string;
  icon: StepIcon;
  ready?: boolean;
  gateReason?: string;
}

export interface WorkspaceWorkflowHeaderProps {
  language: Language;
  isRtl: boolean;
  activeStep: number;
  projectName: string;
  projectCode: string;
  clientName?: string;
  projectIsOpen: boolean;
  workspaceRoleLabel?: string;
  stageName: string;
  stageDescription: string;
  steps: WorkspaceWorkflowStep[];
  onStepClick: (step: number) => void;
  onCloseProject: () => void;
  onPrevious: () => void;
  onNext: () => void;
  projectLabel: string;
  codeLabel: string;
  clientLabel: string;
  brandLabel: string;
  stageLabel: string;
  closeLabel: string;
  closeTitle: string;
  previousLabel: string;
  nextLabel: string;
}

export const WorkspaceWorkflowHeader: React.FC<WorkspaceWorkflowHeaderProps> = ({
  language, isRtl, activeStep, projectName, projectCode, clientName, projectIsOpen, workspaceRoleLabel,
  stageName, stageDescription, steps, onStepClick, onCloseProject, onPrevious, onNext,
  projectLabel, codeLabel, clientLabel, brandLabel, stageLabel, closeLabel, closeTitle,
  previousLabel, nextLabel,
}) => (
  <section className="sno-card flex flex-col gap-5 rounded-3xl p-5 text-right font-sans select-none" dir={isRtl ? "rtl" : "ltr"} aria-label={language === "ar" ? "رأس مسار العمل" : "Workspace workflow header"}>
    <div className="flex flex-col items-start justify-between gap-3 border-b border-indigo-50 pb-3 dark:border-indigo-950/40 sm:flex-row sm:items-center">
      <div className="flex flex-wrap items-center gap-2 md:gap-3">
        <span className="rounded-full bg-[#C7F43A]/15 px-2.5 py-1 font-mono text-[10px] font-extrabold uppercase tracking-wider text-[#5f7415] dark:bg-[#C7F43A]/10 dark:text-[#C7F43A]">{brandLabel}</span>
        <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 dark:text-slate-100"><span className="font-normal text-slate-400">{projectLabel}</span><span className="max-w-xs truncate">{projectName}</span></div>
        <div className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-500 dark:bg-slate-800"><span className="text-slate-400">{codeLabel}</span><span>{projectCode}</span></div>
        {clientName && <div className="hidden items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 md:flex"><span className="text-slate-400">{clientLabel}</span><span className="font-bold">{clientName}</span></div>}
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2"><span className="rounded-full border border-[#C7F43A]/30 bg-[#C7F43A]/10 px-3 py-1 font-mono text-[10px] font-bold text-[#5f7415] dark:text-[#C7F43A]">{stageLabel} {activeStep} / {steps.length} • {stageName}</span>{workspaceRoleLabel && <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-300">{workspaceRoleLabel}</span>}{projectIsOpen && <button type="button" onClick={onCloseProject} className="flex cursor-pointer items-center gap-1 rounded-lg border border-transparent px-2.5 py-1 text-[10px] font-bold text-rose-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:border-rose-900/40 dark:hover:bg-rose-950/30" title={closeTitle}><FolderX size={12} /><span className="hidden sm:inline">{closeLabel}</span></button>}</div>
    </div>

    <WorkflowProgress activeStep={activeStep} totalSteps={steps.length} language={language} />

    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
      {steps.map(step => {
        const Icon = step.icon;
        const isDone = step.num < activeStep;
        const isActive = step.num === activeStep;
        const isReady = step.ready !== false;
        return <button key={step.num} type="button" id={`workflow-step-btn-${step.num}`} onClick={() => onStepClick(step.num)} title={!isReady && step.gateReason ? step.gateReason : undefined} aria-current={isActive ? "step" : undefined} className={`group relative flex cursor-pointer flex-col gap-2 overflow-hidden rounded-2xl border p-3 text-right transition-all focus:outline-none ${isActive ? "scale-[1.02] border-[#C7F43A] bg-[#C7F43A] text-[#0A0F15] shadow-lg shadow-[#C7F43A]/20 ring-2 ring-[#C7F43A]/30" : isDone ? "border-emerald-500/25 bg-emerald-500/5 text-slate-700 hover:bg-slate-50 dark:bg-emerald-500/10 dark:text-slate-200 dark:hover:bg-slate-800" : !isReady ? "border-amber-300/60 bg-amber-50/60 text-amber-700 hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-300" : "border-slate-200/60 bg-slate-50 text-slate-400 hover:bg-slate-100 dark:border-slate-800/80 dark:bg-slate-900 dark:text-slate-500 dark:hover:bg-slate-850"}`}>
          <div className="flex w-full items-center justify-between"><span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ${isActive ? "bg-[#0A0F15] text-[#C7F43A]" : isDone ? "bg-emerald-500 text-white" : !isReady ? "bg-amber-400 text-white" : "bg-slate-200 text-slate-500 dark:bg-slate-800"}`}>{step.num}</span>{isDone ? <CheckCircle2 size={13} className="text-emerald-500" /> : !isReady ? <LockKeyhole size={13} className="text-amber-500" /> : <Icon size={13} className={isActive ? "animate-pulse text-[#0A0F15]" : "text-slate-400"} />}</div>
          <div className="mt-0.5"><span className={`mb-0.5 block text-[11.5px] font-black leading-none ${isActive ? "text-[#0A0F15]" : "text-slate-800 dark:text-slate-200"}`}>{step.label}</span><span className={`block truncate text-[9px] font-medium ${isActive ? "text-[#36430c]" : "text-slate-400 dark:text-slate-500"}`}>{step.desc}</span></div>
        </button>;
      })}
    </div>

    <div className="flex items-center justify-between border-t border-slate-100 pt-1 text-xs dark:border-slate-800/60"><button type="button" disabled={activeStep <= 1} onClick={onPrevious} className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${activeStep <= 1 ? "cursor-not-allowed text-slate-400 opacity-30" : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}>{isRtl ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}<span>{previousLabel}</span></button><div className="hidden font-mono text-[10px] text-slate-400 sm:block">{stageDescription}</div><button type="button" disabled={activeStep >= steps.length} onClick={onNext} className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${activeStep >= steps.length ? "cursor-not-allowed text-slate-400 opacity-30" : "bg-[#C7F43A]/10 text-[#5f7415] hover:bg-[#C7F43A]/20 dark:text-[#C7F43A]"}`}><span>{nextLabel}</span>{isRtl ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}</button></div>
  </section>
);
