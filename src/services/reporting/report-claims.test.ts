import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const source = (relativePath: string) =>
  readFileSync(fileURLToPath(new URL(`../../${relativePath}`, import.meta.url)), "utf8");

describe("mix-design report claim guard", () => {
  it("does not advertise a calculated formulation as an approval or certificate", () => {
    const exporter = source("utils/reportExporter.tsx");
    const a4Page = source("components/report/A4Page.tsx");
    const combined = `${exporter}\n${a4Page}`;
    for (const forbidden of [
      "APPROVED MIX",
      "FORMULA APPROVED",
      "BÉTON CERTIFIÉ CONFORME",
      "Laboratory Certified Technical Stamp",
      "SNO® PLATFORM CERTIFICATION",
      "SNO-MX-2026-CERT",
    ]) {
      expect(combined).not.toContain(forbidden);
    }
    expect(combined).toContain("MIX DESIGN — REVIEW REQUIRED");
    expect(combined).toContain("REVIEW REQUIRED");
  });
});
