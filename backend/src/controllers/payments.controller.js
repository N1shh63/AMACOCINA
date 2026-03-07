const { Preference, MerchantOrder } = require("mercadopago");
const { getMpClient } = require("../config/mercadopago");

function buildRequestId() {
  return `mp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function validateItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return "items vacío o inválido";
  }

  for (const it of items) {
    if (!it.title) return "item sin title";

    const quantity = Number(it.quantity);
    const unitPrice = Number(it.unit_price);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return "quantity inválida";
    }

    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
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
    currency_id: "ARS",
  };
}

async function createPreference(req, res) {
  const requestId = buildRequestId();

  try {
    console.log(`\n[MP][${requestId}] ===== INICIO createPreference =====`);
    console.log(`[MP][${requestId}] body recibido:`, JSON.stringify(req.body, null, 2));

    const { items } = req.body || {};

    const error = validateItems(items);
    if (error) {
      console.error(`[MP][${requestId}] validación fallida:`, error);
      return res.status(400).json({ error, requestId });
    }

    const FRONT_URL = (process.env.FRONT_URL || "").replace(/\/$/, "");
    const BACK_URL = (process.env.BACK_URL || "").replace(/\/$/, "");
    const NODE_ENV = process.env.NODE_ENV || "undefined";

    console.log(`[MP][${requestId}] NODE_ENV:`, NODE_ENV);
    console.log(`[MP][${requestId}] FRONT_URL:`, FRONT_URL || "NO_CONFIGURADO");
    console.log(`[MP][${requestId}] BACK_URL:`, BACK_URL || "NO_CONFIGURADO");

    if (!FRONT_URL) {
      console.error(`[MP][${requestId}] FRONT_URL no configurado`);
      return res.status(500).json({
        error: "FRONT_URL no configurado en producción",
        requestId,
      });
    }

    const normalizedItems = items.map(normalizeItem);

    const body = {
      items: normalizedItems,
      back_urls: {
        success: `${FRONT_URL}/checkout/success`,
        failure: `${FRONT_URL}/checkout/failure`,
        pending: `${FRONT_URL}/checkout/pending`,
      },
      auto_return: "approved",
      external_reference: `amacocina_${requestId}`,
      statement_descriptor: "AMACOCINA",
      metadata: {
        request_id: requestId,
        source: "amacocina-web",
      },
    };

    if (BACK_URL) {
      body.notification_url = `${BACK_URL}/payments/webhook`;
    }

    console.log(`[MP][${requestId}] items normalizados:`, JSON.stringify(normalizedItems, null, 2));
    console.log(`[MP][${requestId}] body enviado a preferencia:`);
    console.log(JSON.stringify(body, null, 2));

    const mp = getMpClient();
    const preference = new Preference(mp);
    const result = await preference.create({ body });

    console.log(`[MP][${requestId}] preference creada OK`);
    console.log(`[MP][${requestId}] preference_id:`, result?.id);
    console.log(`[MP][${requestId}] init_point:`, result?.init_point);
    console.log(`[MP][${requestId}] sandbox_init_point:`, result?.sandbox_init_point);

    try {
      console.log(
        `[MP][${requestId}] respuesta completa MP:`,
        JSON.stringify(result, null, 2)
      );
    } catch (_) {
      console.log(`[MP][${requestId}] no se pudo serializar result completo`);
    }

    console.log(`[MP][${requestId}] ===== FIN createPreference OK =====\n`);

    return res.json({
      preference_id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point || null,
      mode: "production",
      requestId,
    });
  } catch (err) {
    console.error(`\n[MP][${requestId}] ===== ERROR createPreference =====`);
    console.error(`[MP][${requestId}] message:`, err?.message);
    console.error(`[MP][${requestId}] name:`, err?.name);
    console.error(`[MP][${requestId}] status:`, err?.status);
    console.error(`[MP][${requestId}] cause:`, err?.cause);
    console.error(`[MP][${requestId}] stack:`, err?.stack);

    if (err?.response) {
      try {
        console.error(
          `[MP][${requestId}] err.response:`,
          JSON.stringify(err.response, null, 2)
        );
      } catch (_) {
        console.error(`[MP][${requestId}] no se pudo serializar err.response`);
      }
    }

    if (err?.body) {
      try {
        console.error(
          `[MP][${requestId}] err.body:`,
          JSON.stringify(err.body, null, 2)
        );
      } catch (_) {
        console.error(`[MP][${requestId}] no se pudo serializar err.body`);
      }
    }

    if (err?.cause) {
      try {
        console.error(
          `[MP][${requestId}] err.cause json:`,
          JSON.stringify(err.cause, null, 2)
        );
      } catch (_) {
        console.error(`[MP][${requestId}] no se pudo serializar err.cause`);
      }
    }

    console.error(`[MP][${requestId}] ===== FIN ERROR createPreference =====\n`);

    return res.status(500).json({
      error: "MercadoPago error",
      detail: err?.message || "Error desconocido",
      requestId,
      mpStatus: err?.status || null,
    });
  }
}

async function getMerchantOrder(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "merchant_order id requerido" });
    }

    const mp = getMpClient();
    const merchantOrder = new MerchantOrder(mp);
    const result = await merchantOrder.get({ merchantOrderId: id });

    console.log("[MP ORDER] merchant_order consultada:", id);
    console.log("[MP ORDER] respuesta:", JSON.stringify(result, null, 2));

    return res.json(result);
  } catch (err) {
    console.error("[MP ORDER] error:", err?.message);
    return res.status(500).json({
      error: "No se pudo consultar merchant_order",
      detail: err?.message || "Error desconocido",
    });
  }
}

module.exports = { createPreference, getMerchantOrder };