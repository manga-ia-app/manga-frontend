"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { ServicoForm, type ServicoSubmitPayload } from "../servico-form";
import {
  getServicoById,
  updateServico,
  deleteServico,
} from "@/lib/api/cadastros";
import { showToast } from "@/lib/utils/toast";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

export default function ServicoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: servico, isLoading } = useQuery({
    queryKey: ["servicos", id],
    queryFn: () => getServicoById(id),
  });

  const updateMutation = useMutation({
    mutationFn: (data: ServicoSubmitPayload) => updateServico(id, data),
    onSuccess: () => {
      showToast("success", { title: "Servico atualizado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["servicos"] });
      router.push("/cadastros/servicos");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteServico(id),
    onSuccess: () => {
      showToast("success", { title: "Servico excluido com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["servicos"] });
      router.push("/cadastros/servicos");
    },
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-96 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (!servico) {
    return (
      <div className="space-y-6">
        <PageHeader title="Serviço não encontrado" />
        <Button
          variant="outline"
          onClick={() => router.push("/cadastros/servicos")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={servico.name}
        description="Editar dados do serviço"
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/cadastros/servicos")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </div>
        }
      />

      <ServicoForm
        defaultValues={servico}
        onSubmit={(data) => updateMutation.mutate(data)}
        isSubmitting={updateMutation.isPending}
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Excluir serviço"
        description="Tem certeza que deseja excluir este serviço?"
        confirmLabel="Excluir"
        variant="destructive"
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
}
