import { Router } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { requireAuth } from "../middleware/auth.js";

export const settingsRouter = Router();
settingsRouter.use(requireAuth);

const profileSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
});

settingsRouter.get("/profile", async (req, res) => {
  const [user] = await db.select().from(users).where(eq(users.id, req.userId!)).limit(1);
  if (!user) return res.status(404).json({ error: "not_found" });
  return res.json({ name: user.name, email: user.email, avatarUrl: user.avatarUrl, role: user.role });
});

settingsRouter.patch("/profile", async (req, res) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_request" });

  await db.update(users).set(parsed.data).where(eq(users.id, req.userId!));
  return res.json({ success: true });
});

const preferencesSchema = z.object({
  language: z.string().min(2).optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  emailNotifications: z.boolean().optional(),
});

settingsRouter.get("/preferences", async (req, res) => {
  const [user] = await db.select().from(users).where(eq(users.id, req.userId!)).limit(1);
  if (!user) return res.status(404).json({ error: "not_found" });
  return res.json(user.preferences);
});

settingsRouter.patch("/preferences", async (req, res) => {
  const parsed = preferencesSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_request" });

  const [user] = await db.select().from(users).where(eq(users.id, req.userId!)).limit(1);
  if (!user) return res.status(404).json({ error: "not_found" });

  const next = { ...user.preferences, ...parsed.data };
  await db.update(users).set({ preferences: next }).where(eq(users.id, req.userId!));
  return res.json(next);
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

settingsRouter.post("/security/password", async (req, res) => {
  const parsed = passwordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_request" });

  const [user] = await db.select().from(users).where(eq(users.id, req.userId!)).limit(1);
  if (!user) return res.status(404).json({ error: "not_found" });

  const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!valid) return res.status(401).json({ error: "invalid_current_password" });

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await db.update(users).set({ passwordHash }).where(eq(users.id, req.userId!));
  return res.json({ success: true });
});
