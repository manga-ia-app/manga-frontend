import apiClient from "./client";
import type { DiarioObraRegistro, DiarioObraFoto, PagedResult } from "@/lib/types";
import type { QueryParams } from "./cadastros";

// --- Registros ---

export async function getDiarioObraRegistros(
  projetoId: string,
  params?: QueryParams
): Promise<PagedResult<DiarioObraRegistro>> {
  const response = await apiClient.get<PagedResult<DiarioObraRegistro>>(
    `/projetos/${projetoId}/diario-obra`,
    { params }
  );
  return response.data;
}

export async function getDiarioObraRegistroById(
  projetoId: string,
  id: string
): Promise<DiarioObraRegistro> {
  const response = await apiClient.get<DiarioObraRegistro>(
    `/projetos/${projetoId}/diario-obra/${id}`
  );
  return response.data;
}

export async function createDiarioObraRegistro(
  projetoId: string,
  data: Record<string, unknown>
): Promise<DiarioObraRegistro> {
  const response = await apiClient.post<DiarioObraRegistro>(
    `/projetos/${projetoId}/diario-obra`,
    data
  );
  return response.data;
}

export async function updateDiarioObraRegistro(
  projetoId: string,
  id: string,
  data: Record<string, unknown>
): Promise<DiarioObraRegistro> {
  const response = await apiClient.put<DiarioObraRegistro>(
    `/projetos/${projetoId}/diario-obra/${id}`,
    data
  );
  return response.data;
}

export async function deleteDiarioObraRegistro(
  projetoId: string,
  id: string
): Promise<void> {
  await apiClient.delete(`/projetos/${projetoId}/diario-obra/${id}`);
}

// --- Fotos ---

export async function uploadDiarioObraFotos(
  projetoId: string,
  registroId: string,
  formData: FormData
): Promise<DiarioObraFoto[]> {
  const response = await apiClient.post<DiarioObraFoto[]>(
    `/projetos/${projetoId}/diario-obra/${registroId}/fotos`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
}
