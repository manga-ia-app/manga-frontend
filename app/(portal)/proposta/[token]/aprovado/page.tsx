"use client";

import { useParams } from "next/navigation";
import { CheckCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getPortalPdfDownloadUrl } from "@/lib/api/portal";

export default function AprovadoPage() {
  const params = useParams();
  const token = params.token as string;

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-lg w-full">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <div className="flex justify-center">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-green-800">
              Proposta Aprovada!
            </h1>
            <p className="text-muted-foreground mt-2">
              Sua aprovação foi registrada com sucesso. O escritório será
              notificado e entrará em contato para os próximos passos.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
            <p>
              A data, horário e seu endereço IP foram registrados como
              comprovação digital da aprovação desta proposta.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <a
              href={getPortalPdfDownloadUrl(token)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" /> Download da Proposta (PDF)
              </Button>
            </a>
            <a href={`/proposta/${token}`}>
              <Button variant="ghost" className="w-full">
                Voltar para a proposta
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
