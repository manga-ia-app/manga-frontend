"use client";

import { Lock } from "lucide-react";
import type { SyncedCollaboratorDto } from "@/lib/types/overhead";

const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

interface Props {
  collaborator: SyncedCollaboratorDto;
}

export function SyncedCollaboratorRow({ collaborator }: Props) {
  return (
    <div className="flex items-center justify-between py-1.5 px-2 rounded-md bg-muted/30">
      <div className="flex items-center gap-2">
        <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
        <span className="text-sm">{collaborator.name}</span>
      </div>
      <span className="text-sm font-medium tabular-nums">
        {brl(collaborator.custoTotalMensal)}/mês
      </span>
    </div>
  );
}
