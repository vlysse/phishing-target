import { Router } from "express";
import { and, eq, gte, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import { accounts, transactions } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

async function userAccountIds(userId: string) {
  const rows = await db.select({ id: accounts.id }).from(accounts).where(eq(accounts.userId, userId));
  return rows.map((r) => r.id);
}

/** Weekly ledger activity: net income vs expense per day for the last 7 days. */
dashboardRouter.get("/ledger", async (req, res) => {
  const ids = await userAccountIds(req.userId!);
  if (ids.length === 0) return res.json({ days: [] });

  const since = new Date();
  since.setDate(since.getDate() - 6);
  since.setHours(0, 0, 0, 0);

  const rows = await db
    .select()
    .from(transactions)
    .where(and(inArray(transactions.accountId, ids), gte(transactions.date, since)));

  const days: Record<string, { income: number; expense: number }> = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    days[d.toISOString().slice(0, 10)] = { income: 0, expense: 0 };
  }
  for (const t of rows) {
    const key = t.date.toISOString().slice(0, 10);
    if (!days[key]) continue;
    if (t.type === "income") days[key].income += t.amount;
    else days[key].expense += t.amount;
  }

  return res.json({
    days: Object.entries(days).map(([date, v]) => ({ date, ...v })),
  });
});

/** Transaction statistics card: totals + trend vs previous period. */
dashboardRouter.get("/stats", async (req, res) => {
  const ids = await userAccountIds(req.userId!);
  if (ids.length === 0) {
    return res.json({ income: 0, expense: 0, net: 0, count: 0, incomeTrendPct: 0, expenseTrendPct: 0 });
  }

  const rows = await db.select().from(transactions).where(inArray(transactions.accountId, ids));
  const now = Date.now();
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
  const current = rows.filter((t) => now - t.date.getTime() <= THIRTY_DAYS);
  const previous = rows.filter(
    (t) => now - t.date.getTime() > THIRTY_DAYS && now - t.date.getTime() <= THIRTY_DAYS * 2,
  );

  const sum = (list: typeof rows, type: "income" | "expense") =>
    list.filter((t) => t.type === type).reduce((acc, t) => acc + t.amount, 0);

  const income = sum(current, "income");
  const expense = sum(current, "expense");
  const prevIncome = sum(previous, "income");
  const prevExpense = sum(previous, "expense");

  const pctChange = (curr: number, prev: number) => (prev === 0 ? 0 : Math.round(((curr - prev) / prev) * 100));

  return res.json({
    income,
    expense,
    net: income - expense,
    count: current.length,
    incomeTrendPct: pctChange(income, prevIncome),
    expenseTrendPct: pctChange(expense, prevExpense),
  });
});

/** Balance history graph: running total balance per week for the last ~12 weeks. */
dashboardRouter.get("/balance-history", async (req, res) => {
  const userAccounts = await db.select().from(accounts).where(eq(accounts.userId, req.userId!));
  const ids = userAccounts.map((a) => a.id);
  const currentTotal = userAccounts.reduce((acc, a) => acc + a.balance, 0);
  if (ids.length === 0) return res.json({ weeks: [] });

  const rows = await db
    .select()
    .from(transactions)
    .where(inArray(transactions.accountId, ids))
    .orderBy(transactions.date);

  const WEEKS = 12;
  const weekStart = (weeksAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - weeksAgo * 7);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // Walk backwards from today's known balance, undoing each week's net delta.
  const netByWeek: number[] = new Array(WEEKS).fill(0);
  for (const t of rows) {
    const daysAgo = Math.floor((Date.now() - t.date.getTime()) / (24 * 60 * 60 * 1000));
    const weekIndex = Math.min(WEEKS - 1, Math.floor(daysAgo / 7));
    netByWeek[weekIndex] += t.type === "income" ? t.amount : -t.amount;
  }

  const weeks: { weekStart: string; balance: number }[] = [];
  let runningBalance = currentTotal;
  for (let i = 0; i < WEEKS; i++) {
    weeks.unshift({ weekStart: weekStart(i).toISOString().slice(0, 10), balance: Math.round(runningBalance * 100) / 100 });
    runningBalance -= netByWeek[i];
  }

  return res.json({ weeks });
});

/** Accounts the quick-transfer card can offer as a source. */
dashboardRouter.get("/quick-transfer-accounts", async (req, res) => {
  const rows = await db.select().from(accounts).where(eq(accounts.userId, req.userId!));
  return res.json(
    rows.map((a) => ({ id: a.id, nickname: a.nickname, type: a.type, balance: a.balance, currency: a.currency })),
  );
});
