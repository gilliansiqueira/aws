const DIAS_SEMANA = ["S", "T", "Q", "Q", "S", "S", "D"];
const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function buildGrid(ano: number, mes: number) {
  const primeiroDia = new Date(ano, mes, 1);
  const totalDias = new Date(ano, mes + 1, 0).getDate();
  const offset = (primeiroDia.getDay() + 6) % 7; // semana começando na segunda
  const celulas: (number | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= totalDias; d++) celulas.push(d);
  while (celulas.length % 7 !== 0) celulas.push(null);
  return celulas;
}

export function VencimentosCard({
  ano,
  mes,
  hoje,
  diasComVencimento,
  totalVencendoSemana,
}: {
  ano: number;
  mes: number;
  hoje: number;
  diasComVencimento: Set<number>;
  totalVencendoSemana: number;
}) {
  const celulas = buildGrid(ano, mes);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-foreground p-4 text-background shadow-sm md:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Vencimentos de parcelas</h2>
        <span className="text-xs opacity-70">{MESES[mes]}</span>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] opacity-60">
        {DIAS_SEMANA.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {celulas.map((dia, i) => {
          if (dia === null) return <span key={i} />;
          const isHoje = dia === hoje;
          const temVencimento = diasComVencimento.has(dia);
          return (
            <div
              key={i}
              className={`relative flex h-8 items-center justify-center rounded-full text-xs ${
                isHoje
                  ? "bg-warning font-bold text-foreground"
                  : temVencimento
                    ? "bg-white/15 font-medium"
                    : "opacity-70"
              }`}
            >
              {dia}
              {temVencimento && !isHoje && (
                <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-warning" />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3 border-t border-white/10 pt-3 text-xs">
        <span className="h-2 w-2 rounded-full bg-warning" />
        <span className="opacity-80">
          {totalVencendoSemana > 0
            ? `${totalVencendoSemana} parcela${totalVencendoSemana > 1 ? "s" : ""} vencendo nos próximos 7 dias`
            : "Nenhuma parcela vencendo nos próximos 7 dias"}
        </span>
      </div>
    </div>
  );
}
