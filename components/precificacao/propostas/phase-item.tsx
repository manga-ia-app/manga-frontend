"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Eye, EyeOff, DollarSign, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { ProposalSectionPhase } from "@/lib/types";

interface PhaseItemProps {
  phase: ProposalSectionPhase;
  onVisibilityChange?: (phaseId: string, isVisible: boolean) => void;
  onPriceVisibilityChange?: (phaseId: string, isPriceVisible: boolean) => void;
  showVisibilityToggles?: boolean;
  children?: React.ReactNode; // For expanded content (breakdown, deliverables)
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function PhaseItem({
  phase,
  onVisibilityChange,
  onPriceVisibilityChange,
  showVisibilityToggles = false,
  children,
}: PhaseItemProps) {
  const [expanded, setExpanded] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: phase.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "border rounded-lg bg-card p-3",
        isDragging && "opacity-50 shadow-lg",
        !phase.isVisible && "opacity-60"
      )}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {children && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-muted-foreground hover:text-foreground"
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        )}

        <span className={cn("flex-1 text-sm font-medium", !phase.isVisible && "line-through")}>
          {phase.name}
        </span>

        {phase.isMonthlyBilling && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Mensal</span>
        )}

        {showVisibilityToggles && (
          <>
            <button
              type="button"
              onClick={() => onVisibilityChange?.(phase.id, !phase.isVisible)}
              className={cn(
                "p-1 rounded hover:bg-muted",
                !phase.isVisible && "text-muted-foreground"
              )}
              title={phase.isVisible ? "Ocultar etapa" : "Mostrar etapa"}
            >
              {phase.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => onPriceVisibilityChange?.(phase.id, !phase.isPriceVisible)}
              disabled={!phase.isVisible}
              className={cn(
                "p-1 rounded hover:bg-muted",
                (!phase.isPriceVisible || !phase.isVisible) && "text-muted-foreground",
                !phase.isVisible && "opacity-50 cursor-not-allowed"
              )}
              title={phase.isPriceVisible ? "Ocultar preço" : "Mostrar preço"}
            >
              <DollarSign className={cn("w-4 h-4", !phase.isPriceVisible && "line-through")} />
            </button>
          </>
        )}

        <span className="text-sm font-mono text-muted-foreground">
          {formatCurrency(phase.totalValue)}
          {phase.isMonthlyBilling && "/mês"}
        </span>
      </div>

      {expanded && children && (
        <div className="mt-3 pl-8 border-t pt-3">
          {children}
        </div>
      )}
    </div>
  );
}
