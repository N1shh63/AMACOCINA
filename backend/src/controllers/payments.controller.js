const { Preference } = require("mercadopago");
const { getMpClient } = require("../config/mercadopago");

function validateItems(items) {
  if (!Array.isArray(items) || items.length === 0) return "items vacío o inválido";

  for (const it of items) {
    const title = String(it.title ?? "").trim();
    const q = Number(it.quantity);
    const p = Number(it.unit_price);

    if (!title) return "item sin title";
    if (!Number.isInteger(q) || q <= 0) return "quantity inválida";
    if (!Number.isFinite(p) || p <= 0) return "unit_price inválido";
  }
  return null;
}

function normalizeItem(item) {
  return {
    id: String(item.id ?? ""),
    title: String(item.title ?? "Item"),
    quantity: Number(item.quantity ?? 1),
    unit_price: Number(item.unit_price ?? 0),
    currency_id: "ARS",
  };
}

async function createPreference(req, res, next) {
  try {
    const { items, customer, notes } = req.body || {};

    const error = validateItems(items);
    if (error) return res.status(400).json({ error });

    const FRONT_URL = (process.env.FRONT_URL || "http://127.0.0.1:5173").replace(/\/$/, "");
    const BACK_URL = (process.env.BACK_URL || "http://127.0.0.1:4000").replace(/\/$/, "");

    const IS_PROD = process.env.NODE_ENV === "production";

    // Webhook público (prioridad: MP_WEBHOOK_URL, sino BACK_URL + ruta)
    const NOTIFICATION_URL = (
      process.env.MP_WEBHOOK_URL || `${BACK_URL}/webhooks/mercadopago`
    ).replace(/\/$/, "");

    const back_urls = {
      success: `${FRONT_URL}/checkout/success`,
      failure: `${FRONT_URL}/checkout/failure`,
      pending: `${FRONT_URL}/checkout/pending`,
    };

    const body = {
      items: items.map(normalizeItem),
      back_urls,

      // En prod habilitamos el circuito completo
      ...(IS_PROD
        ? {
            auto_return: "approved",
            notification_url: NOTIFICATION_URL,
          }
        : {}),

      metadata: {
        customer: customer || null,
        notes: notes || null,
        source: "amacocina-web",
        back_end: BACK_URL,
      },
    };

    console.log("[MP] preference body ->", JSON.stringify(body, null, 2));

    const mp = getMpClient();
    const preference = new Preference(mp);
    const result = await preference.create({ body });

    return res.json({
      preference_id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
      back_urls_used: back_urls,
      mode: IS_PROD ? "production" : "local",
      notification_url_used: IS_PROD ? NOTIFICATION_URL : null,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { createPreference };