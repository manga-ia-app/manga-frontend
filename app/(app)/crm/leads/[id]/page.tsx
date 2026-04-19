"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Mail,
  Phone,
  DollarSign,
  Calendar,
  Edit,
  Trash2,
  Save,
  X,
  ChevronRight,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { cn } from "@/lib/utils/cn";
import { maskPhone, maskCurrency, unmask, unmaskCurrency } from "@/lib/utils/masks";

import { getLeadById, updateLead, deleteLead } from "@/lib/api/crm";
import type { Lead, LeadStatus, LeadSource } from "@/lib/types";
import { showToast } from "@/lib/utils/toast";

const statusConfig: Record<
  LeadStatus,
  { label: string; color: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  New: { label: "Novo", color: "bg-blue-100 text-blue-800", variant: "secondary" },
  Contacted: { label: "Contatado", color: "bg-yellow-100 text-yellow-800", variant: "secondary" },
  Qualified: { label: "Qualificado", color: "bg-purple-100 text-purple-800", variant: "secondary" },
  ProposalSent: { label: "Proposta", color: "bg-indigo-100 text-indigo-800", variant: "secondary" },
  Negotiation: { label: "Negociacao", color: "bg-orange-100 text-orange-800", variant: "secondary" },
  Won: { label: "Ganho", color: "bg-green-100 text-green-800", variant: "default" },
  Lost: { label: "Perdido", color: "bg-red-100 text-red-800", variant: "destructive" },
};

const statusFlow: LeadStatus[] = [
  "New",
  "Contacted",
  "Qualified",
  "ProposalSent",
  "Negotiation",
  "Won",
];

const origemLabels: Record<LeadSource, string> = {
  Website: "Site",
  Referral: "Indicacao",
  Social: "Redes Sociais",
  Other: "Outro",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const leadId = params.id as string;

  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Lead>>({});
  const [currencyDisplay, setCurrencyDisplay] = useState("");

  const { data: lead, isLoading } = useQuery({
    queryKey: ["lead", leadId],
    queryFn: () => getLeadById(leadId),
    enabled: !!leadId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Lead>) => updateLead(leadId, data),
    onSuccess: () => {
      showToast("success", { title: "Lead atualizado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setIsEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteLead(leadId),
    onSuccess: () => {
      showToast("success", { title: "Lead excluido com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      router.push("/crm/leads");
    },
  });

  function startEditing() {
    if (!lead) return;
    setEditForm({
      name: lead.name,
      email: lead.email,
      phone: lead.phone ? maskPhone(lead.phone) : "",
      source: lead.source,
      expectedValue: lead.expectedValue,
      notes: lead.notes,
    });
    setCurrencyDisplay(lead.expectedValue ? maskCurrency(String(Math.round(lead.expectedValue * 100))) : "");
    setIsEditing(true);
  }

  function handleSave() {
    const payload = {
      ...editForm,
      phone: editForm.phone ? unmask(editForm.phone) : undefined,
    };
    updateMutation.mutate(payload);
  }

  function handleStatusChange(newStatus: LeadStatus) {
    updateMutation.mutate({ status: newStatus });
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-48 animate-pulse rounded-lg bg-muted" />
            <div className="h-32 animate-pulse rounded-lg bg-muted" />
          </div>
          <div className="h-64 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-xl font-semibold">Lead nao encontrado</h2>
        <p className="text-muted-foreground mt-1">
          O lead solicitado nao foi encontrado.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/crm/leads")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Leads
        </Button>
      </div>
    );
  }

  const config = statusConfig[lead.status];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/crm/leads")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Leads
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{lead.name}</h1>
            <Badge className={cn("text-xs font-medium", config.color)} variant={config.variant}>
              {config.label}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <Button variant="outline" onClick={startEditing}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
              <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Excluir Lead</DialogTitle>
                    <DialogDescription>
                      Tem certeza que deseja excluir o lead &quot;{lead.name}&quot;?
                      Esta acao nao pode ser desfeita.
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
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={updateMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {updateMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Status flow */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Progresso do Lead</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1 flex-wrap">
            {statusFlow.map((status, index) => {
              const isActive = lead.status === status;
              const isPast =
                statusFlow.indexOf(lead.status) > index ||
                lead.status === "Won";
              const sc = statusConfig[status];

              return (
                <div key={status} className="flex items-center gap-1">
                  <button
                    onClick={() => handleStatusChange(status)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                      isActive
                        ? sc.color + " ring-2 ring-offset-2 ring-primary"
                        : isPast
                        ? "bg-muted text-muted-foreground"
                        : "bg-muted/50 text-muted-foreground/50 hover:bg-muted hover:text-muted-foreground"
                    )}
                    disabled={updateMutation.isPending}
                  >
                    {sc.label}
                  </button>
                  {index < statusFlow.length - 1 && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              );
            })}
            <Separator orientation="vertical" className="h-6 mx-2" />
            <button
              onClick={() => handleStatusChange("Lost")}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                lead.status === "Lost"
                  ? "bg-red-100 text-red-800 ring-2 ring-offset-2 ring-destructive"
                  : "bg-muted/50 text-muted-foreground/50 hover:bg-red-50 hover:text-red-700"
              )}
              disabled={updateMutation.isPending}
            >
              Perdido
            </button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informacoes do Lead</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Nome</Label>
                    <Input
                      value={editForm.name || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>E-mail</Label>
                      <Input
                        type="email"
                        value={editForm.email || ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, email: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Telefone</Label>
                      <Input
                        value={editForm.phone || ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, phone: maskPhone(e.target.value) })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Origem</Label>
                      <Select
                        value={editForm.source}
                        onValueChange={(value) =>
                          setEditForm({
                            ...editForm,
                            source: value as LeadSource,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Website">Site</SelectItem>
                          <SelectItem value="Referral">Indicacao</SelectItem>
                          <SelectItem value="Social">Redes Sociais</SelectItem>
                          <SelectItem value="Other">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Valor Estimado (R$)</Label>
                      <Input
                        type="text"
                        value={currencyDisplay}
                        onChange={(e) => {
                          const masked = maskCurrency(e.target.value);
                          setCurrencyDisplay(masked);
                          setEditForm({ ...editForm, expectedValue: unmaskCurrency(masked) });
                        }}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Observacoes</Label>
                    <Input
                      value={editForm.notes || ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          notes: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              ) : (
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">E-mail</p>
                      <p className="text-sm font-medium flex items-center gap-1">
                        {lead.email ? (
                          <>
                            <Mail className="h-3.5 w-3.5" />
                            {lead.email}
                          </>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Telefone</p>
                      <p className="text-sm font-medium flex items-center gap-1">
                        {lead.phone ? (
                          <>
                            <Phone className="h-3.5 w-3.5" />
                            {maskPhone(lead.phone)}
                          </>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Origem</p>
                      <p className="text-sm font-medium">
                        {origemLabels[lead.source]}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Valor Estimado
                      </p>
                      <p className="text-sm font-medium flex items-center gap-1">
                        {lead.expectedValue ? (
                          <>
                            <DollarSign className="h-3.5 w-3.5" />
                            {formatCurrency(lead.expectedValue)}
                          </>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {lead.notes && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Observacoes
                        </p>
                        <p className="text-sm">{lead.notes}</p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detalhes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge
                  className={cn("text-xs font-medium mt-1", config.color)}
                  variant={config.variant}
                >
                  {config.label}
                </Badge>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Criado em</p>
                <p className="text-sm font-medium flex items-center gap-1 mt-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(parseISO(lead.createdAt), "dd/MM/yyyy 'as' HH:mm", {
                    locale: ptBR,
                  })}
                </p>
              </div>
              {lead.updatedAt && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Atualizado em
                    </p>
                    <p className="text-sm font-medium flex items-center gap-1 mt-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(
                        parseISO(lead.updatedAt),
                        "dd/MM/yyyy 'as' HH:mm",
                        { locale: ptBR }
                      )}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Acoes Rapidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push(`/crm/propostas/nova?leadId=${lead.id}`)}
              >
                Criar Proposta
              </Button>
              {lead.email && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.open(`mailto:${lead.email}`)}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar E-mail
                </Button>
              )}
              {lead.phone && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.open(`tel:${lead.phone}`)}
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Ligar
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
