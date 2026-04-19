import apiClient from "./client";
import type {
  Estimate,
  EstimateListItem,
  CreateEstimatePayload,
  UpdateEstimatePayload,
  PagedResult,
  TransformToProposalPayload,
  TransformToProposalResult,
} from "@/lib/types/estimativas";

export async function createEstimate(data: CreateEstimatePayload): Promise<Estimate> {
  const response = await apiClient.post<Estimate>("/estimativas", data);
  return response.data;
}

export async function getEstimateById(id: string): Promise<Estimate> {
  const response = await apiClient.get<Estimate>(`/estimativas/${id}`);
  return response.data;
}

export async function getAllEstimates(params: {
  page?: number;
  pageSize?: number;
  description?: string;
  clienteId?: string;
  sortBy?: string;
  sortDirection?: string;
}): Promise<PagedResult<EstimateListItem>> {
  const response = await apiClient.get<PagedResult<EstimateListItem>>("/estimativas", { params });
  return response.data;
}

export async function updateEstimate(id: string, data: UpdateEstimatePayload): Promise<Estimate> {
  const response = await apiClient.put<Estimate>(`/estimativas/${id}`, data);
  return response.data;
}

export async function deleteEstimate(id: string): Promise<void> {
  await apiClient.delete(`/estimativas/${id}`);
}

export async function duplicateEstimate(id: string): Promise<{ id: string }> {
  const response = await apiClient.post<{ id: string }>(`/estimativas/${id}/duplicate`);
  return response.data;
}

export async function transformToProposal(
  id: string,
  data?: TransformToProposalPayload
): Promise<TransformToProposalResult> {
  const response = await apiClient.post<TransformToProposalResult>(
    `/estimativas/${id}/transform-to-proposal`,
    data
  );
  return response.data;
}

export async function recalculateOverhead(id: string): Promise<Estimate> {
  const response = await apiClient.post<Estimate>(`/estimativas/${id}/recalculate-overhead`);
  return response.data;
}

export async function syncCargos(id: string): Promise<Estimate> {
  const response = await apiClient.post<Estimate>(`/estimativas/${id}/sync-cargos`);
  return response.data;
}
