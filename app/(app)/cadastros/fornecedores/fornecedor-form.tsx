"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Fornecedor } from "@/lib/types";
import { maskCpfCnpj, maskPhone, unmask } from "@/lib/utils/masks";

const fornecedorSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  cpfCnpj: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  category: z.string().optional(),
  address: z.string().optional(),
  bankInfo: z.string().optional(),
});

export type FornecedorFormData = z.infer<typeof fornecedorSchema>;

interface FornecedorFormProps {
  defaultValues?: Partial<Fornecedor>;
  onSubmit: (data: FornecedorFormData) => void;
  isSubmitting?: boolean;
}

export function FornecedorForm({
  defaultValues,
  onSubmit,
  isSubmitting,
}: FornecedorFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FornecedorFormData>({
    resolver: zodResolver(fornecedorSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      cpfCnpj: defaultValues?.cpfCnpj ? maskCpfCnpj(defaultValues.cpfCnpj) : "",
      email: defaultValues?.email || "",
      phone: defaultValues?.phone ? maskPhone(defaultValues.phone) : "",
      category: defaultValues?.category || "",
      address: defaultValues?.address || "",
      bankInfo: defaultValues?.bankInfo || "",
    },
  });

  function handleFormSubmit(data: FornecedorFormData) {
    onSubmit({
      ...data,
      cpfCnpj: data.cpfCnpj ? unmask(data.cpfCnpj) : undefined,
      phone: data.phone ? unmask(data.phone) : undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Dados do Fornecedor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                placeholder="Nome completo ou razão social"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpfCnpj">CPF/CNPJ</Label>
              <Controller
                name="cpfCnpj"
                control={control}
                render={({ field }) => (
                  <Input
                    id="cpfCnpj"
                    placeholder="000.000.000-00"
                    value={field.value || ""}
                    onChange={(e) => field.onChange(maskCpfCnpj(e.target.value))}
                  />
                )}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@exemplo.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <Input
                    id="phone"
                    placeholder="(00) 00000-0000"
                    value={field.value || ""}
                    onChange={(e) => field.onChange(maskPhone(e.target.value))}
                  />
                )}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Input
                id="category"
                placeholder="Ex: Elétrica, Hidráulica, Acabamento"
                {...register("category")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                placeholder="Rua, número, cidade, UF, CEP"
                {...register("address")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bankInfo">Dados Bancários</Label>
            <Textarea
              id="bankInfo"
              placeholder="Banco, agência, conta, PIX, etc."
              {...register("bankInfo")}
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
