"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AxiosError } from "axios";

import { PageHeader } from "@/components/shared/page-header";
import type { HelpContent } from "@/components/shared/help-button";
import {
  ColaboradorForm,
  fromColaborador,
  type ColaboradorFormData,
} from "../colaborador-form";
import { getColaboradorById, updateColaborador } from "@/lib/api/cadastros";
import { toApiPayload } from "../form-utils";

const colaboradoresHelp: HelpContent = {
  title: "Editar Colaborador",
  sections: [
    {
      heading: "Alterações financeiras",
      content:
        "Toda alteração em campos financeiros (salário, encargos, benefícios, NF, bolsa) é registrada automaticamente no Histórico Financeiro, disponível na seção ao final do formulário.",
    },
    {
      heading: "Grupo do colaborador",
      content:
        "O grupo é definido automaticamente pelo cargo selecionado. Para alterar o grupo, altere o cargo.",
    },
  ],
};

export default function EditColaboradorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: colaborador, isLoading } = useQuery({
    queryKey: ["colaborador", id],
    queryFn: () => getColaboradorById(id),
  });

  const mutation = useMutation({
    mutationFn: (data: ColaboradorFormData) =>
      updateColaborador(id, toApiPayload(data)),
    onSuccess: () => {
      toast.success("Colaborador atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
      queryClient.invalidateQueries({ queryKey: ["colaborador", id] });
      router.push("/cadastros/colaboradores");
    },
    onError: (error: unknown) => {
      const msg =
        error instanceof AxiosError
          ? (error.response?.data?.message ?? "Erro ao atualizar colaborador.")
          : "Erro ao atualizar colaborador.";
      toast.error(msg);
    },
  });

  if (isLoading) {
    return <div className="text-muted-foreground">Carregando...</div>;
  }

  if (!colaborador) {
    return <div className="text-muted-foreground">Colaborador não encontrado.</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Editar Colaborador"
        description={colaborador.name}
        help={colaboradoresHelp}
      />
      <ColaboradorForm
        initial={fromColaborador(colaborador)}
        onSubmit={(data) => mutation.mutate(data)}
        onCancel={() => router.back()}
        isPending={mutation.isPending}
        submitLabel="Salvar Alterações"
        showIsAtivo
        colaboradorId={id}
      />
    </div>
  );
}
