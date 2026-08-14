const OFFICIAL_CALENDAR_URL = 'https://www.unsl.edu.ar/carpeta/Calendario2026-3.jpg'

function CalendarioAcademico() {
  return (
    <section className="calendar-section" style={{ padding: 0 }}>
      <div className="calendar-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <h3>Calendario Académico Oficial</h3>
          <a
            href={OFFICIAL_CALENDAR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="calendario-action-btn"
          >
            Abrir a tamaño completo ↗
          </a>
        </div>
        <p style={{ marginBottom: '1.5rem', opacity: 0.7, fontSize: '0.9rem' }}>
          Calendario oficial publicado por la Universidad Nacional de San Luis.
        </p>
        <a href={OFFICIAL_CALENDAR_URL} target="_blank" rel="noopener noreferrer">
          <img
            src={OFFICIAL_CALENDAR_URL}
            alt="Calendario Académico Oficial UNSL 2026"
            style={{
              width: '100%',
              height: 'auto',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              display: 'block'
            }}
          />
        </a>
      </div>
    </section>
  )
}

export default CalendarioAcademico
