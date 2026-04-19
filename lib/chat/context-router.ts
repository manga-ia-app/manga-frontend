import { ContextRouteMapping } from "../types/chat";

interface RouteDefinition {
  pattern: string;
  contextName: string;
  supportsCreation: boolean;
}

const ROUTE_MAPPINGS: RouteDefinition[] = [
  // Configuracoes (more specific first)
  { pattern: "^/configuracoes/escritorio/overhead$", contextName: "overhead", supportsCreation: false },
  { pattern: "^/configuracoes/escritorio$", contextName: "escritorio", supportsCreation: false },
  { pattern: "^/configuracoes/perfil$", contextName: "perfil", supportsCreation: false },
  { pattern: "^/configuracoes/marca$", contextName: "marca", supportsCreation: false },

  // Cadastros (detail routes before list routes)
  { pattern: "^/cadastros/colaboradores/[0-9a-f-]+$", contextName: "colaboradores", supportsCreation: false },
  { pattern: "^/cadastros/colaboradores$", contextName: "colaboradores", supportsCreation: true },
  { pattern: "^/cadastros/grupos-cargos$", contextName: "cargos", supportsCreation: true },
  { pattern: "^/cadastros/clientes$", contextName: "clientes", supportsCreation: true },

  // Precificacao (detail routes before list routes)
  { pattern: "^/precificacao/propostas/[0-9a-f-]+$", contextName: "propostas", supportsCreation: false },
  { pattern: "^/estimativas$", contextName: "estimativa", supportsCreation: false },
  { pattern: "^/precificacao/propostas$", contextName: "propostas", supportsCreation: false },
  { pattern: "^/estimativas/[0-9a-f-]+$", contextName: "estimativa", supportsCreation: false },

  // Projetos (more specific first)
  { pattern: "^/configuracoes/templates$", contextName: "templates", supportsCreation: true },
  { pattern: "^/projetos$", contextName: "projetos", supportsCreation: true },

  // Dashboard
  { pattern: "^/dashboard$", contextName: "dashboard", supportsCreation: false },
];

const UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export function extractEntityId(pathname: string): string | undefined {
  const match = pathname.match(UUID_REGEX);
  return match ? match[0] : undefined;
}

export function resolveContext(pathname: string): ContextRouteMapping | null {
  for (const route of ROUTE_MAPPINGS) {
    const regex = new RegExp(route.pattern, "i");
    if (regex.test(pathname)) {
      return {
        contextName: route.contextName,
        supportsCreation: route.supportsCreation,
        entityId: extractEntityId(pathname),
      };
    }
  }
  return null;
}
