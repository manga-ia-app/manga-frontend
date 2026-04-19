import apiClient from "./client";
import type {
  Template,
  TemplateListItem,
  CreateTemplatePayload,
  SetDefaultPayload,
} from "@/lib/types/templates";

export async function getTemplates(): Promise<TemplateListItem[]> {
  const response = await apiClient.get<TemplateListItem[]>("/templates");
  return response.data;
}

export async function getTemplateById(id: string): Promise<Template> {
  const response = await apiClient.get<Template>(`/templates/${id}`);
  return response.data;
}

export async function createTemplate(data: CreateTemplatePayload): Promise<Template> {
  const response = await apiClient.post<Template>("/templates", data);
  return response.data;
}

export async function updateTemplate(id: string, data: CreateTemplatePayload): Promise<Template> {
  const response = await apiClient.put<Template>(`/templates/${id}`, data);
  return response.data;
}

export async function deleteTemplate(id: string): Promise<void> {
  await apiClient.delete(`/templates/${id}`);
}

export async function duplicateTemplate(id: string): Promise<Template> {
  const response = await apiClient.post<Template>(`/templates/${id}/duplicate`);
  return response.data;
}

export async function setDefaultTemplate(id: string, data: SetDefaultPayload): Promise<Template> {
  const response = await apiClient.patch<Template>(`/templates/${id}/default`, data);
  return response.data;
}
