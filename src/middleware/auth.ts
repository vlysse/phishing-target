import type { NextFunction, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { sessions } from "../db/schema.js";
import { SESSION_COOKIE_NAME } from "../lib/cookies.js";
import { verifySessionToken } from "../lib/jwt.js";

declare module "express-serve-static-core" {
  interface Request {
    userId?: string;
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: "not_authenticated" });
  }

  try {
    const payload = verifySessionToken(token);
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, payload.jti))
      .limit(1);

    if (!session || session.revokedAt || session.expiresAt.getTime() < Date.now()) {
      return res.status(401).json({ error: "session_expired" });
    }

    // A pending_mfa cookie travels but cannot reach protected routes until
    // /auth/otp promotes it. The FE reads this response to render the gate.
    if (session.status === "pending_mfa") {
      return res.status(403).json({ error: "mfa_required", authReqId: session.authRequestId });
    }

    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: "invalid_token" });
  }
}
