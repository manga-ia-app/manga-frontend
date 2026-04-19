import apiClient from "./client";
import type { ServicoContratado, PagedResult } from "@/lib/types";
import type { QueryParams } from "./cadastros";

// --- Servicos Contratados ---

export async function getServicosContratados(
  projetoId: string,
  params?: QueryParams
): Promise<PagedResult<ServicoContratado>> {
  const response = await apiClient.get<PagedResult<ServicoContratado>>(
    `/projetos/${projetoId}/servicos-contratados`,
    { params }
  );
  return response.data;
}

export async function getServicoContratadoById(
  projetoId: string,
  id: string
): Promise<ServicoContratado> {
  const response = await apiClient.get<ServicoContratado>(
    `/projetos/${projetoId}/servicos-contratados/${id}`
  );
  return response.data;
}

export async function createServicoContratado(
  projetoId: string,
  data: Record<string, unknown>
): Promise<ServicoContratado> {
  const response = await apiClient.post<ServicoContratado>(
    `/projetos/${projetoId}/servicos-contratados`,
    data
  );
  return response.data;
}

export async function updateServicoContratado(
  projetoId: string,
  id: string,
  data: Record<string, unknown>
): Promise<ServicoContratado> {
  const response = await apiClient.put<ServicoContratado>(
    `/projetos/${projetoId}/servicos-contratados/${id}`,
    data
  );
  return response.data;
}

export async function deleteServicoContratado(
  projetoId: string,
  id: string
): Promise<void> {
  await apiClient.delete(
    `/projetos/${projetoId}/servicos-contratados/${id}`
  );
}
