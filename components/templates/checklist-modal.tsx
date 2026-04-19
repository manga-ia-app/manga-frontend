"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Plus } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TemplateChecklistItem } from "@/lib/types/templates";

interface ChecklistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: TemplateChecklistItem[];
  onUpdate: (items: TemplateChecklistItem[]) => void;
  activityName: string;
  generateId: () => string;
}

function SortableChecklistItem({
  item,
  onDelete,
  onUpdate,
}: {
  item: TemplateChecklistItem;
  onDelete: (id: string) => void;
  onUpdate: (id: string, description: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <Input
        value={item.description}
        onChange={(e) => onUpdate(item.id, e.target.value)}
        className="h-8 text-sm flex-1"
      />
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-1.5 text-muted-foreground hover:text-destructive"
        onClick={() => onDelete(item.id)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export function ChecklistModal({
  open,
  onOpenChange,
  items,
  onUpdate,
  activityName,
  generateId,
}: ChecklistModalProps) {
  const [newItem, setNewItem] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function handleAdd() {
    if (!newItem.trim()) return;
    const item: TemplateChecklistItem = {
      id: generateId(),
      description: newItem.trim(),
      orderIndex: items.length,
    };
    onUpdate([...items, item]);
    setNewItem("");
  }

  function handleDelete(id: string) {
    onUpdate(items.filter((item) => item.id !== id));
  }

  function handleUpdateItem(id: string, description: string) {
    onUpdate(items.map((item) => (item.id === id ? { ...item, description } : item)));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    onUpdate(arrayMove(items, oldIndex, newIndex));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Checklist — {activityName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              {items.map((item) => (
                <SortableChecklistItem
                  key={item.id}
                  item={item}
                  onDelete={handleDelete}
                  onUpdate={handleUpdateItem}
                />
              ))}
            </SortableContext>
          </DndContext>

          {items.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum item no checklist. Adicione abaixo.
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Novo item do checklist"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="h-9"
          />
          <Button size="sm" onClick={handleAdd} disabled={!newItem.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
