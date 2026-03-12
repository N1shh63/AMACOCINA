import { useMemo, useRef, useState } from "react";
import { products } from "../data/products";
import ProductCard from "../components/ProductCard";
import MenusEjecutivosSection from "../components/MenusEjecutivosSection";

function formatCategoryTitle(cat) {
  if (!cat) return "";
  return cat
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export default function Menu() {
  const [query, setQuery] = useState("");
  const menuRef = useRef(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const hay = `${p.name} ${p.description || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query]);

  const byCategory = useMemo(() => {
    const map = {};
    for (const p of filtered) {
      map[p.category] ??= [];
      map[p.category].push(p);
    }
    return map;
  }, [filtered]);

  const categories = useMemo(() => Object.keys(byCategory), [byCategory]);

  const handleScrollToMenu = () => {
    menuRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="menuPage">
      {/* HERO */}
      <section className="hero">
        <img
          className="heroImg"
          src="https://images.unsplash.com/photo-1600891964599-f61ba0e24092"
          alt="Comida"
          loading="lazy"
        />

        <div className="heroOverlay">
          <div className="heroInner">
            <div className="heroBrand">AmaCocina</div>
            <h1 className="heroTitle">Cocina casera, sin vueltas</h1>
            <p className="heroText">
              Armá tu pedido en minutos. Elegí cómo pagar y coordiná por WhatsApp.
            </p>

            <div className="heroActions">
              <button className="btn btnPrimary" onClick={handleScrollToMenu}>
                Ver menú
              </button>
              <a className="btn btnGhost" href="#menu" onClick={(e) => e.preventDefault()}>
                Recomendados
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* BLOQUE CONFIANZA */}
      <section className="trust">
        {[
          {
            title: "Pedido simple",
            desc: "Elegí platos, ajustá cantidades y confirmá en segundos.",
          },
          {
            title: "Pago flexible",
            desc: "Efectivo, transferencia por alias o el método que prefieras.",
          },
          {
            title: "Envío y retiro",
            desc: "Coordinamos por WhatsApp según tu zona y horarios.",
          },
        ].map((b) => (
          <div key={b.title} className="trustCard">
            <div className="trustTitle">{b.title}</div>
            <div className="trustDesc">{b.desc}</div>
          </div>
        ))}
      </section>

      {/* MENÚS EJECUTIVOS (placeholder) */}
      <MenusEjecutivosSection />

      {/* MENÚ */}
      <section id="menu" ref={menuRef} className="menuSection">
        <div className="menuTop">
          <div>
            <h2 className="menuTitle">Menú</h2>
            <div className="menuHint">Buscá por nombre o ingrediente</div>
          </div>

          <div className="searchWrap">
            <input
              className="searchInput"
              type="search"
              inputMode="search"
              enterKeyHint="search"
              placeholder="Buscar (milanesa, ensalada, empanadas...)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={(e) => {
                if (window.matchMedia("(max-width: 768px)").matches) {
                  setTimeout(() => e.target.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
                }
              }}
            />
            {query ? (
              <button className="searchClear" onClick={() => setQuery("")} aria-label="Limpiar">
                ✕
              </button>
            ) : null}
          </div>
        </div>

        {categories.length === 0 ? (
          <div className="emptySearch card">
            <div className="emptySearchTitle">No encontramos resultados</div>
            <div className="emptySearchText">Probá con otro término de búsqueda.</div>
          </div>
        ) : (
          categories.map((cat) => (
            <div key={cat} className="categoryBlock">
              <div className="categoryHeader">
                <h3 className="categoryTitle">{formatCategoryTitle(cat)}</h3>
                <span className="categoryCount">{byCategory[cat].length} productos</span>
              </div>

              <div className="productsGrid">
                {byCategory[cat].map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          ))
        )}

        {/* FOOTER */}
        <footer className="menuFooter">
          <div>
            <div className="footerBrand">AmaCocina</div>
            <div className="footerText">Pedidos por WhatsApp</div>
          </div>
        </footer>
      </section>
    </div>
  );
}