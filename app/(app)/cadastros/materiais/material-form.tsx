"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getFornecedores } from "@/lib/api/cadastros";
import { maskCurrency, unmaskCurrency } from "@/lib/utils/masks";
import type { Material } from "@/lib/types";

const UNIDADES = [
  { value: "Unidade", label: "Unidade (un)" },
  { value: "M", label: "Metro (m)" },
  { value: "M2", label: "Metro quadrado (m²)" },
  { value: "Hr", label: "Hora (h)" },
  { value: "Vb", label: "Verba (vb)" },
];

const materialSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  unit: z.string().min(1, "Unidade é obrigatória"),
  defaultPrice: z.string().optional(),
  fornecedorId: z.string().optional(),
  category: z.string().optional(),
});

export type MaterialFormData = z.infer<typeof materialSchema>;

interface MaterialFormProps {
  defaultValues?: Partial<Material>;
  onSubmit: (data: MaterialFormData) => void;
  isSubmitting?: boolean;
}

export function MaterialForm({
  defaultValues,
  onSubmit,
  isSubmitting,
}: MaterialFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<MaterialFormData>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      description: defaultValues?.description || "",
      unit: defaultValues?.unit ?? "Unidade",
      defaultPrice: defaultValues?.defaultPrice
        ? maskCurrency(String(Math.round(defaultValues.defaultPrice * 100)))
        : "",
      fornecedorId: defaultValues?.fornecedorId || "",
      category: defaultValues?.category || "",
    },
  });

  const unit = watch("unit");
  const fornecedorId = watch("fornecedorId");

  const { data: fornecedoresData } = useQuery({
    queryKey: ["fornecedores", { pageSize: 100 }],
    queryFn: () => getFornecedores({ pageSize: 100 }),
  });

  const fornecedores = fornecedoresData?.items || [];

  function handleFormSubmit(data: MaterialFormData) {
    onSubmit({
      ...data,
      defaultPrice: data.defaultPrice ? unmaskCurrency(data.defaultPrice) : 0,
    } as any);
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Dados do Material</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                placeholder="Nome do material"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Input
                id="category"
                placeholder="Ex: Acabamento, Estrutura, Elétrica"
                {...register("category")}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="unit">Unidade *</Label>
              <Select
                value={unit}
                onValueChange={(value) => setValue("unit", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a unidade" />
                </SelectTrigger>
                <SelectContent>
                  {UNIDADES.map((u) => (
                    <SelectItem key={u.value} value={u.value}>
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.unit && (
                <p className="text-sm text-destructive">
                  {errors.unit.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultPrice">Preço Unitário (R$) *</Label>
              <Controller
                name="defaultPrice"
                control={control}
                render={({ field }) => (
                  <Input
                    id="defaultPrice"
                    placeholder="0,00"
                    value={field.value || ""}
                    onChange={(e) => field.onChange(maskCurrency(e.target.value))}
                  />
                )}
              />
              {errors.defaultPrice && (
                <p className="text-sm text-destructive">
                  {errors.defaultPrice.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fornecedorId">Fornecedor</Label>
            <Select
              value={fornecedorId || ""}
              onValueChange={(value: string) =>
                setValue("fornecedorId", value === "__none__" ? "" : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um fornecedor (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Nenhum</SelectItem>
                {fornecedores.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descrição detalhada do material"
              {...register("description")}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Salvar"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
