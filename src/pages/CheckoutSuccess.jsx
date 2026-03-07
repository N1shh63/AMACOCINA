import { Link, useSearchParams } from "react-router-dom";

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();

  const paymentId = searchParams.get("payment_id");
  const status = searchParams.get("status");
  const merchantOrderId = searchParams.get("merchant_order_id");
  const preferenceId = searchParams.get("preference_id");

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
                border: "1px solid rgba(80, 200, 120, 0.28)",
                background: "rgba(80, 200, 120, 0.12)",
                fontWeight: 800,
                fontSize: "13px",
              }}
            >
              Pago aprobado
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
              Tu compra fue procesada correctamente
            </h1>

            <p
              style={{
                margin: "10px 0 0",
                color: "rgba(255,255,255,0.72)",
                fontSize: "15px",
                lineHeight: 1.5,
              }}
            >
              Recibimos el pago y el pedido ya puede seguir su flujo normal.
              Podés volver al menú o continuar por WhatsApp para coordinar detalles.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gap: "10px",
              padding: "14px",
              borderRadius: "16px",
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.04)",
            }}
          >
            <div style={{ fontWeight: 800, fontSize: "14px" }}>Detalle del retorno</div>

            <div style={{ display: "grid", gap: "8px", color: "rgba(255,255,255,0.78)", fontSize: "14px" }}>
              <div>
                <strong>Estado:</strong> {status || "approved"}
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
              {preferenceId ? (
                <div>
                  <strong>Preference ID:</strong> {preferenceId}
                </div>
              ) : null}
            </div>
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

            <a
              className="btn btnSecondary btnBlock"
              href="https://wa.me/5491158182038"
              target="_blank"
              rel="noreferrer"
            >
              Seguir por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}