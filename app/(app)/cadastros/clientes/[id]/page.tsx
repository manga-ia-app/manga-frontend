"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { ClienteForm, type ClienteFormData } from "../cliente-form";
import {
  getClienteById,
  updateCliente,
  deleteCliente,
} from "@/lib/api/cadastros";
import { showToast } from "@/lib/utils/toast";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

export default function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: cliente, isLoading } = useQuery({
    queryKey: ["clientes", id],
    queryFn: () => getClienteById(id),
  });

  const updateMutation = useMutation({
    mutationFn: (data: ClienteFormData) => updateCliente(id, data),
    onSuccess: () => {
      showToast("success", { title: "Cliente atualizado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      router.push("/cadastros/clientes");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteCliente(id),
    onSuccess: () => {
      showToast("success", { title: "Cliente excluido com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      router.push("/cadastros/clientes");
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

  if (!cliente) {
    return (
      <div className="space-y-6">
        <PageHeader title="Cliente não encontrado" />
        <Button variant="outline" onClick={() => router.push("/cadastros/clientes")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={cliente.name}
        description="Editar dados do cliente"
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/cadastros/clientes")}
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

      <ClienteForm
        defaultValues={cliente}
        onSubmit={(data) => updateMutation.mutate(data)}
        isSubmitting={updateMutation.isPending}
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Excluir cliente"
        description="Tem certeza que deseja excluir este cliente?"
        confirmLabel="Excluir"
        variant="destructive"
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
}
