const { createToken } = require("../middleware/authAdmin");

function postLogin(req, res) {
  const rawUsername = req.body?.username;
  const rawPassword = req.body?.password;
  const username = String(rawUsername ?? "").trim();
  const password = String(rawPassword ?? "");

  const expectedUser = process.env.ADMIN_USER;
  const expectedPassword = process.env.ADMIN_PASSWORD;

  const hasUser = Boolean(expectedUser && String(expectedUser).trim());
  const hasPass = Boolean(expectedPassword);

  if (!hasUser || !hasPass) {
    return res.status(500).json({ error: "Admin login not configured" });
  }

  const expectedUserNorm = String(expectedUser).trim();
  const expectedPasswordStr = String(expectedPassword);

  if (username !== expectedUserNorm || password !== expectedPasswordStr) {
    return res.status(401).json({ error: "Credenciales incorrectas" });
  }

  const token = createToken(username);
  return res.json({ success: true, token });
}

module.exports = { postLogin };
