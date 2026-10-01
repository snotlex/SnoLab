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
  test("supports accessible sidebar navigation, collapse, and mobile drawer", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Start New Project|انطلاق مشروع جديد/ }).first().click();
    const sidebar = page.getByTestId("sidebar");
    await expect(sidebar).toBeVisible();
    await expect(sidebar.getByRole("navigation")).toHaveAttribute("aria-label", /Primary navigation|التنقل الرئيسي/);

    await page.setViewportSize({ width: 1440, height: 900 });
    const collapse = sidebar.getByRole("button", { name: /Collapse sidebar|طي الشريط الجانبي/ });
    await collapse.click();
    await expect(sidebar.getByRole("button", { name: /Expand sidebar|توسيع الشريط الجانبي/ })).toBeVisible();
    await expect(sidebar.getByTestId("sidebar-navigation")).toBeVisible();

    await page.setViewportSize({ width: 390, height: 844 });
    const openMobile = page.getByTestId("sidebar-mobile-open");
    await expect(openMobile).toBeVisible();
    await openMobile.click();
    await expect(sidebar).toBeVisible();
    await expect(page.getByRole("button", { name: /Close sidebar|إغلاق الشريط الجانبي/ }).first()).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(openMobile).toBeFocused();
  });

  test("simulates every concrete type and validates five-stage navigation guards", async ({ page }) => {
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
      ["NSC", "25"], ["RC", "30"], ["PUMPED", "30"], ["MASS", "30"], ["MARINE", "35"],
      ["PRECAST", "45"], ["PRESTRESSED", "55"], ["HSC", "60"], ["HPC", "55"], ["SCC", "40"],
      ["FRC", "35"], ["LWC", "25"], ["HWC", "40"], ["RCC", "35"], ["SHOTCRETE", "35"],
      ["GPC", "40"], ["SHC", "35"], ["RAC", "30"], ["PERVIOUS", "20"], ["UHPC", "120"], ["BFUP", "120"]
    ];

    for (const concreteCase of cases) {
      await concreteTypeSelect.selectOption(concreteCase[0]);
      await strengthInput.fill(concreteCase[1]);
      await expect(concreteTypeSelect).toHaveValue(concreteCase[0]);
      await expect(strengthInput).toHaveValue(concreteCase[1]);
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

  test("keeps missing strength explicit and blocks mix approval until validation passes", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /🇺🇸 EN/ }).click();
    await page.getByRole("button", { name: /Start New Project/ }).first().click();
    await page.locator("#workflow-step-btn-3").click();
    const strengthInput = page.locator("#step1-project-requirements input[type=number]").first();
    await strengthInput.fill("");
    await expect(page.locator("#step1-project-requirements")).toContainText("Target strength is missing");
    await expect(page.locator("#phase3-input-wizard")).toBeVisible();
    await expect(page.locator('section[aria-label="Mix lifecycle and approval"]')).toHaveCount(0);
    await expect(page.locator('section[aria-label="Staged calculation and auditable values"]')).toHaveCount(0);
    await strengthInput.fill("25");
    await expect(strengthInput).toHaveValue("25");
  });

  test("isolates stage 3 sections and preserves the selected concrete type", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /🇺🇸 EN/ }).click();
    await page.getByRole("button", { name: /Start New Project/ }).first().click();
    await page.locator("#workflow-step-btn-3").click();
    const sectionNav = page.locator('nav[aria-label="Stage 3 sections"]');
    await sectionNav.getByRole("button", { name: "Materials" }).click();
    await expect(page.locator("#step3-materials-selection")).toBeVisible();
    await expect(page.locator("#step1-project-requirements")).toBeHidden();
    await sectionNav.getByRole("button", { name: "Design requirements" }).click();
    await expect(page.locator("#step1-project-requirements")).toBeVisible();
    await page.locator("#step1-concrete-type select").selectOption("HSC");
    await sectionNav.getByRole("button", { name: "Concrete type & options" }).click();
    await expect(page.locator("#step1-concrete-type")).toBeVisible();
    await expect(page.locator("#step1-concrete-type select")).toHaveValue("HSC");
  });

  test("keeps the stage 3 workspace usable across desktop, tablet, and phone widths", async ({ page }) => {
    for (const width of [1920, 1440, 1024, 768, 390]) {
      await page.setViewportSize({ width, height: width < 800 ? 844 : 900 });
      await page.goto("/");
      await page.getByRole("button", { name: /🇺🇸 EN/ }).click();
      await page.getByRole("button", { name: /Start New Project/ }).first().click();
      await page.locator("#workflow-step-btn-3").click();
      await expect(page.locator("#phase3-input-wizard")).toBeVisible();
      const navBox = await page.locator('nav[aria-label="Stage 3 sections"]').boundingBox();
      expect(navBox?.width).toBeLessThanOrEqual(width);
      await expect(page.getByRole("button", { name: "Design requirements" })).toBeVisible();
    }
  });

  test("creates a multi-test laboratory request and adds an independent replicate", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /🇺🇸 EN/ }).click();
    await page.getByRole("button", { name: /Start New Project/ }).first().click();
    await page.getByRole("button", { name: /Laboratory Performance Validation/ }).click();
    await page.locator("#materials-lab-screen").getByRole("button", { name: "Multi-test request center" }).click();
    const panel = page.locator("section").filter({ hasText: "Laboratory requests & sessions" }).last();
    await expect(panel).toBeVisible();
    await panel.getByRole("button", { name: "New multi-test request" }).click();
    await panel.getByLabel("Request number").fill("E2E-LAB-001");
    await panel.getByLabel("Sample number").fill("E2E-S-001");
    await panel.getByLabel("Sample code").fill("E2E-S-001-A");
    const testChecks = panel.locator('input[type="checkbox"]');
    await testChecks.nth(0).check();
    await testChecks.nth(1).check();
    await panel.getByRole("button", { name: "Create request" }).click();
    await expect(panel).toContainText("E2E-LAB-001");
    await expect(panel).toContainText("2 tests");
    await panel.getByRole("button", { name: "Add replicate" }).first().click();
    await expect(panel).toContainText("1 replicates");
  });
});
