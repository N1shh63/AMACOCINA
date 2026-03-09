function postLogin(req, res) {
  // Logs temporales diagnóstico (quitar en producción)
  console.log("ADMIN_USER:", process.env.ADMIN_USER);
  console.log("ADMIN_PASSWORD exists:", !!process.env.ADMIN_PASSWORD);
  console.log("admin login body:", req.body);

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

  return res.json({ success: true });
}

module.exports = { postLogin };
