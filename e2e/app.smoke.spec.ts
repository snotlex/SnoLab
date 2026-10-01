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

  test("simulates concrete type inputs and validates five-stage navigation guards", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /🇺🇸 EN/ }).click();
    await page.getByRole("button", { name: /Start New Project/ }).first().click();

    const stageBadge = page.locator("span").filter({ hasText: /^STAGE [1-5] \/ 5/ }).first();
    const nextStage = page.getByRole("button", { name: "Next Stage" });
    const previousStage = page.getByRole("button", { name: "Previous Stage" });

    await expect(stageBadge).toContainText("STAGE 1 / 5");
    await expect(previousStage).toBeDisabled();

    // Go directly to the mix-proportioning stage where concrete type and
    // strength are entered, then exercise representative concrete families.
    await page.locator("#workflow-step-btn-3").click();
    await expect(stageBadge).toContainText("STAGE 3 / 5");

    const concreteTypeSelect = page.locator("#step1-project-requirements select").first();
    const strengthInput = page.locator("#step1-project-requirements input[type=number]").first();
    const cases = [
      { type: "NSC", strength: "25" },
      { type: "HSC", strength: "50" },
      { type: "SCC", strength: "35" },
      { type: "LWC", strength: "25" },
      { type: "UHPC", strength: "120" },
    ];

    for (const concreteCase of cases) {
      await concreteTypeSelect.selectOption(concreteCase.type);
      await strengthInput.fill(concreteCase.strength);
      await expect(concreteTypeSelect).toHaveValue(concreteCase.type);
      await expect(strengthInput).toHaveValue(concreteCase.strength);
    }

    // Return to the default supported route before checking the workflow gate,
    // so specialised validation does not affect this navigation assertion.
    await concreteTypeSelect.selectOption("NSC");
    await strengthInput.fill("25");

    // Stage 4 is reachable, while the engineering verification gate correctly
    // prevents stage 5 when required materials are not yet approved.
    await nextStage.click();
    await expect(stageBadge).toContainText("STAGE 4 / 5");
    await expect(page.locator("body")).toContainText("Engineering Verification Gate");

    // Attempting to advance from a gated result stage must return the user to
    // the editable calculator rather than leaving the UI in a broken state.
    await nextStage.click();
    await expect(stageBadge).toContainText("STAGE 3 / 5");
    await expect(concreteTypeSelect).toHaveValue("NSC");

    // Backward navigation remains available and reaches the project setup.
    await previousStage.click();
    await expect(stageBadge).toContainText("STAGE 2 / 5");
    await previousStage.click();
    await expect(stageBadge).toContainText("STAGE 1 / 5");
    await expect(previousStage).toBeDisabled();
  });

  test("saves and resumes an unrun laboratory draft without seeded measurements", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /🇺🇸 EN/ }).click();
    await page.getByRole("button", { name: /Start New Project/ }).first().click();
    await page.locator("#main-layout-root").waitFor();

    await page.getByRole("button", { name: /Laboratory Performance Validation/ }).click();
    await expect(page.locator("#materials-lab-screen")).toBeVisible();
    await page.getByRole("button", { name: "New test" }).click();

    await page.getByRole("button", { name: "Continue" }).click();
    const sampleId = page.locator("label").filter({ hasText: "Sample ID" }).locator("xpath=..").locator("input");
    await sampleId.fill("E2E-DRAFT-MISSING-DATE");
    await page.getByPlaceholder("Site, supplier, or batch").fill("E2E supplier");
    await page.locator("label").filter({ hasText: "Operator / engineer" }).locator("xpath=..").locator("input").fill("E2E operator");
    await expect(page.locator("#materials-lab-screen input[type=date]").first()).toHaveValue("");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.locator("#materials-lab-screen")).toContainText("Enter a valid sample date no later than the test date or today.");
    await page.getByRole("button", { name: "Save draft" }).click();

    const latestTests = page.locator('section[aria-label="Latest tests"]');
    await expect(latestTests).toContainText("Draft");
    await latestTests.locator("button").first().click();
    await expect(page.getByRole("button", { name: "Save draft" })).toBeVisible();
    await expect(page.locator("label").filter({ hasText: "Sample ID" }).locator("xpath=..").locator("input")).toHaveValue("E2E-DRAFT-MISSING-DATE");
    await expect(page.locator("#materials-lab-screen input[type=date]").first()).toHaveValue("");
    await expect(page.getByRole("button", { name: "Continue" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Run test" })).toHaveCount(0);
  });
});
