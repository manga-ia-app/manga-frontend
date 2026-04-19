"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import type { GrupoColaboradorDto } from "@/lib/types/overhead";

interface ReassignCargosModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  grupoToDelete: GrupoColaboradorDto | null;
  availableGrupos: GrupoColaboradorDto[];
  onConfirm: (targetGrupoId: string) => void;
  isPending?: boolean;
}

export function ReassignCargosModal({
  open,
  onOpenChange,
  grupoToDelete,
  availableGrupos,
  onConfirm,
  isPending,
}: ReassignCargosModalProps) {
  const [targetId, setTargetId] = useState("");

  const targets = availableGrupos.filter(
    (g) => g.id !== grupoToDelete?.id
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Mover cargos antes de excluir</DialogTitle>
          <DialogDescription>
            O grupo &quot;{grupoToDelete?.name}&quot; possui{" "}
            {grupoToDelete?.cargosCount} cargo(s). Selecione o grupo destino
            para mover os cargos antes da exclusão.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="target-grupo">Grupo destino</Label>
            <Select value={targetId || undefined} onValueChange={(val) => setTargetId(val)}>
              <SelectTrigger id="target-grupo" className="w-full">
                <SelectValue placeholder="Selecione um grupo" />
              </SelectTrigger>
              <SelectContent>
                {targets.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <Button
            variant="destructive"
            onClick={() => onConfirm(targetId)}
            disabled={isPending || !targetId}
          >
            {isPending ? "Excluindo..." : "Mover cargos e excluir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
