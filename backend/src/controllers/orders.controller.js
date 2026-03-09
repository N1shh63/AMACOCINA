const crypto = require("crypto");
const { createOrder, getOrderById, listOrders } = require("../repositories/orders.repo");

function badRequest(res, details) {
  return res.status(400).json({ error: "Invalid payload", details });
}

function validateCreateOrderPayload(body) {
  const details = [];

  const customer = body?.customer;
  const customerName = customer?.name;
  if (typeof customerName !== "string" || customerName.trim().length === 0) {
    details.push("customer.name is required");
  }

  const items = body?.items;
  if (!Array.isArray(items) || items.length === 0) {
    details.push("items must be a non-empty array");
  } else {
    items.forEach((it, idx) => {
      const prefix = `items[${idx}]`;

      if (!it || typeof it !== "object") {
        details.push(`${prefix} must be an object`);
        return;
      }

      if (it.id === undefined || it.id === null || String(it.id).trim() === "") {
        details.push(`${prefix}.id is required`);
      }

      if (it.name === undefined || it.name === null || String(it.name).trim() === "") {
        details.push(`${prefix}.name is required`);
      }

      const qty = Number(it.qty);
      if (!Number.isFinite(qty) || qty <= 0) {
        details.push(`${prefix}.qty must be > 0`);
      }

      const unitPrice = Number(it.unitPrice);
      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        details.push(`${prefix}.unitPrice must be >= 0`);
      }
    });
  }

  return details.length ? details : null;
}

const ALLOWED_PAYMENT_METHODS = ["mercadopago", "efectivo", "whatsapp", "alias"];

function validatePaymentMethod(value) {
  if (value === undefined || value === null || value === "") return null;
  const v = String(value).toLowerCase().trim();
  return ALLOWED_PAYMENT_METHODS.includes(v) ? v : null;
}

async function postOrders(req, res, next) {
  try {
    const errors = validateCreateOrderPayload(req.body);
    if (errors) return badRequest(res, errors);

    const { customer, items, currency, payment_method } = req.body;

    const order = createOrder({
      id: crypto.randomUUID(),
      customer: {
        name: customer.name.trim(),
        phone: customer.phone ? String(customer.phone).trim() : null,
        notes: customer.notes ? String(customer.notes) : null,
      },
      items: items.map((it) => ({
        id: String(it.id),
        name: String(it.name),
        qty: Number(it.qty),
        unitPrice: Number(it.unitPrice),
      })),
      currency: currency ? String(currency) : "ARS",
      source: "web",
      clientUserAgent: req.headers["user-agent"] || null,
      paymentMethod: validatePaymentMethod(payment_method) || undefined,
    });

    return res.status(201).json(order);
  } catch (err) {
    return next(err);
  }
}

async function getOrder(req, res, next) {
  try {
    const { id } = req.params;
    if (!id || String(id).trim() === "") {
      return res.status(400).json({ error: "id is required" });
    }

    const order = getOrderById(String(id));
    if (!order) return res.status(404).json({ error: "Order not found" });

    return res.json(order);
  } catch (err) {
    return next(err);
  }
}

async function listOrdersHandler(req, res, next) {
  try {
    const limit = req.query.limit;
    const offset = req.query.offset;
    const order_status = req.query.order_status;
    const payment_status = req.query.payment_status;

    const result = listOrders({
      limit: limit != null ? limit : 100,
      offset: offset != null ? offset : 0,
      order_status: order_status != null ? order_status : undefined,
      payment_status: payment_status != null ? payment_status : undefined,
    });

    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

module.exports = { postOrders, getOrder, listOrdersHandler };

