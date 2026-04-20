"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { extractApiError } from "@/lib/api/error";
import {
  createGrupoColaborador,
  updateGrupoColaborador,
} from "@/lib/api/overhead";
import type { GrupoColaboradorDto } from "@/lib/types/overhead";

interface GrupoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  grupo?: GrupoColaboradorDto | null;
}

export function GrupoDialog({ open, onOpenChange, grupo }: GrupoDialogProps) {
  const queryClient = useQueryClient();
  const isEdit = !!grupo;
  const [name, setName] = useState("");

  useEffect(() => {
    if (open) {
      setName(grupo?.name ?? "");
    }
  }, [open, grupo]);

  const createMutation = useMutation({
    mutationFn: (n: string) => createGrupoColaborador(n),
    onSuccess: () => {
      toast.success("Grupo criado com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["grupos-colaboradores"] });
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(extractApiError(err, "Erro ao criar grupo."));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, n }: { id: string; n: string }) =>
      updateGrupoColaborador(id, n),
    onSuccess: () => {
      toast.success("Grupo atualizado com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["grupos-colaboradores"] });
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(extractApiError(err, "Erro ao atualizar grupo."));
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = () => {
    if (!name.trim()) return;
    if (isEdit && grupo) {
      updateMutation.mutate({ id: grupo.id, n: name.trim() });
    } else {
      createMutation.mutate(name.trim());
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar Grupo" : "Novo Grupo"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="grupo-name">Nome</Label>
            <Input
              id="grupo-name"
              placeholder="Ex: Corpo Técnico"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !name.trim()}>
            {isPending ? "Salvando..." : isEdit ? "Salvar" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
