"use client";

import { Percent, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { OfficeSummaryDto } from "@/lib/types/overhead";

const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const healthColorMap: Record<string, string> = {
  green: "bg-green-100 text-green-800 border-green-300",
  blue: "bg-blue-100 text-blue-800 border-blue-300",
  yellow: "bg-yellow-100 text-yellow-800 border-yellow-300",
  red: "bg-red-100 text-red-800 border-red-300",
  gray: "bg-gray-100 text-gray-800 border-gray-300",
};

interface Props {
  summary: OfficeSummaryDto;
}

export function RaioXPanel({ summary }: Props) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Raio-X do Escritório</h3>
          <Badge
            variant="outline"
            className={healthColorMap[summary.overheadHealthColor] ?? healthColorMap.gray}
          >
            {summary.overheadHealthLabel}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Overhead */}
          <div className="flex items-start gap-3" title="Overhead = (Outras categorias ÷ Pessoal) × 100">
            <div className="rounded-lg p-2 bg-muted">
              <Percent className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Overhead</p>
              <p className="text-xl font-bold">
                {summary.overheadPercent != null
                  ? `${summary.overheadPercent.toFixed(1)}%`
                  : "N/A"}
                {summary.overheadValue != null && (
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    ({brl(summary.overheadValue)}/h)
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Total geral mensal */}
          <div className="flex items-start gap-3" title="Total geral = Pessoal + Outras categorias">
            <div className="rounded-lg p-2 bg-muted">
              <Building2 className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total mensal</p>
              <p className="text-xl font-bold">{brl(summary.totalGeral)}</p>
            </div>
          </div>
        </div>

        {/* Details row */}
        <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div>
            <span>Pessoal: </span>
            <span className="font-medium text-foreground">{brl(summary.pessoalTotal)}</span>
          </div>
          <div>
            <span>Outras: </span>
            <span className="font-medium text-foreground">{brl(summary.outrasCategoriasTotal)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
