import { test, expect } from "@playwright/test";

test.describe("Cross-Device Responsive Layout Verification", () => {
  test("Mobile viewport renders drawer button and allows opening navigation", async ({
    page,
  }) => {
    // Set mobile viewport (iPhone 13 dimensions: 390x844)
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto("/club/dashboard");

    // Desktop sidebar should be hidden
    const desktopSidebar = page.locator("aside.hidden.md\\:flex");
    await expect(desktopSidebar).toBeHidden();

    // Mobile header with hamburger menu button should be visible
    const hamburgerBtn = page.locator('button[aria-label="Open navigation menu"]');
    await expect(hamburgerBtn).toBeVisible();

    // Open mobile menu
    await hamburgerBtn.click();
    await expect(page.locator("text=THEKEDAR // MENU")).toBeVisible();
    await expect(page.locator("nav >> text=My Events")).toBeVisible();
    await expect(page.locator("nav >> text=Create Event")).toBeVisible();

    // Close mobile menu
    const closeBtn = page.locator('button[aria-label="Close menu"]');
    await closeBtn.click();
    await expect(page.locator("text=THEKEDAR // MENU")).toBeHidden();
  });

  test("Data tables have horizontal scroll wrapper on mobile screens", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/authority/dashboard");

    const scrollContainer = page.locator(".overflow-x-auto").first();
    await expect(scrollContainer).toBeVisible();
  });
});
