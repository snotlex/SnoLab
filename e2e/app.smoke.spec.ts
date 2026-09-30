import { expect, test } from "@playwright/test";

test.describe("SnoLab application smoke flow", () => {
  test("opens the landing page, switches language, and starts a project", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/SNO Engineering AI/);
    await expect(page.locator("body")).toContainText("منصة الذكاء الاصطناعي للهندسة والخرسانة");
    await expect(page.getByRole("button", { name: /انطلاق مشروع جديد/ }).first()).toBeVisible();

    await page.getByRole("button", { name: /🇺🇸 EN/ }).click();
    await expect(page.locator("body")).toContainText("AI-Powered Concrete Mix Design Platform");

    await page.getByRole("button", { name: /Start New Project/ }).first().click();
    await expect(page.locator("#main-layout-root")).toBeVisible();
    await expect(page.locator("body")).toContainText("Project Setup");
    await expect(page.locator("body")).toContainText("STAGE 1 / 5");
  });

  test("keeps the landing page usable on a mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    await expect(page.locator("body")).toContainText("منصة الذكاء الاصطناعي للهندسة والخرسانة");
    await expect(page.getByRole("button", { name: /انطلاق مشروع جديد/ }).first()).toBeVisible();
  });
});
