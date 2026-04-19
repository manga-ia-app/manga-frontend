"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Copy, FileText } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  getAllEstimates,
  deleteEstimate,
  duplicateEstimate,
  transformToProposal,
} from "@/lib/api/estimativas";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function EstimativasListPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [description, setDescription] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");

  const { data, isLoading } = useQuery({
    queryKey: ["estimates", { page, description, sortBy, sortDirection }],
    queryFn: () =>
      getAllEstimates({
        page,
        pageSize: 20,
        description: description || undefined,
        sortBy,
        sortDirection,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEstimate,
    onSuccess: () => {
      toast.success("Estimativa excluída com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["estimates"] });
    },
    onError: () => {
      toast.error("Erro ao excluir estimativa.");
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: duplicateEstimate,
    onSuccess: (data) => {
      toast.success("Estimativa duplicada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["estimates"] });
      router.push(`/estimativas/${data.id}`);
    },
    onError: () => {
      toast.error("Erro ao duplicar estimativa.");
    },
  });

  const transformMutation = useMutation({
    mutationFn: (id: string) => transformToProposal(id),
    onSuccess: (data) => {
      toast.success(`Proposta v${data.version} criada com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ["estimates"] });
      router.push(`/precificacao/propostas/${data.id}`);
    },
    onError: () => {
      toast.error("Erro ao transformar em proposta. Verifique se há atividades preenchidas.");
    },
  });

  const [deleteTarget, setDeleteTarget] = useState<{id: string; desc: string; proposalCount: number} | null>(null);

  const handleDelete = (id: string, desc: string, proposalCount: number) => {
    setDeleteTarget({ id, desc, proposalCount });
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortDirection("desc");
    }
  };

  const sortIndicator = (column: string) => {
    if (sortBy !== column) return "";
    return sortDirection === "asc" ? " ↑" : " ↓";
  };

  const estimates = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estimativas"
        description="Gerencie suas estimativas de projetos."
        action={
          <Link href="/estimativas/novo">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Nova Estimativa
            </Button>
          </Link>
        }
      />

      {/* Filters */}
      <div className="flex gap-4">
        <Input
          placeholder="Buscar por descrição..."
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            setPage(1);
          }}
          className="max-w-sm"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("createdAt")}
              >
                Criada{sortIndicator("createdAt")}
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("updatedAt")}
              >
                Atualizada{sortIndicator("updatedAt")}
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("finalValue")}
              >
                Valor Final{sortIndicator("finalValue")}
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-20">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : estimates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhuma estimativa encontrada.
                </TableCell>
              </TableRow>
            ) : (
              estimates.map((est) => (
                <TableRow
                  key={est.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/estimativas/${est.id}`)}
                >
                  <TableCell className="font-medium">{est.description}</TableCell>
                  <TableCell>{est.clienteName}</TableCell>
                  <TableCell>{formatDate(est.createdAt)}</TableCell>
                  <TableCell>
                    {est.updatedAt ? formatDate(est.updatedAt) : "—"}
                  </TableCell>
                  <TableCell>
                    <div>
                      {formatCurrency(est.finalValue)}
                      {est.monthlyTotalCost > 0 && (
                        <span className="block text-xs text-muted-foreground">
                          + {formatCurrency(est.monthlyTotalCost)}/mês
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {est.isExpired && (
                        <Badge variant="destructive">Expirada</Badge>
                      )}
                      {est.isStale && (
                        <Badge variant="secondary">Desatualizada</Badge>
                      )}
                      {est.proposalCount > 0 && (
                        <Badge variant="outline">
                          {est.proposalCount} proposta{est.proposalCount > 1 ? "s" : ""}
                        </Badge>
                      )}
                      {!est.isExpired && !est.isStale && est.proposalCount === 0 && (
                        <Badge variant="outline">
                          {est.activeActivityCount}/{est.totalActivityCount} ativ.
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Gerar Proposta"
                        onClick={(e) => {
                          e.stopPropagation();
                          transformMutation.mutate(est.id);
                        }}
                        disabled={
                          transformMutation.isPending ||
                          est.activeActivityCount === 0
                        }
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Duplicar"
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateMutation.mutate(est.id);
                        }}
                        disabled={duplicateMutation.isPending}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Excluir"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(est.id, est.description, est.proposalCount);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Próxima
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Excluir estimativa"
        description={
          deleteTarget
            ? `Tem certeza que deseja excluir "${deleteTarget.desc}"?` +
              (deleteTarget.proposalCount > 0
                ? `\n\nATENÇÃO: Esta estimativa possui ${deleteTarget.proposalCount} proposta(s) vinculada(s).`
                : "")
            : ""
        }
        confirmLabel="Excluir"
        variant="destructive"
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id);
          }
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
