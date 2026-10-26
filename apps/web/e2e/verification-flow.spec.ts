import { test, expect } from "@playwright/test";

test.describe("Document Verification & Multi-Check Cryptographic Audit", () => {
  test("Verification portal renders and allows switching between file and hash lookup", async ({
    page,
  }) => {
    await page.goto("/verify");
    await expect(page.locator("h1")).toContainText("Verify Institutional Permission Letter");

    // Default tab is Upload PDF
    await expect(page.locator("text=Drag and drop official permission letter")).toBeVisible();

    // Switch to Identifier / Hash Lookup tab
    await page.click('button:has-text("Letter ID or Hash Lookup")');
    await expect(
      page.locator("text=Letter Identifier or Document SHA-256 Hash")
    ).toBeVisible();

    // Switch back to File tab
    await page.click('button:has-text("Upload PDF Letter")');
    await expect(page.locator("text=Drag and drop official permission letter")).toBeVisible();
  });

  test("Submitting empty form triggers error validation", async ({ page }) => {
    await page.goto("/verify");

    // Click submit without file
    await page.click('button:has-text("Verify Document")');
    await expect(
      page.locator("text=Please select or drop a PDF permission letter to verify.")
    ).toBeVisible();

    // Switch to identifier tab and submit empty
    await page.click('button:has-text("Letter ID or Hash Lookup")');
    await page.click('button:has-text("Verify Document")');
    await expect(
      page.locator("text=Please enter a valid Letter Identifier or SHA-256 Document Hash.")
    ).toBeVisible();
  });

  test("Entering unknown identifier displays verification failure warning", async ({ page }) => {
    await page.goto("/verify");
    await page.click('button:has-text("Letter ID or Hash Lookup")');

    await page.fill('input[name="identifier"]', "NON-EXISTENT-LETTER-999");
    await page.click('button:has-text("Verify Document")');

    // Should render Verification Outcome banner indicating failure
    await expect(page.locator("text=Verification Outcome")).toBeVisible();
    await expect(page.locator("text=Verification Failed")).toBeVisible();
  });
});
