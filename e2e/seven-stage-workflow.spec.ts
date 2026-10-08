import { expect, test } from "@playwright/test";

test.describe("Five-stage gated project workflow", () => {
  test("keeps materials as stage two and blocks later stages until requirements and calculation are complete", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /🇺🇸 EN/ }).click();
    await page.getByRole("button", { name: /Start New Project/ }).first().click();

    const stageBadge = page.locator("span").filter({ hasText: /^STAGE [1-5] \/ 5/ }).first();
    await expect(stageBadge).toContainText("STAGE 1 / 5");
    await expect(page.locator("#workflow-step-btn-5")).toBeVisible();

    await page.locator("#workflow-step-btn-2").click();
    await expect(stageBadge).toContainText("STAGE 2 / 5");
    await expect(page.locator("#unified-materials-engineering-database")).toBeVisible();

    await page.locator("#workflow-step-btn-3").click();
    await expect(stageBadge).toContainText("STAGE 3 / 5");

    await page.locator("#workflow-step-btn-4").click();
    await expect(stageBadge).toContainText("STAGE 3 / 5");
    await expect(page.locator("#workflow-step-btn-4")).toHaveAttribute("title", /CALCULATION_NOT_VALID/);
  });

  test("keeps the five-stage header usable on a phone viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("button", { name: /🇺🇸 EN/ }).click();
    await page.getByRole("button", { name: /Start New Project/ }).first().click();
    await expect(page.locator("#workflow-step-btn-1")).toBeVisible();
    await expect(page.locator("#workflow-step-btn-5")).toBeVisible();
    const header = page.locator("section[aria-label='Workspace workflow header']");
    const box = await header.boundingBox();
    expect(box?.width).toBeLessThanOrEqual(390);
  });
});
