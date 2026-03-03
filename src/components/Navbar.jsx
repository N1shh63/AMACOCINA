import { Link } from "react-router-dom"
import { useCart } from "../store/CartContext"

export default function Navbar() {
  const { totalItems } = useCart()

  return (
    <nav
      style={{
        background: "#5C3D2E",
        color: "white",
        padding: "15px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <Link
        to="/"
        style={{
          color: "white",
          textDecoration: "none",
          fontSize: 22,
          fontWeight: "bold",
        }}
      >
        🍽 AmaCocina
      </Link>

      <Link
        to="/cart"
        style={{
          color: "white",
          textDecoration: "none",
          fontWeight: "bold",
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 10px",
          borderRadius: 10,
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
              color: "white",
              fontSize: 12,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
              boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
            }}
          >
            {totalItems}
          </span>
        )}
      </Link>
    </nav>
  )
}