"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AxiosError } from "axios";

import { PageHeader } from "@/components/shared/page-header";
import type { HelpContent } from "@/components/shared/help-button";
import { ColaboradorForm, defaultFormData, type ColaboradorFormData } from "../colaborador-form";
import { createColaborador } from "@/lib/api/cadastros";
import { toApiPayload } from "../form-utils";

const colaboradoresHelp: HelpContent = {
  title: "Cadastro de Colaboradores",
  sections: [
    {
      heading: "Para que serve este cadastro?",
      content:
        "Registre cada pessoa que trabalha no escritório com seu custo real mensal. Esses valores alimentam o cálculo de Custo/Hora na Configuração do Escritório, tornando sua precificação mais precisa.",
    },
    {
      heading: "CLT",
      content:
        "Informe o salário bruto + encargos patronais (INSS, FGTS, 13º, férias, etc.) + benefícios. Os encargos podem ser informados como um percentual único (~75%) ou detalhados item a item.",
    },
    {
      heading: "Terceiros (PJ)",
      content:
        "Informe o valor mensal da nota fiscal e opcionalmente encargos sobre a NF (ISS, taxas administrativas, etc.).",
    },
    {
      heading: "Estagiário",
      content:
        "Informe bolsa auxílio, seguro estágio (obrigatório), auxílio transporte estágio e recesso remunerado conforme Lei 11.788/2008.",
    },
    {
      heading: "Benefícios",
      content:
        "Podem ser informados como valor único ou detalhado (plano de saúde, transporte, alimentação + extras). Para CLT, descontos legais são aplicados automaticamente (6% transporte, 20% alimentação).",
    },
    {
      heading: "Custo Total Mensal",
      content:
        "Calculado automaticamente conforme o tipo de vínculo. O grupo do colaborador é definido pelo cargo selecionado.",
    },
  ],
};

export default function NovoColaboradorPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: ColaboradorFormData) => createColaborador(toApiPayload(data)),
    onSuccess: () => {
      toast.success("Colaborador cadastrado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
      router.push("/cadastros/colaboradores");
    },
    onError: (error: unknown) => {
      const msg =
        error instanceof AxiosError
          ? (error.response?.data?.message ?? "Erro ao cadastrar colaborador. Verifique os campos.")
          : "Erro ao cadastrar colaborador. Verifique os campos.";
      toast.error(msg);
    },
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Novo Colaborador" help={colaboradoresHelp} />
      <ColaboradorForm
        initial={defaultFormData}
        onSubmit={(data) => mutation.mutate(data)}
        onCancel={() => router.back()}
        isPending={mutation.isPending}
        submitLabel="Cadastrar Colaborador"
      />
    </div>
  );
}
