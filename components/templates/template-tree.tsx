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
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TreeNode } from "./tree-node";
import { AddItemInline } from "./add-item-inline";
import type {
  TemplatePhase,
  TemplateSubPhase,
  TemplateActivity,
} from "@/lib/types/templates";

interface TemplateTreeProps {
  phases: TemplatePhase[];
  onChange: (phases: TemplatePhase[]) => void;
  generateId: () => string;
}

export function TemplateTree({ phases, onChange, generateId }: TemplateTreeProps) {
  const [addingPhase, setAddingPhase] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(phases.map((p) => p.id)));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const ids = new Set<string>();
    phases.forEach((p) => {
      ids.add(p.id);
      p.subPhases.forEach((s) => ids.add(s.id));
      p.activities.forEach((a) => ids.add(a.id));
      p.subPhases.forEach((s) => s.activities.forEach((a) => ids.add(a.id)));
    });
    setExpandedIds(ids);
  }, [phases]);

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  // Add phase
  const handleAddPhase = useCallback(
    (name: string) => {
      const newPhase: TemplatePhase = {
        id: generateId(),
        name,
        orderIndex: phases.length,
        defaultDurationDays: 0,
        subPhases: [],
        activities: [],
        deliverables: [],
      };
      onChange([...phases, newPhase]);
      setExpandedIds((prev) => new Set([...prev, newPhase.id]));
      setAddingPhase(false);
    },
    [phases, onChange, generateId]
  );

  // Update phase
  const updatePhase = useCallback(
    (phaseId: string, updater: (phase: TemplatePhase) => TemplatePhase) => {
      onChange(phases.map((p) => (p.id === phaseId ? updater(p) : p)));
    },
    [phases, onChange]
  );

  // Delete phase
  const deletePhase = useCallback(
    (phaseId: string) => {
      onChange(phases.filter((p) => p.id !== phaseId));
    },
    [phases, onChange]
  );

  // Phase reorder
  const handlePhaseDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = phases.findIndex((p) => p.id === active.id);
      const newIndex = phases.findIndex((p) => p.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      onChange(arrayMove(phases, oldIndex, newIndex));
    },
    [phases, onChange]
  );

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Hierarquia do Template
          </h3>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={expandAll}>
              Expandir Tudo
            </Button>
            <Button variant="ghost" size="sm" onClick={collapseAll}>
              Colapsar Tudo
            </Button>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handlePhaseDragEnd}
        >
          <SortableContext
            items={phases.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1">
              {phases.map((phase) => (
                <TreeNode
                  key={phase.id}
                  type="phase"
                  phase={phase}
                  level={0}
                  expanded={expandedIds.has(phase.id)}
                  expandedIds={expandedIds}
                  onToggleExpand={toggleExpand}
                  onUpdatePhase={updatePhase}
                  onDeletePhase={deletePhase}
                  generateId={generateId}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {addingPhase ? (
          <div className="mt-2">
            <AddItemInline
              placeholder="Nome da etapa"
              onConfirm={handleAddPhase}
              onCancel={() => setAddingPhase(false)}
            />
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddingPhase(true)}
            className="mt-3 w-full"
          >
            <Plus className="mr-2 h-3 w-3" />
            Adicionar Etapa
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
