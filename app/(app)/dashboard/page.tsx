"use client";

import {
  FolderKanban,
  Activity,
  UserPlus,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

interface StatCard {
  title: string;
  value: string;
  icon: React.ElementType;
  trend: {
    value: string;
    direction: "up" | "down";
    label: string;
  };
}

const stats: StatCard[] = [
  {
    title: "Total Projetos",
    value: "24",
    icon: FolderKanban,
    trend: {
      value: "+12%",
      direction: "up",
      label: "vs. mês anterior",
    },
  },
  {
    title: "Projetos Ativos",
    value: "8",
    icon: Activity,
    trend: {
      value: "+2",
      direction: "up",
      label: "novos este mês",
    },
  },
  {
    title: "Leads",
    value: "15",
    icon: UserPlus,
    trend: {
      value: "+5",
      direction: "up",
      label: "esta semana",
    },
  },
  {
    title: "Receitas do Mês",
    value: "R$ 142.580",
    icon: DollarSign,
    trend: {
      value: "-3%",
      direction: "down",
      label: "vs. mês anterior",
    },
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Visão geral do seu negócio
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const TrendIcon =
            stat.trend.direction === "up" ? TrendingUp : TrendingDown;

          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="mt-1 flex items-center gap-1 text-xs">
                  <TrendIcon
                    className={cn(
                      "h-3 w-3",
                      stat.trend.direction === "up"
                        ? "text-green-500"
                        : "text-destructive"
                    )}
                  />
                  <span
                    className={cn(
                      "font-medium",
                      stat.trend.direction === "up"
                        ? "text-green-500"
                        : "text-destructive"
                    )}
                  >
                    {stat.trend.value}
                  </span>
                  <span className="text-muted-foreground">
                    {stat.trend.label}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Placeholder sections for future content */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Projetos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Nenhum projeto recente para exibir.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Nenhuma atividade recente para exibir.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
