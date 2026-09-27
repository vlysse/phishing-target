import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import "express-async-errors";
import { accountsRouter } from "./routes/accounts.js";
import { authRouter } from "./routes/auth.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { settingsRouter } from "./routes/settings.js";
import { transactionsRouter } from "./routes/transactions.js";
import { transferRouter } from "./routes/transfer.js";

const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/auth", authRouter);
app.use("/dashboard", dashboardRouter);
app.use("/accounts", accountsRouter);
app.use("/transactions", transactionsRouter);
app.use("/transfer", transferRouter);
app.use("/settings", settingsRouter);

// Catches anything thrown/rejected in a route (express-async-errors forwards
// async errors here too) so a bug returns a clean 500 instead of hanging the
// request — this is what previously left the frontend stuck on a bad cookie
// option with no response ever sent.
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  if (res.headersSent) return;
  res.status(500).json({ error: "internal_error" });
});

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`tdvx-target backend (base) listening on :${port}`);
});
