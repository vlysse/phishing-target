import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "../../lib/format";

export interface DebitCreditMonth {
  month: string;
  debit: number;
  credit: number;
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-xs shadow-md">
      <div className="mb-1 font-medium text-[var(--color-text-primary)]">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-[var(--color-text-secondary)]">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.fill }} />
          <span className="capitalize">{p.dataKey}</span>
          <span className="ml-auto tabular-nums font-medium text-[var(--color-text-primary)]">
            {formatCurrency(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function DebitCreditChart({ data }: { data: DebitCreditMonth[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} barGap={4} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--color-gridline)" />
        <XAxis
          dataKey="month"
          tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
          axisLine={{ stroke: "var(--color-border-strong)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-surface)" }} />
        <Legend wrapperStyle={{ fontSize: 12, color: "var(--color-text-secondary)" }} />
        <Bar dataKey="debit" name="Debit" fill="var(--color-chart-deposit)" radius={[8, 8, 0, 0]} maxBarSize={18} />
        <Bar dataKey="credit" name="Credit" fill="var(--color-warning)" radius={[8, 8, 0, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}
