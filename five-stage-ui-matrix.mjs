import { chromium } from "playwright";

const scenarios = [
  { name: "baseline-1m3", strength: "25", slump: "8", volume: "1" },
  { name: "structural-2_5m3", strength: "35", slump: "12", volume: "2.5" },
  { name: "high-strength-0_5m3", strength: "50", slump: "4", volume: "0.5" },
  { name: "large-pour-10m3", strength: "30", slump: "8", volume: "10" },
];

const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const scenario of scenarios) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const timings = await page.evaluate(() => ({ navigationStart: performance.now() }));
    await page.goto("http://127.0.0.1:3330/", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: /🇺🇸 EN/ }).click();
    await page.getByRole("button", { name: /Start New Project/ }).first().click();
    await page.getByRole("button", { name: "Design calculator" }).click();
    await page.waitForSelector("#mixwizard-calculator-screen");
    const stage3Ms = await page.evaluate(() => performance.now());

    const volume = page.locator('input[type="number"]').first();
    await volume.fill(scenario.volume);
    await page.locator("#mix-fck28").fill(scenario.strength);
    await page.locator("#mix-slump").selectOption(scenario.slump);
    await page.getByRole("combobox", { name: "Select mixing water" }).selectOption("SYS-WAT-001");
    const accept = page.getByRole("button", { name: /Accept and apply proposal/ });
    if (await accept.count()) await accept.click();
    await page.waitForTimeout(900);

    const gateText = await page.locator("#stage3-validation-gate").innerText();
    const bodyText = await page.locator("body").innerText();
    const valid = bodyText.includes("VALID MIX") && bodyText.includes("Volumetric Compliance");
    const density = bodyText.match(/Fresh Concrete Density\s*([\d,]+)\s*kg\/m³/)?.[1] ?? null;
    const totalVolume = bodyText.match(/Total Absolute Volume\s*([\d.]+)\s*L/)?.[1] ?? null;
    const batchVolume = bodyText.match(/Total Batch \(([\d.]+) m³\)/)?.[1] ?? null;
    const volumeHeaderOk = batchVolume === scenario.volume;

    await page.locator("#workflow-step-btn-4").click();
    await page.waitForTimeout(1200);
    const stage4 = await page.locator('span').filter({ hasText: /^STAGE/ }).first().innerText();
    const costVisible = (await page.locator("body").innerText()).includes("Cost") || (await page.locator("body").innerText()).includes("cost");
    await page.locator("#workflow-step-btn-5").click();
    await page.waitForTimeout(1200);
    const stage5 = await page.locator('span').filter({ hasText: /^STAGE/ }).first().innerText();
    const reportsVisible = (await page.locator("body").innerText()).includes("Reports") || (await page.locator("body").innerText()).includes("report");

    results.push({ scenario: scenario.name, valid, density, totalVolume, batchVolume, volumeHeaderOk, stage3Ms: Math.round(stage3Ms), stage4, costVisible, stage5, reportsVisible, gateExcerpt: gateText.slice(0, 180) });
    await page.close();
  }
} finally { await browser.close(); }
console.log(JSON.stringify(results, null, 2));
if (results.some(r => !r.valid || !r.volumeHeaderOk || !r.costVisible || !r.reportsVisible || !r.stage4.includes("STAGE 4 / 5") || !r.stage5.includes("STAGE 5 / 5"))) process.exit(1);
