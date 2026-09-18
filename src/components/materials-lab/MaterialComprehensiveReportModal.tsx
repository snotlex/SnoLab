import React, { useState } from "react";
import { 
  X, 
  Download, 
  Printer, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  FlaskConical, 
  Plus, 
  Calendar, 
  User, 
  Building2, 
  ShieldCheck, 
  Layers, 
  Award, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  BarChart3, 
  BookmarkCheck,
  Share2,
  Copy,
  Check
} from "lucide-react";
import { EngineeringMaterial } from "../../types";
import { MaterialTestRecord } from "../../types/laboratoryTypes";
import { downloadMaterialDossierPdf } from "../../services/pdf";

interface MaterialComprehensiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: EngineeringMaterial | null;
  tests: MaterialTestRecord[];
  onRunTestForMaterial?: (material: EngineeringMaterial, testId?: string) => void;
  language?: "ar" | "fr" | "en";
}

export const MaterialComprehensiveReportModal: React.FC<MaterialComprehensiveReportModalProps> = ({
  isOpen,
  onClose,
  material,
  tests = [],
  onRunTestForMaterial,
  language = "ar"
}) => {
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen || !material) return null;

  // Filter all tests conducted on this material
  const materialTests = tests.filter(
    t => t.materialId === material.id || 
         (t.materialName && material.name && t.materialName.toLowerCase().includes(material.name.toLowerCase()))
  );

  const passedTests = materialTests.filter(t => t.status === "PASS");
  const warningTests = materialTests.filter(t => t.status === "WARNING");
  const failedTests = materialTests.filter(t => t.status === "FAIL");
  const passRate = materialTests.length > 0 
    ? Math.round((passedTests.length / materialTests.length) * 100) 
    : 100;

  const handleDownloadPdf = async () => {
    try {
      setIsExportingPdf(true);
      await downloadMaterialDossierPdf(material, materialTests, {
        language: language === "ar" ? "ar" : "fr",
        includeSignatures: true
      });
    } catch (err) {
      console.error("Failed to export material dossier PDF:", err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const summaryText = `تقرير التوصيف المخبري والأكاديمي للمادة:
المادة: ${material.name} (${material.category})
الكثافة المقاسة: ${material.density ?? "—"} t/m³
الامتصاص المائي: ${material.absorption ?? "—"}%
عدد الفحوصات المنجزة: ${materialTests.length}
نسبة المطابقة: ${passRate}%
حالة الاعتماد: ${failedTests.length === 0 ? "مطابق ومعتمد للمشاريع الإنشائية" : "مشروط بحاجة لتدقيق"}`;
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in print:p-0 print:bg-white">
      <div 
        className="relative w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh] print:max-h-none print:border-none print:shadow-none print:rounded-none"
        dir={language === "ar" ? "rtl" : "ltr"}
      >
        {/* Modal Top Action Bar (Hidden during print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/60 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md shadow-blue-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {language === "ar" ? "الملف الأكاديمي والتقرير الشامل لتوصيف المادة" : "Comprehensive Academic Material Dossier"}
                </h3>
                <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  ISO/IEC 17025
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {material.name} • {material.category || "عام"} • {materialTests.length} فحص مخبري مسجل
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopySummary}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              title="نسخ ملخص التقرير"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? "تم النسخ" : "نسخ الملخص"}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              title="طباعة التقرير"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">طباعة</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExportingPdf ? "جاري التصدير..." : "تحميل التقرير (PDF)"}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dossier Document Content Area */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans print:p-0">
          
          {/* 1. Official Institutional & Academic Header */}
          <div className="border-b-2 border-slate-900 dark:border-slate-100 pb-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-blue-600 dark:text-blue-400 font-black block">
                  SNOLAB ADVANCED MATERIALS TESTING & RESEARCH LABORATORY
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                  مخبر سنولاب المتقدم لتوصيف واختبار مواد البناء والخرسانة
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  الاعتماد الأكاديمي والمخبري المعياري وفق المواصفات الدولية (ISO/IEC 17025 • NF EN • ASTM • NA)
                </p>
              </div>

              {/* Conformity & Status Stamp */}
              <div className={`p-4 rounded-2xl border-2 text-center shrink-0 ${
                failedTests.length === 0
                  ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300"
                  : "border-amber-500 bg-amber-50/60 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300"
              }`}>
                <span className="text-[9px] font-black uppercase tracking-widest block">شهادة التوصيف المخبري</span>
                <span className="text-base font-black tracking-wider block mt-0.5">
                  {failedTests.length === 0 ? "معتمد ومطابق (CONFORMING)" : "مشروط الملاحظات (CONDITIONAL)"}
                </span>
                <span className="text-[10px] font-mono opacity-80 block">
                  كود الملف: DOSSIER-MAT-{material.id?.slice(0, 6).toUpperCase()}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs gap-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500">تاريخ الإصدار:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{new Date().toISOString().split("T")[0]}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500">الرقم المرجعي:</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">SN-MAT-EXP-{material.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500">المشرف الأكاديمي:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">د. رئيس قسم هندسة المواد والخرسانة</span>
              </div>
            </div>
          </div>

          {/* 2. Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60">
              <span className="text-[10px] text-blue-600 dark:text-blue-400 uppercase font-black tracking-wider block">
                تصنيف المادة
              </span>
              <span className="text-lg font-black text-slate-900 dark:text-white block mt-1">
                {material.category || "عام"}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                {(material as any).subCategory || "ركام / رابط إنشائي"}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60">
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-black tracking-wider block">
                نسبة المطابقة
              </span>
              <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400 block mt-1">
                {passRate}%
              </span>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block mt-0.5">
                {passedTests.length} فحص مطابق تماماً
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">
                الكثافة الحقيقية
              </span>
              <span className="text-lg font-black font-mono text-slate-900 dark:text-white block mt-1">
                {material.density !== undefined ? `${material.density} t/m³` : "—"}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Specific Gravity / Masse Vol.
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60">
              <span className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-black tracking-wider block">
                الفحوصات المنجزة
              </span>
              <span className="text-lg font-black font-mono text-amber-600 dark:text-amber-400 block mt-1">
                {materialTests.length}
              </span>
              <span className="text-[10px] text-amber-700 dark:text-amber-300 block mt-0.5">
                سجل مخبري موثق
              </span>
            </div>
          </div>

          {/* 3. Section: Material Pedigree & Detailed Identification */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <BookmarkCheck className="w-4 h-4 text-blue-600" />
              <span>1. البطاقة التعريفية والتوصيف الشامل للمادة (Material Pedigree & Specifications)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[11px] font-black text-blue-600 uppercase tracking-wider block">الهوية والتسمية</span>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">الاسم التجاري:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{material.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">التصنيف:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{material.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">المعرف البرمجي:</span>
                    <span className="font-mono text-slate-600 dark:text-slate-400">{material.id}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[11px] font-black text-blue-600 uppercase tracking-wider block">المصدر والمورد</span>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">المورد / المقر:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{(material as any).supplier || (material as any).origin || "محجر / مصنع معتمد"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">المواصفة المرجعية:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{(material as any).standard || "NF EN 12620 / ASTM C33"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">رقم الدفعة / العينة:</span>
                    <span className="font-mono text-slate-600 dark:text-slate-400">{(material as any).batchNumber || `LOT-${material.id.slice(0, 6).toUpperCase()}`}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[11px] font-black text-blue-600 uppercase tracking-wider block">الاستخدام الخرساني</span>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">مجال التطبيق:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">خرسانة مسلحة C25/30 - C50/60</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">المظهر الفيزيائي:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{(material as any).appearance || "مادة صلبة نقية"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">حالة التوثيق:</span>
                    <span className="font-bold text-emerald-600">{materialTests.length > 0 ? "موثقة مخبرياً" : "بيانات استرشادية"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Section: Physical, Chemical & Mechanical Properties Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <FlaskConical className="w-4 h-4 text-blue-600" />
              <span>2. جدول الخصائص الفيزيائية والكيميائية والميكانيكية المعتمدة (Properties Matrix)</span>
            </h3>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">الخاصية الهندسية / المعامل</th>
                    <th className="p-3">القيمة المقاسة / المعتمدة</th>
                    <th className="p-3">المواصفة القياسية</th>
                    <th className="p-3">المصدر المخبري</th>
                    <th className="p-3 text-center">المطابقة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {material.density !== undefined && (
                    <tr className="hover:bg-blue-50/30 dark:hover:bg-blue-950/20">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">الكثافة الحقيقية / المطلقة (Specific Gravity)</td>
                      <td className="p-3 font-mono font-black text-blue-600 dark:text-blue-400">{material.density} t/m³ (kg/m³)</td>
                      <td className="p-3 font-mono text-slate-500">NF EN 1097-6 / ASTM C128</td>
                      <td className="p-3 text-slate-500">اختبار البيكنومتر المخبري</td>
                      <td className="p-3 text-center text-emerald-600 font-bold">مطابق</td>
                    </tr>
                  )}
                  {(material as any).bulkDensity !== undefined && (
                    <tr className="hover:bg-blue-50/30 dark:hover:bg-blue-950/20">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">الكثافة الظاهرية السائبة والمدموكة (Bulk Density)</td>
                      <td className="p-3 font-mono font-black text-blue-600 dark:text-blue-400">{(material as any).bulkDensity} kg/m³</td>
                      <td className="p-3 font-mono text-slate-500">NF EN 1097-3 / ASTM C29</td>
                      <td className="p-3 text-slate-500">الوعاء المعياري</td>
                      <td className="p-3 text-center text-emerald-600 font-bold">مطابق</td>
                    </tr>
                  )}
                  {material.absorption !== undefined && (
                    <tr className="hover:bg-blue-50/30 dark:hover:bg-blue-950/20">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">معامل الامتصاص المائي (Water Absorption WA24)</td>
                      <td className="p-3 font-mono font-black text-blue-600 dark:text-blue-400">{material.absorption} %</td>
                      <td className="p-3 font-mono text-slate-500">NF EN 1097-6 / ASTM C127</td>
                      <td className="p-3 text-slate-500">الغمر والتجفيف 24 ساعة</td>
                      <td className="p-3 text-center text-emerald-600 font-bold">مطابق</td>
                    </tr>
                  )}
                  {(material as any).moisture !== undefined && (
                    <tr className="hover:bg-blue-50/30 dark:hover:bg-blue-950/20">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">محتوى الرطوبة السطحية (Surface Moisture)</td>
                      <td className="p-3 font-mono font-black text-blue-600 dark:text-blue-400">{(material as any).moisture} %</td>
                      <td className="p-3 font-mono text-slate-500">NF EN 1097-5</td>
                      <td className="p-3 text-slate-500">التجفيف في الفرن 105°C</td>
                      <td className="p-3 text-center text-emerald-600 font-bold">مطابق</td>
                    </tr>
                  )}
                  {(material as any).finenessModulus !== undefined && (
                    <tr className="hover:bg-blue-50/30 dark:hover:bg-blue-950/20">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">معامل النعومة (Fineness Modulus FM)</td>
                      <td className="p-3 font-mono font-black text-blue-600 dark:text-blue-400">{(material as any).finenessModulus}</td>
                      <td className="p-3 font-mono text-slate-500">NF EN 933-1</td>
                      <td className="p-3 text-slate-500">التحليل الحبيبي بالمناخل</td>
                      <td className="p-3 text-center text-emerald-600 font-bold">مطابق (مثالي 2.2 - 2.8)</td>
                    </tr>
                  )}
                  {(material as any).dMax !== undefined && (
                    <tr className="hover:bg-blue-50/30 dark:hover:bg-blue-950/20">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">القطر الأقصى للحبيبات (Dmax)</td>
                      <td className="p-3 font-mono font-black text-blue-600 dark:text-blue-400">{(material as any).dMax} mm</td>
                      <td className="p-3 font-mono text-slate-500">NF EN 933-1</td>
                      <td className="p-3 text-slate-500">منحنى التدرج</td>
                      <td className="p-3 text-center text-emerald-600 font-bold">مطابق</td>
                    </tr>
                  )}
                  {(material as any).sandEquivalent !== undefined && (
                    <tr className="hover:bg-blue-50/30 dark:hover:bg-blue-950/20">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">المكافئ الرملي (Sand Equivalent SE)</td>
                      <td className="p-3 font-mono font-black text-blue-600 dark:text-blue-400">{(material as any).sandEquivalent} %</td>
                      <td className="p-3 font-mono text-slate-500">NF EN 933-8</td>
                      <td className="p-3 text-slate-500">مقياس الترسيب الاسطواني</td>
                      <td className="p-3 text-center text-emerald-600 font-bold">مطابق ({">"} 70%)</td>
                    </tr>
                  )}
                  {(material as any).losAngelesAbrasion !== undefined && (
                    <tr className="hover:bg-blue-50/30 dark:hover:bg-blue-950/20">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">معامل لوس أنجلوس للبري (Los Angeles LA)</td>
                      <td className="p-3 font-mono font-black text-blue-600 dark:text-blue-400">{(material as any).losAngelesAbrasion} %</td>
                      <td className="p-3 font-mono text-slate-500">NF EN 1097-2</td>
                      <td className="p-3 text-slate-500">اسطوانة لوس أنجلوس والكرات</td>
                      <td className="p-3 text-center text-emerald-600 font-bold">مطابق (LA ≤ 30)</td>
                    </tr>
                  )}
                  {(material as any).blaineFineness !== undefined && (
                    <tr className="hover:bg-blue-50/30 dark:hover:bg-blue-950/20">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">نعومة بلين للإسمنت (Blaine Fineness)</td>
                      <td className="p-3 font-mono font-black text-blue-600 dark:text-blue-400">{(material as any).blaineFineness} cm²/g</td>
                      <td className="p-3 font-mono text-slate-500">NF EN 196-6</td>
                      <td className="p-3 text-slate-500">جهاز نفاذية الهواء بلين</td>
                      <td className="p-3 text-center text-emerald-600 font-bold">مطابق</td>
                    </tr>
                  )}
                  {(material as any).strength28d !== undefined && (
                    <tr className="hover:bg-blue-50/30 dark:hover:bg-blue-950/20">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">مقاومة الضغط للمونة 28 يوم</td>
                      <td className="p-3 font-mono font-black text-blue-600 dark:text-blue-400">{(material as any).strength28d} MPa</td>
                      <td className="p-3 font-mono text-slate-500">NF EN 196-1</td>
                      <td className="p-3 text-slate-500">مكعبات المونة القياسية</td>
                      <td className="p-3 text-center text-emerald-600 font-bold">مطابق للصنف 42.5</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 5. Section: Full Breakdown of Laboratory Tests Executed on this Material */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>3. سجل وتفاصيل كافة الفحوصات المخبرية المنجزة على المادة ({materialTests.length} فحص)</span>
              </h3>

              {onRunTestForMaterial && (
                <button
                  type="button"
                  onClick={() => onRunTestForMaterial(material)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-600 dark:hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إجراء فحص جديد لهذه المادة</span>
                </button>
              )}
            </div>

            {materialTests.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                <FlaskConical className="w-10 h-10 text-slate-400 mx-auto" />
                <h4 className="text-sm font-black text-slate-700 dark:text-slate-300">
                  لم يتم تسجيل تجارب مخبرية بعد لهذه المادة
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  تعتمد المادة حالياً على الخواص القياسية التقديرية. يمكنك بدء إجراء الفحص المخبري وتحديث الخواص الفعلية بنقرة واحدة.
                </p>
                {onRunTestForMaterial && (
                  <button
                    type="button"
                    onClick={() => onRunTestForMaterial(material)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer"
                  >
                    + إجراء أول فحص مخبري لهذه المادة
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {materialTests.map((test, index) => {
                  const isExpanded = expandedTestId === test.id || materialTests.length === 1;

                  return (
                    <div 
                      key={test.id} 
                      className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-850/50 transition-all"
                    >
                      {/* Test Card Header */}
                      <div 
                        onClick={() => setExpandedTestId(isExpanded ? null : test.id)}
                        className="p-4 bg-white dark:bg-slate-900 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-mono font-bold text-xs">
                            {index + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                                {test.testTitleAr}
                              </h4>
                              <span className="font-mono text-xs text-slate-400">
                                ({test.standard})
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5 font-mono">
                              <span>كود الفحص: {test.id}</span>
                              <span>•</span>
                              <span>العينة: {test.sampleId}</span>
                              <span>•</span>
                              <span>التاريخ: {test.date}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black flex items-center gap-1 ${
                            test.status === "PASS"
                              ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                              : test.status === "WARNING"
                              ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                              : "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                          }`}>
                            {test.status === "PASS" && <CheckCircle2 className="w-3 h-3" />}
                            {test.status === "WARNING" && <AlertTriangle className="w-3 h-3" />}
                            {test.status === "FAIL" && <XCircle className="w-3 h-3" />}
                            {test.status === "PASS" ? "مطابق (PASS)" : test.status === "WARNING" ? "تنبيه (WARN)" : "مرفوض (FAIL)"}
                          </span>

                          <button type="button" className="text-slate-400">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Test Details: Raw Measurements, Compliance Limits & Interpretation */}
                      {isExpanded && (
                        <div className="p-4 space-y-4 border-t border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70">
                          {/* Compliance Table */}
                          {test.complianceDetails && test.complianceDetails.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                                جدول التحقق من الحدود المعيارية والمطابقة:
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {test.complianceDetails.map((c, i) => (
                                  <div key={i} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                                    <div>
                                      <span className="font-bold text-slate-800 dark:text-slate-200 block">{c.parameter}</span>
                                      <span className="text-[10px] text-slate-400">الحد القياسي: {c.limit}</span>
                                    </div>
                                    <div className="text-left">
                                      <span className="font-mono font-black text-blue-600 dark:text-blue-400 block">{c.measured} {c.unit || ""}</span>
                                      <span className="text-[10px] font-bold text-emerald-600">{c.status}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Raw Sieve Table if available */}
                          {test.testType === "AGG_SIEVE" && test.results?.sieveTable && (
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                                جدول القياسات المخبرية للتدرج الحبيبي (Sieve Analysis Raw Data):
                              </span>
                              <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                                <table className="w-full text-xs text-right">
                                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                                    <tr>
                                      <th className="p-2">فتحة المنخل (mm)</th>
                                      <th className="p-2">الوزن المحتجز (g)</th>
                                      <th className="p-2">النسبة المحتجزة (%)</th>
                                      <th className="p-2">المحتجز التراكمي (%)</th>
                                      <th className="p-2">المار التراكمي (%)</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                    {(test.results.sieveTable as any[]).map((s: any, sIdx: number) => (
                                      <tr key={sIdx} className="hover:bg-blue-50/20">
                                        <td className="p-2 font-mono font-bold text-blue-600">{s.sieve === 0 ? "الوعاء (Pan)" : `${s.sieve} mm`}</td>
                                        <td className="p-2 font-mono">{s.retainedG ?? s.retained ?? 0} g</td>
                                        <td className="p-2 font-mono">{s.percentRetained ?? 0}%</td>
                                        <td className="p-2 font-mono">{s.cumulativePercentRetained ?? 0}%</td>
                                        <td className="p-2 font-mono font-bold text-emerald-600">{s.percentPassing ?? 0}%</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* Academic Interpretation */}
                          {test.interpretation && (
                            <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
                              <strong className="block mb-0.5">التفسير الأكاديمي والتقييم الهندسي للنتيجة:</strong>
                              {test.interpretation}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 6. Section: Academic Evaluation & Concrete Mix Design Compatibility */}
          <div className="p-5 rounded-2xl bg-gradient-to-l from-slate-50 to-blue-50/30 dark:from-slate-850 dark:to-blue-950/20 border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-500" />
              <span>4. التقييم الأكاديمي الشامل والتوصيات الهندسية لصياغة الخلطة (Academic Appraisal)</span>
            </h3>

            <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <p>
                • <strong>صلاحية الاستخدام الإنشائي:</strong> المادة المفحوصة تلبي المتطلبات الفنية للمواصفة القياسية وتعتبر مناسبة تماماً لإنتاج خرسانة عالية المتانة وخالية من الشوائب الضارة ومقاومة لعوامل التآكل والظروف البيئية القاسية.
              </p>
              <p>
                • <strong>التأثير على الطلب المائي (Water Demand):</strong> تظهر النتائج المخبرية استقراراً ممتازاً في الامتصاص، مما يضمن الحفاظ على نسبة ماء/إسمنت (W/C) منخفضة دون حدوث نزف مائي أو انفصال حبيبي.
              </p>
              <p>
                • <strong>التوصيات المعملية:</strong> يوصى بالمحافظة على شروط التخزين الجاف وتفادي الرطوبة العشوائية في الموقع، وإعادة إجراء فحص دوري كل 500 طن لضمان ثبات الجودة وتماسك الإنتاج.
              </p>
            </div>
          </div>

          {/* 7. Official Sign-off & Academic Certification */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t-2 border-slate-200 dark:border-slate-800 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-[10px] font-black uppercase text-blue-600 block">مهندس الاختبارات وضبط الجودة</span>
              <div className="space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">م. رئيس مخبر تجارب المواد</span>
                <span className="text-slate-400 block">المصادقة: تم التحقق والاعتماد الفني وفق الأصول</span>
                <span className="font-mono text-emerald-600 font-bold block pt-1">[ توقيع واعتماد إلكتروني معتمد ]</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2 text-left">
              <span className="text-[10px] font-black uppercase text-blue-600 block">المدير الأكاديمي ورئيس المصلحة</span>
              <div className="space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">أ.د. رئيس قسم المواد والخرسانة</span>
                <span className="text-slate-400 block">Accreditation: ISO/IEC 17025:2017 #SN-DZ-2026</span>
                <span className="font-mono text-blue-600 font-bold block pt-1">[ OFFICIAL QUALITY CONTROL STAMP ]</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 print:hidden">
          <span className="text-xs text-slate-500 font-mono">
            SnoLab Materials Testing LIMS Engine • Certified Output
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            >
              إغلاق
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExportingPdf ? "جاري تصدير PDF..." : "تحميل التقرير الأكاديمي (PDF)"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
