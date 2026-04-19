// ========================================
// Generic
// ========================================

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ========================================
// Auth / Tenant (mantidos — usados no contexto de auth)
// ========================================

export type UserRole = "Admin" | "Gerente" | "Colaborador" | "Viewer";

export interface User {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  tenantId: string;
  avatarUrl?: string;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm?: string;
}

export interface Tenant {
  id: string;
  nome: string;
  slug: string;
  logoUrl?: string;
  corPrimaria?: string;
  corSecundaria?: string;
  plano: "Free" | "Pro" | "Enterprise";
  ativo: boolean;
  criadoEm: string;
  atualizadoEm?: string;
}

// ========================================
// Cadastros
// ========================================

export interface Cliente {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  cpfCnpj?: string;
  address?: string;
  notes?: string;
  birthDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Fornecedor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  cpfCnpj?: string;
  category?: string;
  address?: string;
  bankInfo?: string;
  rating?: number;
  createdAt: string;
  updatedAt?: string;
}

// Backend enum: Unidade=0, M2=1, M=2, Hr=3, Vb=4
export type UnitType = "Unidade" | "M2" | "M" | "Hr" | "Vb";

export interface Servico {
  id: string;
  name: string;
  description?: string;
  unit: UnitType;
  defaultPrice: number;
  category?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Material {
  id: string;
  name: string;
  description?: string;
  unit: UnitType;
  defaultPrice: number;
  category?: string;
  fornecedorId?: string;
  fornecedorName?: string;
  createdAt: string;
  updatedAt?: string;
}

// ========================================
// Colaboradores
// ========================================

export type TipoVinculo = "CLT" | "Terceiros" | "Estagiario";
export type ModoEncargos = "Percentual" | "Detalhado";
export type ModoBeneficios = "Detalhado" | "ValorUnico";

export interface BeneficioExtra {
  id?: string;
  name: string;
  value: number;
}

export interface EncargoTerceiro {
  id?: string;
  name: string;
  percentual: number;
}

export interface HistoricoFinanceiroColaborador {
  id: string;
  campoAlterado: string;
  valorAnterior: string;
  valorNovo: string;
  alteradoEm: string;
  alteradoPor: string;
}

export interface Colaborador {
  id: string;
  name: string;
  cargoId: string;
  cargoName?: string;
  email?: string;
  phone?: string;
  hireDate?: string;
  tipoVinculo: TipoVinculo;
  grupoColaboradorId?: string;
  grupoColaboradorName?: string;
  horasMensais: number;
  isAtivo: boolean;
  notes?: string;
  modoBeneficios: ModoBeneficios;

  // CLT
  salarioBruto?: number;
  modoEncargos?: ModoEncargos;
  encargosPercentual?: number;
  encargoINSS?: number;
  encargoFGTS?: number;
  encargo13Salario?: number;
  encargoFerias?: number;
  encargoOutros?: number;

  // Terceiros
  valorMensalNF?: number;

  // Estagiário
  bolsaAuxilio?: number;
  seguroEstagio?: number;
  auxilioTransporteEstagio?: number;
  recessoRemunerado?: number;

  // Benefícios
  planoSaudeValor?: number;
  planoSaudeDependentes?: number;
  auxilioTransporteValor?: number;
  auxilioAlimentacaoValor?: number;
  beneficiosMensais: number;
  beneficiosExtras: BeneficioExtra[];
  encargosTerceiros: EncargoTerceiro[];

  custoTotalMensal: number;
  custoHoraMensal: number;
  createdAt: string;
  updatedAt?: string;
}

// ========================================
// Projetos
// ========================================

export type ProjectStatus = "Planning" | "Briefing" | "InProgress" | "Paused" | "Completed" | "Cancelled";
export type FaseStatus = "Pending" | "InProgress" | "Review" | "Approved" | "Completed";
export type ProjetoMembroRole = "Lead" | "Collaborator" | "Viewer";

export interface Projeto {
  id: string;
  name: string;
  description?: string;
  clienteId: string;
  clienteName?: string;
  templateId?: string;
  status: ProjectStatus;
  address?: string;
  startDate?: string;
  expectedEndDate?: string;
  totalBudget: number;
  coverImageUrl?: string;
  createdAt: string;
  fases?: ProjetoFase[];
  membros?: ProjetoMembro[];
}

export interface ProjetoListItem {
  id: string;
  name: string;
  clienteName?: string;
  status: ProjectStatus;
  startDate?: string;
  expectedEndDate?: string;
  totalBudget: number;
}

export interface ProjetoFase {
  id: string;
  name: string;
  orderIndex: number;
  status: FaseStatus;
  startDate?: string;
  endDate?: string;
  delayAlertDays: number;
}

export interface ProjetoMembro {
  id: string;
  userId: string;
  userName: string;
  role: ProjetoMembroRole;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  phases: { id: string; name: string; orderIndex: number; defaultDurationDays: number }[];
}

// ========================================
// Orcamento
// ========================================

export type OrcamentoCategoriaType = "Architectural" | "Construction" | "Decoration" | "Complementary" | "Other";
export type OrcamentoItemStatus = "Estimated" | "Approved" | "Contracted";

export interface OrcamentoCategoria {
  id: string;
  name: string;
  type: OrcamentoCategoriaType;
  isDefault: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt?: string;
}

export interface OrcamentoItem {
  id: string;
  projetoId: string;
  categoriaId: string;
  categoriaName: string;
  faseId?: string;
  description: string;
  quantity: number;
  unit: UnitType;
  unitPrice: number;
  totalPrice: number;
  servicoId?: string;
  materialId?: string;
  fornecedorId?: string;
  status: OrcamentoItemStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface OrcamentoCategoriaGroup {
  categoriaId: string;
  categoriaName: string;
  items: OrcamentoItem[];
  subTotal: number;
}

export interface OrcamentoSummary {
  categories: OrcamentoCategoriaGroup[];
  totalGeral: number;
}

// ========================================
// Cronograma
// ========================================

export type TarefaStatus = "Pending" | "InProgress" | "Completed" | "Delayed" | "Cancelled";

export interface CronogramaTarefa {
  id: string;
  projetoId: string;
  faseId?: string;
  name: string;
  startDate?: string;
  endDate?: string;
  status: TarefaStatus;
  assignedTo?: string;
  assignedUserName?: string;
  parentTaskId?: string;
  progressPercent: number;
  subTasks: CronogramaTarefa[];
  createdAt: string;
  updatedAt?: string;
}

// ========================================
// Financeiro
// ========================================

export type LancamentoType = "Receita" | "Despesa";
export type PaymentStatus = "Pending" | "Paid" | "Overdue" | "Cancelled";

export interface LancamentoFinanceiro {
  id: string;
  projetoId: string;
  type: LancamentoType;
  description: string;
  plannedAmount: number;
  actualAmount: number;
  dueDate: string;
  paymentDate?: string;
  status: PaymentStatus;
  paymentMethod?: string;
  fornecedorId?: string;
  fornecedorName?: string;
  receiptUrl?: string;
  parcelas: Parcela[];
  createdAt: string;
  updatedAt?: string;
}

export interface Parcela {
  id: string;
  lancamentoId: string;
  number: number;
  amount: number;
  dueDate: string;
  status: PaymentStatus;
  receiptUrl?: string;
  createdAt: string;
}

export interface FinancialSummary {
  totalPlannedReceitas: number;
  totalPlannedDespesas: number;
  totalActualReceitas: number;
  totalActualDespesas: number;
  balance: number;
}

// ========================================
// Documentos
// ========================================

export type ApprovalStatus = "Pending" | "Approved" | "Rejected";
export type DownloadRestriction = "None" | "ApprovedOnly";

export interface Documento {
  id: string;
  projetoId: string;
  faseId?: string;
  name: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  version: number;
  parentDocumentId?: string;
  isClientVisible: boolean;
  requiresApproval: boolean;
  approvalStatus: ApprovalStatus;
  downloadRestriction: DownloadRestriction;
  createdAt: string;
  updatedAt?: string;
}

// ========================================
// Assinaturas
// ========================================

export type AssinaturaStatus = "Draft" | "PendingSignatures" | "PartiallySigned" | "Completed" | "Cancelled" | "Expired";
export type SignatarioAction = "Sign" | "Approve" | "Acknowledge";
export type SignatarioStatus = "Pending" | "Signed" | "Declined";

export interface AssinaturaProcesso {
  id: string;
  projetoId: string;
  faseId?: string;
  documentoId: string;
  d4SignDocumentUuid?: string;
  status: AssinaturaStatus;
  signatarios: AssinaturaSignatario[];
  createdAt: string;
  updatedAt?: string;
}

export interface AssinaturaSignatario {
  id: string;
  processoId: string;
  email: string;
  name: string;
  cpf?: string;
  signOrder: number;
  action: SignatarioAction;
  status: SignatarioStatus;
}

// ========================================
// Agenda
// ========================================

export type EventoType = "Meeting" | "SiteVisit" | "Delivery" | "Deadline" | "Other";
export type ParticipanteStatus = "Pending" | "Accepted" | "Declined";

export interface AgendaEvento {
  id: string;
  projetoId?: string;
  title: string;
  startDateTime: string;
  endDateTime: string;
  type: EventoType;
  recurrenceRule?: string;
  description?: string;
  participantes: AgendaEventoParticipante[];
  createdAt: string;
  updatedAt?: string;
}

export interface AgendaEventoParticipante {
  id: string;
  eventoId: string;
  userId: string;
  userName?: string;
  status: ParticipanteStatus;
}

// ========================================
// CRM - Leads & Propostas
// ========================================

export type LeadStatus = "New" | "Contacted" | "Qualified" | "ProposalSent" | "Negotiation" | "Won" | "Lost";
export type LeadSource = "Website" | "Referral" | "Social" | "Other";

export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  source: LeadSource;
  status: LeadStatus;
  expectedValue?: number;
  assignedTo?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type PropostaStatus = "Draft" | "Sent" | "Viewed" | "Accepted" | "Rejected" | "Expired";

export interface Proposta {
  id: string;
  leadId?: string;
  clienteId?: string;
  title: string;
  content?: string;
  totalValue: number;
  discount: number;
  finalValue: number;
  validUntil?: string;
  status: PropostaStatus;
  convertedProjectId?: string;
  createdAt: string;
  updatedAt?: string;
  itens: PropostaItem[];
}

export interface PropostaItem {
  id: string;
  propostaId: string;
  description: string;
  quantity: number;
  unit: UnitType;
  unitPrice: number;
  servicoId?: string;
  createdAt: string;
}

// ========================================
// Diario de Obra
// ========================================

export type WeatherType = "Sunny" | "Cloudy" | "Rainy" | "Stormy";
export type OcorrenciaType = "Safety" | "Quality" | "Delay" | "Weather" | "Other";
export type Severity = "Low" | "Medium" | "High" | "Critical";

export interface DiarioObraRegistro {
  id: string;
  projetoId: string;
  date: string;
  weather: WeatherType;
  temperature?: number;
  description: string;
  workersCount: number;
  workersDetails?: string;
  geolocation?: string;
  createdAt: string;
  updatedAt?: string;
  fotos: DiarioObraFoto[];
  ocorrencias: DiarioObraOcorrencia[];
}

export interface DiarioObraFoto {
  id: string;
  registroId: string;
  filePath: string;
  description?: string;
  geolocation?: string;
  takenAt?: string;
  createdAt: string;
}

export interface DiarioObraOcorrencia {
  id: string;
  registroId: string;
  type: OcorrenciaType;
  description: string;
  severity: Severity;
  createdAt: string;
}

// ========================================
// Servicos Contratados
// ========================================

export type ServicoContratadoStatus = "Pending" | "InProgress" | "Completed" | "Cancelled";

export interface ServicoContratado {
  id: string;
  projetoId: string;
  fornecedorId?: string;
  fornecedorName?: string;
  description: string;
  totalPrice: number;
  paymentCondition?: string;
  status: ServicoContratadoStatus;
  startDate?: string;
  endDate?: string;
  contractDocumentId?: string;
  etapas: ServicoContratadoEtapa[];
  createdAt: string;
  updatedAt?: string;
}

export interface ServicoContratadoEtapa {
  id: string;
  servicoContratadoId: string;
  name: string;
  orderIndex: number;
  startDate?: string;
  endDate?: string;
  status: ServicoContratadoStatus;
  value: number;
  createdAt: string;
}

// ========================================
// Precificacao - Configuracao Escritorio
// ========================================

export interface ConfiguracaoEscritorio {
  id: string;
  nomeEscritorio?: string;
  // Custos Fixos
  aluguelMensal: number;
  salarios: number;
  softwareLicencas: number;
  marketing: number;
  contabilidade: number;
  internet: number;
  energia: number;
  outrosCustosFixos: number;
  outrosCustosFixosDescricao?: string;
  // Custos Variaveis
  deslocamentoMedio: number;
  impressaoMedio: number;
  terceirizacaoMedio: number;
  outrosCustosVariaveis: number;
  // Capacidade
  numeroPessoas: number;
  horasMensaisPorPessoa: number;
  horasNaoFaturaveis: number;
  margemDesejada: number;
  // Metricas calculadas (retornadas pelo backend)
  custoMensalTotal: number;
  capacidadeHorasFaturaveis: number;
  custoHoraReal: number;
  faturamentoMinimoNecessario: number;
}

// ========================================
// Proposals (Propostas de Precificação)
// ========================================

export type PricingProposalStatus =
  | "Draft"
  | "Generated"
  | "Approved"
  | "Rejected";

export type ProposalDiscountType = "None" | "Percentage" | "Absolute";

export interface ProposalComment {
  id: string;
  content: string;
  authorName: string;
  authorEmail?: string;
  isFromClient: boolean;
  createdAt: string;
}

export interface ProposalDeliverable {
  id: string;
  name: string;
  orderIndex: number;
  isVisible: boolean;
}

export interface ProposalSectionPhase {
  id: string;
  sourcePhaseId: string;
  name: string;
  description?: string;
  orderIndex: number;
  isVisible: boolean;
  isPriceVisible: boolean;
  isMonthlyBilling: boolean;
  activityCost: number;
  overheadValue: number;
  overheadPercent: number;
  complexityValue: number;
  complexityPercent: number;
  marginValue: number;
  marginPercent: number;
  additionalCosts: number;
  taxValue: number;
  taxPercent: number;
  totalValue: number;
  deliverables: ProposalDeliverable[];
}

export interface ProposalSection {
  id: string;
  name: string;
  orderIndex: number;
  discountType: ProposalDiscountType;
  discountPercent?: number;
  discountValue?: number;
  roundingValue?: number;
  deadlineDays?: number;
  phases: ProposalSectionPhase[];
}

export interface PricingProposal {
  id: string;
  estimateId: string;
  clienteId?: string;
  title: string;
  version: number;
  introductionText?: string;
  scopeDescription?: string;
  exclusionsText?: string;
  paymentConditions?: string;
  paymentData?: string;
  observationsText?: string;
  limiteRevisoes: number;
  prazoFeedbackDias?: number;
  clausulasAdicionais?: string;
  valorHoraAdicional: number;
  finalValue: number;
  validUntil?: string;
  status: PricingProposalStatus;
  pdfFilePath?: string;
  pdfGeneratedAt?: string;
  accessToken?: string;
  sentAt?: string;
  viewedAt?: string;
  approvedAt?: string;
  createdAt: string;
  sections: ProposalSection[];
  unassignedPhases: ProposalSectionPhase[];
  comments: ProposalComment[];
}

export interface ProposalListItem {
  id: string;
  title: string;
  clienteId?: string;
  clienteName?: string;
  finalValue: number;
  status: PricingProposalStatus;
  hasPdf: boolean;
  sentAt?: string;
  approvedAt?: string;
  createdAt: string;
}

export interface PortalProposal {
  id: string;
  title: string;
  introductionText?: string;
  scopeDescription?: string;
  exclusionsText?: string;
  paymentConditions?: string;
  paymentData?: string;
  observationsText?: string;
  limiteRevisoes: number;
  prazoFeedbackDias?: number;
  valorHoraAdicional: number;
  finalValue: number;
  validUntil?: string;
  status: PricingProposalStatus;
  hasPdf: boolean;
  createdAt: string;
  comments: ProposalComment[];
  sections: PortalSection[];
}

export interface PortalSection {
  name: string;
  deadlineDays?: number;
  value: number;
  phases: PortalPhase[];
}

export interface PortalPhase {
  name: string;
  description?: string;
  value: number;
  isPriceVisible: boolean;
  isMonthlyBilling: boolean;
  deliverables: string[];
}

export interface UpdateProposalRequest {
  title: string;
  clienteId: string;
  introductionText?: string;
  exclusionsText?: string;
  paymentConditions?: string;
  paymentData?: string;
  observationsText?: string;
  limiteRevisoes: number;
  prazoFeedbackDias?: number;
  valorHoraAdicional: number;
  validUntil?: string;
  sections?: {
    id?: string;
    name: string;
    orderIndex: number;
    discountType?: string;
    discountPercent?: number;
    discountValue?: number;
    roundingValue?: number;
    deadlineDays?: number;
    phaseIds: string[];
  }[];
  phaseUpdates?: {
    id: string;
    isVisible?: boolean;
    isPriceVisible?: boolean;
    description?: string;
    deliverables?: { id?: string; name: string; orderIndex: number }[];
  }[];
}

// ========================================
// Notificacoes
// ========================================

export type NotificationType = "ScheduleDelay" | "PendingApproval" | "DocumentSigned" | "PaymentDue" | "TaskAssigned" | "General";

export interface Notificacao {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  entityType?: string;
  entityId?: string;
  createdAt: string;
}
