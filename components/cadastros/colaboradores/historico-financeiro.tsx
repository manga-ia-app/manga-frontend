"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { getColaboradorHistorico } from "@/lib/api/cadastros";
import type { HistoricoFinanceiroColaborador } from "@/lib/types";
import { useState } from "react";

const fieldLabels: Record<string, string> = {
  SalarioBruto: "Salário Bruto",
  EncargosPercentual: "Encargos (%)",
  EncargoINSS: "INSS (%)",
  EncargoFGTS: "FGTS (%)",
  Encargo13Salario: "13º Salário (%)",
  EncargoFerias: "Férias (%)",
  EncargoOutros: "Outros Encargos (%)",
  ModoEncargos: "Modo Encargos",
  ValorMensalNF: "Valor Mensal NF",
  BolsaAuxilio: "Bolsa Auxílio",
  SeguroEstagio: "Seguro Estágio",
  AuxilioTransporteEstagio: "Auxílio Transporte (Estágio)",
  RecessoRemunerado: "Recesso Remunerado",
  ModoBeneficios: "Modo Benefícios",
  BeneficiosMensais: "Benefícios Mensais",
  PlanoSaudeValor: "Plano de Saúde",
  AuxilioTransporteValor: "Auxílio Transporte",
  AuxilioAlimentacaoValor: "Auxílio Alimentação",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface Props {
  colaboradorId: string;
}

export function HistoricoFinanceiro({ colaboradorId }: Props) {
  const [open, setOpen] = useState(false);

  const { data: historico = [], isLoading } = useQuery<HistoricoFinanceiroColaborador[]>({
    queryKey: ["colaborador-historico", colaboradorId],
    queryFn: () => getColaboradorHistorico(colaboradorId),
    enabled: open,
  });

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between" type="button">
          <span>Histórico de Alterações Financeiras</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        {isLoading && (
          <p className="text-sm text-muted-foreground py-4 text-center">Carregando...</p>
        )}
        {!isLoading && historico.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Nenhuma alteração financeira registrada.
          </p>
        )}
        {historico.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {historico.map((h) => (
              <div
                key={h.id}
                className="flex items-start gap-3 text-sm border rounded-md p-2"
              >
                <div className="flex-1">
                  <div className="font-medium">
                    {fieldLabels[h.campoAlterado] ?? h.campoAlterado}
                  </div>
                  <div className="text-muted-foreground">
                    {h.valorAnterior || "—"} → {h.valorNovo || "—"}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground text-right whitespace-nowrap">
                  <div>{formatDate(h.alteradoEm)}</div>
                  <div>{h.alteradoPor}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
