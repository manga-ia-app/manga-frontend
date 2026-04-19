"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { getServicos } from "@/lib/api/cadastros";
import type { Servico } from "@/lib/types";

type Row = Record<string, unknown>;

const UNIT_LABELS: Record<string, string> = { Unidade: "un", M2: "m²", M: "m", Hr: "h", Vb: "vb" };

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

export default function ServicosPage() {
  const router = useRouter();

  const columns: DataTableColumn<Row>[] = [
    { key: "name", header: "Nome" },
    { key: "category", header: "Categoria" },
    {
      key: "unit",
      header: "Unidade",
      render: (item) => {
        const servico = item as unknown as Servico;
        return UNIT_LABELS[servico.unit] || String(servico.unit);
      },
    },
    {
      key: "defaultPrice",
      header: "Preço Unitário",
      render: (item) => {
        const servico = item as unknown as Servico;
        return formatCurrency(servico.defaultPrice);
      },
    },
    {
      key: "actions",
      header: "Ações",
      render: (item) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/cadastros/servicos/${item.id as string}`);
          }}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      ),
    },
  ];
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["servicos", { search, page }],
    queryFn: () => getServicos({ search, page, pageSize: 20 }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Serviços"
        description="Gerencie seus serviços"
        action={
          <Button onClick={() => router.push("/cadastros/servicos/novo")}>
            <Plus className="mr-2 h-4 w-4" /> Novo Serviço
          </Button>
        }
      />

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar serviços..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={(data?.items as unknown as Row[]) || []}
        loading={isLoading}
        onRowClick={(item) =>
          router.push(`/cadastros/servicos/${item.id as string}`)
        }
      />

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {data.totalCount} registro(s) encontrado(s)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.totalPages}
              onClick={() => setPage(page + 1)}
            >
              {"Próximo"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
