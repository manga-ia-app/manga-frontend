import apiClient from "./client";
import type {
  LancamentoFinanceiro,
  Parcela,
  FinancialSummary,
  PagedResult,
} from "@/lib/types";
import type { QueryParams } from "./cadastros";

// --- Lancamentos ---

export async function getLancamentos(
  projetoId: string,
  params?: QueryParams
): Promise<PagedResult<LancamentoFinanceiro>> {
  const response = await apiClient.get<PagedResult<LancamentoFinanceiro>>(
    `/projetos/${projetoId}/financeiro/lancamentos`,
    { params }
  );
  return response.data;
}

export async function getLancamentoById(
  projetoId: string,
  id: string
): Promise<LancamentoFinanceiro> {
  const response = await apiClient.get<LancamentoFinanceiro>(
    `/projetos/${projetoId}/financeiro/lancamentos/${id}`
  );
  return response.data;
}

export async function createLancamento(
  projetoId: string,
  data: Record<string, unknown>
): Promise<LancamentoFinanceiro> {
  const response = await apiClient.post<LancamentoFinanceiro>(
    `/projetos/${projetoId}/financeiro/lancamentos`,
    data
  );
  return response.data;
}

export async function updateLancamento(
  projetoId: string,
  id: string,
  data: Record<string, unknown>
): Promise<LancamentoFinanceiro> {
  const response = await apiClient.put<LancamentoFinanceiro>(
    `/projetos/${projetoId}/financeiro/lancamentos/${id}`,
    data
  );
  return response.data;
}

export async function deleteLancamento(
  projetoId: string,
  id: string
): Promise<void> {
  await apiClient.delete(
    `/projetos/${projetoId}/financeiro/lancamentos/${id}`
  );
}

// --- Parcelas ---

export async function getParcelas(
  projetoId: string,
  lancamentoId: string
): Promise<Parcela[]> {
  const response = await apiClient.get<Parcela[]>(
    `/projetos/${projetoId}/financeiro/lancamentos/${lancamentoId}/parcelas`
  );
  return response.data;
}

// --- Summary ---

export async function getFinancialSummary(
  projetoId: string
): Promise<FinancialSummary> {
  const response = await apiClient.get<FinancialSummary>(
    `/projetos/${projetoId}/financeiro/summary`
  );
  return response.data;
}
