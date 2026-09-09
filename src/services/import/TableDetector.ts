import { PropertyMapper } from "./PropertyMapper";

export interface DetectedTable {
  id: string;
  headerRowIndex: number;
  headers: string[];
  columnIndices: number[];
  rows: Array<{
    originalRowIndex: number;
    data: Record<string, any>;
  }>;
  confidenceScore: number;
}

export class TableDetector {
  /**
   * Scans a 2D array of raw values and detects structured tabular regions.
   * Can detect multiple tables or a primary table within the sheet.
   */
  public static detectTables(grid: any[][]): DetectedTable[] {
    if (!grid || grid.length === 0) return [];

    const tables: DetectedTable[] = [];
    const scoredHeaderRows: Array<{ rowIndex: number; score: number; headers: string[]; columnIndices: number[] }> = [];

    // 1. Evaluate first 50 rows as candidates for table headers
    const scanLimit = Math.min(grid.length, 50);
    for (let r = 0; r < scanLimit; r++) {
      const row = grid[r];
      if (!row || row.length === 0) continue;

      const nonEmpties = row.filter(c => c !== null && c !== undefined && String(c).trim() !== "");
      if (nonEmpties.length < 2) continue; // Need at least 2 columns to qualify as table header

      // Score this row against property synonyms
      let matchCount = 0;
      let totalMeaningful = 0;
      const headers: string[] = [];
      const colIndices: number[] = [];

      row.forEach((cell, colIdx) => {
        if (cell === null || cell === undefined || String(cell).trim() === "") return;
        const text = String(cell).trim();
        totalMeaningful++;
        const match = PropertyMapper.matchHeader(text);
        if (match.confidenceScore >= 50 && match.canonicalKey !== "ignore") {
          matchCount++;
        }
        headers.push(text);
        colIndices.push(colIdx);
      });

      if (matchCount >= 1 && totalMeaningful >= 2) {
        const score = (matchCount * 25) + (totalMeaningful * 5);
        scoredHeaderRows.push({ rowIndex: r, score, headers, columnIndices: colIndices });
      }
    }

    // Sort candidate header rows by score descending
    scoredHeaderRows.sort((a, b) => b.score - a.score);

    // If no candidate scored via property synonyms, find first row with >= 2 text columns
    if (scoredHeaderRows.length === 0) {
      for (let r = 0; r < scanLimit; r++) {
        const row = grid[r];
        if (!row) continue;
        const texts = row.filter(c => typeof c === "string" && c.trim().length > 0);
        if (texts.length >= 2) {
          const headers: string[] = [];
          const colIndices: number[] = [];
          row.forEach((cell, cIdx) => {
            if (cell !== null && cell !== undefined && String(cell).trim() !== "") {
              headers.push(String(cell).trim());
              colIndices.push(cIdx);
            }
          });
          scoredHeaderRows.push({ rowIndex: r, score: 30, headers, columnIndices: colIndices });
          break;
        }
      }
    }

    // Default to row 0 if still nothing
    if (scoredHeaderRows.length === 0) {
      const row0 = grid[0] || [];
      const headers = row0.map((c, i) => c !== null && c !== undefined ? String(c).trim() : `Col_${i + 1}`);
      const colIndices = row0.map((_, i) => i);
      scoredHeaderRows.push({ rowIndex: 0, score: 10, headers, columnIndices: colIndices });
    }

    // Group rows belonging to the best header row
    const bestCandidate = scoredHeaderRows[0];
    const headerRowIdx = bestCandidate.rowIndex;
    const headers = bestCandidate.headers;
    const colIndices = bestCandidate.columnIndices;

    // Deduplicate headers
    const uniqueHeaders = headers.map((h, i) => {
      const count = headers.slice(0, i).filter(prev => prev === h).length;
      return count > 0 ? `${h}_${count + 1}` : h;
    });

    const rows: Array<{ originalRowIndex: number; data: Record<string, any> }> = [];

    for (let r = headerRowIdx + 1; r < grid.length; r++) {
      const row = grid[r];
      if (!row) continue;

      // Check if row is completely empty
      const nonEmpties = row.filter(c => c !== null && c !== undefined && String(c).trim() !== "");
      if (nonEmpties.length === 0) continue;

      // Filter out footer rows (e.g. "Total", "Average", "Notes:")
      const firstVal = String(row[colIndices[0]] || "").toLowerCase().trim();
      if (/^(total|average|moyenne|somme|مجموع|متوسط|ملاحظة|remarque)/i.test(firstVal)) {
        continue;
      }

      const rowData: Record<string, any> = {};
      let hasData = false;

      colIndices.forEach((colIdx, i) => {
        const headerName = uniqueHeaders[i];
        const val = row[colIdx];
        if (val !== null && val !== undefined) {
          rowData[headerName] = val;
          hasData = true;
        }
      });

      if (hasData) {
        rows.push({
          originalRowIndex: r,
          data: rowData
        });
      }
    }

    tables.push({
      id: "table_primary",
      headerRowIndex: headerRowIdx,
      headers: uniqueHeaders,
      columnIndices: colIndices,
      rows,
      confidenceScore: bestCandidate.score
    });

    return tables;
  }
}
