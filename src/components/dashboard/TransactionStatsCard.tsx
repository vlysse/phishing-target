import { Card } from "../ui/Card";
import { formatCurrency } from "../../lib/format";

export interface DashboardStats {
  income: number;
  expense: number;
  net: number;
  count: number;
  incomeTrendPct: number;
  expenseTrendPct: number;
}

function Row({ label, value, trendPct, tone }: { label: string; value: number; trendPct: number; tone: "good" | "bad" }) {
  const color = tone === "good" ? "text-[var(--color-good)]" : "text-[var(--color-critical)]";
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>
      <div className="flex items-center gap-2">
        <span className="tabular-nums text-sm font-semibold text-[var(--color-text-primary)]">
          {formatCurrency(value)}
        </span>
        <span className={`text-xs font-medium ${color}`}>
          {trendPct >= 0 ? "↑" : "↓"} {Math.abs(trendPct)}%
        </span>
      </div>
    </div>
  );
}

export function TransactionStatsCard({ stats }: { stats: DashboardStats }) {
  return (
    <Card>
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Transaction Statistics</h3>
        <span className="text-xs text-[var(--color-text-muted)]">Last 30 days</span>
      </div>
      <div className="divide-y divide-[var(--color-border)]">
        <Row label="Income" value={stats.income} trendPct={stats.incomeTrendPct} tone="good" />
        <Row label="Expense" value={stats.expense} trendPct={stats.expenseTrendPct} tone="bad" />
        <div className="flex items-center justify-between pt-2.5">
          <span className="text-sm font-medium text-[var(--color-text-primary)]">Net</span>
          <span className="tabular-nums text-sm font-semibold text-[var(--color-text-primary)]">
            {formatCurrency(stats.net)}
          </span>
        </div>
      </div>
    </Card>
  );
}
