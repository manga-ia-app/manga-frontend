"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  GripVertical,
  Calculator,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils/cn";

import { createProposta } from "@/lib/api/crm";
import { getLeads } from "@/lib/api/crm";
import { getClientes } from "@/lib/api/cadastros";
import type { Proposta, PropostaItem, UnitType } from "@/lib/types";
import { showToast } from "@/lib/utils/toast";

interface ItemForm {
  tempId: string;
  description: string;
  unit: UnitType;
  quantity: string;
  unitPrice: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

const unidades: { value: UnitType; label: string }[] = [
  { value: "Unidade", label: "un" },
  { value: "M", label: "m" },
  { value: "M2", label: "m\u00B2" },
  { value: "Hr", label: "h" },
  { value: "Vb", label: "vb" },
];

function generateTempId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export default function NovaPropostaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const preSelectedLeadId = searchParams.get("leadId") || "";

  const [form, setForm] = useState({
    title: "",
    content: "",
    leadId: preSelectedLeadId,
    clienteId: "",
    validUntil: "",
  });

  const [vinculoTipo, setVinculoTipo] = useState<"lead" | "cliente">(
    preSelectedLeadId ? "lead" : "lead"
  );

  const [itens, setItens] = useState<ItemForm[]>([
    {
      tempId: generateTempId(),
      description: "",
      unit: "Unidade" as UnitType,
      quantity: "1",
      unitPrice: "",
    },
  ]);

  const { data: leadsData } = useQuery({
    queryKey: ["leads-for-proposta"],
    queryFn: () => getLeads({ pageSize: 200 }),
  });

  const { data: clientesData } = useQuery({
    queryKey: ["clientes-for-proposta"],
    queryFn: () => getClientes({ pageSize: 200 }),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Proposta>) => createProposta(data),
    onSuccess: (proposta) => {
      showToast("success", { title: "Proposta criada com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["propostas"] });
      router.push(`/crm/propostas/${proposta.id}`);
    },
  });

  const leads = leadsData?.items ?? [];
  const clientes = clientesData?.items ?? [];

  function addItem() {
    setItens([
      ...itens,
      {
        tempId: generateTempId(),
        description: "",
        unit: "Unidade" as UnitType,
        quantity: "1",
        unitPrice: "",
      },
    ]);
  }

  function removeItem(tempId: string) {
    if (itens.length <= 1) return;
    setItens(itens.filter((i) => i.tempId !== tempId));
  }

  function updateItem(tempId: string, field: keyof ItemForm, value: string) {
    setItens(
      itens.map((item) =>
        item.tempId === tempId ? { ...item, [field]: value } : item
      )
    );
  }

  function getItemTotal(item: ItemForm): number {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    return qty * price;
  }

  function getGrandTotal(): number {
    return itens.reduce((sum, item) => sum + getItemTotal(item), 0);
  }

  function handleSubmit() {
    if (!form.title) return;

    const propostaItens = itens
      .filter((item) => item.description && item.unitPrice)
      .map((item) => ({
        description: item.description,
        unit: item.unit,
        quantity: parseFloat(item.quantity) || 1,
        unitPrice: parseFloat(item.unitPrice) || 0,
      }));

    createMutation.mutate({
      title: form.title,
      content: form.content || undefined,
      leadId: vinculoTipo === "lead" && form.leadId ? form.leadId : undefined,
      clienteId:
        vinculoTipo === "cliente" && form.clienteId
          ? form.clienteId
          : undefined,
      validUntil: form.validUntil || undefined,
      totalValue: getGrandTotal(),
      status: "Draft",
      itens: propostaItens as PropostaItem[],
    });
  }

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

      <PageHeader
        title="Nova Proposta"
        description="Crie uma nova proposta comercial"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informacoes Gerais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Titulo da Proposta *</Label>
                <Input
                  id="title"
                  placeholder="Ex: Proposta de Reforma Residencial"
                  value={form.title}
                  onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="content">Descricao</Label>
                <Input
                  id="content"
                  placeholder="Breve descricao da proposta"
                  value={form.content}
                  onChange={(e) =>
                    setForm({ ...form, content: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Vincular a</Label>
                  <Select
                    value={vinculoTipo}
                    onValueChange={(v) => setVinculoTipo(v as "lead" | "cliente")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="cliente">Cliente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>
                    {vinculoTipo === "lead" ? "Lead" : "Cliente"}
                  </Label>
                  {vinculoTipo === "lead" ? (
                    <Select
                      value={form.leadId}
                      onValueChange={(value) =>
                        setForm({ ...form, leadId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um lead" />
                      </SelectTrigger>
                      <SelectContent>
                        {leads.map((lead) => (
                          <SelectItem key={lead.id} value={lead.id}>
                            {lead.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Select
                      value={form.clienteId}
                      onValueChange={(value) =>
                        setForm({ ...form, clienteId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientes.map((cliente) => (
                          <SelectItem key={cliente.id} value={cliente.id}>
                            {cliente.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="validUntil">Data de Validade</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={form.validUntil}
                  onChange={(e) =>
                    setForm({ ...form, validUntil: e.target.value })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Itens da Proposta</CardTitle>
                  <CardDescription>
                    Adicione os itens que compoem esta proposta.
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={addItem}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {itens.map((item, index) => (
                <div key={item.tempId}>
                  {index > 0 && <Separator className="mb-4" />}
                  <div className="flex gap-3">
                    <div className="flex items-start pt-2">
                      <span className="text-sm font-medium text-muted-foreground w-6">
                        {index + 1}.
                      </span>
                    </div>
                    <div className="flex-1 grid gap-3">
                      <div className="grid gap-2">
                        <Label>Descricao</Label>
                        <Input
                          placeholder="Descricao do item"
                          value={item.description}
                          onChange={(e) =>
                            updateItem(item.tempId, "description", e.target.value)
                          }
                        />
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        <div className="grid gap-2">
                          <Label>Unidade</Label>
                          <Select
                            value={item.unit}
                            onValueChange={(value) =>
                              updateItem(item.tempId, "unit", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {unidades.map((u) => (
                                <SelectItem key={u.value} value={u.value}>
                                  {u.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label>Quantidade</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(
                                item.tempId,
                                "quantity",
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Preco Unit. (R$)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0,00"
                            value={item.unitPrice}
                            onChange={(e) =>
                              updateItem(
                                item.tempId,
                                "unitPrice",
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Total</Label>
                          <div className="flex items-center h-10 px-3 rounded-md border bg-muted/50 text-sm font-medium">
                            {formatCurrency(getItemTotal(item))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="pt-8">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.tempId)}
                        disabled={itens.length <= 1}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Summary */}
        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Resumo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {itens
                  .filter((i) => i.description)
                  .map((item, idx) => (
                    <div
                      key={item.tempId}
                      className="flex justify-between text-sm"
                    >
                      <span className="text-muted-foreground truncate mr-2">
                        {item.description || `Item ${idx + 1}`}
                      </span>
                      <span className="font-medium shrink-0">
                        {formatCurrency(getItemTotal(item))}
                      </span>
                    </div>
                  ))}
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-lg font-bold">
                  {formatCurrency(getGrandTotal())}
                </span>
              </div>
              <Separator />
              <div className="space-y-2">
                <Button
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || !form.title}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {createMutation.isPending
                    ? "Criando..."
                    : "Criar Proposta"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push("/crm/propostas")}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
