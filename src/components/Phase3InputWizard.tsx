import React, { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, Circle, ClipboardCheck, Layers3, ListChecks, ShieldAlert } from "lucide-react";
import { EngineeringMaterial, MixDesignInput } from "../types";
import { CONCRETE_TYPES_CATALOG, getConcreteTypeDetails } from "../concreteTypes";
import { getMixDesignContract } from "../mix-design/core/mixDesignContracts";
import { getSpecializedInputDefinition } from "../mix-design/core/specializedInputDefinitions";
import { getConcreteTypeFormConfig, Stage3SectionId } from "../mix-design/core/concreteTypeFormConfig";

interface Phase3InputWizardProps {
  inputs: MixDesignInput;
  results?: any;
  language: "ar" | "fr" | "en";
  validationGate?: { criticalErrors?: unknown[]; warnings?: unknown[]; isValidForReport?: boolean };
  specializedInputErrors?: Record<string, string>;
  materialsDatabase?: EngineeringMaterial[];
  children: React.ReactNode;
}

type Copy = { ar: string; fr: string; en: string };
const copy = (ar: string, fr: string, en: string): Copy => ({ ar, fr, en });

const steps: Array<{ id: string; number: number; label: Copy; anchor: string }> = [
  { id: "scope", number: 1, label: copy("نطاق التصميم", "Périmètre du design", "Design scope"), anchor: "step1-project-requirements" },
  { id: "type", number: 2, label: copy("نوع الخرسانة", "Type de béton", "Concrete type"), anchor: "step1-concrete-type" },
  { id: "materials", number: 3, label: copy("المواد والدفعات", "Matériaux et lots", "Materials & batches"), anchor: "step3-materials-selection" },
  { id: "engineering", number: 4, label: copy("المدخلات الهندسية", "Données d’ingénierie", "Engineering inputs"), anchor: "step4-material-properties" },
  { id: "review", number: 5, label: copy("المراجعة والحساب", "Revue et calcul", "Review & calculate"), anchor: "mix-materials-status-verification-panel" }
];

const internalSections: Array<{ id: Stage3SectionId; label: Copy; anchor: string }> = [
  { id: "requirements", label: copy("المتطلبات التصميمية", "Exigences de conception", "Design requirements"), anchor: "step1-project-requirements" },
  { id: "type", label: copy("نوع الخرسانة والخيارات", "Type et options", "Concrete type & options"), anchor: "step1-concrete-type" },
  { id: "materials", label: copy("المواد", "Matériaux", "Materials"), anchor: "step3-materials-selection" },
  { id: "properties", label: copy("خصائص المواد", "Propriétés des matériaux", "Material properties"), anchor: "step4-material-properties" },
  { id: "water-cement", label: copy("الماء والإسمنت", "Eau et ciment", "Water & cement"), anchor: "step5-field-conditions" },
  { id: "aggregates", label: copy("الركام والتدرج", "Granulats et courbe", "Aggregates & grading"), anchor: "step6-design-coefficients" },
  { id: "admixtures", label: copy("الإضافات والمعالجات", "Adjuvants et traitements", "Admixtures & treatment"), anchor: "step7-chemical-additions" },
  { id: "review", label: copy("المراجعة والحساب", "Revue et calcul", "Review & calculate"), anchor: "mix-materials-status-verification-panel" }
];

function text(value: Copy, language: "ar" | "fr" | "en") {
  return value[language] || value.en;
}

function scrollToSection(anchor: string) {
  document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function typeRange(code: string) {
  const ranges: Record<string, [number, number]> = {
    NSC: [10, 35], HSC: [40, 100], HPC: [40, 100], SCC: [25, 60], FRC: [20, 60],
    LWC: [15, 35], HWC: [25, 60], RCC: [20, 50], SHOTCRETE: [25, 50], GPC: [30, 90],
    SHC: [25, 60], RAC: [20, 50], PERVIOUS: [15, 35], UHPC: [100, 250], BFUP: [100, 250]
  };
  return ranges[code] || ranges.NSC;
}

function getSelectedCount(inputs: MixDesignInput) {
  return [inputs.selectedCementId, inputs.selectedSandId, inputs.selectedGravelId, inputs.selectedWaterId]
    .filter(Boolean).length;
}

export const Phase3InputWizard: React.FC<Phase3InputWizardProps> = ({
  inputs,
  results,
  language,
  validationGate,
  specializedInputErrors = {},
  materialsDatabase = [],
  children
}) => {
  const isRtl = language === "ar";
  const concreteCode = String(inputs.concreteType || "NSC").toUpperCase();
  const contract = getMixDesignContract(concreteCode);
  const metadata = CONCRETE_TYPES_CATALOG.find((item: any) => item.code === concreteCode) as any;
  const details = useMemo(() => {
    try { return getConcreteTypeDetails(concreteCode, language) as any; } catch { return undefined; }
  }, [concreteCode, language]);
  const [minStrength, maxStrength] = typeRange(concreteCode);
  const selectedMaterials = getSelectedCount(inputs);
  const [activeSection, setActiveSection] = useState<Stage3SectionId>("requirements");
  const formConfig = useMemo(() => getConcreteTypeFormConfig(concreteCode), [concreteCode]);
  const criticalCount = validationGate?.criticalErrors?.length || 0;
  const warningCount = validationGate?.warnings?.length || 0;
  const specializedErrorCount = Object.keys(specializedInputErrors).length;
  const fckValid = Number.isFinite(Number(inputs.fck28)) && Number(inputs.fck28) > 0 && Number(inputs.fck28) >= minStrength && Number(inputs.fck28) <= maxStrength;
  const materialsReady = selectedMaterials >= 4;
  const hasBlockingIssue = criticalCount > 0 || specializedErrorCount > 0;

  const status = (ok: boolean, warning = false) => {
    if (ok && !warning) return { icon: <CheckCircle2 size={14} />, className: "text-emerald-600 dark:text-emerald-400", label: copy("مكتمل", "Terminé", "Complete") };
    if (warning) return { icon: <AlertTriangle size={14} />, className: "text-amber-600 dark:text-amber-400", label: copy("يحتاج مراجعة", "À revoir", "Review needed") };
    return { icon: <ShieldAlert size={14} />, className: "text-rose-600 dark:text-rose-400", label: copy("ناقص أو محظور", "Incomplet ou bloqué", "Incomplete or blocked") };
  };

  const checks = [
    { label: copy("نطاق التصميم والمقاومة", "Périmètre et résistance", "Design scope & strength"), state: status(fckValid, Number(inputs.fck28) > 0 && !fckValid) },
    { label: copy("نوع الخرسانة", "Type de béton", "Concrete type"), state: status(Boolean(concreteCode)) },
    { label: copy("المواد الأساسية والدفعات", "Matériaux et lots", "Materials & batches"), state: status(materialsReady, selectedMaterials > 0 && !materialsReady) },
    { label: copy("المدخلات الخاصة", "Données spécialisées", "Specialized inputs"), state: status(specializedErrorCount === 0, specializedErrorCount > 0) },
    { label: copy("بوابة التحقق الهندسية", "Portail de validation", "Engineering validation gate"), state: status(!hasBlockingIssue && Boolean(validationGate?.isValidForReport), warningCount > 0 && !hasBlockingIssue) }
  ];

  const requiredKeys = (contract?.requiredInputs || []).filter((key: string) => ![
    "fck28", "dMax", "cementType", "cementClassStrength", "cementDensity", "moistureSand", "moistureGravel", "airContent", "slump"
  ].includes(String(key)));
  const requiredLabels = requiredKeys.slice(0, 8).map((key: string) => getSpecializedInputDefinition(key).label[language]);
  const selectedTypeName = metadata ? (language === "ar" ? metadata.nameAr : language === "fr" ? metadata.nameFr : metadata.nameEn) : concreteCode;
  const issueLinks = [
    ...(criticalCount ? [{ label: text(copy("أخطاء حرجة في المدخلات أو المواد", "Erreurs critiques des données ou matériaux", "Critical input or material errors"), language), anchor: "step1-project-requirements" }] : []),
    ...(specializedErrorCount ? [{ label: text(copy("مدخلات النوع الخاص", "Données spécialisées", "Specialized inputs"), language), anchor: "step4-material-properties" }] : []),
    ...(warningCount ? [{ label: text(copy("تحذيرات هندسية", "Avertissements d'ingénierie", "Engineering warnings"), language), anchor: "mix-materials-status-verification-panel" }] : [])
  ];

  return (
    <section className="space-y-5" dir={isRtl ? "rtl" : "ltr"} id="phase3-input-wizard">
      <header className="rounded-3xl border border-blue-200/70 dark:border-blue-900/50 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white p-5 md:p-6 shadow-xl shadow-blue-950/10 overflow-hidden relative">
        <div className="absolute -top-20 -left-16 w-48 h-48 rounded-full bg-cyan-400/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-cyan-300 text-[10px] font-black tracking-[0.18em] uppercase">
              <ClipboardCheck size={15} />
              <span>{text(copy("المرحلة 3 من 5", "Étape 3 sur 5", "Stage 3 of 5"), language)}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight">{text(copy("مساعد إدخال الخلطة الهندسي", "Assistant d’entrée de formulation", "Engineering mix input assistant"), language)}</h2>
            <p className="text-xs md:text-sm text-blue-100/80 leading-relaxed">{text(copy("إدخال متطلبات الخلطة والبيانات الهندسية بترتيب واضح قبل تشغيل الحساب.", "Saisie structurée des exigences et données d’ingénierie avant le calcul.", "Enter mix requirements and engineering data in a clear sequence before calculation."), language)}</p>
          </div>
          <div className="rounded-2xl bg-white/10 border border-white/15 p-3 min-w-[210px]">
            <div className="text-[10px] text-blue-100/70 mb-1">{text(copy("الحالة الحالية", "État actuel", "Current status"), language)}</div>
            <div className={`text-sm font-black flex items-center gap-2 ${hasBlockingIssue ? "text-rose-300" : warningCount > 0 ? "text-amber-300" : "text-emerald-300"}`}>
              {hasBlockingIssue ? <ShieldAlert size={16} /> : warningCount > 0 ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
              {text(hasBlockingIssue ? copy("محظور حتى التصحيح", "Bloqué jusqu’à correction", "Blocked until corrected") : warningCount > 0 ? copy("مراجعة مطلوبة", "Revue requise", "Review required") : copy("جاهز مبدئياً", "Prêt pour revue", "Preliminary ready"), language)}
            </div>
          </div>
        </div>
        <nav className="relative mt-6 grid grid-cols-2 sm:grid-cols-5 gap-2" aria-label="Phase 3 progress">
          {steps.map((step, index) => {
            const completed = index === 0 ? fckValid : index === 1 ? Boolean(concreteCode) : index === 2 ? materialsReady : index === 3 ? specializedErrorCount === 0 : !hasBlockingIssue;
            return (
              <button key={step.id} type="button" onClick={() => scrollToSection(step.anchor)} className="group text-right rounded-xl border border-white/10 bg-white/[0.07] hover:bg-white/[0.14] p-2.5 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${completed ? "bg-emerald-400 text-slate-950" : "bg-white/15 text-white"}`}>{completed ? "✓" : step.number}</span>
                  {index < steps.length - 1 && <span className="hidden sm:block h-px flex-1 bg-white/15" />}
                </div>
                <span className="block mt-2 text-[10px] font-bold text-blue-50 leading-snug">{text(step.label, language)}</span>
              </button>
            );
          })}
        </nav>
      </header>

      <nav className="sticky top-2 z-20 -mx-1 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur p-2 shadow-sm" aria-label="Stage 3 sections">
        <div className="flex min-w-max gap-1.5">
          {internalSections.map((section) => {
            const enabled = formConfig.sections.includes(section.id);
            return <button key={section.id} type="button" disabled={!enabled} aria-current={activeSection === section.id ? "step" : undefined} onClick={() => { setActiveSection(section.id); if (section.id === "review") { scrollToSection(section.anchor); } else { document.getElementById(section.anchor)?.scrollIntoView({ behavior: "smooth", block: "start" }); } }} className={`rounded-xl px-3 py-2 text-[10px] font-black whitespace-nowrap transition-colors ${activeSection === section.id ? "bg-blue-600 text-white" : enabled ? "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800" : "text-slate-300 dark:text-slate-700 cursor-not-allowed"}`}>{text(section.label, language)}</button>;
          })}
        </div>
      </nav>

      <div className="rounded-xl border border-blue-500/15 bg-blue-500/5 px-3 py-2 text-[10px] text-slate-600 dark:text-slate-300" role="status">
        {text(copy("القسم النشط", "Section active", "Active section"), language)}: <strong>{text(internalSections.find(section => section.id === activeSection)?.label || internalSections[0].label, language)}</strong>
        <span className="mx-2 text-slate-400">•</span>{formConfig.requiredFields.length} {text(copy("حقول مرتبطة بالنوع", "champs liés au type", "type-linked fields"), language)}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_290px] gap-5 items-start">
        <div className="space-y-5 min-w-0">
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-4 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-300"><Layers3 size={20} /></div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">{selectedTypeName} <span className="text-indigo-500 font-mono">({concreteCode})</span></h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{details?.description || text(copy("سيتم عرض المدخلات الخاصة بالنوع المختار فقط.", "Les données spécifiques du type sélectionné seront affichées.", "Only inputs relevant to the selected type are shown."), language)}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                <span className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-300">fck {inputs.fck28 || "—"} MPa</span>
                <span className="px-2 py-1 rounded-lg bg-slate-500/10 text-slate-600 dark:text-slate-300">{minStrength}–{maxStrength} MPa</span>
                <span className="px-2 py-1 rounded-lg bg-slate-500/10 text-slate-600 dark:text-slate-300">{selectedMaterials}/4 {text(copy("مواد أساسية", "matériaux de base", "base materials"), language)}</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3 text-[10px]">
              <div><span className="text-slate-400 block">{text(copy("الإطار الهندسي", "Cadre d’ingénierie", "Engineering framework"), language)}</span><strong className="text-slate-700 dark:text-slate-200">{contract?.engineeringFramework || "Dreux-Gorisse"}</strong></div>
              <div><span className="text-slate-400 block">{text(copy("المواد الخاصة المطلوبة", "Données spécifiques", "Required specialized inputs"), language)}</span><strong className="text-slate-700 dark:text-slate-200">{requiredLabels.length ? requiredLabels.join("، ") : text(copy("لا توجد", "Aucune", "None"), language)}</strong></div>
              <div><span className="text-slate-400 block">{text(copy("التجربة المخبرية", "Essai de convenance", "Trial mix"), language)}</span><strong className="text-amber-600 dark:text-amber-300">{text(copy("مطلوبة قبل التنفيذ", "Requise avant exécution", "Required before execution"), language)}</strong></div>
            </div>
          </section>
          <div data-stage3-focus={activeSection}>
            <style>{`[data-stage3-focus="requirements"] #step3-materials-selection,[data-stage3-focus="requirements"] #step4-material-properties,[data-stage3-focus="requirements"] #step5-field-conditions,[data-stage3-focus="requirements"] #step6-design-coefficients,[data-stage3-focus="requirements"] #step7-chemical-additions{display:none}[data-stage3-focus="type"] #step3-materials-selection,[data-stage3-focus="type"] #step4-material-properties,[data-stage3-focus="type"] #step5-field-conditions,[data-stage3-focus="type"] #step6-design-coefficients,[data-stage3-focus="type"] #step7-chemical-additions{display:none}[data-stage3-focus="materials"] #step1-project-requirements,[data-stage3-focus="materials"] #step4-material-properties,[data-stage3-focus="materials"] #step5-field-conditions,[data-stage3-focus="materials"] #step6-design-coefficients,[data-stage3-focus="materials"] #step7-chemical-additions{display:none}[data-stage3-focus="properties"] #step1-project-requirements,[data-stage3-focus="properties"] #step3-materials-selection,[data-stage3-focus="properties"] #step5-field-conditions,[data-stage3-focus="properties"] #step6-design-coefficients,[data-stage3-focus="properties"] #step7-chemical-additions{display:none}[data-stage3-focus="water-cement"] #step1-project-requirements,[data-stage3-focus="water-cement"] #step3-materials-selection,[data-stage3-focus="water-cement"] #step4-material-properties,[data-stage3-focus="water-cement"] #step6-design-coefficients,[data-stage3-focus="water-cement"] #step7-chemical-additions{display:none}[data-stage3-focus="aggregates"] #step1-project-requirements,[data-stage3-focus="aggregates"] #step3-materials-selection,[data-stage3-focus="aggregates"] #step4-material-properties,[data-stage3-focus="aggregates"] #step5-field-conditions,[data-stage3-focus="aggregates"] #step7-chemical-additions{display:none}[data-stage3-focus="admixtures"] #step1-project-requirements,[data-stage3-focus="admixtures"] #step3-materials-selection,[data-stage3-focus="admixtures"] #step4-material-properties,[data-stage3-focus="admixtures"] #step5-field-conditions,[data-stage3-focus="admixtures"] #step6-design-coefficients{display:none}`}</style>
            {activeSection === "review" ? <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5 text-sm font-bold text-slate-700 dark:text-slate-200">{text(copy("تم اختيار المراجعة. استخدم لوحة التحقق والحساب المرحلي أدناه لمراجعة المدخلات قبل التشغيل.", "La revue est sélectionnée. Utilisez les panneaux de validation ci-dessous avant le calcul.", "Review is selected. Use the validation and staged calculation panels below before running the engine."), language)}</div> : children}
          </div>
        </div>

        <aside className="xl:sticky xl:top-4 space-y-4">
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-4 shadow-lg shadow-slate-900/5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2"><ListChecks size={15} className="text-blue-500" />{text(copy("ملخص التحقق", "Résumé de validation", "Validation summary"), language)}</h3>
              <span className="text-[9px] font-mono text-slate-400">{checks.filter(item => item.state.label.ar === "مكتمل").length}/{checks.length}</span>
            </div>
                <div className="space-y-2.5">
                  {checks.map((item) => (
                <button key={item.label.en} type="button" onClick={() => scrollToSection(item.label.en.includes("scope") || item.label.en.includes("strength") ? "step1-project-requirements" : item.label.en.includes("Concrete") ? "step1-concrete-type" : item.label.en.includes("materials") ? "step3-materials-selection" : item.label.en.includes("Specialized") ? "step4-material-properties" : "mix-materials-status-verification-panel")} className="w-full flex items-start gap-2 text-[10px] text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-lg p-1 -m-1">
                  <span className={`mt-0.5 ${item.state.className}`}>{item.state.icon}</span>
                  <div className="min-w-0"><span className="text-slate-600 dark:text-slate-300 block leading-snug">{text(item.label, language)}</span><span className={`font-bold ${item.state.className}`}>{text(item.state.label, language)}</span></div>
                </button>
                  ))}
                  {issueLinks.length > 0 && <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5"><div className="text-[9px] font-black text-slate-400">{text(copy("الانتقال إلى سبب المشكلة", "Aller à la cause", "Jump to the cause"), language)}</div>{issueLinks.map(issue => <button key={issue.label} type="button" onClick={() => scrollToSection(issue.anchor)} className="w-full text-left text-[10px] text-blue-600 dark:text-blue-300 hover:underline">↳ {issue.label}</button>)}</div>}
                </div>
          </section>
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-white p-4 shadow-lg">
            <div className="text-[10px] text-slate-400 mb-2">{text(copy("معاينة حسابية مباشرة", "Aperçu du calcul", "Live calculation preview"), language)}</div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="rounded-lg bg-white/5 p-2"><span className="text-slate-400 block">{text(copy("الإسمنت", "Ciment", "Cement"), language)}</span><strong>{Math.round(Number(results?.cementWeight || 0))} kg</strong></div>
              <div className="rounded-lg bg-white/5 p-2"><span className="text-slate-400 block">{text(copy("الماء", "Eau", "Water"), language)}</span><strong>{Math.round(Number(results?.waterContentActual || results?.designWater || 0))} L</strong></div>
              <div className="rounded-lg bg-white/5 p-2"><span className="text-slate-400 block">{text(copy("الرمل الجاف", "Sable sec", "Dry sand"), language)}</span><strong>{Math.round(Number(results?.sandWeightDry || 0))} kg</strong></div>
              <div className="rounded-lg bg-white/5 p-2"><span className="text-slate-400 block">{text(copy("الحصى الجاف", "Gravier sec", "Dry gravel"), language)}</span><strong>{Math.round(Number(results?.gravelWeightDry || 0))} kg</strong></div>
              <div className="col-span-2 rounded-lg bg-emerald-400/10 border border-emerald-300/10 p-2"><span className="text-slate-400 block">{text(copy("الكثافة الطازجة", "Masse volumique fraîche", "Fresh density"), language)}</span><strong className="text-emerald-300">{Math.round(Number(results?.totalFreshDensity || 0))} kg/m³</strong></div>
            </div>
          </section>
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-300 font-black mb-1"><Circle size={8} fill="currentColor" />{text(copy("ترتيب مقترح", "Séquence recommandée", "Recommended sequence"), language)}</div>
            {text(copy("أكمل النطاق، ثم النوع، ثم المواد والدفعات، ثم المدخلات العامة والخاصة، وبعدها راجع بوابة التحقق قبل الحساب.", "Complétez le périmètre, le type, les matériaux et lots, puis les données générales et spécifiques avant la validation.", "Complete scope, type, materials and batches, then general and specialized inputs before validation."), language)}
          </div>
          <button type="button" onClick={() => scrollToSection("mix-materials-status-verification-panel")} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-[10px] font-black text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"><ChevronDown size={14} />{text(copy("الانتقال إلى المراجعة", "Aller à la revue", "Go to review"), language)}</button>
        </aside>
      </div>
    </section>
  );
};
