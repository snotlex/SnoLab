import React, { useState, useMemo } from "react";
import { 
  FlaskConical, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  FileText, 
  RefreshCw, 
  History, 
  Layers, 
  TrendingUp, 
  ShieldCheck, 
  User, 
  Building2, 
  ChevronRight, 
  ArrowUpDown,
  Sparkles,
  Download,
  Printer,
  SlidersHorizontal,
  FolderOpen,
  Info,
  Database,
  Tag,
  Shield,
  Sparkle
} from "lucide-react";
import { EngineeringMaterial } from "../../types";
import { MaterialTestRecord, LabCategory, TestApprovalStatus } from "../../types/laboratoryTypes";
import { 
  isDemoTestRecord, 
  isDemoMaterial, 
  getTestSourceInfo, 
  getMaterialSourceInfo 
} from "../../services/materialLabSync";
import { isUserMaterial } from "../../engine/suitabilityGate";
import { TestReportModal } from "./TestReportModal";
import { MaterialLabHistoryModal } from "./MaterialLabHistoryModal";
import { NewTestWizard } from "./NewTestWizard";
import { TestModuleAggregates } from "./TestModuleAggregates";
import { TestModuleCement } from "./TestModuleCement";
import { TestModuleWater } from "./TestModuleWater";
import { TestModuleAdmixtures } from "./TestModuleAdmixtures";
import { TestModuleSCM } from "./TestModuleSCM";
import { TestModuleFibers } from "./TestModuleFibers";

interface LaboratoryDashboardProps {
  materials: EngineeringMaterial[];
  testRecords: MaterialTestRecord[];
  onAddTestRecord: (record: MaterialTestRecord, updatedMaterialProps?: Record<string, any>) => void;
  onUpdateMaterialProperty?: (materialId: string, updatedProps: Record<string, any>) => void;
  onUpdateTestStatus?: (testId: string, newStatus: TestApprovalStatus) => void;
  onAddMaterial?: (newMaterial: EngineeringMaterial) => void;
  initialSelectedMaterial?: EngineeringMaterial | null;
  onClearInitialMaterial?: () => void;
  currentProjectName?: string;
  currentUser?: string;
}

export const LaboratoryDashboard: React.FC<LaboratoryDashboardProps> = ({
  materials,
  testRecords,
  onAddTestRecord,
  onUpdateMaterialProperty,
  onUpdateTestStatus,
  onAddMaterial,
  initialSelectedMaterial = null,
  onClearInitialMaterial,
  currentProjectName = "مشروع الخرسانة النموذجي",
  currentUser = "م. سفيان زوبير (رئيس مخبر مراقبة الجودة)"
}) => {
  // Navigation / View state
  const [sourceScope, setSourceScope] = useState<"user_tests" | "demo_library" | "all">("user_tests");
  const [selectedCategory, setSelectedCategory] = useState<LabCategory | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PASS" | "WARNING" | "FAIL">("ALL");
  const [approvalFilter, setApprovalFilter] = useState<"ALL" | "Validated" | "Pending Review" | "Draft" | "Rejected">("ALL");
  const [materialShelfFilter, setMaterialShelfFilter] = useState<"all" | "user" | "demo">("all");

  // Modals & Active Test Execution
  const [selectedReportTest, setSelectedReportTest] = useState<MaterialTestRecord | null>(null);
  const [historyModalMaterial, setHistoryModalMaterial] = useState<EngineeringMaterial | null>(null);
  
  // Wizard to start a new test
  const [isStartingNewTest, setIsStartingNewTest] = useState(Boolean(initialSelectedMaterial));
  const [selectedMaterialForNewTest, setSelectedMaterialForNewTest] = useState<EngineeringMaterial | null>(initialSelectedMaterial);

  // Sync when initialSelectedMaterial changes
  React.useEffect(() => {
    if (initialSelectedMaterial) {
      setSelectedMaterialForNewTest(initialSelectedMaterial);
      setIsStartingNewTest(true);
    }
  }, [initialSelectedMaterial]);

  // Grouped counts for Source separation
  const userTestRecords = useMemo(() => testRecords.filter(t => !isDemoTestRecord(t)), [testRecords]);
  const demoTestRecords = useMemo(() => testRecords.filter(t => isDemoTestRecord(t)), [testRecords]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return testRecords.filter((record) => {
      // 1. Source Scope Filter
      const isDemo = isDemoTestRecord(record);
      if (sourceScope === "user_tests" && isDemo) return false;
      if (sourceScope === "demo_library" && !isDemo) return false;

      // 2. Category Filter
      const matchCategory = selectedCategory === "ALL" || record.category === selectedCategory;
      
      // 3. Status Filter
      const matchStatus = statusFilter === "ALL" || record.status === statusFilter;
      
      // 4. Approval Filter
      const recordApproval = record.approvalStatus || (record.status === "PASS" ? "Validated" : "Pending Review");
      const matchApproval = approvalFilter === "ALL" || recordApproval === approvalFilter;
      
      // 5. Search Filter
      const matchSearch = searchQuery === "" || 
        record.materialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.testTitleAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.testTitleFr?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.sampleId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.standard.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (record.sourceLabel && record.sourceLabel.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchCategory && matchStatus && matchApproval && matchSearch;
    });
  }, [testRecords, sourceScope, selectedCategory, statusFilter, approvalFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = testRecords.length;
    const userCount = userTestRecords.length;
    const demoCount = demoTestRecords.length;
    const passed = testRecords.filter(t => t.status === "PASS").length;
    const warning = testRecords.filter(t => t.status === "WARNING").length;
    const failed = testRecords.filter(t => t.status === "FAIL").length;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 100;

    // Distinct materials tested
    const uniqueMaterials = new Set(testRecords.map(t => t.materialId)).size;

    return { total, userCount, demoCount, passed, warning, failed, passRate, uniqueMaterials };
  }, [testRecords, userTestRecords, demoTestRecords]);

  // Category counts within current sourceScope
  const categoryCounts = useMemo(() => {
    const scopeRecords = sourceScope === "user_tests" 
      ? userTestRecords 
      : sourceScope === "demo_library" 
      ? demoTestRecords 
      : testRecords;

    return {
      ALL: scopeRecords.length,
      aggregates: scopeRecords.filter(t => t.category === "aggregates").length,
      cement: scopeRecords.filter(t => t.category === "cement").length,
      water: scopeRecords.filter(t => t.category === "water").length,
      admixtures: scopeRecords.filter(t => t.category === "admixtures").length,
      additives: scopeRecords.filter(t => t.category === "additives").length,
      fibers: scopeRecords.filter(t => t.category === "fibers").length
    };
  }, [testRecords, userTestRecords, demoTestRecords, sourceScope]);

  const handleStartTest = (material?: EngineeringMaterial) => {
    setSelectedMaterialForNewTest(material || materials[0] || null);
    setIsStartingNewTest(true);
  };

  const handleSaveCompletedTest = (record: MaterialTestRecord, updatedMaterialProps?: Record<string, any>) => {
    // Force user ownership on newly executed lab tests
    const userOwnedRecord: MaterialTestRecord = {
      ...record,
      isDemo: false,
      sourceType: "user_created",
      sourceLabel: "User Test"
    };

    onAddTestRecord(userOwnedRecord, updatedMaterialProps);
    if (updatedMaterialProps && onUpdateMaterialProperty && record.materialId) {
      onUpdateMaterialProperty(record.materialId, updatedMaterialProps);
    }
    setIsStartingNewTest(false);
    setSelectedMaterialForNewTest(null);
  };

  // Group materials for selection
  const userMaterials = useMemo(() => materials.filter(m => isUserMaterial(m)), [materials]);
  const demoMaterials = useMemo(() => materials.filter(m => !isUserMaterial(m)), [materials]);

  return (
    <div className="space-y-6 animate-fade-in text-right" dir="rtl">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-l from-slate-900 via-blue-950 to-slate-900 text-white shadow-xl border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/30">
              <FlaskConical size={24} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight">
                مخبر خصائص المواد والتحقق المخبري
              </h1>
              <p className="text-xs md:text-sm text-slate-300">
                Materials Testing & Quality Control Laboratory — NF EN / ASTM Standards
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => handleStartTest()}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Plus size={16} />
            <span>إجراء فحص مخبري جديد لموادك</span>
          </button>
        </div>
      </div>

      {/* Main Source Scope Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-slate-100 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <button
            onClick={() => setSourceScope("user_tests")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition cursor-pointer ${
              sourceScope === "user_tests"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <User size={14} />
            <span>فحوصات مشروعي ومختبري (User Tests)</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              sourceScope === "user_tests" ? "bg-blue-700 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            }`}>
              {stats.userCount}
            </span>
          </button>

          <button
            onClick={() => setSourceScope("demo_library")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition cursor-pointer ${
              sourceScope === "demo_library"
                ? "bg-amber-600 text-white shadow"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <FlaskConical size={14} />
            <span>مكتبة العينات الافتراضية والتجريبية (Demo Data)</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              sourceScope === "demo_library" ? "bg-amber-700 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            }`}>
              {stats.demoCount}
            </span>
          </button>

          <button
            onClick={() => setSourceScope("all")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition cursor-pointer ${
              sourceScope === "all"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Database size={14} />
            <span>جميع السجلات المخبرية</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              sourceScope === "all" ? "bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900" : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            }`}>
              {stats.total}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 px-3 text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
          <Shield size={14} className="text-emerald-500 shrink-0" />
          <span>عزل كامل بين بيانات النظام الافتراضية وبيانات مشاريع المستخدم</span>
        </div>
      </div>

      {/* Demo Notice Banner (Shown when viewing Demo Library or All Records) */}
      {(sourceScope === "demo_library" || sourceScope === "all") && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-start gap-3 text-xs">
          <Info size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 leading-relaxed">
            <p className="font-bold">
              مكتبة العينات الافتراضية والنماذج القياسية (System Demo & Sample Data)
            </p>
            <p className="text-[11px] text-amber-800 dark:text-amber-300/90">
              هذه السجلات تم إنشاؤها مسبقاً من النظام لأغراض التوضيح، الاختبار والتدريب الهندسي. تم تمييزها بوضوح بأنها 
              <span className="font-bold font-mono mx-1 px-1 py-0.2 rounded bg-amber-200/50 dark:bg-amber-900/40">Demo Data</span>
              ولا تعتبر جزءاً من فحوصاتك الخاصة، ولن تدخل تلقائياً في حسابات وتراكيب الخلطة (Mix Design) الخاصة بمشروعك حتى تقوم بإجراء فحوصاتك المخبرية الفعلية.
            </p>
          </div>
        </div>
      )}

      {/* Laboratory Statistics Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400">فحوصات مشروعي</div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 font-mono">
            {stats.userCount}
          </div>
          <div className="text-[10px] text-blue-500 mt-1 font-semibold">بيانات المستخدم الخاصة</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400">مكتبة العينات (Demo)</div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 font-mono">
            {stats.demoCount}
          </div>
          <div className="text-[10px] text-amber-500 mt-1 font-semibold">نماذج نظام تجريبية</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400">نسبة المطابقة العامة</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            {stats.passRate}%
          </div>
          <div className="text-[10px] text-emerald-500 mt-1 font-semibold">{stats.passed} فحص مطابق</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400">تحت المراقبة</div>
          <div className="text-2xl font-black text-amber-500 mt-1 font-mono">
            {stats.warning}
          </div>
          <div className="text-[10px] text-amber-500 mt-1 font-semibold">تنبيهات حدودية</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400">فحوصات مرفوضة</div>
          <div className="text-2xl font-black text-rose-500 mt-1 font-mono">
            {stats.failed}
          </div>
          <div className="text-[10px] text-rose-500 mt-1 font-semibold">غير مطابقة</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400">المشروع الحالي</div>
          <div className="text-xs font-black text-slate-800 dark:text-slate-200 mt-2 truncate">
            {currentProjectName}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">Active Project</div>
        </div>
      </div>

      {/* Main Lab Content: If conducting a test wizard, show NewTestWizard; otherwise show dashboard records */}
      {isStartingNewTest ? (
        <NewTestWizard
          materials={materials}
          operator={currentUser}
          projectName={currentProjectName}
          initialMaterial={selectedMaterialForNewTest}
          onSaveCompletedTest={handleSaveCompletedTest}
          onCancel={() => {
            setIsStartingNewTest(false);
            setSelectedMaterialForNewTest(null);
            if (onClearInitialMaterial) onClearInitialMaterial();
          }}
          onQuickAddMaterial={(newMat) => {
            if (onAddMaterial) {
              onAddMaterial(newMat);
            }
          }}
        />
      ) : (
        <div className="space-y-4">
          
          {/* Filter Bar & Category Tabs */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            
            {/* Category Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <button
                onClick={() => setSelectedCategory("ALL")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === "ALL"
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span>جميع الأقسام</span>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px]">
                  {categoryCounts.ALL}
                </span>
              </button>

              <button
                onClick={() => setSelectedCategory("aggregates")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === "aggregates"
                    ? "bg-blue-600 text-white shadow"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span>الركام والرمال (Aggregates)</span>
                <span className="px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-900/50 text-[10px]">
                  {categoryCounts.aggregates}
                </span>
              </button>

              <button
                onClick={() => setSelectedCategory("cement")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === "cement"
                    ? "bg-blue-600 text-white shadow"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span>الإسمنت والرابط (Cement)</span>
                <span className="px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-900/50 text-[10px]">
                  {categoryCounts.cement}
                </span>
              </button>

              <button
                onClick={() => setSelectedCategory("water")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === "water"
                    ? "bg-blue-600 text-white shadow"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span>مياه الخلط (Water)</span>
                <span className="px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-900/50 text-[10px]">
                  {categoryCounts.water}
                </span>
              </button>

              <button
                onClick={() => setSelectedCategory("admixtures")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === "admixtures"
                    ? "bg-blue-600 text-white shadow"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span>المضافات الكيميائية (Admixtures)</span>
                <span className="px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-900/50 text-[10px]">
                  {categoryCounts.admixtures}
                </span>
              </button>

              <button
                onClick={() => setSelectedCategory("additives")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === "additives"
                    ? "bg-blue-600 text-white shadow"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span>الإضافات البوزولانية (SCM)</span>
                <span className="px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-900/50 text-[10px]">
                  {categoryCounts.additives}
                </span>
              </button>

              <button
                onClick={() => setSelectedCategory("fibers")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === "fibers"
                    ? "bg-blue-600 text-white shadow"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span>ألياف التسليح (Fibers)</span>
                <span className="px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-900/50 text-[10px]">
                  {categoryCounts.fibers}
                </span>
              </button>
            </div>

            {/* Search & Status Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search size={16} className="absolute right-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="بحث باسم المادة، كود العينة، المعيار، المصدر..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-3 pr-9 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs text-slate-500 font-bold whitespace-nowrap">الاعتماد:</label>
                  <select
                    value={approvalFilter}
                    onChange={(e) => setApprovalFilter(e.target.value as any)}
                    className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="ALL">جميع الحالات</option>
                    <option value="Validated">معتمد (Validated)</option>
                    <option value="Pending Review">قيد المراجعة</option>
                    <option value="Draft">مسودة (Draft)</option>
                    <option value="Rejected">مرفوض (Rejected)</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <label className="text-xs text-slate-500 font-bold whitespace-nowrap">المطابقة:</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="ALL">جميع النتائج</option>
                    <option value="PASS">مطابق (PASS)</option>
                    <option value="WARNING">تنبيه (WARNING)</option>
                    <option value="FAIL">غير مطابق (FAIL)</option>
                  </select>
                </div>
              </div>
            </div>

          </div>

          {/* Empty State For User Tests */}
          {sourceScope === "user_tests" && filteredRecords.length === 0 && (
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                <User size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  لم يتم إجراء فحوصات مخبرية خاصة بمشروعك بعد
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  هذا القسم مخصص لفحوصاتك المخبرية الحقيقية والموثقة لموادك. يمكنك بدء إجراء فحص جديد وحفظه، أو تصفح مكتبة العينات التجريبية والافتراضية.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => handleStartTest()}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow transition cursor-pointer"
                >
                  <Plus size={15} />
                  <span>بدء إجراء فحص مخبري لمواد المشروع</span>
                </button>
                <button
                  onClick={() => setSourceScope("demo_library")}
                  className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50 rounded-xl font-bold text-xs transition cursor-pointer"
                >
                  <FlaskConical size={15} />
                  <span>استعراض مكتبة العينات التجريبية (Demo Data)</span>
                </button>
              </div>
            </div>
          )}

          {/* Test Records Table */}
          {!(sourceScope === "user_tests" && filteredRecords.length === 0) && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">رقم الفحص / التاريخ</th>
                      <th className="py-3 px-4">اسم التجربة المخبرية</th>
                      <th className="py-3 px-4">المادة المفحوصة</th>
                      <th className="py-3 px-4">مصدر البيانات (Source)</th>
                      <th className="py-3 px-4">المعيار القياسي</th>
                      <th className="py-3 px-4">كود العينة</th>
                      <th className="py-3 px-4">الاعتماد والمطابقة</th>
                      <th className="py-3 px-4 text-center">الإجراءات والتقرير</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          <FlaskConical size={36} className="mx-auto mb-2 opacity-50" />
                          <p className="text-sm font-semibold">لم يتم العثور على أي فحوصات مخبرية مطابقة للفلاتر</p>
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map((t) => {
                        const associatedMaterial = materials.find(m => m.id === t.materialId);
                        const approval = t.approvalStatus || (t.status === "PASS" ? "Validated" : "Pending Review");
                        const sourceInfo = getTestSourceInfo(t);

                        return (
                          <tr key={t.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                            <td className="py-3 px-4">
                              <div className="font-mono font-bold text-blue-600 dark:text-blue-400">{t.id}</div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Calendar size={11} />
                                <span>{t.date}</span>
                              </div>
                            </td>

                            <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                              <div>{t.testTitleAr}</div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">{t.testTitleFr}</div>
                            </td>

                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-800 dark:text-slate-200">{t.materialName}</div>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold">
                                {t.materialCategory}
                              </span>
                            </td>

                            {/* Source Column */}
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black border ${sourceInfo.badgeBg} ${sourceInfo.badgeText} ${sourceInfo.badgeBorder}`}>
                                {sourceInfo.isDemo ? <FlaskConical size={11} /> : <User size={11} />}
                                <span>{sourceInfo.labelAr}</span>
                              </span>
                            </td>

                            <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                              {t.standard}
                            </td>

                            <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                              {t.sampleId}
                            </td>

                            <td className="py-3 px-4">
                              <div className="flex flex-col gap-1 items-start">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                                  approval === "Validated" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                                  : approval === "Pending Review" ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                                  : approval === "Draft" ? "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
                                  : "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                                }`}>
                                  {approval === "Validated" && <CheckCircle size={11} />}
                                  {approval === "Pending Review" && <AlertTriangle size={11} />}
                                  {approval === "FAIL" && <XCircle size={11} />}
                                  <span>{approval === "Validated" ? "معتمد (Validated)" : approval === "Pending Review" ? "قيد المراجعة" : approval === "Draft" ? "مسودة" : "مرفوض"}</span>
                                </span>

                                <span className="text-[9px] text-slate-400">
                                  قرار المطابقة: {t.status === "PASS" ? "مطابق" : t.status === "WARNING" ? "تحذيري" : "راسب"}
                                </span>
                              </div>
                            </td>

                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {approval !== "Validated" && onUpdateTestStatus && (
                                  <button
                                    onClick={() => {
                                      onUpdateTestStatus(t.id, "Validated");
                                    }}
                                    title="اعتماد الفحص وربطه مباشرة بخصائص المادة"
                                    className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                                  >
                                    <span>اعتماد</span>
                                  </button>
                                )}

                                <button
                                  onClick={() => setSelectedReportTest(t)}
                                  title="عرض التقرير وطباعة PDF"
                                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 transition cursor-pointer"
                                >
                                  <FileText size={15} />
                                </button>

                                {associatedMaterial && (
                                  <button
                                    onClick={() => setHistoryModalMaterial(associatedMaterial)}
                                    title="سجل وتاريخ فحوصات هذه المادة"
                                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                                  >
                                    <History size={15} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Material Characterization Quick Access Shelf */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-blue-500" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  مكتبة المواد وتوصيف الخصائص المخبرية (Material → Laboratory Tests)
                </h3>
              </div>
              
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setMaterialShelfFilter("all")}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    materialShelfFilter === "all" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500"
                  }`}
                >
                  الكل ({materials.length})
                </button>
                <button
                  onClick={() => setMaterialShelfFilter("user")}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    materialShelfFilter === "user" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500"
                  }`}
                >
                  مواد المستخدم ({userMaterials.length})
                </button>
                <button
                  onClick={() => setMaterialShelfFilter("demo")}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    materialShelfFilter === "demo" ? "bg-amber-600 text-white shadow-sm" : "text-slate-500"
                  }`}
                >
                  المواد النموذجية ({demoMaterials.length})
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {materials
                .filter(m => {
                  if (materialShelfFilter === "user") return isUserMaterial(m);
                  if (materialShelfFilter === "demo") return !isUserMaterial(m);
                  return true;
                })
                .map((m) => {
                  const count = testRecords.filter(t => t.materialId === m.id).length;
                  const matSource = getMaterialSourceInfo(m);

                  return (
                    <div
                      key={m.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-blue-400 dark:hover:border-blue-600 transition flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                            {m.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold shrink-0">
                            {m.category}
                          </span>
                        </div>

                        {/* Provenance Badge */}
                        <div className="mt-1.5">
                          <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded border ${matSource.badgeBg} ${matSource.badgeText} ${matSource.badgeBorder}`}>
                            {matSource.isDemo ? <FlaskConical size={9} /> : <User size={9} />}
                            <span>{matSource.labelAr}</span>
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
                          <span>الكثافة: {m.density || m.ssdDensity || 2650} kg/m³</span>
                          {m.moisture !== undefined && <span>رطوبة: {m.moisture}%</span>}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                        <span className="font-mono text-slate-500 text-[11px]">
                          {count} فحوصات مسجلة
                        </span>
                        <button
                          onClick={() => setHistoryModalMaterial(m)}
                          className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>عرض السجل</span>
                          <ChevronRight size={12} className="rotate-180" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

        </div>
      )}

      {/* Report Modal */}
      {selectedReportTest && (
        <TestReportModal
          testRecord={selectedReportTest}
          onClose={() => setSelectedReportTest(null)}
        />
      )}

      {/* Material Lab History Modal */}
      {historyModalMaterial && (
        <MaterialLabHistoryModal
          material={historyModalMaterial}
          tests={testRecords}
          onClose={() => setHistoryModalMaterial(null)}
          onRunNewTestForMaterial={(mat) => {
            setHistoryModalMaterial(null);
            handleStartTest(mat);
          }}
          onSyncPropertyToMaterial={onUpdateMaterialProperty}
          onUpdateTestStatus={onUpdateTestStatus}
        />
      )}

    </div>
  );
};
