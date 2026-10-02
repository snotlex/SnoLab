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
});
