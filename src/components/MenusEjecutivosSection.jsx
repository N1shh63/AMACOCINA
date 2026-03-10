/**
 * Sección visual "Menús Ejecutivos" – solo placeholder.
 * Sin productos reales ni lógica de compra. Lista para reemplazar por contenido real después.
 */
export default function MenusEjecutivosSection() {
  const placeholders = [
    { id: 1, title: "Próximamente", text: "Menú ejecutivo del día para llevar o delivery." },
    { id: 2, title: "Próximamente", text: "Opciones variadas y listas en minutos." },
    { id: 3, title: "Próximamente", text: "Ideal para oficina o reuniones." },
  ];

  return (
    <section className="menusEjecutivosSection" aria-labelledby="menus-ejecutivos-title">
      <header className="menusEjecutivosHeader">
        <h2 id="menus-ejecutivos-title" className="menusEjecutivosTitle">
          Menús Ejecutivos
        </h2>
        <p className="menusEjecutivosSubtitle">
          Opciones completas para el mediodía. Próximamente en AmaCocina.
        </p>
      </header>

      <div className="menusEjecutivosGrid">
        {placeholders.map((item) => (
          <article key={item.id} className="menusEjecutivosCard">
            <div className="menusEjecutivosCardImage">
              <div className="menusEjecutivosCardImagePlaceholder" aria-hidden="true" />
            </div>
            <div className="menusEjecutivosCardBadge">Menú Ejecutivo</div>
            <div className="menusEjecutivosCardBody">
              <h3 className="menusEjecutivosCardTitle">{item.title}</h3>
              <p className="menusEjecutivosCardText">{item.text}</p>
              <button type="button" className="menusEjecutivosCardBtn" disabled>
                Próximamente
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
