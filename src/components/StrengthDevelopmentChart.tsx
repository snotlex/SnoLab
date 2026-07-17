import React from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

interface StrengthPoint {
  age: number;
  strength: number;
}

interface StrengthDevelopmentChartProps {
  data: StrengthPoint[];
  fck28: number;
}

export const StrengthDevelopmentChart: React.FC<StrengthDevelopmentChartProps> = ({ data, fck28 }) => {
  return (
    <div className="w-full bg-white dark:bg-[#111827]/40 border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-right">
      <div className="mb-4">
        <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">
          STRENGTH EVOLUTION OVER TIME (ASTM C39 / EN 12390)
        </h4>
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 font-sans">
          📈 منحنى تطور مقاومة الضغط بالزمن للخرسانة
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-sans">
          توقع نضوج الإماهة الإسمنتية من عمر 3 أيام حتى 90 يوماً طبقاً للكود الجزائري والمواصفات الأوروبية
        </p>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
            <XAxis 
              dataKey="age" 
              stroke="#64748b" 
              tickFormatter={(v) => `${v} يوم`} 
              tick={{ fontSize: 10, fill: '#64748b' }} 
            />
            <YAxis 
              stroke="#64748b" 
              tickFormatter={(v) => `${v} MPa`}
              tick={{ fontSize: 10, fill: '#64748b' }} 
            />
            <Tooltip 
              contentStyle={{ background: 'var(--tooltip-bg, #ffffff)', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a' }}
              labelStyle={{ fontSize: 11, fontWeight: 'bold', color: '#475569' }}
              itemStyle={{ fontSize: 11, color: '#10b981' }}
              formatter={(value: any) => [`${value} MPa`, "مقاومة الضغط"]}
              labelFormatter={(label) => `عمر الفحص: ${label} أيام`}
            />
            <Legend wrapperStyle={{ fontSize: 10, color: '#475569' }} />
            <Line 
              name="المقاومة المتوقعة (MPa)" 
              type="monotone" 
              dataKey="strength" 
              stroke="#2563EB" 
              strokeWidth={3} 
              activeDot={{ r: 6 }} 
              dot={{ r: 4, fill: '#2563EB', strokeWidth: 1 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 bg-blue-500/5 dark:bg-blue-500/5 border border-blue-500/10 p-3 rounded-xl flex items-start gap-2.5 text-xs">
        <span className="text-blue-500 dark:text-blue-400 mt-0.5">💡</span>
        <p className="text-slate-655 dark:text-slate-350 leading-relaxed font-sans text-[11px]">
          تصل الخرسانة إلى حوالي <span className="text-[#2563EB] font-bold">40%</span> من قوتها بعمر 3 أيام، وتثبُت عند <span className="text-[#10B981] font-bold">100%</span> (قوة التصميم وعمر الفحص الإنشائي العياري) بعمر <span className="text-slate-900 dark:text-white font-bold">28 يوماً</span>، مع استمرار الإماهة البوزولانية لتصل إلى <span className="text-amber-600 dark:text-amber-500 font-bold">~115%</span> بعد 3 أشهر.
        </p>
      </div>
    </div>
  );
};
