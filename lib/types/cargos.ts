export interface Cargo {
  id: string;
  name: string;
  valorHora: number;
  grupoColaboradorId: string;
  grupoColaboradorName: string;
  colaboradoresCount: number;
  createdAt: string;
  updatedAt: string | null;
  historico?: CargoHistorico[];
}

export interface CargoHistorico {
  id: string;
  valorAnterior: number;
  valorNovo: number;
  alteradoEm: string;
  alteradoPor: string;
}

export interface CargoStats {
  minCustoHora: number | null;
  medCustoHora: number | null;
  maxCustoHora: number | null;
  colaboradoresCount: number;
}

export interface CreateCargoRequest {
  name: string;
  valorHora: number;
  grupoColaboradorId: string;
}

export interface UpdateCargoRequest {
  name: string;
  valorHora: number;
  grupoColaboradorId: string;
}
