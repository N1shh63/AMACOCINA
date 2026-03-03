const { Preference } = require("mercadopago");
const { getMpClient } = require("../config/mercadopago");

function validateItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return "items vacío o inválido";
  }

  for (const it of items) {
    if (!it.title) return "item sin title";
    if (!Number.isInteger(Number(it.quantity)) || Number(it.quantity) <= 0) {
      return "quantity inválida";
    }
    if (!Number.isFinite(Number(it.unit_price)) || Number(it.unit_price) <= 0) {
      return "unit_price inválido";
    }
  }

  return null;
}

function normalizeItem(item) {
  return {
    title: String(item.title),
    quantity: Number(item.quantity),
    unit_price: Number(item.unit_price),
    currency_id: "ARS"
  };
}

async function createPreference(req, res, next) {
  try {
    const { items } = req.body || {};

    const error = validateItems(items);
    if (error) return res.status(400).json({ error });

    const FRONT_URL = process.env.FRONT_URL;

    const body = {
      items: items.map(normalizeItem),
      back_urls: {
        success: `${FRONT_URL}/checkout/success`,
        failure: `${FRONT_URL}/checkout/failure`,
        pending: `${FRONT_URL}/checkout/pending`
      }
    };

    const mp = getMpClient();
    const preference = new Preference(mp);

    const result = await preference.create({ body });

    return res.json({
      preference_id: result.id,
      init_point: result.init_point
    });

  } catch (err) {
    console.error("[MP ERROR]", err);
    return res.status(500).json({
      error: "MercadoPago error",
      detail: err?.message
    });
  }
}

module.exports = { createPreference };