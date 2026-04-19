"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { getCargoStats } from "@/lib/api/cargos";

const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v);

interface CargoStatsBadgeProps {
  cargoId?: string;
  valorHora: number;
}

export function CargoStatsBadge({ cargoId, valorHora }: CargoStatsBadgeProps) {
  const { data: stats } = useQuery({
    queryKey: ["cargo-stats", cargoId],
    queryFn: () => getCargoStats(cargoId!),
    enabled: !!cargoId,
  });

  if (!stats || stats.colaboradoresCount === 0) return null;

  const belowMin =
    stats.minCustoHora !== null && valorHora > 0 && valorHora < stats.minCustoHora;

  return (
    <div className="space-y-1">
      <div className="flex gap-3 text-xs text-muted-foreground">
        <span>Min: {brl(stats.minCustoHora!)}/h</span>
        <span>Med: {brl(stats.medCustoHora!)}/h</span>
        <span>Max: {brl(stats.maxCustoHora!)}/h</span>
        <span className="text-muted-foreground/60">
          ({stats.colaboradoresCount} colaborador{stats.colaboradoresCount > 1 ? "es" : ""})
        </span>
      </div>
      {belowMin && (
        <div className="flex items-center gap-1.5 text-xs text-amber-600">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>
            Valor abaixo do custo mínimo dos colaboradores ({brl(stats.minCustoHora!)}/h)
          </span>
        </div>
      )}
    </div>
  );
}
