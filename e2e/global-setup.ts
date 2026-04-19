import { test as setup, expect } from "@playwright/test";
import { mkdirSync } from "fs";
import { dirname } from "path";

/**
 * Global setup: logs in via UI and saves the storage state (cookie JWT)
 * so all subsequent tests reuse the authenticated session.
 *
 * Credentials come from env vars or fallback to dev defaults.
 */
const AUTH_FILE = "e2e/.auth/user.json";

setup("authenticate", async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL || "admin@manga.com";
  const password = process.env.TEST_USER_PASSWORD || "Admin@123";

  await page.goto("/login");
  await page.waitForLoadState("networkidle");

  const emailInput = page.getByLabel("E-mail");
  await expect(emailInput).toBeVisible({ timeout: 10_000 });
  await emailInput.fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();

  // Wait for redirect to dashboard (means auth succeeded)
  await page.waitForURL("**/dashboard", { timeout: 60_000 });
  await expect(page).toHaveURL(/dashboard/);

  // Persist storage state (cookies + localStorage)
  mkdirSync(dirname(AUTH_FILE), { recursive: true });
  await page.context().storageState({ path: AUTH_FILE });
});
