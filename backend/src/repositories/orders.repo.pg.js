const pool = require("../db/postgres");

function rowToOrder(orderRow, itemRows) {
  if (!orderRow) return null;
  return {
    id: orderRow.id,
    createdAt: orderRow.created_at,
    updatedAt: orderRow.updated_at,
    source: orderRow.source,
    customer: {
      name: orderRow.customer_name,
      phone: orderRow.customer_phone || null,
      notes: orderRow.customer_notes || null,
    },
    currency: orderRow.currency,
    subtotal: Number(orderRow.subtotal),
    total: Number(orderRow.total),
    orderStatus: orderRow.order_status,
    paymentStatus: orderRow.payment_status,
    mp: {
      externalReference: orderRow.mp_external_reference || null,
      preferenceId: orderRow.mp_preference_id || null,
      paymentId: orderRow.mp_payment_id || null,
      merchantOrderId: orderRow.mp_merchant_order_id || null,
      status: orderRow.mp_status || null,
    },
    whatsapp: {
      to: orderRow.wa_to || null,
      message: orderRow.wa_message || null,
      sentAt: orderRow.wa_sent_at || null,
    },
    client: { userAgent: orderRow.client_user_agent || null },
    paymentMethod: orderRow.payment_method || null,
    items: (itemRows || []).map((r) => ({
      id: r.item_id,
      name: r.name,
      qty: Number(r.qty),
      unitPrice: Number(r.unit_price),
      total: Number(r.line_total),
    })),
  };
}

async function createOrder({ id, customer, items, currency, source, clientUserAgent, paymentMethod }) {
  const now = new Date().toISOString();
  const orderStatus = "draft";
  const paymentStatus = paymentMethod === "efectivo" || paymentMethod === "alias" ? "pendiente" : "unpaid";

  const normalizedItems = items.map((it) => {
    const qty = Number(it.qty);
    const unitPrice = Number(it.unitPrice);
    const lineTotal = qty * unitPrice;
    return {
      item_id: String(it.id),
      name: String(it.name),
      qty,
      unit_price: unitPrice,
      line_total: lineTotal,
    };
  });

  const subtotal = normalizedItems.reduce((acc, r) => acc + r.line_total, 0);
  const total = subtotal;

  const orderParams = [
    id,
    now,
    now,
    String(customer.name),
    customer.phone ? String(customer.phone) : null,
    customer.notes ? String(customer.notes) : null,
    String(currency || "ARS"),
    subtotal,
    total,
    orderStatus,
    paymentStatus,
    paymentMethod ? String(paymentMethod) : null,
    id,
    String(source || "web"),
    clientUserAgent ? String(clientUserAgent) : null,
  ];

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO orders (
        id, created_at, updated_at,
        customer_name, customer_phone, customer_notes,
        currency, subtotal, total,
        order_status, payment_status,
        payment_method,
        mp_external_reference,
        source, client_user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      orderParams
    );
    for (const r of normalizedItems) {
      await client.query(
        `INSERT INTO order_items (order_id, item_id, name, qty, unit_price, line_total)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, r.item_id, r.name, r.qty, r.unit_price, r.line_total]
      );
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }

  return getOrderById(id);
}

async function getOrderById(id) {
  const orderResult = await pool.query("SELECT * FROM orders WHERE id = $1", [String(id)]);
  const orderRow = orderResult.rows[0];
  if (!orderRow) return null;
  const itemsResult = await pool.query(
    "SELECT * FROM order_items WHERE order_id = $1 ORDER BY id ASC",
    [String(id)]
  );
  return rowToOrder(orderRow, itemsResult.rows);
}

async function listOrders({ limit = 100, offset = 0, order_status, payment_status, exclude_order_status } = {}) {
  const l = Math.min(Math.max(Number(limit) || 100, 1), 500);
  const o = Math.max(Number(offset) || 0, 0);
  const conditions = [];
  const params = [];
  let idx = 1;
  if (order_status != null && String(order_status).trim() !== "") {
    conditions.push(`order_status = $${idx++}`);
    params.push(String(order_status).trim());
  }
  if (payment_status != null && String(payment_status).trim() !== "") {
    conditions.push(`payment_status = $${idx++}`);
    params.push(String(payment_status).trim());
  }
  if (exclude_order_status != null && String(exclude_order_status).trim() !== "") {
    conditions.push(`order_status != $${idx++}`);
    params.push(String(exclude_order_status).trim());
  }
  const where = conditions.length ? " WHERE " + conditions.join(" AND ") : "";
  params.push(l, o);
  const listSql = `SELECT * FROM orders${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx}`;
  const listResult = await pool.query(listSql, params);
  const orders = [];
  for (const orderRow of listResult.rows) {
    const itemResult = await pool.query(
      "SELECT * FROM order_items WHERE order_id = $1 ORDER BY id ASC",
      [orderRow.id]
    );
    orders.push(rowToOrder(orderRow, itemResult.rows));
  }
  const countSql = "SELECT COUNT(*)::int AS total FROM orders" + where;
  const countParams = params.slice(0, params.length - 2);
  const countResult = await pool.query(countSql, countParams);
  const total = countResult.rows[0] ? Number(countResult.rows[0].total) : 0;
  return { orders, total };
}

async function setMercadoPagoPreference({ orderId, preferenceId, externalReference }) {
  const now = new Date().toISOString();
  const result = await pool.query(
    `UPDATE orders
     SET mp_preference_id = $1, mp_external_reference = $2, updated_at = $3
     WHERE id = $4`,
    [
      preferenceId ? String(preferenceId) : null,
      externalReference ? String(externalReference) : null,
      now,
      String(orderId),
    ]
  );
  return (result.rowCount || 0) > 0;
}

async function updateOrderStatus(orderId, { orderStatus, paymentStatus }) {
  const now = new Date().toISOString();
  const id = String(orderId);
  const updates = [];
  const params = [];
  let idx = 1;
  if (orderStatus != null && String(orderStatus).trim() !== "") {
    updates.push(`order_status = $${idx++}`);
    params.push(String(orderStatus).trim());
  }
  if (paymentStatus != null && String(paymentStatus).trim() !== "") {
    updates.push(`payment_status = $${idx++}`);
    params.push(String(paymentStatus).trim());
  }
  if (updates.length === 0) return false;
  updates.push(`updated_at = $${idx++}`);
  params.push(now);
  params.push(id);
  const result = await pool.query(
    `UPDATE orders SET ${updates.join(", ")} WHERE id = $${idx}`,
    params
  );
  return (result.rowCount || 0) > 0;
}

async function cleanOrders({ olderThanDays = 30, deleteEntregado = true } = {}) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - Number(olderThanDays) || 0);
  const cutoffIso = cutoff.toISOString();
  const conditions = [];
  const params = [];
  if (deleteEntregado) conditions.push("order_status = 'entregado'");
  conditions.push("created_at < $1");
  params.push(cutoffIso);
  const where = " WHERE " + conditions.join(" OR ");
  const result = await pool.query("DELETE FROM orders" + where, params);
  return { deleted: result.rowCount || 0 };
}

async function deleteOrderById(id) {
  const result = await pool.query("DELETE FROM orders WHERE id = $1", [String(id)]);
  return (result.rowCount || 0) > 0;
}

module.exports = {
  createOrder,
  getOrderById,
  setMercadoPagoPreference,
  listOrders,
  updateOrderStatus,
  cleanOrders,
  deleteOrderById,
};
