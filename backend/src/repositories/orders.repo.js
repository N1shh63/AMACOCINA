const usePg = process.env.DATABASE_URL && String(process.env.DATABASE_URL).trim();

if (usePg) {
  module.exports = require("./orders.repo.pg");
} else {
  const { getDb } = require("../db/sqlite");

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
      subtotal: orderRow.subtotal,
      total: orderRow.total,
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
      client: {
        userAgent: orderRow.client_user_agent || null,
      },
      paymentMethod: orderRow.payment_method || null,
      items: (itemRows || []).map((r) => ({
        id: r.item_id,
        name: r.name,
        qty: r.qty,
        unitPrice: r.unit_price,
        total: r.line_total,
      })),
    };
  }

  function createOrderSync({ id, customer, items, currency, source, clientUserAgent, paymentMethod }) {
    const db = getDb();
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

    const insertOrder = db.prepare(
      `INSERT INTO orders (
        id, created_at, updated_at,
        customer_name, customer_phone, customer_notes,
        currency, subtotal, total,
        order_status, payment_status,
        payment_method,
        mp_external_reference,
        source, client_user_agent
      ) VALUES (
        @id, @created_at, @updated_at,
        @customer_name, @customer_phone, @customer_notes,
        @currency, @subtotal, @total,
        @order_status, @payment_status,
        @payment_method,
        @mp_external_reference,
        @source, @client_user_agent
      )`
    );

    const insertItem = db.prepare(
      `INSERT INTO order_items (
        order_id, item_id, name, qty, unit_price, line_total
      ) VALUES (
        @order_id, @item_id, @name, @qty, @unit_price, @line_total
      )`
    );

    const tx = db.transaction(() => {
      insertOrder.run({
        id,
        created_at: now,
        updated_at: now,
        customer_name: String(customer.name),
        customer_phone: customer.phone ? String(customer.phone) : null,
        customer_notes: customer.notes ? String(customer.notes) : null,
        currency: String(currency || "ARS"),
        subtotal,
        total,
        order_status: orderStatus,
        payment_status: paymentStatus,
        payment_method: paymentMethod ? String(paymentMethod) : null,
        mp_external_reference: id,
        source: String(source || "web"),
        client_user_agent: clientUserAgent ? String(clientUserAgent) : null,
      });

      for (const r of normalizedItems) {
        insertItem.run({ order_id: id, ...r });
      }
    });

    tx();
    return getOrderByIdSync(id);
  }

  function getOrderByIdSync(id) {
    const db = getDb();
    const orderRow = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
    if (!orderRow) return null;

    const itemRows = db
      .prepare("SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC")
      .all(id);

    return rowToOrder(orderRow, itemRows);
  }

  function listOrdersSync({ limit = 100, offset = 0, order_status, payment_status, exclude_order_status } = {}) {
    const db = getDb();
    const l = Math.min(Math.max(Number(limit) || 100, 1), 500);
    const o = Math.max(Number(offset) || 0, 0);
    const conditions = [];
    const params = [];

    if (order_status != null && String(order_status).trim() !== "") {
      conditions.push("order_status = ?");
      params.push(String(order_status).trim());
    }

    if (payment_status != null && String(payment_status).trim() !== "") {
      conditions.push("payment_status = ?");
      params.push(String(payment_status).trim());
    }

    if (exclude_order_status != null && String(exclude_order_status).trim() !== "") {
      conditions.push("order_status != ?");
      params.push(String(exclude_order_status).trim());
    }

    const where = conditions.length ? " WHERE " + conditions.join(" AND ") : "";
    const listSql = "SELECT * FROM orders" + where + " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    const listParams = [...params, l, o];
    const rows = db.prepare(listSql).all(...listParams);

    const orders = [];
    for (const orderRow of rows) {
      const itemRows = db
        .prepare("SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC")
        .all(orderRow.id);
      orders.push(rowToOrder(orderRow, itemRows));
    }

    const countSql = "SELECT COUNT(*) as total FROM orders" + where;
    const countRow = db.prepare(countSql).get(...params);
    const total = countRow ? countRow.total : 0;

    return { orders, total };
  }

  function setMercadoPagoPreferenceSync({ orderId, preferenceId, externalReference }) {
    const db = getDb();
    const now = new Date().toISOString();

    const info = db
      .prepare(
        `UPDATE orders
         SET mp_preference_id = ?,
             mp_external_reference = ?,
             updated_at = ?
         WHERE id = ?`
      )
      .run(
        preferenceId ? String(preferenceId) : null,
        externalReference ? String(externalReference) : null,
        now,
        String(orderId)
      );

    return info.changes > 0;
  }

  function updateOrderStatusSync(orderId, { orderStatus, paymentStatus }) {
    const db = getDb();
    const now = new Date().toISOString();
    const id = String(orderId);
    const updates = [];
    const params = [];

    if (orderStatus != null && String(orderStatus).trim() !== "") {
      updates.push("order_status = ?");
      params.push(String(orderStatus).trim());
    }

    if (paymentStatus != null && String(paymentStatus).trim() !== "") {
      updates.push("payment_status = ?");
      params.push(String(paymentStatus).trim());
    }

    if (updates.length === 0) return false;

    updates.push("updated_at = ?");
    params.push(now);
    params.push(id);

    const info = db
      .prepare(`UPDATE orders SET ${updates.join(", ")} WHERE id = ?`)
      .run(...params);

    return info.changes > 0;
  }

  function cleanOrdersSync({ olderThanDays = 30, deleteEntregado = true } = {}) {
    const db = getDb();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - Number(olderThanDays) || 0);
    const cutoffIso = cutoff.toISOString();
    const sql =
      deleteEntregado
        ? "SELECT id FROM orders WHERE order_status = 'entregado' OR created_at < ?"
        : "SELECT id FROM orders WHERE created_at < ?";
    const rows = db.prepare(sql).all(cutoffIso);
    if (rows.length === 0) return { deleted: 0 };
    const ids = rows.map((r) => r.id);
    const placeholders = ids.map(() => "?").join(",");
    db.prepare("DELETE FROM order_items WHERE order_id IN (" + placeholders + ")").run(...ids);
    db.prepare("DELETE FROM orders WHERE id IN (" + placeholders + ")").run(...ids);
    return { deleted: ids.length };
  }

  function deleteOrderByIdSync(id) {
    const db = getDb();
    const idStr = String(id);
    db.prepare("DELETE FROM order_items WHERE order_id = ?").run(idStr);
    const info = db.prepare("DELETE FROM orders WHERE id = ?").run(idStr);
    return info.changes > 0;
  }

  function getTopProductNameSync() {
    const db = getDb();
    const row = db
      .prepare(
        `SELECT oi.name
         FROM order_items oi
         INNER JOIN orders o ON o.id = oi.order_id
         WHERE o.order_status != 'draft'
         GROUP BY oi.name
         ORDER BY SUM(oi.qty) DESC
         LIMIT 1`
      )
      .get();
    return row ? { name: row.name } : null;
  }

  module.exports = {
    createOrder: (...args) => Promise.resolve(createOrderSync(...args)),
    getOrderById: (...args) => Promise.resolve(getOrderByIdSync(...args)),
    listOrders: (...args) => Promise.resolve(listOrdersSync(...args)),
    setMercadoPagoPreference: (...args) =>
      Promise.resolve(setMercadoPagoPreferenceSync(...args)),
    updateOrderStatus: (...args) => Promise.resolve(updateOrderStatusSync(...args)),
    cleanOrders: (...args) => Promise.resolve(cleanOrdersSync(...args)),
    deleteOrderById: (...args) => Promise.resolve(deleteOrderByIdSync(...args)),
    getTopProductName: () => Promise.resolve(getTopProductNameSync()),
  };
}