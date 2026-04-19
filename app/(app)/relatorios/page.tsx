"use client";

import { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Calendar,
  DollarSign,
  Truck,
  FileDown,
  ArrowRight,
  Clock,
  PieChart,
  LineChart,
  Loader2,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils/cn";

import apiClient from "@/lib/api/client";

interface ReportType {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  category: string;
  endpoint: string;
}

const reports: ReportType[] = [
  {
    id: "custos-previsto-realizado",
    title: "Custos Previstos vs Realizados",
    description:
      "Compare os custos orcados com os custos efetivamente realizados em cada projeto. Identifique desvios e otimize o planejamento.",
    icon: BarChart3,
    iconColor: "text-blue-600 bg-blue-50",
    category: "Financeiro",
    endpoint: "/relatorios/custos-previsto-realizado",
  },
  {
    id: "cronograma-projetos",
    title: "Cronograma de Projetos",
    description:
      "Visao geral do andamento de todos os projetos, com datas de inicio, previsao e status de cada fase.",
    icon: Calendar,
    iconColor: "text-purple-600 bg-purple-50",
    category: "Projetos",
    endpoint: "/relatorios/cronograma-projetos",
  },
  {
    id: "resumo-financeiro",
    title: "Resumo Financeiro",
    description:
      "Resumo consolidado de receitas, despesas e saldo de todos os projetos. Inclui graficos de evolucao mensal.",
    icon: DollarSign,
    iconColor: "text-green-600 bg-green-50",
    category: "Financeiro",
    endpoint: "/relatorios/resumo-financeiro",
  },
  {
    id: "fornecedores-projeto",
    title: "Fornecedores por Projeto",
    description:
      "Lista de fornecedores envolvidos em cada projeto, com valores contratados, pagos e servicos prestados.",
    icon: Truck,
    iconColor: "text-orange-600 bg-orange-50",
    category: "Cadastros",
    endpoint: "/relatorios/fornecedores-projeto",
  },
  {
    id: "desempenho-equipe",
    title: "Desempenho da Equipe",
    description:
      "Acompanhe a produtividade e a carga de trabalho de cada membro da equipe nos projetos ativos.",
    icon: TrendingUp,
    iconColor: "text-teal-600 bg-teal-50",
    category: "Equipe",
    endpoint: "/relatorios/desempenho-equipe",
  },
  {
    id: "leads-conversao",
    title: "Leads e Conversao",
    description:
      "Analise a taxa de conversao de leads em projetos, tempo medio de conversao e valor medio por lead.",
    icon: PieChart,
    iconColor: "text-indigo-600 bg-indigo-50",
    category: "Comercial",
    endpoint: "/relatorios/leads-conversao",
  },
];

export default function RelatoriosPage() {
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState("ultimo-mes");

  async function handleGenerateReport(report: ReportType) {
    setGeneratingReport(report.id);

    try {
      const response = await apiClient.get(report.endpoint, {
        params: { periodo: selectedPeriod },
        responseType: "blob",
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${report.id}-${new Date().toISOString().split("T")[0]}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      // Error handling - report generation failed
      console.error("Erro ao gerar relatorio");
    } finally {
      setGeneratingReport(null);
    }
  }

  const categories = [...new Set(reports.map((r) => r.category))];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatorios"
        description="Gere relatorios detalhados para acompanhar seus projetos e financas"
      />

      {/* Period selector */}
      <Card>
        <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-medium text-sm">Periodo do Relatorio</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Selecione o periodo base para geracao dos relatorios.
            </p>
          </div>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ultima-semana">Ultima Semana</SelectItem>
              <SelectItem value="ultimo-mes">Ultimo Mes</SelectItem>
              <SelectItem value="ultimo-trimestre">Ultimo Trimestre</SelectItem>
              <SelectItem value="ultimo-semestre">Ultimo Semestre</SelectItem>
              <SelectItem value="ultimo-ano">Ultimo Ano</SelectItem>
              <SelectItem value="todo-periodo">Todo o Periodo</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Reports by category */}
      {categories.map((category) => {
        const categoryReports = reports.filter((r) => r.category === category);

        return (
          <div key={category}>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              {category}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categoryReports.map((report) => {
                const Icon = report.icon;
                const isGenerating = generatingReport === report.id;

                return (
                  <Card
                    key={report.id}
                    className="flex flex-col transition-all hover:shadow-md"
                  >
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                            report.iconColor
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            {report.title}
                          </CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <p className="text-sm text-muted-foreground">
                        {report.description}
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => handleGenerateReport(report)}
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Gerando...
                          </>
                        ) : (
                          <>
                            <FileDown className="mr-2 h-4 w-4" />
                            Gerar Relatorio
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Info card */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">
                Sobre a geracao de relatorios
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Os relatorios sao gerados em tempo real com base nos dados mais
                atualizados. Relatorios com grande volume de dados podem levar
                alguns segundos para serem gerados. O formato padrao de exportacao
                e PDF.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
