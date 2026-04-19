import apiClient from "./client";
import type { AssinaturaProcesso, PagedResult } from "@/lib/types";
import type { QueryParams } from "./cadastros";

// --- Processos de Assinatura ---

export async function getAssinaturas(
  projetoId: string,
  params?: QueryParams
): Promise<PagedResult<AssinaturaProcesso>> {
  const response = await apiClient.get<PagedResult<AssinaturaProcesso>>(
    `/projetos/${projetoId}/assinaturas`,
    { params }
  );
  return response.data;
}

export async function getAssinaturaById(
  projetoId: string,
  id: string
): Promise<AssinaturaProcesso> {
  const response = await apiClient.get<AssinaturaProcesso>(
    `/projetos/${projetoId}/assinaturas/${id}`
  );
  return response.data;
}

export async function createAssinatura(
  projetoId: string,
  data: Record<string, unknown>
): Promise<AssinaturaProcesso> {
  const response = await apiClient.post<AssinaturaProcesso>(
    `/projetos/${projetoId}/assinaturas`,
    data
  );
  return response.data;
}

export async function cancelAssinatura(
  projetoId: string,
  id: string
): Promise<AssinaturaProcesso> {
  const response = await apiClient.put<AssinaturaProcesso>(
    `/projetos/${projetoId}/assinaturas/${id}`,
    { status: "Cancelled" }
  );
  return response.data;
}

export async function sendAssinaturaForSignature(
  projetoId: string,
  id: string
): Promise<AssinaturaProcesso> {
  const response = await apiClient.post<AssinaturaProcesso>(
    `/projetos/${projetoId}/assinaturas/${id}/send`
  );
  return response.data;
}
