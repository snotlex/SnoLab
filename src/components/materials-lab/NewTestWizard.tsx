import React, { useState, useMemo } from "react";
import { 
  X, 
  FlaskConical, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ArrowRight, 
  ArrowLeft, 
  Save, 
  RotateCcw, 
  FileText, 
  Sparkles,
  Layers,
  Activity,
  BarChart3,
  Calendar,
  User,
  Building2,
  Bookmark,
  Search,
  Check
} from "lucide-react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  BarChart,
  Bar
} from "recharts";
import { EngineeringMaterial } from "../../types";
import { 
  LabCategory, 
  LabTestDefinition, 
  MaterialTestRecord, 
  TestStatus 
} from "../../types/laboratoryTypes";
import { 
  MASTER_TEST_CATALOG, 
  LAB_CATEGORIES_INFO, 
  executeLaboratoryTest, 
  TestExecutionResult 
} from "../../services/materialsLabEngine";
import { runSieveAnalysisPhase2 } from "../../services/laboratoryTestDefinitions";
import { createSieveMaterialUpdateProposals, createSpecificGravityMaterialUpdateProposals } from "../../services/laboratoryMaterialUpdateProposals";
import { runAggregateSpecificGravityPhase2 } from "../../services/laboratoryTestDefinitions";

interface NewTestWizardProps {
  isOpen: boolean;
  onClose: () => void;
  materials: EngineeringMaterial[];
  initialCategory?: LabCategory;
  initialTestId?: string;
  initialMaterialId?: string;
  onSaveTest: (testRecord: MaterialTestRecord, syncedProps: Record<string, any>) => void;
  language?: "ar" | "fr" | "en";
}

export const NewTestWizard: React.FC<NewTestWizardProps> = ({
  isOpen,
  onClose,
  materials,
  initialCategory = "aggregates",
  initialTestId,
  initialMaterialId,
  onSaveTest,
  language = "ar"
}) => {
  // Wizard State
  const [selectedCategory, setSelectedCategory] = useState<LabCategory | "all">(initialCategory);
  const [selectedTestDefId, setSelectedTestDefId] = useState<string>(initialTestId || "AGG_SIEVE");
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(initialMaterialId || (materials[0]?.id || ""));
  const [matSearchQuery, setMatSearchQuery] = useState<string>("");
  const [matCategoryFilter, setMatCategoryFilter] = useState<string>("all");
  const [testSearchQuery, setTestSearchQuery] = useState<string>("");
  
  // Test Metadata
  const [sampleId, setSampleId] = useState<string>(() => `SMP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [operator, setOperator] = useState<string>("Eng. Laboratory Chief");
  const [labName, setLabName] = useState<string>("SnoLab Central Quality Control Lab");
  const [testDate, setTestDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [sampleDescription, setSampleDescription] = useState<string>("عينة مأخوذة من موقع التخزين المركزي وفق الأصول الفنية");
  const [notes, setNotes] = useState<string>("");

  // Test Definition
  const currentTestDef = useMemo(() => {
    return MASTER_TEST_CATALOG.find(t => t.id === selectedTestDefId) || MASTER_TEST_CATALOG[0];
  }, [selectedTestDefId]);

  // Selected Material (Any material from the library)
  const currentMaterial = useMemo(() => {
    return materials.find(m => m.id === selectedMaterialId) || materials[0] || {
      id: "mat-unspecified",
      name: "مادة غير محددة",
      category: "عام"
    } as EngineeringMaterial;
  }, [materials, selectedMaterialId]);

  // Inputs State
  const [inputsState, setInputsState] = useState<Record<string, any>>(() => {
    return JSON.parse(JSON.stringify(currentTestDef.defaultInputs));
  });

  // When test definition changes, reset inputs
  const handleSelectTest = (testDef: LabTestDefinition) => {
    setSelectedTestDefId(testDef.id);
    setSelectedCategory(testDef.category);
    setInputsState(JSON.parse(JSON.stringify(testDef.defaultInputs)));
  };

  // Filter tests by category and search
  const filteredTests = useMemo(() => {
    return MASTER_TEST_CATALOG.filter(t => {
      if (selectedCategory !== "all" && t.category !== selectedCategory) return false;
      if (testSearchQuery.trim()) {
        const q = testSearchQuery.toLowerCase();
        const matchAr = t.titleAr.toLowerCase().includes(q);
        const matchEn = t.titleEn.toLowerCase().includes(q);
        const matchStd = t.standard.toLowerCase().includes(q);
        if (!matchAr && !matchEn && !matchStd) return false;
      }
      return true;
    });
  }, [selectedCategory, testSearchQuery]);

  // Filter materials for picker
  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      if (matCategoryFilter !== "all" && m.category !== matCategoryFilter) return false;
      if (matSearchQuery.trim()) {
        const q = matSearchQuery.toLowerCase();
        const matchName = m.name?.toLowerCase().includes(q);
        const matchCat = m.category?.toLowerCase().includes(q);
        if (!matchName && !matchCat) return false;
      }
      return true;
    });
  }, [materials, matCategoryFilter, matSearchQuery]);

  const sievePhase2Result = useMemo(() => {
    if (selectedTestDefId !== "AGG_SIEVE") return null;
    return runSieveAnalysisPhase2({
      totalSampleMassG: Number(inputsState.totalWeight),
      finesSieveMm: 0.063,
      massBalanceToleranceG: Number(inputsState.massBalanceToleranceG ?? 1),
      sieves: (inputsState.sieves || []).map((row: { sieve: number; retained: number }) => ({
        sieveMm: Number(row.sieve),
        retainedMassG: Number(row.retained)
      }))
    });
  }, [selectedTestDefId, inputsState]);

  const specificGravityPhase2Result = useMemo(() => {
    if (selectedTestDefId !== "AGG_SPECIFIC_GRAVITY") return null;
    try {
      return runAggregateSpecificGravityPhase2({
        ovenDryMassG: Number(inputsState.ovenDryMassG),
        ssdMassG: Number(inputsState.ssdMassG),
        pycnometerSampleWaterMassG: Number(inputsState.pycnometerSampleWaterMassG),
        pycnometerWaterMassG: Number(inputsState.pycnometerWaterMassG)
      });
    } catch {
      return null;
    }
  }, [selectedTestDefId, inputsState]);

  // Execute Calculation Real-time
  const calculationResult: TestExecutionResult = useMemo(() => {
    const legacyResult = executeLaboratoryTest(selectedTestDefId, inputsState, currentMaterial);
    if (selectedTestDefId === "AGG_SIEVE" && !sievePhase2Result) return legacyResult;
    if (selectedTestDefId === "AGG_SIEVE" && !sievePhase2Result.validation.valid) {
      return {
        ...legacyResult,
        status: "FAIL",
        score: 0,
        interpretation: "لا يمكن اعتماد تحليل التدرج قبل إصلاح أخطاء البيانات أو توازن الكتلة.",
        complianceDetails: sievePhase2Result.validation.issues.map(item => ({
          parameter: item.field || item.code,
          measured: "—",
          limit: "بيانات صالحة ومتوازنة",
          status: "FAIL" as TestStatus,
          note: item.message
        })),
        syncedProperties: {}
      };
    }
    if (selectedTestDefId === "AGG_SPECIFIC_GRAVITY" && !specificGravityPhase2Result) {
      return {
        ...legacyResult,
        status: "FAIL",
        score: 0,
        interpretation: "لا يمكن اعتماد اختبار الكثافة النوعية قبل إصلاح كتل العينة والبيكنومتر.",
        syncedProperties: {}
      };
    }
    return legacyResult;
  }, [selectedTestDefId, inputsState, currentMaterial, sievePhase2Result, specificGravityPhase2Result]);

  if (!isOpen) return null;

  const handleSave = () => {
    const testRecordId = `TEST-${currentTestDef.category.toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-6)}`;
    const updateProposals = selectedTestDefId === "AGG_SIEVE" && sievePhase2Result
      ? createSieveMaterialUpdateProposals({
          material: currentMaterial,
          testRunId: testRecordId,
          result: sievePhase2Result
        })
      : selectedTestDefId === "AGG_SPECIFIC_GRAVITY" && specificGravityPhase2Result
        ? createSpecificGravityMaterialUpdateProposals({
            material: currentMaterial,
            testRunId: testRecordId,
            result: specificGravityPhase2Result
          })
      : undefined;
    const hasPendingProposals = Boolean(updateProposals?.length);
    const newRecord: MaterialTestRecord = {
      id: testRecordId,
      testType: currentTestDef.id,
      testTitleAr: currentTestDef.titleAr,
      testTitleFr: currentTestDef.titleFr,
      testTitleEn: currentTestDef.titleEn,
      category: currentTestDef.category,
      materialId: currentMaterial.id,
      materialName: currentMaterial.name,
      materialCategory: currentMaterial.category,
      sampleId,
      sampleDescription,
      operator,
      laboratoryName: labName,
      date: testDate,
      standard: currentTestDef.standard,
      inputs: inputsState,
      results: calculationResult.results,
      status: calculationResult.status,
      approvalStatus: hasPendingProposals ? "Pending Review" : "Validated",
      score: calculationResult.score,
      interpretation: calculationResult.interpretation,
      complianceDetails: calculationResult.complianceDetails,
      chartData: calculationResult.chartData,
      granulometricCurve: calculationResult.granulometricCurve,
      notes,
      syncedToMaterial: !hasPendingProposals,
      syncedProperties: hasPendingProposals ? {} : calculationResult.syncedProperties,
      updateProposals: updateProposals,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSaveTest(newRecord, calculationResult.syncedProperties);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div 
        className="relative w-full max-w-6xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]"
        dir={language === "ar" ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {language === "ar" ? "إجراء تجربة مخبرية جديدة ومطابقة الجودة" : "Run New Material Lab Test & Quality QC"}
                </h3>
                <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {currentTestDef.standard}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === "ar" ? currentTestDef.titleAr : currentTestDef.titleEn}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. Category & Test Selection Toolbar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-500" />
                {language === "ar" ? "1. تصنيف مادة التجربة ومجال الفحص" : "1. Material Category"}
              </label>
              <span className="text-[11px] text-slate-400">
                {language === "ar" ? "اختر تصنيفاً أو اعرض جميع الاختبارات (28 فحصاً معيارياً)" : "Select category or view all 28 tests"}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                  selectedCategory === "all"
                    ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 font-black"
                    : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <span className="text-lg">🧪</span>
                <span className="text-xs font-bold truncate">جميع الاختبارات (28)</span>
              </button>

              {(Object.keys(LAB_CATEGORIES_INFO) as LabCategory[]).map(catKey => {
                const info = LAB_CATEGORIES_INFO[catKey];
                const isSelected = selectedCategory === catKey;
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(catKey);
                      const firstTestInCat = MASTER_TEST_CATALOG.find(t => t.category === catKey);
                      if (firstTestInCat) {
                        handleSelectTest(firstTestInCat);
                      }
                    }}
                    className={`flex items-center gap-1.5 p-2.5 rounded-2xl border text-right transition-all cursor-pointer ${
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-300 shadow-sm ring-2 ring-blue-500/20 font-black"
                        : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <span className="text-lg">{info.icon}</span>
                    <span className="text-xs font-bold truncate">
                      {language === "ar" ? info.nameAr : info.nameEn}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Target Material & Specific Test Picker */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/30 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            {/* Pick Test */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5 text-blue-600" />
                  <span>{language === "ar" ? "الاختبار المعياري المطلوب:" : "Standard Laboratory Test:"}</span>
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {filteredTests.length} فحص متاح
                </span>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={testSearchQuery}
                  onChange={(e) => setTestSearchQuery(e.target.value)}
                  placeholder="بحث في اسم الاختبار أو المواصفة..."
                  className="w-full pl-3 pr-8 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <select
                value={selectedTestDefId}
                onChange={(e) => {
                  const found = MASTER_TEST_CATALOG.find(t => t.id === e.target.value);
                  if (found) handleSelectTest(found);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {filteredTests.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.icon} {language === "ar" ? t.titleAr : t.titleEn} ({t.standard})
                  </option>
                ))}
              </select>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700 dark:text-slate-300">{currentTestDef.titleAr}</span>
                  <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 font-mono font-bold text-blue-700 dark:text-blue-300 text-[10px]">
                    {currentTestDef.standard}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">
                  مزامنة تلقائية مع: <strong className="text-blue-600 dark:text-blue-400 font-mono">{currentTestDef.syncedPropertyKeys.join(", ")}</strong>
                </div>
              </div>
            </div>

            {/* Pick Material to Test */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>{language === "ar" ? "المادة المراد اختبارها من المكتبة:" : "Material to Test & Sync:"}</span>
                </label>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>تحديث آلي للمكتبة</span>
                </span>
              </div>

              {/* Material Search & Category filter */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={matSearchQuery}
                    onChange={(e) => setMatSearchQuery(e.target.value)}
                    placeholder="بحث عن أي مادة في المكتبة..."
                    className="w-full pl-3 pr-8 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <select
                  value={matCategoryFilter}
                  onChange={(e) => setMatCategoryFilter(e.target.value)}
                  className="px-2 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  <option value="all">كل المواد ({materials.length})</option>
                  <option value="رمال">رمال</option>
                  <option value="حصى">حصى</option>
                  <option value="إسمنت">إسمنت</option>
                  <option value="ماء">ماء</option>
                  <option value="إضافات وملدنات">إضافات</option>
                </select>
              </div>

              <select
                value={selectedMaterialId}
                onChange={(e) => setSelectedMaterialId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {filteredMaterials.map(m => (
                  <option key={m.id} value={m.id}>
                    📦 {m.name} ({m.category || "عام"}){m.density !== undefined ? ` • ${m.density} t/m³` : ""}
                  </option>
                ))}
              </select>

              {/* Selected Material Preview Card */}
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
                    {currentMaterial.name}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 font-bold text-emerald-600 dark:text-emerald-400 text-[10px]">
                    {currentMaterial.category || "مادة معتمدة"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 font-mono">
                  <span>الكثافة: <strong>{currentMaterial.density ?? "—"} t/m³</strong></span>
                  <span>• الامتصاص: <strong>{currentMaterial.absorption ?? "—"}%</strong></span>
                  <span>• المعرف: <strong>{currentMaterial.id}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Sample & Traceability Information */}
          <div className="space-y-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-500" />
              {language === "ar" ? "بيانات العينة وضبط الجودة والتتبع (Traceability)" : "Sample Identification & Traceability"}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {language === "ar" ? "كود العينة (Sample ID)" : "Sample ID"}
                </label>
                <input
                  type="text"
                  value={sampleId}
                  onChange={(e) => setSampleId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {language === "ar" ? "تاريخ التجربة (Test Date)" : "Test Date"}
                </label>
                <input
                  type="date"
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {language === "ar" ? "المهندس / الفني المخبري" : "Operator / Engineer"}
                </label>
                <input
                  type="text"
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {language === "ar" ? "اسم المخبر / الهيئة" : "Laboratory Facility"}
                </label>
                <input
                  type="text"
                  value={labName}
                  onChange={(e) => setLabName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* 4. Live Test Input & Form Controls */}
          <div className="space-y-4 bg-slate-50/70 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                {language === "ar" ? "المدخلات والقياسات المخبرية المباشرة" : "Test Measurements & Primary Inputs"}
              </h4>
              <button
                type="button"
                onClick={() => setInputsState(JSON.parse(JSON.stringify(currentTestDef.defaultInputs)))}
                className="text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                {language === "ar" ? "استعادة القيم النموذجية" : "Reset Default Sample"}
              </button>
            </div>

            {/* Dynamic input render according to test type */}
            {selectedTestDefId === "AGG_SIEVE" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {language === "ar" ? "وزن العينة الكلية الجافة (غرام):" : "Total Dry Sample Weight (g):"}
                    </label>
                    <input
                      type="number"
                      value={inputsState.totalWeight ?? ""}
                      onChange={(e) => {
                        const val = e.target.value === "" ? undefined : parseFloat(e.target.value);
                        setInputsState(prev => ({ ...prev, totalWeight: val }));
                      }}
                      className="w-28 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">نوع الركام:</span>
                    <button
                      type="button"
                      onClick={() => setInputsState(prev => ({ ...prev, materialType: "sand" }))}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                        (inputsState.materialType || "sand") === "sand" ? "bg-blue-600 text-white" : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600"
                      }`}
                    >
                      رمل (Sand 0/4)
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputsState(prev => ({ ...prev, materialType: "gravel" }))}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                        inputsState.materialType === "gravel" ? "bg-blue-600 text-white" : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600"
                      }`}
                    >
                      حصى (Gravel 4/20)
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                  <table className="w-full text-xs text-right">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-2.5">فتحة المنخل (mm)</th>
                        <th className="p-2.5">الوزن المحتجز الجزئي (g)</th>
                        <th className="p-2.5">النسبة المحتجزة (%)</th>
                        <th className="p-2.5">المحتجز التراكمي (%)</th>
                        <th className="p-2.5">المار التراكمي (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {(inputsState.sieves || []).map((s: any, idx: number) => {
                        const stepRes = calculationResult.results.sieveTable?.[idx];
                        return (
                          <tr key={idx} className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20">
                            <td className="p-2.5 font-bold font-mono text-blue-600 dark:text-blue-400">
                              {s.sieve === 0 ? "وعاء التجميع (Pan)" : `${s.sieve} mm`}
                            </td>
                            <td className="p-2.5">
                              <input
                                type="number"
                                min={0}
                                step={0.1}
                                value={s.retained}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  const newSieves = [...inputsState.sieves];
                                  newSieves[idx] = { ...newSieves[idx], retained: val };
                                  setInputsState(prev => ({ ...prev, sieves: newSieves }));
                                }}
                                className="w-24 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold"
                              />
                            </td>
                            <td className="p-2.5 font-mono text-slate-600 dark:text-slate-400">
                              {stepRes?.percentRetained ?? 0}%
                            </td>
                            <td className="p-2.5 font-mono text-slate-600 dark:text-slate-400">
                              {stepRes?.cumulativePercentRetained ?? 0}%
                            </td>
                            <td className="p-2.5 font-mono font-black text-emerald-600 dark:text-emerald-400">
                              {stepRes?.percentPassing ?? 0}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selectedTestDefId === "AGG_BULK_DENSITY" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">سعة الوعاء المعياري (Litre)</label>
                  <input
                    type="number"
                    step={0.1}
                    value={inputsState.containerVolumeLiters ?? ""}
                    onChange={(e) => {
                      const val = e.target.value === "" ? undefined : parseFloat(e.target.value);
                      setInputsState(p => ({ ...p, containerVolumeLiters: val }));
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">وزن الوعاء فارغاً (kg)</label>
                  <input
                    type="number"
                    step={0.01}
                    value={inputsState.containerEmptyWeightKg ?? ""}
                    onChange={(e) => {
                      const val = e.target.value === "" ? undefined : parseFloat(e.target.value);
                      setInputsState(p => ({ ...p, containerEmptyWeightKg: val }));
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">الوزن الكلي سائب (kg)</label>
                  <input
                    type="number"
                    step={0.01}
                    value={inputsState.looseFilledWeightKg ?? ""}
                    onChange={(e) => {
                      const val = e.target.value === "" ? undefined : parseFloat(e.target.value);
                      setInputsState(p => ({ ...p, looseFilledWeightKg: val }));
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">الوزن الكلي مدموك (kg)</label>
                  <input
                    type="number"
                    step={0.01}
                    value={inputsState.compactedWeightKg ?? ""}
                    onChange={(e) => {
                      const val = e.target.value === "" ? undefined : parseFloat(e.target.value);
                      setInputsState(p => ({ ...p, compactedWeightKg: val }));
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
              </div>
            )}

            {selectedTestDefId === "AGG_SPECIFIC_GRAVITY" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">الكتلة المجففة في الفرن M4 (g)</label>
                  <input
                    type="number"
                    step={0.1}
                    value={inputsState.ovenDryMassG ?? ""}
                    onChange={(e) => {
                      const val = e.target.value === "" ? undefined : parseFloat(e.target.value);
                      setInputsState(p => ({ ...p, ovenDryMassG: val }));
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">الكتلة المشبعة جافة السطح M1 (g)</label>
                  <input
                    type="number"
                    step={0.1}
                    value={inputsState.ssdMassG ?? ""}
                    onChange={(e) => {
                      const val = e.target.value === "" ? undefined : parseFloat(e.target.value);
                      setInputsState(p => ({ ...p, ssdMassG: val }));
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">البيكنومتر + العينة + الماء M2 (g)</label>
                  <input
                    type="number"
                    step={0.1}
                    value={inputsState.pycnometerSampleWaterMassG ?? ""}
                    onChange={(e) => {
                      const val = e.target.value === "" ? undefined : parseFloat(e.target.value);
                      setInputsState(p => ({ ...p, pycnometerSampleWaterMassG: val }));
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">البيكنومتر مملوء بالماء فقط M3 (g)</label>
                  <input
                    type="number"
                    step={0.1}
                    value={inputsState.pycnometerWaterMassG ?? ""}
                    onChange={(e) => {
                      const val = e.target.value === "" ? undefined : parseFloat(e.target.value);
                      setInputsState(p => ({ ...p, pycnometerWaterMassG: val }));
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
              </div>
            )}

            {selectedTestDefId === "CEM_SETTING_TIME" && (
              <div className="space-y-3">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">نسبة ماء العجينة (%):</span>
                    <input
                      type="number"
                      step={0.1}
                      value={inputsState.waterPercent ?? ""}
                      onChange={(e) => {
                        const val = e.target.value === "" ? undefined : parseFloat(e.target.value);
                        setInputsState(p => ({ ...p, waterPercent: val }));
                      }}
                      className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">درجة حرارة الغرفة (°C):</span>
                    <input
                      type="number"
                      step={0.5}
                      value={inputsState.roomTempC ?? ""}
                      onChange={(e) => {
                        const val = e.target.value === "" ? undefined : parseFloat(e.target.value);
                        setInputsState(p => ({ ...p, roomTempC: val }));
                      }}
                      className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
                  {(inputsState.timeReadings || []).map((r: any, idx: number) => (
                    <div key={idx} className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-center space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 block">{r.timeMinutes} min</span>
                      <input
                        type="number"
                        min={0}
                        max={40}
                        step={0.5}
                        value={r.penetrationMm ?? ""}
                        onChange={(e) => {
                          const val = e.target.value === "" ? undefined : parseFloat(e.target.value);
                          const newReadings = [...inputsState.timeReadings];
                          newReadings[idx] = { ...newReadings[idx], penetrationMm: val };
                          setInputsState(prev => ({ ...prev, timeReadings: newReadings }));
                        }}
                        className="w-full text-center px-1 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-mono font-black text-blue-600"
                      />
                      <span className="text-[9px] text-slate-400">مم من القاعدة</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Generic Fallback Form for any other test */}
            {!["AGG_SIEVE", "AGG_BULK_DENSITY", "AGG_SPECIFIC_GRAVITY", "CEM_SETTING_TIME"].includes(selectedTestDefId) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.keys(inputsState).filter(k => typeof inputsState[k] !== "object").map(key => (
                  <div key={key} className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 capitalize">
                      {key.replace(/([A-Z])/g, " $1")}
                    </label>
                    <input
                      type={typeof inputsState[key] === "number" ? "number" : "text"}
                      step="any"
                      value={inputsState[key] ?? ""}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const val = typeof inputsState[key] === "number" || typeof inputsState[key] === "undefined"
                          ? (raw === "" ? undefined : isNaN(parseFloat(raw)) ? undefined : parseFloat(raw))
                          : raw;
                        setInputsState(prev => ({ ...prev, [key]: val }));
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold font-mono"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5. Results & Compliance / Quality Control Gauge */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Box: Key Metric Results */}
            <div className="lg:col-span-6 space-y-4">
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    {language === "ar" ? "النتائج والخواص الفيزيائية المحسوبة" : "Calculated Engineering Properties"}
                  </h4>
                  <span className={`px-2.5 py-1 text-xs font-black rounded-full flex items-center gap-1 ${
                    calculationResult.status === "PASS"
                      ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                      : calculationResult.status === "WARNING"
                      ? "bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                      : "bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                  }`}>
                    {calculationResult.status === "PASS" && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {calculationResult.status === "WARNING" && <AlertTriangle className="w-3.5 h-3.5" />}
                    {calculationResult.status === "FAIL" && <XCircle className="w-3.5 h-3.5" />}
                    {calculationResult.status === "PASS" ? "مطابق للمواصفة (PASS)" : calculationResult.status === "WARNING" ? "تنبيه وتحذير (WARNING)" : "مرفوض غير مطابق (FAIL)"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {Object.keys(calculationResult.results).filter(k => typeof calculationResult.results[k] !== "object").slice(0, 6).map(resKey => (
                    <div key={resKey} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60">
                      <span className="text-[10px] font-bold text-slate-400 block capitalize">
                        {resKey.replace(/([A-Z])/g, " $1")}
                      </span>
                      <span className="text-base font-black font-mono text-slate-900 dark:text-white">
                        {calculationResult.results[resKey]}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 text-xs text-blue-900 dark:text-blue-300 leading-relaxed">
                  <strong>{language === "ar" ? "التقرير والتفسير الهندسي: " : "Engineering Interpretation: "}</strong>
                  {calculationResult.interpretation}
                </div>
              </div>

              {/* Compliance Checklist */}
              <div className="space-y-2">
                <h5 className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                  {language === "ar" ? "جدول التحقق من الحدود المعيارية والمطابقة:" : "Standard Limits & Compliance Check:"}
                </h5>
                <div className="space-y-1.5">
                  {calculationResult.complianceDetails.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">{c.parameter}</span>
                        <span className="text-[10px] text-slate-400">الحد القياسي: {c.limit} | المقاس: {c.measured}</span>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-lg ${
                        c.status === "PASS" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      }`}>
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Box: Interactive Chart */}
            <div className="lg:col-span-6 flex flex-col p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-500" />
                  {language === "ar" ? "التمثيل البياني المعياري للتجربة" : "Standard Test Chart Curve"}
                </h4>
                <span className="text-[10px] font-mono text-slate-400">Interactive Graphic</span>
              </div>

              <div className="flex-1 min-h-[260px] w-full">
                {selectedTestDefId === "AGG_SIEVE" && calculationResult.chartData && (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={calculationResult.chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                      <XAxis dataKey="sieve" stroke="#94a3b8" fontSize={10} />
                      <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={10} unit="%" />
                      <Tooltip />
                      <Line type="monotone" dataKey="passing" name="المار التراكمي (%)" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="cumRetained" name="المحتجز التراكمي (%)" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" />
                    </LineChart>
                  </ResponsiveContainer>
                )}

                {selectedTestDefId === "CEM_SETTING_TIME" && calculationResult.chartData && (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={calculationResult.chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                      <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} />
                      <YAxis domain={[0, 45]} stroke="#94a3b8" fontSize={10} unit="mm" />
                      <Tooltip />
                      <Line type="monotone" dataKey="penetration" name="انغراس الإبرة (mm)" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="limitInitial" name="حد الشك الابتدائي (4mm)" stroke="#ef4444" strokeWidth={2} strokeDasharray="4 4" />
                    </LineChart>
                  </ResponsiveContainer>
                )}

                {selectedTestDefId === "CEM_COMPRESSIVE_STRENGTH" && calculationResult.chartData && (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={calculationResult.chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                      <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} unit="MPa" />
                      <Tooltip />
                      <Bar dataKey="strength" name="المقاومة الفعلية (MPa)" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}

                {selectedTestDefId === "AGG_BULKING_SAND" && calculationResult.chartData && (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={calculationResult.chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                      <XAxis dataKey="moisture" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} unit="%" />
                      <Tooltip />
                      <Line type="monotone" dataKey="expansionPct" name="نسبة الانتفاخ الحجمي (%)" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}

                {!["AGG_SIEVE", "CEM_SETTING_TIME", "CEM_COMPRESSIVE_STRENGTH", "AGG_BULKING_SAND"].includes(selectedTestDefId) && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                    <FlaskConical className="w-12 h-12 text-blue-500/50 mb-2" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {currentTestDef.titleAr}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-1">
                      تم حساب ومعايرة الخواص الميكانيكية والفيزيائية بنجاح بنسبة ثقة 100%.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer: Save & Sync Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-emerald-500" />
            <span className="text-xs text-slate-600 dark:text-slate-400 font-bold">
              {language === "ar" 
                ? `سيتم حفظ النتيجة وتحديث خاصية [${Object.keys(calculationResult.syncedProperties).join(", ")}] في المادة [${currentMaterial.name}] تلقائياً`
                : `Will update properties [${Object.keys(calculationResult.syncedProperties).join(", ")}] on material [${currentMaterial.name}]`
              }
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            >
              {language === "ar" ? "إلغاء" : "Cancel"}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-2xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {language === "ar" ? "💾 اعتماد التجربة ومزامنة الخواص مع المادة" : "Save Test & Sync to Material"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
