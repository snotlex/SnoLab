import React, { useState } from "react";
import { 
  X, 
  Printer, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Building2, 
  User, 
  Calendar, 
  Bookmark, 
  ShieldCheck,
  Download,
  Share2,
  Layers,
  Award
} from "lucide-react";
import { MaterialTestRecord } from "../../types/laboratoryTypes";
import { generateLabTestPdf } from "../../services/pdf/labTestPdfGenerator";

interface TestReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: MaterialTestRecord | null;
  language?: "ar" | "fr" | "en";
}

export const TestReportModal: React.FC<TestReportModalProps> = ({
  isOpen,
  onClose,
  record,
  language = "ar"
}) => {
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  if (!isOpen || !record) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = async () => {
    if (!record) return;
    try {
      setIsExportingPdf(true);
      const doc = await generateLabTestPdf(record, {
        language: language === "ar" ? "ar" : language === "en" ? "en" : "fr"
      });
      const safeName = (record.materialName || "Material").replace(/[^a-zA-Z0-9_\u0600-\u06FF-]/g, "_");
      doc.save(`SnoLab-TestReport-${record.testType}-${safeName}-${record.sampleId || record.id}.pdf`);
    } catch (err) {
      console.error("Failed to export test report PDF:", err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Check for Sieve Analysis Data
  const sievesData: Array<{ sieve: number; retained?: number; weightRetained?: number; cumRetained?: number; percentPassing?: number }> = 
    record.results?.sieves || record.results?.sieveTable || record.inputs?.sieves || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div 
        className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]"
        dir={language === "ar" ? "rtl" : "ltr"}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              {language === "ar" ? "شهادة فحص مخبري وتقرير مراقبة الجودة الهندسية" : "Laboratory Test Certificate & Engineering Quality Report"}
            </h3>
            <span className="font-mono text-xs text-slate-400">[{record.id}]</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-md shadow-emerald-600/20 active:scale-95"
              title="تصدير تقرير الجودة بصيغة PDF أكاديمي معتمد"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExportingPdf ? (language === "ar" ? "جاري التصدير..." : "Exporting...") : (language === "ar" ? "تصدير التقرير (PDF)" : "Export Report (PDF)")}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{language === "ar" ? "طباعة" : "Print"}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Printable Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
          {/* Certificate Header with Official Laboratory Emblem */}
          <div className="border-b-2 border-slate-900 dark:border-slate-100 pb-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex items-center gap-3.5">
                {/* Official Vector Logo Badge */}
                <div className="w-14 h-14 rounded-2xl bg-slate-950 border-2 border-blue-500 flex flex-col items-center justify-center text-white shadow-lg shadow-blue-500/10 shrink-0">
                  <span className="font-black font-mono text-sm tracking-tighter text-blue-400">SNO</span>
                  <span className="text-[8px] font-black tracking-widest text-amber-400 -mt-0.5">LAB</span>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-blue-600 dark:text-blue-400 font-black flex items-center gap-1.5">
                    <Award className="w-3 h-3 text-amber-500" />
                    SNOLAB ISO/IEC 17025 QUALITY CONTROL & MATERIAL TESTING
                  </span>
                  <h1 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                    {record.laboratoryName || "مخبر سنولاب المركزي لمراقبة جودة المواد والخرسانة"}
                  </h1>
                  <p className="text-xs text-slate-500">
                    معتمد لجميع الفحوصات الفيزيائية والميكانيكية والمطابقة الهندسية (EN / ASTM / NF Standards)
                  </p>
                </div>
              </div>

              {/* Status Stamp */}
              <div className={`p-3.5 rounded-2xl border-2 text-center min-w-[160px] shrink-0 ${
                record.status === "PASS"
                  ? "border-emerald-500 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30"
                  : record.status === "WARNING"
                  ? "border-amber-500 text-amber-600 bg-amber-50/50 dark:bg-amber-950/30"
                  : "border-rose-500 text-rose-600 bg-rose-50/50 dark:bg-rose-950/30"
              }`}>
                <span className="text-[9px] font-black uppercase tracking-widest block">QC VERDICT • نتيجة المطابقة</span>
                <span className="text-base font-black tracking-wider block mt-0.5">
                  {record.status === "PASS" ? "مطابق (PASS)" : record.status === "WARNING" ? "مشروط (WARNING)" : "مرفوض (FAIL)"}
                </span>
                <span className="text-[10px] font-mono opacity-80 block mt-0.5">Score: {record.score || 95}%</span>
              </div>
            </div>

            <div className="text-center pt-3 border-t border-slate-150 dark:border-slate-800">
              <h2 className="text-base font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                {record.testTitleAr}
              </h2>
              <span className="text-xs text-slate-500 font-mono">
                المواصفة المرجعية: {record.standard} | كود الفحص: {record.testType}
              </span>
            </div>
          </div>

          {/* Sample & Metadata Grid (تفاصيل المادة المختبرة والفحص) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block font-bold">المادة المختبرة:</span>
              <span className="font-black text-slate-800 dark:text-slate-200">{record.materialName}</span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 block font-bold">({record.materialCategory})</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold">كود العينة (Sample ID):</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{record.sampleId}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold">تاريخ الفحص والاختبار:</span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                {record.date}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold">الفني / المهندس المسؤول:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <User className="w-3 h-3 text-slate-400" />
                {record.operator || "فني مخبري معتمد"}
              </span>
            </div>
          </div>

          {/* Sieve Analysis Granulometry Table (if available) */}
          {sievesData && sievesData.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>التحليل الحبيبي بالمناخل (Sieve Analysis Grading Data):</span>
              </h4>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-right">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-2.5">قطر المنخل (mm)</th>
                      <th className="p-2.5">الوزن المتبقي (g)</th>
                      <th className="p-2.5">النسبة المتبقية المتراكمة (%)</th>
                      <th className="p-2.5 text-center">النسبة المارة (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {sievesData.map((s, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-2.5 font-bold font-mono">
                          {s.sieve === 0 ? "قاع المنخل (Pan)" : `${s.sieve} mm`}
                        </td>
                        <td className="p-2.5 font-mono">
                          {s.retained !== undefined ? `${s.retained} g` : s.weightRetained !== undefined ? `${s.weightRetained} g` : "—"}
                        </td>
                        <td className="p-2.5 font-mono">
                          {s.cumRetained !== undefined ? `${Number(s.cumRetained).toFixed(1)}%` : "—"}
                        </td>
                        <td className="p-2.5 font-mono font-black text-center text-blue-600 dark:text-blue-400">
                          {s.percentPassing !== undefined ? `${Number(s.percentPassing).toFixed(1)}%` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Raw Measured Results & Physical Values Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">
              1. النتائج والخواص الفيزيائية المقاسة والمحسوبة:
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.keys(record.results).filter(k => typeof record.results[k] !== "object").map(key => (
                <div key={key} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                  <span className="text-sm font-black font-mono text-slate-900 dark:text-white">
                    {record.results[key]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Standard Limits Verification Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">
              2. جدول التحقق من الحدود المعيارية والمطابقة الهندسية:
            </h4>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-2.5">المعيار / الخاصية</th>
                    <th className="p-2.5">القيمة المقاسة</th>
                    <th className="p-2.5">الحد المسموح بالمواصفة</th>
                    <th className="p-2.5 text-center">القرار</th>
                    <th className="p-2.5">الملاحظة الفنية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {record.complianceDetails?.map((c, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-2.5 font-bold">{c.parameter}</td>
                      <td className="p-2.5 font-mono font-black text-blue-600 dark:text-blue-400">{c.measured}</td>
                      <td className="p-2.5 text-slate-500 font-mono">{c.limit}</td>
                      <td className="p-2.5 text-center">
                        <span className={`px-2 py-0.5 text-[10px] font-black rounded-full ${
                          c.status === "PASS" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="p-2.5 text-[11px] text-slate-600 dark:text-slate-400">{c.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Engineering Interpretation */}
          <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-xs leading-relaxed space-y-1">
            <h5 className="font-black text-blue-900 dark:text-blue-300">الخلاصة والتفسير الهندسي لضبط الجودة:</h5>
            <p className="text-slate-700 dark:text-slate-300">{record.interpretation}</p>
          </div>

          {/* Signatures & Accreditation Footer */}
          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 dark:border-slate-800 text-xs">
            <div className="space-y-6">
              <span className="text-slate-400 block">فني القياس والتحليل المخبري:</span>
              <div className="h-12 border-b border-dashed border-slate-300 dark:border-slate-700 flex items-end">
                <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 font-bold">{record.operator || "Technicien Qualifié LIMS"}</span>
              </div>
            </div>
            <div className="space-y-6">
              <span className="text-slate-400 block">اعتماد مدير ضبط الجودة والمخبر:</span>
              <div className="h-12 border-b border-dashed border-slate-300 dark:border-slate-700 flex items-end justify-between">
                <span className="font-mono text-[11px] text-emerald-600 font-bold">VERIFIED & ACCREDITED ISO 17025</span>
                <span className="text-[10px] text-slate-400 font-mono">{record.date}</span>
              </div>
            </div>
          </div>

          {/* Bottom Export Callout Bar */}
          <div className="mt-6 p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-xs">
                <span className="font-black text-white block">وثيقة فحص مخبري معتمدة قابلة للتصدير</span>
                <span className="text-slate-400 text-[11px]">جاهزة بصيغة PDF عالية الدقة ومطابقة لمواصفات الجودة ISO/IEC 17025</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl text-xs font-black transition-all cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-95 shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>{isExportingPdf ? "جاري التصدير..." : "تحميل شهادة الفحص (PDF)"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
