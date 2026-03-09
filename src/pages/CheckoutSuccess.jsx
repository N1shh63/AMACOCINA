import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useCart } from "../store/CartContext";
import { getOrderById } from "../services/orders";

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const { clear } = useCart();

  const paymentId = searchParams.get("payment_id");
  const status = searchParams.get("status");
  const merchantOrderId = searchParams.get("merchant_order_id");
  const orderId = searchParams.get("order_id");

  const [order, setOrder] = useState(null);
  const [orderError, setOrderError] = useState("");

  // limpiar carrito cuando se entra a esta pantalla
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
        <div style={{ fontSize: "48px", marginBottom: "10px" }}>✅</div>

        <h1
          style={{
            margin: 0,
            fontSize: "28px",
            fontWeight: 900,
            letterSpacing: "-0.02em",
          }}
        >
          Pago aprobado
        </h1>

        <p
          style={{
            marginTop: "10px",
            color: "rgba(255,255,255,0.72)",
          }}
        >
          Tu pago fue procesado correctamente.
        </p>

        {paymentId && (
          <div
            style={{
              marginTop: "16px",
              fontSize: "13px",
              color: "rgba(255,255,255,0.6)",
            }}
          >
            <div>ID Pago: {paymentId}</div>
            <div>Estado: {status}</div>
            <div>Orden: {merchantOrderId}</div>
          </div>
        )}

        {order ? (
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
            <div style={{ fontWeight: 900, marginBottom: "6px" }}>
              Resumen del pedido
            </div>
            <div style={{ color: "rgba(255,255,255,0.72)", fontSize: "14px" }}>
              <div>
                <strong>Cliente:</strong> {order?.customer?.name}
              </div>
              <div>
                <strong>Total:</strong> ${order?.total}
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
        ) : orderError ? (
          <div
            style={{
              marginTop: "16px",
              fontSize: "13px",
              color: "rgba(255, 120, 120, 0.9)",
            }}
          >
            {orderError}
          </div>
        ) : null}

        <div
          style={{
            marginTop: "22px",
            display: "grid",
            gap: "10px",
          }}
        >
          <Link className="btn btnPrimary btnBlock" to="/">
            Volver al menú
          </Link>

          <a
            className="btn btnSecondary btnBlock"
            href="https://wa.me/5491158182038"
            target="_blank"
            rel="noreferrer"
          >
            Confirmar por WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}