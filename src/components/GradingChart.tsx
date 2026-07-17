import React, { useMemo } from "react";
import { SievePoint } from "../types";
import { useLanguage } from "../services/localization";

interface GradingChartProps {
  gradingCurve: SievePoint[];
  pivotPoint: { x: number; y: number };
  dMax: number;
}

export const GradingChart: React.FC<GradingChartProps> = ({
  gradingCurve,
  pivotPoint,
  dMax
}) => {
  const { language } = useLanguage();

  // SVG Dimensions
  const width = 600;
  const height = 320;
  const paddingLeft = 50;
  const paddingRight = 30;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Log bounds: 0.08 mm to D_max (or max 100 mm to standardise)
  const minSieve = 0.08;
  const maxSieve = 100;
  const logMin = Math.log10(minSieve);
  const logMax = Math.log10(maxSieve);

  // Helper: map sieve size (mm) to chart X coordinate
  const getX = (size: number) => {
    // Clamp size to log bounds
    const clamped = Math.max(minSieve, Math.min(maxSieve, size));
    const pct = (Math.log10(clamped) - logMin) / (logMax - logMin);
    return paddingLeft + pct * chartWidth;
  };

  // Helper: map passing percentage (%) to chart Y coordinate
  const getY = (percent: number) => {
    const clamped = Math.max(0, Math.min(100, percent));
    // 0% at bottom, 100% at top
    return paddingTop + (1 - clamped / 100) * chartHeight;
  };

  // Generate grid lines on sieve sizes: 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 40, 80, 100
  const verticalGridSizes = [0.1, 0.25, 0.5, 1.0, 2.0, 5.0, 10.0, 20.0, 31.5, 40.0, 63.0, 80.0, 100.0];
  const horizontalGridPercents = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

  // Curve points path for custom Dreux-Gorisse curve
  const curvePointsPath = useMemo(() => {
    if (gradingCurve.length === 0) return "";
    return gradingCurve
      .map((p, index) => {
        const x = getX(p.size);
        const y = getY(p.targetPassing);
        return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  }, [gradingCurve]);

  return (
    <div className="w-full bg-white dark:bg-zinc-900 p-5 rounded-xl border-2 border-zinc-300 dark:border-zinc-700 shadow-md" id="dreux-grading-chart-card">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2 border-b border-zinc-150 dark:border-zinc-800 pb-3">
        <div>
          <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5 font-sans">
            <span className="bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded text-[10px]">
              {language === "ar" ? "مخطط متباين جداً" : language === "fr" ? "Diagramme très contrasté" : "High-Contrast Chart"}
            </span>
            <span>
              📈 {language === "ar" ? "منحنى التدرج الحبيبي المستهدف" : language === "fr" ? "Courbe de distribution granulométrique cible" : "Target Sieve Grading Curve"}
            </span>
          </h3>
          <p className="text-xs text-zinc-650 dark:text-zinc-300 font-bold mt-1">
            {language === "ar"
              ? "مخطط بياني لمنحنى درو (Dreux) النموذجي على مقياس لوغاريتمي واضح"
              : language === "fr"
              ? "Représentation graphique de la courbe de référence Dreux (échelle logarithmique)."
              : "Logarithmic representation of the characteristic Dreux reference grading curve."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] font-black">
          <span className="flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block"></span>
            <span className="text-emerald-700 dark:text-emerald-400">
              {language === "ar" ? "Dreux المستهدف" : language === "fr" ? "Cible Dreux" : "Target Dreux"}
            </span>
          </span>
          <span className="flex items-center gap-1 bg-rose-100 dark:bg-rose-900/30 px-2 py-0.5 rounded">
            <span className="w-2.5 h-2.5 bg-rose-500 rounded-full inline-block"></span>
            <span className="text-rose-700 dark:text-rose-400">
              {language === "ar" ? "نقطة الكسر (M)" : language === "fr" ? "Point de cassure (M)" : "Pivot Point (M)"}
            </span>
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full min-w-[500px] h-auto font-mono text-[10px] text-zinc-800 dark:text-zinc-100 fill-zinc-800 dark:fill-zinc-100 select-none"
          id="dreux-grading-svg"
        >
          {/* Background grid - horizontal lines */}
          {horizontalGridPercents.map((pct) => (
            <g key={`h-grid-${pct}`}>
              <line
                x1={paddingLeft}
                y1={getY(pct)}
                x2={width - paddingRight}
                y2={getY(pct)}
                className="stroke-zinc-300 dark:stroke-zinc-700/80"
                strokeWidth={pct === 0 || pct === 100 ? 2 : 1}
                strokeDasharray={pct === 0 || pct === 100 ? "0" : "3,3"}
              />
              <text
                x={paddingLeft - 8}
                y={getY(pct) + 3}
                textAnchor="end"
                className="fill-zinc-900 dark:fill-zinc-100 font-extrabold text-[10px]"
              >
                {pct}%
              </text>
            </g>
          ))}

          {/* Background grid - vertical logarithmic lines */}
          {verticalGridSizes.map((size) => {
            const x = getX(size);
            const isActiveDmax = size === dMax;
            return (
              <g key={`v-grid-${size}`}>
                <line
                  x1={x}
                  y1={paddingTop}
                  x2={x}
                  y2={height - paddingBottom}
                  className={isActiveDmax ? "stroke-blue-600 dark:stroke-blue-400" : "stroke-zinc-300 dark:stroke-zinc-700"}
                  strokeWidth={isActiveDmax ? 2.5 : 1}
                  strokeDasharray={isActiveDmax ? "0" : "2,2"}
                />
                <text
                  x={x}
                  y={height - paddingBottom + 14}
                  textAnchor="middle"
                  className="fill-zinc-900 dark:fill-zinc-100 font-sans font-black text-[10px]"
                >
                  {size}
                </text>
              </g>
            );
          })}

          {/* X Axis label */}
          <text
            x={(width + paddingLeft - paddingRight) / 2}
            y={height - 6}
            textAnchor="middle"
            className="fill-zinc-900 dark:fill-zinc-100 font-sans text-[11px] font-black tracking-wide"
          >
            {language === "ar" ? "سعة فتحات المنخل (D بالمليمتر - مقياس لوغاريتمي)" : language === "fr" ? "Ouverture des mailles du tamis (D en mm - Échelle log)" : "Sieve opening grain size (D in mm - Log Scale)"}
          </text>

          {/* Y Axis label */}
          <text
            x={12}
            y={(height - paddingTop - paddingBottom) / 2 + paddingTop}
            textAnchor="middle"
            transform={`rotate(-90, 12, ${(height - paddingTop - paddingBottom) / 2 + paddingTop})`}
            className="fill-zinc-900 dark:fill-zinc-100 font-sans text-[11px] font-black tracking-wide"
          >
            {language === "ar" ? "النسبة المئوية التراكمية للمار (% Passing)" : language === "fr" ? "Passant cumulé (%)" : "Cumulative passing percentage (% Passing)"}
          </text>

          {/* Dreux Target curve */}
          {curvePointsPath && (
            <path
              d={curvePointsPath}
              className="fill-none stroke-emerald-600 dark:stroke-emerald-400"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Sieve Points markers */}
          {gradingCurve.map((p, idx) => (
            <circle
              key={`point-${idx}`}
              cx={getX(p.size)}
              cy={getY(p.targetPassing)}
              r="4.5"
              className="fill-emerald-600 dark:fill-emerald-400 stroke-zinc-950 dark:stroke-white"
              strokeWidth="1.5"
            />
          ))}

          {/* Dreux Pivot Point (M) */}
          <circle
            cx={getX(pivotPoint.x)}
            cy={getY(pivotPoint.y)}
            r="8"
            className="fill-rose-600 dark:fill-rose-500 animate-pulse stroke-white dark:stroke-zinc-950"
            strokeWidth="2.5"
          />
          
          {/* Label Pivot Point (M) */}
          <g>
            <rect
              x={getX(pivotPoint.x) + 8}
              y={getY(pivotPoint.y) - 15}
              width="78"
              height="18"
              rx="4"
              className="fill-rose-600 dark:fill-rose-500 shadow-lg stroke-white dark:stroke-zinc-950"
              strokeWidth="1"
            />
            <text
              x={getX(pivotPoint.x) + 12}
              y={getY(pivotPoint.y) - 3}
              className="fill-white dark:fill-white font-sans font-black text-[9px]"
            >
              M ({pivotPoint.x.toFixed(1)} مم, {pivotPoint.y.toFixed(1)}%)
            </text>
          </g>

          {/* Edge point indicator of Dmax */}
          <g>
            <circle
              cx={getX(dMax)}
              cy={getY(100)}
              r="5"
              className="fill-zinc-800 dark:fill-zinc-200 stroke-white dark:stroke-zinc-950"
              strokeWidth="1.5"
            />
            <text
              x={getX(dMax) - 5}
              y={getY(100) - 12}
              className="fill-zinc-900 dark:fill-white font-sans text-[10px] font-black"
            >
              D_max ({dMax} {language === "ar" ? "مم" : "mm"})
            </text>
          </g>
        </svg>
      </div>

      <div className="mt-4 bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-xl border border-zinc-150 dark:border-zinc-800/80">
        <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5 font-sans">
          {language === "ar" ? "💡 كيفية قراءة المخطط الحبيبي:" : language === "fr" ? "💡 Comment interpréter le diagramme granulométrique :" : "💡 How to read the grading chart:"}
        </h4>
        <p className="text-xs text-zinc-650 dark:text-zinc-350 leading-relaxed font-sans font-medium">
          {language === "ar" ? (
            <>
              نقطة الكسر <strong className="text-rose-500">M</strong> تحدد النسبة المثالية للفصل بين الرمل (المار التراكمي تحت {pivotPoint.x} مم والذي يزن حوالي <strong className="text-emerald-600 dark:text-emerald-400">{pivotPoint.y.toFixed(1)}%</strong>) والحصى الخشن (والذي يمثل بقية وزن الخليط بنسبة <strong className="text-emerald-600 dark:text-emerald-400">{(100 - pivotPoint.y).toFixed(1)}%</strong>). التدرج يتبع هذا المسار لتقليل الفراغات البينية وبالتالي توفير الإسمنت وتقليل التكلفة مع الحصول على الكثافة القصوى.
            </>
          ) : language === "fr" ? (
            <>
              Le point de cassure <strong className="text-rose-500">M</strong> détermine la proportion idéale entre le sable (passant cumulé sous {pivotPoint.x} mm, soit ou environ <strong className="text-emerald-600 dark:text-emerald-400">{pivotPoint.y.toFixed(1)}%</strong>) et les gravillons (qui représentent le reste soit <strong className="text-emerald-600 dark:text-emerald-400">{(100 - pivotPoint.y).toFixed(1)}%</strong>). La distribution suit cette courbe pour minimiser les vides intergranulaires, réduisant ainsi la dose de ciment superflue et le coût global tout en maximisant la compacité.
            </>
          ) : (
            <>
              The pivot point <strong className="text-rose-500">M</strong> defines the optimal boundary between sand (cumulative passing under {pivotPoint.x} mm, weighing approximately <strong className="text-emerald-600 dark:text-emerald-400">{pivotPoint.y.toFixed(1)}%</strong>) and coarse aggregates (representing the remaining fraction of <strong className="text-emerald-600 dark:text-emerald-400">{(100 - pivotPoint.y).toFixed(1)}%</strong>). The curve optimizes particle packing to minimize voids, saving cement and lowering costs while ensuring peak raw concrete density.
            </>
          )}
        </p>
      </div>
    </div>
  );
};
