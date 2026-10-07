import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("Phase 5 logical direction contract", () => {
  it("keeps priority workflow components free of fixed RTL/LTR direction attributes", () => {
    const files = [
      "src/components/WorkspaceWorkflowHeader.tsx",
      "src/components/WorkspaceEmptyState.tsx",
      "src/components/MixVersioningPanel.tsx",
      "src/components/SpecializedConcreteInputs.tsx",
      "src/components/ConcreteTypeSelector.tsx",
    ];

    for (const file of files) {
      const content = source(file);
      expect(content, file).not.toMatch(/dir=["'](rtl|ltr)["']/);
    }
  });

  it("uses logical text and spacing utilities in the priority components", () => {
    const files = [
      "src/components/WorkspaceWorkflowHeader.tsx",
      "src/components/WorkspaceEmptyState.tsx",
      "src/components/MixVersioningPanel.tsx",
      "src/components/SpecializedConcreteInputs.tsx",
      "src/components/ConcreteTypeSelector.tsx",
    ];

    for (const file of files) {
      const content = source(file);
      expect(content, file).not.toMatch(/\btext-(left|right)\b/);
      expect(content, file).not.toMatch(/\b(?:m[lr]|p[lr])-[^\s"`}]*/);
    }
  });

  it("passes the active language into the versioning panel", () => {
    const content = source("src/App.tsx");
    expect(content).toContain("<MixVersioningPanel");
    expect(content).toContain('language={language as "ar" | "fr" | "en"}');
  });
});
