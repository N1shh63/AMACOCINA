import { Link, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getOrders } from "../services/orders";
import { isAdminLogged } from "./AdminLogin";

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("es-AR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function formatDateOnly(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatTime(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function getDateKey(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  } catch {
    return "";
  }
}

function paymentMethodLabel(method) {
  if (!method) return "—";
  const map = { mercadopago: "Mercado Pago", efectivo: "Efectivo", whatsapp: "WhatsApp" };
  return map[method] || method;
}

function paymentStatusLabel(status) {
  if (!status) return "—";
  const map = {
    paid: "Pagado",
    unpaid: "No pagado",
    pending: "Pendiente",
    initiated: "Iniciado",
    failed: "Fallido",
  };
  return map[status] || status;
}

function orderStatusLabel(status) {
  if (!status) return "—";
  const map = {
    draft: "Borrador",
    submitted: "Enviado",
    confirmed: "Confirmado",
    fulfilled: "Entregado",
    cancelled: "Cancelado",
  };
  return map[status] || status;
}

export default function AdminOrders() {
  if (!isAdminLogged()) {
    return <Navigate to="/admin/login" replace />;
  }

  return <AdminOrdersContent />;
}

function AdminOrdersContent() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    getOrders({ limit: 100, offset: 0 })
      .then((data) => {
        if (!cancelled) {
          setOrders(data.orders || []);
          setTotal(data.total != null ? data.total : (data.orders || []).length);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message || "Error al cargar pedidos");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <section className="container">
        <div className="card" style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center", padding: "2rem" }}>
          <p className="muted">Cargando pedidos...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="container">
        <div className="card" style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center", padding: "2rem" }}>
          <p style={{ color: "rgba(255, 120, 120, 0.9)", marginBottom: "1rem" }}>{error}</p>
          <button
            type="button"
            className="btn btnPrimary"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="container">
      <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800 }}>Pedidos</h1>
        <span className="muted" style={{ fontSize: "0.9rem" }}>
          {total} pedido{total !== 1 ? "s" : ""}
        </span>
        <Link to="/" className="btn btnGhost" style={{ marginLeft: "auto" }}>
          ← Menú
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="card" style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center", padding: "2rem" }}>
          <p className="muted">No hay pedidos todavía.</p>
        </div>
      ) : (
        (() => {
          const byDate = {};
          (orders || []).forEach((o) => {
            const k = getDateKey(o.createdAt) || "sin-fecha";
            if (!byDate[k]) byDate[k] = [];
            byDate[k].push(o);
          });
          const dateKeys = Object.keys(byDate).sort((a, b) => (a > b ? -1 : 1));
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {dateKeys.map((dateKey) => (
                <div key={dateKey}>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: "rgba(255,255,255,0.6)",
                      marginBottom: "0.75rem",
                      textTransform: "capitalize",
                    }}
                  >
                    {dateKey === "sin-fecha" ? "Sin fecha" : formatDateOnly(byDate[dateKey][0]?.createdAt)}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {byDate[dateKey].map((order) => (
                      <div
                        key={order.id}
                        className="card"
                        style={{
                          padding: "1rem 1.25rem",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: "12px",
                          background: "rgba(255,255,255,0.03)",
                        }}
                      >
                        <div
                          style={{
                            display: "grid",
                            gap: "0.5rem 1rem",
                            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                            alignItems: "start",
                          }}
                        >
                          <div>
                            <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "2px" }}>
                              Hora
                            </div>
                            <div style={{ fontSize: "1rem", fontWeight: 700 }}>{formatTime(order.createdAt)}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "2px" }}>
                              Cliente
                            </div>
                            <div style={{ fontWeight: 600 }}>{order.customer?.name || "—"}</div>
                          </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "2px" }}>
                    Total
                  </div>
                  <div style={{ fontWeight: 600 }}>${order.total ?? "—"}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "2px" }}>
                    Método de pago
                  </div>
                  <div>{paymentMethodLabel(order.paymentMethod)}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "2px" }}>
                    Estado pago
                  </div>
                  <div>{paymentStatusLabel(order.paymentStatus)}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "2px" }}>
                    Estado pedido
                  </div>
                  <div>{orderStatusLabel(order.orderStatus)}</div>
                </div>
              </div>

              {order.customer?.notes?.trim() ? (
                <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "4px" }}>
                    Notas del cliente
                  </div>
                  <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.85)" }}>
                    {order.customer.notes.trim()}
                  </div>
                </div>
              ) : null}

              <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "6px" }}>
                  Detalle
                </div>
                <ul style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.9rem", color: "rgba(255,255,255,0.85)" }}>
                  {(order.items || []).map((it) => (
                    <li key={it.id}>
                      {it.qty}x {it.name} — ${it.total}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })()
      )}
    </section>
  );
}
