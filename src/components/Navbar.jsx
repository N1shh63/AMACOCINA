import { Link, useLocation } from "react-router-dom"
import { useCart } from "../store/CartContext"

export default function Navbar() {
  const { totalItems } = useCart()
  const location = useLocation()
  const isCart = location.pathname === "/cart"
  const isAdmin = location.pathname.startsWith("/admin")

  return (
    <>
      <header className="nav">
        <div className="navInner">
          <Link to="/" className="navBrand" aria-label="Ir al menú">
            <span className="navLogo">🍽</span>
            <span className="navBrandText">
              <span className="navTitle">AmaCocina</span>
              <span className="navSubtitle">Comida casera • Pedido simple</span>
            </span>
          </Link>

          <nav className="navLinks">
            {!isAdmin && (
              <Link to="/" className={`navLink ${!isCart ? "active" : ""}`}>
                Menú
              </Link>
            )}

            {!isAdmin && (
            <Link to="/cart" className={`navCartBtn ${isCart ? "active" : ""}`}>
              <span className="navCartIcon">🛒</span>
              <span className="navCartText">Carrito</span>

              {totalItems > 0 && (
                <span className="navBadge" aria-label={`Items en carrito: ${totalItems}`}>
                  {totalItems}
                </span>
              )}
            </Link>
            )}

            <Link
              to={isAdmin ? "/admin" : "/admin/login"}
              className="navLink"
              style={{ fontSize: "12px", opacity: 0.82 }}
              aria-label="Panel admin"
            >
              {isAdmin ? "Dashboard" : "Admin"}
            </Link>
          </nav>
        </div>
      </header>

      {/* Spacer para que el contenido no quede debajo de la navbar sticky */}
      <div className="navSpacer" />

      {/* CTA móvil: barra inferior (solo si hay items, no en admin) */}
      {!isAdmin && totalItems > 0 && !isCart && (
        <div className="mobileCta">
          <Link to="/cart" className="mobileCtaBtn">
            <span>Ver carrito</span>
            <span className="mobileCtaPill">{totalItems}</span>
          </Link>
        </div>
      )}
    </>
  )
}