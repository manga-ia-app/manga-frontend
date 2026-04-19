"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { AxiosError } from "axios";

import { Button } from "@/components/ui/button";
import { RaioXPanel } from "./RaioXPanel";
import { CostCategoryCard, type CategoryLocal } from "./CostCategoryCard";
import { AddCategoryModal } from "./AddCategoryModal";
import { HealthBandConfig, type HealthBandLocal } from "./HealthBandConfig";
import { OrphanGroupsAlert } from "./OrphanGroupsAlert";
import {
  getOverheadConfiguration,
  saveOverheadConfiguration,
} from "@/lib/api/overhead";
import type {
  OfficeSummaryDto,
  SaveOverheadConfigurationDto,
  OrphanGroupDto,
} from "@/lib/types/overhead";
import type { CostItemLocal } from "./CostItemRow";

function recalculateSummary(
  categories: CategoryLocal[],
  healthBands: HealthBandLocal[],
  totalHorasFaturaveis: number
): OfficeSummaryDto {
  const pessoalCat = categories.find((c) => c.isPersonnel);
  const pessoalItems = pessoalCat
    ? pessoalCat.items.reduce(
        (sum, i) => sum + (i.frequencyMonths > 0 ? i.value / i.frequencyMonths : 0),
        0
      )
    : 0;
  const pessoalSynced = pessoalCat
    ? pessoalCat.syncedCollaborators.reduce((sum, c) => sum + c.custoTotalMensal, 0)
    : 0;
  const pessoalTotal = Math.round((pessoalItems + pessoalSynced) * 100) / 100;

  const outrasCategoriasTotal = Math.round(
    categories
      .filter((c) => !c.isPersonnel)
      .reduce((sum, cat) => {
        const itemsTotal = cat.items.reduce(
          (s, i) => s + (i.frequencyMonths > 0 ? i.value / i.frequencyMonths : 0),
          0
        );
        const syncedTotal = cat.syncedCollaborators.reduce(
          (s, c) => s + c.custoTotalMensal,
          0
        );
        return sum + itemsTotal + syncedTotal;
      }, 0) * 100
  ) / 100;

  const totalGeral = Math.round((pessoalTotal + outrasCategoriasTotal) * 100) / 100;
  const custoHoraBase = totalHorasFaturaveis > 0
    ? Math.round((pessoalTotal / totalHorasFaturaveis) * 100) / 100
    : null;
  const overheadPercent = pessoalTotal > 0
    ? Math.round((outrasCategoriasTotal / pessoalTotal) * 100 * 100) / 100
    : null;
  const custoHoraReal = totalHorasFaturaveis > 0
    ? Math.round((totalGeral / totalHorasFaturaveis) * 100) / 100
    : null;
  const overheadValue = custoHoraBase != null && custoHoraReal != null
    ? Math.round((custoHoraReal - custoHoraBase) * 100) / 100
    : null;

  let overheadHealthLabel = "N/A";
  let overheadHealthColor = "gray";

  if (overheadPercent != null) {
    const sortedBands = [...healthBands].sort((a, b) => a.displayOrder - b.displayOrder);
    const matchingBand = sortedBands.find(
      (h) => overheadPercent >= h.lowerBound && overheadPercent < h.upperBound
    );
    if (matchingBand) {
      overheadHealthLabel = matchingBand.label;
      overheadHealthColor = matchingBand.color;
    }
  }

  return {
    totalHorasFaturaveis,
    pessoalTotal,
    outrasCategoriasTotal,
    totalGeral,
    custoHoraBase,
    overheadPercent,
    overheadValue,
    custoHoraReal,
    overheadHealthLabel,
    overheadHealthColor,
  };
}

export function OverheadPageClient() {
  const queryClient = useQueryClient();
  const [categories, setCategories] = useState<CategoryLocal[]>([]);
  const [healthBands, setHealthBands] = useState<HealthBandLocal[]>([]);
  const [orphanGroups, setOrphanGroups] = useState<OrphanGroupDto[]>([]);
  const [totalHoras, setTotalHoras] = useState(0);
  const [initialized, setInitialized] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["overhead-configuration"],
    queryFn: getOverheadConfiguration,
  });

  useEffect(() => {
    if (data && !initialized) {
      setCategories(
        data.categories.map((c) => ({
          id: c.id,
          name: c.name,
          isBase: c.isBase,
          isPersonnel: c.isPersonnel,
          displayOrder: c.displayOrder,
          groups: c.groups,
          items: c.items.map((i) => ({
            name: i.name,
            value: i.value,
            frequencyMonths: i.frequencyMonths,
          })),
          syncedCollaborators: c.syncedCollaborators,
        }))
      );
      setHealthBands(
        data.healthBands.map((h) => ({
          lowerBound: h.lowerBound,
          upperBound: h.upperBound,
          label: h.label,
          color: h.color,
          displayOrder: h.displayOrder,
        }))
      );
      setOrphanGroups(data.orphanGroups ?? []);
      setTotalHoras(data.summary.totalHorasFaturaveis);
      setInitialized(true);
    }
  }, [data, initialized]);

  const saveMutation = useMutation({
    mutationFn: saveOverheadConfiguration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["overhead-configuration"] });
      queryClient.invalidateQueries({ queryKey: ["grupos-colaboradores"] });
      setInitialized(false);
      toast.success("Configuração de overhead salva com sucesso!");
    },
    onError: (error: unknown) => {
      const msg =
        error instanceof AxiosError
          ? (error.response?.data?.message ?? "Erro ao salvar configuração.")
          : "Erro ao salvar configuração.";
      toast.error(msg);
    },
  });

  const handleCategoryChange = useCallback(
    (index: number, updated: CategoryLocal) => {
      setCategories((prev) => {
        const next = [...prev];
        next[index] = updated;
        return next;
      });
    },
    []
  );

  const handleCategoryDelete = useCallback((index: number) => {
    setCategories((prev) => {
      const deleted = prev[index];
      if (deleted.groups.length > 0) {
        setOrphanGroups((orphans) => [
          ...orphans,
          ...deleted.groups.map((g) => ({
            id: g.id,
            name: g.name,
            colaboradoresCount: g.colaboradoresCount,
          })),
        ]);
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleAddCategory = useCallback(
    (name: string, isPersonnel: boolean) => {
      const maxOrder = categories.reduce(
        (max, c) => Math.max(max, c.displayOrder),
        0
      );
      setCategories((prev) => [
        ...prev,
        {
          id: null,
          name,
          isBase: false,
          isPersonnel,
          displayOrder: maxOrder + 1,
          groups: [],
          items: [],
          syncedCollaborators: [],
        },
      ]);
    },
    [categories]
  );

  const handleAddGroupToCategory = useCallback(
    (categoryIndex: number, grupoId: string) => {
      const orphan = orphanGroups.find((g) => g.id === grupoId);
      if (!orphan) return;

      setCategories((prev) => {
        const next = [...prev];
        const cat = { ...next[categoryIndex] };
        cat.groups = [
          ...cat.groups,
          { id: orphan.id, name: orphan.name, colaboradoresCount: orphan.colaboradoresCount },
        ];
        next[categoryIndex] = cat;
        return next;
      });
      setOrphanGroups((prev) => prev.filter((g) => g.id !== grupoId));
    },
    [orphanGroups]
  );

  const handleRemoveGroupFromCategory = useCallback(
    (categoryIndex: number, grupoId: string) => {
      setCategories((prev) => {
        const next = [...prev];
        const cat = { ...next[categoryIndex] };
        const removed = cat.groups.find((g) => g.id === grupoId);
        cat.groups = cat.groups.filter((g) => g.id !== grupoId);
        next[categoryIndex] = cat;
        if (removed) {
          setOrphanGroups((orphans) =>
            orphans.some((o) => o.id === removed.id)
              ? orphans
              : [
                  ...orphans,
                  { id: removed.id, name: removed.name, colaboradoresCount: removed.colaboradoresCount },
                ]
          );
        }
        return next;
      });
    },
    []
  );

  const handleSave = () => {
    const dto: SaveOverheadConfigurationDto = {
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        isPersonnel: c.isPersonnel,
        displayOrder: c.displayOrder,
        grupoIds: c.groups.map((g) => g.id),
        items: c.items
          .filter((i) => i.name.trim())
          .map((i) => ({
            name: i.name.trim(),
            value: i.value,
            frequencyMonths: i.frequencyMonths,
          })),
      })),
      healthBands: healthBands.map((h) => ({
        lowerBound: h.lowerBound,
        upperBound: h.upperBound,
        label: h.label,
        color: h.color,
        displayOrder: h.displayOrder,
      })),
    };
    saveMutation.mutate(dto);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando configuração de overhead...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Erro ao carregar configuração. Tente novamente.</p>
      </div>
    );
  }

  const summary = recalculateSummary(categories, healthBands, totalHoras);

  const orphanGruposForSelect = orphanGroups.map((g) => ({
    id: g.id,
    name: g.name,
    isReserved: false,
    isPersonnel: false,
    costCategoryId: null,
    costCategoryName: null,
    status: "Órfão",
    cargosCount: 0,
    colaboradoresCount: g.colaboradoresCount,
  }));

  return (
    <div className="space-y-6">
      {/* Raio-X Panel */}
      <RaioXPanel summary={summary} />

      {/* Orphan Groups Alert */}
      {orphanGroups.length > 0 && (
        <OrphanGroupsAlert orphanGroups={orphanGroups} />
      )}

      {/* Cost Categories */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Categorias de Custo</h2>
          <AddCategoryModal onAdd={handleAddCategory} />
        </div>

        {/* Custos de Pessoal */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-muted-foreground border-b pb-2">
            Custos de Pessoal
          </h3>
          {categories.filter((c) => c.isPersonnel).length === 0 ? (
            <p className="text-sm text-muted-foreground italic pl-1">
              Nenhuma categoria de pessoal configurada.
            </p>
          ) : (
            categories.map((cat, i) =>
              cat.isPersonnel ? (
                <CostCategoryCard
                  key={cat.id ?? `new-${i}`}
                  category={cat}
                  onChange={(updated) => handleCategoryChange(i, updated)}
                  onDelete={cat.isBase ? undefined : () => handleCategoryDelete(i)}
                  orphanGrupos={orphanGruposForSelect}
                  onAddGroup={(grupoId) => handleAddGroupToCategory(i, grupoId)}
                  onRemoveGroup={(grupoId) => handleRemoveGroupFromCategory(i, grupoId)}
                />
              ) : null
            )
          )}
        </div>

        {/* Custos Operacionais */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-muted-foreground border-b pb-2">
            Custos Operacionais
          </h3>
          {categories.filter((c) => !c.isPersonnel).length === 0 ? (
            <p className="text-sm text-muted-foreground italic pl-1">
              Nenhuma categoria operacional configurada.
            </p>
          ) : (
            categories.map((cat, i) =>
              !cat.isPersonnel ? (
                <CostCategoryCard
                  key={cat.id ?? `new-${i}`}
                  category={cat}
                  onChange={(updated) => handleCategoryChange(i, updated)}
                  onDelete={cat.isBase ? undefined : () => handleCategoryDelete(i)}
                  orphanGrupos={orphanGruposForSelect}
                  onAddGroup={(grupoId) => handleAddGroupToCategory(i, grupoId)}
                  onRemoveGroup={(grupoId) => handleRemoveGroupFromCategory(i, grupoId)}
                />
              ) : null
            )
          )}
        </div>
      </div>

      {/* Health Bands */}
      <HealthBandConfig bands={healthBands} onChange={setHealthBands} />

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          size="lg"
        >
          <Save className="mr-2 h-4 w-4" />
          {saveMutation.isPending ? "Salvando..." : "Salvar Configuração"}
        </Button>
      </div>
    </div>
  );
}
