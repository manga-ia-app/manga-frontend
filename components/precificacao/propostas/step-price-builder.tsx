"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { Plus, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import type { PricingProposal, ProposalSection, ProposalSectionPhase } from "@/lib/types";
import { SectionCard } from "./section-card";
import { PhaseItem } from "./phase-item";

interface StepPriceBuilderProps {
  proposal: PricingProposal;
  onChange: (updates: Partial<PricingProposal>) => void;
}

function generateId(): string {
  return crypto.randomUUID();
}

export function StepPriceBuilder({ proposal, onChange }: StepPriceBuilderProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const availablePhases = proposal.unassignedPhases;
  const sections = proposal.sections;

  // Find which container a phase is in
  const findContainer = (phaseId: string): string | null => {
    if (availablePhases.some((p) => p.id === phaseId)) return "available";
    for (const section of sections) {
      if (section.phases.some((p) => p.id === phaseId)) return section.id;
    }
    return null;
  };

  const handleAddSection = () => {
    const newSection: ProposalSection = {
      id: generateId(),
      name: `Seção ${sections.length + 1}`,
      orderIndex: sections.length,
      discountType: "None",
      phases: [],
    };
    onChange({ sections: [...sections, newSection] });
  };

  const handleUpdateSection = (sectionId: string, updates: Partial<ProposalSection>) => {
    onChange({
      sections: sections.map((s) =>
        s.id === sectionId ? { ...s, ...updates } : s
      ),
    });
  };

  const handleDeleteSection = (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;
    // Return phases to available
    onChange({
      unassignedPhases: [...availablePhases, ...section.phases.map((p, i) => ({
        ...p,
        orderIndex: availablePhases.length + i,
      }))],
      sections: sections.filter((s) => s.id !== sectionId).map((s, i) => ({
        ...s,
        orderIndex: i,
      })),
    });
  };

  const handlePhaseVisibilityChange = (phaseId: string, isVisible: boolean) => {
    const updatePhase = (p: ProposalSectionPhase) =>
      p.id === phaseId ? { ...p, isVisible, isPriceVisible: isVisible ? p.isPriceVisible : false } : p;

    onChange({
      unassignedPhases: availablePhases.map(updatePhase),
      sections: sections.map((s) => ({
        ...s,
        phases: s.phases.map(updatePhase),
      })),
    });
  };

  const handlePriceVisibilityChange = (phaseId: string, isPriceVisible: boolean) => {
    const updatePhase = (p: ProposalSectionPhase) =>
      p.id === phaseId ? { ...p, isPriceVisible } : p;

    onChange({
      unassignedPhases: availablePhases.map(updatePhase),
      sections: sections.map((s) => ({
        ...s,
        phases: s.phases.map(updatePhase),
      })),
    });
  };

  const handleDeliverableVisibilityChange = (phaseId: string, deliverableId: string, isVisible: boolean) => {
    const updatePhase = (p: ProposalSectionPhase) =>
      p.id === phaseId
        ? { ...p, deliverables: p.deliverables.map((d) => d.id === deliverableId ? { ...d, isVisible } : d) }
        : p;

    onChange({
      unassignedPhases: availablePhases.map(updatePhase),
      sections: sections.map((s) => ({
        ...s,
        phases: s.phases.map(updatePhase),
      })),
    });
  };

  const renderPhaseExpanded = (phase: ProposalSectionPhase) => {
    if (phase.deliverables.length === 0) return null;
    return (
      <div className="space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">Entregáveis</span>
        {phase.deliverables.map((d) => (
          <div key={d.id} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleDeliverableVisibilityChange(phase.id, d.id, !d.isVisible)}
              className={cn(
                "p-0.5 rounded hover:bg-muted",
                !d.isVisible && "text-muted-foreground"
              )}
              title={d.isVisible ? "Ocultar entregável" : "Mostrar entregável"}
            >
              {d.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
            <span className={cn("text-sm", !d.isVisible && "line-through text-muted-foreground")}>
              {d.name}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const activePhaseId = active.id as string;
    const sourceContainer = findContainer(activePhaseId);
    if (!sourceContainer) return;

    // Determine target container
    let targetContainer: string | null = null;
    const overId = over.id as string;

    if (overId === "available-panel" || overId.startsWith("available")) {
      targetContainer = "available";
    } else if (overId.startsWith("section-")) {
      targetContainer = overId.replace("section-", "");
    } else {
      // Over another phase — find its container
      targetContainer = findContainer(overId);
    }

    if (!targetContainer) return;

    // Get the phase being moved
    let movingPhase: ProposalSectionPhase | undefined;
    if (sourceContainer === "available") {
      movingPhase = availablePhases.find((p) => p.id === activePhaseId);
    } else {
      const sourceSection = sections.find((s) => s.id === sourceContainer);
      movingPhase = sourceSection?.phases.find((p) => p.id === activePhaseId);
    }
    if (!movingPhase) return;

    // Same container — reorder
    if (sourceContainer === targetContainer) {
      if (sourceContainer === "available") {
        const oldIndex = availablePhases.findIndex((p) => p.id === activePhaseId);
        const newIndex = availablePhases.findIndex((p) => p.id === overId);
        if (oldIndex !== -1 && newIndex !== -1) {
          const reordered = arrayMove(availablePhases, oldIndex, newIndex).map((p, i) => ({
            ...p,
            orderIndex: i,
          }));
          onChange({ unassignedPhases: reordered });
        }
      } else {
        const sectionIndex = sections.findIndex((s) => s.id === sourceContainer);
        if (sectionIndex === -1) return;
        const sectionPhases = sections[sectionIndex].phases;
        const oldIndex = sectionPhases.findIndex((p) => p.id === activePhaseId);
        const newIndex = sectionPhases.findIndex((p) => p.id === overId);
        if (oldIndex !== -1 && newIndex !== -1) {
          const reordered = arrayMove(sectionPhases, oldIndex, newIndex).map((p, i) => ({
            ...p,
            orderIndex: i,
          }));
          const updatedSections = [...sections];
          updatedSections[sectionIndex] = { ...updatedSections[sectionIndex], phases: reordered };
          onChange({ sections: updatedSections });
        }
      }
      return;
    }

    // Moving to a section — validate monthly/fixed constraint
    if (targetContainer !== "available") {
      const targetSection = sections.find((s) => s.id === targetContainer);
      if (targetSection && targetSection.phases.length > 0) {
        const existingIsMonthly = targetSection.phases[0].isMonthlyBilling;
        if (movingPhase.isMonthlyBilling !== existingIsMonthly) {
          toast.error("Seções não podem misturar etapas mensais e de preço fixo.");
          return;
        }
      }
    }

    // Remove from source
    let newAvailable = [...availablePhases];
    let newSections = sections.map((s) => ({ ...s, phases: [...s.phases] }));

    if (sourceContainer === "available") {
      newAvailable = newAvailable.filter((p) => p.id !== activePhaseId);
    } else {
      const idx = newSections.findIndex((s) => s.id === sourceContainer);
      if (idx !== -1) {
        newSections[idx] = {
          ...newSections[idx],
          phases: newSections[idx].phases.filter((p) => p.id !== activePhaseId),
        };
      }
    }

    // Add to target
    if (targetContainer === "available") {
      newAvailable = [...newAvailable, { ...movingPhase, orderIndex: newAvailable.length }];
    } else {
      const idx = newSections.findIndex((s) => s.id === targetContainer);
      if (idx !== -1) {
        const targetPhases = newSections[idx].phases;
        // Insert at the position of the over item, or at end
        const overIndex = targetPhases.findIndex((p) => p.id === overId);
        const insertIndex = overIndex !== -1 ? overIndex : targetPhases.length;
        const updatedPhases = [...targetPhases];
        updatedPhases.splice(insertIndex, 0, { ...movingPhase, orderIndex: insertIndex });
        newSections[idx] = {
          ...newSections[idx],
          phases: updatedPhases.map((p, i) => ({ ...p, orderIndex: i })),
        };
      }
    }

    // Re-index available phases
    newAvailable = newAvailable.map((p, i) => ({ ...p, orderIndex: i }));

    onChange({
      unassignedPhases: newAvailable,
      sections: newSections,
    });
  };

  const activePhase = activeId
    ? availablePhases.find((p) => p.id === activeId) ||
      sections.flatMap((s) => s.phases).find((p) => p.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={({ active }) => setActiveId(active.id as string)}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="grid grid-cols-[300px_1fr] gap-4">
        {/* Available Phases Panel — always visible (FR-014) */}
        <div className="self-start sticky top-4">
          <AvailablePanel phases={availablePhases} />
        </div>

        {/* Sections */}
        <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-120px)] pr-1">
          {sections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              phases={section.phases}
              onUpdateSection={handleUpdateSection}
              onDeleteSection={handleDeleteSection}
              onPhaseVisibilityChange={handlePhaseVisibilityChange}
              onPriceVisibilityChange={handlePriceVisibilityChange}
              renderPhaseExpanded={renderPhaseExpanded}
            />
          ))}

          <Button variant="outline" onClick={handleAddSection} className="w-full">
            <Plus className="w-4 h-4 mr-2" /> Nova Seção
          </Button>
        </div>
      </div>

      <DragOverlay>
        {activePhase ? (
          <div className="border rounded-lg bg-card p-3 shadow-lg opacity-90">
            <span className="text-sm font-medium">{activePhase.name}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function AvailablePanel({ phases }: { phases: ProposalSectionPhase[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: "available-panel" });

  return (
    <div
      ref={setNodeRef}
      className={`border-2 border-dashed rounded-lg p-4 space-y-2 ${
        isOver ? "border-primary bg-primary/5" : "border-muted-foreground/30"
      }`}
    >
      <h3 className="text-sm font-semibold text-muted-foreground mb-2">
        Etapas Disponíveis ({phases.length})
      </h3>
      <SortableContext items={phases.map((p) => p.id)} strategy={verticalListSortingStrategy}>
        {phases.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Arraste etapas das seções para cá para devolvê-las.
          </p>
        ) : (
          phases.map((phase) => (
            <PhaseItem key={phase.id} phase={phase} />
          ))
        )}
      </SortableContext>
    </div>
  );
}
