import { Router } from "express";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "../db/index.js";
import { accounts, transactions } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";

export const transferRouter = Router();
transferRouter.use(requireAuth);

const resolveSchema = z.object({
  method: z.enum(["account_number", "phone_number"]),
  value: z.string().min(3),
});

/** Dummy recipient lookup for the recipient-entry step. */
transferRouter.post("/resolve-recipient", (req, res) => {
  const parsed = resolveSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_request" });

  const { value } = parsed.data;
  return res.json({
    name: `Recipient ${value.slice(-4).toUpperCase()}`,
    verified: true,
  });
});

const transferSchema = z.object({
  sourceAccountId: z.string().min(1),
  method: z.enum(["account_number", "phone_number"]),
  recipient: z.string().min(3),
  recipientName: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().default("MUR"),
});

transferRouter.post("/", async (req, res) => {
  const parsed = transferSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_request" });

  const { sourceAccountId, method, recipient, recipientName, amount, currency } = parsed.data;

  const [account] = await db.select().from(accounts).where(eq(accounts.id, sourceAccountId)).limit(1);
  if (!account || account.userId !== req.userId) {
    return res.status(404).json({ error: "account_not_found" });
  }
  if (account.balance < amount) {
    return res.status(422).json({ error: "insufficient_funds" });
  }

  const txId = nanoid();
  await db.insert(transactions).values({
    id: txId,
    accountId: account.id,
    description: `Transfer to ${recipientName}`,
    type: "expense",
    category: "transfer",
    counterparty: `${recipientName} (${method === "account_number" ? "Acct" : "Phone"} ${recipient})`,
    amount,
    currency,
    date: new Date(),
    receiptNumber: `TRX-${txId.slice(0, 8).toUpperCase()}`,
  });

  await db
    .update(accounts)
    .set({ balance: account.balance - amount })
    .where(eq(accounts.id, account.id));

  return res.status(201).json({ success: true, transactionId: txId });
});
