import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getOrderById } from "../services/orders";

export default function CheckoutPending() {
  const [searchParams] = useSearchParams();

  const status = searchParams.get("status");
  const paymentId = searchParams.get("payment_id");
  const merchantOrderId = searchParams.get("merchant_order_id");
  const orderId = searchParams.get("order_id");

  const [order, setOrder] = useState(null);
  const [orderError, setOrderError] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!orderId) return;

    (async () => {
      try {
        setOrderError("");
        const data = await getOrderById(orderId);
        if (!cancelled) setOrder(data);
      } catch (e) {
        if (!cancelled) setOrderError(e?.message || "No se pudo cargar la orden.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  return (
    <section className="container">
      <div className="card" style={{ maxWidth: "680px", margin: "0 auto" }}>
        <div style={{ display: "grid", gap: "16px" }}>
          <div>
            <div
              style={{
                display: "inline-flex",
                padding: "8px 12px",
                borderRadius: "999px",
                border: "1px solid rgba(255, 196, 0, 0.28)",
                background: "rgba(255, 196, 0, 0.12)",
                fontWeight: 800,
                fontSize: "13px",
              }}
            >
              Pago pendiente
            </div>
          </div>

          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "clamp(28px, 4vw, 40px)",
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
              }}
            >
              Tu pago está en proceso
            </h1>

            <p
              style={{
                margin: "10px 0 0",
                color: "rgba(255,255,255,0.72)",
                fontSize: "15px",
                lineHeight: 1.5,
              }}
            >
              Mercado Pago informó que la operación todavía no está cerrada.
              En algunos medios de pago esto puede tardar unos minutos.
            </p>
          </div>

          {order ? (
            <div
              style={{
                display: "grid",
                gap: "8px",
                padding: "14px",
                borderRadius: "16px",
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.04)",
                color: "rgba(255,255,255,0.78)",
                fontSize: "14px",
              }}
            >
              <div style={{ fontWeight: 800, fontSize: "14px", color: "#fff" }}>
                Resumen del pedido
              </div>
              <div>
                <strong>Cliente:</strong> {order?.customer?.name}
              </div>
              <div>
                <strong>Total:</strong> ${order?.total}
              </div>
              <div style={{ display: "grid", gap: "6px", marginTop: "6px" }}>
                {(order.items || []).map((it) => (
                  <div key={it.id}>
                    {it.qty}x {it.name} — ${it.total}
                  </div>
                ))}
              </div>
            </div>
          ) : orderError ? (
            <div style={{ fontSize: "13px", color: "rgba(255, 120, 120, 0.9)" }}>
              {orderError}
            </div>
          ) : null}

          <div
            style={{
              display: "grid",
              gap: "8px",
              padding: "14px",
              borderRadius: "16px",
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.04)",
              color: "rgba(255,255,255,0.78)",
              fontSize: "14px",
            }}
          >
            <div style={{ fontWeight: 800, fontSize: "14px", color: "#fff" }}>
              Datos del retorno
            </div>

            <div>
              <strong>Estado:</strong> {status || "pending"}
            </div>

            {paymentId ? (
              <div>
                <strong>Payment ID:</strong> {paymentId}
              </div>
            ) : null}

            {merchantOrderId ? (
              <div>
                <strong>Merchant Order:</strong> {merchantOrderId}
              </div>
            ) : null}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "12px",
            }}
          >
            <Link className="btn btnPrimary btnBlock" to="/">
              Volver al menú
            </Link>

            <Link className="btn btnSecondary btnBlock" to="/cart">
              Ver carrito
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}