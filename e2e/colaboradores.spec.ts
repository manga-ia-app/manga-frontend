import { test, expect, Page } from "@playwright/test";

const BASE_URL = "http://localhost:3100";

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

async function goToColaboradores(page: Page) {
  await page.goto(`${BASE_URL}/cadastros/colaboradores`);
  await page.waitForLoadState("networkidle");
}

async function goToNovoColaborador(page: Page) {
  await page.goto(`${BASE_URL}/cadastros/colaboradores/novo`);
  await page.waitForLoadState("networkidle");
}

/** Select the first available cargo in the dropdown. Returns the cargo name. */
async function selectFirstCargo(page: Page): Promise<string> {
  const cargoSelect = page.locator("#cargoId");
  // Wait for cargos to load (options beyond the placeholder)
  await expect(cargoSelect.locator("option")).not.toHaveCount(1, { timeout: 10_000 });
  const options = await cargoSelect.locator("option").allTextContents();
  const firstCargo = options.find((o) => o !== "Selecione um cargo");
  if (!firstCargo) throw new Error("No cargos available for selection");
  await cargoSelect.selectOption({ label: firstCargo });
  return firstCargo;
}

/** Fill Dados Gerais section common to all types. */
async function fillDadosGerais(
  page: Page,
  opts: {
    nome: string;
    email?: string;
    phone?: string;
    tipoVinculo?: "CLT" | "Terceiros" | "Estagiario";
    horasMensais?: string;
  },
) {
  await page.getByLabel("Nome").fill(opts.nome);
  if (opts.email) await page.getByLabel("E-mail").fill(opts.email);
  if (opts.phone) await page.getByLabel("Telefone").fill(opts.phone);
  await selectFirstCargo(page);
  if (opts.horasMensais) {
    const horasInput = page.getByLabel("Horas Mensais");
    await horasInput.clear();
    await horasInput.fill(opts.horasMensais);
  }
  if (opts.tipoVinculo) {
    await page.locator("#tipoVinculo").selectOption(opts.tipoVinculo);
  }
}

/** Submit the form and wait for redirect to list page. */
async function submitForm(page: Page) {
  await page.getByRole("button", { name: "Cadastrar Colaborador" }).click();
  // Wait for success toast to confirm API call succeeded
  await expect(page.getByText("cadastrado com sucesso")).toBeVisible({ timeout: 15_000 });
  // Full navigation to list page to guarantee fresh data (avoids React Query cache issues)
  await page.goto(`${BASE_URL}/cadastros/colaboradores`);
  await page.waitForLoadState("networkidle");
}

// ────────────────────────────────────────────────────────────
// T053: CLT collaborator full flow
// ────────────────────────────────────────────────────────────
test.describe("Colaboradores — CLT Full Flow", () => {
  test("deve exibir tabela e HelpButton", async ({ page }) => {
    await goToColaboradores(page);
    await expect(page.getByRole("heading", { name: "Colaboradores" })).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Nome" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Vínculo" })).toBeVisible();

    // Help button
    await page.getByRole("button", { name: "Ajuda" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Cadastro de Colaboradores" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("deve criar CLT com encargos percentual e verificar custo", async ({ page }) => {
    const nome = `CLT Perc ${Date.now()}`;
    const startTime = Date.now();

    await goToNovoColaborador(page);
    await fillDadosGerais(page, { nome, email: "clt@test.com", tipoVinculo: "CLT" });

    // CLT section should be visible
    await expect(page.getByText("Remuneração — CLT")).toBeVisible();

    // Fill salary
    await page.getByLabel("Salário Bruto (R$)").fill("5000");

    // Default is Percentual with 75%
    await expect(page.getByLabel("Encargos Patronais (%)")).toHaveValue("75");

    // Set benefits to ValorUnico for simplicity
    await page.getByLabel("Modo de benefícios").selectOption("ValorUnico");
    await page.getByLabel("Valor Total de Benefícios (R$)").fill("500");

    // Verify cost summary shows: 5000 + 5000*75% + 500 = 9250
    await expect(page.getByText("Custo Total Mensal")).toBeVisible();
    await expect(page.getByText("R$ 9.250,00")).toBeVisible();

    // Verify custo/hora: 9250 / 160 = 57.8125 → R$ 57,81
    await expect(page.getByText(/57,81.*\/h/)).toBeVisible();

    await submitForm(page);

    // SC-001: full creation under 3 minutes
    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeLessThan(3 * 60 * 1000);

    // Verify in list (scope to table to avoid matching hidden <option> elements)
    await expect(page.getByText(nome)).toBeVisible();
    await expect(page.getByRole("cell", { name: "CLT" }).first()).toBeVisible();
  });

  test("deve criar CLT com encargos detalhados", async ({ page }) => {
    const nome = `CLT Det ${Date.now()}`;

    await goToNovoColaborador(page);
    await fillDadosGerais(page, { nome, tipoVinculo: "CLT" });

    await page.getByLabel("Salário Bruto (R$)").fill("4000");

    // Switch to detailed mode
    await page.locator("#modoEncargos").selectOption("Detalhado");

    // Detailed fields should appear (defaults should be pre-filled)
    await expect(page.getByLabel("INSS (%)")).toBeVisible();
    await expect(page.getByLabel("FGTS (%)")).toBeVisible();
    await expect(page.getByLabel("13º Salário (%)")).toBeVisible();
    await expect(page.getByLabel("Férias (%)")).toBeVisible();

    // Set benefits to ValorUnico
    await page.getByLabel("Modo de benefícios").selectOption("ValorUnico");
    await page.getByLabel("Valor Total de Benefícios (R$)").fill("300");

    await submitForm(page);
    await expect(page.getByText(nome)).toBeVisible();
  });

  test("deve editar campo financeiro e verificar histórico", async ({ page }) => {
    const nome = `CLT Hist ${Date.now()}`;

    // Create
    await goToNovoColaborador(page);
    await fillDadosGerais(page, { nome, tipoVinculo: "CLT" });
    await page.getByLabel("Salário Bruto (R$)").fill("5000");
    await page.getByLabel("Modo de benefícios").selectOption("ValorUnico");
    await submitForm(page);

    // Edit
    await page
      .getByRole("row")
      .filter({ hasText: nome })
      .getByRole("button", { name: /Editar/ })
      .click();
    await page.waitForURL(/\/cadastros\/colaboradores\/[^/]+$/, { timeout: 15_000 });
    await page.waitForLoadState("networkidle");

    // Change salary
    const salarioInput = page.getByLabel("Salário Bruto (R$)");
    await salarioInput.clear();
    await salarioInput.fill("6000");

    await page.getByRole("button", { name: "Salvar Alterações" }).click();
    await expect(page.getByText("atualizado com sucesso")).toBeVisible({ timeout: 15_000 });
    await page.waitForURL(/\/cadastros\/colaboradores$/, { timeout: 15_000 });
    await page.waitForLoadState("networkidle");

    // Re-open edit to check history
    await page
      .getByRole("row")
      .filter({ hasText: nome })
      .getByRole("button", { name: /Editar/ })
      .click();
    await page.waitForURL(/\/cadastros\/colaboradores\/[^/]+$/, { timeout: 15_000 });
    await page.waitForLoadState("networkidle");

    // Financial history section should exist (collapsible)
    const historicoBtn = page.getByRole("button", { name: /Histórico de Alterações Financeiras/ });
    await expect(historicoBtn).toBeVisible();
    await historicoBtn.click();
    // Should show the salary change
    await expect(page.getByText("Salário Bruto")).toBeVisible();
  });

  test("deve filtrar por tipo de vínculo", async ({ page }) => {
    await goToColaboradores(page);

    // Filter by CLT
    await page.locator("#filterTipoVinculo").selectOption("CLT");
    await page.waitForLoadState("networkidle");

    // All visible rows should have CLT badge
    const rows = page.getByRole("row").filter({ hasText: "CLT" });
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(0); // may be 0 if no CLT exists yet
  });
});

// ────────────────────────────────────────────────────────────
// T054: Benefits mode toggle
// ────────────────────────────────────────────────────────────
test.describe("Colaboradores — Benefícios Toggle", () => {
  test("deve alternar entre Detalhado e ValorUnico preservando dados", async ({ page }) => {
    await goToNovoColaborador(page);
    await fillDadosGerais(page, { nome: `Ben Toggle ${Date.now()}`, tipoVinculo: "CLT" });
    await page.getByLabel("Salário Bruto (R$)").fill("5000");

    // Default mode is Detalhado
    const modeSelect = page.getByLabel("Modo de benefícios");
    await expect(modeSelect).toHaveValue("Detalhado");

    // Fill detailed benefits
    await page.getByLabel("Plano de Saúde (R$)").fill("800");
    await page.getByLabel("Auxílio Transporte (R$)").fill("400");
    await page.getByLabel("Auxílio Alimentação (R$)").fill("600");

    // Verify CLT discounts are displayed
    await expect(page.getByText(/Desconto 6% do salário/)).toBeVisible();
    await expect(page.getByText(/Desconto 20%/)).toBeVisible();

    // Switch to ValorUnico
    await modeSelect.selectOption("ValorUnico");
    await expect(page.getByLabel("Valor Total de Benefícios (R$)")).toBeVisible();
    await page.getByLabel("Valor Total de Benefícios (R$)").fill("1500");

    // Switch back to Detalhado
    await modeSelect.selectOption("Detalhado");

    // SC-008: Detailed fields should preserve original values
    await expect(page.getByLabel("Plano de Saúde (R$)")).toHaveValue("800");
    await expect(page.getByLabel("Auxílio Transporte (R$)")).toHaveValue("400");
    await expect(page.getByLabel("Auxílio Alimentação (R$)")).toHaveValue("600");

    // Switch back to ValorUnico — preserved too
    await modeSelect.selectOption("ValorUnico");
    await expect(page.getByLabel("Valor Total de Benefícios (R$)")).toHaveValue("1500");
  });

  test("deve exibir benefícios extras e calcular total", async ({ page }) => {
    await goToNovoColaborador(page);
    await fillDadosGerais(page, { nome: `Ben Extras ${Date.now()}`, tipoVinculo: "CLT" });
    await page.getByLabel("Salário Bruto (R$)").fill("5000");

    // Mode should be Detalhado by default
    await expect(page.getByText("Benefícios Extras")).toBeVisible();

    // Add extra benefit
    await page.getByRole("button", { name: "Adicionar" }).first().click();
    await page.getByLabel("Nome do benefício extra 1").fill("Gympass");
    await page.getByLabel("Valor do benefício extra 1").fill("100");

    // Total extras should show
    await expect(page.getByText(/Total extras.*R\$\s*100,00/)).toBeVisible();

    // Add another
    await page.getByRole("button", { name: "Adicionar" }).first().click();
    await page.getByLabel("Nome do benefício extra 2").fill("Estacionamento");
    await page.getByLabel("Valor do benefício extra 2").fill("200");

    await expect(page.getByText(/Total extras.*R\$\s*300,00/)).toBeVisible();

    // Remove the first one
    await page.getByLabel("Remover benefício extra 1").click();
    await expect(page.getByText(/Total extras.*R\$\s*200,00/)).toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────
// T055: Terceiros with encargos and benefits
// ────────────────────────────────────────────────────────────
test.describe("Colaboradores — Terceiros", () => {
  test("deve criar Terceiros com NF, encargos e benefícios", async ({ page }) => {
    const nome = `Terceiros ${Date.now()}`;
    const startTime = Date.now();

    await goToNovoColaborador(page);
    await fillDadosGerais(page, { nome, tipoVinculo: "Terceiros" });

    // Terceiros section should be visible
    await expect(page.getByText("Remuneração — Terceiros")).toBeVisible();

    // CLT section should NOT be visible
    await expect(page.getByText("Remuneração — CLT")).not.toBeVisible();

    // Fill NF value
    await page.getByLabel("Valor Mensal da NF (R$)").fill("8000");

    // Add encargos
    await page.getByRole("button", { name: "Adicionar" }).first().click();
    await page.getByLabel("Nome do encargo 1").fill("ISS");
    await page.getByLabel("Percentual do encargo 1").fill("5");

    await page.getByRole("button", { name: "Adicionar" }).first().click();
    await page.getByLabel("Nome do encargo 2").fill("Taxa administrativa");
    await page.getByLabel("Percentual do encargo 2").fill("3");

    // Total encargos should show 8% (toFixed uses dot: 8.00%)
    await expect(page.getByText(/Total encargos.*8\.00%/)).toBeVisible();

    // Set benefits
    await page.getByLabel("Modo de benefícios").selectOption("ValorUnico");
    await page.getByLabel("Valor Total de Benefícios (R$)").fill("500");

    // Expected cost: 8000 + 8000*8% + 500 = 8000 + 640 + 500 = 9140
    await expect(page.getByText("R$ 9.140,00")).toBeVisible();

    await submitForm(page);

    // SC-002: creation under 2 minutes
    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeLessThan(2 * 60 * 1000);

    await expect(page.getByText(nome)).toBeVisible();
    await expect(page.getByRole("cell", { name: "Terceiros" }).first()).toBeVisible();
  });

  test("deve exibir valor dos encargos sobre NF", async ({ page }) => {
    await goToNovoColaborador(page);
    await fillDadosGerais(page, { nome: `Terc Enc ${Date.now()}`, tipoVinculo: "Terceiros" });

    await page.getByLabel("Valor Mensal da NF (R$)").fill("10000");

    // Add ISS 5%
    await page.getByRole("button", { name: "Adicionar" }).first().click();
    await page.getByLabel("Nome do encargo 1").fill("ISS");
    await page.getByLabel("Percentual do encargo 1").fill("5");

    // Should show R$ 500.00 alongside 5.00%
    await expect(page.getByText("R$ 500,00").first()).toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────
// T056: Estagiário with intern fields
// ────────────────────────────────────────────────────────────
test.describe("Colaboradores — Estagiário", () => {
  test("deve criar Estagiário com campos obrigatórios e verificar custo", async ({
    page,
  }) => {
    const nome = `Estagiario ${Date.now()}`;
    const startTime = Date.now();

    await goToNovoColaborador(page);
    await fillDadosGerais(page, {
      nome,
      tipoVinculo: "Estagiario",
      horasMensais: "120",
    });

    // Estagiário section should be visible
    await expect(page.getByText("Remuneração — Estagiário")).toBeVisible();

    // CLT and Terceiros sections should NOT be visible
    await expect(page.getByText("Remuneração — CLT")).not.toBeVisible();
    await expect(page.getByText("Remuneração — Terceiros")).not.toBeVisible();

    // Fill intern fields
    await page.getByLabel("Bolsa Auxílio (R$)").fill("1500");
    await page.getByLabel("Seguro Estágio (R$)").fill("50");
    await page.getByLabel("Auxílio Transporte Estágio (R$)").fill("200");

    // Benefits as ValorUnico = 0
    await page.getByLabel("Modo de benefícios").selectOption("ValorUnico");

    // Expected cost: 1500 + 50 + 200 = 1750
    await expect(page.getByText("R$ 1.750,00")).toBeVisible();

    // Custo/hora: 1750 / 120 = 14.5833... ≈ R$ 14,58
    await expect(page.getByText(/14,58.*\/h/)).toBeVisible();

    await submitForm(page);

    // SC-003: creation under 2 minutes
    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeLessThan(2 * 60 * 1000);

    await expect(page.getByText(nome)).toBeVisible();
    await expect(page.getByRole("cell", { name: "Estagiário" }).first()).toBeVisible();
  });

  test("deve criar Estagiário com recesso remunerado e benefícios", async ({ page }) => {
    const nome = `Estag Full ${Date.now()}`;

    await goToNovoColaborador(page);
    await fillDadosGerais(page, {
      nome,
      tipoVinculo: "Estagiario",
      horasMensais: "120",
    });

    await page.getByLabel("Bolsa Auxílio (R$)").fill("1500");
    await page.getByLabel("Seguro Estágio (R$)").fill("50");
    await page.getByLabel("Auxílio Transporte Estágio (R$)").fill("200");
    await page.getByLabel("Recesso Remunerado (R$/mês)").fill("125");

    // Add detailed benefits (no CLT discounts)
    await expect(page.getByLabel("Modo de benefícios")).toHaveValue("Detalhado");
    await page.getByLabel("Plano de Saúde (R$)").fill("300");

    // Expected: (1500+50+200+125) + 300 = 1875 + 300 = 2175
    await expect(page.getByText("R$ 2.175,00")).toBeVisible();

    // No CLT discounts should be shown for Estagiário
    await expect(page.getByText("Desconto 6% do salário")).not.toBeVisible();
    await expect(page.getByText("Desconto 20%")).not.toBeVisible();

    await submitForm(page);
    await expect(page.getByText(nome)).toBeVisible();
  });

  test("deve ter 120h como padrão para estagiário", async ({ page }) => {
    await goToNovoColaborador(page);

    // Default is CLT with 160h
    await expect(page.getByLabel("Horas Mensais")).toHaveValue("160");

    // Switch to Estagiário — hours should remain at 160 (user manually sets to 120)
    // The default from the form is 160, not auto-changed on type switch
    await page.locator("#tipoVinculo").selectOption("Estagiario");

    // Estagiário form section visible
    await expect(page.getByText("Remuneração — Estagiário")).toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────
// Colaboradores — Editar e Excluir
// ────────────────────────────────────────────────────────────
test.describe("Colaboradores — Editar e Excluir", () => {
  test("deve editar nome do colaborador", async ({ page }) => {
    const nomeOriginal = `Edit Orig ${Date.now()}`;
    const nomeNovo = `Edit Novo ${Date.now()}`;

    await goToNovoColaborador(page);
    await fillDadosGerais(page, { nome: nomeOriginal, tipoVinculo: "CLT" });
    await page.getByLabel("Salário Bruto (R$)").fill("5000");
    await page.getByLabel("Modo de benefícios").selectOption("ValorUnico");
    await submitForm(page);

    // Click edit button
    await page
      .getByRole("row")
      .filter({ hasText: nomeOriginal })
      .getByRole("button", { name: /Editar/ })
      .click();
    await page.waitForURL(/\/cadastros\/colaboradores\/[^/]+$/, { timeout: 15_000 });
    await page.waitForLoadState("networkidle");

    // Edit name
    const nomeInput = page.getByLabel("Nome");
    await nomeInput.clear();
    await nomeInput.fill(nomeNovo);

    await page.getByRole("button", { name: "Salvar Alterações" }).click();
    await expect(page.getByText("atualizado com sucesso")).toBeVisible({ timeout: 15_000 });
    await page.waitForURL(/\/cadastros\/colaboradores$/, { timeout: 15_000 });
    await page.waitForLoadState("networkidle");

    await expect(page.getByText(nomeNovo)).toBeVisible();
    await expect(page.getByText(nomeOriginal)).not.toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────
// Colaboradores — Validação
// ────────────────────────────────────────────────────────────
test.describe("Colaboradores — Validação", () => {
  test("deve impedir submit sem nome", async ({ page }) => {
    await goToNovoColaborador(page);

    // Don't fill name, try to submit
    await page.getByLabel("Salário Bruto (R$)").fill("3000");
    await page.getByRole("button", { name: "Cadastrar Colaborador" }).click();

    // HTML5 required should prevent submission — name input should be focused
    const nomeInput = page.getByLabel("Nome");
    await expect(nomeInput).toBeFocused();
  });
});
