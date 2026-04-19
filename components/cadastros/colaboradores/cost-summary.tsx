"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { TipoVinculo, ModoEncargos, ModoBeneficios } from "@/lib/types";

const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export interface CostSummaryData {
  tipoVinculo: TipoVinculo;
  horasMensais: number;

  // CLT
  salarioBruto: number;
  modoEncargos: ModoEncargos;
  encargosPercentual: number;
  encargoINSS: number;
  encargoFGTS: number;
  encargo13Salario: number;
  encargoFerias: number;
  encargoOutros: number;

  // Terceiros
  valorMensalNF: number;
  encargosTerceirosTotal: number;

  // Estagiário
  bolsaAuxilio: number;
  seguroEstagio: number;
  auxilioTransporteEstagio: number;
  recessoRemunerado: number;

  // Benefícios
  modoBeneficios: ModoBeneficios;
  beneficiosMensais: number;
  planoSaudeValor: number;
  auxilioTransporteValor: number;
  auxilioAlimentacaoValor: number;
  beneficiosExtrasTotal: number;
}

function calcularEncargosPercentual(data: CostSummaryData): number {
  if (data.modoEncargos === "Detalhado") {
    return (
      (data.encargoINSS || 0) +
      (data.encargoFGTS || 0) +
      (data.encargo13Salario || 0) +
      (data.encargoFerias || 0) +
      (data.encargoOutros || 0)
    );
  }
  return data.encargosPercentual || 75;
}

function calcularBeneficios(data: CostSummaryData): {
  total: number;
  descontoTransporte: number;
  descontoAlimentacao: number;
} {
  if (data.modoBeneficios === "ValorUnico") {
    return { total: data.beneficiosMensais, descontoTransporte: 0, descontoAlimentacao: 0 };
  }

  const isCLT = data.tipoVinculo === "CLT";

  let custoTransporte = data.auxilioTransporteValor || 0;
  let descontoTransporte = 0;
  let custoAlimentacao = data.auxilioAlimentacaoValor || 0;
  let descontoAlimentacao = 0;

  if (isCLT) {
    descontoTransporte = Math.min(data.salarioBruto * 0.06, custoTransporte);
    custoTransporte = custoTransporte - descontoTransporte;
    descontoAlimentacao = custoAlimentacao * 0.2;
    custoAlimentacao = custoAlimentacao * 0.8;
  }

  const total =
    (data.planoSaudeValor || 0) +
    custoTransporte +
    custoAlimentacao +
    (data.beneficiosExtrasTotal || 0);

  return { total, descontoTransporte, descontoAlimentacao };
}

export function calcularCustoTotal(data: CostSummaryData): number {
  const beneficios = calcularBeneficios(data);

  if (data.tipoVinculo === "CLT") {
    const sal = data.salarioBruto || 0;
    const encPerc = calcularEncargosPercentual(data);
    const encargosValor = sal * encPerc / 100;
    return sal + encargosValor + beneficios.total;
  }

  if (data.tipoVinculo === "Terceiros") {
    const nf = data.valorMensalNF || 0;
    const encargos = (data.encargosTerceirosTotal || 0) / 100 * nf;
    return nf + encargos + beneficios.total;
  }

  // Estagiário
  const custoBase =
    (data.bolsaAuxilio || 0) +
    (data.seguroEstagio || 0) +
    (data.auxilioTransporteEstagio || 0) +
    (data.recessoRemunerado || 0);
  return custoBase + beneficios.total;
}

interface Props {
  data: CostSummaryData;
}

export function CostSummary({ data }: Props) {
  const custoTotal = calcularCustoTotal(data);
  const custoHora = data.horasMensais > 0 ? custoTotal / data.horasMensais : 0;
  const beneficios = calcularBeneficios(data);

  if (custoTotal <= 0) return null;

  return (
    <Card className="bg-muted/30">
      <CardContent className="pt-4 space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Custo Total Mensal</span>
          <span className="font-semibold text-lg">{brl(custoTotal)}</span>
        </div>

        {data.tipoVinculo === "CLT" && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Encargos Patronais</span>
            <span className="font-medium">
              {calcularEncargosPercentual(data).toFixed(2).replace(".", ",")}%
            </span>
          </div>
        )}

        {data.tipoVinculo === "Terceiros" && data.encargosTerceirosTotal > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Encargos NF</span>
            <span className="font-medium">
              {brl((data.encargosTerceirosTotal / 100) * data.valorMensalNF)}
            </span>
          </div>
        )}

        {beneficios.total > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Benefícios</span>
            <span className="font-medium">{brl(beneficios.total)}</span>
          </div>
        )}

        {data.tipoVinculo === "CLT" && beneficios.descontoTransporte > 0 && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Desconto transporte (6% salário)</span>
            <span>-{brl(beneficios.descontoTransporte)}</span>
          </div>
        )}

        {data.tipoVinculo === "CLT" && beneficios.descontoAlimentacao > 0 && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Desconto alimentação (20%)</span>
            <span>-{brl(beneficios.descontoAlimentacao)}</span>
          </div>
        )}

        {data.horasMensais > 0 && (
          <div className="flex justify-between text-sm border-t pt-1 mt-1">
            <span className="text-muted-foreground">Custo/Hora</span>
            <span className="font-medium">{brl(custoHora)}/h</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
