"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Download, DollarSign, HandCoins, Receipt, TrendingUp } from "lucide-react";
import { Card, EmptyState } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { StatCard } from "@/components/dashboard/stat-card";
import { RankingBars } from "@/components/dashboard/ranking-bars";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";

type Pedido = {
  numero: number;
  data: string;
  cliente: string;
  industria: string;
  vendedor: string;
  valor: number;
};

type Item = { nome: string; valor: number };

type ContaFechamento = { id: string; nome: string; total: number };
type GrupoFechamento = {
  id: string;
  nome: string;
  tipo: "RECEITA" | "DESPESA";
  contas: ContaFechamento[];
  subtotal: number;
};

function csvEscape(value: string | number): string {
  const s = String(value);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function baixarCsv(nomeArquivo: string, cabecalho: string[], linhas: (string | number)[][]) {
  const conteudo = [cabecalho, ...linhas].map((linha) => linha.map(csvEscape).join(";")).join("\n");
  const blob = new Blob([`﻿${conteudo}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  a.click();
  URL.revokeObjectURL(url);
}

export function RelatoriosPanel({
  de,
  ate,
  totalFaturamento,
  totalComissoes,
  totalGastos,
  pedidos,
  porIndustria,
  porVendedor,
  porProduto,
  porContaGasto,
  fechamento,
  totalReceitasContas,
  totalDespesasContas,
}: {
  de: string;
  ate: string;
  totalFaturamento: number;
  totalComissoes: number;
  totalGastos: number;
  pedidos: Pedido[];
  porIndustria: Item[];
  porVendedor: Item[];
  porProduto: Item[];
  porContaGasto: Item[];
  fechamento: GrupoFechamento[];
  totalReceitasContas: number;
  totalDespesasContas: number;
}) {
  const router = useRouter();
  const [filtroDe, setFiltroDe] = useState(de);
  const [filtroAte, setFiltroAte] = useState(ate);

  const resultadoLiquido = totalFaturamento - totalComissoes - totalGastos;

  function aplicarFiltro() {
    router.push(`/relatorios?de=${filtroDe}&ate=${filtroAte}`);
  }

  function exportarPedidos() {
    baixarCsv(
      `vendas_${de}_a_${ate}.csv`,
      ["Número", "Data", "Cliente", "Indústria", "Vendedor", "Valor"],
      pedidos.map((p) => [p.numero, formatDateBR(p.data), p.cliente, p.industria, p.vendedor, p.valor.toFixed(2).replace(".", ",")]),
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <Label>De</Label>
            <Input type="date" value={filtroDe} onChange={(e) => setFiltroDe(e.target.value)} />
          </div>
          <div>
            <Label>Até</Label>
            <Input type="date" value={filtroAte} onChange={(e) => setFiltroAte(e.target.value)} />
          </div>
          <Button type="button" onClick={aplicarFiltro}>
            Filtrar
          </Button>
          <Button type="button" variant="secondary" onClick={exportarPedidos} disabled={pedidos.length === 0}>
            <Download size={16} /> Exportar vendas (CSV)
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard icon={DollarSign} label="Faturamento" value={formatCurrencyBRL(totalFaturamento)} tone="success" />
        <StatCard icon={HandCoins} label="Comissões pagas" value={formatCurrencyBRL(totalComissoes)} tone="warning" />
        <StatCard icon={Receipt} label="Gastos" value={formatCurrencyBRL(totalGastos)} tone="danger" />
        <StatCard
          icon={TrendingUp}
          label="Resultado líquido"
          value={formatCurrencyBRL(resultadoLiquido)}
          tone={resultadoLiquido >= 0 ? "success" : "danger"}
          hint="Faturamento − comissões pagas − gastos"
        />
      </div>

      {pedidos.length === 0 ? (
        <EmptyState title="Nenhum pedido no período selecionado" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <h2 className="mb-3 text-sm font-semibold">Vendas por indústria</h2>
            <RankingBars itens={porIndustria} />
          </Card>
          <Card>
            <h2 className="mb-3 text-sm font-semibold">Vendas por vendedor</h2>
            <RankingBars itens={porVendedor} />
          </Card>
          <Card>
            <h2 className="mb-3 text-sm font-semibold">Produtos mais vendidos</h2>
            {porProduto.length === 0 ? (
              <p className="text-sm text-muted">Sem itens no período.</p>
            ) : (
              <RankingBars itens={porProduto} />
            )}
          </Card>
        </div>
      )}

      {porContaGasto.length > 0 && (
        <Card>
          <h2 className="mb-3 text-sm font-semibold">Gastos por conta</h2>
          <RankingBars itens={porContaGasto} />
        </Card>
      )}

      <Card>
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Fechamento mensal — plano de contas</h2>
          <span className="text-xs text-muted">{formatDateBR(de)} a {formatDateBR(ate)}</span>
        </div>
        <p className="mb-4 text-xs text-muted">
          Receita de vendas, comissões pagas e gastos do período, classificados pela conta contábil de cada
          lançamento.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {(["RECEITA", "DESPESA"] as const).map((tipo) => {
            const gruposDoTipo = fechamento.filter((g) => g.tipo === tipo);
            const total = tipo === "RECEITA" ? totalReceitasContas : totalDespesasContas;
            return (
              <div key={tipo} className="rounded-xl border border-border p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
                  {tipo === "RECEITA" ? "Receitas" : "Despesas"}
                </p>
                <div className="flex flex-col gap-4">
                  {gruposDoTipo.map((g) => (
                    <div key={g.id}>
                      <div className="mb-1 flex items-center justify-between text-sm font-medium">
                        <span>{g.nome}</span>
                        <span>{formatCurrencyBRL(g.subtotal)}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        {g.contas.map((c) => (
                          <div key={c.id} className="flex items-center justify-between text-xs text-muted">
                            <span>{c.nome}</span>
                            <span>{formatCurrencyBRL(c.total)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-sm font-semibold">
                  <span>Total {tipo === "RECEITA" ? "receitas" : "despesas"}</span>
                  <span className={tipo === "RECEITA" ? "text-success" : "text-danger"}>{formatCurrencyBRL(total)}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center justify-between rounded-xl bg-black/[0.03] px-4 py-3 text-sm font-semibold dark:bg-white/[0.05]">
          <span>Resultado do período (receitas − despesas)</span>
          <span className={totalReceitasContas - totalDespesasContas >= 0 ? "text-success" : "text-danger"}>
            {formatCurrencyBRL(totalReceitasContas - totalDespesasContas)}
          </span>
        </div>
      </Card>

      {pedidos.length > 0 && (
        <Card className="p-0">
          <p className="border-b border-border px-4 py-3 text-sm font-semibold md:px-6">Pedidos do período</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium md:px-6">Nº</th>
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Indústria</th>
                  <th className="px-4 py-3 font-medium">Vendedor</th>
                  <th className="px-4 py-3 font-medium">Valor</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map((p) => (
                  <tr key={p.numero} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-semibold text-brand md:px-6">#{p.numero}</td>
                    <td className="px-4 py-3">{formatDateBR(p.data)}</td>
                    <td className="px-4 py-3">{p.cliente}</td>
                    <td className="px-4 py-3">{p.industria}</td>
                    <td className="px-4 py-3">{p.vendedor}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrencyBRL(p.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
