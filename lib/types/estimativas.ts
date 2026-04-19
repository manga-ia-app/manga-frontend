export interface Estimate {
  id: string;
  description: string;
  clienteId: string;
  clienteName: string;
  clienteEmail?: string;
  clientePhone?: string;
  sourceTemplateId?: string;
  sourceTemplateName: string;
  areaM2?: number;
  overheadPercent: number;
  marginPercent: number;
  taxPercent: number;
  expirationDays?: number;
  expiresAt?: string;
  createdAt: string;
  updatedAt?: string;
  phases: EstimatePhase[];
  additionalCosts: AdditionalCost[];
  adjustments: CommercialAdjustment[];
  totalActivityCost: number;
  totalOverheadValue: number;
  totalComplexityValue: number;
  totalAdditionalCosts: number;
  totalCost: number;
  basePrice: number;
  totalAdjustments: number;
  finalValue: number;
  totalHours: number;
  activeActivityCount: number;
  totalActivityCount: number;
  monthlyTotalCost: number;
  proposalCount: number;
  costPerM2?: number;
  marginValue: number;
  isExpired: boolean;
  isStale: boolean;
}

export interface EstimatePhase {
  id: string;
  name: string;
  description?: string;
  orderIndex: number;
  directCost: number;
  complexityPercent: number;
  complexityCost: number;
  isMonthlyBilling: boolean;
  totalHours: number;
  subPhases: EstimateSubPhase[];
  activities: EstimateActivity[];
  additionalCosts: AdditionalCost[];
  deliverables?: { id: string; name: string; orderIndex: number }[];
}

export interface EstimateSubPhase {
  id: string;
  name: string;
  description?: string;
  orderIndex: number;
  activities: EstimateActivity[];
  deliverables?: { id: string; name: string; orderIndex: number }[];
}

export interface EstimateActivity {
  id: string;
  name: string;
  orderIndex: number;
  cargoId?: string;
  cargoName?: string;
  costPerHour: number;
  estimatedHours: number;
  totalCost: number;
  isActive: boolean;
  isCustom: boolean;
  checklistItems: EstimateChecklistItem[];
  allocations: ActivityAllocation[];
}

export interface ActivityAllocation {
  id: string;
  cargoId?: string;
  cargoName?: string;
  costPerHour: number;
  estimatedHours: number;
  totalCost: number;
  orderIndex: number;
}

export interface EstimateChecklistItem {
  id: string;
  description: string;
  orderIndex: number;
}

export interface AdditionalCost {
  id: string;
  phaseId?: string;
  name: string;
  value: number;
}

export interface CommercialAdjustment {
  id: string;
  type: CommercialAdjustmentType;
  value: number;
  roundingTarget?: number;
  roundingDirection?: string;
  reason?: string;
  originalValue: number;
  adjustedValue: number;
  createdAt: string;
}

export enum CommercialAdjustmentType {
  PercentDiscount = 0,
  AbsoluteDiscount = 1,
  Rounding = 2,
  ManualValue = 3,
}

export interface EstimateListItem {
  id: string;
  description: string;
  clienteName: string;
  createdAt: string;
  updatedAt?: string;
  expiresAt?: string;
  finalValue: number;
  totalHours: number;
  activeActivityCount: number;
  totalActivityCount: number;
  monthlyTotalCost: number;
  proposalCount: number;
  isExpired: boolean;
  isStale: boolean;
}

export interface CreateEstimatePayload {
  templateId: string;
  clienteId: string;
  description: string;
  areaM2?: number;
  expirationDays?: number;
  marginPercent?: number;
}

export interface UpdateEstimatePayload {
  description: string;
  clienteId: string;
  areaM2?: number;
  overheadPercent: number;
  marginPercent: number;
  taxPercent: number;
  expirationDays?: number;
  phases: {
    id: string;
    name?: string;
    orderIndex?: number;
    complexityPercent: number;
    isMonthlyBilling: boolean;
    activities: {
      id: string;
      name?: string;
      cargoId?: string;
      estimatedHours: number;
      isActive: boolean;
      allocations?: { id?: string; cargoId?: string; estimatedHours: number }[];
    }[];
    subPhases: {
      id: string;
      activities: {
        id: string;
        name?: string;
        cargoId?: string;
        estimatedHours: number;
        isActive: boolean;
        allocations?: { id?: string; cargoId?: string; estimatedHours: number }[];
      }[];
    }[];
  }[];
  newPhases?: { name: string; orderIndex: number }[];
  deletedPhaseIds?: string[];
  customActivities?: {
    phaseId?: string;
    subPhaseId?: string;
    name: string;
    cargoId?: string;
    estimatedHours: number;
    allocations?: { cargoId?: string; estimatedHours: number }[];
  }[];
  additionalCosts: {
    id?: string;
    phaseId?: string;
    name: string;
    value: number;
  }[];
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface TransformToProposalPayload {
  title?: string;
}

export interface TransformToProposalResult {
  id: string;
  estimateId: string;
  title: string;
  finalValue: number;
  status: string;
  version: number;
  phasesCount: number;
  createdAt: string;
}
