"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, Loader2, ArrowRight } from "lucide-react";
import { ImageDropzone } from "@/components/ui/image-dropzone";
import { Card } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Select, Input, Label } from "@/components/ui/field";
import { formatCNPJ, formatCurrencyBRL } from "@/lib/format";
import { encontrarFaixaPreco } from "@/lib/pedido-calc";
import {
  extrairItensCandidatos,
  encontrarMelhorProduto,
  sugerirIndustria,
  type ItemCandidato,
} from "@/lib/pedido-importacao";
import type { LeituraImagem } from "@/lib/gemini-image-schema";
import type { ClienteOption, IndustriaOption, ProdutoOption, WizardInitialData } from "./types";

function corConfianca(confianca: number) {
  if (confianca >= 0.75) return "text-success";
  if (confianca >= 0.4) return "text-warning";
  return "text-danger";
}

type ItemResolvido = {
  descricaoRaw: string;
  quantidade: number;
  valorUnitario: number;
  produtoId: string;
  matchScore: number | null;
};

const SESSION_KEY = "pedido_import_foto";

export function ImportarFotoPanel({
  clientes,
  industrias,
  produtos,
}: {
  clientes: ClienteOption[];
  industrias: IndustriaOption[];
  produtos: ProdutoOption[];
}) {
  const router = useRouter();
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<LeituraImagem | null>(null);
  const [candidatos, setCandidatos] = useState<ItemCandidato[]>([]);

  const [industriaId, setIndustriaId] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [itens, setItens] = useState<ItemResolvido[]>([]);
  // Identifica a última combinação (indústria + leitura) já processada, pra
  // recalcular o match de produto durante o render quando ela mudar — sem
  // useEffect, seguindo o padrão recomendado pra estado derivado de props.
  const [chaveProcessada, setChaveProcessada] = useState("");

  const produtosDaIndustria = produtos.filter((p) => p.industriaId === industriaId);
  const chaveAtual = `${industriaId}::${candidatos.map((c) => c.descricaoRaw).join("|")}`;

  if (chaveAtual !== chaveProcessada) {
    setChaveProcessada(chaveAtual);
    if (!industriaId || candidatos.length === 0) {
      setItens([]);
    } else {
      // Um produto só pode ser usado numa linha — se duas descrições da
      // foto "empatarem" no mesmo produto do cadastro, só a primeira fica
      // com o match automático; a outra cai pra escolha manual (nunca
      // duplica o mesmo produto sozinho).
      const jaUsados = new Set<string>();
      setItens(
        candidatos.map((c) => {
          const match = encontrarMelhorProduto(c.descricaoRaw, produtosDaIndustria);
          const produtoId = match && !jaUsados.has(match.produto.id) ? match.produto.id : "";
          if (produtoId) jaUsados.add(produtoId);
          return {
            descricaoRaw: c.descricaoRaw,
            quantidade: c.quantidade ?? 1,
            valorUnitario: c.valorUnitario ?? (produtoId ? (match!.produto.preco) : 0),
            produtoId,
            matchScore: produtoId ? match!.score : null,
          };
        }),
      );
    }
  }

  async function handleLer() {
    if (!arquivo) return;
    setEnviando(true);
    setErro(null);
    setResultado(null);
    setCandidatos([]);
    setItens([]);

    const formData = new FormData();
    formData.append("imagem", arquivo);

    const res = await fetch("/api/leitura-imagem", { method: "POST", body: formData });
    setEnviando(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErro(data.error ?? "Não foi possível ler a imagem.");
      return;
    }

    const data: LeituraImagem = await res.json();
    setResultado(data);
    setCandidatos(extrairItensCandidatos(data));
    setIndustriaId(sugerirIndustria(data, industrias) ?? "");
    setClienteId("");
  }

  function handleChangeItem(index: number, patch: Partial<ItemResolvido>) {
    setItens((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function precoCadastro(produto: ProdutoOption, quantidade: number): number {
    const faixa = encontrarFaixaPreco(produto.faixas, quantidade);
    return faixa ? faixa.preco : produto.preco;
  }

  const itensProntos =
    itens.length > 0 && itens.every((i) => i.produtoId && i.quantidade > 0 && i.valorUnitario >= 0);
  const podeCriarPedido = Boolean(clienteId) && Boolean(industriaId) && itensProntos;

  function handleCriarPedido() {
    if (!podeCriarPedido) return;

    const wizardItens = itens.map((item) => {
      const produto = produtos.find((p) => p.id === item.produtoId)!;
      return {
        produtoId: produto.id,
        codigo: produto.codigo,
        referencia: produto.referencia,
        descricao: produto.nome,
        marcaNome: produto.marcaNome,
        unidade: produto.unidade,
        pesoLiquidoUnit: produto.pesoLiquido,
        valorUnitario: item.valorUnitario,
        quantidade: item.quantidade,
        // valor vem da foto — nunca recalcula pela faixa automaticamente
        precoManual: true,
      };
    });

    const dados: WizardInitialData = {
      clienteId,
      industriaId,
      transportadoraId: "",
      compradorNome: "",
      formaPagamentoId: "",
      observacoes: "Pedido importado por foto — confira os itens antes de enviar.",
      itens: wizardItens,
    };

    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(dados));
    } catch {
      toast.error("Não foi possível preparar o pedido (armazenamento do navegador indisponível).");
      return;
    }
    router.push("/pedidos/novo?fromFoto=1");
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

          {candidatos.length === 0 ? (
            <Card>
              <p className="flex items-center gap-2 text-sm text-warning">
                <AlertTriangle size={14} /> Não encontrei uma tabela de produtos reconhecível nesta imagem — não dá
                pra preencher o pedido automaticamente. Confira os dados extraídos abaixo e crie o pedido
                manualmente se for o caso.
              </p>
            </Card>
          ) : (
            <Card>
              <h3 className="mb-4 text-sm font-semibold">Itens encontrados — revise antes de criar o pedido</h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label required>Indústria (fornecedor)</Label>
                  <Select value={industriaId} onChange={(e) => setIndustriaId(e.target.value)}>
                    <option value="">Selecione...</option>
                    {industrias.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.nome}
                      </option>
                    ))}
                  </Select>
                  <p className="mt-1 text-xs text-muted">
                    Uma foto é tratada como sendo de uma única indústria — todos os itens são casados com o catálogo
                    dela.
                  </p>
                </div>
                <div>
                  <Label required>Cliente</Label>
                  <Combobox
                    placeholder="Buscar cliente por nome ou CNPJ..."
                    value={clienteId}
                    onChange={setClienteId}
                    options={clientes.map((c) => ({
                      id: c.id,
                      label: c.nome,
                      sublabel: formatCNPJ(c.cnpj),
                    }))}
                  />
                </div>
              </div>

              {!industriaId ? (
                <p className="mt-4 text-sm text-muted">Selecione a indústria pra casar os itens com o catálogo.</p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border text-xs uppercase text-muted">
                      <tr>
                        <th className="py-2 pr-3 font-medium">Lido na imagem</th>
                        <th className="py-2 pr-3 font-medium">Produto no cadastro</th>
                        <th className="py-2 pr-3 font-medium">Qtd.</th>
                        <th className="py-2 pr-3 font-medium">Vr. Unit.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itens.map((item, i) => {
                        const produto = produtos.find((p) => p.id === item.produtoId);
                        const divergente =
                          produto && Math.abs(item.valorUnitario - precoCadastro(produto, item.quantidade)) > 0.01;
                        const semMatch = !item.produtoId;
                        const matchIncerto = item.matchScore !== null && item.matchScore < 0.7;

                        return (
                          <tr key={i} className="border-b border-border last:border-0 align-top">
                            <td className="py-2 pr-3 text-xs text-muted">{item.descricaoRaw}</td>
                            <td className="min-w-[240px] py-2 pr-3">
                              <Combobox
                                placeholder="Escolher produto..."
                                value={item.produtoId}
                                onChange={(id) => handleChangeItem(i, { produtoId: id })}
                                emptyText="Nenhum produto encontrado"
                                options={produtosDaIndustria
                                  .filter(
                                    (p) =>
                                      p.id === item.produtoId ||
                                      !itens.some((outro, j) => j !== i && outro.produtoId === p.id),
                                  )
                                  .map((p) => ({
                                    id: p.id,
                                    label: p.nome,
                                    sublabel: `${p.codigo}${p.referencia ? ` · ${p.referencia}` : ""}`,
                                  }))}
                              />
                              {semMatch && (
                                <p className="mt-1 flex items-center gap-1 text-xs text-danger">
                                  <AlertTriangle size={12} /> Não encontrei este item no cadastro — escolha manualmente.
                                </p>
                              )}
                              {!semMatch && matchIncerto && (
                                <p className="mt-1 flex items-center gap-1 text-xs text-warning">
                                  <AlertTriangle size={12} /> Match incerto — confira se é o produto certo.
                                </p>
                              )}
                            </td>
                            <td className="w-24 py-2 pr-3">
                              <Input
                                type="number"
                                step="0.001"
                                min="0"
                                value={item.quantidade}
                                onChange={(e) => handleChangeItem(i, { quantidade: Number(e.target.value) })}
                              />
                            </td>
                            <td className="w-32 py-2 pr-3">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.valorUnitario}
                                onChange={(e) => handleChangeItem(i, { valorUnitario: Number(e.target.value) })}
                              />
                              {divergente && (
                                <p className="mt-1 text-xs text-warning">
                                  * valor divergente do cadastro ({formatCurrencyBRL(precoCadastro(produto!, item.quantidade))})
                                </p>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-5 flex justify-end">
                <Button type="button" onClick={handleCriarPedido} disabled={!podeCriarPedido}>
                  Usar estes itens no pedido <ArrowRight size={16} />
                </Button>
              </div>
              {!podeCriarPedido && industriaId && itens.length > 0 && (
                <p className="mt-2 text-right text-xs text-muted">
                  Selecione o cliente e um produto pra cada item pra continuar.
                </p>
              )}
            </Card>
          )}

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
