import { Router } from "express";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import { accounts, transactions } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";

export const accountsRouter = Router();
accountsRouter.use(requireAuth);

accountsRouter.get("/", async (req, res) => {
  const rows = await db.select().from(accounts).where(eq(accounts.userId, req.userId!));
  return res.json(rows);
});

/** The 4 stat cards on /accounts: balance, income, expense, total savings. */
accountsRouter.get("/summary", async (req, res) => {
  const userAccounts = await db.select().from(accounts).where(eq(accounts.userId, req.userId!));
  const ids = userAccounts.map((a) => a.id);
  const balance = userAccounts.reduce((acc, a) => acc + a.balance, 0);
  const totalSavings = userAccounts.filter((a) => a.type === "savings").reduce((acc, a) => acc + a.balance, 0);

  if (ids.length === 0) {
    return res.json({ balance: 0, income: 0, expense: 0, totalSavings: 0 });
  }

  const rows = await db.select().from(transactions).where(inArray(transactions.accountId, ids));
  const income = rows.filter((t) => t.type === "income").reduce((acc, t) => acc + t.amount, 0);
  const expense = rows.filter((t) => t.type === "expense").reduce((acc, t) => acc + t.amount, 0);

  return res.json({ balance, income, expense, totalSavings });
});

/** Mini last-transactions table for /accounts. */
accountsRouter.get("/recent-transactions", async (req, res) => {
  const userAccounts = await db.select().from(accounts).where(eq(accounts.userId, req.userId!));
  const ids = userAccounts.map((a) => a.id);
  if (ids.length === 0) return res.json([]);

  const rows = await db
    .select()
    .from(transactions)
    .where(inArray(transactions.accountId, ids))
    .orderBy(desc(transactions.date))
    .limit(5);

  return res.json(rows);
});

/** Debit vs credit overview chart on /accounts. */
accountsRouter.get("/debit-credit-overview", async (req, res) => {
  const userAccounts = await db.select().from(accounts).where(eq(accounts.userId, req.userId!));
  const ids = userAccounts.map((a) => a.id);
  if (ids.length === 0) return res.json({ months: [] });

  const rows = await db.select().from(transactions).where(inArray(transactions.accountId, ids));
  const months: Record<string, { debit: number; credit: number }> = {};
  for (const t of rows) {
    const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, "0")}`;
    months[key] ??= { debit: 0, credit: 0 };
    if (t.type === "expense") months[key].debit += t.amount;
    else months[key].credit += t.amount;
  }

  const sorted = Object.entries(months)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, v]) => ({ month, ...v }));

  return res.json({ months: sorted });
});
