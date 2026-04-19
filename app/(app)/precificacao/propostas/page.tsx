"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  FileText,
  MoreHorizontal,
  Pencil,
  CheckCircle,
  XCircle,
  Copy,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import {
  getProposals,
  generateProposalPdf,
  updateProposalStatus,
  duplicateProposal,
  deleteProposal,
} from "@/lib/api/precificacao";
import type { PricingProposalStatus } from "@/lib/types";

type Row = Record<string, unknown>;

const statusLabels: Record<PricingProposalStatus, string> = {
  Draft: "Rascunho",
  Generated: "Gerada",
  Approved: "Aprovada",
  Rejected: "Rejeitada",
};

const statusVariants: Record<
  PricingProposalStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  Draft: "outline",
  Generated: "secondary",
  Approved: "default",
  Rejected: "destructive",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function ActionsDropdown({
  item,
  onAction,
}: {
  item: Row;
  onAction: (action: string, id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const status = item.status as PricingProposalStatus;
  const id = item.id as string;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
          />
          <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border bg-background shadow-lg py-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onAction("edit", id);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
            >
              <Pencil className="h-4 w-4" /> Editar
            </button>

            {status === "Draft" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  onAction("generate-pdf", id);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
              >
                <FileText className="h-4 w-4" /> Gerar PDF
              </button>
            )}

            {status === "Generated" && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen(false);
                    onAction("approve", id);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-green-600"
                >
                  <CheckCircle className="h-4 w-4" /> Aprovar
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen(false);
                    onAction("reject", id);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-red-600"
                >
                  <XCircle className="h-4 w-4" /> Rejeitar
                </button>
              </>
            )}

            {(status === "Approved" || status === "Rejected") && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  onAction("duplicate", id);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
              >
                <Copy className="h-4 w-4" /> Duplicar
              </button>
            )}

            {status === "Draft" && (
              <>
                <div className="my-1 border-t" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen(false);
                    onAction("delete", id);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-destructive"
                >
                  <Trash2 className="h-4 w-4" /> Excluir
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function PropostasPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["proposals", { search, page }],
    queryFn: () => getProposals({ search, page, pageSize: 20 }),
  });

  const pdfMutation = useMutation({
    mutationFn: (id: string) => generateProposalPdf(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      toast.success("PDF gerado com sucesso!");
    },
    onError: () => toast.error("Erro ao gerar PDF."),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PricingProposalStatus }) =>
      updateProposalStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      toast.success("Status atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar status."),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => duplicateProposal(id),
    onSuccess: (newId) => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      toast.success("Proposta duplicada!");
      router.push(`/precificacao/propostas/${newId}`);
    },
    onError: () => toast.error("Erro ao duplicar proposta."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProposal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      toast.success("Proposta excluída!");
    },
    onError: () => toast.error("Erro ao excluir proposta."),
  });

  const handleAction = (action: string, id: string) => {
    switch (action) {
      case "edit":
        router.push(`/precificacao/propostas/${id}`);
        break;
      case "generate-pdf":
        pdfMutation.mutate(id);
        break;
      case "approve":
        statusMutation.mutate({ id, status: "Approved" as PricingProposalStatus });
        break;
      case "reject":
        statusMutation.mutate({ id, status: "Rejected" as PricingProposalStatus });
        break;
      case "duplicate":
        duplicateMutation.mutate(id);
        break;
      case "delete":
        if (window.confirm("Tem certeza que deseja excluir esta proposta?")) {
          deleteMutation.mutate(id);
        }
        break;
    }
  };

  const columns: DataTableColumn<Row>[] = [
    { key: "title", header: "Título" },
    {
      key: "clienteName",
      header: "Cliente",
      render: (item) => (
        <span className="text-sm">
          {(item.clienteName as string) || "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item) => {
        const status = item.status as PricingProposalStatus;
        return (
          <Badge variant={statusVariants[status] || "outline"}>
            {statusLabels[status] || status}
          </Badge>
        );
      },
    },
    {
      key: "finalValue",
      header: "Valor",
      render: (item) => formatCurrency(item.finalValue as number),
    },
    {
      key: "hasPdf",
      header: "PDF",
      render: (item) =>
        (item.hasPdf as boolean) ? (
          <Badge variant="secondary">Gerado</Badge>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      key: "createdAt",
      header: "Data",
      render: (item) =>
        new Date(item.createdAt as string).toLocaleDateString("pt-BR"),
    },
    {
      key: "actions",
      header: "",
      render: (item) => (
        <ActionsDropdown item={item} onAction={handleAction} />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Propostas"
        description="Gerencie propostas de honorários geradas a partir das simulações"
      />

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar propostas..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>
      </div>

      {!isLoading && (!data || data.items.length === 0) && !search ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Nenhuma proposta ainda</h3>
          <p className="text-muted-foreground mt-1 mb-4">
            Crie propostas a partir das estimativas de precificação
          </p>
          <Button onClick={() => router.push("/estimativas")}>
            Ir para Estimativas
          </Button>
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={(data?.items as unknown as Row[]) || []}
            loading={isLoading}
            onRowClick={(item) =>
              router.push(`/precificacao/propostas/${item.id as string}`)
            }
          />

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {data.totalCount} proposta(s)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Próximo
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
