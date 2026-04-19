"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  Plus,
  Users,
  Briefcase,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { GrupoColaboradorDto } from "@/lib/types/overhead";
import type { Cargo } from "@/lib/types/cargos";

const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v);

interface GrupoCardProps {
  grupo: GrupoColaboradorDto;
  cargos: Cargo[];
  onEditGrupo: (grupo: GrupoColaboradorDto) => void;
  onDeleteGrupo: (grupo: GrupoColaboradorDto) => void;
  onNewCargo: (grupoId: string) => void;
  onEditCargo: (cargo: Cargo) => void;
  onDeleteCargo: (cargo: Cargo) => void;
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "Pessoal":
      return (
        <Badge variant="default" className="bg-blue-600 text-xs">
          Pessoal
        </Badge>
      );
    case "Operações Internas":
      return (
        <Badge variant="secondary" className="text-xs">
          Operações Internas
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="border-yellow-500 text-yellow-600 text-xs">
          Órfão
        </Badge>
      );
  }
}

export function GrupoCard({
  grupo,
  cargos,
  onEditGrupo,
  onDeleteGrupo,
  onNewCargo,
  onEditCargo,
  onDeleteCargo,
}: GrupoCardProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-md border">
        <div className="flex w-full items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-3 flex-1 min-w-0"
            >
              {isOpen ? (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <span className="font-semibold text-sm">{grupo.name}</span>
              <StatusBadge status={grupo.status} />
            </button>
          </CollapsibleTrigger>
          <div className="flex items-center gap-3 ml-auto text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Briefcase className="h-3 w-3" />
              {grupo.cargosCount} cargo(s)
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {grupo.colaboradoresCount} colaborador(es)
            </span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label={`Editar grupo ${grupo.name}`}
                onClick={() => onEditGrupo(grupo)}
              >
                <Pencil size={14} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                aria-label={`Excluir grupo ${grupo.name}`}
                onClick={() => onDeleteGrupo(grupo)}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        </div>

        <CollapsibleContent>
          <div className="border-t">
            {cargos.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                Nenhum cargo neste grupo.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-10">Nome</TableHead>
                    <TableHead className="text-right">Valor/Hora</TableHead>
                    <TableHead className="text-right">Colaboradores</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cargos.map((cargo) => (
                    <TableRow key={cargo.id}>
                      <TableCell className="pl-10 font-medium">
                        {cargo.name}
                      </TableCell>
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
                            className="h-7 w-7"
                            aria-label={`Editar ${cargo.name}`}
                            onClick={() => onEditCargo(cargo)}
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            aria-label={`Excluir ${cargo.name}`}
                            onClick={() => onDeleteCargo(cargo)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <div className="px-4 py-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => onNewCargo(grupo.id)}
              >
                <Plus className="mr-1 h-3 w-3" /> Novo Cargo
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
