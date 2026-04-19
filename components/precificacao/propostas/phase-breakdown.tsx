"use client";

import type { ProposalSectionPhase } from "@/lib/types";

interface PhaseBreakdownProps {
  phase: ProposalSectionPhase;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function PhaseBreakdown({ phase }: PhaseBreakdownProps) {
  const baseCost = phase.activityCost + phase.overheadValue + phase.complexityValue;
  const basePrice = baseCost + phase.marginValue;

  const lines = [
    { label: "Custo Atividades", value: phase.activityCost },
    { label: `+ Overhead (${formatPercent(phase.overheadPercent)})`, value: phase.overheadValue },
    { label: `+ Complexidade (${formatPercent(phase.complexityPercent)})`, value: phase.complexityValue },
    { label: "= Custo Total", value: baseCost, bold: true },
    { label: `+ Margem (${formatPercent(phase.marginPercent)})`, value: phase.marginValue },
    { label: "= Preço Base", value: basePrice, bold: true },
    ...(phase.additionalCosts > 0 ? [{ label: "+ Custos Adicionais", value: phase.additionalCosts }] : []),
    { label: `+ Imposto (${formatPercent(phase.taxPercent)})`, value: phase.taxValue },
    { label: "= Total", value: phase.totalValue, bold: true },
  ];

  return (
    <div className="space-y-1">
      <h4 className="text-xs font-semibold text-muted-foreground mb-2">Composição de Preço</h4>
      {lines.map((line, i) => (
        <div key={i} className={`flex justify-between text-xs ${line.bold ? "font-semibold border-t pt-1" : ""}`}>
          <span className={line.bold ? "" : "text-muted-foreground"}>{line.label}</span>
          <span className="font-mono">{formatCurrency(line.value)}</span>
        </div>
      ))}
    </div>
  );
}
