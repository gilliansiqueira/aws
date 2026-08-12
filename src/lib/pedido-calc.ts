// Cálculos puros usados na criação do pedido (parcelas, totais) — reaproveitados
// pela API e, se necessário, por telas que precisem de pré-visualização.

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export type FormaPagamentoCalc = {
  numeroParcelas: number;
  primeiraParcelaDias: number;
  intervaloDias: number;
};

export type ParcelaCalc = {
  numero: number;
  totalParcelas: number;
  vencimento: Date;
  valor: number;
};

export function calcularParcelas(
  valorTotal: number,
  forma: FormaPagamentoCalc,
  dataPedido: Date,
): ParcelaCalc[] {
  const total = forma.numeroParcelas;
  if (total <= 0) return [];

  const valorBase = Math.floor((valorTotal / total) * 100) / 100;
  const parcelas: ParcelaCalc[] = [];
  let acumulado = 0;

  for (let i = 1; i <= total; i++) {
    const vencimento = new Date(dataPedido);
    vencimento.setDate(
      vencimento.getDate() + forma.primeiraParcelaDias + (i - 1) * forma.intervaloDias,
    );

    const valor = i === total ? round2(valorTotal - acumulado) : valorBase;
    acumulado = round2(acumulado + valor);

    parcelas.push({ numero: i, totalParcelas: total, vencimento, valor });
  }

  return parcelas;
}
