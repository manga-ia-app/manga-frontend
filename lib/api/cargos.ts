import apiClient from "./client";
import type {
  Cargo,
  CargoStats,
  CreateCargoRequest,
  UpdateCargoRequest,
} from "../types/cargos";

export async function getCargos(params?: {
  grupoId?: string;
  search?: string;
}): Promise<Cargo[]> {
  const { data } = await apiClient.get<Cargo[]>("/cargos", { params });
  return data;
}

export async function getCargoById(id: string): Promise<Cargo> {
  const { data } = await apiClient.get<Cargo>(`/cargos/${id}`);
  return data;
}

export async function getCargoStats(id: string): Promise<CargoStats> {
  const { data } = await apiClient.get<CargoStats>(`/cargos/${id}/stats`);
  return data;
}

export async function createCargo(
  cargo: CreateCargoRequest
): Promise<{ id: string }> {
  const { data } = await apiClient.post<{ id: string }>("/cargos", cargo);
  return data;
}

export async function updateCargo(
  id: string,
  cargo: UpdateCargoRequest
): Promise<{ id: string }> {
  const { data } = await apiClient.put<{ id: string }>(`/cargos/${id}`, cargo);
  return data;
}

export async function deleteCargo(id: string): Promise<void> {
  await apiClient.delete(`/cargos/${id}`);
}
