"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { MaterialForm, type MaterialSubmitPayload } from "../material-form";
import {
  getMaterialById,
  updateMaterial,
  deleteMaterial,
} from "@/lib/api/cadastros";
import { showToast } from "@/lib/utils/toast";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

export default function MaterialDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: material, isLoading } = useQuery({
    queryKey: ["materiais", id],
    queryFn: () => getMaterialById(id),
  });

  const updateMutation = useMutation({
    mutationFn: (data: MaterialSubmitPayload) => updateMaterial(id, data),
    onSuccess: () => {
      showToast("success", { title: "Material atualizado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["materiais"] });
      router.push("/cadastros/materiais");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteMaterial(id),
    onSuccess: () => {
      showToast("success", { title: "Material excluido com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["materiais"] });
      router.push("/cadastros/materiais");
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

  if (!material) {
    return (
      <div className="space-y-6">
        <PageHeader title="Material não encontrado" />
        <Button
          variant="outline"
          onClick={() => router.push("/cadastros/materiais")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={material.name}
        description="Editar dados do material"
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/cadastros/materiais")}
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

      <MaterialForm
        defaultValues={material}
        onSubmit={(data) => updateMutation.mutate(data)}
        isSubmitting={updateMutation.isPending}
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Excluir material"
        description="Tem certeza que deseja excluir este material?"
        confirmLabel="Excluir"
        variant="destructive"
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
}
