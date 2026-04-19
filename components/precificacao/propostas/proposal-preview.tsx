"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PricingProposal, ProposalSection } from "@/lib/types";

interface ProposalPreviewProps {
  proposal: PricingProposal;
  clienteName?: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
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

export function ProposalPreview({ proposal, clienteName }: ProposalPreviewProps) {
  return (
    <Card className="h-full overflow-auto">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Preview da Proposta</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 text-sm">
        {/* Header */}
        <div>
          <h2 className="text-base font-bold">{proposal.title || "Sem título"}</h2>
          {clienteName && <p className="text-muted-foreground">Cliente: {clienteName}</p>}
        </div>

        {/* Introduction */}
        {proposal.introductionText && (
          <div>
            <h3 className="font-semibold mb-1">Introdução</h3>
            <p className="whitespace-pre-line text-muted-foreground">{proposal.introductionText}</p>
          </div>
        )}

        {/* Sections with phases */}
        {proposal.sections.map((section) => {
          const visiblePhases = section.phases.filter((p) => p.isVisible);
          const sectionValue = computeSectionFinalValue(section);

          return (
            <div key={section.id} className="border rounded-lg p-3 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">{section.name}</h3>
                <span className="font-mono font-medium">{formatCurrency(sectionValue)}</span>
              </div>

              {visiblePhases.map((phase) => (
                <div key={phase.id} className="pl-3 border-l-2 space-y-1">
                  <div className="flex justify-between">
                    <span className="font-medium">{phase.name}</span>
                    {phase.isPriceVisible && (
                      <span className="font-mono text-muted-foreground">
                        {formatCurrency(phase.totalValue)}
                        {phase.isMonthlyBilling && "/mês"}
                      </span>
                    )}
                  </div>
                  {phase.description && (
                    <p className="text-xs text-muted-foreground whitespace-pre-line">{phase.description}</p>
                  )}
                  {phase.deliverables.filter((d) => d.isVisible).length > 0 && (
                    <ul className="text-xs text-muted-foreground list-disc pl-4">
                      {phase.deliverables.filter((d) => d.isVisible).map((d) => (
                        <li key={d.id}>{d.name}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}

              {section.deadlineDays && (
                <p className="text-xs text-muted-foreground">Prazo: {section.deadlineDays} dias</p>
              )}
            </div>
          );
        })}

        {/* Section summary — NO sum total (FR-027a) */}
        {proposal.sections.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Resumo das Seções</h3>
            {proposal.sections.map((section) => (
              <div key={section.id} className="flex justify-between py-1 border-b last:border-b-0">
                <span>{section.name}</span>
                <span className="font-mono">{formatCurrency(computeSectionFinalValue(section))}</span>
              </div>
            ))}
          </div>
        )}

        {/* Exclusions */}
        {proposal.exclusionsText && (
          <div>
            <h3 className="font-semibold mb-1">Exclusões</h3>
            <p className="whitespace-pre-line text-muted-foreground">{proposal.exclusionsText}</p>
          </div>
        )}

        {/* Payment */}
        {proposal.paymentConditions && (
          <div>
            <h3 className="font-semibold mb-1">Condições de Pagamento</h3>
            <p className="whitespace-pre-line text-muted-foreground">{proposal.paymentConditions}</p>
          </div>
        )}

        {proposal.paymentData && (
          <div>
            <h3 className="font-semibold mb-1">Dados para Pagamento</h3>
            <p className="whitespace-pre-line text-muted-foreground">{proposal.paymentData}</p>
          </div>
        )}

        {/* Scope Protection — NO percentualAditivo */}
        {(proposal.limiteRevisoes > 0 || proposal.valorHoraAdicional > 0 || proposal.prazoFeedbackDias) && (
          <div>
            <h3 className="font-semibold mb-1">Proteção de Escopo</h3>
            <div className="space-y-1 text-muted-foreground">
              {proposal.limiteRevisoes > 0 && <p>Limite de revisões: {proposal.limiteRevisoes}</p>}
              {proposal.prazoFeedbackDias && <p>Prazo para feedback: {proposal.prazoFeedbackDias} dias</p>}
              {proposal.valorHoraAdicional > 0 && (
                <p>Valor hora adicional: {formatCurrency(proposal.valorHoraAdicional)}</p>
              )}
            </div>
          </div>
        )}

        {/* Validity */}
        {proposal.validUntil && (
          <div>
            <h3 className="font-semibold mb-1">Validade</h3>
            <p className="text-muted-foreground">
              Válida até: {new Date(proposal.validUntil).toLocaleDateString("pt-BR")}
            </p>
          </div>
        )}

        {/* Observations */}
        {proposal.observationsText && (
          <div>
            <h3 className="font-semibold mb-1">Observações</h3>
            <p className="whitespace-pre-line text-muted-foreground">{proposal.observationsText}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
