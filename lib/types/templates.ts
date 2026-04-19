// ========================================
// Template Hierarchy Types
// ========================================

export interface TemplateChecklistItem {
  id: string;
  description: string;
  orderIndex: number;
}

export interface TemplateActivity {
  id: string;
  name: string;
  orderIndex: number;
  checklistItems: TemplateChecklistItem[];
}

export interface TemplateDeliverable {
  id: string;
  name: string;
  orderIndex: number;
}

export interface TemplateSubPhase {
  id: string;
  name: string;
  description?: string;
  orderIndex: number;
  activities: TemplateActivity[];
  deliverables: TemplateDeliverable[];
}

export interface TemplatePhase {
  id: string;
  name: string;
  description?: string;
  orderIndex: number;
  defaultDurationDays: number;
  subPhases: TemplateSubPhase[];
  activities: TemplateActivity[]; // direct activities (mutually exclusive with subPhases per FR-006a)
  deliverables: TemplateDeliverable[];
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  phases: TemplatePhase[];
}

// ========================================
// List DTO (summary with counts)
// ========================================

export interface TemplateListItem {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  phaseCount: number;
  subPhaseCount: number;
  activityCount: number;
  checklistItemCount: number;
  createdAt: string;
  updatedAt?: string;
}

// ========================================
// Create/Update Payloads
// ========================================

export interface CreateChecklistItemPayload {
  description: string;
  orderIndex: number;
}

export interface CreateActivityPayload {
  name: string;
  orderIndex: number;
  checklistItems: CreateChecklistItemPayload[];
}

export interface CreateDeliverablePayload {
  name: string;
  orderIndex: number;
}

export interface CreateSubPhasePayload {
  name: string;
  description?: string;
  orderIndex: number;
  activities: CreateActivityPayload[];
  deliverables: CreateDeliverablePayload[];
}

export interface CreatePhasePayload {
  name: string;
  description?: string;
  orderIndex: number;
  defaultDurationDays: number;
  subPhases: CreateSubPhasePayload[];
  activities: CreateActivityPayload[];
  deliverables: CreateDeliverablePayload[];
}

export interface CreateTemplatePayload {
  name: string;
  description?: string;
  isDefault: boolean;
  phases: CreatePhasePayload[];
}

export interface SetDefaultPayload {
  isDefault: boolean;
}
