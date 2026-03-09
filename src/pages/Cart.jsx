import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "../store/CartContext";
import { createOrder } from "../services/orders";
import { createPreferenceForOrder } from "../services/payments";

export default function Cart() {
  const { items, setQty, removeItem, clear, totalPrice } = useCart();

  const [name, setName] = useState(() => {
    return localStorage.getItem("amacocina_name") || "";
  });
  const [notes, setNotes] = useState("");

  const [mpLoading, setMpLoading] = useState(false);
  const [mpError, setMpError] = useState("");

  const hasItems = items.length > 0;
  const nameIsValid = name.trim().length >= 3;

  useEffect(() => {
    localStorage.setItem("amacocina_name", name);
  }, [name]);

  const whatsappText = useMemo(() => {
    if (!hasItems) return "";

    let msg = `*Pedido AmaCocina*\n\n`;

    for (const item of items) {
      const lineTotal = item.price * item.qty;
      msg += `• ${item.qty}x ${item.name} — $${lineTotal}\n`;
    }

    msg += `\n*Total:* $${totalPrice}\n`;
    msg += `\n*Nombre:* ${name.trim()}`;

    if (notes.trim()) {
      msg += `\n*Notas:* ${notes.trim()}`;
    }

    return msg;
  }, [items, totalPrice, name, notes, hasItems]);

  const handleWhatsApp = () => {
    if (!hasItems) return;

    if (!nameIsValid) {
      setMpError("Por favor ingresá tu nombre para continuar.");
      return;
    }

    const phone = "5491158182038";
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(whatsappText)}`;
    window.open(url, "_blank");
  };

  const handleMercadoPago = async () => {
    if (!hasItems || mpLoading) return;

    if (!nameIsValid) {
      setMpError("Por favor ingresá tu nombre para continuar.");
      return;
    }

    setMpError("");
    setMpLoading(true);

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
      });

      const orderId = order?.id;
      if (!orderId) {
        throw new Error("No se pudo crear la orden (sin id).");
      }

      const data = await createPreferenceForOrder(orderId);

      const url = data?.init_point || data?.sandbox_init_point;
      if (!url) {
        throw new Error("No se recibió init_point / sandbox_init_point.");
      }

      window.location.href = url;
    } catch (err) {
      setMpError(
        err?.message ||
          "No se pudo iniciar el pago. Intentá nuevamente en unos segundos."
      );
      setMpLoading(false);
    }
  };

  const handleEfectivo = async () => {
    if (!hasItems || mpLoading) return;

    if (!nameIsValid) {
      setMpError("Por favor ingresá tu nombre para continuar.");
      return;
    }

    setMpError("");
    setMpLoading(true);

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
      setMpError(
        err?.message ||
          "No se pudo registrar el pedido. Intentá nuevamente en unos segundos."
      );
      setMpLoading(false);
    }
  };

  return (
    <div className="cartWrap cartPro">
      <div className="cartTop">
        <div>
          <h1 className="cartTitle">Carrito</h1>
          <div className="cartSub">
            Revisá tu pedido y confirmá por Mercado Pago o WhatsApp.
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
                      disabled={mpLoading}
                    >
                      –
                    </button>

                    <span className="qtyVal">{item.qty}</span>

                    <button
                      className="qtyBtn"
                      onClick={() => setQty(item.id, item.qty + 1)}
                      disabled={mpLoading}
                    >
                      +
                    </button>
                  </div>

                  <button
                    className="btn btnDanger"
                    onClick={() => removeItem(item.id)}
                    disabled={mpLoading}
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
                    disabled={mpLoading}
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
                    disabled={mpLoading}
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

              {mpError ? (
                <div className="alert alertError">
                  <div className="alertTitle">Atención</div>
                  <div className="alertText">{mpError}</div>
                </div>
              ) : null}

              <div className="actions desktopOnly">
                <button
                  className="btn btnPrimary btnBlock"
                  onClick={handleMercadoPago}
                  disabled={mpLoading}
                >
                  {mpLoading ? "Redirigiendo..." : "Pagar con Mercado Pago"}
                </button>

                <button
                  className="btn btnSecondary btnBlock"
                  onClick={handleEfectivo}
                  disabled={mpLoading}
                >
                  {mpLoading ? "Registrando..." : "Pagar en efectivo"}
                </button>

                <button
                  className="btn btnSecondary btnBlock"
                  onClick={handleWhatsApp}
                  disabled={mpLoading}
                >
                  Enviar pedido por WhatsApp
                </button>

                <button
                  className="btn btnGhost btnBlock"
                  onClick={clear}
                  disabled={mpLoading}
                >
                  Vaciar carrito
                </button>

                <div className="finePrint">
                  * En Render free puede haber demora al “despertar” el servidor.
                </div>
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
                onClick={handleMercadoPago}
                disabled={mpLoading}
              >
                {mpLoading ? "Redirigiendo..." : "Mercado Pago"}
              </button>

              <button
                className="btn btnSecondary mobilePayBtn"
                onClick={handleEfectivo}
                disabled={mpLoading}
              >
                {mpLoading ? "..." : "Efectivo"}
              </button>

              <button
                className="btn btnSecondary mobilePayBtn"
                onClick={handleWhatsApp}
                disabled={mpLoading}
              >
                WhatsApp
              </button>
            </div>
          </div>

          <div className="mobilePaySpacer" />
        </>
      )}
    </div>
  );
}