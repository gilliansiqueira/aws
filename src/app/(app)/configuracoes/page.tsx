import { prisma } from "@/lib/prisma";
import { PageHeader, Card } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { EmpresaForm } from "./empresa-form";

export default async function ConfiguracoesPage() {
  const [empresa, usuarios] = await Promise.all([
    prisma.empresaConfig.findFirst(),
    prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <PageHeader title="Configurações" description="Dados da empresa e usuários do sistema." />
        <EmpresaForm
          initial={{
            nome: empresa?.nome ?? "",
            razaoSocial: empresa?.razaoSocial ?? "",
            cnpj: empresa?.cnpj ?? "",
            endereco: empresa?.endereco ?? "",
            bairro: empresa?.bairro ?? "",
            cidade: empresa?.cidade ?? "",
            uf: empresa?.uf ?? "",
            cep: empresa?.cep ?? "",
            telefone: empresa?.telefone ?? "",
          }}
        />
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Usuários</h2>
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">E-mail</th>
                  <th className="px-4 py-3 font-medium">Papel</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge color={u.role === "ADMIN" ? "purple" : "blue"}>
                        {u.role === "ADMIN" ? "Administrador" : "Vendedor"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={u.ativo ? "green" : "gray"}>
                        {u.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-border p-4 text-xs text-muted">
            O cadastro de novos usuários pela interface será adicionado em uma
            próxima etapa. Por enquanto, a estrutura do banco já suporta
            múltiplos usuários e papéis (admin/vendedor).
          </p>
        </Card>
      </div>
    </div>
  );
}
