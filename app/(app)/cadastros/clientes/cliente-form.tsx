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
import type { Cliente } from "@/lib/types";
import { maskCpfCnpj, maskPhone, unmask } from "@/lib/utils/masks";

const clienteSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  cpfCnpj: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  birthDate: z.string().optional(),
});

export type ClienteFormData = z.infer<typeof clienteSchema>;

interface ClienteFormProps {
  defaultValues?: Partial<Cliente>;
  onSubmit: (data: ClienteFormData) => void;
  isSubmitting?: boolean;
}

export function ClienteForm({
  defaultValues,
  onSubmit,
  isSubmitting,
}: ClienteFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      cpfCnpj: defaultValues?.cpfCnpj ? maskCpfCnpj(defaultValues.cpfCnpj) : "",
      email: defaultValues?.email || "",
      phone: defaultValues?.phone ? maskPhone(defaultValues.phone) : "",
      address: defaultValues?.address || "",
      notes: defaultValues?.notes || "",
      birthDate: defaultValues?.birthDate || "",
    },
  });

  function handleFormSubmit(data: ClienteFormData) {
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
          <CardTitle>Dados do Cliente</CardTitle>
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
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                placeholder="Rua, número, complemento, cidade, UF, CEP"
                {...register("address")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate">Data de Aniversário</Label>
              <Input
                id="birthDate"
                type="date"
                {...register("birthDate")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Observações adicionais sobre o cliente"
              {...register("notes")}
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
