/**
 * Sección "Menús Ejecutivos" – placeholder listo para contenido real.
 * Estructura preparada para: precio, botón "Agregar al carrito", conexión con carrito.
 */
export default function MenusEjecutivosSection() {
  const placeholders = [
    {
      id: 1,
      title: "Menú Clásico",
      text: "Plato principal, guarnición y bebida. Ideal para el mediodía.",
      isFeatured: false,
    },
    {
      id: 2,
      title: "Menú Express",
      text: "Rápido y completo. Para cuando tenés poco tiempo.",
      isFeatured: true,
    },
    {
      id: 3,
      title: "Menú Completo",
      text: "Entrada, principal y postre. La opción más completa.",
      isFeatured: false,
    },
  ];

  return (
    <section className="menusEjecutivosSection" aria-labelledby="menus-ejecutivos-title">
      <header className="menusEjecutivosHeader">
        <h2 id="menus-ejecutivos-title" className="menusEjecutivosTitle">
          Menús Ejecutivos
        </h2>
        <p className="menusEjecutivosSubtitle">
          Almuerzos completos, rápidos y pensados para el mediodía.
        </p>
        <p className="menusEjecutivosSchedule" aria-label="Horario de disponibilidad">
          Disponible de 12:00 a 16:00
        </p>
      </header>

      <div className="menusEjecutivosGrid">
        {placeholders.map((item) => (
          <article
            key={item.id}
            className={`menusEjecutivosCard ${item.isFeatured ? "menusEjecutivosCard--featured" : ""}`}
          >
            <div className="menusEjecutivosCardImage">
              <div className="menusEjecutivosCardImagePlaceholder" aria-hidden="true">
                <span className="menusEjecutivosCardImageIcon" aria-hidden="true">🍽</span>
              </div>
            </div>
            <div className="menusEjecutivosCardBadges">
              <span className="menusEjecutivosCardBadge">Menú Ejecutivo</span>
              {item.isFeatured && (
                <span className="menusEjecutivosCardBadgePopular">Más elegido</span>
              )}
            </div>
            <div className="menusEjecutivosCardBody">
              <h3 className="menusEjecutivosCardTitle">{item.title}</h3>
              <p className="menusEjecutivosCardText">{item.text}</p>
              {/* Reservado para precio: <div className="menusEjecutivosCardPrice">...</div> */}
              <div className="menusEjecutivosCardActions">
                <button type="button" className="menusEjecutivosCardBtn" disabled>
                  Próximamente
                </button>
                {/* Futuro: botón "Agregar al carrito" */}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
