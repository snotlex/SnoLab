import React, { useRef, useState } from "react";
import { 
  X, 
  Printer, 
  Download, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Award, 
  Calendar, 
  User, 
  Building2, 
  FlaskConical, 
  FileText,
  Layers,
  Scale,
  Activity,
  Loader2
} from "lucide-react";
import { MaterialTestRecord } from "../../types/laboratoryTypes";
import { downloadLabTestPdf } from "../../services/pdf";

interface TestReportModalProps {
  testRecord: MaterialTestRecord | null;
  onClose: () => void;
}

export const TestReportModal: React.FC<TestReportModalProps> = ({ testRecord, onClose }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  if (!testRecord) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    if (isExporting) return;
    try {
      setIsExporting(true);
      await downloadLabTestPdf(testRecord, {
        language: "fr"
      });
    } catch (err) {
      console.error("PDF export failed:", err);
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  const statusColor = testRecord.status === "PASS"
    ? "text-emerald-600 bg-emerald-50 border-emerald-300 dark:bg-emerald-950/30 dark:text-emerald-400"
    : testRecord.status === "WARNING"
    ? "text-amber-600 bg-amber-50 border-amber-300 dark:bg-amber-950/30 dark:text-amber-400"
    : "text-rose-600 bg-rose-50 border-rose-300 dark:bg-rose-950/30 dark:text-rose-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col my-6 max-h-[90vh]">
        
        {/* Header toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
              <FlaskConical size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>تقرير الفحص المخبري الرسمي</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                  {testRecord.id}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                شهادة مطابقة وتوصيف خواص المواد الإنشائية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              <Printer size={14} />
              <span>طباعة</span>
            </button>
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white shadow transition cursor-pointer"
            >
              {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              <span>{isExporting ? "جاري التصدير..." : "تصدير PDF"}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Report Document Body */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6 text-right" dir="rtl" ref={reportRef}>
          
          {/* Letterhead Header */}
          <div className="border-b-2 border-blue-600 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-blue-600 dark:text-blue-400 font-mono">
                  SNOLAB ENGINEERING
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                  LIMS ISO/IEC 17025
                </span>
              </div>
              <h1 className="text-lg font-black text-slate-900 dark:text-white">
                {testRecord.testTitleAr}
              </h1>
              <div className="text-xs font-mono text-slate-500">
                {testRecord.testTitleFr} • {testRecord.testTitleEn}
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-left text-xs font-mono space-y-1 min-w-[200px]" dir="ltr">
              <div className="flex justify-between">
                <span className="text-slate-400">Ref:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{testRecord.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Standard:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{testRecord.standard}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{testRecord.date}</span>
              </div>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sample & Material Information */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <h4 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={14} />
                <span>بيانات المادة والعينة المخبرية</span>
              </h4>
              <div className="text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">اسم المادة المفحوصة:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{testRecord.materialName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">الصنف الهندسي:</span>
                  <span className="font-semibold">{testRecord.materialCategory}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">رقم تعريف العينة (Sample ID):</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{testRecord.sampleId}</span>
                </div>
                {testRecord.sampleDescription && (
                  <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-700">
                    {testRecord.sampleDescription}
                  </div>
                )}
              </div>
            </div>

            {/* Test Execution Context */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <h4 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 size={14} />
                <span>جهة الفحص والمشروع الهندسي</span>
              </h4>
              <div className="text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">المشروع الهندسي:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{testRecord.projectName || "المشروع العام للتوصيف"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">المخبر المنفذ:</span>
                  <span className="font-semibold">{testRecord.laboratoryName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">المهندس / التقني المسؤول:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{testRecord.operator}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">حالة الربط بمكتبة المواد:</span>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    {testRecord.syncedToMaterial ? "✓ متصل ومحدث تلقائياً" : "سجل مرجعي"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Measurements & Calculation Results Table */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Scale size={16} className="text-blue-500" />
              <span>جدول القياسات والنتائج الحسابية</span>
            </h4>

            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">الخاصية / المؤشر</th>
                    <th className="py-2.5 px-3">القيمة المقاسة</th>
                    <th className="py-2.5 px-3">الحدود المعيارية</th>
                    <th className="py-2.5 px-3">حالة المطابقة</th>
                    <th className="py-2.5 px-3">ملاحظات هندسية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {testRecord.complianceDetails?.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{item.parameter}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">{item.measured}</td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono">{item.limit}</td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
                          item.status === "PASS" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : item.status === "WARNING" ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                          : "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                        }`}>
                          {item.status === "PASS" && <CheckCircle size={10} />}
                          {item.status === "WARNING" && <AlertTriangle size={10} />}
                          {item.status === "FAIL" && <XCircle size={10} />}
                          <span>{item.status === "PASS" ? "مطابق" : item.status === "WARNING" ? "تنبيه" : "غير مطابق"}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 text-[11px]">{item.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Validation & Verdict Card */}
          <div className={`p-4 rounded-xl border ${statusColor} space-y-2`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {testRecord.status === "PASS" && <CheckCircle size={20} className="text-emerald-500" />}
                {testRecord.status === "WARNING" && <AlertTriangle size={20} className="text-amber-500" />}
                {testRecord.status === "FAIL" && <XCircle size={20} className="text-rose-500" />}
                <span className="font-black text-sm">
                  {testRecord.status === "PASS" ? "قرار الاعتماد المخبري: مقبول ومعتمد (CONFORMING)"
                    : testRecord.status === "WARNING" ? "قرار الاعتماد المخبري: مقبول بشروط ومراقبة (CONDITIONAL)"
                    : "قرار الاعتماد المخبري: مرفوض وغير مطابق (NON-CONFORMING)"}
                </span>
              </div>
              <span className="font-mono font-black text-sm">
                مؤشر الجودة: {testRecord.score || 95}%
              </span>
            </div>

            <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              {testRecord.interpretation}
            </p>
          </div>

          {/* Notes & Sign-off */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div className="text-xs text-slate-500 space-y-1">
              <div className="font-bold text-slate-700 dark:text-slate-300">ملاحظات المخبر العام:</div>
              <p>{testRecord.notes || "تمت التجارب وفق الإجراءات المعيارية الصارمة مع مطابقة الأجهزة المخبرية لدليل الجودة."}</p>
            </div>

            <div className="text-center p-3 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/30 space-y-3">
              <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
                توقيع واعتماد رئيس المخبر الهندسي
              </div>
              <div className="h-10 flex items-center justify-center font-mono text-xs font-black text-blue-600 tracking-wider">
                [ SIGNED & CERTIFIED ]
              </div>
              <div className="text-[10px] text-slate-400">
                {testRecord.operator} • {testRecord.date}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
