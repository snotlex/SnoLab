import { expect, test } from "@playwright/test";

test.describe("SnoLab performance safeguards", () => {
  test("keeps initial load and stage 3 transition within the reliability budget", async ({ page }) => {
    const navigationStart = Date.now();
    await page.goto("/");
    await expect(page.getByRole("button", { name: /انطلاق مشروع جديد|Start New Project/ }).first()).toBeVisible();
    const initialLoadMs = Date.now() - navigationStart;

    await page.getByRole("button", { name: /🇺🇸 EN/ }).click();
    await page.getByRole("button", { name: /Start New Project/ }).first().click();
    await expect(page.locator("#main-layout-root")).toBeVisible();
    const workspaceReadyMs = Date.now() - navigationStart;

    const stageStart = Date.now();
    await page.locator("#workflow-step-btn-3").click();
    await expect(page.locator("#stage3-sequential-page")).toBeVisible();
    const stage3ReadyMs = Date.now() - stageStart;

    const navigationTiming = await page.evaluate(() => {
      const entry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      return entry ? {
        domContentLoadedMs: Math.round(entry.domContentLoadedEventEnd - entry.startTime),
        loadEventMs: Math.round(entry.loadEventEnd - entry.startTime),
      } : null;
    });

    console.info(JSON.stringify({ initialLoadMs, workspaceReadyMs, stage3ReadyMs, navigationTiming }));

    // These are regression guardrails, not a synthetic benchmark. They leave room
    // for shared CI runners while catching a broken or indefinitely blocked flow.
    expect(initialLoadMs).toBeLessThan(15_000);
    expect(workspaceReadyMs).toBeLessThan(20_000);
    expect(stage3ReadyMs).toBeLessThan(10_000);
    expect(navigationTiming?.domContentLoadedMs ?? 0).toBeLessThan(15_000);
  });

  test("records advanced browser performance signals without blocking the workflow", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /انطلاق مشروع جديد|Start New Project/ }).first()).toBeVisible();
    await page.waitForTimeout(250);

    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      const paints = performance.getEntriesByType("paint");
      const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
      const longTasks = performance.getEntriesByType("longtask") as PerformanceEntry[];
      const layoutShifts = performance.getEntriesByType("layout-shift") as PerformanceEntry[];
      const largestContentfulPaint = performance.getEntriesByType("largest-contentful-paint").at(-1);
      const scripts = resources.filter(resource => resource.initiatorType === "script");

      return {
        fcpMs: paints.find(entry => entry.name === "first-contentful-paint")?.startTime ?? null,
        lcpMs: largestContentfulPaint?.startTime ?? null,
        domContentLoadedMs: navigation?.domContentLoadedEventEnd ?? null,
        initialScriptTransferBytes: scripts.reduce((total, resource) => total + (resource.transferSize || 0), 0),
        longTaskCount: longTasks.length,
        longestTaskMs: longTasks.reduce((max, task) => Math.max(max, task.duration), 0),
        cumulativeLayoutShift: layoutShifts.reduce((total, entry) => total + Number((entry as PerformanceEntry & { value?: number }).value || 0), 0),
        heapUsedBytes: (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize ?? null,
      };
    });

    console.info(JSON.stringify({ advancedPerformance: metrics }));
    expect(metrics.domContentLoadedMs ?? 0).toBeLessThan(15_000);
    expect(metrics.fcpMs ?? 0).toBeLessThan(10_000);
    expect(metrics.lcpMs ?? metrics.fcpMs ?? 0).toBeLessThan(12_000);
    expect(metrics.longestTaskMs).toBeLessThan(3_000);
    expect(metrics.cumulativeLayoutShift).toBeLessThan(0.35);
    if (metrics.heapUsedBytes !== null) expect(metrics.heapUsedBytes).toBeLessThan(256 * 1024 * 1024);
  });
});
