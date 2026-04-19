"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Tool name → query keys to invalidate.
 * Any page using React Query will auto-refetch when these keys are invalidated.
 */
const TOOL_QUERY_MAP: Record<string, string[][]> = {
  // Cargos
  CriarCargo: [["grupos-colaboradores"], ["cargos"]],
  AtualizarCargo: [["grupos-colaboradores"], ["cargos"]],
  ExcluirCargo: [["grupos-colaboradores"], ["cargos"]],
  // Colaboradores
  CriarColaborador: [["colaboradores"]],
  AtualizarColaborador: [["colaboradores"], ["colaborador"]],
  DesativarColaborador: [["colaboradores"], ["colaborador"]],
  // Overhead
  AtualizarCategoria: [["overhead"]],
  AtualizarCustItem: [["overhead"]],
  // Estimativas
  CriarEstimativa: [["estimativas"]],
  AtualizarEstimativa: [["estimativas"], ["estimativa"]],
  // Propostas
  CriarProposta: [["propostas"]],
  AtualizarProposta: [["propostas"], ["proposta"]],
};

/**
 * Hook: listens for `manga:data:changed` events from the chat
 * and invalidates matching React Query keys.
 *
 * Usage: call once in any layout or page component.
 * No props needed — it auto-detects which queries to invalidate.
 */
export function useDataChanged() {
  const queryClient = useQueryClient();

  useEffect(() => {
    function handleDataChanged(e: Event) {
      const { toolName } = (e as CustomEvent<{ toolName: string | null }>).detail;
      if (!toolName) return;

      const keys = TOOL_QUERY_MAP[toolName];
      if (keys) {
        keys.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey });
        });
      } else {
        // Unknown tool — invalidate everything as fallback
        queryClient.invalidateQueries();
      }
    }

    window.addEventListener("manga:data:changed", handleDataChanged);
    return () => window.removeEventListener("manga:data:changed", handleDataChanged);
  }, [queryClient]);
}
