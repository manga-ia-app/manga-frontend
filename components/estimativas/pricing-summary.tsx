"use client";

import { AlertTriangle, HelpCircle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PricingSummaryProps {
  totalActivityCost: number;
  overheadPercent: number;
  totalComplexityValue: number;
  totalAdditionalCosts: number;
  marginPercent: number;
  totalAdjustments: number;
  taxPercent: number;
  monthlyTotalCost?: number;
  monthlyActivityCost?: number;
  monthlyOverhead?: number;
  monthlyComplexity?: number;
  monthlyAdditionalCosts?: number;
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function PricingSummary({
  totalActivityCost,
  overheadPercent,
  totalComplexityValue,
  totalAdditionalCosts,
  marginPercent,
  totalAdjustments,
  taxPercent,
  monthlyTotalCost,
  monthlyActivityCost,
  monthlyOverhead,
  monthlyComplexity,
  monthlyAdditionalCosts,
}: PricingSummaryProps) {
  const overheadValue = totalActivityCost * (overheadPercent / 100);
  const totalCost = totalActivityCost + overheadValue + totalComplexityValue;
  const marginValue = totalCost * (marginPercent / 100);
  const basePrice = totalCost + marginValue;
  const finalValue = basePrice + totalAdditionalCosts + totalAdjustments;
  const taxValue = finalValue * (taxPercent / 100);
  const finalWithTax = finalValue + taxValue;
  const effectiveMargin =
    finalWithTax > 0 ? ((finalWithTax - totalCost) / finalWithTax) * 100 : 0;
  const isNegativeMargin = effectiveMargin < 0;

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-base flex items-center gap-2">
          Composição de Preço
          <span className="group relative">
            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-80 p-3 bg-popover text-popover-foreground text-xs rounded-md shadow-md border hidden group-hover:block z-50 space-y-2">
              <span className="block">
                <strong>Overhead</strong> ({overheadPercent}%) é aplicado sobre o
                custo das atividades de cada etapa.
              </span>
              <span className="block">
                <strong>Complexidade</strong> é calculada por etapa, sobre
                atividades + overhead. O valor exibido aqui é a soma de todas as
                etapas.
              </span>
              <span className="block">
                <strong>Margem</strong> é aplicada como percentual direto sobre o
                custo total (atividades + overhead + complexidade).
              </span>
              <span className="block">
                <strong>Custos adicionais</strong> (das etapas + gerais) são
                somados após a margem.
              </span>
              <span className="block">
                <strong>Imposto</strong> é aplicado sobre o valor final bruto.
              </span>
              <span className="block">
                <strong>Valor do projeto</strong> contempla todas as etapas sem
                cobrança mensal. <strong>Custos mensais</strong> contemplam
                apenas etapas marcadas como cobrança mensal, seguindo a mesma
                composição de preço (overhead, complexidade e margem aplicados).
              </span>
            </span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 pt-0">
        <Row label="Custo das Atividades" value={totalActivityCost} />
        <Row
          label={`+ Overhead (${overheadPercent}%)`}
          value={overheadValue}
          indent
        />
        {totalComplexityValue > 0 && (
          <Row
            label="+ Total de Complexidades"
            value={totalComplexityValue}
            indent
          />
        )}
        <Divider />
        <Row label="Custo Total" value={totalCost} bold />
        <Row
          label={`+ Margem (${marginPercent}%)`}
          value={marginValue}
          indent
        />
        <Divider />
        <Row label="Preço Base" value={basePrice} bold />
        <Row label="+ Custos Adicionais" value={totalAdditionalCosts} indent />
        {totalAdjustments !== 0 && (
          <Row
            label="Ajustes Comerciais"
            value={totalAdjustments}
            indent
            highlight={totalAdjustments < 0}
          />
        )}
        <Divider />
        <Row label="Valor Final" value={finalValue} bold />
        {taxPercent > 0 && (
          <Row
            label={`+ Imposto (${taxPercent}%)`}
            value={taxValue}
            indent
          />
        )}
        {taxPercent > 0 && <Divider />}
        <Row
          label={taxPercent > 0 ? "Total c/ Imposto" : "Valor Final"}
          value={finalWithTax}
          bold
          large
          highlight={isNegativeMargin}
        />

        {isNegativeMargin && (
          <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded px-3 py-2 mt-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>
              Margem efetiva negativa ({effectiveMargin.toFixed(1)}%). O valor
              final não cobre os custos.
            </span>
          </div>
        )}

        {overheadPercent === 0 && (
          <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded px-3 py-2 mt-2">
            <Info className="h-4 w-4 flex-shrink-0" />
            <span>
              Overhead está em 0%. Configure o Raio-X do escritório em
              Configurações → Overhead para calcular automaticamente.
            </span>
          </div>
        )}

        {monthlyTotalCost != null && monthlyTotalCost > 0 && (() => {
          const mCost = monthlyActivityCost ?? 0;
          const mOverhead = monthlyOverhead ?? 0;
          const mComplexity = monthlyComplexity ?? 0;
          const mAdditional = monthlyAdditionalCosts ?? 0;
          const mTotalCost = mCost + mOverhead + mComplexity;
          const mMargin = mTotalCost * (marginPercent / 100);
          const mBasePrice = mTotalCost + mMargin;
          const mTax = monthlyTotalCost * (taxPercent / 100);
          const mTotalWithTax = monthlyTotalCost + mTax;
          return (
            <>
              <Divider />
              <div className="pt-1">
                <p className="text-sm font-semibold mb-1">Custos Mensais (R$/mês)</p>
                <Row label="Custo das Atividades" value={mCost} indent />
                {mOverhead > 0 && <Row label={`+ Overhead (${overheadPercent}%)`} value={mOverhead} indent />}
                {mComplexity > 0 && <Row label="+ Total de Complexidades" value={mComplexity} indent />}
                <Divider />
                <Row label="Custo Total" value={mTotalCost} bold />
                <Row label={`+ Margem (${marginPercent}%)`} value={mMargin} indent />
                <Divider />
                <Row label="Preço Base" value={mBasePrice} bold />
                {mAdditional > 0 && <Row label="+ Custos Adicionais" value={mAdditional} indent />}
                {mAdditional > 0 && <Divider />}
                <Row label="Total Mensal" value={monthlyTotalCost} bold />
                {taxPercent > 0 && (
                  <Row label={`+ Imposto (${taxPercent}%)`} value={mTax} indent />
                )}
                {taxPercent > 0 && <Divider />}
                {taxPercent > 0 && (
                  <Row label="Total c/ Imposto" value={mTotalWithTax} bold />
                )}
                <p className="text-[11px] text-muted-foreground mt-1">
                  Etapas com cobrança mensal são segregadas do valor da proposta.
                </p>
              </div>
            </>
          );
        })()}
      </CardContent>
    </Card>
  );
}

function Row({
  label,
  value,
  bold,
  indent,
  large,
  highlight,
}: {
  label: string;
  value: number;
  bold?: boolean;
  indent?: boolean;
  large?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between py-0.5 ${indent ? "pl-3" : ""}`}
    >
      <span
        className={`text-sm ${bold ? "font-semibold" : "text-muted-foreground"} ${indent ? "text-xs" : ""}`}
      >
        {label}
      </span>
      <span
        className={`text-sm tabular-nums ${bold ? "font-semibold" : ""} ${large ? "text-lg font-bold" : ""} ${highlight ? "text-destructive" : ""}`}
      >
        {formatCurrency(value)}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="border-t border-border/50 my-1" />;
}
