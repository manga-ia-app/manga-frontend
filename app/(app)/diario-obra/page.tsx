"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  HardHat,
  Search,
  FolderKanban,
  ArrowRight,
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  Camera,
  Users,
  AlertTriangle,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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

import { getProjetos } from "@/lib/api/projetos";
import { getDiarioObraRegistros } from "@/lib/api/diario-obra";
import type { Projeto, DiarioObraRegistro, WeatherType } from "@/lib/types";

const climaConfig: Record<WeatherType, { label: string; icon: React.ElementType }> = {
  Sunny: { label: "Ensolarado", icon: Sun },
  Cloudy: { label: "Nublado", icon: Cloud },
  Rainy: { label: "Chuvoso", icon: CloudRain },
  Stormy: { label: "Tempestuoso", icon: CloudLightning },
};

export default function DiarioObraPage() {
  const router = useRouter();
  const [selectedProjetoId, setSelectedProjetoId] = useState<string>("");
  const [search, setSearch] = useState("");

  const { data: projetosData, isLoading: isLoadingProjetos } = useQuery({
    queryKey: ["projetos-diario"],
    queryFn: () => getProjetos({ pageSize: 200 }),
  });

  const { data: registrosData, isLoading: isLoadingRegistros } = useQuery({
    queryKey: ["diario-obra", selectedProjetoId],
    queryFn: () => getDiarioObraRegistros(selectedProjetoId, { pageSize: 200 }),
    enabled: !!selectedProjetoId,
  });

  const projetos = projetosData?.items ?? [];
  const registros = registrosData?.items ?? [];
  const selectedProjeto = projetos.find((p) => p.id === selectedProjetoId);

  const filteredRegistros = registros.filter(
    (r) =>
      !search ||
      r.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Diario de Obra"
        description="Acompanhe o registro diario de atividades das obras"
      />

      {/* Project selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FolderKanban className="h-4 w-4" />
            Selecione o Projeto
          </CardTitle>
          <CardDescription>
            Escolha um projeto para visualizar ou adicionar registros ao diario
            de obra.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1 max-w-md">
              <Select
                value={selectedProjetoId}
                onValueChange={setSelectedProjetoId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um projeto..." />
                </SelectTrigger>
                <SelectContent>
                  {projetos.map((projeto) => (
                    <SelectItem key={projeto.id} value={projeto.id}>
                      {projeto.name}
                      {projeto.clienteName ? ` - ${projeto.clienteName}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedProjeto && (
              <Button
                variant="outline"
                onClick={() =>
                  router.push(`/projetos/${selectedProjetoId}/diario-obra`)
                }
              >
                Ir para o Projeto
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loading state for projects */}
      {isLoadingProjetos && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      )}

      {/* No project selected state */}
      {!selectedProjetoId && !isLoadingProjetos && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <HardHat className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">
              Selecione um projeto acima
            </h3>
            <p className="text-sm text-muted-foreground mt-1 text-center max-w-md">
              Para visualizar o diario de obra, selecione um projeto na lista
              acima. Voce podera ver todos os registros de atividades, clima e
              ocorrencias.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Registros list */}
      {selectedProjetoId && (
        <>
          {/* Search and info */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar registros..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {registros.length}{" "}
              {registros.length === 1 ? "registro" : "registros"} encontrados
            </div>
          </div>

          {isLoadingRegistros ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-lg bg-muted"
                />
              ))}
            </div>
          ) : filteredRegistros.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <HardHat className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">
                  Nenhum registro encontrado
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Ainda nao ha registros no diario de obra deste projeto.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredRegistros
                .sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                )
                .map((registro) => {
                  const weatherConfig = registro.weather
                    ? climaConfig[registro.weather]
                    : null;
                  const ClimaIcon = weatherConfig?.icon ?? null;
                  const fotosCount = registro.fotos?.length ?? 0;
                  const ocorrenciasCount = registro.ocorrencias?.length ?? 0;

                  return (
                    <Card
                      key={registro.id}
                      className="transition-colors hover:bg-muted/50"
                    >
                      <CardContent className="py-4">
                        <div className="flex items-start gap-4">
                          {/* Date */}
                          <div className="min-w-[80px] text-center">
                            <p className="text-2xl font-bold">
                              {format(parseISO(registro.date), "dd")}
                            </p>
                            <p className="text-xs text-muted-foreground uppercase">
                              {format(parseISO(registro.date), "MMM yyyy", {
                                locale: ptBR,
                              })}
                            </p>
                          </div>

                          <Separator orientation="vertical" className="h-16" />

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm line-clamp-2">
                              {registro.description}
                            </p>

                            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
                              {/* Weather */}
                              {registro.weather && ClimaIcon && weatherConfig && (
                                <span className="flex items-center gap-1">
                                  <ClimaIcon className="h-3.5 w-3.5" />
                                  {weatherConfig.label}
                                  {registro.temperature != null && (
                                    <span> {registro.temperature}C</span>
                                  )}
                                </span>
                              )}

                              {/* Workers count */}
                              {registro.workersCount != null &&
                                registro.workersCount > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Users className="h-3.5 w-3.5" />
                                    {registro.workersCount} trabalhadores
                                  </span>
                                )}

                              {/* Photos count */}
                              {fotosCount > 0 && (
                                <span className="flex items-center gap-1">
                                  <Camera className="h-3.5 w-3.5" />
                                  {fotosCount}{" "}
                                  {fotosCount === 1 ? "foto" : "fotos"}
                                </span>
                              )}

                              {/* Occurrences count */}
                              {ocorrenciasCount > 0 && (
                                <span className="flex items-center gap-1 text-orange-600">
                                  <AlertTriangle className="h-3.5 w-3.5" />
                                  {ocorrenciasCount}{" "}
                                  {ocorrenciasCount === 1
                                    ? "ocorrencia"
                                    : "ocorrencias"}
                                </span>
                              )}
                            </div>
                          </div>

                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
