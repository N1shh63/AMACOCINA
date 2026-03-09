import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useCart } from "../store/CartContext";
import { createOrder } from "../services/orders";

const PAYMENT_ALIAS = "amacocina";

export default function Cart() {
  const { items, setQty, removeItem, clear, totalPrice } = useCart();

  const [name, setName] = useState(() => {
    return localStorage.getItem("amacocina_name") || "";
  });
  const [notes, setNotes] = useState("");

  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState("");
  const [showAliasStep, setShowAliasStep] = useState(false);

  const hasItems = items.length > 0;
  const nameIsValid = name.trim().length >= 3;

  useEffect(() => {
    localStorage.setItem("amacocina_name", name);
  }, [name]);

  const handleEfectivo = async () => {
    if (!hasItems || payLoading) return;

    if (!nameIsValid) {
      setPayError("Por favor ingresá tu nombre para continuar.");
      return;
    }

    setPayError("");
    setPayLoading(true);

    try {
      const order = await createOrder({
        customer: { name: name.trim(), notes: notes.trim() || undefined },
        items: items.map((it) => ({
          id: String(it.id),
          name: String(it.name),
          qty: Number(it.qty),
          unitPrice: Number(it.price),
        })),
        currency: "ARS",
        payment_method: "efectivo",
      });

      const orderId = order?.id;
      if (!orderId) {
        throw new Error("No se pudo crear la orden (sin id).");
      }

      window.location.href = `/checkout/cash-confirmation?order_id=${encodeURIComponent(orderId)}`;
    } catch (err) {
      setPayError(
        err?.message ||
          "No se pudo registrar el pedido. Intentá nuevamente en unos segundos."
      );
      setPayLoading(false);
    }
  };

  const handlePagarPorAlias = () => {
    if (!hasItems) return;
    if (!nameIsValid) {
      setPayError("Por favor ingresá tu nombre para continuar.");
      return;
    }
    setPayError("");
    setShowAliasStep(true);
  };

  const handleYaTransferi = async () => {
    if (!hasItems || payLoading) return;

    setPayError("");
    setPayLoading(true);

    try {
      const order = await createOrder({
        customer: { name: name.trim(), notes: notes.trim() || undefined },
        items: items.map((it) => ({
          id: String(it.id),
          name: String(it.name),
          qty: Number(it.qty),
          unitPrice: Number(it.price),
        })),
        currency: "ARS",
        payment_method: "alias",
      });

      const orderId = order?.id;
      if (!orderId) {
        throw new Error("No se pudo crear la orden (sin id).");
      }

      window.location.href = `/checkout/cash-confirmation?order_id=${encodeURIComponent(orderId)}`;
    } catch (err) {
      setPayError(
        err?.message ||
          "No se pudo registrar el pedido. Intentá nuevamente en unos segundos."
      );
      setPayLoading(false);
    }
  };

  return (
    <div className="cartWrap cartPro">
      <div className="cartTop">
        <div>
          <h1 className="cartTitle">Carrito</h1>
          <div className="cartSub">
            Revisá tu pedido y elegí cómo pagar.
          </div>
        </div>

        <Link className="cartBackBtn" to="/">
          ← Seguir comprando
        </Link>
      </div>

      {!hasItems ? (
        <div className="cartEmpty">
          <div className="cartEmptyTitle">Tu carrito está vacío</div>
          <div className="cartEmptyText">Volvé al menú y agregá algo rico.</div>
          <div className="cartEmptyActions">
            <Link className="cartBackBtn" to="/">
              Volver al menú
            </Link>
          </div>
        </div>
      ) : showAliasStep ? (
        <div className="cardPro" style={{ maxWidth: "420px", margin: "0 auto" }}>
          <div className="cardProHead">
            <div className="cardProTitle">Pagar por alias</div>
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ fontSize: "0.85rem", color: "var(--muted, #888)", marginBottom: "0.25rem" }}>Alias</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "0.02em" }}>{PAYMENT_ALIAS}</div>
          </div>
          <div style={{ marginBottom: "1.25rem" }}>
            <div style={{ fontSize: "0.85rem", color: "var(--muted, #888)", marginBottom: "0.25rem" }}>Total a pagar</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>${totalPrice}</div>
          </div>
          {payError ? (
            <div className="alert alertError" style={{ marginBottom: "1rem" }}>
              <div className="alertText">{payError}</div>
            </div>
          ) : null}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <button
              className="btn btnPrimary btnBlock"
              onClick={handleYaTransferi}
              disabled={payLoading}
            >
              {payLoading ? "Registrando..." : "Ya transferí"}
            </button>
            <button
              className="btn btnGhost btnBlock"
              onClick={() => { setShowAliasStep(false); setPayError(""); }}
              disabled={payLoading}
            >
              Volver
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="cartList">
            {items.map((item) => (
              <div key={item.id} className="cartItem">
                <div>
                  <div className="cartItemName">{item.name}</div>
                  <div className="cartItemMeta">
                    Unitario: ${item.price} • Subtotal: ${item.price * item.qty}
                  </div>
                </div>

                <div className="cartItemRight">
                  <div className="cartQty">
                    <button
                      className="qtyBtn"
                      onClick={() => setQty(item.id, item.qty - 1)}
                      disabled={payLoading}
                    >
                      –
                    </button>

                    <span className="qtyVal">{item.qty}</span>

                    <button
                      className="qtyBtn"
                      onClick={() => setQty(item.id, item.qty + 1)}
                      disabled={payLoading}
                    >
                      +
                    </button>
                  </div>

                  <button
                    className="btn btnDanger"
                    onClick={() => removeItem(item.id)}
                    disabled={payLoading}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cartGridPro">
            <div className="cardPro">
              <div className="cardProHead">
                <div className="cardProTitle">Datos para confirmar *</div>
                <div className="cardProHint">Obligatorio</div>
              </div>

              <div className="formGrid">
                <div className="field">
                  <span className="label">Nombre y apellido *</span>
                  <input
                    className="input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Juan Pérez"
                    disabled={payLoading}
                  />
                </div>

                <div className="field">
                  <span className="label">Notas</span>
                  <textarea
                    className="textarea"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ej: sin cebolla, con mayonesa, etc."
                    rows={4}
                    disabled={payLoading}
                  />
                </div>
              </div>
            </div>

            <div className="cardPro">
              <div className="cardProHead">
                <div className="cardProTitle">Resumen</div>
                <div className="cardProHint">{items.length} item(s)</div>
              </div>

              <div className="summary">
                <div className="summaryRow">
                  <span className="muted">Total</span>
                  <span className="muted">${totalPrice}</span>
                </div>

                <div className="summaryDivider" />

                <div className="summaryRow summaryTotal">
                  <span>Total a pagar</span>
                  <strong>${totalPrice}</strong>
                </div>
              </div>

              {payError ? (
                <div className="alert alertError">
                  <div className="alertTitle">Atención</div>
                  <div className="alertText">{payError}</div>
                </div>
              ) : null}

              <div className="actions desktopOnly">
                <button
                  className="btn btnPrimary btnBlock"
                  onClick={handlePagarPorAlias}
                  disabled={payLoading}
                >
                  Pagar por alias
                </button>

                <button
                  className="btn btnSecondary btnBlock"
                  onClick={handleEfectivo}
                  disabled={payLoading}
                >
                  {payLoading ? "Registrando..." : "Pagar en efectivo"}
                </button>

                <button
                  className="btn btnGhost btnBlock"
                  onClick={clear}
                  disabled={payLoading}
                >
                  Vaciar carrito
                </button>
              </div>
            </div>
          </div>

          <div className="mobilePayBar">
            <div className="mobilePayInner">
              <div className="mobilePayTotal">
                <span className="muted">Total</span>
                <strong>${totalPrice}</strong>
              </div>

              <button
                className="btn btnPrimary mobilePayBtn"
                onClick={handlePagarPorAlias}
                disabled={payLoading}
              >
                Pagar por alias
              </button>

              <button
                className="btn btnSecondary mobilePayBtn"
                onClick={handleEfectivo}
                disabled={payLoading}
              >
                {payLoading ? "..." : "Efectivo"}
              </button>
            </div>
          </div>

          <div className="mobilePaySpacer" />
        </>
      )}
    </div>
  );
}
