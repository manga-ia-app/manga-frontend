"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

interface Props {
  onAdd: (name: string, isPersonnel: boolean) => void;
}

export function AddCategoryModal({ onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isPersonnel, setIsPersonnel] = useState(false);

  const handleConfirm = () => {
    if (!name.trim()) return;
    onAdd(name.trim(), isPersonnel);
    setName("");
    setIsPersonnel(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Nova Categoria
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Categoria de Custo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-cat-name">Nome da Categoria</Label>
            <Input
              id="new-cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Seguros"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirm();
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="new-cat-personnel"
              checked={isPersonnel}
              onCheckedChange={(checked) => setIsPersonnel(checked === true)}
            />
            <Label htmlFor="new-cat-personnel" className="cursor-pointer">
              Custo de Pessoal
            </Label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={!name.trim()}>
              Criar Categoria
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
