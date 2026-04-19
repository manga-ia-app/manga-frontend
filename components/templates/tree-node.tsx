"use client";

import { useState, useCallback } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
import {
  GripVertical,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  ClipboardList,
  FolderPlus,
  Layers,
  FolderOpen,
  CircleDot,
  FileText,
  Package,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { AddItemInline } from "./add-item-inline";
import { ChecklistModal } from "./checklist-modal";
import { MigrateActivitiesDialog } from "./migrate-activities-dialog";
import { DeleteSubphaseDialog } from "./delete-subphase-dialog";
import type {
  TemplatePhase,
  TemplateSubPhase,
  TemplateActivity,
  TemplateChecklistItem,
  TemplateDeliverable,
} from "@/lib/types/templates";

interface TreeNodeProps {
  type: "phase" | "subphase" | "activity" | "deliverable";
  phase?: TemplatePhase;
  subPhase?: TemplateSubPhase;
  activity?: TemplateActivity;
  deliverable?: TemplateDeliverable;
  parentPhase?: TemplatePhase;
  level: number;
  expanded: boolean;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onUpdatePhase?: (phaseId: string, updater: (p: TemplatePhase) => TemplatePhase) => void;
  onDeletePhase?: (phaseId: string) => void;
  generateId: () => string;
}

export function TreeNode({
  type,
  phase,
  subPhase,
  activity,
  deliverable,
  parentPhase,
  level,
  expanded,
  expandedIds,
  onToggleExpand,
  onUpdatePhase,
  onDeletePhase,
  generateId,
}: TreeNodeProps) {
  const nodeId =
    type === "phase" ? phase?.id ?? "" :
    type === "subphase" ? subPhase?.id ?? "" :
    type === "deliverable" ? deliverable?.id ?? "" :
    activity?.id ?? "";
  const nodeName =
    type === "phase" ? phase?.name ?? "" :
    type === "subphase" ? subPhase?.name ?? "" :
    type === "deliverable" ? deliverable?.name ?? "" :
    activity?.name ?? "";

  const [addingChild, setAddingChild] = useState<"subphase" | "activity" | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(nodeName);
  const [addingDeliverable, setAddingDeliverable] = useState(false);
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [migrateDialogOpen, setMigrateDialogOpen] = useState(false);
  const [deleteSubphaseDialog, setDeleteSubphaseDialog] = useState<TemplateSubPhase | null>(null);
  const [showPhaseDeleteConfirm, setShowPhaseDeleteConfirm] = useState(false);
  const [showAutoMoveConfirm, setShowAutoMoveConfirm] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: nodeId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const hasChildren =
    type === "phase"
      ? (phase?.subPhases?.length ?? 0) > 0 || (phase?.activities?.length ?? 0) > 0
      : type === "subphase"
        ? (subPhase?.activities?.length ?? 0) > 0
        : type === "activity"
          ? (activity?.checklistItems?.length ?? 0) > 0
          : false;

  const checklistCount = activity?.checklistItems?.length ?? 0;

  // Child counts for badges
  const subPhaseCount = type === "phase" ? phase?.subPhases?.length ?? 0 : 0;
  const directActivityCount =
    type === "phase" ? phase?.activities?.length ?? 0 :
    type === "subphase" ? subPhase?.activities?.length ?? 0 :
    0;

  // Name editing
  const commitName = useCallback(() => {
    setEditingName(false);
    if (!nameValue.trim()) return;
    if (type === "phase" && onUpdatePhase && phase) {
      onUpdatePhase(phase.id, (p) => ({ ...p, name: nameValue.trim() }));
    } else if (type === "subphase" && subPhase && parentPhase && onUpdatePhase) {
      onUpdatePhase(parentPhase.id, (p) => ({
        ...p,
        subPhases: p.subPhases.map((s) =>
          s.id === subPhase.id ? { ...s, name: nameValue.trim() } : s
        ),
      }));
    } else if (type === "deliverable" && deliverable && onUpdatePhase) {
      if (phase) {
        onUpdatePhase(phase.id, (p) => ({
          ...p,
          deliverables: (p.deliverables ?? []).map((d) =>
            d.id === deliverable.id ? { ...d, name: nameValue.trim() } : d
          ),
        }));
      } else if (parentPhase && subPhase) {
        onUpdatePhase(parentPhase.id, (p) => ({
          ...p,
          subPhases: p.subPhases.map((s) =>
            s.id === subPhase.id
              ? { ...s, deliverables: (s.deliverables ?? []).map((d) => d.id === deliverable.id ? { ...d, name: nameValue.trim() } : d) }
              : s
          ),
        }));
      }
    }
  }, [nameValue, type, phase, subPhase, parentPhase, deliverable, onUpdatePhase]);

  // Description editing
  const handleDescriptionChange = useCallback(
    (value: string) => {
      if (type === "phase" && onUpdatePhase && phase) {
        onUpdatePhase(phase.id, (p) => ({ ...p, description: value || undefined }));
      } else if (type === "subphase" && subPhase && parentPhase && onUpdatePhase) {
        onUpdatePhase(parentPhase.id, (p) => ({
          ...p,
          subPhases: p.subPhases.map((s) =>
            s.id === subPhase.id ? { ...s, description: value || undefined } : s
          ),
        }));
      }
    },
    [type, phase, subPhase, parentPhase, onUpdatePhase]
  );

  // Deliverable operations
  const handleAddDeliverable = useCallback(
    (name: string) => {
      const newDeliverable = { id: generateId(), name, orderIndex: 0 };
      if (type === "phase" && onUpdatePhase && phase) {
        onUpdatePhase(phase.id, (p) => ({
          ...p,
          deliverables: [...(p.deliverables ?? []), { ...newDeliverable, orderIndex: (p.deliverables ?? []).length }],
        }));
      } else if (type === "subphase" && subPhase && parentPhase && onUpdatePhase) {
        onUpdatePhase(parentPhase.id, (p) => ({
          ...p,
          subPhases: p.subPhases.map((s) =>
            s.id === subPhase.id
              ? { ...s, deliverables: [...(s.deliverables ?? []), { ...newDeliverable, orderIndex: (s.deliverables ?? []).length }] }
              : s
          ),
        }));
      }
      setAddingDeliverable(false);
    },
    [type, phase, subPhase, parentPhase, onUpdatePhase, generateId]
  );

  const handleRemoveDeliverable = useCallback(
    (deliverableId: string) => {
      if (type === "phase" && onUpdatePhase && phase) {
        onUpdatePhase(phase.id, (p) => ({
          ...p,
          deliverables: (p.deliverables ?? []).filter((d) => d.id !== deliverableId),
        }));
      } else if (type === "subphase" && subPhase && parentPhase && onUpdatePhase) {
        onUpdatePhase(parentPhase.id, (p) => ({
          ...p,
          subPhases: p.subPhases.map((s) =>
            s.id === subPhase.id
              ? { ...s, deliverables: (s.deliverables ?? []).filter((d) => d.id !== deliverableId) }
              : s
          ),
        }));
      }
    },
    [type, phase, subPhase, parentPhase, onUpdatePhase]
  );

  const handleRenameDeliverable = useCallback(
    (deliverableId: string, name: string) => {
      if (type === "phase" && onUpdatePhase && phase) {
        onUpdatePhase(phase.id, (p) => ({
          ...p,
          deliverables: (p.deliverables ?? []).map((d) => d.id === deliverableId ? { ...d, name } : d),
        }));
      } else if (type === "subphase" && subPhase && parentPhase && onUpdatePhase) {
        onUpdatePhase(parentPhase.id, (p) => ({
          ...p,
          subPhases: p.subPhases.map((s) =>
            s.id === subPhase.id
              ? { ...s, deliverables: (s.deliverables ?? []).map((d) => d.id === deliverableId ? { ...d, name } : d) }
              : s
          ),
        }));
      }
    },
    [type, phase, subPhase, parentPhase, onUpdatePhase]
  );

  const currentDescription = type === "phase" ? phase?.description ?? "" : subPhase?.description ?? "";
  const currentDeliverables = type === "phase" ? phase?.deliverables ?? [] : subPhase?.deliverables ?? [];

  // Auto-expand helper
  const ensureExpanded = useCallback(() => {
    if (!expanded) {
      onToggleExpand(nodeId);
    }
  }, [expanded, onToggleExpand, nodeId]);

  // Phase-level operations
  const handleAddSubphase = useCallback(() => {
    if (!phase || !onUpdatePhase) return;

    // FR-006b: if phase has direct activities or deliverables, show migration dialog
    if (phase.activities.length > 0 || (phase.deliverables ?? []).length > 0) {
      ensureExpanded();
      setMigrateDialogOpen(true);
      return;
    }

    ensureExpanded();
    setAddingChild("subphase");
  }, [phase, onUpdatePhase, ensureExpanded]);

  const handleAddActivity = useCallback(() => {
    ensureExpanded();
    setAddingChild("activity");
  }, [ensureExpanded]);

  const confirmAddSubphase = useCallback(
    (name: string) => {
      if (!phase || !onUpdatePhase) return;
      const newId = generateId();
      const newSubPhase: TemplateSubPhase = {
        id: newId,
        name,
        orderIndex: phase.subPhases.length,
        activities: [],
        deliverables: [],
      };
      onUpdatePhase(phase.id, (p) => ({
        ...p,
        subPhases: [...p.subPhases, newSubPhase],
      }));
      onToggleExpand(newId);
      setAddingChild(null);
    },
    [phase, onUpdatePhase, generateId, onToggleExpand]
  );

  const confirmAddActivity = useCallback(
    (name: string) => {
      if (!onUpdatePhase) return;
      const newActivity: TemplateActivity = {
        id: generateId(),
        name,
        orderIndex: 0,
        checklistItems: [],
      };

      if (type === "phase" && phase) {
        onUpdatePhase(phase.id, (p) => ({
          ...p,
          activities: [...p.activities, { ...newActivity, orderIndex: p.activities.length }],
        }));
      } else if (type === "subphase" && subPhase && parentPhase) {
        onUpdatePhase(parentPhase.id, (p) => ({
          ...p,
          subPhases: p.subPhases.map((s) =>
            s.id === subPhase.id
              ? { ...s, activities: [...s.activities, { ...newActivity, orderIndex: s.activities.length }] }
              : s
          ),
        }));
      }
      setAddingChild(null);
    },
    [type, phase, subPhase, parentPhase, onUpdatePhase, generateId]
  );

  // Migration dialog confirm (FR-006b)
  const handleMigrateConfirm = useCallback(
    (subphaseName: string) => {
      if (!phase || !onUpdatePhase) return;
      const newId = generateId();
      const newSubPhase: TemplateSubPhase = {
        id: newId,
        name: subphaseName,
        orderIndex: 0,
        activities: phase.activities.map((a, i) => ({ ...a, orderIndex: i })),
        deliverables: (phase.deliverables ?? []).map((d, i) => ({ ...d, orderIndex: i })),
      };
      onUpdatePhase(phase.id, (p) => ({
        ...p,
        subPhases: [...p.subPhases, newSubPhase],
        activities: [],
        deliverables: [],
      }));
      onToggleExpand(newId);
      setMigrateDialogOpen(false);
    },
    [phase, onUpdatePhase, generateId, onToggleExpand]
  );

  // Delete operations
  const handleDelete = useCallback(() => {
    if (type === "phase" && onDeletePhase && phase) {
      const descendantCount =
        phase.subPhases.length +
        phase.activities.length +
        phase.subPhases.reduce((acc, s) => acc + s.activities.length, 0);
      if (descendantCount > 0) {
        setShowPhaseDeleteConfirm(true);
        return;
      }
      onDeletePhase(phase.id);
    } else if (type === "subphase" && subPhase && parentPhase && onUpdatePhase) {
      // FR-011a/b: handle subphase deletion
      if (subPhase.activities.length > 0) {
        const otherSubphases = parentPhase.subPhases.filter((s) => s.id !== subPhase.id);
        if (otherSubphases.length === 0) {
          // FR-011a: last subphase — auto-move activities to phase
          setShowAutoMoveConfirm(true);
          return;
        } else {
          // FR-011b: show dialog to delete or move activities
          setDeleteSubphaseDialog(subPhase);
          return;
        }
      } else {
        onUpdatePhase(parentPhase.id, (p) => ({
          ...p,
          subPhases: p.subPhases.filter((s) => s.id !== subPhase.id),
        }));
      }
    } else if (type === "activity" && activity && onUpdatePhase) {
      if (phase) {
        onUpdatePhase(phase.id, (p) => ({
          ...p,
          activities: p.activities.filter((a) => a.id !== activity.id),
        }));
      } else if (parentPhase && subPhase) {
        onUpdatePhase(parentPhase.id, (p) => ({
          ...p,
          subPhases: p.subPhases.map((s) =>
            s.id === subPhase.id
              ? { ...s, activities: s.activities.filter((a) => a.id !== activity.id) }
              : s
          ),
        }));
      }
    } else if (type === "deliverable" && deliverable && onUpdatePhase) {
      if (phase) {
        onUpdatePhase(phase.id, (p) => ({
          ...p,
          deliverables: (p.deliverables ?? []).filter((d) => d.id !== deliverable.id),
        }));
      } else if (parentPhase && subPhase) {
        onUpdatePhase(parentPhase.id, (p) => ({
          ...p,
          subPhases: p.subPhases.map((s) =>
            s.id === subPhase.id
              ? { ...s, deliverables: (s.deliverables ?? []).filter((d) => d.id !== deliverable.id) }
              : s
          ),
        }));
      }
    }
  }, [type, phase, subPhase, parentPhase, activity, deliverable, onDeletePhase, onUpdatePhase]);

  // Delete subphase dialog handlers (FR-011b)
  const handleDeleteSubphaseConfirm = useCallback(
    (action: "delete" | "move", targetSubPhaseId?: string) => {
      if (!deleteSubphaseDialog || !parentPhase || !onUpdatePhase) return;

      if (action === "delete") {
        onUpdatePhase(parentPhase.id, (p) => ({
          ...p,
          subPhases: p.subPhases.filter((s) => s.id !== deleteSubphaseDialog.id),
        }));
      } else if (action === "move" && targetSubPhaseId) {
        const activitiesToMove = deleteSubphaseDialog.activities;
        onUpdatePhase(parentPhase.id, (p) => ({
          ...p,
          subPhases: p.subPhases
            .filter((s) => s.id !== deleteSubphaseDialog.id)
            .map((s) =>
              s.id === targetSubPhaseId
                ? {
                    ...s,
                    activities: [
                      ...s.activities,
                      ...activitiesToMove.map((a, i) => ({
                        ...a,
                        orderIndex: s.activities.length + i,
                      })),
                    ],
                  }
                : s
            ),
        }));
      }
      setDeleteSubphaseDialog(null);
    },
    [deleteSubphaseDialog, parentPhase, onUpdatePhase]
  );

  // Checklist update
  const handleChecklistUpdate = useCallback(
    (items: TemplateChecklistItem[]) => {
      if (!activity || !onUpdatePhase) return;
      if (phase) {
        onUpdatePhase(phase.id, (p) => ({
          ...p,
          activities: p.activities.map((a) =>
            a.id === activity.id ? { ...a, checklistItems: items } : a
          ),
        }));
      } else if (parentPhase && subPhase) {
        onUpdatePhase(parentPhase.id, (p) => ({
          ...p,
          subPhases: p.subPhases.map((s) =>
            s.id === subPhase.id
              ? {
                  ...s,
                  activities: s.activities.map((a) =>
                    a.id === activity.id ? { ...a, checklistItems: items } : a
                  ),
                }
              : s
          ),
        }));
      }
    },
    [activity, phase, parentPhase, subPhase, onUpdatePhase]
  );

  // Child reorder handlers
  const handleChildDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !onUpdatePhase) return;

      if (type === "phase" && phase) {
        // Reorder subphases
        const subIdx = phase.subPhases.findIndex((s) => s.id === active.id);
        if (subIdx !== -1) {
          const overIdx = phase.subPhases.findIndex((s) => s.id === over.id);
          if (overIdx !== -1) {
            onUpdatePhase(phase.id, (p) => ({
              ...p,
              subPhases: arrayMove(p.subPhases, subIdx, overIdx),
            }));
            return;
          }
        }
        // Reorder direct activities
        const actIdx = phase.activities.findIndex((a) => a.id === active.id);
        if (actIdx !== -1) {
          const overActIdx = phase.activities.findIndex((a) => a.id === over.id);
          if (overActIdx !== -1) {
            onUpdatePhase(phase.id, (p) => ({
              ...p,
              activities: arrayMove(p.activities, actIdx, overActIdx),
            }));
            return;
          }
        }
        // Reorder deliverables
        const delIdx = (phase.deliverables ?? []).findIndex((d) => d.id === active.id);
        if (delIdx !== -1) {
          const overDelIdx = (phase.deliverables ?? []).findIndex((d) => d.id === over.id);
          if (overDelIdx !== -1) {
            onUpdatePhase(phase.id, (p) => ({
              ...p,
              deliverables: arrayMove(p.deliverables ?? [], delIdx, overDelIdx),
            }));
          }
        }
      } else if (type === "subphase" && subPhase && parentPhase) {
        const actIdx = subPhase.activities.findIndex((a) => a.id === active.id);
        if (actIdx !== -1) {
          const overActIdx = subPhase.activities.findIndex((a) => a.id === over.id);
          if (overActIdx !== -1) {
            onUpdatePhase(parentPhase.id, (p) => ({
              ...p,
              subPhases: p.subPhases.map((s) =>
                s.id === subPhase.id
                  ? { ...s, activities: arrayMove(s.activities, actIdx, overActIdx) }
                  : s
              ),
            }));
            return;
          }
        }
        // Reorder deliverables
        const delIdx = (subPhase.deliverables ?? []).findIndex((d) => d.id === active.id);
        if (delIdx !== -1) {
          const overDelIdx = (subPhase.deliverables ?? []).findIndex((d) => d.id === over.id);
          if (overDelIdx !== -1) {
            onUpdatePhase(parentPhase.id, (p) => ({
              ...p,
              subPhases: p.subPhases.map((s) =>
                s.id === subPhase.id
                  ? { ...s, deliverables: arrayMove(s.deliverables ?? [], delIdx, overDelIdx) }
                  : s
              ),
            }));
          }
        }
      }
    },
    [type, phase, subPhase, parentPhase, onUpdatePhase]
  );

  // Determine which children to show
  const showSubphases = type === "phase" && (phase?.subPhases?.length ?? 0) > 0;
  const showDirectActivities = type === "phase" && (phase?.subPhases?.length ?? 0) === 0;
  const showSubphaseActivities = type === "subphase";

  // FR-006a: determine which add buttons to show
  const canAddSubphase = type === "phase";
  const canAddActivity =
    (type === "phase" && (phase?.subPhases?.length ?? 0) === 0) ||
    type === "subphase";

  const levelColors = ["border-l-blue-500", "border-l-green-500", "border-l-amber-500"];
  const borderColor = levelColors[Math.min(level, levelColors.length - 1)];

  // Type icon
  const TypeIcon =
    type === "phase" ? Layers :
    type === "subphase" ? FolderOpen :
    type === "deliverable" ? Package :
    CircleDot;

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`border-l-2 ${borderColor} rounded-r-md bg-background`}
      >
        <div
          className="flex items-center gap-1 px-2 py-1.5 hover:bg-muted/50 rounded-r-md group"
          style={{ paddingLeft: `${level * 20 + 8}px` }}
        >
          {/* Drag handle */}
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab text-muted-foreground hover:text-foreground p-0.5"
          >
            <GripVertical className="h-4 w-4" />
          </button>

          {/* Expand/collapse */}
          {hasChildren || (type !== "activity" && type !== "deliverable") ? (
            <button
              onClick={() => onToggleExpand(nodeId)}
              className="p-0.5 text-muted-foreground hover:text-foreground"
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <span className="w-5" />
          )}

          {/* Type icon */}
          <TypeIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />

          {/* Name */}
          {editingName ? (
            <Input
              autoFocus
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitName();
                if (e.key === "Escape") {
                  setNameValue(nodeName);
                  setEditingName(false);
                }
              }}
              className="h-7 text-sm flex-1"
            />
          ) : (
            <span
              className="text-sm font-medium flex-1 cursor-pointer hover:underline"
              onDoubleClick={() => {
                setNameValue(nodeName);
                setEditingName(true);
              }}
            >
              {nodeName}
            </span>
          )}

          {/* Child count badges for phases and subphases */}
          {type === "phase" && subPhaseCount > 0 && (
            <span className="flex items-center gap-0.5 text-muted-foreground">
              <FolderOpen className="h-3 w-3" />
              <span className="text-xs">{subPhaseCount}</span>
            </span>
          )}
          {type === "phase" && subPhaseCount === 0 && directActivityCount > 0 && (
            <span className="flex items-center gap-0.5 text-muted-foreground">
              <CircleDot className="h-3 w-3" />
              <span className="text-xs">{directActivityCount}</span>
            </span>
          )}
          {type === "subphase" && directActivityCount > 0 && (
            <span className="flex items-center gap-0.5 text-muted-foreground">
              <CircleDot className="h-3 w-3" />
              <span className="text-xs">{directActivityCount}</span>
            </span>
          )}

          {/* Checklist badge for activities */}
          {type === "activity" && (
            <button
              onClick={() => setChecklistOpen(true)}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              <ClipboardList className="h-3.5 w-3.5" />
              {checklistCount > 0 && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                  {checklistCount}
                </Badge>
              )}
            </button>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {canAddSubphase && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-xs"
                onClick={handleAddSubphase}
                title="Adicionar Subetapa"
              >
                <FolderPlus className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-1.5 text-xs text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
              title="Excluir"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Expanded: phases/subphases show Description + Atividades + Entregáveis */}
        {expanded && (type === "phase" || type === "subphase") && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleChildDragEnd}
          >
            {/* Description */}
            <div
              style={{ paddingLeft: `${(level + 1) * 20 + 8}px` }}
              className="pt-2 pr-4"
            >
              <div className="space-y-1 mb-2">
                <label className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                  <FileText className="h-3 w-3" />
                  Descrição
                </label>
                <textarea
                  className="w-full text-sm border rounded-md p-2 bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                  rows={2}
                  placeholder="Descrição desta etapa (aparece na proposta)"
                  value={currentDescription}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                />
              </div>
            </div>

            {/* Subetapas (phases with subphases) */}
            {showSubphases && phase && (
              <>
                <SortableContext
                  items={phase.subPhases.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {phase.subPhases.map((sp) => (
                    <TreeNode
                      key={sp.id}
                      type="subphase"
                      subPhase={sp}
                      parentPhase={phase}
                      level={level + 1}
                      expanded={expandedIds.has(sp.id)}
                      expandedIds={expandedIds}
                      onToggleExpand={onToggleExpand}
                      onUpdatePhase={onUpdatePhase}
                      generateId={generateId}
                    />
                  ))}
                </SortableContext>
                {addingChild === "subphase" && (
                  <div style={{ paddingLeft: `${(level + 1) * 20 + 8}px` }} className="py-1">
                    <AddItemInline
                      placeholder="Nome da subetapa"
                      onConfirm={confirmAddSubphase}
                      onCancel={() => setAddingChild(null)}
                    />
                  </div>
                )}
              </>
            )}

            {/* Inline subphase add (when phase has no subphases yet) */}
            {!showSubphases && type === "phase" && addingChild === "subphase" && (
              <div style={{ paddingLeft: `${(level + 1) * 20 + 8}px` }} className="py-1">
                <AddItemInline
                  placeholder="Nome da subetapa"
                  onConfirm={confirmAddSubphase}
                  onCancel={() => setAddingChild(null)}
                />
              </div>
            )}

            {/* Atividades section (phases without subphases + subphases) */}
            {(showDirectActivities || showSubphaseActivities) && (
              <>
                <div
                  style={{ paddingLeft: `${(level + 1) * 20 + 8}px` }}
                  className="pr-4 pt-1"
                >
                  <div className="flex items-center justify-between mb-1">
                    <label className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                      <CircleDot className="h-3 w-3" />
                      Atividades ({showDirectActivities ? phase?.activities.length ?? 0 : subPhase?.activities.length ?? 0})
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={handleAddActivity}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                </div>
                {showDirectActivities && phase && phase.activities.length > 0 && (
                  <SortableContext
                    items={phase.activities.map((a) => a.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {phase.activities.map((act) => (
                      <TreeNode
                        key={act.id}
                        type="activity"
                        activity={act}
                        phase={phase}
                        level={level + 1}
                        expanded={expandedIds.has(act.id)}
                        expandedIds={expandedIds}
                        onToggleExpand={onToggleExpand}
                        onUpdatePhase={onUpdatePhase}
                        generateId={generateId}
                      />
                    ))}
                  </SortableContext>
                )}
                {showSubphaseActivities && subPhase && subPhase.activities.length > 0 && (
                  <SortableContext
                    items={subPhase.activities.map((a) => a.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {subPhase.activities.map((act) => (
                      <TreeNode
                        key={act.id}
                        type="activity"
                        activity={act}
                        parentPhase={parentPhase}
                        subPhase={subPhase}
                        level={level + 1}
                        expanded={expandedIds.has(act.id)}
                        expandedIds={expandedIds}
                        onToggleExpand={onToggleExpand}
                        onUpdatePhase={onUpdatePhase}
                        generateId={generateId}
                      />
                    ))}
                  </SortableContext>
                )}
                {addingChild === "activity" && (
                  <div style={{ paddingLeft: `${(level + 1) * 20 + 8}px` }} className="py-1">
                    <AddItemInline
                      placeholder="Nome da atividade"
                      onConfirm={confirmAddActivity}
                      onCancel={() => setAddingChild(null)}
                    />
                  </div>
                )}
                {(showDirectActivities ? (phase?.activities.length ?? 0) : (subPhase?.activities.length ?? 0)) === 0 && addingChild !== "activity" && (
                  <div style={{ paddingLeft: `${(level + 1) * 20 + 8}px` }} className="pr-4">
                    <p className="text-xs text-muted-foreground italic py-1">
                      Nenhuma atividade adicionada
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Entregáveis section (phases without subphases + subphases) */}
            {(showDirectActivities || showSubphaseActivities) && (
              <>
                <div
                  style={{ paddingLeft: `${(level + 1) * 20 + 8}px` }}
                  className="pr-4 pt-1"
                >
                  <div className="flex items-center justify-between mb-1">
                    <label className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                      <Package className="h-3 w-3" />
                      Entregáveis ({currentDeliverables.length})
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => setAddingDeliverable(true)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                </div>
                {currentDeliverables.length > 0 && (
                  <SortableContext items={currentDeliverables.map((d) => d.id)} strategy={verticalListSortingStrategy}>
                    {showDirectActivities && phase && currentDeliverables.map((d) => (
                      <TreeNode
                        key={d.id}
                        type="deliverable"
                        deliverable={d}
                        phase={phase}
                        level={level + 1}
                        expanded={false}
                        expandedIds={expandedIds}
                        onToggleExpand={onToggleExpand}
                        onUpdatePhase={onUpdatePhase}
                        generateId={generateId}
                      />
                    ))}
                    {showSubphaseActivities && subPhase && currentDeliverables.map((d) => (
                      <TreeNode
                        key={d.id}
                        type="deliverable"
                        deliverable={d}
                        parentPhase={parentPhase}
                        subPhase={subPhase}
                        level={level + 1}
                        expanded={false}
                        expandedIds={expandedIds}
                        onToggleExpand={onToggleExpand}
                        onUpdatePhase={onUpdatePhase}
                        generateId={generateId}
                      />
                    ))}
                  </SortableContext>
                )}
                {addingDeliverable && (
                  <div style={{ paddingLeft: `${(level + 1) * 20 + 8}px` }} className="py-1">
                    <AddItemInline
                      placeholder="Nome do entregável"
                      onConfirm={handleAddDeliverable}
                      onCancel={() => setAddingDeliverable(false)}
                    />
                  </div>
                )}
                {currentDeliverables.length === 0 && !addingDeliverable && (
                  <div style={{ paddingLeft: `${(level + 1) * 20 + 8}px` }} className="pr-4">
                    <p className="text-xs text-muted-foreground italic py-1">
                      Nenhum entregável adicionado
                    </p>
                  </div>
                )}
              </>
            )}
          </DndContext>
        )}
      </div>

      {/* Checklist Modal (FR-006c) */}
      {type === "activity" && activity && (
        <ChecklistModal
          open={checklistOpen}
          onOpenChange={setChecklistOpen}
          items={activity.checklistItems}
          onUpdate={handleChecklistUpdate}
          activityName={activity.name}
          generateId={generateId}
        />
      )}

      {/* Migrate Activities Dialog (FR-006b) */}
      {type === "phase" && phase && (
        <MigrateActivitiesDialog
          open={migrateDialogOpen}
          onOpenChange={setMigrateDialogOpen}
          activityCount={phase.activities.length}
          deliverableCount={(phase.deliverables ?? []).length}
          onConfirm={handleMigrateConfirm}
        />
      )}

      {/* Delete Subphase Dialog (FR-011b) */}
      {deleteSubphaseDialog && parentPhase && (
        <DeleteSubphaseDialog
          open={!!deleteSubphaseDialog}
          onOpenChange={(open) => !open && setDeleteSubphaseDialog(null)}
          subPhase={deleteSubphaseDialog}
          otherSubPhases={parentPhase.subPhases.filter((s) => s.id !== deleteSubphaseDialog.id)}
          onConfirm={handleDeleteSubphaseConfirm}
        />
      )}

      {/* Phase delete confirm */}
      {type === "phase" && phase && (
        <ConfirmDialog
          open={showPhaseDeleteConfirm}
          onOpenChange={setShowPhaseDeleteConfirm}
          title="Excluir etapa"
          description={`A etapa "${phase.name}" possui ${
            phase.subPhases.length +
            phase.activities.length +
            phase.subPhases.reduce((acc, s) => acc + s.activities.length, 0)
          } itens. Deseja excluir?`}
          confirmLabel="Excluir"
          variant="destructive"
          onConfirm={() => {
            onDeletePhase?.(phase.id);
            setShowPhaseDeleteConfirm(false);
          }}
        />
      )}

      {/* Auto-move activities confirm (last subphase deletion) */}
      <ConfirmDialog
        open={showAutoMoveConfirm}
        onOpenChange={setShowAutoMoveConfirm}
        title="Excluir subetapa"
        description="Ao excluir a última subetapa, as atividades serão movidas para a etapa. Continuar?"
        confirmLabel="Continuar"
        variant="destructive"
        onConfirm={() => {
          if (parentPhase && subPhase && onUpdatePhase) {
            onUpdatePhase(parentPhase.id, (p) => ({
              ...p,
              subPhases: [],
              activities: subPhase.activities.map((a, i) => ({ ...a, orderIndex: i })),
            }));
          }
          setShowAutoMoveConfirm(false);
        }}
      />
    </>
  );
}
