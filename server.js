require("dotenv").config();
const express = require("express");
const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");
const multer = require("multer");
const cookieSession = require("cookie-session");

const app = express();
const PORT = process.env.PORT || 3000;
const root = __dirname;
const uploadDir = path.join(root, "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const db = new Database(path.join(root, "solomon.db"));
db.exec(fs.readFileSync(path.join(root, "database", "schema.sql"), "utf8"));

const plans = {
  "VIP 2 Odds": { rollover: "₦5,000", duration: "7 days" },
  "VIP 5 Odds": { rollover: "₦3,000", duration: "4 days" },
  "1.50 Odds": { rollover: "₦5,000", duration: "7 days" }
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: "solomon_session",
  keys: [process.env.SESSION_SECRET || "change-this-secret"],
  httpOnly: true,
  sameSite: "lax",
  secure: false
}));

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safe}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    cb(null, allowed.includes(file.mimetype));
  }
});

function requireAdmin(req, res, next) {
  if (!req.session.admin) return res.status(401).json({ error: "Unauthorized" });
  next();
}

app.use("/uploads", express.static(uploadDir));
app.use(express.static(path.join(root, "public")));

app.get("/api/config", (req, res) => {
  res.json({
    paymentName: process.env.PAYMENT_NAME || "DANIEL CHINOSO IGWE",
    paymentAccount: process.env.PAYMENT_ACCOUNT || "8115739112",
    paymentProvider: process.env.PAYMENT_PROVIDER || "Palmpay",
    plans
  });
});

app.get("/api/predictions", (req, res) => {
  const rows = db.prepare("SELECT * FROM predictions ORDER BY created_at DESC, id DESC").all();
  res.json(rows);
});

app.post("/api/vip-request", upload.single("screenshot"), (req, res) => {
  const { payerName, plan, reference } = req.body;
  if (!payerName || !plan || !plans[plan]) {
    return res.status(400).json({ error: "Please provide your name and a valid VIP plan." });
  }
  const screenshotPath = req.file ? `/uploads/${req.file.filename}` : null;
  const info = db.prepare(`
    INSERT INTO vip_requests (payer_name, plan, reference, screenshot_path)
    VALUES (?, ?, ?, ?)
  `).run(payerName.trim(), plan, reference || "", screenshotPath);

  res.json({
    ok: true,
    requestId: info.lastInsertRowid,
    message: "Your payment submission is pending admin review."
  });
});

app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (
    username === (process.env.ADMIN_USERNAME || "Divine") &&
    password === (process.env.ADMIN_PASSWORD || "change-me")
  ) {
    req.session.admin = true;
    return res.json({ ok: true });
  }
  res.status(401).json({ error: "Invalid login details." });
});

app.post("/api/admin/logout", requireAdmin, (req, res) => {
  req.session = null;
  res.json({ ok: true });
});

app.get("/api/admin/status", (req, res) => {
  res.json({ authenticated: !!req.session.admin });
});

app.get("/api/admin/requests", requireAdmin, (req, res) => {
  res.json(db.prepare("SELECT * FROM vip_requests ORDER BY created_at DESC, id DESC").all());
});

app.post("/api/admin/requests/:id/status", requireAdmin, (req, res) => {
  const { status } = req.body;
  if (!["approved", "rejected", "pending"].includes(status)) {
    return res.status(400).json({ error: "Invalid status." });
  }
  const request = db.prepare("SELECT * FROM vip_requests WHERE id = ?").get(req.params.id);
  if (!request) return res.status(404).json({ error: "Request not found." });

  let expiresAt = null;
  if (status === "approved") {
    const days = plans[request.plan].duration.match(/\d+/)[0];
    const d = new Date();
    d.setDate(d.getDate() + Number(days));
    expiresAt = d.toISOString();
  }
  db.prepare("UPDATE vip_requests SET status = ?, expires_at = ? WHERE id = ?")
    .run(status, expiresAt, req.params.id);
  res.json({ ok: true });
});

app.post("/api/admin/predictions", requireAdmin, (req, res) => {
  const { sport, title, pick, odds, confidence, isFree } = req.body;
  if (!sport || !title || !pick) return res.status(400).json({ error: "Sport, title and pick are required." });
  const result = db.prepare(`
    INSERT INTO predictions (sport, title, pick, odds, confidence, is_free)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(sport, title, pick, odds || "", confidence || "", isFree ? 1 : 0);
  res.json({ ok: true, id: result.lastInsertRowid });
});

app.delete("/api/admin/predictions/:id", requireAdmin, (req, res) => {
  db.prepare("DELETE FROM predictions WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Solomon Prediction running at http://localhost:${PORT}`);
});