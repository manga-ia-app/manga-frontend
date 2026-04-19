"use client";

import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Layers,
  Calculator,
  Calendar,
  DollarSign,
  FileText,
  PenTool,
  Wrench,
  HardHat,
  Users,
  ArrowLeft,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils/cn";
import { getProjetoById } from "@/lib/api/projetos";
import type { ProjectStatus } from "@/lib/types";

const statusConfig: Record<
  ProjectStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  Planning: { label: "Planejamento", variant: "outline" },
  Briefing: { label: "Briefing", variant: "secondary" },
  InProgress: { label: "Em Andamento", variant: "default" },
  Paused: { label: "Pausado", variant: "secondary" },
  Completed: { label: "Concluido", variant: "outline" },
  Cancelled: { label: "Cancelado", variant: "destructive" },
};

const tabs = [
  { label: "Visao Geral", href: "", icon: LayoutDashboard },
  { label: "Fases", href: "/fases", icon: Layers },
  { label: "Orcamento", href: "/orcamento", icon: Calculator },
  { label: "Cronograma", href: "/cronograma", icon: Calendar },
  { label: "Financeiro", href: "/financeiro", icon: DollarSign },
  { label: "Documentos", href: "/documentos", icon: FileText },
  { label: "Assinaturas", href: "/assinaturas", icon: PenTool },
  { label: "Servicos", href: "/servicos-contratados", icon: Wrench },
  { label: "Diario de Obra", href: "/diario-obra", icon: HardHat },
  { label: "Equipe", href: "/equipe", icon: Users },
];

export default function ProjetoDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const projetoId = params.id as string;
  const basePath = `/projetos/${projetoId}`;

  const { data: projeto, isLoading } = useQuery({
    queryKey: ["projeto", projetoId],
    queryFn: () => getProjetoById(projetoId),
    enabled: !!projetoId,
  });

  return (
    <div className="space-y-6">
      {/* Project header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link href="/projetos">
            <Button variant="ghost" size="icon" className="mt-1">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            {isLoading ? (
              <>
                <div className="h-7 w-48 animate-pulse rounded bg-muted" />
                <div className="h-4 w-32 animate-pulse rounded bg-muted mt-1" />
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold tracking-tight">
                  {projeto?.name ?? "Projeto"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {projeto?.clienteName ?? ""}
                </p>
              </>
            )}
          </div>
        </div>
        {projeto && (
          <Badge variant={statusConfig[projeto.status]?.variant ?? "outline"}>
            {statusConfig[projeto.status]?.label ?? projeto.status}
          </Badge>
        )}
      </div>

      <Separator />

      {/* Horizontal tabs navigation */}
      <div className="border-b">
        <nav className="flex gap-0 overflow-x-auto -mb-px">
          {tabs.map((tab) => {
            const fullHref = basePath + tab.href;
            const isActive =
              tab.href === ""
                ? pathname === basePath || pathname === basePath + "/"
                : pathname.startsWith(fullHref);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={fullHref}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Tab content */}
      <div>{children}</div>
    </div>
  );
}
