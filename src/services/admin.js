const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:4000";

export async function adminLogin(username, password) {
  const res = await fetch(`${API_BASE}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.error || "Error al iniciar sesión";
    throw new Error(msg);
  }

  return data;
}
