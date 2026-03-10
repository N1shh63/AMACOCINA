const crypto = require("crypto");

const SECRET = process.env.ADMIN_PASSWORD || "admin-secret-change-me";
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

function createToken(username) {
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = JSON.stringify({ sub: username, exp });
  const payloadB64 = Buffer.from(payload, "utf8").toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(payloadB64).digest("base64url");
  return `${payloadB64}.${sig}`;
}

function verifyToken(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.trim().split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;
  const expectedSig = crypto.createHmac("sha256", SECRET).update(payloadB64).digest("base64url");
  if (expectedSig !== sig) return null;
  let payload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!payload.exp || Date.now() > payload.exp) return null;
  return payload.sub;
}

function authAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: "No autorizado. Iniciá sesión en /admin/login." });
  }
  req.adminUser = user;
  next();
}

module.exports = { createToken, verifyToken, authAdmin };
