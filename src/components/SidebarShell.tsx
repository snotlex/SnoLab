import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity, BookOpen, Briefcase, Calculator, ChevronDown, ChevronLeft, ChevronRight, Scale, ClipboardCheck, TicketCheck, Beaker, History,
  Coins, Database, FileText, FlaskConical, FolderOpen, Home, Menu, PanelLeftClose,
  PanelLeftOpen, Settings, ShieldCheck, Sliders, Sparkles, X
} from "lucide-react";
import SnoLabLogo from "./SnoLabLogo";

type Language = "ar" | "fr" | "en";
type SidebarTab = string;

type Copy = { ar: string; fr: string; en: string };
const c = (ar: string, fr: string, en: string): Copy => ({ ar, fr, en });

interface SidebarNavItem {
  id: string;
  label: Copy;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  target: SidebarTab | "landing";
  targetType: "tab" | "landing";
  badge?: number;
  requiresProject?: boolean;
}

interface SidebarGroup {
  id: string;
  label: Copy;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  items: SidebarNavItem[];
}

export interface SidebarShellProps {
  language: Language;
  themeMode: "dark" | "light";
  isCollapsed: boolean;
  activeTab: SidebarTab;
  viewMode: "landing" | "workspace";
  projectName?: string;
  projectCode?: string;
  projectStatus?: string;
  unreadAlerts?: number;
  readyTests?: number;
  blockedTests?: number;
  draftCount?: number;
  onToggleCollapsed: () => void;
  onNavigate: (target: SidebarTab | "landing") => void;
  onToggleTheme?: () => void;
}

const STORAGE_KEY = "snolab-sidebar-groups";
const defaultGroups: Record<string, boolean> = { workspace: false, laboratory: false, reports: false, resources: false };

function label(value: Copy, language: Language) { return value[language] || value.en; }

export const SidebarShell = React.memo(function SidebarShell({
  language, themeMode, isCollapsed, activeTab, viewMode, projectName, projectCode, projectStatus = "draft",
  unreadAlerts = 0, readyTests = 0, blockedTests = 0, draftCount = 0,
  onToggleCollapsed, onNavigate, onToggleTheme
}: SidebarShellProps) {
  const isRtl = language === "ar";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [groups, setGroups] = useState<Record<string, boolean>>(() => {
    try { return { ...defaultGroups, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")["value"] }; } catch { return defaultGroups; }
  });
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ value: groups })); } catch { /* storage is optional */ }
  }, [groups]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setMobileOpen(false); };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", onKey); };
  }, [mobileOpen]);

  const closeMobile = () => { setMobileOpen(false); window.setTimeout(() => triggerRef.current?.focus(), 0); };
  const navigate = (target: SidebarTab | "landing") => { onNavigate(target); if (window.matchMedia("(max-width: 1023px)").matches) closeMobile(); };
  const toggleGroup = (id: string) => setGroups(previous => ({ ...previous, [id]: !previous[id] }));
  const active = (item: SidebarNavItem) => item.target === "landing" ? viewMode === "landing" : viewMode === "workspace" && activeTab === item.target;
  const statusLabel = language === "ar" ? ({ draft: "مسودة", "needs-review": "تحتاج مراجعة", ready: "جاهز", approved: "معتمد", blocked: "محظور" } as Record<string, string>)[projectStatus] || "مسودة" : language === "fr" ? ({ draft: "Brouillon", "needs-review": "À revoir", ready: "Prêt", approved: "Approuvé", blocked: "Bloqué" } as Record<string, string>)[projectStatus] || "Brouillon" : ({ draft: "Draft", "needs-review": "Needs review", ready: "Ready", approved: "Approved", blocked: "Blocked" } as Record<string, string>)[projectStatus] || "Draft";

  const groupsConfig = useMemo<SidebarGroup[]>(() => [
    { id: "workspace", label: c("مساحة العمل", "Espace de travail", "Workspace"), icon: Sliders, items: [
      { id: "dashboard", label: c("لوحة التحكم", "Tableau de bord", "Dashboard"), icon: Home, target: "dashboard", targetType: "tab" },
      { id: "projects", label: c("المشاريع المحفوظة", "Projets enregistrés", "Saved projects"), icon: FolderOpen, target: "saved_projects", targetType: "tab", badge: draftCount },
      { id: "mix-design", label: c("تصميم الخلطة", "Formulation", "Mix design"), icon: Calculator, target: "calculator", targetType: "tab", requiresProject: true },
      { id: "batch-preparation", label: c("تحضير الدفعة", "Préparation de gâchée", "Batch preparation"), icon: Scale, target: "batch_preparation", targetType: "tab", requiresProject: true },
      { id: "quality-control", label: c("ضبط الجودة QA/QC", "Contrôle qualité QA/QC", "QA/QC control"), icon: ClipboardCheck, target: "quality_control", targetType: "tab", requiresProject: true },
      { id: "batch-ticket", label: c("تذكرة الوزن", "Ticket de pesée", "Batch ticket"), icon: TicketCheck, target: "batch_ticket", targetType: "tab", requiresProject: true },
      { id: "quality-assets", label: c("العينات والمعايرة", "Échantillons et étalonnage", "Samples & calibration"), icon: Beaker, target: "quality_assets", targetType: "tab", requiresProject: true },
      { id: "versions", label: c("إصدارات الخلطات", "Versions des mélanges", "Mix versions"), icon: History, target: "versions", targetType: "tab", requiresProject: true },
      { id: "optimization", label: c("تحسين الخلطة", "Optimisation", "Optimization"), icon: Activity, target: "optimization", targetType: "tab", requiresProject: true }
    ] },
    { id: "laboratory", label: c("مختبر المواد", "Laboratoire des matériaux", "Materials laboratory"), icon: FlaskConical, items: [
      { id: "lab", label: c("التحقق والتحكم المخبري", "Validation de laboratoire", "Laboratory Performance Validation"), icon: FlaskConical, target: "materials_lab", targetType: "tab", badge: readyTests, requiresProject: true },
      { id: "lab-sessions", label: c("مركز الطلبات متعددة الاختبارات", "Centre des demandes multi-essais", "Multi-test request center"), icon: FlaskConical, target: "academic_lab", targetType: "tab", badge: blockedTests, requiresProject: true },
      { id: "materials", label: c("مكتبة المواد", "Bibliothèque des matériaux", "Materials library"), icon: Database, target: "materials_library", targetType: "tab" }
    ] },
    { id: "reports", label: c("التقارير والتحليل", "Rapports et analyse", "Reports & analysis"), icon: FileText, items: [
      { id: "reports", label: c("التقارير", "Rapports", "Reports"), icon: FileText, target: "reports", targetType: "tab", requiresProject: true },
      { id: "compliance", label: c("تقارير المطابقة", "Rapports de conformité", "Compliance reports"), icon: ShieldCheck, target: "compliance_reports", targetType: "tab", requiresProject: true },
      { id: "cost", label: c("تحليل التكلفة", "Analyse des coûts", "Cost analysis"), icon: Coins, target: "cost", targetType: "tab", requiresProject: true },
      { id: "journal", label: c("دفتر الحسابات", "Journal des calculs", "Calculation journal"), icon: FileText, target: "journal", targetType: "tab", requiresProject: true }
    ] },
    { id: "resources", label: c("الموارد والإعدادات", "Ressources et paramètres", "Resources & settings"), icon: BookOpen, items: [
      { id: "knowledge", label: c("مركز المعرفة الهندسي", "Centre de connaissances", "Engineering knowledge"), icon: BookOpen, target: "methodology", targetType: "tab" },
      { id: "assistant", label: c("المساعد الهندسي", "Assistant ingénierie", "Engineering assistant"), icon: Sparkles, target: "engineering_assistant", targetType: "tab" },
      { id: "settings", label: c("الإعدادات", "Paramètres", "Settings"), icon: Settings, target: "settings", targetType: "tab" }
    ] }
  ], [blockedTests, draftCount, readyTests]);

  const renderItem = (item: SidebarNavItem) => {
    const selected = active(item);
    const disabled = item.requiresProject && !projectName;
    const text = label(item.label, language);
    return <button key={item.id} type="button" data-sidebar-item={item.id} aria-current={selected ? "page" : undefined} aria-disabled={disabled || undefined} disabled={disabled} title={isCollapsed ? text : disabled ? (language === "ar" ? "افتح مشروعاً أولاً" : language === "fr" ? "Ouvrez d'abord un projet" : "Open a project first") : undefined} onClick={() => !disabled && navigate(item.target)} className={`group flex min-h-10 w-full items-center gap-2 rounded-xl px-2.5 py-2 text-start transition-colors ${isCollapsed ? "justify-center" : ""} ${selected ? "bg-blue-600 text-white shadow-md" : disabled ? "cursor-not-allowed text-slate-300 dark:text-slate-700" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70"}`}>
      <item.icon size={17} className="shrink-0" /><span className={`${isCollapsed ? "sr-only" : "min-w-0 flex-1 truncate"}`}>{text}</span>{!isCollapsed && item.badge ? <span className={`min-w-5 rounded-full px-1.5 text-center text-[9px] font-black ${selected ? "bg-white/20 text-white" : item.id === "lab-sessions" ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300" : "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"}`}>{item.badge}</span> : null}
    </button>;
  };

  const navigation = <nav aria-label={language === "ar" ? "التنقل الرئيسي" : language === "fr" ? "Navigation principale" : "Primary navigation"} data-testid="sidebar-navigation" className="min-h-0 flex-1 space-y-2 overflow-y-auto pe-1">
    <button type="button" data-sidebar-item="home" aria-current={viewMode === "landing" ? "page" : undefined} onClick={() => navigate("landing")} className={`flex min-h-10 w-full items-center gap-2 rounded-xl px-2.5 py-2 text-start ${viewMode === "landing" ? "bg-blue-600 text-white shadow-md" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70"} ${isCollapsed ? "justify-center" : ""}`} title={isCollapsed ? label(c("الرئيسية", "Accueil", "Home"), language) : undefined}><Home size={17} /><span className={isCollapsed ? "sr-only" : "flex-1"}>{label(c("الرئيسية", "Accueil", "Home"), language)}</span></button>
    {groupsConfig.map(group => <section key={group.id} aria-labelledby={`sidebar-group-${group.id}`} className="border-b border-slate-100 pb-2 dark:border-slate-800/70"><button type="button" aria-expanded={!groups[group.id]} aria-controls={`sidebar-group-items-${group.id}`} onClick={() => !isCollapsed && toggleGroup(group.id)} className={`flex min-h-9 w-full items-center gap-2 rounded-lg px-2 py-1.5 text-start text-[10px] font-black uppercase tracking-wide text-slate-400 hover:bg-slate-50 dark:text-slate-500 dark:hover:bg-slate-800/50 ${isCollapsed ? "justify-center" : ""}`} title={isCollapsed ? label(group.label, language) : undefined}><group.icon size={14} /><span id={`sidebar-group-${group.id}`} className={isCollapsed ? "sr-only" : "flex-1"}>{label(group.label, language)}</span>{!isCollapsed && (groups[group.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}</button>{(!groups[group.id] || isCollapsed) && <div id={`sidebar-group-items-${group.id}`} className="mt-1 space-y-1">{group.items.map(renderItem)}</div>}</section>)}
  </nav>;

  const content = <div className={`snolab-sidebar-surface flex h-full min-h-0 flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl dark:border-slate-800 dark:bg-[#0F172A]/95 ${isCollapsed ? "items-center" : ""}`} dir={isRtl ? "rtl" : "ltr"}>
    <header className={`flex w-full items-center gap-2 border-b border-slate-200 pb-3 dark:border-slate-800 ${isCollapsed ? "justify-center" : "justify-between"}`}><SnoLabLogo iconOnly={isCollapsed} themeMode={themeMode} className="h-7" />{!isCollapsed && <button type="button" aria-label={language === "ar" ? "طي الشريط الجانبي" : language === "fr" ? "Réduire la barre latérale" : "Collapse sidebar"} onClick={onToggleCollapsed} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><PanelLeftClose size={17} /></button>}</header>
    {!isCollapsed && <section aria-label={language === "ar" ? "المشروع الحالي" : "Current project"} className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-2.5 dark:border-indigo-900/40 dark:bg-indigo-950/20"><div className="truncate text-xs font-black text-slate-800 dark:text-slate-100">{projectName || (language === "ar" ? "لا يوجد مشروع نشط" : language === "fr" ? "Aucun projet actif" : "No active project")}</div>{projectCode && <div className="mt-0.5 font-mono text-[9px] text-slate-500">{projectCode}</div>}<span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[9px] font-black ${projectStatus === "blocked" ? "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300" : projectStatus === "approved" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"}`}>{statusLabel}</span></section>}
    {isCollapsed && <button type="button" aria-label={language === "ar" ? "توسيع الشريط الجانبي" : language === "fr" ? "Développer la barre latérale" : "Expand sidebar"} onClick={onToggleCollapsed} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><PanelLeftOpen size={17} /></button>}
    {navigation}
    <footer className="w-full border-t border-slate-200 pt-2 dark:border-slate-800"><div className={`flex items-center gap-1 ${isCollapsed ? "flex-col" : "justify-between"}`}><button type="button" onClick={onToggleTheme} disabled={!onToggleTheme} title={language === "ar" ? "تبديل الثيم" : language === "fr" ? "Changer le thème" : "Toggle theme"} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800"><Activity size={16} /></button>{!isCollapsed && <span className="text-[9px] text-slate-400">{language === "ar" ? "واجهة SnoLab" : language === "fr" ? "Interface SnoLab" : "SnoLab workspace"}</span>}<span className="relative rounded-lg p-2 text-slate-500" title={language === "ar" ? "التنبيهات" : language === "fr" ? "Alertes" : "Alerts"}><span className="sr-only">{label(c("التنبيهات", "Alertes", "Alerts"), language)}</span><ShieldCheck size={16} />{unreadAlerts > 0 && <span className="absolute -end-0.5 -top-0.5 min-w-4 rounded-full bg-rose-500 px-1 text-center text-[8px] font-black text-white">{unreadAlerts}</span>}</span></div></footer>
  </div>;

  return <>
    <button ref={triggerRef} type="button" data-testid="sidebar-mobile-open" aria-label={language === "ar" ? "فتح الشريط الجانبي" : language === "fr" ? "Ouvrir la barre latérale" : "Open sidebar"} onClick={() => setMobileOpen(true)} className="fixed start-3 top-20 z-50 rounded-xl bg-blue-600 p-3 text-white shadow-lg lg:hidden"><Menu size={19} /></button>
    {mobileOpen && <button type="button" aria-label={language === "ar" ? "إغلاق الشريط الجانبي" : language === "fr" ? "Fermer la barre latérale" : "Close sidebar"} onClick={closeMobile} className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden" />}
    <aside id="mixwizard-navigation-sidebar" data-testid="sidebar" className={`${mobileOpen ? "fixed inset-y-0 start-0 z-50 flex w-[min(86vw,340px)]" : "hidden lg:flex"} ${isCollapsed ? "lg:col-span-1" : "lg:col-span-3"} min-h-[calc(100vh-8rem)] flex-col print:hidden`}>
      {mobileOpen && <button type="button" aria-label={language === "ar" ? "إغلاق الشريط الجانبي" : language === "fr" ? "Fermer" : "Close sidebar"} onClick={closeMobile} className="absolute end-3 top-3 z-10 rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>}
      {content}
    </aside>
  </>;
});
SidebarShell.displayName = "SidebarShell";
