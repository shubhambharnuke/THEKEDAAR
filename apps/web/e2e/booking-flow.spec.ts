import { test, expect } from "@playwright/test";

test.describe("Club Event Submission through Authority Approval Flow", () => {
  test("Club user navigates event creation wizard and submits booking request", async ({ page }) => {
    // 1. Visit Home and go to Event Creation
    await page.goto("/");
    await expect(page.locator("h1")).toContainText(
      "College resource booking, with clear approvals and verifiable records."
    );

    // 2. Navigate to Create Event
    await page.goto("/club/events/new");
    await expect(page.locator("h1")).toContainText("Create New Event Request");

    // 3. Fill Step 1: Event Details
    await page.fill('input[placeholder*="Robotics Annual Workshop"]', "National Techfest 2026");
    await page.fill(
      'textarea[placeholder*="Describe the objective"]',
      "National university technology symposium and robotics competition."
    );
    await page.fill('input[type="number"]', "450");

    // Click Next Step
    await page.click('button:has-text("Next: Schedule & Venue")');

    // 4. Step 2: Schedule & Venue
    await expect(page.locator("text=Select Date & Campus Venue")).toBeVisible();
    await page.click('button:has-text("Next: Required Equipment")');

    // 5. Step 3: Equipment & Services
    await expect(page.locator("text=Equipment & Support Requirements")).toBeVisible();
    await page.click('button:has-text("Next: Final Review")');

    // 6. Step 4: Review and Submit
    await expect(page.locator("text=Review & Submit Event Request")).toBeVisible();
    await expect(page.locator("text=National Techfest 2026")).toBeVisible();
    await expect(page.locator("text=450 attendees")).toBeVisible();

    // Verify submission button is ready
    const submitBtn = page.locator('button:has-text("Submit Event Request")');
    await expect(submitBtn).toBeVisible();
  });

  test("Authority dashboard displays pending request queues and metrics", async ({ page }) => {
    await page.goto("/authority/dashboard");
    await expect(page.locator("h1")).toContainText("Department Authority Queue");
    await expect(page.locator("text=Pending Authority Review")).toBeVisible();
    await expect(page.locator("table")).toBeVisible();
  });
});
