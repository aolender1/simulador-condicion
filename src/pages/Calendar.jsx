import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import esLocale from '@fullcalendar/core/locales/es'
import Calculadora from '../components/Calculadora'
import StudyPlan from '../components/StudyPlan'
import '../StudyPlan.css'

function Calendar() {
  const [events, setEvents] = useState([])
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark')
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [viewMode, setViewMode] = useState('calendar')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [completedEvents, setCompletedEvents] = useState(() => {
    const saved = localStorage.getItem('completedEvents')
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    document.body.className = isDark ? 'dark-theme' : ''
  }, [isDark])

  useEffect(() => {
    fetch('/api/events')
      .then(res => res.json())
      .then(data => {
        const formatted = data.map(e => ({
          id: e.id,
          title: e.title,
          start: e.start_date,
          end: e.end_date,
          backgroundColor: e.color,
          borderColor: e.color,
          extendedProps: {
            materia: e.materia,
            estado_alerta: e.estado_alerta
          }
        }))
        setEvents(formatted)
      })
      .catch(err => console.error('Error loading events:', err))
  }, [])

  const toggleTheme = () => {
    const newTheme = !isDark
    setIsDark(newTheme)
    localStorage.setItem('theme', newTheme ? 'dark' : 'light')
  }

  const handleEventClick = (info) => {
    const event = info.event
    setSelectedEvent({
      id: event.id,
      title: event.title,
      materia: event.extendedProps.materia,
      start: event.start,
      end: event.end,
      color: event.backgroundColor
    })
  }

  const toggleEventComplete = (eventId) => {
    const updated = completedEvents.includes(eventId)
      ? completedEvents.filter(id => id !== eventId)
      : [...completedEvents, eventId]
    setCompletedEvents(updated)
    localStorage.setItem('completedEvents', JSON.stringify(updated))
  }

  const formatDate = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  return (
    <div className="app-wrapper">
      <header>
        <button
          className="hamburger-btn"
          onClick={() => setMobileMenuOpen(prev => !prev)}
          aria-label="Abrir menú"
        >
          <span className={`hamburger-icon ${mobileMenuOpen ? 'open' : ''}`}>
            <span></span><span></span><span></span>
          </span>
        </button>
        <h1>Licenciatura en Analisis y Gestion de Datos - UNSL</h1>
        <div className="header-actions">
          <Link to="/login" className="admin-link">⚙️</Link>
          <button className="theme-btn" onClick={toggleTheme}>{isDark ? '☀️' : '🌙'}</button>
        </div>
      </header>

      <div className="main-layout">
        <aside className={`app-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <button
            className={`sidebar-btn ${viewMode === 'calendar' ? 'active' : ''}`}
            onClick={() => { setViewMode('calendar'); setMobileMenuOpen(false) }}
          >
            📅 Calendario de Eventos
          </button>
          <button
            className={`sidebar-btn ${viewMode === 'studyplan' ? 'active' : ''}`}
            onClick={() => { setViewMode('studyplan'); setMobileMenuOpen(false) }}
          >
            📚 Correlatividades
          </button>
          <button
            className={`sidebar-btn ${viewMode === 'calculadora' ? 'active' : ''}`}
            onClick={() => { setViewMode('calculadora'); setMobileMenuOpen(false) }}
          >
            🧮 Calculadora de Condición
          </button>
          <a
            href="https://www.unsl.edu.ar/carpeta/Calendario2026-3.jpg"
            target="_blank"
            rel="noopener noreferrer"
            className="sidebar-btn link-btn"
            onClick={() => setMobileMenuOpen(false)}
          >
            📆 Calendario Oficial 2026
          </a>
        </aside>

        <div className="app-content">
          {viewMode === 'calendar' && (
            <>
              <section className="calendar-section" style={{ padding: 0 }}>
                <div className="calendar-container">
                  <h3>Calendario de Eventos</h3>
                  <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
                    initialView={window.innerWidth < 640 ? 'listMonth' : 'dayGridMonth'}
                    locale={esLocale}
                    timeZone="local"
                    headerToolbar={{
                      left: 'prev,next',
                      center: 'title',
                      right: 'dayGridMonth,listMonth'
                    }}
                    buttonText={{
                      today: 'Hoy',
                      month: 'Mes',
                      week: 'Semana',
                      list: 'Agenda',
                      prev: '◀',
                      next: '▶'
                    }}

                    events={events}
                    eventClick={handleEventClick}
                    eventClassNames={(arg) =>
                      completedEvents.includes(arg.event.id) ? ['completed'] : []
                    }
                    eventContent={(arg) => {
                      const isMobile = window.innerWidth < 640
                      let time = '';
                      if (arg.event.start) {
                        time = new Date(arg.event.start).toLocaleTimeString('es-AR', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        });
                      }
                      // On mobile month view: show only the hour dot to avoid overflow
                      if (isMobile && arg.view.type === 'dayGridMonth') {
                        return (
                          <div style={{
                            backgroundColor: arg.event.backgroundColor,
                            color: 'white',
                            borderRadius: '3px',
                            padding: '1px 3px',
                            fontSize: '0.7em',
                            fontWeight: 'bold',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            width: '100%',
                            lineHeight: '1.4'
                          }}>
                            {time}
                          </div>
                        );
                      }
                      return (
                        <div className="fc-event-main-frame" style={{ backgroundColor: arg.event.backgroundColor, borderColor: arg.event.borderColor, color: 'white', padding: '2px 4px', borderRadius: '3px', width: '100%', overflow: 'hidden' }}>
                          {time && <div className="fc-event-time" style={{ fontWeight: 'bold', fontSize: '0.85em' }}>{time}</div>}
                          <div className="fc-event-title-container" style={{ marginTop: '2px' }}>
                            <div className="fc-event-title fc-sticky" style={{ fontSize: '0.9em', lineHeight: '1.3', whiteSpace: 'normal' }}>
                              <strong>{arg.event.extendedProps.materia}</strong>: {arg.event.title}
                            </div>
                          </div>
                        </div>
                      );
                    }}
                    height="auto"
                  />
                </div>
              </section>
            </>
          )}

          {viewMode === 'studyplan' && <StudyPlan />}

          {viewMode === 'calculadora' && <Calculadora />}
        </div>
      </div>

      {selectedEvent && (
        <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <span className="modal-close" onClick={() => setSelectedEvent(null)}>&times;</span>
            <h2 className="modal-materia" style={{ color: selectedEvent.color }}>
              {selectedEvent.materia}
            </h2>
            <p className="modal-title">{selectedEvent.title}</p>
            <div className="modal-details">
              <div className="modal-detail-item">
                <span className="modal-icon">📅</span>
                <div>
                  <strong>Fecha</strong>
                  <p>{formatDate(selectedEvent.start)}</p>
                </div>
              </div>
              <div className="modal-detail-item">
                <span className="modal-icon">🕐</span>
                <div>
                  <strong>Hora</strong>
                  <p>{formatTime(selectedEvent.start)} - {formatTime(selectedEvent.end)}</p>
                </div>
              </div>
            </div>
            <div className="modal-checkbox-container" onClick={() => toggleEventComplete(selectedEvent.id)}>
              <input
                type="checkbox"
                checked={completedEvents.includes(selectedEvent.id)}
                onChange={() => { }}
              />
              <label>Marcar como completado</label>
            </div>
          </div>
        </div>
      )}

      <footer>
        <p>
          Licenciatura en Analisis y Gestion de Datos -
          Desarrollado por <a href="https://github.com/aolender1" target="_blank" rel="noopener noreferrer">Alberto Olender</a>
        </p>
      </footer>
    </div>
  )
}

export default Calendar
