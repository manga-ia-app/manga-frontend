"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Loader2, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getProjetoById, advanceFaseStatus } from "@/lib/api/projetos";
import type { FaseStatus } from "@/lib/types";
import { showToast } from "@/lib/utils/toast";

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

const nextStatusLabel: Record<string, string> = {
  Pending: "Iniciar Fase",
  InProgress: "Concluir Fase",
};

function formatDate(dateStr?: string): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

export default function FasesPage() {
  const params = useParams();
  const projetoId = params.id as string;
  const queryClient = useQueryClient();

  const { data: projeto, isLoading } = useQuery({
    queryKey: ["projeto", projetoId],
    queryFn: () => getProjetoById(projetoId),
    enabled: !!projetoId,
  });

  const advanceMutation = useMutation({
    mutationFn: (faseId: string) => advanceFaseStatus(projetoId, faseId),
    onSuccess: () => {
      showToast("success", { title: "Fase atualizada com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["projeto", projetoId] });
    },
  });

  const fases = (projeto?.fases ?? []).sort((a, b) => a.orderIndex - b.orderIndex);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-5 w-1/3 rounded bg-muted" />
              <div className="h-4 w-1/4 rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="h-3 w-full rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (fases.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-16">
        <Layers className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">Nenhuma fase cadastrada</h3>
        <p className="text-sm text-muted-foreground mt-1">
          As fases serao criadas automaticamente a partir do template do projeto.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {fases.map((fase) => {
        const statusCfg = faseStatusConfig[fase.status];
        const canAdvance = fase.status === "Pending" || fase.status === "InProgress";
        const advanceLabel = nextStatusLabel[fase.status];

        return (
          <Card key={fase.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Fase {fase.orderIndex}
                    </span>
                    <Badge variant={statusCfg?.variant ?? "outline"}>
                      {statusCfg?.label ?? fase.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg mt-1">{fase.name}</CardTitle>
                </div>
                {canAdvance && (
                  <Button
                    size="sm"
                    variant={fase.status === "InProgress" ? "default" : "outline"}
                    onClick={() => advanceMutation.mutate(fase.id)}
                    disabled={advanceMutation.isPending}
                  >
                    {advanceMutation.isPending ? (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : (
                      <ChevronRight className="mr-2 h-3 w-3" />
                    )}
                    {advanceLabel}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Date info */}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">Inicio:</span> {formatDate(fase.startDate)}
                  </div>
                  <div>
                    <span className="font-medium">Previsao:</span>{" "}
                    {formatDate(fase.endDate)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
