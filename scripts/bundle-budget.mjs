import { readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { resolve } from "node:path";

const root = process.cwd();
const htmlPath = resolve(root, "dist/index.html");
const html = await readFile(htmlPath, "utf8");
const entryMatch = html.match(/<script[^>]+type="module"[^>]+src="([^"]+)"/);
if (!entryMatch) throw new Error("Bundle budget: production entry script was not found.");

const entryPath = resolve(root, "dist", entryMatch[1].replace(/^\//, ""));
const entry = await readFile(entryPath);
const gzipBytes = gzipSync(entry, { level: 9 }).byteLength;
const maxEntryGzipBytes = 500 * 1024;
if (gzipBytes > maxEntryGzipBytes) {
  throw new Error(`Bundle budget exceeded: entry gzip is ${gzipBytes} bytes (limit ${maxEntryGzipBytes}).`);
}

const forbiddenPreloads = ["pdf", "xlsx", "spreadsheet", "charts-vendor"];
const preloads = [...html.matchAll(/rel="modulepreload"[^>]+href="([^"]+)"/g)].map(match => match[1]);
const heavyPreloads = preloads.filter(path => forbiddenPreloads.some(token => path.toLowerCase().includes(token)));
if (heavyPreloads.length > 0) {
  throw new Error(`Heavy modules are preloaded during boot: ${heavyPreloads.join(", ")}`);
}

console.log(`Bundle budget passed: entry gzip ${(gzipBytes / 1024).toFixed(1)} KB; modulepreloads ${preloads.length}; heavy preloads 0.`);
