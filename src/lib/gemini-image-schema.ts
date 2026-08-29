// Estrutura genérica de resposta do leitor universal de imagens (Gemini).
// Não é específica de nenhum tipo de documento — pedido, nota fiscal, ficha
// manuscrita, planilha etc. todos usam a mesma forma. A extração NÃO depende
// de identificar corretamente o tipo do documento: mesmo que "tipo_documento"
// fique incerto, campos/tabelas/textos devem vir preenchidos com tudo que foi
// possível ler.

import { z } from "zod";

const campoExtraidoSchema = z.object({
  nome: z.string(),
  valor: z.string().nullable(),
  confianca: z.number().min(0).max(1),
});

const tabelaExtraidaSchema = z.object({
  titulo: z.string().nullable(),
  colunas: z.array(z.string()),
  linhas: z.array(z.array(z.string())),
});

export const leituraImagemSchema = z.object({
  tipo_documento: z.string(),
  resumo: z.string(),
  campos: z.array(campoExtraidoSchema),
  tabelas: z.array(tabelaExtraidaSchema),
  textos: z.array(z.string()),
  valores: z.array(campoExtraidoSchema),
  datas: z.array(campoExtraidoSchema),
  confianca_geral: z.number().min(0).max(1),
  observacoes: z.array(z.string()),
});

export type CampoExtraido = z.infer<typeof campoExtraidoSchema>;
export type TabelaExtraida = z.infer<typeof tabelaExtraidaSchema>;
export type LeituraImagem = z.infer<typeof leituraImagemSchema>;

// JSON Schema equivalente, usado para pedir saída estruturada ao Gemini
// (responseJsonSchema). Mantido em sincronia manualmente com o Zod acima —
// são poucos campos e ambos vivem neste mesmo arquivo.
const campoExtraidoJsonSchema = {
  type: "object",
  properties: {
    nome: { type: "string" },
    valor: { type: ["string", "null"] },
    confianca: { type: "number", minimum: 0, maximum: 1 },
  },
  required: ["nome", "valor", "confianca"],
};

export const leituraImagemJsonSchema = {
  type: "object",
  properties: {
    tipo_documento: {
      type: "string",
      description:
        "Classificação livre do tipo de documento (ex: nota_fiscal, planilha, formulario, ficha_manuscrita, recibo, outro). Use 'outro' ou 'indefinido' se não conseguir classificar — isso NUNCA deve impedir a extração dos demais campos.",
    },
    resumo: { type: "string", description: "Descrição breve do que foi identificado na imagem." },
    campos: { type: "array", items: campoExtraidoJsonSchema },
    tabelas: {
      type: "array",
      items: {
        type: "object",
        properties: {
          titulo: { type: ["string", "null"] },
          colunas: { type: "array", items: { type: "string" } },
          linhas: { type: "array", items: { type: "array", items: { type: "string" } } },
        },
        required: ["titulo", "colunas", "linhas"],
      },
    },
    textos: { type: "array", items: { type: "string" } },
    valores: { type: "array", items: campoExtraidoJsonSchema },
    datas: { type: "array", items: campoExtraidoJsonSchema },
    confianca_geral: { type: "number", minimum: 0, maximum: 1 },
    observacoes: { type: "array", items: { type: "string" } },
  },
  required: [
    "tipo_documento",
    "resumo",
    "campos",
    "tabelas",
    "textos",
    "valores",
    "datas",
    "confianca_geral",
    "observacoes",
  ],
};
