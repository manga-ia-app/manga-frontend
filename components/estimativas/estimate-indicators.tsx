"use client";

import { Card, CardContent } from "@/components/ui/card";

interface EstimateIndicatorsProps {
  totalCost: number;
  finalValue: number;
  marginPercent: number;
  marginValue: number;
  totalHours: number;
  activeCount: number;
  filledCount: number;
  totalCount: number;
  areaM2?: number;
  costPerM2?: number;
  phases: { name: string; directCost: number }[];
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function EstimateIndicators({
  totalCost,
  finalValue,
  marginPercent,
  marginValue,
  totalHours,
  activeCount,
  filledCount,
  totalCount,
  areaM2,
  costPerM2,
  phases,
}: EstimateIndicatorsProps) {
  const effectiveMargin =
    finalValue > 0 ? ((finalValue - totalCost) / finalValue) * 100 : 0;

  const progressPercent = totalCount > 0 ? (filledCount / totalCount) * 100 : 0;

  return (
    <Card>
      <CardContent className="pt-4 space-y-4">
        {/* Key metrics grid */}
        <div className="grid grid-cols-2 gap-3">
          <Metric label="Custo Total" value={formatCurrency(totalCost)} />
          <Metric
            label="Preço de Venda"
            value={formatCurrency(finalValue)}
            highlight={finalValue < totalCost}
          />
          <Metric
            label="Margem"
            value={`${effectiveMargin.toFixed(1)}% (${formatCurrency(marginValue)})`}
            highlight={effectiveMargin < 0}
          />
          <Metric label="Horas Totais" value={`${totalHours.toFixed(1)}h`} />
          {areaM2 && costPerM2 !== undefined && (
            <Metric
              label="Custo/m²"
              value={formatCurrency(costPerM2)}
            />
          )}
        </div>

        {/* Activity progress */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Atividades preenchidas
            </span>
            <span className="font-medium">
              {filledCount} de {totalCount}
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Cost per phase */}
        {phases.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              Custo por Fase
            </p>
            {phases.map((phase) => (
              <div
                key={phase.name}
                className="flex items-center justify-between text-xs py-0.5"
              >
                <span className="text-muted-foreground truncate mr-2">
                  {phase.name}
                </span>
                <span className="tabular-nums shrink-0">
                  {formatCurrency(phase.directCost)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`text-sm font-semibold tabular-nums ${highlight ? "text-destructive" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}
