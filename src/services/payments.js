const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:4000";

export async function createPreference(items) {
  const res = await fetch(`${API_BASE}/payments/create-preference`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items })
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.detail || data?.error || "Error creando preferencia";
    throw new Error(msg);
  }

  return data;
}

export async function createPreferenceForOrder(orderId) {
  const res = await fetch(`${API_BASE}/payments/create-preference`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.detail || data?.error || "Error creando preferencia";
    throw new Error(msg);
  }

  return data;
}