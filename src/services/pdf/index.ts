/**
 * Official SnoLab PDF Generation Service
 * High-performance, vector-native, accessible, multi-page PDF generation engine.
 * 100% vector text, native autoTable pagination, zero full-page screenshot capturing.
 */

export * from "./types";
export * from "./pdfCore";
export * from "./mixDesignPdfGenerator";
export * from "./labTestPdfGenerator";
export * from "./projectAuditPdfGenerator";

import { MixDesignInput, MixDesignResult } from "../../types";
import { MaterialTestRecord } from "../../types/laboratoryTypes";
import { MixDesignPdfOptions, LabTestPdfOptions } from "./types";
import { generateMixDesignPdf } from "./mixDesignPdfGenerator";
import { generateLabTestPdf } from "./labTestPdfGenerator";
import { generateProjectAuditPdf, ProjectAuditPdfOptions } from "./projectAuditPdfGenerator";

/**
 * High-level helper to generate and immediately trigger download of a Concrete Mix Design PDF.
 */
export async function downloadMixDesignPdf(
  result: MixDesignResult,
  input: MixDesignInput,
  options: MixDesignPdfOptions = {}
): Promise<void> {
  const doc = await generateMixDesignPdf(result, input, options);
  const lang = (options.language || "fr").toUpperCase();
  const fck = Math.round(input.fck28 || 30);
  const fileName = `SnoLab_Mix_Design_Report_C${fck}_${lang}.pdf`;
  doc.save(fileName);
}

/**
 * High-level helper to generate and immediately trigger download of a Laboratory Test Certificate PDF.
 */
export async function downloadLabTestPdf(
  testRecord: MaterialTestRecord,
  options: LabTestPdfOptions = {}
): Promise<void> {
  const doc = await generateLabTestPdf(testRecord, options);
  const safeId = (testRecord.id || "TEST").replace(/[^a-zA-Z0-9-_]/g, "_");
  const fileName = `SnoLab_LabTest_Report_${safeId}.pdf`;
  doc.save(fileName);
}

/**
 * High-level helper to generate and immediately trigger download of a Project Audit PDF.
 */
export async function downloadProjectAuditPdf(
  options: ProjectAuditPdfOptions
): Promise<void> {
  const doc = await generateProjectAuditPdf(options);
  const projName = (options.project.name || "Project").replace(/[^a-zA-Z0-9-_]/g, "_");
  const fileName = `SnoLab_Project_Audit_${projName}.pdf`;
  doc.save(fileName);
}
