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
      // (Opcional) Si querés exigir nombre antes de pagar:
      // if (!name.trim()) throw new Error("Ingresá tu nombre antes de pagar.");

      const data = await createPreference(mpItems)

      const url = data?.init_point || data?.sandbox_init_point
      if (!url) throw new Error("No se recibió init_point de Mercado Pago.")

      // Redirección al Checkout Pro
      window.location.href = url
    } catch (err) {
      setMpError(err?.message || "No se pudo iniciar el pago con Mercado Pago.")
      setMpLoading(false)
    }
  }

  return (
    <div className="cartWrap">
      <div className="cartTop">
        <h1 className="cartTitle">Carrito</h1>
        <Link className="cartBack" to="/">
          Seguir comprando
        </Link>
      </div>

      {!hasItems ? (
        <div className="cartEmpty">
          Tu carrito está vacío.
          <div style={{ marginTop: 10 }}>
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
                <div className="cartItemHead">
                  <div className="cartItemName">{item.name}</div>
                  <div className="cartItemTotal">${item.price * item.qty}</div>
                </div>

                <div className="cartItemBody">
                  <div className="cartQty">
                    <button
                      className="cartQtyBtn"
                      onClick={() => setQty(item.id, item.qty - 1)}
                    >
                      -
                    </button>
                    <span className="cartQtyVal">{item.qty}</span>
                    <button
                      className="cartQtyBtn"
                      onClick={() => setQty(item.id, item.qty + 1)}
                    >
                      +
                    </button>
                  </div>

                  <button className="cartRemove" onClick={() => removeItem(item.id)}>
                    Eliminar
                  </button>
                </div>

                <div className="cartUnit">Precio unitario: ${item.price}</div>
              </div>
            ))}
          </div>

          <div className="cartForm">
            <h3 className="cartFormTitle">Datos para confirmar</h3>

            <input
              className="cartInput"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre y apellido"
            />

            <textarea
              className="cartTextarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas (sin cebolla, etc.)"
              rows={4}
            />
          </div>

          <div className="cartBottom">
            <div className="cartTotal">Total: ${totalPrice}</div>

            {mpError ? (
              <div
                style={{
                  marginTop: 10,
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,80,80,.35)",
                  background: "rgba(255,80,80,.08)",
                  color: "#fff",
                }}
              >
                {mpError} <br />
                <span style={{ opacity: 0.9 }}>
                  Podés continuar con WhatsApp como alternativa.
                </span>
              </div>
            ) : null}

            <div className="cartActions">
              <button
                className="cartPrimary"
                onClick={handleMercadoPago}
                disabled={mpLoading}
                style={{
                  background: "#E67E22",
                  opacity: mpLoading ? 0.8 : 1,
                  cursor: mpLoading ? "not-allowed" : "pointer",
                }}
              >
                {mpLoading ? "Redirigiendo a Mercado Pago..." : "Pagar con Mercado Pago"}
              </button>

              <button className="cartPrimary" onClick={handleWhatsApp} disabled={mpLoading}>
                Enviar pedido por WhatsApp
              </button>

              <button className="cartSecondary" onClick={clear} disabled={mpLoading}>
                Vaciar carrito
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}