"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { ListingChatBar } from "@/components/shared/listing-chat-bar";
import type { HelpContent } from "@/components/shared/help-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getColaboradores, deleteColaborador } from "@/lib/api/cadastros";
import type { TipoVinculo } from "@/lib/types";

const colaboradoresHelp: HelpContent = {
  title: "Cadastro de Colaboradores",
  sections: [
    {
      heading: "Para que serve este cadastro?",
      content:
        "Registre cada pessoa que trabalha no escritório com seu custo real mensal. Esses valores alimentam o cálculo de Custo/Hora na Configuração do Escritório, tornando sua precificação mais precisa.",
    },
    {
      heading: "Tipos de vínculo",
      content:
        "CLT: salário + encargos + benefícios. Terceiros: NF + encargos sobre NF + benefícios. Estagiário: bolsa + seguro + transporte + recesso + benefícios.",
    },
    {
      heading: "Custo Total Mensal",
      content:
        "Calculado automaticamente conforme o tipo de vínculo, modo de encargos e benefícios configurados.",
    },
  ],
};

const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const tipoLabel: Record<TipoVinculo, string> = {
  CLT: "CLT",
  Terceiros: "Terceiros",
  Estagiario: "Estagiário",
};

export default function ColaboradoresPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [tipoVinculoFilter, setTipoVinculoFilter] = useState<string>("");

  const { data, isLoading } = useQuery({
    queryKey: ["colaboradores", search, tipoVinculoFilter],
    queryFn: () =>
      getColaboradores({
        search: search || undefined,
        tipoVinculo: tipoVinculoFilter || undefined,
        pageSize: 50,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteColaborador,
    onSuccess: () => {
      toast.success("Colaborador excluído.");
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
    },
    onError: () => toast.error("Erro ao excluir colaborador."),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Colaboradores"
        description="Gerencie o cadastro de colaboradores e seus custos mensais"
        help={colaboradoresHelp}
        action={
          <Button onClick={() => router.push("/cadastros/colaboradores/novo")}>
            <Plus className="mr-2 h-4 w-4" /> Novo Colaborador
          </Button>
        }
      />

      <ListingChatBar
        contextName="colaboradores"
        placeholder="Pergunte sobre sua equipe..."
      />

      <div className="flex gap-3 items-end">
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar colaboradores"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="filterTipoVinculo" className="text-xs">Vínculo</Label>
          <Select
            value={tipoVinculoFilter || "all"}
            onValueChange={(val) => setTipoVinculoFilter(val === "all" ? "" : val)}
          >
            <SelectTrigger id="filterTipoVinculo" className="flex h-9 w-[160px] rounded-md border border-input bg-background px-3 py-1 text-sm">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="CLT">CLT</SelectItem>
              <SelectItem value="Terceiros">Terceiros</SelectItem>
              <SelectItem value="Estagiario">Estagiário</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Vínculo</TableHead>
              <TableHead>Horas/Mês</TableHead>
              <TableHead className="text-right">Custo/Mês</TableHead>
              <TableHead className="text-right">Custo/Hora</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Carregando...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && data?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Nenhum colaborador encontrado.
                </TableCell>
              </TableRow>
            )}
            {data?.items.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>{c.cargoName ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant="outline">{tipoLabel[c.tipoVinculo] ?? c.tipoVinculo}</Badge>
                </TableCell>
                <TableCell>{c.horasMensais}h</TableCell>
                <TableCell className="text-right">{brl(c.custoTotalMensal)}</TableCell>
                <TableCell className="text-right">{brl(c.custoHoraMensal)}/h</TableCell>
                <TableCell>
                  {c.isAtivo ? (
                    <span className="flex items-center gap-1 text-green-600 text-sm">
                      <UserCheck size={14} /> Ativo
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-muted-foreground text-sm">
                      <UserX size={14} /> Inativo
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Editar ${c.name}`}
                      onClick={() => router.push(`/cadastros/colaboradores/${c.id}`)}
                    >
                      <Pencil size={14} aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      aria-label={`Excluir ${c.name}`}
                      onClick={() => {
                        if (confirm(`Excluir ${c.name}? Esta ação não pode ser desfeita.`)) {
                          deleteMutation.mutate(c.id);
                        }
                      }}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
