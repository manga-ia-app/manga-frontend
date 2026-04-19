"use client";

import { useState } from "react";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProposalDeliverable } from "@/lib/types";

interface DeliverablesEditorProps {
  deliverables: ProposalDeliverable[];
  onChange: (deliverables: ProposalDeliverable[]) => void;
}

export function DeliverablesEditor({ deliverables, onChange }: DeliverablesEditorProps) {
  const [newName, setNewName] = useState("");

  const handleAdd = () => {
    if (!newName.trim()) return;
    const newDel: ProposalDeliverable = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      orderIndex: deliverables.length,
      isVisible: true,
    };
    onChange([...deliverables, newDel]);
    setNewName("");
  };

  const handleRemove = (id: string) => {
    onChange(
      deliverables
        .filter((d) => d.id !== id)
        .map((d, i) => ({ ...d, orderIndex: i }))
    );
  };

  const handleRename = (id: string, name: string) => {
    onChange(deliverables.map((d) => (d.id === id ? { ...d, name } : d)));
  };

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-muted-foreground">Entregáveis</h4>
      {deliverables.map((del) => (
        <div key={del.id} className="flex items-center gap-2">
          <GripVertical className="w-3 h-3 text-muted-foreground shrink-0" />
          <Input
            value={del.name}
            onChange={(e) => handleRename(del.id, e.target.value)}
            className="h-7 text-xs"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={() => handleRemove(del.id)}
          >
            <Trash2 className="w-3 h-3 text-destructive" />
          </Button>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Novo entregável..."
          className="h-7 text-xs"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={handleAdd}
          disabled={!newName.trim()}
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}
