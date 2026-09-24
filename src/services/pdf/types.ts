import { MixDesignInput, MixDesignResult, EngineeringMaterial } from "../../types";
import { MaterialTestRecord } from "../../types/laboratoryTypes";

export type ReportLanguage = "fr" | "en" | "ar";

export interface LabProfile {
  name: string;
  nameAr?: string;
  nameFr?: string;
  accreditation: string;
  department: string;
  address: string;
  contact: string;
  logoText?: string;
}

export const DEFAULT_LAB_PROFILE: LabProfile = {
  name: "SNOLAB ENGINEERING MATERIALS LABORATORY",
  nameFr: "LABORATOIRE D'ESSAIS ET D'INGÉNIERIE DES MATÉRIAUX - SNOLAB",
  nameAr: "مخبر سنولاب لهندسة وتوصيف مواد البناء",
  accreditation: "ENGINEERING CALCULATION REPORT • REVIEW & TRIAL MIX REQUIRED",
  department: "CONCRETE FORMULATION & MATERIALS CONTROL",
  address: "Project-specific laboratory / engineering record",
  contact: "SnoLab local report • revision-controlled document",
  logoText: "SNOLAB"
};

export interface MixDesignPdfOptions {
  language?: ReportLanguage;
  batchVolume?: number;
  activeProject?: {
    name?: string;
    client?: string;
    plant?: string;
    location?: string;
    engineer?: string;
    contractor?: string;
  };
  materialsDatabase?: EngineeringMaterial[];
  includeMoistureCorrection?: boolean;
  includeStandardsCompliance?: boolean;
  includeSignatures?: boolean;
  notes?: string;
  chartImageBase64?: string;
}

export interface LabTestPdfOptions {
  language?: ReportLanguage;
  labProfile?: Partial<LabProfile>;
  includeSignatures?: boolean;
  chartImageBase64?: string;
  notes?: string;
}

export interface MaterialDossierPdfOptions {
  language?: ReportLanguage;
  labProfile?: Partial<LabProfile>;
  includeSignatures?: boolean;
  notes?: string;
  projectName?: string;
  academicSupervisor?: string;
}
