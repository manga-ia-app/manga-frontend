"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Filter,
  Clock,
  AlertCircle,
  FileCheck,
  DollarSign,
  ClipboardList,
} from "lucide-react";
import { parseISO, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";
import { showToast } from "@/lib/utils/toast";

import {
  getNotificacoes,
  markNotificacaoAsRead,
  markAllNotificacoesAsRead,
} from "@/lib/api/notificacoes";
import type { Notificacao, NotificationType } from "@/lib/types";

const tipoConfig: Record<
  NotificationType,
  { label: string; icon: React.ElementType; color: string }
> = {
  ScheduleDelay: {
    label: "Atraso no Cronograma",
    icon: Clock,
    color: "text-orange-500 bg-orange-50",
  },
  PendingApproval: {
    label: "Aprovação Pendente",
    icon: AlertCircle,
    color: "text-yellow-500 bg-yellow-50",
  },
  DocumentSigned: {
    label: "Documento Assinado",
    icon: FileCheck,
    color: "text-green-500 bg-green-50",
  },
  PaymentDue: {
    label: "Pagamento Pendente",
    icon: DollarSign,
    color: "text-red-500 bg-red-50",
  },
  TaskAssigned: {
    label: "Tarefa Atribuída",
    icon: ClipboardList,
    color: "text-blue-500 bg-blue-50",
  },
  General: {
    label: "Geral",
    icon: Bell,
    color: "text-gray-500 bg-gray-50",
  },
};

export default function NotificacoesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<string>("todos");
  const [filterIsRead, setFilterIsRead] = useState<string>("todas");

  const { data, isLoading } = useQuery({
    queryKey: ["notificacoes", filterType, filterIsRead],
    queryFn: () =>
      getNotificacoes({
        type: filterType !== "todos" ? filterType : undefined,
        isRead: filterIsRead === "lidas" ? true : filterIsRead === "nao-lidas" ? false : undefined,
        pageSize: 100,
      }),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificacaoAsRead(id),
    onSuccess: () => {
      showToast("success", { title: "Notificacao marcada como lida!" });
      queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllNotificacoesAsRead(),
    onSuccess: () => {
      showToast("success", { title: "Todas as notificacoes marcadas como lidas!" });
      queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
    },
  });

  const notificacoes = data?.items ?? [];
  const unreadCount = notificacoes.filter((n) => !n.isRead).length;

  function handleNotificacaoClick(notificacao: Notificacao) {
    if (!notificacao.isRead) {
      markReadMutation.mutate(notificacao.id);
    }
    if (notificacao.entityType && notificacao.entityId) {
      const routeMap: Record<string, string> = {
        Projeto: `/projetos/${notificacao.entityId}`,
        Tarefa: `/cronograma?tarefa=${notificacao.entityId}`,
        Documento: `/documentos/${notificacao.entityId}`,
        Lancamento: `/financeiro/${notificacao.entityId}`,
      };
      const route = routeMap[notificacao.entityType];
      if (route) {
        router.push(route);
      }
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notificacoes"
        description={
          unreadCount > 0
            ? `Voce tem ${unreadCount} ${unreadCount === 1 ? "notificacao nao lida" : "notificacoes nao lidas"}`
            : "Todas as notificacoes foram lidas"
        }
        action={
          unreadCount > 0 ? (
            <Button
              variant="outline"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              {markAllReadMutation.isPending
                ? "Marcando..."
                : "Marcar todas como lidas"}
            </Button>
          ) : undefined
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              <SelectItem value="ScheduleDelay">Atraso no Cronograma</SelectItem>
              <SelectItem value="PendingApproval">Aprovação Pendente</SelectItem>
              <SelectItem value="DocumentSigned">Documento Assinado</SelectItem>
              <SelectItem value="PaymentDue">Pagamento Pendente</SelectItem>
              <SelectItem value="TaskAssigned">Tarefa Atribuída</SelectItem>
              <SelectItem value="General">Geral</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterIsRead} onValueChange={setFilterIsRead}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="nao-lidas">Nao lidas</SelectItem>
              <SelectItem value="lidas">Lidas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto text-sm text-muted-foreground">
          {notificacoes.length}{" "}
          {notificacoes.length === 1 ? "notificacao" : "notificacoes"}
        </div>
      </div>

      {/* Notifications list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : notificacoes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BellOff className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">
              Nenhuma notificacao encontrada
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {filterType !== "todos" || filterIsRead !== "todas"
                ? "Tente ajustar os filtros."
                : "Voce esta em dia! Novas notificacoes aparecerão aqui."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1">
          {notificacoes
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )
            .map((notificacao) => {
              const config = tipoConfig[notificacao.type];
              const TipoIcon = config.icon;

              return (
                <Card
                  key={notificacao.id}
                  className={cn(
                    "transition-colors cursor-pointer",
                    !notificacao.isRead
                      ? "bg-primary/5 border-primary/20 hover:bg-primary/10"
                      : "hover:bg-muted/50"
                  )}
                  onClick={() => handleNotificacaoClick(notificacao)}
                >
                  <CardContent className="flex items-start gap-4 py-4">
                    {/* Icon */}
                    <div
                      className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                        config.color
                      )}
                    >
                      <TipoIcon className="h-5 w-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3
                            className={cn(
                              "text-sm",
                              !notificacao.isRead
                                ? "font-semibold"
                                : "font-medium"
                            )}
                          >
                            {notificacao.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                            {notificacao.message}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {!notificacao.isRead && (
                            <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {config.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(parseISO(notificacao.createdAt), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Mark as read button */}
                    {!notificacao.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          markReadMutation.mutate(notificacao.id);
                        }}
                        title="Marcar como lida"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
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
