"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

const DIMENSAO_MAXIMA = 2000; // px no maior lado — mantém texto legível, reduz payload
const QUALIDADE_JPEG = 0.85;

async function redimensionarImagem(arquivo: File): Promise<File> {
  const bitmap = await createImageBitmap(arquivo);
  const escala = Math.min(1, DIMENSAO_MAXIMA / Math.max(bitmap.width, bitmap.height));

  // Imagem já pequena: não precisa reprocessar.
  if (escala === 1 && arquivo.size < 1.5 * 1024 * 1024) {
    return arquivo;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  const ctx = canvas.getContext("2d");
  if (!ctx) return arquivo;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", QUALIDADE_JPEG),
  );
  if (!blob) return arquivo;

  return new File([blob], arquivo.name.replace(/\.[^.]+$/, "") + ".jpg", {
    type: "image/jpeg",
  });
}

export function ImageDropzone({
  onImageReady,
  disabled,
}: {
  onImageReady: (file: File) => void;
  disabled?: boolean;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [arrastandoSobre, setArrastandoSobre] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processarArquivo = useCallback(
    async (arquivo: File | undefined | null) => {
      if (!arquivo) return;
      if (!arquivo.type.startsWith("image/")) {
        setErro("Selecione um arquivo de imagem.");
        return;
      }

      setErro(null);
      setProcessando(true);
      try {
        const otimizada = await redimensionarImagem(arquivo);
        setPreview(URL.createObjectURL(otimizada));
        onImageReady(otimizada);
      } catch {
        setErro("Não foi possível processar essa imagem.");
      } finally {
        setProcessando(false);
      }
    },
    [onImageReady],
  );

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      if (disabled) return;
      const item = Array.from(e.clipboardData?.items ?? []).find((i) => i.type.startsWith("image/"));
      const arquivo = item?.getAsFile();
      if (arquivo) processarArquivo(arquivo);
    }
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [processarArquivo, disabled]);

  function limpar() {
    setPreview(null);
    setErro(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setArrastandoSobre(true);
        }}
        onDragLeave={() => setArrastandoSobre(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastandoSobre(false);
          if (!disabled) processarArquivo(e.dataTransfer.files[0]);
        }}
        className={`flex min-h-48 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition ${
          arrastandoSobre ? "border-brand bg-brand/5" : "border-border"
        } ${disabled ? "cursor-not-allowed opacity-60" : "hover:border-brand/50"}`}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Pré-visualização" className="max-h-64 rounded-lg object-contain" />
        ) : (
          <>
            <ImagePlus size={28} className="text-muted" />
            <p className="text-sm font-medium">Clique, arraste uma imagem ou cole com Ctrl+V</p>
            <p className="text-xs text-muted">JPG, PNG ou WEBP</p>
          </>
        )}
        {processando && <p className="text-xs text-muted">Processando imagem...</p>}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => processarArquivo(e.target.files?.[0])}
      />

      {erro && <p className="mt-2 text-sm text-danger">{erro}</p>}

      {preview && !processando && (
        <button
          type="button"
          onClick={limpar}
          className="mt-2 inline-flex items-center gap-1 text-xs text-muted hover:text-danger"
        >
          <X size={12} /> Remover imagem
        </button>
      )}
    </div>
  );
}
