"use client";

import { useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ChevronRight, ChevronDown } from "lucide-react";
import type { Cargo } from "@/lib/types/cargos";
import type { EstimateActivity } from "@/lib/types/estimativas";

export interface AllocationEdit {
  id?: string;
  cargoId?: string;
  estimatedHours: number;
}

interface ActivityRowProps {
  activity: EstimateActivity;
  cargos: Cargo[];
  allocations: AllocationEdit[];
  onChange: (updates: {
    cargoId?: string;
    estimatedHours: number;
    isActive: boolean;
    allocations?: AllocationEdit[];
  }) => void;
  editableName?: boolean;
  onNameChange?: (name: string) => void;
  onRemove?: () => void;
  showTemplateTag?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
}

const numStr = (v: number) => (v ? String(v) : "");

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function ActivityRow({ activity, cargos, allocations, onChange, editableName, onNameChange, onRemove, showTemplateTag, expanded = true, onToggle }: ActivityRowProps) {
  const [isEditingName, setIsEditingName] = useState(editableName ?? false);
  const [editNameValue, setEditNameValue] = useState(activity.name);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const originalNameRef = useRef(activity.name);
  const hasAllocations = allocations.length > 0;

  // Compute totals from allocations
  const computedTotals = hasAllocations
    ? allocations.reduce(
        (acc, alloc) => {
          const cargo = cargos.find((c) => c.id === alloc.cargoId);
          const cost = (cargo?.valorHora ?? 0) * alloc.estimatedHours;
          return {
            totalCost: acc.totalCost + cost,
            totalHours: acc.totalHours + alloc.estimatedHours,
          };
        },
        { totalCost: 0, totalHours: 0 }
      )
    : null;

  const displayTotalCost = computedTotals?.totalCost ?? 0;
  const displayTotalHours = computedTotals?.totalHours ?? 0;

  const handleToggleActive = () => {
    onChange({
      cargoId: activity.cargoId,
      estimatedHours: activity.estimatedHours,
      isActive: !activity.isActive,
      allocations: hasAllocations ? allocations : undefined,
    });
  };

  // Allocation handlers
  const handleAddAllocation = () => {
    const newAllocs: AllocationEdit[] = hasAllocations
      ? [...allocations, { estimatedHours: 0 }]
      : activity.cargoId
        ? [
            { cargoId: activity.cargoId, estimatedHours: activity.estimatedHours },
            { estimatedHours: 0 },
          ]
        : [{ estimatedHours: 0 }];
    onChange({
      cargoId: activity.cargoId,
      estimatedHours: activity.estimatedHours,
      isActive: activity.isActive,
      allocations: newAllocs,
    });
  };

  const handleUpdateAllocation = (index: number, updates: Partial<AllocationEdit>) => {
    const newAllocs = allocations.map((a, i) =>
      i === index ? { ...a, ...updates } : a
    );
    onChange({
      cargoId: activity.cargoId,
      estimatedHours: activity.estimatedHours,
      isActive: activity.isActive,
      allocations: newAllocs,
    });
  };

  const handleRemoveAllocation = (index: number) => {
    const newAllocs = allocations.filter((_, i) => i !== index);
    onChange({
      cargoId: newAllocs[0]?.cargoId,
      estimatedHours: newAllocs.reduce((s, a) => s + a.estimatedHours, 0),
      isActive: activity.isActive,
      allocations: newAllocs.length > 0 ? newAllocs : undefined,
    });
  };

  const summaryRow = (
    <div className="grid grid-cols-[auto_1fr_5rem_10rem_7rem_auto] items-center gap-2 py-2 px-3">
      {/* Checkbox */}
      <Checkbox
        checked={activity.isActive}
        onCheckedChange={() => handleToggleActive()}
        onClick={(e) => e.stopPropagation()}
        title={activity.isActive ? "Desativar atividade" : "Ativar atividade"}
        className="shrink-0"
      />
      {/* Name */}
      <div className="min-w-0">
        {isEditingName && onNameChange ? (
          <Input
            ref={nameInputRef}
            className={`h-7 text-sm${!editNameValue.trim() ? " border-destructive" : ""}`}
            placeholder="Nome da atividade..."
            value={editNameValue}
            onChange={(e) => {
              setEditNameValue(e.target.value);
              onNameChange(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (editNameValue.trim()) setIsEditingName(false);
              }
              if (e.key === "Escape") {
                setEditNameValue(originalNameRef.current);
                onNameChange(originalNameRef.current);
                setIsEditingName(false);
              }
            }}
            onBlur={() => {
              if (!editNameValue.trim()) {
                setEditNameValue(originalNameRef.current);
                onNameChange(originalNameRef.current);
              }
              setIsEditingName(false);
            }}
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
        ) : (
          <span
            className={`text-sm truncate block ${onNameChange ? "cursor-pointer hover:underline" : ""}`}
            title={activity.name}
            onClick={(e) => {
              if (onNameChange) {
                e.stopPropagation();
                originalNameRef.current = activity.name;
                setEditNameValue(activity.name);
                setIsEditingName(true);
              }
            }}
          >
            {activity.name}
            {showTemplateTag && !activity.isCustom && (
              <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0">Template</Badge>
            )}
          </span>
        )}
      </div>
      {/* Hours */}
      <span className="text-xs text-muted-foreground tabular-nums text-right">
        {!expanded && displayTotalHours > 0 ? `${displayTotalHours.toFixed(1)}h` : ""}
      </span>
      {/* Cargo placeholder (header-level) */}
      <span />
      {/* Total cost */}
      <span className="text-sm font-medium tabular-nums text-right">
        {!expanded && displayTotalCost > 0
          ? `R$ ${formatCurrency(displayTotalCost)}`
          : !expanded ? "—" : ""}
      </span>
      {/* Actions */}
      <div className="flex items-center gap-1">
        {onRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            title="Remover atividade"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
        {onToggle && (
          <span className="text-muted-foreground">
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </span>
        )}
      </div>
    </div>
  );

  const detailContent = (
    <div>
      {activity.isActive && (
        <div className="pb-2 space-y-0.5">
          {/* Allocation rows — table-like grid */}
          {allocations.map((alloc, index) => {
            const cargo = cargos.find((c) => c.id === alloc.cargoId);
            const allocCost = (cargo?.valorHora ?? 0) * alloc.estimatedHours;

            return (
              <div
                key={alloc.id ?? `new-${index}`}
                className="grid grid-cols-[auto_1fr_5rem_10rem_7rem_auto] items-center gap-2 py-1 px-3 hover:bg-muted/30 rounded-sm"
              >
                {/* Checkbox placeholder */}
                <span className="w-4" />
                {/* Cargo select + rate */}
                <div className="flex items-center gap-2 min-w-0">
                  <Select value={alloc.cargoId || undefined} onValueChange={(val) => handleUpdateAllocation(index, { cargoId: val || undefined })}>
                    <SelectTrigger className="h-7 w-44 text-xs truncate">
                      <SelectValue placeholder="Selecionar cargo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {cargos.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {cargo && (
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      R$ {formatCurrency(cargo.valorHora)}/h
                    </span>
                  )}
                </div>
                {/* Hours input */}
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  value={numStr(alloc.estimatedHours)}
                  onChange={(e) =>
                    handleUpdateAllocation(index, {
                      estimatedHours: parseFloat(e.target.value) || 0,
                    })
                  }
                  disabled={!alloc.cargoId}
                  placeholder="Horas"
                  className="h-7 text-right text-xs"
                />
                {/* Spacer for cargo column */}
                <span />
                {/* Allocation cost */}
                <span className="text-xs tabular-nums text-right text-muted-foreground">
                  {alloc.cargoId && alloc.estimatedHours > 0
                    ? `R$ ${formatCurrency(allocCost)}`
                    : "—"}
                </span>
                {/* Remove allocation */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive"
                    onClick={() => handleRemoveAllocation(index)}
                    title="Remover cargo"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}

          {/* Add cargo button + totals */}
          <div className="grid grid-cols-[auto_1fr_5rem_10rem_7rem_auto] items-center gap-2 py-1 px-3 border-t border-dashed">
            <span className="w-4" />
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-muted-foreground justify-start px-0"
              onClick={handleAddAllocation}
              title="Adicionar cargo/hora"
            >
              <Plus className="h-3 w-3 mr-1" /> Adicionar cargo
            </Button>
            <span className="text-xs font-medium text-muted-foreground tabular-nums text-right">
              {hasAllocations && computedTotals && computedTotals.totalHours > 0
                ? `${computedTotals.totalHours.toFixed(1)}h`
                : ""}
            </span>
            <span />
            <span className="text-xs font-medium tabular-nums text-right">
              {hasAllocations && computedTotals && computedTotals.totalCost > 0
                ? `R$ ${formatCurrency(computedTotals.totalCost)}`
                : ""}
            </span>
            <span className="w-7" />
          </div>
        </div>
      )}
    </div>
  );

  if (onToggle) {
    return (
      <Collapsible open={expanded} onOpenChange={onToggle}>
        <div
          className={`rounded-md border ${
            activity.isActive ? "bg-card" : "bg-muted/50 opacity-60"
          }`}
        >
          <CollapsibleTrigger asChild>
            <div className="cursor-pointer">{summaryRow}</div>
          </CollapsibleTrigger>
          <CollapsibleContent>{detailContent}</CollapsibleContent>
        </div>
      </Collapsible>
    );
  }

  return (
    <div
      className={`rounded-md border ${
        activity.isActive ? "bg-card" : "bg-muted/50 opacity-60"
      }`}
    >
      {summaryRow}
      {detailContent}
    </div>
  );
}
