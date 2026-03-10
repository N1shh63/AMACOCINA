const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:4000";

function authHeaders(token) {
  const h = { "Content-Type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export async function createOrder({ customer, items, currency, payment_method }) {
  const res = await fetch(`${API_BASE}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customer, items, currency, payment_method }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.detail || data?.error || "Error creando orden";
    throw new Error(msg);
  }

  return data;
}

export async function getOrderById(id) {
  const res = await fetch(`${API_BASE}/orders/${encodeURIComponent(id)}`);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.detail || data?.error || "Error obteniendo orden";
    throw new Error(msg);
  }

  return data;
}

export async function getOrders({ limit = 100, offset = 0, exclude_order_status, token } = {}) {
  const params = new URLSearchParams();
  if (limit != null) params.set("limit", String(limit));
  if (offset != null) params.set("offset", String(offset));
  if (exclude_order_status != null) params.set("exclude_order_status", String(exclude_order_status));
  const res = await fetch(`${API_BASE}/orders?${params.toString()}`, {
    headers: authHeaders(token),
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.error || data?.detail || "Error listando pedidos";
    throw new Error(msg);
  }

  return data;
}

export async function cleanOrders({ older_than_days = 30, delete_entregado = true, token } = {}) {
  const res = await fetch(`${API_BASE}/orders/clean`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ older_than_days, delete_entregado }),
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.error || "Error al limpiar pedidos";
    throw new Error(msg);
  }

  return data;
}

export async function updateOrderStatus(id, { order_status, payment_status }, token) {
  const body = {};
  if (order_status != null) body.order_status = order_status;
  if (payment_status != null) body.payment_status = payment_status;
  const res = await fetch(`${API_BASE}/orders/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.error || "Error actualizando pedido";
    throw new Error(msg);
  }

  return data;
}

export async function deleteOrder(id, token) {
  const res = await fetch(`${API_BASE}/orders/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.error || "Error al borrar pedido";
    throw new Error(msg);
  }

  return data;
}
