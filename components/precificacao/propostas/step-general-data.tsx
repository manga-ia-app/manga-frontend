"use client";

import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import apiClient from "@/lib/api/client";
import type { Cliente } from "@/lib/types";
import type { PricingProposal } from "@/lib/types";

interface StepGeneralDataProps {
  proposal: PricingProposal;
  onChange: (updates: Partial<PricingProposal>) => void;
}

export function StepGeneralData({ proposal, onChange }: StepGeneralDataProps) {
  const { data: clientes } = useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      const response = await apiClient.get<{ items: Cliente[] }>("/clientes", {
        params: { pageSize: 100 },
      });
      return response.data.items;
    },
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Título da Proposta *</Label>
          <Input
            id="title"
            value={proposal.title}
            onChange={(e) => onChange({ title: e.target.value })}
            maxLength={300}
            placeholder="Ex: Proposta - Projeto Residencial"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cliente">Cliente *</Label>
          <select
            id="cliente"
            value={proposal.clienteId || ""}
            onChange={(e) => onChange({ clienteId: e.target.value || undefined })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Selecione um cliente</option>
            {clientes?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="introductionText">Texto de Introdução</Label>
        <textarea
          id="introductionText"
          value={proposal.introductionText || ""}
          onChange={(e) => onChange({ introductionText: e.target.value || undefined })}
          rows={4}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
          placeholder="Apresentação da proposta ao cliente..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="exclusionsText">Exclusões</Label>
        <textarea
          id="exclusionsText"
          value={proposal.exclusionsText || ""}
          onChange={(e) => onChange({ exclusionsText: e.target.value || undefined })}
          rows={3}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
          placeholder="Itens não inclusos na proposta..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="paymentConditions">Condições de Pagamento</Label>
          <textarea
            id="paymentConditions"
            value={proposal.paymentConditions || ""}
            onChange={(e) => onChange({ paymentConditions: e.target.value || undefined })}
            rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
            placeholder="Formas e prazos de pagamento..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="paymentData">Dados para Pagamento</Label>
          <textarea
            id="paymentData"
            value={proposal.paymentData || ""}
            onChange={(e) => onChange({ paymentData: e.target.value || undefined })}
            rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
            placeholder="PIX, conta bancária..."
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="observationsText">Observações</Label>
        <textarea
          id="observationsText"
          value={proposal.observationsText || ""}
          onChange={(e) => onChange({ observationsText: e.target.value || undefined })}
          rows={3}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
          placeholder="Observações adicionais..."
        />
      </div>
    </div>
  );
}
