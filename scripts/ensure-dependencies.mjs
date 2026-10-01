import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";

const require = createRequire(import.meta.url);
const requiredPackages = ["qrcode"];
const missing = [];

for (const packageName of requiredPackages) {
  try {
    require.resolve(packageName);
  } catch {
    missing.push(packageName);
  }
}

if (missing.length === 0) {
  console.log("[SnoLab] Required frontend dependencies are available.");
  process.exit(0);
}

console.warn(`[SnoLab] Missing dependencies: ${missing.join(", ")}`);
console.warn("[SnoLab] Installing dependencies from package-lock.json before starting Vite...");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const result = spawnSync(npmCommand, ["install", "--no-audit", "--no-fund"], { stdio: "inherit", shell: false });
if (result.error) {
  console.error(`[SnoLab] Could not run npm install: ${result.error.message}`);
  process.exit(1);
}
if (result.status !== 0) {
  console.error(`[SnoLab] npm install failed with exit code ${result.status ?? "unknown"}.`);
  process.exit(result.status || 1);
}
console.log("[SnoLab] Dependencies are ready.");
