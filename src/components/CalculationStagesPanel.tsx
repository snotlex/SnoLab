import React, { useMemo } from "react";
import { AlertTriangle, CheckCircle2, CircleDot, Droplets, Layers3, Scale, ShieldAlert, Sparkles } from "lucide-react";
import { buildCalculationStageStatuses, CalculationStageState } from "../services/calculationStageStatus";

interface CalculationStagesPanelProps {
  language: "ar" | "fr" | "en";
  results: any;
  criticalErrors: number;
  warnings: number;
  selectedMaterialCount: number;
}

const copy = {
  ar: {
    title: "الحساب المرحلي والقيم القابلة للتدقيق",
    description: "يتم عرض كل بوابة من المدخلات إلى الاتزان الحجمي دون إخفاء القيم الوسيطة أو استبدالها بقيم افتراضية.",
    inputs: "صلاحية المدخلات",
    materials: "توافق المواد",
    "water-binder": "الماء والإسمنت",
    aggregates: "الركام والتدرج",
    admixtures: "الإضافات",
    volume: "الاتزان الحجمي",
    compliance: "المتانة والمطابقة",
    complete: "مكتمل",
    warning: "تحذير هندسي",
    blocked: "محظور",
    pending: "بانتظار البيانات"
  },
  fr: {
    title: "Calcul par étapes et valeurs auditables",
    description: "Chaque porte est visible des entrées à la fermeture volumétrique, sans valeur par défaut cachée.",
    inputs: "Validité des entrées",
    materials: "Compatibilité des matériaux",
    "water-binder": "Eau et ciment",
    aggregates: "Granulats et granulométrie",
    admixtures: "Adjuvants",
    volume: "Fermeture volumétrique",
    compliance: "Durabilité et conformité",
    complete: "Complet",
    warning: "Avertissement",
    blocked: "Bloqué",
    pending: "Données en attente"
  },
  en: {
    title: "Staged calculation and auditable values",
    description: "Every gate from inputs to volume closure is visible without hidden defaults or unexplained intermediate values.",
    inputs: "Input validity",
    materials: "Material compatibility",
    "water-binder": "Water and cement",
    aggregates: "Aggregates and grading",
    admixtures: "Admixtures",
    volume: "Volumetric balance",
    compliance: "Durability and compliance",
    complete: "Complete",
    warning: "Engineering warning",
    blocked: "Blocked",
    pending: "Data pending"
  }
} as const;

const icons = {
  inputs: ShieldAlert,
  materials: Layers3,
  "water-binder": Droplets,
  aggregates: Scale,
  admixtures: Sparkles,
  volume: CircleDot,
  compliance: CheckCircle2
} as const;

export const CalculationStagesPanel: React.FC<CalculationStagesPanelProps> = ({ language, results, criticalErrors, warnings, selectedMaterialCount }) => {
  const t = copy[language];
  const stages = useMemo(() => buildCalculationStageStatuses({ results, criticalErrors, warnings, selectedMaterialCount }), [results, criticalErrors, warnings, selectedMaterialCount]);
  const stateLabel = (state: CalculationStageState) => state === "complete" ? t.complete : state === "warning" ? t.warning : state === "blocked" ? t.blocked : t.pending;
  const stateClass = (state: CalculationStageState) => state === "complete" ? "border-emerald-500/25 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300" : state === "warning" ? "border-amber-500/25 bg-amber-500/5 text-amber-700 dark:text-amber-300" : state === "blocked" ? "border-rose-500/25 bg-rose-500/5 text-rose-700 dark:text-rose-300" : "border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/30 text-slate-500";

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-4 shadow-sm" aria-label={t.title}>
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white"><Droplets size={17} className="text-blue-500" />{t.title}</h3>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500 max-w-3xl">{t.description}</p>
        </div>
        <div className="rounded-xl bg-slate-950 px-3 py-2 text-[10px] text-slate-300 font-mono whitespace-nowrap">{criticalErrors ? `${criticalErrors} blocking` : warnings ? `${warnings} review` : "ready"}</div>
      </div>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
        {stages.map((stage) => {
          const Icon = icons[stage.id];
          return <article key={stage.id} className={`rounded-xl border p-3 min-h-[96px] ${stateClass(stage.state)}`}>
            <div className="flex items-start justify-between gap-2"><div className="flex items-center gap-1.5 text-[10px] font-black"><Icon size={14} />{t[stage.id]}</div><span className="text-[9px] font-black uppercase">{stateLabel(stage.state)}</span></div>
            <div className="mt-3 space-y-1 text-[10px] font-mono opacity-80">{stage.values.map(value => <div key={value}>{value}</div>)}</div>
            {stage.state === "warning" && <AlertTriangle size={13} className="mt-2" />}
          </article>;
        })}
      </div>
    </section>
  );
};
