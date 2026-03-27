import { Link, Navigate, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getOrders, cleanOrders } from "../services/orders";
import { isAdminLogged, setAdminLogged } from "./AdminLogin";
import { getAdminToken, setAdminToken } from "../services/admin";

function getDateKey(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  } catch {
    return "";
  }
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

function computeKpiMain(orders) {
  if (!orders || orders.length === 0) {
    return { salesToday: 0, salesWeek: 0, salesMonth: 0, avgTicket: 0, unitsSold: 0 };
  }
  const todayKey = getTodayKey();
  const startWeek = getStartOfThisWeek();
  const startMonth = getStartOfThisMonth();
  let salesToday = 0;
  let salesWeek = 0;
  let salesMonth = 0;
  let totalAmount = 0;
  let unitsSold = 0;

  orders.forEach((o) => {
    const date = new Date(o.createdAt);
    const total = Number(o.total || 0);
    totalAmount += total;
    if (getDateKey(o.createdAt) === todayKey) salesToday += total;
    if (date >= startWeek) salesWeek += total;
    if (date >= startMonth) salesMonth += total;
    (o.items || []).forEach((it) => { unitsSold += Number(it.qty || 0); });
  });

  return {
    salesToday,
    salesWeek,
    salesMonth,
    avgTicket: orders.length ? Math.round(totalAmount / orders.length) : 0,
    unitsSold,
  };
}

function computeComparatives(orders) {
  if (!orders || orders.length === 0) return { todayVsYesterday: null, weekVsLastWeek: null };
  const todayKey = getTodayKey();
  const yesterdayKey = getYesterdayKey();
  const startWeek = getStartOfThisWeek();
  const endWeek = new Date(startWeek);
  endWeek.setDate(endWeek.getDate() + 7);
  const startLastWeek = getStartOfLastWeek();
  let salesToday = 0;
  let salesYesterday = 0;
  let salesWeek = 0;
  let salesLastWeek = 0;
  orders.forEach((o) => {
    const d = new Date(o.createdAt);
    const k = getDateKey(o.createdAt);
    const t = Number(o.total || 0);
    if (k === todayKey) salesToday += t;
    if (k === yesterdayKey) salesYesterday += t;
    if (d >= startWeek && d < endWeek) salesWeek += t;
    if (d >= startLastWeek && d < startWeek) salesLastWeek += t;
  });
  const pct = (curr, prev) => (prev === 0 ? (curr === 0 ? "igual" : 100) : Math.round(((curr - prev) / prev) * 100));
  return {
    todayVsYesterday: salesYesterday > 0 || salesToday > 0 ? pct(salesToday, salesYesterday) : null,
    weekVsLastWeek: salesLastWeek > 0 || salesWeek > 0 ? pct(salesWeek, salesLastWeek) : null,
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

function paymentMethodLabel(method) {
  if (!method) return "—";
  const map = { mercadopago: "Mercado Pago", efectivo: "Efectivo", whatsapp: "WhatsApp", alias: "Alias" };
  return map[method] || method;
}

function formatKpiDelta(value) {
  if (value == null || value === "igual") return null;
  const num = Number(value);
  if (Number.isNaN(num)) return null;
  return `(${num >= 0 ? "+" : ""}${num}%)`;
}

function formatBusyHour(busyHour) {
  if (!busyHour) return "—";
  const hour = String(busyHour.hour).padStart(2, "0");
  return `${hour}:00 (${busyHour.count})`;
}

export default function AdminDashboard() {
  if (!isAdminLogged()) {
    return <Navigate to="/admin/login" replace />;
  }
  return <AdminDashboardContent />;
}

function AdminDashboardContent() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [cleanLoading, setCleanLoading] = useState(false);
  const [cleanConfirm, setCleanConfirm] = useState(false);
  const [cleanOlderDays, setCleanOlderDays] = useState(30);

  const handleUnauthorized = useCallback(() => {
    setAdminLogged(false);
    setAdminToken(null);
    navigate("/admin/login", { replace: true });
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    const token = getAdminToken();

    getOrders({ limit: 200, offset: 0, exclude_order_status: "draft", token })
      .then((data) => {
        if (!cancelled) setOrders(data.orders || []);
      })
      .catch((e) => {
        if (!cancelled) {
          if (e?.message?.includes("autorizado") || e?.message?.includes("No autorizado")) {
            handleUnauthorized();
            return;
          }
          setError(e?.message || "Error al cargar dashboard");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [refreshKey, handleUnauthorized]);

  const kpiMain = useMemo(() => computeKpiMain(orders), [orders]);
  const comparatives = useMemo(() => computeComparatives(orders), [orders]);
  const executiveSummary = useMemo(() => computeExecutiveSummary(orders), [orders]);
  const topInsight = useMemo(() => {
    const product = executiveSummary.topProductRevenue?.name;
    const payment = paymentMethodLabel(executiveSummary.topPayment?.method);
    if (product && payment && payment !== "—") return `${product} impulsa ventas y domina ${payment}.`;
    if (product) return `${product} es el foco actual de facturación.`;
    if (payment && payment !== "—") return `${payment} es el método de cobro más fuerte.`;
    return "Aún no hay datos suficientes para un insight comercial.";
  }, [executiveSummary]);

  const handleCleanOrders = () => {
    setCleanLoading(true);
    cleanOrders({ older_than_days: cleanOlderDays, delete_entregado: true, token: getAdminToken() })
      .then(() => {
        setCleanConfirm(false);
        setRefreshKey((k) => k + 1);
      })
      .catch((e) => {
        if (e?.message?.includes("autorizado") || e?.message?.includes("No autorizado")) handleUnauthorized();
      })
      .finally(() => setCleanLoading(false));
  };

  if (loading) {
    return <div className="adminDashboard"><div className="adminLoading">Cargando dashboard...</div></div>;
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

  return (
    <div className="adminDashboard">
      <header className="adminHeader">
        <h1 className="adminTitle">Dashboard</h1>
        <p className="adminSubtitle">Resumen ejecutivo de ventas y negocio</p>
        <div className="adminHeaderActions">
          <Link to="/" className="adminLinkBack">← Menú</Link>
          <button type="button" className="btn btnSecondary adminBtnClean" onClick={() => setCleanConfirm(true)} disabled={cleanLoading}>
            Limpiar pedidos
          </button>
          <Link to="/admin/orders" className="btn btnPrimary">Ver pedidos</Link>
        </div>
      </header>

      <section className="adminSection adminSectionKpi">
        <div className="adminSectionHead">
          <div>
            <h2 className="adminSectionTitle">KPI ejecutivos</h2>
            <div className="adminSectionSubtitle">Lectura rápida para decidir en segundos</div>
          </div>
        </div>
        <div className="adminKpiRows">
          <div className="adminKpiGrid adminKpiGridExecutive adminKpiGridMain">
            <div className="adminKpiCard"><span className="adminKpiLabel">Ventas hoy</span><span className="adminKpiValue">${kpiMain.salesToday?.toLocaleString("es-AR") ?? 0}</span></div>
            <div className="adminKpiCard"><span className="adminKpiLabel">Ventas semana</span><span className="adminKpiValue">${kpiMain.salesWeek?.toLocaleString("es-AR") ?? 0}</span></div>
            <div className="adminKpiCard"><span className="adminKpiLabel">Ventas mes</span><span className="adminKpiValue">${kpiMain.salesMonth?.toLocaleString("es-AR") ?? 0}</span></div>
            <div className="adminKpiCard"><span className="adminKpiLabel">Ticket promedio</span><span className="adminKpiValue">${kpiMain.avgTicket?.toLocaleString("es-AR") ?? 0}</span></div>
            <div className="adminKpiCard"><span className="adminKpiLabel">Unidades vendidas</span><span className="adminKpiValue">{kpiMain.unitsSold?.toLocaleString("es-AR") ?? 0}</span></div>
          </div>
          <div className="adminKpiGrid adminKpiGridExecutive adminKpiGridSecondary">
            <div className="adminKpiCard adminKpiCardSecondary">
              <span className="adminKpiLabel">Diferencia vs ayer</span>
              <span className={`adminKpiVariation ${comparatives.todayVsYesterday < 0 ? "adminKpiDeltaDown" : "adminKpiDeltaUp"}`}>{formatKpiDelta(comparatives.todayVsYesterday) || "—"}</span>
            </div>
            <div className="adminKpiCard adminKpiCardSecondary">
              <span className="adminKpiLabel">Diferencia vs semana anterior</span>
              <span className={`adminKpiVariation ${comparatives.weekVsLastWeek < 0 ? "adminKpiDeltaDown" : "adminKpiDeltaUp"}`}>{formatKpiDelta(comparatives.weekVsLastWeek) || "—"}</span>
            </div>
            <div className="adminKpiCard adminKpiCardSecondary">
              <span className="adminKpiLabel">Mejor cliente</span>
              <span className="adminKpiValue adminKpiValueSmall">{executiveSummary.bestCustomerSpend?.name ?? "—"}</span>
              {executiveSummary.bestCustomerSpend && <span className="adminKpiDelta">${executiveSummary.bestCustomerSpend.amount?.toLocaleString("es-AR")}</span>}
            </div>
            <div className="adminKpiCard adminKpiCardSecondary">
              <span className="adminKpiLabel">Producto más vendido</span>
              <span className="adminKpiValue adminKpiValueSmall">{executiveSummary.topProductUnits?.name ?? "—"}</span>
              {executiveSummary.topProductUnits && <span className="adminKpiDelta">{executiveSummary.topProductUnits.qty} un.</span>}
            </div>
            <div className="adminKpiCard adminKpiCardSecondary">
              <span className="adminKpiLabel">Método de pago más usado</span>
              <span className="adminKpiValue adminKpiValueSmall">{paymentMethodLabel(executiveSummary.topPayment?.method) ?? "—"}</span>
              {executiveSummary.topPayment && <span className="adminKpiDelta">{executiveSummary.topPayment.count} pedidos</span>}
            </div>
          </div>
        </div>
      </section>

      <section className="adminSection adminSectionInsights">
        <div className="adminSectionHead">
          <div>
            <h2 className="adminSectionTitle">Insights de negocio</h2>
            <div className="adminSectionSubtitle">Señales comerciales para seguimiento diario</div>
          </div>
        </div>
        <div className="adminExecutiveGrid adminExecutiveGridCompact">
          <div className="adminExecutiveCard adminExecutiveCardCompact">
            <span className="adminExecutiveLabel">Cliente más recurrente</span>
            <span className="adminExecutiveValue">{executiveSummary.bestCustomerOrders?.name ?? "—"}</span>
            {executiveSummary.bestCustomerOrders && <span className="adminExecutiveMeta">{executiveSummary.bestCustomerOrders.count} pedidos</span>}
          </div>
          <div className="adminExecutiveCard adminExecutiveCardCompact">
            <span className="adminExecutiveLabel">Producto que más factura</span>
            <span className="adminExecutiveValue adminExecutiveValueSmall">{executiveSummary.topProductRevenue?.name ?? "—"}</span>
            {executiveSummary.topProductRevenue && <span className="adminExecutiveMeta">${executiveSummary.topProductRevenue.revenue?.toLocaleString("es-AR")}</span>}
          </div>
          <div className="adminExecutiveCard adminExecutiveCardCompact">
            <span className="adminExecutiveLabel">Franja horaria más fuerte</span>
            <span className="adminExecutiveValue">{formatBusyHour(executiveSummary.busiestHour)}</span>
          </div>
          <div className="adminExecutiveCard adminExecutiveCardCompact adminExecutiveCardInsight">
            <span className="adminExecutiveLabel">Top insight comercial</span>
            <span className="adminExecutiveValue adminExecutiveValueSmall">{topInsight}</span>
          </div>
        </div>
      </section>

      {cleanConfirm && (
        <div className="adminModalCard">
          <div className="adminModalTitle">Limpiar pedidos</div>
          <p className="adminModalText">Se eliminarán pedidos entregados y pedidos más antiguos que los días indicados.</p>
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
            <button type="button" className="btn btnPrimary" onClick={handleCleanOrders} disabled={cleanLoading}>{cleanLoading ? "Eliminando..." : "Eliminar"}</button>
            <button type="button" className="btn btnGhost" onClick={() => setCleanConfirm(false)} disabled={cleanLoading}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

