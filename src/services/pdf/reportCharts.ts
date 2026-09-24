import { jsPDF } from "jspdf";
import { MixDesignResult } from "../../types";
import { PDF_COLORS, PDF_PAGE_MARGINS } from "./pdfCore";
import { getGradingSeries, getStrengthSeries } from "../../utils/reportData";

function mapLogX(size: number, left: number, width: number): number {
  const min = 0.08;
  const max = 100;
  const lmin = Math.log10(min);
  const lmax = Math.log10(max);
  const clamped = Math.max(min, Math.min(max, size));
  return left + ((Math.log10(clamped) - lmin) / (lmax - lmin)) * width;
}

function mapPctY(percent: number, top: number, height: number): number {
  return top + (1 - Math.max(0, Math.min(100, percent)) / 100) * height;
}

export function drawGradingChart(
  doc: jsPDF,
  result: MixDesignResult,
  options: { title?: string; showActual?: boolean; startY?: number } = {}
): number {
  const series = getGradingSeries(result);
  const { left, contentWidth } = PDF_PAGE_MARGINS;
  const top = (doc as any).lastAutoTable?.finalY
    ? (doc as any).lastAutoTable.finalY + 6
    : PDF_PAGE_MARGINS.top + 4;
  const chartW = contentWidth;
  const chartH = 82;
  const plotLeft = left + 18;
  const plotTop = top + 13;
  const plotW = chartW - 26;
  const plotH = chartH - 25;

  doc.setFillColor(...PDF_COLORS.white);
  doc.setDrawColor(...PDF_COLORS.border);
  doc.roundedRect(left, top, chartW, chartH, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text(options.title || "AGGREGATE GRADING — DREUX TARGET vs ACTUAL BLEND", left + 4, top + 7);

  [0, 20, 40, 60, 80, 100].forEach((p) => {
    const y = mapPctY(p, plotTop, plotH);
    doc.setDrawColor(...PDF_COLORS.border);
    doc.setLineWidth(0.15);
    doc.line(plotLeft, y, plotLeft + plotW, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.3);
    doc.setTextColor(...PDF_COLORS.textMuted);
    doc.text(String(p), plotLeft - 2, y + 1.8, { align: "right" });
  });

  [0.1, 0.25, 0.5, 1, 2, 5, 10, 20, 40, 80, 100].forEach((s) => {
    const x = mapLogX(s, plotLeft, plotW);
    doc.setDrawColor(...PDF_COLORS.border);
    doc.setLineWidth(0.12);
    doc.line(x, plotTop, x, plotTop + plotH);
    doc.setFontSize(4.7);
    doc.setTextColor(...PDF_COLORS.textMuted);
    doc.text(String(s), x, plotTop + plotH + 5, { align: "center" });
  });

  const targetPath: [number, number][] = [];
  const actualPath: [number, number][] = [];
  for (const p of series) {
    targetPath.push([mapLogX(p.size, plotLeft, plotW), mapPctY(p.targetPassing, plotTop, plotH)]);
    if (options.showActual !== false && p.actualPassing !== undefined) {
      actualPath.push([mapLogX(p.size, plotLeft, plotW), mapPctY(p.actualPassing, plotTop, plotH)]);
    }
  }

  const drawPath = (points: [number, number][], color: number[]) => {
    if (!points.length) return;
    doc.setDrawColor(...color);
    doc.setLineWidth(0.9);
    for (let i = 1; i < points.length; i++) {
      doc.line(points[i - 1][0], points[i - 1][1], points[i][0], points[i][1]);
    }
    points.forEach(([x, y]) => {
      doc.setFillColor(...color);
      doc.circle(x, y, 0.8, "F");
    });
  };

  drawPath(targetPath, PDF_COLORS.success);
  drawPath(actualPath, PDF_COLORS.secondary);

  const legendX = left + chartW - 68;
  const legendY = top + 6;
  doc.setDrawColor(...PDF_COLORS.success);
  doc.setLineWidth(0.9);
  doc.line(legendX, legendY - 1, legendX + 7, legendY - 1);
  doc.setFontSize(5.2);
  doc.setTextColor(...PDF_COLORS.textSecondary);
  doc.text("Target Dreux", legendX + 9, legendY);
  if (actualPath.length) {
    doc.setDrawColor(...PDF_COLORS.secondary);
    doc.line(legendX, legendY + 3, legendX + 7, legendY + 3);
    doc.text("Actual blend", legendX + 9, legendY + 4);
  }

  return top + chartH + 5;
}

export function drawStrengthEvolutionChart(
  doc: jsPDF,
  result: MixDesignResult,
  options: { title?: string; startY?: number } = {}
): number {
  const series = getStrengthSeries(result);
  if (!series.length) return PDF_PAGE_MARGINS.top + 4;

  const { left, contentWidth } = PDF_PAGE_MARGINS;
  const top = (doc as any).lastAutoTable?.finalY
    ? (doc as any).lastAutoTable.finalY + 6
    : PDF_PAGE_MARGINS.top + 4;
  const chartW = contentWidth;
  const chartH = 70;
  const plotLeft = left + 18;
  const plotTop = top + 13;
  const plotW = chartW - 26;
  const plotH = chartH - 25;
  const maxStrength = Math.max(
    10,
    Math.ceil(Math.max(...series.map(s => s.strength), Number(result.fck28 || 0)) / 10) * 10
  );
  const minAge = Math.min(...series.map(s => s.age));
  const maxAge = Math.max(...series.map(s => s.age));

  const x = (age: number) =>
    plotLeft + ((age - minAge) / Math.max(1, maxAge - minAge)) * plotW;
  const y = (strength: number) =>
    plotTop + (1 - Math.max(0, Math.min(maxStrength, strength)) / maxStrength) * plotH;

  doc.setFillColor(...PDF_COLORS.white);
  doc.setDrawColor(...PDF_COLORS.border);
  doc.roundedRect(left, top, chartW, chartH, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text(options.title || "COMPRESSIVE STRENGTH DEVELOPMENT", left + 4, top + 7);

  [0, 20, 40, 60, 80, 100].forEach((p) => {
    const value = (p / 100) * maxStrength;
    const yy = y(value);
    doc.setDrawColor(...PDF_COLORS.border);
    doc.setLineWidth(0.12);
    doc.line(plotLeft, yy, plotLeft + plotW, yy);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.3);
    doc.setTextColor(...PDF_COLORS.textMuted);
    doc.text(value.toFixed(0), plotLeft - 2, yy + 1.8, { align: "right" });
  });

  doc.setDrawColor(...PDF_COLORS.borderDark);
  doc.line(plotLeft, plotTop + plotH, plotLeft + plotW, plotTop + plotH);
  doc.line(plotLeft, plotTop, plotLeft, plotTop + plotH);

  const points = series.map(p => [x(p.age), y(p.strength)] as [number, number]);
  doc.setDrawColor(...PDF_COLORS.secondary);
  doc.setLineWidth(0.9);
  for (let i = 1; i < points.length; i++) {
    doc.line(points[i - 1][0], points[i - 1][1], points[i][0], points[i][1]);
  }

  points.forEach(([px, py], idx) => {
    doc.setFillColor(...PDF_COLORS.success);
    doc.circle(px, py, 1.1, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5);
    doc.setTextColor(...PDF_COLORS.textPrimary);
    doc.text(series[idx].strength.toFixed(1), px, py - 2.2, { align: "center" });
    doc.text(`${series[idx].age} d`, px, plotTop + plotH + 5, { align: "center" });
  });

  if (Number.isFinite(Number(result.fck28))) {
    const fy = y(Number(result.fck28));
    doc.setDrawColor(...PDF_COLORS.warning);
    doc.setLineWidth(0.6);
    doc.line(plotLeft, fy, plotLeft + plotW, fy);
    doc.setFontSize(5.2);
    doc.setTextColor(...PDF_COLORS.warning);
    doc.text(`fck target = ${Number(result.fck28).toFixed(1)} MPa`, plotLeft + 3, fy - 1.5);
  }

  return top + chartH + 5;
}
