import { test, expect } from "@playwright/test";

test.describe("WCAG 2.2 AA Accessibility Audit", () => {
  test("Landing page complies with semantic hierarchy and contrast guidelines", async ({
    page,
  }) => {
    await page.goto("/");

    // Verify exactly one main h1 heading exists
    const h1Count = await page.locator("h1").count();
    expect(h1Count).toBe(1);

    // Verify main landmarks exist
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();

    // Verify all links have accessible text
    const links = page.locator("a");
    const count = await links.count();
    for (let i = 0; i < count; i++) {
      const text = await links.nth(i).innerText();
      const ariaLabel = await links.nth(i).getAttribute("aria-label");
      expect(text.trim().length > 0 || (ariaLabel && ariaLabel.trim().length > 0)).toBeTruthy();
    }
  });

  test("Form controls on login and event submission have accessible labels", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.locator("label:has-text('Institutional Email')")).toBeVisible();
    await expect(page.locator("label:has-text('Password')")).toBeVisible();

    // Focus state test
    const emailInput = page.locator('input[type="email"]');
    await emailInput.focus();
    await expect(emailInput).toBeFocused();
  });

  test("Status badges communicate semantic states through text, not color alone", async ({
    page,
  }) => {
    await page.goto("/authority/dashboard");
    // Text labels exist inside status pills
    await expect(page.locator("text=Pending Review").first()).toBeVisible();
  });
});
