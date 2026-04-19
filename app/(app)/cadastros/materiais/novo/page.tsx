"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { MaterialForm, type MaterialFormData } from "../material-form";
import { createMaterial } from "@/lib/api/cadastros";
import { showToast } from "@/lib/utils/toast";

export default function NovoMaterialPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: MaterialFormData) => createMaterial(data),
    onSuccess: () => {
      showToast("success", { title: "Material cadastrado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["materiais"] });
      router.push("/cadastros/materiais");
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Novo Material"
        description="Cadastre um novo material"
        action={
          <Button
            variant="outline"
            onClick={() => router.push("/cadastros/materiais")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        }
      />

      <MaterialForm
        onSubmit={(data) => createMutation.mutate(data)}
        isSubmitting={createMutation.isPending}
      />
    </div>
  );
}
