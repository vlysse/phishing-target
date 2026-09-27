import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  avatarUrl: text("avatar_url"),
  role: text("role").notNull().default("accountant"),
  preferences: text("preferences", { mode: "json" })
    .$type<{ language: string; theme: "light" | "dark" | "system"; emailNotifications: boolean }>()
    .notNull()
    .default(sql`'{"language":"en","theme":"system","emailNotifications":true}'`),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["savings", "current", "business", "payroll"] }).notNull(),
  accountNumber: text("account_number").notNull().unique(),
  nickname: text("nickname").notNull(),
  balance: real("balance").notNull().default(0),
  currency: text("currency").notNull().default("MUR"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey(),
  accountId: text("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  type: text("type", { enum: ["income", "expense"] }).notNull(),
  category: text("category").notNull().default("general"),
  counterparty: text("counterparty").notNull(),
  amount: real("amount").notNull(),
  currency: text("currency").notNull().default("MUR"),
  date: integer("date", { mode: "timestamp" }).notNull(),
  receiptNumber: text("receipt_number").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(), // jti embedded in the JWT
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  authRequestId: text("auth_request_id"), // set by MFA branch only; nullable here
  issuedAt: integer("issued_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  revokedAt: integer("revoked_at", { mode: "timestamp" }),
});
