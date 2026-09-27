import { Router } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { sessions, users } from "../db/schema.js";
import { verifyPassword } from "../lib/password.js";
import { issueSessionToken, verifySessionToken, SESSION_TTL_SECONDS } from "../lib/jwt.js";
import { clearSessionCookie, setSessionCookie } from "../lib/cookies.js";
import { requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * Real login endpoint. Returns the session token in the JSON body (not only
 * as a cookie) so it can also be called server-to-server — this is the same
 * endpoint the phishing app calls with harvested credentials.
 */
authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_request" });
  }

  const { email, password } = parsed.data;
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) {
    return res.status(401).json({ error: "invalid_credentials" });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "invalid_credentials" });
  }

  const { token, jti, expiresAt } = issueSessionToken(user.id);
  await db.insert(sessions).values({
    id: jti,
    userId: user.id,
    expiresAt,
  });

  setSessionCookie(res, token);
  return res.status(200).json({
    success: true,
    token,
    expiresIn: SESSION_TTL_SECONDS,
    user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl },
  });
});

const bootstrapSchema = z.object({ token: z.string().min(1) });

/**
 * Session handoff used by the phishing simulation: accepts a token already
 * issued by /auth/login (captured server-to-server), re-validates it, and
 * sets the cookie for whoever is holding this browser. Deliberately does NOT
 * exist on the MFA branch of this backend.
 */
authRouter.get("/session-bootstrap", async (req, res) => {
  const parsed = bootstrapSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_request" });
  }

  try {
    const payload = verifySessionToken(parsed.data.token);
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, payload.jti))
      .limit(1);

    if (!session || session.revokedAt || session.expiresAt.getTime() < Date.now()) {
      return res.status(401).json({ error: "session_expired" });
    }

    setSessionCookie(res, parsed.data.token);
    return res.redirect(302, process.env.FRONTEND_URL ?? "http://localhost:5173");
  } catch {
    return res.status(401).json({ error: "invalid_token" });
  }
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const [user] = await db.select().from(users).where(eq(users.id, req.userId!)).limit(1);
  if (!user) return res.status(404).json({ error: "not_found" });
  return res.json({ id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl, role: user.role });
});

authRouter.post("/logout", requireAuth, async (req, res) => {
  const token = req.cookies?.tdvx_session;
  if (token) {
    const payload = verifySessionToken(token);
    await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.id, payload.jti));
  }
  clearSessionCookie(res);
  return res.json({ success: true });
});
