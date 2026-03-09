function postLogin(req, res) {
  const username = req.body?.username;
  const password = req.body?.password;

  const expectedUser = process.env.ADMIN_USER;
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedUser || !expectedPassword) {
    return res.status(500).json({ error: "Admin login not configured" });
  }

  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    username.trim() !== expectedUser.trim() ||
    password !== expectedPassword
  ) {
    return res.status(401).json({ error: "Credenciales incorrectas" });
  }

  return res.json({ success: true });
}

module.exports = { postLogin };
