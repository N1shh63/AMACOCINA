import { Link, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { useCart } from "../store/CartContext";

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const { clear } = useCart();

  const paymentId = searchParams.get("payment_id");
  const status = searchParams.get("status");
  const merchantOrderId = searchParams.get("merchant_order_id");

  // limpiar carrito cuando se entra a esta pantalla
  useEffect(() => {
    clear();
  }, []);

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