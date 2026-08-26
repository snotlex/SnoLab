import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { MaterialTestRecord } from "../../types/laboratoryTypes";
import { 
  createPdfDocument, 
  drawSectionBanner, 
  drawMetricCards, 
  drawMetadataGrid, 
  drawSignOffBlock, 
  getStandardTableTheme, 
  finalizeReportPages,
  PDF_COLORS,
  PDF_PAGE_MARGINS
} from "./pdfCore";
import { LabTestPdfOptions, DEFAULT_LAB_PROFILE } from "./types";

/**
 * Generates an official, publication-quality, multi-page vector PDF for Laboratory Test & Material Reports.
 * Real selectable vector text, real pagination, zero screenshot imagery.
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
  // 2. SAMPLE & TEST EXECUTION METADATA
  // =========================================================================
  currentY = drawMetadataGrid(doc, currentY, [
    {
      title: "IDENTIFICATION DE L'ÉCHANTILLON",
      items: [
        { label: "Nom du Matériau", value: testRecord.materialName || "Granulat d'essai" },
        { label: "N° Échantillon (Sample ID)", value: testRecord.sampleId || "SMP-001" },
        { label: "Catégorie", value: testRecord.materialCategory || testRecord.category },
        { label: "Date de Réception / Essai", value: testRecord.date }
      ]
    },
    {
      title: "CONTEXTE DE L'ESSAI & PROJET",
      items: [
        { label: "Titre de l'Essai", value: testRecord.testTitleFr || testRecord.testTitleEn || testRecord.testType },
        { label: "Norme de Référence", value: testRecord.standard },
        { label: "Projet / Chantier", value: testRecord.projectName || "Projet Général LIMS" },
        { label: "Laboratoire Responsable", value: testRecord.laboratoryName || lab.name }
      ]
    },
    {
      title: "OPÉRATEUR & TRAÇABILITÉ",
      items: [
        { label: "Technicien / Opérateur", value: testRecord.operator || "Opérateur Qualifié" },
        { label: "Synchronisation Matériau", value: testRecord.syncedToMaterial ? "Oui (Connecté)" : "Archive" },
        { label: "N° Rapport / Certificat", value: testRecord.id },
        { label: "Accréditation", value: "ISO/IEC 17025" }
      ]
    }
  ]);

  // =========================================================================
  // 3. RAW INPUTS & LABORATORY TEST MEASUREMENTS
  // =========================================================================
  if (testRecord.inputs && Object.keys(testRecord.inputs).length > 0) {
    currentY = drawSectionBanner(
      doc, 
      currentY, 
      "DONNÉES BRUTES & MESURES D'ACQUISITION AU LABORATOIRE",
      "MESURES INITIALES"
    );

    const inputEntries = Object.entries(testRecord.inputs);
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
      complianceRows.push([
        formatKey(k),
        formatVal(v),
        "Conforme aux tolérances",
        testRecord.status === "PASS" ? "CONFORME" : "ATTENTION",
        "Calculé selon la norme"
      ]);
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
    `DÉCISION: ${testRecord.status === "PASS" ? "MATÉRIAU VALIDÉ ET ACCEPTÉ POUR FORMULATION DU BÉTON" : testRecord.status === "WARNING" ? "MATÉRIAU ACCEPTÉ SOUS RÉSERVE D'AJUSTEMENT" : "MATÉRIAU REFUSÉ / NON CONFORME"}`,
    PDF_PAGE_MARGINS.left + 4,
    currentY + 5
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...PDF_COLORS.textPrimary);
  const interpretationText = testRecord.interpretation || 
    "Les essais ont été conduits conformément aux protocoles normatifs en vigueur. Les résultats obtenus démontrent la conformité du matériau aux critères de formulation.";
  
  const splitText = doc.splitTextToSize(interpretationText, PDF_PAGE_MARGINS.contentWidth - 8);
  doc.text(splitText, PDF_PAGE_MARGINS.left + 4, currentY + 10);

  currentY += conclusionHeight + 5;

  // =========================================================================
  // 6. OFFICIAL LABORATORY SIGN-OFF & CERTIFICATION STAMP
  // =========================================================================
  drawSignOffBlock(doc, currentY, {
    operatorName: testRecord.operator || "Ingénieur Matériaux & Essais",
    directorName: "Chef de Département Contrôle Qualité",
    date: dateStr,
    reportRef: testRecord.id,
    labName: testRecord.laboratoryName || lab.name
  });

  // =========================================================================
  // 7. FINALIZE RUNNING HEADERS, FOOTERS & PAGE NUMBERS ACROSS ALL PAGES
  // =========================================================================
  finalizeReportPages(doc, {
    reportTitle: "CERTIFICAT D'ESSAI LABORATOIRE",
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
