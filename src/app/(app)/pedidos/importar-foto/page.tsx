import { PageHeader } from "@/components/ui/page-header";
import { ImportarFotoPanel } from "@/components/pedidos/importar-foto-panel";

export default function ImportarFotoPage() {
  return (
    <div>
      <PageHeader
        title="Novo Pedido por Foto"
        description="Envie uma foto (nota, papel do cliente, print de WhatsApp etc.) e o sistema tenta ler o conteúdo automaticamente. Confira os dados antes de usar — a leitura pode errar."
      />
      <ImportarFotoPanel />
    </div>
  );
}
