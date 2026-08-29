"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatCurrencyBRL } from "@/lib/format";

export function VendasChart({ data }: { data: { mes: string; valor: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="vendasGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--brand)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--brand)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="mes"
          tick={{ fill: "var(--muted)", fontSize: 12 }}
          axisLine={{ stroke: "var(--border)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "var(--muted)", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={72}
          tickFormatter={(v) => formatCurrencyBRL(v).replace(",00", "")}
        />
        <Tooltip
          formatter={(value) => formatCurrencyBRL(Number(value))}
          contentStyle={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 13,
            color: "var(--foreground)",
          }}
        />
        <Area
          type="monotone"
          dataKey="valor"
          stroke="var(--brand)"
          strokeWidth={2}
          fill="url(#vendasGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
