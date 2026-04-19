"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Calendar, MapPin, Clock, Filter, Search, Users, Package, AlertCircle } from "lucide-react";
import { format, parseISO, isToday, isTomorrow, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils/cn";
import { showToast } from "@/lib/utils/toast";

import { getEventos, createEvento } from "@/lib/api/agenda";
import type { AgendaEvento, EventoType } from "@/lib/types";

const tipoConfig: Record<EventoType, { label: string; color: string; icon: React.ElementType }> = {
  Meeting: { label: "Reunião", color: "bg-blue-500", icon: Users },
  SiteVisit: { label: "Visita", color: "bg-green-500", icon: MapPin },
  Delivery: { label: "Entrega", color: "bg-orange-500", icon: Package },
  Deadline: { label: "Prazo", color: "bg-red-500", icon: AlertCircle },
  Other: { label: "Outro", color: "bg-gray-500", icon: Calendar },
};

function getDateLabel(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return "Hoje";
  if (isTomorrow(date)) return "Amanha";
  return format(date, "EEEE, dd 'de' MMMM", { locale: ptBR });
}

function groupEventsByDate(events: AgendaEvento[]): Record<string, AgendaEvento[]> {
  const groups: Record<string, AgendaEvento[]> = {};
  const sorted = [...events].sort(
    (a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
  );

  for (const event of sorted) {
    const dateKey = startOfDay(parseISO(event.startDateTime)).toISOString();
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(event);
  }

  return groups;
}

export default function AgendaPage() {
  const queryClient = useQueryClient();
  const [filterTipo, setFilterTipo] = useState<string>("todos");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state for new event
  const [novoEvento, setNovoEvento] = useState({
    title: "",
    type: "Meeting" as EventoType,
    description: "",
    startDateTime: "",
    endDateTime: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["eventos", filterTipo, search],
    queryFn: () =>
      getEventos({
        search: search || undefined,
        tipo: filterTipo !== "todos" ? filterTipo : undefined,
      }),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<AgendaEvento>) => createEvento(data),
    onSuccess: () => {
      showToast("success", { title: "Evento criado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["eventos"] });
      setDialogOpen(false);
      setNovoEvento({
        title: "",
        type: "Meeting",
        description: "",
        startDateTime: "",
        endDateTime: "",
      });
    },
  });

  const eventos = data?.items ?? [];
  const groupedEvents = groupEventsByDate(eventos);

  function handleCreateEvento() {
    if (!novoEvento.title || !novoEvento.startDateTime || !novoEvento.endDateTime) return;
    createMutation.mutate({
      title: novoEvento.title,
      type: novoEvento.type,
      description: novoEvento.description || undefined,
      startDateTime: novoEvento.startDateTime,
      endDateTime: novoEvento.endDateTime,
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda"
        description="Gerencie seus eventos, reunioes e prazos"
        action={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Evento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Novo Evento</DialogTitle>
                <DialogDescription>
                  Preencha os dados do evento para adicionar a agenda.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Titulo *</Label>
                  <Input
                    id="title"
                    placeholder="Nome do evento"
                    value={novoEvento.title}
                    onChange={(e) =>
                      setNovoEvento({ ...novoEvento, title: e.target.value })
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select
                    value={novoEvento.type}
                    onValueChange={(value) =>
                      setNovoEvento({ ...novoEvento, type: value as EventoType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Meeting">Reunião</SelectItem>
                      <SelectItem value="SiteVisit">Visita</SelectItem>
                      <SelectItem value="Delivery">Entrega</SelectItem>
                      <SelectItem value="Deadline">Prazo</SelectItem>
                      <SelectItem value="Other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startDateTime">Inicio *</Label>
                    <Input
                      id="startDateTime"
                      type="datetime-local"
                      value={novoEvento.startDateTime}
                      onChange={(e) =>
                        setNovoEvento({ ...novoEvento, startDateTime: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endDateTime">Fim *</Label>
                    <Input
                      id="endDateTime"
                      type="datetime-local"
                      value={novoEvento.endDateTime}
                      onChange={(e) =>
                        setNovoEvento({ ...novoEvento, endDateTime: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Descricao</Label>
                  <Input
                    id="description"
                    placeholder="Detalhes do evento"
                    value={novoEvento.description}
                    onChange={(e) =>
                      setNovoEvento({ ...novoEvento, description: e.target.value })
                    }
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateEvento}
                  disabled={
                    createMutation.isPending ||
                    !novoEvento.title ||
                    !novoEvento.startDateTime ||
                    !novoEvento.endDateTime
                  }
                >
                  {createMutation.isPending ? "Salvando..." : "Criar Evento"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar eventos..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo de evento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              <SelectItem value="Meeting">Reunião</SelectItem>
              <SelectItem value="SiteVisit">Visita</SelectItem>
              <SelectItem value="Delivery">Entrega</SelectItem>
              <SelectItem value="Deadline">Prazo</SelectItem>
              <SelectItem value="Other">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Events list grouped by date */}
      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <div className="h-5 w-48 animate-pulse rounded bg-muted" />
              <div className="space-y-2">
                {[1, 2].map((j) => (
                  <div
                    key={j}
                    className="h-20 animate-pulse rounded-lg bg-muted"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : eventos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Nenhum evento encontrado</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Crie um novo evento para comecar a organizar sua agenda.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedEvents).map(([dateKey, dayEvents]) => (
            <div key={dateKey}>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {getDateLabel(dayEvents[0].startDateTime)}
              </h2>
              <div className="space-y-2">
                {dayEvents.map((evento) => {
                  const config = tipoConfig[evento.type];

                  return (
                    <Card
                      key={evento.id}
                      className="transition-colors hover:bg-muted/50"
                    >
                      <CardContent className="flex items-start gap-4 py-4">
                        {/* Time indicator */}
                        <div className="flex flex-col items-center min-w-[60px] text-center">
                          <span className="text-lg font-bold">
                            {format(parseISO(evento.startDateTime), "HH:mm")}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(parseISO(evento.endDateTime), "HH:mm")}
                          </span>
                        </div>

                        <Separator orientation="vertical" className="h-12" />

                        {/* Event details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold truncate">
                              {evento.title}
                            </h3>
                            <Badge
                              className={cn(
                                "text-xs font-medium",
                                config.color
                              )}
                              variant="secondary"
                            >
                              {config.label}
                            </Badge>
                          </div>

                          {evento.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                              {evento.description}
                            </p>
                          )}

                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(parseISO(evento.startDateTime), "HH:mm")} -{" "}
                              {format(parseISO(evento.endDateTime), "HH:mm")}
                            </span>
                            {evento.participantes &&
                              evento.participantes.length > 0 && (
                                <span>
                                  {evento.participantes.length} participante(s)
                                </span>
                              )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
