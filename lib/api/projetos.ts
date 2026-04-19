import apiClient from "./client";
import type {
  Projeto,
  ProjetoFase,
  ProjetoMembro,
  ProjectTemplate,
  PagedResult,
} from "@/lib/types";
import type { QueryParams } from "./cadastros";

// --- Projetos ---

export async function getProjetos(params?: QueryParams): Promise<PagedResult<Projeto>> {
  const response = await apiClient.get<PagedResult<Projeto>>("/projetos", { params });
  return response.data;
}

export async function getProjetoById(id: string): Promise<Projeto> {
  const response = await apiClient.get<Projeto>(`/projetos/${id}`);
  return response.data;
}

export async function createProjeto(data: Record<string, unknown>): Promise<Projeto> {
  const response = await apiClient.post<Projeto>("/projetos", data);
  return response.data;
}

export async function updateProjeto(id: string, data: Record<string, unknown>): Promise<Projeto> {
  const response = await apiClient.put<Projeto>(`/projetos/${id}`, data);
  return response.data;
}

export async function deleteProjeto(id: string): Promise<void> {
  await apiClient.delete(`/projetos/${id}`);
}

// --- Fases ---

export async function updateFase(
  projetoId: string,
  faseId: string,
  data: Record<string, unknown>
): Promise<ProjetoFase> {
  const response = await apiClient.put<ProjetoFase>(
    `/projetos/${projetoId}/fases/${faseId}`,
    data
  );
  return response.data;
}

export async function advanceFaseStatus(
  projetoId: string,
  faseId: string
): Promise<ProjetoFase> {
  const response = await apiClient.post<ProjetoFase>(
    `/projetos/${projetoId}/fases/${faseId}/advance`
  );
  return response.data;
}

// --- Membros ---

export async function addMembro(
  projetoId: string,
  data: Record<string, unknown>
): Promise<ProjetoMembro> {
  const response = await apiClient.post<ProjetoMembro>(
    `/projetos/${projetoId}/membros`,
    data
  );
  return response.data;
}

export async function removeMembro(
  projetoId: string,
  membroId: string
): Promise<void> {
  await apiClient.delete(`/projetos/${projetoId}/membros/${membroId}`);
}

// --- Templates ---

export async function getTemplates(): Promise<ProjectTemplate[]> {
  const response = await apiClient.get<ProjectTemplate[]>("/templates");
  return response.data;
}

export async function createTemplate(data: Record<string, unknown>): Promise<ProjectTemplate> {
  const response = await apiClient.post<ProjectTemplate>("/templates", data);
  return response.data;
}
