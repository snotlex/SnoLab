export const IMPORT_LIMITS = {
  maxFileBytes: 25 * 1024 * 1024,
  maxJsonDepth: 20,
  maxJsonNodes: 50_000,
  maxJsonStringLength: 100_000,
  maxWorkbookSheets: 50,
  maxWorkbookCells: 250_000,
} as const;

export type ImportFileType = "EXCEL" | "PDF" | "CSV" | "JSON";

export class ImportSecurityError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "ImportSecurityError";
    this.code = code;
  }
}

const EXTENSIONS: Record<string, ImportFileType> = {
  ".xlsx": "EXCEL",
  ".xls": "EXCEL",
  ".csv": "CSV",
  ".json": "JSON",
  ".pdf": "PDF",
};

const DANGEROUS_KEYS = new Set(["__proto__", "prototype", "constructor"]);
function bytesOf(buffer: ArrayBuffer | Uint8Array): Uint8Array {
  return buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
}

function hasPrefix(bytes: Uint8Array, prefix: number[]): boolean {
  return prefix.every((value, index) => bytes[index] === value);
}

function looksLikeText(bytes: Uint8Array): boolean {
  const sample = bytes.subarray(0, Math.min(bytes.length, 4096));
  let controlBytes = 0;
  for (const byte of sample) {
    if (byte === 0) return false;
    if (byte < 7 || (byte > 14 && byte < 32)) controlBytes += 1;
  }
  return controlBytes < Math.max(2, sample.length * 0.02);
}

export function detectImportFileType(fileName: string): ImportFileType {
  const baseName = fileName.split(/[\\/]/).pop() || "";
  const extension = baseName.includes(".") ? baseName.slice(baseName.lastIndexOf(".")).toLowerCase() : "";
  const type = EXTENSIONS[extension];
  if (!type) {
    throw new ImportSecurityError("UNSUPPORTED_FILE_EXTENSION", "صيغة الملف غير مسموحة للاستيراد.");
  }
  return type;
}

export function preflightImportFile(
  fileName: string,
  buffer: ArrayBuffer | Uint8Array,
  declaredType?: string,
): ImportFileType {
  if (!fileName || fileName !== fileName.trim() || fileName.includes("\0")) {
    throw new ImportSecurityError("INVALID_FILE_NAME", "اسم الملف غير صالح.");
  }
  if (fileName.includes("..") || /[\\/]/.test(fileName)) {
    throw new ImportSecurityError("PATH_LIKE_FILE_NAME", "لا يسمح بمسارات أو أسماء ملفات متداخلة.");
  }
  const type = detectImportFileType(fileName);
  const bytes = bytesOf(buffer);
  if (bytes.byteLength === 0) {
    throw new ImportSecurityError("EMPTY_FILE", "لا يمكن استيراد ملف فارغ.");
  }
  if (bytes.byteLength > IMPORT_LIMITS.maxFileBytes) {
    throw new ImportSecurityError("FILE_SIZE_EXCEEDED", `حجم الملف يتجاوز الحد المسموح (${IMPORT_LIMITS.maxFileBytes} بايت).`);
  }
  if (declaredType && declaredType !== "" && declaredType !== "application/octet-stream") {
    const declared = declaredType.toLowerCase();
    const allowed = type === "PDF" ? "application/pdf" : type === "JSON" ? "application/json" : type === "CSV" ? "text/csv" : "spreadsheet";
    if (type === "PDF" && declared !== allowed) throw new ImportSecurityError("MIME_MISMATCH", "نوع MIME لا يطابق امتداد PDF.");
    if (type === "JSON" && !declared.includes("json")) throw new ImportSecurityError("MIME_MISMATCH", "نوع MIME لا يطابق امتداد JSON.");
  }

  if (type === "PDF" && !hasPrefix(bytes, [0x25, 0x50, 0x44, 0x46])) {
    throw new ImportSecurityError("INVALID_FILE_SIGNATURE", "توقيع ملف PDF غير صالح.");
  }
  if (type === "EXCEL" && !(hasPrefix(bytes, [0x50, 0x4b, 0x03, 0x04]) || hasPrefix(bytes, [0xd0, 0xcf, 0x11, 0xe0]))) {
    throw new ImportSecurityError("INVALID_FILE_SIGNATURE", "توقيع ملف Excel غير صالح.");
  }
  if ((type === "CSV" || type === "JSON") && !looksLikeText(bytes)) {
    throw new ImportSecurityError("INVALID_TEXT_FILE", "الملف النصي يحتوي على بيانات ثنائية غير صالحة.");
  }
  return type;
}

export function assertSafeImportKey(key: string): void {
  if (DANGEROUS_KEYS.has(key)) {
    throw new ImportSecurityError("DANGEROUS_KEY", `المفتاح غير مسموح: ${key}.`);
  }
}

export function assertSafeImportObject(value: unknown, pathName = "$", depth = 0, state = { nodes: 0 }): void {
  if (depth > IMPORT_LIMITS.maxJsonDepth) {
    throw new ImportSecurityError("JSON_DEPTH_EXCEEDED", "بنية JSON عميقة بشكل غير مسموح.");
  }
  state.nodes += 1;
  if (state.nodes > IMPORT_LIMITS.maxJsonNodes) {
    throw new ImportSecurityError("JSON_NODE_LIMIT_EXCEEDED", "ملف JSON يحتوي على عدد عناصر يتجاوز الحد المسموح.");
  }
  if (typeof value === "string") {
    if (value.length > IMPORT_LIMITS.maxJsonStringLength) throw new ImportSecurityError("JSON_STRING_LIMIT_EXCEEDED", `نص JSON طويل جدًا عند ${pathName}.`);
    return;
  }
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertSafeImportObject(item, `${pathName}[${index}]`, depth + 1, state));
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    assertSafeImportKey(key);
    assertSafeImportObject(child, `${pathName}.${key}`, depth + 1, state);
  }
}

export function parseSafeJson(buffer: ArrayBuffer | Uint8Array): unknown {
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytesOf(buffer));
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new ImportSecurityError("INVALID_JSON", "ملف JSON غير صالح.");
  }
  assertSafeImportObject(parsed);
  return parsed;
}

export function assertWorkbookLimits(sheetCount: number, cellCount: number): void {
  if (sheetCount > IMPORT_LIMITS.maxWorkbookSheets) throw new ImportSecurityError("WORKBOOK_SHEET_LIMIT_EXCEEDED", "عدد أوراق المصنف يتجاوز الحد المسموح.");
  if (cellCount > IMPORT_LIMITS.maxWorkbookCells) throw new ImportSecurityError("WORKBOOK_CELL_LIMIT_EXCEEDED", "عدد خلايا المصنف يتجاوز الحد المسموح.");
}
