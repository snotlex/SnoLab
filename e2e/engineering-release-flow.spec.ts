import { expect, test } from "@playwright/test";

test.describe("engineering release governance flow", () => {
  test("navigates through preparation, QA/QC, assets and ticket gates", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /🇺🇸 EN/ }).click();
    await page.getByRole("button", { name: /Start New Project/ }).first().click();
    await expect(page.locator("#main-layout-root")).toBeVisible();
    await page.getByRole("button", { name: /Batch preparation/i }).click();
    await expect(page.getByTestId("batch-preparation-center")).toBeVisible();
    await page.getByRole("button", { name: /QA\/QC control/i }).click();
    await expect(page.getByTestId("quality-control-dashboard")).toBeVisible();
    await expect(page.getByTestId("quality-control-dashboard")).toContainText("NCR / CAPA");
    await page.getByRole("button", { name: /Samples & calibration/i }).click();
    await expect(page.getByTestId("quality-assets-dashboard")).toBeVisible();
    await page.getByRole("button", { name: /Batch ticket/i }).click();
    await expect(page.getByTestId("production-batch-ticket")).toBeVisible();
    await expect(page.getByTestId("production-batch-ticket")).toContainText("BLOCKED");
    await expect(page.getByTestId("production-batch-ticket")).toContainText("cannot be released");
  });

  test("opens and advances an NCR through containment, correction, verification and closure", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /🇺🇸 EN/ }).click();
    await page.getByRole("button", { name: /Start New Project/ }).first().click();
    await page.getByRole("button", { name: /QA\/QC control/i }).click();
    const qc = page.getByTestId("quality-control-dashboard");
    await qc.getByPlaceholder("NCR title").fill("E2E calibration deviation");
    await qc.getByPlaceholder("Description and containment").fill("Device calibration evidence requires review");
    await qc.getByRole("button", { name: "Open NCR" }).click();
    await expect(qc).toContainText("NCR-");
    for (const expected of ["containment", "corrective-action", "verification"]) {
      await qc.getByRole("button", { name: "Advance status" }).click();
      await expect(qc).toContainText(expected);
    }
    await qc.getByRole("button", { name: "Close after verification" }).click();
    await expect(qc).toContainText("closed");
  });

  test("keeps production approval blocked for a design engineer without release gates", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /🇺🇸 EN/ }).click();
    await page.getByRole("button", { name: /Start New Project/ }).first().click();
    await page.locator("#workflow-step-btn-3").click();
    const lifecycle = page.locator('section[aria-label="Mix lifecycle and approval"]');
    await expect(lifecycle).toBeVisible();
    await expect(lifecycle.getByRole("button", { name: "Approve mix" })).toBeDisabled();
  });

  test("exposes revision history and comparison as a governed workspace", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /🇺🇸 EN/ }).click();
    await page.getByRole("button", { name: /Start New Project/ }).first().click();
    await page.locator('[data-sidebar-item="versions"]').click();
    await expect(page.locator("#mix-versioning-dashboard")).toBeVisible();
    await expect(page.locator("#mix-versioning-dashboard")).toContainText("SAVED VERSIONS");
  });
});
