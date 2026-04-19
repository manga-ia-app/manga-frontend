"use client";

import { ConfirmationPreview } from "@/lib/types/chat";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Check, X } from "lucide-react";

interface ChatConfirmationPreviewProps {
  preview: ConfirmationPreview;
  onConfirm: () => void;
  onCancel: () => void;
}

const TOOL_LABELS: Record<string, string> = {
  CriarCargo: "Criar Cargo",
  AtualizarCargo: "Atualizar Cargo",
  ExcluirCargo: "Excluir Cargo",
  CriarColaborador: "Cadastrar Colaborador",
  AtualizarColaborador: "Atualizar Colaborador",
  DesativarColaborador: "Desativar Colaborador",
};

const FIELD_LABELS: Record<string, string> = {
  name: "Nome",
  valorHora: "Valor/Hora",
  grupoId: "Grupo",
  grupoName: "Grupo",
  grupoColaboradorName: "Grupo",
  cargoId: "Cargo",
  cargoName: "Cargo",
  tipoVinculo: "Tipo de Vínculo",
  salarioBruto: "Salário Bruto",
  valorMensalNF: "Valor Mensal NF",
  bolsaAuxilio: "Bolsa Auxílio",
  seguroEstagio: "Seguro Estágio",
  auxilioTransporteEstagio: "Auxílio Transporte Estágio",
  recessoRemunerado: "Recesso Remunerado",
  horasMensais: "Horas Mensais",
  beneficiosMensais: "Benefícios Mensais",
  modoBeneficios: "Modo Benefícios",
  planoSaudeValor: "Plano de Saúde",
  planoSaudeDependentes: "Dependentes Plano",
  auxilioAlimentacaoValor: "Auxílio Alimentação",
  auxilioTransporteValor: "Auxílio Transporte",
  beneficiosExtras: "Benefícios Extras",
  email: "Email",
  phone: "Telefone",
  custoTotalMensal: "Custo Total Mensal",
  custoHoraMensal: "Custo Hora Mensal",
  modoEncargos: "Modo Encargos",
  encargosPercentual: "Encargos (%)",
  encargoINSS: "INSS (%)",
  encargoFGTS: "FGTS (%)",
  encargo13Salario: "13º Salário (%)",
  encargoFerias: "Férias (%)",
  encargoOutros: "Outros Encargos (%)",
  isAtivo: "Ativo",
  notes: "Observações",
  hireDate: "Data Contratação",
  reassignCargosTo: "Reatribuir Para",
};

// Fields that should not be shown to the user
const HIDDEN_FIELDS = new Set(["requestId"]);

// UUID pattern — hide raw IDs, show only if no readable alternative
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isHiddenField(key: string, val: unknown): boolean {
  if (HIDDEN_FIELDS.has(key)) return true;
  // Hide fields whose value is a raw UUID (internal IDs)
  if (typeof val === "string" && UUID_PATTERN.test(val)) return true;
  return false;
}

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return "—";
  if (typeof val === "boolean") return val ? "Sim" : "Não";
  if (typeof val === "number") {
    return val.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  }
  if (Array.isArray(val)) {
    return val
      .map((item) =>
        typeof item === "object" && item !== null
          ? Object.values(item).join(": R$ ")
          : String(item)
      )
      .join(", ");
  }
  return String(val);
}

function DiffRow({ label, before, after }: { label: string; before?: unknown; after?: unknown }) {
  if (before === undefined && after === undefined) return null;
  const changed = before !== undefined && after !== undefined && before !== after;
  const displayLabel = FIELD_LABELS[label] ?? label;
  return (
    <div className="flex justify-between text-sm py-1">
      <span className="text-muted-foreground">{displayLabel}</span>
      <span>
        {before !== undefined && (
          <span className={changed ? "line-through text-muted-foreground mr-2" : ""}>
            {formatValue(before)}
          </span>
        )}
        {after !== undefined && (
          <span className={changed ? "font-medium text-foreground" : ""}>
            {formatValue(after)}
          </span>
        )}
      </span>
    </div>
  );
}

export function ChatConfirmationPreview({
  preview,
  onConfirm,
  onCancel,
}: ChatConfirmationPreviewProps) {
  const { toolName, previewData } = preview;
  const { message, before, after, impact, warnings, blocked } = previewData;
  const label = TOOL_LABELS[toolName] ?? toolName;

  return (
    <div className="mx-3 mb-3 rounded-lg border bg-card p-4 space-y-3">
      <div className="font-medium text-sm">{label}</div>
      <p className="text-sm text-muted-foreground">{message}</p>

      {(before || after) && (
        <div className="space-y-1 border-t pt-2 max-h-[40vh] overflow-y-auto">
          {Object.keys({ ...before, ...after })
            .filter((key) => !isHiddenField(key, after?.[key] ?? before?.[key]))
            .map((key) => (
              <DiffRow
                key={key}
                label={key}
                before={before?.[key]}
                after={after?.[key]}
              />
            ))}
        </div>
      )}

      {impact && Object.keys(impact).length > 0 && (
        <div className="space-y-1 border-t pt-2">
          <div className="text-xs font-medium text-muted-foreground uppercase">Impacto</div>
          {Object.entries(impact).map(([key, val]) => (
            <div key={key} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{key}</span>
              <span className="font-medium">{formatValue(val)}</span>
            </div>
          ))}
        </div>
      )}

      {warnings && warnings.length > 0 && (
        <div className="space-y-1">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-amber-600">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          onClick={onConfirm}
          disabled={blocked}
          className="flex-1"
        >
          <Check className="h-4 w-4 mr-1" />
          Confirmar
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          <X className="h-4 w-4 mr-1" />
          Cancelar
        </Button>
      </div>

      {blocked && (
        <p className="text-xs text-destructive">
          Operação bloqueada — resolva os avisos antes de confirmar.
        </p>
      )}
    </div>
  );
}
