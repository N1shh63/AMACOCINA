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

function getTodayKey() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}

function getYesterdayKey() {
  const t = new Date();
  t.setDate(t.getDate() - 1);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}

function getStartOfThisWeek() {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  const day = t.getDay();
  const diff = day === 0 ? 6 : day - 1;
  t.setDate(t.getDate() - diff);
  return t;
}

function getStartOfThisMonth() {
  const t = new Date();
  t.setDate(1);
  t.setHours(0, 0, 0, 0);
  return t;
}

function getStartOfLastWeek() {
  const start = getStartOfThisWeek();
  const last = new Date(start);
  last.setDate(last.getDate() - 7);
  return last;
}

function getStartOfLastMonth() {
  const t = new Date();
  t.setMonth(t.getMonth() - 1);
  t.setDate(1);
  t.setHours(0, 0, 0, 0);
  return t;
}

function computeKpiMain(orders) {
  if (!orders || orders.length === 0) {
    return { salesToday: 0, salesWeek: 0, salesMonth: 0, ordersToday: 0, avgTicket: 0, unitsSold: 0 };
  }
  const todayKey = getTodayKey();
  const startWeek = getStartOfThisWeek();
  const startMonth = getStartOfThisMonth();
  let salesToday = 0;
  let salesWeek = 0;
  let salesMonth = 0;
  let ordersToday = 0;
  let totalAmount = 0;
  let unitsSold = 0;
  orders.forEach((o) => {
    const date = new Date(o.createdAt);
    const total = Number(o.total || 0);
    totalAmount += total;
    if (getDateKey(o.createdAt) === todayKey) {
      salesToday += total;
      ordersToday += 1;
    }
    if (date >= startWeek) salesWeek += total;
    if (date >= startMonth) salesMonth += total;
    (o.items || []).forEach((it) => { unitsSold += Number(it.qty || 0); });
  });
  return {
    salesToday,
    salesWeek,
    salesMonth,
    ordersToday,
    avgTicket: orders.length ? Math.round(totalAmount / orders.length) : 0,
    unitsSold,
  };
}

function computeComparatives(orders) {
  if (!orders || orders.length === 0) return { todayVsYesterday: null, weekVsLastWeek: null, monthVsLastMonth: null };
  const todayKey = getTodayKey();
  const yesterdayKey = getYesterdayKey();
  const startWeek = getStartOfThisWeek();
  const endWeek = new Date(startWeek);
  endWeek.setDate(endWeek.getDate() + 7);
  const startLastWeek = getStartOfLastWeek();
  const startMonth = getStartOfThisMonth();
  const startLastMonth = getStartOfLastMonth();
  let salesToday = 0, salesYesterday = 0, salesWeek = 0, salesLastWeek = 0, salesMonth = 0, salesLastMonth = 0;
  orders.forEach((o) => {
    const d = new Date(o.createdAt);
    const k = getDateKey(o.createdAt);
    const t = Number(o.total || 0);
    if (k === todayKey) salesToday += t;
    if (k === yesterdayKey) salesYesterday += t;
    if (d >= startWeek && d < endWeek) salesWeek += t;
    if (d >= startLastWeek && d < startWeek) salesLastWeek += t;
    if (d >= startMonth) salesMonth += t;
    if (d >= startLastMonth && d < startMonth) salesLastMonth += t;
  });
  const pct = (curr, prev) => (prev === 0 ? (curr === 0 ? "igual" : 100) : Math.round(((curr - prev) / prev) * 100));
  return {
    todayVsYesterday: salesYesterday > 0 || salesToday > 0 ? pct(salesToday, salesYesterday) : null,
    weekVsLastWeek: salesLastWeek > 0 || salesWeek > 0 ? pct(salesWeek, salesLastWeek) : null,
    monthVsLastMonth: salesLastMonth > 0 || salesMonth > 0 ? pct(salesMonth, salesLastMonth) : null,
  };
}

function computeExecutiveSummary(orders) {
  if (!orders || orders.length === 0) {
    return { bestCustomerSpend: null, bestCustomerOrders: null, topProductUnits: null, topProductRevenue: null, topPayment: null, busiestHour: null };
  }
  const byCustomerAmount = {};
  const byCustomerOrders = {};
  const byProductUnits = {};
  const byProductRevenue = {};
  const byPayment = {};
  const byHour = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }));
  orders.forEach((o) => {
    const name = (o.customer?.name || "").trim() || "—";
    byCustomerOrders[name] = (byCustomerOrders[name] || 0) + 1;
    byCustomerAmount[name] = (byCustomerAmount[name] || 0) + Number(o.total || 0);
    const method = o.paymentMethod || "—";
    byPayment[method] = (byPayment[method] || 0) + 1;
    const h = new Date(o.createdAt).getHours();
    if (h >= 0 && h < 24) byHour[h].count += 1;
    (o.items || []).forEach((it) => {
      const key = it.name || it.id || "—";
      byProductUnits[key] = (byProductUnits[key] || 0) + Number(it.qty || 0);
      byProductRevenue[key] = (byProductRevenue[key] || 0) + Number(it.total || 0);
    });
  });
  const bestByAmount = Object.entries(byCustomerAmount).sort((a, b) => b[1] - a[1])[0];
  const bestByOrders = Object.entries(byCustomerOrders).sort((a, b) => b[1] - a[1])[0];
  const topByUnits = Object.entries(byProductUnits).sort((a, b) => b[1] - a[1])[0];
  const topByRevenue = Object.entries(byProductRevenue).sort((a, b) => b[1] - a[1])[0];
  const topPay = Object.entries(byPayment).sort((a, b) => b[1] - a[1])[0];
  const busyHour = byHour.filter((x) => x.count > 0).sort((a, b) => b.count - a.count)[0];
  return {
    bestCustomerSpend: bestByAmount ? { name: bestByAmount[0], amount: bestByAmount[1] } : null,
    bestCustomerOrders: bestByOrders ? { name: bestByOrders[0], count: bestByOrders[1] } : null,
    topProductUnits: topByUnits ? { name: topByUnits[0], qty: topByUnits[1] } : null,
    topProductRevenue: topByRevenue ? { name: topByRevenue[0], revenue: topByRevenue[1] } : null,
    topPayment: topPay ? { method: topPay[0], count: topPay[1] } : null,
    busiestHour: busyHour ? { hour: busyHour.hour, count: busyHour.count } : null,
  };
}

function computeTopClientsBySpend(orders, limit = 5) {
  if (!orders || orders.length === 0) return [];
  const byCustomer = {};
  orders.forEach((o) => {
    const name = (o.customer?.name || "").trim() || "—";
    if (!byCustomer[name]) byCustomer[name] = { name, amount: 0, orders: 0 };
    byCustomer[name].amount += Number(o.total || 0);
    byCustomer[name].orders += 1;
  });
  return Object.values(byCustomer)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

function computeTopClientsByOrders(orders, limit = 5) {
  if (!orders || orders.length === 0) return [];
  const byCustomer = {};
  orders.forEach((o) => {
    const name = (o.customer?.name || "").trim() || "—";
    if (!byCustomer[name]) byCustomer[name] = { name, amount: 0, orders: 0 };
    byCustomer[name].amount += Number(o.total || 0);
    byCustomer[name].orders += 1;
  });
  return Object.values(byCustomer)
    .sort((a, b) => b.orders - a.orders)
    .slice(0, limit);
}

function computeTopProductsByUnits(orders, limit = 10) {
  if (!orders || orders.length === 0) return [];
  const byProduct = {};
  orders.forEach((o) => {
    (o.items || []).forEach((it) => {
      const key = it.name || it.id || "—";
      byProduct[key] = (byProduct[key] || 0) + Number(it.qty || 0);
    });
  });
  return Object.entries(byProduct)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, qty]) => ({ name, qty }));
}

function computeTopProductsByRevenue(orders, limit = 10) {
  if (!orders || orders.length === 0) return [];
  const byProduct = {};
  orders.forEach((o) => {
    (o.items || []).forEach((it) => {
      const key = it.name || it.id || "—";
      byProduct[key] = (byProduct[key] || 0) + Number(it.total || 0);
    });
  });
  return Object.entries(byProduct)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, revenue]) => ({ name, revenue }));
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

  const kpiMain = useMemo(() => computeKpiMain(orders), [orders]);
  const comparatives = useMemo(() => computeComparatives(orders), [orders]);
  const executiveSummary = useMemo(() => computeExecutiveSummary(orders), [orders]);
  const todayStats = useMemo(() => computeTodayStats(orders), [orders]);
  const salesByDay = useMemo(() => computeSalesByDay(orders, 14), [orders]);
  const ordersByHour = useMemo(() => computeOrdersByHour(orders), [orders]);
  const topProductsByUnits = useMemo(() => computeTopProductsByUnits(orders, 10), [orders]);
  const topProductsByRevenue = useMemo(() => computeTopProductsByRevenue(orders, 10), [orders]);
  const topClientsBySpend = useMemo(() => computeTopClientsBySpend(orders, 5), [orders]);
  const topClientsByOrders = useMemo(() => computeTopClientsByOrders(orders, 5), [orders]);

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

      {/* 1. KPI principales */}
      <section className="adminSection">
        <h2 className="adminSectionTitle">KPI principales</h2>
        <div className="adminKpiGrid adminKpiGridWide">
          <div className="adminKpiCard adminKpiCardHighlight">
            <span className="adminKpiLabel">Ventas hoy</span>
            <span className="adminKpiValue">${kpiMain.salesToday?.toLocaleString("es-AR") ?? 0}</span>
            {comparatives.todayVsYesterday != null && comparatives.todayVsYesterday !== "igual" && (
              <span className={`adminKpiDelta ${typeof comparatives.todayVsYesterday === "number" && comparatives.todayVsYesterday >= 0 ? "adminKpiDeltaUp" : "adminKpiDeltaDown"}`}>
                {typeof comparatives.todayVsYesterday === "number" && comparatives.todayVsYesterday >= 0 ? "+" : ""}{comparatives.todayVsYesterday}% vs ayer
              </span>
            )}
          </div>
          <div className="adminKpiCard">
            <span className="adminKpiLabel">Ventas semana</span>
            <span className="adminKpiValue">${kpiMain.salesWeek?.toLocaleString("es-AR") ?? 0}</span>
            {comparatives.weekVsLastWeek != null && comparatives.weekVsLastWeek !== "igual" && (
              <span className={`adminKpiDelta ${typeof comparatives.weekVsLastWeek === "number" && comparatives.weekVsLastWeek >= 0 ? "adminKpiDeltaUp" : "adminKpiDeltaDown"}`}>
                {typeof comparatives.weekVsLastWeek === "number" && comparatives.weekVsLastWeek >= 0 ? "+" : ""}{comparatives.weekVsLastWeek}% vs sem. ant.
              </span>
            )}
          </div>
          <div className="adminKpiCard">
            <span className="adminKpiLabel">Ventas mes</span>
            <span className="adminKpiValue">${kpiMain.salesMonth?.toLocaleString("es-AR") ?? 0}</span>
            {comparatives.monthVsLastMonth != null && comparatives.monthVsLastMonth !== "igual" && (
              <span className={`adminKpiDelta ${typeof comparatives.monthVsLastMonth === "number" && comparatives.monthVsLastMonth >= 0 ? "adminKpiDeltaUp" : "adminKpiDeltaDown"}`}>
                {typeof comparatives.monthVsLastMonth === "number" && comparatives.monthVsLastMonth >= 0 ? "+" : ""}{comparatives.monthVsLastMonth}% vs mes ant.
              </span>
            )}
          </div>
          <div className="adminKpiCard">
            <span className="adminKpiLabel">Pedidos hoy</span>
            <span className="adminKpiValue">{kpiMain.ordersToday}</span>
          </div>
          <div className="adminKpiCard">
            <span className="adminKpiLabel">Ticket promedio</span>
            <span className="adminKpiValue">${kpiMain.avgTicket?.toLocaleString("es-AR") ?? 0}</span>
          </div>
          <div className="adminKpiCard">
            <span className="adminKpiLabel">Unidades vendidas</span>
            <span className="adminKpiValue">{kpiMain.unitsSold?.toLocaleString("es-AR") ?? 0}</span>
          </div>
        </div>
      </section>

      {/* 2. Resumen ejecutivo del negocio */}
      <section className="adminSection">
        <h2 className="adminSectionTitle">Resumen ejecutivo</h2>
        <div className="adminExecutiveGrid">
          <div className="adminExecutiveCard adminExecutiveCardHighlight">
            <span className="adminExecutiveLabel">Mejor cliente (gasto)</span>
            <span className="adminExecutiveValue">{executiveSummary.bestCustomerSpend?.name ?? "—"}</span>
            {executiveSummary.bestCustomerSpend && <span className="adminExecutiveMeta">${executiveSummary.bestCustomerSpend.amount?.toLocaleString("es-AR")}</span>}
          </div>
          <div className="adminExecutiveCard">
            <span className="adminExecutiveLabel">Cliente más recurrente</span>
            <span className="adminExecutiveValue">{executiveSummary.bestCustomerOrders?.name ?? "—"}</span>
            {executiveSummary.bestCustomerOrders && <span className="adminExecutiveMeta">{executiveSummary.bestCustomerOrders.count} pedidos</span>}
          </div>
          <div className="adminExecutiveCard adminExecutiveCardHighlight">
            <span className="adminExecutiveLabel">Producto más vendido</span>
            <span className="adminExecutiveValue adminExecutiveValueSmall">{executiveSummary.topProductUnits?.name ?? "—"}</span>
            {executiveSummary.topProductUnits && <span className="adminExecutiveMeta">{executiveSummary.topProductUnits.qty} un.</span>}
          </div>
          <div className="adminExecutiveCard adminExecutiveCardHighlight">
            <span className="adminExecutiveLabel">Producto que más factura</span>
            <span className="adminExecutiveValue adminExecutiveValueSmall">{executiveSummary.topProductRevenue?.name ?? "—"}</span>
            {executiveSummary.topProductRevenue && <span className="adminExecutiveMeta">${executiveSummary.topProductRevenue.revenue?.toLocaleString("es-AR")}</span>}
          </div>
          <div className="adminExecutiveCard">
            <span className="adminExecutiveLabel">Método de pago más usado</span>
            <span className="adminExecutiveValue">{paymentMethodLabel(executiveSummary.topPayment?.method) ?? "—"}</span>
          </div>
          <div className="adminExecutiveCard">
            <span className="adminExecutiveLabel">Franja con más pedidos</span>
            <span className="adminExecutiveValue">{executiveSummary.busiestHour != null ? `${String(executiveSummary.busiestHour.hour).padStart(2, "0")}:00 (${executiveSummary.busiestHour.count})` : "—"}</span>
          </div>
        </div>
      </section>

      {/* 3. Analytics detalladas */}
      <section className="adminSection">
        <h2 className="adminSectionTitle">Analytics detalladas</h2>
        <div className="adminAnalyticsGrid adminAnalyticsGridWide">
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
                ordersByHour.slice(0, 8).map((x) => (
                  <li key={x.hour}>
                    <span>{String(x.hour).padStart(2, "0")}:00</span>
                    <span>{x.count} pedido{x.count !== 1 ? "s" : ""}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="adminAnalyticsCard">
            <h3 className="adminAnalyticsCardTitle">Top productos (unidades)</h3>
            <ol className="adminAnalyticsList adminAnalyticsListOl">
              {topProductsByUnits.length === 0 ? (
                <li className="adminAnalyticsEmpty">Sin datos</li>
              ) : (
                topProductsByUnits.map((p, i) => (
                  <li key={p.name}>
                    <span>{i + 1}. {p.name}</span>
                    <span>{p.qty}</span>
                  </li>
                ))
              )}
            </ol>
          </div>
          <div className="adminAnalyticsCard">
            <h3 className="adminAnalyticsCardTitle">Top productos (facturación)</h3>
            <ol className="adminAnalyticsList adminAnalyticsListOl">
              {topProductsByRevenue.length === 0 ? (
                <li className="adminAnalyticsEmpty">Sin datos</li>
              ) : (
                topProductsByRevenue.map((p, i) => (
                  <li key={p.name}>
                    <span>{i + 1}. {p.name}</span>
                    <span>${p.revenue?.toLocaleString("es-AR")}</span>
                  </li>
                ))
              )}
            </ol>
          </div>
          <div className="adminAnalyticsCard">
            <h3 className="adminAnalyticsCardTitle">Top clientes (gasto)</h3>
            <ul className="adminAnalyticsList">
              {topClientsBySpend.length === 0 ? (
                <li className="adminAnalyticsEmpty">Sin datos</li>
              ) : (
                topClientsBySpend.map((c, i) => (
                  <li key={c.name}>
                    <span>{i + 1}. {c.name}</span>
                    <span>${c.amount?.toLocaleString("es-AR")} ({c.orders})</span>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="adminAnalyticsCard">
            <h3 className="adminAnalyticsCardTitle">Top clientes (pedidos)</h3>
            <ul className="adminAnalyticsList">
              {topClientsByOrders.length === 0 ? (
                <li className="adminAnalyticsEmpty">Sin datos</li>
              ) : (
                topClientsByOrders.map((c, i) => (
                  <li key={c.name}>
                    <span>{i + 1}. {c.name}</span>
                    <span>{c.orders} — ${c.amount?.toLocaleString("es-AR")}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </section>

      {/* 4. Filtros + Lista de pedidos operativos */}
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
