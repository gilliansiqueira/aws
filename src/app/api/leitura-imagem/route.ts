import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-utils";
import { lerImagem, LeituraImagemError } from "@/lib/gemini-image-reader";

// Dá folga pra chamada ao Gemini (o timeout interno do serviço é 30s).
export const maxDuration = 45;

const TAMANHO_MAXIMO_BYTES = 15 * 1024 * 1024; // 15MB — o cliente já redimensiona antes de enviar

export async function POST(req: NextRequest) {
  const { response } = await requireSession();
  if (response) return response;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const arquivo = formData.get("imagem");
  if (!(arquivo instanceof File)) {
    return NextResponse.json({ error: "Nenhuma imagem enviada." }, { status: 400 });
  }

  if (!arquivo.type.startsWith("image/")) {
    return NextResponse.json({ error: "O arquivo enviado não é uma imagem." }, { status: 400 });
  }

  if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
    return NextResponse.json(
      { error: "Imagem muito grande (máximo 15MB)." },
      { status: 413 },
    );
  }

  try {
    const buffer = Buffer.from(await arquivo.arrayBuffer());
    const leitura = await lerImagem({
      base64: buffer.toString("base64"),
      mimeType: arquivo.type,
    });
    return NextResponse.json(leitura);
  } catch (error) {
    if (error instanceof LeituraImagemError) {
      const status = error.causa === "timeout" ? 504 : error.causa === "configuracao" ? 503 : 422;
      return NextResponse.json({ error: error.message }, { status });
    }
    console.error("[api/leitura-imagem] erro inesperado:", error);
    return NextResponse.json({ error: "Erro interno ao processar a imagem." }, { status: 500 });
  }
}
