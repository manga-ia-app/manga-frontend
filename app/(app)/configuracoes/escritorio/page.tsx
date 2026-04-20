"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Building2, DollarSign, Clock, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import {
  getConfiguracaoEscritorio,
  createConfiguracaoEscritorio,
  updateConfiguracaoEscritorio,
} from "@/lib/api/precificacao";

interface FormData {
  nomeEscritorio: string;
  aluguelMensal: number;
  salarios: number;
  softwareLicencas: number;
  marketing: number;
  contabilidade: number;
  internet: number;
  energia: number;
  outrosCustosFixos: number;
  outrosCustosFixosDescricao: string;
  deslocamentoMedio: number;
  impressaoMedio: number;
  terceirizacaoMedio: number;
  outrosCustosVariaveis: number;
  numeroPessoas: number;
  horasMensaisPorPessoa: number;
  horasNaoFaturaveis: number;
  margemDesejada: number;
}

const defaultForm: FormData = {
  nomeEscritorio: "",
  aluguelMensal: 0,
  salarios: 0,
  softwareLicencas: 0,
  marketing: 0,
  contabilidade: 0,
  internet: 0,
  energia: 0,
  outrosCustosFixos: 0,
  outrosCustosFixosDescricao: "",
  deslocamentoMedio: 0,
  impressaoMedio: 0,
  terceirizacaoMedio: 0,
  outrosCustosVariaveis: 0,
  numeroPessoas: 1,
  horasMensaisPorPessoa: 160,
  horasNaoFaturaveis: 40,
  margemDesejada: 30,
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function CurrencyInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const [displayValue, setDisplayValue] = useState(
    value > 0 ? value.toFixed(2) : ""
  );

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
          R$
        </span>
        <Input
          type="number"
          step="0.01"
          min="0"
          value={displayValue}
          onChange={(e) => {
            setDisplayValue(e.target.value);
            onChange(parseFloat(e.target.value) || 0);
          }}
          className="pl-10"
          placeholder="0,00"
        />
      </div>
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  suffix,
  min = 0,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  min?: number;
  max?: number;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <Input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
  highlight,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-primary" : ""}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div
            className={`rounded-lg p-2 ${highlight ? "bg-primary/10" : "bg-muted"}`}
          >
            <Icon
              className={`h-5 w-5 ${highlight ? "text-primary" : "text-muted-foreground"}`}
            />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p
              className={`text-2xl font-bold ${highlight ? "text-primary" : ""}`}
            >
              {value}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ConfiguracaoEscritorioPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormData>(defaultForm);

  const { data: config, isLoading } = useQuery({
    queryKey: ["configuracao-escritorio"],
    queryFn: getConfiguracaoEscritorio,
  });

  useEffect(() => {
    if (config) {
      setForm({
        nomeEscritorio: config.nomeEscritorio || "",
        aluguelMensal: config.aluguelMensal,
        salarios: config.salarios,
        softwareLicencas: config.softwareLicencas,
        marketing: config.marketing,
        contabilidade: config.contabilidade,
        internet: config.internet,
        energia: config.energia,
        outrosCustosFixos: config.outrosCustosFixos,
        outrosCustosFixosDescricao: config.outrosCustosFixosDescricao || "",
        deslocamentoMedio: config.deslocamentoMedio,
        impressaoMedio: config.impressaoMedio,
        terceirizacaoMedio: config.terceirizacaoMedio,
        outrosCustosVariaveis: config.outrosCustosVariaveis,
        numeroPessoas: config.numeroPessoas,
        horasMensaisPorPessoa: config.horasMensaisPorPessoa,
        horasNaoFaturaveis: config.horasNaoFaturaveis,
        margemDesejada: config.margemDesejada,
      });
    }
  }, [config]);

  // Calculo local das metricas (preview em tempo real)
  const metrics = useMemo(() => {
    const custoFixoTotal =
      form.aluguelMensal +
      form.salarios +
      form.softwareLicencas +
      form.marketing +
      form.contabilidade +
      form.internet +
      form.energia +
      form.outrosCustosFixos;

    const custoVariavelTotal =
      form.deslocamentoMedio +
      form.impressaoMedio +
      form.terceirizacaoMedio +
      form.outrosCustosVariaveis;

    const custoMensalTotal = custoFixoTotal + custoVariavelTotal;

    const capacidadeHorasFaturaveis =
      form.numeroPessoas * form.horasMensaisPorPessoa -
      form.numeroPessoas * form.horasNaoFaturaveis;

    const custoHoraReal =
      capacidadeHorasFaturaveis > 0
        ? custoMensalTotal / capacidadeHorasFaturaveis
        : 0;

    const margemDecimal = form.margemDesejada / 100;
    const faturamentoMinimoNecessario =
      margemDecimal < 1 ? custoMensalTotal / (1 - margemDecimal) : 0;

    return {
      custoMensalTotal,
      capacidadeHorasFaturaveis,
      custoHoraReal,
      faturamentoMinimoNecessario,
    };
  }, [form]);

  const createMutation = useMutation({
    mutationFn: createConfiguracaoEscritorio,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["configuracao-escritorio"] });
      toast.success("Configuração salva com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao salvar configuração. Tente novamente.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) =>
      updateConfiguracaoEscritorio(config!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["configuracao-escritorio"] });
      toast.success("Configuração atualizada com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao atualizar configuração. Tente novamente.");
    },
  });

  const handleSave = () => {
    if (config?.id) {
      updateMutation.mutate(form);
    } else {
      createMutation.mutate(form);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const updateField = (field: keyof FormData, value: number | string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuração do Escritório"
        description="Configure a estrutura de custos do seu escritório para calcular preços com precisão"
      />

      {/* Nome do Escritório */}
      <Card>
        <CardHeader>
          <CardTitle>Identificação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-w-md">
            <Label htmlFor="nome-escritorio">Nome do Escritório (para assinatura em propostas)</Label>
            <Input
              id="nome-escritorio"
              placeholder="Ex: Arquitetura & Design Ltda."
              value={form.nomeEscritorio}
              onChange={(e) => updateField("nomeEscritorio", e.target.value)}
              maxLength={300}
            />
          </div>
        </CardContent>
      </Card>

      {/* Metricas Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Custo/Hora Real"
          value={formatCurrency(metrics.custoHoraReal)}
          icon={DollarSign}
          highlight
        />
        <MetricCard
          title="Custo Mensal Total"
          value={formatCurrency(metrics.custoMensalTotal)}
          icon={Building2}
        />
        <MetricCard
          title="Horas Faturáveis"
          value={`${metrics.capacidadeHorasFaturaveis}h/mês`}
          icon={Clock}
        />
        <MetricCard
          title="Faturamento Mínimo"
          value={formatCurrency(metrics.faturamentoMinimoNecessario)}
          icon={TrendingUp}
        />
      </div>

      {/* Custos Fixos */}
      <Card>
        <CardHeader>
          <CardTitle>Custos Fixos Mensais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <CurrencyInput
              label="Aluguel"
              value={form.aluguelMensal}
              onChange={(v) => updateField("aluguelMensal", v)}
            />
            <CurrencyInput
              label="Salários"
              value={form.salarios}
              onChange={(v) => updateField("salarios", v)}
            />
            <CurrencyInput
              label="Software e Licenças"
              value={form.softwareLicencas}
              onChange={(v) => updateField("softwareLicencas", v)}
            />
            <CurrencyInput
              label="Marketing"
              value={form.marketing}
              onChange={(v) => updateField("marketing", v)}
            />
            <CurrencyInput
              label="Contabilidade"
              value={form.contabilidade}
              onChange={(v) => updateField("contabilidade", v)}
            />
            <CurrencyInput
              label="Internet"
              value={form.internet}
              onChange={(v) => updateField("internet", v)}
            />
            <CurrencyInput
              label="Energia"
              value={form.energia}
              onChange={(v) => updateField("energia", v)}
            />
            <CurrencyInput
              label="Outros Custos Fixos"
              value={form.outrosCustosFixos}
              onChange={(v) => updateField("outrosCustosFixos", v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Custos Variaveis */}
      <Card>
        <CardHeader>
          <CardTitle>Custos Variáveis Médios Mensais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <CurrencyInput
              label="Deslocamento"
              value={form.deslocamentoMedio}
              onChange={(v) => updateField("deslocamentoMedio", v)}
            />
            <CurrencyInput
              label="Impressão"
              value={form.impressaoMedio}
              onChange={(v) => updateField("impressaoMedio", v)}
            />
            <CurrencyInput
              label="Terceirização"
              value={form.terceirizacaoMedio}
              onChange={(v) => updateField("terceirizacaoMedio", v)}
            />
            <CurrencyInput
              label="Outros Custos Variáveis"
              value={form.outrosCustosVariaveis}
              onChange={(v) => updateField("outrosCustosVariaveis", v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Capacidade Produtiva */}
      <Card>
        <CardHeader>
          <CardTitle>Capacidade Produtiva</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <NumberInput
              label="Número de Pessoas"
              value={form.numeroPessoas}
              onChange={(v) => updateField("numeroPessoas", Math.max(1, Math.round(v)))}
              min={1}
            />
            <NumberInput
              label="Horas/Pessoa/Mês"
              value={form.horasMensaisPorPessoa}
              onChange={(v) => updateField("horasMensaisPorPessoa", Math.max(1, Math.round(v)))}
              suffix="h"
              min={1}
              max={744}
            />
            <NumberInput
              label="Horas Não Faturáveis"
              value={form.horasNaoFaturaveis}
              onChange={(v) => updateField("horasNaoFaturaveis", Math.max(0, Math.round(v)))}
              suffix="h"
              min={0}
            />
            <NumberInput
              label="Margem Desejada"
              value={form.margemDesejada}
              onChange={(v) => updateField("margemDesejada", v)}
              suffix="%"
              min={0}
              max={99}
            />
          </div>
        </CardContent>
      </Card>

      {/* Botao Salvar */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Salvando..." : "Salvar Configuração"}
        </Button>
      </div>
    </div>
  );
}
