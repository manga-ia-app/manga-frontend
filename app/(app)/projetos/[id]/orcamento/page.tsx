"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Plus,
  ChevronDown,
  ChevronRight,
  Calculator,
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
import type { OrcamentoSummary, OrcamentoCategoriaGroup } from "@/lib/types";

// Local API helper
const fetchSummary = async (projetoId: string): Promise<OrcamentoSummary> => {
  const res = await apiClient.get(`/projetos/${projetoId}/orcamento/summary`);
  return res.data;
};

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function OrcamentoPage() {
  const params = useParams();
  const projetoId = params.id as string;
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const { data: summary, isLoading } = useQuery({
    queryKey: ["orcamento-summary", projetoId],
    queryFn: () => fetchSummary(projetoId),
    enabled: !!projetoId,
  });

  const categories = summary?.categories ?? [];

  const toggleCategory = (categoriaId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoriaId)) {
        next.delete(categoriaId);
      } else {
        next.add(categoriaId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="h-7 w-24 animate-pulse rounded bg-muted" />
              ) : (
                formatCurrency(summary?.totalGeral ?? 0)
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nova Categoria
        </Button>
        <Button variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Novo Item
        </Button>
      </div>

      {/* Categories with expandable items */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 w-1/3 rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="h-4 w-1/2 rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && categories.length === 0 && (
        <Card className="flex flex-col items-center justify-center py-16">
          <Calculator className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Nenhuma categoria de orcamento</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Crie categorias para organizar os itens do orcamento.
          </p>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Categoria
          </Button>
        </Card>
      )}

      {!isLoading && categories.length > 0 && (
        <div className="space-y-3">
          {categories.map((cat) => {
              const isExpanded = expandedCategories.has(cat.categoriaId);
              const items = cat.items ?? [];

              return (
                <Card key={cat.categoriaId}>
                  <div
                    className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleCategory(cat.categoriaId)}
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div>
                        <h3 className="font-medium">{cat.categoriaName}</h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-muted-foreground">
                        {items.length} {items.length === 1 ? "item" : "itens"}
                      </span>
                      <span className="font-semibold">
                        {formatCurrency(cat.subTotal)}
                      </span>
                    </div>
                  </div>

                  {isExpanded && items.length > 0 && (
                    <>
                      <Separator />
                      <div className="px-6 py-3">
                        <div className="space-y-2">
                          {/* Table header */}
                          <div className="grid grid-cols-11 gap-2 text-xs font-medium text-muted-foreground px-2">
                            <div className="col-span-4">Descricao</div>
                            <div className="col-span-1 text-center">Unid.</div>
                            <div className="col-span-2 text-right">Qtd.</div>
                            <div className="col-span-2 text-right">Preco Unit.</div>
                            <div className="col-span-2 text-right">Total</div>
                          </div>

                          {items.map((item) => {
                            return (
                              <div
                                key={item.id}
                                className="grid grid-cols-11 gap-2 items-center text-sm px-2 py-2 rounded hover:bg-muted/30"
                              >
                                <div className="col-span-4 truncate">
                                  {item.description}
                                </div>
                                <div className="col-span-1 text-center text-muted-foreground">
                                  {item.unit}
                                </div>
                                <div className="col-span-2 text-right">
                                  {item.quantity.toLocaleString("pt-BR")}
                                </div>
                                <div className="col-span-2 text-right">
                                  {formatCurrency(item.unitPrice)}
                                </div>
                                <div className="col-span-2 text-right font-medium">
                                  {formatCurrency(item.totalPrice)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}

                  {isExpanded && items.length === 0 && (
                    <>
                      <Separator />
                      <div className="px-6 py-6 text-center text-sm text-muted-foreground">
                        Nenhum item nesta categoria.
                      </div>
                    </>
                  )}
                </Card>
              );
            })}

          {/* Grand total */}
          <div className="flex items-center justify-between px-6 py-4 bg-muted/50 rounded-lg font-semibold">
            <span>Total Geral</span>
            <span className="text-lg">{formatCurrency(summary?.totalGeral ?? 0)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
