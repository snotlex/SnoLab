import React, { useState } from "react";
import { ArrowLeft, ArrowRight, Beaker, FolderOpen, FolderPlus, Home, ShieldCheck } from "lucide-react";
import { ONBOARDING_PATHS, OnboardingRole } from "../services/workflow/onboarding";

type Language = "ar" | "fr" | "en";

const text = (value: { ar: string; fr: string; en: string }, language: Language) => value[language] || value.en;
const listTitle = (key: "minimumInputs" | "expectedOutputs" | "boundaries", language: Language) => ({
  minimumInputs: language === "ar" ? "أقل مدخلات مطلوبة" : language === "fr" ? "Entrées minimales" : "Minimum inputs",
  expectedOutputs: language === "ar" ? "المخرجات المتوقعة" : language === "fr" ? "Sorties attendues" : "Expected outputs",
  boundaries: language === "ar" ? "حدود الاستخدام" : language === "fr" ? "Limites d'utilisation" : "Usage boundaries"
}[key]);

export const WorkspaceEmptyState: React.FC<{
  language: Language;
  onStartNewProject: (role: OnboardingRole) => void | Promise<void>;
  onOpenExistingProject: () => void | Promise<void>;
  onOpenAdvanced: () => void;
  onHome: () => void;
}> = ({ language, onStartNewProject, onOpenExistingProject, onOpenAdvanced, onHome }) => {
  const [selectedRole, setSelectedRole] = useState<OnboardingRole>("design-engineer");
  const isRtl = language === "ar";
  const selectedPath = ONBOARDING_PATHS.find(path => path.role === selectedRole) || ONBOARDING_PATHS[0];

  return (
    <section className="sno-card mx-auto my-8 max-w-5xl animate-fade-in rounded-3xl p-5 text-start md:p-8" dir={isRtl ? "rtl" : "ltr"} aria-labelledby="workspace-onboarding-title">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"><FolderPlus size={28} /></div>
        <h2 id="workspace-onboarding-title" className="mt-4 text-xl font-black text-slate-800 dark:text-slate-100">
          {language === "ar" ? "اختر مسار العمل المناسب لك" : language === "fr" ? "Choisissez votre parcours" : "Choose your workspace path"}
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-xs leading-relaxed text-slate-500 dark:text-slate-400 md:text-sm">
          {language === "ar" ? "ابدأ بالمسار المبسط؛ يمكنك الانتقال إلى المسار المتقدم في أي وقت دون فقدان سياق المشروع." : language === "fr" ? "Commencez avec le parcours guidé et passez au mode avancé à tout moment sans perdre le contexte." : "Start with the guided path and move to advanced tools at any time without losing project context."}
        </p>
      </div>

      <div className="mt-7 grid gap-4 md:grid-cols-2" role="radiogroup" aria-label={language === "ar" ? "مسارات بدء المشروع" : "Project start paths"}>
        {ONBOARDING_PATHS.map(path => {
          const active = path.role === selectedRole;
          const Icon = path.role === "design-engineer" ? ShieldCheck : Beaker;
          return (
            <button key={path.role} type="button" role="radio" aria-checked={active} onClick={() => setSelectedRole(path.role)} className={`text-start rounded-2xl border p-5 transition focus:outline-none focus:ring-2 focus:ring-indigo-400 ${active ? "border-indigo-500 bg-indigo-50/70 shadow-md dark:border-indigo-400 dark:bg-indigo-950/30" : "border-slate-200 bg-white hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-950/40"}`}>
              <div className="flex items-start gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${active ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 dark:bg-slate-800"}`}><Icon size={20} /></div>
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">{text(path.title, language)}</h3>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{text(path.description, language)}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 text-[10px] sm:grid-cols-3">
                {(["minimumInputs", "expectedOutputs", "boundaries"] as const).map(key => <div key={key} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900/80"><strong className="block text-slate-700 dark:text-slate-200">{listTitle(key, language)}</strong><ul className="mt-1 list-disc space-y-1 ps-4 text-slate-500 dark:text-slate-400">{path[key][language].map(item => <li key={item}>{item}</li>)}</ul></div>)}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 border-t border-slate-200/70 pt-5 dark:border-slate-800">
        <button type="button" onClick={() => onStartNewProject(selectedPath.role)} className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#C7F43A] px-5 py-2.5 text-xs font-bold text-[#0A0F15] shadow transition hover:bg-[#d7ff63]"><FolderPlus size={16} />{language === "ar" ? `بدء مسار ${text(selectedPath.title, language)}` : language === "fr" ? `Démarrer ${text(selectedPath.title, language)}` : `Start ${text(selectedPath.title, language)}`}{isRtl ? <ArrowLeft size={15} /> : <ArrowRight size={15} />}</button>
        <button type="button" onClick={onOpenExistingProject} className="flex cursor-pointer items-center gap-2 rounded-xl bg-slate-800 px-5 py-2.5 text-xs font-bold text-white shadow transition hover:bg-slate-700"><FolderOpen size={16} />{language === "ar" ? "فتح مشروع قائم (.snlab)" : language === "fr" ? "Ouvrir un projet (.snlab)" : "Open Project (.snlab)"}</button>
        <button type="button" onClick={onOpenAdvanced} className="rounded-xl border border-indigo-200 px-4 py-2.5 text-xs font-bold text-indigo-700 transition hover:bg-indigo-50 dark:border-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-950/40">{language === "ar" ? "فتح المسار المتقدم" : language === "fr" ? "Mode avancé" : "Open advanced path"}</button>
        <button type="button" onClick={onHome} className="flex cursor-pointer items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"><Home size={16} />{language === "ar" ? "الرئيسية" : language === "fr" ? "Accueil" : "Home"}</button>
      </div>
    </section>
  );
};
