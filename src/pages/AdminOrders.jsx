import { Link, Navigate, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getOrders, updateOrderStatus, cleanOrders, deleteOrder } from "../services/orders";
import { isAdminLogged, setAdminLogged } from "./AdminLogin";
import { getAdminToken, setAdminToken } from "../services/admin";

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

function filterOrdersByView(orders, viewMode) {
  if (!orders || orders.length === 0) return [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  if (viewMode === "hoy") {
    return orders.filter((o) => getDateKey(o.createdAt) === todayKey);
  }
  if (viewMode === "semana") {
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return orders.filter((o) => new Date(o.createdAt) >= weekAgo);
  }
  if (viewMode === "mes") {
    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);
    return orders.filter((o) => new Date(o.createdAt) >= monthAgo);
  }
  return orders;
}

function filterOrdersByStatus(orders, statusFilter) {
  if (!orders || orders.length === 0) return [];
  if (statusFilter === "todos") return orders;
  return orders.filter((o) => (o.orderStatus || "").toLowerCase() === statusFilter);
}

function computeTodayStats(orders) {
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const todayOrders = (orders || []).filter((o) => getDateKey(o.createdAt) === todayKey);
  return computeGlobalStats(todayOrders);
}

function computeSalesByDay(orders, limit = 7) {
  if (!orders || orders.length === 0) return [];
  const byDay = {};
  orders.forEach((o) => {
    const k = getDateKey(o.createdAt) || "sin-fecha";
    if (!byDay[k]) byDay[k] = { dateKey: k, total: 0, count: 0 };
    byDay[k].total += Number(o.total || 0);
    byDay[k].count += 1;
  });
  return Object.values(byDay)
    .sort((a, b) => (b.dateKey > a.dateKey ? 1 : -1))
    .slice(0, limit);
}

function computeOrdersByHour(orders) {
  if (!orders || orders.length === 0) return [];
  const byHour = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }));
  orders.forEach((o) => {
    try {
      const h = new Date(o.createdAt).getHours();
      if (h >= 0 && h < 24) byHour[h].count += 1;
    } catch (_) {}
  });
  return byHour.filter((x) => x.count > 0).sort((a, b) => b.count - a.count);
}

function buildOrderCopyText(order) {
  const lines = [
    `Pedido #${order.id}`,
    `Cliente: ${order.customer?.name || "—"}`,
    `Total: $${order.total ?? "—"}`,
    `Pago: ${paymentMethodLabel(order.paymentMethod)}`,
    ``,
    `Detalle:`,
    ...(order.items || []).map((it) => `• ${it.qty}x ${it.name} — $${it.total ?? ""}`),
  ];
  if (order.customer?.notes?.trim()) lines.push(``, `Notas: ${order.customer.notes.trim()}`);
  return lines.join("\n");
}

function AdminOrdersContent() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [updatingId, setUpdatingId] = useState(null);
  const [viewMode, setViewMode] = useState("hoy");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [expandedItems, setExpandedItems] = useState(() => new Set());
  const [cleanLoading, setCleanLoading] = useState(false);
  const [cleanConfirm, setCleanConfirm] = useState(false);
  const [cleanOlderDays, setCleanOlderDays] = useState(30);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const handleUnauthorized = useCallback(() => {
    setAdminLogged(false);
    setAdminToken(null);
    navigate("/admin/login", { replace: true });
  }, [navigate]);

  const timeFilteredOrders = useMemo(
    () => filterOrdersByView(orders, viewMode),
    [orders, viewMode]
  );

  const filteredOrders = useMemo(
    () => filterOrdersByStatus(timeFilteredOrders, statusFilter),
    [timeFilteredOrders, statusFilter]
  );

  const todayStats = useMemo(() => computeTodayStats(orders), [orders]);
  const salesByDay = useMemo(() => computeSalesByDay(orders, 7), [orders]);
  const ordersByHour = useMemo(() => computeOrdersByHour(orders), [orders]);
  const topProductsList = useMemo(() => {
    const global = computeGlobalStats(orders);
    if (!global.topProduct) return [];
    const byProduct = {};
    (orders || []).forEach((o) => {
      (o.items || []).forEach((it) => {
        const key = it.name || it.id || "—";
        byProduct[key] = (byProduct[key] || 0) + Number(it.qty || 0);
      });
    });
    return Object.entries(byProduct)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, qty]) => ({ name, qty }));
  }, [orders]);

  const toggleExpanded = useCallback((orderId) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  }, []);

  const handleCopyOrder = useCallback((order) => {
    const text = buildOrderCopyText(order);
    navigator.clipboard?.writeText(text).then(() => {}).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    const token = getAdminToken();

    getOrders({ limit: 200, offset: 0, exclude_order_status: "draft", token })
      .then((data) => {
        if (!cancelled) {
          setOrders(data.orders || []);
          setTotal(data.total != null ? data.total : (data.orders || []).length);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          if (e?.message?.includes("autorizado") || e?.message?.includes("No autorizado")) {
            handleUnauthorized();
            return;
          }
          setError(e?.message || "Error al cargar pedidos");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey, handleUnauthorized]);

  if (loading) {
    return (
      <div className="adminDashboard">
        <div className="adminLoading">Cargando pedidos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="adminDashboard">
        <div className="adminError">
          <p>{error}</p>
          <button type="button" className="btn btnPrimary" onClick={() => window.location.reload()}>Reintentar</button>
        </div>
      </div>
    );
  }

  const handleCleanOrders = () => {
    setCleanLoading(true);
    cleanOrders({ older_than_days: cleanOlderDays, delete_entregado: true, token: getAdminToken() })
      .then(() => {
        setCleanConfirm(false);
        refresh();
      })
      .catch((e) => {
        if (e?.message?.includes("autorizado") || e?.message?.includes("No autorizado")) handleUnauthorized();
      })
      .finally(() => setCleanLoading(false));
  };

  const handleDeleteOrder = (orderId) => {
    if (!orderId) return;
    setDeleteLoading(true);
    deleteOrder(orderId, getAdminToken())
      .then(() => {
        setDeleteConfirmId(null);
        refresh();
      })
      .catch((e) => {
        if (e?.message?.includes("autorizado") || e?.message?.includes("No autorizado")) handleUnauthorized();
        else setDeleteConfirmId(null);
      })
      .finally(() => setDeleteLoading(false));
  };

  return (
    <div className="adminDashboard">
      <header className="adminHeader">
        <h1 className="adminTitle">Dashboard</h1>
        <p className="adminSubtitle">Pedidos y ventas</p>
        <div className="adminHeaderActions">
          <Link to="/" className="adminLinkBack">← Menú</Link>
          <button
            type="button"
            className="btn btnSecondary adminBtnClean"
            onClick={() => setCleanConfirm(true)}
            disabled={cleanLoading}
          >
            Limpiar pedidos
          </button>
        </div>
      </header>

      {/* 1. KPI */}
      <section className="adminSection">
        <h2 className="adminSectionTitle">KPI principales</h2>
        <div className="adminKpiGrid">
          <div className="adminKpiCard">
            <span className="adminKpiLabel">Pedidos hoy</span>
            <span className="adminKpiValue">{todayStats.totalOrders}</span>
          </div>
          <div className="adminKpiCard">
            <span className="adminKpiLabel">Ventas hoy</span>
            <span className="adminKpiValue">${todayStats.totalAmount?.toLocaleString("es-AR") ?? 0}</span>
          </div>
          <div className="adminKpiCard">
            <span className="adminKpiLabel">Ticket promedio</span>
            <span className="adminKpiValue">${todayStats.avgTicket?.toLocaleString("es-AR") ?? 0}</span>
          </div>
          <div className="adminKpiCard">
            <span className="adminKpiLabel">Más vendido</span>
            <span className="adminKpiValue adminKpiValueSmall">{todayStats.topProduct?.name ?? "—"}</span>
          </div>
          <div className="adminKpiCard">
            <span className="adminKpiLabel">Pago más usado</span>
            <span className="adminKpiValue adminKpiValueSmall">{paymentMethodLabel(todayStats.topPaymentMethod?.method) ?? "—"}</span>
          </div>
        </div>
      </section>

      {/* 2. Analytics */}
      <section className="adminSection">
        <h2 className="adminSectionTitle">Analytics rápidas</h2>
        <div className="adminAnalyticsGrid">
          <div className="adminAnalyticsCard">
            <h3 className="adminAnalyticsCardTitle">Ventas por día</h3>
            <ul className="adminAnalyticsList">
              {salesByDay.length === 0 ? (
                <li className="adminAnalyticsEmpty">Sin datos</li>
              ) : (
                salesByDay.map((d) => (
                  <li key={d.dateKey}>
                    <span>{getDayLabel(d.dateKey, `${d.dateKey}T12:00:00`)}</span>
                    <span>${d.total?.toLocaleString("es-AR")} ({d.count})</span>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="adminAnalyticsCard">
            <h3 className="adminAnalyticsCardTitle">Pedidos por hora</h3>
            <ul className="adminAnalyticsList">
              {ordersByHour.length === 0 ? (
                <li className="adminAnalyticsEmpty">Sin datos</li>
              ) : (
                ordersByHour.slice(0, 5).map((x) => (
                  <li key={x.hour}>
                    <span>{String(x.hour).padStart(2, "0")}:00</span>
                    <span>{x.count} pedido{x.count !== 1 ? "s" : ""}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="adminAnalyticsCard">
            <h3 className="adminAnalyticsCardTitle">Top productos</h3>
            <ol className="adminAnalyticsList adminAnalyticsListOl">
              {topProductsList.length === 0 ? (
                <li className="adminAnalyticsEmpty">Sin datos</li>
              ) : (
                topProductsList.map((p, i) => (
                  <li key={p.name}>
                    <span>{i + 1}. {p.name}</span>
                    <span>{p.qty}</span>
                  </li>
                ))
              )}
            </ol>
          </div>
        </div>
      </section>

      {/* 3. Filtros + Lista de pedidos */}
      <section className="adminSection">
        <div className="adminFiltersRow">
          <h2 className="adminSectionTitle">Pedidos operativos</h2>
          <div className="adminFilters">
            <div className="adminFilterGroup">
              <span className="adminFilterLabel">Período</span>
              <div className="adminFilterChips">
                {["hoy", "semana", "mes", "calendario"].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={`adminChip ${viewMode === mode ? "adminChipActive" : ""}`}
                    onClick={() => setViewMode(mode)}
                  >
                    {mode === "hoy" ? "Hoy" : mode === "semana" ? "Semana" : mode === "mes" ? "Mes" : "Calendario"}
                  </button>
                ))}
              </div>
            </div>
            <div className="adminFilterGroup">
              <span className="adminFilterLabel">Estado</span>
              <div className="adminFilterChips">
                {["todos", "en_preparacion", "enviado", "entregado"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`adminChip ${statusFilter === s ? "adminChipActive" : ""}`}
                    onClick={() => setStatusFilter(s)}
                  >
                    {s === "todos" ? "Todos" : orderStatusLabel(s)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {cleanConfirm && (
        <div className="adminModalCard">
          <div className="adminModalTitle">Limpiar pedidos</div>
          <p className="adminModalText">
            Se eliminarán pedidos entregados y pedidos más antiguos que los días indicados.
          </p>
          <div className="adminModalField">
            <label className="adminModalLabel">Más antiguos que (días)</label>
            <input
              type="number"
              min={1}
              max={365}
              value={cleanOlderDays}
              onChange={(e) => setCleanOlderDays(Number(e.target.value) || 30)}
              className="adminModalInput"
            />
          </div>
          <div className="adminModalActions">
            <button type="button" className="btn btnPrimary" onClick={handleCleanOrders} disabled={cleanLoading}>
              {cleanLoading ? "Eliminando..." : "Eliminar"}
            </button>
            <button type="button" className="btn btnGhost" onClick={() => setCleanConfirm(false)} disabled={cleanLoading}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {filteredOrders.length === 0 ? (
        <div className="adminEmpty">
          {orders.length === 0 ? "No hay pedidos todavía." : "No hay pedidos con los filtros seleccionados."}
        </div>
      ) : (
        <div className="adminOrderList">
          {(() => {
            const byDate = {};
            (filteredOrders || []).forEach((o) => {
              const k = getDateKey(o.createdAt) || "sin-fecha";
              if (!byDate[k]) byDate[k] = [];
              byDate[k].push(o);
            });
            const dateKeys = Object.keys(byDate).sort((a, b) => (a > b ? -1 : 1));
            return dateKeys.map((dateKey) => (
              <div key={dateKey} className="adminDayBlock">
                <div className="adminDayLabel">{getDayLabel(dateKey, byDate[dateKey][0]?.createdAt)}</div>
                <div className="adminDayOrders">
                  {(byDate[dateKey] || []).map((order) => {
                    const isNew = (order.orderStatus || "").toLowerCase() === "nuevo";
                    const statusSlug = (order.orderStatus || "").toLowerCase();
                    const expanded = expandedItems.has(order.id);
                    return (
                      <div
                        key={order.id}
                        className={`adminOrderCard ${isNew ? "adminOrderCardNew" : ""}`}
                      >
                        <div className="adminOrderCardHeader">
                          {isNew && <span className="adminBadgeNew">Nuevo pedido</span>}
                          <div className="adminOrderCardMeta">
                            <span className="adminOrderTime">{formatTime(order.createdAt)}</span>
                            <span className="adminOrderClient">{order.customer?.name || "—"}</span>
                            <span className="adminOrderTotal">${order.total ?? "—"}</span>
                            <span className="adminOrderPayment">{paymentMethodLabel(order.paymentMethod)}</span>
                            <span className={`adminStatusPill adminStatusPill--${statusSlug === "en_preparacion" ? "prep" : statusSlug === "enviado" ? "enviado" : statusSlug === "entregado" ? "entregado" : "nuevo"}`}>
                              {orderStatusLabel(order.orderStatus)}
                            </span>
                            <span className="adminStatusPill adminStatusPill--pay">{paymentStatusLabel(order.paymentStatus)}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="adminOrderItemsToggle"
                          onClick={() => toggleExpanded(order.id)}
                          aria-expanded={expanded}
                        >
                          Items: {(order.items || []).length} — {expanded ? "Ocultar" : "Ver detalle"}
                        </button>
                        {expanded && (
                          <ul className="adminOrderItems">
                            {(order.items || []).map((it) => (
                              <li key={it.id}>{it.qty}x {it.name} — ${it.total}</li>
                            ))}
                          </ul>
                        )}
                        {order.customer?.notes?.trim() && expanded && (
                          <div className="adminOrderNotes">Notas: {order.customer.notes.trim()}</div>
                        )}
                        <div className="adminOrderActions">
                          {order.paymentStatus !== "pagado" && (
                            <button type="button" className="btn btnSecondary adminOrderBtn" disabled={updatingId === order.id}
                              onClick={() => { setUpdatingId(order.id); updateOrderStatus(order.id, { payment_status: "pagado" }, getAdminToken()).then(() => refresh()).catch((e) => { if (e?.message?.includes("autorizado")) handleUnauthorized(); }).finally(() => setUpdatingId(null)); }}>
                              Confirmar pago
                            </button>
                          )}
                          {order.orderStatus !== "en_preparacion" && (
                            <button type="button" className="btn btnGhost adminOrderBtn" disabled={updatingId === order.id}
                              onClick={() => { setUpdatingId(order.id); updateOrderStatus(order.id, { order_status: "en_preparacion" }, getAdminToken()).then(() => refresh()).catch((e) => { if (e?.message?.includes("autorizado")) handleUnauthorized(); }).finally(() => setUpdatingId(null)); }}>
                              En preparación
                            </button>
                          )}
                          {order.orderStatus !== "enviado" && (
                            <button type="button" className="btn btnGhost adminOrderBtn" disabled={updatingId === order.id}
                              onClick={() => { setUpdatingId(order.id); updateOrderStatus(order.id, { order_status: "enviado" }, getAdminToken()).then(() => refresh()).catch((e) => { if (e?.message?.includes("autorizado")) handleUnauthorized(); }).finally(() => setUpdatingId(null)); }}>
                              Enviado
                            </button>
                          )}
                          {order.orderStatus !== "entregado" && (
                            <button type="button" className="btn btnPrimary adminOrderBtn" disabled={updatingId === order.id}
                              onClick={() => { setUpdatingId(order.id); updateOrderStatus(order.id, { order_status: "entregado" }, getAdminToken()).then(() => refresh()).catch((e) => { if (e?.message?.includes("autorizado")) handleUnauthorized(); }).finally(() => setUpdatingId(null)); }}>
                              Entregado
                            </button>
                          )}
                          <button type="button" className="btn btnGhost adminOrderBtn" onClick={() => handleCopyOrder(order)}>
                            Copiar pedido
                          </button>
                          <button type="button" className="btn btnGhost adminOrderBtn adminOrderBtnDanger" disabled={updatingId === order.id || deleteLoading}
                            onClick={() => setDeleteConfirmId(deleteConfirmId === order.id ? null : order.id)}>
                            Borrar
                          </button>
                        </div>
                        {deleteConfirmId === order.id && (
                          <div className="adminDeleteConfirm">
                            <p>¿Borrar pedido #{order.id}? No se puede deshacer.</p>
                            <div className="adminDeleteConfirmActions">
                              <button type="button" className="btn btnPrimary adminBtnDanger" disabled={deleteLoading} onClick={() => handleDeleteOrder(order.id)}>{deleteLoading ? "Borrando..." : "Sí, borrar"}</button>
                              <button type="button" className="btn btnGhost" disabled={deleteLoading} onClick={() => setDeleteConfirmId(null)}>Cancelar</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ));
          })()}
        </div>
      )}
    </div>
  );
}
