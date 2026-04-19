"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Plus, Search, FileText, Filter, Pencil } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";

import { getPropostas } from "@/lib/api/crm";
import type { Proposta, PropostaStatus } from "@/lib/types";

const statusConfig: Record<
  PropostaStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  Draft: { label: "Rascunho", variant: "outline" },
  Sent: { label: "Enviada", variant: "secondary" },
  Viewed: { label: "Visualizada", variant: "secondary" },
  Accepted: { label: "Aceita", variant: "default" },
  Rejected: { label: "Recusada", variant: "destructive" },
  Expired: { label: "Expirada", variant: "outline" },
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function PropostasPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("todos");

  const { data, isLoading } = useQuery({
    queryKey: ["propostas", search, filterStatus],
    queryFn: () =>
      getPropostas({
        search: search || undefined,
        status: filterStatus !== "todos" ? filterStatus : undefined,
      }),
  });

  const propostas = data?.items ?? [];

  const columns: DataTableColumn<Proposta>[] = [
    {
      key: "title",
      header: "Titulo",
      render: (proposta) => (
        <div>
          <p className="font-medium">{proposta.title}</p>
          {proposta.content && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {proposta.content}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "cliente",
      header: "Cliente / Lead",
      render: (proposta) => (
        <span className="text-sm">
          {proposta.leadId ? "Lead" : proposta.clienteId ? "Cliente" : "-"}
        </span>
      ),
    },
    {
      key: "valorTotal",
      header: "Valor Total",
      render: (proposta) => (
        <span className="font-medium">{formatCurrency(proposta.totalValue)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (proposta) => {
        const config = statusConfig[proposta.status];
        return (
          <Badge variant={config.variant}>{config.label}</Badge>
        );
      },
    },
    {
      key: "dataValidade",
      header: "Validade",
      render: (proposta) => (
        <span className="text-sm text-muted-foreground">
          {proposta.validUntil
            ? format(parseISO(proposta.validUntil), "dd/MM/yyyy", {
                locale: ptBR,
              })
            : "-"}
        </span>
      ),
    },
    {
      key: "criadoEm",
      header: "Criada em",
      render: (proposta) => (
        <span className="text-sm text-muted-foreground">
          {format(parseISO(proposta.createdAt), "dd/MM/yyyy", { locale: ptBR })}
        </span>
      ),
    },
    {
      key: "acoes",
      header: "",
      render: (proposta) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/crm/propostas/${proposta.id}`);
          }}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Propostas"
        description="Gerencie suas propostas comerciais"
        action={
          <Button onClick={() => router.push("/crm/propostas/nova")}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Proposta
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar propostas..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="Draft">Rascunho</SelectItem>
              <SelectItem value="Sent">Enviada</SelectItem>
              <SelectItem value="Viewed">Visualizada</SelectItem>
              <SelectItem value="Accepted">Aceita</SelectItem>
              <SelectItem value="Rejected">Recusada</SelectItem>
              <SelectItem value="Expired">Expirada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{data?.totalCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Em Aberto</p>
            <p className="text-2xl font-bold">
              {propostas.filter(
                (p) => p.status === "Draft" || p.status === "Sent" || p.status === "Viewed"
              ).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Aceitas</p>
            <p className="text-2xl font-bold text-green-600">
              {propostas.filter((p) => p.status === "Accepted").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Valor Total</p>
            <p className="text-2xl font-bold">
              {formatCurrency(
                propostas.reduce((sum, p) => sum + p.totalValue, 0)
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      {propostas.length === 0 && !isLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Nenhuma proposta encontrada</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Crie sua primeira proposta para comecar.
            </p>
            <Button
              className="mt-4"
              onClick={() => router.push("/crm/propostas/nova")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Proposta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <DataTable
              columns={columns as unknown as DataTableColumn<Record<string, unknown>>[]}
              data={propostas as unknown as Record<string, unknown>[]}
              loading={isLoading}
              emptyMessage="Nenhuma proposta encontrada."
              onRowClick={(item) =>
                router.push(`/crm/propostas/${(item as unknown as Proposta).id}`)
              }
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
