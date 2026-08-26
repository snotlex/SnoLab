import React, { useState, useMemo } from "react";
import { 
  FlaskConical, 
  Save, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Scale, 
  FileCheck, 
  Sparkles
} from "lucide-react";
import { EngineeringMaterial } from "../../types";
import { MaterialTestRecord } from "../../types/laboratoryTypes";
import { calculateSCMProperties } from "../../utils/materialTestingCalculators";

interface TestModuleSCMProps {
  material: EngineeringMaterial;
  operator: string;
  projectName?: string;
  onSaveTest: (test: MaterialTestRecord, updatedMaterialProps?: Record<string, any>) => void;
  onCancel: () => void;
}

export const TestModuleSCM: React.FC<TestModuleSCMProps> = ({
  material,
  operator,
  projectName = "مشروع الخرسانة النموذجي",
  onSaveTest,
  onCancel
}) => {
  const [sampleId, setSampleId] = useState(`SMP-SCM-${Date.now().toString().slice(-4)}`);
  const [testDate, setTestDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  const [scmType, setScmType] = useState<"silica_fume" | "fly_ash" | "slag" | "metakaolin">("silica_fume");
  const [specificGravity, setSpecificGravity] = useState<number>(2.22);
  const [fineness, setFineness] = useState<number>(18000); // BET m²/kg or Blaine
  const [pozzolanicIndex, setPozzolanicIndex] = useState<number>(108); // %
  const [loi, setLoi] = useState<number>(1.8); // % Loss on ignition
  const [sio2, setSio2] = useState<number>(92.5); // %

  const computed = useMemo(() => {
    const res = calculateSCMProperties(scmType, specificGravity, fineness, pozzolanicIndex, loi, sio2);
    return {
      titleAr: "توصيف الإضافات المعدنية والفعالية البوزولانية (Mineral Additions Test)",
      titleFr: "Caractérisation des additions minérales",
      titleEn: "Supplementary Cementitious Materials (SCM) Characterization",
      standard: "NF EN 13263 / NF EN 450-1 / ASTM C618",
      results: res,
      status: res.status,
      score: res.status === "PASS" ? 98 : 75,
      interpretation: res.interpretation,
      compliance: res.compliance,
      syncedProps: {
        density: specificGravity * 1000,
        ssdDensity: specificGravity * 1000
      }
    };
  }, [scmType, specificGravity, fineness, pozzolanicIndex, loi, sio2]);

  const handleSave = () => {
    const record: MaterialTestRecord = {
      id: `TEST-SCM-${Date.now().toString().slice(-6)}`,
      testType: "SCM_CHARACTERIZATION",
      testTitleAr: computed.titleAr,
      testTitleFr: computed.titleFr,
      testTitleEn: computed.titleEn,
      category: "additives",
      materialId: material.id,
      materialName: material.name,
      materialCategory: material.category,
      sampleId,
      projectId: "proj_active",
      projectName,
      operator,
      laboratoryName: "SnoLab Central Materials Laboratory",
      date: testDate,
      standard: computed.standard,
      inputs: { scmType, specificGravity, fineness, pozzolanicIndex, loi, sio2 },
      results: computed.results,
      status: computed.status,
      score: computed.score,
      interpretation: computed.interpretation,
      complianceDetails: computed.compliance,
      notes,
      syncedToMaterial: true,
      syncedProperties: computed.syncedProps,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSaveTest(record, computed.syncedProps);
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
              {computed.standard}
            </span>
            <h2 className="text-base font-black">{computed.titleAr}</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            المادة الإضافية: <span className="text-white font-bold">{material.name}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
            <span className="text-slate-400">Sample: </span>
            <span className="text-emerald-400 font-bold">{sampleId}</span>
          </div>
          <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
            <span className="text-slate-400">Date: </span>
            <span className="text-slate-200">{testDate}</span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Inputs */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Scale size={16} className="text-blue-500" />
              <span>قياسات الإضافات المعدنية (SCM)</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 dark:text-slate-400 font-semibold mb-1 block">نوع المادة البوزولانية</label>
                <select
                  value={scmType}
                  onChange={(e) => setScmType(e.target.value as any)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-xs"
                >
                  <option value="silica_fume">غبار السيليكا (Silica Fume)</option>
                  <option value="fly_ash">الرماد المتطاير (Fly Ash)</option>
                  <option value="slag">خبث الأفران العالية (GGBS Slag)</option>
                  <option value="metakaolin">الميتاكاولين (Metakaolin)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold mb-1 block">الكثافة الحقيقية</label>
                  <input
                    type="number"
                    step="0.01"
                    value={specificGravity}
                    onChange={(e) => setSpecificGravity(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold mb-1 block">مؤشر الفعالية 28j (%)</label>
                  <input
                    type="number"
                    value={pozzolanicIndex}
                    onChange={(e) => setPozzolanicIndex(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-mono font-bold text-blue-600 dark:text-blue-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold mb-1 block">فقد الحرق LOI (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={loi}
                    onChange={(e) => setLoi(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold mb-1 block">السيليكا SiO₂ (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={sio2}
                    onChange={(e) => setSio2(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex gap-2">
              <button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition cursor-pointer"
              >
                <Save size={15} />
                <span>حفظ نتائج فحص الإضافة</span>
              </button>
              <button
                onClick={onCancel}
                className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>

        {/* Right Results */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck size={16} className="text-blue-500" />
                <span>جدول مطابقة الإضافات البوزولانية والمعدنية</span>
              </span>
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full">
                IAP = {computed.results.pozzolanicActivity28dPercent}%
              </span>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-right">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold">
                  <tr>
                    <th className="py-2 px-3">الخاصية</th>
                    <th className="py-2 px-3">النتيجة</th>
                    <th className="py-2 px-3">الحد القياسي</th>
                    <th className="py-2 px-3">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {computed.compliance.map((c, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">{c.parameter}</td>
                      <td className="py-2 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">{c.measured}</td>
                      <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">{c.limit}</td>
                      <td className="py-2 px-3">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          c.status === "PASS" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                        }`}>
                          {c.status === "PASS" ? "✓ مطابق" : "✕ غير مطابق"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <div className="font-bold text-blue-700 dark:text-blue-300 mb-0.5">تقرير التحقق المخبري:</div>
              {computed.interpretation}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
