import React from "react";
import { FolderOpen, FolderPlus, Home } from "lucide-react";

type Language = "ar" | "fr" | "en";

export const WorkspaceEmptyState: React.FC<{
  language: Language;
  onStartNewProject: () => void | Promise<void>;
  onOpenExistingProject: () => void | Promise<void>;
  onHome: () => void;
}> = ({ language, onStartNewProject, onOpenExistingProject, onHome }) => (
  <section className="sno-card mx-auto my-8 flex max-w-2xl animate-fade-in flex-col items-center justify-center gap-6 rounded-3xl p-10 text-center" dir="rtl" aria-labelledby="workspace-empty-title">
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"><FolderPlus size={32} /></div>
    <div className="space-y-2"><h2 id="workspace-empty-title" className="text-xl font-black text-slate-800 dark:text-slate-100">{language === "ar" ? "لا يوجد مشروع هندسي نشط حالياً" : language === "fr" ? "Aucun projet d'ingénierie actif" : "No Active Engineering Project"}</h2><p className="mx-auto max-w-md text-xs leading-relaxed text-slate-500 dark:text-slate-400 md:text-sm">{language === "ar" ? "للبدء في مراحل سير العمل الهندسي المكون من ست مراحل، يرجى إنشاء مشروع جديد أو فتح ملف مشروع محفوظ (.snlab)." : language === "fr" ? "Pour commencer le flux de travail d'ingénierie en 6 étapes, veuillez créer un nouveau projet ou ouvrir un fichier (.snlab)." : "To begin the 6-stage engineering workflow, please start a new project or open a saved project file (.snlab)."}</p></div>
    <div className="flex flex-wrap items-center justify-center gap-3 pt-2"><button type="button" onClick={onStartNewProject} className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#C7F43A] px-5 py-2.5 text-xs font-bold text-[#0A0F15] shadow transition hover:bg-[#d7ff63]"><FolderPlus size={16} /><span>{language === "ar" ? "بدء مشروع جديد" : language === "fr" ? "Nouveau projet" : "Start New Project"}</span></button><button type="button" onClick={onOpenExistingProject} className="flex cursor-pointer items-center gap-2 rounded-xl bg-slate-800 px-5 py-2.5 text-xs font-bold text-white shadow transition hover:bg-slate-700"><FolderOpen size={16} /><span>{language === "ar" ? "فتح مشروع قائم (.snlab)" : language === "fr" ? "Ouvrir un projet (.snlab)" : "Open Project (.snlab)"}</span></button><button type="button" onClick={onHome} className="flex cursor-pointer items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"><Home size={16} /><span>{language === "ar" ? "الرئيسية" : language === "fr" ? "Accueil" : "Home"}</span></button></div>
  </section>
);
