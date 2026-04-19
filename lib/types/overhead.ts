// ========================================
// Overhead Configuration DTOs
// ========================================

export interface OverheadConfigurationDto {
  configuracaoEscritorioId: string;
  categories: CostCategoryDto[];
  healthBands: HealthBandDto[];
  summary: OfficeSummaryDto;
  orphanGroups: OrphanGroupDto[];
}

export interface CostCategoryDto {
  id: string;
  name: string;
  isBase: boolean;
  isPersonnel: boolean;
  displayOrder: number;
  groups: GroupInCategoryDto[];
  items: CostItemDto[];
  syncedCollaborators: SyncedCollaboratorDto[];
  subtotalMensal: number;
}

export interface GroupInCategoryDto {
  id: string;
  name: string;
  colaboradoresCount: number;
}

export interface OrphanGroupDto {
  id: string;
  name: string;
  colaboradoresCount: number;
}

export interface CostItemDto {
  id: string;
  name: string;
  value: number;
  frequencyMonths: number;
  monthlyValue: number;
}

export interface SyncedCollaboratorDto {
  id: string;
  name: string;
  custoTotalMensal: number;
}

export interface HealthBandDto {
  id: string;
  lowerBound: number;
  upperBound: number;
  label: string;
  color: string;
  displayOrder: number;
}

export interface OfficeSummaryDto {
  totalHorasFaturaveis: number;
  pessoalTotal: number;
  outrasCategoriasTotal: number;
  totalGeral: number;
  custoHoraBase: number | null;
  overheadPercent: number | null;
  overheadValue: number | null;
  custoHoraReal: number | null;
  overheadHealthLabel: string;
  overheadHealthColor: string;
}

// ========================================
// Grupo Colaborador
// ========================================

export interface GrupoColaboradorDto {
  id: string;
  name: string;
  isReserved: boolean;
  isPersonnel: boolean;
  costCategoryId: string | null;
  costCategoryName: string | null;
  status: string;
  cargosCount: number;
  colaboradoresCount: number;
}

// ========================================
// Save Command DTOs
// ========================================

export interface SaveOverheadConfigurationDto {
  categories: SaveCostCategoryDto[];
  healthBands: SaveHealthBandDto[];
}

export interface SaveCostCategoryDto {
  id: string | null;
  name: string;
  isPersonnel: boolean;
  displayOrder: number;
  grupoIds: string[];
  items: SaveCostItemDto[];
}

export interface SaveCostItemDto {
  name: string;
  value: number;
  frequencyMonths: number;
}

export interface SaveHealthBandDto {
  lowerBound: number;
  upperBound: number;
  label: string;
  color: string;
  displayOrder: number;
}
