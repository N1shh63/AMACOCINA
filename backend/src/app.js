const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const express = require("express");
const cors = require("cors");

const paymentsRoutes = require("./routes/payments.routes");
const ordersRoutes = require("./routes/orders.routes");
const adminRoutes = require("./routes/admin.routes");

const app = express();

// --- CORS pro: allowlist + previews Vercel ---
const allowlist = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  process.env.FRONT_URL,
].filter(Boolean);

// Si querés permitir previews de Vercel (recomendado para test):
const vercelPreviewRegex = /^https:\/\/.*\.vercel\.app$/;

app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir requests sin origin (ej: Postman, webhooks server-to-server)
      if (!origin) return callback(null, true);

      if (allowlist.includes(origin)) return callback(null, true);
      if (vercelPreviewRegex.test(origin)) return callback(null, true);

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.type("text").send("OK");
});

app.get("/health", (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.use("/orders", ordersRoutes);
app.use("/payments", paymentsRoutes);
app.use("/admin", adminRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error("[API ERROR]", err);
  res.status(500).json({ error: "Internal Server Error", detail: err?.message });
});

module.exports = app;