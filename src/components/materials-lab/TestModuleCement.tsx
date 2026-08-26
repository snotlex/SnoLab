import React, { useState, useMemo } from "react";
import { 
  FlaskConical, 
  Save, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Scale, 
  Clock, 
  Layers, 
  FileCheck,
  TrendingUp
} from "lucide-react";
import { EngineeringMaterial } from "../../types";
import { MaterialTestRecord } from "../../types/laboratoryTypes";
import { calculateCementProperties } from "../../utils/materialTestingCalculators";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

interface TestModuleCementProps {
  material: EngineeringMaterial;
  operator: string;
  projectName?: string;
  onSaveTest: (test: MaterialTestRecord, updatedMaterialProps?: Record<string, any>) => void;
  onCancel: () => void;
}

export const TestModuleCement: React.FC<TestModuleCementProps> = ({
  material,
  operator,
  projectName = "مشروع الخرسانة النموذجي",
  onSaveTest,
  onCancel
}) => {
  const [sampleId, setSampleId] = useState(`SMP-CEM-${Date.now().toString().slice(-4)}`);
  const [testDate, setTestDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  const [strengthClass, setStrengthClass] = useState<"32.5" | "42.5" | "52.5">("42.5");
  const [specificGravity, setSpecificGravity] = useState<number>(3.12); // g/cm³
  const [blaine, setBlaine] = useState<number>(3650); // cm²/g
  const [residue45um, setResidue45um] = useState<number>(4.5); // %
  const [normalConsistency, setNormalConsistency] = useState<number>(27.2); // %
  const [initialSetting, setInitialSetting] = useState<number>(145); // min
  const [finalSetting, setFinalSetting] = useState<number>(230); // min
  const [soundness, setSoundness] = useState<number>(1.2); // mm expansion
  const [strength2d, setStrength2d] = useState<number>(22.4); // MPa
  const [strength7d, setStrength7d] = useState<number>(36.8); // MPa
  const [strength28d, setStrength28d] = useState<number>(48.5); // MPa
  const [flexural28d, setFlexural28d] = useState<number>(7.2); // MPa

  const computed = useMemo(() => {
    const res = calculateCementProperties(
      blaine,
      normalConsistency,
      initialSetting,
      finalSetting,
      soundness,
      strength2d,
      strength7d,
      strength28d,
      strengthClass,
      specificGravity,
      residue45um,
      flexural28d
    );

    const chartData = [
      { age: "2 days", strength: strength2d, minLimit: strengthClass === "52.5" ? 20 : 10 },
      { age: "7 days", strength: strength7d, minLimit: strengthClass === "52.5" ? 35 : 28 },
      { age: "28 days", strength: strength28d, minLimit: strengthClass === "52.5" ? 52.5 : strengthClass === "42.5" ? 42.5 : 32.5 }
    ];

    return {
      titleAr: "توصيف واختبارات الإسمنت المعيارية (Cement Characterization)",
      titleFr: "Essais mécaniques et physiques du ciment",
      titleEn: "Cement Standard Characterization & Strength",
      standard: "NF EN 196 (1, 3, 6) / NF EN 197-1",
      results: res,
      status: res.status,
      score: res.status === "PASS" ? 98 : res.status === "WARNING" ? 80 : 50,
      interpretation: res.interpretation,
      compliance: res.compliance,
      chartData,
      syncedProps: {
        strengthClass,
        cementClass: material.cementClass || "CEM II/A-L",
        specificGravity: specificGravity,
        density: Math.round(specificGravity * 1000)
      }
    };
  }, [blaine, normalConsistency, initialSetting, finalSetting, soundness, strength2d, strength7d, strength28d, strengthClass, specificGravity, residue45um, flexural28d, material]);

  const handleSave = () => {
    const record: MaterialTestRecord = {
      id: `TEST-CEM-${Date.now().toString().slice(-6)}`,
      testType: "CEM_CHARACTERIZATION",
      testTitleAr: computed.titleAr,
      testTitleFr: computed.titleFr,
      testTitleEn: computed.titleEn,
      category: "cement",
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
      inputs: {
        strengthClass,
        blaine,
        normalConsistency,
        initialSetting,
        finalSetting,
        soundness,
        strength2d,
        strength7d,
        strength28d
      },
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
      
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
              {computed.standard}
            </span>
            <h2 className="text-base font-black">{computed.titleAr}</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            الإسمنت المفحوص: <span className="text-white font-bold">{material.name}</span>
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

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Inputs */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Scale size={16} className="text-blue-500" />
              <span>قياسات واختبارات الإسمنت المخبرية</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-500 font-semibold mb-1 block">الصنف المعياري للمقاومة</label>
                <select
                  value={strengthClass}
                  onChange={(e) => setStrengthClass(e.target.value as any)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs"
                >
                  <option value="32.5">32.5 N/R</option>
                  <option value="42.5">42.5 N/R</option>
                  <option value="52.5">52.5 N/R</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-500 font-semibold mb-1 block">الكثافة الحقيقية (g/cm³)</label>
                <input
                  type="number"
                  step="0.01"
                  value={specificGravity}
                  onChange={(e) => setSpecificGravity(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-mono font-bold text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-500 font-semibold mb-1 block">نعومة بلين (cm²/g)</label>
                <input
                  type="number"
                  value={blaine}
                  onChange={(e) => setBlaine(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-mono font-bold text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 font-semibold mb-1 block">متبقي منخل 45µm (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={residue45um}
                  onChange={(e) => setResidue45um(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-mono font-bold text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-500 font-semibold mb-1 block">القوام القياسي فيكات (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={normalConsistency}
                  onChange={(e) => setNormalConsistency(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-mono font-bold text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 font-semibold mb-1 block">تمدد لوشاتوليه (mm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={soundness}
                  onChange={(e) => setSoundness(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-mono font-bold text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-500 font-semibold mb-1 block">زمن الشك الابتدائي (دقيقة)</label>
                <input
                  type="number"
                  value={initialSetting}
                  onChange={(e) => setInitialSetting(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-mono font-bold text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 font-semibold mb-1 block">زمن الشك النهائي (دقيقة)</label>
                <input
                  type="number"
                  value={finalSetting}
                  onChange={(e) => setFinalSetting(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-mono font-bold text-xs"
                />
              </div>
            </div>

            {/* Mortar Strengths */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
              <div className="font-bold text-slate-700 dark:text-slate-300">مقاومة المونة المعيارية للضغط (EN 196-1)</div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">2 يوم (MPa)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={strength2d}
                    onChange={(e) => setStrength2d(Number(e.target.value))}
                    className="w-full px-2 py-1 text-center rounded border border-slate-300 dark:border-slate-700 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">7 يوم (MPa)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={strength7d}
                    onChange={(e) => setStrength7d(Number(e.target.value))}
                    className="w-full px-2 py-1 text-center rounded border border-slate-300 dark:border-slate-700 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">28 يوم (MPa)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={strength28d}
                    onChange={(e) => setStrength28d(Number(e.target.value))}
                    className="w-full px-2 py-1 text-center rounded border border-slate-300 dark:border-slate-700 font-mono font-bold text-blue-600 dark:text-blue-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">مقاومة الشد بالانحناء 28 يوم (Flexural Strength MPa)</label>
                <input
                  type="number"
                  step="0.1"
                  value={flexural28d}
                  onChange={(e) => setFlexural28d(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-mono font-bold text-xs"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex gap-2">
              <button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition cursor-pointer"
              >
                <Save size={15} />
                <span>حفظ نتائج فحص الإسمنت</span>
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

        {/* Right Results & Charts */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck size={16} className="text-blue-500" />
                <span>جدول مطابقة خصائص الإسمنت</span>
              </span>
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full">
                {computed.results.strength28d} MPa @ 28j
              </span>
            </div>

            {/* Compliance Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-right">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold">
                  <tr>
                    <th className="py-2 px-3">الخاصية</th>
                    <th className="py-2 px-3">النتيجة</th>
                    <th className="py-2 px-3">المواصفة</th>
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

            {/* Interpretation */}
            <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <div className="font-bold text-blue-700 dark:text-blue-300 mb-0.5">تقرير التحقق المخبري للإسمنت:</div>
              {computed.interpretation}
            </div>
          </div>

          {/* Strength Growth Chart */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>منحنى تطور مقاومة المونة الإسمنتية مع الزمن (Strength vs Age)</span>
              <span className="font-mono text-blue-500 text-[11px]">EN 196-1</span>
            </div>
            <div className="h-56 w-full pt-2" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={computed.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis dataKey="age" tick={{ fontSize: 10 }} />
                  <YAxis unit=" MPa" domain={[0, 65]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Line type="monotone" dataKey="strength" name="المقاومة الفعلية (MPa)" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 5 }} />
                  <Line type="monotone" dataKey="minLimit" name="الحد الأدنى للمواصفة" stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
