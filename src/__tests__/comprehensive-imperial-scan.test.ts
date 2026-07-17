import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

// Recursively get all files under a directory
function getFiles(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat && stat.isDirectory()) {
      // Exclude standard build/system directories
      if (
        file === "node_modules" ||
        file === "dist" ||
        file === ".git" ||
        file === "__tests__" // Exclude test files themselves to allow testing keywords in test suites
      ) {
        continue;
      }
      results = results.concat(getFiles(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

describe("Comprehensive Imperial unit-free codebase scan", () => {
  it("must contain absolutely zero imperial units or references in custom screens/utilities", () => {
    // Collect all source files to scan
    const sourceFiles = getFiles(path.join(process.cwd(), "src"));
    
    // Also include the server.ts file at workspace root
    const serverPath = path.join(process.cwd(), "server.ts");
    if (fs.existsSync(serverPath)) {
      sourceFiles.push(serverPath);
    }

    // Dynamic split keywords to avoid triggering false positives during self-scan
    const forbiddenKeywords = [
      ["i", "m", "p", "e", "r", "i", "a", "l"].join(""),
      ["I", "m", "p", "e", "r", "i", "a", "l"].join(""),
      ["p", "s", "i"].join(""),
      ["l", "b"].join(""),
      ["g", "a", "l"].join(""),
      ["i", "n", "c", "h"].join(""),
      ["y", "d", "³"].join(""),
      ["f", "t", "³"].join(""),
      ["ا", "ل", "ن", "ظ", "ا", "م", " ", "ا", "ل", "إ", "م", "ب", "ر", "ا", "ط", "و", "ر", "ي"].join(""),
      ["U", "n", "i", "t", "é", "s", " ", "I", "m", "p", "é", "r", "i", "a", "l", "e", "s"].join("")
    ];

    const violations: string[] = [];

    for (const filePath of sourceFiles) {
      const code = fs.readFileSync(filePath, "utf8");
      
      for (const kw of forbiddenKeywords) {
        // We look for whole/part keywords, taking special care of word boundaries for small abbreviations like 'lb' or 'gal'
        let hasMatch = false;
        
        if (kw === "lb" || kw === "gal" || kw === "psi") {
          // For lb, gal, and psi, we check isolated unit occurrences to avoid false positives on words like "algorithm", "collapsing", etc.
          const regexStr = `\\b${kw}\\b`;
          const regex = new RegExp(regexStr, "i");
          if (regex.test(code)) {
            hasMatch = true;
          }
        } else {
          // General search for keywords like psi, imperial, or Arabic/French descriptions
          if (code.includes(kw)) {
            hasMatch = true;
          }
        }

        if (hasMatch) {
          violations.push(`${path.relative(process.cwd(), filePath)} has forbidden keyword: "${kw}"`);
        }
      }
    }

    // Assert that no files contain forbidden keywords
    if (violations.length > 0) {
      console.error("Imperial unit scans failed! Violating files:\n", violations.join("\n"));
    }
    expect(violations).toHaveLength(0);
  });
});
