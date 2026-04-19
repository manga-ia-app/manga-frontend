"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  MapPin,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getProjetoById } from "@/lib/api/projetos";
import type { FaseStatus } from "@/lib/types";

const faseStatusConfig: Record<
  FaseStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  Pending: { label: "Pendente", variant: "outline" },
  InProgress: { label: "Em Andamento", variant: "default" },
  Review: { label: "Em Revisao", variant: "secondary" },
  Approved: { label: "Aprovada", variant: "secondary" },
  Completed: { label: "Concluida", variant: "secondary" },
};

function formatDate(dateStr?: string): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

function formatCurrency(value?: number): string {
  if (value == null) return "-";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ProjetoOverviewPage() {
  const params = useParams();
  const projetoId = params.id as string;

  const { data: projeto, isLoading } = useQuery({
    queryKey: ["projeto", projetoId],
    queryFn: () => getProjetoById(projetoId),
    enabled: !!projetoId,
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-5 w-1/2 rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="h-4 w-3/4 rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!projeto) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Projeto nao encontrado.
        </CardContent>
      </Card>
    );
  }

  const fases = projeto.fases ?? [];
  const totalFases = fases.length;
  const fasesConcluidas = fases.filter((f) => f.status === "Completed").length;
  const fasesEmAndamento = fases.filter((f) => f.status === "InProgress").length;
  const progressPercent = totalFases > 0 ? Math.round((fasesConcluidas / totalFases) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Progresso
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressPercent}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {fasesConcluidas} de {totalFases} fases concluidas
            </p>
            <div className="h-2 w-full rounded-full bg-muted mt-2">
              <div
                className="h-2 rounded-full bg-primary transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Fases Ativas
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fasesEmAndamento}</div>
            <p className="text-xs text-muted-foreground mt-1">em andamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Total
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(projeto.totalBudget)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Project details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Detalhes do Projeto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {projeto.description && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Descricao</h4>
                <p className="text-sm">{projeto.description}</p>
              </div>
            )}

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Data de Inicio</p>
                  <p className="text-sm text-muted-foreground">{formatDate(projeto.startDate)}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Previsao de Termino</p>
                  <p className="text-sm text-muted-foreground">{formatDate(projeto.expectedEndDate)}</p>
                </div>
              </div>
            </div>

            {projeto.address && (
              <>
                <Separator />
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Localizacao</p>
                    <p className="text-sm text-muted-foreground">
                      {projeto.address}
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Equipe resumo */}
        <Card>
          <CardHeader>
            <CardTitle>Equipe</CardTitle>
            <CardDescription>
              {projeto.membros?.length ?? 0} membros
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!projeto.membros || projeto.membros.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum membro cadastrado.</p>
            ) : (
              <div className="space-y-3">
                {projeto.membros.slice(0, 5).map((membro) => (
                  <div key={membro.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{membro.userName}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {membro.role === "Lead"
                        ? "Responsavel"
                        : membro.role === "Collaborator"
                        ? "Colaborador"
                        : "Viewer"}
                    </Badge>
                  </div>
                ))}
                {projeto.membros.length > 5 && (
                  <p className="text-xs text-muted-foreground">
                    +{projeto.membros.length - 5} outros membros
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Phases step indicator */}
      {fases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Fases do Projeto</CardTitle>
            <CardDescription>Acompanhe o progresso de cada fase</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {fases
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((fase, index) => {
                  const statusCfg = faseStatusConfig[fase.status];
                  return (
                    <div key={fase.id} className="flex items-center gap-4">
                      {/* Step number */}
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shrink-0 ${
                          fase.status === "Completed"
                            ? "bg-green-100 text-green-700"
                            : fase.status === "InProgress"
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {fase.status === "Completed" ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          index + 1
                        )}
                      </div>

                      {/* Phase info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{fase.name}</p>
                          <Badge variant={statusCfg?.variant ?? "outline"} className="text-xs shrink-0">
                            {statusCfg?.label ?? fase.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {statusCfg?.label ?? fase.status}
                        </p>
                      </div>

                      {/* Dates */}
                      <div className="hidden sm:block text-xs text-muted-foreground shrink-0">
                        {formatDate(fase.startDate)} - {formatDate(fase.endDate)}
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
