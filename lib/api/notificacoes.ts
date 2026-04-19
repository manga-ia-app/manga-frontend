import apiClient from "./client";
import type { Notificacao, PagedResult } from "@/lib/types";
import type { QueryParams } from "./cadastros";

// --- Notificacoes ---

export async function getNotificacoes(
  params?: QueryParams
): Promise<PagedResult<Notificacao>> {
  const response = await apiClient.get<PagedResult<Notificacao>>(
    "/notificacoes",
    { params }
  );
  return response.data;
}

export async function markNotificacaoAsRead(id: string): Promise<void> {
  await apiClient.put(`/notificacoes/${id}/read`);
}

export async function markAllNotificacoesAsRead(): Promise<void> {
  await apiClient.put("/notificacoes/read-all");
}
