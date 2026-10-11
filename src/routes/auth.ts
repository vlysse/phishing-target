import { Router } from "express";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "../db/index.js";
import { authRequests, otpCodes, sessions, users } from "../db/schema.js";
import { verifyPassword } from "../lib/password.js";
import { issueSessionToken, verifySessionToken, SESSION_TTL_SECONDS } from "../lib/jwt.js";
import { clearSessionCookie, setSessionCookie } from "../lib/cookies.js";
import { generateOtp, hashOtp, verifyOtp, OTP_TTL_MS, OTP_MAX_ATTEMPTS } from "../lib/otp.js";
import { sendOtpEmail } from "../lib/email.js";
import { requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

// The email link must be a PUBLIC url — a localhost/private link is a spam
// signal. Locally, the 6-digit code is the primary path; the button points at
// the deployed app. Falls back to APP_URL only if no public url is set.
const EMAIL_LINK_BASE = process.env.PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:5174";
const verifyUrlFor = (authReqId: string) =>
  `${EMAIL_LINK_BASE}/auth/mfa?authreqid=${encodeURIComponent(authReqId)}`;

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * Step-up MFA login — step 1. Verifies the password, emails a one-time code,
 * AND issues a session + cookie whose `status` is `pending_mfa`. The cookie
 * carries the user through the handoff to the app subdomain so the MFA gate
 * can be rendered there, but no protected endpoint will accept the session
 * until /auth/otp promotes it to `active`.
 *
 * The response shape mirrors the base (non-MFA) backend on purpose: a generic
 * credential-replay tool receives `{ success: true, token, ... }` and happily
 * forwards the victim onto the real app — where it hits a gate it cannot pass.
 */
authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_request" });

  const { email, password } = parsed.data;
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return res.status(401).json({ error: "invalid_credentials" });
  }

  const authReqId = nanoid();
  const now = Date.now();
  await db.insert(authRequests).values({
    id: authReqId,
    userId: user.id,
    status: "pending",
    expiresAt: new Date(now + OTP_TTL_MS),
  });

  const code = generateOtp();
  await db.insert(otpCodes).values({
    id: nanoid(),
    authRequestId: authReqId,
    codeHash: await hashOtp(code),
    channel: "email",
    expiresAt: new Date(now + OTP_TTL_MS),
  });

  try {
    await sendOtpEmail(user.email, code, verifyUrlFor(authReqId));
  } catch {
    return res.status(502).json({ error: "otp_email_failed" });
  }

  // Mint the pending session: cookie travels, but middleware refuses it until
  // the OTP step promotes the row to `status='active'`.
  const { token, jti, expiresAt } = issueSessionToken(user.id);
  await db.insert(sessions).values({
    id: jti,
    userId: user.id,
    authRequestId: authReqId,
    status: "pending_mfa",
    expiresAt,
  });

  setSessionCookie(res, token);
  return res.status(200).json({
    success: true,
    token,
    mfaRequired: true,
    authReqId,
    expiresIn: SESSION_TTL_SECONDS,
    user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl },
  });
});

const otpSchema = z.object({
  authReqId: z.string().min(1),
  code: z.string().length(6),
});

/**
 * Step-up MFA login — step 2. Validates the code against the pending auth
 * request, marks the OTP single-use, and promotes the caller's pending session
 * to `active`. If no pending session is attached to the request (direct OTP
 * post with no prior cookie), falls back to minting a fresh active session.
 */
authRouter.post("/otp", async (req, res) => {
  const parsed = otpSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_request" });

  const { authReqId, code } = parsed.data;

  const [authReq] = await db.select().from(authRequests).where(eq(authRequests.id, authReqId)).limit(1);
  if (!authReq || authReq.status !== "pending" || authReq.expiresAt.getTime() < Date.now()) {
    return res.status(400).json({ error: "auth_request_invalid" });
  }

  const [otp] = await db.select().from(otpCodes).where(eq(otpCodes.authRequestId, authReqId)).limit(1);
  if (!otp || otp.consumedAt || otp.expiresAt.getTime() < Date.now()) {
    return res.status(400).json({ error: "otp_expired" });
  }
  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    await db.update(authRequests).set({ status: "expired" }).where(eq(authRequests.id, authReqId));
    return res.status(429).json({ error: "too_many_attempts" });
  }

  const ok = await verifyOtp(code, otp.codeHash);
  if (!ok) {
    await db.update(otpCodes).set({ attempts: otp.attempts + 1 }).where(eq(otpCodes.id, otp.id));
    return res.status(401).json({ error: "invalid_code" });
  }

  // Single-use: consume the code and close the auth request.
  await db.update(otpCodes).set({ consumedAt: new Date() }).where(eq(otpCodes.id, otp.id));
  await db.update(authRequests).set({ status: "verified" }).where(eq(authRequests.id, authReqId));

  // Promote the pending session that /auth/login minted for this authReqId.
  const [pending] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.authRequestId, authReqId), eq(sessions.status, "pending_mfa")))
    .limit(1);

  if (pending) {
    await db.update(sessions).set({ status: "active" }).where(eq(sessions.id, pending.id));
    return res.status(200).json({ success: true, expiresIn: SESSION_TTL_SECONDS });
  }

  // Fallback: no pending session on record (direct OTP post without the login
  // cookie). Mint a fresh active session so the flow still completes.
  const { token, jti, expiresAt } = issueSessionToken(authReq.userId);
  await db.insert(sessions).values({
    id: jti,
    userId: authReq.userId,
    authRequestId: authReqId,
    status: "active",
    expiresAt,
  });

  setSessionCookie(res, token);
  return res.status(200).json({ success: true, expiresIn: SESSION_TTL_SECONDS });
});

/** Resend a fresh code for an existing pending auth request. */
authRouter.post("/otp/resend", async (req, res) => {
  const authReqId = String(req.body?.authReqId ?? "");
  const [authReq] = await db.select().from(authRequests).where(eq(authRequests.id, authReqId)).limit(1);
  if (!authReq || authReq.status !== "pending") {
    return res.status(400).json({ error: "auth_request_invalid" });
  }

  const [user] = await db.select().from(users).where(eq(users.id, authReq.userId)).limit(1);
  if (!user) return res.status(404).json({ error: "not_found" });

  const now = Date.now();
  await db.update(authRequests).set({ expiresAt: new Date(now + OTP_TTL_MS) }).where(eq(authRequests.id, authReqId));

  const code = generateOtp();
  await db
    .update(otpCodes)
    .set({ codeHash: await hashOtp(code), attempts: 0, consumedAt: null, expiresAt: new Date(now + OTP_TTL_MS) })
    .where(eq(otpCodes.authRequestId, authReqId));

  try {
    await sendOtpEmail(user.email, code, verifyUrlFor(authReqId));
  } catch {
    return res.status(502).json({ error: "otp_email_failed" });
  }
  return res.json({ ok: true });
});

const bootstrapSchema = z.object({ token: z.string().min(1) });

/**
 * The post-handoff redirect target used by the phishing simulation. Accepts
 * the token already issued by /auth/login (captured server-to-server),
 * re-validates it, and sets the cookie on the browser now holding this
 * session. The session will still be `pending_mfa` on arrival — the FE will
 * render the OTP gate on the app subdomain, where the attacker cannot clear
 * it. This is the demo's whole point: the phisher gets further than the base
 * target would allow, but still hits a wall.
 */
function resolveFrontendUrl(): string {
  const raw = (process.env.FRONTEND_URL ?? "http://localhost:5174").trim();
  if (/^https?:\/\//.test(raw)) return raw;
  return `https://${raw.replace(/^\/+/, "")}`;
}

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
    return res.redirect(302, resolveFrontendUrl());
  } catch {
    return res.status(401).json({ error: "invalid_token" });
  }
});

/**
 * Returns the current user. A pending_mfa session is accepted here so the FE
 * can show the account on the OTP gate — but the response carries
 * `mfaRequired: true` + `authReqId` so the FE knows to render the gate rather
 * than the dashboard. Protected endpoints keep enforcing active status.
 */
authRouter.get("/me", async (req, res) => {
  const token = req.cookies?.tdvx_session;
  if (!token) return res.status(401).json({ error: "not_authenticated" });

  try {
    const payload = verifySessionToken(token);
    const [session] = await db.select().from(sessions).where(eq(sessions.id, payload.jti)).limit(1);
    if (!session || session.revokedAt || session.expiresAt.getTime() < Date.now()) {
      return res.status(401).json({ error: "session_expired" });
    }

    const [user] = await db.select().from(users).where(eq(users.id, payload.sub)).limit(1);
    if (!user) return res.status(404).json({ error: "not_found" });

    const base = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      role: user.role,
    };

    if (session.status === "pending_mfa") {
      return res.json({ ...base, mfaRequired: true, authReqId: session.authRequestId });
    }
    return res.json(base);
  } catch {
    return res.status(401).json({ error: "invalid_token" });
  }
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
