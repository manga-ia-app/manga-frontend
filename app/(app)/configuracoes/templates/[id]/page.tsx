"use client";

import { useState, useEffect, useCallback, use } from "react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { TemplateTree } from "@/components/templates/template-tree";
import { TemplateCounters } from "@/components/templates/template-counters";
import type {
  Template,
  TemplatePhase,
  CreateTemplatePayload,
  CreatePhasePayload,
  CreateSubPhasePayload,
  CreateActivityPayload,
  CreateChecklistItemPayload,
  CreateDeliverablePayload,
} from "@/lib/types/templates";
import {
  getTemplateById,
  getTemplates,
  createTemplate,
  updateTemplate,
} from "@/lib/api/templates";
import type { HelpContent } from "@/components/shared/help-button";

const editorHelp: HelpContent = {
  title: "Editor de Template",
  sections: [
    {
      heading: "Edição em memória",
      content:
        "Todas as alterações são feitas localmente até você clicar em \"Salvar\". Navegue para outra página sem salvar e suas alterações serão perdidas (um aviso será exibido).",
    },
    {
      heading: "Arrastar e soltar",
      content:
        "Reordene itens arrastando pelo ícone de grip à esquerda de cada item. Itens só podem ser movidos dentro do mesmo nível (etapas com etapas, subetapas com subetapas da mesma etapa, etc.).",
    },
    {
      heading: "Subetapas vs Atividades",
      content:
        "Uma etapa pode ter subetapas OU atividades diretas, nunca ambos. Ao adicionar uma subetapa em uma etapa com atividades, as atividades serão migradas para a nova subetapa.",
    },
    {
      heading: "Checklist",
      content:
        "Clique no ícone de checklist de uma atividade para abrir o modal de itens. Adicione, edite, reordene ou remova itens de verificação.",
    },
  ],
};

function generateId(): string {
  return crypto.randomUUID();
}

function emptyTemplate(): Template {
  return {
    id: "",
    name: "",
    description: "",
    isDefault: false,
    phases: [],
  };
}

function templateToPayload(t: Template): CreateTemplatePayload {
  return {
    name: t.name,
    description: t.description || undefined,
    isDefault: t.isDefault,
    phases: t.phases.map(
      (p, pi): CreatePhasePayload => ({
        name: p.name,
        description: p.description || undefined,
        orderIndex: pi,
        defaultDurationDays: p.defaultDurationDays,
        subPhases: p.subPhases.map(
          (s, si): CreateSubPhasePayload => ({
            name: s.name,
            description: s.description || undefined,
            orderIndex: si,
            activities: s.activities.map(
              (a, ai): CreateActivityPayload => ({
                name: a.name,
                orderIndex: ai,
                checklistItems: a.checklistItems.map(
                  (c, ci): CreateChecklistItemPayload => ({
                    description: c.description,
                    orderIndex: ci,
                  })
                ),
              })
            ),
            deliverables: (s.deliverables ?? []).map(
              (d, di): CreateDeliverablePayload => ({
                name: d.name,
                orderIndex: di,
              })
            ),
          })
        ),
        activities: p.activities.map(
          (a, ai): CreateActivityPayload => ({
            name: a.name,
            orderIndex: ai,
            checklistItems: a.checklistItems.map(
              (c, ci): CreateChecklistItemPayload => ({
                description: c.description,
                orderIndex: ci,
              })
            ),
          })
        ),
        deliverables: (p.deliverables ?? []).map(
          (d, di): CreateDeliverablePayload => ({
            name: d.name,
            orderIndex: di,
          })
        ),
      })
    ),
  };
}

export default function TemplateEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const isNew = id === "novo";

  const [template, setTemplate] = useState<Template>(emptyTemplate);
  const [savedState, setSavedState] = useState<string>("");
  const [initialized, setInitialized] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const { data: loadedTemplate } = useQuery({
    queryKey: ["template", id],
    queryFn: () => getTemplateById(id),
    enabled: !isNew,
  });

  const { data: allTemplates } = useQuery({
    queryKey: ["templates"],
    queryFn: getTemplates,
  });

  useEffect(() => {
    if (!isNew && loadedTemplate && !initialized) {
      setTemplate(loadedTemplate);
      setSavedState(JSON.stringify(loadedTemplate));
      setInitialized(true);
    } else if (isNew && !initialized) {
      setInitialized(true);
      setSavedState(JSON.stringify(emptyTemplate()));
    }
  }, [loadedTemplate, isNew, initialized]);

  const isDirty = initialized && JSON.stringify(template) !== savedState;

  // Unsaved changes warning (FR-022)
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty) {
        e.preventDefault();
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const createMutation = useMutation({
    mutationFn: (payload: CreateTemplatePayload) => createTemplate(payload),
    onSuccess: (result) => {
      toast.success("Template criado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      router.push(`/configuracoes/templates/${result.id}`);
    },
    onError: () => toast.error("Erro ao criar template."),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: CreateTemplatePayload) => updateTemplate(id, payload),
    onSuccess: (result) => {
      toast.success("Template salvo com sucesso!");
      setTemplate(result);
      setSavedState(JSON.stringify(result));
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      queryClient.invalidateQueries({ queryKey: ["template", id] });
    },
    onError: () => toast.error("Erro ao salvar template."),
  });

  const handleSave = useCallback(() => {
    if (!template.name) {
      toast.error("Nome do template é obrigatório.");
      return;
    }

    // Duplicate name warning (informative, non-blocking)
    const duplicateName = allTemplates?.find(
      (t) => t.name === template.name && t.id !== id
    );
    if (duplicateName) {
      toast.warning(`Já existe um template com o nome "${template.name}".`);
    }

    const payload = templateToPayload(template);

    if (isNew) {
      createMutation.mutate(payload);
    } else {
      updateMutation.mutate(payload);
    }
  }, [template, isNew, id, allTemplates, createMutation, updateMutation]);

  const handleBack = useCallback(() => {
    if (isDirty) {
      setShowExitConfirm(true);
      return;
    }
    router.push("/configuracoes/templates");
  }, [isDirty, router]);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const updatePhases = useCallback((phases: TemplatePhase[]) => {
    setTemplate((prev) => ({ ...prev, phases }));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title={isNew ? "Novo Template" : template.name || "Template"}
        description={isNew ? "Crie um novo template de projeto" : "Edite a hierarquia do template"}
        help={editorHelp}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !isDirty}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        }
      />

      {/* Template metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="template-name">Nome *</Label>
          <Input
            id="template-name"
            placeholder="Ex: Projeto Residencial Completo"
            value={template.name}
            onChange={(e) => setTemplate({ ...template, name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="template-description">Descrição</Label>
          <Input
            id="template-description"
            placeholder="Breve descrição do template"
            value={template.description || ""}
            onChange={(e) => setTemplate({ ...template, description: e.target.value })}
          />
        </div>
      </div>

      {/* Counters */}
      <TemplateCounters phases={template.phases} />

      {/* Hierarchy tree */}
      <TemplateTree
        phases={template.phases}
        onChange={updatePhases}
        generateId={generateId}
      />

      <ConfirmDialog
        open={showExitConfirm}
        onOpenChange={setShowExitConfirm}
        title="Alterações não salvas"
        description="Existem alterações não salvas. Deseja sair?"
        confirmLabel="Sair sem salvar"
        variant="default"
        onConfirm={() => {
          setShowExitConfirm(false);
          router.push("/configuracoes/templates");
        }}
      />
    </div>
  );
}
