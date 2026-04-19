import apiClient from "./client";
import type {
  Cliente,
  Fornecedor,
  Servico,
  Material,
  Colaborador,
  HistoricoFinanceiroColaborador,
  PagedResult,
} from "@/lib/types";

export interface QueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  [key: string]: unknown;
}

// --- Clientes ---

export async function getClientes(params?: QueryParams): Promise<PagedResult<Cliente>> {
  const response = await apiClient.get<PagedResult<Cliente>>("/clientes", { params });
  return response.data;
}

export async function getClienteById(id: string): Promise<Cliente> {
  const response = await apiClient.get<Cliente>(`/clientes/${id}`);
  return response.data;
}

export async function createCliente(data: Record<string, unknown>): Promise<Cliente> {
  const response = await apiClient.post<Cliente>("/clientes", data);
  return response.data;
}

export async function updateCliente(id: string, data: Record<string, unknown>): Promise<Cliente> {
  const response = await apiClient.put<Cliente>(`/clientes/${id}`, data);
  return response.data;
}

export async function deleteCliente(id: string): Promise<void> {
  await apiClient.delete(`/clientes/${id}`);
}

// --- Fornecedores ---

export async function getFornecedores(params?: QueryParams): Promise<PagedResult<Fornecedor>> {
  const response = await apiClient.get<PagedResult<Fornecedor>>("/fornecedores", { params });
  return response.data;
}

export async function getFornecedorById(id: string): Promise<Fornecedor> {
  const response = await apiClient.get<Fornecedor>(`/fornecedores/${id}`);
  return response.data;
}

export async function createFornecedor(data: Record<string, unknown>): Promise<Fornecedor> {
  const response = await apiClient.post<Fornecedor>("/fornecedores", data);
  return response.data;
}

export async function updateFornecedor(id: string, data: Record<string, unknown>): Promise<Fornecedor> {
  const response = await apiClient.put<Fornecedor>(`/fornecedores/${id}`, data);
  return response.data;
}

export async function deleteFornecedor(id: string): Promise<void> {
  await apiClient.delete(`/fornecedores/${id}`);
}

// --- Servicos ---

export async function getServicos(params?: QueryParams): Promise<PagedResult<Servico>> {
  const response = await apiClient.get<PagedResult<Servico>>("/servicos", { params });
  return response.data;
}

export async function getServicoById(id: string): Promise<Servico> {
  const response = await apiClient.get<Servico>(`/servicos/${id}`);
  return response.data;
}

export async function createServico(data: Record<string, unknown>): Promise<Servico> {
  const response = await apiClient.post<Servico>("/servicos", data);
  return response.data;
}

export async function updateServico(id: string, data: Record<string, unknown>): Promise<Servico> {
  const response = await apiClient.put<Servico>(`/servicos/${id}`, data);
  return response.data;
}

export async function deleteServico(id: string): Promise<void> {
  await apiClient.delete(`/servicos/${id}`);
}

// --- Materiais ---

export async function getMateriais(params?: QueryParams): Promise<PagedResult<Material>> {
  const response = await apiClient.get<PagedResult<Material>>("/materiais", { params });
  return response.data;
}

export async function getMaterialById(id: string): Promise<Material> {
  const response = await apiClient.get<Material>(`/materiais/${id}`);
  return response.data;
}

export async function createMaterial(data: Record<string, unknown>): Promise<Material> {
  const response = await apiClient.post<Material>("/materiais", data);
  return response.data;
}

export async function updateMaterial(id: string, data: Record<string, unknown>): Promise<Material> {
  const response = await apiClient.put<Material>(`/materiais/${id}`, data);
  return response.data;
}

export async function deleteMaterial(id: string): Promise<void> {
  await apiClient.delete(`/materiais/${id}`);
}

// --- Colaboradores ---

export interface ColaboradorQueryParams extends QueryParams {
  apenasAtivos?: boolean;
  tipoVinculo?: string;
  cargoId?: string;
  grupoId?: string;
}

export async function getColaboradores(params?: ColaboradorQueryParams): Promise<PagedResult<Colaborador>> {
  const response = await apiClient.get<PagedResult<Colaborador>>("/colaboradores", { params });
  return response.data;
}

export async function getColaboradorById(id: string): Promise<Colaborador> {
  const response = await apiClient.get<Colaborador>(`/colaboradores/${id}`);
  return response.data;
}

export async function createColaborador(data: Record<string, unknown>): Promise<{ id: string }> {
  const response = await apiClient.post<{ id: string }>("/colaboradores", data);
  return response.data;
}

export async function updateColaborador(id: string, data: Record<string, unknown>): Promise<{ id: string }> {
  const response = await apiClient.put<{ id: string }>(`/colaboradores/${id}`, data);
  return response.data;
}

export async function deleteColaborador(id: string): Promise<void> {
  await apiClient.delete(`/colaboradores/${id}`);
}

export async function getColaboradorHistorico(id: string): Promise<HistoricoFinanceiroColaborador[]> {
  const response = await apiClient.get<HistoricoFinanceiroColaborador[]>(`/colaboradores/${id}/historico`);
  return response.data;
}
