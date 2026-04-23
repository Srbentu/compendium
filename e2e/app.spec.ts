import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should show login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1")).toContainText(/sign in|login/i);
  });

  test("should show signup page", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.locator("h1")).toContainText(/sign up|register|create account/i);
  });
});

test.describe("Dashboard", () => {
  test.use({ storageState: "e2e/.auth/user.json" });

  test("should show dashboard after login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("text=My Topics")).toBeVisible();
  });

  test("should create a new topic", async ({ page }) => {
    await page.goto("/dashboard/topics/new");
    await page.fill('[name="title"]', "JavaScript");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=JavaScript")).toBeVisible();
  });
});

test.describe("Public pages", () => {
  test("should show topic page with SEO metadata", async ({ page }) => {
    await page.goto("/topic/javascript");
    await expect(page.locator("title")).toContainText(/javascript/i);
  });
});