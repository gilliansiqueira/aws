// Estrutura padrão do plano de contas de uma distribuidora — 2 níveis
// (Grupo > Conta), sugerida e aprovada com o usuário. Roda em todo
// `prisma db seed` (idempotente via upsert por id determinístico), e
// pode ser editada livremente depois pela tela de Plano de Contas —
// esse seed só garante que o sistema não nasce sem nenhuma conta.
//
// ids fixos importam: Comissao.contaContabilId e a receita de pedidos no
// fechamento mensal (Relatórios) referenciam "conta-comissoes" e
// "conta-receita-vendas" diretamente.

import type { PrismaClient } from "../../src/generated/prisma/client";

type ContaSeed = { id: string; nome: string; ordem: number };
type GrupoSeed = { id: string; nome: string; tipo: "RECEITA" | "DESPESA"; ordem: number; contas: ContaSeed[] };

export const GRUPOS_PADRAO: GrupoSeed[] = [
  {
    id: "grupo-receitas",
    nome: "Receitas",
    tipo: "RECEITA",
    ordem: 0,
    contas: [{ id: "conta-receita-vendas", nome: "Receita de Vendas", ordem: 0 }],
  },
  {
    id: "grupo-despesas-operacionais",
    nome: "Despesas Operacionais",
    tipo: "DESPESA",
    ordem: 1,
    contas: [
      { id: "conta-comissoes", nome: "Comissões", ordem: 0 },
      { id: "conta-combustivel", nome: "Combustível", ordem: 1 },
      { id: "conta-frete", nome: "Frete", ordem: 2 },
    ],
  },
  {
    id: "grupo-despesas-administrativas",
    nome: "Despesas Administrativas",
    tipo: "DESPESA",
    ordem: 2,
    contas: [
      { id: "conta-aluguel", nome: "Aluguel", ordem: 0 },
      { id: "conta-salarios", nome: "Salários", ordem: 1 },
      { id: "conta-telefone-internet", nome: "Telefone/Internet", ordem: 2 },
    ],
  },
  {
    id: "grupo-despesas-financeiras",
    nome: "Despesas Financeiras",
    tipo: "DESPESA",
    ordem: 3,
    contas: [{ id: "conta-tarifas-bancarias", nome: "Tarifas Bancárias", ordem: 0 }],
  },
];

export async function seedPlanoContasPadrao(prisma: PrismaClient) {
  for (const grupo of GRUPOS_PADRAO) {
    await prisma.grupoConta.upsert({
      where: { id: grupo.id },
      update: {},
      create: { id: grupo.id, nome: grupo.nome, tipo: grupo.tipo, ordem: grupo.ordem },
    });
    for (const conta of grupo.contas) {
      await prisma.contaContabil.upsert({
        where: { id: conta.id },
        update: {},
        create: { id: conta.id, nome: conta.nome, grupoId: grupo.id, ordem: conta.ordem },
      });
    }
  }
  console.log(`Plano de contas: ${GRUPOS_PADRAO.length} grupos, ${GRUPOS_PADRAO.reduce((a, g) => a + g.contas.length, 0)} contas`);
}
