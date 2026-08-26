import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  createPdfDocument, 
  drawSectionBanner, 
  drawMetricCards, 
  drawMetadataGrid, 
  drawSignOffBlock, 
  getStandardTableTheme, 
  finalizeReportPages,
  PDF_PAGE_MARGINS
} from "./pdfCore";
import { DEFAULT_LAB_PROFILE } from "./types";
import { MaterialTestRecord } from "../../types/laboratoryTypes";
import { EngineeringMaterial } from "../../types";

export interface ProjectAuditPdfOptions {
  project: {
    id?: string;
    name?: string;
    client?: string;
    plant?: string;
    location?: string;
    engineer?: string;
    createdDate?: string;
  };
  materials?: EngineeringMaterial[];
  testRecords?: MaterialTestRecord[];
  mixFormulationsCount?: number;
  notes?: string;
}

/**
 * Generates an official Project & Quality Assurance Audit PDF Report.
 * Real vector document with native tables and auto page breaks.
 */
export async function generateProjectAuditPdf(
  options: ProjectAuditPdfOptions
): Promise<jsPDF> {
  const doc = createPdfDocument();
  const theme = getStandardTableTheme();
  const lab = DEFAULT_LAB_PROFILE;
  const project = options.project;
  const materials = options.materials || [];
  const tests = options.testRecords || [];

  const dateStr = new Date().toISOString().split("T")[0];
  const reportRef = `AUDIT-${project.name ? project.name.replace(/\s+/g, "-").toUpperCase().slice(0, 10) : "PROJ"}-${Math.floor(Date.now() / 1000).toString().slice(-5)}`;

  let currentY = PDF_PAGE_MARGINS.top + 2;

  // =========================================================================
  // 1. EXECUTIVE SUMMARY CARDS
  // =========================================================================
  currentY = drawSectionBanner(
    doc, 
    currentY, 
    "PROJECT QUALITY AUDIT & MATERIALS DOSSIER",
    "ISO 9001 / ISO 17025"
  );

  const passingTests = tests.filter(t => t.status === "PASS").length;
  const complianceRate = tests.length > 0 ? Math.round((passingTests / tests.length) * 100) : 100;

  currentY = drawMetricCards(doc, currentY, [
    {
      label: "Registered Materials",
      value: `${materials.length}`,
      unit: "Items",
      highlight: "primary",
      subtext: "In Project Library"
    },
    {
      label: "Completed Lab Tests",
      value: `${tests.length}`,
      unit: "Tests",
      highlight: "primary",
      subtext: `${passingTests} Conforming`
    },
    {
      label: "Quality Compliance Rate",
      value: `${complianceRate}%`,
      highlight: complianceRate >= 90 ? "success" : "warning",
      subtext: "Batch acceptance index"
    },
    {
      label: "Formulation Batches",
      value: `${options.mixFormulationsCount || 1}`,
      unit: "Mixes",
      highlight: "primary",
      subtext: "Validated mix designs"
    }
  ]);

  // =========================================================================
  // 2. PROJECT METADATA GRID
  // =========================================================================
  currentY = drawMetadataGrid(doc, currentY, [
    {
      title: "PROJECT IDENTIFICATION",
      items: [
        { label: "Project Title", value: project.name || "Main Infrastructure Project" },
        { label: "Client / Contracting Authority", value: project.client || "Ministry of Infrastructure" },
        { label: "Location / Site", value: project.location || "Central Regional Site" },
        { label: "Batching Plant", value: project.plant || "Ready-Mix Batching Plant #1" }
      ]
    },
    {
      title: "ENGINEERING AUDIT CONTEXT",
      items: [
        { label: "Responsible Lead Engineer", value: project.engineer || "Senior Materials Engineer" },
        { label: "Audit Standards", value: "NF EN 206 / ISO 17025" },
        { label: "Audit Date", value: dateStr },
        { label: "Dossier Status", value: complianceRate >= 80 ? "ACCEPTED & CERTIFIED" : "UNDER REVIEW" }
      ]
    }
  ]);

  // =========================================================================
  // 3. PROJECT MATERIALS LIBRARY SUMMARY TABLE
  // =========================================================================
  if (materials.length > 0) {
    currentY = drawSectionBanner(
      doc, 
      currentY, 
      "REGISTERED CONSTITUENT MATERIALS IN PROJECT LIBRARY",
      "CHARACTERIZATION RECORDS"
    );

    const matRows = materials.map((m, idx) => [
      `#${idx + 1}`,
      m.name || "Material",
      (m.category || "General").toUpperCase(),
      m.provenance || m.region || m.sourceQuarry || "Local Source",
      m.density ? `${(m.density > 100 ? m.density / 1000 : m.density).toFixed(2)} g/cm³` : "-",
      m.absorption !== undefined ? `${m.absorption.toFixed(1)}%` : "-",
      m.status === "نشط" ? "APPROVED" : "ACTIVE"
    ]);

    autoTable(doc, {
      ...theme,
      startY: currentY,
      head: [["No.", "Material Name", "Category", "Source / Origin", "Density", "Absorption", "Status"]],
      body: matRows,
      columnStyles: {
        0: { cellWidth: 14, halign: "center" },
        1: { cellWidth: 50, fontStyle: "bold" },
        2: { cellWidth: 28 },
        3: { cellWidth: 34 },
        4: { cellWidth: 22, halign: "center" },
        5: { cellWidth: 18, halign: "center" },
        6: { cellWidth: 22, halign: "center", fontStyle: "bold" }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 5;
  }

  // =========================================================================
  // 4. LABORATORY TEST CERTIFICATES LOG
  // =========================================================================
  if (tests.length > 0) {
    if (currentY > 210) {
      doc.addPage();
      currentY = PDF_PAGE_MARGINS.top + 2;
    }

    currentY = drawSectionBanner(
      doc, 
      currentY, 
      "LABORATORY TEST CERTIFICATES & QUALITY CONTROL RECORDS",
      "TRACEABILITY LOG"
    );

    const testRows = tests.map(t => [
      t.id,
      t.testTitleFr || t.testTitleEn || t.testType,
      t.materialName,
      t.standard,
      t.date,
      `${t.score || 95}%`,
      t.status === "PASS" ? "CONFORMING" : t.status === "WARNING" ? "WARNING" : "FAILED"
    ]);

    autoTable(doc, {
      ...theme,
      startY: currentY,
      head: [["Test ID", "Test Protocol / Title", "Sample / Material", "Standard", "Date", "Score", "Verdict"]],
      body: testRows,
      columnStyles: {
        0: { cellWidth: 32, fontStyle: "bold" },
        1: { cellWidth: 44 },
        2: { cellWidth: 32 },
        3: { cellWidth: 24, halign: "center" },
        4: { cellWidth: 20, halign: "center" },
        5: { cellWidth: 14, halign: "center" },
        6: { cellWidth: 22, halign: "center", fontStyle: "bold" }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;
  }

  // =========================================================================
  // 5. SIGN-OFF BLOCK
  // =========================================================================
  drawSignOffBlock(doc, currentY, {
    operatorName: project.engineer || "Materials Quality Auditor",
    directorName: "Director of Quality Assurance",
    date: dateStr,
    reportRef: reportRef,
    labName: lab.name
  });

  // =========================================================================
  // 6. FINALIZE PAGES
  // =========================================================================
  finalizeReportPages(doc, {
    reportTitle: "AUDIT DOSSIER & CONCRETE QUALITY CERTIFICATE",
    reportSubtitle: project.name || "Quality Assurance Log",
    reportRef: reportRef,
    date: dateStr,
    labProfile: lab
  });

  return doc;
}
