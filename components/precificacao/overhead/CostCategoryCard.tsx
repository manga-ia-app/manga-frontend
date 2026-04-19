"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SyncedCollaboratorRow } from "./SyncedCollaboratorRow";
import { CostItemRow, type CostItemLocal } from "./CostItemRow";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import type { SyncedCollaboratorDto, GroupInCategoryDto, GrupoColaboradorDto } from "@/lib/types/overhead";

const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export interface CategoryLocal {
  id: string | null;
  name: string;
  isBase: boolean;
  isPersonnel: boolean;
  displayOrder: number;
  groups: GroupInCategoryDto[];
  items: CostItemLocal[];
  syncedCollaborators: SyncedCollaboratorDto[];
}

interface Props {
  category: CategoryLocal;
  onChange: (updated: CategoryLocal) => void;
  onDelete?: () => void;
  readOnly?: boolean;
  orphanGrupos?: GrupoColaboradorDto[];
  onAddGroup?: (grupoId: string) => void;
  onRemoveGroup?: (grupoId: string) => void;
}

export function CostCategoryCard({ category, onChange, onDelete, readOnly, orphanGrupos, onAddGroup, onRemoveGroup }: Props) {
  const [isOpen, setIsOpen] = useState(true);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(category.name);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const itemsSubtotal = category.items.reduce((sum, i) => {
    const monthly = i.frequencyMonths > 0 ? i.value / i.frequencyMonths : 0;
    return sum + monthly;
  }, 0);
  const syncedSubtotal = category.syncedCollaborators.reduce(
    (sum, c) => sum + c.custoTotalMensal,
    0
  );
  const subtotal = Math.round((itemsSubtotal + syncedSubtotal) * 100) / 100;

  const handleItemChange = (index: number, updated: CostItemLocal) => {
    const newItems = [...category.items];
    newItems[index] = updated;
    onChange({ ...category, items: newItems });
  };

  const handleItemDelete = (index: number) => {
    const newItems = category.items.filter((_, i) => i !== index);
    onChange({ ...category, items: newItems });
  };

  const handleAddItem = () => {
    onChange({
      ...category,
      items: [...category.items, { name: "", value: 0, frequencyMonths: 1 }],
    });
  };

  const handleRename = () => {
    if (renameValue.trim()) {
      onChange({ ...category, name: renameValue.trim() });
      setIsRenaming(false);
    }
  };

  return (
    <Card>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="flex items-center gap-2 text-left flex-1"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
          >
            {isOpen ? (
              <ChevronDown className="h-4 w-4 shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0" />
            )}
            {isRenaming ? (
              <Input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename();
                  if (e.key === "Escape") setIsRenaming(false);
                }}
                onClick={(e) => e.stopPropagation()}
                className="h-7 text-sm w-48"
              />
            ) : (
              <span className="font-semibold text-sm">{category.name}</span>
            )}
            {category.isPersonnel && (
              <Badge variant="secondary" className="text-xs">Pessoal</Badge>
            )}
            {category.groups.length > 0 && (
              <span className="text-xs text-muted-foreground">
                ({category.groups.map(g => g.name).join(", ")})
              </span>
            )}
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tabular-nums">
              {brl(subtotal)}/mês
            </span>
            {!readOnly && !category.isBase && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => {
                    setRenameValue(category.name);
                    setIsRenaming(true);
                  }}
                  aria-label={`Renomear categoria ${category.name}`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                {onDelete && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setShowDeleteConfirm(true)}
                    aria-label={`Excluir categoria ${category.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {isOpen && (
        <CardContent className="pt-0 space-y-3">
          {/* Associated groups */}
          {!readOnly && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Grupos associados
              </p>
              {category.groups.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Nenhum grupo associado.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {category.groups.map((g) => (
                    <Badge key={g.id} variant="outline" className="gap-1 pr-1">
                      {g.name}
                      <span className="text-muted-foreground text-xs">({g.colaboradoresCount})</span>
                      {onRemoveGroup && (
                        <button
                          type="button"
                          className="ml-1 hover:text-destructive"
                          onClick={() => onRemoveGroup(g.id)}
                          aria-label={`Remover grupo ${g.name}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
              )}
              {onAddGroup && orphanGrupos && orphanGrupos.length > 0 && (
                <Select
                  value={undefined}
                  onValueChange={(val) => onAddGroup(val)}
                >
                  <SelectTrigger className="mt-1 h-8 rounded-md border border-input bg-background px-2 py-1 text-xs">
                    <SelectValue placeholder="+ Adicionar grupo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {orphanGrupos.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name} ({g.isPersonnel ? "Pessoal" : "Operações"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Synced collaborators */}
          {category.syncedCollaborators.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Colaboradores sincronizados
              </p>
              {category.syncedCollaborators.map((c) => (
                <SyncedCollaboratorRow key={c.id} collaborator={c} />
              ))}
            </div>
          )}

          {/* Cost items */}
          {category.items.length > 0 && (
            <div className="space-y-2">
              {!readOnly && (
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Itens de custo
                </p>
              )}
              {category.items.map((item, i) => (
                <CostItemRow
                  key={i}
                  item={item}
                  index={i}
                  categoryName={category.name}
                  onChange={(updated) => handleItemChange(i, updated)}
                  onDelete={() => handleItemDelete(i)}
                  readOnly={readOnly}
                />
              ))}
            </div>
          )}

          {/* Add item button */}
          {!readOnly && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={handleAddItem}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Adicionar Item
            </Button>
          )}

          {/* Empty state */}
          {category.items.length === 0 && category.syncedCollaborators.length === 0 && (
            <p className="text-sm text-muted-foreground italic">
              Nenhum item ou colaborador nesta categoria.
            </p>
          )}
        </CardContent>
      )}
      {onDelete && (
        <ConfirmDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          title="Excluir categoria"
          description={`Excluir categoria "${category.name}" e todos os seus itens?`}
          confirmLabel="Excluir"
          variant="destructive"
          onConfirm={() => onDelete()}
        />
      )}
    </Card>
  );
}
