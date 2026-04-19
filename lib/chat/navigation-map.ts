import { NavigationMapEntry } from "../types/chat";

// ── Navigation routes (source of truth — frontend owns these) ────────

const navigationMap: NavigationMapEntry[] = [
  { keywords: ["dashboard", "inicio", "home", "pagina inicial", "painel"], route: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { keywords: ["colaborador", "colaboradores", "equipe", "time", "funcionario", "funcionarios"], route: "/cadastros/colaboradores", label: "Colaboradores", icon: "Users" },
  { keywords: ["cargo", "cargos", "grupo", "grupos", "departamento"], route: "/cadastros/grupos-cargos", label: "Grupos e Cargos", icon: "Briefcase" },
  { keywords: ["cliente", "clientes", "contratante"], route: "/cadastros/clientes", label: "Clientes", icon: "UserRound" },
  { keywords: ["projeto", "projetos", "obra", "obras"], route: "/projetos", label: "Projetos", icon: "FolderKanban" },
  { keywords: ["template", "templates", "modelo", "modelos"], route: "/configuracoes/templates", label: "Templates de Projeto", icon: "FileStack" },
  { keywords: ["estimativa", "estimativas", "precificacao", "honorario"], route: "/estimativas", label: "Estimativas", icon: "Calculator" },
  { keywords: ["proposta", "propostas", "orcamento", "pdf"], route: "/precificacao/propostas", label: "Propostas", icon: "FileText" },
  { keywords: ["escritorio", "configuracao", "config"], route: "/configuracoes/escritorio", label: "Escritório", icon: "Building2" },
  { keywords: ["overhead", "custo fixo", "despesa", "raio-x"], route: "/configuracoes/escritorio/overhead", label: "Overhead", icon: "PieChart" },
  { keywords: ["perfil", "meu perfil", "conta", "minha conta"], route: "/configuracoes/perfil", label: "Perfil", icon: "User" },
  { keywords: ["marca", "logo", "logotipo", "branding"], route: "/configuracoes/marca", label: "Marca", icon: "Palette" },
];

/** No-op — routes are hardcoded. Kept for API compat with use-chat.ts. */
export async function loadNavigationRoutes(): Promise<void> {}

// ── Match logic ──────────────────────────────────────────────────────

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function matchNavigation(query: string): NavigationMapEntry[] {
  const normalizedQuery = normalize(query);

  return navigationMap.filter((entry) =>
    entry.keywords.some((keyword) => normalizedQuery.includes(normalize(keyword)))
  );
}

export { navigationMap };
