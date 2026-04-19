import type { ColaboradorFormData } from "./colaborador-form";

const tipoVinculoMap = { CLT: 0, Terceiros: 1, Estagiario: 2 } as const;
const modoEncargosMap = { Percentual: 0, Detalhado: 1 } as const;
const modoBeneficiosMap = { Detalhado: 0, ValorUnico: 1 } as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toApiPayload(data: ColaboradorFormData): Record<string, any> {
  const isCLT = data.tipoVinculo === "CLT";
  const isTerceiros = data.tipoVinculo === "Terceiros";
  const isEstagiario = data.tipoVinculo === "Estagiario";

  return {
    name: data.name,
    cargoId: data.cargoId,
    email: data.email || undefined,
    phone: data.phone || undefined,
    hireDate: data.hireDate || undefined,
    tipoVinculo: tipoVinculoMap[data.tipoVinculo],
    horasMensais: data.horasMensais,
    isAtivo: data.isAtivo,
    notes: data.notes || undefined,
    modoBeneficios: modoBeneficiosMap[data.modoBeneficios],

    // CLT
    salarioBruto: isCLT ? data.salarioBruto : undefined,
    modoEncargos: isCLT ? modoEncargosMap[data.modoEncargos] : undefined,
    encargosPercentual:
      isCLT && data.modoEncargos === "Percentual" ? data.encargosPercentual : undefined,
    encargoINSS:
      isCLT && data.modoEncargos === "Detalhado" ? data.encargoINSS : undefined,
    encargoFGTS:
      isCLT && data.modoEncargos === "Detalhado" ? data.encargoFGTS : undefined,
    encargo13Salario:
      isCLT && data.modoEncargos === "Detalhado" ? data.encargo13Salario : undefined,
    encargoFerias:
      isCLT && data.modoEncargos === "Detalhado" ? data.encargoFerias : undefined,
    encargoOutros:
      isCLT && data.modoEncargos === "Detalhado" ? data.encargoOutros : undefined,

    // Terceiros
    valorMensalNF: isTerceiros ? data.valorMensalNF : undefined,

    // Estagiário
    bolsaAuxilio: isEstagiario ? data.bolsaAuxilio : undefined,
    seguroEstagio: isEstagiario ? data.seguroEstagio : undefined,
    auxilioTransporteEstagio: isEstagiario ? data.auxilioTransporteEstagio : undefined,
    recessoRemunerado: isEstagiario ? data.recessoRemunerado : undefined,

    // Benefícios
    planoSaudeValor: data.modoBeneficios === "Detalhado" ? data.planoSaudeValor : undefined,
    planoSaudeDependentes: data.modoBeneficios === "Detalhado" ? data.planoSaudeDependentes : undefined,
    auxilioTransporteValor: data.modoBeneficios === "Detalhado" ? data.auxilioTransporteValor : undefined,
    auxilioAlimentacaoValor: data.modoBeneficios === "Detalhado" ? data.auxilioAlimentacaoValor : undefined,
    beneficiosMensais: data.modoBeneficios === "ValorUnico" ? data.beneficiosMensais : 0,
    beneficiosExtras: data.modoBeneficios === "Detalhado"
      ? data.beneficiosExtras.map((b) => ({ name: b.name, value: b.value }))
      : [],
    encargosTerceiros: isTerceiros
      ? data.encargosTerceiros.map((e) => ({ name: e.name, percentual: e.percentual }))
      : [],
  };
}
