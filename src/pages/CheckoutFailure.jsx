import { Link, useSearchParams } from "react-router-dom";

export default function CheckoutFailure() {
  const [searchParams] = useSearchParams();

  const status = searchParams.get("status");
  const paymentId = searchParams.get("payment_id");

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
                border: "1px solid rgba(255, 80, 80, 0.28)",
                background: "rgba(255, 80, 80, 0.12)",
                fontWeight: 800,
                fontSize: "13px",
              }}
            >
              Pago no completado
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
              No pudimos confirmar el pago
            </h1>

            <p
              style={{
                margin: "10px 0 0",
                color: "rgba(255,255,255,0.72)",
                fontSize: "15px",
                lineHeight: 1.5,
              }}
            >
              El pago fue cancelado, rechazado o no terminó de procesarse.
              Podés volver al carrito e intentarlo nuevamente.
            </p>
          </div>

          {(status || paymentId) && (
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

              {status ? (
                <div>
                  <strong>Estado:</strong> {status}
                </div>
              ) : null}

              {paymentId ? (
                <div>
                  <strong>Payment ID:</strong> {paymentId}
                </div>
              ) : null}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "12px",
            }}
          >
            <Link className="btn btnPrimary btnBlock" to="/cart">
              Reintentar pago
            </Link>

            <Link className="btn btnSecondary btnBlock" to="/">
              Volver al menú
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}