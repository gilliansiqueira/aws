import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { EmpresaForm } from "./empresa-form";
import { UsuariosPanel } from "@/components/configuracoes/usuarios-panel";

export default async function ConfiguracoesPage() {
  const [empresa, usuarios, session] = await Promise.all([
    prisma.empresaConfig.findFirst(),
    prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, email: true, role: true, ativo: true },
    }),
    auth(),
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
            percentualImposto: empresa ? String(Number(empresa.percentualImposto)) : "9.7",
          }}
        />
      </div>

      <UsuariosPanel usuariosIniciais={usuarios} usuarioLogadoId={session?.user?.id ?? ""} />
    </div>
  );
}
