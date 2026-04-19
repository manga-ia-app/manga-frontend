"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  LayoutList,
  Search,
  FolderOpen,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils/cn";
import { showToast } from "@/lib/utils/toast";

import apiClient from "@/lib/api/client";

interface CategoriaOrcamento {
  id: string;
  nome: string;
  descricao?: string;
  ordem: number;
  ativo: boolean;
  criadoEm: string;
}

export default function CategoriasOrcamentoPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    nome: "",
    descricao: "",
  });

  const [editForm, setEditForm] = useState({
    nome: "",
    descricao: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["categorias-orcamento"],
    queryFn: async () => {
      const response = await apiClient.get<{ items: CategoriaOrcamento[] }>(
        "/configuracoes/categorias-orcamento"
      );
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { nome: string; descricao?: string }) => {
      const response = await apiClient.post(
        "/configuracoes/categorias-orcamento",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      showToast("success", { title: "Categoria criada com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["categorias-orcamento"] });
      setDialogOpen(false);
      setForm({ nome: "", descricao: "" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: { nome: string; descricao?: string };
    }) => {
      const response = await apiClient.put(
        `/configuracoes/categorias-orcamento/${id}`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      showToast("success", { title: "Categoria atualizada com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["categorias-orcamento"] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/configuracoes/categorias-orcamento/${id}`);
    },
    onSuccess: () => {
      showToast("success", { title: "Categoria excluida com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["categorias-orcamento"] });
      setDeleteDialogOpen(false);
      setDeletingId(null);
    },
  });

  const categorias = data?.items ?? [];
  const filteredCategorias = categorias.filter(
    (c) =>
      !search ||
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      (c.descricao && c.descricao.toLowerCase().includes(search.toLowerCase()))
  );

  function handleCreate() {
    if (!form.nome) return;
    createMutation.mutate({
      nome: form.nome,
      descricao: form.descricao || undefined,
    });
  }

  function startEditing(categoria: CategoriaOrcamento) {
    setEditingId(categoria.id);
    setEditForm({
      nome: categoria.nome,
      descricao: categoria.descricao || "",
    });
  }

  function handleSaveEdit() {
    if (!editingId || !editForm.nome) return;
    updateMutation.mutate({
      id: editingId,
      data: {
        nome: editForm.nome,
        descricao: editForm.descricao || undefined,
      },
    });
  }

  function confirmDelete(id: string) {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categorias de Orcamento"
        description="Gerencie as categorias utilizadas nos orcamentos dos projetos"
        action={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Categoria
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Nova Categoria de Orcamento</DialogTitle>
                <DialogDescription>
                  Crie uma nova categoria para organizar os itens do orcamento.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="cat-nome">Nome *</Label>
                  <Input
                    id="cat-nome"
                    placeholder="Ex: Estrutura, Acabamento, Instalacoes..."
                    value={form.nome}
                    onChange={(e) =>
                      setForm({ ...form, nome: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cat-descricao">Descricao</Label>
                  <Input
                    id="cat-descricao"
                    placeholder="Breve descricao da categoria"
                    value={form.descricao}
                    onChange={(e) =>
                      setForm({ ...form, descricao: e.target.value })
                    }
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    setForm({ nome: "", descricao: "" });
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={createMutation.isPending || !form.nome}
                >
                  {createMutation.isPending ? "Criando..." : "Criar Categoria"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar categorias..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Categoria</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta categoria? Esta acao nao pode
              ser desfeita. Categorias em uso nao podem ser excluidas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeletingId(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingId && deleteMutation.mutate(deletingId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Excluindo..." : "Confirmar Exclusao"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Categories list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : filteredCategorias.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderOpen className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">
              {search
                ? "Nenhuma categoria encontrada"
                : "Nenhuma categoria criada"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 text-center max-w-md">
              {search
                ? "Tente buscar com outros termos."
                : "Categorias ajudam a organizar os itens dos orcamentos dos seus projetos."}
            </p>
            {!search && (
              <Button className="mt-4" onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira Categoria
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredCategorias
                .sort((a, b) => a.ordem - b.ordem)
                .map((categoria) => {
                  const isEditing = editingId === categoria.id;

                  return (
                    <div
                      key={categoria.id}
                      className="flex items-center gap-4 px-4 py-3 hover:bg-muted/50 transition-colors"
                    >
                      <LayoutList className="h-4 w-4 text-muted-foreground shrink-0" />

                      {isEditing ? (
                        <div className="flex-1 flex items-center gap-3">
                          <Input
                            value={editForm.nome}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                nome: e.target.value,
                              })
                            }
                            placeholder="Nome da categoria"
                            className="max-w-[200px]"
                          />
                          <Input
                            value={editForm.descricao}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                descricao: e.target.value,
                              })
                            }
                            placeholder="Descricao"
                            className="max-w-[300px]"
                          />
                          <Button
                            size="sm"
                            onClick={handleSaveEdit}
                            disabled={
                              updateMutation.isPending || !editForm.nome
                            }
                          >
                            <Save className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingId(null)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">
                              {categoria.nome}
                            </p>
                            {categoria.descricao && (
                              <p className="text-xs text-muted-foreground truncate">
                                {categoria.descricao}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            Ordem: {categoria.ordem}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditing(categoria)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => confirmDelete(categoria.id)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <Card>
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            <strong>Dica:</strong> Categorias de orcamento sao usadas para
            organizar os itens dentro de cada projeto. Exemplos comuns:
            Estrutura, Alvenaria, Instalacoes Eletricas, Instalacoes
            Hidraulicas, Acabamentos, Pintura, etc.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
