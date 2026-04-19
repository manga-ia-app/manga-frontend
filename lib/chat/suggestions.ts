import { ContextSuggestion } from "../types/chat";

const SUGGESTIONS_MAP: Record<string, ContextSuggestion[]> = {
  overhead: [
    { label: "Por que meu overhead está alto?", prompt: "Por que meu overhead está alto?" },
    { label: "Qual meu custo/hora real?", prompt: "Qual meu custo/hora real?" },
    { label: "Como reduzir custos fixos?", prompt: "Como reduzir custos fixos?" },
    { label: "Ver colaboradores", prompt: "Ver colaboradores" },
  ],
  colaboradores: [
    { label: "Qual o custo total da equipe?", prompt: "Qual o custo total da equipe?" },
    { label: "Quem tem o maior salário?", prompt: "Quem tem o maior salário?" },
    { label: "Cadastrar novo colaborador", prompt: "Cadastrar novo colaborador" },
    { label: "Ver cargos", prompt: "Ver cargos" },
  ],
  cargos: [
    { label: "Quais cargos existem?", prompt: "Quais cargos existem?" },
    { label: "Criar novo cargo", prompt: "Criar novo cargo" },
    { label: "Ver colaboradores por cargo", prompt: "Ver colaboradores por cargo" },
  ],
  estimativa: [
    { label: "Como funciona a precificação?", prompt: "Como funciona a precificação?" },
    { label: "Comparar métodos de cálculo", prompt: "Comparar métodos de cálculo" },
    { label: "Ver estimativas recentes", prompt: "Ver estimativas recentes" },
  ],
  propostas: [
    { label: "Ver propostas pendentes", prompt: "Ver propostas pendentes" },
    { label: "Criar nova proposta", prompt: "Criar nova proposta" },
    { label: "Status das propostas", prompt: "Status das propostas" },
  ],
  projetos: [
    { label: "Listar projetos ativos", prompt: "Listar projetos ativos" },
    { label: "Criar novo projeto", prompt: "Criar novo projeto" },
    { label: "Ver templates", prompt: "Ver templates" },
  ],
  dashboard: [
    { label: "Resumo financeiro do escritório", prompt: "Resumo financeiro do escritório" },
    { label: "Como está o overhead?", prompt: "Como está o overhead?" },
    { label: "Ver colaboradores", prompt: "Ver colaboradores" },
    { label: "Abrir estimativas", prompt: "Abrir estimativas" },
  ],
};

const DEFAULT_SUGGESTIONS: ContextSuggestion[] = [
  { label: "Ver dashboard", prompt: "Ver dashboard" },
  { label: "Abrir colaboradores", prompt: "Abrir colaboradores" },
  { label: "Configurações do escritório", prompt: "Configurações do escritório" },
  { label: "Ajuda com precificação", prompt: "Ajuda com precificação" },
];

export function getSuggestions(contextName: string): ContextSuggestion[] {
  return SUGGESTIONS_MAP[contextName] ?? DEFAULT_SUGGESTIONS;
}
