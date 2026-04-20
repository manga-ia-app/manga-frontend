"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, History } from "lucide-react";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CargoStatsBadge } from "./cargo-stats-badge";
import { createCargo, updateCargo, getCargoById } from "@/lib/api/cargos";
import { extractApiError } from "@/lib/api/error";
import { getGruposColaboradores } from "@/lib/api/overhead";
import type { Cargo } from "@/lib/types/cargos";

const numStr = (v: number) => (v ? String(v) : "");

const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

interface CargoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cargo?: Cargo | null;
}

export function CargoDialog({ open, onOpenChange, cargo }: CargoDialogProps) {
  const queryClient = useQueryClient();
  const isEdit = !!cargo;

  const [name, setName] = useState("");
  const [valorHora, setValorHora] = useState("");
  const [grupoId, setGrupoId] = useState("");
  const [showHistorico, setShowHistorico] = useState(false);

  const { data: grupos } = useQuery({
    queryKey: ["grupos-colaboradores"],
    queryFn: getGruposColaboradores,
  });

  const { data: cargoDetalhes } = useQuery({
    queryKey: ["cargo", cargo?.id],
    queryFn: () => getCargoById(cargo!.id),
    enabled: isEdit && open,
  });

  useEffect(() => {
    if (open) {
      setName(cargo?.name ?? "");
      setValorHora(cargo ? numStr(cargo.valorHora) : "");
      setGrupoId(cargo?.grupoColaboradorId ?? "");
      setShowHistorico(false);
    }
  }, [open, cargo]);

  const createMutation = useMutation({
    mutationFn: (data: {
      name: string;
      valorHora: number;
      grupoColaboradorId: string;
    }) => createCargo(data),
    onSuccess: () => {
      toast.success("Cargo criado com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["cargos"] });
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(extractApiError(err, "Erro ao criar cargo."));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: {
      id: string;
      name: string;
      valorHora: number;
      grupoColaboradorId: string;
    }) =>
      updateCargo(data.id, {
        name: data.name,
        valorHora: data.valorHora,
        grupoColaboradorId: data.grupoColaboradorId,
      }),
    onSuccess: () => {
      toast.success("Cargo atualizado com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["cargos"] });
      queryClient.invalidateQueries({ queryKey: ["cargo", cargo?.id] });
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(extractApiError(err, "Erro ao atualizar cargo."));
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = () => {
    const valorNum = parseFloat(valorHora);
    if (!name.trim() || !valorNum || valorNum <= 0 || !grupoId) return;

    if (isEdit && cargo) {
      updateMutation.mutate({
        id: cargo.id,
        name: name.trim(),
        valorHora: valorNum,
        grupoColaboradorId: grupoId,
      });
    } else {
      createMutation.mutate({
        name: name.trim(),
        valorHora: valorNum,
        grupoColaboradorId: grupoId,
      });
    }
  };

  const historico = cargoDetalhes?.historico ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Cargo" : "Novo Cargo"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="cargo-name">Nome</Label>
            <Input
              id="cargo-name"
              placeholder="Ex: Arquiteto Senior"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cargo-grupo">Grupo</Label>
            <Select
              value={grupoId || undefined}
              onValueChange={(val) => setGrupoId(val)}
            >
              <SelectTrigger id="cargo-grupo" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <SelectValue placeholder="Selecione um grupo" />
              </SelectTrigger>
              <SelectContent>
                {grupos?.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cargo-valor-hora">Valor/Hora (R$)</Label>
            <Input
              id="cargo-valor-hora"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={valorHora}
              onChange={(e) => setValorHora(e.target.value)}
            />
            {isEdit && cargo && (
              <CargoStatsBadge
                cargoId={cargo.id}
                valorHora={parseFloat(valorHora) || 0}
              />
            )}
          </div>

          {isEdit && historico.length > 0 && (
            <div className="border rounded-md">
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowHistorico(!showHistorico)}
              >
                <History className="h-4 w-4" />
                <span>Histórico de alterações ({historico.length})</span>
                {showHistorico ? (
                  <ChevronDown className="h-3 w-3 ml-auto" />
                ) : (
                  <ChevronRight className="h-3 w-3 ml-auto" />
                )}
              </button>
              {showHistorico && (
                <div className="border-t px-3 py-2 space-y-2 max-h-48 overflow-y-auto">
                  {historico.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-center justify-between text-xs text-muted-foreground"
                    >
                      <div>
                        <span className="line-through">
                          {brl(h.valorAnterior)}/h
                        </span>
                        {" → "}
                        <span className="font-medium text-foreground">
                          {brl(h.valorNovo)}/h
                        </span>
                      </div>
                      <div className="text-right">
                        <div>{formatDate(h.alteradoEm)}</div>
                        <div>{h.alteradoPor}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Salvando..." : isEdit ? "Salvar" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
