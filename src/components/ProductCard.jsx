import { useMemo, useState } from "react"
import { useCart } from "../store/CartContext"

const ACCENT = "#F97316" // color guardado
const ACCENT_BORDER = "rgba(249,115,22,0.55)"
const ACCENT_SOFT_BG = "rgba(249,115,22,0.14)"

export default function ProductCard({ product }) {
  const { items, addItem, setQty } = useCart()

  const hasOptions = Array.isArray(product?.options) && product.options.length > 0

  const [option, setOption] = useState(() => {
    if (hasOptions) return product.options[0]
    return ""
  })

  // si cambia el producto o la opción queda inválida, normalizamos
  const safeOption = useMemo(() => {
    if (!hasOptions) return ""
    return product.options.includes(option) ? option : product.options[0]
  }, [hasOptions, product.options, option])

  const cartId = useMemo(() => {
    return hasOptions ? `${product.id}__${safeOption}` : product.id
  }, [hasOptions, product.id, safeOption])

  const cartName = useMemo(() => {
    // nombre claro para WhatsApp/carrito
    return hasOptions ? `${product.name} (${safeOption})` : product.name
  }, [hasOptions, product.name, safeOption])

  const qty = items.find((i) => i.id === cartId)?.qty ?? 0

  const handleAdd = () => {
    if (!hasOptions) return addItem(product)

    addItem({
      ...product,
      id: cartId,
      name: cartName,
      selectedOption: safeOption,
      baseId: product.id,
    })
  }

  return (
    <article
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: 14,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        minHeight: 200,
        boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
      }}
    >
      {/* Header: nombre + precio */}
      <header
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 16,
            lineHeight: "20px",
            fontWeight: 700,
            letterSpacing: 0.2,
          }}
        >
          {product.name}
        </h3>

        <div
          style={{
            fontWeight: 800,
            fontSize: 14,
            padding: "6px 10px",
            borderRadius: 999,
            background: ACCENT_SOFT_BG,
            border: `1px solid ${ACCENT_BORDER}`,
            whiteSpace: "nowrap",
          }}
        >
          ${product.price}
        </div>
      </header>

      {/* descripción */}
      {product.description ? (
        <p
          style={{
            margin: 0,
            opacity: 0.85,
            fontSize: 13,
            lineHeight: "18px",
          }}
        >
          {product.description}
        </p>
      ) : (
        <p style={{ margin: 0, opacity: 0.55, fontSize: 13 }}>
          Hecho en el momento · Estilo casero
        </p>
      )}

      {/* opciones (sabor/guarnición) */}
      {hasOptions ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 12, opacity: 0.75 }}>
            {product.optionsLabel || "Elegí una opción"}
          </span>

          <select
            value={safeOption}
            onChange={(e) => setOption(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.16)",
              background: "rgba(0,0,0,0.20)",
              color: "white",
              outline: "none",
            }}
          >
            {product.options.map((op) => (
              <option key={op} value={op} style={{ color: "black" }}>
                {op}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {/* CTA / Qty */}
      <div style={{ marginTop: "auto" }}>
        {qty === 0 ? (
          <button
            onClick={handleAdd}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 12,
              border: `1px solid ${ACCENT_BORDER}`,
              background: ACCENT,
              color: "#111",
              fontWeight: 800,
              cursor: "pointer",
              transition: "transform 120ms ease, filter 120ms ease",
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.99)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            Agregar al carrito
          </button>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              padding: 10,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(0,0,0,0.18)",
            }}
          >
            <button
              onClick={() => setQty(cartId, qty - 1)}
              style={{
                width: 44,
                height: 40,
                borderRadius: 12,
                border: "none",
                background: ACCENT,
                color: "#111",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              -
            </button>

            <div style={{ fontWeight: 900, minWidth: 20, textAlign: "center" }}>
              {qty}
            </div>

            <button
              onClick={() => setQty(cartId, qty + 1)}
              style={{
                width: 44,
                height: 40,
                borderRadius: 12,
                border: "none",
                background: ACCENT,
                color: "#111",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              +
            </button>
          </div>
        )}
      </div>

      {/* micro-info */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          fontSize: 11,
          opacity: 0.6,
        }}
      >
        <span>Pedido fácil</span>
        <span>WhatsApp + Pago</span>
      </div>
    </article>
  )
}