const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:4000";

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

