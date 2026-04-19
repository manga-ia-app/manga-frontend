import apiClient from "./client";
import type { CronogramaTarefa, PagedResult } from "@/lib/types";
import type { QueryParams } from "./cadastros";

// --- Tarefas ---

export async function getCronogramaTarefas(
  projetoId: string,
  params?: QueryParams
): Promise<PagedResult<CronogramaTarefa>> {
  const response = await apiClient.get<PagedResult<CronogramaTarefa>>(
    `/projetos/${projetoId}/cronograma/tarefas`,
    { params }
  );
  return response.data;
}

export async function getCronogramaTarefaById(
  projetoId: string,
  id: string
): Promise<CronogramaTarefa> {
  const response = await apiClient.get<CronogramaTarefa>(
    `/projetos/${projetoId}/cronograma/tarefas/${id}`
  );
  return response.data;
}

export async function createCronogramaTarefa(
  projetoId: string,
  data: Record<string, unknown>
): Promise<CronogramaTarefa> {
  const response = await apiClient.post<CronogramaTarefa>(
    `/projetos/${projetoId}/cronograma/tarefas`,
    data
  );
  return response.data;
}

export async function updateCronogramaTarefa(
  projetoId: string,
  id: string,
  data: Record<string, unknown>
): Promise<CronogramaTarefa> {
  const response = await apiClient.put<CronogramaTarefa>(
    `/projetos/${projetoId}/cronograma/tarefas/${id}`,
    data
  );
  return response.data;
}

export async function deleteCronogramaTarefa(
  projetoId: string,
  id: string
): Promise<void> {
  await apiClient.delete(`/projetos/${projetoId}/cronograma/tarefas/${id}`);
}
