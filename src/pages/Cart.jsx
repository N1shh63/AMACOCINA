import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useCart } from "../store/CartContext";
import { createPreference } from "../services/payments";

function formatMoney(n) {
  const v = Number(n || 0);
  return v.toLocaleString("es-AR");
}

export default function Cart() {
  const { items, setQty, removeItem, clear, totalPrice } = useCart();

  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");

  const [mpLoading, setMpLoading] = useState(false);
  const [mpError, setMpError] = useState("");

  const hasItems = items.length > 0;

  const whatsappText = useMemo(() => {
    if (!hasItems) return "";

    let msg = `*Pedido AmaCocina*\n\n`;
    for (const item of items) {
      const lineTotal = item.price * item.qty;
      msg += `• ${item.qty}x ${item.name} — $${formatMoney(lineTotal)}\n`;
    }

    msg += `\n*Total:* $${formatMoney(totalPrice)}\n`;
    if (name.trim()) msg += `\n*Nombre:* ${name.trim()}`;
    if (notes.trim()) msg += `\n*Notas:* ${notes.trim()}`;

    return msg;
  }, [items, totalPrice, name, notes, hasItems]);

  const handleWhatsApp = () => {
    if (!hasItems) return;
    const phone = "5491158182038";
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(whatsappText)}`;
    window.open(url, "_blank");
  };

  const mpItems = useMemo(() => {
    return items.map((it) => ({
      id: String(it.id),
      title: String(it.name),
      quantity: Number(it.qty),
      unit_price: Number(it.price),
    }));
  }, [items]);

  const handleMercadoPago = async () => {
    if (!hasItems || mpLoading) return;
    setMpError("");
    setMpLoading(true);

    try {
      // Si querés exigir nombre antes de pagar, descomentá:
      // if (!name.trim()) throw new Error("Ingresá tu nombre antes de pagar.");

      const data = await createPreference(mpItems);

      const url = data?.init_point || data?.sandbox_init_point;
      if (!url) throw new Error("No se recibió init_point de Mercado Pago.");

      window.location.href = url;
    } catch (err) {
      setMpError(err?.message || "No se pudo iniciar el pago con Mercado Pago.");
      setMpLoading(false);
    }
  };

  const totalItems = useMemo(
    () => items.reduce((acc, it) => acc + Number(it.qty || 0), 0),
    [items]
  );

  return (
    <div className="cartPage">
      <div className="cartHeader">
        <div className="cartHeaderLeft">
          <h1 className="cartTitle">Carrito</h1>
          <div className="cartSubtitle">
            {hasItems ? `${totalItems} ítems` : "Sin productos"}
          </div>
        </div>

        <Link className="cartLink" to="/">
          ← Seguir comprando
        </Link>
      </div>

      {!hasItems ? (
        <div className="card cartEmpty">
          <div className="cartEmptyTitle">Tu carrito está vacío</div>
          <div className="cartEmptyText">
            Volvé al menú y agregá productos para empezar.
          </div>
          <div className="cartEmptyActions">
            <Link className="btn btnPrimary" to="/">
              Ver menú
            </Link>
          </div>
        </div>
      ) : (
        <div className="cartGrid">
          {/* IZQUIERDA: items */}
          <div className="cartCol">
            <div className="card">
              <div className="cardHeader">
                <div className="cardTitle">Productos</div>
                <button
                  className="btn btnGhost"
                  onClick={clear}
                  disabled={mpLoading}
                  title="Vaciar carrito"
                >
                  Vaciar
                </button>
              </div>

              <div className="cartList">
                {items.map((item) => {
                  const lineTotal = item.price * item.qty;

                  return (
                    <div key={item.id} className="cartItem">
                      <div className="cartItemMain">
                        <div className="cartItemName">{item.name}</div>
                        <div className="cartItemMeta">
                          Unitario: ${formatMoney(item.price)}
                        </div>
                      </div>

                      <div className="cartItemRight">
                        <div className="cartQty">
                          <button
                            className="qtyBtn"
                            onClick={() => setQty(item.id, item.qty - 1)}
                            disabled={mpLoading}
                            aria-label="Restar"
                          >
                            −
                          </button>
                          <span className="qtyVal">{item.qty}</span>
                          <button
                            className="qtyBtn"
                            onClick={() => setQty(item.id, item.qty + 1)}
                            disabled={mpLoading}
                            aria-label="Sumar"
                          >
                            +
                          </button>
                        </div>

                        <div className="cartItemTotal">
                          ${formatMoney(lineTotal)}
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
                  );
                })}
              </div>
            </div>

            <div className="card">
              <div className="cardHeader">
                <div className="cardTitle">Datos para confirmar</div>
                <div className="cardHint">Opcional (recomendado)</div>
              </div>

              <div className="formGrid">
                <label className="field">
                  <span className="label">Nombre y apellido</span>
                  <input
                    className="input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Juan Pérez"
                    disabled={mpLoading}
                  />
                </label>

                <label className="field">
                  <span className="label">Notas</span>
                  <textarea
                    className="textarea"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ej: sin cebolla, extra salsa, etc."
                    rows={4}
                    disabled={mpLoading}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* DERECHA: resumen */}
          <aside className="cartAside">
            <div className="card">
              <div className="cardHeader">
                <div className="cardTitle">Resumen</div>
              </div>

              <div className="summary">
                <div className="summaryRow">
                  <span>Subtotal</span>
                  <strong>${formatMoney(totalPrice)}</strong>
                </div>
                <div className="summaryRow">
                  <span>Envío</span>
                  <span className="muted">A coordinar</span>
                </div>
                <div className="summaryDivider" />
                <div className="summaryRow summaryTotal">
                  <span>Total</span>
                  <strong>${formatMoney(totalPrice)}</strong>
                </div>
              </div>

              {mpError ? (
                <div className="alert alertError">
                  <div className="alertTitle">No se pudo iniciar Mercado Pago</div>
                  <div className="alertText">{mpError}</div>
                  <div className="alertHint">
                    Podés continuar con WhatsApp como alternativa.
                  </div>
                </div>
              ) : null}

              <div className="actions">
                <button
                  className="btn btnPrimary btnBlock"
                  onClick={handleMercadoPago}
                  disabled={!hasItems || mpLoading}
                >
                  {mpLoading ? "Redirigiendo a Mercado Pago..." : "Pagar con Mercado Pago"}
                </button>

                <button
                  className="btn btnSecondary btnBlock"
                  onClick={handleWhatsApp}
                  disabled={!hasItems || mpLoading}
                >
                  Enviar pedido por WhatsApp
                </button>

                <button
                  className="btn btnGhost btnBlock"
                  onClick={clear}
                  disabled={!hasItems || mpLoading}
                >
                  Vaciar carrito
                </button>
              </div>

              <div className="finePrint">
                Al pagar, serás redirigido al checkout de Mercado Pago.
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}