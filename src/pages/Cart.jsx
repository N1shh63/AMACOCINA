import { Link } from "react-router-dom"
import { useMemo, useState } from "react"
import { useCart } from "../store/CartContext"
import { createPreference } from "../services/payments"

export default function Cart() {
  const { items, setQty, removeItem, clear, totalPrice } = useCart()
  const [name, setName] = useState("")
  const [notes, setNotes] = useState("")
  const [mpLoading, setMpLoading] = useState(false)
  const [mpError, setMpError] = useState("")

  const hasItems = items.length > 0

  const whatsappText = useMemo(() => {
    if (!hasItems) return ""

    let msg = `*Pedido AmaCocina*\n\n`
    for (const item of items) {
      const lineTotal = item.price * item.qty
      msg += `• ${item.qty}x ${item.name} — $${lineTotal}\n`
    }

    msg += `\n*Total:* $${totalPrice}\n`
    if (name.trim()) msg += `\n*Nombre:* ${name.trim()}`
    if (notes.trim()) msg += `\n*Notas:* ${notes.trim()}`

    return msg
  }, [items, totalPrice, name, notes, hasItems])

  const handleWhatsApp = () => {
    if (!hasItems) return
    const phone = "5491158182038"
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(whatsappText)}`
    window.open(url, "_blank")
  }

  const mpItems = useMemo(() => {
    return items.map((it) => ({
      id: String(it.id),
      title: String(it.name),
      quantity: Number(it.qty),
      unit_price: Number(it.price),
    }))
  }, [items])

  const handleMercadoPago = async () => {
    if (!hasItems) return
    setMpError("")
    setMpLoading(true)

    try {
      const data = await createPreference(mpItems)

      const url = data?.init_point || data?.sandbox_init_point
      if (!url) throw new Error("No se recibió init_point de Mercado Pago.")

      window.location.href = url
    } catch (err) {
      setMpError(err?.message || "No se pudo iniciar el pago con Mercado Pago.")
      setMpLoading(false)
    }
  }

  return (
    <div className="container cartPage">
      {/* HEADER */}
      <div className="cartHeader">
        <div>
          <h1 className="cartTitle">Carrito</h1>
          <div className="cartSubtitle">
            Revisá tu pedido y confirmá por Mercado Pago o WhatsApp.
          </div>
        </div>

        <Link className="cartLink" to="/">
          ← Seguir comprando
        </Link>
      </div>

      {/* EMPTY */}
      {!hasItems ? (
        <div className="card cartEmpty">
          <div className="cartEmptyTitle">Tu carrito está vacío</div>
          <div className="cartEmptyText">
            Volvé al menú y agregá productos para continuar.
          </div>

          <div className="cartEmptyActions">
            <Link className="btn btnPrimary" to="/">
              Volver al menú
            </Link>
          </div>
        </div>
      ) : (
        <div className="cartGrid">
          {/* LEFT: ITEMS */}
          <div className="card">
            <div className="cardHeader">
              <div className="cardTitle">Tu pedido</div>
              <div className="cardHint">{items.length} item(s)</div>
            </div>

            <div className="cartList">
              {items.map((item) => (
                <div key={item.id} className="cartItem">
                  <div>
                    <div className="cartItemName">{item.name}</div>
                    <div className="cartItemMeta">
                      Unitario: ${item.price} · Subtotal: ${item.price * item.qty}
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
                        –
                      </button>
                      <div className="qtyVal">{item.qty}</div>
                      <button
                        className="qtyBtn"
                        onClick={() => setQty(item.id, item.qty + 1)}
                        disabled={mpLoading}
                        aria-label="Sumar"
                      >
                        +
                      </button>
                    </div>

                    <div className="cartItemTotal">${item.price * item.qty}</div>

                    <button
                      className="btn btnDanger"
                      onClick={() => removeItem(item.id)}
                      disabled={mpLoading}
                      aria-label="Eliminar"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="actions">
              <button className="btn btnGhost" onClick={clear} disabled={mpLoading}>
                Vaciar carrito
              </button>
            </div>
          </div>

          {/* RIGHT: FORM + SUMMARY */}
          <div>
            <div className="card">
              <div className="cardHeader">
                <div className="cardTitle">Datos para confirmar</div>
                <div className="cardHint">Opcional</div>
              </div>

              <div className="formGrid">
                <div className="field">
                  <label className="label">Nombre y apellido</label>
                  <input
                    className="input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Juan Pérez"
                    disabled={mpLoading}
                  />
                </div>

                <div className="field">
                  <label className="label">Notas</label>
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

              {mpError ? (
                <div className="alert alertError">
                  <div className="alertTitle">No se pudo iniciar el pago</div>
                  <div className="alertText">{mpError}</div>
                  <div className="alertHint">
                    Podés confirmar por WhatsApp como alternativa.
                  </div>
                </div>
              ) : null}
            </div>

            <div className="card" style={{ marginTop: 14 }}>
              <div className="cardHeader">
                <div className="cardTitle">Resumen</div>
                <div className="cardHint">Total final</div>
              </div>

              <div className="summary">
                <div className="summaryRow">
                  <span className="muted">Total</span>
                  <strong>${totalPrice}</strong>
                </div>
                <div className="summaryDivider" />
                <div className="summaryRow summaryTotal">
                  <span>Total a pagar</span>
                  <strong>${totalPrice}</strong>
                </div>
              </div>

              <div className="actions">
                <button
                  className="btn btnPrimary btnBlock"
                  onClick={handleMercadoPago}
                  disabled={mpLoading}
                >
                  {mpLoading ? "Redirigiendo a Mercado Pago..." : "Pagar con Mercado Pago"}
                </button>

                <button
                  className="btn btnSecondary btnBlock"
                  onClick={handleWhatsApp}
                  disabled={mpLoading}
                >
                  Enviar pedido por WhatsApp
                </button>

                <div className="finePrint">
                  * En Render free puede haber demora al “despertar” el servidor.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}