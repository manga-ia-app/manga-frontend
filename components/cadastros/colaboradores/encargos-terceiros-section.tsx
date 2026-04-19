"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import type { EncargoTerceiro } from "@/lib/types";

const numStr = (v: number | undefined) => (v ? String(v) : "");

interface Props {
  encargos: EncargoTerceiro[];
  onChange: (encargos: EncargoTerceiro[]) => void;
  valorMensalNF: number;
}

export function EncargosTerceirosSection({ encargos, onChange, valorMensalNF }: Props) {
  const addEncargo = () => {
    onChange([...encargos, { name: "", percentual: 0 }]);
  };

  const removeEncargo = (index: number) => {
    onChange(encargos.filter((_, i) => i !== index));
  };

  const updateEncargo = (index: number, field: "name" | "percentual", val: unknown) => {
    const updated = [...encargos];
    updated[index] = { ...updated[index], [field]: val };
    onChange(updated);
  };

  const totalPerc = encargos.reduce((sum, e) => sum + (e.percentual || 0), 0);
  const totalValor = valorMensalNF > 0 ? totalPerc / 100 * valorMensalNF : 0;

  const brl = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Encargos sobre NF</Label>
        <Button type="button" variant="outline" size="sm" onClick={addEncargo}>
          <Plus className="h-3 w-3 mr-1" aria-hidden="true" /> Adicionar
        </Button>
      </div>

      {encargos.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhum encargo adicionado. Exemplos: ISS, taxas administrativas.
        </p>
      )}

      {encargos.map((enc, i) => (
        <div key={i} className="flex gap-2 items-center">
          <Input
            placeholder="Nome (ex: ISS)"
            value={enc.name}
            onChange={(e) => updateEncargo(i, "name", e.target.value)}
            className="flex-1"
            aria-label={`Nome do encargo ${i + 1}`}
          />
          <div className="relative w-28">
            <Input
              type="number"
              min={0}
              step="any"
              placeholder="5"
              value={numStr(enc.percentual)}
              onChange={(e) => updateEncargo(i, "percentual", parseFloat(e.target.value) || 0)}
              className="pr-6"
              aria-label={`Percentual do encargo ${i + 1}`}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeEncargo(i)}
            aria-label={`Remover encargo ${i + 1}`}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      ))}

      {totalPerc > 0 && (
        <div className="text-xs text-muted-foreground flex justify-between">
          <span>Total encargos: {totalPerc.toFixed(2)}%</span>
          {valorMensalNF > 0 && <span>{brl(totalValor)}</span>}
        </div>
      )}
    </div>
  );
}
