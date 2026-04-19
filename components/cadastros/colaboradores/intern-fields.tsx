"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const numStr = (v: number | undefined) => (v ? String(v) : "");

interface Props {
  bolsaAuxilio: number;
  seguroEstagio: number;
  auxilioTransporteEstagio: number;
  recessoRemunerado: number;
  onFieldChange: (field: string, value: number) => void;
}

export function InternFields({
  bolsaAuxilio,
  seguroEstagio,
  auxilioTransporteEstagio,
  recessoRemunerado,
  onFieldChange,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="bolsaAuxilio">
            Bolsa Auxílio (R$) <span aria-hidden="true">*</span>
          </Label>
          <Input
            id="bolsaAuxilio"
            type="number"
            min={0}
            value={numStr(bolsaAuxilio)}
            onChange={(e) => onFieldChange("bolsaAuxilio", parseFloat(e.target.value) || 0)}
            placeholder="1500"
            required
            aria-required="true"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="seguroEstagio">
            Seguro Estágio (R$) <span aria-hidden="true">*</span>
          </Label>
          <Input
            id="seguroEstagio"
            type="number"
            min={0}
            value={numStr(seguroEstagio)}
            onChange={(e) => onFieldChange("seguroEstagio", parseFloat(e.target.value) || 0)}
            placeholder="50"
            required
            aria-required="true"
          />
          <p className="text-xs text-muted-foreground">
            Obrigatório por lei (Lei 11.788/2008)
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="auxilioTransporteEstagio">
            Auxílio Transporte Estágio (R$) <span aria-hidden="true">*</span>
          </Label>
          <Input
            id="auxilioTransporteEstagio"
            type="number"
            min={0}
            value={numStr(auxilioTransporteEstagio)}
            onChange={(e) =>
              onFieldChange("auxilioTransporteEstagio", parseFloat(e.target.value) || 0)
            }
            placeholder="200"
            required
            aria-required="true"
          />
          <p className="text-xs text-muted-foreground">
            Obrigatório por lei, distinto do benefício transporte
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="recessoRemunerado">Recesso Remunerado (R$/mês)</Label>
          <Input
            id="recessoRemunerado"
            type="number"
            min={0}
            value={numStr(recessoRemunerado)}
            onChange={(e) =>
              onFieldChange("recessoRemunerado", parseFloat(e.target.value) || 0)
            }
            placeholder="0"
          />
          <p className="text-xs text-muted-foreground">
            30 dias a cada 12 meses (Lei 11.788/2008 art. 13). Valor mensal proporcional.
          </p>
        </div>
      </div>
    </div>
  );
}
