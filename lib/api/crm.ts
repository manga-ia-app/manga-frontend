import apiClient from "./client";
import type { Lead, Proposta, Projeto, PagedResult } from "@/lib/types";
import type { QueryParams } from "./cadastros";

// --- Leads ---

export async function getLeads(
  params?: QueryParams
): Promise<PagedResult<Lead>> {
  const response = await apiClient.get<PagedResult<Lead>>("/crm/leads", {
    params,
  });
  return response.data;
}

export async function getLeadById(id: string): Promise<Lead> {
  const response = await apiClient.get<Lead>(`/crm/leads/${id}`);
  return response.data;
}

export async function createLead(data: Record<string, unknown>): Promise<Lead> {
  const response = await apiClient.post<Lead>("/crm/leads", data);
  return response.data;
}

export async function updateLead(
  id: string,
  data: Record<string, unknown>
): Promise<Lead> {
  const response = await apiClient.put<Lead>(`/crm/leads/${id}`, data);
  return response.data;
}

export async function deleteLead(id: string): Promise<void> {
  await apiClient.delete(`/crm/leads/${id}`);
}

// --- Propostas ---

export async function getPropostas(
  params?: QueryParams
): Promise<PagedResult<Proposta>> {
  const response = await apiClient.get<PagedResult<Proposta>>(
    "/crm/propostas",
    { params }
  );
  return response.data;
}

export async function getPropostaById(id: string): Promise<Proposta> {
  const response = await apiClient.get<Proposta>(`/crm/propostas/${id}`);
  return response.data;
}

export async function createProposta(
  data: Record<string, unknown>
): Promise<Proposta> {
  const response = await apiClient.post<Proposta>("/crm/propostas", data);
  return response.data;
}

export async function updateProposta(
  id: string,
  data: Record<string, unknown>
): Promise<Proposta> {
  const response = await apiClient.put<Proposta>(
    `/crm/propostas/${id}`,
    data
  );
  return response.data;
}

export async function deleteProposta(id: string): Promise<void> {
  await apiClient.delete(`/crm/propostas/${id}`);
}

export async function convertPropostaToProject(
  id: string
): Promise<Projeto> {
  const response = await apiClient.post<Projeto>(
    `/crm/propostas/${id}/convert`
  );
  return response.data;
}
