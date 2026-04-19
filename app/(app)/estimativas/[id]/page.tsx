"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  Save,
  RefreshCw,
  Plus,
  Undo2,
  AlertTriangle,
  ChevronsUpDown,
  Info,
  Trash2,
  GripVertical,
} from "lucide-react";
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
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { PageHeader } from "@/components/shared/page-header";
import { HelpButton } from "@/components/shared/help-button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  ActivityRow,
  type AllocationEdit,
} from "@/components/estimativas/activity-row";
import { AdditionalCosts } from "@/components/estimativas/additional-costs";
import { PricingSummary } from "@/components/estimativas/pricing-summary";
import {
  getEstimateById,
  updateEstimate,
  recalculateOverhead,
  syncCargos,
} from "@/lib/api/estimativas";
import { getCargos } from "@/lib/api/cargos";
import type { Cargo } from "@/lib/types/cargos";
import type {
  Estimate,
  EstimatePhase,
  EstimateSubPhase,
  EstimateActivity,
  AdditionalCost,
  CommercialAdjustment,
  UpdateEstimatePayload,
} from "@/lib/types/estimativas";

const numStr = (v: number) => (v ? String(v) : "");

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const complexityHelp = {
  title: "Fatores de Complexidade",
  sections: [
    {
      heading: "O que é",
      content:
        "A complexidade é um percentual aplicado sobre o custo direto de cada etapa para compensar fatores que aumentam o esforço necessário.",
    },
    {
      heading: "Modificações em projeto existente",
      content:
        "Retrofit, reforma ou intervenção em edificação já construída demandam levantamentos, compatibilizações e adaptações ao existente.",
    },
    {
      heading: "Intervenções do cliente",
      content:
        "Alterações frequentes solicitadas pelo cliente durante o andamento do projeto geram retrabalho e revisões adicionais.",
    },
    {
      heading: "Restrições legais e urbanísticas",
      content:
        "Recuos, gabarito, uso do solo e demais regulamentações que limitam soluções de projeto e exigem estudos complementares.",
    },
    {
      heading: "Patrimônio histórico",
      content:
        "Integração com edificações tombadas ou áreas protegidas que exigem autorizações especiais e cuidados de preservação.",
    },
    {
      heading: "Topografia desfavorável",
      content:
        "Terrenos com declividade acentuada ou condições geotécnicas complexas que demandam soluções estruturais especiais.",
    },
    {
      heading: "Sistemas técnicos especializados",
      content:
        "Estruturas especiais, automação predial, instalações de alta complexidade técnica que exigem coordenação detalhada.",
    },
    {
      heading: "Múltiplos fornecedores",
      content:
        "Coordenação simultânea com diversos consultores e projetistas complementares aumenta o esforço de gestão e compatibilização.",
    },
    {
      heading: "Prazos comprimidos",
      content:
        "Cronogramas apertados que exigem paralelização de etapas e maior esforço de gestão e controle de qualidade.",
    },
  ],
};

interface PendingCustomActivity {
  tempId: string;
  phaseId?: string;
  subPhaseId?: string;
  name: string;
  cargoId?: string;
  estimatedHours: number;
  isActive?: boolean;
  allocations?: { id?: string; cargoId?: string; estimatedHours: number }[];
}

export default function EstimativaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const { data: estimate, isLoading } = useQuery({
    queryKey: ["estimate", id],
    queryFn: () => getEstimateById(id),
  });

  const { data: cargos = [] } = useQuery({
    queryKey: ["cargos"],
    queryFn: () => getCargos(),
  });

  // Original state snapshot for simulation mode
  const [originalSnapshot, setOriginalSnapshot] = useState<{
    finalValue: number;
    totalHours: number;
  } | null>(null);

  useEffect(() => {
    if (estimate && originalSnapshot === null) {
      setOriginalSnapshot({
        finalValue: estimate.finalValue,
        totalHours: estimate.totalHours,
      });
    }
  }, [estimate, originalSnapshot]);

  // Local state for activity edits
  const [activityEdits, setActivityEdits] = useState<
    Map<
      string,
      {
        cargoId?: string;
        estimatedHours: number;
        isActive: boolean;
        allocations?: AllocationEdit[];
      }
    >
  >(new Map());

  // Local state for activity name edits
  const [activityNameEdits, setActivityNameEdits] = useState<Map<string, string>>(new Map());

  // Local state for margin and overhead
  const [localMarginPercent, setLocalMarginPercent] = useState<number | null>(
    null
  );
  const [marginModified, setMarginModified] = useState(false);
  const [localOverheadPercent, setLocalOverheadPercent] = useState<
    number | null
  >(null);
  const [overheadModified, setOverheadModified] = useState(false);
  const [localAreaM2, setLocalAreaM2] = useState<number | null>(null);
  const [areaModified, setAreaModified] = useState(false);

  // Per-phase complexity and monthly billing
  const [phaseComplexityMap, setPhaseComplexityMap] = useState<
    Map<string, number>
  >(new Map());
  const [phaseMonthlyMap, setPhaseMonthlyMap] = useState<
    Map<string, boolean>
  >(new Map());
  const [phaseFieldsModified, setPhaseFieldsModified] = useState(false);

  useEffect(() => {
    if (estimate && localMarginPercent === null) {
      setLocalMarginPercent(estimate.marginPercent);
    }
  }, [estimate, localMarginPercent]);

  useEffect(() => {
    if (estimate && localOverheadPercent === null) {
      setLocalOverheadPercent(estimate.overheadPercent);
    }
  }, [estimate, localOverheadPercent]);

  useEffect(() => {
    if (estimate && localAreaM2 === null) {
      setLocalAreaM2(estimate.areaM2 ?? 0);
    }
  }, [estimate, localAreaM2]);

  // Local state for per-phase additional costs
  const [phaseCostsMap, setPhaseCostsMap] = useState<
    Map<string, AdditionalCost[]>
  >(new Map());
  const [costsModified, setCostsModified] = useState(false);

  // Phase delete confirmation
  const [phaseToDelete, setPhaseToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (estimate && phaseCostsMap.size === 0) {
      const map = new Map<string, AdditionalCost[]>();
      for (const phase of estimate.phases) {
        const phaseCosts = estimate.additionalCosts.filter(
          (c) => c.phaseId === phase.id
        );
        const fromPhase = phase.additionalCosts ?? [];
        const merged = fromPhase.length > 0 ? fromPhase : phaseCosts;
        map.set(phase.id, merged);
      }
      setPhaseCostsMap(map);
    }
  }, [estimate, phaseCostsMap.size]);

  const handlePhaseCostsChange = useCallback(
    (phaseId: string, costs: AdditionalCost[]) => {
      setPhaseCostsMap((prev) => {
        const next = new Map(prev);
        next.set(phaseId, costs);
        return next;
      });
      setCostsModified(true);
    },
    []
  );

  // General costs (estimate-level, no phaseId)
  const [generalCosts, setGeneralCosts] = useState<AdditionalCost[]>([]);
  const [generalCostsInitialized, setGeneralCostsInitialized] = useState(false);

  useEffect(() => {
    if (estimate && !generalCostsInitialized) {
      const estimateLevelCosts = estimate.additionalCosts.filter(
        (c) => !c.phaseId
      );
      setGeneralCosts(estimateLevelCosts);
      setGeneralCostsInitialized(true);
    }
  }, [estimate, generalCostsInitialized]);

  const handleGeneralCostsChange = useCallback((costs: AdditionalCost[]) => {
    setGeneralCosts(costs);
    setCostsModified(true);
  }, []);

  // Tax percent
  const [localTaxPercent, setLocalTaxPercent] = useState<number | null>(null);
  const [taxModified, setTaxModified] = useState(false);

  useEffect(() => {
    if (estimate && localTaxPercent === null) {
      setLocalTaxPercent(estimate.taxPercent);
    }
  }, [estimate, localTaxPercent]);

  // Custom activities
  const [pendingCustomActivities, setPendingCustomActivities] = useState<
    PendingCustomActivity[]
  >([]);

  const addCustomActivity = useCallback(
    (phaseId: string, subPhaseId?: string) => {
      const newAct: PendingCustomActivity = {
        tempId: crypto.randomUUID(),
        phaseId,
        subPhaseId,
        name: "",
        estimatedHours: 0,
      };
      setPendingCustomActivities((prev) => [...prev, newAct]);
    },
    []
  );

  const updateCustomActivity = useCallback(
    (tempId: string, updates: Partial<PendingCustomActivity>) => {
      setPendingCustomActivities((prev) =>
        prev.map((a) => (a.tempId === tempId ? { ...a, ...updates } : a))
      );
    },
    []
  );

  const removeCustomActivity = useCallback((tempId: string) => {
    setPendingCustomActivities((prev) =>
      prev.filter((a) => a.tempId !== tempId)
    );
  }, []);

  // Expand/collapse phases
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());

  const togglePhase = useCallback((phaseId: string) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) next.delete(phaseId);
      else next.add(phaseId);
      return next;
    });
  }, []);

  // Activity expand/collapse state (expanded by default)
  const [collapsedActivities, setCollapsedActivities] = useState<Set<string>>(new Set());

  const toggleActivity = useCallback((activityId: string) => {
    setCollapsedActivities((prev) => {
      const next = new Set(prev);
      if (next.has(activityId)) next.delete(activityId);
      else next.add(activityId);
      return next;
    });
  }, []);

  // Phase CRUD state
  const [newLocalPhases, setNewLocalPhases] = useState<
    { tempId: string; name: string; orderIndex: number }[]
  >([]);
  const [deletedPhaseIds, setDeletedPhaseIds] = useState<Set<string>>(new Set());
  const [phaseNameEdits, setPhaseNameEdits] = useState<Map<string, string>>(new Map());
  const [phaseOrder, setPhaseOrder] = useState<string[] | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handlePhaseDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !estimate) return;

      const currentIds = phaseOrder ?? estimate.phases
        .filter((p) => !deletedPhaseIds.has(p.id))
        .map((p) => p.id);

      const oldIndex = currentIds.indexOf(String(active.id));
      const newIndex = currentIds.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) return;

      setPhaseOrder(arrayMove(currentIds, oldIndex, newIndex));
    },
    [estimate, phaseOrder, deletedPhaseIds]
  );

  const allExpanded = estimate
    ? expandedPhases.size === (estimate.phases.length + newLocalPhases.length) &&
    (estimate.phases.length + newLocalPhases.length) > 0
    : false;

  const toggleAllPhases = useCallback(() => {
    if (!estimate) return;
    if (allExpanded) {
      setExpandedPhases(new Set());
    } else {
      const ids = [
        ...estimate.phases.map((p) => p.id),
        ...newLocalPhases.map((p) => p.tempId),
      ];
      setExpandedPhases(new Set(ids));
    }
  }, [allExpanded, estimate, newLocalPhases]);

  const handleAddPhase = useCallback(() => {
    if (!estimate) return;
    const orderIndex = estimate.phases.length + newLocalPhases.length;
    const tempId = crypto.randomUUID();
    setNewLocalPhases((prev) => [
      ...prev,
      { tempId, name: "Nova Etapa", orderIndex },
    ]);
    setExpandedPhases((prev) => new Set([...prev, tempId]));
  }, [estimate, newLocalPhases.length]);

  const handleDeletePhase = useCallback((phaseId: string) => {
    // Check if it's a new local phase
    setNewLocalPhases((prev) => {
      const found = prev.find((p) => p.tempId === phaseId);
      if (found) return prev.filter((p) => p.tempId !== phaseId);
      return prev;
    });
    setDeletedPhaseIds((prev) => {
      const next = new Set(prev);
      next.add(phaseId);
      return next;
    });
  }, []);

  const handlePhaseNameChange = useCallback((phaseId: string, name: string) => {
    // Check if it's a new local phase
    setNewLocalPhases((prev) => {
      const idx = prev.findIndex((p) => p.tempId === phaseId);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], name };
        return updated;
      }
      return prev;
    });
    setPhaseNameEdits((prev) => {
      const next = new Map(prev);
      next.set(phaseId, name);
      return next;
    });
  }, []);

  // Phase complexity/monthly handlers
  const handlePhaseComplexityChange = useCallback(
    (phaseId: string, value: number) => {
      setPhaseComplexityMap((prev) => {
        const next = new Map(prev);
        next.set(phaseId, value);
        return next;
      });
      setPhaseFieldsModified(true);
    },
    []
  );

  const handlePhaseMonthlyChange = useCallback(
    (phaseId: string, value: boolean) => {
      setPhaseMonthlyMap((prev) => {
        const next = new Map(prev);
        next.set(phaseId, value);
        return next;
      });
      setPhaseFieldsModified(true);
    },
    []
  );

  // Activity name change handler
  const handleActivityNameChange = useCallback(
    (activityId: string, name: string) => {
      setActivityNameEdits((prev) => {
        const next = new Map(prev);
        next.set(activityId, name);
        return next;
      });
    },
    []
  );

  const getActivityState = useCallback(
    (activity: EstimateActivity) => {
      const nameEdit = activityNameEdits.get(activity.id);
      const base = nameEdit !== undefined ? { ...activity, name: nameEdit } : activity;
      const edit = activityEdits.get(activity.id);
      if (edit) {
        if (edit.allocations && edit.allocations.length > 0) {
          let totalCost = 0;
          let totalHours = 0;
          for (const alloc of edit.allocations) {
            const c = cargos.find((c) => c.id === alloc.cargoId);
            if (c) {
              totalCost += c.valorHora * alloc.estimatedHours;
              totalHours += alloc.estimatedHours;
            }
          }
          return {
            ...base,
            cargoId: edit.cargoId,
            costPerHour: 0,
            estimatedHours: totalHours,
            totalCost,
            isActive: edit.isActive,
          };
        }
        const cargo = cargos.find((c) => c.id === edit.cargoId);
        return {
          ...base,
          cargoId: edit.cargoId,
          cargoName: cargo?.name,
          costPerHour: cargo?.valorHora ?? 0,
          estimatedHours: edit.estimatedHours,
          totalCost: (cargo?.valorHora ?? 0) * edit.estimatedHours,
          isActive: edit.isActive,
        };
      }
      return base;
    },
    [activityEdits, activityNameEdits, cargos]
  );

  const handleActivityChange = useCallback(
    (
      activityId: string,
      updates: {
        cargoId?: string;
        estimatedHours: number;
        isActive: boolean;
        allocations?: AllocationEdit[];
      }
    ) => {
      setActivityEdits((prev) => {
        const next = new Map(prev);
        next.set(activityId, updates);
        return next;
      });
    },
    []
  );

  // Reset all local state
  const handleDiscard = useCallback(() => {
    setActivityEdits(new Map());
    setActivityNameEdits(new Map());
    setPhaseCostsMap(new Map());
    setCostsModified(false);
    setPendingCustomActivities([]);
    setLocalMarginPercent(null);
    setMarginModified(false);
    setLocalOverheadPercent(null);
    setOverheadModified(false);
    setLocalAreaM2(null);
    setAreaModified(false);
    setPhaseComplexityMap(new Map());
    setPhaseMonthlyMap(new Map());
    setPhaseFieldsModified(false);
    setNewLocalPhases([]);
    setDeletedPhaseIds(new Set());
    setPhaseNameEdits(new Map());
  }, []);

  const resetAfterSave = useCallback(() => {
    setActivityEdits(new Map());
    setActivityNameEdits(new Map());
    setCostsModified(false);
    setPhaseCostsMap(new Map());
    setPendingCustomActivities([]);
    setLocalMarginPercent(null);
    setMarginModified(false);
    setLocalOverheadPercent(null);
    setOverheadModified(false);
    setLocalAreaM2(null);
    setAreaModified(false);
    setPhaseComplexityMap(new Map());
    setPhaseMonthlyMap(new Map());
    setPhaseFieldsModified(false);
    setNewLocalPhases([]);
    setDeletedPhaseIds(new Set());
    setPhaseNameEdits(new Map());
    setPhaseOrder(null);
    setOriginalSnapshot(null);
  }, []);

  // Mutations
  const saveMutation = useMutation({
    mutationFn: (payload: UpdateEstimatePayload) => updateEstimate(id, payload),
    onSuccess: async () => {
      toast.success("Estimativa salva com sucesso!");
      await queryClient.refetchQueries({ queryKey: ["estimate", id] });
      resetAfterSave();
    },
    onError: () => {
      toast.error("Erro ao salvar estimativa.");
    },
  });

  const overheadMutation = useMutation({
    mutationFn: () => recalculateOverhead(id),
    onSuccess: (data) => {
      toast.success("Overhead recalculado com sucesso!");
      setLocalOverheadPercent(data.overheadPercent);
      setOverheadModified(false);
      queryClient.invalidateQueries({ queryKey: ["estimate", id] });
    },
    onError: () => {
      toast.error("Erro ao recalcular overhead.");
    },
  });

  const syncCargosMutation = useMutation({
    mutationFn: () => syncCargos(id),
    onSuccess: () => {
      toast.success("Cargos sincronizados com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["cargos"] });
    },
    onError: () => {
      toast.error("Erro ao sincronizar cargos.");
    },
  });

  // Build save payload
  const handleSave = useCallback(() => {
    if (!estimate) return;

    // Validate incomplete custom activities
    const hasFilledCargo = (a: PendingCustomActivity) => {
      if (a.allocations?.some((al) => al.cargoId && al.estimatedHours > 0))
        return true;
      return !!(a.cargoId && a.estimatedHours > 0);
    };
    const incomplete = pendingCustomActivities
      .filter(
        (a) =>
          a.name.trim() ||
          a.cargoId ||
          a.estimatedHours > 0 ||
          a.allocations?.some((al) => al.cargoId || al.estimatedHours > 0)
      )
      .filter((a) => !a.name.trim() || !hasFilledCargo(a));
    if (incomplete.length > 0) {
      const parts: string[] = [];
      if (!incomplete[0].name.trim()) parts.push("nome");
      if (!hasFilledCargo(incomplete[0])) parts.push("cargo e horas");
      toast.error(
        `Atividade(s) personalizada(s) incompleta(s): preencha ${parts.join(", ")}.`
      );
      return;
    }

    const currentMargin = localMarginPercent ?? estimate.marginPercent;
    const currentOverhead = localOverheadPercent ?? estimate.overheadPercent;

    const buildActivityPayload = (activity: EstimateActivity) => {
      const edit = activityEdits.get(activity.id);
      const state = getActivityState(activity);
      const allocs =
        edit?.allocations ??
        (activity.allocations?.length > 0
          ? activity.allocations.map((a) => ({
            id: a.id,
            cargoId: a.cargoId,
            estimatedHours: a.estimatedHours,
          }))
          : undefined);
      const nameEdit = activityNameEdits.get(activity.id);
      return {
        id: activity.id,
        name: nameEdit !== undefined ? nameEdit : undefined,
        cargoId: state.cargoId,
        estimatedHours: state.estimatedHours,
        isActive: state.isActive,
        allocations: allocs?.map((a) => ({
          id: a.id && a.id.length > 30 ? a.id : undefined,
          cargoId: a.cargoId,
          estimatedHours: a.estimatedHours,
        })),
      };
    };

    // Flatten all costs (phase + general) into a single array
    const originalCostIds = new Set(estimate.additionalCosts.map((c) => c.id));
    const allCosts: {
      id?: string;
      phaseId?: string;
      name: string;
      value: number;
    }[] = [];
    for (const phase of estimate.phases) {
      const costs =
        phaseCostsMap.get(phase.id) ?? phase.additionalCosts ?? [];
      for (const c of costs) {
        allCosts.push({
          id: originalCostIds.has(c.id) ? c.id : undefined,
          phaseId: phase.id,
          name: c.name,
          value: c.value,
        });
      }
    }
    // General costs (estimate-level, no phaseId)
    for (const c of generalCosts) {
      allCosts.push({
        id: originalCostIds.has(c.id) ? c.id : undefined,
        name: c.name,
        value: c.value,
      });
    }

    const payload: UpdateEstimatePayload = {
      description: estimate.description,
      clienteId: estimate.clienteId,
      areaM2: localAreaM2 || undefined,
      overheadPercent: currentOverhead,
      marginPercent: currentMargin,
      taxPercent: localTaxPercent ?? estimate.taxPercent,
      expirationDays: estimate.expirationDays,
      phases: estimate.phases
        .filter((phase) => !deletedPhaseIds.has(phase.id))
        .map((phase) => {
          const nameEdit = phaseNameEdits.get(phase.id);
          const orderIdx = phaseOrder ? phaseOrder.indexOf(phase.id) : undefined;
          return {
            id: phase.id,
            name: nameEdit !== undefined ? nameEdit : undefined,
            orderIndex: orderIdx !== undefined && orderIdx >= 0 ? orderIdx : undefined,
            complexityPercent:
              phaseComplexityMap.get(phase.id) ?? phase.complexityPercent,
            isMonthlyBilling:
              phaseMonthlyMap.get(phase.id) ?? phase.isMonthlyBilling,
            activities: phase.activities.map(buildActivityPayload),
            subPhases: phase.subPhases.map((sp) => ({
              id: sp.id,
              activities: sp.activities.map(buildActivityPayload),
            })),
          };
        }),
      newPhases: newLocalPhases.length > 0
        ? newLocalPhases.map((p) => ({ name: p.name, orderIndex: p.orderIndex }))
        : undefined,
      deletedPhaseIds: deletedPhaseIds.size > 0
        ? Array.from(deletedPhaseIds)
        : undefined,
      customActivities: pendingCustomActivities
        .filter((a) => a.name.trim() && a.isActive !== false)
        .map((a) => ({
          phaseId: a.subPhaseId ? undefined : a.phaseId,
          subPhaseId: a.subPhaseId,
          name: a.name,
          cargoId: a.allocations?.length
            ? a.allocations[0]?.cargoId
            : a.cargoId,
          estimatedHours: a.allocations?.length
            ? a.allocations.reduce((s, al) => s + al.estimatedHours, 0)
            : a.estimatedHours,
          allocations: a.allocations
            ?.filter((al) => al.cargoId)
            ?.map((al) => ({
              cargoId: al.cargoId,
              estimatedHours: al.estimatedHours,
            })),
        })),
      additionalCosts: allCosts,
    };

    saveMutation.mutate(payload);
  }, [
    estimate,
    getActivityState,
    activityEdits,
    activityNameEdits,
    saveMutation,
    phaseCostsMap,
    generalCosts,
    pendingCustomActivities,
    localMarginPercent,
    localOverheadPercent,
    localTaxPercent,
    localAreaM2,
    phaseComplexityMap,
    phaseMonthlyMap,
    newLocalPhases,
    deletedPhaseIds,
    phaseNameEdits,
    phaseOrder,
    id,
  ]);

  // Compute all totals with per-phase complexity and monthly billing segregation
  const computed = useMemo(() => {
    if (!estimate) return null;

    const currentMargin = localMarginPercent ?? estimate.marginPercent;
    const currentOverhead = localOverheadPercent ?? estimate.overheadPercent;

    const phaseData = estimate.phases.map((phase) => {
      const cp =
        phaseComplexityMap.get(phase.id) ?? phase.complexityPercent;
      const isMonthly =
        phaseMonthlyMap.get(phase.id) ?? phase.isMonthlyBilling;

      let directCost = 0;
      let totalHours = 0;
      let activeCount = 0;
      let pendingCount = 0;
      let filledCount = 0;

      const processAct = (act: EstimateActivity) => {
        const state = getActivityState(act);
        if (state.isActive) {
          directCost += state.totalCost;
          totalHours += state.estimatedHours;
          activeCount++;
          const edit = activityEdits.get(act.id);
          const allocs = edit?.allocations ?? act.allocations ?? [];
          if (allocs.length > 0) {
            const allFilled = allocs.every(
              (a) => a.cargoId && a.estimatedHours > 0
            );
            if (allFilled) filledCount++;
            else pendingCount++;
          } else if (!state.cargoId || state.estimatedHours <= 0) {
            pendingCount++;
          } else {
            filledCount++;
          }
        }
      };

      phase.activities.forEach(processAct);
      phase.subPhases.forEach((sp) => sp.activities.forEach(processAct));

      // Include pending custom activities for this phase
      for (const ca of pendingCustomActivities) {
        const belongs =
          (ca.phaseId === phase.id && !ca.subPhaseId) ||
          phase.subPhases.some((sp) => sp.id === ca.subPhaseId);
        if (!belongs || ca.isActive === false) continue;
        activeCount++;
        const hasAllocs = ca.allocations && ca.allocations.length > 0;
        if (hasAllocs) {
          for (const alloc of ca.allocations!) {
            if (alloc.cargoId && alloc.estimatedHours > 0) {
              const cargo = cargos.find((c) => c.id === alloc.cargoId);
              if (cargo) {
                directCost += cargo.valorHora * alloc.estimatedHours;
                totalHours += alloc.estimatedHours;
              }
            }
          }
          const allFilled = ca.allocations!.every(
            (a) => a.cargoId && a.estimatedHours > 0
          );
          if (allFilled) filledCount++;
          else pendingCount++;
        } else if (ca.cargoId && ca.estimatedHours > 0) {
          const cargo = cargos.find((c) => c.id === ca.cargoId);
          if (cargo) {
            directCost += cargo.valorHora * ca.estimatedHours;
            totalHours += ca.estimatedHours;
            filledCount++;
          }
        } else {
          pendingCount++;
        }
      }

      const phaseOverhead = directCost * (currentOverhead / 100);
      const complexityCost = (directCost + phaseOverhead) * (cp / 100);
      const phaseCosts =
        phaseCostsMap.get(phase.id) ?? phase.additionalCosts ?? [];
      const additionalCosts = phaseCosts.reduce((s, c) => s + c.value, 0);

      return {
        phaseId: phase.id,
        name: phase.name,
        directCost,
        totalHours,
        complexityPercent: cp,
        complexityCost,
        isMonthly,
        activeCount,
        pendingCount,
        filledCount,
        additionalCosts,
      };
    });

    // Include new local phases in computation
    for (const np of newLocalPhases) {
      const cp = phaseComplexityMap.get(np.tempId) ?? 0;
      const isMonthly = phaseMonthlyMap.get(np.tempId) ?? false;

      let directCost = 0;
      let totalHours = 0;
      let activeCount = 0;
      let pendingCount = 0;
      let filledCount = 0;

      for (const ca of pendingCustomActivities) {
        const belongs = ca.phaseId === np.tempId && !ca.subPhaseId;
        if (!belongs || ca.isActive === false) continue;
        activeCount++;
        const hasAllocs = ca.allocations && ca.allocations.length > 0;
        if (hasAllocs) {
          for (const alloc of ca.allocations!) {
            if (alloc.cargoId && alloc.estimatedHours > 0) {
              const cargo = cargos.find((c) => c.id === alloc.cargoId);
              if (cargo) {
                directCost += cargo.valorHora * alloc.estimatedHours;
                totalHours += alloc.estimatedHours;
              }
            }
          }
          const allFilled = ca.allocations!.every(
            (a) => a.cargoId && a.estimatedHours > 0
          );
          if (allFilled) filledCount++;
          else pendingCount++;
        } else if (ca.cargoId && ca.estimatedHours > 0) {
          const cargo = cargos.find((c) => c.id === ca.cargoId);
          if (cargo) {
            directCost += cargo.valorHora * ca.estimatedHours;
            totalHours += ca.estimatedHours;
            filledCount++;
          }
        } else {
          pendingCount++;
        }
      }

      const npOverhead = directCost * (currentOverhead / 100);
      const complexityCost = (directCost + npOverhead) * (cp / 100);
      const phaseCosts = phaseCostsMap.get(np.tempId) ?? [];
      const additionalCosts = phaseCosts.reduce((s, c) => s + c.value, 0);

      phaseData.push({
        phaseId: np.tempId,
        name: np.name,
        directCost,
        totalHours,
        complexityPercent: cp,
        complexityCost,
        isMonthly,
        activeCount,
        pendingCount,
        filledCount,
        additionalCosts,
      });
    }

    const proposalPhases = phaseData.filter((p) => !p.isMonthly);
    const monthlyPhases = phaseData.filter((p) => p.isMonthly);

    // Proposal totals (non-monthly)
    const totalActivityCost = proposalPhases.reduce(
      (s, p) => s + p.directCost,
      0
    );
    const totalOverheadValue =
      totalActivityCost * (currentOverhead / 100);
    const totalComplexityValue = proposalPhases.reduce(
      (s, p) => s + p.complexityCost,
      0
    );
    const phaseAdditionalCosts = proposalPhases.reduce(
      (s, p) => s + p.additionalCosts,
      0
    );
    const generalCostsTotal = generalCosts.reduce((s, c) => s + c.value, 0);
    const totalAdditionalCosts = phaseAdditionalCosts + generalCostsTotal;
    const totalCost =
      totalActivityCost +
      totalOverheadValue +
      totalComplexityValue;
    const marginValue = totalCost * (currentMargin / 100);
    const basePrice = totalCost + marginValue;

    const totalAdjustmentsValue = estimate.adjustments.reduce(
      (s, a) => s + a.value,
      0
    );
    const finalValue = basePrice + totalAdditionalCosts + totalAdjustmentsValue;

    // Tax
    const currentTax = localTaxPercent ?? estimate.taxPercent;
    const taxValue = finalValue * (currentTax / 100);
    const finalWithTax = finalValue + taxValue;

    // Monthly totals (same structure: atividades + overhead + complexidade + margem + adicionais)
    const monthlyActivityCost = monthlyPhases.reduce(
      (s, p) => s + p.directCost,
      0
    );
    const monthlyOverhead =
      monthlyActivityCost * (currentOverhead / 100);
    const monthlyComplexity = monthlyPhases.reduce(
      (s, p) => s + p.complexityCost,
      0
    );
    const monthlyAdditionalCosts = monthlyPhases.reduce(
      (s, p) => s + p.additionalCosts,
      0
    );
    const monthlyCost =
      monthlyActivityCost + monthlyOverhead + monthlyComplexity;
    const monthlyMarginValue = monthlyCost * (currentMargin / 100);
    const monthlyBasePrice = monthlyCost + monthlyMarginValue;
    const monthlyTotalCost = monthlyBasePrice + monthlyAdditionalCosts;
    const monthlyTaxValue = monthlyTotalCost * (currentTax / 100);
    const monthlyTotalWithTax = monthlyTotalCost + monthlyTaxValue;

    // Aggregate counts
    const totalHours = phaseData.reduce((s, p) => s + p.totalHours, 0);
    const activeCount = phaseData.reduce((s, p) => s + p.activeCount, 0);
    const filledCount = phaseData.reduce((s, p) => s + p.filledCount, 0);
    const pendingCount = phaseData.reduce(
      (s, p) => s + p.pendingCount,
      0
    );

    return {
      phases: phaseData,
      totalActivityCost,
      totalOverheadValue,
      totalComplexityValue,
      totalAdditionalCosts,
      generalCostsTotal,
      totalCost,
      basePrice,
      finalValue,
      marginValue,
      totalAdjustmentsValue,
      currentTax,
      taxValue,
      finalWithTax,
      monthlyTotalCost,
      monthlyActivityCost,
      monthlyOverhead,
      monthlyComplexity,
      monthlyAdditionalCosts,
      monthlyTaxValue,
      monthlyTotalWithTax,
      totalHours,
      activeCount,
      filledCount,
      pendingCount,
      currentMargin,
      currentOverhead,
    };
  }, [
    estimate,
    getActivityState,
    phaseComplexityMap,
    phaseMonthlyMap,
    phaseCostsMap,
    generalCosts,
    localOverheadPercent,
    localMarginPercent,
    localTaxPercent,
    pendingCustomActivities,
    newLocalPhases,
    cargos,
    activityEdits,
  ]);

  if (isLoading) {
    return (
      <div className="p-6 text-muted-foreground">
        Carregando estimativa...
      </div>
    );
  }

  if (!estimate || !computed) {
    return (
      <div className="p-6 text-muted-foreground">
        Estimativa não encontrada.
      </div>
    );
  }

  const hasEdits =
    activityEdits.size > 0 ||
    activityNameEdits.size > 0 ||
    newLocalPhases.length > 0 ||
    deletedPhaseIds.size > 0 ||
    phaseNameEdits.size > 0 ||
    costsModified ||
    taxModified ||
    marginModified ||
    overheadModified ||
    phaseFieldsModified ||
    areaModified ||
    pendingCustomActivities.length > 0 ||
    phaseOrder !== null;

  // Simulation delta
  const simDelta =
    originalSnapshot && hasEdits
      ? {
        finalValue: computed.finalValue - originalSnapshot.finalValue,
        totalHours: computed.totalHours - originalSnapshot.totalHours,
      }
      : null;

  const currentArea = localAreaM2 ?? estimate.areaM2 ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={estimate.description}
        description={`Cliente: ${estimate.clienteName} | Template: ${estimate.sourceTemplateName}`}
        action={
          <div className="flex items-center gap-2">
            <Link href="/estimativas">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => overheadMutation.mutate()}
              disabled={overheadMutation.isPending}
            >
              <RefreshCw
                className={`h-4 w-4 mr-1 ${overheadMutation.isPending ? "animate-spin" : ""}`}
              />
              {overheadMutation.isPending
                ? "Recalculando..."
                : "Sincronizar Overhead"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => syncCargosMutation.mutate()}
              disabled={syncCargosMutation.isPending}
            >
              <RefreshCw
                className={`h-4 w-4 mr-1 ${syncCargosMutation.isPending ? "animate-spin" : ""}`}
              />
              {syncCargosMutation.isPending
                ? "Sincronizando..."
                : "Sincronizar Cargos"}
            </Button>
            {hasEdits && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDiscard}
              >
                <Undo2 className="h-4 w-4 mr-1" />
                Descartar
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasEdits || saveMutation.isPending}
            >
              <Save className="h-4 w-4 mr-1" />
              {saveMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        }
      />

      {/* Top summary cards: horas totais + custo/m² */}
      <div className="flex flex-wrap gap-3">
        <Card className="flex-1 min-w-[140px]">
          <CardContent className="py-3 px-4">
            <p className="text-xs text-muted-foreground">Horas Totais</p>
            <p className="text-lg font-bold tabular-nums">
              {computed.totalHours.toFixed(1)}h
            </p>
          </CardContent>
        </Card>
        {currentArea > 0 && (
          <Card className="flex-1 min-w-[140px]">
            <CardContent className="py-3 px-4">
              <p className="text-xs text-muted-foreground">Custo/m²</p>
              <p className="text-lg font-bold tabular-nums">
                {formatCurrency(computed.finalValue / currentArea)}
              </p>
            </CardContent>
          </Card>
        )}
        <Card className="flex-1 min-w-[140px]">
          <CardContent className="py-3 px-4">
            <p className="text-xs text-muted-foreground">Valor Final</p>
            <p className="text-lg font-bold tabular-nums">
              {formatCurrency(computed.finalValue)}
            </p>
          </CardContent>
        </Card>
        {computed.monthlyTotalCost > 0 && (
          <Card className="flex-1 min-w-[140px]">
            <CardContent className="py-3 px-4">
              <p className="text-xs text-muted-foreground">
                Custos Mensais
              </p>
              <p className="text-lg font-bold tabular-nums">
                {formatCurrency(computed.monthlyTotalCost)}
                <span className="text-xs font-normal text-muted-foreground">
                  /mês
                </span>
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Editable fields: overhead, margin, area */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <Label className="text-xs text-muted-foreground">Overhead:</Label>
          <Input
            type="number"
            step="0.1"
            min="0"
            value={
              computed.currentOverhead != null
                ? String(computed.currentOverhead)
                : ""
            }
            onChange={(e) => {
              setLocalOverheadPercent(parseFloat(e.target.value) || 0);
              setOverheadModified(true);
            }}
            className="h-7 w-20 text-xs text-right"
          />
          <span className="text-xs text-muted-foreground">%</span>
        </div>
        <div className="flex items-center gap-1">
          <Label className="text-xs text-muted-foreground">Margem:</Label>
          <Input
            type="number"
            step="0.1"
            min="0"
            max="99"
            value={
              computed.currentMargin != null
                ? String(computed.currentMargin)
                : ""
            }
            onChange={(e) => {
              setLocalMarginPercent(parseFloat(e.target.value) || 0);
              setMarginModified(true);
            }}
            className="h-7 w-20 text-xs text-right"
          />
          <span className="text-xs text-muted-foreground">%</span>
        </div>
        <div className="flex items-center gap-1">
          <Label className="text-xs text-muted-foreground">Área:</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={localAreaM2 != null ? String(localAreaM2) : ""}
            onChange={(e) => {
              setLocalAreaM2(parseFloat(e.target.value) || 0);
              setAreaModified(true);
            }}
            placeholder="0"
            className="h-7 w-24 text-xs text-right"
          />
          <span className="text-xs text-muted-foreground">m²</span>
        </div>
        {estimate.isExpired && <Badge variant="destructive">Expirada</Badge>}
        {estimate.isStale && (
          <Badge variant="secondary">Desatualizada</Badge>
        )}
      </div>

      {/* Simulation indicator bar + explanation */}
      {simDelta && (
        <div className="flex items-center gap-4 p-3 rounded-md border border-blue-200 bg-blue-50/50">
          <span className="text-xs font-medium text-blue-700">
            Simulação ativa
          </span>
          <span className="text-xs text-muted-foreground">|</span>
          <span className="text-xs">
            Valor Final:{" "}
            <span
              className={`font-semibold ${simDelta.finalValue > 0 ? "text-green-600" : simDelta.finalValue < 0 ? "text-destructive" : "text-muted-foreground"}`}
            >
              {simDelta.finalValue >= 0 ? "+" : ""}
              {simDelta.finalValue.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </span>
          </span>
          <span className="text-xs">
            Horas:{" "}
            <span
              className={`font-semibold ${simDelta.totalHours > 0 ? "text-green-600" : simDelta.totalHours < 0 ? "text-destructive" : "text-muted-foreground"}`}
            >
              {simDelta.totalHours >= 0 ? "+" : ""}
              {simDelta.totalHours.toFixed(1)}h
            </span>
          </span>
          <span className="text-xs text-muted-foreground">|</span>
          <span className="group relative">
            <Info className="h-3.5 w-3.5 text-blue-500 cursor-help" />
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-popover text-popover-foreground text-xs rounded-md shadow-md border hidden group-hover:block z-50">
              Os valores exibidos refletem edições não salvas. Salve para
              persistir ou descarte para reverter ao estado salvo.
            </span>
          </span>
        </div>
      )}

      {/* Main content: two-column layout */}
      <div className="flex gap-6 items-start">
        {/* Left column: Atividades */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Activity count + expand/collapse all */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {computed.filledCount} de {computed.activeCount} preenchidas
              </Badge>
              {computed.pendingCount > 0 && (
                <Badge variant="secondary" className="text-amber-700 bg-amber-50 text-[10px] px-1.5 py-0">
                  {computed.pendingCount} pendentes
                </Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAllPhases}
              className="text-xs"
            >
              <ChevronsUpDown className="h-4 w-4 mr-1" />
              {allExpanded ? "Colapsar tudo" : "Expandir tudo"}
            </Button>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handlePhaseDragEnd}>
            <SortableContext
              items={
                (phaseOrder ?? estimate.phases.filter((p) => !deletedPhaseIds.has(p.id)).map((p) => p.id))
              }
              strategy={verticalListSortingStrategy}
            >
              {(phaseOrder
                ? phaseOrder.map((id) => estimate.phases.find((p) => p.id === id)!).filter(Boolean)
                : estimate.phases.filter((phase) => !deletedPhaseIds.has(phase.id))
              ).map((phase) => {
                const phaseComputed = computed.phases.find(
                  (p) => p.phaseId === phase.id
                );
                const displayPhase = phaseNameEdits.has(phase.id)
                  ? { ...phase, name: phaseNameEdits.get(phase.id)! }
                  : phase;
                return (
                  <SortablePhaseWrapper key={phase.id} id={phase.id}>
                    <PhaseSection
                      phase={displayPhase}
                      phaseComputed={phaseComputed!}
                      complexityPercent={
                        phaseComplexityMap.get(phase.id) ??
                        phase.complexityPercent
                      }
                      isMonthlyBilling={
                        phaseMonthlyMap.get(phase.id) ?? phase.isMonthlyBilling
                      }
                      overheadPercent={computed.currentOverhead}
                      onComplexityChange={(val) =>
                        handlePhaseComplexityChange(phase.id, val)
                      }
                      onMonthlyChange={(val) =>
                        handlePhaseMonthlyChange(phase.id, val)
                      }
                      cargos={cargos}
                      expanded={expandedPhases.has(phase.id)}
                      onToggle={() => togglePhase(phase.id)}
                      getActivityState={getActivityState}
                      onActivityChange={handleActivityChange}
                      activityEdits={activityEdits}
                      onActivityNameChange={handleActivityNameChange}
                      collapsedActivities={collapsedActivities}
                      onToggleActivity={toggleActivity}
                      onPhaseNameChange={(name) => handlePhaseNameChange(phase.id, name)}
                      onDeletePhase={() => {
                        setPhaseToDelete(phase.id);
                      }}
                      pendingCustomActivities={pendingCustomActivities.filter(
                        (a) =>
                          a.phaseId === phase.id ||
                          phase.subPhases.some((sp) => sp.id === a.subPhaseId)
                      )}
                      onAddCustomActivity={addCustomActivity}
                      onUpdateCustomActivity={updateCustomActivity}
                      onRemoveCustomActivity={removeCustomActivity}
                      phaseCosts={
                        phaseCostsMap.get(phase.id) ??
                        phase.additionalCosts ??
                        []
                      }
                      onPhaseCostsChange={(costs) =>
                        handlePhaseCostsChange(phase.id, costs)
                      }
                    />
                  </SortablePhaseWrapper>
                );
              })}
            </SortableContext>
          </DndContext>

          {/* New local phases (not yet saved) */}
          {newLocalPhases.map((np) => {
            const emptyPhase: EstimatePhase = {
              id: np.tempId,
              name: np.name,
              orderIndex: np.orderIndex,
              directCost: 0,
              complexityPercent: phaseComplexityMap.get(np.tempId) ?? 0,
              complexityCost: 0,
              isMonthlyBilling: phaseMonthlyMap.get(np.tempId) ?? false,
              totalHours: 0,
              subPhases: [],
              activities: [],
              additionalCosts: [],
            };
            const npComputed = computed.phases.find(
              (p) => p.phaseId === np.tempId
            );
            const phaseComputedData: PhaseComputedData = npComputed ?? {
              phaseId: np.tempId,
              name: np.name,
              directCost: 0,
              totalHours: 0,
              complexityPercent: 0,
              complexityCost: 0,
              isMonthly: false,
              activeCount: 0,
              pendingCount: 0,
              filledCount: 0,
              additionalCosts: 0,
            };
            return (
              <PhaseSection
                key={np.tempId}
                phase={emptyPhase}
                phaseComputed={phaseComputedData}
                complexityPercent={phaseComplexityMap.get(np.tempId) ?? 0}
                isMonthlyBilling={phaseMonthlyMap.get(np.tempId) ?? false}
                overheadPercent={computed.currentOverhead}
                onComplexityChange={(val) =>
                  handlePhaseComplexityChange(np.tempId, val)
                }
                onMonthlyChange={(val) =>
                  handlePhaseMonthlyChange(np.tempId, val)
                }
                cargos={cargos}
                expanded={expandedPhases.has(np.tempId)}
                onToggle={() => togglePhase(np.tempId)}
                getActivityState={getActivityState}
                onActivityChange={handleActivityChange}
                activityEdits={activityEdits}
                onActivityNameChange={handleActivityNameChange}
                collapsedActivities={collapsedActivities}
                onToggleActivity={toggleActivity}
                onPhaseNameChange={(name) => handlePhaseNameChange(np.tempId, name)}
                onDeletePhase={() => {
                  setPhaseToDelete(np.tempId);
                }}
                pendingCustomActivities={pendingCustomActivities.filter(
                  (a) => a.phaseId === np.tempId
                )}
                onAddCustomActivity={addCustomActivity}
                onUpdateCustomActivity={updateCustomActivity}
                onRemoveCustomActivity={removeCustomActivity}
                phaseCosts={phaseCostsMap.get(np.tempId) ?? []}
                onPhaseCostsChange={(costs) =>
                  handlePhaseCostsChange(np.tempId, costs)
                }
              />
            );
          })}

          {/* Add new phase button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={handleAddPhase}
          >
            <Plus className="h-3 w-3 mr-1" /> Adicionar Etapa
          </Button>

          {estimate.phases.length === 0 && newLocalPhases.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Nenhuma fase encontrada. O template selecionado não possui
              atividades.
            </p>
          )}

          {/* General costs (estimate-level) */}
          <Card>
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">Custos Gerais</CardTitle>
                  <HelpButton
                    help={{
                      title: "Custos Gerais",
                      sections: [
                        {
                          heading: "O que são",
                          content:
                            "Custos que não pertencem a uma etapa específica, mas se aplicam ao projeto como um todo. São somados aos custos adicionais das etapas.",
                        },
                        {
                          heading: "Exemplos comuns",
                          content:
                            "RRT (Registro de Responsabilidade Técnica), taxa do CAU/CREA, fotos profissionais, maquete física ou eletrônica, brindes, impressões de prancha, plotagens, deslocamentos, hospedagem, refeições em viagem, seguro profissional, taxas de aprovação em prefeitura, custos com cartório e reconhecimento de firma.",
                        },
                      ],
                    }}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleGeneralCostsChange([
                      ...generalCosts,
                      { id: crypto.randomUUID(), name: "", value: 0 },
                    ])
                  }
                >
                  <Plus className="h-4 w-4 mr-1" /> Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {generalCosts.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Nenhum custo geral. Clique em &quot;Adicionar&quot; para incluir.
                </p>
              )}

              {generalCosts.length > 0 && (
                <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground px-1">
                  <span className="flex-1">Descrição</span>
                  <span className="w-32 text-right">Valor (R$)</span>
                  <span className="w-8" />
                </div>
              )}

              {generalCosts.map((cost, index) => (
                <div key={cost.id || index} className="flex items-center gap-3">
                  <Input
                    className="flex-1"
                    placeholder="Ex: RRT, Taxa CAU, Maquete, Fotos"
                    value={cost.name}
                    onChange={(e) => {
                      const updated = [...generalCosts];
                      updated[index] = { ...updated[index], name: e.target.value };
                      handleGeneralCostsChange(updated);
                    }}
                  />
                  <Input
                    className="w-32 text-right"
                    type="number"
                    min={0}
                    step="0.01"
                    value={numStr(cost.value)}
                    onChange={(e) => {
                      const updated = [...generalCosts];
                      updated[index] = {
                        ...updated[index],
                        value: parseFloat(e.target.value) || 0,
                      };
                      handleGeneralCostsChange(updated);
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() =>
                      handleGeneralCostsChange(
                        generalCosts.filter((_, i) => i !== index)
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {generalCosts.length > 0 && (
                <div className="flex items-center justify-between border-t pt-2 mt-2">
                  <Label className="text-sm text-muted-foreground">Total Custos Gerais</Label>
                  <span className="text-sm font-semibold">
                    {formatCurrency(computed.generalCostsTotal)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: Resumo sticky */}
        <div className="w-80 shrink-0 sticky top-4 self-start space-y-4">
          <PricingSummary
            totalActivityCost={computed.totalActivityCost}
            overheadPercent={computed.currentOverhead}
            totalComplexityValue={computed.totalComplexityValue}
            totalAdditionalCosts={computed.totalAdditionalCosts}
            marginPercent={computed.currentMargin}
            totalAdjustments={computed.totalAdjustmentsValue}
            taxPercent={computed.currentTax}
            monthlyTotalCost={computed.monthlyTotalCost}
            monthlyActivityCost={computed.monthlyActivityCost}
            monthlyOverhead={computed.monthlyOverhead}
            monthlyComplexity={computed.monthlyComplexity}
            monthlyAdditionalCosts={computed.monthlyAdditionalCosts}
          />

          {/* Tax input */}
          <Card>
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Imposto (%)</Label>
                <Input
                  className="w-24 text-right"
                  type="number"
                  min={0}
                  step="0.01"
                  value={numStr(localTaxPercent ?? estimate.taxPercent)}
                  onChange={(e) => {
                    setLocalTaxPercent(parseFloat(e.target.value) || 0);
                    setTaxModified(true);
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={!!phaseToDelete}
        onOpenChange={(open) => { if (!open) setPhaseToDelete(null); }}
        title="Excluir etapa"
        description="Excluir etapa e todas as suas atividades?"
        confirmLabel="Excluir"
        variant="destructive"
        onConfirm={() => {
          if (phaseToDelete) {
            handleDeletePhase(phaseToDelete);
          }
          setPhaseToDelete(null);
        }}
      />
    </div>
  );
}

// ─── Phase Section ──────────────────────────────────────────────────────────

interface PhaseComputedData {
  phaseId: string;
  name: string;
  directCost: number;
  totalHours: number;
  complexityPercent: number;
  complexityCost: number;
  isMonthly: boolean;
  activeCount: number;
  pendingCount: number;
  filledCount: number;
  additionalCosts: number;
}

function SortablePhaseWrapper({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="relative group/phase">
      <div
        className="absolute left-0 top-3 cursor-grab active:cursor-grabbing opacity-0 group-hover/phase:opacity-100 transition-opacity z-10"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      {children}
    </div>
  );
}

function PhaseSection({
  phase,
  phaseComputed,
  complexityPercent,
  isMonthlyBilling,
  overheadPercent,
  onComplexityChange,
  onMonthlyChange,
  cargos,
  expanded,
  onToggle,
  getActivityState,
  onActivityChange,
  activityEdits,
  onActivityNameChange,
  collapsedActivities,
  onToggleActivity,
  onPhaseNameChange,
  onDeletePhase,
  pendingCustomActivities,
  onAddCustomActivity,
  onUpdateCustomActivity,
  onRemoveCustomActivity,
  phaseCosts,
  onPhaseCostsChange,
}: {
  phase: EstimatePhase;
  phaseComputed: PhaseComputedData;
  complexityPercent: number;
  isMonthlyBilling: boolean;
  overheadPercent: number;
  onComplexityChange: (value: number) => void;
  onMonthlyChange: (value: boolean) => void;
  cargos: Cargo[];
  expanded: boolean;
  onToggle: () => void;
  getActivityState: (activity: EstimateActivity) => EstimateActivity;
  onActivityChange: (
    activityId: string,
    updates: {
      cargoId?: string;
      estimatedHours: number;
      isActive: boolean;
      allocations?: AllocationEdit[];
    }
  ) => void;
  activityEdits: Map<string, { allocations?: AllocationEdit[] }>;
  onActivityNameChange: (activityId: string, name: string) => void;
  collapsedActivities: Set<string>;
  onToggleActivity: (activityId: string) => void;
  onPhaseNameChange: (name: string) => void;
  onDeletePhase: () => void;
  pendingCustomActivities: PendingCustomActivity[];
  onAddCustomActivity: (phaseId: string, subPhaseId?: string) => void;
  onUpdateCustomActivity: (
    tempId: string,
    updates: Partial<PendingCustomActivity>
  ) => void;
  onRemoveCustomActivity: (tempId: string) => void;
  phaseCosts: AdditionalCost[];
  onPhaseCostsChange: (costs: AdditionalCost[]) => void;
}) {
  // Find highest ValorHora cargo among active activities for complexity feedback
  const maxCargo = useMemo(() => {
    const cargoIds = new Set<string>();
    const collectCargos = (a: EstimateActivity) => {
      const state = getActivityState(a);
      if (!state.isActive) return;
      if (state.cargoId) cargoIds.add(state.cargoId);
      const edit = activityEdits.get(a.id);
      const allocs = edit?.allocations ?? a.allocations ?? [];
      allocs.forEach((alloc) => {
        if (alloc.cargoId) cargoIds.add(alloc.cargoId);
      });
    };
    phase.activities.forEach(collectCargos);
    phase.subPhases.forEach((sp) => sp.activities.forEach(collectCargos));

    let max: { name: string; valorHora: number } | null = null;
    for (const id of cargoIds) {
      const cargo = cargos.find((c) => c.id === id);
      if (cargo && (!max || cargo.valorHora > max.valorHora)) {
        max = { name: cargo.name, valorHora: cargo.valorHora };
      }
    }
    return max;
  }, [phase, cargos, getActivityState, activityEdits]);

  const [isEditingPhaseName, setIsEditingPhaseName] = useState(false);
  const [editPhaseNameValue, setEditPhaseNameValue] = useState(phase.name);

  // Local controlled input for complexity percentage
  const [complexityInputStr, setComplexityInputStr] = useState(numStr(complexityPercent));
  useEffect(() => {
    setComplexityInputStr(numStr(complexityPercent));
  }, [complexityPercent]);

  const handleComplexityInput = useCallback((value: string) => {
    setComplexityInputStr(value);
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed > 0) {
      onComplexityChange(parsed);
    }
  }, [onComplexityChange]);

  const phaseOverhead = phaseComputed.directCost * (overheadPercent / 100);

  const directCustom = pendingCustomActivities.filter(
    (a) => a.phaseId === phase.id && !a.subPhaseId
  );

  return (
    <Collapsible open={expanded} onOpenChange={onToggle}>
      <Card
        className={isMonthlyBilling ? "border-blue-200 bg-blue-50/30" : ""}
      >
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isEditingPhaseName ? (
                  <Input
                    className="h-7 text-base font-semibold w-48"
                    value={editPhaseNameValue}
                    onChange={(e) => {
                      setEditPhaseNameValue(e.target.value);
                      onPhaseNameChange(e.target.value);
                    }}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (editPhaseNameValue.trim()) setIsEditingPhaseName(false);
                      }
                      if (e.key === "Escape") {
                        setEditPhaseNameValue(phase.name);
                        onPhaseNameChange(phase.name);
                        setIsEditingPhaseName(false);
                      }
                    }}
                    onBlur={() => {
                      if (!editPhaseNameValue.trim()) {
                        setEditPhaseNameValue(phase.name);
                        onPhaseNameChange(phase.name);
                      }
                      setIsEditingPhaseName(false);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                ) : (
                  <CardTitle
                    className="text-base cursor-pointer hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditPhaseNameValue(phase.name);
                      setIsEditingPhaseName(true);
                    }}
                  >
                    {phase.name}
                  </CardTitle>
                )}
                {phaseComputed.pendingCount > 0 && (
                  <span title={`${phaseComputed.pendingCount} atividade(s) pendente(s)`}>
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  </span>
                )}
                {isMonthlyBilling && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] bg-blue-100 text-blue-700"
                  >
                    Mensal
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3">
                {!expanded && (
                  <>
                    <span className="text-xs text-muted-foreground tabular-nums w-16 text-right">
                      {phaseComputed.totalHours.toFixed(1)}h
                    </span>
                    <span className="text-xs font-medium tabular-nums w-28 text-right">
                      {formatCurrency(phaseComputed.directCost + phaseOverhead + phaseComputed.complexityCost + phaseComputed.additionalCosts)}
                    </span>
                  </>
                )}
                <div className="flex items-center gap-1.5">
                  <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${phaseComputed.activeCount > 0 ? (phaseComputed.filledCount / phaseComputed.activeCount) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {phaseComputed.filledCount} de {phaseComputed.activeCount}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeletePhase();
                  }}
                  title="Excluir etapa"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
                <span className="text-xs text-muted-foreground">
                  {expanded ? "▼" : "▶"}
                </span>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-2">
            {/* Phase settings: monthly billing */}
            <div className="flex flex-wrap items-center gap-4 pb-3 border-b mb-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer ml-auto">
                <Checkbox
                  id={`monthly-${phase.id}`}
                  checked={isMonthlyBilling}
                  onCheckedChange={(checked) => onMonthlyChange(checked === true)}
                />
                <Label htmlFor={`monthly-${phase.id}`} className="cursor-pointer text-xs text-muted-foreground">
                  Cobrança mensal
                </Label>
              </div>
            </div>

            {/* Direct activities */}
            {phase.activities.map((activity) => {
              const edit = activityEdits.get(activity.id);
              const allocs =
                edit?.allocations ??
                (activity.allocations?.length > 0
                  ? activity.allocations.map((a) => ({
                    id: a.id,
                    cargoId: a.cargoId,
                    estimatedHours: a.estimatedHours,
                  }))
                  : []);
              return (
                <ActivityRow
                  key={activity.id}
                  activity={getActivityState(activity)}
                  cargos={cargos}
                  allocations={allocs}
                  onChange={(updates) =>
                    onActivityChange(activity.id, updates)
                  }
                  onNameChange={(name) =>
                    onActivityNameChange(activity.id, name)
                  }
                  expanded={!collapsedActivities.has(activity.id)}
                  onToggle={() => onToggleActivity(activity.id)}
                  showTemplateTag={pendingCustomActivities.length > 0}
                />
              );
            })}

            {/* Pending custom activities for this phase (direct) */}
            {directCustom.map((ca) => {
              const cargo = cargos.find((c) => c.id === ca.cargoId);
              const fakeActivity: EstimateActivity = {
                id: ca.tempId,
                name: ca.name,
                orderIndex: 0,
                cargoId: ca.cargoId,
                costPerHour: cargo?.valorHora ?? 0,
                estimatedHours: ca.estimatedHours,
                totalCost: (cargo?.valorHora ?? 0) * ca.estimatedHours,
                isActive: ca.isActive !== false,
                isCustom: true,
                checklistItems: [],
                allocations: [],
              };
              return (
                <ActivityRow
                  key={ca.tempId}
                  activity={fakeActivity}
                  cargos={cargos}
                  allocations={ca.allocations ?? []}
                  onChange={(updates) =>
                    onUpdateCustomActivity(ca.tempId, {
                      cargoId: updates.cargoId,
                      estimatedHours: updates.estimatedHours,
                      isActive: updates.isActive,
                      allocations: updates.allocations,
                    })
                  }
                  editableName
                  onNameChange={(name) =>
                    onUpdateCustomActivity(ca.tempId, { name })
                  }
                  onRemove={() => onRemoveCustomActivity(ca.tempId)}
                />
              );
            })}

            {/* Add custom activity button + activity totals (direct to phase) */}
            {phase.subPhases.length === 0 && (
              <div className="space-y-1 pl-10 pr-3">
                {/* Add activity button */}
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground"
                    onClick={() => onAddCustomActivity(phase.id)}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Adicionar atividade
                  </Button>
                </div>
                {/* Subtotal + Overhead rows */}
                {(complexityPercent > 0 || overheadPercent > 0) && (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="flex-1" />
                      <span className="w-20 shrink-0" />
                      <span className="text-xs text-muted-foreground w-36 text-right shrink-0">Subtotal atividades</span>
                      <span className="text-xs font-medium tabular-nums w-28 text-right shrink-0">
                        {formatCurrency(phaseComputed.directCost)}
                      </span>
                      <div className="w-6 shrink-0" />
                    </div>
                    {overheadPercent > 0 && phaseComputed.directCost > 0 && (
                      <div className="flex items-center gap-3">
                        <div className="flex-1" />
                        <span className="w-20 shrink-0" />
                        <span className="text-xs text-muted-foreground w-36 text-right shrink-0">Overhead ({overheadPercent}%)</span>
                        <span className="text-xs text-muted-foreground tabular-nums w-28 text-right shrink-0">
                          {formatCurrency(phaseOverhead)}
                        </span>
                        <div className="w-6 shrink-0" />
                      </div>
                    )}
                  </>
                )}
                {/* Complexity toggle row */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex rounded-md border border-input overflow-hidden">
                      <button
                        type="button"
                        className={`px-3 py-1 text-xs font-medium transition-colors ${complexityPercent === 0 ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
                        onClick={() => onComplexityChange(0)}
                      >
                        Padrão
                      </button>
                      <button
                        type="button"
                        className={`px-3 py-1 text-xs font-medium transition-colors ${complexityPercent > 0 ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
                        onClick={() => { if (complexityPercent === 0) onComplexityChange(10); }}
                      >
                        Complexo
                      </button>
                    </div>
                    {complexityPercent > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Label className="text-xs text-muted-foreground">Margem extra</Label>
                        <Input
                          type="number"
                          step="0.5"
                          min="0.5"
                          value={complexityInputStr}
                          onChange={(e) => handleComplexityInput(e.target.value)}
                          className="h-7 w-20 text-xs text-right"
                        />
                        <span className="text-xs text-muted-foreground">%</span>
                      </div>
                    )}
                    <HelpButton help={complexityHelp} iconSize={14} />
                  </div>
                  {complexityPercent > 0 && phaseComputed.directCost > 0 && (
                    <>
                      <span className="w-20 shrink-0" />
                      <span className="text-xs text-muted-foreground w-36 text-right shrink-0">Complexidade ({complexityPercent}%)</span>
                      <span className="text-xs text-muted-foreground tabular-nums w-28 text-right shrink-0">
                        {formatCurrency(phaseComputed.complexityCost)}
                      </span>
                    </>
                  )}
                  <div className="w-6 shrink-0" />
                </div>
                {/* Complexity equivalence */}
                {complexityPercent > 0 && phaseComputed.directCost > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {formatCurrency(phaseComputed.complexityCost)}
                    {maxCargo && maxCargo.valorHora > 0 && (
                      <>
                        {" — equivale a "}
                        {(phaseComputed.complexityCost / maxCargo.valorHora).toFixed(1)}
                        h de {maxCargo.name} ({formatCurrency(maxCargo.valorHora)}/h)
                      </>
                    )}
                  </div>
                )}
                {/* Total da etapa */}
                <div className="flex items-center gap-3 pt-1 border-t border-dashed">
                  <div className="flex-1" />
                  <span className="text-xs font-semibold tabular-nums w-20 text-right shrink-0">
                    {phaseComputed.totalHours.toFixed(1)}h
                  </span>
                  <span className="text-xs font-semibold w-36 text-right shrink-0">Total</span>
                  <span className="text-sm font-semibold tabular-nums w-28 text-right shrink-0">
                    {formatCurrency(phaseComputed.directCost + phaseOverhead + phaseComputed.complexityCost)}
                  </span>
                  <div className="w-6 shrink-0" />
                </div>
              </div>
            )}

            {/* SubPhases */}
            {phase.subPhases.map((subPhase) => (
              <SubPhaseSection
                key={subPhase.id}
                subPhase={subPhase}
                cargos={cargos}
                getActivityState={getActivityState}
                onActivityChange={onActivityChange}
                activityEdits={activityEdits}
                onActivityNameChange={onActivityNameChange}
                collapsedActivities={collapsedActivities}
                onToggleActivity={onToggleActivity}
                pendingCustomActivities={pendingCustomActivities.filter(
                  (a) => a.subPhaseId === subPhase.id
                )}
                onAddCustomActivity={onAddCustomActivity}
                onUpdateCustomActivity={onUpdateCustomActivity}
                onRemoveCustomActivity={onRemoveCustomActivity}
              />
            ))}

            {/* Complexity toggle for subPhases case */}
            {phase.subPhases.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <div className="flex flex-wrap items-center gap-3">
                  <Label className="text-xs text-muted-foreground">Complexidade:</Label>
                  <div className="flex rounded-md border border-input overflow-hidden">
                    <button
                      type="button"
                      className={`px-3 py-1 text-xs font-medium transition-colors ${complexityPercent === 0 ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
                      onClick={() => onComplexityChange(0)}
                    >
                      Padrão
                    </button>
                    <button
                      type="button"
                      className={`px-3 py-1 text-xs font-medium transition-colors ${complexityPercent > 0 ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
                      onClick={() => { if (complexityPercent === 0) onComplexityChange(10); }}
                    >
                      Complexo
                    </button>
                  </div>
                  {complexityPercent > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Label className="text-xs text-muted-foreground">Margem extra</Label>
                      <Input
                        type="number"
                        step="0.5"
                        min="0.5"
                        value={complexityInputStr}
                        onChange={(e) => handleComplexityInput(e.target.value)}
                        className="h-7 w-20 text-xs text-right"
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                  )}
                  <HelpButton help={complexityHelp} iconSize={14} />
                </div>
                {complexityPercent > 0 && phaseComputed.directCost > 0 && (
                  <div className="mt-1.5 text-xs text-muted-foreground">
                    {formatCurrency(phaseComputed.complexityCost)}
                    {maxCargo && maxCargo.valorHora > 0 && (
                      <>
                        {" — equivale a "}
                        {(phaseComputed.complexityCost / maxCargo.valorHora).toFixed(1)}
                        h de {maxCargo.name} ({formatCurrency(maxCargo.valorHora)}/h)
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Per-phase Additional Costs */}
            <div className="mt-3 pt-3 border-t">
              <AdditionalCosts
                costs={phaseCosts}
                onChange={onPhaseCostsChange}
              />
            </div>

            {/* Phase footer totals (shown only when expanded) */}
            <div className="mt-3 pt-3 border-t space-y-1">
              {(complexityPercent > 0 || overheadPercent > 0) && phaseComputed.directCost > 0 && (
                <div className="flex items-center gap-3 px-3">
                  <div className="flex-1" />
                  <span className="w-20 shrink-0" />
                  <span className="text-xs font-semibold w-36 text-right shrink-0">Total</span>
                  <span className="text-sm font-semibold tabular-nums w-28 text-right shrink-0">
                    {formatCurrency(phaseComputed.directCost + phaseOverhead + phaseComputed.complexityCost + phaseComputed.additionalCosts)}
                  </span>
                  <div className="w-6 shrink-0" />
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

// ─── SubPhase Section ───────────────────────────────────────────────────────

function SubPhaseSection({
  subPhase,
  cargos,
  getActivityState,
  onActivityChange,
  activityEdits,
  onActivityNameChange,
  collapsedActivities,
  onToggleActivity,
  pendingCustomActivities,
  onAddCustomActivity,
  onUpdateCustomActivity,
  onRemoveCustomActivity,
}: {
  subPhase: EstimateSubPhase;
  cargos: Cargo[];
  getActivityState: (activity: EstimateActivity) => EstimateActivity;
  onActivityChange: (
    activityId: string,
    updates: {
      cargoId?: string;
      estimatedHours: number;
      isActive: boolean;
      allocations?: AllocationEdit[];
    }
  ) => void;
  activityEdits: Map<string, { allocations?: AllocationEdit[] }>;
  onActivityNameChange: (activityId: string, name: string) => void;
  collapsedActivities: Set<string>;
  onToggleActivity: (activityId: string) => void;
  pendingCustomActivities: PendingCustomActivity[];
  onAddCustomActivity: (phaseId: string, subPhaseId?: string) => void;
  onUpdateCustomActivity: (
    tempId: string,
    updates: Partial<PendingCustomActivity>
  ) => void;
  onRemoveCustomActivity: (tempId: string) => void;
}) {
  return (
    <div className="ml-4 border-l-2 border-border pl-4 space-y-1">
      <p className="text-sm font-medium text-muted-foreground py-1">
        {subPhase.name}
      </p>
      {subPhase.activities.map((activity) => {
        const edit = activityEdits.get(activity.id);
        const allocs =
          edit?.allocations ??
          (activity.allocations?.length > 0
            ? activity.allocations.map((a) => ({
              id: a.id,
              cargoId: a.cargoId,
              estimatedHours: a.estimatedHours,
            }))
            : []);
        return (
          <ActivityRow
            key={activity.id}
            activity={getActivityState(activity)}
            cargos={cargos}
            allocations={allocs}
            onChange={(updates) => onActivityChange(activity.id, updates)}
            onNameChange={(name) => onActivityNameChange(activity.id, name)}
            expanded={!collapsedActivities.has(activity.id)}
            onToggle={() => onToggleActivity(activity.id)}
            showTemplateTag={pendingCustomActivities.length > 0}
          />
        );
      })}
      {pendingCustomActivities.map((ca) => {
        const cargo = cargos.find((c) => c.id === ca.cargoId);
        const fakeActivity: EstimateActivity = {
          id: ca.tempId,
          name: ca.name,
          orderIndex: 0,
          cargoId: ca.cargoId,
          costPerHour: cargo?.valorHora ?? 0,
          estimatedHours: ca.estimatedHours,
          totalCost: (cargo?.valorHora ?? 0) * ca.estimatedHours,
          isActive: ca.isActive !== false,
          isCustom: true,
          checklistItems: [],
          allocations: [],
        };
        return (
          <ActivityRow
            key={ca.tempId}
            activity={fakeActivity}
            cargos={cargos}
            allocations={ca.allocations ?? []}
            onChange={(updates) =>
              onUpdateCustomActivity(ca.tempId, {
                cargoId: updates.cargoId,
                estimatedHours: updates.estimatedHours,
                isActive: updates.isActive,
                allocations: updates.allocations,
              })
            }
            editableName
            onNameChange={(name) =>
              onUpdateCustomActivity(ca.tempId, { name })
            }
            onRemove={() => onRemoveCustomActivity(ca.tempId)}
          />
        );
      })}
      <Button
        variant="ghost"
        size="sm"
        className="text-xs text-muted-foreground"
        onClick={() => onAddCustomActivity(subPhase.id, subPhase.id)}
      >
        <Plus className="h-3 w-3 mr-1" /> Adicionar atividade
      </Button>
    </div>
  );
}
