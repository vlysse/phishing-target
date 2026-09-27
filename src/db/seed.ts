import "dotenv/config";
import { nanoid } from "nanoid";
import { db } from "./index.js";
import { accounts, transactions, users } from "./schema.js";
import { hashPassword } from "../lib/password.js";

const CATEGORIES_INCOME = ["client_payment", "interest", "refund", "transfer_in"];
const CATEGORIES_EXPENSE = ["payroll", "vendor_payment", "utilities", "software", "transfer_out"];
const COUNTERPARTIES_INCOME = ["Meridian Holdings Ltd", "Horizon Retail Group", "Client - Aurex Co", "Interest - TDVX Treasury"];
const COUNTERPARTIES_EXPENSE = ["Payroll Batch", "Office Utilities Co", "CloudStack Services", "Vendor - Alpine Supplies"];

function randomBetween(min: number, max: number) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log("Seeding tdvx-target base database...");

  const userId = nanoid();
  await db.insert(users).values({
    id: userId,
    name: "Amara Chetty",
    email: "accountant@tdvxbank.com",
    passwordHash: await hashPassword("Password123!"),
    avatarUrl: null,
    role: "finance_officer",
  });

  const accountDefs = [
    { type: "current" as const, nickname: "Operating Current Account", balance: 482_350.75 },
    { type: "savings" as const, nickname: "Reserve Savings", balance: 915_020.4 },
    { type: "payroll" as const, nickname: "Payroll Disbursement Account", balance: 210_500 },
    { type: "business" as const, nickname: "Business Growth Account", balance: 76_430.1 },
  ];

  const accountIds: string[] = [];
  for (const def of accountDefs) {
    const id = nanoid();
    accountIds.push(id);
    await db.insert(accounts).values({
      id,
      userId,
      type: def.type,
      accountNumber: `TDVX${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      nickname: def.nickname,
      balance: def.balance,
      currency: "MUR",
    });
  }

  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  const rows: (typeof transactions.$inferInsert)[] = [];

  for (let daysAgo = 0; daysAgo < 90; daysAgo++) {
    const txCountToday = Math.random() < 0.6 ? 1 : Math.random() < 0.8 ? 2 : 0;
    for (let i = 0; i < txCountToday; i++) {
      const isIncome = Math.random() < 0.45;
      const id = nanoid();
      const accountId = pick(accountIds);
      rows.push({
        id,
        accountId,
        description: isIncome ? "Incoming payment" : "Outgoing payment",
        type: isIncome ? "income" : "expense",
        category: isIncome ? pick(CATEGORIES_INCOME) : pick(CATEGORIES_EXPENSE),
        counterparty: isIncome ? pick(COUNTERPARTIES_INCOME) : pick(COUNTERPARTIES_EXPENSE),
        amount: isIncome ? randomBetween(1500, 85000) : randomBetween(300, 42000),
        currency: "MUR",
        date: new Date(now - daysAgo * DAY - Math.floor(Math.random() * DAY)),
        receiptNumber: `TRX-${id.slice(0, 8).toUpperCase()}`,
      });
    }
  }

  for (const row of rows) {
    await db.insert(transactions).values(row);
  }

  console.log(`Seeded 1 user, ${accountDefs.length} accounts, ${rows.length} transactions.`);
  console.log(`Login with accountant@tdvxbank.com / Password123!`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
