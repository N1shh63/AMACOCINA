// src/components/Navbar.jsx
import { Link, useLocation } from "react-router-dom"
import { useCart } from "../store/CartContext"

export default function Navbar() {
  const { totalItems } = useCart()
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <nav
      style={{
        background: "#5C3D2E",
        color: "white",
        position: "sticky",
        top: 0,
        zIndex: 50,
        borderBottom: "1px solid rgba(255,255,255,0.10)",
      }}
    >
      <div
        className="navWrap"
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "12px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        {/* Brand */}
        <Link
          to="/"
          style={{
            textDecoration: "none",
            color: "white",
            display: "flex",
            alignItems: "center",
            gap: 10,
            minWidth: 0,
          }}
        >
          <span
            style={{
              width: 36,
              height: 36,
              display: "grid",
              placeItems: "center",
              borderRadius: 12,
              background: "rgba(0,0,0,0.20)",
              border: "1px solid rgba(255,255,255,0.12)",
              flex: "0 0 auto",
            }}
          >
            🍽
          </span>

          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <span
              className="brandTitle"
              style={{
                fontSize: 18,
                fontWeight: 900,
                lineHeight: "18px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              AmaCocina
            </span>
            <span
              className="brandSub"
              style={{
                fontSize: 12,
                opacity: 0.85,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Cocina casera · Pedido simple
            </span>
          </div>
        </Link>

        {/* Links */}
        <div
          className="navLinks"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            flex: "0 0 auto",
          }}
        >
          <Link
            to="/"
            className="navPill"
            style={{
              textDecoration: "none",
              color: "white",
              fontWeight: 900,
              fontSize: 13,
              padding: "10px 12px",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.14)",
              background: isActive("/") ? "rgba(0,0,0,0.22)" : "rgba(255,255,255,0.06)",
            }}
          >
            Menú
          </Link>

          <Link
            to="/cart"
            className="navPill"
            style={{
              textDecoration: "none",
              color: "white",
              fontWeight: 900,
              fontSize: 13,
              padding: "10px 12px",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.14)",
              background: isActive("/cart")
                ? "rgba(0,0,0,0.22)"
                : "rgba(255,255,255,0.06)",
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            🛒 Carrito

            {/* Badge flotante */}
            {totalItems > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -8,
                  right: -8,
                  minWidth: 22,
                  height: 22,
                  padding: "0 6px",
                  borderRadius: 999,
                  background: "#E36414",
                  color: "#111",
                  fontSize: 12,
                  fontWeight: 900,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                  boxShadow: "0 10px 20px rgba(0,0,0,0.35)",
                  border: "1px solid rgba(255,255,255,0.18)",
                }}
              >
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  )
}