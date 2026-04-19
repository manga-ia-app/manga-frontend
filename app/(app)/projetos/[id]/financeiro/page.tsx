"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import apiClient from "@/lib/api/client";
import type {
  LancamentoFinanceiro,
  FinancialSummary,
  LancamentoType,
  PaymentStatus,
} from "@/lib/types";

// Local API helpers
const fetchLancamentos = async (projetoId: string): Promise<LancamentoFinanceiro[]> => {
  const res = await apiClient.get(`/projetos/${projetoId}/financeiro/lancamentos`);
  return res.data;
};

const fetchFinancialSummary = async (projetoId: string): Promise<FinancialSummary> => {
  const res = await apiClient.get(`/projetos/${projetoId}/financeiro/summary`);
  return res.data;
};

const statusLancamentoConfig: Record<
  PaymentStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  Pending: { label: "Pendente", variant: "outline" },
  Paid: { label: "Pago", variant: "secondary" },
  Overdue: { label: "Atrasado", variant: "destructive" },
  Cancelled: { label: "Cancelado", variant: "destructive" },
};

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

export default function FinanceiroPage() {
  const params = useParams();
  const projetoId = params.id as string;

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ["financeiro-summary", projetoId],
    queryFn: () => fetchFinancialSummary(projetoId),
    enabled: !!projetoId,
  });

  const { data: lancamentos, isLoading: loadingLancamentos } = useQuery({
    queryKey: ["financeiro-lancamentos", projetoId],
    queryFn: () => fetchLancamentos(projetoId),
    enabled: !!projetoId,
  });

  const isLoading = loadingSummary || loadingLancamentos;
  const allLancamentos = lancamentos ?? [];

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receitas
            </CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <div className="h-7 w-28 animate-pulse rounded bg-muted" />
            ) : (
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(summary?.totalPlannedReceitas ?? 0)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Despesas
            </CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <div className="h-7 w-28 animate-pulse rounded bg-muted" />
            ) : (
              <div className="text-2xl font-bold text-destructive">
                {formatCurrency(summary?.totalPlannedDespesas ?? 0)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <div className="h-7 w-28 animate-pulse rounded bg-muted" />
            ) : (
              <div
                className={`text-2xl font-bold ${
                  (summary?.balance ?? 0) >= 0 ? "text-green-600" : "text-destructive"
                }`}
              >
                {formatCurrency(summary?.balance ?? 0)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nova Receita
        </Button>
        <Button variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Nova Despesa
        </Button>
      </div>

      {/* Lancamentos table */}
      {loadingLancamentos ? (
        <Card>
          <CardContent className="py-8">
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 w-full animate-pulse rounded bg-muted" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : allLancamentos.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Nenhum lancamento financeiro</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Registre receitas e despesas do projeto.
          </p>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Lancamento
          </Button>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Descricao</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allLancamentos.map((lancamento) => {
                const statusCfg = statusLancamentoConfig[lancamento.status];
                const isReceita = lancamento.type === "Receita";

                return (
                  <TableRow key={lancamento.id}>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {isReceita ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-destructive" />
                        )}
                        <span className="text-sm">
                          {isReceita ? "Receita" : "Despesa"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {lancamento.description}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {lancamento.fornecedorName ?? "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(lancamento.dueDate)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(lancamento.paymentDate)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusCfg?.variant ?? "outline"}>
                        {statusCfg?.label ?? lancamento.status}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        isReceita ? "text-green-600" : "text-destructive"
                      }`}
                    >
                      {isReceita ? "+" : "-"} {formatCurrency(lancamento.plannedAmount)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
