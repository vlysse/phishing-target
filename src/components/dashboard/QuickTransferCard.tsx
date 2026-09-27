import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { TransferIcon } from "../ui/icons";
import { api } from "../../lib/api";

export interface QuickTransferAccount {
  id: string;
  nickname: string;
  type: string;
  balance: number;
  currency: string;
}

export function QuickTransferCard({ accounts }: { accounts: QuickTransferAccount[] }) {
  const [sourceAccountId, setSourceAccountId] = useState(accounts[0]?.id ?? "");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!sourceAccountId || !recipient || !amount) return;
    setState("sending");
    try {
      const resolved = await api.post<{ name: string }>("/transfer/resolve-recipient", {
        method: "account_number",
        value: recipient,
      });
      await api.post("/transfer", {
        sourceAccountId,
        method: "account_number",
        recipient,
        recipientName: resolved.name,
        amount: Number(amount),
        currency: "MUR",
      });
      setState("sent");
      setRecipient("");
      setAmount("");
    } catch {
      setState("error");
    }
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Quick Transfer</h3>
        <Link to="/transfer" className="text-xs font-medium text-[var(--color-brand)] hover:underline">
          Full transfer
        </Link>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Select
          label="From account"
          value={sourceAccountId}
          onChange={setSourceAccountId}
          options={accounts.map((a) => ({ value: a.id, label: a.nickname }))}
        />
        <Input
          label="Recipient account number"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="TDVX0000000000"
          required
        />
        <Input
          label="Amount (MUR)"
          type="number"
          min={1}
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <Button type="submit" disabled={state === "sending"} className="w-full">
          {state === "sending" ? "Sending..." : "Send"}
          <TransferIcon className="h-4 w-4" />
        </Button>
        {state === "sent" && <p className="text-sm text-[var(--color-good)]">Transfer sent.</p>}
        {state === "error" && (
          <p className="text-sm text-[var(--color-critical)]">Transfer failed. Check the amount and try again.</p>
        )}
      </form>
    </Card>
  );
}
