// Mapeia a leitura genérica do Gemini (LeituraImagem) pra itens candidatos
// de um pedido. Fica separado de gemini-image-reader.ts de propósito: o
// leitor não sabe o que é "pedido"/"produto"/"cliente", só essa camada.
//
// Regras acordadas com o usuário:
// - Uma foto cobre uma única indústria — o match de produto só considera o
//   catálogo da indústria escolhida.
// - Os códigos que aparecem no documento (ex: "1484") são do sistema antigo
//   do cliente, não batem com o Produto.codigo do nosso cadastro (que usa
//   código de barras ou código gerado) — o match é sempre por nome/descrição
//   aproximado, nunca por código.
// - O valor da foto sempre prevalece (nunca recalculado pela faixa de
//   preço) — só é sinalizado quando diverge do cadastro, como aviso.
// - Item sem match de produto fica sinalizado pra escolha manual — nunca
//   inventamos qual produto é.

import type { LeituraImagem, TabelaExtraida } from "./gemini-image-schema";
import type { ProdutoOption } from "@/components/pedidos/types";

type ColunaTipo = "descricao" | "quantidade" | "unidade" | "valorUnitario" | "valorTotal" | "codigo";

export type ItemCandidato = {
  descricaoRaw: string;
  codigoRaw: string | null;
  quantidade: number | null;
  valorUnitario: number | null;
};

export function normalizarTexto(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Converte número no formato BR ("1.234,56" ou "2,000") pra number.
// Retorna null quando não dá pra interpretar (nunca inventa um valor).
export function parseNumeroBR(valor: string | null | undefined): number | null {
  if (!valor) return null;
  const limpo = valor.trim().replace(/[^\d.,-]/g, "");
  if (!limpo) return null;
  const normalizado = limpo.includes(",") ? limpo.replace(/\./g, "").replace(",", ".") : limpo;
  const n = Number(normalizado);
  return Number.isFinite(n) ? n : null;
}

function detectarColuna(header: string): ColunaTipo | null {
  const h = normalizarTexto(header);
  const has = (s: string) => h.includes(s);
  if (has("total")) return "valorTotal";
  if (has("vr") || has("valor") || has("preco")) return "valorUnitario";
  if (has("qtd") || has("quant")) return "quantidade";
  if (has("cod")) return "codigo";
  if (has("unid")) return "unidade";
  if (has("descri") || has("produto") || has("item") || has("mercadoria")) return "descricao";
  return null;
}

function separarCodigoDescricao(
  descricaoCelula: string,
  codigoColuna: string | null,
): { codigo: string | null; descricao: string } {
  const texto = descricaoCelula.trim();
  if (codigoColuna && codigoColuna.trim()) {
    return { codigo: codigoColuna.trim(), descricao: texto };
  }
  const m = texto.match(/^(\d{2,8})\s+(.+)$/);
  if (m) return { codigo: m[1], descricao: m[2] };
  return { codigo: null, descricao: texto };
}

// Escolhe, entre as tabelas extraídas, a que mais parece uma lista de
// produtos de pedido (precisa ter pelo menos descrição e quantidade
// reconhecidas) e converte as linhas em itens candidatos.
export function extrairItensCandidatos(leitura: LeituraImagem): ItemCandidato[] {
  let melhorTabela: TabelaExtraida | null = null;
  let melhorMapa: Partial<Record<ColunaTipo, number>> = {};
  let melhorScore = 0;

  for (const tabela of leitura.tabelas) {
    const mapa: Partial<Record<ColunaTipo, number>> = {};
    tabela.colunas.forEach((col, idx) => {
      const tipo = detectarColuna(col);
      if (tipo && mapa[tipo] === undefined) mapa[tipo] = idx;
    });
    const score = Object.keys(mapa).length;
    if (mapa.descricao !== undefined && mapa.quantidade !== undefined && score > melhorScore) {
      melhorScore = score;
      melhorTabela = tabela;
      melhorMapa = mapa;
    }
  }

  if (!melhorTabela) return [];
  const mapa = melhorMapa;
  const idxDescricao = mapa.descricao!;
  const idxQuantidade = mapa.quantidade!;

  return melhorTabela.linhas
    .map((linha): ItemCandidato => {
      const descricaoCelula = linha[idxDescricao] ?? "";
      const codigoColuna = mapa.codigo !== undefined ? (linha[mapa.codigo] ?? null) : null;
      const { codigo, descricao } = separarCodigoDescricao(descricaoCelula, codigoColuna);
      return {
        descricaoRaw: descricao,
        codigoRaw: codigo,
        quantidade: parseNumeroBR(linha[idxQuantidade]),
        valorUnitario: mapa.valorUnitario !== undefined ? parseNumeroBR(linha[mapa.valorUnitario]) : null,
      };
    })
    .filter((item) => item.descricaoRaw.length > 0);
}

// Tenta achar, no nome do fornecedor extraído (resumo/tipo/textos), uma
// indústria já cadastrada — só serve de sugestão, o usuário sempre confirma.
export function sugerirIndustria(
  leitura: LeituraImagem,
  industrias: { id: string; nome: string }[],
): string | null {
  const textoCompleto = normalizarTexto(
    [leitura.tipo_documento, leitura.resumo, ...leitura.textos].join(" "),
  );
  const encontradas = industrias.filter((i) => textoCompleto.includes(normalizarTexto(i.nome)));
  return encontradas.length === 1 ? encontradas[0].id : null;
}

export type MatchProduto = { produto: ProdutoOption; score: number } | null;

// Match por sobreposição de tokens do nome — nunca por código (os códigos
// do documento do cliente não correspondem ao nosso cadastro).
export function encontrarMelhorProduto(descricaoRaw: string, produtos: ProdutoOption[]): MatchProduto {
  const queryTokens = [...new Set(normalizarTexto(descricaoRaw).split(" ").filter((t) => t.length > 1))];
  if (queryTokens.length === 0 || produtos.length === 0) return null;

  let melhor: MatchProduto = null;
  for (const produto of produtos) {
    const alvo = normalizarTexto(produto.nome);
    const alvoTokens = new Set(alvo.split(" ").filter((t) => t.length > 1));
    let comuns = 0;
    for (const t of queryTokens) {
      if (alvoTokens.has(t) || alvo.includes(t)) comuns++;
    }
    const score = comuns / queryTokens.length;
    if (!melhor || score > melhor.score) melhor = { produto, score };
  }
  return melhor && melhor.score >= 0.4 ? melhor : null;
}
