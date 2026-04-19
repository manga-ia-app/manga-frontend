"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { FornecedorForm, type FornecedorFormData } from "../fornecedor-form";
import { createFornecedor } from "@/lib/api/cadastros";
import { showToast } from "@/lib/utils/toast";

export default function NovoFornecedorPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: FornecedorFormData) => createFornecedor(data),
    onSuccess: () => {
      showToast("success", { title: "Fornecedor cadastrado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["fornecedores"] });
      router.push("/cadastros/fornecedores");
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Novo Fornecedor"
        description="Cadastre um novo fornecedor"
        action={
          <Button
            variant="outline"
            onClick={() => router.push("/cadastros/fornecedores")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        }
      />

      <FornecedorForm
        onSubmit={(data) => createMutation.mutate(data)}
        isSubmitting={createMutation.isPending}
      />
    </div>
  );
}
