import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "../services/admin";

const ADMIN_LOGGED_KEY = "admin_logged";

export function isAdminLogged() {
  return localStorage.getItem(ADMIN_LOGGED_KEY) === "true";
}

export function setAdminLogged(value) {
  if (value) {
    localStorage.setItem(ADMIN_LOGGED_KEY, "true");
  } else {
    localStorage.removeItem(ADMIN_LOGGED_KEY);
  }
}

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await adminLogin(username.trim(), password);
      setAdminLogged(true);
      navigate("/admin/orders", { replace: true });
    } catch (err) {
      setError(err?.message || "Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container">
      <div
        className="card"
        style={{
          maxWidth: "400px",
          margin: "2rem auto",
          padding: "1.5rem",
        }}
      >
        <h1 style={{ margin: "0 0 1rem", fontSize: "1.5rem", fontWeight: 800 }}>
          Admin – Iniciar sesión
        </h1>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label htmlFor="admin-username" style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.25rem", color: "rgba(255,255,255,0.7)" }}>
              Usuario
            </label>
            <input
              id="admin-username"
              type="text"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Usuario"
              autoComplete="username"
              disabled={loading}
              style={{ width: "100%", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label htmlFor="admin-password" style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.25rem", color: "rgba(255,255,255,0.7)" }}>
              Contraseña
            </label>
            <input
              id="admin-password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              autoComplete="current-password"
              disabled={loading}
              style={{ width: "100%", boxSizing: "border-box" }}
            />
          </div>

          {error ? (
            <div style={{ fontSize: "0.875rem", color: "rgba(255, 120, 120, 0.95)" }}>
              {error}
            </div>
          ) : null}

          <button type="submit" className="btn btnPrimary btnBlock" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </section>
  );
}
