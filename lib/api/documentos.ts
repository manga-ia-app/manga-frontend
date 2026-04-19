import apiClient from "./client";
import type { Documento, PagedResult } from "@/lib/types";
import type { QueryParams } from "./cadastros";

// --- Documentos ---

export async function getDocumentos(
  projetoId: string,
  params?: QueryParams
): Promise<PagedResult<Documento>> {
  const response = await apiClient.get<PagedResult<Documento>>(
    `/projetos/${projetoId}/documentos`,
    { params }
  );
  return response.data;
}

export async function getDocumentoById(
  projetoId: string,
  id: string
): Promise<Documento> {
  const response = await apiClient.get<Documento>(
    `/projetos/${projetoId}/documentos/${id}`
  );
  return response.data;
}

export async function uploadDocumento(
  projetoId: string,
  formData: FormData
): Promise<Documento> {
  const response = await apiClient.post<Documento>(
    `/projetos/${projetoId}/documentos`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
}

export async function deleteDocumento(
  projetoId: string,
  id: string
): Promise<void> {
  await apiClient.delete(`/projetos/${projetoId}/documentos/${id}`);
}
