"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

const numStr = (v: number) => (v ? String(v) : "");

const FREQUENCY_OPTIONS = [
  { key: "monthly", months: 1, label: "Mensal" },
  { key: "quarterly", months: 3, label: "Trimestral" },
  { key: "yearly", months: 12, label: "Anual" },
  { key: "custom", months: 0, label: "Personalizado" },
] as const;

function resolveFrequencyKey(frequencyMonths: number): string {
  const match = FREQUENCY_OPTIONS.find((o) => o.key !== "custom" && o.months === frequencyMonths);
  return match ? match.key : "custom";
}

export interface CostItemLocal {
  name: string;
  value: number;
  frequencyMonths: number;
}

interface Props {
  item: CostItemLocal;
  index: number;
  categoryName: string;
  onChange: (updated: CostItemLocal) => void;
  onDelete: () => void;
  readOnly?: boolean;
}

export function CostItemRow({ item, index, categoryName, onChange, onDelete, readOnly }: Props) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const monthlyValue = item.frequencyMonths > 0
    ? Math.round((item.value / item.frequencyMonths) * 100) / 100
    : 0;

  const brl = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  if (readOnly) {
    return (
      <div className="flex items-center justify-between py-1.5 px-2 rounded-md text-sm">
        <span>{item.name}</span>
        <span className="font-medium tabular-nums">{brl(monthlyValue)}/mês</span>
      </div>
    );
  }

  const freqKey = resolveFrequencyKey(item.frequencyMonths);
  const isCustom = freqKey === "custom";

  const nameId = `item-name-${categoryName}-${index}`;
  const valueId = `item-value-${categoryName}-${index}`;
  const freqId = `item-freq-${categoryName}-${index}`;
  const customFreqId = `item-custom-freq-${categoryName}-${index}`;

  return (
    <div className="grid grid-cols-[1fr_120px_auto_80px_auto] gap-2 items-end">
      <div className="space-y-1">
        <Label htmlFor={nameId} className="text-xs">Nome</Label>
        <Input
          id={nameId}
          value={item.name}
          onChange={(e) => onChange({ ...item, name: e.target.value })}
          placeholder="Nome do item"
          className="h-8 text-sm"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={valueId} className="text-xs">Valor (R$)</Label>
        <Input
          id={valueId}
          type="number"
          min={0}
          step="0.01"
          value={numStr(item.value)}
          onChange={(e) => onChange({ ...item, value: parseFloat(e.target.value) || 0 })}
          placeholder="0"
          className="h-8 text-sm"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={freqId} className="text-xs">Frequência</Label>
        <div className="flex gap-1">
          <Select value={freqKey} onValueChange={(val) => {
              const selected = FREQUENCY_OPTIONS.find((o) => o.key === val);
              if (selected && selected.key !== "custom") {
                onChange({ ...item, frequencyMonths: selected.months });
              } else {
                onChange({ ...item, frequencyMonths: Math.max(1, item.frequencyMonths) });
              }
            }}>
            <SelectTrigger id={freqId} className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FREQUENCY_OPTIONS.map((o) => (
                <SelectItem key={o.key} value={o.key}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isCustom && (
            <Input
              id={customFreqId}
              type="number"
              min={1}
              value={numStr(item.frequencyMonths)}
              onChange={(e) =>
                onChange({ ...item, frequencyMonths: Math.max(1, parseInt(e.target.value) || 1) })
              }
              placeholder="meses"
              className="h-8 w-16 text-sm"
              aria-label="Meses personalizado"
            />
          )}
        </div>
      </div>
      <div className="space-y-1">
        <span className="text-xs text-muted-foreground block">/mês</span>
        <span className="text-sm font-medium tabular-nums block h-8 flex items-center">
          {brl(monthlyValue)}
        </span>
      </div>
      <div className="space-y-1">
        <span className="text-xs block invisible">Del</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => setShowDeleteConfirm(true)}
          aria-label={`Excluir item ${item.name}`}
        >
          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
        </Button>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Excluir item"
        description={`Excluir item "${item.name}"?`}
        confirmLabel="Excluir"
        variant="destructive"
        onConfirm={() => onDelete()}
      />
    </div>
  );
}
