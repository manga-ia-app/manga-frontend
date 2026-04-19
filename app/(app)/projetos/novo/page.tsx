"use client";

import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { createProjeto, getTemplates } from "@/lib/api/projetos";
import { getClientes } from "@/lib/api/cadastros";
import { maskCurrency, unmaskCurrency } from "@/lib/utils/masks";
import { showToast } from "@/lib/utils/toast";

const projetoSchema = z.object({
  name: z.string().min(1, "Nome e obrigatorio"),
  clienteId: z.string().min(1, "Cliente e obrigatorio"),
  templateId: z.string().optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  startDate: z.string().optional(),
  expectedEndDate: z.string().optional(),
  totalBudget: z.string().optional(),
});

type ProjetoFormData = z.infer<typeof projetoSchema>;

export default function NovoProjetoPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<ProjetoFormData>({
    resolver: zodResolver(projetoSchema),
    defaultValues: {
      name: "",
      clienteId: "",
      templateId: "",
      description: "",
      address: "",
      startDate: "",
      expectedEndDate: "",
      totalBudget: "",
    },
  });

  const { data: clientesData } = useQuery({
    queryKey: ["clientes"],
    queryFn: () => getClientes({ pageSize: 100 }),
  });

  const { data: templatesData } = useQuery({
    queryKey: ["templates"],
    queryFn: () => getTemplates(),
  });

  const clientes = clientesData?.items ?? [];
  const templates = templatesData ?? [];

  const mutation = useMutation({
    mutationFn: (data: ProjetoFormData) => {
      const payload: Record<string, unknown> = {
        name: data.name,
        clienteId: data.clienteId,
        description: data.description || undefined,
        address: data.address || undefined,
        startDate: data.startDate || undefined,
        expectedEndDate: data.expectedEndDate || undefined,
        totalBudget: data.totalBudget ? unmaskCurrency(data.totalBudget) : 0,
        templateId: data.templateId || undefined,
      };
      return createProjeto(payload);
    },
    onSuccess: (projeto) => {
      showToast("success", { title: "Projeto criado com sucesso!" });
      router.push(`/projetos/${projeto.id}`);
    },
  });

  const onSubmit = (data: ProjetoFormData) => {
    mutation.mutate(data);
  };

  const selectedClienteId = watch("clienteId");
  const selectedTemplateId = watch("templateId");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Novo Projeto"
        description="Preencha os dados para criar um novo projeto"
        action={
          <Button variant="outline" onClick={() => router.push("/projetos")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6">
          {/* Informacoes basicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informacoes Basicas</CardTitle>
              <CardDescription>Dados principais do projeto</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="name">Nome do Projeto *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Residencia Silva"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="clienteId">Cliente *</Label>
                <Select
                  value={selectedClienteId}
                  onValueChange={(value) => setValue("clienteId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.clienteId && (
                  <p className="text-sm text-destructive mt-1">{errors.clienteId.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="templateId">Template (opcional)</Label>
                <Select
                  value={selectedTemplateId}
                  onValueChange={(value) => setValue("templateId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="description">Descricao</Label>
                <textarea
                  id="description"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Descricao do projeto..."
                  {...register("description")}
                />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="address">Endereco</Label>
                <Input
                  id="address"
                  placeholder="Rua, numero, cidade, UF"
                  {...register("address")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Datas e valores */}
          <Card>
            <CardHeader>
              <CardTitle>Datas e Valores</CardTitle>
              <CardDescription>Cronograma e orcamento estimado</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Data de Inicio</Label>
                  <Input
                    id="startDate"
                    type="date"
                    {...register("startDate")}
                  />
                </div>
                <div>
                  <Label htmlFor="expectedEndDate">Previsao de Termino</Label>
                  <Input
                    id="expectedEndDate"
                    type="date"
                    {...register("expectedEndDate")}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="totalBudget">Valor Total (R$)</Label>
                <Controller
                  name="totalBudget"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="totalBudget"
                      placeholder="0,00"
                      value={field.value || ""}
                      onChange={(e) => field.onChange(maskCurrency(e.target.value))}
                    />
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/projetos")}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Criar Projeto
          </Button>
        </div>

        {mutation.isError && (
          <p className="text-sm text-destructive mt-4">
            Erro ao criar projeto. Tente novamente.
          </p>
        )}
      </form>
    </div>
  );
}
