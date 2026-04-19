"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import React from "react";

/** Maps URL segments to readable Portuguese labels */
const segmentLabels: Record<string, string> = {
  dashboard: "Dashboard",
  cadastros: "Cadastros",
  clientes: "Clientes",
  colaboradores: "Colaboradores",
  "grupos-cargos": "Grupos e Cargos",
  cargos: "Cargos",
  fornecedores: "Fornecedores",
  servicos: "Serviços",
  materiais: "Materiais",
  projetos: "Projetos",
  estimativas: "Estimativas",
  precificacao: "Precificação",
  propostas: "Propostas",
  configuracoes: "Configurações",
  escritorio: "Escritório",
  overhead: "Overhead",
  perfil: "Perfil",
  marca: "Marca",
  templates: "Templates",
  novo: "Novo",
  agenda: "Agenda",
  crm: "CRM",
  leads: "Leads",
  "diario-obra": "Diário de Obra",
  "servicos-contratados": "Serv. Contratados",
  relatorios: "Relatórios",
  notificacoes: "Notificações",
  "categorias-orcamento": "Categorias Orçamento",
};

function isUuid(segment: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);
}

export function AppBreadcrumb() {
  const pathname = usePathname();

  const segments = pathname.split("/").filter(Boolean);

  // Don't show breadcrumbs on dashboard (root page)
  if (segments.length <= 1 && segments[0] === "dashboard") {
    return null;
  }

  const crumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const label = isUuid(segment)
      ? "Detalhes"
      : segmentLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    const isLast = index === segments.length - 1;
    return { href, label, isLast };
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => (
          <React.Fragment key={crumb.href}>
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {crumb.isLast ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={crumb.href}>{crumb.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
