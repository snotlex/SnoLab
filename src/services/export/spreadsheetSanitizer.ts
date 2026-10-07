import * as XLSX from "xlsx";

const FORMULA_PREFIXES = ["=", "+", "-", "@"];

/** Prefixes formula-like cell text so spreadsheet applications render it as text. */
export function sanitizeSpreadsheetValue(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmedStart = value.trimStart();
  if (FORMULA_PREFIXES.some(prefix => trimmedStart.startsWith(prefix))) return `'${value}`;
  return value;
}

export function sanitizeWorkbookStrings(workbook: XLSX.WorkBook): void {
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet || !sheet["!ref"]) continue;
    const range = XLSX.utils.decode_range(sheet["!ref"]);
    for (let row = range.s.r; row <= range.e.r; row += 1) {
      for (let col = range.s.c; col <= range.e.c; col += 1) {
        const address = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = sheet[address];
        if (cell && typeof cell.v === "string") cell.v = sanitizeSpreadsheetValue(cell.v);
      }
    }
  }
}
