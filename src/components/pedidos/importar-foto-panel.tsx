"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { ImageDropzone } from "@/components/ui/image-dropzone";
import { Card } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import type { LeituraImagem } from "@/lib/gemini-image-schema";

function corConfianca(confianca: number) {
  if (confianca >= 0.75) return "text-success";
  if (confianca >= 0.4) return "text-warning";
  return "text-danger";
}

export function ImportarFotoPanel() {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<LeituraImagem | null>(null);

  async function handleLer() {
    if (!arquivo) return;
    setEnviando(true);
    setErro(null);
    setResultado(null);

    const formData = new FormData();
    formData.append("imagem", arquivo);

    const res = await fetch("/api/leitura-imagem", { method: "POST", body: formData });
    setEnviando(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErro(data.error ?? "Não foi possível ler a imagem.");
      return;
    }

    setResultado(await res.json());
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <ImageDropzone onImageReady={setArquivo} disabled={enviando} />
        {arquivo && (
          <div className="mt-4 flex justify-end">
            <Button type="button" onClick={handleLer} disabled={enviando}>
              {enviando ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Lendo imagem...
                </>
              ) : (
                "Ler imagem"
              )}
            </Button>
          </div>
        )}
        {erro && (
          <p className="mt-3 flex items-center gap-1 text-sm text-danger">
            <AlertTriangle size={14} /> {erro}
          </p>
        )}
      </Card>

      {resultado && (
        <div className="flex flex-col gap-4">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs uppercase text-muted">Tipo de documento identificado</p>
                <p className="font-medium">{resultado.tipo_documento}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase text-muted">Confiança geral</p>
                <p className={`font-semibold ${corConfianca(resultado.confianca_geral)}`}>
                  {Math.round(resultado.confianca_geral * 100)}%
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted">{resultado.resumo}</p>
          </Card>

          {resultado.campos.length > 0 && (
            <Card>
              <h3 className="mb-3 text-sm font-semibold">Campos identificados</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {resultado.campos.map((campo, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                    <span className="text-muted">{campo.nome}</span>
                    <span className={`font-medium ${corConfianca(campo.confianca)}`}>
                      {campo.valor ?? "—"}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {resultado.tabelas.map((tabela, i) => (
            <Card key={i} className="p-0">
              {tabela.titulo && (
                <p className="border-b border-border px-4 py-3 text-sm font-semibold">{tabela.titulo}</p>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border text-xs uppercase text-muted">
                    <tr>
                      {tabela.colunas.map((col, c) => (
                        <th key={c} className="px-4 py-2 font-medium">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tabela.linhas.map((linha, l) => (
                      <tr key={l} className="border-b border-border last:border-0">
                        {linha.map((cel, c) => (
                          <td key={c} className="px-4 py-2">{cel || "—"}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}

          {(resultado.valores.length > 0 || resultado.datas.length > 0) && (
            <Card>
              <h3 className="mb-3 text-sm font-semibold">Valores e datas</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {[...resultado.valores, ...resultado.datas].map((item, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                    <span className="text-muted">{item.nome}</span>
                    <span className={`font-medium ${corConfianca(item.confianca)}`}>
                      {item.valor ?? "—"}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {resultado.textos.length > 0 && (
            <Card>
              <h3 className="mb-2 text-sm font-semibold">Outros textos identificados</h3>
              <ul className="list-inside list-disc text-sm text-muted">
                {resultado.textos.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </Card>
          )}

          {resultado.observacoes.length > 0 && (
            <Card>
              <h3 className="mb-2 flex items-center gap-1 text-sm font-semibold text-warning">
                <AlertTriangle size={14} /> Observações do leitor
              </h3>
              <ul className="list-inside list-disc text-sm text-muted">
                {resultado.observacoes.map((o, i) => (
                  <li key={i}>{o}</li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
