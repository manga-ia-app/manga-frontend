"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { EstimateForm } from "@/components/estimativas/estimate-form";
import { createEstimate } from "@/lib/api/estimativas";
import type { CreateEstimatePayload } from "@/lib/types/estimativas";

export default function NovaEstimativaPage() {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: (payload: CreateEstimatePayload) => createEstimate(payload),
    onSuccess: (data) => {
      toast.success("Estimativa criada com sucesso!");
      router.push(`/estimativas/${data.id}`);
    },
    onError: () => {
      toast.error("Erro ao criar estimativa.");
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nova Estimativa"
        description="Selecione um template e um cliente para iniciar a estimativa."
      />
      <EstimateForm
        onSubmit={(payload) => mutation.mutate(payload)}
        isSubmitting={mutation.isPending}
      />
    </div>
  );
}
