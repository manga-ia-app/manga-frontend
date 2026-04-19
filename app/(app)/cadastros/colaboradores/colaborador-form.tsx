"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCargos } from "@/lib/api/cargos";
import type { Cargo } from "@/lib/types/cargos";
import type {
  Colaborador,
  TipoVinculo,
  ModoEncargos,
  ModoBeneficios,
  BeneficioExtra,
  EncargoTerceiro,
} from "@/lib/types";
import { BenefitsSection } from "@/components/cadastros/colaboradores/benefits-section";
import { InternFields } from "@/components/cadastros/colaboradores/intern-fields";
import { EncargosTerceirosSection } from "@/components/cadastros/colaboradores/encargos-terceiros-section";
import { CostSummary, type CostSummaryData } from "@/components/cadastros/colaboradores/cost-summary";
import { HistoricoFinanceiro } from "@/components/cadastros/colaboradores/historico-financeiro";

const numStr = (v: number | undefined) => (v ? String(v) : "");

export interface ColaboradorFormData {
  name: string;
  cargoId: string;
  email: string;
  phone: string;
  hireDate: string;
  tipoVinculo: TipoVinculo;
  horasMensais: number;
  isAtivo: boolean;
  notes: string;
  modoBeneficios: ModoBeneficios;

  // CLT
  salarioBruto: number;
  modoEncargos: ModoEncargos;
  encargosPercentual: number;
  encargoINSS: number;
  encargoFGTS: number;
  encargo13Salario: number;
  encargoFerias: number;
  encargoOutros: number;

  // Terceiros
  valorMensalNF: number;

  // Estagiário
  bolsaAuxilio: number;
  seguroEstagio: number;
  auxilioTransporteEstagio: number;
  recessoRemunerado: number;

  // Benefícios detalhados
  planoSaudeValor: number;
  planoSaudeDependentes: number;
  auxilioTransporteValor: number;
  auxilioAlimentacaoValor: number;
  beneficiosMensais: number;
  beneficiosExtras: BeneficioExtra[];
  encargosTerceiros: EncargoTerceiro[];
}

export const defaultFormData: ColaboradorFormData = {
  name: "",
  cargoId: "",
  email: "",
  phone: "",
  hireDate: "",
  tipoVinculo: "CLT",
  horasMensais: 160,
  isAtivo: true,
  notes: "",
  modoBeneficios: "Detalhado",
  salarioBruto: 0,
  modoEncargos: "Percentual",
  encargosPercentual: 75,
  encargoINSS: 20,
  encargoFGTS: 8,
  encargo13Salario: 8.33,
  encargoFerias: 11.11,
  encargoOutros: 0,
  valorMensalNF: 0,
  bolsaAuxilio: 0,
  seguroEstagio: 0,
  auxilioTransporteEstagio: 0,
  recessoRemunerado: 0,
  planoSaudeValor: 0,
  planoSaudeDependentes: 0,
  auxilioTransporteValor: 0,
  auxilioAlimentacaoValor: 0,
  beneficiosMensais: 0,
  beneficiosExtras: [],
  encargosTerceiros: [],
};

export function fromColaborador(c: Colaborador): ColaboradorFormData {
  return {
    name: c.name,
    cargoId: c.cargoId,
    email: c.email ?? "",
    phone: c.phone ?? "",
    hireDate: c.hireDate ? c.hireDate.split("T")[0] : "",
    tipoVinculo: c.tipoVinculo,
    horasMensais: c.horasMensais,
    isAtivo: c.isAtivo,
    notes: c.notes ?? "",
    modoBeneficios: c.modoBeneficios ?? "Detalhado",
    salarioBruto: c.salarioBruto ?? 0,
    modoEncargos: c.modoEncargos ?? "Percentual",
    encargosPercentual: c.encargosPercentual ?? 75,
    encargoINSS: c.encargoINSS ?? 20,
    encargoFGTS: c.encargoFGTS ?? 8,
    encargo13Salario: c.encargo13Salario ?? 8.33,
    encargoFerias: c.encargoFerias ?? 11.11,
    encargoOutros: c.encargoOutros ?? 0,
    valorMensalNF: c.valorMensalNF ?? 0,
    bolsaAuxilio: c.bolsaAuxilio ?? 0,
    seguroEstagio: c.seguroEstagio ?? 0,
    auxilioTransporteEstagio: c.auxilioTransporteEstagio ?? 0,
    recessoRemunerado: c.recessoRemunerado ?? 0,
    planoSaudeValor: c.planoSaudeValor ?? 0,
    planoSaudeDependentes: c.planoSaudeDependentes ?? 0,
    auxilioTransporteValor: c.auxilioTransporteValor ?? 0,
    auxilioAlimentacaoValor: c.auxilioAlimentacaoValor ?? 0,
    beneficiosMensais: c.beneficiosMensais,
    beneficiosExtras: c.beneficiosExtras?.map((b) => ({ name: b.name, value: b.value })) ?? [],
    encargosTerceiros: c.encargosTerceiros?.map((e) => ({ name: e.name, percentual: e.percentual })) ?? [],
  };
}

interface Props {
  initial?: ColaboradorFormData;
  onSubmit: (data: ColaboradorFormData) => void;
  onCancel?: () => void;
  isPending: boolean;
  submitLabel: string;
  showIsAtivo?: boolean;
  colaboradorId?: string;
}

export function ColaboradorForm({
  initial,
  onSubmit,
  onCancel,
  isPending,
  submitLabel,
  showIsAtivo = false,
  colaboradorId,
}: Props) {
  const [form, setForm] = useState<ColaboradorFormData>(initial ?? defaultFormData);
  const [cargoError, setCargoError] = useState<string | null>(null);

  useEffect(() => {
    if (initial) setForm(initial);
  }, [initial]);

  const { data: cargos = [] } = useQuery<Cargo[]>({
    queryKey: ["cargos-list"],
    queryFn: () => getCargos(),
  });

  const upd = (field: keyof ColaboradorFormData, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const isCLT = form.tipoVinculo === "CLT";
  const isTerceiros = form.tipoVinculo === "Terceiros";
  const isEstagiario = form.tipoVinculo === "Estagiario";
  const isDetalhado = form.modoEncargos === "Detalhado";

  // Derive grupo from selected cargo
  const selectedCargo = useMemo(
    () => cargos.find((c) => c.id === form.cargoId),
    [cargos, form.cargoId],
  );

  // Build CostSummaryData from form state
  const costData: CostSummaryData = {
    tipoVinculo: form.tipoVinculo,
    horasMensais: form.horasMensais,
    salarioBruto: form.salarioBruto,
    modoEncargos: form.modoEncargos,
    encargosPercentual: form.encargosPercentual,
    encargoINSS: form.encargoINSS,
    encargoFGTS: form.encargoFGTS,
    encargo13Salario: form.encargo13Salario,
    encargoFerias: form.encargoFerias,
    encargoOutros: form.encargoOutros,
    valorMensalNF: form.valorMensalNF,
    encargosTerceirosTotal: form.encargosTerceiros.reduce((s, e) => s + (e.percentual || 0), 0),
    bolsaAuxilio: form.bolsaAuxilio,
    seguroEstagio: form.seguroEstagio,
    auxilioTransporteEstagio: form.auxilioTransporteEstagio,
    recessoRemunerado: form.recessoRemunerado,
    modoBeneficios: form.modoBeneficios,
    beneficiosMensais: form.beneficiosMensais,
    planoSaudeValor: form.planoSaudeValor,
    auxilioTransporteValor: form.auxilioTransporteValor,
    auxilioAlimentacaoValor: form.auxilioAlimentacaoValor,
    beneficiosExtrasTotal: form.beneficiosExtras.reduce((s, b) => s + (b.value || 0), 0),
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!form.cargoId) {
          setCargoError("Cargo é obrigatório");
          return;
        }
        setCargoError(null);
        onSubmit(form);
      }}
      className="space-y-6"
    >
      {/* Dados Gerais */}
      <Card>
        <CardHeader>
          <CardTitle>Dados Gerais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome <span aria-hidden="true">*</span></Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => upd("name", e.target.value)}
                placeholder="Nome completo"
                required
                aria-required="true"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => upd("email", e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => upd("phone", e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hireDate">Data de Admissão</Label>
              <Input
                id="hireDate"
                type="date"
                value={form.hireDate}
                onChange={(e) => upd("hireDate", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cargoId">Cargo <span aria-hidden="true">*</span></Label>
              <Select
                value={form.cargoId || undefined}
                onValueChange={(val) => {
                  upd("cargoId", val);
                  if (val) setCargoError(null);
                }}
                required
              >
                <SelectTrigger
                  id="cargoId"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  aria-required="true"
                  aria-invalid={!!cargoError}
                >
                  <SelectValue placeholder="Selecione um cargo" />
                </SelectTrigger>
                <SelectContent>
                  {cargos.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {cargoError && (
                <p className="text-xs text-destructive">{cargoError}</p>
              )}
              {selectedCargo?.grupoColaboradorName && (
                <p className="text-xs text-muted-foreground">
                  Grupo: <strong>{selectedCargo.grupoColaboradorName}</strong>
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="horasMensais">Horas Mensais <span aria-hidden="true">*</span></Label>
              <Input
                id="horasMensais"
                type="number"
                min={1}
                value={numStr(form.horasMensais)}
                onChange={(e) => upd("horasMensais", parseInt(e.target.value) || 0)}
                placeholder="160"
                required
                aria-required="true"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipoVinculo">Tipo de Vínculo <span aria-hidden="true">*</span></Label>
              <Select
                value={form.tipoVinculo}
                onValueChange={(val) => upd("tipoVinculo", val as TipoVinculo)}
              >
                <SelectTrigger
                  id="tipoVinculo"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  aria-required="true"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLT">CLT</SelectItem>
                  <SelectItem value="Terceiros">Terceiros</SelectItem>
                  <SelectItem value="Estagiario">Estagiário</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {showIsAtivo && (
              <div className="space-y-2">
                <Label htmlFor="isAtivo">Status</Label>
                <Select
                  value={form.isAtivo ? "true" : "false"}
                  onValueChange={(val) => upd("isAtivo", val === "true")}
                >
                  <SelectTrigger
                    id="isAtivo"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Ativo</SelectItem>
                    <SelectItem value="false">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Input
                id="notes"
                value={form.notes}
                onChange={(e) => upd("notes", e.target.value)}
                placeholder="Observações opcionais"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CLT — Remuneração */}
      {isCLT && (
        <Card>
          <CardHeader>
            <CardTitle>Remuneração — CLT</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salarioBruto">Salário Bruto (R$) <span aria-hidden="true">*</span></Label>
                <Input
                  id="salarioBruto"
                  type="number"
                  min={0}
                  value={numStr(form.salarioBruto)}
                  onChange={(e) => upd("salarioBruto", parseFloat(e.target.value) || 0)}
                  placeholder="5000"
                  required
                  aria-required="true"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modoEncargos">Modo de Encargos</Label>
                <Select
                  value={form.modoEncargos}
                  onValueChange={(val) => upd("modoEncargos", val as ModoEncargos)}
                >
                  <SelectTrigger
                    id="modoEncargos"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Percentual">Percentual unico</SelectItem>
                    <SelectItem value="Detalhado">Detalhado por item</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!isDetalhado ? (
              <div className="space-y-2">
                <Label htmlFor="encargosPercentual">Encargos Patronais (%)</Label>
                <Input
                  id="encargosPercentual"
                  type="number"
                  step="any"
                  min={0}
                  max={200}
                  value={numStr(form.encargosPercentual)}
                  onChange={(e) => upd("encargosPercentual", parseFloat(e.target.value) || 0)}
                  placeholder="75"
                  aria-describedby="encargos-hint"
                />
                <p id="encargos-hint" className="text-xs text-muted-foreground">
                  Padrão: ~75% (INSS 20% + FGTS 8% + 13º 8,33% + Férias 11,11% + outros)
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: "INSS (%)", field: "encargoINSS" as const, placeholder: "20" },
                  { label: "FGTS (%)", field: "encargoFGTS" as const, placeholder: "8" },
                  { label: "13º Salário (%)", field: "encargo13Salario" as const, placeholder: "8.33" },
                  { label: "Férias (%)", field: "encargoFerias" as const, placeholder: "11.11" },
                  { label: "Outros (%)", field: "encargoOutros" as const, placeholder: "0" },
                ].map(({ label, field, placeholder }) => (
                  <div key={field} className="space-y-2">
                    <Label htmlFor={field}>{label}</Label>
                    <Input
                      id={field}
                      type="number"
                      step="any"
                      min={0}
                      value={numStr(form[field] as number)}
                      onChange={(e) => upd(field, parseFloat(e.target.value) || 0)}
                      placeholder={placeholder}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Terceiros — Remuneração */}
      {isTerceiros && (
        <Card>
          <CardHeader>
            <CardTitle>Remuneração — Terceiros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="valorMensalNF">Valor Mensal da NF (R$) <span aria-hidden="true">*</span></Label>
              <Input
                id="valorMensalNF"
                type="number"
                min={0}
                value={numStr(form.valorMensalNF)}
                onChange={(e) => upd("valorMensalNF", parseFloat(e.target.value) || 0)}
                placeholder="8000"
                required
                aria-required="true"
              />
            </div>
            <EncargosTerceirosSection
              encargos={form.encargosTerceiros}
              onChange={(enc) => upd("encargosTerceiros", enc)}
              valorMensalNF={form.valorMensalNF}
            />
          </CardContent>
        </Card>
      )}

      {/* Estagiário — Remuneração */}
      {isEstagiario && (
        <Card>
          <CardHeader>
            <CardTitle>Remuneração — Estagiário</CardTitle>
          </CardHeader>
          <CardContent>
            <InternFields
              bolsaAuxilio={form.bolsaAuxilio}
              seguroEstagio={form.seguroEstagio}
              auxilioTransporteEstagio={form.auxilioTransporteEstagio}
              recessoRemunerado={form.recessoRemunerado}
              onFieldChange={(field, value) => upd(field as keyof ColaboradorFormData, value)}
            />
          </CardContent>
        </Card>
      )}

      {/* Benefícios (todas as modalidades) */}
      <Card>
        <CardHeader>
          <CardTitle>Benefícios</CardTitle>
        </CardHeader>
        <CardContent>
          <BenefitsSection
            modoBeneficios={form.modoBeneficios}
            onModeChange={(mode) => upd("modoBeneficios", mode)}
            tipoVinculo={form.tipoVinculo}
            salarioBruto={form.salarioBruto}
            planoSaudeValor={form.planoSaudeValor}
            planoSaudeDependentes={form.planoSaudeDependentes}
            auxilioTransporteValor={form.auxilioTransporteValor}
            auxilioAlimentacaoValor={form.auxilioAlimentacaoValor}
            beneficiosMensais={form.beneficiosMensais}
            beneficiosExtras={form.beneficiosExtras}
            onFieldChange={(field, value) => upd(field as keyof ColaboradorFormData, value)}
            onExtrasChange={(extras) => upd("beneficiosExtras", extras)}
          />
        </CardContent>
      </Card>

      {/* Resumo do custo */}
      <CostSummary data={costData} />

      {/* Histórico Financeiro (only on edit) */}
      {colaboradorId && <HistoricoFinanceiro colaboradorId={colaboradorId} />}

      {/* Ações */}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
