import { test, expect, Page } from "@playwright/test";

const BASE_URL = "http://localhost:3100";

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

async function goToFirstEstimateDetail(page: Page): Promise<string> {
  const responsePromise = page.waitForResponse(
    (resp) =>
      resp.url().includes("/api/estimativas") &&
      resp.request().method() === "GET" &&
      resp.status() === 200,
    { timeout: 15_000 },
  );
  await page.goto(`${BASE_URL}/estimativas`);
  const response = await responsePromise;
  const body = await response.json();
  const items = body.items ?? body;
  expect(items.length).toBeGreaterThan(0);
  const firstId = items[0].id;
  await page.goto(`${BASE_URL}/estimativas/${firstId}`);
  await page.waitForLoadState("networkidle");
  await expect(page.getByText("Composição de Preço")).toBeVisible({
    timeout: 10_000,
  });
  return firstId;
}

async function expandAllPhases(page: Page) {
  const expandAllBtn = page.getByRole("button", { name: /Expandir tudo/i });
  if (await expandAllBtn.isVisible({ timeout: 5_000 })) {
    await expandAllBtn.click();
    await page.waitForTimeout(500);
  }
}

function parseRate(rateText: string): number {
  const cleaned = rateText
    .replace("R$", "")
    .replace("/h", "")
    .replace(/\s/g, "")
    .replace(".", "")
    .replace(",", ".");
  return parseFloat(cleaned);
}

// ────────────────────────────────────────────────────────────
// Test: Sincronizar Cargos — cross-tab rate update flow
// ────────────────────────────────────────────────────────────
test.describe("Sincronizar Cargos — atualização de valor/hora entre abas", () => {
  test("should sync cargo rates in-place without save or reload and recalculate totals", async ({
    page,
    context,
  }) => {
    // ── Step 1: Open estimate detail and expand phases ──
    const estimateId = await goToFirstEstimateDetail(page);
    await expandAllPhases(page);

    // ── Step 2: Create a custom activity with cargo and hours (do NOT save) ──
    const addActivityBtn = page.getByRole("button", {
      name: /Adicionar atividade/i,
    });
    await expect(addActivityBtn.first()).toBeVisible({ timeout: 5_000 });
    await addActivityBtn.first().click();

    // Fill the name via the placeholder input (visible during editing)
    const nameInput = page.getByPlaceholder("Nome da atividade...").last();
    await expect(nameInput).toBeVisible({ timeout: 3_000 });
    await nameInput.fill("Atividade Sync E2E");
    // Press Enter to commit the name (switches from input to text span)
    await nameInput.press("Enter");
    await page.waitForTimeout(300);

    // Now locate the activity row by its visible name text
    const activityRow = page
      .locator(".rounded-md")
      .filter({ hasText: "Atividade Sync E2E" })
      .first();

    // Click "Adicionar cargo" to show the cargo form
    const addCargoBtn = activityRow.getByRole("button", { name: "Adicionar cargo" });
    await expect(addCargoBtn).toBeVisible({ timeout: 3_000 });
    await addCargoBtn.click();
    await page.waitForTimeout(300);

    // Select the first available cargo (scoped to this row)
    const cargoSelect = activityRow.locator("select").first();
    await expect(cargoSelect).toBeVisible({ timeout: 5_000 });
    const options = cargoSelect.locator("option");
    const optCount = await options.count();
    expect(optCount).toBeGreaterThan(1);

    const firstCargoValue = await options.nth(1).getAttribute("value");
    const firstCargoName = (await options.nth(1).textContent())?.trim() ?? "";
    expect(firstCargoValue).toBeTruthy();
    await cargoSelect.selectOption(firstCargoValue!);

    // Wait for re-render after cargo selection
    await page.waitForTimeout(500);

    // Get the rate label (scoped to the activity row, filter by /h text)
    const rateLabel = activityRow
      .locator("span.whitespace-nowrap")
      .filter({ hasText: "/h" });
    await expect(rateLabel).toBeVisible({ timeout: 3_000 });
    const originalRateText = (await rateLabel.textContent())?.trim() ?? "";
    const originalRate = parseRate(originalRateText);
    expect(originalRate).toBeGreaterThan(0);

    // Fill hours (scoped to the activity row)
    const hoursInput = activityRow.locator(
      'input[type="number"][placeholder="Horas"]',
    );
    await expect(hoursInput).toBeEnabled({ timeout: 3_000 });
    await hoursInput.fill("10");
    await page.waitForTimeout(300);

    // Confirm simulation is active (unsaved changes exist)
    await expect(page.getByText("Simulação ativa")).toBeVisible({
      timeout: 3_000,
    });

    // ── Step 3: Open cargos page in a new tab ──
    const cargosPage = await context.newPage();
    await cargosPage.goto(`${BASE_URL}/cadastros/cargos`);
    await cargosPage.waitForLoadState("networkidle");
    await expect(
      cargosPage.getByRole("heading", { name: "Cargos" }),
    ).toBeVisible({ timeout: 10_000 });

    // ── Step 4: Find the same cargo and click edit ──
    const cargoRow = cargosPage
      .locator("tbody tr")
      .filter({ hasText: firstCargoName });
    await expect(cargoRow).toBeVisible({ timeout: 5_000 });

    await cargoRow
      .getByRole("button", { name: `Editar ${firstCargoName}` })
      .click();

    // ── Step 5: Change the valor/hora ──
    await expect(
      cargosPage.getByRole("heading", { name: "Editar Cargo" }),
    ).toBeVisible({ timeout: 5_000 });

    const valorHoraInput = cargosPage.getByLabel("Valor/Hora (R$)");
    await expect(valorHoraInput).toBeVisible();

    const currentInputValue = await valorHoraInput.inputValue();
    const currentRate = parseFloat(currentInputValue);

    const newRate = currentRate + 10;
    await valorHoraInput.fill(String(newRate));

    await cargosPage.getByRole("button", { name: "Salvar" }).click();

    await expect(
      cargosPage.getByText("Cargo atualizado com sucesso"),
    ).toBeVisible({ timeout: 5_000 });

    // ── Step 6: Switch back to estimate tab and sync cargos (no save needed) ──
    await page.bringToFront();

    // Verify old rate is still displayed before sync
    await expect(rateLabel).toBeVisible({ timeout: 5_000 });
    const rateBefore = await rateLabel.textContent();
    expect(parseRate(rateBefore!.trim())).toBe(originalRate);

    // Click "Sincronizar Cargos" and intercept the sync API response
    const syncBtn = page.getByRole("button", {
      name: /Sincronizar Cargos/i,
    });
    await expect(syncBtn).toBeVisible();

    const [syncResponse] = await Promise.all([
      page.waitForResponse(
        (resp) =>
          resp.url().includes(`/api/estimativas/${estimateId}/sync-cargos`) &&
          resp.request().method() === "POST",
        { timeout: 15_000 },
      ),
      syncBtn.click(),
    ]);
    expect(syncResponse.status()).toBe(200);

    // Wait for success toast
    await expect(
      page.getByText("Cargos sincronizados com sucesso"),
    ).toBeVisible({ timeout: 10_000 });

    // ── Step 7: Verify rate label updated in-place (no reload, no save) ──
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // The custom activity should still be visible (unsaved state preserved)
    await expect(activityRow).toBeVisible();

    // Rate label should now show the new rate
    await expect(rateLabel).toBeVisible({ timeout: 5_000 });
    const rateAfterText = (await rateLabel.textContent())?.trim() ?? "";
    expect(parseRate(rateAfterText)).toBe(newRate);

    // ── Step 8: Verify the activity cost was recalculated ──
    // The activity cost display: 10h × newRate (in allocation row, not summary)
    const expectedNewCost = newRate * 10;
    const expectedCostText = `R$ ${expectedNewCost.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    await expect(
      activityRow.getByText(expectedCostText).first(),
    ).toBeVisible({ timeout: 5_000 });

    // Verify the pricing summary is visible and reflects updated costs
    await expect(
      page.getByText("Custo das Atividades", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Custo Total", { exact: true })).toBeVisible();
    await expect(page.getByText("Valor Final").first()).toBeVisible();

    // Simulation should still be active (sync does not clear local edits)
    await expect(page.getByText("Simulação ativa")).toBeVisible();

    // ── Cleanup: Restore original cargo rate ──
    await cargosPage.bringToFront();
    await cargosPage.goto(`${BASE_URL}/cadastros/cargos`);
    await cargosPage.waitForLoadState("networkidle");

    const cleanupRow = cargosPage
      .locator("tbody tr")
      .filter({ hasText: firstCargoName });
    await expect(cleanupRow).toBeVisible({ timeout: 5_000 });
    await cleanupRow
      .getByRole("button", { name: `Editar ${firstCargoName}` })
      .click();

    await expect(
      cargosPage.getByRole("heading", { name: "Editar Cargo" }),
    ).toBeVisible({ timeout: 5_000 });
    await cargosPage.getByLabel("Valor/Hora (R$)").fill(String(currentRate));
    await cargosPage.getByRole("button", { name: "Salvar" }).click();
    await expect(
      cargosPage.getByText("Cargo atualizado com sucesso"),
    ).toBeVisible({ timeout: 5_000 });

    await cargosPage.close();
  });
});
