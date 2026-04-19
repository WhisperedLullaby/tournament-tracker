import { test, expect } from "../fixtures";

test.describe("Tournament browser", () => {
  test("redirects root to /tournaments", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/tournaments/);
  });

  test("shows tournament list page", async ({ page }) => {
    await page.goto("/tournaments");
    await expect(page.getByRole("navigation")).toBeVisible();
  });

  test("shows Sign In button when logged out", async ({ page }) => {
    await page.goto("/tournaments");
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("shows status filter tabs", async ({ page }) => {
    await page.goto("/tournaments");
    await expect(page.getByRole("link", { name: "Upcoming", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Active", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Completed", exact: true })).toBeVisible();
  });

  test("status filter tabs are navigable", async ({ page }) => {
    await page.goto("/tournaments");
    await page.getByRole("link", { name: "Upcoming", exact: true }).click();
    await expect(page).toHaveURL(/status=upcoming/);
    await page.getByRole("link", { name: "Active", exact: true }).click();
    await expect(page).toHaveURL(/status=active/);
    await page.getByRole("link", { name: "Completed", exact: true }).click();
    await expect(page).toHaveURL(/status=completed/);
  });
});

test.describe("Tournament detail page", () => {
  test("loads tournament landing page", async ({ page, tournamentSlug }) => {
    test.skip(!tournamentSlug, "No test tournament available");
    await page.goto(`/tournaments/${tournamentSlug}`);
    await expect(page.getByRole("navigation")).toBeVisible();
    await expect(page.getByText(/not found/i)).not.toBeVisible();
  });

  test("shows schedule tab", async ({ page, tournamentSlug }) => {
    test.skip(!tournamentSlug, "No test tournament available");
    await page.goto(`/tournaments/${tournamentSlug}/schedule`);
    await expect(page.getByText(/schedule/i).first()).toBeVisible();
  });

  test("shows standings tab", async ({ page, tournamentSlug }) => {
    test.skip(!tournamentSlug, "No test tournament available");
    await page.goto(`/tournaments/${tournamentSlug}/standings`);
    await expect(page.getByText(/standings/i).first()).toBeVisible();
  });

  test("shows bracket tab", async ({ page, tournamentSlug }) => {
    test.skip(!tournamentSlug, "No test tournament available");
    await page.goto(`/tournaments/${tournamentSlug}/bracket`);
    await expect(page.getByText(/bracket/i).first()).toBeVisible();
  });

  test("register page loads without redirecting", async ({ page, tournamentSlug }) => {
    test.skip(!tournamentSlug, "No test tournament available");
    await page.goto(`/tournaments/${tournamentSlug}/register`);
    // Should stay on register page or redirect to auth — not a 404
    await expect(page.getByText(/not found/i)).not.toBeVisible();
    await expect(page.getByRole("navigation")).toBeVisible();
  });

  test("scorekeeper page loads for unauthenticated users", async ({ page, tournamentSlug }) => {
    test.skip(!tournamentSlug, "No test tournament available");
    await page.goto(`/tournaments/${tournamentSlug}/scorekeeper`);
    // Scorekeeper is client-side protected — page loads but shows empty state or redirects
    await expect(page.getByText(/not found/i)).not.toBeVisible();
  });
});

test.describe("Tournament detail display", () => {
  test("shows correct tournament date", async ({ page, tournament }) => {
    test.skip(!tournament, "No test tournament available");
    await page.goto(`/tournaments/${tournament!.slug}`);
    // Date stored as UTC noon, displayed with timeZone: "UTC" — expect June 15, 2030
    await expect(page.getByText(/June 15, 2030/)).toBeVisible();
  });

  test("shows correct start and end time", async ({ page, tournament }) => {
    test.skip(!tournament, "No test tournament available");
    await page.goto(`/tournaments/${tournament!.slug}`);
    await expect(page.getByText(/10:00 AM/)).toBeVisible();
    await expect(page.getByText(/3:00 PM/)).toBeVisible();
  });

  test("shows correct registration open date", async ({ page, tournament }) => {
    test.skip(!tournament, "No test tournament available");
    await page.goto(`/tournaments/${tournament!.slug}`);
    await expect(page.getByText(/May 1, 2030/)).toBeVisible();
  });

  test("shows correct registration deadline", async ({ page, tournament }) => {
    test.skip(!tournament, "No test tournament available");
    await page.goto(`/tournaments/${tournament!.slug}`);
    await expect(page.getByText(/June 14, 2030/)).toBeVisible();
  });

  test("shows correct location", async ({ page, tournament }) => {
    test.skip(!tournament, "No test tournament available");
    await page.goto(`/tournaments/${tournament!.slug}`);
    await expect(page.getByText(tournament!.location)).toBeVisible();
  });

  test("shows correct prize info", async ({ page, tournament }) => {
    test.skip(!tournament, "No test tournament available");
    await page.goto(`/tournaments/${tournament!.slug}`);
    await expect(page.getByText(tournament!.prizeInfo)).toBeVisible();
  });
});

test.describe("404 handling", () => {
  test("unknown tournament slug shows not-found page", async ({ page }) => {
    await page.goto("/tournaments/this-slug-does-not-exist-xyz");
    await expect(page.getByText(/not found/i)).toBeVisible();
  });
});
