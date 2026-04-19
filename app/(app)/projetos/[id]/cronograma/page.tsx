"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Plus, Calendar, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import apiClient from "@/lib/api/client";
import type { CronogramaTarefa, TarefaStatus } from "@/lib/types";

// Local API helper
const fetchTarefas = async (projetoId: string): Promise<CronogramaTarefa[]> => {
  const res = await apiClient.get(`/projetos/${projetoId}/cronograma/tarefas`);
  return res.data;
};

const tarefaStatusConfig: Record<
  TarefaStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  Pending: { label: "Pendente", variant: "outline" },
  InProgress: { label: "Em Andamento", variant: "default" },
  Completed: { label: "Concluida", variant: "secondary" },
  Delayed: { label: "Atrasada", variant: "destructive" },
  Cancelled: { label: "Cancelada", variant: "destructive" },
};

function formatDate(dateStr?: string): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

export default function CronogramaPage() {
  const params = useParams();
  const projetoId = params.id as string;
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: tarefas, isLoading } = useQuery({
    queryKey: ["cronograma-tarefas", projetoId],
    queryFn: () => fetchTarefas(projetoId),
    enabled: !!projetoId,
  });

  const allTarefas = tarefas ?? [];
  const filteredTarefas =
    statusFilter === "all"
      ? allTarefas
      : allTarefas.filter((t) => t.status === statusFilter);

  // Stats
  const totalTarefas = allTarefas.length;
  const concluidas = allTarefas.filter((t) => t.status === "Completed").length;
  const emAndamento = allTarefas.filter((t) => t.status === "InProgress").length;
  const atrasadas = allTarefas.filter((t) => t.status === "Delayed").length;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tarefas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTarefas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Em Andamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{emAndamento}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Concluidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{concluidas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Atrasadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{atrasadas}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="Pending">Pendente</SelectItem>
              <SelectItem value="InProgress">Em Andamento</SelectItem>
              <SelectItem value="Completed">Concluida</SelectItem>
              <SelectItem value="Delayed">Atrasada</SelectItem>
              <SelectItem value="Cancelled">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nova Tarefa
        </Button>
      </div>

      {/* Tasks table */}
      {isLoading ? (
        <Card>
          <CardContent className="py-8">
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 w-full animate-pulse rounded bg-muted" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : filteredTarefas.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Nenhuma tarefa encontrada</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            {statusFilter !== "all"
              ? "Nenhuma tarefa com esse status."
              : "Crie tarefas para acompanhar o cronograma do projeto."}
          </p>
          {statusFilter === "all" && (
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Tarefa
            </Button>
          )}
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titulo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Responsavel</TableHead>
                <TableHead>Inicio</TableHead>
                <TableHead>Fim</TableHead>
                <TableHead className="text-right">Progresso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTarefas.map((tarefa) => {
                const statusCfg = tarefaStatusConfig[tarefa.status];

                return (
                  <TableRow key={tarefa.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {tarefa.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusCfg?.variant ?? "outline"}>
                        {statusCfg?.label ?? tarefa.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {tarefa.assignedUserName ?? "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(tarefa.startDate)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(tarefa.endDate)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-2 w-16 rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-primary transition-all"
                            style={{ width: `${tarefa.progressPercent}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-8 text-right">
                          {tarefa.progressPercent}%
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
