"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProposalDiscountType } from "@/lib/types";

interface DiscountControlsProps {
  subtotal: number;
  discountType: ProposalDiscountType;
  discountPercent?: number;
  discountValue?: number;
  roundingValue?: number;
  onDiscountTypeChange: (type: ProposalDiscountType) => void;
  onDiscountPercentChange: (value: number | undefined) => void;
  onDiscountValueChange: (value: number | undefined) => void;
  onRoundingValueChange: (value: number | undefined) => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function DiscountControls({
  subtotal,
  discountType,
  discountPercent,
  discountValue,
  roundingValue,
  onDiscountTypeChange,
  onDiscountPercentChange,
  onDiscountValueChange,
  onRoundingValueChange,
}: DiscountControlsProps) {
  let discount = 0;
  if (discountType === "Percentage") {
    discount = subtotal * ((discountPercent ?? 0) / 100);
  } else if (discountType === "Absolute") {
    discount = discountValue ?? 0;
  }
  const discountedValue = subtotal - discount;
  const finalValue = roundingValue && roundingValue > 0 ? roundingValue : discountedValue;
  const adjustment = roundingValue && roundingValue > 0 ? roundingValue - discountedValue : 0;

  return (
    <div className="space-y-3 pt-3 border-t">
      <div className="flex items-center gap-3">
        <Label className="text-xs whitespace-nowrap">Desconto:</Label>
        <select
          value={discountType}
          onChange={(e) => onDiscountTypeChange(e.target.value as ProposalDiscountType)}
          className="flex h-8 rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="None">Nenhum</option>
          <option value="Percentage">Percentual</option>
          <option value="Absolute">Valor Fixo</option>
        </select>

        {discountType === "Percentage" && (
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min={0}
              max={100}
              step="0.1"
              value={discountPercent ?? ""}
              onChange={(e) => onDiscountPercentChange(e.target.value ? parseFloat(e.target.value) : undefined)}
              className="w-20 h-8 text-xs"
            />
            <span className="text-xs text-muted-foreground">%</span>
            {discount > 0 && (
              <span className="text-xs text-destructive ml-1">(-{formatCurrency(discount)})</span>
            )}
          </div>
        )}

        {discountType === "Absolute" && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">R$</span>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={discountValue ?? ""}
              onChange={(e) => onDiscountValueChange(e.target.value ? parseFloat(e.target.value) : undefined)}
              className="w-28 h-8 text-xs"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Label className="text-xs whitespace-nowrap">Arredondamento:</Label>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">R$</span>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={roundingValue ?? ""}
            onChange={(e) => onRoundingValueChange(e.target.value ? parseFloat(e.target.value) : undefined)}
            className="w-28 h-8 text-xs"
          />
        </div>
        {adjustment !== 0 && (
          <span className={`text-xs ${adjustment > 0 ? "text-green-600" : "text-destructive"}`}>
            Ajuste: {adjustment > 0 ? "+" : ""}{formatCurrency(adjustment)}
          </span>
        )}
      </div>

      {discountedValue < 0 && (
        <p className="text-xs text-destructive">Atenção: o valor da seção ficou negativo após o desconto.</p>
      )}

      <div className="flex justify-end text-sm font-medium">
        Valor Final: {formatCurrency(finalValue)}
      </div>
    </div>
  );
}
