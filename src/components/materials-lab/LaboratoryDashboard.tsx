import React, { useState, useMemo } from "react";
import { 
  FlaskConical, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  FileText, 
  Trash2, 
  Sparkles, 
  Layers, 
  ArrowRight, 
  RotateCcw,
  ShieldCheck,
  Building2,
  Calendar,
  User,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  SlidersHorizontal,
  BookmarkCheck,
  Download,
  BookOpen
} from "lucide-react";
import { EngineeringMaterial } from "../../types";
import { 
  LabCategory, 
  MaterialTestRecord, 
  TestStatus 
} from "../../types/laboratoryTypes";
import { 
  MASTER_TEST_CATALOG, 
  LAB_CATEGORIES_INFO
} from "../../services/materialsLabEngine";
import { getCompatibleMaterials } from "../../services/laboratoryMaterialCompatibility";
import { NewTestWizard } from "./NewTestWizard";
import { TestReportModal } from "./TestReportModal";
import { MaterialComprehensiveReportModal } from "./MaterialComprehensiveReportModal";
import { MaterialDossierSelectorModal } from "./MaterialDossierSelectorModal";
import { generateLabTestPdf } from "../../services/pdf/labTestPdfGenerator";

const labText = (language: string, ar: string, fr: string, en: string) => language === "ar" ? ar : language === "fr" ? fr : en;
const TESTS_WITH_CHARTS = new Set(["AGG_SIEVE", "AGG_BULKING_SAND", "CEM_SETTING_TIME", "CEM_COMPRESSIVE_STRENGTH"]);
function countTestInputs(value: any, parent = ""): number {
  if (Array.isArray(value)) return value.reduce((sum, row) => sum + countTestInputs(row, parent), 0);
  if (value && typeof value === "object") return Object.entries(value).reduce((sum, [key, nested]) => sum + (parent === "sieves" && key === "sieve" ? 0 : countTestInputs(nested, key)), 0);
  return typeof value === "number" || typeof value === "string" ? 1 : 0;
}

interface LaboratoryDashboardProps {
  materials: EngineeringMaterial[];
  laboratoryTests: MaterialTestRecord[];
  onSaveTestRecord: (testRecord: MaterialTestRecord, syncedProps: Record<string, any>) => void;
  onDeleteTestRecord?: (testId: string) => void;
  onNavigateToMaterialsLibrary?: () => void;
  language?: "ar" | "fr" | "en";
}

export const LaboratoryDashboard: React.FC<LaboratoryDashboardProps> = ({
  materials = [],
  laboratoryTests = [],
  onSaveTestRecord,
  onDeleteTestRecord,
  onNavigateToMaterialsLibrary,
  language = "ar"
}) => {
  // Navigation & Filter State
  const [activeCategory, setActiveCategory] = useState<LabCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<TestStatus | "ALL">("ALL");
  const [dateFilter, setDateFilter] = useState<"all" | "30d" | "90d">("all");
  const [catalogMaterialFilter, setCatalogMaterialFilter] = useState("all");
  const [standardFilter, setStandardFilter] = useState("all");
  const [recordMaterialFilter, setRecordMaterialFilter] = useState("all");
  const [sampleIdFilter, setSampleIdFilter] = useState("");

  // Modals
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
  const [wizardInitialCategory, setWizardInitialCategory] = useState<LabCategory>("aggregates");
  const [wizardInitialTestId, setWizardInitialTestId] = useState<string>("AGG_SIEVE");
  const [wizardInitialMaterialId, setWizardInitialMaterialId] = useState<string>("");
  const [wizardInitialDraft, setWizardInitialDraft] = useState<MaterialTestRecord | null>(null);

  const [selectedReportRecord, setSelectedReportRecord] = useState<MaterialTestRecord | null>(null);

  // Material Dossier & Comprehensive Report State
  const [selectedDossierMaterial, setSelectedDossierMaterial] = useState<EngineeringMaterial | null>(null);
  const [exportingTestId, setExportingTestId] = useState<string | null>(null);

  const handleExportTestPdf = async (rec: MaterialTestRecord) => {
    try {
      setExportingTestId(rec.id);
      const doc = await generateLabTestPdf(rec, {
        language: language === "ar" ? "ar" : language === "en" ? "en" : "fr"
      });
      const safeName = (rec.materialName || "Material").replace(/[^a-zA-Z0-9_\u0600-\u06FF-]/g, "_");
      doc.save(`SnoLab-TestReport-${rec.testType}-${safeName}-${rec.sampleId || rec.id}.pdf`);
    } catch (err) {
      console.error("Failed to export test report PDF:", err);
    } finally {
      setExportingTestId(null);
    }
  };
  const [isDossierSelectorOpen, setIsDossierSelectorOpen] = useState<boolean>(false);
  const [materialSearchQuery, setMaterialSearchQuery] = useState<string>("");
  const [materialCategoryFilter, setMaterialCategoryFilter] = useState<string>("all");

  // Statistics
  const stats = useMemo(() => {
    const total = laboratoryTests.length;
    const passed = laboratoryTests.filter(t => t.status === "PASS").length;
    const warnings = laboratoryTests.filter(t => t.status === "WARNING").length;
    const failed = laboratoryTests.filter(t => t.status === "FAIL").length;
    const drafts = laboratoryTests.filter(t => t.status === "DRAFT").length;
    const completed = passed + warnings + failed;
    const pendingReview = laboratoryTests.filter(t => t.status !== "FAIL" && t.status !== "DRAFT" && t.approvalStatus !== "Approved" && t.approvalStatus !== "Validated").length;
    const passRate = completed > 0 ? Math.round((passed / completed) * 100) : 0;

    // Materials tested
    const testedMaterialIds = new Set(laboratoryTests.filter(t => t.status !== "DRAFT" && t.materialId).map(t => t.materialId));
    const testedMaterialsCount = materials.filter(m => testedMaterialIds.has(m.id)).length;
    const unapprovedMaterials = materials.filter(m => m.approvalStatus !== "Approved" && m.approvalStatus !== "Validated").length;
    const materialsCoveragePct = materials.length > 0 ? Math.round((testedMaterialsCount / materials.length) * 100) : 0;
    const activeCutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
    const activeSamples = new Set(laboratoryTests.filter(t => t.sampleId.trim() && Date.parse(t.date) >= activeCutoff).map(t => t.sampleId)).size;

    return {
      total,
      completed,
      passed,
      warnings,
      failed,
      drafts,
      pendingReview,
      passRate,
      testedMaterialsCount,
      unapprovedMaterials,
      activeSamples,
      totalMaterials: materials.length,
      materialsCoveragePct
    };
  }, [laboratoryTests, materials]);

  // Filtered Test Catalog
  const displayedCatalog = useMemo(() => {
    return MASTER_TEST_CATALOG.filter(test => {
      if (activeCategory !== "all" && test.category !== activeCategory) return false;
      if (catalogMaterialFilter !== "all" && !test.applicableMaterials.some(value => value.toLowerCase().includes(catalogMaterialFilter.toLowerCase()))) return false;
      if (standardFilter !== "all" && test.standard !== standardFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = test.titleAr.toLowerCase().includes(q) || test.titleEn.toLowerCase().includes(q) || test.titleFr.toLowerCase().includes(q);
        const matchStd = test.standard.toLowerCase().includes(q);
        if (!matchTitle && !matchStd) return false;
      }
      return true;
    });
  }, [activeCategory, searchQuery, catalogMaterialFilter, standardFilter]);

  // Filtered Test History Records
  const displayedRecords = useMemo(() => {
    return laboratoryTests.filter(rec => {
      if (activeCategory !== "all" && rec.category !== activeCategory) return false;
      if (statusFilter !== "ALL" && rec.status !== statusFilter) return false;
      if (recordMaterialFilter !== "all" && rec.materialId !== recordMaterialFilter) return false;
      if (sampleIdFilter.trim() && !rec.sampleId.toLowerCase().includes(sampleIdFilter.trim().toLowerCase())) return false;
      if (dateFilter !== "all") {
        const days = dateFilter === "30d" ? 30 : 90;
        const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
        if (!rec.date || Number.isNaN(Date.parse(rec.date)) || Date.parse(rec.date) < cutoff) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchMat = rec.materialName.toLowerCase().includes(q);
        const matchTitle = rec.testTitleAr.toLowerCase().includes(q) || rec.testTitleEn.toLowerCase().includes(q) || rec.testTitleFr.toLowerCase().includes(q);
        const matchSample = rec.sampleId.toLowerCase().includes(q);
        if (!matchMat && !matchTitle && !matchSample) return false;
      }
      return true;
    });
  }, [laboratoryTests, activeCategory, statusFilter, searchQuery, dateFilter, recordMaterialFilter, sampleIdFilter]);
  const latestTests = useMemo(() => [...laboratoryTests].sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0)).slice(0, 5), [laboratoryTests]);

  // Filtered Materials for Verification Matrix
  const filteredMatrixMaterials = useMemo(() => {
    return materials.filter(m => {
      if (materialCategoryFilter !== "all" && m.category !== materialCategoryFilter) return false;
      if (materialSearchQuery.trim()) {
        const q = materialSearchQuery.toLowerCase();
        const matchName = m.name?.toLowerCase().includes(q);
        const matchCat = m.category?.toLowerCase().includes(q);
        const matchId = m.id?.toLowerCase().includes(q);
        if (!matchName && !matchCat && !matchId) return false;
      }
      return true;
    });
  }, [materials, materialCategoryFilter, materialSearchQuery]);

  const handleLaunchTest = (testId: string, category: LabCategory, materialId?: string) => {
    setWizardInitialDraft(null);
    setWizardInitialTestId(testId);
    setWizardInitialCategory(category);
    const compatible = getCompatibleMaterials(testId, materials);
    setWizardInitialMaterialId(materialId && compatible.some(material => material.id === materialId) ? materialId : compatible[0]?.id || "");
    setIsWizardOpen(true);
  };

  const handleResumeDraft = (draft: MaterialTestRecord) => {
    setWizardInitialDraft(draft);
    setWizardInitialTestId(draft.testType);
    setWizardInitialCategory(draft.category);
    setWizardInitialMaterialId(draft.materialId);
    setIsWizardOpen(true);
  };

  return (
    <div className="space-y-8 animate-fade-in text-slate-900 dark:text-slate-100" dir={language === "ar" ? "rtl" : "ltr"}>
      {/* 1. Header Banner & Identity */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-blue-700 via-indigo-700 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-blue-500/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-black text-blue-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{labText(language, "SnoLab · مختبر المواد وضبط الجودة", "SnoLab · Laboratoire des matériaux et contrôle qualité", "SnoLab · Materials testing & quality control")}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {labText(language, "مختبر المواد وضبط الجودة", "Laboratoire des matériaux et contrôle qualité", "Materials laboratory & quality control")}
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/80 max-w-3xl leading-relaxed">
              {labText(language, "منظومة اختبارات مواد البناء مع تحقق للمدخلات ومراجعة آمنة لخصائص المواد.", "Essais des matériaux avec validation des données et examen sécurisé des propriétés.", "Building-material tests with input validation and safe review of material properties.")}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <button
              type="button"
              onClick={() => handleLaunchTest("AGG_SIEVE", "aggregates")}
              className="flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-2xl text-xs shadow-lg shadow-emerald-500/30 transition-all transform active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-950 stroke-[3]" />
              <span>{labText(language, "اختبار جديد", "Nouvel essai", "New test")}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDossierSelectorOpen(true)}
              className="flex items-center gap-2 px-4 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-2xl text-xs shadow-lg shadow-amber-400/20 transition-all transform active:scale-95 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              <span>{language === "ar" ? "📑 التقرير الأكاديمي الشامل للمواد" : "Academic Material Dossiers"}</span>
            </button>

            {onNavigateToMaterialsLibrary && (
              <button
                type="button"
                onClick={onNavigateToMaterialsLibrary}
                className="flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl text-xs backdrop-blur-md border border-white/20 transition-all cursor-pointer"
              >
                <span>{language === "ar" ? "📂 مستودع المواد والركام" : "Materials Library"}</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-9 gap-3 mt-8 pt-6 border-t border-white/10">
          {[
            { label: labText(language, "كل الاختبارات", "Tous les essais", "All tests"), value: stats.total, detail: labText(language, "سجلات محفوظة", "Résultats archivés", "Archived records"), tone: "text-white" },
            { label: labText(language, "مكتملة", "Terminés", "Completed"), value: stats.completed, detail: labText(language, "نتائج منفذة", "Essais exécutés", "Tests run"), tone: "text-cyan-300" },
            { label: labText(language, "مسودات", "Brouillons", "Drafts"), value: stats.drafts, detail: labText(language, "يمكن استكمالها", "Reprise possible", "Can be resumed"), tone: "text-slate-200" },
            { label: labText(language, "بحاجة إلى مراجعة", "À examiner", "Needs review"), value: stats.pendingReview, detail: labText(language, "لم تعتمد بعد", "Non encore approuvés", "Not approved yet"), tone: "text-amber-300" },
            { label: labText(language, "فاشلة", "Échecs", "Failed"), value: stats.failed, detail: labText(language, "لا تزامن خصائصها", "Aucune synchronisation", "Never sync properties"), tone: "text-rose-300" },
            { label: labText(language, "عينات نشطة · 90 يومًا", "Échantillons actifs · 90 j", "Active samples · 90 days"), value: stats.activeSamples, detail: labText(language, "أرقام عينات مميزة", "Identifiants distincts", "Unique sample IDs"), tone: "text-blue-200" },
            { label: labText(language, "مواد غير معتمدة", "Matériaux non approuvés", "Unapproved materials"), value: stats.unapprovedMaterials, detail: labText(language, "تحتاج مراجعة", "À vérifier", "Require review"), tone: "text-orange-200" },
            { label: labText(language, "تغطية برنامج الفحص", "Couverture du programme", "Program coverage"), value: `${stats.materialsCoveragePct}%`, detail: `${stats.testedMaterialsCount}/${stats.totalMaterials} ${labText(language, "مواد مفحوصة", "matériaux testés", "materials tested")}`, tone: "text-emerald-300" },
            { label: labText(language, "معدل المطابقة", "Taux de conformité", "Pass rate"), value: `${stats.passRate}%`, detail: `${stats.passed} ${labText(language, "مطابق", "conformes", "passed")}`, tone: "text-emerald-300" }
          ].map(metric => <div key={metric.label} className="min-w-0 rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm"><span className="block truncate text-[10px] font-black text-blue-200">{metric.label}</span><span className={`text-2xl font-black font-mono ${metric.tone}`}>{metric.value}</span><span className="mt-0.5 block truncate text-[10px] text-blue-200">{metric.detail}</span></div>)}
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900" aria-label={labText(language, "أحدث الاختبارات", "Essais récents", "Latest tests")}>
        <div className="md:col-span-2 xl:col-span-5 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-blue-600" /><h2 className="text-sm font-black">{labText(language, "آخر الاختبارات المنفذة", "Derniers essais exécutés", "Latest tests performed")}</h2></div>
        {latestTests.length === 0 ? <p className="text-xs text-slate-500 md:col-span-2 xl:col-span-5">{labText(language, "لا توجد نتائج محفوظة بعد.", "Aucun résultat archivé.", "No results have been archived yet.")}</p> : latestTests.map(record => <button key={record.id} type="button" onClick={() => record.status === "DRAFT" ? handleResumeDraft(record) : setSelectedReportRecord(record)} className="min-w-0 rounded-xl border border-slate-100 bg-slate-50 p-3 text-start hover:border-blue-300 dark:border-slate-800 dark:bg-slate-950"><span className="block truncate text-xs font-bold">{language === "ar" ? record.testTitleAr : language === "fr" ? record.testTitleFr : record.testTitleEn}</span><span className="mt-1 block truncate text-[10px] text-slate-500">{record.materialName || labText(language, "مادة غير محددة", "Matériau à choisir", "Material not selected")} · {record.sampleId || "—"}</span><span className="mt-1 block font-mono text-[10px] text-slate-400">{record.date} · {record.status === "DRAFT" ? labText(language, "مسودة", "Brouillon", "Draft") : record.status}</span></button>)}
      </section>

      {/* 2. Category Selector Bar (6 Main Categories + All) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>تصنيفات الفحوصات والتجارب المخبرية:</span>
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            {displayedCatalog.length} اختبار متاح
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {/* ALL Tab */}
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
              activeCategory === "all"
                ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 font-black"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-300"
            }`}
          >
            <span className="text-xl">🌐</span>
            <span className="text-xs font-bold">جميع الفئات</span>
            <span className="text-[10px] opacity-75 font-mono">{MASTER_TEST_CATALOG.length}</span>
          </button>

          {(Object.keys(LAB_CATEGORIES_INFO) as LabCategory[]).map(catKey => {
            const info = LAB_CATEGORIES_INFO[catKey];
            const isSelected = activeCategory === catKey;
            const countInCat = MASTER_TEST_CATALOG.filter(t => t.category === catKey).length;
            return (
              <button
                key={catKey}
                type="button"
                onClick={() => setActiveCategory(catKey)}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                  isSelected
                    ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 font-black"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-300"
                }`}
              >
                <span className="text-xl">{info.icon}</span>
                <span className="text-xs font-bold truncate w-full">{language === "ar" ? info.nameAr : language === "fr" ? info.nameFr : info.nameEn}</span>
                <span className="text-[10px] opacity-75 font-mono">{countInCat} تجربة</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Materials Lab Verification & Readiness Matrix */}
      <div className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>مصفوفة مطابقة وتوثيق مواد المشروع (Materials Verification Matrix)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              حالة الفحص المخبري للمواد المسجلة في المشروع مع إمكانية استعراض وتنزيل التقرير الأكاديمي الشامل (PDF Dossier) وإجراء فحوصات فورية.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setIsDossierSelectorOpen(true)}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-200 text-xs font-bold rounded-xl border border-amber-200 dark:border-amber-800 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-amber-600" />
              <span>دليل التقارير الأكاديمية ({materials.length})</span>
            </button>
          </div>
        </div>

        {/* Matrix Search & Category Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={materialSearchQuery}
              onChange={(e) => setMaterialSearchQuery(e.target.value)}
              placeholder="بحث في المواد المسجلة..."
              className="w-full pl-3 pr-8 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto w-full pb-1">
            {["all", "رمال", "حصى", "إسمنت", "ماء", "إضافات وملدنات"].map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setMaterialCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  materialCategoryFilter === cat
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                }`}
              >
                {cat === "all" ? "جميع المواد" : cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {filteredMatrixMaterials.map(mat => {
            const matTests = laboratoryTests.filter(t => t.materialId === mat.id);
            const isVerified = mat.approvalStatus === "Approved" || mat.approvalStatus === "Validated";
            const lastTest = [...matTests].sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0))[0];

            return (
              <div 
                key={mat.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3 shadow-sm hover:border-blue-400 dark:hover:border-blue-600 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div 
                      onClick={() => setSelectedDossierMaterial(mat)}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 block">
                        {mat.category || "مادة"}
                      </span>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white line-clamp-1 hover:text-blue-600 dark:hover:text-blue-400">
                        {mat.name}
                      </h4>
                    </div>

                    <span className={`px-2 py-0.5 text-[10px] font-black rounded-full flex items-center gap-1 ${
                      isVerified
                        ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700"
                    }`}>
                      {isVerified ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      {isVerified ? labText(language, "مادة معتمدة", "Matériau approuvé", "Approved material") : matTests.length ? labText(language, `${matTests.length} اختبار · قيد المراجعة`, `${matTests.length} essai(s) · à examiner`, `${matTests.length} test(s) · review pending`) : labText(language, "غير مفحوصة", "Non testée", "Not tested")}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 text-[11px] bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl border border-slate-150 dark:border-slate-800">
                    <div>
                      <span className="text-slate-400 block text-[9px]">الكثافة المقاسة:</span>
                      <span className="font-mono font-black text-slate-800 dark:text-slate-200">{mat.density !== undefined ? `${mat.density} t/m³` : "—"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">الامتصاص المائي:</span>
                      <span className="font-mono font-black text-slate-800 dark:text-slate-200">{mat.absorption !== undefined ? `${mat.absorption}%` : "—"}</span>
                    </div>
                  </div>
                  {lastTest && <div className="mt-2 text-[10px] text-slate-500">{labText(language, "آخر فحص:", "Dernier essai :", "Latest test:")} {language === "ar" ? lastTest.testTitleAr : language === "fr" ? lastTest.testTitleFr : lastTest.testTitleEn} · {lastTest.date} · {lastTest.status}</div>}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDossierMaterial(mat)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-600 text-amber-800 hover:text-white dark:bg-amber-950/70 dark:text-amber-300 dark:hover:bg-amber-600 dark:hover:text-white text-[11px] font-black rounded-lg transition-all cursor-pointer"
                    title="استعراض التقرير الأكاديمي الشامل وتحميل PDF"
                  >
                    <FileText className="w-3 h-3" />
                    <span>التقرير الشامل</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLaunchTest(
                      mat.category === "رمال" ? "AGG_SIEVE" : mat.category === "إسمنت" ? "CEM_COMPRESSIVE_STRENGTH" : "AGG_BULK_DENSITY",
                      mat.category === "رمال" || mat.category === "حصى" ? "aggregates" : mat.category === "إسمنت" ? "cement" : "aggregates",
                      mat.id
                    )}
                    className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-600 dark:hover:text-white text-[11px] font-black rounded-lg transition-all cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>فحص مخبري</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Standard Laboratory Tests Catalog */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-blue-600" />
              <span>دليل التجارب المخبرية المعيارية المتاحة (Standard Test Catalog)</span>
            </h3>
            <p className="text-xs text-slate-500">
              اختر أي فحص لتشغيل الموديول الحسابي والتحقق الآلي ومطابقة النتائج.
            </p>
          </div>

          <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-3">
            <div className="relative sm:w-60"><Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" /><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={labText(language, "بحث بالاختبار أو المواصفة...", "Rechercher essai ou norme…", "Search test or standard…")} className="w-full pl-3 pr-9 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" /></div>
            <select value={catalogMaterialFilter} onChange={e => setCatalogMaterialFilter(e.target.value)} aria-label={labText(language, "تصفية حسب المادة", "Filtrer par matériau", "Filter by material")} className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs dark:border-slate-700 dark:bg-slate-900"><option value="all">{labText(language, "كل المواد", "Tous les matériaux", "All materials")}</option>{[["رمال", "رمل", "Sable", "Sand"], ["حصى", "حصى", "Gravier", "Gravel"], ["إسمنت", "إسمنت", "Ciment", "Cement"], ["ماء", "ماء", "Eau", "Water"], ["ملدنات", "إضافات كيميائية", "Adjuvants", "Admixtures"], ["إضافات معدنية", "إضافات معدنية", "Additions minérales", "Mineral additions"], ["ألياف", "ألياف", "Fibres", "Fibers"]].map(([value, ar, fr, en]) => <option key={value} value={value}>{labText(language, ar, fr, en)}</option>)}</select>
            <select value={standardFilter} onChange={e => setStandardFilter(e.target.value)} aria-label={labText(language, "تصفية حسب المواصفة", "Filtrer par norme", "Filter by standard")} className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs dark:border-slate-700 dark:bg-slate-900"><option value="all">{labText(language, "كل المواصفات", "Toutes les normes", "All standards")}</option>{Array.from(new Set(MASTER_TEST_CATALOG.map(test => test.standard))).sort().map(standard => <option key={standard} value={standard}>{standard}</option>)}</select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedCatalog.map(test => {
            const catInfo = LAB_CATEGORIES_INFO[test.category];
            return (
              <div
                key={test.id}
                className="group relative p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl p-2 rounded-2xl bg-slate-100 dark:bg-slate-800 group-hover:scale-110 transition-transform">
                        {test.icon}
                      </span>
                      <div>
                        <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 block">
                          {language === "ar" ? catInfo.nameAr : language === "fr" ? catInfo.nameFr : catInfo.nameEn}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 block">
                          {test.standard}
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {test.id}
                    </span>
                  </div>

                  <h4 className="text-sm font-black text-slate-900 dark:text-white pt-1">
                    {language === "ar" ? test.titleAr : language === "fr" ? test.titleFr : test.titleEn}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {language === "ar" ? test.shortDescAr : language === "fr" ? test.shortDescFr : test.shortDescEn}
                  </p>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex flex-wrap gap-1.5 text-[10px]"><span className="rounded-full bg-emerald-50 px-2 py-1 font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">{labText(language, "جاهز لإدخال القياسات", "Prêt pour la saisie", "Ready for measurements")}</span><span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">{countTestInputs(test.defaultInputs)} {labText(language, "حقلًا", "champs", "fields")}</span><span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">{TESTS_WITH_CHARTS.has(test.id) ? labText(language, "رسم بياني", "Graphique", "Chart") : labText(language, "بدون رسم", "Sans graphique", "No chart")}</span></div>
                  <div className="text-[10px] text-slate-500"><strong>{labText(language, "المادة:", "Matériau :", "Material:")}</strong> {test.applicableMaterials.join(", ")}</div>
                  <div className="text-[10px] text-slate-500"><strong>{labText(language, "خصائص قابلة للمراجعة:", "Propriétés proposées :", "Properties proposed:")}</strong> <span className="font-mono text-blue-600 dark:text-blue-400">{test.syncedPropertyKeys.length ? test.syncedPropertyKeys.join(", ") : "—"}</span></div>

                  <button
                    type="button"
                    onClick={() => handleLaunchTest(test.id, test.category)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all shadow-sm shadow-blue-500/20 cursor-pointer"
                  >
                    <span>{labText(language, "ابدأ الاختبار", "Démarrer l'essai", "Start test")}</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Laboratory Records Log & QC Archive Table */}
      <div className="space-y-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>سجل نتائج وتجارب المخبر المعتمدة (Test Records & QC Archive)</span>
            </h3>
            <p className="text-xs text-slate-500">
              جميع التقارير والشهادات المخبرية المسجلة مع إمكانية عرض شهادة الفحص والطباعة.
            </p>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                statusFilter === "ALL" ? "bg-white dark:bg-slate-900 text-blue-600 shadow-sm font-black" : "text-slate-500"
              }`}
            >
              الكل ({laboratoryTests.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("PASS")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                statusFilter === "PASS" ? "bg-emerald-600 text-white shadow-sm font-black" : "text-slate-500"
              }`}
            >
              مطابق ({stats.passed})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("WARNING")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                statusFilter === "WARNING" ? "bg-amber-600 text-white shadow-sm font-black" : "text-slate-500"
              }`}
            >
              تنبيه ({stats.warnings})
            </button>
            <button type="button" onClick={() => setStatusFilter("FAIL")} className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${statusFilter === "FAIL" ? "bg-rose-600 text-white shadow-sm font-black" : "text-slate-500"}`}>
              {labText(language, `فشل (${stats.failed})`, `Échecs (${stats.failed})`, `Failed (${stats.failed})`)}
            </button>
            <button type="button" onClick={() => setStatusFilter("DRAFT")} className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${statusFilter === "DRAFT" ? "bg-slate-600 text-white shadow-sm font-black" : "text-slate-500"}`}>{labText(language, `مسودات (${stats.drafts})`, `Brouillons (${stats.drafts})`, `Drafts (${stats.drafts})`)}</button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" aria-label={labText(language, "فلاتر سجل الاختبارات", "Filtres de l'historique", "Test history filters")}>
          <select value={recordMaterialFilter} onChange={e => setRecordMaterialFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"><option value="all">{labText(language, "كل المواد", "Tous les matériaux", "All materials")}</option>{Array.from(new Map(laboratoryTests.map(record => [record.materialId, record.materialName])).entries()).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
          <select value={dateFilter} onChange={e => setDateFilter(e.target.value as "all" | "30d" | "90d")} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"><option value="all">{labText(language, "كل التواريخ", "Toutes les dates", "All dates")}</option><option value="30d">{labText(language, "آخر 30 يومًا", "30 derniers jours", "Last 30 days")}</option><option value="90d">{labText(language, "آخر 90 يومًا", "90 derniers jours", "Last 90 days")}</option></select>
          <input value={sampleIdFilter} onChange={e => setSampleIdFilter(e.target.value)} placeholder={labText(language, "بحث برقم العينة", "Rechercher par échantillon", "Filter by sample ID")} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950" />
        </div>

        {displayedRecords.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
            <FlaskConical className="w-12 h-12 text-slate-400 mx-auto" />
            <h4 className="text-sm font-black text-slate-700 dark:text-slate-300">
              لا توجد تجارب مخبرية مسجلة بعد في هذا التصنيف
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              ابدأ بإجراء أول تجربة مخبرية بالنقر على زر "+ إجراء تجربة مخبرية جديدة" لحفظ النتائج وتحديث خواص المواد تلقائياً.
            </p>
            <button
              type="button"
              onClick={() => handleLaunchTest("AGG_SIEVE", "aggregates")}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-md shadow-blue-500/20"
            >
              + إجراء أول فحص مخبري
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-50 dark:bg-slate-850/60 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">كود الفحص / التاريخ</th>
                  <th className="p-3">نوع التجربة المخبرية</th>
                  <th className="p-3">المادة المختبرة</th>
                  <th className="p-3">المواصفة القياسية</th>
                  <th className="p-3 text-center">القرار والمطابقة</th>
                  <th className="p-3">{labText(language, "الخصائص المقترحة / المزامنة", "Propriétés proposées / synchronisées", "Proposed / synced properties")}</th>
                  <th className="p-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {displayedRecords.map(rec => (
                  <tr key={rec.id} className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors">
                    <td className="p-3">
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400 block">{rec.id}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{rec.date}</span>
                    </td>

                    <td className="p-3">
                      <span className="font-black text-slate-900 dark:text-white block">{language === "ar" ? rec.testTitleAr : language === "fr" ? rec.testTitleFr : rec.testTitleEn}</span>
                      <span className="text-[10px] text-slate-400">{rec.sampleId}{rec.sampleDate ? ` · ${rec.sampleDate}` : ""}</span>
                      {rec.sampleSource && <span className="block text-[10px] text-slate-400">{rec.sampleSource}</span>}
                    </td>

                    <td className="p-3">
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">{rec.materialName}</span>
                      <span className="text-[10px] text-slate-400">({rec.materialCategory})</span>
                    </td>

                    <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                      {rec.standard}
                    </td>

                    <td className="p-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black ${
                        rec.status === "PASS"
                          ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                          : rec.status === "WARNING"
                          ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                          : rec.status === "DRAFT"
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700"
                          : "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                      }`}>
                        {rec.status === "PASS" && <CheckCircle2 className="w-3 h-3" />}
                        {rec.status === "WARNING" && <AlertTriangle className="w-3 h-3" />}
                        {rec.status === "FAIL" && <XCircle className="w-3 h-3" />}
                        {rec.status === "DRAFT" ? labText(language, "مسودة", "Brouillon", "Draft") : rec.status}
                      </span>
                      <span className="mt-1 block text-[10px] text-slate-500">{rec.approvalStatus || labText(language, "قيد المراجعة", "À examiner", "Pending review")}</span>
                    </td>

                    <td className="p-3">
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {(rec.updateProposals || []).map(proposal => <span key={proposal.id} title={`${proposal.oldValue ?? "—"} → ${proposal.newValue}${proposal.unit ? ` ${proposal.unit}` : ""}`} className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-mono text-[9px]">{proposal.propertyKey}: {proposal.newValue} {proposal.unit || ""} · {proposal.status}</span>)}
                        {Object.keys(rec.syncedProperties || {}).map(k => {
                          const val = rec.syncedProperties[k];
                          const displayVal = Array.isArray(val)
                            ? `${val.length} نقاط تدرج`
                            : typeof val === "object" && val !== null
                            ? "[بيانات تفصيلية]"
                            : String(val ?? "—");
                          return (
                            <span key={k} className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono text-[9px]">
                              {k}: {displayVal}
                            </span>
                          );
                        })}
                      </div>
                    </td>

                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {rec.status === "DRAFT" ? <button type="button" onClick={() => handleResumeDraft(rec)} className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-[10px] font-bold text-white hover:bg-blue-700"><RotateCcw className="h-3 w-3" />{labText(language, "استكمال المسودة", "Reprendre le brouillon", "Resume draft")}</button> : <>
                        <button
                          type="button"
                          onClick={() => handleExportTestPdf(rec)}
                          disabled={exportingTestId === rec.id}
                          className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                          title="تصدير التقرير المخبري كملف PDF أكاديمي معتمد"
                        >
                          <Download className={`w-4 h-4 ${exportingTestId === rec.id ? "animate-bounce" : ""}`} />
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedReportRecord(rec)}
                          className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition-all cursor-pointer"
                          title="عرض شهادة الفحص المخبري"
                        >
                          <FileText className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const mat = materials.find(m => m.id === rec.materialId) || {
                              id: rec.materialId,
                              name: rec.materialName,
                              category: rec.materialCategory || "عام"
                            } as EngineeringMaterial;
                            setSelectedDossierMaterial(mat);
                          }}
                          className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 hover:bg-amber-600 hover:text-white transition-all cursor-pointer"
                          title="استعراض التقرير الأكاديمي الشامل للمادة (PDF Dossier)"
                        >
                          <BookOpen className="w-4 h-4" />
                        </button>
                        </>}

                        {onDeleteTestRecord && (
                          <button
                            type="button"
                            onClick={() => onDeleteTestRecord(rec.id)}
                            className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
                            title="حذف السجل"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Test Wizard Modal */}
      {isWizardOpen && (
        <NewTestWizard
          isOpen={isWizardOpen}
          onClose={() => {
            setIsWizardOpen(false);
            setWizardInitialDraft(null);
          }}
          materials={materials}
          initialCategory={wizardInitialCategory}
          initialTestId={wizardInitialTestId}
          initialMaterialId={wizardInitialMaterialId}
          initialDraft={wizardInitialDraft}
          existingTestRecords={laboratoryTests}
          onNavigateToMaterialsLibrary={onNavigateToMaterialsLibrary}
          onSaveTest={onSaveTestRecord}
          language={language}
        />
      )}

      {/* QC Certificate Modal */}
      {selectedReportRecord && (
        <TestReportModal
          isOpen={!!selectedReportRecord}
          onClose={() => setSelectedReportRecord(null)}
          record={selectedReportRecord}
          language={language}
        />
      )}

      {/* Material Dossier Selector Modal */}
      <MaterialDossierSelectorModal
        isOpen={isDossierSelectorOpen}
        onClose={() => setIsDossierSelectorOpen(false)}
        materials={materials}
        tests={laboratoryTests}
        onSelectMaterial={(mat) => {
          setSelectedDossierMaterial(mat);
        }}
        onRunTestForMaterial={(mat) => {
          handleLaunchTest(
            mat.category === "رمال" ? "AGG_SIEVE" : mat.category === "إسمنت" ? "CEM_COMPRESSIVE_STRENGTH" : "AGG_BULK_DENSITY",
            mat.category === "رمال" || mat.category === "حصى" ? "aggregates" : mat.category === "إسمنت" ? "cement" : "aggregates",
            mat.id
          );
        }}
        language={language}
      />

      {/* Academic Material Comprehensive Report Modal (Dossier & PDF Generator) */}
      <MaterialComprehensiveReportModal
        isOpen={!!selectedDossierMaterial}
        onClose={() => setSelectedDossierMaterial(null)}
        material={selectedDossierMaterial}
        tests={laboratoryTests}
        onRunTestForMaterial={(mat, testId) => {
          setSelectedDossierMaterial(null);
          handleLaunchTest(testId || "AGG_SIEVE", "aggregates", mat.id);
        }}
        language={language}
      />
    </div>
  );
};
