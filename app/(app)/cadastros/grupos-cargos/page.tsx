"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import type { HelpContent } from "@/components/shared/help-button";
import { GrupoCard } from "@/components/cadastros/grupo-card";
import { GrupoDialog } from "@/components/cadastros/grupo-dialog";
import { ReassignCargosModal } from "@/components/cadastros/reassign-cargos-modal";
import { CargoDialog } from "@/components/cadastros/cargo-dialog";
import {
  getGruposColaboradores,
  deleteGrupoColaborador,
} from "@/lib/api/overhead";
import { getCargos, deleteCargo } from "@/lib/api/cargos";
import type { GrupoColaboradorDto } from "@/lib/types/overhead";
import type { Cargo } from "@/lib/types/cargos";

const gruposCargosHelp: HelpContent = {
  title: "Grupos e Cargos",
  sections: [
    {
      heading: "O que são grupos",
      content:
        "Grupos organizam os cargos do escritório. Cada grupo pode ser associado a uma categoria de overhead (Pessoal ou Operações Internas). Grupos sem categoria aparecem como 'Órfão'.",
    },
    {
      heading: "Cargos dentro de grupos",
      content:
        "Cada cargo pertence a um grupo e define o valor/hora usado na precificação de projetos. Colaboradores são vinculados a cargos.",
    },
    {
      heading: "Excluindo um grupo",
      content:
        "Ao excluir um grupo com cargos, você precisa mover os cargos para outro grupo antes da exclusão.",
    },
    {
      heading: "Status do grupo",
      content:
        "Pessoal: associado à categoria de pessoal no overhead. Operações Internas: associado a outra categoria. Órfão: sem categoria associada.",
    },
  ],
};

export default function GruposCargosPage() {
  const queryClient = useQueryClient();

  // Grupo dialog state
  const [grupoDialogOpen, setGrupoDialogOpen] = useState(false);
  const [selectedGrupo, setSelectedGrupo] = useState<GrupoColaboradorDto | null>(null);

  // Reassign modal state
  const [reassignOpen, setReassignOpen] = useState(false);
  const [grupoToDelete, setGrupoToDelete] = useState<GrupoColaboradorDto | null>(null);

  // Cargo dialog state
  const [cargoDialogOpen, setCargoDialogOpen] = useState(false);
  const [selectedCargo, setSelectedCargo] = useState<Cargo | null>(null);
  const [preselectedGrupoId, setPreselectedGrupoId] = useState<string>("");

  // Queries
  const { data: grupos, isLoading: gruposLoading } = useQuery({
    queryKey: ["grupos-colaboradores"],
    queryFn: getGruposColaboradores,
  });

  const { data: cargos } = useQuery({
    queryKey: ["cargos"],
    queryFn: () => getCargos(),
  });

  // Mutations
  const deleteGrupoMutation = useMutation({
    mutationFn: ({ id, reassignTo }: { id: string; reassignTo?: string }) =>
      deleteGrupoColaborador(id, reassignTo),
    onSuccess: () => {
      toast.success("Grupo excluído.");
      queryClient.invalidateQueries({ queryKey: ["grupos-colaboradores"] });
      queryClient.invalidateQueries({ queryKey: ["cargos"] });
      setReassignOpen(false);
      setGrupoToDelete(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erro ao excluir grupo.");
    },
  });

  const deleteCargoMutation = useMutation({
    mutationFn: deleteCargo,
    onSuccess: () => {
      toast.success("Cargo excluído.");
      queryClient.invalidateQueries({ queryKey: ["cargos"] });
      queryClient.invalidateQueries({ queryKey: ["grupos-colaboradores"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erro ao excluir cargo.");
    },
  });

  // Group cargos by grupo
  const cargosByGrupo = (cargos ?? []).reduce<Record<string, Cargo[]>>(
    (acc, cargo) => {
      const key = cargo.grupoColaboradorId;
      if (!acc[key]) acc[key] = [];
      acc[key].push(cargo);
      return acc;
    },
    {}
  );

  // Handlers
  const handleNewGrupo = () => {
    setSelectedGrupo(null);
    setGrupoDialogOpen(true);
  };

  const handleEditGrupo = (grupo: GrupoColaboradorDto) => {
    setSelectedGrupo(grupo);
    setGrupoDialogOpen(true);
  };

  const handleDeleteGrupo = (grupo: GrupoColaboradorDto) => {
    if (grupo.cargosCount > 0) {
      setGrupoToDelete(grupo);
      setReassignOpen(true);
    } else {
      if (confirm(`Excluir o grupo "${grupo.name}"? Esta ação não pode ser desfeita.`)) {
        deleteGrupoMutation.mutate({ id: grupo.id });
      }
    }
  };

  const handleReassignConfirm = (targetGrupoId: string) => {
    if (grupoToDelete) {
      deleteGrupoMutation.mutate({
        id: grupoToDelete.id,
        reassignTo: targetGrupoId,
      });
    }
  };

  const handleNewCargo = (grupoId: string) => {
    setSelectedCargo(null);
    setPreselectedGrupoId(grupoId);
    setCargoDialogOpen(true);
  };

  const handleEditCargo = (cargo: Cargo) => {
    setSelectedCargo(cargo);
    setPreselectedGrupoId("");
    setCargoDialogOpen(true);
  };

  const handleDeleteCargo = (cargo: Cargo) => {
    if (confirm(`Excluir o cargo "${cargo.name}"? Esta ação não pode ser desfeita.`)) {
      deleteCargoMutation.mutate(cargo.id);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Grupos e Cargos"
        description="Organize grupos e cargos do escritório"
        help={gruposCargosHelp}
        action={
          <Button onClick={handleNewGrupo}>
            <Plus className="mr-2 h-4 w-4" /> Novo Grupo
          </Button>
        }
      />

      {gruposLoading && (
        <div className="text-center text-muted-foreground py-12">
          Carregando...
        </div>
      )}

      {!gruposLoading && grupos?.length === 0 && (
        <div className="text-center text-muted-foreground py-12">
          Nenhum grupo cadastrado. Crie o primeiro grupo para começar.
        </div>
      )}

      <div className="space-y-3">
        {grupos?.map((grupo) => (
          <GrupoCard
            key={grupo.id}
            grupo={grupo}
            cargos={cargosByGrupo[grupo.id] ?? []}
            onEditGrupo={handleEditGrupo}
            onDeleteGrupo={handleDeleteGrupo}
            onNewCargo={handleNewCargo}
            onEditCargo={handleEditCargo}
            onDeleteCargo={handleDeleteCargo}
          />
        ))}
      </div>

      <GrupoDialog
        open={grupoDialogOpen}
        onOpenChange={setGrupoDialogOpen}
        grupo={selectedGrupo}
      />

      <ReassignCargosModal
        open={reassignOpen}
        onOpenChange={setReassignOpen}
        grupoToDelete={grupoToDelete}
        availableGrupos={grupos ?? []}
        onConfirm={handleReassignConfirm}
        isPending={deleteGrupoMutation.isPending}
      />

      <CargoDialog
        open={cargoDialogOpen}
        onOpenChange={(open) => {
          setCargoDialogOpen(open);
          if (!open) {
            setPreselectedGrupoId("");
            queryClient.invalidateQueries({ queryKey: ["grupos-colaboradores"] });
          }
        }}
        cargo={selectedCargo}
      />
    </div>
  );
}
