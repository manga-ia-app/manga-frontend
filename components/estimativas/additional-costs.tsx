"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdditionalCost } from "@/lib/types/estimativas";

interface AdditionalCostsProps {
  costs: AdditionalCost[];
  onChange: (costs: AdditionalCost[]) => void;
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const numStr = (v: number) => (v ? String(v) : "");

export function AdditionalCosts({ costs, onChange }: AdditionalCostsProps) {
  const total = costs.reduce((sum, c) => sum + c.value, 0);

  const handleAdd = () => {
    onChange([
      ...costs,
      { id: crypto.randomUUID(), name: "", value: 0 },
    ]);
  };

  const handleRemove = (index: number) => {
    onChange(costs.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: "name" | "value", raw: string) => {
    const updated = [...costs];
    if (field === "name") {
      updated[index] = { ...updated[index], name: raw };
    } else {
      updated[index] = { ...updated[index], value: parseFloat(raw) || 0 };
    }
    onChange(updated);
  };

  return (
    <Card>
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Custos Adicionais</CardTitle>
          <Button variant="outline" size="sm" onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {costs.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">
            Nenhum custo adicional. Clique em &quot;Adicionar&quot; para incluir.
          </p>
        )}

        {costs.length > 0 && (
          <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground px-1">
            <span className="flex-1">Descrição</span>
            <span className="w-32 text-right">Valor (R$)</span>
            <span className="w-8" />
          </div>
        )}

        {costs.map((cost, index) => (
          <div key={cost.id || index} className="flex items-center gap-3">
            <Input
              className="flex-1"
              placeholder="Ex: Maquete, Viagem, Taxa"
              value={cost.name}
              onChange={(e) => handleChange(index, "name", e.target.value)}
            />
            <Input
              className="w-32 text-right"
              type="number"
              min={0}
              step="0.01"
              value={numStr(cost.value)}
              onChange={(e) => handleChange(index, "value", e.target.value)}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => handleRemove(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {costs.length > 0 && (
          <div className="flex items-center justify-between border-t pt-2 mt-2">
            <Label className="text-sm text-muted-foreground">Total Custos Adicionais</Label>
            <span className="text-sm font-semibold">{formatCurrency(total)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
