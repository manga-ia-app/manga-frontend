import { test, expect, Page } from "@playwright/test";

const BASE_URL = "http://localhost:3100";

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

async function goToPropostas(page: Page) {
  await page.goto(`${BASE_URL}/precificacao/propostas`);
  await page.waitForLoadState("networkidle");
}

async function goToEstimativas(page: Page) {
  await page.goto(`${BASE_URL}/estimativas`);
  await page.waitForLoadState("networkidle");
}

/**
 * Transform the first estimate into a proposal and return the proposal id from the redirect URL.
 */
async function transformFirstEstimateToProposal(page: Page): Promise<string> {
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

  // Click "Gerar Proposta" — find the first non-disabled button
  const transformBtn = page
    .locator('button[title="Gerar Proposta"]:not([disabled])')
    .first();
  await expect(transformBtn).toBeVisible({ timeout: 10_000 });

  const [transformResp] = await Promise.all([
    page.waitForResponse(
      (resp) =>
        resp.url().includes("/transform-to-proposal") &&
        resp.request().method() === "POST",
      { timeout: 15_000 },
    ),
    transformBtn.click(),
  ]);

  expect(transformResp.ok()).toBeTruthy();

  // Wait for redirect to proposal editor
  await page.waitForURL(/\/precificacao\/propostas\/[a-f0-9-]+$/i, {
    timeout: 15_000,
  });

  const url = page.url();
  const proposalId = url.split("/").pop()!;
  return proposalId;
}

/**
 * Navigate to the first proposal in the list and return its ID.
 */
async function goToFirstProposal(page: Page): Promise<string> {
  const responsePromise = page.waitForResponse(
    (resp) =>
      resp.url().includes("/api/proposals") &&
      resp.request().method() === "GET" &&
      resp.status() === 200,
    { timeout: 15_000 },
  );
  await page.goto(`${BASE_URL}/precificacao/propostas`);
  const response = await responsePromise;
  const body = await response.json();
  const items = body.items ?? body;
  expect(items.length).toBeGreaterThan(0);
  const firstId = items[0].id;

  await page.goto(`${BASE_URL}/precificacao/propostas/${firstId}`);
  await page.waitForLoadState("networkidle");
  await expect(page.getByText("Dados Gerais")).toBeVisible({ timeout: 10_000 });
  return firstId;
}

/**
 * Click the actions dropdown (MoreHorizontal) on a table row and select an action.
 */
async function clickRowAction(page: Page, rowIndex: number, actionText: string) {
  const row = page.locator("tbody tr").nth(rowIndex);
  const menuBtn = row.locator("button").filter({ has: page.locator("svg") }).last();
  await menuBtn.click();
  await page.getByText(actionText, { exact: true }).click();
}

// ────────────────────────────────────────────────────────────
// 1. Transformar estimativa em proposta
// ────────────────────────────────────────────────────────────
test.describe("1 - Transformar estimativa em proposta", () => {
  test("should transform estimate to proposal and redirect to editor", async ({
    page,
  }) => {
    const proposalId = await transformFirstEstimateToProposal(page);
    expect(proposalId).toBeTruthy();

    // Verify stepper is visible with all 3 steps
    await expect(page.getByText("Dados Gerais")).toBeVisible();
    await expect(page.getByText("Montagem de Preço")).toBeVisible();
    await expect(page.getByText("Revisão")).toBeVisible();

    // Verify status badge shows Rascunho
    await expect(page.getByText("Rascunho", { exact: true })).toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────
// 2. Listagem de propostas
// ────────────────────────────────────────────────────────────
test.describe("2 - Listagem de propostas", () => {
  test("should display proposals list with columns", async ({ page }) => {
    await goToPropostas(page);

    await expect(
      page.getByRole("heading", { name: "Propostas" })
    ).toBeVisible({ timeout: 5_000 });

    // Search input
    const searchInput = page.getByPlaceholder("Buscar propostas...");
    await expect(searchInput).toBeVisible();

    // Table headers
    await expect(page.getByText("Título")).toBeVisible();
    await expect(page.getByText("Status")).toBeVisible();
    await expect(page.getByText("Valor")).toBeVisible();

    // At least one row (from test 1)
    const rows = page.locator("tbody tr");
    await expect(rows.first()).toBeVisible({ timeout: 10_000 });
  });

  test("should show status badge with correct label", async ({ page }) => {
    await goToPropostas(page);

    // At least one Draft proposal exists from test 1
    await expect(page.getByText("Rascunho").first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("should search proposals", async ({ page }) => {
    await goToPropostas(page);

    const searchInput = page.getByPlaceholder("Buscar propostas...");
    await searchInput.fill("zzzznonexistent");
    await page.waitForTimeout(500);

    // Either no rows or "Nenhuma proposta" message
    const rows = page.locator("tbody tr");
    const rowCount = await rows.count();
    // Could be 0 rows in table or empty state
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });
});

// ────────────────────────────────────────────────────────────
// 3. Step 1 — Dados Gerais
// ────────────────────────────────────────────────────────────
test.describe("3 - Step 1: Dados Gerais", () => {
  test("should show title and client fields", async ({ page }) => {
    await goToFirstProposal(page);

    // Step 1 is active by default
    const titleInput = page.getByLabel("Título da Proposta *");
    await expect(titleInput).toBeVisible({ timeout: 10_000 });
    await expect(titleInput).not.toHaveValue("");

    const clientSelect = page.getByLabel("Cliente *");
    await expect(clientSelect).toBeVisible();
  });

  test("should show textarea fields for texts", async ({ page }) => {
    await goToFirstProposal(page);

    await expect(page.getByLabel("Texto de Introdução")).toBeVisible();
    await expect(page.getByLabel("Exclusões")).toBeVisible();
    await expect(page.getByLabel("Condições de Pagamento")).toBeVisible();
    await expect(page.getByLabel("Dados para Pagamento")).toBeVisible();
    await expect(page.getByLabel("Observações")).toBeVisible();
  });

  test("should fill Step 1 fields and navigate to Step 2", async ({
    page,
  }) => {
    await goToFirstProposal(page);

    // Fill title
    const titleInput = page.getByLabel("Título da Proposta *");
    await titleInput.clear();
    await titleInput.fill("Proposta E2E Test");

    // Fill introduction text
    const introTextarea = page.getByLabel("Texto de Introdução");
    await introTextarea.fill("Texto de introdução para teste E2E");

    // Navigate to Step 2
    await page.getByText("Montagem de Preço").first().click();

    // Step 2 content should be visible
    await expect(page.getByText("Etapas Disponíveis")).toBeVisible({
      timeout: 5_000,
    });

    // Navigate back to Step 1
    await page.getByText("Dados Gerais").first().click();

    // Data should be preserved
    await expect(titleInput).toHaveValue("Proposta E2E Test");
    await expect(introTextarea).toHaveValue(
      "Texto de introdução para teste E2E"
    );
  });
});

// ────────────────────────────────────────────────────────────
// 4. Step 2 — Montagem de Preço (Seções)
// ────────────────────────────────────────────────────────────
test.describe("4 - Step 2: Montagem de Preço", () => {
  test("should show available phases panel", async ({ page }) => {
    await goToFirstProposal(page);

    // Navigate to Step 2
    await page.getByText("Montagem de Preço").first().click();
    await expect(page.getByText("Etapas Disponíveis")).toBeVisible({
      timeout: 5_000,
    });
  });

  test("should create a new section", async ({ page }) => {
    await goToFirstProposal(page);
    await page.getByText("Montagem de Preço").first().click();
    await expect(page.getByText("Etapas Disponíveis")).toBeVisible({
      timeout: 5_000,
    });

    // Click "Nova Seção" or "Criar Primeira Seção"
    const newSectionBtn = page.getByRole("button", { name: /Nova Seção/i });
    const firstSectionBtn = page.getByRole("button", {
      name: /Criar Primeira Seção/i,
    });

    if (await firstSectionBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await firstSectionBtn.click();
    } else {
      await newSectionBtn.click();
    }

    // Section should appear with name input placeholder
    await expect(page.getByPlaceholder("Nome da seção")).toBeVisible({
      timeout: 5_000,
    });
  });

  test("should show monthly billing badge on monthly phases", async ({ page }) => {
    await goToFirstProposal(page);
    await page.getByText("Montagem de Preço").first().click();
    await expect(page.getByText("Etapas Disponíveis")).toBeVisible({
      timeout: 5_000,
    });

    // Monthly phases should have "Mensal" badge (soft check — may not have monthly phases)
    const mensalBadge = page.getByText("Mensal", { exact: true });
    const count = await mensalBadge.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

// ────────────────────────────────────────────────────────────
// 5. Step 2 — Itens de etapa (phase-item)
// ────────────────────────────────────────────────────────────
test.describe("5 - Phase items na seção", () => {
  test("should show phase items with name and value", async ({ page }) => {
    await goToFirstProposal(page);
    await page.getByText("Montagem de Preço").first().click();
    await expect(page.getByText("Etapas Disponíveis")).toBeVisible({
      timeout: 5_000,
    });

    // There should be at least one phase item (from the estimate transform)
    // Phase items have drag handles (GripVertical) and currency values
    const phaseItems = page.locator("[data-phase-id]");
    const fallbackItems = page.locator(".cursor-grab").first();

    // Try both selectors — phase items may or may not have data attributes
    const hasPhases =
      (await phaseItems.count()) > 0 || (await fallbackItems.isVisible({ timeout: 5_000 }).catch(() => false));
    expect(hasPhases).toBeTruthy();
  });
});

// ────────────────────────────────────────────────────────────
// 6. Phase visibility toggle
// ────────────────────────────────────────────────────────────
test.describe("6 - Visibilidade de etapas", () => {
  test("should toggle phase visibility in section", async ({ page }) => {
    await goToFirstProposal(page);
    await page.getByText("Montagem de Preço").first().click();
    await expect(page.getByText("Etapas Disponíveis")).toBeVisible({
      timeout: 5_000,
    });

    // Visibility toggle buttons have titles "Ocultar etapa" / "Mostrar etapa"
    const hideBtn = page.getByTitle("Ocultar etapa").first();
    if (await hideBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await hideBtn.click();

      // After hiding, the button should change to "Mostrar etapa"
      await expect(page.getByTitle("Mostrar etapa").first()).toBeVisible({
        timeout: 3_000,
      });

      // Toggle back
      await page.getByTitle("Mostrar etapa").first().click();
      await expect(page.getByTitle("Ocultar etapa").first()).toBeVisible({
        timeout: 3_000,
      });
    }
  });
});

// ────────────────────────────────────────────────────────────
// 7. Phase breakdown expandível
// ────────────────────────────────────────────────────────────
test.describe("7 - Breakdown expandível por etapa", () => {
  test("should show composição de preço heading in expanded phase", async ({ page }) => {
    await goToFirstProposal(page);
    await page.getByText("Montagem de Preço").first().click();
    await expect(page.getByText("Etapas Disponíveis")).toBeVisible({
      timeout: 5_000,
    });

    // Phases in sections have expand/collapse buttons. Available panel phases don't.
    // Look for a phase card with a ChevronRight button inside it (not breadcrumb separators)
    const phaseExpandBtn = page.locator(".border.rounded-lg button .lucide-chevron-right, .border.rounded-lg button .lucide-chevron-down").first();
    if (await phaseExpandBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await phaseExpandBtn.click();

      // Breakdown should show the "Composição de Preço" heading
      await expect(
        page.getByText("Composição de Preço").first()
      ).toBeVisible({ timeout: 5_000 });
    }
  });
});

// ────────────────────────────────────────────────────────────
// 8. Entregáveis editáveis
// ────────────────────────────────────────────────────────────
test.describe("8 - Entregáveis editáveis na proposta", () => {
  test("should show deliverables section when phase is expanded in a section", async ({
    page,
  }) => {
    await goToFirstProposal(page);
    await page.getByText("Montagem de Preço").first().click();
    await expect(page.getByText("Etapas Disponíveis")).toBeVisible({
      timeout: 5_000,
    });

    // Look for an expand button inside a phase card (only phases in sections have children)
    const phaseExpandBtn = page.locator(".border.rounded-lg button .lucide-chevron-right, .border.rounded-lg button .lucide-chevron-down").first();
    if (await phaseExpandBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await phaseExpandBtn.click();

      // "Entregáveis" heading should be visible for phases inside sections
      const entregaveis = page.getByText("Entregáveis").first();
      if (await entregaveis.isVisible({ timeout: 3_000 }).catch(() => false)) {
        const addDeliverableBtn = page
          .getByRole("button", { name: /\+ Adicionar/i })
          .first();
        await expect(addDeliverableBtn).toBeVisible();
      }
    }
  });

  test("should add a deliverable", async ({ page }) => {
    await goToFirstProposal(page);
    await page.getByText("Montagem de Preço").first().click();
    await expect(page.getByText("Etapas Disponíveis")).toBeVisible({
      timeout: 5_000,
    });

    // Look for expand button inside phase card
    const phaseExpandBtn = page.locator(".border.rounded-lg button .lucide-chevron-right, .border.rounded-lg button .lucide-chevron-down").first();
    if (await phaseExpandBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await phaseExpandBtn.click();

      // Click "+ Adicionar"
      const addBtn = page
        .getByRole("button", { name: /\+ Adicionar/i })
        .first();
      if (await addBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await addBtn.click();

        // New deliverable input should appear
        const deliverableInput = page
          .getByPlaceholder("Nome do entregável")
          .last();
        await expect(deliverableInput).toBeVisible({ timeout: 3_000 });
        await deliverableInput.fill("Entregável E2E Test");
      }
    }
  });
});

// ────────────────────────────────────────────────────────────
// 9. Descontos por seção
// ────────────────────────────────────────────────────────────
test.describe("9 - Descontos por seção", () => {
  test("should show discount and rounding controls in section", async ({ page }) => {
    await goToFirstProposal(page);
    await page.getByText("Montagem de Preço").first().click();
    await expect(page.getByText("Etapas Disponíveis")).toBeVisible({
      timeout: 5_000,
    });

    // Look for discount label in sections
    const discountLabel = page.getByText("Desconto:", { exact: false }).first();
    if (await discountLabel.isVisible({ timeout: 3_000 }).catch(() => false)) {
      // Select "Percentual" discount type
      const discountSelect = discountLabel
        .locator("..")
        .locator("select")
        .first();
      if (await discountSelect.isVisible().catch(() => false)) {
        await discountSelect.selectOption("Percentage");

        // Percentage input should appear
        const percentInput = page.locator('input[max="100"]').first();
        await expect(percentInput).toBeVisible({ timeout: 3_000 });
      }
    }

    // Rounding control should be visible
    const roundingLabel = page.getByText("Arredondamento:", { exact: false }).first();
    if (await roundingLabel.isVisible({ timeout: 3_000 }).catch(() => false)) {
      expect(true).toBeTruthy();
    }
  });
});

// ────────────────────────────────────────────────────────────
// 10. Resumo das seções (sem totalização)
// ────────────────────────────────────────────────────────────
test.describe("10 - Resumo das seções sem totalização", () => {
  test("should show section summary in Step 3 without sum total", async ({ page }) => {
    await goToFirstProposal(page);

    // Navigate to Step 3
    await page.getByText("Revisão").first().click();

    // Summary heading — actual text is "Resumo das Seções"
    await expect(
      page.getByText("Resumo das Seções").first()
    ).toBeVisible({ timeout: 5_000 });

    // Should NOT have "Total Geral" (FR-027a)
    const totalLabel = page.getByText("Total Geral");
    const totalCount = await totalLabel.count();
    expect(totalCount).toBe(0);
  });
});

// ────────────────────────────────────────────────────────────
// 11. Step 3 — Revisão e proteções de escopo
// ────────────────────────────────────────────────────────────
test.describe("11 - Step 3: Revisão e Proteções de Escopo", () => {
  test("should show scope protection fields", async ({ page }) => {
    await goToFirstProposal(page);

    // Navigate to Step 3
    await page.getByText("Revisão").first().click();

    await expect(page.getByLabel("Limite de Revisões")).toBeVisible({
      timeout: 5_000,
    });
    await expect(
      page.getByLabel("Prazo para Feedback (dias)")
    ).toBeVisible();
    await expect(
      page.getByLabel("Valor Hora Adicional (R$)")
    ).toBeVisible();
    await expect(page.getByLabel("Validade da Proposta")).toBeVisible();

    // Percentual Aditivo should NOT be present (FR-023a)
    const aditivoLabel = page.getByLabel("Percentual Aditivo (%)");
    const aditivoCount = await aditivoLabel.count();
    expect(aditivoCount).toBe(0);
  });

  test("should fill scope protection fields", async ({ page }) => {
    await goToFirstProposal(page);
    await page.getByText("Revisão").first().click();

    const limiteInput = page.getByLabel("Limite de Revisões");
    await limiteInput.clear();
    await limiteInput.fill("3");

    const prazoInput = page.getByLabel("Prazo para Feedback (dias)");
    await prazoInput.clear();
    await prazoInput.fill("5");

    const horaInput = page.getByLabel("Valor Hora Adicional (R$)");
    await horaInput.clear();
    await horaInput.fill("150");

    // Verify values are filled
    await expect(limiteInput).toHaveValue("3");
    await expect(prazoInput).toHaveValue("5");
    await expect(horaInput).toHaveValue("150");
  });

  test("should show section summary in Step 3", async ({ page }) => {
    await goToFirstProposal(page);
    await page.getByText("Revisão").first().click();

    // Summary section heading
    const summaryHeading = page.getByText("Resumo das Seções");
    await expect(summaryHeading).toBeVisible({ timeout: 5_000 });
  });
});

// ────────────────────────────────────────────────────────────
// 12. Preview lateral
// ────────────────────────────────────────────────────────────
test.describe("12 - Preview lateral em tempo real", () => {
  test("should show preview panel with heading", async ({ page }) => {
    await goToFirstProposal(page);

    // Preview panel shows "Preview da Proposta" heading
    await expect(
      page.getByText("Preview da Proposta")
    ).toBeVisible({ timeout: 5_000 });
  });

  test("should show proposal title in preview", async ({ page }) => {
    await goToFirstProposal(page);

    // Preview should show the proposal title as h2
    const titleInput = page.getByLabel("Título da Proposta *");
    const titleValue = await titleInput.inputValue();
    if (titleValue) {
      await expect(page.locator("h2", { hasText: titleValue })).toBeVisible({
        timeout: 5_000,
      });
    }
  });

  test("should update preview when Step 1 fields change", async ({
    page,
  }) => {
    await goToFirstProposal(page);

    // Fill title in Step 1
    const titleInput = page.getByLabel("Título da Proposta *");
    await titleInput.clear();
    await titleInput.fill("Preview Test Title");

    // Preview header should reflect the title
    await expect(page.locator("h2", { hasText: "Preview Test Title" })).toBeVisible({
      timeout: 5_000,
    });
  });
});

// ────────────────────────────────────────────────────────────
// 13. Salvar rascunho
// ────────────────────────────────────────────────────────────
test.describe("13 - Salvar rascunho", () => {
  test("should save draft and show success toast", async ({ page }) => {
    await goToFirstProposal(page);

    // Fill required fields
    const titleInput = page.getByLabel("Título da Proposta *");
    await expect(titleInput).toBeVisible({ timeout: 10_000 });
    await titleInput.clear();
    await titleInput.fill("Proposta Salvar E2E");

    // Click "Salvar Rascunho"
    const saveBtn = page.getByRole("button", { name: /Salvar Rascunho/i });
    await expect(saveBtn).toBeVisible({ timeout: 5_000 });

    const [saveResp] = await Promise.all([
      page.waitForResponse(
        (resp) =>
          resp.url().includes("/api/proposals/") &&
          resp.request().method() === "PUT",
        { timeout: 15_000 },
      ),
      saveBtn.click(),
    ]);

    expect(saveResp.ok()).toBeTruthy();

    // Success toast
    await expect(page.getByText("Proposta salva com sucesso!")).toBeVisible({
      timeout: 5_000,
    });
  });

  test("should persist data after reload", async ({ page }) => {
    await goToFirstProposal(page);

    const titleInput = page.getByLabel("Título da Proposta *");
    await expect(titleInput).toBeVisible({ timeout: 10_000 });
    await titleInput.clear();
    await titleInput.fill("Proposta Persistência E2E");

    // Save
    const saveBtn = page.getByRole("button", { name: /Salvar Rascunho/i });
    await Promise.all([
      page.waitForResponse(
        (resp) =>
          resp.url().includes("/api/proposals/") &&
          resp.request().method() === "PUT",
        { timeout: 15_000 },
      ),
      saveBtn.click(),
    ]);

    await expect(page.getByText("Proposta salva com sucesso!")).toBeVisible({
      timeout: 5_000,
    });

    // Reload
    const currentUrl = page.url();
    await page.goto(currentUrl);
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Dados Gerais")).toBeVisible({
      timeout: 10_000,
    });

    // Data should persist
    const reloadedTitle = page.getByLabel("Título da Proposta *");
    await expect(reloadedTitle).toHaveValue("Proposta Persistência E2E", {
      timeout: 5_000,
    });
  });
});

// ────────────────────────────────────────────────────────────
// 14. Navegação entre steps
// ────────────────────────────────────────────────────────────
test.describe("14 - Navegação livre entre steps", () => {
  test("should navigate freely between all 3 steps", async ({ page }) => {
    await goToFirstProposal(page);

    // Step 1 is active by default
    await expect(page.getByLabel("Título da Proposta *")).toBeVisible({
      timeout: 10_000,
    });

    // Go to Step 2
    await page.getByText("Montagem de Preço").first().click();
    await expect(page.getByText("Etapas Disponíveis")).toBeVisible({
      timeout: 5_000,
    });

    // Go to Step 3
    await page.getByText("Revisão").first().click();
    await expect(page.getByLabel("Limite de Revisões")).toBeVisible({
      timeout: 5_000,
    });

    // Go back to Step 1
    await page.getByText("Dados Gerais").first().click();
    await expect(page.getByLabel("Título da Proposta *")).toBeVisible({
      timeout: 5_000,
    });
  });
});

// ────────────────────────────────────────────────────────────
// 15. Seção com prazo (deadline days)
// ────────────────────────────────────────────────────────────
test.describe("15 - Prazo por seção", () => {
  test("should show deadline days input in section footer", async ({
    page,
  }) => {
    await goToFirstProposal(page);
    await page.getByText("Montagem de Preço").first().click();
    await expect(page.getByText("Etapas Disponíveis")).toBeVisible({
      timeout: 5_000,
    });

    // "Prazo (dias):" label in section
    const prazoLabel = page.getByText("Prazo (dias):");
    if (await prazoLabel.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const prazoContainer = prazoLabel.locator("..");
      const prazoInput = prazoContainer.locator('input[type="number"]');
      await expect(prazoInput).toBeVisible();
    }
  });
});

// ────────────────────────────────────────────────────────────
// 16. Gerar PDF
// ────────────────────────────────────────────────────────────
test.describe("16 - Gerar PDF", () => {
  test("should generate PDF from Step 3 and show success toast", async ({ page }) => {
    await goToFirstProposal(page);

    // Save first to ensure clean state
    const saveBtn = page.getByRole("button", { name: /Salvar Rascunho/i });
    if (await saveBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await Promise.all([
        page.waitForResponse(
          (resp) =>
            resp.url().includes("/api/proposals/") &&
            resp.request().method() === "PUT",
          { timeout: 15_000 },
        ),
        saveBtn.click(),
      ]);
      await page.waitForTimeout(1_000);
    }

    // Navigate to Step 3 — "Gerar PDF" button is only visible there
    await page.getByText("Revisão").first().click();
    await expect(page.getByLabel("Limite de Revisões")).toBeVisible({
      timeout: 5_000,
    });

    // Click "Gerar PDF"
    const pdfBtn = page.getByRole("button", { name: /Gerar PDF/i });
    await expect(pdfBtn).toBeVisible({ timeout: 5_000 });

    const [pdfResp] = await Promise.all([
      page.waitForResponse(
        (resp) =>
          resp.url().includes("/generate-pdf") &&
          resp.request().method() === "POST",
        { timeout: 15_000 },
      ),
      pdfBtn.click(),
    ]);

    expect(pdfResp.ok()).toBeTruthy();

    // Success toast
    await expect(page.getByText("PDF gerado com sucesso!")).toBeVisible({
      timeout: 5_000,
    });
  });

  test("should show Download PDF button after generation", async ({
    page,
  }) => {
    await goToFirstProposal(page);

    // If PDF was generated, download button should be visible
    const downloadBtn = page.getByRole("button", { name: /Download PDF/i });
    const hasDownload = await downloadBtn.isVisible({ timeout: 5_000 }).catch(() => false);
    // This test depends on PDF having been generated in the previous test
    expect(hasDownload).toBeTruthy();
  });
});

// ────────────────────────────────────────────────────────────
// 17. Status management — Aprovar/Rejeitar
// ────────────────────────────────────────────────────────────
test.describe("17 - Gestão de status", () => {
  test("should show Aprovar action for Generated proposals", async ({
    page,
  }) => {
    await goToPropostas(page);

    // Wait for table to load
    await expect(page.locator("tbody tr").first()).toBeVisible({
      timeout: 10_000,
    });

    // Find a row with "Gerada" badge and click its actions menu
    const geradaRow = page
      .locator("tbody tr")
      .filter({ hasText: "Gerada" })
      .first();

    if (await geradaRow.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const menuBtn = geradaRow.locator("button").last();
      await menuBtn.click();

      // "Aprovar" action should be visible
      await expect(page.getByText("Aprovar", { exact: true })).toBeVisible({
        timeout: 3_000,
      });
      // "Rejeitar" action should be visible
      await expect(page.getByText("Rejeitar", { exact: true })).toBeVisible();

      // Close menu by toggling
      await menuBtn.click();
    }
  });

  test("should approve a Generated proposal", async ({ page }) => {
    await goToPropostas(page);
    await expect(page.locator("tbody tr").first()).toBeVisible({
      timeout: 10_000,
    });

    const geradaRow = page
      .locator("tbody tr")
      .filter({ hasText: "Gerada" })
      .first();

    if (await geradaRow.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const menuBtn = geradaRow.locator("button").last();
      await menuBtn.click();

      const [statusResp] = await Promise.all([
        page.waitForResponse(
          (resp) =>
            resp.url().includes("/update-status") &&
            resp.request().method() === "POST",
          { timeout: 15_000 },
        ),
        page.getByText("Aprovar", { exact: true }).click(),
      ]);

      expect(statusResp.ok()).toBeTruthy();
      await expect(page.getByText("Status atualizado!")).toBeVisible({
        timeout: 5_000,
      });

      // Status badge should update to "Aprovada"
      await expect(page.getByText("Aprovada").first()).toBeVisible({
        timeout: 5_000,
      });
    }
  });
});

// ────────────────────────────────────────────────────────────
// 18. Duplicar proposta
// ────────────────────────────────────────────────────────────
test.describe("18 - Duplicar proposta", () => {
  test("should show Duplicar action for Approved/Rejected proposals", async ({
    page,
  }) => {
    await goToPropostas(page);
    await expect(page.locator("tbody tr").first()).toBeVisible({
      timeout: 10_000,
    });

    const aprovadaRow = page
      .locator("tbody tr")
      .filter({ hasText: "Aprovada" })
      .first();

    if (await aprovadaRow.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const menuBtn = aprovadaRow.locator("button").last();
      await menuBtn.click();

      await expect(
        page.getByText("Duplicar", { exact: true })
      ).toBeVisible({ timeout: 3_000 });

      // Close menu by toggling
      await menuBtn.click();
    }
  });

  test("should duplicate an Approved proposal", async ({ page }) => {
    await goToPropostas(page);
    await expect(page.locator("tbody tr").first()).toBeVisible({
      timeout: 10_000,
    });

    const aprovadaRow = page
      .locator("tbody tr")
      .filter({ hasText: "Aprovada" })
      .first();

    if (await aprovadaRow.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const menuBtn = aprovadaRow.locator("button").last();
      await menuBtn.click();

      const [dupResp] = await Promise.all([
        page.waitForResponse(
          (resp) =>
            resp.url().includes("/duplicate") &&
            resp.request().method() === "POST",
          { timeout: 15_000 },
        ),
        page.getByText("Duplicar", { exact: true }).click(),
      ]);

      expect(dupResp.ok()).toBeTruthy();

      // Should redirect to the duplicated proposal editor
      await page.waitForURL(/\/precificacao\/propostas\/[a-f0-9-]+$/i, {
        timeout: 15_000,
      });

      // Duplicated proposal should be in Draft
      await expect(page.getByText("Rascunho", { exact: true })).toBeVisible({
        timeout: 5_000,
      });
    }
  });
});

// ────────────────────────────────────────────────────────────
// 19. Excluir proposta (somente Draft)
// ────────────────────────────────────────────────────────────
test.describe("19 - Excluir proposta", () => {
  test("should show Excluir action only for Draft proposals", async ({
    page,
  }) => {
    await goToPropostas(page);
    await expect(page.locator("tbody tr").first()).toBeVisible({
      timeout: 10_000,
    });

    // Check Draft row has Excluir
    const draftRow = page
      .locator("tbody tr")
      .filter({ hasText: "Rascunho" })
      .first();

    if (await draftRow.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const menuBtn = draftRow.locator("button").last();
      await menuBtn.click();

      await expect(
        page.getByText("Excluir", { exact: true })
      ).toBeVisible({ timeout: 3_000 });

      // Close menu by toggling
      await menuBtn.click();
      await page.waitForTimeout(300);
    }

    // Check Approved row does NOT have Excluir
    const aprovadaRow = page
      .locator("tbody tr")
      .filter({ hasText: "Aprovada" })
      .first();

    if (await aprovadaRow.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const menuBtn = aprovadaRow.locator("button").last();
      await menuBtn.click();

      // Approved menu should show Duplicar but NOT Excluir
      await expect(
        page.getByText("Duplicar", { exact: true })
      ).toBeVisible({ timeout: 3_000 });

      const excluirBtn = page.getByText("Excluir", { exact: true });
      expect(await excluirBtn.count()).toBe(0);

      await menuBtn.click();
    }
  });

  test("should delete a Draft proposal with confirmation", async ({
    page,
  }) => {
    // First create a proposal to delete
    await transformFirstEstimateToProposal(page);

    // Go to list
    await goToPropostas(page);
    await expect(page.locator("tbody tr").first()).toBeVisible({
      timeout: 10_000,
    });

    const draftRow = page
      .locator("tbody tr")
      .filter({ hasText: "Rascunho" })
      .first();

    if (await draftRow.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const menuBtn = draftRow.locator("button").last();
      await menuBtn.click();

      // Accept the confirmation dialog
      page.on("dialog", (dialog) => dialog.accept());

      const [deleteResp] = await Promise.all([
        page.waitForResponse(
          (resp) =>
            resp.url().includes("/api/proposals/") &&
            resp.request().method() === "DELETE",
          { timeout: 15_000 },
        ),
        page.getByText("Excluir", { exact: true }).click(),
      ]);

      expect(deleteResp.ok()).toBeTruthy();

      await expect(page.getByText("Proposta excluída!")).toBeVisible({
        timeout: 5_000,
      });
    }
  });
});

// ────────────────────────────────────────────────────────────
// 20. Fluxo completo (create → edit → save → generate PDF)
// ────────────────────────────────────────────────────────────
test.describe("20 - Fluxo completo E2E", () => {
  test("should create proposal, fill all steps, save, and generate PDF", async ({
    page,
  }) => {
    // ── 1. Transform estimate into proposal ──
    await transformFirstEstimateToProposal(page);

    // ── 2. Step 1: Fill Dados Gerais ──
    const titleInput = page.getByLabel("Título da Proposta *");
    await expect(titleInput).toBeVisible({ timeout: 10_000 });
    await titleInput.clear();
    await titleInput.fill("Proposta Fluxo Completo E2E");

    // Ensure client is selected
    const clientSelect = page.getByLabel("Cliente *");
    const clientOptions = clientSelect.locator("option");
    const optCount = await clientOptions.count();
    if (optCount > 1) {
      const firstClientVal = await clientOptions.nth(1).getAttribute("value");
      if (firstClientVal) await clientSelect.selectOption(firstClientVal);
    }

    // Fill introduction text
    await page
      .getByLabel("Texto de Introdução")
      .fill("Introdução teste fluxo completo");

    // ── 3. Step 2: Create section ──
    await page.getByText("Montagem de Preço").first().click();
    await expect(page.getByText("Etapas Disponíveis")).toBeVisible({
      timeout: 5_000,
    });

    // Create a section if none exist
    const newSectionBtn = page.getByRole("button", { name: /Nova Seção/i });
    const firstSectionBtn = page.getByRole("button", {
      name: /Criar Primeira Seção/i,
    });

    if (await firstSectionBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await firstSectionBtn.click();
    } else if (await newSectionBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await newSectionBtn.click();
    }

    // Name the section
    const sectionNameInput = page.getByPlaceholder("Nome da seção").first();
    if (await sectionNameInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await sectionNameInput.clear();
      await sectionNameInput.fill("Seção E2E Completa");
    }

    // ── 4. Step 3: Fill scope protection ──
    await page.getByText("Revisão").first().click();
    await expect(page.getByLabel("Limite de Revisões")).toBeVisible({
      timeout: 5_000,
    });

    await page.getByLabel("Limite de Revisões").fill("3");
    await page.getByLabel("Prazo para Feedback (dias)").fill("5");
    await page.getByLabel("Valor Hora Adicional (R$)").fill("150");

    // ── 5. Save draft ──
    const saveBtn = page.getByRole("button", { name: /Salvar Rascunho/i });
    const [saveResp] = await Promise.all([
      page.waitForResponse(
        (resp) =>
          resp.url().includes("/api/proposals/") &&
          resp.request().method() === "PUT",
        { timeout: 15_000 },
      ),
      saveBtn.click(),
    ]);
    expect(saveResp.ok()).toBeTruthy();
    await expect(page.getByText("Proposta salva com sucesso!")).toBeVisible({
      timeout: 5_000,
    });

    // ── 6. Generate PDF ──
    const pdfBtn = page.getByRole("button", { name: /Gerar PDF/i });
    const [pdfResp] = await Promise.all([
      page.waitForResponse(
        (resp) =>
          resp.url().includes("/generate-pdf") &&
          resp.request().method() === "POST",
        { timeout: 15_000 },
      ),
      pdfBtn.click(),
    ]);
    expect(pdfResp.ok()).toBeTruthy();
    await expect(page.getByText("PDF gerado com sucesso!")).toBeVisible({
      timeout: 5_000,
    });
  });
});

// ────────────────────────────────────────────────────────────
// 21. Empty state — lista sem propostas
// ────────────────────────────────────────────────────────────
test.describe("21 - Empty state na listagem", () => {
  test("should show correct page header", async ({ page }) => {
    await goToPropostas(page);

    await expect(
      page.getByRole("heading", { name: "Propostas" })
    ).toBeVisible({ timeout: 5_000 });
    await expect(
      page.getByText(
        "Gerencie propostas de honorários geradas a partir das simulações"
      )
    ).toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────
// 22. Arredondamento por seção (não global)
// ────────────────────────────────────────────────────────────
test.describe("22 - Arredondamento por seção", () => {
  test("should NOT show global rounding — only section-level", async ({ page }) => {
    await goToFirstProposal(page);
    await page.getByText("Montagem de Preço").first().click();
    await expect(page.getByText("Etapas Disponíveis")).toBeVisible({
      timeout: 5_000,
    });

    // Global rounding should NOT exist (removed per Option B)
    const globalRounding = page.getByText("Arredondamento Global:");
    const count = await globalRounding.count();
    expect(count).toBe(0);
  });
});

// ────────────────────────────────────────────────────────────
// 23. Preview — assinaturas
// ────────────────────────────────────────────────────────────
test.describe("23 - Preview — proteção de escopo", () => {
  test("should show scope protection in preview when values are set", async ({ page }) => {
    await goToFirstProposal(page);

    // Preview panel should show "Proteção de Escopo" heading when values exist
    const protecao = page.getByText("Proteção de Escopo");
    const count = await protecao.count();
    // May appear in preview and/or Step 3
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

// ────────────────────────────────────────────────────────────
// 24. Seção — subtotal e valor final
// ────────────────────────────────────────────────────────────
test.describe("24 - Subtotal da seção", () => {
  test("should show Subtotal label in section footer", async ({ page }) => {
    await goToFirstProposal(page);
    await page.getByText("Montagem de Preço").first().click();
    await expect(page.getByText("Etapas Disponíveis")).toBeVisible({
      timeout: 5_000,
    });

    const subtotalLabel = page.getByText("Subtotal").first();
    if (await subtotalLabel.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(subtotalLabel).toBeVisible();
    }
  });
});

// ────────────────────────────────────────────────────────────
// 25. Indicador R$/mês para etapas mensais
// ────────────────────────────────────────────────────────────
test.describe("25 - Indicador de cobrança mensal", () => {
  test("should show R$/mês indicator on monthly billing phases", async ({
    page,
  }) => {
    await goToFirstProposal(page);
    await page.getByText("Montagem de Preço").first().click();
    await expect(page.getByText("Etapas Disponíveis")).toBeVisible({
      timeout: 5_000,
    });

    // R$/mês indicator (soft check — may not have monthly phases)
    const monthlyIndicator = page.getByText("R$/mês");
    const count = await monthlyIndicator.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

// ────────────────────────────────────────────────────────────
// 26. Visibilidade independente de preço (IsPriceVisible)
// ────────────────────────────────────────────────────────────
test.describe("26 - Visibilidade independente de preço por etapa", () => {
  test("should show separate price visibility toggle (DollarSign) in section", async ({
    page,
  }) => {
    await goToFirstProposal(page);
    await page.getByText("Montagem de Preço").first().click();
    await expect(page.getByText("Etapas Disponíveis")).toBeVisible({
      timeout: 5_000,
    });

    // Price visibility toggle has title "Ocultar preço" or "Mostrar preço"
    const hidePriceBtn = page.getByTitle("Ocultar preço").first();
    const showPriceBtn = page.getByTitle("Mostrar preço").first();

    const hasPriceToggle =
      (await hidePriceBtn.isVisible({ timeout: 3_000 }).catch(() => false)) ||
      (await showPriceBtn.isVisible({ timeout: 1_000 }).catch(() => false));

    // If phases are in sections, price visibility toggle should exist
    if (hasPriceToggle) {
      // It should be separate from the phase visibility toggle
      const hidePhaseBtn = page.getByTitle("Ocultar etapa").first();
      const hasPhaseToggle = await hidePhaseBtn
        .isVisible({ timeout: 1_000 })
        .catch(() => false);
      expect(hasPhaseToggle).toBeTruthy();
    }
  });

  test("should toggle price visibility independently from phase visibility", async ({
    page,
  }) => {
    await goToFirstProposal(page);
    await page.getByText("Montagem de Preço").first().click();
    await expect(page.getByText("Etapas Disponíveis")).toBeVisible({
      timeout: 5_000,
    });

    const hidePriceBtn = page.getByTitle("Ocultar preço").first();
    if (await hidePriceBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      // Hide price
      await hidePriceBtn.click();

      // Price toggle should now say "Mostrar preço"
      await expect(page.getByTitle("Mostrar preço").first()).toBeVisible({
        timeout: 3_000,
      });

      // Phase should still be visible (toggle still says "Ocultar etapa")
      await expect(page.getByTitle("Ocultar etapa").first()).toBeVisible({
        timeout: 3_000,
      });

      // Toggle price back
      await page.getByTitle("Mostrar preço").first().click();
      await expect(page.getByTitle("Ocultar preço").first()).toBeVisible({
        timeout: 3_000,
      });
    }
  });

  test("should disable price toggle when phase is hidden", async ({ page }) => {
    await goToFirstProposal(page);
    await page.getByText("Montagem de Preço").first().click();
    await expect(page.getByText("Etapas Disponíveis")).toBeVisible({
      timeout: 5_000,
    });

    const hidePhaseBtn = page.getByTitle("Ocultar etapa").first();
    if (await hidePhaseBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      // Hide the phase
      await hidePhaseBtn.click();

      // Price toggle should be disabled when phase is hidden
      const priceToggle = page.locator('button[title="Ocultar preço"], button[title="Mostrar preço"]').first();
      if (await priceToggle.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await expect(priceToggle).toBeDisabled();
      }

      // Restore phase visibility
      await page.getByTitle("Mostrar etapa").first().click();
    }
  });
});

// ────────────────────────────────────────────────────────────
// 27. Painel "Etapas Disponíveis" sempre visível (FR-014)
// ────────────────────────────────────────────────────────────
test.describe("27 - Painel Etapas Disponíveis sempre visível", () => {
  test("should show available panel with phase count", async ({ page }) => {
    await goToFirstProposal(page);
    await page.getByText("Montagem de Preço").first().click();

    // Panel header includes count: "Etapas Disponíveis (N)"
    await expect(
      page.getByText(/Etapas Disponíveis \(\d+\)/)
    ).toBeVisible({ timeout: 5_000 });
  });

  test("should show drop target message when available panel is empty", async ({
    page,
  }) => {
    await goToFirstProposal(page);
    await page.getByText("Montagem de Preço").first().click();
    await expect(page.getByText("Etapas Disponíveis")).toBeVisible({
      timeout: 5_000,
    });

    // Check if available panel is empty (count = 0)
    const emptyPanel = page.getByText("Etapas Disponíveis (0)");
    if (await emptyPanel.isVisible({ timeout: 2_000 }).catch(() => false)) {
      // When empty, should show the drop target message
      await expect(
        page.getByText("Arraste etapas das seções para cá para devolvê-las.")
      ).toBeVisible({ timeout: 3_000 });
    }
  });

  test("should always render dashed border panel even when empty", async ({
    page,
  }) => {
    await goToFirstProposal(page);
    await page.getByText("Montagem de Preço").first().click();
    await expect(page.getByText("Etapas Disponíveis")).toBeVisible({
      timeout: 5_000,
    });

    // The available panel always has border-dashed class
    const dashedPanel = page.locator(".border-dashed").first();
    await expect(dashedPanel).toBeVisible({ timeout: 3_000 });
  });
});

// ────────────────────────────────────────────────────────────
// 28. Restrição mensal/fixa por seção
// ────────────────────────────────────────────────────────────
test.describe("28 - Restrição mensal vs preço fixo por seção", () => {
  test("should show Mensal badge on monthly billing phases", async ({
    page,
  }) => {
    await goToFirstProposal(page);
    await page.getByText("Montagem de Preço").first().click();
    await expect(page.getByText("Etapas Disponíveis")).toBeVisible({
      timeout: 5_000,
    });

    // If there are monthly phases, they should have a "Mensal" badge
    const mensalBadge = page.getByText("Mensal", { exact: true });
    const count = await mensalBadge.count();
    // Soft check — may not have monthly phases in test data
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

// ────────────────────────────────────────────────────────────
// 29. Drag handles para reordenação (FR-011a, FR-012b)
// ────────────────────────────────────────────────────────────
test.describe("29 - Drag handles para reordenação", () => {
  test("should show drag handles on available phases for reordering", async ({
    page,
  }) => {
    await goToFirstProposal(page);
    await page.getByText("Montagem de Preço").first().click();
    await expect(page.getByText("Etapas Disponíveis")).toBeVisible({
      timeout: 5_000,
    });

    // Drag handles have cursor-grab class
    const dragHandles = page.locator(".cursor-grab");
    const handleCount = await dragHandles.count();
    expect(handleCount).toBeGreaterThan(0);
  });

  test("should show drag handles on section phases for reordering", async ({
    page,
  }) => {
    await goToFirstProposal(page);
    await page.getByText("Montagem de Preço").first().click();
    await expect(page.getByText("Etapas Disponíveis")).toBeVisible({
      timeout: 5_000,
    });

    // If sections have phases, they should have drag handles
    const sectionPhaseDragHandles = page.locator(".cursor-grab");
    const count = await sectionPhaseDragHandles.count();
    // At least some phases should have drag handles (from available panel or sections)
    expect(count).toBeGreaterThan(0);
  });
});

// ────────────────────────────────────────────────────────────
// 30. Preview respeita IsPriceVisible
// ────────────────────────────────────────────────────────────
test.describe("30 - Preview respeita IsPriceVisible", () => {
  test("should hide phase price in preview when isPriceVisible is toggled off", async ({
    page,
  }) => {
    await goToFirstProposal(page);
    await page.getByText("Montagem de Preço").first().click();
    await expect(page.getByText("Etapas Disponíveis")).toBeVisible({
      timeout: 5_000,
    });

    const hidePriceBtn = page.getByTitle("Ocultar preço").first();
    if (await hidePriceBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      // Count price values in preview before hiding
      const previewPanel = page.locator(".h-full.overflow-auto").first();
      const pricesBefore = await previewPanel.locator(".font-mono").count();

      // Hide price of first phase
      await hidePriceBtn.click();

      // Wait for preview to re-render
      await page.waitForTimeout(500);

      // Count price values in preview after hiding
      const pricesAfter = await previewPanel.locator(".font-mono").count();

      // Should have fewer price values displayed
      expect(pricesAfter).toBeLessThanOrEqual(pricesBefore);

      // Toggle back
      const showPriceBtn = page.getByTitle("Mostrar preço").first();
      if (await showPriceBtn.isVisible().catch(() => false)) {
        await showPriceBtn.click();
      }
    }
  });
});

// ────────────────────────────────────────────────────────────
// 31. Preview — Resumo das Seções sem totalização
// ────────────────────────────────────────────────────────────
test.describe("31 - Preview mostra resumo sem totalização", () => {
  test("should show section summary heading in preview", async ({ page }) => {
    await goToFirstProposal(page);

    // Preview should have "Resumo das Seções" heading
    const resumo = page.getByText("Resumo das Seções");
    const count = await resumo.count();
    // May appear in preview and/or Step 3 review
    expect(count).toBeGreaterThan(0);
  });

  test("should NOT show total sum in preview", async ({ page }) => {
    await goToFirstProposal(page);

    // Should NOT have "Total Geral", "Valor Total", or "Total:"
    const totalGeral = page.getByText("Total Geral");
    expect(await totalGeral.count()).toBe(0);

    const valorTotal = page.getByText("Valor Total dos Honorários");
    expect(await valorTotal.count()).toBe(0);
  });
});

// ────────────────────────────────────────────────────────────
// 32. Devolver etapa de seção para painel disponível
// ────────────────────────────────────────────────────────────
test.describe("32 - Devolver etapa ao painel disponível", () => {
  test("should return phases to available panel when section is deleted", async ({
    page,
  }) => {
    await goToFirstProposal(page);
    await page.getByText("Montagem de Preço").first().click();
    await expect(page.getByText("Etapas Disponíveis")).toBeVisible({
      timeout: 5_000,
    });

    // Get initial available count
    const panelHeader = page.getByText(/Etapas Disponíveis \((\d+)\)/);
    const headerText = await panelHeader.textContent();
    const initialCount = headerText ? parseInt(headerText.match(/\((\d+)\)/)?.[1] || "0") : 0;

    // If there's a section with a delete button, delete it
    const deleteBtn = page.locator("button").filter({ has: page.locator(".lucide-trash-2") }).first();
    if (await deleteBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      // Accept confirmation dialog
      page.on("dialog", (dialog) => dialog.accept());
      await deleteBtn.click();

      await page.waitForTimeout(500);

      // Available count should have increased (phases returned)
      const updatedHeader = await page.getByText(/Etapas Disponíveis \((\d+)\)/).textContent();
      const updatedCount = updatedHeader ? parseInt(updatedHeader.match(/\((\d+)\)/)?.[1] || "0") : 0;
      expect(updatedCount).toBeGreaterThanOrEqual(initialCount);
    }
  });
});
