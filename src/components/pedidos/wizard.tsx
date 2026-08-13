"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { encontrarFaixaPreco } from "@/lib/pedido-calc";
import { Stepper } from "./stepper";
import { StepCliente } from "./step-cliente";
import { StepProdutos } from "./step-produtos";
import { StepQuantidades } from "./step-quantidades";
import { StepPrazo } from "./step-prazo";
import { StepRevisao } from "./step-revisao";
import type { ItemWizard, ProdutoOption, WizardCatalogs, WizardInitialData } from "./types";

export function PedidoWizard({
  catalogos,
  initial,
}: {
  catalogos: WizardCatalogs;
  initial?: WizardInitialData;
}) {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [clienteId, setClienteId] = useState(initial?.clienteId ?? "");
  const [industriaId, setIndustriaId] = useState(initial?.industriaId ?? "");
  const [itens, setItens] = useState<ItemWizard[]>(initial?.itens ?? []);
  const [transportadoraId, setTransportadoraId] = useState(initial?.transportadoraId ?? "");
  const [compradorNome, setCompradorNome] = useState(initial?.compradorNome ?? "");
  const [formaPagamentoId, setFormaPagamentoId] = useState(initial?.formaPagamentoId ?? "");
  const [observacoes, setObservacoes] = useState(initial?.observacoes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const valorTotal = useMemo(
    () => itens.reduce((acc, i) => acc + i.valorUnitario * i.quantidade, 0),
    [itens],
  );

  function handleChangeCliente(id: string) {
    setClienteId(id);
    const cliente = catalogos.clientes.find((c) => c.id === id);
    if (cliente) {
      if (!compradorNome && cliente.compradorPadrao) {
        setCompradorNome(cliente.compradorPadrao);
      }
      if (!formaPagamentoId && cliente.formaPagamentoPadraoId) {
        setFormaPagamentoId(cliente.formaPagamentoPadraoId);
      }
    }
  }

  function handleChangeIndustria(id: string) {
    setIndustriaId(id);
    const industria = catalogos.industrias.find((i) => i.id === id);
    if (industria && !transportadoraId && industria.transportadoraPadraoId) {
      setTransportadoraId(industria.transportadoraPadraoId);
    }
    // Remove itens que não pertencem mais à indústria selecionada
    setItens((prev) =>
      prev.filter((item) =>
        catalogos.produtos.some((p) => p.id === item.produtoId && p.industriaId === id),
      ),
    );
  }

  function handleAddProduto(produto: ProdutoOption) {
    const quantidadeInicial = 1;
    const faixa = encontrarFaixaPreco(produto.faixas, quantidadeInicial);

    setItens((prev) => [
      ...prev,
      {
        produtoId: produto.id,
        codigo: produto.codigo,
        referencia: produto.referencia,
        descricao: produto.nome,
        marcaNome: produto.marcaNome,
        unidade: produto.unidade,
        pesoLiquidoUnit: produto.pesoLiquido,
        valorUnitario: faixa ? faixa.preco : produto.preco,
        quantidade: quantidadeInicial,
        precoManual: false,
      },
    ]);
  }

  function handleRemoveProduto(produtoId: string) {
    setItens((prev) => prev.filter((i) => i.produtoId !== produtoId));
  }

  function handleChangeItem(
    produtoId: string,
    patch: Partial<Pick<ItemWizard, "quantidade" | "valorUnitario">>,
  ) {
    setItens((prev) =>
      prev.map((item) => {
        if (item.produtoId !== produtoId) return item;

        // Preço editado manualmente: passa a valer o valor digitado e o item
        // para de receber sugestão automática ao mudar a quantidade.
        if ("valorUnitario" in patch) {
          return { ...item, valorUnitario: patch.valorUnitario!, precoManual: true };
        }

        // Quantidade alterada: se o preço ainda não foi editado manualmente,
        // sugere o preço da faixa correspondente à nova quantidade. Se o
        // produto tem faixas mas nenhuma corresponde, não inventa preço —
        // mantém o valor atual (o aviso de "sem faixa" aparece na tela).
        const quantidade = patch.quantidade!;
        let valorUnitario = item.valorUnitario;

        if (!item.precoManual) {
          const produto = catalogos.produtos.find((p) => p.id === produtoId);
          if (produto) {
            const faixa = encontrarFaixaPreco(produto.faixas, quantidade);
            if (faixa) {
              valorUnitario = faixa.preco;
            } else if (produto.faixas.length === 0) {
              valorUnitario = produto.preco;
            }
          }
        }

        return { ...item, quantidade, valorUnitario };
      }),
    );
  }

  function validateStep(current: number): string | null {
    if (current === 1) {
      if (!clienteId) return "Selecione o cliente.";
      if (!industriaId) return "Selecione a indústria.";
    }
    if (current === 2 || current === 3) {
      if (itens.length === 0) return "Adicione ao menos um produto.";
      if (itens.some((i) => i.quantidade <= 0)) return "Quantidade deve ser maior que zero.";
      if (itens.some((i) => i.valorUnitario < 0)) return "Valor unitário inválido.";
    }
    if (current === 4) {
      if (!compradorNome.trim()) return "Informe o comprador.";
      if (!formaPagamentoId) return "Selecione a forma de pagamento.";
    }
    return null;
  }

  function goNext() {
    const validationError = validateStep(step);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setStep((s) => Math.min(5, s + 1));
  }

  function goBack() {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  async function handleFinalizar() {
    const validationError = validateStep(4);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/pedidos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clienteId,
        industriaId,
        transportadoraId: transportadoraId || null,
        compradorNome,
        formaPagamentoId,
        observacoes: observacoes || null,
        itens: itens.map((i) => ({
          produtoId: i.produtoId,
          quantidade: i.quantidade,
          valorUnitario: i.valorUnitario,
        })),
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erro ao finalizar pedido.");
      return;
    }

    const pedido = await res.json();
    router.push(`/pedidos/${pedido.id}/espelho`);
  }

  return (
    <div>
      <Stepper current={step} />

      {step === 1 && (
        <StepCliente
          clientes={catalogos.clientes}
          industrias={catalogos.industrias}
          clienteId={clienteId}
          industriaId={industriaId}
          onChangeCliente={handleChangeCliente}
          onChangeIndustria={handleChangeIndustria}
        />
      )}

      {step === 2 && (
        <StepProdutos
          produtos={catalogos.produtos}
          industriaId={industriaId}
          itens={itens}
          onAdd={handleAddProduto}
          onRemove={handleRemoveProduto}
        />
      )}

      {step === 3 && (
        <StepQuantidades
          itens={itens}
          produtos={catalogos.produtos}
          onChange={handleChangeItem}
        />
      )}

      {step === 4 && (
        <StepPrazo
          transportadoras={catalogos.transportadoras}
          formasPagamento={catalogos.formasPagamento}
          transportadoraId={transportadoraId}
          compradorNome={compradorNome}
          formaPagamentoId={formaPagamentoId}
          observacoes={observacoes}
          valorTotal={valorTotal}
          onChangeTransportadora={setTransportadoraId}
          onChangeComprador={setCompradorNome}
          onChangeFormaPagamento={setFormaPagamentoId}
          onChangeObservacoes={setObservacoes}
        />
      )}

      {step === 5 && (
        <StepRevisao
          cliente={catalogos.clientes.find((c) => c.id === clienteId)}
          industria={catalogos.industrias.find((i) => i.id === industriaId)}
          transportadora={catalogos.transportadoras.find((t) => t.id === transportadoraId)}
          formaPagamento={catalogos.formasPagamento.find((f) => f.id === formaPagamentoId)}
          compradorNome={compradorNome}
          observacoes={observacoes}
          itens={itens}
        />
      )}

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      <div className="mt-6 flex justify-between">
        <Button
          type="button"
          variant="secondary"
          onClick={goBack}
          disabled={step === 1 || submitting}
        >
          Voltar
        </Button>

        {step < 5 ? (
          <Button type="button" onClick={goNext}>
            Avançar
          </Button>
        ) : (
          <Button type="button" onClick={handleFinalizar} disabled={submitting}>
            {submitting ? "Gerando espelho..." : "Finalizar e Gerar Espelho"}
          </Button>
        )}
      </div>
    </div>
  );
}
