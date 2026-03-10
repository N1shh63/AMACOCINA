const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:4000";
const ADMIN_TOKEN_KEY = "admin_token";

export function getAdminToken() {
  return typeof localStorage !== "undefined" ? localStorage.getItem(ADMIN_TOKEN_KEY) : null;
}

export function setAdminToken(token) {
  if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token);
  else localStorage.removeItem(ADMIN_TOKEN_KEY);
}

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

  if (data.token) setAdminToken(data.token);
  return data;
}
