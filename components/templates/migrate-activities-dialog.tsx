"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MigrateActivitiesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activityCount: number;
  deliverableCount: number;
  onConfirm: (subphaseName: string) => void;
}

export function MigrateActivitiesDialog({
  open,
  onOpenChange,
  activityCount,
  deliverableCount,
  onConfirm,
}: MigrateActivitiesDialogProps) {
  const [name, setName] = useState("");

  function handleConfirm() {
    if (!name.trim()) return;
    onConfirm(name.trim());
    setName("");
  }

  const parts: string[] = [];
  if (activityCount > 0) {
    parts.push(`${activityCount} ${activityCount === 1 ? "atividade" : "atividades"}`);
  }
  if (deliverableCount > 0) {
    parts.push(`${deliverableCount} ${deliverableCount === 1 ? "entregável" : "entregáveis"}`);
  }
  const itemsLabel = parts.join(" e ");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Criar Subetapa</DialogTitle>
          <DialogDescription>
            Esta etapa possui {itemsLabel}. Ao criar uma subetapa, {activityCount > 0 && deliverableCount > 0
              ? "as atividades e os entregáveis serão automaticamente movidos"
              : activityCount > 0
                ? "as atividades serão automaticamente movidas"
                : "os entregáveis serão automaticamente movidos"} para ela.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="subphase-name">Nome da subetapa *</Label>
          <Input
            id="subphase-name"
            autoFocus
            placeholder="Ex: Levantamento de Campo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!name.trim()}>
            Criar e Mover
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
