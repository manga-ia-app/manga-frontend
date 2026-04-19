import apiClient from "./client";
import type {
  ConfiguracaoEscritorio,
  PricingProposal,
  PricingProposalStatus,
  ProposalListItem,
  PagedResult,
  UpdateProposalRequest,
} from "@/lib/types";

// --- Configuracao do Escritorio ---

export async function getConfiguracaoEscritorio(): Promise<ConfiguracaoEscritorio | null> {
  try {
    const response = await apiClient.get<ConfiguracaoEscritorio>("/configuracao-escritorio");
    return response.data;
  } catch (error: unknown) {
    const axiosError = error as { response?: { status?: number } };
    if (axiosError.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function createConfiguracaoEscritorio(
  data: Omit<ConfiguracaoEscritorio, "id" | "custoMensalTotal" | "capacidadeHorasFaturaveis" | "custoHoraReal" | "faturamentoMinimoNecessario">
): Promise<string> {
  const response = await apiClient.post<string>("/configuracao-escritorio", data);
  return response.data;
}

export async function updateConfiguracaoEscritorio(
  id: string,
  data: Omit<ConfiguracaoEscritorio, "id" | "custoMensalTotal" | "capacidadeHorasFaturaveis" | "custoHoraReal" | "faturamentoMinimoNecessario">
): Promise<string> {
  const response = await apiClient.put<string>(`/configuracao-escritorio/${id}`, data);
  return response.data;
}

// --- Proposals ---

// UpdateProposalData is an alias for UpdateProposalRequest from types
export type UpdateProposalData = UpdateProposalRequest;

export async function getProposals(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<PagedResult<ProposalListItem>> {
  const response = await apiClient.get<PagedResult<ProposalListItem>>("/proposals", { params });
  return response.data;
}

export async function getProposalById(id: string): Promise<PricingProposal> {
  const response = await apiClient.get<PricingProposal>(`/proposals/${id}`);
  return response.data;
}

export async function updateProposal(id: string, data: UpdateProposalData): Promise<{ id: string }> {
  const response = await apiClient.put<{ id: string }>(`/proposals/${id}`, data);
  return response.data;
}

export async function deleteProposal(id: string): Promise<void> {
  await apiClient.delete(`/proposals/${id}`);
}

export async function generateProposalPdf(id: string): Promise<{ generated: boolean }> {
  const response = await apiClient.post<{ generated: boolean }>(`/proposals/${id}/generate-pdf`);
  return response.data;
}

export async function updateProposalStatus(
  id: string,
  status: PricingProposalStatus
): Promise<{ id: string; status: string }> {
  const response = await apiClient.post<{ id: string; status: string }>(
    `/proposals/${id}/update-status`,
    { newStatus: status }
  );
  return response.data;
}

export async function duplicateProposal(id: string): Promise<string> {
  const response = await apiClient.post<string>(
    `/proposals/${id}/duplicate`
  );
  return response.data;
}

export function getProposalPdfDownloadUrl(id: string): string {
  return `/proposals/${id}/download-pdf`;
}
