import { prisma } from "@/lib/prisma";
import { PageHeader, Card } from "@/components/ui/page-header";

export default async function HomePage() {
  const [clientes, produtos, industrias, marcas] = await Promise.all([
    prisma.cliente.count(),
    prisma.produto.count(),
    prisma.industria.count(),
    prisma.marca.count(),
  ]);

  const stats = [
    { label: "Clientes", value: clientes },
    { label: "Produtos", value: produtos },
    { label: "Indústrias", value: industrias },
    { label: "Marcas", value: marcas },
  ];

  return (
    <div>
      <PageHeader
        title="Início"
        description="Bem-vindo ao sistema de gestão comercial da AWS. O Dashboard completo com indicadores de vendas será exibido aqui em breve."
      />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <p className="text-sm text-muted">{s.label}</p>
            <p className="mt-1 text-3xl font-semibold">{s.value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
