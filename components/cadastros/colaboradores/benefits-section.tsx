"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import type { ModoBeneficios, TipoVinculo, BeneficioExtra } from "@/lib/types";

const numStr = (v: number | undefined) => (v ? String(v) : "");

const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

interface Props {
  modoBeneficios: ModoBeneficios;
  onModeChange: (mode: ModoBeneficios) => void;
  tipoVinculo: TipoVinculo;
  salarioBruto: number;

  planoSaudeValor: number;
  planoSaudeDependentes: number;
  auxilioTransporteValor: number;
  auxilioAlimentacaoValor: number;
  beneficiosMensais: number;
  beneficiosExtras: BeneficioExtra[];

  onFieldChange: (field: string, value: unknown) => void;
  onExtrasChange: (extras: BeneficioExtra[]) => void;
}

export function BenefitsSection({
  modoBeneficios,
  onModeChange,
  tipoVinculo,
  salarioBruto,
  planoSaudeValor,
  planoSaudeDependentes,
  auxilioTransporteValor,
  auxilioAlimentacaoValor,
  beneficiosMensais,
  beneficiosExtras,
  onFieldChange,
  onExtrasChange,
}: Props) {
  const isCLT = tipoVinculo === "CLT";
  const isDetalhado = modoBeneficios === "Detalhado";

  const descontoTransporte = isCLT
    ? Math.min(salarioBruto * 0.06, auxilioTransporteValor || 0)
    : 0;
  const descontoAlimentacao = isCLT ? (auxilioAlimentacaoValor || 0) * 0.2 : 0;

  const addExtra = () => {
    onExtrasChange([...beneficiosExtras, { name: "", value: 0 }]);
  };

  const removeExtra = (index: number) => {
    onExtrasChange(beneficiosExtras.filter((_, i) => i !== index));
  };

  const updateExtra = (index: number, field: "name" | "value", val: unknown) => {
    const updated = [...beneficiosExtras];
    updated[index] = { ...updated[index], [field]: val };
    onExtrasChange(updated);
  };

  const extrasTotal = beneficiosExtras.reduce((sum, e) => sum + (e.value || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Label>Modo de Benefícios</Label>
        <Select
          value={modoBeneficios}
          onValueChange={(val) => onModeChange(val as ModoBeneficios)}
        >
          <SelectTrigger className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm" aria-label="Modo de benefícios">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Detalhado">Detalhado</SelectItem>
            <SelectItem value="ValorUnico">Valor Único</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!isDetalhado ? (
        <div className="space-y-2">
          <Label htmlFor="beneficiosMensais">Valor Total de Benefícios (R$)</Label>
          <Input
            id="beneficiosMensais"
            type="number"
            min={0}
            value={numStr(beneficiosMensais)}
            onChange={(e) => onFieldChange("beneficiosMensais", parseFloat(e.target.value) || 0)}
            placeholder="0"
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="planoSaudeValor">Plano de Saúde (R$)</Label>
              <Input
                id="planoSaudeValor"
                type="number"
                min={0}
                value={numStr(planoSaudeValor)}
                onChange={(e) => onFieldChange("planoSaudeValor", parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="planoSaudeDependentes">Dependentes (info)</Label>
              <Input
                id="planoSaudeDependentes"
                type="number"
                min={0}
                value={numStr(planoSaudeDependentes)}
                onChange={(e) => onFieldChange("planoSaudeDependentes", parseInt(e.target.value) || 0)}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">Informativo, não afeta cálculo</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="auxilioTransporteValor">Auxílio Transporte (R$)</Label>
              <Input
                id="auxilioTransporteValor"
                type="number"
                min={0}
                value={numStr(auxilioTransporteValor)}
                onChange={(e) =>
                  onFieldChange("auxilioTransporteValor", parseFloat(e.target.value) || 0)
                }
                placeholder="0"
              />
              {isCLT && descontoTransporte > 0 && (
                <p className="text-xs text-muted-foreground">
                  Desconto 6% do salário: -{brl(descontoTransporte)}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="auxilioAlimentacaoValor">Auxílio Alimentação (R$)</Label>
              <Input
                id="auxilioAlimentacaoValor"
                type="number"
                min={0}
                value={numStr(auxilioAlimentacaoValor)}
                onChange={(e) =>
                  onFieldChange("auxilioAlimentacaoValor", parseFloat(e.target.value) || 0)
                }
                placeholder="0"
              />
              {isCLT && descontoAlimentacao > 0 && (
                <p className="text-xs text-muted-foreground">
                  Desconto 20%: -{brl(descontoAlimentacao)}
                </p>
              )}
            </div>
          </div>

          {/* Benefícios Extras */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Benefícios Extras</Label>
              <Button type="button" variant="outline" size="sm" onClick={addExtra}>
                <Plus className="h-3 w-3 mr-1" aria-hidden="true" /> Adicionar
              </Button>
            </div>
            {beneficiosExtras.map((extra, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input
                  placeholder="Nome do benefício"
                  value={extra.name}
                  onChange={(e) => updateExtra(i, "name", e.target.value)}
                  className="flex-1"
                  aria-label={`Nome do benefício extra ${i + 1}`}
                />
                <Input
                  type="number"
                  min={0}
                  placeholder="Valor"
                  value={numStr(extra.value)}
                  onChange={(e) => updateExtra(i, "value", parseFloat(e.target.value) || 0)}
                  className="w-32"
                  aria-label={`Valor do benefício extra ${i + 1}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeExtra(i)}
                  aria-label={`Remover benefício extra ${i + 1}`}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            ))}
            {extrasTotal > 0 && (
              <p className="text-xs text-muted-foreground">
                Total extras: {brl(extrasTotal)}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
