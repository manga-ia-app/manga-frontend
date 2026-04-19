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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TemplateSubPhase } from "@/lib/types/templates";

interface DeleteSubphaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subPhase: TemplateSubPhase;
  otherSubPhases: TemplateSubPhase[];
  onConfirm: (action: "delete" | "move", targetSubPhaseId?: string) => void;
}

export function DeleteSubphaseDialog({
  open,
  onOpenChange,
  subPhase,
  otherSubPhases,
  onConfirm,
}: DeleteSubphaseDialogProps) {
  const [action, setAction] = useState<"delete" | "move">("move");
  const [targetId, setTargetId] = useState(otherSubPhases[0]?.id ?? "");

  function handleConfirm() {
    if (action === "move" && !targetId) return;
    onConfirm(action, action === "move" ? targetId : undefined);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Excluir Subetapa</DialogTitle>
          <DialogDescription>
            A subetapa &quot;{subPhase.name}&quot; possui{" "}
            {subPhase.activities.length}{" "}
            {subPhase.activities.length === 1 ? "atividade" : "atividades"}.
            O que deseja fazer?
          </DialogDescription>
        </DialogHeader>

        <RadioGroup value={action} onValueChange={(val) => setAction(val as "delete" | "move")} className="space-y-3 py-2">
          <div className="flex items-center gap-2">
            <RadioGroupItem value="move" id="action-move" />
            <Label htmlFor="action-move" className="text-sm cursor-pointer">
              Mover atividades para outra subetapa
            </Label>
          </div>

          {action === "move" && (
            <div className="ml-6 space-y-1">
              <Label htmlFor="target-subphase" className="text-xs text-muted-foreground">
                Subetapa destino
              </Label>
              <Select value={targetId || undefined} onValueChange={(val) => setTargetId(val)}>
                <SelectTrigger id="target-subphase" className="w-full h-9">
                  <SelectValue placeholder="Selecione uma subetapa..." />
                </SelectTrigger>
                <SelectContent>
                  {otherSubPhases.map((sp) => (
                    <SelectItem key={sp.id} value={sp.id}>
                      {sp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <RadioGroupItem value="delete" id="action-delete" />
            <Label htmlFor="action-delete" className="text-sm text-destructive cursor-pointer">
              Excluir atividades junto com a subetapa
            </Label>
          </div>
        </RadioGroup>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant={action === "delete" ? "destructive" : "default"}
            onClick={handleConfirm}
          >
            {action === "delete" ? "Excluir Tudo" : "Mover e Excluir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
