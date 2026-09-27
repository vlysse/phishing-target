import { useEffect, useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { BalanceHistoryChart, type BalanceWeek } from "../components/charts/BalanceHistoryChart";
import { WeeklyLedgerChart, type LedgerDay } from "../components/charts/WeeklyLedgerChart";
import { Card } from "../components/ui/Card";
import { Spinner } from "../components/ui/Spinner";
import { QuickTransferCard, type QuickTransferAccount } from "../components/dashboard/QuickTransferCard";
import { TransactionStatsCard, type DashboardStats } from "../components/dashboard/TransactionStatsCard";
import { api } from "../lib/api";

export function DashboardPage() {
  const [ledger, setLedger] = useState<LedgerDay[] | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [balanceHistory, setBalanceHistory] = useState<BalanceWeek[] | null>(null);
  const [accounts, setAccounts] = useState<QuickTransferAccount[] | null>(null);

  useEffect(() => {
    api.get<{ days: LedgerDay[] }>("/dashboard/ledger").then((r) => setLedger(r.days));
    api.get<DashboardStats>("/dashboard/stats").then(setStats);
    api.get<{ weeks: BalanceWeek[] }>("/dashboard/balance-history").then((r) => setBalanceHistory(r.weeks));
    api.get<QuickTransferAccount[]>("/dashboard/quick-transfer-accounts").then(setAccounts);
  }, []);

  const loading = !ledger || !stats || !balanceHistory || !accounts;

  return (
    <AppShell title="Dashboard">
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">Weekly Ledger Activity</h3>
            <WeeklyLedgerChart data={ledger} />
          </Card>

          <TransactionStatsCard stats={stats} />

          <Card className="lg:col-span-2">
            <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">Balance History</h3>
            <BalanceHistoryChart data={balanceHistory} />
          </Card>

          <QuickTransferCard accounts={accounts} />
        </div>
      )}
    </AppShell>
  );
}
