import { expect, test } from "@playwright/test";

test.describe("SnoLab UX and keyboard safeguards", () => {
  test("keeps document language and direction synchronized", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

    await page.getByRole("button", { name: /🇺🇸 EN/ }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.getByRole("button", { name: "Start New Project" }).first()).toBeVisible();
  });

  test("allows workflow navigation from the keyboard and exposes current step", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /🇺🇸 EN/ }).click();
    await page.getByRole("button", { name: "Start New Project" }).first().click();

    const stageOne = page.locator("#workflow-step-btn-1");
    await expect(stageOne).toHaveAttribute("aria-current", "step");

    const stageTwo = page.locator("#workflow-step-btn-2");
    await stageTwo.focus();
    await page.keyboard.press("Enter");
    await expect(stageTwo).toHaveAttribute("aria-current", "step");
    await expect(page.locator("#project-requirements-panel")).toBeVisible();
  });
});
