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
  porCategoriaGasto,
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
  porCategoriaGasto: Item[];
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

      {porCategoriaGasto.length > 0 && (
        <Card>
          <h2 className="mb-3 text-sm font-semibold">Gastos por categoria</h2>
          <RankingBars itens={porCategoriaGasto} />
        </Card>
      )}

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
