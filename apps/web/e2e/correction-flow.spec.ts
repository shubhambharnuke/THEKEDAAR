import { test, expect } from "@playwright/test";

test.describe("Rejection & Resubmission Correction Cycle Flow", () => {
  test("Event detail view renders department breakdown and correction action", async ({
    page,
  }) => {
    // Visit event detail page with mock ID
    await page.goto("/club/events/1");
    await expect(page.locator("h1")).toContainText("Annual Technology Symposium");

    // Status breakdown shows multi-department items
    await expect(page.locator("text=Needs Correction")).toBeVisible();
    await expect(page.locator("text=Office of Student Welfare")).toBeVisible();

    // Verify presence of correction request reason
    await expect(
      page.locator("text=Please adjust event end time to 17:00 due to campus security curfew.")
    ).toBeVisible();

    // Verify correction action button
    const correctionBtn = page.locator('button:has-text("Resubmit with Corrections")');
    await expect(correctionBtn).toBeVisible();
    await correctionBtn.click();

    // Correction modal should open
    await expect(
      page.locator("text=Resubmit Correction to Office of Student Welfare")
    ).toBeVisible();
    await expect(
      page.locator('textarea[placeholder*="Explain how you addressed the authority feedback"]')
    ).toBeVisible();

    // Fill correction response
    await page.fill(
      'textarea[placeholder*="Explain how you addressed the authority feedback"]',
      "Adjusted event end time to 16:30 PM to comply with campus curfew."
    );

    // Verify submit button is clickable
    const submitResubmit = page.locator('button:has-text("Submit Resubmission")');
    await expect(submitResubmit).toBeVisible();
  });
});
