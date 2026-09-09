import React from "react";
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
  Share2
} from "lucide-react";
import { MaterialTestRecord } from "../../types/laboratoryTypes";

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
  if (!isOpen || !record) return null;

  const handlePrint = () => {
    window.print();
  };

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
              {language === "ar" ? "شهادة فحص مخبري وتقرير مراقبة الجودة" : "Laboratory Test Certificate & Quality Report"}
            </h3>
            <span className="font-mono text-xs text-slate-400">[{record.id}]</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm shadow-blue-500/20"
            >
              <Printer className="w-3.5 h-3.5" />
              {language === "ar" ? "طباعة الشهادة" : "Print Certificate"}
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
          {/* Certificate Header */}
          <div className="border-b-2 border-slate-900 dark:border-slate-100 pb-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-blue-600 dark:text-blue-400 font-black">
                  SNOLAB QUALITY CONTROL & MATERIAL TESTING
                </span>
                <h1 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  {record.laboratoryName || "مخبر مراقبة الجودة المركزي"}
                </h1>
                <p className="text-xs text-slate-500">
                  معتمد لجميع الفحوصات الفيزيائية والميكانيكية وفق المواصفات القياسية (EN / ASTM / NF)
                </p>
              </div>

              {/* Status Stamp */}
              <div className={`p-3 rounded-2xl border-2 text-center ${
                record.status === "PASS"
                  ? "border-emerald-500 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30"
                  : record.status === "WARNING"
                  ? "border-amber-500 text-amber-600 bg-amber-50/50 dark:bg-amber-950/30"
                  : "border-rose-500 text-rose-600 bg-rose-50/50 dark:bg-rose-950/30"
              }`}>
                <span className="text-[9px] font-black uppercase tracking-widest block">QC VERDICT</span>
                <span className="text-lg font-black tracking-wider">
                  {record.status === "PASS" ? "مطابق (PASS)" : record.status === "WARNING" ? "مشروط (WARNING)" : "مرفوض (FAIL)"}
                </span>
              </div>
            </div>

            <div className="text-center pt-2">
              <h2 className="text-base font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                {record.testTitleAr}
              </h2>
              <span className="text-xs text-slate-500 font-mono">
                Standard: {record.standard} | Code: {record.testType}
              </span>
            </div>
          </div>

          {/* Sample & Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block font-bold">المادة المختبرة:</span>
              <span className="font-black text-slate-800 dark:text-slate-200">{record.materialName}</span>
              <span className="text-[10px] text-slate-400 block">({record.materialCategory})</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold">كود العينة (Sample ID):</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{record.sampleId}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold">تاريخ الفحص:</span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{record.date}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold">المهندس الفاحص:</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">{record.operator}</span>
            </div>
          </div>

          {/* Raw Measured Results Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">
              1. النتائج والخواص المقاسة والمحسوبة:
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
              2. جدول التحقق من الحدود المعيارية والمطابقة:
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
              <span className="text-slate-400 block">فني القياس والتحليل:</span>
              <div className="h-12 border-b border-dashed border-slate-300 dark:border-slate-700 flex items-end">
                <span className="font-mono text-[11px] text-slate-500">{record.operator}</span>
              </div>
            </div>
            <div className="space-y-6">
              <span className="text-slate-400 block">اعتماد مدير ضبط الجودة والمخبر:</span>
              <div className="h-12 border-b border-dashed border-slate-300 dark:border-slate-700 flex items-end justify-between">
                <span className="font-mono text-[11px] text-emerald-600 font-bold">VERIFIED & APPROVED</span>
                <span className="text-[10px] text-slate-400">{record.date}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
