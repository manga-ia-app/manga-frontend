"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Users, Trash2, Loader2, Shield, Eye, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { getProjetoById, addMembro, removeMembro } from "@/lib/api/projetos";
import type { ProjetoMembroRole } from "@/lib/types";
import { showToast } from "@/lib/utils/toast";

const roleConfig: Record<
  ProjetoMembroRole,
  { label: string; description: string; icon: React.ElementType; variant: "default" | "secondary" | "outline" }
> = {
  Lead: {
    label: "Responsavel",
    description: "Acesso total ao projeto",
    icon: Shield,
    variant: "default",
  },
  Collaborator: {
    label: "Colaborador",
    description: "Pode editar dados do projeto",
    icon: UserCog,
    variant: "secondary",
  },
  Viewer: {
    label: "Visualizador",
    description: "Apenas visualizacao",
    icon: Eye,
    variant: "outline",
  },
};

export default function EquipePage() {
  const params = useParams();
  const projetoId = params.id as string;
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newUserId, setNewUserId] = useState("");
  const [newRole, setNewRole] = useState<string>("Collaborator");

  const { data: projeto, isLoading } = useQuery({
    queryKey: ["projeto", projetoId],
    queryFn: () => getProjetoById(projetoId),
    enabled: !!projetoId,
  });

  const addMembroMutation = useMutation({
    mutationFn: () =>
      addMembro(projetoId, {
        userId: newUserId,
        role: newRole as ProjetoMembroRole,
      }),
    onSuccess: () => {
      showToast("success", { title: "Membro adicionado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["projeto", projetoId] });
      setDialogOpen(false);
      setNewUserId("");
      setNewRole("Collaborator");
    },
  });

  const removeMembroMutation = useMutation({
    mutationFn: (membroId: string) => removeMembro(projetoId, membroId),
    onSuccess: () => {
      showToast("success", { title: "Membro removido com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["projeto", projetoId] });
    },
  });

  const membros = projeto?.membros ?? [];

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Equipe do Projeto</h3>
          <p className="text-sm text-muted-foreground">
            {membros.length} {membros.length === 1 ? "membro" : "membros"}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Membro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Membro</DialogTitle>
              <DialogDescription>
                Adicione um membro a equipe do projeto.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="userId">ID do Usuario</Label>
                <Input
                  id="userId"
                  placeholder="ID do usuario"
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="role">Funcao</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a funcao" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Lead">Responsavel</SelectItem>
                    <SelectItem value="Collaborator">Colaborador</SelectItem>
                    <SelectItem value="Viewer">Visualizador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => addMembroMutation.mutate()}
                disabled={!newUserId || addMembroMutation.isPending}
              >
                {addMembroMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Adicionar
              </Button>
            </DialogFooter>
            {addMembroMutation.isError && (
              <p className="text-sm text-destructive">
                Erro ao adicionar membro. Tente novamente.
              </p>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Members list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 rounded bg-muted" />
                    <div className="h-3 w-1/4 rounded bg-muted" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : membros.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Nenhum membro na equipe</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Adicione membros para colaborar no projeto.
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Membro
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {membros.map((membro) => {
            const roleCfg = roleConfig[membro.role];
            const RoleIcon = roleCfg?.icon ?? Users;

            return (
              <Card key={membro.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Avatar placeholder */}
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                        {(membro.userName ?? "U")
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">
                          {membro.userName ?? "Usuario"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={roleCfg?.variant ?? "outline"}>
                        <RoleIcon className="mr-1 h-3 w-3" />
                        {roleCfg?.label ?? membro.role}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeMembroMutation.mutate(membro.id)}
                        disabled={removeMembroMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Role descriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Funcoes e Permissoes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {(Object.entries(roleConfig) as [ProjetoMembroRole, typeof roleConfig[ProjetoMembroRole]][]).map(
              ([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{cfg.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{cfg.description}</p>
                  </div>
                );
              }
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
