import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Spinner } from "../components/ui/Spinner";
import { api } from "../lib/api";
import { formatCurrency } from "../lib/format";
import { Select } from "../components/ui/Select";
import { BankIcon, CheckIcon, PhoneIcon, TransferIcon } from "../components/ui/icons";

type Method = "account_number" | "phone_number";
type Step = "method" | "recipient" | "account" | "recap" | "loading" | "success" | "error";

interface Account {
  id: string;
  nickname: string;
  type: string;
  balance: number;
  currency: string;
}

const CURRENCIES = ["MUR", "USD", "EUR", "GBP"];

export function TransferPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("method");
  const [method, setMethod] = useState<Method | null>(null);
  const [recipientValue, setRecipientValue] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("MUR");
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [sourceAccountId, setSourceAccountId] = useState("");
  const [transactionId, setTransactionId] = useState<string | null>(null);

  useEffect(() => {
    if (step === "account" && !accounts) {
      api.get<Account[]>("/accounts").then((res) => {
        setAccounts(res);
        setSourceAccountId(res[0]?.id ?? "");
      });
    }
  }, [step, accounts]);

  async function handleRecipientNext() {
    const resolved = await api.post<{ name: string }>("/transfer/resolve-recipient", {
      method,
      value: recipientValue,
    });
    setRecipientName(resolved.name);
    setStep("account");
  }

  async function handleConfirm() {
    setStep("loading");
    try {
      const res = await api.post<{ transactionId: string }>("/transfer", {
        sourceAccountId,
        method,
        recipient: recipientValue,
        recipientName,
        amount: Number(amount),
        currency,
      });
      setTransactionId(res.transactionId);
      setStep("success");
    } catch {
      setStep("error");
    }
  }

  const selectedAccount = accounts?.find((a) => a.id === sourceAccountId);

  return (
    <AppShell title="Transfer">
      <div className="mx-auto max-w-lg">
        <Card>
          {step === "method" && (
            <div className="flex flex-col gap-4">
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                How would you like to send money?
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {(["account_number", "phone_number"] as Method[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setMethod(m);
                      setStep("recipient");
                    }}
                    className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--color-border-strong)] bg-[var(--color-card)] p-6 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-brand)]"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-brand)]/10 text-[var(--color-brand)]">
                      {m === "account_number" ? (
                        <BankIcon className="h-6 w-6" />
                      ) : (
                        <PhoneIcon className="h-6 w-6" />
                      )}
                    </span>
                    {m === "account_number" ? "Account Number" : "Phone Number"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === "recipient" && (
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleRecipientNext();
              }}
            >
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Recipient &amp; amount</h2>
              <Input
                label={method === "account_number" ? "Recipient account number" : "Recipient phone number"}
                value={recipientValue}
                onChange={(e) => setRecipientValue(e.target.value)}
                required
              />
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <Input
                  label="Amount"
                  type="number"
                  min={1}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
                <div className="w-32">
                  <Select
                    label="Currency"
                    value={currency}
                    onChange={setCurrency}
                    options={CURRENCIES.map((c) => ({ value: c, label: c }))}
                  />
                </div>
              </div>
              <div className="flex justify-between">
                <Button type="button" variant="ghost" onClick={() => setStep("method")}>
                  Back
                </Button>
                <Button type="submit">Continue</Button>
              </div>
            </form>
          )}

          {step === "account" && (
            <div className="flex flex-col gap-4">
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Send from</h2>
              {!accounts ? (
                <div className="flex h-32 items-center justify-center">
                  <Spinner />
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {accounts.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setSourceAccountId(a.id)}
                      className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                        sourceAccountId === a.id
                          ? "border-[var(--color-brand)] bg-[var(--color-brand)]/5"
                          : "border-[var(--color-border)] hover:border-[var(--color-border-strong)]"
                      }`}
                    >
                      <span className="font-medium capitalize text-[var(--color-text-primary)]">{a.nickname}</span>
                      <span className="tabular-nums text-[var(--color-text-secondary)]">
                        {formatCurrency(a.balance, a.currency)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep("recipient")}>
                  Back
                </Button>
                <Button disabled={!sourceAccountId} onClick={() => setStep("recap")}>
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === "recap" && selectedAccount && (
            <div className="flex flex-col gap-4">
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Review transfer</h2>
              <dl className="flex flex-col gap-3 rounded-lg border border-[var(--color-border)] p-4 text-sm">
                {[
                  ["From", selectedAccount.nickname],
                  ["To", `${recipientName} (${recipientValue})`],
                  ["Method", method === "account_number" ? "Account Number" : "Phone Number"],
                  ["Amount", formatCurrency(Number(amount), currency)],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between">
                    <dt className="text-[var(--color-text-muted)]">{label}</dt>
                    <dd className="font-medium text-[var(--color-text-primary)]">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep("account")}>
                  Back
                </Button>
                <Button onClick={handleConfirm}>
                  Confirm transfer
                  <TransferIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === "loading" && (
            <div className="flex h-48 flex-col items-center justify-center gap-3">
              <Spinner />
              <p className="text-sm text-[var(--color-text-muted)]">Processing transfer...</p>
            </div>
          )}

          {step === "success" && transactionId && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-good)]/10 text-[var(--color-good)]">
                <CheckIcon className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Transfer successful</h2>
                <p className="text-sm text-[var(--color-text-muted)]">
                  {formatCurrency(Number(amount), currency)} sent to {recipientName}.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => navigate(`/transactions/${transactionId}`)}>
                  View transaction
                </Button>
                <Button onClick={() => navigate("/")}>Go home</Button>
              </div>
            </div>
          )}

          {step === "error" && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <p className="text-sm text-[var(--color-critical)]">
                Transfer failed. Please check the account balance and try again.
              </p>
              <Button variant="secondary" onClick={() => setStep("recap")}>
                Back to review
              </Button>
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
