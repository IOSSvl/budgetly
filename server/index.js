import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { query } from "./db.js";
import { requireAuth, signToken } from "./auth.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3001);

function emptyPayload() {
  return {
    income: { salary: 0, investPct: 0, emergencyTarget: 0 },
    extras: [],
    upcomingPayments: [],
    categories: [
      { id: "categoria-base", name: "Categoria base", budget: 0, bucket: "salary", purpose: "expense", useSalary: true, useExtra: false, cadence: "variable" }
    ],
    transactions: [],
    recurring: [],
    goals: [],
    transfers: [],
    auditLog: [],
    profile: { displayName: "", compactMobile: false, showOnboarding: true, theme: "sand" },
    assets: [
      { id: "a1", name: "Conto principale", value: 0 }
    ]
  };
}

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.static(process.cwd()));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: "Campi mancanti" });
  const passwordHash = await bcrypt.hash(password, 10);
  const id = crypto.randomUUID();
  try {
    await query(
      "INSERT INTO users (id, name, email, password_hash) VALUES ($1, $2, $3, $4)",
      [id, name.trim(), email.toLowerCase().trim(), passwordHash]
    );
    await query(
      `INSERT INTO user_budget_data (user_id, payload, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (user_id) DO NOTHING`,
      [id, JSON.stringify(emptyPayload())]
    );
  } catch (err) {
    if (String(err.message).includes("users_email_key")) {
      return res.status(409).json({ error: "Email già registrata" });
    }
    return res.status(500).json({ error: "Errore registrazione" });
  }
  const token = signToken({ id, name, email });
  return res.json({ token, user: { id, name, email } });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Campi mancanti" });
  const result = await query("SELECT id, name, email, password_hash FROM users WHERE email = $1", [
    email.toLowerCase().trim()
  ]);
  const user = result.rows[0];
  if (!user) return res.status(401).json({ error: "Credenziali non valide" });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Credenziali non valide" });
  const token = signToken(user);
  return res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

app.get("/api/me", requireAuth, (req, res) => {
  res.json({ user: { id: req.user.sub, name: req.user.name, email: req.user.email } });
});

app.get("/api/data", requireAuth, async (req, res) => {
  const result = await query("SELECT payload, updated_at FROM user_budget_data WHERE user_id = $1", [req.user.sub]);
  if (result.rows[0]?.payload) {
    return res.json({ payload: result.rows[0].payload, updatedAt: result.rows[0].updated_at });
  }
  const payload = emptyPayload();
  const writeResult = await query(
    `INSERT INTO user_budget_data (user_id, payload, updated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (user_id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
     RETURNING updated_at`,
    [req.user.sub, JSON.stringify(payload)]
  );
  return res.json({ payload, updatedAt: writeResult.rows?.[0]?.updated_at || new Date().toISOString() });
});

app.put("/api/data", requireAuth, async (req, res) => {
  const { payload } = req.body || {};
  if (!payload || typeof payload !== "object") return res.status(400).json({ error: "Payload non valido" });
  const result = await query(
    `INSERT INTO user_budget_data (user_id, payload, updated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (user_id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
     RETURNING updated_at`,
    [req.user.sub, JSON.stringify(payload)]
  );
  res.json({ ok: true, updatedAt: result.rows?.[0]?.updated_at || new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Budgetly server attivo su http://localhost:${PORT}`);
});
