import apiClient from "./client";
import type {
  OrcamentoCategoria,
  OrcamentoItem,
  OrcamentoSummary,
  PagedResult,
} from "@/lib/types";
import type { QueryParams } from "./cadastros";

// --- Categorias ---

export async function getOrcamentoCategorias(
  projetoId: string,
  params?: QueryParams
): Promise<OrcamentoCategoria[]> {
  const response = await apiClient.get<OrcamentoCategoria[]>(
    `/projetos/${projetoId}/orcamento/categorias`,
    { params }
  );
  return response.data;
}

export async function createOrcamentoCategoria(
  projetoId: string,
  data: Record<string, unknown>
): Promise<OrcamentoCategoria> {
  const response = await apiClient.post<OrcamentoCategoria>(
    `/projetos/${projetoId}/orcamento/categorias`,
    data
  );
  return response.data;
}

export async function updateOrcamentoCategoria(
  projetoId: string,
  id: string,
  data: Record<string, unknown>
): Promise<OrcamentoCategoria> {
  const response = await apiClient.put<OrcamentoCategoria>(
    `/projetos/${projetoId}/orcamento/categorias/${id}`,
    data
  );
  return response.data;
}

export async function deleteOrcamentoCategoria(
  projetoId: string,
  id: string
): Promise<void> {
  await apiClient.delete(`/projetos/${projetoId}/orcamento/categorias/${id}`);
}

// --- Itens ---

export async function getOrcamentoItens(
  projetoId: string,
  params?: QueryParams
): Promise<PagedResult<OrcamentoItem>> {
  const response = await apiClient.get<PagedResult<OrcamentoItem>>(
    `/projetos/${projetoId}/orcamento/itens`,
    { params }
  );
  return response.data;
}

export async function createOrcamentoItem(
  projetoId: string,
  data: Record<string, unknown>
): Promise<OrcamentoItem> {
  const response = await apiClient.post<OrcamentoItem>(
    `/projetos/${projetoId}/orcamento/itens`,
    data
  );
  return response.data;
}

export async function updateOrcamentoItem(
  projetoId: string,
  id: string,
  data: Record<string, unknown>
): Promise<OrcamentoItem> {
  const response = await apiClient.put<OrcamentoItem>(
    `/projetos/${projetoId}/orcamento/itens/${id}`,
    data
  );
  return response.data;
}

export async function deleteOrcamentoItem(
  projetoId: string,
  id: string
): Promise<void> {
  await apiClient.delete(`/projetos/${projetoId}/orcamento/itens/${id}`);
}

// --- Summary ---

export async function getOrcamentoSummary(
  projetoId: string
): Promise<OrcamentoSummary> {
  const response = await apiClient.get<OrcamentoSummary>(
    `/projetos/${projetoId}/orcamento/summary`
  );
  return response.data;
}
