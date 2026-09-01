import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { ImportarFotoPanel } from "@/components/pedidos/importar-foto-panel";

export default async function ImportarFotoPage() {
  const [clientes, industrias, produtos] = await Promise.all([
    prisma.cliente.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.industria.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.produto.findMany({
      where: { ativo: true },
      include: { marca: true, faixasPreco: { orderBy: { quantidadeMinima: "asc" } } },
      orderBy: { nome: "asc" },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Novo Pedido por Foto"
        description="Envie uma foto (nota, papel do cliente, print de WhatsApp etc.) e o sistema tenta ler o conteúdo automaticamente. Confira os dados antes de usar — a leitura pode errar."
      />
      <ImportarFotoPanel
        clientes={clientes.map((c) => ({
          id: c.id,
          nome: c.nome,
          statusCredito: c.statusCredito,
          cnpj: c.cnpj,
          cidade: c.cidade,
          uf: c.uf,
          compradorPadrao: c.compradorPadrao,
          formaPagamentoPadraoId: c.formaPagamentoPadraoId,
        }))}
        industrias={industrias.map((i) => ({
          id: i.id,
          nome: i.nome,
          whatsapp: i.whatsapp,
          transportadoraPadraoId: i.transportadoraPadraoId,
        }))}
        produtos={produtos.map((p) => ({
          id: p.id,
          nome: p.nome,
          codigo: p.codigo,
          referencia: p.referencia,
          industriaId: p.industriaId,
          marcaNome: p.marca.nome,
          unidade: p.unidade,
          pesoLiquido: Number(p.pesoLiquido),
          preco: Number(p.preco),
          faixas: p.faixasPreco.map((f) => ({
            id: f.id,
            quantidadeMinima: Number(f.quantidadeMinima),
            quantidadeMaxima: f.quantidadeMaxima === null ? null : Number(f.quantidadeMaxima),
            preco: Number(f.preco),
          })),
        }))}
      />
    </div>
  );
}
