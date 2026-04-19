import apiClient from "./client";
import type {
  OverheadConfigurationDto,
  SaveOverheadConfigurationDto,
  GrupoColaboradorDto,
} from "@/lib/types/overhead";

// --- Overhead Configuration ---

export async function getOverheadConfiguration(): Promise<OverheadConfigurationDto> {
  const response = await apiClient.get<OverheadConfigurationDto>(
    "/configuracao-escritorio/overhead"
  );
  return response.data;
}

export async function saveOverheadConfiguration(
  dto: SaveOverheadConfigurationDto
): Promise<{ id: string }> {
  const response = await apiClient.put<{ id: string }>(
    "/configuracao-escritorio/overhead",
    dto
  );
  return response.data;
}

// --- Grupos Colaboradores ---

export async function getGruposColaboradores(): Promise<GrupoColaboradorDto[]> {
  const response = await apiClient.get<GrupoColaboradorDto[]>(
    "/colaboradores/grupos"
  );
  return response.data;
}

export async function createGrupoColaborador(
  name: string
): Promise<{ id: string }> {
  const response = await apiClient.post<{ id: string }>(
    "/colaboradores/grupos",
    { name }
  );
  return response.data;
}

export async function updateGrupoColaborador(
  id: string,
  name: string
): Promise<void> {
  await apiClient.put(`/colaboradores/grupos/${id}`, { name });
}

export async function deleteGrupoColaborador(
  id: string,
  reassignCargosTo?: string
): Promise<void> {
  const params = reassignCargosTo ? { reassignCargosTo } : {};
  await apiClient.delete(`/colaboradores/grupos/${id}`, { params });
}
