import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Pagination } from "../components/ui/Pagination";
import { Spinner } from "../components/ui/Spinner";
import { Tabs } from "../components/ui/Tabs";
import { api } from "../lib/api";
import { formatCurrency, formatDate } from "../lib/format";

type FilterType = "all" | "income" | "expense";

interface Transaction {
  id: string;
  description: string;
  type: "income" | "expense";
  accountNickname: string;
  date: string;
  amount: number;
  currency: string;
  receiptNumber: string;
}

interface TransactionsResponse {
  items: Transaction[];
  total: number;
  page: number;
  pageSize: number;
}

export function TransactionsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterType>("all");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<TransactionsResponse | null>(null);

  useEffect(() => {
    setData(null);
    api
      .get<TransactionsResponse>(`/transactions?type=${filter}&page=${page}&pageSize=10`)
      .then(setData);
  }, [filter, page]);

  function handleFilterChange(next: FilterType) {
    setFilter(next);
    setPage(1);
  }

  return (
    <AppShell title="Transactions">
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <Tabs
            tabs={[
              { value: "all", label: "All" },
              { value: "income", label: "Income" },
              { value: "expense", label: "Expense" },
            ]}
            value={filter}
            onChange={handleFilterChange}
          />
        </div>

        {!data ? (
          <div className="flex h-48 items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-left text-xs font-medium text-[var(--color-text-secondary)]">
                    <th className="pb-3">Description</th>
                    <th className="pb-3">Receipt ID</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Account</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3 text-right">Amount</th>
                    <th className="pb-3 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((t) => (
                    <tr key={t.id} className="border-b border-[var(--color-border)] last:border-0">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <span
                            aria-hidden
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm ${
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
                      <td className="py-4 text-xs text-[var(--color-text-muted)]">{t.receiptNumber}</td>
                      <td className="py-4 capitalize text-[var(--color-text-secondary)]">{t.type}</td>
                      <td className="py-4 text-[var(--color-text-secondary)]">{t.accountNickname}</td>
                      <td className="py-4 text-[var(--color-text-secondary)]">{formatDate(t.date)}</td>
                      <td
                        className={`py-4 text-right tabular-nums font-medium ${
                          t.type === "income" ? "text-[var(--color-good)]" : "text-[var(--color-critical)]"
                        }`}
                      >
                        {t.type === "expense" ? "-" : "+"}
                        {formatCurrency(t.amount, t.currency)}
                      </td>
                      <td className="py-4 text-right">
                        <Button variant="secondary" size="sm" onClick={() => navigate(`/transactions/${t.id}`)}>
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPageChange={setPage} />
          </>
        )}
      </Card>
    </AppShell>
  );
}
