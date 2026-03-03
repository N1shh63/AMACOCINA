import { useMemo, useRef, useState } from "react"
import { products } from "../data/products"
import ProductCard from "../components/ProductCard"

function formatCategoryTitle(cat) {
  if (!cat) return ""
  return cat
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ")
}

export default function Menu() {
  const [query, setQuery] = useState("")
  const menuRef = useRef(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) => {
      const hay = `${p.name} ${p.description || ""}`.toLowerCase()
      return hay.includes(q)
    })
  }, [query])

  const byCategory = useMemo(() => {
    const map = {}
    for (const p of filtered) {
      map[p.category] ??= []
      map[p.category].push(p)
    }
    return map
  }, [filtered])

  const handleScrollToMenu = () => {
    menuRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* HERO */}
      <section
        style={{
          position: "relative",
          height: 420,
          borderRadius: 16,
          overflow: "hidden",
          marginBottom: 22,
          marginTop: 20
        }}
      >
        <img
          src="https://images.unsplash.com/photo-1600891964599-f61ba0e24092"
          alt="Comida"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "brightness(0.62)"
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 18
          }}
        >
          <div style={{ textAlign: "center", color: "white", maxWidth: 680 }}>
            <h1 style={{ fontSize: 52, margin: 0, letterSpacing: 0.3 }}>
              AmaCocina
            </h1>

            <p style={{ fontSize: 18, marginTop: 10, marginBottom: 18, opacity: 0.92 }}>
              Cocina casera · Pedidos simples · Pago con Mercado Pago
            </p>

            <button
              style={{
                padding: "12px 28px",
                backgroundColor: "#E67E22",
                border: "1px solid rgba(230,126,34,0.55)",
                borderRadius: 12,
                fontSize: 15,
                cursor: "pointer",
                color: "#111",
                fontWeight: 800
              }}
              onClick={handleScrollToMenu}
            >
              Ver Menú
            </button>
          </div>
        </div>
      </section>

      {/* BLOQUE DE CONFIANZA */}
      <section style={{ padding: "0 20px", marginBottom: 18 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 12
          }}
        >
          {[
            {
              title: "Pedido simple",
              desc: "Armá tu pedido en 1 minuto y confirmá por WhatsApp."
            },
            {
              title: "Pago con Mercado Pago",
              desc: "Pagá online de forma segura y rápida desde tu celular."
            },
            {
              title: "Envíos y retiro",
              desc: "Coordiná entrega o retiro según tu zona y disponibilidad."
            }
          ].map((b) => (
            <div
              key={b.title}
              style={{
                borderRadius: 14,
                padding: 14,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.10)",
                boxShadow: "0 10px 30px rgba(0,0,0,0.18)"
              }}
            >
              <div style={{ fontWeight: 900, marginBottom: 6 }}>{b.title}</div>
              <div style={{ fontSize: 13, opacity: 0.8, lineHeight: "18px" }}>
                {b.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* MENÚ */}
      <div ref={menuRef} style={{ padding: "0 20px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
          <h2 style={{ margin: "8px 0 14px", fontSize: 22, fontWeight: 900 }}>
            Menú
          </h2>
          <span style={{ fontSize: 12, opacity: 0.7 }}>
            Buscá por nombre o ingrediente
          </span>
        </div>

        <input
          type="text"
          placeholder="Buscar (milanesa, ensalada, empanadas...)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "12px 12px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.04)",
            color: "white",
            outline: "none",
            marginBottom: 22
          }}
        />

        {Object.keys(byCategory).map((cat) => (
          <div key={cat} style={{ marginBottom: 42 }}>
            <h3
              style={{
                margin: "10px 0 18px",
                fontSize: 20,
                fontWeight: 900,
                letterSpacing: 0.2
              }}
            >
              {formatCategoryTitle(cat)}
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: 20
              }}
            >
              {byCategory[cat].map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        ))}

        {/* FOOTER */}
        <footer
          style={{
            marginTop: 10,
            padding: "26px 0 40px",
            borderTop: "1px solid rgba(255,255,255,0.10)",
            opacity: 0.8,
            fontSize: 12,
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap"
          }}
        >
          <div>
            <div style={{ fontWeight: 900, opacity: 1 }}>AmaCocina</div>
            <div style={{ marginTop: 6 }}>
              Pedidos por WhatsApp · Pago con Mercado Pago
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div>Horarios: (editar)</div>
            <div style={{ marginTop: 6 }}>Zona de envío: (editar)</div>
          </div>
        </footer>
      </div>
    </div>
  )
}