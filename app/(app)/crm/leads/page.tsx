"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Plus,
  Phone,
  Mail,
  DollarSign,
  Search,
  GripVertical,
  Users,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { cn } from "@/lib/utils/cn";
import { maskPhone, maskCurrency, unmask, unmaskCurrency } from "@/lib/utils/masks";

import { getLeads, createLead, updateLead } from "@/lib/api/crm";
import type { Lead, LeadStatus, LeadSource } from "@/lib/types";
import { showToast } from "@/lib/utils/toast";

const statusColumns: { status: LeadStatus; label: string; color: string }[] = [
  { status: "New", label: "Novo", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { status: "Contacted", label: "Contatado", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { status: "Qualified", label: "Qualificado", color: "bg-purple-100 text-purple-800 border-purple-200" },
  { status: "ProposalSent", label: "Proposta", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  { status: "Negotiation", label: "Negociacao", color: "bg-orange-100 text-orange-800 border-orange-200" },
  { status: "Won", label: "Ganho", color: "bg-green-100 text-green-800 border-green-200" },
  { status: "Lost", label: "Perdido", color: "bg-red-100 text-red-800 border-red-200" },
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

export default function LeadsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [novoLead, setNovoLead] = useState({
    name: "",
    email: "",
    phone: "",
    source: "Website" as LeadSource,
    expectedValue: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["leads", search],
    queryFn: () => getLeads({ search: search || undefined, pageSize: 200 }),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Lead>) => createLead(data),
    onSuccess: () => {
      showToast("success", { title: "Lead cadastrado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setDialogOpen(false);
      setNovoLead({
        name: "",
        email: "",
        phone: "",
        source: "Website",
        expectedValue: "",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatus }) =>
      updateLead(id, { status }),
    onSuccess: () => {
      showToast("success", { title: "Lead atualizado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });

  const leads = data?.items ?? [];

  function getLeadsByStatus(status: LeadStatus): Lead[] {
    return leads.filter((lead) => lead.status === status);
  }

  function handleCreateLead() {
    if (!novoLead.name) return;
    createMutation.mutate({
      name: novoLead.name,
      email: novoLead.email || undefined,
      phone: novoLead.phone ? unmask(novoLead.phone) : undefined,
      source: novoLead.source,
      expectedValue: novoLead.expectedValue
        ? unmaskCurrency(novoLead.expectedValue)
        : undefined,
      status: "New",
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description="Pipeline de leads e oportunidades comerciais"
        action={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Novo Lead</DialogTitle>
                <DialogDescription>
                  Cadastre um novo lead para acompanhar no pipeline.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="lead-nome">Nome *</Label>
                  <Input
                    id="lead-nome"
                    placeholder="Nome do contato"
                    value={novoLead.name}
                    onChange={(e) =>
                      setNovoLead({ ...novoLead, name: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="lead-email">E-mail</Label>
                    <Input
                      id="lead-email"
                      type="email"
                      placeholder="email@exemplo.com"
                      value={novoLead.email}
                      onChange={(e) =>
                        setNovoLead({ ...novoLead, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="lead-telefone">Telefone</Label>
                    <Input
                      id="lead-telefone"
                      placeholder="(00) 00000-0000"
                      value={novoLead.phone}
                      onChange={(e) =>
                        setNovoLead({ ...novoLead, phone: maskPhone(e.target.value) })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="lead-origem">Origem</Label>
                    <Select
                      value={novoLead.source}
                      onValueChange={(value) =>
                        setNovoLead({ ...novoLead, source: value as LeadSource })
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
                    <Label htmlFor="lead-valor">Valor Estimado (R$)</Label>
                    <Input
                      id="lead-valor"
                      type="text"
                      placeholder="0,00"
                      value={novoLead.expectedValue}
                      onChange={(e) =>
                        setNovoLead({ ...novoLead, expectedValue: maskCurrency(e.target.value) })
                      }
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateLead}
                  disabled={createMutation.isPending || !novoLead.name}
                >
                  {createMutation.isPending ? "Salvando..." : "Criar Lead"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar leads..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {statusColumns.map((col) => (
            <div key={col.status} className="min-w-[280px] flex-shrink-0">
              <div className="h-8 w-32 animate-pulse rounded bg-muted mb-3" />
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-32 animate-pulse rounded-lg bg-muted"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {statusColumns.map((column) => {
            const columnLeads = getLeadsByStatus(column.status);
            const totalValue = columnLeads.reduce(
              (sum, lead) => sum + (lead.expectedValue || 0),
              0
            );

            return (
              <div
                key={column.status}
                className="min-w-[280px] max-w-[320px] flex-shrink-0"
              >
                {/* Column header */}
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      className={cn("text-xs font-medium", column.color)}
                      variant="secondary"
                    >
                      {column.label}
                    </Badge>
                    <span className="text-sm text-muted-foreground font-medium">
                      {columnLeads.length}
                    </span>
                  </div>
                  {totalValue > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {formatCurrency(totalValue)}
                    </span>
                  )}
                </div>

                {/* Column content */}
                <div className="space-y-2 min-h-[200px] rounded-lg bg-muted/30 p-2">
                  {columnLeads.length === 0 ? (
                    <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
                      Nenhum lead
                    </div>
                  ) : (
                    columnLeads.map((lead) => (
                      <Card
                        key={lead.id}
                        className="cursor-pointer transition-all hover:shadow-md"
                        onClick={() => router.push(`/crm/leads/${lead.id}`)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between">
                            <h4 className="font-medium text-sm truncate">
                              {lead.name}
                            </h4>
                            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                          </div>

                          {lead.expectedValue && lead.expectedValue > 0 && (
                            <div className="flex items-center gap-1 mt-1 text-xs font-medium text-green-700">
                              <DollarSign className="h-3 w-3" />
                              {formatCurrency(lead.expectedValue)}
                            </div>
                          )}

                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {origemLabels[lead.source]}
                            </Badge>
                            {lead.email && (
                              <Mail className="h-3 w-3 text-muted-foreground" />
                            )}
                            {lead.phone && (
                              <Phone className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>

                          <p className="text-[10px] text-muted-foreground mt-2">
                            {format(parseISO(lead.createdAt), "dd/MM/yyyy", {
                              locale: ptBR,
                            })}
                          </p>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
