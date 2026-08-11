import type { Prisma } from "@/generated/prisma/client";
import { formatCNPJ, formatCurrencyBRL, formatDateBR, formatPhone, formatQtyBR } from "@/lib/format";
import type { EmpresaSnapshot } from "./types";

export type PedidoParaEspelho = Prisma.PedidoGetPayload<{
  include: { itens: true; parcelas: true };
}>;

export function EspelhoDocumento({ pedido }: { pedido: PedidoParaEspelho }) {
  const empresa = pedido.empresaSnapshot as unknown as EmpresaSnapshot;

  return (
    <div className="mx-auto max-w-3xl bg-white p-8 text-sm text-black shadow-sm print:shadow-none">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between border-b border-black/20 pb-4">
        <div className="leading-relaxed">
          <p className="font-bold">{empresa.nome}</p>
          <p>{empresa.endereco}</p>
          <p>{empresa.bairro}</p>
          <p>
            {empresa.cidade} - {empresa.uf}
          </p>
          <p>CEP: {empresa.cep}</p>
          <p>Tel: {formatPhone(empresa.telefone)}</p>
        </div>
        <div className="text-right leading-relaxed">
          <p>
            <span className="font-semibold">Razao:</span> {empresa.razaoSocial}
          </p>
          <p>
            <span className="font-semibold">CNPJ:</span> {formatCNPJ(empresa.cnpj)}
          </p>
        </div>
      </div>

      {/* Título */}
      <h1 className="my-4 text-center text-lg font-bold uppercase tracking-wide">
        Pedido Fornecedor
      </h1>

      {/* Dados do pedido */}
      <div className="mb-4 flex flex-col gap-1 border-b border-black/20 pb-4">
        <div className="flex flex-wrap gap-x-6">
          <p>
            <span className="font-semibold">N. Pedido:</span> {pedido.numero}
          </p>
          <p>
            <span className="font-semibold">Data:</span> {formatDateBR(pedido.dataPedido)}
          </p>
          <p>
            <span className="font-semibold">Comprador:</span> {pedido.compradorNome}
          </p>
        </div>
        <p>
          <span className="font-semibold">Fornecedor:</span> {pedido.industriaNomeSnapshot}
        </p>
        <p>
          <span className="font-semibold">Cliente:</span> {pedido.clienteNomeSnapshot}
          {pedido.clienteCnpjSnapshot && ` — CNPJ: ${formatCNPJ(pedido.clienteCnpjSnapshot)}`}
        </p>
        <p>
          <span className="font-semibold">Transportadora:</span>{" "}
          {pedido.transportadoraNomeSnapshot ?? "-"}
        </p>
        <p>
          <span className="font-semibold">Observações:</span> {pedido.observacoes ?? "-"}
        </p>
      </div>

      {/* Tabela de itens */}
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="border-b border-t border-black/40">
            <th className="px-1 py-1.5 text-left font-semibold">Código</th>
            <th className="px-1 py-1.5 text-left font-semibold">Referência</th>
            <th className="px-1 py-1.5 text-left font-semibold">Descrição</th>
            <th className="px-1 py-1.5 text-right font-semibold">Peso Liq.</th>
            <th className="px-1 py-1.5 text-right font-semibold">Quant.</th>
            <th className="px-1 py-1.5 text-right font-semibold">Vr.Unit</th>
            <th className="px-1 py-1.5 text-right font-semibold">Vr.Total</th>
          </tr>
        </thead>
        <tbody>
          {pedido.itens.map((item) => (
            <tr key={item.id} className="border-b border-black/10">
              <td className="px-1 py-1.5">{item.codigoSnapshot}</td>
              <td className="px-1 py-1.5">{item.referenciaSnapshot ?? "-"}</td>
              <td className="px-1 py-1.5">{item.descricaoSnapshot}</td>
              <td className="px-1 py-1.5 text-right">
                {formatQtyBR(item.pesoTotal.toString())}
              </td>
              <td className="px-1 py-1.5 text-right">
                {formatQtyBR(item.quantidade.toString())}
              </td>
              <td className="px-1 py-1.5 text-right">
                {formatCurrencyBRL(item.valorUnitarioSnapshot.toString())}
              </td>
              <td className="px-1 py-1.5 text-right">
                {formatCurrencyBRL(item.valorTotal.toString())}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Rodapé: Forma Pagamento com somatórios */}
      <div className="mt-1 flex items-center justify-between border-y border-black/40 py-1.5 text-xs font-semibold">
        <span>Forma Pagamento</span>
        <div className="flex gap-6">
          <span>{formatQtyBR(pedido.pesoTotal.toString())}</span>
          <span>{formatQtyBR(pedido.quantidadeTotal.toString())}</span>
          <span>{formatCurrencyBRL(pedido.valorTotal.toString())}</span>
        </div>
      </div>
      <p className="mb-4 mt-1 font-bold uppercase">{pedido.formaPagamentoNomeSnapshot}</p>

      {/* Parcelas */}
      {pedido.parcelas.length > 0 && (
        <div className="mb-10 flex flex-col gap-0.5 text-xs">
          {pedido.parcelas.map((p) => (
            <div key={p.id} className="flex gap-6">
              <span className="w-16">
                {p.numero} / {p.totalParcelas}
              </span>
              <span className="w-24">{formatDateBR(p.vencimento)}</span>
              <span>{formatCurrencyBRL(p.valor.toString())}</span>
            </div>
          ))}
        </div>
      )}

      {/* Assinatura */}
      <div className="mt-16 flex justify-end">
        <div className="w-56 border-t border-black/60 pt-1 text-center text-xs">Comprador</div>
      </div>
    </div>
  );
}
