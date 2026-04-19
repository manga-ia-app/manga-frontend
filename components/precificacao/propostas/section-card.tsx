"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProposalSection, ProposalSectionPhase, ProposalDiscountType } from "@/lib/types";
import { PhaseItem } from "./phase-item";
import { DiscountControls } from "./discount-controls";

interface SectionCardProps {
  section: ProposalSection;
  phases: ProposalSectionPhase[];
  onUpdateSection: (sectionId: string, updates: Partial<ProposalSection>) => void;
  onDeleteSection: (sectionId: string) => void;
  onPhaseVisibilityChange: (phaseId: string, isVisible: boolean) => void;
  onPriceVisibilityChange: (phaseId: string, isPriceVisible: boolean) => void;
  renderPhaseExpanded?: (phase: ProposalSectionPhase) => React.ReactNode;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function SectionCard({
  section,
  phases,
  onUpdateSection,
  onDeleteSection,
  onPhaseVisibilityChange,
  onPriceVisibilityChange,
  renderPhaseExpanded,
}: SectionCardProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `section-${section.id}` });

  const subtotal = phases.reduce((sum, p) => sum + p.totalValue, 0);

  return (
    <div
      className={`border rounded-lg p-4 space-y-3 ${isOver ? "ring-2 ring-primary bg-primary/5" : "bg-card"}`}
    >
      <div className="flex items-center gap-3">
        <Input
          value={section.name}
          onChange={(e) => onUpdateSection(section.id, { name: e.target.value })}
          className="font-medium"
          placeholder="Nome da seção"
        />
        <div className="flex items-center gap-2 shrink-0">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">Prazo (dias):</Label>
          <Input
            type="number"
            min={0}
            value={section.deadlineDays ?? ""}
            onChange={(e) => onUpdateSection(section.id, {
              deadlineDays: e.target.value ? parseInt(e.target.value) : undefined,
            })}
            className="w-20"
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => {
            if (window.confirm("Excluir esta seção? As etapas voltarão para o painel de disponíveis.")) {
              onDeleteSection(section.id);
            }
          }}
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>

      <div ref={setNodeRef} className="space-y-2 min-h-[48px]">
        <SortableContext
          items={phases.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          {phases.length === 0 ? (
            <div className="border-2 border-dashed rounded-lg p-4 text-center text-sm text-muted-foreground">
              Arraste etapas para esta seção
            </div>
          ) : (
            phases.map((phase) => (
              <PhaseItem
                key={phase.id}
                phase={phase}
                showVisibilityToggles
                onVisibilityChange={onPhaseVisibilityChange}
                onPriceVisibilityChange={onPriceVisibilityChange}
              >
                {renderPhaseExpanded?.(phase)}
              </PhaseItem>
            ))
          )}
        </SortableContext>
      </div>

      <div className="flex justify-end text-sm font-medium border-t pt-2">
        Subtotal: {formatCurrency(subtotal)}
      </div>

      <DiscountControls
        subtotal={subtotal}
        discountType={section.discountType ?? "None"}
        discountPercent={section.discountPercent}
        discountValue={section.discountValue}
        roundingValue={section.roundingValue}
        onDiscountTypeChange={(type) => onUpdateSection(section.id, { discountType: type })}
        onDiscountPercentChange={(v) => onUpdateSection(section.id, { discountPercent: v })}
        onDiscountValueChange={(v) => onUpdateSection(section.id, { discountValue: v })}
        onRoundingValueChange={(v) => onUpdateSection(section.id, { roundingValue: v })}
      />
    </div>
  );
}
