"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Plus,
  HardHat,
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  Users,
  Camera,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import apiClient from "@/lib/api/client";
import type { DiarioObraRegistro, WeatherType } from "@/lib/types";

// Local API helper
const fetchDiarioRegistros = async (projetoId: string): Promise<DiarioObraRegistro[]> => {
  const res = await apiClient.get(`/projetos/${projetoId}/diario-obra`);
  return res.data;
};

const climaConfig: Record<WeatherType, { label: string; icon: React.ElementType }> = {
  Sunny: { label: "Ensolarado", icon: Sun },
  Cloudy: { label: "Nublado", icon: Cloud },
  Rainy: { label: "Chuvoso", icon: CloudRain },
  Stormy: { label: "Tempestade", icon: CloudLightning },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

export default function DiarioObraPage() {
  const params = useParams();
  const projetoId = params.id as string;

  const { data: registros, isLoading } = useQuery({
    queryKey: ["diario-obra", projetoId],
    queryFn: () => fetchDiarioRegistros(projetoId),
    enabled: !!projetoId,
  });

  const allRegistros = (registros ?? []).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Diario de Obra</h3>
          <p className="text-sm text-muted-foreground">
            Registro diario das atividades realizadas na obra.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Registro
        </Button>
      </div>

      {/* Entries */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 w-1/3 rounded bg-muted" />
                <div className="h-4 w-1/4 rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="h-4 w-full rounded bg-muted" />
                <div className="h-4 w-3/4 rounded bg-muted mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : allRegistros.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <HardHat className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Nenhum registro de obra</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Comece a registrar as atividades diarias da obra.
          </p>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Registro
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {allRegistros.map((registro) => {
            const climatCfg = registro.weather ? climaConfig[registro.weather] : null;
            const ClimaIcon = climatCfg?.icon ?? Sun;
            const fotos = registro.fotos ?? [];
            const ocorrencias = registro.ocorrencias ?? [];

            return (
              <Card key={registro.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base capitalize">
                        {formatDate(registro.date)}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      {/* Weather */}
                      {registro.weather && (
                        <div className="flex items-center gap-1">
                          <ClimaIcon className="h-4 w-4" />
                          <span>{climatCfg?.label}</span>
                          {registro.temperature != null && (
                            <span>{registro.temperature}°C</span>
                          )}
                        </div>
                      )}
                      {/* Workers */}
                      {registro.workersCount != null && (
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{registro.workersCount}</span>
                        </div>
                      )}
                      {/* Photos */}
                      {fotos.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Camera className="h-4 w-4" />
                          <span>{fotos.length}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Activities */}
                  <div>
                    <h4 className="text-sm font-medium mb-1">Atividades</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {registro.description}
                    </p>
                  </div>

                  {/* Occurrences */}
                  {ocorrencias.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4" />
                          Ocorrencias ({ocorrencias.length})
                        </h4>
                        <div className="space-y-2">
                          {ocorrencias.map((oc) => (
                            <div
                              key={oc.id}
                              className="flex items-start justify-between rounded-lg border p-3"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge
                                    variant={
                                      oc.severity === "Critical" || oc.severity === "High"
                                        ? "destructive"
                                        : "outline"
                                    }
                                    className="text-xs"
                                  >
                                    {oc.severity}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {oc.type}
                                  </Badge>
                                </div>
                                <p className="text-sm">{oc.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Photo thumbnails */}
                  {fotos.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-medium mb-2">Fotos ({fotos.length})</h4>
                        <div className="flex gap-2 overflow-x-auto">
                          {fotos.map((foto) => (
                            <div
                              key={foto.id}
                              className="h-20 w-20 shrink-0 rounded-lg bg-muted flex items-center justify-center overflow-hidden"
                            >
                              <img
                                src={foto.filePath}
                                alt={foto.description ?? "Foto da obra"}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
