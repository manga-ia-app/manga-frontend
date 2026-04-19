"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Send,
  CheckCircle,
  XCircle,
  FolderKanban,
  Calendar,
  DollarSign,
  User,
  FileText,
  Hash,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils/cn";

import {
  getPropostaById,
  updateProposta,
  deleteProposta,
  convertPropostaToProject,
} from "@/lib/api/crm";
import type { Proposta, PropostaStatus } from "@/lib/types";
import { showToast } from "@/lib/utils/toast";

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

export default function PropostaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const propostaId = params.id as string;

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);

  const { data: proposta, isLoading } = useQuery({
    queryKey: ["proposta", propostaId],
    queryFn: () => getPropostaById(propostaId),
    enabled: !!propostaId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: PropostaStatus) =>
      updateProposta(propostaId, { status }),
    onSuccess: () => {
      showToast("success", { title: "Proposta atualizada com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["proposta", propostaId] });
      queryClient.invalidateQueries({ queryKey: ["propostas"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteProposta(propostaId),
    onSuccess: () => {
      showToast("success", { title: "Proposta excluida com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["propostas"] });
      router.push("/crm/propostas");
    },
  });

  const convertMutation = useMutation({
    mutationFn: () => convertPropostaToProject(propostaId),
    onSuccess: (projeto) => {
      showToast("success", { title: "Proposta convertida em projeto com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["proposta", propostaId] });
      queryClient.invalidateQueries({ queryKey: ["propostas"] });
      setConvertDialogOpen(false);
      router.push(`/projetos/${projeto.id}`);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-48 animate-pulse rounded-lg bg-muted" />
            <div className="h-64 animate-pulse rounded-lg bg-muted" />
          </div>
          <div className="h-64 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  if (!proposta) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-xl font-semibold">Proposta nao encontrada</h2>
        <p className="text-muted-foreground mt-1">
          A proposta solicitada nao foi encontrada.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/crm/propostas")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Propostas
        </Button>
      </div>
    );
  }

  const config = statusConfig[proposta.status];
  const itens = proposta.itens ?? [];

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/crm/propostas")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Propostas
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {proposta.title}
            </h1>
            <Badge variant={config.variant}>{config.label}</Badge>
          </div>
          {proposta.content && (
            <p className="text-muted-foreground mt-1">{proposta.content}</p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {proposta.status === "Draft" && (
            <Button
              onClick={() => updateStatusMutation.mutate("Sent")}
              disabled={updateStatusMutation.isPending}
            >
              <Send className="mr-2 h-4 w-4" />
              Enviar
            </Button>
          )}
          {(proposta.status === "Sent" || proposta.status === "Viewed") && (
            <>
              <Button
                onClick={() => updateStatusMutation.mutate("Accepted")}
                disabled={updateStatusMutation.isPending}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Aceitar
              </Button>
              <Button
                variant="destructive"
                onClick={() => updateStatusMutation.mutate("Rejected")}
                disabled={updateStatusMutation.isPending}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Recusar
              </Button>
            </>
          )}
          {proposta.status === "Accepted" && (
            <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <FolderKanban className="mr-2 h-4 w-4" />
                  Converter em Projeto
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Converter em Projeto</DialogTitle>
                  <DialogDescription>
                    Deseja criar um novo projeto a partir desta proposta? Os dados
                    da proposta serao usados como base para o projeto.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setConvertDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => convertMutation.mutate()}
                    disabled={convertMutation.isPending}
                  >
                    {convertMutation.isPending
                      ? "Convertendo..."
                      : "Confirmar Conversao"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Excluir Proposta</DialogTitle>
                <DialogDescription>
                  Tem certeza que deseja excluir a proposta &quot;{proposta.title}
                  &quot;? Esta acao nao pode ser desfeita.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "Excluindo..." : "Confirmar Exclusao"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Items table */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Itens da Proposta</CardTitle>
              <CardDescription>
                {itens.length} {itens.length === 1 ? "item" : "itens"} na
                proposta
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {itens.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-6">
                  <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum item adicionado a esta proposta.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead>Descricao</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead>Unid.</TableHead>
                      <TableHead className="text-right">Preco Unit.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itens.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.description}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.quantity}
                        </TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.unitPrice)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.quantity * item.unitPrice)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell colSpan={5} className="text-right">
                        Total
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(proposta.totalValue)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detalhes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={config.variant} className="mt-1">
                  {config.label}
                </Badge>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-lg font-bold flex items-center gap-1 mt-1">
                  <DollarSign className="h-4 w-4" />
                  {formatCurrency(proposta.totalValue)}
                </p>
              </div>
              <Separator />
              {(proposta.leadId || proposta.clienteId) && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {proposta.leadId ? "Lead" : "Cliente"}
                    </p>
                    <p className="text-sm font-medium flex items-center gap-1 mt-1">
                      <User className="h-3.5 w-3.5" />
                      {proposta.leadId ? "Lead vinculado" : "Cliente vinculado"}
                    </p>
                  </div>
                  <Separator />
                </>
              )}
              {proposta.validUntil && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Validade</p>
                    <p className="text-sm font-medium flex items-center gap-1 mt-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(
                        parseISO(proposta.validUntil),
                        "dd/MM/yyyy",
                        { locale: ptBR }
                      )}
                    </p>
                  </div>
                  <Separator />
                </>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Criada em</p>
                <p className="text-sm font-medium flex items-center gap-1 mt-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(parseISO(proposta.createdAt), "dd/MM/yyyy 'as' HH:mm", {
                    locale: ptBR,
                  })}
                </p>
              </div>
              {proposta.updatedAt && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Atualizada em
                    </p>
                    <p className="text-sm font-medium flex items-center gap-1 mt-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(
                        parseISO(proposta.updatedAt),
                        "dd/MM/yyyy 'as' HH:mm",
                        { locale: ptBR }
                      )}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
