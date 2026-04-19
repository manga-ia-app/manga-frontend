"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  X,
  Download,
  MessageSquare,
  Send,
  FileText,
  Clock,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  getPortalProposal,
  approveProposal,
  rejectProposal,
  addPortalComment,
  getPortalPdfDownloadUrl,
} from "@/lib/api/portal";
import type { PricingProposalStatus } from "@/lib/types";

const statusLabels: Record<PricingProposalStatus, string> = {
  Draft: "Rascunho",
  Generated: "Gerada",
  Approved: "Aprovada",
  Rejected: "Rejeitada",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function PortalProposalPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = params.token as string;

  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [commentName, setCommentName] = useState("");
  const [commentEmail, setCommentEmail] = useState("");
  const [commentContent, setCommentContent] = useState("");

  const { data: proposal, isLoading, error } = useQuery({
    queryKey: ["portal-proposal", token],
    queryFn: () => getPortalProposal(token),
    enabled: !!token,
  });

  const approveMutation = useMutation({
    mutationFn: () => approveProposal(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal-proposal", token] });
      router.push(`/proposta/${token}/aprovado`);
    },
    onError: () => toast.error("Erro ao aprovar proposta."),
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectProposal(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal-proposal", token] });
      toast.success("Proposta rejeitada.");
    },
    onError: () => toast.error("Erro ao rejeitar proposta."),
  });

  const commentMutation = useMutation({
    mutationFn: () =>
      addPortalComment(token, {
        content: commentContent,
        authorName: commentName,
        authorEmail: commentEmail || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal-proposal", token] });
      setCommentContent("");
      toast.success("Comentário enviado!");
    },
    onError: () => toast.error("Erro ao enviar comentário."),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="text-center py-16">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Proposta não encontrada</h2>
        <p className="text-muted-foreground">
          O link pode ter expirado ou ser inválido. Entre em contato com o
          escritório.
        </p>
      </div>
    );
  }

  const canApprove = proposal.status === "Generated";
  const isApproved = proposal.status === "Approved";
  const isRejected = proposal.status === "Rejected";

  return (
    <div className="space-y-8">
      {/* Status Banner */}
      {isApproved && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <Check className="h-5 w-5 text-green-600" />
          <p className="text-green-800 font-medium">
            Esta proposta foi aprovada.
          </p>
        </div>
      )}
      {isRejected && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <X className="h-5 w-5 text-red-600" />
          <p className="text-red-800 font-medium">
            Esta proposta foi rejeitada.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold">{proposal.title}</h1>
        <Badge variant="outline" className="mt-2">
          {statusLabels[proposal.status]}
        </Badge>
      </div>

      {/* Introduction */}
      {proposal.introductionText && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {proposal.introductionText}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Sections */}
      {proposal.sections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> Detalhamento dos Serviços
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {proposal.sections.map((section, sIdx) => (
              <div key={sIdx}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">{section.name}</h3>
                  {section.deadlineDays && (
                    <span className="text-xs text-muted-foreground">
                      Prazo: {section.deadlineDays} dias
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  {section.phases.map((phase, pIdx) => (
                    <div key={pIdx} className="border-l-2 border-muted pl-4 py-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{phase.name}</span>
                        {phase.isPriceVisible && (
                          <span className="text-sm font-medium tabular-nums">
                            {formatCurrency(phase.value)}
                            {phase.isMonthlyBilling && (
                              <span className="text-xs text-muted-foreground ml-1">/mês</span>
                            )}
                          </span>
                        )}
                      </div>
                      {phase.description && (
                        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">
                          {phase.description}
                        </p>
                      )}
                      {phase.deliverables.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {phase.deliverables.map((d, dIdx) => (
                            <li key={dIdx} className="text-sm text-muted-foreground flex gap-2">
                              <span>•</span>
                              <span>{d}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-3 pt-2 border-t border-dashed">
                  <span className="text-sm font-semibold tabular-nums">
                    {formatCurrency(section.value)}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Section Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo dos Serviços</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {proposal.sections.map((section, sIdx) => (
            <div key={sIdx} className="flex items-center justify-between text-sm">
              <span>{section.name}</span>
              <span className="font-semibold tabular-nums">
                {formatCurrency(section.value)}
              </span>
            </div>
          ))}
          {proposal.validUntil && (
            <div className="pt-3 mt-3 border-t">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Válida até{" "}
                {new Date(proposal.validUntil).toLocaleDateString("pt-BR")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exclusions */}
      {proposal.exclusionsText && (
        <Card>
          <CardHeader>
            <CardTitle>Exclusões</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">
              {proposal.exclusionsText}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Scope Protection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" /> Proteção de Escopo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Revisões incluídas no valor
            </span>
            <span className="font-medium">
              {proposal.limiteRevisoes} revisão(ões)
            </span>
          </div>
          {proposal.prazoFeedbackDias && proposal.prazoFeedbackDias > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Prazo para feedback
              </span>
              <span className="font-medium">
                {proposal.prazoFeedbackDias} dias úteis
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Valor por hora adicional
            </span>
            <span className="font-medium">
              {formatCurrency(proposal.valorHoraAdicional)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Payment Conditions */}
      {proposal.paymentConditions && (
        <Card>
          <CardHeader>
            <CardTitle>Condições de Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">
              {proposal.paymentConditions}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Payment Data */}
      {proposal.paymentData && (
        <Card>
          <CardHeader>
            <CardTitle>Dados para Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">
              {proposal.paymentData}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Observations */}
      {proposal.observationsText && (
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">
              {proposal.observationsText}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {canApprove && (
        <Card>
          <CardContent className="pt-6">
            {!showApproveConfirm ? (
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  size="lg"
                  onClick={() => setShowApproveConfirm(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="mr-2 h-5 w-5" /> Aprovar Proposta
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => rejectMutation.mutate()}
                  disabled={rejectMutation.isPending}
                >
                  <X className="mr-2 h-5 w-5" /> Solicitar Revisão
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    Ao aprovar esta proposta, você concorda com os termos,
                    valores e condições descritos acima.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Checkbox
                    id="agree-terms"
                    checked={agreeTerms}
                    onCheckedChange={(checked) => setAgreeTerms(checked === true)}
                  />
                  <Label htmlFor="agree-terms" className="cursor-pointer">
                    Li e concordo com os termos e condições desta proposta
                  </Label>
                </div>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowApproveConfirm(false);
                      setAgreeTerms(false);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => approveMutation.mutate()}
                    disabled={!agreeTerms || approveMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {approveMutation.isPending
                      ? "Aprovando..."
                      : "Confirmar Aprovação"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* PDF Download */}
      {proposal.hasPdf && (
        <div className="text-center">
          <a
            href={getPortalPdfDownloadUrl(token)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="lg">
              <Download className="mr-2 h-5 w-5" /> Download PDF
            </Button>
          </a>
        </div>
      )}

      {/* Comments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" /> Comentários
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {proposal.comments.length > 0 && (
            <div className="space-y-3">
              {proposal.comments.map((comment) => (
                <div key={comment.id} className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">
                      {comment.authorName}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {comment.isFromClient ? "Cliente" : "Escritório"}
                    </Badge>
                  </div>
                  <p className="text-sm">{comment.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(comment.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="border-t pt-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Seu nome</Label>
                <Input
                  value={commentName}
                  onChange={(e) => setCommentName(e.target.value)}
                  placeholder="Seu nome"
                />
              </div>
              <div>
                <Label>E-mail (opcional)</Label>
                <Input
                  type="email"
                  value={commentEmail}
                  onChange={(e) => setCommentEmail(e.target.value)}
                  placeholder="seu@email.com"
                />
              </div>
            </div>
            <div>
              <Label>Mensagem</Label>
              <Textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="Digite sua mensagem ou dúvida..."
                rows={3}
              />
            </div>
            <Button
              onClick={() => commentMutation.mutate()}
              disabled={
                !commentName ||
                !commentContent ||
                commentMutation.isPending
              }
            >
              <Send className="mr-2 h-4 w-4" />
              {commentMutation.isPending ? "Enviando..." : "Enviar Comentário"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
