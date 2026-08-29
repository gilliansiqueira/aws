import { prisma } from "@/lib/prisma";
import { PageHeader, Card, EmptyState } from "@/components/ui/page-header";
import { Select } from "@/components/ui/field";
import { MapaWrapper } from "@/components/mapa/mapa-wrapper";

export default async function MapaPage({
  searchParams,
}: PageProps<"/mapa">) {
  const params = await searchParams;
  const uf = typeof params.uf === "string" ? params.uf : "";
  const cidade = typeof params.cidade === "string" ? params.cidade : "";

  const [clientesComGeo, ufsDisponiveis, cidadesDisponiveis] = await Promise.all([
    prisma.cliente.findMany({
      where: {
        ativo: true,
        latitude: { not: null },
        longitude: { not: null },
        uf: uf || undefined,
        cidade: cidade || undefined,
      },
      select: { id: true, nome: true, cnpj: true, cidade: true, uf: true, telefone: true, latitude: true, longitude: true },
    }),
    prisma.cliente.findMany({
      where: { ativo: true, uf: { not: null } },
      select: { uf: true },
      distinct: ["uf"],
      orderBy: { uf: "asc" },
    }),
    prisma.cliente.findMany({
      where: { ativo: true, cidade: { not: null }, uf: uf || undefined },
      select: { cidade: true },
      distinct: ["cidade"],
      orderBy: { cidade: "asc" },
    }),
  ]);

  const clientes = clientesComGeo
    .filter((c) => c.latitude !== null && c.longitude !== null)
    .map((c) => ({ ...c, latitude: c.latitude as number, longitude: c.longitude as number }));

  const totalClientesAtivos = await prisma.cliente.count({ where: { ativo: true } });
  const semGeolocalizacao = totalClientesAtivos - clientesComGeo.length;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Mapa de Vendas"
        description="Clientes ativos geolocalizados. Use os filtros pra restringir por região."
      />

      <form className="flex flex-wrap gap-3">
        <Select name="uf" defaultValue={uf} className="w-auto max-w-[160px]">
          <option value="">Todos os estados</option>
          {ufsDisponiveis.map((c) => (
            <option key={c.uf} value={c.uf!}>
              {c.uf}
            </option>
          ))}
        </Select>
        <Select name="cidade" defaultValue={cidade} className="w-auto max-w-[220px]">
          <option value="">Todas as cidades</option>
          {cidadesDisponiveis.map((c) => (
            <option key={c.cidade} value={c.cidade!}>
              {c.cidade}
            </option>
          ))}
        </Select>
        <button
          type="submit"
          className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5"
        >
          Filtrar
        </button>
      </form>

      {clientes.length === 0 ? (
        <EmptyState
          title="Nenhum cliente geolocalizado encontrado"
          description="Cadastre latitude/longitude no cliente (ou ajuste os filtros) pra ele aparecer no mapa."
        />
      ) : (
        <Card className="h-[600px] overflow-hidden p-0">
          <MapaWrapper clientes={clientes} />
        </Card>
      )}

      <p className="text-xs text-muted">
        {clientes.length} cliente{clientes.length !== 1 ? "s" : ""} no mapa
        {semGeolocalizacao > 0 &&
          ` — ${semGeolocalizacao} cliente${semGeolocalizacao > 1 ? "s" : ""} ativo${semGeolocalizacao > 1 ? "s" : ""} sem latitude/longitude cadastrada não aparece${semGeolocalizacao > 1 ? "m" : ""} aqui.`}
      </p>
    </div>
  );
}
