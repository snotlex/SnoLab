import { expect, test } from "@playwright/test";

test.describe("Seven-stage gated project workflow", () => {
  test("walks through setup and requirements, persists edits, and blocks incomplete calculation", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /🇺🇸 EN/ }).click();
    await page.getByRole("button", { name: /Start New Project/ }).first().click();

    const stageBadge = page.locator("span").filter({ hasText: /^STAGE [1-7] \/ 7/ }).first();
    await expect(stageBadge).toContainText("STAGE 1 / 7");
    await expect(page.locator("#workflow-step-btn-7")).toBeVisible();

    await page.locator("#workflow-step-btn-2").click();
    await expect(stageBadge).toContainText("STAGE 2 / 7");
    const requirements = page.locator("#project-requirements-panel");
    await expect(requirements).toBeVisible();
    await expect(requirements).toContainText("Project Requirements");

    const projectName = requirements.getByLabel("Project name");
    await projectName.fill("E2E Gated Project");
    await expect(projectName).toHaveValue("E2E Gated Project");

    const strength = requirements.getByLabel("28-day target strength (MPa)");
    const continueButton = requirements.getByRole("button", { name: "Continue to materials verification" });
    await strength.fill("");
    await expect(requirements).toContainText("Complete the highlighted fields before continuing");
    await expect(continueButton).toBeDisabled();
    await strength.fill("35");
    await expect(continueButton).toBeEnabled();

    await continueButton.click();
    await expect(stageBadge).toContainText("STAGE 3 / 7");

    // Materials are verified for a new project, so Mix Calculation is
    // reachable; Trial Mix remains locked until a valid calculation exists.
    await page.locator("#workflow-step-btn-4").click();
    await expect(stageBadge).toContainText("STAGE 4 / 7");
    await page.locator("#workflow-step-btn-5").click();
    await expect(stageBadge).toContainText("STAGE 4 / 7");
    await expect(page.locator("#workflow-step-btn-5")).toHaveAttribute("title", /CALCULATION_NOT_VALID/);

    await page.locator("#workflow-step-btn-2").click();
    await expect(stageBadge).toContainText("STAGE 2 / 7");
    await expect(projectName).toHaveValue("E2E Gated Project");
  });

  test("keeps the seven-stage header usable on a phone viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("button", { name: /🇺🇸 EN/ }).click();
    await page.getByRole("button", { name: /Start New Project/ }).first().click();
    await expect(page.locator("#workflow-step-btn-1")).toBeVisible();
    await expect(page.locator("#workflow-step-btn-7")).toBeVisible();
    const header = page.locator("section[aria-label='Workspace workflow header']");
    const box = await header.boundingBox();
    expect(box?.width).toBeLessThanOrEqual(390);
  });
});
