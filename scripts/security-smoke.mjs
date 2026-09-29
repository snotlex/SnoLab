import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import process from "node:process";

const root = process.cwd();
const tsx = `${root}/node_modules/.bin/tsx`;
const token = "security-smoke-token";
const port = 3310;

function startServer(extraEnv = {}) {
  const child = spawn(tsx, ["server.ts"], {
    cwd: root,
    env: {
      ...process.env,
      NODE_ENV: "development",
      DISABLE_HMR: "true",
      PORT: String(port),
      ADMIN_API_TOKEN: token,
      PUBLIC_APP_URL: `http://localhost:${port}`,
      ...extraEnv,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", data => process.stdout.write(`[server] ${data}`));
  child.stderr.on("data", data => process.stderr.write(`[server:err] ${data}`));
  return child;
}

async function waitForHealth(baseUrl, child) {
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

async function request(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { response, body };
}

const child = startServer();
const baseUrl = `http://127.0.0.1:${port}`;
try {
  await waitForHealth(baseUrl, child);

  const health = await request(baseUrl, "/api/health");
  assert.equal(health.response.status, 200);
  assert.equal(health.body.status, "ok");
  assert.equal(health.response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(health.response.headers.get("x-frame-options"), "DENY");

  const noToken = await request(baseUrl, "/api/admin/email-logs");
  assert.equal(noToken.response.status, 401);

  const wrongToken = await request(baseUrl, "/api/admin/email-logs", {
    headers: { Authorization: "Bearer wrong-token" },
  });
  assert.equal(wrongToken.response.status, 401);

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  const authorized = await request(baseUrl, "/api/admin/email-logs", { headers: authHeaders });
  assert.equal(authorized.response.status, 200);
  assert.equal(authorized.body.success, true);

  const invalidEmail = await request(baseUrl, "/api/admin/send-email", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ to: "not-an-email", subject: "Test", html: "<p>Test</p>" }),
  });
  assert.equal(invalidEmail.response.status, 400);

  const invalidAttempts = await request(baseUrl, "/api/admin/send-email", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ to: "test@example.com", subject: "Test", html: "<p>Test</p>", maxAttempts: 99 }),
  });
  assert.equal(invalidAttempts.response.status, 400);

  const safeEmail = await request(baseUrl, "/api/admin/send-email", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      to: "test@example.com",
      subject: "Security smoke test",
      html: '<script>alert(1)</script><p data-test="safe">Test</p>',
      maxAttempts: 1,
    }),
  });
  assert.equal(safeEmail.response.status, 200);

  let rateLimited = false;
  for (let index = 0; index < 25; index += 1) {
    const result = await request(baseUrl, "/api/admin/email-logs", { headers: authHeaders });
    if (result.response.status === 429) {
      rateLimited = true;
      assert.ok(Number(result.response.headers.get("retry-after")) > 0);
      break;
    }
  }
  assert.equal(rateLimited, true, "Admin rate limit was not triggered");

  console.log("Security smoke tests passed.");
} finally {
  child.kill("SIGTERM");
  await new Promise(resolve => setTimeout(resolve, 250));
  if (child.exitCode === null) child.kill("SIGKILL");
}
