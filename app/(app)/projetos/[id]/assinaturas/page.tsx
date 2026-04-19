"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Plus, PenTool, Clock, CheckCircle2, XCircle, AlertTriangle, FileEdit, FilePen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import type { AssinaturaProcesso, AssinaturaStatus } from "@/lib/types";

// Local API helper
const fetchAssinaturas = async (projetoId: string): Promise<AssinaturaProcesso[]> => {
  const res = await apiClient.get(`/projetos/${projetoId}/assinaturas`);
  return res.data;
};

const assinaturaStatusConfig: Record<
  AssinaturaStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }
> = {
  Draft: { label: "Rascunho", variant: "outline", icon: FileEdit },
  PendingSignatures: { label: "Aguardando Assinaturas", variant: "default", icon: Clock },
  PartiallySigned: { label: "Parcialmente Assinado", variant: "default", icon: FilePen },
  Completed: { label: "Concluido", variant: "secondary", icon: CheckCircle2 },
  Cancelled: { label: "Cancelado", variant: "destructive", icon: XCircle },
  Expired: { label: "Expirado", variant: "destructive", icon: AlertTriangle },
};

function formatDate(dateStr?: string): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

export default function AssinaturasPage() {
  const params = useParams();
  const projetoId = params.id as string;

  const { data: assinaturas, isLoading } = useQuery({
    queryKey: ["assinaturas", projetoId],
    queryFn: () => fetchAssinaturas(projetoId),
    enabled: !!projetoId,
  });

  const allAssinaturas = assinaturas ?? [];

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Processos de Assinatura</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie assinaturas digitais de documentos do projeto.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Processo
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
      ) : allAssinaturas.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <PenTool className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Nenhum processo de assinatura</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Crie processos para coletar assinaturas digitais em documentos.
          </p>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Processo
          </Button>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Signatarios</TableHead>
                <TableHead>D4Sign UUID</TableHead>
                <TableHead>Criado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allAssinaturas.map((processo) => {
                const statusCfg = assinaturaStatusConfig[processo.status];
                const signatarios = processo.signatarios ?? [];
                const assinados = signatarios.filter((s) => s.status === "Signed").length;
                const totalSignatarios = signatarios.length;

                return (
                  <TableRow key={processo.id}>
                    <TableCell>
                      <Badge variant={statusCfg?.variant ?? "outline"}>
                        {statusCfg?.label ?? processo.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {assinados}/{totalSignatarios}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">
                        assinados
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {processo.d4SignDocumentUuid
                        ? processo.d4SignDocumentUuid.substring(0, 8) + "..."
                        : "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(processo.createdAt)}
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
