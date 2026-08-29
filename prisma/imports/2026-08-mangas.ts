// Importação do fornecedor Mangas (sacos de confeitar) a partir da tabela
// de pedido recebida em 2026-08. Idempotente (upsert por código).
//
// A planilha original é um TEMPLATE DE PEDIDO em branco (campos de razão
// social/CNPJ/contato do comprador vazios) com uma tabela de 6 produtos
// embutida — usamos só a parte de catálogo (Produto/Medida/Preço CX/
// Pacotes/Quant.Pacote), ignoramos as colunas "Pedido Caixa"/"Valor" que
// são específicas de um pedido, não do cadastro do produto.
//
// Decisões tomadas com o usuário (a planilha não tinha essa informação):
// - Nome do fornecedor: "Mangas" (confirmado pelo usuário — não vinha em
//   nenhum campo da planilha, que estava em branco).
// - Peso líquido: a planilha só traz medida em cm (27x38 etc.), sem peso
//   nenhum — não é possível calcular a partir do que foi informado. Usado
//   um valor simbólico (0.001kg) só pra satisfazer o campo obrigatório do
//   cadastro; não afeta preço nem lógica do pedido, só o total de peso
//   estimado pra frete (que pra esse fornecedor não é representativo).
// - Linha "27x47 / 50 pacotes de 50un": a coluna "Preço CX" trazia
//   R$1.400,00, mas a coluna "Valor" e o Total geral da planilha
//   (R$9.345,50) batem com R$1.598,00 — usado R$1.598,00 por reconciliar
//   com o total. Se estiver errado, corrija em Produtos.

import type { PrismaClient } from "../../src/generated/prisma/client";

const WHATSAPP_PLACEHOLDER = "5500000000000";
const PESO_SIMBOLICO_KG = 0.001;

type ProdutoImport = {
  codigo: string;
  nome: string;
  referencia?: string;
  unidade: string;
  pesoLiquido: number;
  preco: number;
};

const produtosMangas: ProdutoImport[] = [
  { codigo: "MANGAS-001", nome: "Saco Confeitar (CX 250 pacotes de 10un)", referencia: "27x38", unidade: "CX", pesoLiquido: PESO_SIMBOLICO_KG, preco: 1590.0 },
  { codigo: "MANGAS-002", nome: "Saco Confeitar (CX 50 pacotes de 50un)", referencia: "27x38", unidade: "CX", pesoLiquido: PESO_SIMBOLICO_KG, preco: 1134.5 },
  { codigo: "MANGAS-003", nome: "Saco Confeitar (CX 250 pacotes de 10un)", referencia: "27x47", unidade: "CX", pesoLiquido: PESO_SIMBOLICO_KG, preco: 1625.0 },
  { codigo: "MANGAS-004", nome: "Saco Confeitar (CX 50 pacotes de 50un)", referencia: "27x47", unidade: "CX", pesoLiquido: PESO_SIMBOLICO_KG, preco: 1598.0 },
  { codigo: "MANGAS-005", nome: "Saco Confeitar (CX 250 pacotes de 10un)", referencia: "30x50", unidade: "CX", pesoLiquido: PESO_SIMBOLICO_KG, preco: 1800.0 },
  { codigo: "MANGAS-006", nome: "Saco Confeitar (CX 50 pacotes de 50un)", referencia: "30x50", unidade: "CX", pesoLiquido: PESO_SIMBOLICO_KG, preco: 1598.0 },
];

export async function importarFornecedorMangas(prisma: PrismaClient) {
  const marca = await prisma.marca.upsert({
    where: { nome: "Mangas" },
    update: {},
    create: { nome: "Mangas", cor: "#0EA5E9" },
  });
  const industria = await prisma.industria.upsert({
    where: { id: "ind-mangas" },
    update: {},
    create: { id: "ind-mangas", nome: "Mangas", whatsapp: WHATSAPP_PLACEHOLDER },
  });

  for (const p of produtosMangas) {
    await prisma.produto.upsert({
      where: { codigo: p.codigo },
      update: {
        nome: p.nome,
        referencia: p.referencia,
        marcaId: marca.id,
        industriaId: industria.id,
        unidade: p.unidade,
        pesoLiquido: p.pesoLiquido,
        preco: p.preco,
      },
      create: {
        codigo: p.codigo,
        nome: p.nome,
        referencia: p.referencia,
        marcaId: marca.id,
        industriaId: industria.id,
        unidade: p.unidade,
        pesoLiquido: p.pesoLiquido,
        preco: p.preco,
      },
    });
  }

  console.log(`Mangas: ${produtosMangas.length} produtos`);
  console.log(
    `ATENÇÃO: o WhatsApp da indústria Mangas foi criado com um número placeholder (${WHATSAPP_PLACEHOLDER}) — corrija em Cadastros > Indústrias antes de enviar pedidos.`,
  );
}
