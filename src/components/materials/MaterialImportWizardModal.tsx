import React, { useState, useRef } from "react";
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Info, 
  ArrowRight, 
  ArrowLeft, 
  RefreshCw, 
  ShieldCheck, 
  Database, 
  Layers, 
  Check, 
  X,
  FileCheck,
  FileText,
  Sparkles,
  HelpCircle,
  Eye
} from "lucide-react";
import { ImportService, ImportAnalysisReport, DuplicateResolutionStrategy } from "../../services/ImportService";
import { MaterialService } from "../../services/MaterialService";
import { ImportManager } from "../../services/import/ImportManager";
import { ParsedMaterialDraft, ImportPipelineReport, DuplicateMatch } from "../../services/import/types";
import { EngineeringMaterial } from "../../types";
import { CompletenessChecker, LibraryCompletenessReport } from "../../services/import/CompletenessChecker";
import { MaterialBulkCompletionModal } from "./MaterialBulkCompletionModal";

interface MaterialImportWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (importedMaterials: EngineeringMaterial[]) => void;
  language?: string;
}

const CATEGORY_OPTIONS = [
  "إسمنت",
  "رمال",
  "حصى",
  "إضافات كيميائية",
  "إضافات معدنية",
  "ألياف",
  "ماء",
  "ركام خفيف",
  "ركام ثقيل",
  "مواد مالئة",
  "أخرى"
];

export const MaterialImportWizardModal: React.FC<MaterialImportWizardModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  language = "ar"
}) => {
  const [step, setStep] = useState<number>(1);
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [progressMsg, setProgressMsg] = useState<string>("");
  const [progressPercent, setProgressPercent] = useState<number>(0);
  
  const [analysisReport, setAnalysisReport] = useState<ImportAnalysisReport | null>(null);
  const [pipelineReport, setPipelineReport] = useState<ImportPipelineReport | null>(null);
  const [drafts, setDrafts] = useState<ParsedMaterialDraft[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [duplicateStrategies, setDuplicateStrategies] = useState<Record<string, DuplicateResolutionStrategy>>({});
  const [importSummary, setImportSummary] = useState<{ importedCount: number; updatedCount: number; skippedCount: number } | null>(null);
  const [activeTab, setActiveTab] = useState<"materials" | "errors" | "duplicates" | "unmapped">("materials");
  const [selectedDraftForDetail, setSelectedDraftForDetail] = useState<ParsedMaterialDraft | null>(null);
  const [currentImportedMaterials, setCurrentImportedMaterials] = useState<EngineeringMaterial[]>([]);
  const [postImportReport, setPostImportReport] = useState<LibraryCompletenessReport | null>(null);
  const [isBulkCompletionOpen, setIsBulkCompletionOpen] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const isAr = language === "ar";

  const handleFileSelected = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsAnalyzing(true);
    setProgressMsg(isAr ? "جاري قراءة وفحص ملف المستند..." : "Reading and analyzing file...");
    setProgressPercent(10);

    try {
      const existingMaterials = MaterialService.getAllMaterials().map(m => MaterialService.toEngineeringMaterial(m));
      
      const report = await ImportService.analyzeFile(
        selectedFile,
        existingMaterials,
        (msg, pct) => {
          setProgressMsg(msg);
          setProgressPercent(pct);
        }
      );

      setAnalysisReport(report);

      if (report.pipelineReport) {
        setPipelineReport(report.pipelineReport);
        setDrafts(report.pipelineReport.drafts);
        setDuplicates(report.pipelineReport.duplicates);

        const initialStrategies: Record<string, DuplicateResolutionStrategy> = {};
        report.pipelineReport.duplicates.forEach(d => {
          initialStrategies[d.importedDraftId] = d.suggestedResolution === "IMPORT_NEW" ? "CREATE_NEW_ID" : "UPDATE_EXISTING";
        });
        setDuplicateStrategies(initialStrategies);
      }

      setStep(2);
    } catch (err: any) {
      console.error("Analysis error:", err);
      alert(isAr ? `حدث خطأ أثناء قراءة الملف: ${err.message}` : `Error reading file: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleToggleDraftSelect = (draftId: string) => {
    setDrafts(prev => prev.map(d => d.id === draftId ? { ...d, selectedForImport: !d.selectedForImport } : d));
  };

  const handleUpdateCategory = (draftId: string, newCategory: string) => {
    setDrafts(prev => prev.map(d => {
      if (d.id === draftId) {
        return {
          ...d,
          category: newCategory,
          categoryNeedsReview: false,
          status: d.validation.errors.length > 0 ? "Invalid" : "Complete"
        };
      }
      return d;
    }));
  };

  const handleApplyBulkDuplicateStrategy = (strategy: DuplicateResolutionStrategy) => {
    const updated: Record<string, DuplicateResolutionStrategy> = {};
    duplicates.forEach(d => {
      updated[d.importedDraftId] = strategy;
    });
    setDuplicateStrategies(updated);
  };

  const handleExecuteImport = () => {
    if (!analysisReport) return;

    let updatedList: EngineeringMaterial[] = [];

    if (pipelineReport) {
      const existingMaterials = MaterialService.getAllMaterials().map(m => MaterialService.toEngineeringMaterial(m));
      const result = ImportManager.executeImport({
        drafts,
        duplicates: duplicates.map(d => ({
          ...d,
          chosenResolution: duplicateStrategies[d.importedDraftId] === "CREATE_NEW_ID" 
            ? "IMPORT_NEW" 
            : duplicateStrategies[d.importedDraftId] === "SKIP" 
              ? "SKIP" 
              : "REPLACE"
        })),
        existingMaterials
      });

      setImportSummary({
        importedCount: result.importedCount,
        updatedCount: result.updatedCount,
        skippedCount: result.skippedCount
      });

      updatedList = result.updatedMaterialsList;
      onImportComplete(result.updatedMaterialsList);
    } else {
      const result = ImportService.executeImport(
        analysisReport.materialsToImport,
        duplicateStrategies
      );
      setImportSummary(result);

      const allMaterials = MaterialService.getAllMaterials().map(m => MaterialService.toEngineeringMaterial(m));
      updatedList = allMaterials;
      onImportComplete(allMaterials);
    }

    setCurrentImportedMaterials(updatedList);
    const auditReport = CompletenessChecker.inspectLibrary(updatedList);
    setPostImportReport(auditReport);

    setStep(4);
  };

  const isPdf = file?.name?.toLowerCase().endsWith(".pdf") || analysisReport?.fileType === "PDF";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto" dir={isAr ? "rtl" : "ltr"}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${isPdf ? "bg-rose-600 shadow-rose-500/20" : "bg-blue-600 shadow-blue-500/20"} text-white flex items-center justify-center shadow-md`}>
              {isPdf ? <FileText className="w-5 h-5" /> : <FileSpreadsheet className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                {isAr ? "معالج استيراد المواد الهندسي المتقدم" : "Advanced Engineering Material Import Wizard"}
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  {isAr ? "ضمان عدم فقدان البيانات" : "Zero Data Loss"}
                </span>
                {pipelineReport?.hasOcrItems && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>OCR / الرؤية الحاسوبية</span>
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr 
                  ? "فحص متعدد المراحل • دعم Excel و PDF • كشف التكرار • التحقق من معايير درو-غوريس" 
                  : "Multi-step pipeline • Excel & PDF support • Duplicate resolution • Dreux-Gorisse validation"}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps Progress Bar */}
        <div className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-medium">
          <div className={`flex items-center gap-2 ${step >= 1 ? "text-blue-600 dark:text-blue-400 font-bold" : "text-slate-400"}`}>
            <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px]">1</span>
            <span>{isAr ? "اختيار الملف" : "Select File"}</span>
          </div>
          <div className="h-px bg-slate-300 dark:bg-slate-700 flex-1 mx-3" />
          <div className={`flex items-center gap-2 ${step >= 2 ? "text-blue-600 dark:text-blue-400 font-bold" : "text-slate-400"}`}>
            <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px]">2</span>
            <span>{isAr ? "المعاينة والتحقق" : "Preview & Validation"}</span>
          </div>
          <div className="h-px bg-slate-300 dark:bg-slate-700 flex-1 mx-3" />
          <div className={`flex items-center gap-2 ${step >= 3 ? "text-blue-600 dark:text-blue-400 font-bold" : "text-slate-400"}`}>
            <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px]">3</span>
            <span>{isAr ? "إدارة التكرار" : "Duplicate Resolution"}</span>
          </div>
          <div className="h-px bg-slate-300 dark:bg-slate-700 flex-1 mx-3" />
          <div className={`flex items-center gap-2 ${step >= 4 ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-slate-400"}`}>
            <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px]">4</span>
            <span>{isAr ? "اكتمال الاستيراد" : "Completed"}</span>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {/* STEP 1: Select File */}
          {step === 1 && (
            <div className="flex flex-col items-center justify-center py-10">
              <div 
                onClick={() => !isAnalyzing && fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (e.dataTransfer.files?.[0] && !isAnalyzing) {
                    handleFileSelected(e.dataTransfer.files[0]);
                  }
                }}
                className={`w-full max-w-xl p-8 border-2 border-dashed rounded-2xl text-center transition-all flex flex-col items-center gap-4 ${
                  isAnalyzing 
                    ? "border-blue-500 bg-blue-50/30 dark:bg-blue-950/20 cursor-wait" 
                    : "border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50/50 dark:bg-slate-800/20 cursor-pointer hover:shadow-lg"
                }`}
              >
                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner">
                  {isAnalyzing ? <RefreshCw className="w-8 h-8 animate-spin" /> : <Upload className="w-8 h-8" />}
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    {isAnalyzing 
                      ? (progressMsg || (isAr ? "جارٍ تحليل الملف وفحص الجداول..." : "Analyzing workbook structure..."))
                      : (isAr ? "اسحب وأسقط ملف Excel أو PDF هنا، أو انقر للاختيار" : "Drag and drop Excel or PDF file here, or click to browse")}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {isAr 
                      ? "يدعم جداول Excel متعددة الأوراق (.xlsx, .xls, .csv)، ملفات JSON، وتقارير المختبرات بصيغة PDF (جداول ونصوص ممسوحة ضوئياً OCR)"
                      : "Supports multi-sheet Excel (.xlsx, .xls, .csv), JSON, and PDF laboratory test reports (tables & scanned OCR)"}
                  </p>
                </div>

                {isAnalyzing && (
                  <div className="w-full max-w-sm space-y-1.5">
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono font-bold">
                      {progressPercent}%
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-slate-500 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">.xlsx</span>
                  <span>•</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">.xls</span>
                  <span>•</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">.csv</span>
                  <span>•</span>
                  <span className="font-semibold text-rose-600 dark:text-rose-400">.pdf</span>
                  <span>•</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">.json</span>
                </div>

                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".xlsx,.xls,.csv,.json,.pdf"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileSelected(e.target.files[0]);
                    }
                  }}
                />
              </div>

              {/* Zero data loss promise box */}
              <div className="mt-8 max-w-xl w-full p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 flex items-start gap-3 text-xs text-blue-800 dark:text-blue-300">
                <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block mb-0.5">
                    {isAr ? "قاعدة عدم فقدان أي معلومة (Zero Data Loss Policy):" : "Zero Data Loss Policy:"}
                  </span>
                  {isAr 
                    ? "القيمة 0 تُعتبر قياساً صالحاً ولن تُحذف. الخصائص غير المعروفة تُحفظ في 'الخصائص الإضافية'. التقرير الأصلي يوثق المصدر ورقم السطر/الصفحة بدقة."
                    : "Zero values (0) are valid measurements and are never dropped. Unknown columns are preserved in Extra Properties. Source file, sheet/page, and row tracking are 100% maintained."}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Preview & Validation */}
          {step === 2 && analysisReport && (
            <div className="space-y-4">
              {/* Report Stats Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] text-slate-500 block">{isAr ? "نوع الملف والهيكل" : "Detected Structure"}</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate block">
                    {isPdf ? (isAr ? "مستند PDF مخبري" : "PDF Lab Report") : (isAr ? "مصنف Excel / جداول" : "Excel Spreadsheet")}
                  </span>
                  <span className="text-[10px] text-blue-600 font-medium">
                    {analysisReport.totalSheetsFound.length} {isPdf ? (isAr ? "صفحات" : "pages") : (isAr ? "أوراق عمل" : "sheets")}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] text-slate-500 block">{isAr ? "المواد المكتشفة" : "Materials Detected"}</span>
                  <span className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    {drafts.length > 0 ? drafts.length : analysisReport.totalMaterialsDetected}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-medium block">
                    {drafts.reduce((acc, d) => acc + Object.keys(d.properties).length, 0)} {isAr ? "خاصية هندسية موثقة" : "verified properties"}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] text-slate-500 block">{isAr ? "التطابق والتكرار" : "Duplicates Found"}</span>
                  <span className={`text-xl font-bold ${duplicates.length > 0 ? "text-amber-600" : "text-slate-800 dark:text-slate-100"}`}>
                    {duplicates.length}
                  </span>
                  <span className="text-[10px] text-slate-500 block">{isAr ? "تتطلب قراراً للدمج أو التحديث" : "Requires resolution"}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] text-slate-500 block">{isAr ? "التحقق الهندسي" : "Validation"}</span>
                  <span className={`text-sm font-bold flex items-center gap-1.5 ${analysisReport.errors.length > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                    {analysisReport.errors.length > 0 ? (
                      <>
                        <XCircle className="w-4 h-4" />
                        {analysisReport.errors.length} {isAr ? "أخطاء حرجة" : "critical errors"}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        {isAr ? "صالح للاستيراد" : "Ready to import"}
                      </>
                    )}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {drafts.filter(d => d.validation.isEligibleForDreuxGorisse).length} / {drafts.length} {isAr ? "جاهز لدرو-غوريس" : "Dreux ready"}
                  </span>
                </div>
              </div>

              {/* Subtabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-700 text-xs font-semibold gap-4">
                <button
                  onClick={() => setActiveTab("materials")}
                  className={`pb-2 transition-colors relative ${activeTab === "materials" ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-500 hover:text-slate-800"}`}
                >
                  {isAr ? "قائمة المواد المكتشفة" : "Discovered Materials"} ({drafts.length})
                </button>
                <button
                  onClick={() => setActiveTab("errors")}
                  className={`pb-2 transition-colors relative ${activeTab === "errors" ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-500 hover:text-slate-800"}`}
                >
                  {isAr ? "سجل الأخطاء والتحذيرات" : "Errors & Warnings"} ({analysisReport.errors.length + analysisReport.warnings.length})
                </button>
                <button
                  onClick={() => setActiveTab("duplicates")}
                  className={`pb-2 transition-colors relative ${activeTab === "duplicates" ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-500 hover:text-slate-800"}`}
                >
                  {isAr ? "المواد المكررة" : "Duplicates"} ({duplicates.length})
                </button>
                {(analysisReport.unmappedColumns.length > 0 || (pipelineReport && pipelineReport.unmappedHeaders.length > 0)) && (
                  <button
                    onClick={() => setActiveTab("unmapped")}
                    className={`pb-2 transition-colors relative ${activeTab === "unmapped" ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    {isAr ? "الخصائص الإضافية المحفوظة" : "Preserved Extra Props"} ({pipelineReport?.unmappedHeaders.length || analysisReport.unmappedColumns.length})
                  </button>
                )}
              </div>

              {/* Tab 1: Materials Preview */}
              {activeTab === "materials" && (
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                  <table className="w-full text-xs text-right" dir={isAr ? "rtl" : "ltr"}>
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold sticky top-0">
                      <tr>
                        <th className="p-2.5 w-8">
                          <input 
                            type="checkbox"
                            checked={drafts.length > 0 && drafts.every(d => d.selectedForImport)}
                            onChange={(e) => {
                              const check = e.target.checked;
                              setDrafts(prev => prev.map(d => ({ ...d, selectedForImport: check })));
                            }}
                            className="rounded border-slate-300 text-blue-600"
                          />
                        </th>
                        <th className="p-2.5">{isAr ? "المادة" : "Name"}</th>
                        <th className="p-2.5">{isAr ? "الصنف الهندسي" : "Category"}</th>
                        <th className="p-2.5">{isAr ? "المصدر / التتبع" : "Source Tracking"}</th>
                        <th className="p-2.5">{isAr ? "الخصائص الفيزيائية" : "Physical Props"}</th>
                        <th className="p-2.5">{isAr ? "جاهزية درو-غوريس" : "Dreux Eligibility"}</th>
                        <th className="p-2.5">{isAr ? "الحالة" : "Status"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-600 dark:text-slate-400">
                      {drafts.map((d) => (
                        <tr key={d.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${!d.selectedForImport ? "opacity-50" : ""}`}>
                          <td className="p-2.5">
                            <input 
                              type="checkbox" 
                              checked={d.selectedForImport}
                              onChange={() => handleToggleDraftSelect(d.id)}
                              className="rounded border-slate-300 text-blue-600"
                            />
                          </td>
                          <td className="p-2.5">
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">{d.name}</span>
                            {d.englishName && <span className="text-[10px] text-slate-400 block">{d.englishName}</span>}
                          </td>
                          <td className="p-2.5">
                            {d.categoryNeedsReview ? (
                              <div className="flex items-center gap-1">
                                <select
                                  value={d.category}
                                  onChange={(e) => handleUpdateCategory(d.id, e.target.value)}
                                  className="text-[11px] p-1 rounded border border-amber-400 bg-amber-50 text-amber-900 font-bold"
                                >
                                  {CATEGORY_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                                <span title="يرجى تأكيد الصنف" className="text-amber-500 cursor-help">⚠️</span>
                              </div>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] font-medium">
                                {d.category}
                              </span>
                            )}
                          </td>
                          <td className="p-2.5">
                            <span className="text-[11px] font-mono text-slate-500 block truncate max-w-[130px]">
                              {d.sourceTracking.sheet || `صفحة ${d.sourceTracking.page || 1}`} : سطر {d.sourceTracking.row}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-400">
                              {d.sourceTracking.extractionMethod}
                            </span>
                          </td>
                          <td className="p-2.5">
                            <div className="flex flex-wrap gap-1 max-w-[180px]">
                              {Object.values(d.properties).slice(0, 3).map((p: any, pIdx: number) => {
                                const valStr = Array.isArray(p.value)
                                  ? `${p.value.length} pts`
                                  : typeof p.value === "object" && p.value !== null
                                  ? "[بيانات]"
                                  : String(p.value ?? "");
                                return (
                                  <span key={pIdx} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-mono">
                                    {p.key}: {valStr} {p.unit || ""}
                                  </span>
                                );
                              })}
                              {Object.keys(d.properties).length > 3 && (
                                <span className="text-[9px] text-slate-400 self-center">
                                  +{Object.keys(d.properties).length - 3}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-2.5">
                            {d.validation.isEligibleForDreuxGorisse ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 font-medium text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {isAr ? "مكتمل لطريقة درو" : "Dreux Ready"}
                              </span>
                            ) : (
                              <span 
                                title={d.validation.missingRequiredForDreux.join(" • ")}
                                className="inline-flex items-center gap-1 text-amber-600 text-[10px] cursor-help bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded"
                              >
                                <AlertTriangle className="w-3 h-3" />
                                {isAr ? "ينقصه بعض المتغيرات" : "Missing Vars"}
                              </span>
                            )}
                          </td>
                          <td className="p-2.5">
                            {d.status === "Complete" ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                                {isAr ? "مكتمل" : "Complete"}
                              </span>
                            ) : d.status === "Needs Review" ? (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                                {isAr ? "بحاجة لمراجعة" : "Needs Review"}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px]">
                                {isAr ? "محفوظ جزئياً" : "Incomplete"}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tab 2: Errors & Warnings Detailed Diagnostic Table */}
              {activeTab === "errors" && (
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                  {analysisReport.errors.length === 0 && analysisReport.warnings.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      {isAr ? "لا توجد أي أخطاء أو تحذيرات. جميع السجلات متوافقة هندسياً!" : "No errors or warnings found. All records are compliant!"}
                    </div>
                  ) : (
                    <table className="w-full text-xs text-right" dir={isAr ? "rtl" : "ltr"}>
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold sticky top-0">
                        <tr>
                          <th className="p-2">{isAr ? "الورقة / الصفحة" : "Sheet / Page"}</th>
                          <th className="p-2">{isAr ? "السطر" : "Row"}</th>
                          <th className="p-2">{isAr ? "المادة" : "Material"}</th>
                          <th className="p-2">{isAr ? "المشكلة" : "Issue"}</th>
                          <th className="p-2">{isAr ? "الحل المقترح" : "Suggested Fix"}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {analysisReport.errors.map((err, i) => (
                          <tr key={`err-${i}`} className="bg-rose-50/40 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300">
                            <td className="p-2 font-mono">{err.sheet}</td>
                            <td className="p-2 font-mono">{err.row}</td>
                            <td className="p-2 font-medium">{err.materialName}</td>
                            <td className="p-2 font-bold">{err.error}</td>
                            <td className="p-2 text-slate-600 dark:text-slate-400">{err.suggestedFix}</td>
                          </tr>
                        ))}
                        {analysisReport.warnings.map((warn, i) => (
                          <tr key={`warn-${i}`} className="bg-amber-50/30 dark:bg-amber-950/10 text-amber-800 dark:text-amber-300">
                            <td className="p-2 font-mono">{warn.sheet}</td>
                            <td className="p-2 font-mono">{warn.row}</td>
                            <td className="p-2 font-medium">{warn.materialName}</td>
                            <td className="p-2">{warn.error}</td>
                            <td className="p-2 text-slate-600 dark:text-slate-400">{warn.suggestedFix}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Tab 3: Duplicates */}
              {activeTab === "duplicates" && (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {duplicates.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      {isAr ? "لم يتم العثور على أي مواد مكررة في المكتبة." : "No duplicate materials detected."}
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                        <span className="text-xs text-slate-500 font-medium">
                          {isAr ? "تطبيق إجراء موحد لكافة المواد المكررة:" : "Apply bulk action to all duplicates:"}
                        </span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleApplyBulkDuplicateStrategy("CREATE_NEW_ID")}
                            className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 transition-colors"
                          >
                            {isAr ? "إنشاء نسخ جديدة للكل" : "Create New Copies"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplyBulkDuplicateStrategy("UPDATE_EXISTING")}
                            className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 transition-colors"
                          >
                            {isAr ? "تحديث الكل" : "Update All"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplyBulkDuplicateStrategy("SKIP")}
                            className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 transition-colors"
                          >
                            {isAr ? "تخطي الكل" : "Skip All"}
                          </button>
                        </div>
                      </div>

                      {duplicates.map((dup) => (
                        <div key={dup.importedDraftId} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">{dup.importedName}</span>
                              <span className="font-mono text-[10px] text-slate-400">({dup.importedDraftId})</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                {dup.matchReason === "EXACT_ID" ? (isAr ? "تطابق معرف ID تام" : "Exact ID Match") : (isAr ? "تطابق دلالي بالاسم والصنف" : "Semantic Match")}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1">
                              {isAr 
                                ? `موجودة مسبقاً في المكتبة (${dup.existingSourceType === "SYSTEM" ? "مادة نظام محمية - سيتم إنشاء نسخة جديدة تلقائياً" : "مادة مستخدم مخصصة"})` 
                                : `Already in library (${dup.existingSourceType === "SYSTEM" ? "Protected System Material" : "Custom User Material"})`}
                            </p>
                          </div>

                          {/* Strategy Selector */}
                          <div className="flex items-center gap-2">
                            <label className="text-[11px] text-slate-500">{isAr ? "الإجراء:" : "Action:"}</label>
                            <select 
                              value={duplicateStrategies[dup.importedDraftId] || "CREATE_NEW_ID"}
                              onChange={(e) => {
                                setDuplicateStrategies({
                                  ...duplicateStrategies,
                                  [dup.importedDraftId]: e.target.value as DuplicateResolutionStrategy
                                });
                              }}
                              className="text-xs px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                            >
                              <option value="UPDATE_EXISTING">{isAr ? "تحديث المادة الحالية" : "Update Existing"}</option>
                              <option value="CREATE_NEW_ID">{isAr ? "إنشاء نسخة بمعرف جديد" : "Create New ID"}</option>
                              <option value="SKIP">{isAr ? "تخطي المادة" : "Skip"}</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}

              {/* Tab 4: Unmapped Extra Properties */}
              {activeTab === "unmapped" && (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-xs">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-bold mb-2">
                    <Info className="w-4 h-4 text-blue-500" />
                    <span>{isAr ? "أعمدة إضافية تم حفظها في 'الخصائص الإضافية' (Zero Data Loss):" : "Preserved Unmapped Columns:"}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(pipelineReport?.unmappedHeaders || []).map((col, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                        {col.source}: {col.header}
                      </span>
                    ))}
                    {(!pipelineReport || pipelineReport.unmappedHeaders.length === 0) && (
                      <span className="text-slate-400">{isAr ? "لا توجد أعمدة غير مطابقة." : "No unmapped columns."}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Dedicated Duplicate Resolution */}
          {step === 3 && (
            <div className="space-y-4 py-4">
              <div className="text-center max-w-lg mx-auto mb-6">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  {isAr ? "إدارة وتأكيد معالجة المواد المكررة" : "Duplicate Resolution Management"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {isAr 
                    ? "تم اكتشاف مواد تحمل نفس الأسماء أو المعرفات. حدد الإجراء الهندسي لكل مادة قبل إضافتها للمكتبة." 
                    : "Matches detected with existing materials. Specify resolution strategy before inserting into library."}
                </p>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto">
                {duplicates.map((dup) => (
                  <div key={dup.importedDraftId} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">{dup.importedName}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                          {dup.matchReason === "EXACT_ID" ? (isAr ? "تطابق معرف ID تام" : "Exact ID Match") : (isAr ? "تطابق بالاسم" : "Name Match")}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {isAr 
                          ? `مطابقة مع: ${dup.existingName} (${dup.existingSourceType === "SYSTEM" ? "مادة نظام محمية" : "مادة مخصصة"})` 
                          : `Matched with: ${dup.existingName}`}
                      </p>
                    </div>

                    <select 
                      value={duplicateStrategies[dup.importedDraftId] || "CREATE_NEW_ID"}
                      onChange={(e) => {
                        setDuplicateStrategies({
                          ...duplicateStrategies,
                          [dup.importedDraftId]: e.target.value as DuplicateResolutionStrategy
                        });
                      }}
                      className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium"
                    >
                      <option value="UPDATE_EXISTING">{isAr ? "استبدال / تحديث المادة الحالية" : "Update Existing"}</option>
                      <option value="CREATE_NEW_ID">{isAr ? "إنشاء نسخة جديدة بمعرف مستقل" : "Create New ID"}</option>
                      <option value="SKIP">{isAr ? "تخطي المادة دون استيراد" : "Skip"}</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Completed Summary with Post-Import Completeness Audit */}
          {step === 4 && importSummary && (
            <div className="py-6 text-center flex flex-col items-center justify-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  {isAr ? "تم الاستيراد بنجاح وحفظ المواد في مكتبتك!" : "Import Completed Successfully!"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-lg">
                  {isAr 
                    ? "تم حفظ كافة المواد المستوردة في مكتبة 'موادي' بأمان دون فقدان أي بيانات، مع حماية مواد النظام القياسية." 
                    : "All imported materials were safely stored in My Materials while preserving standard system materials."}
                </p>
              </div>

              {/* Import Counts Grid */}
              <div className="grid grid-cols-3 gap-3 max-w-lg w-full">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[11px] text-slate-500 block">{isAr ? "مواد جديدة مضافة" : "New Materials"}</span>
                  <span className="text-lg font-bold text-emerald-600">{importSummary.importedCount}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[11px] text-slate-500 block">{isAr ? "مواد محدثة" : "Updated Materials"}</span>
                  <span className="text-lg font-bold text-blue-600">{importSummary.updatedCount}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[11px] text-slate-500 block">{isAr ? "تم تخطيها" : "Skipped"}</span>
                  <span className="text-lg font-bold text-slate-500">{importSummary.skippedCount}</span>
                </div>
              </div>

              {/* POST-IMPORT COMPLETENESS AUDIT CARD */}
              {postImportReport && (
                <div className="max-w-lg w-full p-5 rounded-2xl border text-right bg-gradient-to-br from-amber-500/5 via-amber-500/10 to-transparent border-amber-300 dark:border-amber-800/60 dark:bg-amber-950/20 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {isAr ? "تقرير الفحص الهندسي للنواقص (Post-Import Audit)" : "Post-Import Engineering Audit"}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {isAr ? "فحص الجاهزية لحسابات درو-غوريس والمطابقة المعيارية" : "Readiness audit for Dreux-Gorisse calculations"}
                        </p>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-300/40">
                      {postImportReport.requiresAttentionCount} {isAr ? "مادة بها نواقص" : "incomplete"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-[10px] text-slate-400 block">{isAr ? "إجمالي المفحوص" : "Total"}</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{postImportReport.totalInspected}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40">
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block">{isAr ? "جاهز للحساب" : "Ready"}</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-300">{postImportReport.readyCount}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40">
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 block">{isAr ? "نواقص غير مكتملة" : "Incomplete"}</span>
                      <span className="font-bold text-amber-700 dark:text-amber-300">{postImportReport.incompleteCount}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/40">
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 block">{isAr ? "تحتاج مراجعة" : "Needs Review"}</span>
                      <span className="font-bold text-blue-700 dark:text-blue-300">{postImportReport.needsReviewCount}</span>
                    </div>
                  </div>

                  {postImportReport.requiresAttentionCount > 0 ? (
                    <div className="pt-2 border-t border-amber-200/60 dark:border-amber-800/40 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed text-right">
                        {isAr 
                          ? `يوجد ${postImportReport.requiresAttentionCount} مادة ينقصها معاملات أساسية (مثل الكثافة أو معامل النعومة أو Dmax) تمنع الحساب الدقيق لطريقة درو-غوريس حتى يتم إكمالها.` 
                          : `${postImportReport.requiresAttentionCount} materials have missing key properties blocking Dreux-Gorisse calculation.`}
                      </p>

                      <button
                        type="button"
                        onClick={() => setIsBulkCompletionOpen(true)}
                        className="w-full sm:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>{isAr ? "مراجعة واستكمال النواقص الآن" : "Review & Complete Missing Properties"}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-2 rounded-xl bg-emerald-100/50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 font-semibold text-center flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{isAr ? "كافة المواد المستوردة مكتملة وجاهزة فوراً للحساب!" : "All imported materials are 100% complete and ready for calculation!"}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          {step === 1 && (
            <button 
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              {isAr ? "إلغاء" : "Cancel"}
            </button>
          )}

          {step === 2 && (
            <>
              <button 
                onClick={() => setStep(1)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowRight className={`w-4 h-4 ${isAr ? "" : "rotate-180"}`} />
                <span>{isAr ? "تغيير الملف" : "Change File"}</span>
              </button>

              <div className="flex gap-2">
                {duplicates.length > 0 && (
                  <button 
                    onClick={() => setStep(3)}
                    className="px-4 py-2 text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{isAr ? "مراجعة المواد المكررة" : "Review Duplicates"} ({duplicates.length})</span>
                  </button>
                )}

                <button 
                  onClick={handleExecuteImport}
                  disabled={!analysisReport?.canProceed || drafts.filter(d => d.selectedForImport).length === 0}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>{isAr ? `تأكيد واستيراد المواد (${drafts.filter(d => d.selectedForImport).length})` : `Confirm & Import (${drafts.filter(d => d.selectedForImport).length})`}</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <button 
                onClick={() => setStep(2)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowRight className={`w-4 h-4 ${isAr ? "" : "rotate-180"}`} />
                <span>{isAr ? "العودة للمعاينة" : "Back to Preview"}</span>
              </button>

              <button 
                onClick={handleExecuteImport}
                className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>{isAr ? "تأكيد وتنفيذ الاستيراد" : "Confirm & Import"}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </>
          )}

          {step === 4 && (
            <div className="w-full flex items-center justify-between gap-3">
              {postImportReport && postImportReport.requiresAttentionCount > 0 ? (
                <button 
                  onClick={() => setIsBulkCompletionOpen(true)}
                  className="px-5 py-2.5 text-xs font-bold text-amber-900 dark:text-amber-200 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/40 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isAr ? "مراجعة واستكمال النواقص" : "Review Missing Properties"}</span>
                </button>
              ) : <div />}

              <button 
                onClick={onClose}
                className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all cursor-pointer"
              >
                {isAr ? "إغلاق المعالج والعودة للمكتبة" : "Close Wizard & View Library"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Completion Modal embedded or overlaid on top */}
      {isBulkCompletionOpen && (
        <MaterialBulkCompletionModal
          isOpen={isBulkCompletionOpen}
          onClose={() => setIsBulkCompletionOpen(false)}
          materials={currentImportedMaterials}
          onMaterialsUpdated={(updated) => {
            setCurrentImportedMaterials(updated);
            const reAudited = CompletenessChecker.inspectLibrary(updated);
            setPostImportReport(reAudited);
            onImportComplete(updated);
          }}
          language={language as any}
        />
      )}
    </div>
  );
};
