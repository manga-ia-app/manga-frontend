"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  Search,
  FolderKanban,
  ArrowRight,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { getProjetos } from "@/lib/api/projetos";
import { getServicosContratados } from "@/lib/api/servicos-contratados";
import type { Projeto, ServicoContratado, ServicoContratadoStatus } from "@/lib/types";

const statusConfig: Record<
  ServicoContratadoStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: React.ElementType;
  }
> = {
  Pending: { label: "Pendente", variant: "secondary", icon: Clock },
  InProgress: { label: "Em Andamento", variant: "default", icon: CheckCircle2 },
  Completed: { label: "Concluido", variant: "outline", icon: CheckCircle2 },
  Cancelled: { label: "Cancelado", variant: "destructive", icon: XCircle },
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function ServicosContratadosPage() {
  const router = useRouter();
  const [selectedProjetoId, setSelectedProjetoId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("todos");

  const { data: projetosData, isLoading: isLoadingProjetos } = useQuery({
    queryKey: ["projetos-servicos"],
    queryFn: () => getProjetos({ pageSize: 200 }),
  });

  const { data: servicosData, isLoading: isLoadingServicos } = useQuery({
    queryKey: ["servicos-contratados", selectedProjetoId],
    queryFn: () =>
      getServicosContratados(selectedProjetoId, { pageSize: 200 }),
    enabled: !!selectedProjetoId,
  });

  const projetos = projetosData?.items ?? [];
  const servicos = servicosData?.items ?? [];
  const selectedProjeto = projetos.find((p) => p.id === selectedProjetoId);

  const filteredServicos = servicos.filter((s) => {
    const matchesSearch =
      !search || s.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      filterStatus === "todos" || s.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalContratado = servicos.reduce(
    (sum, s) => sum + s.totalPrice,
    0
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Servicos Contratados"
        description="Gerencie os servicos contratados de cada projeto"
      />

      {/* Project selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FolderKanban className="h-4 w-4" />
            Selecione o Projeto
          </CardTitle>
          <CardDescription>
            Escolha um projeto para visualizar os servicos contratados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1 max-w-md">
              <Select
                value={selectedProjetoId}
                onValueChange={setSelectedProjetoId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um projeto..." />
                </SelectTrigger>
                <SelectContent>
                  {projetos.map((projeto) => (
                    <SelectItem key={projeto.id} value={projeto.id}>
                      {projeto.name}
                      {projeto.clienteName ? ` - ${projeto.clienteName}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedProjeto && (
              <Button
                variant="outline"
                onClick={() =>
                  router.push(
                    `/projetos/${selectedProjetoId}/servicos-contratados`
                  )
                }
              >
                Ir para o Projeto
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* No project selected */}
      {!selectedProjetoId && !isLoadingProjetos && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ClipboardList className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">
              Selecione um projeto acima
            </h3>
            <p className="text-sm text-muted-foreground mt-1 text-center max-w-md">
              Para visualizar os servicos contratados, selecione um projeto na
              lista acima. Voce podera acompanhar o andamento e pagamentos de
              cada servico.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Services list */}
      {selectedProjetoId && (
        <>
          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-1">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  Total Contratado
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(totalContratado)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar servicos..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="InProgress">Em Andamento</SelectItem>
                <SelectItem value="Pending">Pendente</SelectItem>
                <SelectItem value="Completed">Concluido</SelectItem>
                <SelectItem value="Cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoadingServicos ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-28 animate-pulse rounded-lg bg-muted"
                />
              ))}
            </div>
          ) : filteredServicos.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">
                  Nenhum servico contratado encontrado
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Este projeto ainda nao possui servicos contratados.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredServicos.map((servico) => {
                const sc = statusConfig[servico.status];
                const StatusIcon = sc.icon;
                const etapasCount = servico.etapas?.length ?? 0;
                const etapasConcluidas =
                  servico.etapas?.filter((e) => e.status === "Completed")
                    .length ?? 0;

                return (
                  <Card key={servico.id} className="transition-colors hover:bg-muted/50">
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-sm">
                              {servico.description}
                            </h3>
                            <Badge variant={sc.variant}>
                              <StatusIcon className="mr-1 h-3 w-3" />
                              {sc.label}
                            </Badge>
                          </div>

                          {servico.fornecedorName && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Building className="h-3 w-3" />
                              {servico.fornecedorName}
                            </p>
                          )}

                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                            {servico.startDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Inicio:{" "}
                                {format(
                                  parseISO(servico.startDate),
                                  "dd/MM/yyyy",
                                  { locale: ptBR }
                                )}
                              </span>
                            )}
                            {servico.endDate && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Previsao:{" "}
                                {format(
                                  parseISO(servico.endDate),
                                  "dd/MM/yyyy",
                                  { locale: ptBR }
                                )}
                              </span>
                            )}
                            {etapasCount > 0 && (
                              <span>
                                {etapasConcluidas}/{etapasCount} etapas
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-lg font-bold">
                            {formatCurrency(servico.totalPrice)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            contratado
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
