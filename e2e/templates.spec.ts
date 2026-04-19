import { test, expect, Page } from "@playwright/test";

const BASE_URL = "http://localhost:3100";

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

async function goToTemplates(page: Page) {
  await page.goto(`${BASE_URL}/configuracoes/templates`);
  await page.waitForLoadState("networkidle");
}

async function goToNovoTemplate(page: Page) {
  await page.goto(`${BASE_URL}/configuracoes/templates/novo`);
  await page.waitForLoadState("networkidle");
}

async function fillTemplateName(page: Page, name: string) {
  await page.getByLabel("Nome *").fill(name);
}

async function fillTemplateDescription(page: Page, description: string) {
  await page.getByLabel("Descrição").fill(description);
}

async function clickSave(page: Page) {
  const saveBtn = page.getByRole("button", { name: "Salvar" });
  await expect(saveBtn).toBeEnabled({ timeout: 10_000 });
  await saveBtn.click();
}

/** Add a phase via the "Adicionar Etapa" button and inline input */
async function addPhase(page: Page, name: string) {
  await page.getByRole("button", { name: "Adicionar Etapa" }).click();
  const input = page.getByPlaceholder("Nome da etapa");
  await expect(input).toBeVisible({ timeout: 5_000 });
  await input.fill(name);
  await input.press("Enter");
  await expect(page.getByText(name).first()).toBeVisible();
}

/**
 * Add an activity to a phase.
 * The action button is icon-only (title attr) with opacity-0 on hover —
 * we hover over the phase row to make it visible, then click.
 */
async function addActivity(page: Page, phaseText: string, activityName: string) {
  const phaseNode = page.getByText(phaseText, { exact: true }).first();
  await phaseNode.hover();

  const addBtn = page.locator('button[title="Adicionar Atividade"]').first();
  await addBtn.click({ force: true });

  const input = page.getByPlaceholder("Nome da atividade");
  await expect(input).toBeVisible({ timeout: 5_000 });
  await input.fill(activityName);
  await input.press("Enter");
  await expect(page.getByText(activityName).first()).toBeVisible({ timeout: 5_000 });
}

/**
 * Click the "Adicionar Subetapa" icon button on a phase.
 */
async function clickAddSubphase(page: Page, phaseText: string) {
  const phaseNode = page.getByText(phaseText, { exact: true }).first();
  await phaseNode.hover();
  const addBtn = page.locator('button[title="Adicionar Subetapa"]').first();
  await addBtn.click({ force: true });
}

// ────────────────────────────────────────────────────────────
// 1. Criar template com hierarquia
// ────────────────────────────────────────────────────────────
test.describe("1 - Criar template com hierarquia", () => {
  test("should create a template with phases and activities", async ({
    page,
  }) => {
    await goToNovoTemplate(page);

    // Fill basic info
    await fillTemplateName(page, "Template E2E Test");
    await fillTemplateDescription(page, "Template criado pelo teste E2E");

    // Add a phase
    await addPhase(page, "Estudo Preliminar");

    // Add an activity to the phase
    await addActivity(page, "Estudo Preliminar", "Briefing com cliente");

    // Verify counters reflect structure (counters always use plural: "1 etapas")
    await expect(page.getByText("1 etapas")).toBeVisible();
    await expect(page.getByText("1 atividades")).toBeVisible();

    // Save
    await clickSave(page);
    await expect(page.getByText("Template criado com sucesso")).toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────
// 2. Editar template existente
// ────────────────────────────────────────────────────────────
test.describe("2 - Editar template", () => {
  test("should edit an existing template name", async ({ page }) => {
    // First create a template
    await goToNovoTemplate(page);
    await fillTemplateName(page, "Template Para Editar");
    await addPhase(page, "Fase 1");
    await clickSave(page);
    await expect(page.getByText("Template criado com sucesso")).toBeVisible();

    // Wait for redirect to the created template editor
    await page.waitForURL(/\/configuracoes\/templates\/[a-f0-9-]+/);

    // Wait for loaded template data to populate the name input
    await expect(page.getByLabel("Nome *")).toHaveValue("Template Para Editar", {
      timeout: 10_000,
    });

    // Edit the name
    const nameInput = page.getByLabel("Nome *");
    await nameInput.clear();
    await nameInput.fill("Template Editado");

    // Save changes (isDirty should be true now)
    await clickSave(page);
    await expect(page.getByText("Template salvo com sucesso")).toBeVisible();

    // Go to list and verify name (use .first() to avoid strict mode if duplicates exist)
    await goToTemplates(page);
    await expect(page.getByText("Template Editado").first()).toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────
// 3. Duplicar template
// ────────────────────────────────────────────────────────────
test.describe("3 - Duplicar template", () => {
  test("should duplicate a template", async ({ page }) => {
    // First create a template
    await goToNovoTemplate(page);
    await fillTemplateName(page, "Template Para Duplicar");
    await addPhase(page, "Fase Original");
    await clickSave(page);
    await expect(page.getByText("Template criado com sucesso")).toBeVisible();

    // Go to list
    await goToTemplates(page);

    // Find the row that has our template (exclude any copies)
    const row = page
      .getByRole("row")
      .filter({ hasText: "Template Para Duplicar" })
      .filter({ hasNotText: "Cópia" })
      .first();
    await expect(row).toBeVisible();

    // Click duplicate button (title-based icon button in table row)
    await row.locator('button[title="Duplicar"]').click();

    // Should show success toast and redirect
    await expect(page.getByText("Template duplicado")).toBeVisible();

    // Should redirect to the duplicated template editor — wait for name to load
    await expect(
      page.getByLabel("Nome *")
    ).toHaveValue(/Template Para Duplicar \(Cópia\)/, { timeout: 10_000 });
  });
});

// ────────────────────────────────────────────────────────────
// 4. Deletar template
// ────────────────────────────────────────────────────────────
test.describe("4 - Deletar template", () => {
  test("should delete a template after confirmation", async ({ page }) => {
    // Create a template to delete
    await goToNovoTemplate(page);
    await fillTemplateName(page, "Template Para Deletar");
    await clickSave(page);
    await expect(page.getByText("Template criado com sucesso")).toBeVisible();

    // Go to list
    await goToTemplates(page);
    await expect(page.getByText("Template Para Deletar")).toBeVisible();

    // Click delete and confirm
    const row = page
      .getByRole("row")
      .filter({ hasText: "Template Para Deletar" });

    page.on("dialog", (dialog) => dialog.accept());
    await row.locator('button[title="Excluir"]').click();

    // Should show success toast
    await expect(page.getByText("Template excluído")).toBeVisible();

    // Template should be removed from list
    await expect(page.getByText("Template Para Deletar")).not.toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────
// 5. Checklist modal
// ────────────────────────────────────────────────────────────
test.describe("5 - Checklist modal", () => {
  test("should open checklist modal and add items", async ({ page }) => {
    await goToNovoTemplate(page);
    await fillTemplateName(page, "Template Checklist Test");

    // Add phase and activity
    await addPhase(page, "Etapa 1");
    await addActivity(page, "Etapa 1", "Atividade com checklist");

    // The checklist button is a ClipboardList icon on the activity row
    // Hover over activity row to see the button, then click the ClipboardList icon
    const activityRow = page.getByText("Atividade com checklist").first();
    await activityRow.hover();

    // The checklist button uses a ClipboardList icon. Find it relative to activity.
    const activityContainer = activityRow.locator("xpath=ancestor::div[contains(@class, 'flex items-center')]");
    const checklistBtn = activityContainer.locator("button").filter({ has: page.locator("svg.lucide-clipboard-list") }).first();
    await checklistBtn.click();

    // Modal should open with title "Checklist — Atividade com checklist"
    await expect(page.getByText("Checklist — Atividade com checklist")).toBeVisible();

    // Add a checklist item (placeholder is "Novo item do checklist")
    const checklistInput = page.getByPlaceholder("Novo item do checklist");
    await checklistInput.fill("Verificar medidas");
    await checklistInput.press("Enter");

    // Verify item appears in modal — the empty message should be gone
    // and the first input in the dialog list should have the item text
    await expect(page.getByText("Nenhum item no checklist")).not.toBeVisible();
    const dialogContent = page.locator('[role="dialog"]');
    await expect(dialogContent.locator('input').first()).toHaveValue("Verificar medidas");

    // Close modal
    await page.keyboard.press("Escape");
  });
});

// ────────────────────────────────────────────────────────────
// 6. Migração de atividades (FR-006b)
// ────────────────────────────────────────────────────────────
test.describe("6 - Migração de atividades ao criar subetapa", () => {
  test("should show migration dialog when adding subphase to phase with activities", async ({
    page,
  }) => {
    await goToNovoTemplate(page);
    await fillTemplateName(page, "Template Migracao Test");

    // Add phase with a direct activity
    await addPhase(page, "Etapa com Atividades");
    await addActivity(page, "Etapa com Atividades", "Atividade existente");

    // Now click "Adicionar Subetapa" — should trigger migration dialog
    await clickAddSubphase(page, "Etapa com Atividades");

    // Migration dialog title is "Criar Subetapa"
    await expect(page.getByText("Criar Subetapa")).toBeVisible();

    // Fill required subphase name (label includes asterisk: "Nome da subetapa *")
    const subphaseName = page.getByLabel("Nome da subetapa *");
    await subphaseName.fill("Nova Subetapa");

    // Confirm migration button text is "Criar e Mover Atividades"
    await page.getByRole("button", { name: "Criar e Mover Atividades" }).click();

    // Subphase should appear with migrated activity (auto-expanded)
    await expect(page.getByText("Nova Subetapa")).toBeVisible();
    await expect(page.getByText("Atividade existente")).toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────
// 7. Expand/Collapse
// ────────────────────────────────────────────────────────────
test.describe("7 - Expandir e colapsar", () => {
  test("should toggle expand/collapse all", async ({ page }) => {
    await goToNovoTemplate(page);
    await fillTemplateName(page, "Template Expand Test");

    // Add phase with activity
    await addPhase(page, "Etapa Expansivel");
    await addActivity(page, "Etapa Expansivel", "Atividade Filha");

    // Activity should be visible (expanded by default)
    await expect(page.getByText("Atividade Filha")).toBeVisible();

    // Click "Colapsar Tudo"
    await page.getByRole("button", { name: "Colapsar Tudo" }).click();

    // Activity should be hidden
    await expect(page.getByText("Atividade Filha")).not.toBeVisible();

    // Click "Expandir Tudo"
    await page.getByRole("button", { name: "Expandir Tudo" }).click();

    // Activity should be visible again
    await expect(page.getByText("Atividade Filha")).toBeVisible();
  });
});
