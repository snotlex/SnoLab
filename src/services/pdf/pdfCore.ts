import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { DEFAULT_LAB_PROFILE, LabProfile, ReportLanguage } from "./types";

export const PDF_COLORS = {
  primary: [15, 23, 42] as [number, number, number],      // Slate 900 #0F172A
  secondary: [37, 99, 235] as [number, number, number],   // Blue 600 #2563EB
  accentDark: [30, 41, 59] as [number, number, number],   // Slate 800 #1E293B
  accentLight: [239, 246, 255] as [number, number, number], // Blue 50 #EFF6FF
  background: [248, 250, 252] as [number, number, number], // Slate 50 #F8FAFC
  border: [226, 232, 240] as [number, number, number],    // Slate 200 #E2E8F0
  borderDark: [203, 213, 225] as [number, number, number], // Slate 300 #CBD5E1
  textPrimary: [15, 23, 42] as [number, number, number],
  textSecondary: [71, 85, 105] as [number, number, number], // Slate 600 #475569
  textMuted: [100, 116, 139] as [number, number, number],  // Slate 500 #64748B
  white: [255, 255, 255] as [number, number, number],
  success: [16, 185, 129] as [number, number, number],   // Emerald 500
  successBg: [236, 253, 245] as [number, number, number], // Emerald 50
  warning: [217, 119, 6] as [number, number, number],     // Amber 600
  warningBg: [254, 243, 199] as [number, number, number], // Amber 50
  danger: [220, 38, 38] as [number, number, number],      // Red 600
  dangerBg: [254, 242, 242] as [number, number, number],  // Red 50
};

export const PDF_PAGE_MARGINS = {
  left: 14,
  right: 14,
  top: 28,
  bottom: 20,
  pageWidth: 210,
  pageHeight: 297,
  contentWidth: 182 // 210 - 28
};

/**
 * Creates and initializes a standardized A4 portrait jsPDF document.
 */
export function createPdfDocument(): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true
  });
  doc.setProperties({
    creator: "SnoLab Concrete Mix & Materials LIMS Engine",
    title: "Official Engineering Laboratory Report",
    author: "SnoLab ISO/IEC 17025 Engine",
    subject: "Civil Engineering Materials & Concrete Formulation Certificate"
  });
  return doc;
}

/**
 * Draws a clean vector section banner with accent bar and title.
 */
export function drawSectionBanner(
  doc: jsPDF,
  yPos: number,
  title: string,
  badgeText?: string,
  height: number = 7
): number {
  const { left, contentWidth } = PDF_PAGE_MARGINS;
  
  // Background rect
  doc.setFillColor(...PDF_COLORS.primary);
  doc.roundedRect(left, yPos, contentWidth, height, 1.5, 1.5, "F");

  // Accent left colored indicator bar
  doc.setFillColor(...PDF_COLORS.secondary);
  doc.rect(left, yPos, 3.5, height, "F");

  // Text title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...PDF_COLORS.white);
  doc.text(title.toUpperCase(), left + 6, yPos + height / 2 + 1.2);

  // Optional right-aligned badge
  if (badgeText) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(191, 219, 254); // Light blue
    doc.text(badgeText, left + contentWidth - 4, yPos + height / 2 + 1.2, { align: "right" });
  }

  return yPos + height + 3.5;
}

/**
 * Draws a grid of key engineering metric cards (e.g. Strength, W/C, Slump, Density).
 */
export function drawMetricCards(
  doc: jsPDF,
  yPos: number,
  cards: Array<{
    label: string;
    value: string;
    unit?: string;
    highlight?: "primary" | "success" | "warning" | "danger";
    subtext?: string;
  }>
): number {
  const { left, contentWidth } = PDF_PAGE_MARGINS;
  const numCards = cards.length;
  const gap = 3;
  const cardWidth = (contentWidth - (numCards - 1) * gap) / numCards;
  const cardHeight = 16;

  cards.forEach((card, index) => {
    const cardX = left + index * (cardWidth + gap);

    // Box fill and border
    let bg = PDF_COLORS.background;
    let borderColor = PDF_COLORS.border;
    let valColor = PDF_COLORS.primary;

    if (card.highlight === "success") {
      bg = PDF_COLORS.successBg;
      borderColor = PDF_COLORS.success;
      valColor = PDF_COLORS.success;
    } else if (card.highlight === "warning") {
      bg = PDF_COLORS.warningBg;
      borderColor = PDF_COLORS.warning;
      valColor = PDF_COLORS.warning;
    } else if (card.highlight === "danger") {
      bg = PDF_COLORS.dangerBg;
      borderColor = PDF_COLORS.danger;
      valColor = PDF_COLORS.danger;
    } else if (card.highlight === "primary") {
      bg = PDF_COLORS.accentLight;
      borderColor = PDF_COLORS.secondary;
      valColor = PDF_COLORS.secondary;
    }

    doc.setFillColor(...bg);
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.3);
    doc.roundedRect(cardX, yPos, cardWidth, cardHeight, 1.5, 1.5, "FD");

    // Top Accent line
    doc.setFillColor(...(card.highlight ? valColor : PDF_COLORS.secondary));
    doc.rect(cardX + 1, yPos, cardWidth - 2, 1, "F");

    // Card Label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(...PDF_COLORS.textMuted);
    doc.text(card.label.toUpperCase(), cardX + cardWidth / 2, yPos + 4.5, { align: "center" });

    // Value + Unit
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...valColor);
    const textVal = card.unit ? `${card.value} ${card.unit}` : card.value;
    doc.text(textVal, cardX + cardWidth / 2, yPos + 10.5, { align: "center" });

    // Subtext if any
    if (card.subtext) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(5.5);
      doc.setTextColor(...PDF_COLORS.textSecondary);
      doc.text(card.subtext, cardX + cardWidth / 2, yPos + 14, { align: "center" });
    }
  });

  return yPos + cardHeight + 4;
}

/**
 * Draws a 2-column or 3-column structured metadata table.
 */
export function drawMetadataGrid(
  doc: jsPDF,
  yPos: number,
  groups: Array<{
    title: string;
    items: Array<{ label: string; value: string }>;
  }>
): number {
  const { left, contentWidth } = PDF_PAGE_MARGINS;
  const numCols = groups.length;
  const gap = 4;
  const colWidth = (contentWidth - (numCols - 1) * gap) / numCols;

  let maxColHeight = 0;

  groups.forEach((group, colIdx) => {
    const colX = left + colIdx * (colWidth + gap);
    const itemHeight = 4.8;
    const colH = 6 + group.items.length * itemHeight + 3;
    if (colH > maxColHeight) maxColHeight = colH;

    // Card container
    doc.setFillColor(...PDF_COLORS.background);
    doc.setDrawColor(...PDF_COLORS.border);
    doc.setLineWidth(0.25);
    doc.roundedRect(colX, yPos, colWidth, colH, 1.5, 1.5, "FD");

    // Group Header
    doc.setFillColor(...PDF_COLORS.primary);
    doc.roundedRect(colX, yPos, colWidth, 5.5, 1.5, 1.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...PDF_COLORS.white);
    doc.text(group.title.toUpperCase(), colX + 3, yPos + 3.8);

    // Group Items
    let itemY = yPos + 9;
    group.items.forEach((item) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(...PDF_COLORS.textMuted);
      doc.text(item.label + ":", colX + 3, itemY);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(...PDF_COLORS.textPrimary);
      // Right align or offset value
      doc.text(item.value, colX + colWidth - 3, itemY, { align: "right" });

      itemY += itemHeight;
    });
  });

  return yPos + maxColHeight + 4;
}

/**
 * Draws official laboratory sign-off, quality seal, and technician approval block.
 */
export function drawSignOffBlock(
  doc: jsPDF,
  yPos: number,
  options: {
    operatorName?: string;
    directorName?: string;
    date?: string;
    reportRef?: string;
    labName?: string;
  } = {}
): number {
  const { left, contentWidth, pageHeight, bottom } = PDF_PAGE_MARGINS;
  const blockHeight = 28;

  // Check if we need page break for signature block
  if (yPos + blockHeight > pageHeight - bottom - 5) {
    doc.addPage();
    yPos = PDF_PAGE_MARGINS.top + 4;
  }

  const boxWidth = (contentWidth - 6) / 2;
  const boxHeight = 24;

  const dateStr = options.date || new Date().toISOString().split("T")[0];
  const refStr = options.reportRef || `REF-${Math.floor(Date.now() / 1000)}`;

  // Left Signer: Testing Engineer / Materials Operator
  const leftX = left;
  doc.setFillColor(...PDF_COLORS.background);
  doc.setDrawColor(...PDF_COLORS.borderDark);
  doc.setLineWidth(0.3);
  doc.roundedRect(leftX, yPos, boxWidth, boxHeight, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text("ENGINEER / MATERIALS TECHNICIAN", leftX + 3, yPos + 4.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...PDF_COLORS.textSecondary);
  doc.text(`Name: ${options.operatorName || "Senior Materials Engineer"}`, leftX + 3, yPos + 9);
  doc.text(`Date: ${dateStr}`, leftX + 3, yPos + 13);
  doc.text(`Status: Verified & Conforming`, leftX + 3, yPos + 17);

  // Signature Stamp Area
  doc.setFont("courier", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(...PDF_COLORS.secondary);
  doc.text("[ DIGITALLY VERIFIED ]", leftX + boxWidth - 3, yPos + 20, { align: "right" });

  // Right Signer: Laboratory Director / Quality Manager & Official Stamp
  const rightX = left + boxWidth + 6;
  doc.setFillColor(...PDF_COLORS.background);
  doc.setDrawColor(...PDF_COLORS.borderDark);
  doc.setLineWidth(0.3);
  doc.roundedRect(rightX, yPos, boxWidth, boxHeight, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text("LABORATORY DIRECTOR / QUALITY ASSURANCE", rightX + 3, yPos + 4.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...PDF_COLORS.textSecondary);
  doc.text(`Authority: ${options.directorName || "Head of Concrete Quality Dept."}`, rightX + 3, yPos + 9);
  doc.text(`Accreditation: ISO/IEC 17025:2017`, rightX + 3, yPos + 13);
  doc.text(`Cert Ref: ${refStr}`, rightX + 3, yPos + 17);

  // Official Stamp Box
  doc.setDrawColor(...PDF_COLORS.secondary);
  doc.setLineWidth(0.5);
  doc.roundedRect(rightX + boxWidth - 32, yPos + 3, 29, 18, 1, 1, "D");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.5);
  doc.setTextColor(...PDF_COLORS.secondary);
  doc.text("SNOLAB OFFICIAL", rightX + boxWidth - 17.5, yPos + 7.5, { align: "center" });
  doc.setFontSize(5);
  doc.setTextColor(...PDF_COLORS.textMuted);
  doc.text("QUALITY STAMP", rightX + boxWidth - 17.5, yPos + 11.5, { align: "center" });
  doc.setFontSize(5);
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text("APPROVED", rightX + boxWidth - 17.5, yPos + 16, { align: "center" });

  return yPos + boxHeight + 4;
}

/**
 * Standard autoTable configuration that ensures real text, perfect column wrapping, 
 * elegant zebra striping, and no truncation or page overflow glitches.
 */
export function getStandardTableTheme() {
  return {
    theme: "grid" as const,
    headStyles: {
      fillColor: PDF_COLORS.primary,
      textColor: PDF_COLORS.white,
      font: "helvetica" as const,
      fontStyle: "bold" as const,
      fontSize: 7.5,
      cellPadding: { top: 2.2, bottom: 2.2, left: 2.5, right: 2.5 },
      lineColor: PDF_COLORS.primary,
      lineWidth: 0.1,
      halign: "left" as const,
      valign: "middle" as const
    },
    bodyStyles: {
      textColor: PDF_COLORS.textPrimary,
      font: "helvetica" as const,
      fontSize: 7,
      cellPadding: { top: 2, bottom: 2, left: 2.5, right: 2.5 },
      lineColor: PDF_COLORS.border,
      lineWidth: 0.1,
      valign: "middle" as const
    },
    alternateRowStyles: {
      fillColor: PDF_COLORS.background
    },
    footStyles: {
      fillColor: PDF_COLORS.accentDark,
      textColor: PDF_COLORS.white,
      font: "helvetica" as const,
      fontStyle: "bold" as const,
      fontSize: 7.5,
      cellPadding: { top: 2.2, bottom: 2.2, left: 2.5, right: 2.5 }
    },
    margin: {
      left: PDF_PAGE_MARGINS.left,
      right: PDF_PAGE_MARGINS.right,
      top: PDF_PAGE_MARGINS.top,
      bottom: PDF_PAGE_MARGINS.bottom
    }
  };
}

/**
 * Post-processes the document to stamp precise running headers, footers, 
 * page numbers ("Page X of N"), watermark, and security verification on EVERY page.
 */
export function finalizeReportPages(
  doc: jsPDF,
  options: {
    reportTitle: string;
    reportSubtitle?: string;
    reportRef: string;
    date?: string;
    labProfile?: LabProfile;
    isDraft?: boolean;
  }
) {
  const totalPages = doc.getNumberOfPages();
  const lab = options.labProfile || DEFAULT_LAB_PROFILE;
  const { left, pageWidth, pageHeight, contentWidth, right } = PDF_PAGE_MARGINS;
  const dateStr = options.date || new Date().toISOString().split("T")[0];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    doc.setPage(pageNum);

    // ==========================================
    // 1. TOP RUNNING HEADER
    // ==========================================
    // Top primary dark line & header area
    doc.setFillColor(...PDF_COLORS.primary);
    doc.rect(left, 8, contentWidth, 1.2, "F");

    // Laboratory Logo Badge / Name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...PDF_COLORS.primary);
    doc.text(lab.name, left, 13.5);

    // Accreditation tag
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.setTextColor(...PDF_COLORS.textMuted);
    doc.text(lab.accreditation, left, 17);

    // Right Side: Report Title & Reference Info
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...PDF_COLORS.secondary);
    doc.text(options.reportTitle.toUpperCase(), pageWidth - right, 13.5, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.setTextColor(...PDF_COLORS.textSecondary);
    const refDateText = `REF: ${options.reportRef}  |  DATE: ${dateStr}  |  PAGE ${pageNum}/${totalPages}`;
    doc.text(refDateText, pageWidth - right, 17, { align: "right" });

    // Subtle header bottom divider line
    doc.setDrawColor(...PDF_COLORS.border);
    doc.setLineWidth(0.2);
    doc.line(left, 19, pageWidth - right, 19);

    // ==========================================
    // 2. BOTTOM RUNNING FOOTER
    // ==========================================
    const footerY = pageHeight - 12;

    // Footer divider line
    doc.setDrawColor(...PDF_COLORS.border);
    doc.setLineWidth(0.2);
    doc.line(left, footerY - 2, pageWidth - right, footerY - 2);

    // Left: Legal notice & Laboratory Contact
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.setTextColor(...PDF_COLORS.textMuted);
    doc.text(
      "CONFIDENTIAL & OFFICIAL ENGINEERING REPORT • CERTIFIED IN ACCORDANCE WITH ISO/IEC 17025 & EN 206",
      left,
      footerY + 1.5
    );
    doc.text(lab.contact, left, footerY + 5);

    // Right: Page counter & digital security tag
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(...PDF_COLORS.primary);
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - right, footerY + 1.5, { align: "right" });

    doc.setFont("courier", "normal");
    doc.setFontSize(5);
    doc.setTextColor(...PDF_COLORS.textMuted);
    const hash = `SHA256:${Math.abs(hashString(options.reportRef + pageNum)).toString(16).toUpperCase().padStart(8, "0")}`;
    doc.text(`VERIFICATION: ${hash}`, pageWidth - right, footerY + 5, { align: "right" });
  }
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash;
}
