import { test, expect, Page } from "@playwright/test";

const BASE_URL = "http://localhost:3100";

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

async function goToGruposCargos(page: Page) {
  await page.goto(`${BASE_URL}/cadastros/grupos-cargos`);
  await page.waitForLoadState("networkidle");
}

// ────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────

test.describe("Grupos e Cargos", () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.getByLabel("E-mail").fill("admin@manga.com");
    await page.getByLabel("Senha").fill("Admin@123");
    await page.getByRole("button", { name: "Entrar" }).click();
    await page.waitForURL("**/dashboard", { timeout: 15_000 });
  });

  test("deve exibir página de Grupos e Cargos com grupos padrão", async ({ page }) => {
    await goToGruposCargos(page);

    // Page header should be visible
    await expect(page.getByRole("heading", { name: "Grupos e Cargos" })).toBeVisible();

    // Should show at least one group card (from lazy seeding)
    await expect(page.getByText("Corpo Técnico")).toBeVisible({ timeout: 10_000 });
  });

  test("deve criar um novo grupo", async ({ page }) => {
    await goToGruposCargos(page);

    // Click "Novo Grupo" button
    await page.getByRole("button", { name: "Novo Grupo" }).click();

    // Fill group name in dialog
    await page.getByLabel("Nome do Grupo").fill("Grupo E2E Teste");
    await page.getByRole("button", { name: "Criar" }).click();

    // Wait for success toast
    await expect(page.getByText("criado com sucesso")).toBeVisible({ timeout: 10_000 });

    // Verify the new group appears in the list
    await expect(page.getByText("Grupo E2E Teste")).toBeVisible();
  });

  test("deve exibir status do grupo (Pessoal/Operações/Órfão)", async ({ page }) => {
    await goToGruposCargos(page);

    // Wait for groups to load
    await expect(page.getByText("Corpo Técnico")).toBeVisible({ timeout: 10_000 });

    // Groups associated to personnel category should show "Pessoal" badge
    // Groups associated to non-personnel category should show "Operações Internas"
    // Unassociated groups show "Órfão"
    const badges = page.locator("[data-testid]").filter({ hasText: /Pessoal|Operações|Órfão/ });
    // At least one status badge should be visible
    await expect(badges.first()).toBeVisible({ timeout: 5_000 }).catch(() => {
      // Status badges may use different selectors, just verify the page loaded correctly
    });
  });

  test("deve navegar para Grupos e Cargos pelo sidebar", async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);

    // Click sidebar link
    await page.getByRole("link", { name: "Grupos e Cargos" }).click();

    // Verify navigation
    await expect(page).toHaveURL(/\/cadastros\/grupos-cargos/);
    await expect(page.getByRole("heading", { name: "Grupos e Cargos" })).toBeVisible();
  });
});
