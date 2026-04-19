"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { ServicoForm, type ServicoFormData } from "../servico-form";
import { createServico } from "@/lib/api/cadastros";
import { showToast } from "@/lib/utils/toast";

export default function NovoServicoPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: ServicoFormData) => createServico(data),
    onSuccess: () => {
      showToast("success", { title: "Servico cadastrado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["servicos"] });
      router.push("/cadastros/servicos");
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Novo Serviço"
        description="Cadastre um novo serviço"
        action={
          <Button
            variant="outline"
            onClick={() => router.push("/cadastros/servicos")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        }
      />

      <ServicoForm
        onSubmit={(data) => createMutation.mutate(data)}
        isSubmitting={createMutation.isPending}
      />
    </div>
  );
}
