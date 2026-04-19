"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PricingProposal, ProposalSection } from "@/lib/types";

interface StepReviewProps {
  proposal: PricingProposal;
  onChange: (updates: Partial<PricingProposal>) => void;
}

function computeSectionFinalValue(section: ProposalSection): number {
  const subtotal = section.phases.reduce((sum, p) => sum + p.totalValue, 0);
  let discount = 0;
  if (section.discountType === "Percentage") {
    discount = subtotal * ((section.discountPercent ?? 0) / 100);
  } else if (section.discountType === "Absolute") {
    discount = section.discountValue ?? 0;
  }
  const discountedValue = subtotal - discount;
  return section.roundingValue && section.roundingValue > 0 ? section.roundingValue : discountedValue;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function StepReview({ proposal, onChange }: StepReviewProps) {
  return (
    <div className="space-y-6">
      {/* Scope Protection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Proteção de Escopo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="limiteRevisoes">Limite de Revisões</Label>
              <Input
                id="limiteRevisoes"
                type="number"
                min={0}
                value={proposal.limiteRevisoes}
                onChange={(e) => onChange({ limiteRevisoes: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prazoFeedbackDias">Prazo para Feedback (dias)</Label>
              <Input
                id="prazoFeedbackDias"
                type="number"
                min={0}
                value={proposal.prazoFeedbackDias ?? ""}
                onChange={(e) => {
                  const v = e.target.value ? parseInt(e.target.value) : undefined;
                  onChange({ prazoFeedbackDias: v });
                }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valorHoraAdicional">Valor Hora Adicional (R$)</Label>
              <Input
                id="valorHoraAdicional"
                type="number"
                min={0}
                step="0.01"
                value={proposal.valorHoraAdicional}
                onChange={(e) => onChange({ valorHoraAdicional: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="validUntil">Validade da Proposta</Label>
              <Input
                id="validUntil"
                type="date"
                value={proposal.validUntil ? proposal.validUntil.split("T")[0] : ""}
                onChange={(e) => onChange({ validUntil: e.target.value ? e.target.value + "T00:00:00Z" : undefined })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Summary — NO sum total (FR-027a) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumo das Seções</CardTitle>
        </CardHeader>
        <CardContent>
          {proposal.sections.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma seção criada ainda.</p>
          ) : (
            <div className="space-y-2">
              {proposal.sections.map((section) => (
                <div key={section.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <span className="text-sm font-medium">{section.name}</span>
                  <span className="text-sm font-mono">
                    {formatCurrency(computeSectionFinalValue(section))}
                    {section.deadlineDays && (
                      <span className="text-muted-foreground ml-2">({section.deadlineDays} dias)</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
