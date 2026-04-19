"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, FileStack, Pencil, Trash2, Star, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getTemplates,
  deleteTemplate,
  duplicateTemplate,
  setDefaultTemplate,
} from "@/lib/api/templates";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import type { HelpContent } from "@/components/shared/help-button";

const helpContent: HelpContent = {
  title: "Templates de Projeto",
  sections: [
    {
      heading: "O que são templates?",
      content:
        "Templates permitem pré-definir a estrutura de um projeto com etapas, subetapas, atividades e checklists. Ao criar um novo projeto, você pode aplicar um template para não precisar montar a estrutura do zero.",
    },
    {
      heading: "Hierarquia",
      content:
        "Cada template possui Etapas (nível 1), que podem conter Subetapas (nível 2) ou Atividades diretas. Atividades podem ter itens de Checklist. Uma etapa não pode ter subetapas e atividades diretas ao mesmo tempo.",
    },
    {
      heading: "Template padrão",
      content:
        "Marque um template como padrão (estrela) para que ele seja sugerido automaticamente ao criar novos projetos. Apenas um template pode ser padrão por vez.",
    },
    {
      heading: "Duplicar",
      content:
        "Use o botão de copiar para duplicar um template existente. A cópia recebe o sufixo \"(Cópia)\" e pode ser editada independentemente do original.",
    },
  ],
};

export default function TemplatesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["templates"],
    queryFn: getTemplates,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      toast.success("Template excluído.");
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
    onError: () => toast.error("Erro ao excluir template."),
  });

  const duplicateMutation = useMutation({
    mutationFn: duplicateTemplate,
    onSuccess: (result) => {
      toast.success("Template duplicado.");
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      router.push(`/configuracoes/templates/${result.id}`);
    },
    onError: () => toast.error("Erro ao duplicar template."),
  });

  const defaultMutation = useMutation({
    mutationFn: ({ id, isDefault }: { id: string; isDefault: boolean }) =>
      setDefaultTemplate(id, { isDefault }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
    onError: () => toast.error("Erro ao alterar template padrão."),
  });

  const templates = data ?? [];

  const [deleteTarget, setDeleteTarget] = useState<{id: string; name: string} | null>(null);

  function handleDelete(id: string, name: string) {
    setDeleteTarget({ id, name });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Templates de Projeto"
        description="Crie templates reutilizáveis com hierarquia de etapas, subetapas, atividades e checklists"
        help={helpContent}
        action={
          <Button onClick={() => router.push("/configuracoes/templates/novo")}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Template
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileStack className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Nenhum template criado</h3>
            <p className="text-sm text-muted-foreground mt-1 text-center max-w-md">
              Templates permitem criar projetos com etapas, subetapas, atividades e
              checklists pré-definidos.
            </p>
            <Button
              className="mt-4"
              onClick={() => router.push("/configuracoes/templates/novo")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeiro Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-center">Etapas</TableHead>
                <TableHead className="text-center">Subetapas</TableHead>
                <TableHead className="text-center">Atividades</TableHead>
                <TableHead className="text-center">Checklists</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {template.name}
                      {template.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          Padrão
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">
                    {template.description || "—"}
                  </TableCell>
                  <TableCell className="text-center">{template.phaseCount}</TableCell>
                  <TableCell className="text-center">{template.subPhaseCount}</TableCell>
                  <TableCell className="text-center">{template.activityCount}</TableCell>
                  <TableCell className="text-center">{template.checklistItemCount}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          defaultMutation.mutate({
                            id: template.id,
                            isDefault: !template.isDefault,
                          })
                        }
                        title={template.isDefault ? "Remover padrão" : "Definir como padrão"}
                      >
                        <Star
                          className={`h-4 w-4 ${template.isDefault ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => duplicateMutation.mutate(template.id)}
                        title="Duplicar"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/configuracoes/templates/${template.id}`)}
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(template.id, template.name)}
                        className="text-muted-foreground hover:text-destructive"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Excluir template"
        description={`Deseja excluir o template "${deleteTarget?.name}"?`}
        confirmLabel="Excluir"
        variant="destructive"
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id);
          }
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
