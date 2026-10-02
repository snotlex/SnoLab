import { 
  EngineeringMaterial, 
  MixDesignInput, 
  MixDesignResult, 
  MixVersion, 
  LabValidationRecord,
  LabOverride 
} from "../../types";
import { MaterialTestRecord } from "../../types/laboratoryTypes";

import type { ProjectAuditEvent, ProjectIdentity } from "./phase3Governance";

export interface ProjectMetadata {
  id: string;
  name: string;
  code?: string;
  engineer: string;
  client: string;
  location: string;
  plant: string;
  createdDate: string;
  lastModified: string;
  description: string;
  version: number;
  tags?: string[];
  workflowStatus?: "draft" | "under_review" | "approved" | "archived";
  /** Optional identity metadata; the .snlab file remains usable without an account. */
  ownerId?: string;
  teamId?: string;
}

export interface ProjectSettings {
  language: "ar" | "fr" | "en";
  currency: string;
  unitSystem: "metric" | "SI";
  concreteType?: string;
  selectedMethod: string;
  costBasis: "dry" | "wet";
  autoDensities: boolean;
}

export interface ProjectSavedMix {
  id: string;
  name: string;
  date: string;
  inputs: MixDesignInput;
  results?: MixDesignResult;
  currency?: string;
  notes?: string;
  tags?: string[];
}

export interface ProjectNote {
  id: string;
  title: string;
  content: string;
  category?: "general" | "site" | "lab" | "structural" | "commercial";
  author?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectHistoryEntry {
  id: string;
  timestamp: string;
  action: string;
  user?: string;
  details?: string;
  category?: "material" | "test" | "mix" | "system" | "project";
  previousValue?: any;
  newValue?: any;
}

export interface SnoLabProjectFile {
  schemaVersion: number;
  fileType: "snolab_project";
  appVersion: string;
  exportedAt: string;
  metadata: ProjectMetadata;
  settings: ProjectSettings;
  materials: EngineeringMaterial[];
  laboratoryTests: MaterialTestRecord[];
  materialProperties: {
    overrides?: Record<string, LabOverride>;
    sources?: Record<string, any>;
    ratings?: Record<string, number>;
    favorites?: string[];
  };
  mixDesigns: {
    currentInputs: MixDesignInput;
    currentResults?: MixDesignResult;
    savedMixes: ProjectSavedMix[];
    versions: MixVersion[];
  };
  calculationResults?: {
    lastCalculatedAt?: string;
    summary?: any;
    costAnalysis?: any;
    durabilityAnalysis?: any;
  };
  validationRecords: LabValidationRecord[];
  reports?: Array<{
    id: string;
    name: string;
    type: string;
    generatedAt: string;
    dataSnapshot?: any;
  }>;
  notes: ProjectNote[];
  history: ProjectHistoryEntry[];
  auditTrail?: {
    createdBy?: string;
    createdAt?: string;
    lastModifiedBy?: string;
    lastModifiedAt?: string;
    revisionCount?: number;
    revisionHistory?: string[];
  };
  /** Phase 3 governance metadata. Never contains credentials or access tokens. */
  governance?: {
    owner?: ProjectIdentity;
    auditEvents?: ProjectAuditEvent[];
  };
}

export type SaveStatus = "saved" | "saving" | "unsaved" | "error" | "idle";

export interface ProjectFileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  schemaVersion: number;
  migrated?: boolean;
}
