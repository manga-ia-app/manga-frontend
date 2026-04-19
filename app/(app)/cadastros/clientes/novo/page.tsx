"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { ClienteForm, type ClienteFormData } from "../cliente-form";
import { createCliente } from "@/lib/api/cadastros";
import { showToast } from "@/lib/utils/toast";

export default function NovoClientePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: ClienteFormData) => createCliente(data),
    onSuccess: () => {
      showToast("success", { title: "Cliente cadastrado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      router.push("/cadastros/clientes");
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Novo Cliente"
        description="Cadastre um novo cliente"
        action={
          <Button
            variant="outline"
            onClick={() => router.push("/cadastros/clientes")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        }
      />

      <ClienteForm
        onSubmit={(data) => createMutation.mutate(data)}
        isSubmitting={createMutation.isPending}
      />
    </div>
  );
}
