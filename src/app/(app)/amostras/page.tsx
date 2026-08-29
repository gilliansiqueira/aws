import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { AmostrasPanel } from "@/components/amostras/amostras-panel";

export default async function AmostrasPage() {
  const [amostras, clientes, produtos] = await Promise.all([
    prisma.amostra.findMany({
      include: {
        cliente: { select: { id: true, nome: true } },
        marca: { select: { id: true, nome: true } },
        industria: { select: { id: true, nome: true } },
        pedido: { select: { id: true, numero: true } },
      },
      orderBy: { dataEnvio: "desc" },
    }),
    prisma.cliente.findMany({ where: { ativo: true }, orderBy: { nome: "asc" }, select: { id: true, nome: true, cnpj: true } }),
    prisma.produto.findMany({
      where: { ativo: true },
      include: { marca: true, industria: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Amostras"
        description="Controle de amostras enviadas a clientes e conversão em venda."
      />
      <AmostrasPanel
        amostrasIniciais={amostras.map((a) => ({
          id: a.id,
          clienteId: a.clienteId,
          clienteNome: a.cliente.nome,
          produtoNome: a.produtoNomeSnapshot,
          marcaNome: a.marca.nome,
          industriaNome: a.industria.nome,
          dataEnvio: a.dataEnvio.toISOString(),
          quantidade: Number(a.quantidade),
          status: a.status,
          dataRetorno: a.dataRetorno ? a.dataRetorno.toISOString() : null,
          observacoes: a.observacoes,
          pedidoId: a.pedidoId,
          pedidoNumero: a.pedido?.numero ?? null,
          valorVendaGerado: a.valorVendaGerado ? Number(a.valorVendaGerado) : null,
        }))}
        clientes={clientes}
        produtos={produtos.map((p) => ({
          id: p.id,
          nome: p.nome,
          codigo: p.codigo,
          marcaNome: p.marca.nome,
          industriaNome: p.industria.nome,
          unidade: p.unidade,
        }))}
      />
    </div>
  );
}
