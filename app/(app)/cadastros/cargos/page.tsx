"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import type { HelpContent } from "@/components/shared/help-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CargoDialog } from "@/components/cadastros/cargo-dialog";
import { getCargos, deleteCargo } from "@/lib/api/cargos";
import { extractApiError } from "@/lib/api/error";
import { getGruposColaboradores } from "@/lib/api/overhead";
import type { Cargo } from "@/lib/types/cargos";

const cargosHelp: HelpContent = {
  title: "Cadastro de Cargos",
  sections: [
    {
      heading: "Como cadastrar cargos",
      content:
        "Cadastre os cargos do escritório com nome, grupo e valor/hora. O valor/hora é usado como base para precificação de projetos.",
    },
    {
      heading: "Cargo nas propostas",
      content:
        "Ao gerar uma proposta, o valor/hora do cargo é capturado como snapshot. Alterações futuras no cargo não afetam propostas já geradas.",
    },
    {
      heading: "Cargo e colaboradores",
      content:
        "Cada colaborador é vinculado a um cargo. Ao editar o valor/hora, o sistema exibe como referência o custo real mínimo, médio e máximo dos colaboradores daquele cargo.",
    },
    {
      heading: "Cargo no overhead",
      content:
        "Os colaboradores vinculados ao cargo compõem o custo base de pessoal na configuração de overhead do escritório.",
    },
    {
      heading: "Cargo na precificação",
      content:
        "O valor/hora do cargo é a base para cálculo de honorários por hora em simulações de precificação.",
    },
  ],
};

const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v);

export default function CargosPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [grupoFilter, setGrupoFilter] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCargo, setSelectedCargo] = useState<Cargo | null>(null);

  const deleteMutation = useMutation({
    mutationFn: deleteCargo,
    onSuccess: () => {
      toast.success("Cargo excluído.");
      queryClient.invalidateQueries({ queryKey: ["cargos"] });
    },
    onError: (err) => {
      toast.error(extractApiError(err, "Erro ao excluir cargo."));
    },
  });

  const { data: grupos } = useQuery({
    queryKey: ["grupos-colaboradores"],
    queryFn: getGruposColaboradores,
  });

  const { data: cargos, isLoading } = useQuery({
    queryKey: ["cargos", grupoFilter, search],
    queryFn: () =>
      getCargos({
        grupoId: grupoFilter || undefined,
        search: search || undefined,
      }),
  });

  const handleCreate = () => {
    setSelectedCargo(null);
    setDialogOpen(true);
  };

  const handleEdit = (cargo: Cargo) => {
    setSelectedCargo(cargo);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cargos"
        description="Gerencie os cargos e seus valores de hora"
        help={cargosHelp}
        action={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" /> Novo Cargo
          </Button>
        }
      />

      <div className="flex gap-2">
        <Input
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
          aria-label="Buscar cargos por nome"
        />
        <Select
          value={grupoFilter || "all"}
          onValueChange={(val) => setGrupoFilter(val === "all" ? "" : val)}
        >
          <SelectTrigger className="h-10 w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Filtrar por grupo">
            <SelectValue placeholder="Todos os grupos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os grupos</SelectItem>
            {grupos?.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Grupo</TableHead>
              <TableHead className="text-right">Valor/Hora</TableHead>
              <TableHead className="text-right">Colaboradores</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground py-8"
                >
                  Carregando...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && cargos?.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground py-8"
                >
                  Nenhum cargo encontrado.
                </TableCell>
              </TableRow>
            )}
            {cargos?.map((cargo) => (
              <TableRow key={cargo.id}>
                <TableCell className="font-medium">{cargo.name}</TableCell>
                <TableCell>{cargo.grupoColaboradorName}</TableCell>
                <TableCell className="text-right">
                  {brl(cargo.valorHora)}/h
                </TableCell>
                <TableCell className="text-right">
                  {cargo.colaboradoresCount}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Editar ${cargo.name}`}
                      onClick={() => handleEdit(cargo)}
                    >
                      <Pencil size={14} aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      aria-label={`Excluir ${cargo.name}`}
                      onClick={() => {
                        if (
                          confirm(
                            `Excluir "${cargo.name}"? Esta ação não pode ser desfeita.`
                          )
                        ) {
                          deleteMutation.mutate(cargo.id);
                        }
                      }}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <CargoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        cargo={selectedCargo}
      />
    </div>
  );
}
