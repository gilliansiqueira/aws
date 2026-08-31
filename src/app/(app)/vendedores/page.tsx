import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { VendedoresPanel } from "@/components/vendedores/vendedores-panel";

export default async function VendedoresPage() {
  const [vendedores, marcas] = await Promise.all([
    prisma.vendedor.findMany({
      include: { marcas: { include: { marca: true } } },
      orderBy: { nome: "asc" },
    }),
    prisma.marca.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Vendedores"
        description="Vendedores externos do fechamento mensal de comissões — cada um atende uma ou mais marcas, e usa o percentual de comissão cadastrado na marca."
      />
      <VendedoresPanel
        vendedoresIniciais={vendedores.map((v) => ({
          id: v.id,
          nome: v.nome,
          ativo: v.ativo,
          marcas: v.marcas.map((vm) => ({
            id: vm.marca.id,
            nome: vm.marca.nome,
            percentualComissao: Number(vm.marca.percentualComissao),
          })),
        }))}
        marcas={marcas.map((m) => ({
          id: m.id,
          nome: m.nome,
          percentualComissao: Number(m.percentualComissao),
        }))}
      />
    </div>
  );
}
