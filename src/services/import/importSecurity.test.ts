import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import {
  IMPORT_LIMITS,
  ImportSecurityError,
  parseSafeJson,
  preflightImportFile,
} from "./importSecurity";
import { sanitizeSpreadsheetValue, sanitizeWorkbookStrings } from "../export/spreadsheetSanitizer";

describe("import security preflight", () => {
  const expectCode = (operation: () => unknown, code: string) => {
    try {
      operation();
      throw new Error("Expected operation to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ImportSecurityError);
      expect((error as ImportSecurityError).code).toBe(code);
    }
  };

  it("rejects unsupported extensions, path-like names, and oversized files", () => {
    expectCode(() => preflightImportFile("payload.exe", new Uint8Array([1])), "UNSUPPORTED_FILE_EXTENSION");
    expectCode(() => preflightImportFile("../payload.json", new TextEncoder().encode("{}")), "PATH_LIKE_FILE_NAME");
    expectCode(() => preflightImportFile("payload.json", new Uint8Array(IMPORT_LIMITS.maxFileBytes + 1)), "FILE_SIZE_EXCEEDED");
  });

  it("requires signatures for binary formats and accepts text CSV/JSON", () => {
    expectCode(() => preflightImportFile("payload.pdf", new TextEncoder().encode("not a pdf")), "INVALID_FILE_SIGNATURE");
    expect(preflightImportFile("payload.csv", new TextEncoder().encode("name,density\nSand,2650"))).toBe("CSV");
    expect(preflightImportFile("payload.json", new TextEncoder().encode("[]"))).toBe("JSON");
  });

  it("rejects deep JSON and safely parses untrusted governance metadata", () => {
    expect(() => parseSafeJson(new TextEncoder().encode(JSON.stringify({ __proto__: { polluted: true } })))).not.toThrow();
    expect(parseSafeJson(new TextEncoder().encode(JSON.stringify({ isSystem: true, approvalStatus: "Approved" })))).toEqual({ isSystem: true, approvalStatus: "Approved" });
    const deep = Array.from({ length: 22 }, () => ({})).reduceRight((child, _item) => ({ child }), {});
    expectCode(() => parseSafeJson(new TextEncoder().encode(JSON.stringify(deep))), "JSON_DEPTH_EXCEEDED");
  });
});

describe("spreadsheet export sanitization", () => {
  it.each(["=SUM(A1:A2)", " +SUM(A1:A2)", "-cmd", "@payload"])("prefixes formula-like text: %s", value => {
    expect(sanitizeSpreadsheetValue(value)).toBe(`'${value}`);
  });

  it("sanitizes strings in every worksheet cell", () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([["=1+1", "safe"]]), "Data");
    sanitizeWorkbookStrings(workbook);
    expect(workbook.Sheets.Data.A1.v).toBe("'=1+1");
    expect(workbook.Sheets.Data.B1.v).toBe("safe");
  });
});
