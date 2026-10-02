import { describe, expect, it } from "vitest";
import {
  appendProjectAuditEvent,
  createImmutableProjectVersion,
  createProjectUploadEnvelope,
  validateProjectUploadEnvelope,
  exportProjectAuditTrail
} from "../services/storage/phase3Governance";
import { createNewProjectFile } from "../services/storage/ProjectStorageService";
import { can, permissionsFor, separationOfDuties } from "../services/permissions";

describe("Phase 3: local-first governance contracts", () => {
  it("creates an immutable version with a reproducible integrity hash", async () => {
    const project = createNewProjectFile({ id: "PROJ-3", name: "Phase 3" });
    const first = await createImmutableProjectVersion(project, "phase-3.snlab");
    const second = await createImmutableProjectVersion(project, "phase-3.snlab", JSON.stringify(project));

    expect(first.projectId).toBe("PROJ-3");
    expect(first.contentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(second.contentHash).toBe(first.contentHash);
    expect(first.versionId).toBe(second.versionId);
  });

  it("rejects tampered upload content before acceptance", async () => {
    const project = createNewProjectFile({ id: "PROJ-3-TAMPER", name: "Tamper" });
    const envelope = await createProjectUploadEnvelope(project, "tamper.snlab");
    const result = await validateProjectUploadEnvelope({ ...envelope, content: `${envelope.content} ` });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Content hash does not match immutable version metadata");
  });

  it("records actor and operation without requiring an account", () => {
    const project = createNewProjectFile({ id: "PROJ-3-AUDIT", name: "Audit" });
    const updated = appendProjectAuditEvent(project, {
      operation: "upload",
      actor: { subject: "user-1", teamId: "team-1", roles: ["engineer"] },
      fileName: "audit.snlab",
      contentHash: "a".repeat(64),
      details: "phase 3 upload"
    });

    expect(updated.governance?.auditEvents).toHaveLength(1);
    expect(updated.governance?.auditEvents?.[0].actor?.teamId).toBe("team-1");
    expect(updated.governance?.auditEvents?.[0].operation).toBe("upload");
    expect(updated.auditTrail?.revisionCount).toBe(2);
  });

  it("exports audit history as stable JSON and spreadsheet-safe CSV", () => {
    const project = createNewProjectFile({ id: "PROJ-3-EXPORT", name: "Export" });
    const updated = appendProjectAuditEvent(project, {
      operation: "export",
      actor: { subject: "user-1", displayName: "=Injected Formula" },
      fileName: "audit.snlab",
      details: "Exported, reviewed"
    });

    const json = JSON.parse(exportProjectAuditTrail(updated, "json"));
    const csv = exportProjectAuditTrail(updated, "csv");

    expect(json.projectId).toBe("PROJ-3-EXPORT");
    expect(json.events[0].operation).toBe("export");
    expect(csv.split("\n")).toHaveLength(2);
    expect(csv).toContain("'=Injected Formula");
    expect(csv).toContain('"Exported, reviewed"');
  });

  it("enforces the phase 3 role matrix and separation of duties", () => {
    expect(can("design-engineer", "edit-inputs")).toBe(true);
    expect(can("design-engineer", "approve-production")).toBe(false);
    expect(can("approver", "approve-production")).toBe(true);
    expect(permissionsFor("administrator")).toContain("delete-version");
    expect(separationOfDuties("creator-1", "creator-1")).toBe(false);
    expect(separationOfDuties("creator-1", "approver-1")).toBe(true);
  });
});
