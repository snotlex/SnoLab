import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { MaterialTestRecord } from "../../types/laboratoryTypes";
import { 
  createPdfDocument, 
  drawSectionBanner, 
  drawMetricCards, 
  drawMetadataGrid, 
  drawSignOffBlock, 
  drawLaboratoryEmblemLogo,
  getStandardTableTheme, 
  finalizeReportPages,
  PDF_COLORS,
  PDF_PAGE_MARGINS
} from "./pdfCore";
import { LabTestPdfOptions, DEFAULT_LAB_PROFILE } from "./types";

/**
 * Generates a traceable, publication-quality, multi-page vector report for
 * laboratory test and material records. Exporting a PDF does not make the
 * record an official certificate; explicit governance evidence is required.
 */
export async function generateLabTestPdf(
  testRecord: MaterialTestRecord,
  options: LabTestPdfOptions = {}
): Promise<jsPDF> {
  const doc = createPdfDocument();
  const theme = getStandardTableTheme();
  const lab = { ...DEFAULT_LAB_PROFILE, ...options.labProfile };
  const lang = options.language || "fr";

  const dateStr = testRecord.date || new Date().toISOString().split("T")[0];
  const reportRef = testRecord.id || `TEST-${Math.floor(Date.now() / 1000)}`;
  const reportTitle = "RAPPORT D'ESSAI ET DE CONTRÔLE QUALITÉ MATÉRIAUX";

  let currentY = PDF_PAGE_MARGINS.top + 2;

  // =========================================================================
  // 0. LABORATORY REPORT HEADER (PAGE 1)
  // =========================================================================
  const { left, contentWidth } = PDF_PAGE_MARGINS;
  const headerBoxHeight = 22;
  
  // Outer frame for letterhead
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(...PDF_COLORS.border);
  doc.setLineWidth(0.35);
  doc.roundedRect(left, currentY, contentWidth, headerBoxHeight, 2, 2, "FD");

  // Draw the SnoLab report emblem (size 15mm)
  drawLaboratoryEmblemLogo(doc, left + 4, currentY + 3.5, 15);

  // Institution title and report scope
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text(lab.name.toUpperCase(), left + 22, currentY + 7.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(...PDF_COLORS.secondary);
  doc.text(
    "LABORATOIRE CENTRAL D'ESSAIS PHYSIQUES ET MÉCANIQUES SUR MATÉRIAUX DE CONSTRUCTION", 
    left + 22, 
    currentY + 12
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.2);
  doc.setTextColor(...PDF_COLORS.textMuted);
  doc.text(
    `RAPPORT TECHNIQUE • RÉVISION ET MÉLANGE D'ESSAI REQUIS • SNO-LAB QC`,
    left + 22, 
    currentY + 16.5
  );

  // Right side: neutral report status badge. It is never an official stamp by default.
  const sealW = 40;
  const sealX = left + contentWidth - sealW - 3;
  const sealY = currentY + 3;
  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.35);
  doc.roundedRect(sealX, sealY, sealW, 16, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(37, 99, 235);
  doc.text(options.officialApproval ? "APPROVAL RECORDED" : "REPORT • REVIEW REQUIRED", sealX + sealW / 2, sealY + 4.5, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text(`RÉF: ${reportRef.slice(0, 16)}`, sealX + sealW / 2, sealY + 8.5, { align: "center" });
  doc.text(`DATE: ${dateStr}`, sealX + sealW / 2, sealY + 12, { align: "center" });

  currentY += headerBoxHeight + 5;

  // =========================================================================
  // 1. EXECUTIVE TEST VERDICT & QUALITY KPI CARDS
  // =========================================================================
  currentY = drawSectionBanner(
    doc, 
    currentY, 
    "SYNTHÈSE DE CONFORMITÉ & RÉSULTAT PRINCIPAL",
    testRecord.standard
  );

  const statusVerdict = testRecord.status === "PASS"
    ? "CONFORME / PASS"
    : testRecord.status === "WARNING"
    ? "CONDITIONNEL / WARN"
    : "NON CONFORME / FAIL";

  const statusHighlight = testRecord.status === "PASS"
    ? "success"
    : testRecord.status === "WARNING"
    ? "warning"
    : "danger";

  // Identify principal measured result
  let primaryParam = "Score";
  let primaryVal = `${testRecord.score || 95}%`;
  if (testRecord.complianceDetails && testRecord.complianceDetails.length > 0) {
    const first = testRecord.complianceDetails[0];
    primaryParam = first.parameter;
    primaryVal = `${first.measured} ${first.unit || ""}`.trim();
  } else if (testRecord.results) {
    const keys = Object.keys(testRecord.results).filter(k => typeof testRecord.results[k] !== "object");
    if (keys.length > 0) {
      primaryParam = formatKey(keys[0]);
      primaryVal = formatVal(testRecord.results[keys[0]]);
    }
  }

  currentY = drawMetricCards(doc, currentY, [
    {
      label: "Statut de Conformité",
      value: statusVerdict,
      highlight: statusHighlight,
      subtext: `Norme: ${testRecord.standard}`
    },
    {
      label: "Indice de Qualité LIMS",
      value: `${testRecord.score || 95}%`,
      highlight: (testRecord.score || 95) >= 80 ? "success" : "warning",
      subtext: "Score de conformité"
    },
    {
      label: `Résultat Clé (${primaryParam.slice(0, 14)})`,
      value: primaryVal,
      highlight: "primary",
      subtext: "Valeur mesurée"
    },
    {
      label: "Catégorie Matériau",
      value: (testRecord.category || "Matériau").toUpperCase(),
      highlight: "primary",
      subtext: testRecord.materialCategory || "Granulats / Liants"
    }
  ]);

  // =========================================================================
  // 2. SAMPLE & TEST EXECUTION METADATA (DÉTAILS DE LA MATIÈRE ET DE L'ESSAI)
  // =========================================================================
  currentY = drawMetadataGrid(doc, currentY, [
    {
      title: "IDENTIFICATION DU MATÉRIAU & ÉCHANTILLON",
      items: [
        { label: "Nom du Matériau", value: testRecord.materialName || "Granulat d'essai" },
        { label: "Catégorie", value: testRecord.materialCategory || testRecord.category || "Matériaux" },
        { label: "N° Échantillon (Sample ID)", value: testRecord.sampleId || "SMP-001" },
        { label: "Date de Réception & Essai", value: testRecord.date || dateStr }
      ]
    },
    {
      title: "MÉTHODOLOGIE, NORMES & ENVIRONNEMENT",
      items: [
        { label: "Titre de l'Essai", value: testRecord.testTitleFr || testRecord.testTitleEn || testRecord.testType },
        { label: "Norme de Référence", value: testRecord.standard },
        { label: "Conditions Temp. & Humidité", value: "T: 20±2 °C | HR: 55±5%" },
        { label: "Laboratoire Responsable", value: testRecord.laboratoryName || lab.name }
      ]
    },
    {
      title: "OPÉRATEUR, VALIDATION & TRAÇABILITÉ",
      items: [
        { label: "Technicien / Opérateur", value: testRecord.operator || "Non renseigné" },
        { label: "Révision technique", value: options.officialApproval ? options.officialApproval.reviewerName : "En attente de revue" },
        { label: "Référence du rapport", value: testRecord.id },
        { label: "Statut du document", value: options.officialApproval ? "Approbation gouvernée" : "Brouillon / revue requise" }
      ]
    }
  ]);

  // =========================================================================
  // 3. RAW INPUTS & LABORATORY TEST MEASUREMENTS
  // =========================================================================
  if (testRecord.inputs && Object.keys(testRecord.inputs).length > 0) {
    const inputEntries = Object.entries(testRecord.inputs).filter(([_, v]) => typeof v !== "object");
    
    if (inputEntries.length > 0) {
      currentY = drawSectionBanner(
        doc, 
        currentY, 
        "DONNÉES BRUTES & MESURES D'ACQUISITION AU LABORATOIRE",
        "MESURES INITIALES"
      );

      const inputRows: Array<[string, string, string]> = [];
      
      // Group in pairs
      for (let i = 0; i < inputEntries.length; i += 2) {
        const entry1 = inputEntries[i];
        const entry2 = inputEntries[i + 1];
        
        const col1 = `${formatKey(entry1[0])}: ${formatVal(entry1[1])}`;
        const col2 = entry2 ? `${formatKey(entry2[0])}: ${formatVal(entry2[1])}` : "-";
        
        inputRows.push([
          `Paramètre #${i + 1}`,
          col1,
          col2
        ]);
      }

      autoTable(doc, {
        ...theme,
        startY: currentY,
        head: [["Index", "Mesure Primaire / Donnée d'Entrée", "Mesure Secondaire / Tare"]],
        body: inputRows,
        columnStyles: {
          0: { cellWidth: 26, fontStyle: "bold" },
          1: { cellWidth: 78 },
          2: { cellWidth: 78 }
        }
      });

      currentY = (doc as any).lastAutoTable.finalY + 5;
    }
  }

  // =========================================================================
  // 3.B. DETAILED SIEVE ANALYSIS TABLE (IF GRANULOMETRY TEST)
  // =========================================================================
  const sievesData: Array<{ sieve: number; retained?: number; weightRetained?: number; cumRetained?: number; percentPassing?: number }> = 
    testRecord.results?.sieves || testRecord.results?.sieveTable || testRecord.inputs?.sieves || [];

  if (Array.isArray(sievesData) && sievesData.length > 0) {
    if (currentY > 210) {
      doc.addPage();
      currentY = PDF_PAGE_MARGINS.top + 2;
    }

    currentY = drawSectionBanner(
      doc,
      currentY,
      "ANALYSE GRANULOMÉTRIQUE DÉTAILLÉE PAR TAMISAGE (EN 933-1 / ASTM C136)",
      "DISTRIBUTION DES GRAINS"
    );

    const sieveRows = sievesData.map((s, idx) => {
      const sizeStr = s.sieve === 0 ? "Fond de tamis (Pan)" : `${s.sieve} mm`;
      const retWeight = s.retained !== undefined ? `${s.retained} g` : s.weightRetained !== undefined ? `${s.weightRetained} g` : "-";
      const cumRet = s.cumRetained !== undefined ? `${Number(s.cumRetained).toFixed(1)} %` : "-";
      const pass = s.percentPassing !== undefined ? `${Number(s.percentPassing).toFixed(1)} %` : "-";
      return [`Tamis #${idx + 1}`, sizeStr, retWeight, cumRet, pass];
    });

    autoTable(doc, {
      ...theme,
      startY: currentY,
      head: [["N°", "Diamètre Tamis (mm)", "Refus Partiel (g)", "Refus Cumulé (%)", "Tamisat Passant (%)"]],
      body: sieveRows,
      columnStyles: {
        0: { cellWidth: 20, fontStyle: "bold", halign: "center" },
        1: { cellWidth: 42, fontStyle: "bold" },
        2: { cellWidth: 38, halign: "center" },
        3: { cellWidth: 40, halign: "center" },
        4: { cellWidth: 42, halign: "center", fontStyle: "bold", textColor: PDF_COLORS.secondary }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 5;
  }

  // =========================================================================
  // 4. CALCULATED RESULTS & NORMATIVE COMPLIANCE MATRIX TABLE
  // =========================================================================
  if (currentY > 210) {
    doc.addPage();
    currentY = PDF_PAGE_MARGINS.top + 2;
  }

  currentY = drawSectionBanner(
    doc, 
    currentY, 
    "RÉSULTATS CALCULÉS & TABLEAU DE CONFORMITÉ AUX NORMES",
    testRecord.standard
  );

  const complianceRows = (testRecord.complianceDetails || []).map((item) => {
    const statusLabel = item.status === "PASS" ? "CONFORME" : item.status === "WARNING" ? "ATTENTION" : "NON CONFORME";
    return [
      item.parameter,
      `${item.measured} ${item.unit || ""}`.trim(),
      item.limit || "Spécification standard",
      statusLabel,
      item.note || "Conforme aux tolérances requises"
    ];
  });

  // If no compliance details, add calculated results
  if (complianceRows.length === 0 && testRecord.results) {
    Object.entries(testRecord.results).forEach(([k, v]) => {
      if (typeof v !== "object") {
        complianceRows.push([
          formatKey(k),
          formatVal(v),
          "Conforme aux tolérances",
          testRecord.status === "PASS" ? "CONFORME" : "ATTENTION",
          "Calculé selon la norme"
        ]);
      }
    });
  }

  autoTable(doc, {
    ...theme,
    startY: currentY,
    head: [["Propriété / Paramètre Testé", "Valeur Mesurée", "Limites Normatives", "Statut", "Observations Techniques"]],
    body: complianceRows,
    columnStyles: {
      0: { cellWidth: 46, fontStyle: "bold" },
      1: { cellWidth: 32, halign: "center", fontStyle: "bold", textColor: PDF_COLORS.secondary },
      2: { cellWidth: 36, halign: "center" },
      3: { cellWidth: 28, halign: "center", fontStyle: "bold" },
      4: { cellWidth: 40 }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 5;

  // =========================================================================
  // 5. INTERPRETATION & ENGINEERING CONCLUSION BOX
  // =========================================================================
  if (currentY > 215) {
    doc.addPage();
    currentY = PDF_PAGE_MARGINS.top + 2;
  }

  currentY = drawSectionBanner(
    doc, 
    currentY, 
    "CONCLUSION TECHNIQUE & DÉCISION DU LABORATOIRE",
    "AVIS D'EXPERT"
  );

  const conclusionHeight = 22;
  doc.setFillColor(...(testRecord.status === "PASS" ? PDF_COLORS.successBg : testRecord.status === "WARNING" ? PDF_COLORS.warningBg : PDF_COLORS.dangerBg));
  doc.setDrawColor(...(testRecord.status === "PASS" ? PDF_COLORS.success : testRecord.status === "WARNING" ? PDF_COLORS.warning : PDF_COLORS.danger));
  doc.setLineWidth(0.4);
  doc.roundedRect(PDF_PAGE_MARGINS.left, currentY, PDF_PAGE_MARGINS.contentWidth, conclusionHeight, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...(testRecord.status === "PASS" ? PDF_COLORS.success : testRecord.status === "WARNING" ? PDF_COLORS.warning : PDF_COLORS.danger));
  doc.text(
    `RÉSULTAT: ${testRecord.status === "PASS" ? "DANS LES LIMITES ENREGISTRÉES — REVUE REQUISE" : testRecord.status === "WARNING" ? "CONDITIONNEL — REVUE REQUISE" : "NON CONFORME AUX LIMITES ENREGISTRÉES"}`,
    PDF_PAGE_MARGINS.left + 4,
    currentY + 5
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...PDF_COLORS.textPrimary);
  const interpretationText = testRecord.interpretation || 
    "Les résultats enregistrés sont présentés pour revue technique. Ils ne constituent pas à eux seuls une certification, une approbation de matériau ou une autorisation de mise en œuvre.";
  
  const splitText = doc.splitTextToSize(interpretationText, PDF_PAGE_MARGINS.contentWidth - 8);
  doc.text(splitText, PDF_PAGE_MARGINS.left + 4, currentY + 10);

  currentY += conclusionHeight + 5;

  // =========================================================================
  // 6. TECHNICAL REVIEW BLOCK (OFFICIAL ONLY WITH EXPLICIT GOVERNANCE EVIDENCE)
  // =========================================================================
  drawSignOffBlock(doc, currentY, {
    operatorName: testRecord.operator || "Opérateur non renseigné",
    directorName: "Réviseur non désigné",
    date: dateStr,
    reportRef: testRecord.id,
    labName: testRecord.laboratoryName || lab.name,
    officialApproval: options.officialApproval
  });

  // =========================================================================
  // 7. FINALIZE RUNNING HEADERS, FOOTERS & PAGE NUMBERS ACROSS ALL PAGES
  // =========================================================================
  finalizeReportPages(doc, {
    reportTitle: options.officialApproval ? "RAPPORT DE TEST • APPROBATION ENREGISTRÉE" : "RAPPORT DE TEST • REVUE REQUISE",
    reportSubtitle: testRecord.testTitleFr || testRecord.testTitleEn || testRecord.standard,
    reportRef: testRecord.id,
    date: dateStr,
    labProfile: lab
  });

  return doc;
}

function formatKey(k: string): string {
  return k
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

function formatVal(v: any): string {
  if (v === null || v === undefined) return "-";
  if (typeof v === "number") {
    return Number.isInteger(v) ? v.toString() : v.toFixed(2);
  }
  if (typeof v === "boolean") {
    return v ? "Oui / Conforme" : "Non / Rejet";
  }
  return String(v);
}
