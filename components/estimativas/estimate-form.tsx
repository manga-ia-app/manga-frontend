"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getTemplates } from "@/lib/api/templates";
import { getClientes } from "@/lib/api/cadastros";
import { createCliente } from "@/lib/api/cadastros";
import type { CreateEstimatePayload } from "@/lib/types/estimativas";

interface EstimateFormProps {
  onSubmit: (payload: CreateEstimatePayload) => void;
  isSubmitting: boolean;
}

export function EstimateForm({ onSubmit, isSubmitting }: EstimateFormProps) {
  const queryClient = useQueryClient();

  const [templateId, setTemplateId] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [description, setDescription] = useState("");
  const [areaM2, setAreaM2] = useState("");
  const [expirationDays, setExpirationDays] = useState("");
  const [noExpiration, setNoExpiration] = useState(false);

  // Client inline create dialog
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");

  const { data: templates = [] } = useQuery({
    queryKey: ["templates"],
    queryFn: getTemplates,
  });

  const { data: clientesData } = useQuery({
    queryKey: ["clientes", { pageSize: 200 }],
    queryFn: () => getClientes({ pageSize: 200 }),
  });
  const clientes = clientesData?.items ?? [];

  const createClienteMutation = useMutation({
    mutationFn: (data: { name: string; email?: string; phone?: string }) =>
      createCliente(data),
    onSuccess: (newCliente) => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      setClienteId(newCliente.id);
      setShowClientDialog(false);
      setNewClientName("");
      setNewClientEmail("");
      setNewClientPhone("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateId || !clienteId || !description.trim()) return;

    const payload: CreateEstimatePayload = {
      templateId,
      clienteId,
      description: description.trim(),
    };

    if (areaM2) payload.areaM2 = parseFloat(areaM2);
    if (!noExpiration && expirationDays) payload.expirationDays = parseInt(expirationDays);

    onSubmit(payload);
  };

  const handleCreateClient = () => {
    if (!newClientName.trim()) return;
    createClienteMutation.mutate({
      name: newClientName.trim(),
      email: newClientEmail.trim() || undefined,
      phone: newClientPhone.trim() || undefined,
    });
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Template selector */}
          <div className="space-y-2">
            <Label htmlFor="template">Template *</Label>
            <Select value={templateId || undefined} onValueChange={(val) => setTemplateId(val)}>
              <SelectTrigger id="template" className="w-full">
                <SelectValue placeholder="Selecione um template..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} ({t.activityCount} atividades)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Client selector */}
          <div className="space-y-2">
            <Label htmlFor="cliente">Cliente *</Label>
            <div className="flex gap-2">
              <Select value={clienteId || undefined} onValueChange={(val) => setClienteId(val)}>
                <SelectTrigger id="cliente" className="w-full">
                  <SelectValue placeholder="Selecione um cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => setShowClientDialog(true)}
              >
                Novo
              </Button>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Descrição *</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Projeto residencial Vila Madalena"
            maxLength={500}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Area */}
          <div className="space-y-2">
            <Label htmlFor="areaM2">Área (m²)</Label>
            <Input
              id="areaM2"
              type="number"
              step="0.01"
              min="0"
              value={areaM2}
              onChange={(e) => setAreaM2(e.target.value)}
              placeholder="Ex: 150.00"
            />
          </div>

          {/* Expiration */}
          <div className="space-y-2">
            <Label htmlFor="expirationDays">Validade (dias)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="expirationDays"
                type="number"
                min="1"
                value={expirationDays}
                onChange={(e) => setExpirationDays(e.target.value)}
                placeholder="Ex: 30"
                disabled={noExpiration}
              />
              <div className="flex items-center gap-1.5 text-sm whitespace-nowrap">
                <Checkbox
                  id="no-expiration"
                  checked={noExpiration}
                  onCheckedChange={(checked) => {
                    const val = checked === true;
                    setNoExpiration(val);
                    if (val) setExpirationDays("");
                  }}
                />
                <Label htmlFor="no-expiration" className="cursor-pointer">
                  Sem expiração
                </Label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || !templateId || !clienteId || !description.trim()}>
            {isSubmitting ? "Criando..." : "Criar Estimativa"}
          </Button>
        </div>
      </form>

      {/* Inline client create dialog */}
      <Dialog open={showClientDialog} onOpenChange={setShowClientDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newClientName">Nome *</Label>
              <Input
                id="newClientName"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="Nome do cliente"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newClientEmail">Email</Label>
              <Input
                id="newClientEmail"
                type="email"
                value={newClientEmail}
                onChange={(e) => setNewClientEmail(e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newClientPhone">Telefone</Label>
              <Input
                id="newClientPhone"
                value={newClientPhone}
                onChange={(e) => setNewClientPhone(e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClientDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateClient}
              disabled={!newClientName.trim() || createClienteMutation.isPending}
            >
              {createClienteMutation.isPending ? "Criando..." : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
