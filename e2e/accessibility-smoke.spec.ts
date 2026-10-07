import { expect, test } from "@playwright/test";

test.describe("SnoLab accessibility smoke", () => {
  test("sets the document language and direction correctly for English", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /🇺🇸 EN/ }).click();
    await expect.poll(() => page.locator("html").getAttribute("lang")).toBe("en");
    await expect.poll(() => page.locator("html").getAttribute("dir")).toBe("ltr");
  });

  test("keeps interactive controls semantically named and form fields associated with labels", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /🇺🇸 EN/ }).click();
    await page.getByRole("button", { name: /Start New Project/ }).first().click();

    const unnamedInteractive = await page.locator("button:not([aria-label]):not([aria-labelledby]),a[href]:not([aria-label]):not([aria-labelledby])").evaluateAll((nodes) =>
      nodes.filter((node) => !(node.textContent || "").trim() && !node.getAttribute("title")).length
    );
    expect(unnamedInteractive).toBe(0);

    const unlabeledFields = await page.locator("input,select,textarea").evaluateAll((nodes) =>
      nodes.filter((node) => {
        const id = node.getAttribute("id");
        const labelledBy = node.getAttribute("aria-labelledby");
        const ariaLabel = node.getAttribute("aria-label");
        const hasLabel = id ? Boolean(document.querySelector(`label[for="${CSS.escape(id)}"]`)) : false;
        return !labelledBy && !ariaLabel && !hasLabel;
      }).length
    );
    expect(unlabeledFields).toBe(0);
  });

  test("requires modal semantics whenever a dialog is rendered", async ({ page }) => {
    await page.goto("/");
    const dialogs = page.locator('[role="dialog"]');
    const count = await dialogs.count();
    for (let index = 0; index < count; index += 1) {
      const dialog = dialogs.nth(index);
      await expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(await dialog.getAttribute("aria-labelledby")).toBeTruthy();
    }
  });
});
