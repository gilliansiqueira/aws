import { PageHeader } from "@/components/ui/page-header";
import { EmConstrucao } from "@/components/ui/em-construcao";

export default function NovoPedidoPage() {
  return (
    <div>
      <PageHeader title="Novo Pedido" />
      <EmConstrucao modulo="Wizard de Pedido" />
    </div>
  );
}
