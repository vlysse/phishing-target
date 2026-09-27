import { Router } from "express";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import { accounts, transactions } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";

export const transactionsRouter = Router();
transactionsRouter.use(requireAuth);

transactionsRouter.get("/", async (req, res) => {
  const userAccounts = await db.select().from(accounts).where(eq(accounts.userId, req.userId!));
  const accountIds = userAccounts.map((a) => a.id);
  if (accountIds.length === 0) return res.json({ items: [], total: 0, page: 1, pageSize: 10 });

  const type = typeof req.query.type === "string" ? req.query.type : "all";
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 10));

  const filters = [inArray(transactions.accountId, accountIds)];
  if (type === "income" || type === "expense") {
    filters.push(eq(transactions.type, type));
  }

  const rows = await db
    .select()
    .from(transactions)
    .where(and(...filters))
    .orderBy(desc(transactions.date));

  const total = rows.length;
  const items = rows.slice((page - 1) * pageSize, page * pageSize);
  const accountById = new Map(userAccounts.map((a) => [a.id, a]));

  return res.json({
    items: items.map((t) => ({ ...t, accountNickname: accountById.get(t.accountId)?.nickname })),
    total,
    page,
    pageSize,
  });
});

transactionsRouter.get("/:id", async (req, res) => {
  const [tx] = await db.select().from(transactions).where(eq(transactions.id, req.params.id)).limit(1);
  if (!tx) return res.status(404).json({ error: "not_found" });

  const [account] = await db.select().from(accounts).where(eq(accounts.id, tx.accountId)).limit(1);
  if (!account || account.userId !== req.userId) return res.status(404).json({ error: "not_found" });

  return res.json({ ...tx, account: { nickname: account.nickname, accountNumber: account.accountNumber } });
});
