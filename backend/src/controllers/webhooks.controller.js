async function mercadopagoWebhook(req, res) {
  // MP puede mandar info por query y/o body.
  console.log("[WEBHOOK] query:", req.query);
  console.log("[WEBHOOK] body:", req.body);

  // Siempre responder 200 rápido para evitar reintentos.
  return res.sendStatus(200);
}

module.exports = { mercadopagoWebhook };