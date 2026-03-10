import { Link, Navigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { getOrders, updateOrderStatus } from "../services/orders";
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

function getDayLabel(dateKey, sampleIso) {
  if (!dateKey || dateKey === "sin-fecha") return "Sin fecha";
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
  if (dateKey === todayKey) return "Hoy";
  if (dateKey === yesterdayKey) return "Ayer";
  try {
    return formatDateOnly(sampleIso);
  } catch {
    return dateKey;
  }
}

function computeGlobalStats(orders) {
  if (!orders || orders.length === 0) {
    return { totalOrders: 0, totalAmount: 0, avgTicket: 0, topCustomerByOrders: null, topCustomerByAmount: null, topProduct: null, topPaymentMethod: null };
  }
  const totalAmount = orders.reduce((acc, o) => acc + Number(o.total || 0), 0);
  const byCustomerOrders = {};
  const byCustomerAmount = {};
  const byProduct = {};
  const byPayment = {};
  orders.forEach((o) => {
    const name = (o.customer?.name || "").trim() || "—";
    byCustomerOrders[name] = (byCustomerOrders[name] || 0) + 1;
    byCustomerAmount[name] = (byCustomerAmount[name] || 0) + Number(o.total || 0);
    const method = o.paymentMethod || "—";
    byPayment[method] = (byPayment[method] || 0) + 1;
    (o.items || []).forEach((it) => {
      const key = it.name || it.id || "—";
      byProduct[key] = (byProduct[key] || 0) + Number(it.qty || 0);
    });
  });
  const topCustomerByOrders = Object.entries(byCustomerOrders).sort((a, b) => b[1] - a[1])[0];
  const topCustomerByAmount = Object.entries(byCustomerAmount).sort((a, b) => b[1] - a[1])[0];
  const topProduct = Object.entries(byProduct).sort((a, b) => b[1] - a[1])[0];
  const topPaymentMethod = Object.entries(byPayment).sort((a, b) => b[1] - a[1])[0];
  return {
    totalOrders: orders.length,
    totalAmount,
    avgTicket: orders.length ? Math.round(totalAmount / orders.length) : 0,
    topCustomerByOrders: topCustomerByOrders ? { name: topCustomerByOrders[0], count: topCustomerByOrders[1] } : null,
    topCustomerByAmount: topCustomerByAmount ? { name: topCustomerByAmount[0], amount: topCustomerByAmount[1] } : null,
    topProduct: topProduct ? { name: topProduct[0], qty: topProduct[1] } : null,
    topPaymentMethod: topPaymentMethod ? { method: topPaymentMethod[0], count: topPaymentMethod[1] } : null,
  };
}

function computeDayStats(dayOrders) {
  if (!dayOrders || dayOrders.length === 0) {
    return { count: 0, totalAmount: 0, avgTicket: 0, topCustomer: null, topProduct: null };
  }
  const totalAmount = dayOrders.reduce((acc, o) => acc + Number(o.total || 0), 0);
  const byCustomer = {};
  const byProduct = {};
  dayOrders.forEach((o) => {
    const name = (o.customer?.name || "").trim() || "—";
    byCustomer[name] = (byCustomer[name] || 0) + 1;
    (o.items || []).forEach((it) => {
      const key = it.name || it.id || "—";
      byProduct[key] = (byProduct[key] || 0) + Number(it.qty || 0);
    });
  });
  const topCustomer = Object.entries(byCustomer).sort((a, b) => b[1] - a[1])[0];
  const topProduct = Object.entries(byProduct).sort((a, b) => b[1] - a[1])[0];
  return {
    count: dayOrders.length,
    totalAmount,
    avgTicket: dayOrders.length ? Math.round(totalAmount / dayOrders.length) : 0,
    topCustomer: topCustomer ? { name: topCustomer[0], count: topCustomer[1] } : null,
    topProduct: topProduct ? { name: topProduct[0], qty: topProduct[1] } : null,
  };
}

function paymentMethodLabel(method) {
  if (!method) return "—";
  const map = { mercadopago: "Mercado Pago", efectivo: "Efectivo", whatsapp: "WhatsApp", alias: "Alias" };
  return map[method] || method;
}

function paymentStatusLabel(status) {
  if (!status) return "—";
  const map = {
    pendiente: "Pendiente",
    pagado: "Pagado",
    cancelado: "Cancelado",
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
    nuevo: "Nuevo",
    en_preparacion: "En preparación",
    enviado: "Enviado",
    entregado: "Entregado",
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
  const [refreshKey, setRefreshKey] = useState(0);
  const [updatingId, setUpdatingId] = useState(null);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

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
  }, [refreshKey]);

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
          const global = computeGlobalStats(orders);
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div
                className="card"
                style={{
                  padding: "1rem 1.25rem",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "12px",
                  background: "rgba(255,255,255,0.04)",
                }}
              >
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "rgba(255,255,255,0.6)", marginBottom: "0.5rem" }}>
                  Resumen general
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem 1.5rem", fontSize: "0.85rem" }}>
                  <span>Pedidos: <strong>{global.totalOrders}</strong></span>
                  <span>Total: <strong>${global.totalAmount}</strong></span>
                  <span>Ticket prom.: <strong>${global.avgTicket}</strong></span>
                  {global.topCustomerByOrders && (
                    <span>Más pedidos: <strong>{global.topCustomerByOrders.name}</strong> ({global.topCustomerByOrders.count})</span>
                  )}
                  {global.topCustomerByAmount && (
                    <span>Mayor monto: <strong>{global.topCustomerByAmount.name}</strong> (${global.topCustomerByAmount.amount})</span>
                  )}
                  {global.topProduct && (
                    <span>Más vendido: <strong>{global.topProduct.name}</strong> ({global.topProduct.qty})</span>
                  )}
                  {global.topPaymentMethod && (
                    <span>Pago más usado: <strong>{paymentMethodLabel(global.topPaymentMethod.method)}</strong></span>
                  )}
                </div>
              </div>
              {dateKeys.map((dateKey) => {
                const dayOrders = byDate[dateKey] || [];
                const dayStats = computeDayStats(dayOrders);
                return (
                <div key={dateKey}>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: "rgba(255,255,255,0.6)",
                      marginBottom: "0.5rem",
                      textTransform: "capitalize",
                    }}
                  >
                    {getDayLabel(dateKey, dayOrders[0]?.createdAt)}
                  </div>
                  {dayStats.count > 0 && (
                    <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.75rem", display: "flex", flexWrap: "wrap", gap: "0.5rem 1rem" }}>
                      <span>{dayStats.count} pedido{dayStats.count !== 1 ? "s" : ""}</span>
                      <span>Total: ${dayStats.totalAmount}</span>
                      <span>Ticket prom.: ${dayStats.avgTicket}</span>
                      {dayStats.topCustomer && <span>Más pedidos: {dayStats.topCustomer.name}</span>}
                      {dayStats.topProduct && <span>Más pedido: {dayStats.topProduct.name}</span>}
                    </div>
                  )}
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

              <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "6px" }}>
                  Acciones
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {order.paymentStatus !== "pagado" && (
                    <button
                      type="button"
                      className="btn btnSecondary"
                      style={{ fontSize: "0.8rem", padding: "0.35rem 0.6rem" }}
                      disabled={updatingId === order.id}
                      onClick={() => {
                        setUpdatingId(order.id);
                        updateOrderStatus(order.id, { payment_status: "pagado" })
                          .then(() => refresh())
                          .catch(() => {})
                          .finally(() => setUpdatingId(null));
                      }}
                    >
                      Confirmar pago
                    </button>
                  )}
                  {order.orderStatus !== "en_preparacion" && (
                    <button
                      type="button"
                      className="btn btnGhost"
                      style={{ fontSize: "0.8rem", padding: "0.35rem 0.6rem" }}
                      disabled={updatingId === order.id}
                      onClick={() => {
                        setUpdatingId(order.id);
                        updateOrderStatus(order.id, { order_status: "en_preparacion" })
                          .then(() => refresh())
                          .catch(() => {})
                          .finally(() => setUpdatingId(null));
                      }}
                    >
                      En preparación
                    </button>
                  )}
                  {order.orderStatus !== "enviado" && (
                    <button
                      type="button"
                      className="btn btnGhost"
                      style={{ fontSize: "0.8rem", padding: "0.35rem 0.6rem" }}
                      disabled={updatingId === order.id}
                      onClick={() => {
                        setUpdatingId(order.id);
                        updateOrderStatus(order.id, { order_status: "enviado" })
                          .then(() => refresh())
                          .catch(() => {})
                          .finally(() => setUpdatingId(null));
                      }}
                    >
                      Enviado
                    </button>
                  )}
                  {order.orderStatus !== "entregado" && (
                    <button
                      type="button"
                      className="btn btnPrimary"
                      style={{ fontSize: "0.8rem", padding: "0.35rem 0.6rem" }}
                      disabled={updatingId === order.id}
                      onClick={() => {
                        setUpdatingId(order.id);
                        updateOrderStatus(order.id, { order_status: "entregado" })
                          .then(() => refresh())
                          .catch(() => {})
                          .finally(() => setUpdatingId(null));
                      }}
                    >
                      Entregado
                    </button>
                  )}
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
              );
              })}
            </div>
          );
        })()
      )}
    </section>
  );
}
