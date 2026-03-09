import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useCart } from "../store/CartContext";
import { getOrderById } from "../services/orders";
import { buildWhatsAppMessage, openWhatsApp } from "../utils/whatsapp";

const WHATSAPP_PHONE = "5491158182038";

export default function CheckoutCashConfirmation() {
  const [searchParams] = useSearchParams();
  const { clear } = useCart();
  const orderId = searchParams.get("order_id");

  const [order, setOrder] = useState(null);
  const [orderError, setOrderError] = useState("");

  useEffect(() => {
    clear();
  }, []);

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

  const handleWhatsApp = () => {
    if (!order) return;
    const message = buildWhatsAppMessage({
      items: (order.items || []).map((i) => ({
        qty: i.qty,
        name: i.name,
        price: i.unitPrice,
      })),
      totalPrice: order.total,
      customer: order.customer || { name: "", notes: "" },
    });
    openWhatsApp({ phoneE164: WHATSAPP_PHONE, message });
  };

  if (orderError) {
    return (
      <section className="container">
        <div className="card" style={{ maxWidth: "600px", margin: "40px auto", textAlign: "center" }}>
          <p style={{ color: "rgba(255, 120, 120, 0.9)" }}>{orderError}</p>
          <Link className="btn btnPrimary btnBlock" to="/">
            Volver al menú
          </Link>
        </div>
      </section>
    );
  }

  if (!order) {
    return (
      <section className="container">
        <div className="card" style={{ maxWidth: "600px", margin: "40px auto", textAlign: "center" }}>
          <p className="muted">Cargando pedido...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="container">
      <div
        className="card"
        style={{
          maxWidth: "600px",
          margin: "40px auto",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "10px" }}>💵</div>
        <h1
          style={{
            margin: 0,
            fontSize: "28px",
            fontWeight: 900,
            letterSpacing: "-0.02em",
          }}
        >
          Pedido registrado – Pagá en efectivo
        </h1>
        <p
          style={{
            marginTop: "10px",
            color: "rgba(255,255,255,0.72)",
          }}
        >
          Tu pedido quedó registrado. Completá la confirmación por WhatsApp y pagá en efectivo al recibir.
        </p>

        <div
          style={{
            marginTop: "16px",
            padding: "14px",
            borderRadius: "16px",
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.04)",
            textAlign: "left",
          }}
        >
          <div style={{ fontWeight: 900, marginBottom: "6px" }}>Resumen del pedido</div>
          <div style={{ color: "rgba(255,255,255,0.72)", fontSize: "14px" }}>
            <div>
              <strong>Cliente:</strong> {order.customer?.name}
            </div>
            <div>
              <strong>Total:</strong> ${order.total}
            </div>
          </div>
          <div style={{ marginTop: "10px", display: "grid", gap: "6px" }}>
            {(order.items || []).map((it) => (
              <div key={it.id} style={{ fontSize: "14px" }}>
                {it.qty}x {it.name} — ${it.total}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            marginTop: "22px",
            display: "grid",
            gap: "10px",
          }}
        >
          <button
            type="button"
            className="btn btnPrimary btnBlock"
            onClick={handleWhatsApp}
          >
            Confirmar por WhatsApp
          </button>
          <Link className="btn btnSecondary btnBlock" to="/">
            Volver al menú
          </Link>
        </div>
      </div>
    </section>
  );
}
