import { useEffect, useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { DebitCreditChart, type DebitCreditMonth } from "../components/charts/DebitCreditChart";
import { Card } from "../components/ui/Card";
import { Spinner } from "../components/ui/Spinner";
import { StatCard } from "../components/ui/StatCard";
import { CardIcon, IncomeIcon, SavingsIcon, WalletIcon } from "../components/ui/icons";
import { api } from "../lib/api";
import { formatCurrency, formatDate } from "../lib/format";

interface Summary {
  balance: number;
  income: number;
  expense: number;
  totalSavings: number;
}

interface RecentTransaction {
  id: string;
  description: string;
  type: "income" | "expense";
  amount: number;
  currency: string;
  date: string;
}

export function AccountsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [recent, setRecent] = useState<RecentTransaction[] | null>(null);
  const [overview, setOverview] = useState<DebitCreditMonth[] | null>(null);

  useEffect(() => {
    api.get<Summary>("/accounts/summary").then(setSummary);
    api.get<RecentTransaction[]>("/accounts/recent-transactions").then(setRecent);
    api.get<{ months: DebitCreditMonth[] }>("/accounts/debit-credit-overview").then((r) => setOverview(r.months));
  }, []);

  const loading = !summary || !recent || !overview;

  return (
    <AppShell title="Accounts">
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="My Balance" value={formatCurrency(summary.balance)} Icon={WalletIcon} tint="gold" />
            <StatCard label="Income" value={formatCurrency(summary.income)} Icon={IncomeIcon} tint="blue" />
            <StatCard label="Expense" value={formatCurrency(summary.expense)} Icon={CardIcon} tint="pink" />
            <StatCard label="Total Saving" value={formatCurrency(summary.totalSavings)} Icon={SavingsIcon} tint="teal" />
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Card>
              <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">Last Transactions</h3>
              <table className="w-full text-sm">
                <tbody>
                  {recent.map((t) => (
                    <tr key={t.id} className="border-b border-[var(--color-border)] last:border-0">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <span
                            aria-hidden
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs ${
                              t.type === "income"
                                ? "bg-[var(--color-good)]/10 text-[var(--color-good)]"
                                : "bg-[var(--color-expense)]/10 text-[var(--color-expense)]"
                            }`}
                          >
                            {t.type === "income" ? "↓" : "↑"}
                          </span>
                          <span className="text-[var(--color-text-primary)]">{t.description}</span>
                        </div>
                      </td>
                      <td className="py-3 text-[var(--color-text-muted)]">{formatDate(t.date)}</td>
                      <td
                        className={`py-3 text-right tabular-nums font-medium ${
                          t.type === "income" ? "text-[var(--color-good)]" : "text-[var(--color-critical)]"
                        }`}
                      >
                        {t.type === "expense" ? "-" : "+"}
                        {formatCurrency(t.amount, t.currency)}
                      </td>
                    </tr>
                  ))}
                  {recent.length === 0 && (
                    <tr>
                      <td className="py-4 text-center text-[var(--color-text-muted)]" colSpan={3}>
                        No transactions yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>

            <Card>
              <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
                Debit &amp; Credit Overview
              </h3>
              <DebitCreditChart data={overview} />
            </Card>
          </div>
        </div>
      )}
    </AppShell>
  );
}
