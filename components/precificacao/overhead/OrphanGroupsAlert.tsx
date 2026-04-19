"use client";

import { AlertTriangle, Users } from "lucide-react";
import type { OrphanGroupDto } from "@/lib/types/overhead";

interface Props {
  orphanGroups: OrphanGroupDto[];
}

export function OrphanGroupsAlert({ orphanGroups }: Props) {
  if (orphanGroups.length === 0) return null;

  const totalColaboradores = orphanGroups.reduce(
    (sum, g) => sum + g.colaboradoresCount,
    0
  );

  return (
    <div className="rounded-md border border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
        <div className="space-y-2">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            {orphanGroups.length} grupo(s) sem categoria associada
          </p>
          <p className="text-xs text-yellow-700 dark:text-yellow-300">
            Colaboradores nesses grupos ({totalColaboradores}) não são contabilizados
            no cálculo de overhead. Associe os grupos a uma categoria abaixo.
          </p>
          <div className="flex flex-wrap gap-2 mt-1">
            {orphanGroups.map((g) => (
              <span
                key={g.id}
                className="inline-flex items-center gap-1 rounded-full bg-yellow-100 dark:bg-yellow-900/40 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:text-yellow-200"
              >
                {g.name}
                <Users className="h-3 w-3" />
                {g.colaboradoresCount}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
