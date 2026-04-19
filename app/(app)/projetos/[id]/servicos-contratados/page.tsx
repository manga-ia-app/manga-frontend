"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Plus, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import type { ServicoContratado, ServicoContratadoStatus } from "@/lib/types";

// Local API helper
const fetchServicosContratados = async (projetoId: string): Promise<ServicoContratado[]> => {
  const res = await apiClient.get(`/projetos/${projetoId}/servicos-contratados`);
  return res.data;
};

const statusServicoConfig: Record<
  ServicoContratadoStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  Pending: { label: "Pendente", variant: "outline" },
  InProgress: { label: "Em Andamento", variant: "default" },
  Completed: { label: "Concluido", variant: "secondary" },
  Cancelled: { label: "Cancelado", variant: "destructive" },
};

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

export default function ServicosContratadosPage() {
  const params = useParams();
  const projetoId = params.id as string;

  const { data: servicos, isLoading } = useQuery({
    queryKey: ["servicos-contratados", projetoId],
    queryFn: () => fetchServicosContratados(projetoId),
    enabled: !!projetoId,
  });

  const allServicos = servicos ?? [];

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Servicos Contratados</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie os servicos contratados para este projeto.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Servico
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <Card>
          <CardContent className="py-8">
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 w-full animate-pulse rounded bg-muted" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : allServicos.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Nenhum servico contratado</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Registre os servicos contratados com fornecedores.
          </p>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Servico
          </Button>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descricao</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Inicio</TableHead>
                <TableHead>Previsao</TableHead>
                <TableHead className="text-right">Valor Contratado</TableHead>
                <TableHead className="text-right">Progresso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allServicos.map((servico) => {
                const statusCfg = statusServicoConfig[servico.status];
                const etapas = servico.etapas ?? [];
                const etapasConcluidas = etapas.filter((e) => e.status === "Completed").length;
                const progress =
                  etapas.length > 0
                    ? Math.round((etapasConcluidas / etapas.length) * 100)
                    : 0;

                return (
                  <TableRow key={servico.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {servico.description}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {servico.fornecedorName ?? "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusCfg?.variant ?? "outline"}>
                        {statusCfg?.label ?? servico.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(servico.startDate)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(servico.endDate)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(servico.totalPrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-2 w-16 rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-primary transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-8 text-right">
                          {progress}%
                        </span>
                      </div>
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
