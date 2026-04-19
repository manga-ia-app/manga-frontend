"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Users,
  UserCheck,
  Truck,
  Wrench,
  Package,
  Briefcase,
  FolderKanban,
  FileStack,
  UserPlus,
  FileText,
  HardHat,
  ClipboardList,
  User,
  Palette,
  Bell,
  BarChart3,
  LayoutList,
  Calculator,
  Building2,
  type LucideIcon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

// Altere para true para exibir todas as funcionalidades (pos-MVP)
const SHOW_ALL_FEATURES = false;

const mvpNavigation: NavSection[] = [
  {
    title: "Principal",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Cadastros",
    items: [
      { label: "Clientes", href: "/cadastros/clientes", icon: Users },
      { label: "Colaboradores", href: "/cadastros/colaboradores", icon: UserCheck },
      { label: "Grupos e Cargos", href: "/cadastros/grupos-cargos", icon: Briefcase },
    ],
  },
  {
    title: "Projetos",
    items: [
      { label: "Projetos", href: "/projetos", icon: FolderKanban },
      { label: "Templates", href: "/configuracoes/templates", icon: FileStack },
    ],
  },
  {
    title: "Precificacao",
    items: [
      { label: "Estimativas", href: "/estimativas", icon: Calculator },
      { label: "Propostas", href: "/precificacao/propostas", icon: FileText },
    ],
  },
  {
    title: "Configuracoes",
    items: [
      { label: "Escritorio", href: "/configuracoes/escritorio", icon: Building2 },
      { label: "Overhead", href: "/configuracoes/escritorio/overhead", icon: BarChart3 },
      { label: "Perfil", href: "/configuracoes/perfil", icon: User },
      { label: "Marca", href: "/configuracoes/marca", icon: Palette },
    ],
  },
];

const fullNavigation: NavSection[] = [
  {
    title: "Principal",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Agenda", href: "/agenda", icon: Calendar },
    ],
  },
  {
    title: "Cadastros",
    items: [
      { label: "Clientes", href: "/cadastros/clientes", icon: Users },
      { label: "Colaboradores", href: "/cadastros/colaboradores", icon: UserCheck },
      { label: "Fornecedores", href: "/cadastros/fornecedores", icon: Truck },
      { label: "Servicos", href: "/cadastros/servicos", icon: Wrench },
      { label: "Materiais", href: "/cadastros/materiais", icon: Package },
    ],
  },
  {
    title: "Projetos",
    items: [
      { label: "Projetos", href: "/projetos", icon: FolderKanban },
      { label: "Templates", href: "/configuracoes/templates", icon: FileStack },
    ],
  },
  {
    title: "Precificacao",
    items: [
      { label: "Estimativas", href: "/estimativas", icon: Calculator },
      { label: "Propostas", href: "/precificacao/propostas", icon: FileText },
    ],
  },
  {
    title: "Comercial",
    items: [
      { label: "Leads", href: "/crm/leads", icon: UserPlus },
    ],
  },
  {
    title: "Obra",
    items: [
      { label: "Diario de Obra", href: "/diario-obra", icon: HardHat },
      { label: "Serv. Contratados", href: "/servicos-contratados", icon: ClipboardList },
    ],
  },
  {
    title: "Relatorios",
    items: [
      { label: "Relatorios", href: "/relatorios", icon: BarChart3 },
    ],
  },
  {
    title: "Configuracoes",
    items: [
      { label: "Escritorio", href: "/configuracoes/escritorio", icon: Building2 },
      { label: "Perfil", href: "/configuracoes/perfil", icon: User },
      { label: "Marca", href: "/configuracoes/marca", icon: Palette },
      { label: "Categorias Orcamento", href: "/configuracoes/categorias-orcamento", icon: LayoutList },
      { label: "Notificacoes", href: "/notificacoes", icon: Bell },
    ],
  },
];

const navigation = SHOW_ALL_FEATURES ? fullNavigation : mvpNavigation;

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Building2 className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Manga</span>
                  <span className="truncate text-xs text-sidebar-foreground/70">
                    v0.1.0
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navigation.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(item.href + "/");

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.label}
                      >
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="sm" className="text-sidebar-foreground/50 pointer-events-none">
              <span className="truncate text-xs">Manga v0.1.0</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
