// Único arquivo do projeto que fala com a API do Gemini. Nenhum outro lugar
// deve importar "@google/genai" diretamente — sempre passe por lerImagem().
//
// Este serviço é intencionalmente genérico: não conhece "pedido", "cliente"
// nem nenhuma regra de negócio. Recebe uma imagem, devolve uma leitura
// estruturada do que existe nela. Qualquer mapeamento pra entidades do
// sistema acontece em outra camada (ex: src/lib/pedido-importacao.ts).

import { GoogleGenAI, createPartFromBase64, createUserContent } from "@google/genai";
import { leituraImagemJsonSchema, leituraImagemSchema, type LeituraImagem } from "./gemini-image-schema";

const TIMEOUT_MS = 30_000;
const MAX_TENTATIVAS = 3; // 1 tentativa original + 2 retries em caso de sobrecarga temporária
const ESPERA_BASE_MS = 1_500;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function statusHttp(error: unknown): number | undefined {
  return typeof error === "object" && error !== null && "status" in error
    ? (error as { status?: number }).status
    : undefined;
}

const PROMPT = `Você é um leitor universal de imagens/documentos. Vai receber UMA imagem que pode ser
praticamente qualquer coisa contendo informação: foto de documento, documento digitalizado, ficha
preenchida à mão, texto manuscrito, print de planilha, foto de planilha, tabela, nota fiscal,
recibo, comprovante, formulário, print de sistema, texto digitado, ou qualquer outra imagem com
números, valores, datas ou texto relevante.

Primeiro entenda o contexto e a estrutura visual da imagem (é uma tabela? um formulário? texto
corrido? uma mistura?) antes de extrair os dados.

Regras obrigatórias:
- A extração NUNCA depende de conseguir classificar o tipo do documento. Se você não tiver certeza
  do tipo, use "outro" ou "indefinido" em tipo_documento, mas continue extraindo normalmente TODOS
  os campos, tabelas, textos, valores e datas que conseguir identificar.
- Não invente informação. Não preencha campos que não aparecem na imagem.
- Preserve os valores originais como estão escritos (não converta formatos, não normalize).
- Diferencie texto de número. Identifique moeda quando houver.
- Tente interpretar escrita à mão. Quando não conseguir ler com segurança, use valor null e
  atribua confiança baixa a esse campo — nunca "chute" um valor.
- Tabelas (inclusive fotografadas, tortas, manuscritas ou parcialmente preenchidas): identifique
  colunas e linhas mesmo sem estrutura HTML/Excel real. Preserve células vazias como string vazia.
- Cada campo extraído (em "campos", "valores" e "datas") deve ter uma nota de confiança de 0 a 1,
  refletindo sua certeza real sobre aquele valor específico.
- confianca_geral (0 a 1) reflete sua confiança na leitura da imagem como um todo.
- Responda SOMENTE com o JSON no formato solicitado, sem texto adicional.`;

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY não configurada");
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return client;
}

export class LeituraImagemError extends Error {
  constructor(
    message: string,
    public readonly causa: "timeout" | "resposta_invalida" | "api" | "configuracao",
  ) {
    super(message);
    this.name = "LeituraImagemError";
  }
}

export async function lerImagem(input: { base64: string; mimeType: string }): Promise<LeituraImagem> {
  const modelo = process.env.GEMINI_MODEL || "gemini-flash-latest";

  let ai: GoogleGenAI;
  try {
    ai = getClient();
  } catch {
    throw new LeituraImagemError("Leitor de imagens não configurado no servidor.", "configuracao");
  }

  let response: Awaited<ReturnType<typeof ai.models.generateContent>> | undefined;
  let ultimoErro: unknown;

  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
    try {
      response = await ai.models.generateContent({
        model: modelo,
        contents: createUserContent([
          PROMPT,
          createPartFromBase64(input.base64, input.mimeType),
        ]),
        config: {
          responseMimeType: "application/json",
          responseJsonSchema: leituraImagemJsonSchema,
          httpOptions: { timeout: TIMEOUT_MS },
        },
      });
      break;
    } catch (error) {
      ultimoErro = error;
      const status = statusHttp(error);
      // 503/429: sobrecarga temporária do Gemini — vale a pena tentar de novo.
      const transitorio = status === 503 || status === 429;
      if (transitorio && tentativa < MAX_TENTATIVAS) {
        await sleep(ESPERA_BASE_MS * tentativa);
        continue;
      }
      break;
    }
  }

  if (!response) {
    const isTimeout =
      ultimoErro instanceof Error && /timeout|timed out|deadline/i.test(ultimoErro.message);
    const status = statusHttp(ultimoErro);
    // Nunca repassar o corpo bruto do erro do SDK adiante: pode conter cabeçalhos
    // da requisição. Logamos só status/causa no servidor.
    console.error("[gemini-image-reader] falha na chamada ao Gemini:", isTimeout ? "timeout" : `status ${status}`);
    throw new LeituraImagemError(
      isTimeout
        ? "A leitura da imagem demorou demais e foi cancelada."
        : status === 503 || status === 429
          ? "O leitor de imagens está sobrecarregado no momento. Tente novamente em instantes."
          : "Falha ao consultar o leitor de imagens.",
      isTimeout ? "timeout" : "api",
    );
  }

  const texto = response.text;
  if (!texto) {
    throw new LeituraImagemError("O leitor de imagens não retornou conteúdo.", "resposta_invalida");
  }

  let json: unknown;
  try {
    json = JSON.parse(texto);
  } catch {
    throw new LeituraImagemError("O leitor de imagens retornou um formato inesperado.", "resposta_invalida");
  }

  const parsed = leituraImagemSchema.safeParse(json);
  if (!parsed.success) {
    console.error("[gemini-image-reader] resposta fora do schema esperado:", parsed.error.flatten());
    throw new LeituraImagemError("O leitor de imagens retornou dados em formato inesperado.", "resposta_invalida");
  }

  return parsed.data;
}
