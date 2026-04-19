"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CommercialAdjustmentType,
  type CommercialAdjustment,
} from "@/lib/types/estimativas";

interface CommercialAdjustmentsProps {
  adjustments: CommercialAdjustment[];
  basePrice: number;
  onChange: (adjustments: CommercialAdjustment[]) => void;
}

const typeLabels: Record<CommercialAdjustmentType, string> = {
  [CommercialAdjustmentType.PercentDiscount]: "Desconto Percentual",
  [CommercialAdjustmentType.AbsoluteDiscount]: "Desconto Absoluto",
  [CommercialAdjustmentType.Rounding]: "Arredondamento",
  [CommercialAdjustmentType.ManualValue]: "Valor Manual",
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const numStr = (v: number) => (v ? String(v) : "");

export function CommercialAdjustments({
  adjustments,
  basePrice,
  onChange,
}: CommercialAdjustmentsProps) {
  const totalAdjustments = adjustments.reduce((sum, a) => sum + a.value, 0);
  const finalValue = basePrice + totalAdjustments;

  const handleAdd = (type: CommercialAdjustmentType) => {
    const newAdj: CommercialAdjustment = {
      id: crypto.randomUUID(),
      type,
      value: 0,
      reason: "",
      originalValue: basePrice,
      adjustedValue: basePrice,
      createdAt: new Date().toISOString(),
    };
    onChange([...adjustments, newAdj]);
  };

  const handleRemove = (index: number) => {
    onChange(adjustments.filter((_, i) => i !== index));
  };

  const handleValueChange = (index: number, rawValue: string) => {
    const updated = [...adjustments];
    const adj = { ...updated[index] };
    const inputValue = parseFloat(rawValue) || 0;

    switch (adj.type) {
      case CommercialAdjustmentType.PercentDiscount:
        adj.value = -Math.abs(basePrice * (inputValue / 100));
        break;
      case CommercialAdjustmentType.AbsoluteDiscount:
        adj.value = -Math.abs(inputValue);
        break;
      case CommercialAdjustmentType.Rounding:
        adj.value = inputValue - basePrice;
        adj.roundingTarget = inputValue;
        break;
      case CommercialAdjustmentType.ManualValue:
        adj.value = inputValue - basePrice;
        break;
    }

    adj.adjustedValue = basePrice + adj.value;
    updated[index] = adj;
    onChange(updated);
  };

  const handleReasonChange = (index: number, reason: string) => {
    const updated = [...adjustments];
    updated[index] = { ...updated[index], reason };
    onChange(updated);
  };

  const getInputLabel = (type: CommercialAdjustmentType) => {
    switch (type) {
      case CommercialAdjustmentType.PercentDiscount:
        return "Percentual (%)";
      case CommercialAdjustmentType.AbsoluteDiscount:
        return "Valor (R$)";
      case CommercialAdjustmentType.Rounding:
        return "Arredondar para (R$)";
      case CommercialAdjustmentType.ManualValue:
        return "Novo valor (R$)";
    }
  };

  const getDisplayValue = (adj: CommercialAdjustment) => {
    switch (adj.type) {
      case CommercialAdjustmentType.PercentDiscount:
        return basePrice !== 0
          ? Math.abs((adj.value / basePrice) * 100).toFixed(1)
          : "0";
      case CommercialAdjustmentType.AbsoluteDiscount:
        return String(Math.abs(adj.value));
      case CommercialAdjustmentType.Rounding:
        return String(adj.roundingTarget ?? basePrice + adj.value);
      case CommercialAdjustmentType.ManualValue:
        return String(basePrice + adj.value);
    }
  };

  return (
    <Card>
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Ajustes Comerciais</CardTitle>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => handleAdd(CommercialAdjustmentType.PercentDiscount)}
            >
              <Plus className="h-3 w-3 mr-1" /> % Desconto
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() =>
                handleAdd(CommercialAdjustmentType.AbsoluteDiscount)
              }
            >
              <Plus className="h-3 w-3 mr-1" /> R$ Desconto
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => handleAdd(CommercialAdjustmentType.Rounding)}
            >
              <Plus className="h-3 w-3 mr-1" /> Arredond.
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => handleAdd(CommercialAdjustmentType.ManualValue)}
            >
              <Plus className="h-3 w-3 mr-1" /> Manual
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {adjustments.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">
            Nenhum ajuste comercial. Use os botões acima para adicionar.
          </p>
        )}

        {adjustments.map((adj, index) => (
          <div
            key={adj.id || index}
            className="flex items-start gap-3 p-3 rounded-md border bg-muted/30"
          >
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-muted">
                  {typeLabels[adj.type]}
                </span>
                <span className="text-xs text-muted-foreground">
                  Efeito: {formatCurrency(adj.value)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-40">
                  <Label className="text-xs">{getInputLabel(adj.type)}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={numStr(parseFloat(getDisplayValue(adj)))}
                    onChange={(e) => handleValueChange(index, e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs">Motivo</Label>
                  <Input
                    value={adj.reason ?? ""}
                    onChange={(e) => handleReasonChange(index, e.target.value)}
                    placeholder="Ex: Fidelidade, Negociação..."
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive shrink-0 mt-1"
              onClick={() => handleRemove(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {adjustments.length > 0 && (
          <div className="flex items-center justify-between border-t pt-2">
            <Label className="text-sm text-muted-foreground">
              Valor Final após Ajustes
            </Label>
            <span
              className={`text-sm font-semibold ${finalValue < 0 ? "text-destructive" : ""}`}
            >
              {formatCurrency(finalValue)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
