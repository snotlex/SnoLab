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
  BookmarkCheck
} from "lucide-react";
import { EngineeringMaterial } from "../../types";
import { 
  LabCategory, 
  MaterialTestRecord, 
  TestStatus 
} from "../../types/laboratoryTypes";
import { 
  MASTER_TEST_CATALOG, 
  LAB_CATEGORIES_INFO,
  syncTestToMaterial 
} from "../../services/materialsLabEngine";
import { NewTestWizard } from "./NewTestWizard";
import { TestReportModal } from "./TestReportModal";

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

  // Modals
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
  const [wizardInitialCategory, setWizardInitialCategory] = useState<LabCategory>("aggregates");
  const [wizardInitialTestId, setWizardInitialTestId] = useState<string>("AGG_SIEVE");
  const [wizardInitialMaterialId, setWizardInitialMaterialId] = useState<string>("");

  const [selectedReportRecord, setSelectedReportRecord] = useState<MaterialTestRecord | null>(null);

  // Statistics
  const stats = useMemo(() => {
    const total = laboratoryTests.length;
    const passed = laboratoryTests.filter(t => t.status === "PASS").length;
    const warnings = laboratoryTests.filter(t => t.status === "WARNING").length;
    const failed = laboratoryTests.filter(t => t.status === "FAIL").length;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 100;

    // Materials tested
    const testedMaterialIds = new Set(laboratoryTests.map(t => t.materialId));
    const verifiedMaterialsCount = materials.filter(m => testedMaterialIds.has(m.id)).length;
    const materialsCoveragePct = materials.length > 0 ? Math.round((verifiedMaterialsCount / materials.length) * 100) : 0;

    return {
      total,
      passed,
      warnings,
      failed,
      passRate,
      verifiedMaterialsCount,
      totalMaterials: materials.length,
      materialsCoveragePct
    };
  }, [laboratoryTests, materials]);

  // Filtered Test Catalog
  const displayedCatalog = useMemo(() => {
    return MASTER_TEST_CATALOG.filter(test => {
      if (activeCategory !== "all" && test.category !== activeCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = test.titleAr.toLowerCase().includes(q) || test.titleEn.toLowerCase().includes(q);
        const matchStd = test.standard.toLowerCase().includes(q);
        if (!matchTitle && !matchStd) return false;
      }
      return true;
    });
  }, [activeCategory, searchQuery]);

  // Filtered Test History Records
  const displayedRecords = useMemo(() => {
    return laboratoryTests.filter(rec => {
      if (activeCategory !== "all" && rec.category !== activeCategory) return false;
      if (statusFilter !== "ALL" && rec.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchMat = rec.materialName.toLowerCase().includes(q);
        const matchTitle = rec.testTitleAr.toLowerCase().includes(q) || rec.testTitleEn.toLowerCase().includes(q);
        const matchSample = rec.sampleId.toLowerCase().includes(q);
        if (!matchMat && !matchTitle && !matchSample) return false;
      }
      return true;
    });
  }, [laboratoryTests, activeCategory, statusFilter, searchQuery]);

  const handleLaunchTest = (testId: string, category: LabCategory, materialId?: string) => {
    setWizardInitialTestId(testId);
    setWizardInitialCategory(category);
    if (materialId) {
      setWizardInitialMaterialId(materialId);
    } else {
      const matchMat = materials.find(m => {
        if (category === "aggregates") return m.category === "رمال" || m.category === "حصى";
        if (category === "cement") return m.category === "إسمنت";
        if (category === "water") return m.category === "ماء";
        if (category === "admixtures") return m.category?.includes("إضافات") || m.category?.includes("ملدنات");
        return true;
      });
      setWizardInitialMaterialId(matchMat ? matchMat.id : materials[0]?.id || "");
    }
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
              <span>SnoLab Materials Testing & Laboratory Quality Control</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              🧪 مخبر خصائص المواد والتحقق والتحكم المخبري
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/80 max-w-3xl leading-relaxed">
              منظومة متكاملة لجميع الاختبارات الفيزيائية والميكانيكية للركام، الإسمنت، ماء الخلط، الملدنات الكيميائية، والإضافات المعدنية.
              مربوطة مباشرة بمستودع المواد لتحديث الخواص الفعلية ومطابقة المعايير القياسية (EN / ASTM / NF).
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
              <span>{language === "ar" ? "إجراء تجربة مخبرية جديدة" : "Run New Lab Test"}</span>
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

        {/* Top 4 KPI Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
            <span className="text-[10px] text-blue-200 uppercase tracking-widest font-black block">إجمالي التجارب المخبرية</span>
            <span className="text-2xl font-black font-mono text-white">{stats.total}</span>
            <span className="text-[10px] text-blue-300 block mt-0.5">سجل فحص معتمد</span>
          </div>

          <div className="p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
            <span className="text-[10px] text-blue-200 uppercase tracking-widest font-black block">نسبة المطابقة القياسية</span>
            <span className="text-2xl font-black font-mono text-emerald-400">{stats.passRate}%</span>
            <span className="text-[10px] text-emerald-300 block mt-0.5">{stats.passed} تجربة مطابقة تماماً</span>
          </div>

          <div className="p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
            <span className="text-[10px] text-blue-200 uppercase tracking-widest font-black block">المواد الموثقة مخبرياً</span>
            <span className="text-2xl font-black font-mono text-amber-300">{stats.verifiedMaterialsCount} / {stats.totalMaterials}</span>
            <span className="text-[10px] text-amber-200 block mt-0.5">{stats.materialsCoveragePct}% تغطية المستودع</span>
          </div>

          <div className="p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
            <span className="text-[10px] text-blue-200 uppercase tracking-widest font-black block">حالة التخزين المحلي</span>
            <span className="text-sm font-black text-white flex items-center gap-1.5 mt-1.5">
              <BookmarkCheck className="w-4 h-4 text-cyan-400" />
              <span>Local-First (.snlab)</span>
            </span>
            <span className="text-[10px] text-cyan-200 block mt-0.5">محفوظة داخل ملف المشروع</span>
          </div>
        </div>
      </div>

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
                <span className="text-xs font-bold truncate w-full">{info.nameAr}</span>
                <span className="text-[10px] opacity-75 font-mono">{countInCat} تجربة</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Materials Lab Verification & Readiness Matrix */}
      <div className="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>مصفوفة مطابقة وتوثيق مواد المشروع (Materials Verification Matrix)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              حالة الفحص المخبري للمواد المسجلة في المشروع وإمكانية إجراء فحص فوري لتحديث خواصها.
            </p>
          </div>

          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 font-mono">
            {materials.length} مواد مسجلة
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {materials.map(mat => {
            const matTests = laboratoryTests.filter(t => t.materialId === mat.id);
            const isVerified = matTests.length > 0;
            const lastTest = matTests[matTests.length - 1];

            return (
              <div 
                key={mat.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3 shadow-sm hover:border-blue-400 dark:hover:border-blue-600 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 block">
                        {mat.category || "مادة"}
                      </span>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white line-clamp-1">
                        {mat.name}
                      </h4>
                    </div>

                    <span className={`px-2 py-0.5 text-[10px] font-black rounded-full flex items-center gap-1 ${
                      isVerified
                        ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700"
                    }`}>
                      {isVerified ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      {isVerified ? `${matTests.length} فحص منجز` : "غير مفحوص"}
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
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                    {lastTest ? `آخر فحص: ${lastTest.date}` : "بانتظار إجراء فحص مخبري"}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleLaunchTest(
                      mat.category === "رمال" ? "AGG_SIEVE" : mat.category === "إسمنت" ? "CEM_COMPRESSIVE_STRENGTH" : "AGG_BULK_DENSITY",
                      mat.category === "رمال" || mat.category === "حصى" ? "aggregates" : mat.category === "إسمنت" ? "cement" : "aggregates",
                      mat.id
                    )}
                    className="px-2.5 py-1 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-600 dark:hover:text-white text-[11px] font-black rounded-lg transition-all cursor-pointer"
                  >
                    + فحص مخبري
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

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث في التجارب والمواصفات..."
              className="w-full pl-3 pr-9 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
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
                          {catInfo.nameAr}
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
                    {test.titleAr}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {test.shortDescAr}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <span className="font-bold">مزامنة:</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400 truncate max-w-[120px]">
                      {test.syncedPropertyKeys.join(", ")}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleLaunchTest(test.id, test.category)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all shadow-sm shadow-blue-500/20 cursor-pointer"
                  >
                    <span>إجراء التجربة</span>
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
          </div>
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
                  <th className="p-3">الخاصية المحدثة</th>
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
                      <span className="font-black text-slate-900 dark:text-white block">{rec.testTitleAr}</span>
                      <span className="text-[10px] text-slate-400">{rec.sampleId}</span>
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
                          : "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                      }`}>
                        {rec.status === "PASS" && <CheckCircle2 className="w-3 h-3" />}
                        {rec.status === "WARNING" && <AlertTriangle className="w-3 h-3" />}
                        {rec.status === "FAIL" && <XCircle className="w-3 h-3" />}
                        {rec.status}
                      </span>
                    </td>

                    <td className="p-3">
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
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
                        <button
                          type="button"
                          onClick={() => setSelectedReportRecord(rec)}
                          className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition-all cursor-pointer"
                          title="عرض شهادة الفحص المخبري"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
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
          onClose={() => setIsWizardOpen(false)}
          materials={materials}
          initialCategory={wizardInitialCategory}
          initialTestId={wizardInitialTestId}
          initialMaterialId={wizardInitialMaterialId}
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
    </div>
  );
};
