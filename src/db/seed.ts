import "dotenv/config";
import { nanoid } from "nanoid";
import { db } from "./index.js";
import { accounts, authRequests, otpCodes, sessions, transactions, users } from "./schema.js";
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

// The MFA demo user. OTP is emailed here, so it must be a real inbox you can
// read. Password is the same across accounts for demo simplicity.
const SEED_USERS = [
  { name: "Ulysse Tadahy", email: "ulyssetadahy@gmail.com", role: "finance_officer" },
];

const ACCOUNT_DEFS = [
  { type: "current" as const, nickname: "Operating Current Account", balance: 482_350.75 },
  { type: "savings" as const, nickname: "Reserve Savings", balance: 915_020.4 },
  { type: "payroll" as const, nickname: "Payroll Disbursement Account", balance: 210_500 },
  { type: "business" as const, nickname: "Business Growth Account", balance: 76_430.1 },
];

async function clearAll() {
  // FK-safe order: children before parents.
  await db.delete(otpCodes);
  await db.delete(authRequests);
  await db.delete(sessions);
  await db.delete(transactions);
  await db.delete(accounts);
  await db.delete(users);
}

async function seedUser(def: (typeof SEED_USERS)[number]) {
  const userId = nanoid();
  await db.insert(users).values({
    id: userId,
    name: def.name,
    email: def.email,
    passwordHash: await hashPassword("Password123!"),
    avatarUrl: null,
    role: def.role,
  });

  const accountIds: string[] = [];
  for (const a of ACCOUNT_DEFS) {
    const id = nanoid();
    accountIds.push(id);
    await db.insert(accounts).values({
      id,
      userId,
      type: a.type,
      accountNumber: `TDVX${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      nickname: a.nickname,
      balance: a.balance,
      currency: "MUR",
    });
  }

  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  let txCount = 0;
  for (let daysAgo = 0; daysAgo < 90; daysAgo++) {
    const perDay = Math.random() < 0.6 ? 1 : Math.random() < 0.8 ? 2 : 0;
    for (let i = 0; i < perDay; i++) {
      const isIncome = Math.random() < 0.45;
      const id = nanoid();
      await db.insert(transactions).values({
        id,
        accountId: pick(accountIds),
        description: isIncome ? "Incoming payment" : "Outgoing payment",
        type: isIncome ? "income" : "expense",
        category: isIncome ? pick(CATEGORIES_INCOME) : pick(CATEGORIES_EXPENSE),
        counterparty: isIncome ? pick(COUNTERPARTIES_INCOME) : pick(COUNTERPARTIES_EXPENSE),
        amount: isIncome ? randomBetween(1500, 85000) : randomBetween(300, 42000),
        currency: "MUR",
        date: new Date(now - daysAgo * DAY - Math.floor(Math.random() * DAY)),
        receiptNumber: `TRX-${id.slice(0, 8).toUpperCase()}`,
      });
      txCount++;
    }
  }
  return txCount;
}

async function main() {
  console.log("Seeding tdvx-target MFA database (idempotent)...");
  await clearAll();

  let total = 0;
  for (const u of SEED_USERS) {
    total += await seedUser(u);
    console.log(`  seeded ${u.email} (${ACCOUNT_DEFS.length} accounts)`);
  }

  console.log(`Done: ${SEED_USERS.length} user(s), ${total} transactions.`);
  console.log("Login: ulyssetadahy@gmail.com / Password123!  (OTP emailed via Resend)");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
