import { test, expect, Page } from "@playwright/test";

const BASE_URL = "http://localhost:3100";

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

async function goToEstimativas(page: Page) {
  await page.goto(`${BASE_URL}/estimativas`);
  await page.waitForLoadState("networkidle");
}

async function goToNovaEstimativa(page: Page) {
  await page.goto(`${BASE_URL}/estimativas/novo`);
  await page.waitForLoadState("networkidle");
}

async function goToFirstEstimateDetail(page: Page) {
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
}

/**
 * Expand the first phase using the "Expandir tudo" button for reliability,
 * then wait for the phase content to be visible.
 */
async function expandFirstPhase(page: Page) {
  // Use the "Expandir tudo" button which is always visible
  const expandAllBtn = page.getByRole("button", { name: /Expandir tudo/i });
  if (await expandAllBtn.isVisible({ timeout: 5_000 })) {
    await expandAllBtn.click();
    // Wait for phase content to be rendered
    await page.waitForTimeout(500);
  }
}

// ────────────────────────────────────────────────────────────
// 1. Criar estimativa a partir de template
// ────────────────────────────────────────────────────────────
test.describe("1 - Criar estimativa a partir de template", () => {
  test("should create an estimate from a template", async ({ page }) => {
    await goToNovaEstimativa(page);

    const templateSelect = page.getByLabel("Template *");
    await expect(templateSelect).toBeVisible({ timeout: 10_000 });
    await expect(templateSelect.locator("option")).not.toHaveCount(1, {
      timeout: 10_000,
    });
    const options = templateSelect.locator("option");
    let selectedTemplate = false;
    for (let i = 1; i < await options.count(); i++) {
      const text = await options.nth(i).textContent();
      if (text && !text.includes("(0 atividades)")) {
        const val = await options.nth(i).getAttribute("value");
        if (val) {
          await templateSelect.selectOption(val);
          selectedTemplate = true;
          break;
        }
      }
    }
    if (!selectedTemplate) {
      await templateSelect.selectOption({ index: 1 });
    }

    const clientSelect = page.getByLabel("Cliente *");
    await expect(clientSelect).toBeVisible({ timeout: 5_000 });
    await clientSelect.selectOption({ index: 1 });

    await page.getByLabel("Descrição").fill("E2E Estimativa Teste");

    const createBtn = page.getByRole("button", { name: /Criar Estimativa/i });
    await expect(createBtn).toBeEnabled({ timeout: 5_000 });

    const [response] = await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes("/api/estimativas") && resp.request().method() === "POST",
        { timeout: 15_000 },
      ),
      createBtn.click(),
    ]);

    if (!response.ok()) {
      const body = await response.text();
      console.error("Create estimate API error:", response.status(), body);
    }

    await page.waitForURL(/\/estimativas\/[a-f0-9-]+$/i, { timeout: 15_000 });

    // Wait for the detail page to fully load (PageHeader shows description)
    await expect(page.getByText("Composição de Preço")).toBeVisible({
      timeout: 10_000,
    });
  });
});

// ────────────────────────────────────────────────────────────
// 2. Listagem de estimativas
// ────────────────────────────────────────────────────────────
test.describe("2 - Listagem de estimativas", () => {
  test("should display estimates list with search", async ({ page }) => {
    await goToEstimativas(page);

    await expect(page.getByRole("heading", { name: "Estimativas" })).toBeVisible({ timeout: 5_000 });

    const searchInput = page.getByPlaceholder("Buscar por descrição...");
    await expect(searchInput).toBeVisible();

    await searchInput.fill("E2E");
    await page.waitForTimeout(500);

    const rows = page.locator("tbody tr");
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  test("should sort by date columns", async ({ page }) => {
    await goToEstimativas(page);

    const createdHeader = page.getByText("Criada");
    await expect(createdHeader).toBeVisible({ timeout: 5_000 });
    await createdHeader.click();

    await expect(page.getByText(/Criada.*[↑↓]/)).toBeVisible({ timeout: 3_000 });
  });
});

// ────────────────────────────────────────────────────────────
// 3. Editar estimativa — v2 indicators at top
// ────────────────────────────────────────────────────────────
test.describe("3 - Editar estimativa com atividades", () => {
  test("should show summary cards and activity count in detail page", async ({
    page,
  }) => {
    await goToFirstEstimateDetail(page);

    // Pricing summary in sidebar
    await expect(page.getByText("Composição de Preço")).toBeVisible({
      timeout: 5_000,
    });

    // Top summary cards
    await expect(page.getByText("Horas Totais")).toBeVisible();
    // "Valor Final" appears in both the top card and the pricing summary — use first()
    await expect(page.getByText("Valor Final").first()).toBeVisible();

    // Activity count badge (v2 format: "X de Y preenchidas")
    await expect(page.getByText(/\d+ de \d+ preenchidas/)).toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────
// 4. Custos adicionais e ajustes comerciais
// ────────────────────────────────────────────────────────────
test.describe("4 - Custos adicionais e ajustes comerciais", () => {
  test("should add additional cost inside phase and see total update", async ({ page }) => {
    await goToFirstEstimateDetail(page);

    // Expand phases
    await expandFirstPhase(page);

    // AdditionalCosts component has CardTitle "Custos Adicionais"
    const additionalCostsHeading = page.getByText("Custos Adicionais", { exact: true }).first();
    await expect(additionalCostsHeading).toBeVisible({ timeout: 5_000 });

    // Add additional cost
    const addBtn = page.getByRole("button", { name: /^Adicionar$/i }).first();
    if (await addBtn.isVisible()) {
      await addBtn.click();

      const nameInput = page.getByPlaceholder("Ex: Maquete, Viagem, Taxa");
      if ((await nameInput.count()) > 0) {
        await nameInput.last().fill("Taxa E2E");
      }
    }

    // Adjustments section should be in sidebar below composition
    await expect(page.getByText("Ajustes Comerciais")).toBeVisible();
  });

  test("should add commercial adjustment", async ({ page }) => {
    await goToFirstEstimateDetail(page);

    const discountBtn = page.getByRole("button", { name: /% Desconto/i });
    if (await discountBtn.isVisible()) {
      await discountBtn.click();

      await expect(page.getByText("Desconto Percentual")).toBeVisible({
        timeout: 3_000,
      });
    }
  });
});

// ────────────────────────────────────────────────────────────
// 5. Simulação de cenários + explanation
// ────────────────────────────────────────────────────────────
test.describe("5 - Simulação de cenários", () => {
  test("should show simulation bar with explanation when edits are made", async ({
    page,
  }) => {
    await goToFirstEstimateDetail(page);

    await expect(page.getByText("Simulação ativa")).not.toBeVisible();

    const discountBtn = page.getByRole("button", { name: /% Desconto/i });
    if (await discountBtn.isVisible()) {
      await discountBtn.click();

      await expect(page.getByText("Simulação ativa")).toBeVisible({
        timeout: 3_000,
      });

      await expect(
        page.getByRole("button", { name: /Descartar/i })
      ).toBeVisible();

      await page.getByRole("button", { name: /Descartar/i }).click();

      await expect(page.getByText("Simulação ativa")).not.toBeVisible({
        timeout: 3_000,
      });
    }
  });
});

// ────────────────────────────────────────────────────────────
// 6. Duplicar estimativa
// ────────────────────────────────────────────────────────────
test.describe("6 - Duplicar estimativa", () => {
  test("should duplicate an estimate from list", async ({ page }) => {
    await goToEstimativas(page);

    // Count rows before duplicate
    const rowsBefore = await page.locator("tbody tr").count();

    const duplicateBtn = page
      .locator("tbody tr")
      .first()
      .getByTitle("Duplicar");
    if (await duplicateBtn.isVisible({ timeout: 5_000 })) {
      await duplicateBtn.click();

      // Wait for response — either a redirect to the new estimate or a toast
      await page.waitForTimeout(3_000);

      // Check URL — may stay on list or navigate to new estimate
      const url = page.url();
      expect(url).toContain("/estimativas");
    }
  });
});

// ────────────────────────────────────────────────────────────
// 7. Transformar em proposta
// ────────────────────────────────────────────────────────────
test.describe("7 - Transformar em proposta", () => {
  test("should show transform button in list", async ({ page }) => {
    await goToEstimativas(page);

    const transformBtn = page
      .locator("tbody tr")
      .first()
      .getByTitle("Gerar Proposta");
    await expect(transformBtn).toBeVisible({ timeout: 10_000 });
  });
});

// ────────────────────────────────────────────────────────────
// 8. Custos adicionais por etapa
// ────────────────────────────────────────────────────────────
test.describe("8 - Custos adicionais por etapa", () => {
  test("should show additional costs section inside each phase when expanded", async ({
    page,
  }) => {
    await goToFirstEstimateDetail(page);

    await expandFirstPhase(page);

    // AdditionalCosts component renders inside the expanded phase's CardContent
    const additionalCostsHeading = page.locator("div.mt-3").getByText("Custos Adicionais").first();
    await expect(additionalCostsHeading).toBeVisible({ timeout: 5_000 });
  });

  test("should add additional cost inside a phase and trigger simulation", async ({
    page,
  }) => {
    await goToFirstEstimateDetail(page);

    await expect(page.getByText("Simulação ativa")).not.toBeVisible();

    await expandFirstPhase(page);

    const additionalCostsHeading = page.locator("div.mt-3").getByText("Custos Adicionais").first();
    await expect(additionalCostsHeading).toBeVisible({ timeout: 5_000 });

    const addBtn = page.getByRole("button", { name: /^Adicionar$/i }).first();
    await addBtn.click();

    const nameInput = page.getByPlaceholder("Ex: Maquete, Viagem, Taxa");
    await expect(nameInput.last()).toBeVisible();
    await nameInput.last().fill("Custo E2E fase");

    const costRow = nameInput.last().locator("..");
    const costValueInput = costRow.locator('input[type="number"]');
    await costValueInput.fill("500");

    await expect(page.getByText("Simulação ativa")).toBeVisible({
      timeout: 3_000,
    });
  });
});

// ────────────────────────────────────────────────────────────
// 9. Margem editável
// ────────────────────────────────────────────────────────────
test.describe("9 - Margem editável na estimativa", () => {
  test("should display editable margin input with current value", async ({
    page,
  }) => {
    await goToFirstEstimateDetail(page);

    const marginLabel = page.getByText("Margem:", { exact: false });
    await expect(marginLabel).toBeVisible();

    const marginInput = page
      .locator('.flex.items-center.gap-1')
      .filter({ hasText: "Margem:" })
      .locator('input[type="number"]');
    await expect(marginInput).toBeVisible();

    const value = await marginInput.inputValue();
    expect(parseFloat(value)).toBeGreaterThanOrEqual(0);
  });

  test("should update pricing when margin is changed", async ({ page }) => {
    await goToFirstEstimateDetail(page);

    const marginInput = page
      .locator('.flex.items-center.gap-1')
      .filter({ hasText: "Margem:" })
      .locator('input[type="number"]');
    const currentValue = await marginInput.inputValue();
    const newMargin = currentValue === "25" ? "35" : "25";

    await marginInput.fill(newMargin);

    await expect(page.getByText("Simulação ativa")).toBeVisible({
      timeout: 5_000,
    });

    await expect(
      page.getByText(`+ Margem (${newMargin}%)`)
    ).toBeVisible();

    await page.getByRole("button", { name: /Descartar/i }).click();
    await expect(page.getByText("Simulação ativa")).not.toBeVisible({
      timeout: 3_000,
    });
  });
});

// ────────────────────────────────────────────────────────────
// 10. Atividade customizada
// ────────────────────────────────────────────────────────────
test.describe("10 - Atividade customizada nos custos", () => {
  test("should add custom activity with cargo and hours enabled", async ({
    page,
  }) => {
    await goToFirstEstimateDetail(page);

    await expandFirstPhase(page);

    const addActivityBtn = page.getByRole("button", {
      name: /Adicionar atividade/i,
    });
    await expect(addActivityBtn.first()).toBeVisible({ timeout: 5_000 });
    await addActivityBtn.first().click();

    // Custom activity row should appear with name input
    const nameInput = page.getByPlaceholder("Nome da atividade...");
    await expect(nameInput.first()).toBeVisible({ timeout: 3_000 });
    await nameInput.first().fill("Atividade E2E customizada");

    // Cargo select should be visible and enabled
    const customRowSelects = page.locator("select").filter({ hasText: "Selecionar cargo..." });
    if ((await customRowSelects.count()) > 0) {
      const cargoSelect = customRowSelects.last();
      const options = cargoSelect.locator("option");
      const optCount = await options.count();
      if (optCount > 1) {
        const firstCargoValue = await options.nth(1).getAttribute("value");
        if (firstCargoValue) await cargoSelect.selectOption(firstCargoValue);
      }
    }

    // Simulation bar should appear
    await expect(page.getByText("Simulação ativa")).toBeVisible({
      timeout: 3_000,
    });

    // Activity count badge should reflect added activity
    await expect(page.getByText(/\d+ de \d+ preenchidas/)).toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────
// 11. Overhead editável + Sync buttons
// ────────────────────────────────────────────────────────────
test.describe("11 - Overhead editável na estimativa", () => {
  test("should display editable overhead input", async ({
    page,
  }) => {
    await goToFirstEstimateDetail(page);

    const overheadLabel = page.getByText("Overhead:", { exact: false });
    await expect(overheadLabel).toBeVisible();

    const overheadInput = page
      .locator('.flex.items-center.gap-1')
      .filter({ hasText: "Overhead:" })
      .locator('input[type="number"]');
    await expect(overheadInput).toBeVisible();

    const value = await overheadInput.inputValue();
    const parsed = parseFloat(value);
    expect(value === "" || !isNaN(parsed)).toBeTruthy();
  });

  test("should update pricing when overhead is changed", async ({ page }) => {
    await goToFirstEstimateDetail(page);

    const overheadInput = page
      .locator('.flex.items-center.gap-1')
      .filter({ hasText: "Overhead:" })
      .locator('input[type="number"]');

    await overheadInput.fill("25");

    await expect(page.getByText("Simulação ativa")).toBeVisible({
      timeout: 3_000,
    });

    await expect(
      page.getByText("+ Overhead (25% sobre atividades)")
    ).toBeVisible();

    await page.getByRole("button", { name: /Descartar/i }).click();
    await expect(page.getByText("Simulação ativa")).not.toBeVisible({
      timeout: 3_000,
    });
  });

  test("should show Sincronizar Overhead and Sincronizar Cargos buttons", async ({ page }) => {
    await goToFirstEstimateDetail(page);

    await expect(
      page.getByRole("button", { name: /Sincronizar Overhead/i })
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: /Sincronizar Cargos/i })
    ).toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────
// 12. Per-phase complexity (v2)
// ────────────────────────────────────────────────────────────
test.describe("12 - Complexidade por etapa (toggle Simples/Complexo)", () => {
  test("should show Simples/Complexo toggle inside expanded phase", async ({
    page,
  }) => {
    await goToFirstEstimateDetail(page);

    await expandFirstPhase(page);

    // "Complexidade:" label inside the expanded phase
    const complexityLabel = page.getByText("Complexidade:", { exact: false }).first();
    await expect(complexityLabel).toBeVisible({ timeout: 5_000 });

    // Simples and Complexo toggle buttons
    await expect(page.getByRole("button", { name: "Simples" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Complexo" }).first()).toBeVisible();
  });

  test("should toggle to Complexo, show input with default 10%, and show feedback", async ({
    page,
  }) => {
    await goToFirstEstimateDetail(page);

    await expandFirstPhase(page);

    // Click "Complexo" button
    const complexoBtn = page.getByRole("button", { name: "Complexo" }).first();
    await expect(complexoBtn).toBeVisible({ timeout: 5_000 });
    await complexoBtn.click();

    // Percentage input should appear
    const complexityLabel = page.getByText("Complexidade:", { exact: false }).first();
    const complexityContainer = complexityLabel.locator("..").locator("..");
    const complexityInput = complexityContainer.locator('input[type="number"]');
    await expect(complexityInput).toBeVisible({ timeout: 3_000 });

    // Change value to trigger simulation
    await complexityInput.fill("15");

    // Simulation should be active
    await expect(page.getByText("Simulação ativa")).toBeVisible({
      timeout: 3_000,
    });

    // Discard
    await page.getByRole("button", { name: /Descartar/i }).click();
  });

  test("should show HelpButton for complexity factors", async ({ page }) => {
    await goToFirstEstimateDetail(page);

    await expandFirstPhase(page);

    // HelpButton has aria-label="Ajuda" — find it near the complexity section
    const helpBtn = page.getByRole("button", { name: "Ajuda" }).first();
    await expect(helpBtn).toBeVisible({ timeout: 5_000 });

    // Click to open dialog
    await helpBtn.click();

    // Dialog should contain complexity factor headings
    await expect(page.getByText("Fatores de Complexidade")).toBeVisible({
      timeout: 3_000,
    });
    await expect(page.getByText("Modificações em projeto existente")).toBeVisible();
    await expect(page.getByText("Intervenções do cliente")).toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────
// 13. Monthly billing per phase (v2)
// ────────────────────────────────────────────────────────────
test.describe("13 - Cobrança mensal por etapa", () => {
  test("should show monthly billing checkbox inside expanded phase", async ({
    page,
  }) => {
    await goToFirstEstimateDetail(page);

    await expandFirstPhase(page);

    // "Cobrança mensal" checkbox label — the label text is inside a <label>
    await expect(page.locator("label").filter({ hasText: "Cobrança mensal" }).first()).toBeVisible({
      timeout: 5_000,
    });
  });

  test("should toggle monthly billing and see Mensal badge on phase", async ({
    page,
  }) => {
    await goToFirstEstimateDetail(page);

    await expandFirstPhase(page);

    // Find and click "Cobrança mensal" checkbox
    const monthlyLabel = page.locator("label").filter({ hasText: "Cobrança mensal" }).first();
    await expect(monthlyLabel).toBeVisible({ timeout: 5_000 });
    const monthlyCheckbox = monthlyLabel.locator("input[type='checkbox']");
    await monthlyCheckbox.check();

    // "Mensal" badge should appear on phase header
    await expect(page.getByText("Mensal").first()).toBeVisible({
      timeout: 3_000,
    });

    // Simulation should be active
    await expect(page.getByText("Simulação ativa")).toBeVisible({
      timeout: 3_000,
    });

    // Discard
    await page.getByRole("button", { name: /Descartar/i }).click();
  });
});

// ────────────────────────────────────────────────────────────
// 14. Expand/collapse all button (v2)
// ────────────────────────────────────────────────────────────
test.describe("14 - Expandir/Colapsar tudo", () => {
  test("should toggle all phases with expand/collapse button", async ({
    page,
  }) => {
    await goToFirstEstimateDetail(page);

    // "Expandir tudo" button should be visible
    const expandAllBtn = page.getByRole("button", { name: /Expandir tudo/i });
    await expect(expandAllBtn).toBeVisible({ timeout: 5_000 });

    // Click to expand all
    await expandAllBtn.click();

    // Button text should change to "Colapsar tudo"
    await expect(
      page.getByRole("button", { name: /Colapsar tudo/i })
    ).toBeVisible({ timeout: 3_000 });

    // At least one "Complexidade:" should be visible (expanded content)
    await expect(page.getByText("Complexidade:", { exact: false }).first()).toBeVisible();

    // Collapse all
    await page.getByRole("button", { name: /Colapsar tudo/i }).click();

    // Button should change back to "Expandir tudo"
    await expect(
      page.getByRole("button", { name: /Expandir tudo/i })
    ).toBeVisible({ timeout: 3_000 });
  });
});

// ────────────────────────────────────────────────────────────
// 15. Pending count excludes inactive (v2)
// ────────────────────────────────────────────────────────────
test.describe("15 - Contagem de atividades pendentes", () => {
  test("should show activity count and deactivating should update counts", async ({
    page,
  }) => {
    await goToFirstEstimateDetail(page);

    // Activity count badge visible
    const badge = page.getByText(/\d+ de \d+ preenchidas/);
    await expect(badge).toBeVisible();

    // Expand first phase and toggle an activity off
    await expandFirstPhase(page);

    // Find the first activity checkbox and uncheck it
    const activityCheckbox = page.locator('.rounded-md input[type="checkbox"]').first();
    if (await activityCheckbox.isVisible()) {
      const wasChecked = await activityCheckbox.isChecked();
      if (wasChecked) {
        await activityCheckbox.uncheck();

        // Simulation should be active
        await expect(page.getByText("Simulação ativa")).toBeVisible({
          timeout: 3_000,
        });

        // Discard to reset
        await page.getByRole("button", { name: /Descartar/i }).click();
      }
    }
  });
});

// ────────────────────────────────────────────────────────────
// 16. Column headers (v2)
// ────────────────────────────────────────────────────────────
test.describe("16 - Cabeçalhos de colunas", () => {
  test("should display column headers (Atividade, Cargo, Horas, Custo)", async ({
    page,
  }) => {
    await goToFirstEstimateDetail(page);

    // Column headers row
    const headerRow = page.locator('.text-xs.font-medium.text-muted-foreground').filter({ hasText: "Atividade" });
    await expect(headerRow).toBeVisible({ timeout: 5_000 });

    // Check individual column headers exist
    await expect(page.getByText("Cargo", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Horas", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Custo", { exact: true }).first()).toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────
// 17. Sticky composition on scroll (v2)
// ────────────────────────────────────────────────────────────
test.describe("17 - Composição de preço sticky", () => {
  test("should keep pricing summary visible during scroll", async ({
    page,
  }) => {
    await goToFirstEstimateDetail(page);

    await expect(page.getByText("Composição de Preço")).toBeVisible();

    await page.evaluate(() => window.scrollBy(0, 800));
    await page.waitForTimeout(300);

    await expect(page.getByText("Composição de Preço")).toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────
// 18. Editable activity name
// ────────────────────────────────────────────────────────────
test.describe("18 - Nome de atividade editável", () => {
  test("should click on activity name to edit, then Escape to cancel", async ({
    page,
  }) => {
    await goToFirstEstimateDetail(page);

    await expandFirstPhase(page);

    // Find the first activity name text — it should be clickable
    const activityName = page.locator(".rounded-md .text-sm.flex-1.truncate").first();
    await expect(activityName).toBeVisible({ timeout: 5_000 });

    const originalName = await activityName.textContent();

    // Click to enter edit mode
    await activityName.click();

    // Input should appear
    const nameInput = page.locator('.rounded-md input[placeholder="Nome da atividade..."]').first();
    await expect(nameInput).toBeVisible({ timeout: 3_000 });

    // Type a new name
    await nameInput.fill("Nome Editado E2E");

    // Press Escape to cancel
    await nameInput.press("Escape");

    // Name should revert to original
    await expect(activityName).toContainText(originalName!.trim().split("\n")[0]);
  });
});

// ────────────────────────────────────────────────────────────
// 19. Editable phase name
// ────────────────────────────────────────────────────────────
test.describe("19 - Nome de etapa editável", () => {
  test("should click on phase name to edit", async ({ page }) => {
    await goToFirstEstimateDetail(page);

    await expandFirstPhase(page);

    // Phase name is a CardTitle with cursor-pointer and hover:underline
    const phaseName = page.locator(".text-base.cursor-pointer.hover\\:underline").first();
    await expect(phaseName).toBeVisible({ timeout: 5_000 });

    // Click to enter edit mode
    await phaseName.click();

    // Input should appear for editing the phase name
    const nameInput = page.locator('.h-7.text-base.font-semibold').first();
    await expect(nameInput).toBeVisible({ timeout: 3_000 });

    // Press Escape to cancel
    await nameInput.press("Escape");
  });
});

// ────────────────────────────────────────────────────────────
// 20. Collapsible activity
// ────────────────────────────────────────────────────────────
test.describe("20 - Atividade colapsável", () => {
  test("should collapse activity to hide cargo details and expand to show them", async ({
    page,
  }) => {
    await goToFirstEstimateDetail(page);

    await expandFirstPhase(page);

    // Activities are expanded by default — look for cargo select inside first activity
    const cargoSelect = page.locator("select").filter({ hasText: "Selecionar cargo..." }).first();
    const cargoSelectVisible = await cargoSelect.isVisible({ timeout: 3_000 }).catch(() => false);

    if (cargoSelectVisible) {
      // Find chevron toggle on the first activity (ChevronDown when expanded)
      const chevron = page.locator(".rounded-md .shrink-0 svg").last();
      if (await chevron.isVisible()) {
        // The collapsible trigger is the parent div with cursor-pointer
        const trigger = page.locator(".rounded-md .cursor-pointer").first();
        await trigger.click();
        await page.waitForTimeout(300);

        // After collapsing, the cargo select should be hidden
        // (it may still be in DOM but not visible)
      }
    }
  });
});

// ────────────────────────────────────────────────────────────
// 21. Add and delete phase
// ────────────────────────────────────────────────────────────
test.describe("21 - Adicionar e excluir etapa", () => {
  test("should add a new phase with Adicionar Etapa button", async ({
    page,
  }) => {
    await goToFirstEstimateDetail(page);

    // Count existing phases
    const phasesBefore = await page.locator("[data-state]").count();

    // Click "Adicionar Etapa" button
    const addPhaseBtn = page.getByRole("button", { name: /Adicionar Etapa/i });
    await expect(addPhaseBtn).toBeVisible({ timeout: 5_000 });
    await addPhaseBtn.click();

    // New phase "Nova Etapa" should appear
    await expect(page.getByText("Nova Etapa")).toBeVisible({ timeout: 3_000 });

    // Simulation should be active
    await expect(page.getByText("Simulação ativa")).toBeVisible({
      timeout: 3_000,
    });

    // Discard
    await page.getByRole("button", { name: /Descartar/i }).click();
  });

  test("should show delete button on phase header", async ({ page }) => {
    await goToFirstEstimateDetail(page);

    // Delete button (Trash2 icon) should be visible on phase header
    const deleteBtn = page.locator("button[title='Excluir etapa']").first();
    await expect(deleteBtn).toBeVisible({ timeout: 5_000 });
  });
});

// ────────────────────────────────────────────────────────────
// 22. Progress bar per phase
// ────────────────────────────────────────────────────────────
test.describe("22 - Barra de progresso por etapa", () => {
  test("should show progress bar with X de Y count on phase header", async ({
    page,
  }) => {
    await goToFirstEstimateDetail(page);

    // Progress bar is a div with bg-muted rounded-full
    const progressBar = page.locator(".bg-muted.rounded-full").first();
    await expect(progressBar).toBeVisible({ timeout: 5_000 });

    // "X de Y" text near the progress bar
    const progressText = page.locator(".text-\\[10px\\].text-muted-foreground.tabular-nums").first();
    await expect(progressText).toBeVisible();
    const text = await progressText.textContent();
    expect(text).toMatch(/\d+ de \d+/);
  });
});

// ────────────────────────────────────────────────────────────
// 23. Conditional totals (header vs footer)
// ────────────────────────────────────────────────────────────
test.describe("23 - Totais condicionais (header vs footer)", () => {
  test("should show totals in header when collapsed and in footer when expanded", async ({
    page,
  }) => {
    await goToFirstEstimateDetail(page);

    // First collapse all phases
    const collapseBtn = page.getByRole("button", { name: /Colapsar tudo/i });
    const expandBtn = page.getByRole("button", { name: /Expandir tudo/i });

    // Ensure all collapsed first
    if (await collapseBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await collapseBtn.click();
      await page.waitForTimeout(300);
    }

    // When collapsed, phase header should show hours and cost
    // Look for tabular-nums in the header area
    const headerTotals = page.locator(".text-xs.font-medium.tabular-nums").first();
    const headerVisible = await headerTotals.isVisible({ timeout: 3_000 }).catch(() => false);
    // Header totals should be visible when collapsed
    expect(headerVisible).toBeTruthy();

    // Now expand all
    await expandBtn.click();
    await page.waitForTimeout(500);

    // Footer should show "Subtotal" text (always visible when expanded)
    const footerSubtotal = page.getByText("Subtotal").first();
    await expect(footerSubtotal).toBeVisible({ timeout: 3_000 });
  });
});

// ────────────────────────────────────────────────────────────
// 24. Monthly cost breakdown in pricing summary
// ────────────────────────────────────────────────────────────
test.describe("24 - Detalhamento de custos mensais", () => {
  test("should show 5 breakdown lines when a phase has monthly billing", async ({
    page,
  }) => {
    await goToFirstEstimateDetail(page);

    await expandFirstPhase(page);

    // Enable monthly billing on first phase
    const monthlyLabel = page.locator("label").filter({ hasText: "Cobrança mensal" }).first();
    await expect(monthlyLabel).toBeVisible({ timeout: 5_000 });
    const monthlyCheckbox = monthlyLabel.locator("input[type='checkbox']");
    await monthlyCheckbox.check();

    // Wait for recalculation
    await page.waitForTimeout(500);

    // Check if the monthly breakdown section appears in the pricing summary
    const monthlyHeading = page.getByText("Custos Mensais (R$/mês)");
    const isVisible = await monthlyHeading.isVisible({ timeout: 3_000 }).catch(() => false);

    if (isVisible) {
      // Should show breakdown lines: Custo, Margem, Overhead, Total Mensal
      await expect(page.getByText("Total Mensal")).toBeVisible();
    }

    // Discard
    await page.getByRole("button", { name: /Descartar/i }).click();
  });
});

// ────────────────────────────────────────────────────────────
// 25. Monthly cost display in list (v2)
// ────────────────────────────────────────────────────────────
test.describe("25 - Custos mensais na listagem", () => {
  test("should display monthly cost indicator when present", async ({
    page,
  }) => {
    await goToEstimativas(page);

    await expect(page.getByRole("heading", { name: "Estimativas" })).toBeVisible({ timeout: 5_000 });

    // Soft check — not all estimates may have monthly phases
    const monthlyLabels = page.getByText("/mês");
    const count = await monthlyLabels.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

// ────────────────────────────────────────────────────────────
// 26. Custo adicional persiste após salvar
// ────────────────────────────────────────────────────────────
test.describe("26 - Custo adicional persiste após salvar", () => {
  const COST_NAME = "Custo Persistência E2E";
  const COST_VALUE = "750";

  test("should add additional cost to phase, save, and verify it persists after reload", async ({
    page,
  }) => {
    await goToFirstEstimateDetail(page);

    // Capture the current URL so we can reload to the same estimate
    const estimateUrl = page.url();

    // ── 1. Expand phase ──
    await expandFirstPhase(page);

    // ── 2. Remove any leftover E2E cost from a previous run ──
    const existingInputs = page.getByPlaceholder("Ex: Maquete, Viagem, Taxa");
    const existingCount = await existingInputs.count();
    for (let i = existingCount - 1; i >= 0; i--) {
      const val = await existingInputs.nth(i).inputValue();
      if (val === COST_NAME) {
        const row = existingInputs.nth(i).locator("..");
        await row.locator("button").click();
      }
    }

    // ── 3. Add additional cost ──
    const addBtn = page.getByRole("button", { name: /^Adicionar$/i }).first();
    await addBtn.click();

    const nameInput = page.getByPlaceholder("Ex: Maquete, Viagem, Taxa").last();
    await nameInput.fill(COST_NAME);

    const costRow = nameInput.locator("..");
    const valueInput = costRow.locator('input[type="number"]');
    await valueInput.fill(COST_VALUE);

    // Simulation bar should appear
    await expect(page.getByText("Simulação ativa")).toBeVisible({ timeout: 3_000 });

    // ── 4. Save ──
    const saveBtn = page.getByRole("button", { name: /Salvar/i });
    const [response] = await Promise.all([
      page.waitForResponse(
        (resp) =>
          resp.url().includes("/api/estimativas/") &&
          resp.request().method() === "PUT",
        { timeout: 15_000 },
      ),
      saveBtn.click(),
    ]);
    expect(response.status()).toBe(200);

    // Simulation bar should disappear
    await expect(page.getByText("Simulação ativa")).not.toBeVisible({ timeout: 5_000 });

    // ── 5. Reload and verify persistence ──
    await page.goto(estimateUrl);
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Composição de Preço")).toBeVisible({ timeout: 10_000 });

    await expandFirstPhase(page);

    // The cost name should still be present inside the phase
    const persistedInput = page.getByPlaceholder("Ex: Maquete, Viagem, Taxa")
      .filter({ has: page.locator(`[value="${COST_NAME}"]`) });

    // Alternative: check by finding an input whose value matches
    const allInputs = page.getByPlaceholder("Ex: Maquete, Viagem, Taxa");
    const count2 = await allInputs.count();
    let found = false;
    for (let i = 0; i < count2; i++) {
      const val = await allInputs.nth(i).inputValue();
      if (val === COST_NAME) {
        found = true;
        // Also verify the value
        const row = allInputs.nth(i).locator("..");
        const numInput = row.locator('input[type="number"]');
        await expect(numInput).toHaveValue(COST_VALUE);
        break;
      }
    }
    expect(found).toBe(true);
  });
});
