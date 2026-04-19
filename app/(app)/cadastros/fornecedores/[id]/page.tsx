"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { FornecedorForm, type FornecedorFormData } from "../fornecedor-form";
import {
  getFornecedorById,
  updateFornecedor,
  deleteFornecedor,
} from "@/lib/api/cadastros";
import { showToast } from "@/lib/utils/toast";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

export default function FornecedorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: fornecedor, isLoading } = useQuery({
    queryKey: ["fornecedores", id],
    queryFn: () => getFornecedorById(id),
  });

  const updateMutation = useMutation({
    mutationFn: (data: FornecedorFormData) => updateFornecedor(id, data),
    onSuccess: () => {
      showToast("success", { title: "Fornecedor atualizado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["fornecedores"] });
      router.push("/cadastros/fornecedores");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteFornecedor(id),
    onSuccess: () => {
      showToast("success", { title: "Fornecedor excluido com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["fornecedores"] });
      router.push("/cadastros/fornecedores");
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

  if (!fornecedor) {
    return (
      <div className="space-y-6">
        <PageHeader title="Fornecedor não encontrado" />
        <Button
          variant="outline"
          onClick={() => router.push("/cadastros/fornecedores")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={fornecedor.name}
        description="Editar dados do fornecedor"
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/cadastros/fornecedores")}
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

      <FornecedorForm
        defaultValues={fornecedor}
        onSubmit={(data) => updateMutation.mutate(data)}
        isSubmitting={updateMutation.isPending}
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Excluir fornecedor"
        description="Tem certeza que deseja excluir este fornecedor?"
        confirmLabel="Excluir"
        variant="destructive"
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
}
