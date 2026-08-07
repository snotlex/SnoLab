import React from "react";
import { DREUX_KNOWLEDGE_BASE } from "../engine/dreuxKnowledgeBase";
import { ENCYCLOPEDIA_TERMS } from "../data/engineeringEncyclopedia";

interface DreuxEncyclopediaPdfContainerProps {
  language?: "ar" | "en" | "fr";
}

/**
 * Off-screen printable A4 pages for the Complete Dreux-Gorisse Encyclopedia PDF
 */
export const DreuxEncyclopediaPdfContainer: React.FC<DreuxEncyclopediaPdfContainerProps> = ({
  language = "ar"
}) => {
  const dateStr = new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div id="dreux-encyclopedia-pdf-export-root" className="fixed top-[-9999px] left-[-9999px] z-[-100] pointer-events-none opacity-0">
      
      {/* PAGE 1: COVER PAGE */}
      <div className="dreux-pdf-page bg-white text-slate-900 w-[210mm] h-[297mm] p-[15mm] flex flex-col justify-between border border-slate-300 shadow-none font-sans relative overflow-hidden" dir="rtl">
        {/* Decorative Top Accent Bar */}
        <div className="absolute top-0 right-0 left-0 h-3 bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-500"></div>

        {/* Top Header Logo & Metadata */}
        <div className="flex items-center justify-between pb-4 border-b-2 border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-700 text-white font-black flex items-center justify-center text-lg shadow-md font-mono">
              SNO
            </div>
            <div>
              <h2 className="font-black text-slate-900 text-sm tracking-tight">منصة SnoLab للهندسة المدنية والخرسانة</h2>
              <p className="text-[10px] text-slate-500 font-mono">SnoLab Concrete Technology Series • Academic Edition 2026</p>
            </div>
          </div>
          <div className="text-left font-mono text-[10px] text-slate-600 space-y-0.5">
            <div className="font-bold text-blue-700">Document Ref: SNO-DREUX-ENC-2026</div>
            <div>تاريخ الإصدار: {dateStr}</div>
            <div>Standard: NF EN 206 / NF P 18-541</div>
          </div>
        </div>

        {/* Cover Main Hero Block */}
        <div className="my-auto space-y-6 text-center px-4">
          <div className="inline-block bg-blue-50 border border-blue-200 text-blue-800 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider font-mono">
            🇫🇷 الدليل العلمي والموسوعة الهندسية الموحدة
          </div>

          <h1 className="text-3xl font-black text-slate-950 tracking-tight leading-tight max-w-xl mx-auto">
            موسوعة دروغوريس الشاملة لصياغة وتصميم الخرسانة الإنشائية
          </h1>

          <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
            Nouveau Guide de la Formulation des Bétons — Georges Dreux & Marc Gorisse
            <br />
            المحرك الشامل للدراسات الحبيبية، حسابات مقاومة الإسمنت، ومعادلات الارتصاص الكلي للحصويات
          </p>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-4 gap-3 my-6 max-w-lg mx-auto">
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center">
              <span className="block text-lg font-black text-blue-700 font-mono">5</span>
              <span className="text-[10px] text-slate-600 font-bold">فصول إنشائية</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center">
              <span className="block text-lg font-black text-blue-700 font-mono">12+</span>
              <span className="text-[10px] text-slate-600 font-bold">معادلة رياضية</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center">
              <span className="block text-lg font-black text-blue-700 font-mono">6</span>
              <span className="text-[10px] text-slate-600 font-bold">جداول معايرة</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center">
              <span className="block text-lg font-black text-blue-700 font-mono">20+</span>
              <span className="text-[10px] text-slate-600 font-bold">مصطلحاً معايراً</span>
            </div>
          </div>

          {/* Table of Contents Preview */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-right max-w-xl mx-auto space-y-2">
            <h3 className="font-black text-xs text-slate-800 border-b border-slate-200 pb-1">📑 فهرس فصول الموسوعة:</h3>
            <div className="grid grid-cols-1 gap-1.5 text-[11px] text-slate-700 font-medium">
              <div className="flex justify-between items-center bg-white p-2 rounded border border-slate-200">
                <span>الباب الأول: الدستور العلمي والمبادئ النظرية لطريقة دروكس-غوريس</span>
                <span className="font-mono font-bold text-blue-600 text-[10px]">صفحة 2</span>
              </div>
              <div className="flex justify-between items-center bg-white p-2 rounded border border-slate-200">
                <span>الباب الثاني: الدليل الرياضي والمعادلات الإنشائية الحاكمة</span>
                <span className="font-mono font-bold text-blue-600 text-[10px]">صفحة 3</span>
              </div>
              <div className="flex justify-between items-center bg-white p-2 rounded border border-slate-200">
                <span>الباب الثالث: الجداول المرجعية وتحديد كميات الماء والإسمنت</span>
                <span className="font-mono font-bold text-blue-600 text-[10px]">صفحة 4</span>
              </div>
              <div className="flex justify-between items-center bg-white p-2 rounded border border-slate-200">
                <span>الباب الرابع: القاموس الهندسي للمصطلحات والمواصفات (NF EN 206)</span>
                <span className="font-mono font-bold text-blue-600 text-[10px]">صفحة 5-6</span>
              </div>
              <div className="flex justify-between items-center bg-white p-2 rounded border border-slate-200">
                <span>الباب الخامس: مثال تطبيقي شامل ومحلول خطوة بخطوة (C25/30)</span>
                <span className="font-mono font-bold text-blue-600 text-[10px]">صفحة 7</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cover Footer */}
        <div className="pt-4 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500 font-mono">
          <div>SnoLab Concrete Mix Design Engine © 2026</div>
          <div>Page 1 of 7</div>
        </div>
      </div>


      {/* PAGE 2: CHAPTER 1 - CORE THEORETICAL PRINCIPLES */}
      <div className="dreux-pdf-page bg-white text-slate-900 w-[210mm] h-[297mm] p-[15mm] flex flex-col justify-between border border-slate-300 shadow-none font-sans relative overflow-hidden" dir="rtl">
        <div>
          {/* Header */}
          <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4">
            <span className="font-black text-xs text-blue-800">موسوعة دروغوريس • الباب الأول: المبادئ النظرية</span>
            <span className="font-mono text-[10px] text-slate-500">SnoLab Academic Reference</span>
          </div>

          <h2 className="text-lg font-black text-slate-900 mb-3 border-r-4 border-blue-600 pr-2">
            الباب الأول: الدستور والمبادئ النظرية لطريقة دروكس-غوريس (Georges Dreux)
          </h2>

          <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2">
              <h3 className="font-black text-blue-900 text-xs">1.1 فلسفة التراص الأقصى للحصويات (Maximizing Compactness)</h3>
              <p>
                تستند طريقة دروكس-غوريس الفرنسية المعيارية على المبدأ الفيزيائي لتصغير الفراغات الشعرية والبينية بين حبيبات الركام لأدنى حد ممكن.
                عبر الاستفادة من التوزيع التكاملي لحبيبات الرمل الناعم، الرمل الخشن، والحصى بمختلف المقاسات، تضمن الطريقة الوصول إلى معامل ارتصاص حجمي أقصى (γ₀)، مما ينعكس بشكل مباشر على زيادة المقاومة الميكانيكية ونقصان النفوذية.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2">
              <h3 className="font-black text-blue-900 text-xs">1.2 تعديل مقاومة الإسمنت الفعلي (Bolomey Formula Adaptation)</h3>
              <p>
                تستخدم الطريقة معادلة بولومي (Bolomey Equation) لحساب نسبة الموثق الإسمنتي إلى ماء الخلط (C/W).
                وفي التطبيق الهندسي الدقيق لـ Georges Dreux، تكون المقاومة الحقيقية للإسمنت المستخدم בעمر 28 يوماً (fce) أعلى من الرتبة الاسمية للمصنع بمقدار 10%:
              </p>
              <div className="bg-white p-2.5 rounded border border-blue-200 font-mono font-bold text-center text-blue-800 dir-ltr text-xs">
                fce = 1.1 × fcem
              </div>
              <p className="text-[10.5px] text-slate-600">
                حيث fcem هي رتبة الإسمنت الاسمية (مثل CEM I 42.5N فتصبح fce = 46.75 MPa).
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2">
              <h3 className="font-black text-blue-900 text-xs">1.3 نقطة الانعطاف المرجعية P(X, Y) لمعايير التدرج الحبيبي</h3>
              <p>
                يتم رسم منحنى التدرج الحبيبي المرجعي المثالي المكون من قطعتين مستقيمتين تلتقيان عند نقطة الانعطاف P(X, Y):
              </p>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="bg-white p-2.5 rounded border border-slate-200">
                  <span className="font-bold block text-[11px] text-slate-800">الإحداثي السيني (X):</span>
                  <span className="text-[10px] text-slate-600">
                    إذا كان Dmax ≤ 20mm فإن X = Dmax / 2.
                    <br />
                    إذا كان Dmax &gt; 20mm فإن X يقع في منتصف المسافة بين 5mm و Dmax على مقياس اللوغاريتم.
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded border border-slate-200">
                  <span className="font-bold block text-[11px] text-slate-800">الإحداثي الصادي (Y):</span>
                  <div className="font-mono text-blue-700 text-[11px] font-bold dir-ltr text-center my-1">
                    Y = 50 - √Dmax + K
                  </div>
                  <span className="text-[10px] text-slate-600">
                    حيث K هو معامل التماسك الحبيبي المعدل بدلالة الرص ونعومة الرمل وكمية الإسمنت.
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50/50 border border-blue-200 p-3 rounded-xl space-y-1">
              <h3 className="font-black text-blue-900 text-xs">1.4 التصحيح الإجباري للرطوبة وامتصاص الماء</h3>
              <p className="text-[11px]">
                الخرسانة المصممة مخبرياً تفترض حصويات جافة كلياً (Dry State). في الموقع العملي، تمتلك الحصويات نسبة رطوبة سطحية (Moisture M%) ونسبة امتصاص داخلي (Absorption A%).
                توجب طريقة دروكس تعديل كمية ماء الخلط الحقيقي وكمية الركام الرطب لضمان دقة نسبة W/C.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500 font-mono">
          <div>SnoLab Concrete Mix Design Engine © 2026</div>
          <div>Page 2 of 7</div>
        </div>
      </div>


      {/* PAGE 3: CHAPTER 2 - MATHEMATICAL EQUATIONS MANUAL */}
      <div className="dreux-pdf-page bg-white text-slate-900 w-[210mm] h-[297mm] p-[15mm] flex flex-col justify-between border border-slate-300 shadow-none font-sans relative overflow-hidden" dir="rtl">
        <div>
          <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4">
            <span className="font-black text-xs text-blue-800">موسوعة دروغوريس • الباب الثاني: المعادلات الهندسية</span>
            <span className="font-mono text-[10px] text-slate-500">SnoLab Academic Reference</span>
          </div>

          <h2 className="text-lg font-black text-slate-900 mb-3 border-r-4 border-blue-600 pr-2">
            الباب الثاني: الدليل الرياضي والمعادلات الإنشائية الحاكمة
          </h2>

          <div className="space-y-3">
            <table className="w-full text-right border-collapse border border-slate-200 text-[11px]">
              <thead>
                <tr className="bg-blue-950 text-white font-black">
                  <th className="p-2 border border-slate-300 w-1/4">اسم المعادلة</th>
                  <th className="p-2 border border-slate-300 w-1/3 text-center">الصيغة الرياضية</th>
                  <th className="p-2 border border-slate-300">التعريف والمتغيرات الإنشائية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                <tr className="bg-slate-50">
                  <td className="p-2 border border-slate-200 font-bold text-slate-900">المقاومة المستهدفة (Target Strength)</td>
                  <td className="p-2 border border-slate-200 font-mono font-bold text-blue-700 dir-ltr text-center">fcm = fck28 + 1.64 × σ</td>
                  <td className="p-2 border border-slate-200 text-[10px]">fck28: المقاومة المميزة المطلوبة، σ: الانحراف المعياري للضبط المخبري (4 - 7 MPa).</td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-200 font-bold text-slate-900">نسبة الإسمنت للماء (C/W Ratio)</td>
                  <td className="p-2 border border-slate-200 font-mono font-bold text-blue-700 dir-ltr text-center">C/W = (fcm / (G × fce)) + 0.5</td>
                  <td className="p-2 border border-slate-200 text-[10px]">G: معامل الجودة الحبيبية للركام (0.35 - 0.55)، fce: المقاومة الفعالة للإسمنت بعمر 28 يوم.</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="p-2 border border-slate-200 font-bold text-slate-900">جرعة الإسمنت الدنيا (Min Cement)</td>
                  <td className="p-2 border border-slate-200 font-mono font-bold text-blue-700 dir-ltr text-center">Cmin = 550 / ⁵√Dmax</td>
                  <td className="p-2 border border-slate-200 text-[10px]">قاعدة دروكس لتحديد الحد الأدنى للإسمنت لحماية حديد التسليح من التآكل بالمناخ العادي.</td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-200 font-bold text-slate-900">إحداثيات نقطة الانعطاف Y</td>
                  <td className="p-2 border border-slate-200 font-mono font-bold text-blue-700 dir-ltr text-center">Y = 50 - √Dmax + K</td>
                  <td className="p-2 border border-slate-200 text-[10px]">K = K0 + Ks (K0 من جدول الرص، Ks تصحيح معامل نعومة الرمل FM).</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="p-2 border border-slate-200 font-bold text-slate-900">حجم الحجم الصلب (Solid Volume)</td>
                  <td className="p-2 border border-slate-200 font-mono font-bold text-blue-700 dir-ltr text-center">Vsolids = γ0 × 1000  [L/m³]</td>
                  <td className="p-2 border border-slate-200 text-[10px]">γ0: معامل الارتصاص الكلي الحجمي المستخرج من جدول دروكس 4.4.</td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-200 font-bold text-slate-900">الحجم الصلب الصافي للركام</td>
                  <td className="p-2 border border-slate-200 font-mono font-bold text-blue-700 dir-ltr text-center">Vagg = Vsolids - (C / ρc)</td>
                  <td className="p-2 border border-slate-200 text-[10px]">C: وزن الإسمنت بالـ kg/m³، ρc: الكثافة النوعية للإسمنت (غالباً 3.1 kg/L).</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="p-2 border border-slate-200 font-bold text-slate-900">الكتلة المائية المعدلة للرطوبة</td>
                  <td className="p-2 border border-slate-200 font-mono font-bold text-blue-700 dir-ltr text-center">Wact = Wdes - Σ(Mi - Ai) × M_agg</td>
                  <td className="p-2 border border-slate-200 text-[10px]">Mi: نسبة رطوبة الركام i، Ai: نسبة امتصاص الركام i، M_agg: الوزن الجاف للركام.</td>
                </tr>
              </tbody>
            </table>

            <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl mt-4 space-y-1">
              <h3 className="font-black text-blue-900 text-xs">💡 قاعدة التحقق من الحجم الكلي (Volume Consistency Check):</h3>
              <p className="text-[10.5px] text-slate-700 leading-relaxed">
                في خرسانة طازجة مدموكة جيداً، يجب أن يتحقق شرط اتزان الحجم الفيزيائي للمتر المكعب الواحد:
              </p>
              <div className="font-mono text-center font-bold text-blue-800 text-xs dir-ltr bg-white p-2 rounded border border-blue-200">
                (Cement / ρc) + (Sand / ρs) + (Gravel / ρg) + Water + Air = 1000 Liters
              </div>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500 font-mono">
          <div>SnoLab Concrete Mix Design Engine © 2026</div>
          <div>Page 3 of 7</div>
        </div>
      </div>


      {/* PAGE 4: CHAPTER 3 - REFERENCE LOOKUP TABLES */}
      <div className="dreux-pdf-page bg-white text-slate-900 w-[210mm] h-[297mm] p-[15mm] flex flex-col justify-between border border-slate-300 shadow-none font-sans relative overflow-hidden" dir="rtl">
        <div>
          <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4">
            <span className="font-black text-xs text-blue-800">موسوعة دروغوريس • الباب الثالث: الجداول المرجعية</span>
            <span className="font-mono text-[10px] text-slate-500">SnoLab Academic Reference</span>
          </div>

          <h2 className="text-lg font-black text-slate-900 mb-3 border-r-4 border-blue-600 pr-2">
            الباب الثالث: الجداول المرجعية وتحديد كميات الماء والإسمنت
          </h2>

          <div className="space-y-4">
            {/* Table 3.1 Base Water Demand */}
            <div>
              <h3 className="font-black text-xs text-blue-950 mb-1">جدول 3.1: كمية ماء الخلط الأساسية (W Liters/m³) بدلالة Dmax وهبوط السلمب</h3>
              <table className="w-full text-center border-collapse border border-slate-300 text-[10px]">
                <thead>
                  <tr className="bg-slate-800 text-white font-bold">
                    <th className="p-1.5 border border-slate-300">القطر الأقصى Dmax (mm)</th>
                    <th className="p-1.5 border border-slate-300">4 mm</th>
                    <th className="p-1.5 border border-slate-300">8 mm</th>
                    <th className="p-1.5 border border-slate-300">12.5 mm</th>
                    <th className="p-1.5 border border-slate-300">16 mm</th>
                    <th className="p-1.5 border border-slate-300">20 mm</th>
                    <th className="p-1.5 border border-slate-300">25 mm</th>
                    <th className="p-1.5 border border-slate-300">31.5 mm</th>
                    <th className="p-1.5 border border-slate-300">50 mm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-slate-800">
                  <tr>
                    <td className="p-1.5 border border-slate-300 font-sans font-bold bg-slate-100 text-right">الماء الأساسي (L/m³)</td>
                    <td className="p-1.5 border border-slate-300">310</td>
                    <td className="p-1.5 border border-slate-300">250</td>
                    <td className="p-1.5 border border-slate-300">220</td>
                    <td className="p-1.5 border border-slate-300">205</td>
                    <td className="p-1.5 border border-slate-300 font-bold text-blue-700">195</td>
                    <td className="p-1.5 border border-slate-300">185</td>
                    <td className="p-1.5 border border-slate-300">175</td>
                    <td className="p-1.5 border border-slate-300">160</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Table 3.2 Granular Constant K */}
            <div>
              <h3 className="font-black text-xs text-blue-950 mb-1">جدول 3.2: قيم معامل التماسك الحبيبي K0 بدلالة نوع الدمك والرمل ومحتوى الإسمنت</h3>
              <table className="w-full text-center border-collapse border border-slate-300 text-[10px]">
                <thead>
                  <tr className="bg-slate-800 text-white font-bold">
                    <th className="p-1.5 border border-slate-300 text-right" rowSpan={2}>طريقة وطاقة الدمك والاهتزاز</th>
                    <th className="p-1.5 border border-slate-300" colSpan={2}>Dmax ≤ 12.5 mm</th>
                    <th className="p-1.5 border border-slate-300" colSpan={2}>Dmax = 20 mm</th>
                    <th className="p-1.5 border border-slate-300" colSpan={2}>Dmax ≥ 31.5 mm</th>
                  </tr>
                  <tr className="bg-slate-700 text-white font-semibold">
                    <th className="p-1 border border-slate-300">حصى حصوي</th>
                    <th className="p-1 border border-slate-300">حصى مكسر</th>
                    <th className="p-1 border border-slate-300">حصى حصوي</th>
                    <th className="p-1 border border-slate-300">حصى مكسر</th>
                    <th className="p-1 border border-slate-300">حصى حصوي</th>
                    <th className="p-1 border border-slate-300">حصى مكسر</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-slate-800">
                  <tr>
                    <td className="p-1.5 border border-slate-300 font-sans font-bold bg-slate-100 text-right">اهتزاز قوي جداً (Vibration très puissante)</td>
                    <td className="p-1.5 border border-slate-300">-2</td>
                    <td className="p-1.5 border border-slate-300">0</td>
                    <td className="p-1.5 border border-slate-300">-4</td>
                    <td className="p-1.5 border border-slate-300">-2</td>
                    <td className="p-1.5 border border-slate-300">-6</td>
                    <td className="p-1.5 border border-slate-300">-4</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="p-1.5 border border-slate-300 font-sans font-bold bg-slate-100 text-right">اهتزاز عادي عالي الجودة (Vibration normale)</td>
                    <td className="p-1.5 border border-slate-300">0</td>
                    <td className="p-1.5 border border-slate-300">+2</td>
                    <td className="p-1.5 border border-slate-300 font-bold text-blue-700">-2</td>
                    <td className="p-1.5 border border-slate-300 font-bold text-blue-700">0</td>
                    <td className="p-1.5 border border-slate-300">-4</td>
                    <td className="p-1.5 border border-slate-300">-2</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 border border-slate-300 font-sans font-bold bg-slate-100 text-right">دك يدوي بدون اهتزاز (Piquage manuel)</td>
                    <td className="p-1.5 border border-slate-300">+2</td>
                    <td className="p-1.5 border border-slate-300">+4</td>
                    <td className="p-1.5 border border-slate-300">0</td>
                    <td className="p-1.5 border border-slate-300">+2</td>
                    <td className="p-1.5 border border-slate-300">-2</td>
                    <td className="p-1.5 border border-slate-300">0</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Table 3.3 Compactness Gamma0 */}
            <div>
              <h3 className="font-black text-xs text-blue-950 mb-1">جدول 3.3: معامل الارتصاص الحجمي γ0 بدلالة القوام وDmax</h3>
              <table className="w-full text-center border-collapse border border-slate-300 text-[10px]">
                <thead>
                  <tr className="bg-slate-800 text-white font-bold">
                    <th className="p-1.5 border border-slate-300 text-right">فئة القوام (Consistency)</th>
                    <th className="p-1.5 border border-slate-300">Slump (cm)</th>
                    <th className="p-1.5 border border-slate-300">Dmax = 8mm</th>
                    <th className="p-1.5 border border-slate-300">Dmax = 16mm</th>
                    <th className="p-1.5 border border-slate-300">Dmax = 20mm</th>
                    <th className="p-1.5 border border-slate-300">Dmax = 31.5mm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-slate-800">
                  <tr>
                    <td className="p-1.5 border border-slate-300 font-sans font-bold bg-slate-100 text-right">جاف شديد القوام (Ferme S1)</td>
                    <td className="p-1.5 border border-slate-300">0 - 4 cm</td>
                    <td className="p-1.5 border border-slate-300">0.800</td>
                    <td className="p-1.5 border border-slate-300">0.825</td>
                    <td className="p-1.5 border border-slate-300">0.830</td>
                    <td className="p-1.5 border border-slate-300">0.840</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="p-1.5 border border-slate-300 font-sans font-bold bg-slate-100 text-right">بلاستيكي معتدل (Plastique S2)</td>
                    <td className="p-1.5 border border-slate-300">5 - 9 cm</td>
                    <td className="p-1.5 border border-slate-300">0.775</td>
                    <td className="p-1.5 border border-slate-300">0.800</td>
                    <td className="p-1.5 border border-slate-300 font-bold text-blue-700">0.805</td>
                    <td className="p-1.5 border border-slate-300">0.815</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 border border-slate-300 font-sans font-bold bg-slate-100 text-right">مبتل انسيابي (Très Plastique S3)</td>
                    <td className="p-1.5 border border-slate-300">10 - 15 cm</td>
                    <td className="p-1.5 border border-slate-300">0.750</td>
                    <td className="p-1.5 border border-slate-300">0.775</td>
                    <td className="p-1.5 border border-slate-300">0.780</td>
                    <td className="p-1.5 border border-slate-300">0.790</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="p-1.5 border border-slate-300 font-sans font-bold bg-slate-100 text-right">سائل جداً (Fluide S4)</td>
                    <td className="p-1.5 border border-slate-300">≥ 16 cm</td>
                    <td className="p-1.5 border border-slate-300">0.725</td>
                    <td className="p-1.5 border border-slate-300">0.750</td>
                    <td className="p-1.5 border border-slate-300">0.755</td>
                    <td className="p-1.5 border border-slate-300">0.765</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500 font-mono">
          <div>SnoLab Concrete Mix Design Engine © 2026</div>
          <div>Page 4 of 7</div>
        </div>
      </div>


      {/* PAGE 5: CHAPTER 4 - ENCYCLOPEDIA TERMS DICTIONARY (PART 1) */}
      <div className="dreux-pdf-page bg-white text-slate-900 w-[210mm] h-[297mm] p-[15mm] flex flex-col justify-between border border-slate-300 shadow-none font-sans relative overflow-hidden" dir="rtl">
        <div>
          <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-3">
            <span className="font-black text-xs text-blue-800">موسوعة دروغوريس • الباب الرابع: القاموس الهندسي (1)</span>
            <span className="font-mono text-[10px] text-slate-500">SnoLab Academic Reference</span>
          </div>

          <h2 className="text-base font-black text-slate-900 mb-2 border-r-4 border-blue-600 pr-2">
            الباب الرابع: القاموس الهندسي الشامل للمصطلحات والمواصفات (NF EN 206)
          </h2>

          <div className="grid grid-cols-2 gap-2 text-[10px]">
            {ENCYCLOPEDIA_TERMS.slice(0, 8).map((term, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl space-y-1">
                <div className="flex justify-between items-start">
                  <span className="font-black text-blue-900 text-[10.5px]">{term.termAr}</span>
                  <span className="text-[8.5px] bg-blue-100 text-blue-800 font-mono px-1 rounded font-bold">{term.standard}</span>
                </div>
                <div className="text-[9px] text-slate-500 font-mono dir-ltr text-right">{term.termEn}</div>
                <p className="text-[9.5px] text-slate-700 leading-snug">{term.definitionAr}</p>
                {term.formula && (
                  <div className="bg-white p-1 rounded border border-slate-200 font-mono text-[9px] text-blue-800 font-bold dir-ltr text-center">
                    {term.formula}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500 font-mono">
          <div>SnoLab Concrete Mix Design Engine © 2026</div>
          <div>Page 5 of 7</div>
        </div>
      </div>


      {/* PAGE 6: CHAPTER 4 - ENCYCLOPEDIA TERMS DICTIONARY (PART 2) */}
      <div className="dreux-pdf-page bg-white text-slate-900 w-[210mm] h-[297mm] p-[15mm] flex flex-col justify-between border border-slate-300 shadow-none font-sans relative overflow-hidden" dir="rtl">
        <div>
          <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-3">
            <span className="font-black text-xs text-blue-800">موسوعة دروغوريس • الباب الرابع: القاموس الهندسي (2)</span>
            <span className="font-mono text-[10px] text-slate-500">SnoLab Academic Reference</span>
          </div>

          <h2 className="text-base font-black text-slate-900 mb-2 border-r-4 border-blue-600 pr-2">
            تابع الباب الرابع: قاموس المصطلحات والمواصفات المعيارية
          </h2>

          <div className="grid grid-cols-2 gap-2 text-[10px]">
            {ENCYCLOPEDIA_TERMS.slice(8, 16).map((term, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl space-y-1">
                <div className="flex justify-between items-start">
                  <span className="font-black text-blue-900 text-[10.5px]">{term.termAr}</span>
                  <span className="text-[8.5px] bg-blue-100 text-blue-800 font-mono px-1 rounded font-bold">{term.standard}</span>
                </div>
                <div className="text-[9px] text-slate-500 font-mono dir-ltr text-right">{term.termEn}</div>
                <p className="text-[9.5px] text-slate-700 leading-snug">{term.definitionAr}</p>
                {term.formula && (
                  <div className="bg-white p-1 rounded border border-slate-200 font-mono text-[9px] text-blue-800 font-bold dir-ltr text-center">
                    {term.formula}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500 font-mono">
          <div>SnoLab Concrete Mix Design Engine © 2026</div>
          <div>Page 6 of 7</div>
        </div>
      </div>


      {/* PAGE 7: CHAPTER 5 - FULLY SOLVED STEP-BY-STEP WORKED EXAMPLE */}
      <div className="dreux-pdf-page bg-white text-slate-900 w-[210mm] h-[297mm] p-[15mm] flex flex-col justify-between border border-slate-300 shadow-none font-sans relative overflow-hidden" dir="rtl">
        <div>
          <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-3">
            <span className="font-black text-xs text-blue-800">موسوعة دروغوريس • الباب الخامس: مثال تطبيقي محلول</span>
            <span className="font-mono text-[10px] text-slate-500">SnoLab Academic Reference</span>
          </div>

          <h2 className="text-base font-black text-slate-900 mb-2 border-r-4 border-blue-600 pr-2">
            الباب الخامس: مثال تطبيقي تصميمي محلول بالكامل (C25/30 Concrete)
          </h2>

          <div className="space-y-3 text-[10.5px]">
            <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-xl">
              <h3 className="font-black text-blue-900 text-[11px] mb-1">📋 المعطيات الهندسية للخلطة الإنشائية:</h3>
              <div className="grid grid-cols-4 gap-2 font-mono text-[10px] text-center">
                <div className="bg-white p-1.5 rounded border border-blue-200">
                  <span className="block text-slate-500 text-[9px] font-sans">المقاومة fck28</span>
                  <span className="font-bold text-blue-700">25 MPa</span>
                </div>
                <div className="bg-white p-1.5 rounded border border-blue-200">
                  <span className="block text-slate-500 text-[9px] font-sans">القطر الأقصى Dmax</span>
                  <span className="font-bold text-blue-700">20 mm</span>
                </div>
                <div className="bg-white p-1.5 rounded border border-blue-200">
                  <span className="block text-slate-500 text-[9px] font-sans">الهبوط Slump</span>
                  <span className="font-bold text-blue-700">10 cm (S3)</span>
                </div>
                <div className="bg-white p-1.5 rounded border border-blue-200">
                  <span className="block text-slate-500 text-[9px] font-sans">نوع الإسمنت</span>
                  <span className="font-bold text-blue-700">CEM I 42.5N</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl space-y-1.5">
              <h3 className="font-black text-slate-900 text-[11px]">خطوات الحل بالتفصيل:</h3>
              <ol className="list-decimal list-inside space-y-1 text-slate-700 text-[10px] leading-relaxed">
                <li>
                  <strong>حساب المقاومة المستهدفة:</strong> fcm = 25 + 1.64 × 6 = <strong>34.84 MPa</strong>.
                </li>
                <li>
                  <strong>حساب المقاومة الفعالة للإسمنت:</strong> fce = 1.1 × 42.5 = <strong>46.75 MPa</strong>.
                </li>
                <li>
                  <strong>حساب نسبة C/W مع G = 0.50:</strong> C/W = (34.84 / (0.50 × 46.75)) + 0.5 = <strong>1.99</strong> (W/C = <strong>0.50</strong>).
                </li>
                <li>
                  <strong>استخراج ماء الخلط الأساسي W:</strong> لـ Dmax=20mm و Slump=10cm فإن W = <strong>195 L/m³</strong>.
                </li>
                <li>
                  <strong>حساب جرعة الإسمنت:</strong> C = 195 × 1.99 = <strong>388 kg/m³</strong>.
                </li>
                <li>
                  <strong>حساب إحداثيات نقطة الانعطاف P(X,Y):</strong> X = 20 / 2 = 10 mm. Y = 50 - √20 + (-2) = <strong>43.5%</strong>.
                </li>
              </ol>
            </div>

            {/* Final Recipe Output Table */}
            <div>
              <h3 className="font-black text-xs text-blue-950 mb-1">📊 النتيجة النهائية لتركيبة المتر المكعب (Batch Quantities / m³):</h3>
              <table className="w-full text-center border-collapse border border-slate-300 text-[10px]">
                <thead>
                  <tr className="bg-blue-900 text-white font-bold">
                    <th className="p-1.5 border border-slate-300 text-right">المادة المكونة</th>
                    <th className="p-1.5 border border-slate-300">الوزن الجاف (kg)</th>
                    <th className="p-1.5 border border-slate-300">تعديل الرطوبة (M%)</th>
                    <th className="p-1.5 border border-slate-300">الوزن الرطب بالموقع (kg)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-slate-800">
                  <tr>
                    <td className="p-1.5 border border-slate-300 font-sans font-bold bg-slate-100 text-right">الإسمنت (CEM I 42.5)</td>
                    <td className="p-1.5 border border-slate-300 font-bold">388 kg</td>
                    <td className="p-1.5 border border-slate-300">-</td>
                    <td className="p-1.5 border border-slate-300 font-bold text-blue-700">388 kg</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 border border-slate-300 font-sans font-bold bg-slate-100 text-right">الرمل الناعم (0/4 mm)</td>
                    <td className="p-1.5 border border-slate-300">745 kg</td>
                    <td className="p-1.5 border border-slate-300 text-amber-700">+4.5%</td>
                    <td className="p-1.5 border border-slate-300 font-bold text-blue-700">778 kg</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 border border-slate-300 font-sans font-bold bg-slate-100 text-right">الحصى الخشن (4/20 mm)</td>
                    <td className="p-1.5 border border-slate-300">1060 kg</td>
                    <td className="p-1.5 border border-slate-300 text-amber-700">+1.2%</td>
                    <td className="p-1.5 border border-slate-300 font-bold text-blue-700">1073 kg</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 border border-slate-300 font-sans font-bold bg-slate-100 text-right">ماء الخلط الصافي</td>
                    <td className="p-1.5 border border-slate-300">195 L</td>
                    <td className="p-1.5 border border-slate-300 text-emerald-700">- 46 L (مخصومة)</td>
                    <td className="p-1.5 border border-slate-300 font-black text-emerald-600">149 L</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-2 rounded text-[9.5px] text-emerald-800 text-center font-bold">
              ✅ تم التحقق من الكثافة الخرسانية الطازجة: 2388 kg/m³ والحجم الصافي 1000.2 لتر.
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500 font-mono">
          <div>SnoLab Concrete Mix Design Engine © 2026</div>
          <div>Page 7 of 7</div>
        </div>
      </div>

    </div>
  );
};
