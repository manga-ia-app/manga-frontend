import { test, expect, Page, Locator } from "@playwright/test";

const BASE_URL = "http://localhost:3100";

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

async function goToFirstEstimateDetail(page: Page) {
  await page.goto(`${BASE_URL}/estimativas`);
  await page.waitForLoadState("networkidle");

  // Click the first estimate row to navigate to detail
  const firstRow = page.locator("tbody tr").first();
  await expect(firstRow).toBeVisible({ timeout: 10_000 });
  await firstRow.click();

  await page.waitForURL(/\/estimativas\/[a-f0-9-]+$/i, { timeout: 30_000 });
  await expect(
    page.getByRole("heading", { name: "Atividades" }),
  ).toBeVisible({ timeout: 15_000 });
}

async function expandFirstPhase(page: Page) {
  const expandAllBtn = page.getByRole("button", { name: /Expandir tudo/i });
  if (await expandAllBtn.isVisible({ timeout: 5_000 })) {
    await expandAllBtn.click();
    await page.waitForTimeout(500);
  }
}

/** Find an activity row by its visible name text */
function getActivityByName(page: Page, name: string): Locator {
  return page
    .locator(".rounded-md.bg-background, .rounded-md.bg-muted\\/50")
    .filter({ hasText: name })
    .filter({ has: page.locator('input[type="checkbox"]') })
    .first();
}

function parseCurrency(text: string): number {
  const cleaned = text
    .replace("R$", "")
    .replace(/\s/g, "")
    .replace(".", "")
    .replace(",", ".");
  return parseFloat(cleaned);
}

// ────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────
test.describe("Atividades de template — visualização e alocação de cargos", () => {

  // ── 1. Expandida mostra botão, colapsada mostra horas e custo ──
  test("1 - Atividades expandidas mostram botão e colapsadas mostram horas e custo", async ({
    page,
  }) => {
    await goToFirstEstimateDetail(page);
    await expandFirstPhase(page);

    const firstActivity = page
      .locator(".rounded-md")
      .filter({ has: page.locator('input[type="checkbox"]') })
      .first();
    await expect(firstActivity).toBeVisible({ timeout: 5_000 });

    // Activities start expanded: "Adicionar cargo" visible, cost hidden
    await expect(
      firstActivity.getByRole("button", { name: "Adicionar cargo" }),
    ).toBeVisible();
    await expect(
      firstActivity.locator(".text-sm.font-medium.w-28.text-right"),
    ).not.toBeVisible();

    // Collapse the activity by clicking the chevron area (right side of summary)
    const trigger = firstActivity.locator(".cursor-pointer").first();
    const triggerBox = await trigger.boundingBox();
    await page.mouse.click(
      triggerBox!.x + triggerBox!.width - 15,
      triggerBox!.y + triggerBox!.height / 2,
    );
    await page.waitForTimeout(300);

    // Collapsed: cost should appear, button hidden
    await expect(
      firstActivity.locator(".text-sm.font-medium.w-28.text-right"),
    ).toBeVisible();
    await expect(
      firstActivity.getByRole("button", { name: "Adicionar cargo" }),
    ).not.toBeVisible();
  });

  // ── 2. Atividade expandida — sem formulário, só botão Adicionar cargo ──
  test("2 - Atividade expandida mostra apenas botão 'Adicionar cargo' sem campos de formulário", async ({
    page,
  }) => {
    await goToFirstEstimateDetail(page);
    await expandFirstPhase(page);

    const firstActivity = page
      .locator(".rounded-md")
      .filter({ has: page.locator('input[type="checkbox"]') })
      .first();
    await expect(firstActivity).toBeVisible({ timeout: 5_000 });

    // Should NOT have a <select> element (no cargo form yet)
    await expect(firstActivity.locator("select")).toHaveCount(0);

    // Should NOT have hours input yet
    await expect(
      firstActivity.locator('input[type="number"]'),
    ).toHaveCount(0);

    // Should have "Adicionar cargo" button
    await expect(
      firstActivity.getByRole("button", { name: "Adicionar cargo" }),
    ).toBeVisible();
  });

  // ── 3. Clicar Adicionar cargo — exibe campos ──
  test("3 - Clicar 'Adicionar cargo' exibe campos de cargo, horas e delete", async ({
    page,
  }) => {
    await goToFirstEstimateDetail(page);
    await expandFirstPhase(page);

    const firstActivity = page
      .locator(".rounded-md")
      .filter({ has: page.locator('input[type="checkbox"]') })
      .first();

    // Click "Adicionar cargo"
    await firstActivity
      .getByRole("button", { name: "Adicionar cargo" })
      .click();
    await page.waitForTimeout(300);

    // Cargo select should appear with "Selecionar cargo..." default
    const cargoSelect = firstActivity.locator("select").first();
    await expect(cargoSelect).toBeVisible({ timeout: 5_000 });
    expect(await cargoSelect.inputValue()).toBe("");

    // Hours input should appear (disabled until cargo selected)
    const hoursInput = firstActivity
      .locator('input[type="number"][placeholder="Horas"]')
      .first();
    await expect(hoursInput).toBeVisible();
    await expect(hoursInput).toBeDisabled();

    // Delete button should be visible
    await expect(
      firstActivity.locator('button[title="Remover cargo"]').first(),
    ).toBeVisible();
  });

  // ── 4. Selecionar cargo — exibe custo/hora e habilita horas ──
  test("4 - Selecionar cargo exibe valor/hora e habilita campo de horas", async ({
    page,
  }) => {
    await goToFirstEstimateDetail(page);
    await expandFirstPhase(page);

    const firstActivity = page
      .locator(".rounded-md")
      .filter({ has: page.locator('input[type="checkbox"]') })
      .first();

    // Add a cargo allocation
    await firstActivity
      .getByRole("button", { name: "Adicionar cargo" })
      .click();
    await page.waitForTimeout(300);

    // Select the first available cargo
    const cargoSelect = firstActivity.locator("select").first();
    await expect(cargoSelect).toBeVisible({ timeout: 5_000 });
    const options = cargoSelect.locator("option");
    await expect(options).not.toHaveCount(1, { timeout: 5_000 });
    const firstCargoValue = await options.nth(1).getAttribute("value");
    await cargoSelect.selectOption(firstCargoValue!);
    await page.waitForTimeout(300);

    // Valor/hora should now be displayed (e.g., "R$ 85,00/h")
    await expect(
      firstActivity.locator("span.whitespace-nowrap").filter({ hasText: "/h" }),
    ).toBeVisible({ timeout: 3_000 });

    // Hours input should now be enabled
    await expect(
      firstActivity
        .locator('input[type="number"][placeholder="Horas"]')
        .first(),
    ).toBeEnabled();
  });

  // ── 5. Preencher horas — exibe custo individual e totais ──
  test("5 - Preencher horas exibe custo individual e linha de totais", async ({
    page,
  }) => {
    await goToFirstEstimateDetail(page);
    await expandFirstPhase(page);

    const firstActivity = page
      .locator(".rounded-md")
      .filter({ has: page.locator('input[type="checkbox"]') })
      .first();

    // Add cargo allocation and select cargo
    await firstActivity
      .getByRole("button", { name: "Adicionar cargo" })
      .click();
    await page.waitForTimeout(300);

    const cargoSelect = firstActivity.locator("select").first();
    await expect(cargoSelect).toBeVisible({ timeout: 5_000 });
    const options = cargoSelect.locator("option");
    await expect(options).not.toHaveCount(1, { timeout: 5_000 });
    await cargoSelect.selectOption({ index: 1 });
    await page.waitForTimeout(300);

    // Get the hourly rate
    const rateLabel = firstActivity
      .locator("span.whitespace-nowrap")
      .filter({ hasText: "/h" });
    const rateText = (await rateLabel.textContent())?.trim() ?? "";
    const rate = parseCurrency(rateText.replace("/h", ""));

    // Fill hours
    const hoursInput = firstActivity
      .locator('input[type="number"][placeholder="Horas"]')
      .first();
    await hoursInput.fill("10");
    await page.waitForTimeout(300);

    // Individual allocation cost should show (e.g., "R$ 720,00")
    const expectedCost = rate * 10;
    await expect(
      firstActivity.getByText(`R$ ${expectedCost.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`).first(),
    ).toBeVisible({ timeout: 3_000 });

    // Totals row should appear (border-dashed) with hours
    const totalsRow = firstActivity.locator(".border-dashed");
    await expect(totalsRow).toBeVisible({ timeout: 3_000 });
    await expect(totalsRow).toContainText("10.0h");
  });

  // ── 6. Múltiplos cargos — totais acumulados e botão Adicionar cargo ──
  test("6 - Múltiplos cargos mostram totais acumulados e botão Adicionar cargo abaixo", async ({
    page,
  }) => {
    await goToFirstEstimateDetail(page);
    await expandFirstPhase(page);

    const firstActivity = page
      .locator(".rounded-md")
      .filter({ has: page.locator('input[type="checkbox"]') })
      .first();

    // Add first cargo allocation
    await firstActivity
      .getByRole("button", { name: "Adicionar cargo" })
      .click();
    await page.waitForTimeout(300);

    // Select cargo and fill hours
    const cargoSelect1 = firstActivity.locator("select").first();
    await expect(cargoSelect1).toBeVisible({ timeout: 5_000 });
    await expect(cargoSelect1.locator("option")).not.toHaveCount(1, {
      timeout: 5_000,
    });
    await cargoSelect1.selectOption({ index: 1 });
    await page.waitForTimeout(200);

    await firstActivity
      .locator('input[type="number"][placeholder="Horas"]')
      .first()
      .fill("10");
    await page.waitForTimeout(300);

    // Add second cargo allocation
    await firstActivity
      .getByRole("button", { name: "Adicionar cargo" })
      .click();
    await page.waitForTimeout(300);

    // Select cargo and fill hours for second allocation
    const cargoSelect2 = firstActivity.locator("select").last();
    await cargoSelect2.selectOption({ index: 1 });
    await page.waitForTimeout(200);

    await firstActivity
      .locator('input[type="number"][placeholder="Horas"]')
      .last()
      .fill("5");
    await page.waitForTimeout(300);

    // Totals row should show accumulated 15.0h
    const totalsRow = firstActivity.locator(".border-dashed");
    await expect(totalsRow).toBeVisible({ timeout: 3_000 });
    await expect(totalsRow).toContainText("15.0h");

    // "Adicionar cargo" button should still be visible below
    await expect(
      firstActivity.getByRole("button", { name: "Adicionar cargo" }),
    ).toBeVisible();
  });

  // ── 7. Totais ao lado do botão Adicionar atividade ──
  test("7 - Total de horas e valor ao lado do botão 'Adicionar atividade'", async ({
    page,
  }) => {
    await goToFirstEstimateDetail(page);
    await expandFirstPhase(page);

    // The "Adicionar atividade" button should exist
    const addActivityBtn = page
      .getByRole("button", { name: /Adicionar atividade/i })
      .first();
    await expect(addActivityBtn).toBeVisible({ timeout: 5_000 });

    // Subtotal row should show hours and cost near the add activity area
    await expect(page.getByText("Subtotal").first()).toBeVisible({ timeout: 3_000 });
    await expect(page.getByText(/\d+\.\d+h/).first()).toBeVisible();
  });

  // ── 8. Complexidade — composição subtotal + acréscimo + total ──
  test("8 - Complexidade exibe composição: subtotal, acréscimo e total", async ({
    page,
  }) => {
    await goToFirstEstimateDetail(page);
    await expandFirstPhase(page);

    // Fill some data: add cargo + hours to first activity
    const firstActivity = page
      .locator(".rounded-md")
      .filter({ has: page.locator('input[type="checkbox"]') })
      .first();

    await firstActivity
      .getByRole("button", { name: "Adicionar cargo" })
      .click();
    await page.waitForTimeout(300);

    const cargoSelect = firstActivity.locator("select").first();
    await expect(cargoSelect).toBeVisible({ timeout: 5_000 });
    await expect(cargoSelect.locator("option")).not.toHaveCount(1, {
      timeout: 5_000,
    });
    await cargoSelect.selectOption({ index: 1 });
    await page.waitForTimeout(200);

    await firstActivity
      .locator('input[type="number"][placeholder="Horas"]')
      .first()
      .fill("20");
    await page.waitForTimeout(300);

    // Enable Complexo
    const complexoBtn = page.getByRole("button", { name: "Complexo" }).first();
    await expect(complexoBtn).toBeVisible({ timeout: 5_000 });
    await complexoBtn.click();
    await page.waitForTimeout(500);

    // Phase footer should show composition: Subtotal, + Complexidade, Total
    await expect(page.getByText("Subtotal").first()).toBeVisible({
      timeout: 3_000,
    });
    await expect(
      page.getByText(/Complexidade \(\d+%\)/).first(),
    ).toBeVisible({ timeout: 3_000 });
    await expect(page.getByText("Total").first()).toBeVisible();

    // Discard changes
    await page.getByRole("button", { name: /Descartar/i }).click();
  });
});
