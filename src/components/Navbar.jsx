import { Link, NavLink } from "react-router-dom";
import { useCart } from "../store/CartContext";

export default function Navbar() {
  const { totalItems } = useCart();

  const linkBase =
    "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition";
  const linkIdle = "text-neutral-200 hover:bg-white/10 hover:text-white";
  const linkActive = "bg-white/12 text-white";

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-neutral-950/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl">🍽</span>
          <div className="leading-tight">
            <div className="text-base font-extrabold text-white">AmaCocina</div>
            <div className="text-xs text-neutral-400">
              Comida casera · Pedido simple
            </div>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : linkIdle}`
            }
          >
            Menú
          </NavLink>

          <NavLink
            to="/cart"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : linkIdle} relative`
            }
          >
            🛒 Carrito
            {totalItems > 0 && (
              <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-orange-500 px-1 text-xs font-extrabold text-white shadow-lg">
                {totalItems}
              </span>
            )}
          </NavLink>
        </nav>
      </div>
    </header>
  );
}