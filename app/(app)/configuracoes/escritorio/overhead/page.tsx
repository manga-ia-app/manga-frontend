import { PageHeader } from "@/components/shared/page-header";
import { OverheadPageClient } from "@/components/precificacao/overhead/OverheadPageClient";
import type { HelpContent } from "@/components/shared/help-button";

const helpContent: HelpContent = {
  title: "Configuração — Overhead",
  sections: [
    {
      heading: "Raio-X do Escritório",
      content:
        "O painel Raio-X mostra o percentual de overhead (custos não-pessoal em relação ao pessoal) e o total mensal do escritório. Esses valores são recalculados em tempo real conforme você edita.",
    },
    {
      heading: "Categorias de Custo",
      content:
        "As 9 categorias padrão (Pessoal, Infraestrutura, Tecnologia, etc.) são fixas e não podem ser excluídas. Você pode criar categorias customizadas, adicionar itens de custo com nome, valor e frequência (Mensal, Trimestral, Anual ou Personalizado), e vincular grupos de colaboradores. Colaboradores sincronizados aparecem automaticamente com base no grupo.",
    },
    {
      heading: "Indicador de Saúde",
      content:
        "As faixas de saúde indicam se o overhead do escritório está em nível saudável. A primeira faixa começa sempre em 0% e a última vai até o infinito. Personalize os limites intermediários e rótulos para refletir a realidade do seu escritório. O badge colorido no Raio-X atualiza em tempo real.",
    },
  ],
};

export default function OverheadPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuração — Overhead"
        description="Decomposição do custo operacional do escritório"
        help={helpContent}
      />
      <OverheadPageClient />
    </div>
  );
}
