// Importação de dados reais de fornecedor (Cocosul, Diehl Chocolate, Almeidapan)
// a partir das tabelas de preço recebidas em 2026-08. Script idempotente
// (upsert por código/nome) — seguro rodar mais de uma vez.
//
// Origem dos dados e regras de interpretação usadas (documentado porque as
// tabelas originais não trazem todos os campos que o cadastro exige):
//
// - Cocosul: cada produto tem 3 faixas de preço (Tabela A/B/C) na própria
//   unidade de venda informada na tabela (KG ou CX) — sem conversão entre
//   unidades, igual à regra já usada no resto do sistema. `Produto.preco`
//   é preenchido com o valor da Tabela A só para satisfazer o campo
//   obrigatório do schema; na prática nunca é usado, porque o produto tem
//   faixas (o preço vem sempre de encontrarFaixaPreco).
// - Diehl Chocolate: preço fixo, sem faixa. Usamos a coluna "PREÇO SC/CX"
//   (preço do pacote fechado — saco, balde, bag ou pote) como Produto.preco,
//   e pesoLiquido = peso desse pacote. 3 itens ficaram de fora por não
//   terem preço definido na tabela original ("IND." ou "-"): ver
//   NAO_IMPORTADOS abaixo.
// - Almeidapan: a tabela não tem coluna de unidade nem código — a embalagem
//   vem embutida no nome do produto. Regra aplicada: nome com padrão
//   "NxMK" (ex: 5X2K, 10X1) = caixa com N pacotes de M kg, unidade CX,
//   pesoLiquido = N*M; nome só com "NK" no final (ex: 5K) = pacote único,
//   unidade UN, pesoLiquido = N. Código gerado sequencialmente
//   (ALMEIDAPAN-001, 002...) na ordem da planilha, já que não há código de
//   fornecedor. 1 item ficou de fora por não ter padrão de embalagem
//   identificável no nome: ver NAO_IMPORTADOS abaixo.
//
// Números de WhatsApp das indústrias NÃO vêm nas tabelas de preço — foi
// usado um placeholder ("5500000000000") que precisa ser corrigido em
// Cadastros > Indústrias antes de enviar pedidos por WhatsApp pra elas.

import type { PrismaClient } from "../../src/generated/prisma/client";

const WHATSAPP_PLACEHOLDER = "5500000000000";

type FaixaImport = { quantidadeMinima: number; quantidadeMaxima: number | null; preco: number; ordem: number };
type ProdutoImport = {
  codigo: string;
  nome: string;
  referencia?: string;
  unidade: string;
  pesoLiquido: number;
  preco: number;
  faixas?: FaixaImport[];
};

async function upsertFornecedor(prisma: PrismaClient, nome: string, industriaId: string, cor: string) {
  const marca = await prisma.marca.upsert({
    where: { nome },
    update: {},
    create: { nome, cor },
  });
  const industria = await prisma.industria.upsert({
    where: { id: industriaId },
    update: {},
    create: {
      id: industriaId,
      nome,
      whatsapp: WHATSAPP_PLACEHOLDER,
    },
  });
  return { marcaId: marca.id, industriaId: industria.id };
}

async function upsertProdutos(
  prisma: PrismaClient,
  marcaId: string,
  industriaId: string,
  produtos: ProdutoImport[],
) {
  for (const p of produtos) {
    const produto = await prisma.produto.upsert({
      where: { codigo: p.codigo },
      update: {
        nome: p.nome,
        referencia: p.referencia,
        marcaId,
        industriaId,
        unidade: p.unidade,
        pesoLiquido: p.pesoLiquido,
        preco: p.preco,
      },
      create: {
        codigo: p.codigo,
        nome: p.nome,
        referencia: p.referencia,
        marcaId,
        industriaId,
        unidade: p.unidade,
        pesoLiquido: p.pesoLiquido,
        preco: p.preco,
      },
    });

    if (p.faixas) {
      await prisma.faixaPreco.deleteMany({ where: { produtoId: produto.id } });
      await prisma.faixaPreco.createMany({
        data: p.faixas.map((f) => ({
          produtoId: produto.id,
          quantidadeMinima: f.quantidadeMinima,
          quantidadeMaxima: f.quantidadeMaxima,
          preco: f.preco,
          ordem: f.ordem,
        })),
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Cocosul — 17 produtos, todos com faixa de preço (Tabela A/B/C)
// ---------------------------------------------------------------------------

function faixasCocosulKg(a: number, b: number, c: number): FaixaImport[] {
  return [
    { quantidadeMinima: 200, quantidadeMaxima: 500, preco: a, ordem: 0 },
    { quantidadeMinima: 500.001, quantidadeMaxima: 1000, preco: b, ordem: 1 },
    { quantidadeMinima: 1000.001, quantidadeMaxima: null, preco: c, ordem: 2 },
  ];
}

function faixasCocosulCx(a: number, b: number, c: number): FaixaImport[] {
  return [
    { quantidadeMinima: 10, quantidadeMaxima: 20, preco: a, ordem: 0 },
    { quantidadeMinima: 21, quantidadeMaxima: 50, preco: b, ordem: 1 },
    { quantidadeMinima: 51, quantidadeMaxima: null, preco: c, ordem: 2 },
  ];
}

const produtosCocosul: ProdutoImport[] = [
  // Embalagens de 5kg e 1kg — unidade KG, pesoLiquido 1 (preço já é por kg)
  { codigo: "0769503132204", nome: "Coco Ralado Flocos Úmido e Adoçado Cocosul 4x5KG", unidade: "KG", pesoLiquido: 1, preco: 24.98, faixas: faixasCocosulKg(24.98, 24.48, 23.98) },
  { codigo: "0769503132211", nome: "Coco Ralado Flocos Úmido e Adoçado Cocosul 20x1KG", unidade: "KG", pesoLiquido: 1, preco: 25.28, faixas: faixasCocosulKg(25.28, 24.78, 24.28) },
  { codigo: "0769503132273", nome: "Coco Ralado Flocos Desidratado Cocosul 12x1KG", unidade: "KG", pesoLiquido: 1, preco: 42.98, faixas: faixasCocosulKg(42.98, 42.48, 41.98) },
  { codigo: "0769503132242", nome: "Coco Ralado Médio Úmido e Adoçado Cocosul 4x5KG", unidade: "KG", pesoLiquido: 1, preco: 22.68, faixas: faixasCocosulKg(22.68, 22.18, 21.68) },
  { codigo: "0769503132259", nome: "Coco Ralado Médio Úmido e Adoçado Cocosul 20x1KG", unidade: "KG", pesoLiquido: 1, preco: 22.98, faixas: faixasCocosulKg(22.98, 22.48, 21.98) },
  { codigo: "0769503132310", nome: "Coco Ralado Médio Desidratado Cocosul 12x1KG", unidade: "KG", pesoLiquido: 1, preco: 40.98, faixas: faixasCocosulKg(40.98, 40.48, 39.98) },
  { codigo: "0769503132228", nome: "Coco Ralado Fino Úmido e Adoçado Cocosul 4x5KG", unidade: "KG", pesoLiquido: 1, preco: 16.68, faixas: faixasCocosulKg(16.68, 16.18, 15.68) },
  { codigo: "0769503132235", nome: "Coco Ralado Fino Úmido e Adoçado Cocosul 20x1KG", unidade: "KG", pesoLiquido: 1, preco: 16.98, faixas: faixasCocosulKg(16.98, 16.48, 15.98) },
  { codigo: "0769503132297", nome: "Coco Ralado Fino Desidratado Cocosul 12x1KG", unidade: "KG", pesoLiquido: 1, preco: 33.98, faixas: faixasCocosulKg(33.98, 33.48, 32.98) },
  // Embalagens de 50g e 100g — unidade CX (caixa fechada), pesoLiquido = peso total da caixa
  { codigo: "0769503132327", nome: "Coco Ralado Úmido e Adoçado Cocosul 40x50g", unidade: "CX", pesoLiquido: 2, preco: 87.60, faixas: faixasCocosulCx(87.60, 75.60, 63.60) },
  { codigo: "0769503132341", nome: "Coco Ralado Úmido e Adoçado Cocosul 24x100g", unidade: "CX", pesoLiquido: 2.4, preco: 81.60, faixas: faixasCocosulCx(81.60, 74.40, 67.20) },
  { codigo: "0769503132334", nome: "Coco Ralado Flocos Úmido e Adoçado Cocosul 40x50g", unidade: "CX", pesoLiquido: 2, preco: 98.80, faixas: faixasCocosulCx(98.80, 86.80, 74.80) },
  { codigo: "0769503132358", nome: "Coco Ralado Flocos Úmido e Adoçado Cocosul 24x100g", unidade: "CX", pesoLiquido: 2.4, preco: 98.40, faixas: faixasCocosulCx(98.40, 90.72, 83.52) },
  { codigo: "0769503132365", nome: "Coco Ralado Desidratado Cocosul 40x50g", unidade: "CX", pesoLiquido: 2, preco: 118.00, faixas: faixasCocosulCx(118.00, 108.00, 98.00) },
  { codigo: "0769503132389", nome: "Coco Ralado Desidratado Cocosul 24x100g", unidade: "CX", pesoLiquido: 2.4, preco: 116.40, faixas: faixasCocosulCx(116.40, 110.40, 104.40) },
  { codigo: "0769503132372", nome: "Coco Ralado Flocos Desidratado Cocosul 40x50g", unidade: "CX", pesoLiquido: 2, preco: 131.60, faixas: faixasCocosulCx(131.60, 119.60, 108.00) },
  { codigo: "0769503132396", nome: "Coco Ralado Flocos Desidratado Cocosul 24x100g", unidade: "CX", pesoLiquido: 2.4, preco: 136.08, faixas: faixasCocosulCx(136.08, 127.92, 119.76) },
];

// ---------------------------------------------------------------------------
// Diehl Chocolate — 29 produtos, preço fixo (sem faixa). Tabela FOB 08/06/2026.
// Preço = coluna "PREÇO SC/CX" (pacote fechado); pesoLiquido = peso do pacote.
// ---------------------------------------------------------------------------

const produtosDiehl: ProdutoImport[] = [
  { codigo: "DIEHL-MAO20", nome: "Diehl Chocolate Meio Amargo Filete 20kg (Linha Ouro)", unidade: "SC", pesoLiquido: 20, preco: 368.62 },
  { codigo: "DIEHL-MAO5", nome: "Diehl Chocolate Meio Amargo Filete 5kg (Linha Ouro)", unidade: "PCT", pesoLiquido: 5, preco: 97.47 },
  { codigo: "DIEHL-BRO20", nome: "Diehl Chocolate Branco Filete 20kg (Linha Ouro)", unidade: "SC", pesoLiquido: 20, preco: 357.15 },
  { codigo: "DIEHL-BRO5", nome: "Diehl Chocolate Branco Filete 5kg (Linha Ouro)", unidade: "PCT", pesoLiquido: 5, preco: 94.60 },
  { codigo: "DIEHL-ALO20", nome: "Diehl Chocolate Ao Leite Filete 20kg (Linha Ouro)", unidade: "SC", pesoLiquido: 20, preco: 355.85 },
  { codigo: "DIEHL-ALO5", nome: "Diehl Chocolate Ao Leite Filete 5kg (Linha Ouro)", unidade: "PCT", pesoLiquido: 5, preco: 94.27 },
  { codigo: "DIEHL-MAD20", nome: "Diehl Chocolate Meio Amargo 20kg (Linha Diamante)", unidade: "SC", pesoLiquido: 20, preco: 408.16 },
  { codigo: "DIEHL-BRD20", nome: "Diehl Chocolate Branco 20kg (Linha Diamante)", unidade: "SC", pesoLiquido: 20, preco: 399.58 },
  { codigo: "DIEHL-FLOW20", nome: "Diehl Chocolate Flow Preto 20kg (Maior Rendimento)", unidade: "SC", pesoLiquido: 20, preco: 332.11 },
  { codigo: "DIEHL-MAL20", nome: "Diehl Chocolate Blend Preto 20kg (Maior Rendimento)", unidade: "SC", pesoLiquido: 20, preco: 352.41 },
  { codigo: "DIEHL-BRL20", nome: "Diehl Chocolate Líquido Branco 20kg (Maior Rendimento)", unidade: "SC", pesoLiquido: 20, preco: 356.92 },
  { codigo: "DIEHL-MAP20", nome: "Diehl Chocolate Meio Amargo Filete 20kg (Linha Prata)", unidade: "SC", pesoLiquido: 20, preco: 306.94 },
  { codigo: "DIEHL-BRP20", nome: "Diehl Chocolate Branco Filete 20kg (Linha Prata)", unidade: "SC", pesoLiquido: 20, preco: 289.68 },
  { codigo: "DIEHL-FAL10", nome: "Diehl Chocolate Fornéavel Ao Leite Bisnagas 10kg", unidade: "CX", pesoLiquido: 10, preco: 191.26 },
  { codigo: "DIEHL-FAV10", nome: "Diehl Chocolate Fornéavel Avelã Bisnagas 10kg", unidade: "CX", pesoLiquido: 10, preco: 196.35 },
  { codigo: "DIEHL-FBR10", nome: "Diehl Chocolate Fornéavel Branco Bisnagas 10kg", unidade: "CX", pesoLiquido: 10, preco: 181.02 },
  { codigo: "DIEHL-GNMACX", nome: "Diehl Ganache Meio Amargo Balde 2,1kg Caixa (8 baldes)", unidade: "CX", pesoLiquido: 16.8, preco: 359.90 },
  { codigo: "DIEHL-GNMA4", nome: "Diehl Ganache Meio Amargo Balde 4kg", unidade: "BD", pesoLiquido: 4, preco: 83.66 },
  { codigo: "DIEHL-GNMA", nome: "Diehl Ganache Meio Amargo Bag 12,5kg", unidade: "BAG", pesoLiquido: 12.5, preco: 243.26 },
  { codigo: "DIEHL-GNALCX", nome: "Diehl Ganache Ao Leite Balde 2,1kg Caixa (8 baldes)", unidade: "CX", pesoLiquido: 16.8, preco: 342.59 },
  { codigo: "DIEHL-GNAL4", nome: "Diehl Ganache Ao Leite Balde 4kg", unidade: "BD", pesoLiquido: 4, preco: 79.54 },
  { codigo: "DIEHL-GNAL", nome: "Diehl Ganache Ao Leite Bag 12,5kg", unidade: "BAG", pesoLiquido: 12.5, preco: 225.29 },
  { codigo: "DIEHL-GNBRCX", nome: "Diehl Ganache Branco Balde 2,1kg Caixa (8 baldes)", unidade: "CX", pesoLiquido: 16.8, preco: 323.40 },
  { codigo: "DIEHL-GNBR4", nome: "Diehl Ganache Branco Balde 4kg", unidade: "BD", pesoLiquido: 4, preco: 74.97 },
  { codigo: "DIEHL-GNBR", nome: "Diehl Ganache Branco Bag 12,5kg", unidade: "BAG", pesoLiquido: 12.5, preco: 222.77 },
  { codigo: "DIEHL-GNAVCX", nome: "Diehl Ganache Avelã Balde 2,1kg Caixa (8 baldes)", unidade: "CX", pesoLiquido: 16.8, preco: 351.14 },
  { codigo: "DIEHL-GNAV4", nome: "Diehl Ganache Avelã Balde 4kg", unidade: "BD", pesoLiquido: 4, preco: 81.57 },
  { codigo: "DIEHL-GNAV", nome: "Diehl Ganache Avelã Bag 12,5kg", unidade: "BAG", pesoLiquido: 12.5, preco: 231.64 },
  { codigo: "DIEHL-CRAV1", nome: "Diehl Creme de Avelã Pote 1kg", unidade: "PT", pesoLiquido: 1, preco: 39.55 },
];

// ---------------------------------------------------------------------------
// Almeidapan — 104 produtos, preço fixo (sem faixa). Gerado a partir da
// planilha original (embalagem embutida no nome — ver regra no topo do arquivo).
// ---------------------------------------------------------------------------

const produtosAlmeidapan: ProdutoImport[] = [
  { codigo: "ALMEIDAPAN-001", nome: "Creme Confeiteiro Almeidapan 10x1kg", unidade: "CX", pesoLiquido: 10, preco: 92.0 },
  { codigo: "ALMEIDAPAN-002", nome: "Creme Confeiteiro a Frio Almeidapan 10x1kg", unidade: "CX", pesoLiquido: 10, preco: 129.9 },
  { codigo: "ALMEIDAPAN-003", nome: "Mistura Cake Abacaxi Almeidapan 5x2kg", unidade: "CX", pesoLiquido: 10, preco: 139.9 },
  { codigo: "ALMEIDAPAN-004", nome: "Mistura Cake Cuca Almeidapan 5x2kg", unidade: "CX", pesoLiquido: 10, preco: 139.9 },
  { codigo: "ALMEIDAPAN-005", nome: "Mistura Cake Caketone Almeidapan 5x2kg", unidade: "CX", pesoLiquido: 10, preco: 139.9 },
  { codigo: "ALMEIDAPAN-006", nome: "Mistura Cake Cenoura Almeidapan 5x2kg", unidade: "CX", pesoLiquido: 10, preco: 133.9 },
  { codigo: "ALMEIDAPAN-007", nome: "Mistura Cake Cenoura com Laranja 5x2kg", unidade: "CX", pesoLiquido: 10, preco: 133.9 },
  { codigo: "ALMEIDAPAN-008", nome: "Mistura Cake Capucino Almeidapan 5x2kg", unidade: "CX", pesoLiquido: 10, preco: 133.9 },
  { codigo: "ALMEIDAPAN-009", nome: "Mistura Cake Chocolate Almeidapan 5x2kg", unidade: "CX", pesoLiquido: 10, preco: 133.9 },
  { codigo: "ALMEIDAPAN-010", nome: "Mistura Cake Frutas Vermelhas 5x2kg", unidade: "CX", pesoLiquido: 10, preco: 139.9 },
  { codigo: "ALMEIDAPAN-011", nome: "Mistura Cake Fubá Almeidapan 5x2kg", unidade: "CX", pesoLiquido: 10, preco: 133.9 },
  { codigo: "ALMEIDAPAN-012", nome: "Mistura Cake Indiano Almeidapan 5x2kg", unidade: "CX", pesoLiquido: 10, preco: 133.9 },
  { codigo: "ALMEIDAPAN-013", nome: "Mistura Cake Laranja Almeidapan 5x2kg", unidade: "CX", pesoLiquido: 10, preco: 133.9 },
  { codigo: "ALMEIDAPAN-014", nome: "Mistura Cake Limão Almeidapan 5x2kg", unidade: "CX", pesoLiquido: 10, preco: 133.9 },
  // ALMEIDAPAN-015 (Mistura Cake Limão Siciliano) não importado — ver NAO_IMPORTADOS
  { codigo: "ALMEIDAPAN-016", nome: "Mistura Cake Milho Almeidapan 5x2kg", unidade: "CX", pesoLiquido: 10, preco: 133.9 },
  { codigo: "ALMEIDAPAN-017", nome: "Mistura Cake Multicereais Almeidapan 5x2kg", unidade: "CX", pesoLiquido: 10, preco: 149.9 },
  { codigo: "ALMEIDAPAN-018", nome: "Mistura Cake Pão de Mel Almeidapan 5x2kg", unidade: "CX", pesoLiquido: 10, preco: 133.9 },
  { codigo: "ALMEIDAPAN-019", nome: "Mistura Cake Red Velvet Almeidapan 5x2kg", unidade: "CX", pesoLiquido: 10, preco: 139.9 },
  { codigo: "ALMEIDAPAN-020", nome: "Mistura Cake Tapioca Almeidapan 5x2kg", unidade: "CX", pesoLiquido: 10, preco: 122.9 },
  { codigo: "ALMEIDAPAN-021", nome: "Mistura Cake Neutro Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 111.9 },
  { codigo: "ALMEIDAPAN-022", nome: "Mistura Cake Neutro Almeidapan 5x2kg", unidade: "CX", pesoLiquido: 10, preco: 109.9 },
  { codigo: "ALMEIDAPAN-023", nome: "Mistura Cake Leite Condensado 5x2kg", unidade: "CX", pesoLiquido: 10, preco: 133.9 },
  { codigo: "ALMEIDAPAN-024", nome: "Mistura Cake Paçoca 5x2kg", unidade: "CX", pesoLiquido: 10, preco: 139.9 },
  { codigo: "ALMEIDAPAN-025", nome: "Mistura Cake Queijo Cremoso Almeidapan 5x2kg", unidade: "CX", pesoLiquido: 10, preco: 139.9 },
  { codigo: "ALMEIDAPAN-026", nome: "Mistura Cake Salgado Almeidapan 5x2kg", unidade: "CX", pesoLiquido: 10, preco: 139.9 },
  { codigo: "ALMEIDAPAN-027", nome: "Mistura Cake Speciale Baunilha 5x2kg (sem glúten/lactose)", unidade: "CX", pesoLiquido: 10, preco: 159.0 },
  { codigo: "ALMEIDAPAN-028", nome: "Mistura Cake Speciale Laranja 5x2kg (sem glúten/lactose)", unidade: "CX", pesoLiquido: 10, preco: 159.0 },
  { codigo: "ALMEIDAPAN-029", nome: "Mistura Cake Speciale Cenoura 5x2kg (sem glúten/lactose)", unidade: "CX", pesoLiquido: 10, preco: 159.0 },
  { codigo: "ALMEIDAPAN-030", nome: "Mistura Cake Speciale Chocolate 5x2kg (sem glúten/lactose)", unidade: "CX", pesoLiquido: 10, preco: 169.0 },
  { codigo: "ALMEIDAPAN-031", nome: "Mistura Bolo Abacaxi Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 42.9 },
  { codigo: "ALMEIDAPAN-032", nome: "Mistura Bolo Aipim Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 42.9 },
  { codigo: "ALMEIDAPAN-033", nome: "Mistura Bolo Baunilha Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 42.9 },
  { codigo: "ALMEIDAPAN-034", nome: "Mistura Bolo Capuccino Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 44.9 },
  { codigo: "ALMEIDAPAN-035", nome: "Mistura Bolo Cenoura Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 42.9 },
  { codigo: "ALMEIDAPAN-036", nome: "Mistura Bolo Chocolate Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 44.9 },
  { codigo: "ALMEIDAPAN-037", nome: "Mistura Bolo Coco Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 42.9 },
  { codigo: "ALMEIDAPAN-038", nome: "Mistura Bolo Frutas Vermelhas Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 44.9 },
  { codigo: "ALMEIDAPAN-039", nome: "Mistura Bolo Fubá Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 42.9 },
  { codigo: "ALMEIDAPAN-040", nome: "Mistura Bolo Fubá com Erva Doce Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 44.9 },
  { codigo: "ALMEIDAPAN-041", nome: "Mistura Bolo Indiano Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 42.9 },
  { codigo: "ALMEIDAPAN-042", nome: "Mistura Bolo Laranja Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 42.9 },
  { codigo: "ALMEIDAPAN-043", nome: "Mistura Bolo Leite Condensado Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 42.9 },
  { codigo: "ALMEIDAPAN-044", nome: "Mistura Bolo Limão Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 42.9 },
  { codigo: "ALMEIDAPAN-045", nome: "Mistura Bolo Limão Siciliano Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 44.9 },
  { codigo: "ALMEIDAPAN-046", nome: "Mistura Bolo Mathia com Limão Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 44.9 },
  { codigo: "ALMEIDAPAN-047", nome: "Mistura Bolo Milho Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 42.9 },
  { codigo: "ALMEIDAPAN-048", nome: "Mistura Bolo Multicereal Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 49.9 },
  { codigo: "ALMEIDAPAN-049", nome: "Mistura Bolo Nega Maluca Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 49.9 },
  { codigo: "ALMEIDAPAN-050", nome: "Mistura Bolo Neutro Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 39.9 },
  { codigo: "ALMEIDAPAN-051", nome: "Mistura Bolo Paçoca Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 49.9 },
  { codigo: "ALMEIDAPAN-052", nome: "Mistura Bolo Red Velvet Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 44.9 },
  { codigo: "ALMEIDAPAN-053", nome: "Mistura Bolo Cremoso Aipim Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 66.9 },
  { codigo: "ALMEIDAPAN-054", nome: "Mistura Bolo Cremoso Chocolate Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 69.9 },
  { codigo: "ALMEIDAPAN-055", nome: "Mistura Bolo Cremoso Cenoura Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 66.9 },
  { codigo: "ALMEIDAPAN-056", nome: "Mistura Bolo Pamonha Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 66.9 },
  { codigo: "ALMEIDAPAN-057", nome: "Mistura Bolo Cremoso Milho Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 66.9 },
  { codigo: "ALMEIDAPAN-058", nome: "Mistura Brownie Almeidapan 5x2kg", unidade: "CX", pesoLiquido: 10, preco: 169.0 },
  { codigo: "ALMEIDAPAN-059", nome: "Mistura Pão de Ló Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 49.9 },
  { codigo: "ALMEIDAPAN-060", nome: "Mistura Pão de Ló Chocolate Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 59.9 },
  { codigo: "ALMEIDAPAN-061", nome: "Mistura Pão Australiano Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 59.9 },
  { codigo: "ALMEIDAPAN-062", nome: "Mistura Sonho Almeidapan 5x2kg", unidade: "CX", pesoLiquido: 10, preco: 79.9 },
  { codigo: "ALMEIDAPAN-063", nome: "Mistura Pão Brioche Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 52.9 },
  { codigo: "ALMEIDAPAN-064", nome: "Mistura Pão de Batata Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 54.9 },
  { codigo: "ALMEIDAPAN-065", nome: "Mistura Pão Alho Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 49.9 },
  { codigo: "ALMEIDAPAN-066", nome: "Mistura Pão Cebola Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 49.9 },
  { codigo: "ALMEIDAPAN-067", nome: "Mistura Pão Integral Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 49.9 },
  { codigo: "ALMEIDAPAN-068", nome: "Mistura Pão Preto Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 49.9 },
  { codigo: "ALMEIDAPAN-069", nome: "Mistura Pão de Aveia Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 49.9 },
  { codigo: "ALMEIDAPAN-070", nome: "Mistura Pão de Centeio Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 49.9 },
  { codigo: "ALMEIDAPAN-071", nome: "Mistura Pão de Milho Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 49.9 },
  { codigo: "ALMEIDAPAN-072", nome: "Mistura Pão de Fibras Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 49.9 },
  { codigo: "ALMEIDAPAN-073", nome: "Mistura Pão de Forma Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 49.9 },
  { codigo: "ALMEIDAPAN-074", nome: "Mistura Pão de Linho Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 79.9 },
  { codigo: "ALMEIDAPAN-075", nome: "Mistura Pão de Minuto Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 54.9 },
  { codigo: "ALMEIDAPAN-076", nome: "Mistura Pão da Vovó Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 59.9 },
  { codigo: "ALMEIDAPAN-077", nome: "Mistura Pão Italiano Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 59.9 },
  { codigo: "ALMEIDAPAN-078", nome: "Mistura Pão de Soja Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 59.9 },
  { codigo: "ALMEIDAPAN-079", nome: "Mistura Pão Macio Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 54.9 },
  { codigo: "ALMEIDAPAN-080", nome: "Mistura Pão Ciabatta Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 49.9 },
  { codigo: "ALMEIDAPAN-081", nome: "Mistura Pão 8 Grãos Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 49.9 },
  { codigo: "ALMEIDAPAN-082", nome: "Mistura Pão Aipim Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 59.9 },
  { codigo: "ALMEIDAPAN-083", nome: "Mistura Pão e Quinoa Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 59.9 },
  { codigo: "ALMEIDAPAN-084", nome: "Mistura Pão Semi Italiano Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 49.9 },
  { codigo: "ALMEIDAPAN-085", nome: "Mistura Grostoli Doce Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 49.9 },
  { codigo: "ALMEIDAPAN-086", nome: "Mistura Grostoli Salgado Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 49.9 },
  { codigo: "ALMEIDAPAN-087", nome: "Mistura Pão 8 Grãos Almeidapan 5kg (2)", unidade: "UN", pesoLiquido: 5, preco: 49.9 },
  { codigo: "ALMEIDAPAN-088", nome: "Mistura Pão Escaldado de Milho Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 89.9 },
  { codigo: "ALMEIDAPAN-089", nome: "Mistura Pão Escaldado Aipim Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 89.9 },
  { codigo: "ALMEIDAPAN-090", nome: "Mistura Pão Escaldado Abóbora Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 89.9 },
  { codigo: "ALMEIDAPAN-091", nome: "Multimix Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 49.0 },
  { codigo: "ALMEIDAPAN-092", nome: "Mistura Cuca Alemã Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 49.9 },
  { codigo: "ALMEIDAPAN-093", nome: "Mistura Bombas e Carolinas Almeidapan 5x2kg", unidade: "CX", pesoLiquido: 10, preco: 199.9 },
  { codigo: "ALMEIDAPAN-094", nome: "Mistura Panetone em Pó Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 99.9 },
  { codigo: "ALMEIDAPAN-095", nome: "Mistura Panetone em Pasta Almeidapan 10kg", unidade: "UN", pesoLiquido: 10, preco: 219.9 },
  { codigo: "ALMEIDAPAN-096", nome: "Mistura Chipa Almeidapan Premium 5kg", unidade: "UN", pesoLiquido: 5, preco: 59.9 },
  { codigo: "ALMEIDAPAN-097", nome: "Mistura Chipa com Fubá Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 79.9 },
  { codigo: "ALMEIDAPAN-098", nome: "Mistura Pão de Queijo Almeidapan Premium 5kg", unidade: "UN", pesoLiquido: 5, preco: 50.9 },
  { codigo: "ALMEIDAPAN-099", nome: "Mistura Pão de Queijo Almeidapan Premium 10x1kg", unidade: "CX", pesoLiquido: 10, preco: 100.9 },
  { codigo: "ALMEIDAPAN-100", nome: "Antimofo Pó Almeidapan 10x1kg", unidade: "CX", pesoLiquido: 10, preco: 200.0 },
  { codigo: "ALMEIDAPAN-101", nome: "Fermento Químico Almeidapan 10x1kg", unidade: "CX", pesoLiquido: 10, preco: 189.9 },
  { codigo: "ALMEIDAPAN-102", nome: "Fermento Químico Almeidapan 5x2kg", unidade: "CX", pesoLiquido: 10, preco: 179.9 },
  { codigo: "ALMEIDAPAN-103", nome: "Farofa Doce p/ Cuca Alemã Almeidapan 5x2kg", unidade: "CX", pesoLiquido: 10, preco: 24.9 },
  { codigo: "ALMEIDAPAN-104", nome: "Melhorador de Farinha Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 109.9 },
  { codigo: "ALMEIDAPAN-105", nome: "Biscoito de Polvilho Almeidapan 5kg", unidade: "UN", pesoLiquido: 5, preco: 69.9 },
];

// ---------------------------------------------------------------------------
// Itens que NÃO foram importados por falta de dado essencial na tabela
// original (preço ou tamanho de embalagem) — nunca inventamos esses valores.
// Cadastre manualmente em Produtos assim que tiver a informação.
// ---------------------------------------------------------------------------
const NAO_IMPORTADOS = [
  { fornecedor: "Diehl Chocolate", item: "BLEND Barra 5kg (Raspar e Cobrir)", motivo: "preço marcado como 'IND.' (sob consulta) na tabela" },
  { fornecedor: "Diehl Chocolate", item: "BRANCO Barra 5kg (Raspar e Cobrir)", motivo: "preço marcado como 'IND.' (sob consulta) na tabela" },
  { fornecedor: "Diehl Chocolate", item: "CRAV4 — Creme de Avelã Balde 4kg", motivo: "preço marcado como '-' (sob consulta) na tabela" },
  { fornecedor: "Almeidapan", item: "MISTURA CAKE LIMAO SICILIANO ALMEIDAPAN (código reservado ALMEIDAPAN-015)", motivo: "nome não traz o tamanho da embalagem (diferente de todos os outros itens da categoria Cakes)" },
];

// Chamado pelo seed.ts (roda em todo `prisma db seed`, inclusive no
// vercel-build) e também pode ser executado direto — ver runStandalone().
export async function importarFornecedores(prisma: PrismaClient) {
  const cocosul = await upsertFornecedor(prisma, "Cocosul", "ind-cocosul", "#16A34A");
  await upsertProdutos(prisma, cocosul.marcaId, cocosul.industriaId, produtosCocosul);

  const diehl = await upsertFornecedor(prisma, "Diehl Chocolate", "ind-diehl-chocolate", "#7C3A21");
  await upsertProdutos(prisma, diehl.marcaId, diehl.industriaId, produtosDiehl);

  const almeidapan = await upsertFornecedor(prisma, "Almeidapan", "ind-almeidapan", "#D97706");
  await upsertProdutos(prisma, almeidapan.marcaId, almeidapan.industriaId, produtosAlmeidapan);

  console.log(`Cocosul: ${produtosCocosul.length} produtos (com faixa de preço)`);
  console.log(`Diehl Chocolate: ${produtosDiehl.length} produtos`);
  console.log(`Almeidapan: ${produtosAlmeidapan.length} produtos`);
  console.log(`${NAO_IMPORTADOS.length} itens NÃO importados (faltou preço ou embalagem na tabela original):`);
  for (const item of NAO_IMPORTADOS) {
    console.log(` - [${item.fornecedor}] ${item.item} — ${item.motivo}`);
  }
  console.log(
    "ATENÇÃO: o WhatsApp das 3 indústrias foi criado com um número placeholder " +
      `(${WHATSAPP_PLACEHOLDER}) — corrija em Cadastros > Indústrias antes de enviar pedidos.`,
  );
}

async function runStandalone() {
  const { PrismaClient: Client } = await import("../../src/generated/prisma/client");
  const { PrismaPg } = await import("@prisma/adapter-pg");
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new Client({ adapter });
  try {
    await importarFornecedores(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  runStandalone().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
