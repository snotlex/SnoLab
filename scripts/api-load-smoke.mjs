import assert from "node:assert/strict";
import { spawn } from "node:child_process";

const root = process.cwd();
const tsx = `${root}/node_modules/.bin/tsx`;
const port = Number(process.env.LOAD_SMOKE_PORT || 3320);
const durationMs = Number(process.env.LOAD_SMOKE_DURATION_MS || 3_000);
const concurrency = Number(process.env.LOAD_SMOKE_CONCURRENCY || 8);
const token = "load-smoke-token";
const baseUrl = `http://127.0.0.1:${port}`;

assert.ok(Number.isInteger(port) && port > 0 && port < 65536);
assert.ok(Number.isInteger(concurrency) && concurrency > 0 && concurrency <= 50);
assert.ok(Number.isInteger(durationMs) && durationMs >= 1_000 && durationMs <= 60_000);

const child = spawn(tsx, ["server.ts"], {
  cwd: root,
  env: {
    ...process.env,
    NODE_ENV: "development",
    DISABLE_HMR: "true",
    PORT: String(port),
    ADMIN_API_TOKEN: token,
    PUBLIC_APP_URL: `http://localhost:${port}`,
  },
  stdio: ["ignore", "pipe", "pipe"],
});
child.stdout.on("data", data => process.stdout.write(`[server] ${data}`));
child.stderr.on("data", data => process.stderr.write(`[server:err] ${data}`));

async function waitForHealth() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {
      // Server is still starting.
    }
    if (child.exitCode !== null) throw new Error(`Server exited early with code ${child.exitCode}`);
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error("Timed out waiting for server health endpoint");
}

const samples = [];
let total = 0;
let successes = 0;
let rateLimited = 0;
let serverErrors = 0;
let networkErrors = 0;

async function oneRequest() {
  const isAdmin = total % 5 === 0;
  const started = performance.now();
  try {
    const response = await fetch(`${baseUrl}${isAdmin ? "/api/admin/email-logs" : "/api/health"}`, {
      headers: isAdmin ? { Authorization: `Bearer ${token}` } : undefined,
    });
    const elapsed = performance.now() - started;
    samples.push(elapsed);
    total += 1;
    if (response.status === 200) successes += 1;
    else if (response.status === 429) rateLimited += 1;
    else if (response.status >= 500) serverErrors += 1;
  } catch {
    total += 1;
    networkErrors += 1;
  }
}

try {
  await waitForHealth();
  const deadline = Date.now() + durationMs;
  const workers = Array.from({ length: concurrency }, async () => {
    while (Date.now() < deadline) await oneRequest();
  });
  await Promise.all(workers);

  samples.sort((a, b) => a - b);
  const p95 = samples[Math.min(samples.length - 1, Math.floor(samples.length * 0.95))] || 0;
  const successRate = total ? ((successes + rateLimited) / total) * 100 : 0;
  console.log(JSON.stringify({ total, successes, rateLimited, serverErrors, networkErrors, successRate: `${successRate.toFixed(2)}%`, p95Ms: Number(p95.toFixed(2)) }, null, 2));

  assert.ok(total > 0, "Load test made no requests");
  assert.equal(serverErrors, 0, "Load test encountered HTTP 5xx responses");
  assert.equal(networkErrors, 0, "Load test encountered network errors");
  assert.ok(successes > 0, "Load test did not receive any successful responses");
  console.log("API load smoke test passed.");
} finally {
  child.kill("SIGTERM");
  await new Promise(resolve => setTimeout(resolve, 250));
  if (child.exitCode === null) child.kill("SIGKILL");
}
