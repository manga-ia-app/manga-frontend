"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, FolderKanban, MapPin, Calendar, DollarSign, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { getProjetos } from "@/lib/api/projetos";
import type { Projeto, ProjectStatus } from "@/lib/types";

const statusConfig: Record<ProjectStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  Planning: { label: "Planejamento", variant: "outline" },
  Briefing: { label: "Briefing", variant: "outline" },
  InProgress: { label: "Em Andamento", variant: "default" },
  Paused: { label: "Pausado", variant: "secondary" },
  Completed: { label: "Concluido", variant: "secondary" },
  Cancelled: { label: "Cancelado", variant: "destructive" },
};

function calcProgress(projeto: Projeto): number {
  if (!projeto.fases || projeto.fases.length === 0) return 0;
  const concluidas = projeto.fases.filter((f) => f.status === "Completed").length;
  return Math.round((concluidas / projeto.fases.length) * 100);
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

function formatCurrency(value?: number): string {
  if (value == null) return "-";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ProjetosPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["projetos", search],
    queryFn: () => getProjetos({ search: search || undefined, pageSize: 50 }),
  });

  const projetos = data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projetos"
        description="Gerencie seus projetos de arquitetura e engenharia"
        action={
          <Button onClick={() => router.push("/projetos/novo")}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Projeto
          </Button>
        }
      />

      {/* Search bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar projetos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-5 w-3/4 rounded bg-muted" />
                <div className="h-4 w-1/2 rounded bg-muted" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-2 w-full rounded bg-muted" />
                <div className="h-4 w-2/3 rounded bg-muted" />
                <div className="h-4 w-1/2 rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && projetos.length === 0 && (
        <Card className="flex flex-col items-center justify-center py-16">
          <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Nenhum projeto encontrado</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            {search
              ? "Tente alterar os termos de busca."
              : "Crie seu primeiro projeto para comecar."}
          </p>
          {!search && (
            <Button onClick={() => router.push("/projetos/novo")}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Projeto
            </Button>
          )}
        </Card>
      )}

      {/* Project cards grid */}
      {!isLoading && projetos.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projetos.map((projeto) => {
            const progress = calcProgress(projeto);
            const statusCfg = statusConfig[projeto.status];

            return (
              <Card
                key={projeto.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => router.push(`/projetos/${projeto.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base truncate">
                        {projeto.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground truncate mt-0.5">
                        {projeto.clienteName ?? "Sem cliente"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge variant={statusCfg?.variant ?? "outline"}>
                        {statusCfg?.label ?? projeto.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/projetos/${projeto.id}`);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Progress bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Progresso</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(projeto.startDate)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(projeto.expectedEndDate)}</span>
                    </div>
                    <div className="col-span-2 flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      <span>{formatCurrency(projeto.totalBudget)}</span>
                    </div>
                  </div>

                  {/* Location */}
                  {projeto.address && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{projeto.address}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
