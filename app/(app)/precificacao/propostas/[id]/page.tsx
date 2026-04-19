"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Download, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  getProposalById,
  updateProposal,
  generateProposalPdf,
  getProposalPdfDownloadUrl,
} from "@/lib/api/precificacao";
import apiClient from "@/lib/api/client";
import type {
  PricingProposal,
  PricingProposalStatus,
  UpdateProposalRequest,
} from "@/lib/types";
import { ProposalStepper } from "@/components/precificacao/propostas/proposal-stepper";
import { StepGeneralData } from "@/components/precificacao/propostas/step-general-data";
import { StepPriceBuilder } from "@/components/precificacao/propostas/step-price-builder";
import { StepReview } from "@/components/precificacao/propostas/step-review";
import { ProposalPreview } from "@/components/precificacao/propostas/proposal-preview";

const statusLabels: Record<PricingProposalStatus, string> = {
  Draft: "Rascunho",
  Generated: "Gerada",
  Approved: "Aprovada",
  Rejected: "Rejeitada",
};

const statusColors: Record<PricingProposalStatus, string> = {
  Draft: "bg-gray-100 text-gray-800",
  Generated: "bg-blue-100 text-blue-800",
  Approved: "bg-green-100 text-green-800",
  Rejected: "bg-red-100 text-red-800",
};

function buildUpdateRequest(proposal: PricingProposal): UpdateProposalRequest {
  return {
    title: proposal.title,
    clienteId: proposal.clienteId || "",
    introductionText: proposal.introductionText,
    exclusionsText: proposal.exclusionsText,
    paymentConditions: proposal.paymentConditions,
    paymentData: proposal.paymentData,
    observationsText: proposal.observationsText,
    limiteRevisoes: proposal.limiteRevisoes,
    prazoFeedbackDias: proposal.prazoFeedbackDias,
    valorHoraAdicional: proposal.valorHoraAdicional,
    validUntil: proposal.validUntil,
    sections: proposal.sections.map((s) => ({
      id: s.id,
      name: s.name,
      orderIndex: s.orderIndex,
      discountType: s.discountType,
      discountPercent: s.discountPercent,
      discountValue: s.discountValue,
      roundingValue: s.roundingValue,
      deadlineDays: s.deadlineDays,
      phaseIds: s.phases.map((p) => p.id),
    })),
    phaseUpdates: [
      ...proposal.sections.flatMap((s) => s.phases),
      ...proposal.unassignedPhases,
    ].map((p) => ({
      id: p.id,
      isVisible: p.isVisible,
      isPriceVisible: p.isPriceVisible,
      description: p.description,
      deliverables: p.deliverables.map((d) => ({
        id: d.id,
        name: d.name,
        orderIndex: d.orderIndex,
        isVisible: d.isVisible,
      })),
    })),
  };
}

export default function ProposalEditorPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const [currentStep, setCurrentStep] = useState(0);
  const [formState, setFormState] = useState<PricingProposal | null>(null);

  const { data: proposal, isLoading } = useQuery({
    queryKey: ["proposal", id],
    queryFn: () => getProposalById(id),
    enabled: !!id,
  });

  // Initialize form state from loaded proposal
  useEffect(() => {
    if (proposal && !formState) {
      setFormState({ ...proposal });
    }
  }, [proposal, formState]);

  const saveMutation = useMutation({
    mutationFn: (data: UpdateProposalRequest) => updateProposal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal", id] });
      toast.success("Proposta salva com sucesso!");
    },
    onError: () => toast.error("Erro ao salvar proposta."),
  });

  const pdfMutation = useMutation({
    mutationFn: () => generateProposalPdf(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal", id] });
      setFormState(null); // Force reload
      toast.success("PDF gerado com sucesso!");
    },
    onError: () => toast.error("Erro ao gerar PDF."),
  });

  const handleChange = (updates: Partial<PricingProposal>) => {
    if (!formState) return;
    setFormState({ ...formState, ...updates });
  };

  const handleSave = () => {
    if (!formState) return;
    saveMutation.mutate(buildUpdateRequest(formState));
  };

  const handleGeneratePdf = async () => {
    if (!formState) return;
    // Save first, then generate PDF
    try {
      await updateProposal(id, buildUpdateRequest(formState));
      pdfMutation.mutate();
    } catch {
      toast.error("Erro ao salvar antes de gerar PDF.");
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const url = getProposalPdfDownloadUrl(id);
      const response = await apiClient.get(url, { responseType: "blob" });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `proposta-${formState?.title || id}.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      toast.error("Erro ao fazer download do PDF.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!proposal || !formState) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Proposta não encontrada.</p>
      </div>
    );
  }

  const isEditable = formState.status === "Draft" || formState.status === "Generated";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/precificacao/propostas")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{formState.title || "Nova Proposta"}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[formState.status]}`}
              >
                {statusLabels[formState.status]}
              </span>
              <span className="text-sm text-muted-foreground">
                v{formState.version}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {proposal.pdfFilePath && (
            <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
              <Download className="mr-2 h-4 w-4" /> Download PDF
            </Button>
          )}
          {isEditable && (
            <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {saveMutation.isPending ? "Salvando..." : "Salvar Rascunho"}
            </Button>
          )}
        </div>
      </div>

      {/* Main layout: stepper + content + preview */}
      <div className="flex gap-6">
        {/* Left: Stepper */}
        <div className="w-48 shrink-0">
          <ProposalStepper currentStep={currentStep} onStepChange={setCurrentStep} />
        </div>

        {/* Center: Step content */}
        <div className="flex-1 min-w-0">
          {currentStep === 0 && (
            <StepGeneralData proposal={formState} onChange={handleChange} />
          )}
          {currentStep === 1 && (
            <StepPriceBuilder proposal={formState} onChange={handleChange} />
          )}
          {currentStep === 2 && (
            <div className="space-y-4">
              <StepReview proposal={formState} onChange={handleChange} />
              {isEditable && (
                <div className="flex gap-2">
                  <Button
                    onClick={handleGeneratePdf}
                    disabled={pdfMutation.isPending}
                  >
                    {pdfMutation.isPending ? "Gerando..." : "Gerar PDF"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Preview */}
        <div className="w-[400px] shrink-0 sticky top-4 max-h-[calc(100vh-120px)] overflow-auto">
          <ProposalPreview proposal={formState} />
        </div>
      </div>
    </div>
  );
}
