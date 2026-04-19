import apiClient from "./client";
import type { AgendaEvento, PagedResult } from "@/lib/types";
import type { QueryParams } from "./cadastros";

// --- Eventos ---

export async function getEventos(
  params?: QueryParams
): Promise<PagedResult<AgendaEvento>> {
  const response = await apiClient.get<PagedResult<AgendaEvento>>(
    "/agenda/eventos",
    { params }
  );
  return response.data;
}

export async function getEventoById(id: string): Promise<AgendaEvento> {
  const response = await apiClient.get<AgendaEvento>(
    `/agenda/eventos/${id}`
  );
  return response.data;
}

export async function createEvento(
  data: Record<string, unknown>
): Promise<AgendaEvento> {
  const response = await apiClient.post<AgendaEvento>(
    "/agenda/eventos",
    data
  );
  return response.data;
}

export async function updateEvento(
  id: string,
  data: Record<string, unknown>
): Promise<AgendaEvento> {
  const response = await apiClient.put<AgendaEvento>(
    `/agenda/eventos/${id}`,
    data
  );
  return response.data;
}

export async function deleteEvento(id: string): Promise<void> {
  await apiClient.delete(`/agenda/eventos/${id}`);
}
