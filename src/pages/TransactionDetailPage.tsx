import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Spinner } from "../components/ui/Spinner";
import { api } from "../lib/api";
import { formatCurrency, formatDateTime } from "../lib/format";

interface TransactionDetail {
  id: string;
  description: string;
  type: "income" | "expense";
  category: string;
  counterparty: string;
  amount: number;
  currency: string;
  date: string;
  receiptNumber: string;
  account: { nickname: string; accountNumber: string };
}

export function TransactionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tx, setTx] = useState<TransactionDetail | null>(null);

  useEffect(() => {
    if (id) api.get<TransactionDetail>(`/transactions/${id}`).then(setTx);
  }, [id]);

  return (
    <AppShell title="Receipt">
      <div className="mx-auto max-w-lg">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          &larr; Back
        </Button>

        {!tx ? (
          <div className="flex h-48 items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <Card>
            <div className="mb-6 flex flex-col items-center gap-2 border-b border-dashed border-[var(--color-border)] pb-6 text-center">
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                  tx.type === "income"
                    ? "bg-[var(--color-good)]/10 text-[var(--color-good)]"
                    : "bg-[var(--color-expense)]/10 text-[var(--color-expense)]"
                }`}
              >
                {tx.type}
              </span>
              <span className="text-3xl font-semibold tabular-nums text-[var(--color-text-primary)]">
                {tx.type === "expense" ? "-" : "+"}
                {formatCurrency(tx.amount, tx.currency)}
              </span>
              <span className="text-sm text-[var(--color-text-muted)]">{tx.description}</span>
            </div>

            <dl className="flex flex-col gap-3 text-sm">
              {[
                ["Receipt number", tx.receiptNumber],
                ["Date", formatDateTime(tx.date)],
                ["Category", tx.category],
                ["Counterparty", tx.counterparty],
                ["Account", `${tx.account.nickname} (${tx.account.accountNumber})`],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between">
                  <dt className="text-[var(--color-text-muted)]">{label}</dt>
                  <dd className="font-medium text-[var(--color-text-primary)]">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
